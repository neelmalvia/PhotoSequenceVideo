/**
 * @format
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  PixelRatio,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RecordingView } from 'react-native-view-recorder';

import type { RootScreenProps } from '@/app/navigation/types';
import { useSelectionStore } from '@/features/photo-selection/store/selectionStore';
import { createLibraryTarget } from '@/features/video-library/services/libraryRepository';
import { useLibraryStore } from '@/features/video-library/store/libraryStore';
import { AppHeader } from '@/shared/components/AppHeader';
import { Button } from '@/shared/components/Button';
import { Pill } from '@/shared/components/Pill';
import { toast } from '@/shared/feedback';
import { AudioLines, Clock, ImageIcon, X } from '@/shared/icons';
import { colors, radius, spacing } from '@/shared/theme';
import { DEFAULT_COMPOSITION_CONFIG } from '../config';
import { RenderSteps } from '../components/RenderSteps';
import { SlideStage } from '../components/SlideStage';
import { useVideoComposer } from '../hooks/useVideoComposer';

const config = DEFAULT_COMPOSITION_CONFIG;
const ASPECT = config.height / config.width;
const ENTER_FALLBACK_MS = 1000;
const OFFSCREEN_GAP = 100;

export function ComposeScreen({ navigation }: RootScreenProps<'Compose'>) {
  const photos = useSelectionStore(s => s.photos);
  const addToLibrary = useLibraryStore(s => s.add);
  const composer = useVideoComposer(photos, config);
  const { status, start, timeline } = composer;

  // The recording stage is config.width physical pixels wide, so the export
  // is never upscaled. It renders off-screen (see below).
  const { width: windowWidth } = useWindowDimensions();
  const stageWidth = Math.ceil(config.width / PixelRatio.get());
  const stageHeight = Math.round(stageWidth * ASPECT);
  // The visible mirror takes a bit under half the content width.
  const previewWidth = Math.round((windowWidth - spacing.md * 2) * 0.44);
  const previewHeight = Math.round(previewWidth * ASPECT);

  /** Renders into a new library slot, then records it in the library. */
  const renderIntoLibrary = useCallback(async () => {
    try {
      const target = await createLibraryTarget();
      const rendered = await start(target);
      if (!rendered) {
        return; // Cancelled, failed (shown on screen) or screen left.
      }
      await addToLibrary({
        id: target.id,
        videoFile: target.videoFile,
        thumbnailFile: rendered.thumbnailPath ? target.thumbnailFile : null,
        createdAt: Date.now(),
        durationMs: timeline.durationMs,
        photoCount: photos.length,
        width: config.width,
        height: config.height,
        savedToGallery: false,
        galleryUri: null,
        deletedAt: null,
      });
      navigation.replace('Preview', { videoId: target.id });
    } catch (e) {
      toast.error(
        'Could not save your video',
        e instanceof Error ? e.message : 'Please try again.',
      );
    }
  }, [start, addToLibrary, timeline.durationMs, photos.length, navigation]);

  // The recorder captures what is on screen, so wait until the push
  // animation has settled: capturing mid-transition blends in the previous
  // screen. The timer covers devices where the event never fires (e.g.
  // system animations turned off).
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const unsubscribe = navigation.addListener('transitionEnd', e => {
      if (!e.data.closing) {
        setEntered(true);
      }
    });
    const fallback = setTimeout(() => setEntered(true), ENTER_FALLBACK_MS);
    return () => {
      unsubscribe();
      clearTimeout(fallback);
    };
  }, [navigation]);

  // Start once every photo has decoded and the screen is fully on screen.
  useEffect(() => {
    if (status === 'ready' && entered) {
      renderIntoLibrary();
    }
  }, [status, entered, renderIntoLibrary]);

  useEffect(() => {
    if (status === 'cancelled') {
      navigation.goBack();
    }
  }, [status, navigation]);

  const seconds = (timeline.durationMs / 1000).toFixed(1);
  const failed = status === 'error';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <AppHeader title="Creating video" onBack={navigation.goBack} />

      {/*
        Recording surface, kept OFF-SCREEN at full resolution. Off-screen,
        the recorder draws the view itself (Android falls back from copying
        screen pixels to View.draw; iOS uses drawHierarchy), so the export is
        always 720 px sharp and nothing on screen (header, toasts, the
        navigation transition) can end up in the video. The user sees the
        smaller mirror below, driven by the same frames.
      */}
      <View
        pointerEvents="none"
        style={[
          styles.offscreen,
          { left: windowWidth + OFFSCREEN_GAP, width: stageWidth },
        ]}
      >
        <RecordingView
          sessionId={composer.sessionId}
          style={{ width: stageWidth, height: stageHeight }}
        >
          <SlideStage
            photos={photos}
            frame={composer.frame}
            frameIndex={composer.frameIndex}
            width={stageWidth}
            onFrameCommitted={composer.onFrameCommitted}
            onImagesSettled={composer.onImagesSettled}
          />
        </RecordingView>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View
            style={[
              styles.preview,
              { width: previewWidth, height: previewHeight },
            ]}
          >
            <SlideStage
              photos={photos}
              frame={composer.frame}
              frameIndex={composer.frameIndex}
              width={previewWidth}
            />
          </View>
          <View style={styles.heroText}>
            <Text style={styles.eyebrow}>Live preview</Text>
            <Text style={styles.title}>
              {failed ? 'Something went wrong' : 'Your video is on its way'}
            </Text>
            <View style={styles.pills}>
              <Pill icon={ImageIcon} label={`${photos.length} photos`} />
              <Pill icon={Clock} label={`${seconds}s`} />
              <Pill icon={AudioLines} label="Music" />
            </View>
          </View>
        </View>

        {failed ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>
              {composer.error ?? 'Rendering failed. Please try again.'}
            </Text>
          </View>
        ) : (
          <RenderSteps
            phase={composer.phase}
            progress={composer.progress}
            etaSeconds={composer.etaSeconds}
          />
        )}
      </ScrollView>

      <View style={styles.footer}>
        {failed ? (
          <>
            <Button title="Try again" onPress={renderIntoLibrary} />
            <Button
              title="Back"
              variant="secondary"
              onPress={navigation.goBack}
            />
          </>
        ) : (
          <Button
            title="Cancel"
            icon={X}
            variant="secondary"
            onPress={() =>
              status === 'rendering' ? composer.cancel() : navigation.goBack()
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  // Positioned past the right edge of the window (left is set inline).
  offscreen: { position: 'absolute', top: 0, backgroundColor: colors.black },
  scroll: { flex: 1 },
  content: { padding: spacing.md, paddingTop: spacing.lg, gap: spacing.lg },
  hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.md + 4 },
  // The visible preview is only a mirror, so it can be rounded and clipped.
  preview: {
    borderRadius: radius.lg - 4,
    overflow: 'hidden',
    backgroundColor: colors.black,
  },
  heroText: { flex: 1, gap: spacing.sm },
  eyebrow: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 32,
  },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm - 2 },
  errorCard: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  errorText: { color: colors.danger, fontSize: 15, textAlign: 'center' },
  footer: { padding: spacing.md, gap: spacing.sm },
});

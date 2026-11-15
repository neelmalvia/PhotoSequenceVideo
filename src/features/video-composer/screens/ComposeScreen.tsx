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

export function ComposeScreen({ navigation }: RootScreenProps<'Compose'>) {
  const photos = useSelectionStore(s => s.photos);
  const addToLibrary = useLibraryStore(s => s.add);
  const composer = useVideoComposer(photos, config);
  const { status, start, timeline } = composer;

  // The recorder copies the preview's on-screen pixels, so its size on
  // screen IS the video's resolution: make it exactly config.width physical
  // pixels wide (smaller would upscale and blur the export).
  const { width: windowWidth } = useWindowDimensions();
  const stageWidth = Math.min(
    Math.ceil(config.width / PixelRatio.get()),
    windowWidth - spacing.md * 2,
  );
  const stageHeight = Math.round(stageWidth * ASPECT);

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

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <AppHeader title="Creating video" onBack={navigation.goBack} />
      {/*
        The stage is the recording surface: the recorder copies these exact
        on-screen pixels. It must never scroll or sit under anything (the
        header, a toast), or that gets baked into the video. So it lives in
        a fixed area, and only the details below it can scroll.
      */}
      <View style={styles.stageArea}>
        <View
          style={[
            styles.stageFrame,
            { width: stageWidth, height: stageHeight },
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
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          <Text style={styles.title}>
            {status === 'error'
              ? 'Something went wrong'
              : 'Your video is on its way'}
          </Text>
          <View style={styles.pills}>
            <Pill icon={ImageIcon} label={`${photos.length} photos`} />
            <Pill icon={Clock} label={`${seconds}s`} />
            <Pill icon={AudioLines} label="Music" />
          </View>
        </View>

        {status === 'error' ? (
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
        {status === 'error' ? (
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
  // Top padding keeps the stage clear of toasts, which appear just below
  // the status bar and would otherwise be captured into the video.
  stageArea: { alignItems: 'center', paddingTop: spacing.lg + spacing.sm },
  scroll: { flex: 1 },
  content: {
    alignItems: 'center',
    padding: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.md - 4,
  },
  // No border radius or clipping here: on Android the recorder captures the
  // on-screen pixels, so a rounded clip would be baked into the video.
  stageFrame: { backgroundColor: colors.black },
  intro: { alignItems: 'center', gap: 6 },
  title: { color: colors.text, fontSize: 20, fontWeight: '700' },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  errorCard: {
    alignSelf: 'stretch',
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  errorText: { color: colors.danger, fontSize: 15, textAlign: 'center' },
  footer: { padding: spacing.md, gap: spacing.sm },
});

/**
 * Shown right after a render: the new video filling the screen, its details,
 * and save / share as the main actions. Delete lives in the header,
 * as on the library player. Library playback uses VideoPlayerScreen.
 *
 * @format
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  type LayoutRectangle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';

import type { RootScreenProps } from '@/app/navigation/types';
import { useSelectionStore } from '@/features/photo-selection/store/selectionStore';
import { libraryPath } from '@/features/video-library/services/libraryRepository';
import {
  selectVideoById,
  useLibraryStore,
} from '@/features/video-library/store/libraryStore';
import { formatDuration } from '@/features/video-library/utils/format';
import { AppHeader } from '@/shared/components/AppHeader';
import { Button } from '@/shared/components/Button';
import { HeaderButton } from '@/shared/components/HeaderButton';
import { Pill } from '@/shared/components/Pill';
import { VideoPlayer } from '@/shared/components/VideoPlayer';
import { CircleCheck, Download, Plus, Share2, Trash } from '@/shared/icons';
import { colors, spacing } from '@/shared/theme';
import { toFileUri } from '@/shared/utils/files';
import { useVideoActions } from '../hooks/useVideoActions';

/** RN's Share sends files only on iOS (Android would need react-native-share). */
const CAN_SHARE_FILES = Platform.OS === 'ios';

export function PreviewScreen({
  navigation,
  route,
}: RootScreenProps<'Preview'>) {
  const video = useLibraryStore(selectVideoById(route.params.videoId));
  const clearSelection = useSelectionStore(s => s.clear);

  const startOver = useCallback(() => {
    clearSelection();
    // Back to the Create tab with an empty selection.
    navigation.popTo('Tabs', { screen: 'Create' });
  }, [clearSelection, navigation]);

  const { save, share, confirmDelete, saving, deleting } = useVideoActions(
    video,
    { onDeleted: startOver },
  );

  // The space left between the header and the pills; the player fills it.
  const [stage, setStage] = useState<Pick<
    LayoutRectangle,
    'width' | 'height'
  > | null>(null);
  // Pause when another screen (e.g. fullscreen) is on top.
  const isFocused = useIsFocused();

  useEffect(() => {
    if (!video && !deleting) {
      navigation.goBack();
    }
  }, [video, deleting, navigation]);

  if (!video) {
    return null;
  }

  // Largest frame of the video's aspect ratio that fits the free space.
  const aspect =
    video.height && video.width ? video.height / video.width : 16 / 9;
  const player = stage
    ? {
        width: Math.floor(Math.min(stage.width, stage.height / aspect)),
        height: Math.floor(Math.min(stage.height, stage.width * aspect)),
      }
    : null;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <AppHeader
        title="Your video"
        onBack={navigation.goBack}
        right={
          <HeaderButton
            testID="preview-delete"
            icon={Trash}
            label="Delete video"
            tone="danger"
            onPress={confirmDelete}
            loading={deleting}
          />
        }
      />

      <View style={styles.content}>
        <View
          style={styles.stage}
          onLayout={e => {
            const { width, height } = e.nativeEvent.layout;
            setStage({ width, height });
          }}
        >
          {player ? (
            <VideoPlayer
              uri={toFileUri(libraryPath(video.videoFile))}
              width={player.width}
              height={player.height}
              active={isFocused}
              onFullscreen={() =>
                navigation.navigate('Player', { videoId: video.id })
              }
            />
          ) : null}
        </View>

        <View style={styles.pills}>
          <Pill label={formatDuration(video.durationMs)} />
          <Pill label={`${video.photoCount} photos`} />
          {video.width && video.height ? (
            <Pill label={`${video.width} × ${video.height}`} />
          ) : null}
          <Pill label="With music" />
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.saveHint}>
          {video.savedToGallery
            ? 'Saved in My videos and in your gallery.'
            : 'Saved in My videos. Save it to your gallery to share it anywhere.'}
        </Text>
        <View style={styles.row}>
          <Button
            testID="save-video"
            title={
              video.savedToGallery ? 'Saved to gallery' : 'Save to gallery'
            }
            icon={video.savedToGallery ? CircleCheck : Download}
            onPress={save}
            loading={saving}
            disabled={video.savedToGallery}
            style={styles.saveButton}
          />
          {CAN_SHARE_FILES && (
            <Button
              title="Share"
              icon={Share2}
              variant="secondary"
              onPress={share}
              style={styles.shareButton}
            />
          )}
        </View>
        <Button
          title="Create another video"
          icon={Plus}
          variant="ghost"
          onPress={startOver}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.md - 4,
  },
  // Takes all remaining height; the player is fitted inside it.
  stage: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  saveHint: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  footer: { padding: spacing.md, paddingTop: spacing.sm, gap: spacing.xs },
  row: { flexDirection: 'row', gap: spacing.sm },
  saveButton: { flex: 2 },
  shareButton: { flex: 1 },
});

/**
 * Fullscreen playback of a library video. Actions live in the header so the
 * video can use the whole screen below it.
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, View, type LayoutRectangle } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { RootScreenProps } from '@/app/navigation/types';
import { useVideoActions } from '@/features/video-export/hooks/useVideoActions';
import { AppHeader } from '@/shared/components/AppHeader';
import { HeaderButton } from '@/shared/components/HeaderButton';
import { VideoPlayer } from '@/shared/components/VideoPlayer';
import { CircleCheck, Download, Share2, Trash } from '@/shared/icons';
import { colors } from '@/shared/theme';
import { toFileUri } from '@/shared/utils/files';
import { libraryPath } from '../services/libraryRepository';
import { selectVideoById, useLibraryStore } from '../store/libraryStore';
import { formatCreatedAt } from '../utils/format';

export function VideoPlayerScreen({
  navigation,
  route,
}: RootScreenProps<'Player'>) {
  const video = useLibraryStore(selectVideoById(route.params.videoId));
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const { save, share, confirmDelete, saving, deleting } = useVideoActions(
    video,
    { onDeleted: navigation.goBack },
  );
  const [size, setSize] = useState<Pick<
    LayoutRectangle,
    'width' | 'height'
  > | null>(null);

  // The entry can disappear (deleted elsewhere, file removed by the OS).
  useEffect(() => {
    if (!video && !deleting) {
      navigation.goBack();
    }
  }, [video, deleting, navigation]);

  return (
    <View style={styles.container}>
      <AppHeader
        title={video ? formatCreatedAt(video.createdAt) : ''}
        onBack={navigation.goBack}
        backgroundColor={colors.black}
        right={
          video ? (
            <PlayerHeaderActions
              saved={video.savedToGallery}
              saving={saving}
              deleting={deleting}
              onShare={share}
              onSave={save}
              onDelete={confirmDelete}
            />
          ) : null
        }
      />
      <View
        style={styles.stage}
        onLayout={e => {
          const { width, height } = e.nativeEvent.layout;
          setSize({ width, height });
        }}
      >
        {video && size && (
          <VideoPlayer
            uri={toFileUri(libraryPath(video.videoFile))}
            width={size.width}
            height={size.height}
            active={isFocused}
            rounded={false}
            // Keep the controls above the home indicator / gesture bar.
            bottomInset={insets.bottom}
          />
        )}
      </View>
    </View>
  );
}

interface PlayerHeaderActionsProps {
  saved: boolean;
  saving: boolean;
  deleting: boolean;
  onShare: () => void;
  onSave: () => void;
  onDelete: () => void;
}

function PlayerHeaderActions({
  saved,
  saving,
  deleting,
  onShare,
  onSave,
  onDelete,
}: PlayerHeaderActionsProps) {
  return (
    <View style={styles.headerActions}>
      {Platform.OS === 'ios' && (
        <HeaderButton icon={Share2} label="Share" onPress={onShare} />
      )}
      <HeaderButton
        testID="player-save"
        icon={saved ? CircleCheck : Download}
        label={saved ? 'Saved to gallery' : 'Save to gallery'}
        tone={saved ? 'success' : 'default'}
        onPress={onSave}
        loading={saving}
        disabled={saved}
      />
      <HeaderButton
        testID="player-delete"
        icon={Trash}
        label="Delete"
        tone="danger"
        onPress={onDelete}
        loading={deleting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  stage: { flex: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});

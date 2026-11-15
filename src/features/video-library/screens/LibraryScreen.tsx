/**
 * @format
 */

import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import type { TabScreenProps } from '@/app/navigation/types';
import { AppHeader } from '@/shared/components/AppHeader';
import { Button } from '@/shared/components/Button';
import { Clapperboard, Film, ICON_SIZE } from '@/shared/icons';
import { colors, spacing, typography } from '@/shared/theme';
import { VideoCard } from '../components/VideoCard';
import { selectVisibleVideos, useLibraryStore } from '../store/libraryStore';
import type { LibraryVideo } from '../types';

const COLUMNS = 2;

export function LibraryScreen({ navigation }: TabScreenProps<'Library'>) {
  // useShallow: the selector builds a new array, so compare by contents.
  const videos = useLibraryStore(useShallow(selectVisibleVideos));
  const status = useLibraryStore(s => s.status);
  const load = useLibraryStore(s => s.load);

  const { width } = useWindowDimensions();
  const cardWidth = (width - spacing.md * 2 - spacing.md) / COLUMNS;

  const openVideo = useCallback(
    (video: LibraryVideo) =>
      navigation.navigate('Player', { videoId: video.id }),
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: LibraryVideo }) => (
      <VideoCard video={item} width={cardWidth} onPress={openVideo} />
    ),
    [cardWidth, openVideo],
  );

  // A tab root: no back button.
  const header = <AppHeader title="My videos" />;

  if (status === 'loading' && videos.length === 0) {
    return (
      <View style={styles.container}>
        {header}
        <View style={styles.center}>
          <ActivityIndicator color={colors.text} />
        </View>
      </View>
    );
  }

  return (
    // Bottom inset is handled by the tab bar.
    <View style={styles.container}>
      {header}
      <FlatList
        data={videos}
        keyExtractor={v => v.id}
        renderItem={renderItem}
        numColumns={COLUMNS}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        onRefresh={load}
        refreshing={status === 'loading'}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Film color={colors.textMuted} size={ICON_SIZE.xl} />
            <Text style={[typography.body, styles.emptyTitle]}>
              No videos yet
            </Text>
            <Text style={[typography.subtitle, styles.emptyHint]}>
              Videos you create are kept here so you can watch, save or share
              them later.
            </Text>
            <Button
              title="Create a video"
              icon={Clapperboard}
              onPress={() => navigation.navigate('Create')}
              style={styles.emptyButton}
            />
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: spacing.md, flexGrow: 1 },
  row: { gap: spacing.md, marginBottom: spacing.lg },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: { marginTop: spacing.md },
  emptyHint: { textAlign: 'center', marginTop: spacing.sm },
  emptyButton: { marginTop: spacing.lg, alignSelf: 'stretch' },
});

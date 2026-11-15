/**
 * @format
 */

import React, { memo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { CircleCheck, ICON_SIZE, Play } from '@/shared/icons';
import { colors, radius, spacing, typography } from '@/shared/theme';
import { toFileUri } from '@/shared/utils/files';
import { libraryPath } from '../services/libraryRepository';
import type { LibraryVideo } from '../types';
import { formatCreatedAt, formatDuration } from '../utils/format';

interface VideoCardProps {
  video: LibraryVideo;
  width: number;
  onPress: (video: LibraryVideo) => void;
}

export const VideoCard = memo(function VideoCardView({
  video,
  width,
  onPress,
}: VideoCardProps) {
  const height = Math.round(width * (16 / 9));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Video from ${formatCreatedAt(
        video.createdAt,
      )}, ${formatDuration(video.durationMs)}`}
      onPress={() => onPress(video)}
      style={({ pressed }) => [{ width }, pressed && styles.pressed]}
    >
      <View style={[styles.thumb, { height }]}>
        {video.thumbnailFile ? (
          <Image
            source={{ uri: toFileUri(libraryPath(video.thumbnailFile)) }}
            style={styles.image}
            resizeMode="cover"
            // Android fades images in by default, which flashes the card
            // background on every tab switch.
            fadeDuration={0}
          />
        ) : (
          <View style={styles.placeholder}>
            <Play color={colors.textMuted} size={ICON_SIZE.xl} />
          </View>
        )}
        <View style={styles.duration}>
          <Play color={colors.text} fill={colors.text} size={10} />
          <Text style={styles.durationText}>
            {formatDuration(video.durationMs)}
          </Text>
        </View>
        {video.savedToGallery && (
          <View style={styles.saved}>
            <CircleCheck color={colors.onPrimary} size={12} strokeWidth={2.5} />
            <Text style={styles.savedText}>Saved</Text>
          </View>
        )}
      </View>
      <Text style={[typography.caption, styles.caption]} numberOfLines={1}>
        {formatCreatedAt(video.createdAt)} · {video.photoCount} photos
      </Text>
    </Pressable>
  );
});

const badge = {
  position: 'absolute',
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
  borderRadius: radius.sm,
  paddingHorizontal: 6,
  paddingVertical: 2,
} as const;

const styles = StyleSheet.create({
  pressed: { opacity: 0.75 },
  thumb: {
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  image: { width: '100%', height: '100%' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  duration: {
    ...badge,
    right: spacing.xs,
    bottom: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  durationText: { color: colors.text, fontSize: 12, fontWeight: '600' },
  saved: {
    ...badge,
    left: spacing.xs,
    top: spacing.xs,
    backgroundColor: colors.primary,
  },
  savedText: { color: colors.onPrimary, fontSize: 11, fontWeight: '700' },
  caption: { marginTop: spacing.xs },
});

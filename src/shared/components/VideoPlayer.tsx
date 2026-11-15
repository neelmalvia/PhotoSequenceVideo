/**
 * Video player with a minimal control set: play/pause, a seekable progress
 * bar with the timestamp, and an optional fullscreen button.
 *
 * react-native-video's native Android controls ignore controlsStyles (the
 * flags are parsed but never applied in 6.x), so its controls are turned off
 * and these are drawn on top instead. Tap the video to show or hide them;
 * they fade out on their own while playing.
 *
 * @format
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import Video, {
  type OnLoadData,
  type OnProgressData,
  type VideoRef,
} from 'react-native-video';

import { ICON_SIZE, Maximize, Pause, Play } from '@/shared/icons';
import { colors, radius, spacing } from '@/shared/theme';
import { formatClock } from '@/shared/utils/time';
import { SeekBar } from './SeekBar';

const AUTO_HIDE_MS = 2500;
const FADE_MS = 200;

interface VideoPlayerProps {
  uri: string;
  width: number;
  height: number;
  /** Shows a fullscreen button that calls this. */
  onFullscreen?: () => void;
  /** Pauses playback when false (e.g. the screen is not focused). */
  active?: boolean;
  /** Rounded card corners; turn off for edge-to-edge playback. */
  rounded?: boolean;
  /** Extra space under the controls, e.g. the home-indicator inset. */
  bottomInset?: number;
}

export function VideoPlayer({
  uri,
  width,
  height,
  onFullscreen,
  active = true,
  rounded = true,
  bottomInset = 0,
}: VideoPlayerProps) {
  const [paused, setPaused] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [controlsShown, setControlsShown] = useState(true);
  /** Set while the user drags the progress bar. */
  const [scrubbing, setScrubbing] = useState(false);
  const videoRef = useRef<VideoRef>(null);
  const opacity = useRef(new Animated.Value(1)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isPlaying = active && !paused;

  const fadeTo = useCallback(
    (shown: boolean) => {
      setControlsShown(shown);
      Animated.timing(opacity, {
        toValue: shown ? 1 : 0,
        duration: FADE_MS,
        useNativeDriver: true,
      }).start();
    },
    [opacity],
  );

  // Auto-hide while playing; stay visible while paused.
  useEffect(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
    }
    if (isPlaying && controlsShown && !scrubbing) {
      hideTimer.current = setTimeout(() => fadeTo(false), AUTO_HIDE_MS);
    }
    return () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }
    };
  }, [isPlaying, controlsShown, scrubbing, fadeTo]);

  const togglePlay = useCallback(() => {
    setPaused(p => !p);
    fadeTo(true);
  }, [fadeTo]);

  const onLoad = useCallback((e: OnLoadData) => setDuration(e.duration), []);
  const onProgress = useCallback(
    (e: OnProgressData) => {
      // Don't let playback updates fight the finger while scrubbing.
      if (!scrubbing) {
        setPosition(e.currentTime);
      }
    },
    [scrubbing],
  );

  const seekTo = useCallback((seconds: number) => {
    videoRef.current?.seek(seconds);
    setPosition(seconds);
    setScrubbing(false);
  }, []);

  return (
    <View style={[styles.frame, rounded && styles.rounded, { width, height }]}>
      <Video
        ref={videoRef}
        source={{ uri }}
        // Explicit size: under the Fabric interop layer an absolutely filled
        // legacy view can leave the iOS player layer at zero size.
        style={{ width, height }}
        resizeMode="contain"
        paused={!isPlaying}
        repeat
        controls={false}
        progressUpdateInterval={250}
        onLoad={onLoad}
        onProgress={onProgress}
      />

      {/* Full-size tap target to show/hide the controls. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={controlsShown ? 'Hide controls' : 'Show controls'}
        style={StyleSheet.absoluteFill}
        onPress={() => fadeTo(!controlsShown)}
      />

      <Animated.View
        style={[StyleSheet.absoluteFill, styles.overlay, { opacity }]}
        pointerEvents={controlsShown ? 'box-none' : 'none'}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
          onPress={togglePlay}
          style={({ pressed }) => [
            styles.playButton,
            pressed && styles.pressed,
          ]}
        >
          {isPlaying ? (
            <Pause color={colors.black} fill={colors.black} size={26} />
          ) : (
            <Play color={colors.black} fill={colors.black} size={26} />
          )}
        </Pressable>

        <View
          style={[
            styles.bottomBar,
            { paddingBottom: spacing.sm + bottomInset },
          ]}
          pointerEvents="box-none"
        >
          <Text style={styles.time}>{formatClock(position)}</Text>
          <SeekBar
            position={position}
            duration={duration}
            onScrubStart={() => setScrubbing(true)}
            onScrub={setPosition}
            onSeek={seekTo}
          />
          <Text style={styles.time}>{formatClock(duration, 'up')}</Text>
          {onFullscreen ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fullscreen"
              hitSlop={8}
              onPress={onFullscreen}
              style={({ pressed }) => [
                styles.iconButton,
                pressed && styles.pressed,
              ]}
            >
              <Maximize color={colors.text} size={ICON_SIZE.md} />
            </Pressable>
          ) : null}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden', backgroundColor: colors.black },
  rounded: { borderRadius: radius.lg },
  overlay: { alignItems: 'center', justifyContent: 'center' },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  time: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
});

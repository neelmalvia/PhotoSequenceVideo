/**
 * Playback progress bar. Tap anywhere to jump there, or drag to scrub.
 *
 * @format
 */

import React, { useCallback, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from 'react-native';

import { colors, radius } from '@/shared/theme';

interface SeekBarProps {
  /** Current position in seconds. */
  position: number;
  /** Total duration in seconds; the bar is inert until it is known. */
  duration: number;
  /** Called continuously while dragging, with the time under the finger. */
  onScrub?: (seconds: number) => void;
  /** Called once when the finger lifts, with the time to seek to. */
  onSeek: (seconds: number) => void;
  onScrubStart?: () => void;
}

const TRACK_HEIGHT = 4;
const THUMB = 14;
/** Tall enough to hit comfortably, though the visible track is thin. */
const TOUCH_HEIGHT = 32;

export function SeekBar({
  position,
  duration,
  onScrub,
  onSeek,
  onScrubStart,
}: SeekBarProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const [scrubRatio, setScrubRatio] = useState<number | null>(null);
  const ratioRef = useRef(0);

  const ready = duration > 0 && trackWidth > 0;
  const ratio =
    scrubRatio ?? (duration > 0 ? Math.min(1, position / duration) : 0);

  const ratioAt = useCallback(
    (e: GestureResponderEvent) =>
      Math.min(1, Math.max(0, e.nativeEvent.locationX / trackWidth)),
    [trackWidth],
  );

  const update = useCallback(
    (e: GestureResponderEvent) => {
      const next = ratioAt(e);
      ratioRef.current = next;
      setScrubRatio(next);
      onScrub?.(next * duration);
    },
    [ratioAt, onScrub, duration],
  );

  const onLayout = (e: LayoutChangeEvent) =>
    setTrackWidth(e.nativeEvent.layout.width);

  return (
    <View
      style={styles.touchArea}
      onLayout={onLayout}
      accessibilityRole="adjustable"
      accessibilityLabel="Playback position"
      accessibilityValue={{
        min: 0,
        max: Math.round(duration),
        now: Math.round(ratio * duration),
      }}
      onStartShouldSetResponder={() => ready}
      onMoveShouldSetResponder={() => ready}
      // Keep the gesture once it starts, even if the finger drifts.
      onResponderTerminationRequest={() => false}
      onResponderGrant={e => {
        onScrubStart?.();
        update(e);
      }}
      onResponderMove={update}
      onResponderRelease={() => {
        onSeek(ratioRef.current * duration);
        setScrubRatio(null);
      }}
      onResponderTerminate={() => setScrubRatio(null)}
    >
      {/* Children ignore touches so locationX is always relative to the bar. */}
      <View style={styles.track} pointerEvents="none">
        <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
      </View>
      <View
        pointerEvents="none"
        style={[
          styles.thumb,
          { left: ratio * trackWidth - THUMB / 2 },
          scrubRatio !== null && styles.thumbActive,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  touchArea: { flex: 1, height: TOUCH_HEIGHT, justifyContent: 'center' },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: colors.primary },
  thumb: {
    position: 'absolute',
    top: (TOUCH_HEIGHT - THUMB) / 2,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: colors.text,
  },
  thumbActive: { transform: [{ scale: 1.3 }] },
});

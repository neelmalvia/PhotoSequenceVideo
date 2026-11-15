/**
 * Draws one frame of the video. Every photo stays mounted for the whole
 * render and only its style changes, so images decode once and never flash.
 *
 * @format
 */

import React, { memo, useCallback, useLayoutEffect, useRef } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import type { Photo } from '@/shared/types/media';
import { colors } from '@/shared/theme';
import type { FrameState } from '../engine/timeline';

interface SlideStageProps {
  photos: Photo[];
  frame: FrameState;
  frameIndex: number;
  /** Width of the stage in layout points, used to turn translateX fractions into points. */
  width: number;
  /** Fires after React commits a frame, so the recorder knows it's safe to capture. */
  onFrameCommitted?: (frameIndex: number) => void;
  /** Fires once when every photo has finished loading (or failed to). */
  onImagesSettled?: (failedCount: number) => void;
}

export function SlideStage({
  photos,
  frame,
  frameIndex,
  width,
  onFrameCommitted,
  onImagesSettled,
}: SlideStageProps) {
  useLayoutEffect(() => {
    onFrameCommitted?.(frameIndex);
  }, [frameIndex, onFrameCommitted]);

  const settled = useRef(new Map<string, boolean>());
  const reported = useRef(false);

  const handleSettled = useCallback(
    (id: string, ok: boolean) => {
      settled.current.set(id, ok);
      if (!reported.current && settled.current.size >= photos.length) {
        reported.current = true;
        const failed = [...settled.current.values()].filter(v => !v).length;
        onImagesSettled?.(failed);
      }
    },
    [photos.length, onImagesSettled],
  );

  return (
    <View collapsable={false} style={styles.stage}>
      {photos.map((photo, index) => {
        const layer = frame.layers.find(l => l.photoIndex === index);
        return (
          <StagePhoto
            key={photo.id}
            photo={photo}
            opacity={layer?.opacity ?? 0}
            translateX={(layer?.translateX ?? 0) * width}
            scale={layer?.scale ?? 1}
            zIndex={layer?.zIndex ?? 0}
            onSettled={handleSettled}
          />
        );
      })}
      <View
        pointerEvents="none"
        style={[styles.fade, { opacity: frame.fadeOpacity }]}
      />
    </View>
  );
}

interface StagePhotoProps {
  photo: Photo;
  opacity: number;
  translateX: number;
  scale: number;
  zIndex: number;
  onSettled: (id: string, ok: boolean) => void;
}

const StagePhoto = memo(function StagePhotoView({
  photo,
  opacity,
  translateX,
  scale,
  zIndex,
  onSettled,
}: StagePhotoProps) {
  return (
    <View
      // Never let Fabric flatten this view. At some frames its style is a
      // no-op (opacity 1, identity transform), and flattening it while zIndex
      // reorders siblings crashes the Android mounting layer.
      collapsable={false}
      style={[
        StyleSheet.absoluteFill,
        { opacity, zIndex, transform: [{ translateX }, { scale }] },
      ]}
    >
      {/* Blurred copy fills the frame so photos of any aspect ratio look intentional. */}
      <Image
        source={{ uri: photo.uri }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        blurRadius={24}
      />
      <View style={styles.dim} />
      <Image
        source={{ uri: photo.uri }}
        style={StyleSheet.absoluteFill}
        resizeMode="contain"
        onLoad={() => onSettled(photo.id, true)}
        onError={() => onSettled(photo.id, false)}
      />
    </View>
  );
});

const FILL = {
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
} as const;

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    backgroundColor: colors.black,
    overflow: 'hidden',
  },
  dim: {
    ...FILL,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  fade: {
    ...FILL,
    backgroundColor: colors.black,
    zIndex: 10,
  },
});

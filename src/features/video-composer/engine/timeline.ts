/**
 * Pure timeline math: given a photo count and a config, describe what every
 * frame of the video looks like. No React or native code lives here, so the
 * same model can drive the on-screen renderer, tests, or a future renderer.
 *
 * Layout for N photos (H = hold, T = transition):
 *   | photo 0 (H) | 0 -> 1 (T) | photo 1 (H) | 1 -> 2 (T) | ... | photo N-1 (H) |
 *
 * @format
 */

import type { CompositionConfig } from '../config';
import { clamp, easeInOutCubic, lerp } from './easing';
import { TRANSITIONS, type TransitionId } from './transitions';

export interface FrameLayer {
  photoIndex: number;
  opacity: number;
  /** Fraction of frame width. */
  translateX: number;
  scale: number;
  zIndex: number;
}

export interface FrameState {
  layers: FrameLayer[];
  /** Opacity of the black overlay used for the intro and outro fades. */
  fadeOpacity: number;
}

export interface Timeline {
  photoCount: number;
  durationMs: number;
  totalFrames: number;
  fps: number;
  stateAtTime(timeMs: number): FrameState;
  stateAtFrame(frameIndex: number): FrameState;
}

export function computeDurationMs(
  photoCount: number,
  { holdMs, transitionMs }: Pick<CompositionConfig, 'holdMs' | 'transitionMs'>,
): number {
  if (photoCount < 1) {
    return 0;
  }
  return photoCount * holdMs + (photoCount - 1) * transitionMs;
}

export function transitionFor(
  index: number,
  transitions: readonly TransitionId[],
): TransitionId {
  return transitions[index % transitions.length];
}

export function createTimeline(
  photoCount: number,
  config: CompositionConfig,
): Timeline {
  if (!Number.isInteger(photoCount) || photoCount < 1) {
    throw new Error(`photoCount must be a positive integer, got ${photoCount}`);
  }
  if (config.transitions.length === 0) {
    throw new Error('config.transitions must not be empty');
  }

  const { holdMs, transitionMs, fps } = config;
  const slotMs = holdMs + transitionMs;
  const durationMs = computeDurationMs(photoCount, config);
  const totalFrames = Math.round((durationMs / 1000) * fps);

  /** Photo i is visible from the start of its incoming transition to the end of its outgoing one. */
  const visibleWindow = (i: number): [number, number] => {
    const start = i === 0 ? 0 : i * slotMs - transitionMs;
    const end = i === photoCount - 1 ? durationMs : i * slotMs + slotMs;
    return [start, end];
  };

  const kenBurnsScale = (i: number, timeMs: number): number => {
    const [start, end] = visibleWindow(i);
    const t = clamp((timeMs - start) / (end - start));
    // Alternate zoom in and zoom out so consecutive photos don't feel identical.
    return i % 2 === 0
      ? lerp(1, config.kenBurnsScale, t)
      : lerp(config.kenBurnsScale, 1, t);
  };

  const fadeOpacity = (timeMs: number): number => {
    if (config.introFadeMs > 0 && timeMs < config.introFadeMs) {
      return 1 - timeMs / config.introFadeMs;
    }
    const outroStart = durationMs - config.outroFadeMs;
    if (config.outroFadeMs > 0 && timeMs > outroStart) {
      return clamp((timeMs - outroStart) / config.outroFadeMs);
    }
    return 0;
  };

  const stateAtTime = (rawTimeMs: number): FrameState => {
    const timeMs = clamp(rawTimeMs, 0, durationMs);
    const index = Math.min(Math.floor(timeMs / slotMs), photoCount - 1);
    const local = timeMs - index * slotMs;
    const inTransition = index < photoCount - 1 && local > holdMs;

    if (!inTransition) {
      return {
        layers: [
          {
            photoIndex: index,
            opacity: 1,
            translateX: 0,
            scale: kenBurnsScale(index, timeMs),
            zIndex: 0,
          },
        ],
        fadeOpacity: fadeOpacity(timeMs),
      };
    }

    const progress = easeInOutCubic(clamp((local - holdMs) / transitionMs));
    const kind = transitionFor(index, config.transitions);
    const { outgoing, incoming } = TRANSITIONS[kind](progress);

    return {
      layers: [
        {
          photoIndex: index,
          ...outgoing,
          scale: kenBurnsScale(index, timeMs),
          zIndex: 0,
        },
        {
          photoIndex: index + 1,
          ...incoming,
          scale: kenBurnsScale(index + 1, timeMs),
          zIndex: 1,
        },
      ],
      fadeOpacity: fadeOpacity(timeMs),
    };
  };

  return {
    photoCount,
    durationMs,
    totalFrames,
    fps,
    stateAtTime,
    stateAtFrame: frameIndex => stateAtTime((frameIndex * 1000) / fps),
  };
}

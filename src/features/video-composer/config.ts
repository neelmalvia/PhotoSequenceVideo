/**
 * @format
 */

import type { TransitionId } from './engine/transitions';

export interface CompositionConfig {
  /** Output size in pixels. Keep both multiples of 16 for hardware encoders. */
  width: number;
  height: number;
  fps: number;
  /** How long each photo stays on screen between transitions. */
  holdMs: number;
  transitionMs: number;
  /** Fade from black at the start and to black at the end. */
  introFadeMs: number;
  outroFadeMs: number;
  /** Cycled in order: photo 1 -> 2 uses the first, 2 -> 3 the second, ... */
  transitions: readonly TransitionId[];
  /** Slow zoom on each photo (Ken Burns). 1 disables it. */
  kenBurnsScale: number;
}

export const DEFAULT_COMPOSITION_CONFIG: CompositionConfig = {
  width: 720,
  height: 1280,
  fps: 30,
  holdMs: 2500,
  transitionMs: 1000,
  introFadeMs: 500,
  outroFadeMs: 800,
  transitions: ['dissolve', 'slide'],
  kenBurnsScale: 1.08,
};

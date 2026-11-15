/**
 * Transition registry. Each transition maps eased progress (0 to 1) to the
 * visual state of the outgoing and incoming photo. Adding a new transition
 * means adding one entry here; the timeline and renderer pick it up by id.
 *
 * @format
 */

export interface LayerVisual {
  opacity: number;
  /** Horizontal offset as a fraction of the frame width (1 = one full width). */
  translateX: number;
}

export interface TransitionFrame {
  outgoing: LayerVisual;
  incoming: LayerVisual;
}

export type TransitionFn = (progress: number) => TransitionFrame;

const dissolve: TransitionFn = progress => ({
  outgoing: { opacity: 1, translateX: 0 },
  incoming: { opacity: progress, translateX: 0 },
});

const slide: TransitionFn = progress => ({
  outgoing: { opacity: 1, translateX: -progress },
  incoming: { opacity: 1, translateX: 1 - progress },
});

export const TRANSITIONS = {
  dissolve,
  slide,
} as const satisfies Record<string, TransitionFn>;

export type TransitionId = keyof typeof TRANSITIONS;

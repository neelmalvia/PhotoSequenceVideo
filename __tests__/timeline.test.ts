/**
 * @format
 */

import {
  DEFAULT_COMPOSITION_CONFIG,
  type CompositionConfig,
} from '@/features/video-composer/config';
import {
  computeDurationMs,
  createTimeline,
  transitionFor,
} from '@/features/video-composer/engine/timeline';

const config: CompositionConfig = {
  ...DEFAULT_COMPOSITION_CONFIG,
  holdMs: 2000,
  transitionMs: 1000,
  fps: 30,
  introFadeMs: 0,
  outroFadeMs: 0,
  kenBurnsScale: 1,
};

describe('computeDurationMs', () => {
  it('adds holds and the transitions between them', () => {
    expect(computeDurationMs(3, config)).toBe(3 * 2000 + 2 * 1000);
    expect(computeDurationMs(5, config)).toBe(5 * 2000 + 4 * 1000);
    expect(computeDurationMs(0, config)).toBe(0);
  });
});

describe('createTimeline', () => {
  it('derives the frame count from duration and fps', () => {
    const timeline = createTimeline(3, config);
    expect(timeline.durationMs).toBe(8000);
    expect(timeline.totalFrames).toBe(240);
  });

  it('rejects invalid photo counts', () => {
    expect(() => createTimeline(0, config)).toThrow();
    expect(() => createTimeline(2.5, config)).toThrow();
  });

  it('shows a single fully visible photo during a hold', () => {
    const { layers } = createTimeline(3, config).stateAtTime(1000);
    expect(layers).toHaveLength(1);
    expect(layers[0]).toMatchObject({
      photoIndex: 0,
      opacity: 1,
      translateX: 0,
    });
  });

  it('dissolves the first pair: incoming fades in over the outgoing photo', () => {
    const timeline = createTimeline(3, config);
    const mid = timeline.stateAtTime(2500).layers;
    expect(mid.map(l => l.photoIndex)).toEqual([0, 1]);
    expect(mid[0].opacity).toBe(1);
    expect(mid[1].opacity).toBeCloseTo(0.5);
    expect(mid[1].zIndex).toBeGreaterThan(mid[0].zIndex);
  });

  it('slides the second pair: outgoing leaves left, incoming enters from right', () => {
    const timeline = createTimeline(3, config);
    // Transition 1 -> 2 runs from 5000 to 6000 ms.
    const mid = timeline.stateAtTime(5500).layers;
    expect(mid.map(l => l.photoIndex)).toEqual([1, 2]);
    expect(mid[0].translateX).toBeCloseTo(-0.5);
    expect(mid[1].translateX).toBeCloseTo(0.5);
    expect(mid.every(l => l.opacity === 1)).toBe(true);
  });

  it('ends the transition exactly on the next photo', () => {
    const timeline = createTimeline(3, config);
    const end = timeline.stateAtTime(2999.999).layers;
    expect(end[1].opacity).toBeCloseTo(1, 3);
    const after = timeline.stateAtTime(3000).layers;
    expect(after).toEqual([expect.objectContaining({ photoIndex: 1 })]);
  });

  it('holds the last photo to the end with no trailing transition', () => {
    const timeline = createTimeline(3, config);
    const last = timeline.stateAtFrame(timeline.totalFrames - 1).layers;
    expect(last).toHaveLength(1);
    expect(last[0].photoIndex).toBe(2);
  });

  it('clamps times outside the video', () => {
    const timeline = createTimeline(3, config);
    expect(timeline.stateAtTime(-500).layers[0].photoIndex).toBe(0);
    expect(timeline.stateAtTime(99999).layers[0].photoIndex).toBe(2);
  });

  it('fades in from and out to black', () => {
    const timeline = createTimeline(3, {
      ...config,
      introFadeMs: 500,
      outroFadeMs: 500,
    });
    expect(timeline.stateAtTime(0).fadeOpacity).toBe(1);
    expect(timeline.stateAtTime(250).fadeOpacity).toBeCloseTo(0.5);
    expect(timeline.stateAtTime(4000).fadeOpacity).toBe(0);
    expect(timeline.stateAtTime(timeline.durationMs).fadeOpacity).toBe(1);
  });

  it('applies a Ken Burns zoom that alternates direction', () => {
    const timeline = createTimeline(3, { ...config, kenBurnsScale: 1.1 });
    const first = timeline.stateAtTime(0).layers[0].scale;
    const firstLater = timeline.stateAtTime(1900).layers[0].scale;
    expect(first).toBeCloseTo(1);
    expect(firstLater).toBeGreaterThan(first);

    const second = timeline.stateAtTime(3100).layers[0].scale;
    const secondLater = timeline.stateAtTime(4900).layers[0].scale;
    expect(secondLater).toBeLessThan(second);
  });
});

describe('transitionFor', () => {
  it('cycles through the configured transitions', () => {
    const order = ['dissolve', 'slide'] as const;
    expect([0, 1, 2, 3].map(i => transitionFor(i, order))).toEqual([
      'dissolve',
      'slide',
      'dissolve',
      'slide',
    ]);
  });
});

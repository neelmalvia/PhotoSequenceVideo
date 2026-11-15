/**
 * Orchestrates a render: captures a thumbnail, resolves the music, then steps
 * the timeline one frame at a time while the native recorder captures the
 * stage. Where the files go is the caller's decision (see RenderTarget), so
 * the composer stays independent of how videos are stored.
 *
 * Frame sync: for each frame we set React state, wait for SlideStage to commit
 * it (useLayoutEffect), and only then let the recorder capture. The recorder
 * adds one requestAnimationFrame on top, so the native view has mounted.
 *
 * @format
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AbortError, useViewRecorder } from 'react-native-view-recorder';

import type { Photo } from '@/shared/types/media';
import { deleteFileIfExists } from '@/shared/utils/fs';
import { DEFAULT_COMPOSITION_CONFIG, type CompositionConfig } from '../config';
import { createTimeline } from '../engine/timeline';
import { resolveBackgroundMusicPath } from '../services/backgroundMusic';

export interface RenderTarget {
  videoPath: string;
  thumbnailPath: string;
}

export interface RenderResult {
  videoPath: string;
  /** Null if the thumbnail snapshot failed; the video is still valid. */
  thumbnailPath: string | null;
}

const THUMBNAIL_SIZE = { width: 360, height: 640 };

/** The user-facing stage of a render, for progress UIs. */
export type ComposerPhase =
  | 'loading'
  | 'rendering'
  | 'saving'
  | 'done'
  | 'idle';

export type ComposerStatus =
  | 'loading-images'
  | 'ready'
  | 'rendering'
  | 'done'
  | 'cancelled'
  | 'error';

export function useVideoComposer(
  photos: Photo[],
  config: CompositionConfig = DEFAULT_COMPOSITION_CONFIG,
) {
  const recorder = useViewRecorder();
  const timeline = useMemo(
    () => createTimeline(Math.max(photos.length, 1), config),
    [photos.length, config],
  );

  const [status, setStatus] = useState<ComposerStatus>('loading-images');
  const [frameIndex, setFrameIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  /** Seconds of rendering left, from the measured speed; null until known. */
  const [etaSeconds, setEtaSeconds] = useState<number | null>(null);
  const [result, setResult] = useState<RenderResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const committedFrame = useRef(0);
  const pendingCommit = useRef<{ frame: number; resolve: () => void } | null>(
    null,
  );
  const abortRef = useRef<AbortController | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      abortRef.current?.abort();
    };
  }, []);

  const frame = useMemo(
    () => timeline.stateAtFrame(frameIndex),
    [timeline, frameIndex],
  );

  const onFrameCommitted = useCallback((committed: number) => {
    committedFrame.current = committed;
    const pending = pendingCommit.current;
    if (pending && pending.frame === committed) {
      pendingCommit.current = null;
      pending.resolve();
    }
  }, []);

  const onImagesSettled = useCallback((failedCount: number) => {
    if (failedCount > 0) {
      setError(
        `${failedCount} photo${
          failedCount === 1 ? '' : 's'
        } could not be loaded.`,
      );
      setStatus('error');
      return;
    }
    setStatus(current => (current === 'loading-images' ? 'ready' : current));
  }, []);

  const renderFrame = useCallback(
    (index: number) =>
      new Promise<void>(resolve => {
        if (committedFrame.current === index) {
          resolve();
          return;
        }
        pendingCommit.current = { frame: index, resolve };
        setFrameIndex(index);
      }),
    [],
  );

  /** Snapshots a representative frame (middle of the first photo's hold). */
  const captureThumbnail = useCallback(
    async (path: string): Promise<string | null> => {
      try {
        await renderFrame(Math.round((config.holdMs / 2 / 1000) * config.fps));
        // Same as the recorder's own loop: one frame for the native mount.
        await new Promise<void>(r => requestAnimationFrame(() => r()));
        return await recorder.snapshot({
          output: path,
          format: 'jpg',
          quality: 0.8,
          ...THUMBNAIL_SIZE,
        });
      } catch {
        return null; // A missing thumbnail must never fail the render.
      }
    },
    [recorder, renderFrame, config.holdMs, config.fps],
  );

  const start = useCallback(
    async (target: RenderTarget): Promise<RenderResult | undefined> => {
      if (photos.length === 0) {
        return;
      }
      const controller = new AbortController();
      abortRef.current = controller;
      setError(null);
      setProgress(0);
      setEtaSeconds(null);
      setResult(null);
      setStatus('rendering');

      try {
        const thumbnailPath = await captureThumbnail(target.thumbnailPath);
        const audioPath = await resolveBackgroundMusicPath();

        let lastPercent = -1;
        let renderStartedAt = 0;
        const videoPath = await recorder.record({
          output: target.videoPath,
          fps: config.fps,
          width: config.width,
          height: config.height,
          codec: 'h264', // Widest playback support when shared.
          totalFrames: timeline.totalFrames,
          audioFile: { path: audioPath },
          signal: controller.signal,
          onFrame: ({ frameIndex: index }) => renderFrame(index),
          onProgress: ({ framesEncoded, totalFrames }) => {
            if (renderStartedAt === 0) {
              renderStartedAt = Date.now();
            }
            const percent = Math.floor((framesEncoded / totalFrames) * 100);
            if (percent !== lastPercent && mounted.current) {
              lastPercent = percent;
              setProgress(percent / 100);
              // Skip the first few frames: their timing is not representative.
              if (framesEncoded >= 10) {
                const msPerFrame =
                  (Date.now() - renderStartedAt) / framesEncoded;
                setEtaSeconds(
                  Math.ceil(
                    (msPerFrame * (totalFrames - framesEncoded)) / 1000,
                  ),
                );
              }
            }
          },
        });

        const rendered = { videoPath, thumbnailPath };
        if (mounted.current) {
          setResult(rendered);
          setStatus('done');
        }
        return rendered;
      } catch (e) {
        deleteFileIfExists(target.videoPath).catch(() => {});
        deleteFileIfExists(target.thumbnailPath).catch(() => {});
        if (!mounted.current) {
          return;
        }
        if (e instanceof AbortError) {
          setStatus('cancelled');
        } else {
          setError(e instanceof Error ? e.message : 'Rendering failed.');
          setStatus('error');
        }
      } finally {
        abortRef.current = null;
        // Leave the stage on its last frame: the screen is about to navigate
        // away, and a retry re-renders from frame 0 on its own.
        pendingCommit.current = null;
      }
    },
    [
      photos.length,
      recorder,
      config,
      timeline.totalFrames,
      renderFrame,
      captureThumbnail,
    ],
  );

  const cancel = useCallback(() => abortRef.current?.abort(), []);

  const phase: ComposerPhase =
    status === 'loading-images' || status === 'ready'
      ? 'loading'
      : status === 'rendering'
      ? progress < 1
        ? 'rendering'
        : 'saving'
      : status === 'done'
      ? 'done'
      : 'idle';

  return {
    phase,
    etaSeconds,
    sessionId: recorder.sessionId,
    timeline,
    frame,
    frameIndex,
    status,
    progress,
    result,
    error,
    start,
    cancel,
    onFrameCommitted,
    onImagesSettled,
  };
}

/**
 * @format
 */

import * as fs from '@dr.pogodin/react-native-fs';

import {
  parseIndex,
  serializeIndex,
} from '@/features/video-library/services/libraryRepository';
import { useLibraryStore } from '@/features/video-library/store/libraryStore';
import type { LibraryVideo } from '@/features/video-library/types';
import {
  formatCreatedAt,
  formatDuration,
} from '@/features/video-library/utils/format';

const video = (id: string, createdAt: number): LibraryVideo => ({
  id,
  videoFile: `video-${id}.mp4`,
  thumbnailFile: `thumb-${id}.jpg`,
  createdAt,
  durationMs: 16500,
  photoCount: 5,
  width: 720,
  height: 1280,
  savedToGallery: false,
  galleryUri: null,
  deletedAt: null,
});

describe('library index', () => {
  it('round-trips through serialize and parse', () => {
    const videos = [video('a', 2), video('b', 1)];
    expect(parseIndex(serializeIndex(videos))).toEqual(videos);
  });

  it('returns an empty library for corrupt or unknown files', () => {
    expect(parseIndex('not json')).toEqual([]);
    expect(parseIndex('{"version":99,"videos":[]}')).toEqual([]);
    expect(parseIndex('{"version":1}')).toEqual([]);
  });

  it('drops malformed entries and fills defaults for missing fields', () => {
    const raw = JSON.stringify({
      version: 1,
      videos: [
        { id: 'ok', videoFile: 'v.mp4', createdAt: 1, durationMs: 1000 },
        { id: 'broken' },
      ],
    });
    expect(parseIndex(raw)).toEqual([
      {
        id: 'ok',
        videoFile: 'v.mp4',
        createdAt: 1,
        durationMs: 1000,
        thumbnailFile: null,
        photoCount: 0,
        width: 0,
        height: 0,
        savedToGallery: false,
        galleryUri: null,
        deletedAt: null,
      },
    ]);
  });
});

describe('library store', () => {
  beforeEach(() => {
    useLibraryStore.setState({ videos: [], status: 'idle' });
    jest.clearAllMocks();
  });

  it('keeps videos newest first and persists every change', async () => {
    const { add } = useLibraryStore.getState();
    await add(video('old', 1));
    await add(video('new', 2));
    expect(useLibraryStore.getState().videos.map(v => v.id)).toEqual([
      'new',
      'old',
    ]);
    expect(fs.writeFile).toHaveBeenCalledTimes(2);
  });

  it('updates an entry in place', async () => {
    const store = useLibraryStore.getState();
    await store.add(video('a', 1));
    await store.update('a', { savedToGallery: true });
    expect(useLibraryStore.getState().videos[0].savedToGallery).toBe(true);
  });

  it('removes the entry and deletes its files', async () => {
    const store = useLibraryStore.getState();
    await store.add(video('a', 1));
    await store.remove('a');
    expect(useLibraryStore.getState().videos).toEqual([]);
    expect(fs.unlink).toHaveBeenCalledWith('/docs/library/video-a.mp4');
    expect(fs.unlink).toHaveBeenCalledWith('/docs/library/thumb-a.jpg');
  });
});

describe('formatting', () => {
  it('formats durations, rounding up partial seconds', () => {
    expect(formatDuration(16500)).toBe('0:17');
    expect(formatDuration(65000)).toBe('1:05');
    expect(formatDuration(0)).toBe('0:00');
  });

  it('formats creation dates relative to now', () => {
    const now = new Date(2026, 10, 15, 12, 0);
    expect(formatCreatedAt(new Date(2026, 10, 15, 9, 5).getTime(), now)).toBe(
      'Today, 09:05',
    );
    expect(formatCreatedAt(new Date(2026, 10, 14, 18, 30).getTime(), now)).toBe(
      'Yesterday, 18:30',
    );
    expect(formatCreatedAt(new Date(2026, 9, 2, 8, 0).getTime(), now)).toBe(
      '2 Oct, 08:00',
    );
    expect(formatCreatedAt(new Date(2025, 0, 9, 8, 0).getTime(), now)).toBe(
      '9 Jan 2025, 08:00',
    );
  });
});

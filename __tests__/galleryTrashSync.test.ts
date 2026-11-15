/**
 * @format
 */

import {
  TRASH_RETENTION_MS,
  decideSavedVideo,
  decideTrashedVideo,
  type GalleryStatus,
} from '@/features/video-library/services/trashPolicy';
import {
  selectVideoById,
  selectVisibleCount,
  selectVisibleVideos,
  useLibraryStore,
} from '@/features/video-library/store/libraryStore';
import type { LibraryVideo } from '@/features/video-library/types';

const NOW = 1_800_000_000_000;

const video = (
  id: string,
  patch: Partial<LibraryVideo> = {},
): LibraryVideo => ({
  id,
  videoFile: `video-${id}.mp4`,
  thumbnailFile: null,
  createdAt: 1,
  durationMs: 1000,
  photoCount: 3,
  width: 720,
  height: 1280,
  savedToGallery: true,
  galleryUri: `content://media/external/video/media/${id}`,
  deletedAt: null,
  ...patch,
});

describe('decideTrashedVideo', () => {
  const trashed = { deletedAt: NOW - 1000 };

  it('follows the gallery when it is certain', () => {
    expect(decideTrashedVideo(trashed, 'active', NOW)).toBe('restore');
    expect(decideTrashedVideo(trashed, 'trashed', NOW)).toBe('keep');
    expect(decideTrashedVideo(trashed, 'missing', NOW)).toBe('purge');
  });

  it('waits out the trash window when the gallery cannot tell (iOS)', () => {
    expect(decideTrashedVideo(trashed, 'unknown', NOW)).toBe('keep');
    expect(
      decideTrashedVideo(
        { deletedAt: NOW - TRASH_RETENTION_MS },
        'unknown',
        NOW,
      ),
    ).toBe('purge');
  });
});

describe('library trash', () => {
  beforeEach(() => useLibraryStore.setState({ videos: [], status: 'ready' }));

  it('hides trashed videos from the library', async () => {
    const store = useLibraryStore.getState();
    await store.add(video('a'));
    await store.add(video('b'));
    await store.moveToTrash('a');

    const state = useLibraryStore.getState();
    expect(selectVisibleVideos(state).map(v => v.id)).toEqual(['b']);
    expect(selectVisibleCount(state)).toBe(1);
    expect(selectVideoById('a')(state)).toBeUndefined();
    expect(state.videos.find(v => v.id === 'a')?.deletedAt).toEqual(
      expect.any(Number),
    );
  });

  it('restores, keeps or purges trashed videos to match the gallery', async () => {
    const store = useLibraryStore.getState();
    await store.add(video('restored'));
    await store.add(video('stillTrashed'));
    await store.add(video('emptied'));
    await store.moveToTrash('restored');
    await store.moveToTrash('stillTrashed');
    await store.moveToTrash('emptied');

    const statuses: Record<string, GalleryStatus> = {
      restored: 'active',
      stillTrashed: 'trashed',
      emptied: 'missing',
    };
    await store.syncTrashWithGallery(
      async uri => statuses[uri.split('/').pop()!],
    );

    const state = useLibraryStore.getState();
    expect(selectVisibleVideos(state).map(v => v.id)).toEqual(['restored']);
    expect(state.videos.map(v => v.id).sort()).toEqual([
      'restored',
      'stillTrashed',
    ]);
  });

  it('skips videos whose status lookup fails', async () => {
    const store = useLibraryStore.getState();
    await store.add(video('visible'));
    await store.add(video('flaky'));
    await store.moveToTrash('flaky');

    const lookup = jest.fn(async () => {
      throw new Error('no access');
    });
    await store.syncTrashWithGallery(lookup);

    expect(lookup).toHaveBeenCalledTimes(2); // both have a gallery copy
    expect(useLibraryStore.getState().videos).toHaveLength(2);
  });

  it('mirrors gallery-side deletions of visible saved videos', async () => {
    const store = useLibraryStore.getState();
    await store.add(video('trashedThere'));
    await store.add(video('deletedThere'));
    await store.add(video('untouched'));
    await store.add(
      video('notSaved', { savedToGallery: false, galleryUri: null }),
    );

    const statuses: Record<string, GalleryStatus> = {
      trashedThere: 'trashed',
      deletedThere: 'missing',
      untouched: 'active',
    };
    const lookup = jest.fn(
      async (uri: string) => statuses[uri.split('/').pop()!],
    );
    const result = await store.syncTrashWithGallery(lookup);

    expect(result).toMatchObject({
      trashed: 1,
      unlinked: 1,
      restored: 0,
      purged: 0,
    });
    expect(lookup).toHaveBeenCalledTimes(3); // the unsaved video is skipped
    const state = useLibraryStore.getState();
    expect(
      selectVisibleVideos(state)
        .map(v => v.id)
        .sort(),
    ).toEqual(['deletedThere', 'notSaved', 'untouched']);
    const unlinked = state.videos.find(v => v.id === 'deletedThere');
    expect(unlinked).toMatchObject({ savedToGallery: false, galleryUri: null });
  });
});

describe('decideSavedVideo', () => {
  it('trashes, unlinks or keeps based on the gallery copy', () => {
    expect(decideSavedVideo('trashed')).toBe('trash');
    expect(decideSavedVideo('missing')).toBe('unlink');
    expect(decideSavedVideo('active')).toBe('keep');
    expect(decideSavedVideo('unknown')).toBe('keep');
  });
});

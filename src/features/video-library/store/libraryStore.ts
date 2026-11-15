/**
 * In-memory view of the library, kept in sync with index.json. Writes are
 * chained so two quick mutations can never interleave and lose an update.
 *
 * Deleting a video that was saved to the gallery is a soft delete: it gets a
 * deletedAt and is hidden, while its gallery copy sits in the system trash.
 * syncTrashWithGallery() then follows what the user does in the gallery:
 * restoring brings it back here, emptying the trash purges our copy too.
 *
 * @format
 */

import { create } from 'zustand';

import {
  deleteLibraryFiles,
  loadLibrary,
  saveLibrary,
} from '../services/libraryRepository';
import {
  decideSavedVideo,
  decideTrashedVideo,
  type GalleryStatus,
} from '../services/trashPolicy';
import type { LibraryVideo } from '../types';

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

export type GalleryStatusLookup = (uri: string) => Promise<GalleryStatus>;

export interface TrashSyncResult {
  restored: number;
  purged: number;
  /** Hidden because the user trashed the gallery copy outside the app. */
  trashed: number;
  /** Gallery copy deleted outside the app; the app copy can be saved again. */
  unlinked: number;
}

interface LibraryState {
  /** Every entry, including trashed ones. Use the selectors for display. */
  videos: LibraryVideo[];
  status: LoadStatus;
  load: () => Promise<void>;
  add: (video: LibraryVideo) => Promise<void>;
  update: (id: string, patch: Partial<LibraryVideo>) => Promise<void>;
  /** Hides the video; its gallery copy is in the system trash. */
  moveToTrash: (id: string) => Promise<void>;
  /** Deletes the entry and its files for good. */
  remove: (id: string) => Promise<void>;
  /** Mirrors gallery restores and permanent deletions. */
  syncTrashWithGallery: (
    lookup: GalleryStatusLookup,
  ) => Promise<TrashSyncResult>;
}

const newestFirst = (a: LibraryVideo, b: LibraryVideo) =>
  b.createdAt - a.createdAt;

let writeQueue: Promise<void> = Promise.resolve();

const persist = (videos: LibraryVideo[]): Promise<void> => {
  writeQueue = writeQueue.catch(() => {}).then(() => saveLibrary(videos));
  return writeQueue;
};

let syncInFlight: Promise<TrashSyncResult> | null = null;

export const useLibraryStore = create<LibraryState>((set, get) => ({
  videos: [],
  status: 'idle',

  load: async () => {
    if (get().status === 'loading') {
      return;
    }
    set({ status: 'loading' });
    try {
      const videos = (await loadLibrary()).sort(newestFirst);
      set({ videos, status: 'ready' });
    } catch {
      set({ status: 'error' });
    }
  },

  add: async video => {
    const videos = [video, ...get().videos.filter(v => v.id !== video.id)];
    set({ videos: videos.sort(newestFirst) });
    await persist(get().videos);
  },

  update: async (id, patch) => {
    set({
      videos: get().videos.map(v => (v.id === id ? { ...v, ...patch } : v)),
    });
    await persist(get().videos);
  },

  moveToTrash: id => get().update(id, { deletedAt: Date.now() }),

  remove: async id => {
    const video = get().videos.find(v => v.id === id);
    if (!video) {
      return;
    }
    set({ videos: get().videos.filter(v => v.id !== id) });
    await persist(get().videos);
    await deleteLibraryFiles(video).catch(() => {});
  },

  syncTrashWithGallery: lookup => {
    // Foreground events can fire in bursts; one sync at a time is enough.
    if (syncInFlight) {
      return syncInFlight;
    }
    syncInFlight = (async () => {
      const result: TrashSyncResult = {
        restored: 0,
        purged: 0,
        trashed: 0,
        unlinked: 0,
      };
      const now = Date.now();
      // Every video with a gallery copy: trashed ones may have been restored
      // or emptied there, visible ones may have been deleted there.
      const linked = get().videos.filter(v => v.galleryUri);
      for (const video of linked) {
        let status: GalleryStatus;
        try {
          status = await lookup(video.galleryUri as string);
        } catch {
          continue; // Try again next time.
        }
        if (video.deletedAt !== null) {
          const decision = decideTrashedVideo(video, status, now);
          if (decision === 'restore') {
            await get().update(video.id, { deletedAt: null });
            result.restored++;
          } else if (decision === 'purge') {
            await get().remove(video.id);
            result.purged++;
          }
          continue;
        }
        const decision = decideSavedVideo(status);
        if (decision === 'trash') {
          await get().update(video.id, { deletedAt: now });
          result.trashed++;
        } else if (decision === 'unlink') {
          await get().update(video.id, {
            savedToGallery: false,
            galleryUri: null,
          });
          result.unlinked++;
        }
      }
      return result;
    })().finally(() => {
      syncInFlight = null;
    });
    return syncInFlight;
  },
}));

const isVisible = (v: LibraryVideo) => v.deletedAt === null;

/** Videos to show in the app (excludes the trash). */
export const selectVisibleVideos = (state: LibraryState) =>
  state.videos.filter(isVisible);

export const selectVisibleCount = (state: LibraryState) =>
  state.videos.reduce((n, v) => (isVisible(v) ? n + 1 : n), 0);

/** A visible video by id; trashed videos read as missing. */
export const selectVideoById = (id: string) => (state: LibraryState) =>
  state.videos.find(v => v.id === id && isVisible(v));

/**
 * Keeps the app's trash in step with the gallery's: whenever the app starts
 * or returns to the foreground (e.g. after the user restored a video in the
 * Photos app), trashed videos are checked against their gallery copy.
 *
 * @format
 */

import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useLibraryStore } from '@/features/video-library/store/libraryStore';
import { toast } from '@/shared/feedback';
import { getGalleryItemStatus } from '../services/galleryTrash';

const sync = async () => {
  try {
    const { restored } = await useLibraryStore
      .getState()
      .syncTrashWithGallery(getGalleryItemStatus);
    if (restored > 0) {
      toast.success(
        restored === 1 ? 'Video restored' : `${restored} videos restored`,
        "It's back in My videos.",
      );
    }
  } catch {
    // Best effort: the next foreground will try again.
  }
};

export function useGalleryTrashSync() {
  const ready = useLibraryStore(s => s.status === 'ready');

  useEffect(() => {
    if (!ready) {
      return;
    }
    sync();
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        sync();
      }
    });
    return () => subscription.remove();
  }, [ready]);
}

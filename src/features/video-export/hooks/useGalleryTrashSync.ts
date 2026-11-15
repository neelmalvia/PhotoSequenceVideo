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
    const { restored, trashed, unlinked } = await useLibraryStore
      .getState()
      .syncTrashWithGallery(getGalleryItemStatus);
    if (restored > 0) {
      toast.success(
        restored === 1 ? 'Video restored' : `${restored} videos restored`,
        "It's back in My videos.",
      );
    } else if (trashed > 0) {
      toast.info(
        trashed === 1
          ? 'Video moved to trash'
          : `${trashed} videos moved to trash`,
        'Deleted in your gallery. Restore it there to bring it back.',
      );
    } else if (unlinked > 0) {
      toast.info(
        'Removed from your gallery',
        'The video is still in My videos and can be saved again.',
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

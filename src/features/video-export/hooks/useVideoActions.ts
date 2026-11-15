/**
 * Save, share and delete for a library video, shared by the post-render
 * preview and the fullscreen player so both behave identically.
 *
 * Delete: if the video was saved, its gallery copy goes to the system trash
 * (Recently Deleted on iOS, Trash on Android 11+) and the app copy is hidden
 * rather than erased, so restoring it in the gallery brings it back here (see
 * useGalleryTrashSync). Unsaved videos are removed outright. If the user
 * declines the system prompt, nothing is deleted.
 *
 * @format
 */

import { useCallback, useState } from 'react';
import { Platform, Share } from 'react-native';

import { libraryPath } from '@/features/video-library/services/libraryRepository';
import { useLibraryStore } from '@/features/video-library/store/libraryStore';
import type { LibraryVideo } from '@/features/video-library/types';
import { dialog, toast } from '@/shared/feedback';
import { Trash } from '@/shared/icons';
import { showPermissionDialog } from '@/shared/permissions/permissionDialog';
import { toFileUri } from '@/shared/utils/files';
import {
  GalleryPermissionError,
  ensureGalleryAccess,
  saveVideoToGallery,
} from '../services/gallery';
import { moveGalleryItemToTrash } from '../services/galleryTrash';

const ANDROID_TRASH_API = 30;

const PERMISSION_COPY = {
  title: 'Allow photo access',
  deniedMessage:
    'Photo Sequence needs access to your photos to save and manage your videos. Please try again.',
  blockedMessage:
    'Photo access is turned off for Photo Sequence. Turn it on in Settings to save or delete videos in your gallery.',
};

function deleteMessage(video: LibraryVideo): string {
  if (video.galleryUri) {
    const hasTrash =
      Platform.OS === 'ios' || Number(Platform.Version) >= ANDROID_TRASH_API;
    if (!hasTrash) {
      return 'It will be removed from the app and deleted from your gallery. This cannot be undone.';
    }
    const trashName = Platform.OS === 'ios' ? 'Recently Deleted' : 'Trash';
    return `It will be moved to ${trashName} in your gallery. Restore it there within 30 days and it comes back here too.`;
  }
  if (video.savedToGallery) {
    return 'It will be removed from the app. The copy in your gallery stays.';
  }
  return 'It will be removed from the app. This cannot be undone.';
}

function showError(title: string, e: unknown) {
  if (e instanceof GalleryPermissionError) {
    showPermissionDialog(e.result, PERMISSION_COPY);
    return;
  }
  toast.error(title, e instanceof Error ? e.message : 'Please try again.');
}

function deletedToast(result: 'trashed' | 'removed') {
  if (result === 'trashed') {
    const trashName = Platform.OS === 'ios' ? 'Recently Deleted' : 'Trash';
    toast.success('Video deleted', `Moved to ${trashName} in your gallery.`);
  } else {
    toast.success('Video deleted');
  }
}

interface Options {
  /** Called once the user confirms and the delete is going ahead. */
  onDeleted: () => void;
}

export function useVideoActions(
  video: LibraryVideo | undefined,
  { onDeleted }: Options,
) {
  const updateVideo = useLibraryStore(s => s.update);
  const removeVideo = useLibraryStore(s => s.remove);
  const moveVideoToTrash = useLibraryStore(s => s.moveToTrash);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const save = useCallback(async () => {
    if (!video) {
      return;
    }
    setSaving(true);
    try {
      const galleryUri = await saveVideoToGallery(libraryPath(video.videoFile));
      await updateVideo(video.id, { savedToGallery: true, galleryUri });
      toast.success('Saved to gallery');
    } catch (e) {
      showError('Could not save video', e);
    } finally {
      setSaving(false);
    }
  }, [video, updateVideo]);

  const share = useCallback(async () => {
    if (!video) {
      return;
    }
    try {
      await Share.share({ url: toFileUri(libraryPath(video.videoFile)) });
    } catch {
      // Dismissing the share sheet is not an error worth surfacing.
    }
  }, [video]);

  const performDelete = useCallback(async () => {
    if (!video) {
      return;
    }
    setDeleting(true);
    try {
      if (!video.galleryUri) {
        onDeleted();
        await removeVideo(video.id);
        deletedToast('removed');
        return;
      }
      if (Platform.OS === 'ios') {
        await ensureGalleryAccess();
      }
      const result = await moveGalleryItemToTrash(video.galleryUri);
      if (result === 'cancelled') {
        return; // The user kept it; leave the app copy alone too.
      }
      onDeleted();
      if (result === 'trashed') {
        // Keep our copy hidden while the gallery copy is restorable.
        await moveVideoToTrash(video.id);
        deletedToast('trashed');
      } else {
        await removeVideo(video.id); // No trash to restore from.
        deletedToast('removed');
      }
    } catch (e) {
      showError('Could not delete video', e);
    } finally {
      setDeleting(false);
    }
  }, [video, onDeleted, removeVideo, moveVideoToTrash]);

  const confirmDelete = useCallback(async () => {
    if (!video) {
      return;
    }
    const confirmed = await dialog.confirm({
      title: 'Delete this video?',
      message: deleteMessage(video),
      icon: Trash,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (confirmed) {
      await performDelete();
    }
  }, [video, performDelete]);

  return { save, share, confirmDelete, saving, deleting };
}

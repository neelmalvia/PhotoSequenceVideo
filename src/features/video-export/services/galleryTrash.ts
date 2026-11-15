/**
 * Moves videos we saved into the system trash, and reports where they are
 * later so the app can follow restores made in the gallery app:
 * - iOS: PHAssetChangeRequest.deleteAssets moves it to "Recently Deleted"
 *   (iOS shows its own confirmation). iOS hides Recently Deleted items from
 *   apps, so status can only say "active" or "unknown".
 * - Android 11+: our GalleryTrash native module sets IS_TRASHED (no prompt
 *   for items the app owns; a system consent dialog otherwise) and reports
 *   the exact state.
 * - Android 10 and below: no system trash exists, so it is deleted.
 *
 * @format
 */

import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { NativeModules, Platform } from 'react-native';

import type { GalleryStatus } from '@/features/video-library/services/trashPolicy';

export type TrashResult = 'trashed' | 'deleted' | 'missing' | 'cancelled';

export type { GalleryStatus };

interface GalleryTrashNativeModule {
  trash(uri: string): Promise<TrashResult>;
  status(uri: string): Promise<GalleryStatus>;
}

const nativeTrash = NativeModules.GalleryTrash as
  | GalleryTrashNativeModule
  | undefined;

const IOS_LOOKUP_TIMEOUT_MS = 5000;

function requireNativeModule(): GalleryTrashNativeModule {
  if (!nativeTrash) {
    throw new Error('GalleryTrash native module is not linked.');
  }
  return nativeTrash;
}

export async function moveGalleryItemToTrash(
  uri: string,
): Promise<TrashResult> {
  if (Platform.OS === 'android') {
    return requireNativeModule().trash(uri);
  }

  try {
    // Resolves for a missing asset too (nothing to delete).
    await CameraRoll.deletePhotos([uri]);
    return 'trashed';
  } catch {
    // iOS rejects when the user taps "Don't Allow" on its confirmation.
    return 'cancelled';
  }
}

export async function getGalleryItemStatus(
  uri: string,
): Promise<GalleryStatus> {
  if (Platform.OS === 'android') {
    return requireNativeModule().status(uri);
  }

  // iOS: the asset is only visible to us when it is in the library proper.
  const lookup = CameraRoll.iosGetImageDataById(uri)
    .then((): GalleryStatus => 'active')
    .catch((): GalleryStatus => 'unknown');
  const timeout = new Promise<GalleryStatus>(resolve =>
    setTimeout(() => resolve('unknown'), IOS_LOOKUP_TIMEOUT_MS),
  );
  return Promise.race([lookup, timeout]);
}

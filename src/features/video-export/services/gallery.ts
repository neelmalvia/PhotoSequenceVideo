/**
 * @format
 */

import { CameraRoll } from '@react-native-camera-roll/camera-roll';

import {
  requestGalleryAccess,
  type PermissionResult,
} from '@/shared/permissions/galleryPermission';
import { toFileUri } from '@/shared/utils/files';

export class GalleryPermissionError extends Error {
  constructor(readonly result: Exclude<PermissionResult, 'granted'>) {
    super('Permission to access your gallery was not granted.');
    this.name = 'GalleryPermissionError';
  }
}

export async function ensureGalleryAccess(): Promise<void> {
  const permission = await requestGalleryAccess();
  if (permission !== 'granted') {
    throw new GalleryPermissionError(permission);
  }
}

/**
 * Saves the video to the gallery, asking for permission first if needed.
 * Resolves to the gallery item's URI (ph:// on iOS, content:// on Android),
 * which is what we need to move it to the trash later.
 */
export async function saveVideoToGallery(path: string): Promise<string | null> {
  await ensureGalleryAccess();
  const asset = await CameraRoll.saveAsset(toFileUri(path), { type: 'video' });
  return asset?.node?.image?.uri ?? null;
}

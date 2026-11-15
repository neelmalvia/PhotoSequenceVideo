/**
 * Thin wrapper over react-native-image-picker so the rest of the app depends
 * on our Photo type, not on the picker library's response shape.
 *
 * @format
 */

import { launchImageLibrary, type Asset } from 'react-native-image-picker';

import type { Photo } from '@/shared/types/media';
import { PICKER_JPEG_QUALITY, PICKER_MAX_DIMENSION } from '../constants';

export class PhotoLibraryError extends Error {
  constructor(message: string, readonly code?: string) {
    super(message);
    this.name = 'PhotoLibraryError';
  }
}

let idCounter = 0;

const toPhoto = (asset: Asset): Photo | null => {
  if (!asset.uri) {
    return null;
  }
  return {
    id: asset.id ?? `${Date.now()}-${idCounter++}`,
    uri: asset.uri,
    width: asset.width ?? 0,
    height: asset.height ?? 0,
  };
};

/** Opens the gallery. Resolves to an empty array if the user cancels. */
export async function pickPhotos(limit: number): Promise<Photo[]> {
  if (limit < 1) {
    return [];
  }

  const response = await launchImageLibrary({
    mediaType: 'photo',
    selectionLimit: limit,
    // Setting a max size makes the picker re-encode to JPEG, which also
    // converts HEIC on iOS and bakes in EXIF orientation.
    maxWidth: PICKER_MAX_DIMENSION,
    maxHeight: PICKER_MAX_DIMENSION,
    quality: PICKER_JPEG_QUALITY,
    includeBase64: false,
  });

  if (response.didCancel) {
    return [];
  }
  if (response.errorCode) {
    throw new PhotoLibraryError(
      response.errorMessage ?? 'Could not open your photo library.',
      response.errorCode,
    );
  }

  return (response.assets ?? [])
    .map(toPhoto)
    .filter((photo): photo is Photo => photo !== null)
    .slice(0, limit);
}

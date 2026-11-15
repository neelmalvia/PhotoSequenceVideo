/**
 * @format
 */

export interface LibraryVideo {
  id: string;
  /**
   * File names inside the library directory, never absolute paths: on iOS the
   * app container path changes across app updates, so stored paths go stale.
   */
  videoFile: string;
  thumbnailFile: string | null;
  createdAt: number;
  durationMs: number;
  photoCount: number;
  width: number;
  height: number;
  savedToGallery: boolean;
  /**
   * The saved gallery item (ph:// on iOS, content:// on Android), used to move
   * it to the system trash when the video is deleted in the app. Null if never
   * saved, or saved by a build that did not record it.
   */
  galleryUri: string | null;
  /**
   * Set when deleted in the app while its gallery copy sits in the system
   * trash. Hidden from the library; cleared if the user restores it there.
   */
  deletedAt: number | null;
}

/** Where a new render should be written before it joins the library. */
export interface LibraryTarget {
  id: string;
  videoFile: string;
  thumbnailFile: string;
  videoPath: string;
  thumbnailPath: string;
}

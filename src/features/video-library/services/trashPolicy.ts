/**
 * Decides what to do with a video in the app's trash, given where its
 * gallery copy is now. Pure, so the rules are easy to test and reason about.
 *
 * @format
 */

import type { LibraryVideo } from '../types';

/** Matches the system trash on both platforms. */
export const TRASH_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Where a saved video's gallery copy is now:
 * active:  in the gallery (e.g. restored from the trash)
 * trashed: in the system trash
 * missing: gone for good
 * unknown: can't tell (iOS while in Recently Deleted, or no access)
 */
export type GalleryStatus = 'active' | 'trashed' | 'missing' | 'unknown';
export type TrashDecision = 'restore' | 'keep' | 'purge';

export function decideTrashedVideo(
  video: Pick<LibraryVideo, 'deletedAt'>,
  status: GalleryStatus,
  now: number,
): TrashDecision {
  switch (status) {
    case 'active':
      return 'restore'; // The user restored it in the gallery.
    case 'trashed':
      return 'keep';
    case 'missing':
      return 'purge'; // Emptied from the trash or expired.
    case 'unknown': {
      // iOS can't see into Recently Deleted: keep it for the same window
      // the system does, then let it go.
      const deletedAt = video.deletedAt ?? now;
      return now - deletedAt >= TRASH_RETENTION_MS ? 'purge' : 'keep';
    }
  }
}

export type SavedVideoDecision = 'keep' | 'trash' | 'unlink';

/**
 * For a video that is visible in the app and was saved to the gallery: what
 * to do when the user changed the gallery copy outside the app.
 * - trashed in the gallery: mirror it, so the app copy is hidden too and
 *   comes back if they restore it there;
 * - deleted for good: forget the gallery link but keep the app copy, so it
 *   can be saved again (never destroy the app's video on a gallery action
 *   that skipped the trash);
 * - unknown (iOS, no access): leave it alone.
 */
export function decideSavedVideo(status: GalleryStatus): SavedVideoDecision {
  switch (status) {
    case 'trashed':
      return 'trash';
    case 'missing':
      return 'unlink';
    default:
      return 'keep';
  }
}

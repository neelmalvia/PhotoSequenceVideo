/**
 * @format
 */

import { create } from 'zustand';

import type { Photo } from '@/shared/types/media';
import { MAX_PHOTOS, MIN_PHOTOS } from '../constants';

interface SelectionState {
  photos: Photo[];
  /** Appends photos, skipping duplicates, up to MAX_PHOTOS. */
  addPhotos: (photos: Photo[]) => void;
  removePhoto: (id: string) => void;
  /** Moves a photo one step earlier (-1) or later (+1) in the sequence. */
  movePhoto: (id: string, direction: -1 | 1) => void;
  clear: () => void;
}

export const useSelectionStore = create<SelectionState>(set => ({
  photos: [],
  addPhotos: incoming =>
    set(state => {
      const known = new Set(state.photos.flatMap(p => [p.id, p.uri]));
      const fresh = incoming.filter(p => !known.has(p.id) && !known.has(p.uri));
      return { photos: [...state.photos, ...fresh].slice(0, MAX_PHOTOS) };
    }),
  removePhoto: id =>
    set(state => ({ photos: state.photos.filter(p => p.id !== id) })),
  movePhoto: (id, direction) =>
    set(state => {
      const from = state.photos.findIndex(p => p.id === id);
      const to = from + direction;
      if (from < 0 || to < 0 || to >= state.photos.length) {
        return state;
      }
      const photos = [...state.photos];
      [photos[from], photos[to]] = [photos[to], photos[from]];
      return { photos };
    }),
  clear: () => set({ photos: [] }),
}));

export type SelectionValidation =
  | { valid: true }
  | { valid: false; reason: string };

export function validateSelection(count: number): SelectionValidation {
  if (count < MIN_PHOTOS) {
    const missing = MIN_PHOTOS - count;
    return {
      valid: false,
      reason: `Add ${missing} more photo${
        missing === 1 ? '' : 's'
      } to continue.`,
    };
  }
  if (count > MAX_PHOTOS) {
    return { valid: false, reason: `Pick at most ${MAX_PHOTOS} photos.` };
  }
  return { valid: true };
}

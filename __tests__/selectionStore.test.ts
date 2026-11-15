/**
 * @format
 */

import { MAX_PHOTOS } from '@/features/photo-selection/constants';
import {
  useSelectionStore,
  validateSelection,
} from '@/features/photo-selection/store/selectionStore';
import type { Photo } from '@/shared/types/media';

const photo = (n: number): Photo => ({
  id: `id-${n}`,
  uri: `file:///photo-${n}.jpg`,
  width: 100,
  height: 100,
});

const ids = () => useSelectionStore.getState().photos.map(p => p.id);

beforeEach(() => useSelectionStore.getState().clear());

describe('selection store', () => {
  it('adds photos in order and skips duplicates', () => {
    const { addPhotos } = useSelectionStore.getState();
    addPhotos([photo(1), photo(2)]);
    addPhotos([photo(2), photo(3)]);
    expect(ids()).toEqual(['id-1', 'id-2', 'id-3']);
  });

  it(`never holds more than ${MAX_PHOTOS} photos`, () => {
    useSelectionStore
      .getState()
      .addPhotos(Array.from({ length: MAX_PHOTOS + 2 }, (_, i) => photo(i)));
    expect(ids()).toHaveLength(MAX_PHOTOS);
  });

  it('removes and reorders photos', () => {
    const store = useSelectionStore.getState();
    store.addPhotos([photo(1), photo(2), photo(3)]);
    store.movePhoto('id-3', -1);
    expect(ids()).toEqual(['id-1', 'id-3', 'id-2']);
    store.movePhoto('id-1', -1); // already first: no-op
    expect(ids()).toEqual(['id-1', 'id-3', 'id-2']);
    store.removePhoto('id-3');
    expect(ids()).toEqual(['id-1', 'id-2']);
  });
});

describe('validateSelection', () => {
  it('requires between 3 and 5 photos', () => {
    expect(validateSelection(2)).toEqual({
      valid: false,
      reason: 'Add 1 more photo to continue.',
    });
    expect(validateSelection(0).valid).toBe(false);
    expect(validateSelection(3).valid).toBe(true);
    expect(validateSelection(5).valid).toBe(true);
    expect(validateSelection(6).valid).toBe(false);
  });
});

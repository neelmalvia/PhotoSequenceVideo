/**
 * Dev-only test hook for driving the render pipeline without the system
 * photo picker (simulators can't be tapped from scripts).
 *
 * iOS simulator usage:
 *   1. Copy JPEGs into the app's data container at Documents/e2e/
 *      (`xcrun simctl get_app_container booted <bundle id> data`).
 *   2. Launch with `xcrun simctl launch booted <bundle id> -PSV_E2E_SEED 1`.
 *
 * The photos are loaded as the selection and onSeeded fires (e.g. to navigate
 * to Compose). Does nothing in release builds or without the launch argument.
 *
 * @format
 */

import { useEffect, useRef } from 'react';
import { Platform, Settings } from 'react-native';
import {
  DocumentDirectoryPath,
  exists,
  readDir,
} from '@dr.pogodin/react-native-fs';

import type { Photo } from '@/shared/types/media';
import { toFileUri } from '@/shared/utils/files';

const LAUNCH_ARG = 'PSV_E2E_SEED';
const SEED_DIR = `${DocumentDirectoryPath}/e2e`;

async function loadSeedPhotos(): Promise<Photo[]> {
  if (!(await exists(SEED_DIR))) {
    return [];
  }
  const entries = await readDir(SEED_DIR);
  return entries
    .filter(e => e.isFile() && /\.jpe?g$/i.test(e.name))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(e => ({
      id: `e2e-${e.name}`,
      uri: toFileUri(e.path),
      width: 0,
      height: 0,
    }));
}

export function useE2ESeed(onSeeded: (photos: Photo[]) => void) {
  const done = useRef(false);

  useEffect(() => {
    if (!__DEV__ || Platform.OS !== 'ios' || done.current) {
      return;
    }
    if (Settings.get(LAUNCH_ARG) == null) {
      return;
    }
    done.current = true;
    loadSeedPhotos()
      .then(photos => {
        if (photos.length > 0) {
          onSeeded(photos);
        }
      })
      .catch(() => {});
  }, [onSeeded]);
}

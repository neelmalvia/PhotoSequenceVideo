/**
 * Resolves the bundled background track to an absolute file path, which is
 * what the native encoder needs. The source of truth is
 * assets/audio/background.wav; iOS ships it as a bundle resource and Android
 * as an APK asset (android/app/src/main/assets/audio).
 *
 * Why WAV and not AAC: react-native-view-recorder's Android audio path feeds
 * MediaExtractor samples straight into the encoder as PCM16. With an AAC file
 * those samples are compressed packets, which produces noise and a truncated
 * track. WAV samples are already PCM16 (44.1 kHz mono, matching the encoder),
 * so the same file works correctly on both platforms. Regenerate it with
 * `python3 scripts/generate-music.py assets/audio/background.wav`.
 *
 * @format
 */

import {
  CachesDirectoryPath,
  MainBundlePath,
  copyFileAssets,
  exists,
} from '@dr.pogodin/react-native-fs';
import { Platform } from 'react-native';

const FILE_NAME = 'background.wav';
const ANDROID_ASSET_PATH = `audio/${FILE_NAME}`;

export async function resolveBackgroundMusicPath(): Promise<string> {
  if (Platform.OS === 'ios') {
    return `${MainBundlePath}/${FILE_NAME}`;
  }

  // APK assets aren't real files, so copy it out once and reuse the copy.
  const destination = `${CachesDirectoryPath}/${FILE_NAME}`;
  if (!(await exists(destination))) {
    await copyFileAssets(ANDROID_ASSET_PATH, destination);
  }
  return destination;
}

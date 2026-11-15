/**
 * @format
 */

import { exists, unlink } from '@dr.pogodin/react-native-fs';

export async function deleteFileIfExists(path: string): Promise<void> {
  if (await exists(path)) {
    await unlink(path);
  }
}

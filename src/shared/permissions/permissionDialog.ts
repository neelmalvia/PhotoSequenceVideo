/**
 * User-facing messages for permission outcomes, kept separate from the
 * permission logic so the logic stays testable and the copy reusable.
 *
 * @format
 */

import { Linking } from 'react-native';

import { dialog } from '@/shared/feedback';
import { Settings } from '@/shared/icons';
import type { PermissionResult } from './galleryPermission';

export interface PermissionCopy {
  title: string;
  /** Shown when the user declined but can be asked again. */
  deniedMessage: string;
  /** Shown when only the Settings app can grant access. */
  blockedMessage: string;
}

/** Explains a non-granted result; offers a Settings shortcut when blocked. */
export function showPermissionDialog(
  result: Exclude<PermissionResult, 'granted'>,
  copy: PermissionCopy,
): void {
  if (result === 'denied') {
    dialog.alert(copy.title, copy.deniedMessage);
    return;
  }
  dialog.show({
    title: copy.title,
    message: copy.blockedMessage,
    icon: Settings,
    actions: [
      { label: 'Not now', style: 'cancel' },
      { label: 'Open Settings', onPress: () => Linking.openSettings() },
    ],
  });
}

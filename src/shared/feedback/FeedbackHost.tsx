/**
 * Mount once at the app root, after the navigator, so toasts and dialogs
 * render above every screen.
 *
 * @format
 */

import React from 'react';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { spacing } from '@/shared/theme';

import { DialogHost } from './DialogHost';
import { toastConfig } from './toast';

/** Keeps bottom toasts clear of the tab bar and screen footer buttons. */
const BOTTOM_CLEARANCE = 72;

export function FeedbackHost() {
  const insets = useSafeAreaInsets();
  return (
    <>
      <DialogHost />
      <Toast
        config={toastConfig}
        position="bottom"
        topOffset={insets.top + spacing.sm}
        bottomOffset={insets.bottom + BOTTOM_CLEARANCE}
      />
    </>
  );
}

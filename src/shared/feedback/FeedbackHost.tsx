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

export function FeedbackHost() {
  const insets = useSafeAreaInsets();
  return (
    <>
      <DialogHost />
      <Toast config={toastConfig} topOffset={insets.top + spacing.sm} />
    </>
  );
}

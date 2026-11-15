/**
 * Short, non-blocking messages ("Saved to gallery", "Could not save").
 * Use dialog instead when the user has to decide something.
 *
 *   toast.success('Saved to gallery');
 *   toast.error('Could not save video', error.message);
 *
 * @format
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Toast, {
  type ToastConfig,
  type ToastConfigParams,
} from 'react-native-toast-message';

import {
  CircleAlert,
  CircleCheck,
  ICON_SIZE,
  Info,
  type LucideIcon,
} from '@/shared/icons';
import { colors, radius, spacing } from '@/shared/theme';

type ToastKind = 'success' | 'error' | 'info';

const VISIBILITY_MS = { success: 2500, info: 3000, error: 4000 } as const;

function show(kind: ToastKind, title: string, message?: string) {
  Toast.show({
    type: kind,
    text1: title,
    text2: message,
    visibilityTime: VISIBILITY_MS[kind],
  });
}

export const toast = {
  success: (title: string, message?: string) => show('success', title, message),
  error: (title: string, message?: string) => show('error', title, message),
  info: (title: string, message?: string) => show('info', title, message),
  hide: () => Toast.hide(),
};

const KIND_STYLE: Record<ToastKind, { icon: LucideIcon; color: string }> = {
  success: { icon: CircleCheck, color: colors.success },
  error: { icon: CircleAlert, color: colors.danger },
  info: { icon: Info, color: colors.primary },
};

function ThemedToast({
  kind,
  text1,
  text2,
}: Pick<ToastConfigParams<unknown>, 'text1' | 'text2'> & { kind: ToastKind }) {
  const { icon: Icon, color } = KIND_STYLE[kind];
  return (
    <View
      accessibilityRole="alert"
      style={[styles.card, { borderLeftColor: color }]}
    >
      <Icon color={color} size={ICON_SIZE.md} />
      <View style={styles.texts}>
        {text1 ? (
          <Text style={styles.title} numberOfLines={2}>
            {text1}
          </Text>
        ) : null}
        {text2 ? (
          <Text style={styles.message} numberOfLines={3}>
            {text2}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export const toastConfig: ToastConfig = {
  success: params => <ThemedToast kind="success" {...params} />,
  error: params => <ThemedToast kind="error" {...params} />,
  info: params => <ThemedToast kind="info" {...params} />,
};

const styles = StyleSheet.create({
  card: {
    width: '92%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderLeftWidth: 4,
    backgroundColor: colors.surfaceRaised,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    elevation: 6,
    shadowColor: colors.black,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  texts: { flex: 1, gap: 2 },
  title: { color: colors.text, fontSize: 15, fontWeight: '600' },
  message: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
});

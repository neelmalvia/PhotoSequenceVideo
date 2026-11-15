/**
 * Icon button for navigation headers. The label is not shown but is used
 * for accessibility, so screen readers still announce "Delete", etc.
 *
 * @format
 */

import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { ICON_SIZE, ICON_STROKE, type LucideIcon } from '@/shared/icons';
import { colors } from '@/shared/theme';

interface HeaderButtonProps {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  tone?: 'default' | 'danger' | 'success';
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
}

const TONE_COLOR = {
  default: colors.text,
  danger: colors.danger,
  success: colors.success,
} as const;

export function HeaderButton({
  icon: Icon,
  label,
  onPress,
  tone = 'default',
  disabled = false,
  loading = false,
  testID,
}: HeaderButtonProps) {
  const inactive = disabled || loading;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      {loading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <Icon
          color={TONE_COLOR[tone]}
          size={ICON_SIZE.lg}
          strokeWidth={ICON_STROKE}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
});

/**
 * Small rounded label for facts like "5 photos" or "0:17", optionally with
 * an icon.
 *
 * @format
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ICON_SIZE, type LucideIcon } from '@/shared/icons';
import { colors, radius, spacing } from '@/shared/theme';

interface PillProps {
  label: string;
  icon?: LucideIcon;
}

export function Pill({ label, icon: Icon }: PillProps) {
  return (
    <View style={styles.pill}>
      {Icon ? <Icon color={colors.textMuted} size={ICON_SIZE.sm} /> : null}
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: spacing.sm + 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  label: { color: colors.text, fontSize: 13, fontWeight: '500' },
});

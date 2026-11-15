/**
 * Common screen header. Screens opt in by rendering it at the top:
 *
 *   <AppHeader title="My videos" onBack={navigation.goBack} />
 *
 * It handles the status-bar inset itself, so place it above the screen's
 * content (and use SafeAreaView with edges={['bottom']} for the rest).
 *
 * @format
 */

import React, { type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ArrowLeft, ChevronLeft, ICON_SIZE } from '@/shared/icons';
import { colors, spacing } from '@/shared/theme';

const BAR_HEIGHT = 56;
const BackIcon = Platform.OS === 'ios' ? ChevronLeft : ArrowLeft;

interface AppHeaderProps {
  title: string;
  /** Shows a back button when provided. */
  onBack?: () => void;
  /** Actions on the right, e.g. HeaderButtons. */
  right?: ReactNode;
  backgroundColor?: string;
  tintColor?: string;
}

export function AppHeader({
  title,
  onBack,
  right,
  backgroundColor = colors.background,
  tintColor = colors.text,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.container, { backgroundColor, paddingTop: insets.top }]}
    >
      <View style={styles.bar}>
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
            onPress={onBack}
            style={({ pressed }) => [styles.back, pressed && styles.pressed]}
          >
            <BackIcon color={tintColor} size={ICON_SIZE.lg} />
          </Pressable>
        ) : (
          <View style={styles.sideSpacer} />
        )}

        <Text
          accessibilityRole="header"
          numberOfLines={1}
          style={[styles.title, { color: tintColor }]}
        >
          {title}
        </Text>

        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  bar: {
    height: BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  back: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
  sideSpacer: { width: spacing.sm },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.xs,
  },
});

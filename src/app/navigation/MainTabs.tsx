/**
 * @format
 */

import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import {
  createBottomTabNavigator,
  type BottomTabBarButtonProps,
} from '@react-navigation/bottom-tabs';

import { SelectPhotosScreen } from '@/features/photo-selection/screens/SelectPhotosScreen';
import { LibraryScreen } from '@/features/video-library/screens/LibraryScreen';
import {
  selectVisibleCount,
  useLibraryStore,
} from '@/features/video-library/store/libraryStore';
import { Clapperboard, Film, ICON_SIZE, type LucideIcon } from '@/shared/icons';
import { colors } from '@/shared/theme';
import type { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

const tabIcon =
  (Icon: LucideIcon) =>
  ({ color }: { color: string }) =>
    <Icon color={color} size={ICON_SIZE.lg} />;

/**
 * Tab button without Android's ripple: the default button paints a grey
 * circle behind the tab on every press. The active tint is feedback enough.
 */
function TabBarButton({
  children,
  style,
  onPress,
  onLongPress,
  accessibilityState,
  accessibilityLabel,
  testID,
}: BottomTabBarButtonProps) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={accessibilityState}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      onPress={onPress}
      onLongPress={onLongPress}
      style={style}
    >
      {children}
    </Pressable>
  );
}

export function MainTabs() {
  const videoCount = useLibraryStore(selectVisibleCount);

  return (
    <Tab.Navigator
      initialRouteName="Create"
      screenOptions={{
        // Screens render their own header (shared/components/AppHeader).
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.label,
        tabBarButton: TabBarButton,
        // Mount both tabs up front so switching never shows an empty screen
        // while thumbnails load.
        lazy: false,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tab.Screen
        name="Create"
        component={SelectPhotosScreen}
        options={{ title: 'Create', tabBarIcon: tabIcon(Clapperboard) }}
      />
      <Tab.Screen
        name="Library"
        component={LibraryScreen}
        options={{
          title: 'My videos',
          tabBarIcon: tabIcon(Film),
          tabBarBadge: videoCount > 0 ? videoCount : undefined,
          tabBarBadgeStyle: styles.badge,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.background,
    borderTopColor: colors.divider,
    borderTopWidth: 1,
  },
  label: { fontSize: 12, fontWeight: '600' },
  badge: {
    backgroundColor: colors.primary,
    color: colors.onPrimary,
    fontSize: 11,
  },
});

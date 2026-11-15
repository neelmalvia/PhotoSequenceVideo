/**
 * @format
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ComposeScreen } from '@/features/video-composer/screens/ComposeScreen';
import { PreviewScreen } from '@/features/video-export/screens/PreviewScreen';
import { VideoPlayerScreen } from '@/features/video-library/screens/VideoPlayerScreen';
import { colors } from '@/shared/theme';
import { MainTabs } from './MainTabs';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Tabs"
      screenOptions={{
        // Screens render their own header (shared/components/AppHeader)
        // when they want one.
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        // On iOS each screen's view controller owns the status bar style.
        statusBarStyle: 'light',
      }}
    >
      <Stack.Screen name="Tabs" component={MainTabs} />
      <Stack.Screen
        name="Compose"
        component={ComposeScreen}
        // Leaving mid-render would cancel it, so require the Cancel button.
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen name="Preview" component={PreviewScreen} />
      <Stack.Screen
        name="Player"
        component={VideoPlayerScreen}
        options={{ contentStyle: { backgroundColor: colors.black } }}
      />
    </Stack.Navigator>
  );
}

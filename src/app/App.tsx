/**
 * @format
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useGalleryTrashSync } from '@/features/video-export/hooks/useGalleryTrashSync';
import { useLibraryStore } from '@/features/video-library/store/libraryStore';
import { FeedbackHost } from '@/shared/feedback';
import { colors } from '@/shared/theme';
import { RootNavigator } from './navigation/RootNavigator';

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.background,
    primary: colors.primary,
    text: colors.text,
    border: colors.border,
  },
};

export default function App() {
  // Load saved videos once at startup so the count and list are ready.
  useEffect(() => {
    useLibraryStore.getState().load();
  }, []);

  // Restoring a deleted video in the gallery brings it back in the app.
  useGalleryTrashSync();

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <NavigationContainer theme={navigationTheme}>
        <RootNavigator />
      </NavigationContainer>
      {/* Toasts and dialogs render above every screen. */}
      <FeedbackHost />
    </SafeAreaProvider>
  );
}

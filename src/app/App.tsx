/**
 * @format
 */

import React, { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useGalleryTrashSync } from '@/features/video-export/hooks/useGalleryTrashSync';
import { useLibraryStore } from '@/features/video-library/store/libraryStore';
import { FeedbackHost } from '@/shared/feedback';
import { colors } from '@/shared/theme';
import { AnimatedSplash } from './AnimatedSplash';
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

  // Hand the native splash to AnimatedSplash once navigation has mounted and
  // the library has loaded, so the first screen appears complete (tab badge
  // included) as the splash zooms away.
  const [navigationReady, setNavigationReady] = useState(false);
  const [splashVisible, setSplashVisible] = useState(true);
  const libraryLoaded = useLibraryStore(
    s => s.status === 'ready' || s.status === 'error',
  );

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <NavigationContainer
        theme={navigationTheme}
        onReady={() => setNavigationReady(true)}
      >
        <RootNavigator />
      </NavigationContainer>
      {/* Toasts and dialogs render above every screen. */}
      <FeedbackHost />
      {splashVisible && (
        <AnimatedSplash
          ready={navigationReady && libraryLoaded}
          onAnimationEnd={() => setSplashVisible(false)}
        />
      )}
    </SafeAreaProvider>
  );
}

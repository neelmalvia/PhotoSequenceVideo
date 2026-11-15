/**
 * Takes over from the native splash screen with an identical React overlay,
 * then grows the logo while fading everything out, so launch feels like
 * zooming into the app instead of a hard cut.
 *
 * react-native-bootsplash's useHideAnimation hides the native splash only once
 * this overlay is laid out, so there is no flash between the two.
 *
 * @format
 */

import React, { useState } from 'react';
import { Animated, Easing } from 'react-native';
import BootSplash from 'react-native-bootsplash';

const GROW_MS = 600;
const FADE_DELAY_MS = 150;
const FADE_MS = 450;
const END_SCALE = 2.6;

interface AnimatedSplashProps {
  /** Start the animation once the app behind is ready to be seen. */
  ready: boolean;
  onAnimationEnd: () => void;
}

export function AnimatedSplash({ ready, onAnimationEnd }: AnimatedSplashProps) {
  const [opacity] = useState(() => new Animated.Value(1));
  const [scale] = useState(() => new Animated.Value(1));

  const { container, logo } = BootSplash.useHideAnimation({
    ready,
    manifest: require('../../assets/bootsplash/manifest.json'),
    logo: require('../../assets/bootsplash/logo.png'),
    // No status/navigation bar flags: the app is edge to edge, which
    // bootsplash detects on its own to line the overlay up with the native
    // splash.
    animate: () => {
      Animated.parallel([
        Animated.timing(scale, {
          toValue: END_SCALE,
          duration: GROW_MS,
          easing: Easing.bezier(0.33, 0, 0.2, 1),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          delay: FADE_DELAY_MS,
          duration: FADE_MS,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(() => onAnimationEnd());
    },
  });

  return (
    <Animated.View
      {...container}
      pointerEvents="none"
      style={[container.style, { opacity }]}
    >
      <Animated.Image
        {...logo}
        style={[logo.style, { transform: [{ scale }] }]}
      />
    </Animated.View>
  );
}

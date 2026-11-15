/**
 * @format
 */

import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type {
  CompositeScreenProps,
  NavigatorScreenParams,
} from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

/** The bottom tabs. */
export type TabParamList = {
  Create: undefined;
  Library: undefined;
};

/**
 * The root stack. Tabs is the base; the other screens are full-screen flows
 * pushed above it, so the tab bar is hidden while they're open.
 */
export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  Compose: undefined;
  /** Shown right after rendering. */
  Preview: { videoId: string };
  /** Fullscreen playback of a library video. */
  Player: { videoId: string };
};

export type RootScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

/** Tab screens can also navigate to the root stack's screens. */
export type TabScreenProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  RootScreenProps<keyof RootStackParamList>
>;

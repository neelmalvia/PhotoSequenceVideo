# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

Freshly bootstrapped React Native 0.88 app (`@react-native-community/cli` template), TypeScript, React 19. No app-specific code yet: `App.tsx` still renders the template's `NewAppScreen`. The project name suggests the goal is turning a sequence of photos into a video.

Package manager: **Yarn** (`yarn.lock` is present; `package-lock.json` has been deleted). Node >= 22.11.

## Commands

```sh
yarn start                  # Metro bundler (run it before launching a platform)
yarn android                # build + run on Android emulator/device
yarn ios                    # build + run on iOS simulator
yarn lint                   # ESLint (@react-native config)
yarn test                   # Jest (@react-native/jest-preset)
yarn test __tests__/App.test.tsx      # single test file
yarn test -t "renders correctly"      # single test by name
npx tsc --noEmit            # type-check (there's no script for it)
```

iOS native deps (on first clone and whenever native deps change):

```sh
bundle install              # once, installs CocoaPods via the Gemfile
cd ios && bundle exec pod install
```

## Architecture

- `index.js` registers `App` under the name from `app.json` (`PhotoSequenceVideo`). That name has to match the native module name used in `android/.../MainActivity.kt` and on the iOS side.
- `App.tsx` is the root component, wrapped in `SafeAreaProvider` from `react-native-safe-area-context`.
- The New Architecture (Fabric/TurboModules) and Hermes are on (`android/gradle.properties`). Any native library you add for photo or video processing has to support the New Architecture.
- iOS uses Swift (`AppDelegate.swift` plus `SceneDelegate.swift`). Android uses Kotlin under `com.photosequencevideo`.
- Tests go in `__tests__/` and render components with `react-test-renderer` inside `act()`.

## Style

Prettier: single quotes, trailing commas everywhere, `arrowParens: 'avoid'`. Source files carry a `@format` header comment.

## Commit messages

- Write them the way a human developer would: a short, plain summary line in the imperative mood (e.g. `Add photo picker screen`, `Fix crash when sequence is empty`). Add a body only when the reason for the change isn't obvious, and keep it brief.
- No AI attribution of any kind. That means no `Co-Authored-By: Claude` trailer, no "Generated with Claude Code" line, no robot emoji, and no mention of Claude or AI. The same applies to PR descriptions.
- No emoji, no filler ("This commit…"), and no long bullet-point changelogs for small changes.

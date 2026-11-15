# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

React Native 0.88 app (TypeScript, React 19) that turns 3–5 gallery photos into a 720×1280 video with dissolve and slide transitions and background music, keeps the results in an in-app library, and saves them to the gallery. Code lives under `src/` by feature (`photo-selection`, `video-composer`, `video-export`, `video-library`) plus `src/shared`. `docs/PROJECT_GUIDE.md` has the flow chart, source index, recording constraints and known limitations; read it before changing rendering or the library.

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
yarn typecheck              # tsc --noEmit
yarn android:apk            # release APK (JS bundled, no Metro) -> dist/PhotoSequenceVideo.apk
yarn android:apk:install    # install dist APK on the USB-connected phone (adb -d)
yarn android:apk:device     # both of the above
yarn android:clean          # gradle clean
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
- User feedback goes through `@/shared/feedback`, never `Alert`: `toast.success/error/info` for short messages, `dialog.confirm/show/alert` for popups that need a decision. `FeedbackHost` is mounted once in `src/app/App.tsx`.

## Style

Prettier: single quotes, trailing commas everywhere, `arrowParens: 'avoid'`. Source files carry a `@format` header comment.

## Commit messages

- Write them the way a human developer would: a short, plain summary line in the imperative mood (e.g. `Add photo picker screen`, `Fix crash when sequence is empty`). Add a body only when the reason for the change isn't obvious, and keep it brief.
- No AI attribution of any kind. That means no `Co-Authored-By: Claude` trailer, no "Generated with Claude Code" line, no robot emoji, and no mention of Claude or AI. The same applies to PR descriptions.
- No emoji, no filler ("This commit…"), and no long bullet-point changelogs for small changes.

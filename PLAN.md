# Photo Sequence Video: Implementation Plan

> **Status:** implemented on Android (Path A: `react-native-view-recorder`, rendering with React Native views rather than Skia). This file is the original plan; for how the app works now, see [docs/PROJECT_GUIDE.md](docs/PROJECT_GUIDE.md).

**Window:** 15/11/2026, 09:00 – 17:00

## Task

Build a feature where a user can:

- Select 3–5 photos from their device gallery.
- Create a video where the photos are animated with dissolve and slide transitions, with a default background music track.
- Export the final output as a video file.

Priority: get the feature working end to end first, then improve the UI.

## Approach

The hard part is making the video on the device: drawing frames with transitions, encoding them to MP4, adding the music and saving the file.

### What the industry uses (research, 15/11/2026)

| Approach | Who uses it | Fit for us |
| --- | --- | --- |
| **FFmpeg** (`xfade` filter: `fade`, `slideleft`, ...) | The classic mobile route, via `ffmpeg-kit` | **No.** `ffmpeg-kit` was retired and archived; its binaries are gone. The official successor, FFmpegKitNext (v9.0.2, Oct 2026), publishes **no prebuilt packages**, so we'd have to build FFmpeg from source. Too slow for one day. |
| **Native platform APIs** (AVFoundation on iOS, MediaCodec or Media3 on Android) | Production editors (CapCut-style apps), and libraries under the hood | **Yes, as the fallback.** Media3 Transformer can sequence images with background audio but **doesn't support crossfades between items yet**, so on Android we'd still draw frames ourselves with MediaCodec. |
| **Skia canvas + native encoder** (`@shopify/react-native-skia` + `react-native-view-recorder`) | Modern RN approach: draw frames in JS, encode natively | **Yes, try first.** The recorder uses AVAssetWriter (iOS) and MediaCodec (Android) with hardware H.264, **muxes an audio file**, and is built on Fabric/TurboModules. One JS implementation of the transitions covers both platforms. |
| **Cloud rendering APIs** (Shotstack, Creatomate, Remotion Lambda) | SaaS and marketing video generation at scale | **No.** Needs a backend, photo uploads and API keys, and it doesn't produce the video on the device. Worth mentioning in the README as the scale-out option. |

### Chosen approach

**Primary: Skia + react-native-view-recorder.** Render each frame on a Skia `Canvas` inside a `RecordingView`, record frame by frame (`fps`, `totalFrames`, `onFrame`), and mux the bundled music in the same pass. The transitions are plain JS math:

- For each frame, work out which photo or photos are visible and how far into the transition we are (`t` from 0 to 1).
- **Dissolve:** draw photo A, then photo B on top at opacity `t`.
- **Slide:** draw A at x offset `-t * width` and B at `(1 - t) * width`.

**Risks to check in the spike (CP2):**

- The library is young (v0.4.1, ~126 GitHub stars).
- It lists `expo >= 54` as a peer dependency. A bare RN app may need `npx install-expo-modules`.
- Skia 2.x requires `react-native-reanimated >= 4` and `react-native-worklets`.
- RN 0.88 compatibility isn't confirmed for any of these.

**Fallback: our own native module** `createVideo(photoPaths, options) -> outputPath`, using the same frame math:

- **iOS:** CoreGraphics draws into `AVAssetWriter`, then `AVMutableComposition` adds the music and exports.
- **Android:** `MediaCodec` with an input Surface, drawing on its Canvas. `MediaMuxer` writes the file, and the music's AAC samples are copied in with `MediaExtractor` (no re-encoding).

**Decision rule:** if the spike gives a playable MP4 with audio on iOS by **11:00**, keep the primary approach. Otherwise switch to the fallback, iOS first.

### Default output spec

| Setting | Value |
| --- | --- |
| Resolution | 720 × 1280 (portrait) |
| Frame rate | 30 fps |
| Hold per photo | ~2.5 s |
| Transition | 1 s, alternating dissolve and slide |
| Audio | Bundled `.m4a` (AAC), trimmed to video length, short fade-out |

A 4-photo video comes to about 13 s.

## Checkpoints

### CP0: Setup (09:00–09:30)

- [ ] Install `react-native-image-picker`, `react-native-video` (preview) and `@react-native-camera-roll/camera-roll` (save to gallery)
- [ ] Add a royalty-free music file as `.m4a` (AAC): iOS bundle resource and Android `res/raw`
- [ ] Permissions: iOS `NSPhotoLibraryUsageDescription` and `NSPhotoLibraryAddUsageDescription`; Android storage permission for API < 29 only
- [ ] `pod install` and confirm both apps still build

### CP1: Photo selection (09:30–10:15)

- [ ] Gallery picker with `selectionLimit: 5`
- [ ] Check for 3–5 photos in JS and show an error message otherwise
- [ ] Copy picks to local file paths; convert HEIC to JPEG on iOS
- [ ] Basic thumbnail list, plus a "Create Video" button that stays disabled until 3+ photos are picked

### CP2: Recorder spike (10:15–11:00, hard stop)

- [ ] Install `@shopify/react-native-skia`, `react-native-reanimated`, `react-native-worklets`, `react-native-view-recorder` (plus Expo modules if required)
- [ ] `pod install` and build on iOS
- [ ] Record a 3 s test clip (a moving shape) with the music muxed in, then play it back
- [ ] **Decision at 11:00:** keep Path A, or switch to Path B

### Path A: Skia + recorder (if the spike passes)

#### CP3A: Frame renderer and transitions (11:00–12:45)

- [ ] Load images as Skia images, downscaled, with EXIF orientation handled
- [ ] Timeline function: frame index -> `{ photoA, photoB, t, transition }`
- [ ] Draw hold frames (aspect-fit on black), dissolve and slide
- [ ] Record the full sequence with music, trimmed to the video length
- [ ] **Milestone: working video on iOS**

#### CP4A: Android check (12:45–13:30)

- [ ] Build and run on Android, then fix any platform issues (memory, image decoding)
- [ ] **Milestone: working video on both platforms.** The ~1 h saved goes to polish.

### Path B: Own native module (if the spike fails)

#### CP3B: iOS video engine (11:00–12:45)

- [ ] Turbo/native module `VideoComposer.createVideo(paths, opts): Promise<string>`
- [ ] Load and downscale images, fix EXIF orientation, aspect-fit onto a black canvas
- [ ] Frame loop with hold and transition timing, dissolve and slide
- [ ] `AVAssetWriter` writes the silent MP4
- [ ] Merge the music track, trimmed to length, and export the final MP4
- [ ] **Milestone: working video on iOS**

#### CP4B: Android video engine (12:45–14:30)

- [ ] Same image loading and orientation fix (Bitmap + `ExifInterface`)
- [ ] `MediaCodec` H.264 encoder with a Surface and `lockCanvas` frame loop, same timing and transition code
- [ ] `MediaMuxer` writes the video track, then the music AAC track through `MediaExtractor`, trimmed
- [ ] **Milestone: working video on Android**

### CP5: Preview and export (14:30–15:15)

- [ ] Progress or loading state while rendering (frame progress events if time allows)
- [ ] Play the result with `react-native-video`
- [ ] Save to the gallery with CameraRoll, plus a Share button to export the file
- [ ] **Milestone: feature complete end to end**

### CP6: UI polish (15:15–16:15)

- [ ] Cleaner flow: Pick, then Preview, then Export
- [ ] Reorder or remove selected photos
- [ ] Optional: Ken Burns slow zoom during the hold; blurred background instead of black bars

### CP7: Wrap-up (16:15–17:00)

- [ ] Test on real devices: large photos, portrait and landscape, exactly 3 and exactly 5 photos
- [ ] Handle edge cases: picker cancelled, render failure, temp file cleanup
- [ ] README: how to run, design choices, limitations, plus a sample output video or recording
- [ ] Final commit and submit

## Known gotchas

- **EXIF rotation:** phone photos come out sideways if orientation is ignored.
- **Memory:** load images downscaled. Five full 12MP bitmaps will crash Android.
- **Android encoder:** width and height must be multiples of 16, and the encoder must be drained on time or it stalls.
- **iOS frame timing:** respect `AVAssetWriterInput.isReadyForMoreMediaData`, or frames get dropped.

## Open question

Does the submission need both iOS and Android, or just one? On Path A both come almost for free. On Path B, if one platform is enough, CP4B drops out and its ~2 hours go to polish.

## Sources

- [ffmpeg-kit (archived)](https://github.com/arthenica/ffmpeg-kit) and [author's retirement post](https://tanersener.medium.com/saying-goodbye-to-ffmpegkit-33ae939767e1)
- [FFmpegKitNext: source-only, no prebuilt packages](https://github.com/arthenica/ffmpeg-kit-next)
- [Media3 Transformer multi-asset editing (no crossfade yet)](https://developer.android.com/media/media3/transformer/multi-asset)
- [Media3 Composition docs](https://developer.android.com/media/media3/transformer/composition)
- [react-native-view-recorder](https://github.com/Rednegniw/react-native-view-recorder)
- [img.ly: videos from still images with AVFoundation](https://img.ly/blog/how-to-make-videos-from-still-images-with-avfoundation-and-swift)
- [Shotstack slideshow API](https://shotstack.io/learn/turn-images-into-slideshow-video-nodejs) and [Remotion server-side rendering](https://www.remotion.dev/docs/renderer)

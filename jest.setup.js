/* eslint-env jest */
/**
 * Mocks for native modules that don't exist in the Jest environment.
 *
 * @format
 */

jest.mock('react-native-view-recorder', () => {
  const { View } = require('react-native');
  return {
    RecordingView: View,
    AbortError: class AbortError extends Error {},
    useViewRecorder: () => ({
      sessionId: 'test-session',
      record: jest.fn(() => Promise.resolve('/tmp/out.mp4')),
      stop: jest.fn(),
      snapshot: jest.fn(),
    }),
  };
});

jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(() => Promise.resolve({ didCancel: true })),
}));

jest.mock('@dr.pogodin/react-native-fs', () => ({
  CachesDirectoryPath: '/cache',
  DocumentDirectoryPath: '/docs',
  MainBundlePath: '/bundle',
  readFile: jest.fn(() => Promise.resolve('')),
  writeFile: jest.fn(() => Promise.resolve()),
  moveFile: jest.fn(() => Promise.resolve()),
  exists: jest.fn(() => Promise.resolve(true)),
  mkdir: jest.fn(() => Promise.resolve()),
  readDir: jest.fn(() => Promise.resolve([])),
  unlink: jest.fn(() => Promise.resolve()),
  copyFileAssets: jest.fn(() => Promise.resolve()),
}));

jest.mock('@react-native-camera-roll/camera-roll', () => ({
  CameraRoll: {
    saveAsset: jest.fn(() =>
      Promise.resolve({ node: { image: { uri: 'ph://saved-asset' } } }),
    ),
    deletePhotos: jest.fn(() => Promise.resolve()),
  },
  iosReadGalleryPermission: jest.fn(() => Promise.resolve('granted')),
  iosRequestReadWriteGalleryPermission: jest.fn(() =>
    Promise.resolve('granted'),
  ),
}));

jest.mock('react-native-video', () => {
  const { View } = require('react-native');
  return { __esModule: true, default: View };
});

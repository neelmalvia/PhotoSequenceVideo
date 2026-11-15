module.exports = {
  root: true,
  extends: '@react-native',
  rules: {
    // React Navigation's options take render functions (headerRight, etc.).
    'react/no-unstable-nested-components': ['warn', { allowAsProps: true }],
  },
};

/**
 * Jest stand-in for a single Lucide icon (react-native-svg has no renderer
 * in the test environment).
 *
 * @format
 */

const React = require('react');
const { View } = require('react-native');

const Icon = props => React.createElement(View, { testID: 'icon', ...props });

module.exports = { __esModule: true, default: Icon };

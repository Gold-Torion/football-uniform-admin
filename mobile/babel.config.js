// Babel config for Expo + NativeWind v4 + Reanimated.
// The order matters: nativewind/babel must come before the Reanimated plugin
// (which itself must be the LAST plugin in the array).
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [
      'react-native-reanimated/plugin',
    ],
  };
};

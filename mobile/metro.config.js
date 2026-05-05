// Metro config for Expo with NativeWind v4.
// `withNativeWind` injects the CSS pipeline that ships Tailwind classes to RN.
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });

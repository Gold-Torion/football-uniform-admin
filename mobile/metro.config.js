// Metro config for Expo with NativeWind v4.
// `withNativeWind` injects the CSS pipeline that ships Tailwind classes to RN.
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// On web, replace native-only packages with stubs so the build succeeds.
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    if (moduleName === '@react-native-google-signin/google-signin') {
      return {
        type: 'sourceFile',
        filePath: path.resolve(__dirname, './src/shims/google-signin.web.js'),
      };
    }
    if (moduleName === 'expo-secure-store') {
      return {
        type: 'sourceFile',
        filePath: path.resolve(__dirname, './src/shims/expo-secure-store.web.js'),
      };
    }
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

// Apply NativeWind CSS pipeline — use global.native.css for Android/iOS
// (minimal, no web-only media queries) to avoid CSS parse errors on mobile.
const isWeb = process.env.EXPO_PUBLIC_PLATFORM === 'web';
module.exports = withNativeWind(config, {
  input: isWeb ? './global.css' : './global.native.css',
});

// Metro config for Expo with NativeWind v4.
// `withNativeWind` injects the CSS pipeline that ships Tailwind classes to RN.
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Replace native-only packages with stubs for platforms that don't support them.
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Android: stub out @react-native-google-signin (uses expo-auth-session instead)
  if (platform === 'android' && moduleName === '@react-native-google-signin/google-signin') {
    return {
      type: 'sourceFile',
      filePath: path.resolve(__dirname, './src/shims/google-signin.web.js'),
    };
  }
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

// Use global.css for all platforms — web-specific CSS uses 100% instead of
// 100dvh to avoid react-native-css-interop parse errors on Android.
module.exports = withNativeWind(config, { input: './global.css' });

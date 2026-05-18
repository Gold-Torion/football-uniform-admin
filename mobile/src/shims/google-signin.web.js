// Web stub for @react-native-google-signin/google-signin
// Google Sign-In is not available in the web demo build.
const noop = () => Promise.resolve(null);

export const GoogleSignin = {
  configure: () => {},
  hasPlayServices: () => Promise.resolve(true),
  signIn: () => Promise.reject(new Error('Google Sign-In not available on web')),
  signOut: noop,
  isSignedIn: () => Promise.resolve(false),
  getCurrentUser: () => null,
};

export const statusCodes = {
  SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
  IN_PROGRESS: 'IN_PROGRESS',
  PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  SIGN_IN_REQUIRED: 'SIGN_IN_REQUIRED',
};

export const GoogleSigninButton = () => null;

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AuthStackParamList } from './types';

import { SignInScreen } from '../screens/auth/SignInScreen';
import { VerifyPhoneScreen } from '../screens/auth/VerifyPhoneScreen';
import { VerifyCpfScreen } from '../screens/auth/VerifyCpfScreen';
import { LgpdConsentScreen } from '../screens/auth/LgpdConsentScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

/**
 * Onboarding stack. Order matches the contracted Etapa 1 user journey:
 * Sign-in → Verify Phone → Verify CPF → LGPD consent → main app.
 *
 * The transition between Auth and Main is decided by RootNavigator based on
 * the auth state, not by an explicit `navigate('Main')` call from inside the
 * stack.
 */
export function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#335336' } }}
    >
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="VerifyPhone" component={VerifyPhoneScreen} />
      <Stack.Screen name="VerifyCpf" component={VerifyCpfScreen} />
      <Stack.Screen
        name="LgpdConsent"
        component={LgpdConsentScreen}
        options={{ presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}

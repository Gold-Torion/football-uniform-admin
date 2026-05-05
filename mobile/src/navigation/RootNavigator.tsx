import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuthStore } from '../store/auth.store';
import { SignInScreen } from '../screens/auth/SignInScreen';
import { EmailSignInScreen } from '../screens/auth/EmailSignInScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';
import { TotpLoginScreen } from '../screens/auth/TotpLoginScreen';
import { VerifyPhoneScreen } from '../screens/auth/VerifyPhoneScreen';
import { VerifyCpfScreen } from '../screens/auth/VerifyCpfScreen';
import { LgpdConsentScreen } from '../screens/auth/LgpdConsentScreen';
import { MainTabs } from './MainTabs';
import { ListingDetailScreen } from '../screens/listing/ListingDetailScreen';
import { SellerProfileScreen } from '../screens/seller/SellerProfileScreen';
import { RateOrderScreen } from '../screens/rating/RateOrderScreen';
import { AdminReportsScreen } from '../screens/admin/AdminReportsScreen';
import { CheckoutScreen } from '../screens/orders/CheckoutScreen';
import { OrdersScreen } from '../screens/orders/OrdersScreen';
import { OrderDetailScreen } from '../screens/orders/OrderDetailScreen';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const s = (c: any) => c;
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator();

/**
 * RootNavigator decides which screen to show based on the auth store state.
 * No manual navigation.navigate() calls needed — when setSession() updates
 * the store, this navigator automatically shows the correct next screen.
 *
 * Flow:
 *   no token       → SignIn
 *   token, no phone → VerifyPhone
 *   token, no cpf   → VerifyCpf
 *   token, no lgpd  → LgpdConsent
 *   all complete    → MainTabs
 */
export function RootNavigator() {
  const hydrated       = useAuthStore((s) => s.hydrated);
  const accessToken    = useAuthStore((s) => s.accessToken);
  const totpTempToken  = useAuthStore((s) => s.totpTempToken);
  const user           = useAuthStore((s) => s.user);
  const hydrate        = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.arenaVerde }}>
        <ActivityIndicator size="large" color={colors.arenaDourado} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {totpTempToken ? (
          <Stack.Screen name="TotpLogin"   component={s(TotpLoginScreen)} />
        ) : !accessToken ? (
          <>
            <Stack.Screen name="SignIn"      component={s(SignInScreen)} />
            <Stack.Screen name="EmailSignIn" component={s(EmailSignInScreen)} />
            <Stack.Screen name="SignUp"      component={s(SignUpScreen)} />
          </>
        ) : !user?.lgpdConsentAt ? (
          <Stack.Screen name="LgpdConsent" component={s(LgpdConsentScreen)} />
        ) : (
          <>
            <Stack.Screen name="Main"          component={s(MainTabs)} />
            <Stack.Screen name="ListingDetail" component={s(ListingDetailScreen)}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen name="SellerProfile" component={s(SellerProfileScreen)}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen name="RateOrder" component={s(RateOrderScreen)}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen name="AdminReports" component={s(AdminReportsScreen)}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen name="Checkout" component={s(CheckoutScreen)}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen name="Orders" component={s(OrdersScreen)}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen name="OrderDetail" component={s(OrderDetailScreen)}
              options={{ animation: 'slide_from_right' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

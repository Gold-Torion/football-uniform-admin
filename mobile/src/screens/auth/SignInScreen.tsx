import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';

WebBrowser.maybeCompleteAuthSession();

GoogleSignin.configure({
  webClientId: '281984451863-eo8u5kpoe0sugt0et3ctcpsqegq4997l.apps.googleusercontent.com',
  offlineAccess: true,
});
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/auth.store';
import { AuthApi } from '../../api/auth';
import { BrandLogo } from '../../components/BrandLogo';
import { FeatureChips } from '../../components/FeatureChips';
import { GoogleIcon } from '../../components/BrandIcons';
import { Mail } from 'lucide-react-native';

WebBrowser.maybeCompleteAuthSession();


type Props = NativeStackScreenProps<AuthStackParamList, 'SignIn'>;

async function devSkipAuth(setSession: ReturnType<typeof useAuthStore.getState>['setSession']) {
  await setSession({
    accessToken: 'dev.preview.access.token',
    refreshToken: 'dev.preview.refresh.token',
    user: {
      userId: 'DEVPREVIEW0000000000000000',
      displayName: 'Marcos Silveira (DEV)',
      email: 'dev@arenadosmantos.local',
      phoneE164: '+5511999999999',
      cpf: '00000000000',
      lgpdConsentAt: new Date().toISOString(),
      ratingCountAsSeller: 0,
      ratingCountAsBuyer: 0,
      listingsActiveCount: 0,
      mpcPurchasesCount: 0,
      totpEnabled: false,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    },
  });
}

export function SignInScreen({ navigation }: Props) {
  const [busy, setBusy] = useState(false);
  const setSession       = useAuthStore((s) => s.setSession);
  const setTotpTempToken = useAuthStore((s) => s.setTotpTempToken);
  const enterAsGuest     = useAuthStore((s) => s.enterAsGuest);

  // expo-auth-session for Android (browser-based, no native module needed)
  const [, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
    androidClientId: '265836821890-kvvbh3o5nbv4uurcum4lurn0gp79c4t4.apps.googleusercontent.com',
    webClientId:     '281984451863-eo8u5kpoe0sugt0et3ctcpsqegq4997l.apps.googleusercontent.com',
    scopes: ['openid', 'profile', 'email'],
  });

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const token = googleResponse.params?.id_token ?? googleResponse.params?.access_token;
      if (token) {
        setBusy(true);
        AuthApi.google(token, 'android')
          .then(async (result) => {
            if ('totpRequired' in result) {
              setTotpTempToken(result.tempToken);
            } else {
              await setSession(result);
            }
          })
          .catch(() => Alert.alert('Erro', 'Não foi possível fazer login com Google.'))
          .finally(() => setBusy(false));
      }
    }
  }, [googleResponse]);

  // Entrance animations
  const taglineY       = useSharedValue(12);
  const taglineOpacity = useSharedValue(0);
  const ctaY           = useSharedValue(20);
  const ctaOpacity     = useSharedValue(0);

  useEffect(() => {
    taglineY.value       = withDelay(420, withTiming(0, { duration: 480, easing: Easing.out(Easing.cubic) }));
    taglineOpacity.value = withDelay(420, withTiming(1, { duration: 480 }));
    ctaY.value           = withDelay(640, withTiming(0, { duration: 520, easing: Easing.out(Easing.cubic) }));
    ctaOpacity.value     = withDelay(640, withTiming(1, { duration: 520 }));
  }, [taglineY, taglineOpacity, ctaY, ctaOpacity]);

  const taglineStyle = useAnimatedStyle(() => ({
    opacity:   taglineOpacity.value,
    transform: [{ translateY: taglineY.value }],
  }));
  const ctaStyle = useAnimatedStyle(() => ({
    opacity:   ctaOpacity.value,
    transform: [{ translateY: ctaY.value }],
  }));

  const onApple = async () => {
    setBusy(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      const fullName = credential.fullName
        ? [credential.fullName.givenName, credential.fullName.familyName].filter(Boolean).join(' ')
        : undefined;
      const result = await AuthApi.apple(credential.identityToken!, fullName);
      if ('totpRequired' in result) {
        setTotpTempToken(result.tempToken);
      } else {
        await setSession(result);
      }
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e.code === 'ERR_REQUEST_CANCELED') return;
      Alert.alert('Erro', 'Não foi possível fazer login com Apple. Tente novamente.');
    } finally {
      setBusy(false);
    }
  };

  const onGoogle = async () => {
    if (Platform.OS === 'android') {
      await promptGoogleAsync();
      return;
    }
    setBusy(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;
      if (!idToken) throw new Error('No idToken received');
      const result = await AuthApi.google(idToken, Platform.OS as 'ios' | 'web');
      if ('totpRequired' in result) {
        setTotpTempToken(result.tempToken);
      } else {
        await setSession(result);
      }
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e.code === statusCodes.SIGN_IN_CANCELLED) return;
      Alert.alert('Erro', 'Não foi possível fazer login com o Google. Tente novamente.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="flex-1">
      <LinearGradient
        colors={['#335336', '#2A4429', '#211B15']}
        locations={[0, 0.6, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -60,
          left: '50%',
          marginLeft: -180,
          width: 360,
          height: 360,
          borderRadius: 180,
          backgroundColor: '#D4AF37',
          opacity: 0.08,
        }}
      />

      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <View className="flex-1 justify-between">
          {/* ── Top ───────────────────────────────────────────────── */}
          <View className="pt-6">
            <View className="items-center">
              <BrandLogo size={290} />
            </View>

            <Animated.View style={taglineStyle} className="px-8 mt-2 items-center">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 4 }}>
                <View style={{ height: 1, width: 32, backgroundColor: '#D4AF37', opacity: 0.6 }} />
                <View style={{ height: 6, width: 6, borderRadius: 3, backgroundColor: '#D4AF37' }} />
                <View style={{ height: 1, width: 32, backgroundColor: '#D4AF37', opacity: 0.6 }} />
              </View>
              <Text style={{ color: '#EAEAEA' }} className="text-[14px] leading-[22px] text-center max-w-[300px] font-semibold">
                Compre, venda e colecione camisas autênticas de futebol.
              </Text>
            </Animated.View>

            <Animated.View style={taglineStyle} className="mt-7 px-4">
              <FeatureChips />
            </Animated.View>
          </View>

          {/* ── Bottom: CTAs ──────────────────────────────────────── */}
          <Animated.View style={ctaStyle} className="px-6 pb-6">
            {/* Google Sign-In — all platforms */}
            <Pressable
              onPress={onGoogle}
              disabled={busy}
              className="flex-row items-center justify-center gap-3 bg-white rounded-2xl py-[14px] mb-3 active:opacity-80"
              style={{ shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 8 }}
            >
              <GoogleIcon size={20} />
              <Text className="text-ink-1 font-bold text-[15px]">Continuar com Google</Text>
            </Pressable>

            {/* Apple Sign In — iOS only */}
            {Platform.OS === 'ios' && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                cornerRadius={16}
                style={{ width: '100%', height: 50, marginTop: 10 }}
                onPress={onApple}
              />
            )}

            {/* E-mail */}
            <Pressable
              onPress={() => navigation.navigate('EmailSignIn')}
              disabled={busy}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                paddingVertical: 14,
                alignItems: 'center',
                marginTop: 10,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginRight: 30 }}>
                <Mail size={20} color="#1C1A14" />
                <Text style={{ color: '#1C1A14', fontWeight: '700', fontSize: 15 }}>Entrar com e-mail</Text>
              </View>
            </Pressable>

            {busy && <ActivityIndicator color="#D4AF37" className="mt-3" />}

            {/* Guest entry */}
            <Pressable
              onPress={enterAsGuest}
              disabled={busy}
              style={{ alignItems: 'center', marginTop: 18 }}
            >
              <Text style={{ color: '#EAEAEA', fontSize: 13, opacity: 0.7 }}>
                Entrar sem login
              </Text>
            </Pressable>

            <Text className="text-center mt-5 text-arena-dourado-claro/60 text-[11px] leading-[16px]">
              Ao continuar você aceita nossa{' '}
              <Text className="text-arena-dourado font-semibold">Política de Privacidade</Text>
              {' '}e os{' '}
              <Text className="text-arena-dourado font-semibold">Termos de Uso</Text>.
            </Text>

            {__DEV__ && (
              <View className="mt-5 pt-4" style={{ borderTopWidth: 1, borderColor: 'rgba(212,175,55,0.18)', borderStyle: 'dashed' }}>
                <Text className="text-arena-dourado/50 text-[10px] uppercase font-bold tracking-[1.5px] mb-2 text-center">
                  Dev preview
                </Text>
                <Pressable
                  onPress={() => devSkipAuth(setSession)}
                  className="rounded-xl py-2.5 items-center"
                  style={{ backgroundColor: 'rgba(212,175,55,0.06)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.20)' }}
                >
                  <Text className="text-arena-dourado-claro/80 font-semibold text-[13px]">Skip auth → Main tabs</Text>
                </Pressable>
              </View>
            )}
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

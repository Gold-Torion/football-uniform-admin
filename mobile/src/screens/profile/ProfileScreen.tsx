import { useEffect, useRef, useState } from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { ShoppingBag, Shield, ShieldOff, Camera, AtSign, MapPin } from 'lucide-react-native';

import { useAuthStore } from '../../store/auth.store';
import { QRScannerScreen } from '../coupon/QRScannerScreen';
import { TotpSetupScreen } from '../auth/TotpSetupScreen';
import { RatingsApi, type UserRatingSummary } from '../../api/ratings';
import { UsersApi } from '../../api/users';
import type { RootStackParamList } from '../../navigation/types';

const APP_VERSION = '1.0.0';
const PRIVACY_URL = 'http://localhost:3001/privacidade';
const INSTAGRAM_USERNAME = 'arenadosmantos.app';
const INSTAGRAM_APP_URL  = `instagram://user?username=${INSTAGRAM_USERNAME}`;
const INSTAGRAM_WEB_URL  = `https://www.instagram.com/${INSTAGRAM_USERNAME}`;

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function Row({ label, value, onPress, danger, icon }: {
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: pressed ? '#F4EFE3' : '#fff',
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
        {icon}
        <Text style={{ fontSize: 15, color: danger ? '#EF4444' : '#1C1A14', fontWeight: danger ? '600' : '400' }}>
          {label}
        </Text>
      </View>
      {value && <Text style={{ fontSize: 14, color: '#9C9486' }}>{value}</Text>}
      {onPress && !danger && <Text style={{ color: '#9C9486', fontSize: 18 }}>›</Text>}
    </Pressable>
  );
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: '#F4EFE3' }} />;
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View style={{
      backgroundColor: '#fff',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#E5DCC4',
      overflow: 'hidden',
      marginBottom: 12,
    }}>
      {children}
    </View>
  );
}

export function ProfileScreen() {
  const user       = useAuthStore((s) => s.user);
  const clear      = useAuthStore((s) => s.clear);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const [scannerVisible, setScannerVisible]     = useState(false);
  const [totpSetupVisible, setTotpSetupVisible] = useState(false);
  const setTotpEnabled = useAuthStore((s) => s.setTotpEnabled);
  const setSession     = useAuthStore((s) => s.setSession);
  const accessToken    = useAuthStore((s) => s.accessToken);
  const refreshToken   = useAuthStore((s) => s.refreshToken);

  const [cepInput,   setCepInput]   = useState(user?.sellerCep ?? '');
  const [savingCep,  setSavingCep]  = useState(false);

  const formatCep = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 8);
    return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
  };

  const onSaveCep = async () => {
    const clean = cepInput.replace(/\D/g, '');
    if (clean.length !== 8) { Alert.alert('CEP inválido', 'Digite um CEP com 8 dígitos.'); return; }
    setSavingCep(true);
    try {
      const updated = await UsersApi.updateSellerCep(clean);
      if (user && accessToken && refreshToken) {
        await setSession({ accessToken, refreshToken, user: { ...user, ...updated } });
      }
      Alert.alert('CEP salvo!', 'Seu CEP de envio foi atualizado.');
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar o CEP.');
    } finally {
      setSavingCep(false);
    }
  };

  const [ratingSummary, setRatingSummary] = useState<UserRatingSummary | null>(null);

  const versionTapCount = useRef(0);
  const versionTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user?.userId) return;
    RatingsApi.getSummary(user.userId)
      .then(setRatingSummary)
      .catch(() => { /* silently ignore */ });
  }, [user?.userId]);

  const onDisableTotp = () => {
    Alert.prompt(
      'Desativar 2FA',
      'Digite o código de 6 dígitos do Google Authenticator para confirmar:',
      async (code) => {
        if (!code || code.length !== 6) return;
        try {
          const { AuthApi } = await Promise.resolve().then(() => require('../../api/auth'));
          await AuthApi.totpDisable(code);
          setTotpEnabled(false);
          Alert.alert('2FA desativado', 'A autenticação em dois fatores foi removida da sua conta.');
        } catch {
          Alert.alert('Erro', 'Código inválido. Tente novamente.');
        }
      },
      'plain-text',
      '',
      'number-pad',
    );
  };

  const onSignOut = () => {
    Alert.alert(
      'Sair da conta',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: () => void clear() },
      ],
    );
  };

  const onPrivacy = () => {
    void Linking.openURL(PRIVACY_URL);
  };

  const onVersionTap = () => {
    versionTapCount.current += 1;
    if (versionTapTimer.current) clearTimeout(versionTapTimer.current);
    versionTapTimer.current = setTimeout(() => { versionTapCount.current = 0; }, 2000);

    if (versionTapCount.current >= 5) {
      versionTapCount.current = 0;
      if (Platform.OS === 'ios') {
        Alert.prompt(
          'Acesso Administrativo',
          'Digite o segredo de administrador:',
          (secret) => {
            if (secret?.trim()) navigation.navigate('AdminReports', { secret: secret.trim() });
          },
          'secure-text',
        );
      } else {
        Alert.alert('Acesso Administrativo', 'Funcionalidade disponível apenas no iOS por enquanto.');
      }
    }
  };

  const onInstagram = async () => {
    const canOpen = await Linking.canOpenURL(INSTAGRAM_APP_URL);
    void Linking.openURL(canOpen ? INSTAGRAM_APP_URL : INSTAGRAM_WEB_URL);
  };

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: '#F4EFE3' }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

        {/* Avatar + info */}
        <View style={{
          backgroundColor: '#335336',
          borderRadius: 20,
          padding: 20,
          alignItems: 'center',
          marginBottom: 16,
        }}>
          <View style={{
            width: 72, height: 72, borderRadius: 36,
            backgroundColor: '#D4AF37',
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 12,
          }}>
            <Text style={{ color: '#211B15', fontWeight: '900', fontSize: 26 }}>
              {initials(user?.displayName ?? 'U')}
            </Text>
          </View>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 18 }}>
            {user?.displayName ?? '—'}
          </Text>
          {user?.email && (
            <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, marginTop: 4 }}>
              {user.email}
            </Text>
          )}

          {/* Stats */}
          <View style={{
            flexDirection: 'row',
            marginTop: 16,
            gap: 1,
            backgroundColor: 'rgba(0,0,0,0.2)',
            borderRadius: 12,
            overflow: 'hidden',
            width: '100%',
          }}>
            {[
              {
                label: 'Anúncios',
                value: String(user?.listingsActiveCount ?? 0),
              },
              {
                label: 'Vendas',
                value: String(ratingSummary?.asSeller.count ?? 0),
              },
              {
                label: 'Avaliação',
                value: ratingSummary && ratingSummary.asSeller.count > 0
                  ? (ratingSummary.asSeller.average).toFixed(1)
                  : '—',
              },
            ].map((stat, i) => (
              <View key={stat.label} style={{
                flex: 1,
                alignItems: 'center',
                paddingVertical: 10,
                borderLeftWidth: i > 0 ? 1 : 0,
                borderColor: 'rgba(255,255,255,0.15)',
              }}>
                <Text style={{ color: '#D4AF37', fontWeight: '800', fontSize: 18 }}>{stat.value}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 2 }}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Conta */}
        <Text style={{ color: '#9C9486', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8, marginLeft: 4 }}>
          CONTA
        </Text>
        <Card>
          <Row label="Telefone" value={user?.phoneE164 ?? '—'} />
          <Divider />
          <Row label="CPF" value={user?.cpf ? `***.***.${user.cpf.slice(6, 9)}-**` : '—'} />
          <Divider />
          <Row label="Meus pedidos" icon={<ShoppingBag size={17} color="#9C9486" />} onPress={() => navigation.navigate('Orders')} />
          <Divider />
          <Row label="Membro desde" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : '—'} />
        </Card>

        {/* CEP de envio */}
        <Text style={{ color: '#9C9486', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8, marginLeft: 4, marginTop: 8 }}>
          ENDEREÇO DE ENVIO
        </Text>
        <View style={{ backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#E5DCC4', padding: 16, marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <MapPin size={16} color="#9C9486" />
            <Text style={{ fontSize: 13, color: '#9C9486', fontWeight: '600' }}>CEP de origem para cálculo de frete</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TextInput
              value={cepInput}
              onChangeText={(t) => setCepInput(formatCep(t))}
              placeholder="00000-000"
              keyboardType="numeric"
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: '#E5DCC4',
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 15,
                color: '#1C1A14',
                backgroundColor: '#FAFAF8',
              }}
            />
            <Pressable
              onPress={onSaveCep}
              disabled={savingCep}
              style={({ pressed }) => ({
                backgroundColor: pressed ? '#B8962B' : '#D4AF37',
                borderRadius: 10,
                paddingHorizontal: 16,
                justifyContent: 'center',
              })}
            >
              <Text style={{ color: '#1C1A14', fontWeight: '700', fontSize: 14 }}>
                {savingCep ? '...' : 'Salvar'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Segurança */}
        <Text style={{ color: '#9C9486', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8, marginLeft: 4, marginTop: 8 }}>
          SEGURANÇA
        </Text>
        <Card>
          {user?.totpEnabled ? (
            <Row
              label="2FA ativo"
              icon={<Shield size={17} color="#22c55e" />}
              value="Desativar"
              onPress={onDisableTotp}
            />
          ) : (
            <Row
              label="Ativar autenticação 2FA"
              icon={<ShieldOff size={17} color="#9C9486" />}
              onPress={() => setTotpSetupVisible(true)}
            />
          )}
        </Card>

        {/* Cupons */}
        <Text style={{ color: '#9C9486', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8, marginLeft: 4, marginTop: 8 }}>
          CUPONS
        </Text>
        <Card>
          <Row label="Escanear cupom QR" icon={<Camera size={17} color="#9C9486" />} onPress={() => setScannerVisible(true)} />
        </Card>

        {/* Novidades */}
        <Text style={{ color: '#9C9486', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8, marginLeft: 4, marginTop: 8 }}>
          NOVIDADES
        </Text>
        <Pressable
          onPress={onInstagram}
          style={({ pressed }) => ({
            backgroundColor: pressed ? '#F0E8D0' : '#fff',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#E5DCC4',
            marginBottom: 12,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
          })}
        >
          {/* Instagram gradient circle */}
          <View style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            backgroundColor: '#C13584',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <AtSign size={26} color="#fff" />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ color: '#1C1A14', fontWeight: '700', fontSize: 15, marginBottom: 2 }}>
              Fique ligado nas próximas atualizações
            </Text>
            <Text style={{ color: '#9C9486', fontSize: 13 }}>
              @{INSTAGRAM_USERNAME}
            </Text>
          </View>

          <Text style={{ color: '#9C9486', fontSize: 18 }}>›</Text>
        </Pressable>

        {/* Legal */}
        <Text style={{ color: '#9C9486', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8, marginLeft: 4, marginTop: 8 }}>
          LEGAL
        </Text>
        <Card>
          <Row label="Política de Privacidade" onPress={onPrivacy} />
          <Divider />
          <Row label="Versão do app" value={APP_VERSION} onPress={onVersionTap} />
        </Card>

        {/* Sair */}
        <View style={{
          backgroundColor: '#fff',
          borderRadius: 16,
          borderWidth: 1,
          borderColor: '#E5DCC4',
          overflow: 'hidden',
          marginBottom: 12,
        }}>
          <Pressable
            onPress={onSignOut}
            android_ripple={{ color: '#FEE2E2' }}
            style={({ pressed }) => ({
              paddingVertical: 28,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: pressed ? '#FEE2E2' : 'transparent',
            })}
          >
            <Text style={{ fontSize: 20, color: '#EF4444', fontWeight: '700', textAlign: 'center', width: '100%' }}>
              Sair da conta
            </Text>
          </Pressable>
        </View>

      </ScrollView>

      <QRScannerScreen
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
      />

      <TotpSetupScreen
        visible={totpSetupVisible}
        onClose={() => setTotpSetupVisible(false)}
      />
    </SafeAreaView>
  );
}

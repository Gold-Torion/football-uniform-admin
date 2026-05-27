import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Eye, EyeOff } from 'lucide-react-native';

import type { AuthStackParamList } from '../../navigation/types';
import { AuthApi } from '../../api/auth';
import { useAuthStore } from '../../store/auth.store';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: Props) {
  const setSession = useAuthStore((s) => s.setSession);

  const [step,        setStep]        = useState<1 | 2>(1);
  const [email,       setEmail]       = useState('');
  const [code,        setCode]        = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm,     setConfirm]     = useState('');
  const [showPwd,     setShowPwd]     = useState(false);
  const [busy,        setBusy]        = useState(false);

  const onSendCode = async () => {
    const e = email.trim().toLowerCase();
    if (!e) {
      Alert.alert('Atenção', 'Digite seu e-mail.');
      return;
    }
    setBusy(true);
    try {
      await AuthApi.forgotPassword(e);
      setStep(2);
    } catch {
      // Even on error we proceed to step 2 (prevent enumeration on client too)
      setStep(2);
    } finally {
      setBusy(false);
    }
  };

  const onResend = async () => {
    const e = email.trim().toLowerCase();
    setBusy(true);
    try {
      await AuthApi.forgotPassword(e);
      Alert.alert('Código reenviado', 'Verifique seu e-mail.');
    } catch {
      Alert.alert('Código reenviado', 'Se o e-mail estiver cadastrado, você receberá o código em instantes.');
    } finally {
      setBusy(false);
    }
  };

  const onReset = async () => {
    const e = email.trim().toLowerCase();
    const c = code.trim();

    if (c.length !== 6 || !/^\d{6}$/.test(c)) {
      Alert.alert('Atenção', 'Digite o código de 6 dígitos.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Atenção', 'A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (newPassword !== confirm) {
      Alert.alert('Atenção', 'As senhas não coincidem.');
      return;
    }

    setBusy(true);
    try {
      const session = await AuthApi.resetPassword(e, c, newPassword);
      await setSession(session);
    } catch (err: unknown) {
      const raw = (err as { response?: { data?: { message?: string | string[] } } })
        ?.response?.data?.message;
      const msg = Array.isArray(raw) ? raw[0] : raw;
      Alert.alert('Erro', typeof msg === 'string' ? msg : 'Não foi possível redefinir a senha. Tente novamente.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={['#335336', '#2A4429', '#211B15']}
        locations={[0, 0.6, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Voltar */}
            <Pressable onPress={() => navigation.goBack()} style={{ marginBottom: 32 }}>
              <Text style={{ color: '#D4AF37', fontSize: 15 }}>← Voltar</Text>
            </Pressable>

            {step === 1 ? (
              <>
                {/* Step 1 — Enter email */}
                <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 26, marginBottom: 6 }}>
                  Esqueci minha senha
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, marginBottom: 32 }}>
                  Digite seu e-mail cadastrado para receber o código de verificação.
                </Text>

                <Text style={label}>E-mail</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="seu@email.com"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  style={input}
                />

                <Pressable
                  onPress={onSendCode}
                  disabled={busy}
                  style={{
                    backgroundColor: '#D4AF37',
                    borderRadius: 16,
                    paddingVertical: 15,
                    alignItems: 'center',
                    marginTop: 28,
                  }}
                >
                  {busy
                    ? <ActivityIndicator color="#211B15" />
                    : <Text style={{ color: '#211B15', fontWeight: '800', fontSize: 15 }}>Enviar código</Text>
                  }
                </Pressable>
              </>
            ) : (
              <>
                {/* Step 2 — Enter code + new password */}
                <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 26, marginBottom: 6 }}>
                  Nova senha
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, marginBottom: 32 }}>
                  Insira o código de 6 dígitos enviado para{' '}
                  <Text style={{ color: '#D4AF37' }}>{email}</Text>
                  {' '}e defina sua nova senha.
                </Text>

                {/* Código */}
                <Text style={label}>Código de verificação</Text>
                <TextInput
                  value={code}
                  onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  keyboardType="number-pad"
                  maxLength={6}
                  style={[input, { fontSize: 28, letterSpacing: 10, textAlign: 'center' }]}
                />

                {/* Nova senha */}
                <Text style={[label, { marginTop: 16 }]}>Nova senha</Text>
                <View style={{ position: 'relative' }}>
                  <TextInput
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Mínimo 8 caracteres"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    secureTextEntry={!showPwd}
                    style={[input, { paddingRight: 52 }]}
                  />
                  <Pressable
                    onPress={() => setShowPwd((v) => !v)}
                    style={{ position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' }}
                    hitSlop={8}
                  >
                    {showPwd
                      ? <EyeOff size={18} color="rgba(255,255,255,0.6)" />
                      : <Eye size={18} color="rgba(255,255,255,0.6)" />
                    }
                  </Pressable>
                </View>

                {/* Indicador de força da senha */}
                {newPassword.length > 0 && (
                  <View style={{ flexDirection: 'row', gap: 4, marginTop: 8 }}>
                    {[...Array(4)].map((_, i) => (
                      <View
                        key={i}
                        style={{
                          flex: 1,
                          height: 3,
                          borderRadius: 2,
                          backgroundColor: newPassword.length >= (i + 1) * 3
                            ? (newPassword.length >= 12 ? '#4CAF50' : '#D4AF37')
                            : 'rgba(255,255,255,0.15)',
                        }}
                      />
                    ))}
                  </View>
                )}

                {/* Confirmar senha */}
                <Text style={[label, { marginTop: 16 }]}>Confirmar nova senha</Text>
                <TextInput
                  value={confirm}
                  onChangeText={setConfirm}
                  placeholder="Repita a senha"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  secureTextEntry={!showPwd}
                  style={input}
                />

                {/* Botão redefinir */}
                <Pressable
                  onPress={onReset}
                  disabled={busy}
                  style={{
                    backgroundColor: '#D4AF37',
                    borderRadius: 16,
                    paddingVertical: 15,
                    alignItems: 'center',
                    marginTop: 28,
                  }}
                >
                  {busy
                    ? <ActivityIndicator color="#211B15" />
                    : <Text style={{ color: '#211B15', fontWeight: '800', fontSize: 15 }}>Redefinir senha</Text>
                  }
                </Pressable>

                {/* Reenviar código */}
                <Pressable
                  onPress={onResend}
                  disabled={busy}
                  style={{ marginTop: 20, alignItems: 'center' }}
                >
                  <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14 }}>
                    Não recebi o código
                  </Text>
                </Pressable>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const label: object = { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '600', marginBottom: 6 };
const input: object = {
  backgroundColor: 'rgba(255,255,255,0.10)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.18)',
  borderRadius: 12,
  color: '#FFF',
  fontSize: 15,
  paddingHorizontal: 14,
  paddingVertical: 13,
  // Override Chrome autofill white background on web
  ...(Platform.OS === 'web' ? {
    WebkitBoxShadow: '0 0 0 30px #3a5c3c inset',
    WebkitTextFillColor: '#FFF',
  } : {}),
};

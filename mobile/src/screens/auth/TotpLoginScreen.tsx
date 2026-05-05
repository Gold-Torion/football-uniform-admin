import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthApi } from '../../api/auth';
import { useAuthStore } from '../../store/auth.store';

export function TotpLoginScreen() {
  const totpTempToken    = useAuthStore((s) => s.totpTempToken);
  const setSession       = useAuthStore((s) => s.setSession);
  const clear            = useAuthStore((s) => s.clear);

  const [code, setCode]       = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef              = useRef<TextInput>(null);

  const handleConfirm = async () => {
    if (code.length !== 6 || !totpTempToken) return;
    setLoading(true);
    try {
      const session = await AuthApi.totpAuthenticate(totpTempToken, code);
      await setSession(session);
    } catch {
      Alert.alert('Código inválido', 'Verifique o Google Authenticator e tente novamente.');
      setCode('');
      inputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#335336' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}
      >
        {/* Icon */}
        <View
          style={{
            width: 80, height: 80, borderRadius: 40,
            backgroundColor: 'rgba(212,175,55,0.15)',
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 24,
          }}
        >
          <Text style={{ fontSize: 36 }}>🔐</Text>
        </View>

        <Text style={{ color: '#EAEAEA', fontWeight: '800', fontSize: 22, marginBottom: 8, textAlign: 'center' }}>
          Verificação em 2 etapas
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 36 }}>
          Abra o Google Authenticator e insira o código de 6 dígitos gerado para Arena dos Mantos.
        </Text>

        {/* Code input */}
        <TextInput
          ref={inputRef}
          value={code}
          onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
          keyboardType="number-pad"
          maxLength={6}
          autoFocus
          style={{
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderWidth: 2,
            borderColor: code.length === 6 ? '#D4AF37' : 'rgba(255,255,255,0.3)',
            borderRadius: 16,
            paddingHorizontal: 24,
            paddingVertical: 16,
            fontSize: 32,
            fontWeight: '800',
            color: '#D4AF37',
            letterSpacing: 12,
            textAlign: 'center',
            width: '100%',
            marginBottom: 24,
          }}
          placeholder="––––––"
          placeholderTextColor="rgba(255,255,255,0.2)"
        />

        {/* Confirm button */}
        <Pressable
          onPress={handleConfirm}
          disabled={code.length !== 6 || loading}
          style={({ pressed }) => ({
            backgroundColor:
              code.length !== 6 ? 'rgba(212,175,55,0.3)' :
              pressed ? '#B8942E' : '#D4AF37',
            borderRadius: 14,
            paddingVertical: 15,
            alignItems: 'center',
            width: '100%',
            marginBottom: 16,
          })}
        >
          {loading
            ? <ActivityIndicator color="#211B15" />
            : <Text style={{ color: '#211B15', fontWeight: '800', fontSize: 16 }}>Confirmar</Text>
          }
        </Pressable>

        {/* Cancel */}
        <Pressable onPress={() => void clear()} hitSlop={12}>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
            Cancelar e voltar ao login
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

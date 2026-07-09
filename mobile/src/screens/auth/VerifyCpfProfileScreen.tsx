import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { AuthApi } from '../../api/auth';
import { useAuthStore } from '../../store/auth.store';
import { isValidCpf, maskCpf, stripCpf } from '../../utils/cpf';

type Props = NativeStackScreenProps<RootStackParamList, 'VerifyCpf'>;

export function VerifyCpfProfileScreen({ navigation }: Props) {
  const [raw, setRaw] = useState('');
  const [busy, setBusy] = useState(false);
  const setSession = useAuthStore((s) => s.setSession);

  const digits = useMemo(() => stripCpf(raw), [raw]);
  const fullLength = digits.length === 11;
  const valid = fullLength && isValidCpf(digits);

  const status: 'idle' | 'invalid' | 'valid' = !fullLength
    ? 'idle'
    : valid
      ? 'valid'
      : 'invalid';

  const onSubmit = async () => {
    if (!valid) return;
    setBusy(true);
    try {
      const session = await AuthApi.verifyCpf(digits);
      await setSession(session);
      navigation.goBack();
    } catch {
      Alert.alert('CPF', 'Não foi possível validar o CPF. Verifique sua conexão.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-arena-verde">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="flex-1 px-6 pt-12">
          <Text className="text-white text-3xl font-black mb-2">Confirme seu CPF</Text>
          <Text className="text-white/60 mb-8">
            Usamos o CPF apenas para validar identidade — ele nunca aparece publicamente.
          </Text>

          <TextInput
            value={maskCpf(raw)}
            onChangeText={setRaw}
            placeholder="000.000.000-00"
            placeholderTextColor="rgba(255,255,255,0.3)"
            keyboardType="number-pad"
            maxLength={14}
            autoFocus
            className={[
              'bg-white/10 rounded-2xl px-4 py-4 text-white text-lg border',
              status === 'invalid' ? 'border-danger' : 'border-white/20',
            ].join(' ')}
          />

          {status === 'invalid' && (
            <Text className="text-danger mt-3 text-sm">
              CPF inválido. Verifique os dígitos e tente novamente.
            </Text>
          )}
          {status === 'valid' && (
            <Text className="text-arena-dourado mt-3 text-sm font-semibold">CPF válido.</Text>
          )}
        </View>

        <View className="px-6 pb-12">
          <Pressable
            onPress={onSubmit}
            disabled={!valid || busy}
            className={`rounded-2xl py-4 items-center ${valid ? 'bg-arena-dourado' : 'bg-white/15'}`}
          >
            {busy ? (
              <ActivityIndicator color="#1C1A14" />
            ) : (
              <Text className="text-arena-fundo font-bold text-base">Confirmar</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

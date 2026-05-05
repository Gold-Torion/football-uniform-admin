import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from 'react-native';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';
import { AuthApi } from '../../api/auth';
import { useAuthStore } from '../../store/auth.store';

type Props = NativeStackScreenProps<AuthStackParamList, 'LgpdConsent'>;

/**
 * LGPD consent — required by the Play Store and by Brazilian law (Lei
 * 13.709/2018). The user MUST tap "Aceitar" to enter the app; declining drops
 * them back to Sign-in. The active consent version is fetched from the
 * backend so we can re-prompt existing users when the policy text changes.
 */
export function LgpdConsentScreen({ navigation }: Props) {
  const [version, setVersion] = useState<string | null>(null);
  const [privacyUrl, setPrivacyUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    AuthApi.getLgpdPrompt()
      .then(({ version, privacyPolicyUrl }) => {
        setVersion(version);
        setPrivacyUrl(privacyPolicyUrl);
      })
      .catch(() => {
        // Backend unavailable — fall back to placeholder values so the screen
        // still renders during front-end-only previews.
        setVersion('2026-04-29');
        setPrivacyUrl('https://arenadosmantos.com.br/privacidade');
      });
  }, []);

  const onAccept = async () => {
    if (!version) return;
    setBusy(true);
    try {
      const session = await AuthApi.recordLgpdConsent(true, version);
      await setSession(session);
      // RootNavigator detects lgpdConsentAt is now set → switches to MainTabs.
    } catch {
      Alert.alert('Erro', 'Não foi possível registrar o consentimento. Verifique sua conexão.');
    } finally {
      setBusy(false);
    }
  };

  const onDecline = () => {
    Alert.alert(
      'Consentimento necessário',
      'Para usar a Arena dos Mantos é necessário aceitar a política de privacidade.',
      [
        { text: 'Voltar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: () => navigation.popToTop() },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 32 }}>
        <Text className="text-ink-1 text-2xl font-black mb-2">Política de Privacidade</Text>
        <Text className="text-ink-3 text-xs mb-6">Versão {version ?? '—'}</Text>

        <Text className="text-ink-2 leading-6 mb-4">
          A Arena dos Mantos coleta dados pessoais para criar sua conta, validar sua identidade
          (CPF) e processar transações entre compradores e vendedores. Seguimos a Lei Geral de
          Proteção de Dados (LGPD — Lei 13.709/2018).
        </Text>

        <Text className="text-ink-1 font-bold mt-4 mb-2">Dados que tratamos</Text>
        <Text className="text-ink-2 leading-6">
          Nome, e-mail, número de celular, CPF, endereço de entrega, fotos e descrições dos
          anúncios, histórico de transações e avaliações. Também armazenamos um identificador
          do provedor de login (Google ou Apple).
        </Text>

        <Text className="text-ink-1 font-bold mt-4 mb-2">Compartilhamento</Text>
        <Text className="text-ink-2 leading-6">
          Dados são compartilhados com Pagar.me (processamento de pagamento), Correios (entrega)
          e provedores de infraestrutura sob acordo de confidencialidade.
        </Text>

        <Text className="text-ink-1 font-bold mt-4 mb-2">Seus direitos</Text>
        <Text className="text-ink-2 leading-6">
          Você pode acessar, corrigir ou excluir seus dados a qualquer momento entrando em
          contato pelo e-mail informado na política completa.
        </Text>

        {privacyUrl && (
          <Pressable
            onPress={() => Linking.openURL(privacyUrl)}
            className="mt-4"
          >
            <Text className="text-arena-verde font-semibold">Ler política completa →</Text>
          </Pressable>
        )}
      </ScrollView>

      <View className="px-6 pb-8 gap-3 border-t border-surface-border bg-surface">
        <Pressable
          onPress={onAccept}
          disabled={!version || busy}
          className={`rounded-2xl py-4 items-center ${version ? 'bg-arena-dourado' : 'bg-ink-3/30'}`}
        >
          {busy ? (
            <ActivityIndicator color="#1C1A14" />
          ) : (
            <Text className="text-arena-fundo font-bold text-base">Aceitar e continuar</Text>
          )}
        </Pressable>
        <Pressable onPress={onDecline} className="py-3 items-center">
          <Text className="text-ink-2 text-sm">Recusar</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

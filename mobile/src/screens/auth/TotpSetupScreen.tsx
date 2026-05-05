import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthApi } from '../../api/auth';
import { useAuthStore } from '../../store/auth.store';

type Step = 'qr' | 'verify';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function TotpSetupScreen({ visible, onClose }: Props) {
  const setTotpEnabled = useAuthStore((s) => s.setTotpEnabled);

  const [step, setStep]               = useState<Step>('qr');
  const [qrDataUrl, setQrDataUrl]     = useState('');
  const [code, setCode]               = useState('');
  const [loadingQr, setLoadingQr]     = useState(false);
  const [loadingOk, setLoadingOk]     = useState(false);

  const startSetup = async () => {
    setLoadingQr(true);
    try {
      const { qrCodeDataUrl } = await AuthApi.totpSetup();
      setQrDataUrl(qrCodeDataUrl);
      setStep('qr');
    } catch {
      Alert.alert('Erro', 'Não foi possível iniciar o setup. Tente novamente.');
    } finally {
      setLoadingQr(false);
    }
  };

  const handleOpen = () => {
    setStep('qr');
    setCode('');
    setQrDataUrl('');
    void startSetup();
  };

  const handleActivate = async () => {
    if (code.length !== 6) return;
    setLoadingOk(true);
    try {
      await AuthApi.totpActivate(code);
      setTotpEnabled(true);
      Alert.alert('2FA ativado! 🎉', 'Sua conta está protegida com autenticação em dois fatores.', [
        { text: 'OK', onPress: onClose },
      ]);
    } catch {
      Alert.alert('Código inválido', 'Verifique o Google Authenticator e tente novamente.');
      setCode('');
    } finally {
      setLoadingOk(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} onShow={handleOpen}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F4EFE3' }} edges={['top', 'bottom']}>

        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#335336',
            paddingHorizontal: 20,
            paddingVertical: 16,
          }}
        >
          <Text style={{ flex: 1, color: '#EAEAEA', fontWeight: '800', fontSize: 17 }}>
            Ativar autenticação 2FA
          </Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 20 }}>✕</Text>
          </Pressable>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={{ padding: 24 }}>

            {loadingQr ? (
              <ActivityIndicator color="#335336" size="large" style={{ marginTop: 60 }} />
            ) : step === 'qr' ? (
              <>
                {/* Step 1: QR code */}
                <Text style={{ color: '#1C1A14', fontWeight: '800', fontSize: 18, marginBottom: 8 }}>
                  Passo 1 de 2
                </Text>
                <Text style={{ color: '#6B6357', fontSize: 14, lineHeight: 22, marginBottom: 24 }}>
                  Abra o <Text style={{ fontWeight: '700' }}>Google Authenticator</Text> no seu celular e escaneie o QR code abaixo.
                </Text>

                {qrDataUrl ? (
                  <View style={{ alignItems: 'center', marginBottom: 24 }}>
                    <Image
                      source={{ uri: qrDataUrl }}
                      style={{
                        width: 220, height: 220,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: '#E5DCC4',
                      }}
                    />
                  </View>
                ) : null}

                <View
                  style={{
                    backgroundColor: '#FFF8E7',
                    borderRadius: 12,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: '#E5DCC4',
                    marginBottom: 32,
                  }}
                >
                  <Text style={{ color: '#6B6357', fontSize: 13, lineHeight: 20 }}>
                    💡 Não tem o app?{' '}
                    <Text style={{ fontWeight: '700' }}>
                      Baixe "Google Authenticator" na App Store ou Google Play, depois escaneie.
                    </Text>
                  </Text>
                </View>

                <Pressable
                  onPress={() => setStep('verify')}
                  style={({ pressed }) => ({
                    backgroundColor: pressed ? '#B8942E' : '#D4AF37',
                    borderRadius: 14,
                    paddingVertical: 15,
                    alignItems: 'center',
                  })}
                >
                  <Text style={{ color: '#211B15', fontWeight: '800', fontSize: 16 }}>
                    Já escaneei → Próximo
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                {/* Step 2: verify code */}
                <Text style={{ color: '#1C1A14', fontWeight: '800', fontSize: 18, marginBottom: 8 }}>
                  Passo 2 de 2
                </Text>
                <Text style={{ color: '#6B6357', fontSize: 14, lineHeight: 22, marginBottom: 24 }}>
                  Abra o Google Authenticator e insira o código de 6 dígitos que aparece para <Text style={{ fontWeight: '700' }}>Arena dos Mantos</Text>.
                </Text>

                <TextInput
                  value={code}
                  onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                  style={{
                    borderWidth: 2,
                    borderColor: code.length === 6 ? '#335336' : '#E5DCC4',
                    borderRadius: 14,
                    paddingHorizontal: 24,
                    paddingVertical: 16,
                    fontSize: 30,
                    fontWeight: '800',
                    color: '#335336',
                    letterSpacing: 10,
                    textAlign: 'center',
                    marginBottom: 24,
                    backgroundColor: '#FFF',
                  }}
                  placeholder="––––––"
                  placeholderTextColor="#C4BDB5"
                />

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <Pressable
                    onPress={() => setStep('qr')}
                    style={{
                      flex: 1,
                      borderWidth: 2,
                      borderColor: '#E5DCC4',
                      borderRadius: 14,
                      paddingVertical: 14,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: '#6B6357', fontWeight: '700', fontSize: 15 }}>← Voltar</Text>
                  </Pressable>

                  <Pressable
                    onPress={handleActivate}
                    disabled={code.length !== 6 || loadingOk}
                    style={({ pressed }) => ({
                      flex: 2,
                      backgroundColor:
                        code.length !== 6 ? '#C4BDB5' :
                        pressed ? '#2A4429' : '#335336',
                      borderRadius: 14,
                      paddingVertical: 14,
                      alignItems: 'center',
                    })}
                  >
                    {loadingOk
                      ? <ActivityIndicator color="#FFF" />
                      : <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 15 }}>Ativar 2FA</Text>
                    }
                  </Pressable>
                </View>
              </>
            )}

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

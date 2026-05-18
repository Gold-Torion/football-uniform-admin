import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { PaymentsApi } from '../../api/payments';

type Props = NativeStackScreenProps<RootStackParamList, 'PixPayment'>;

const POLL_INTERVAL_MS = 5_000;
const MAX_POLLS = 72; // 6 min

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState(() => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.floor(diff / 1000));
  });

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) { clearInterval(id); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [remaining]);

  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;

  if (remaining <= 0) {
    return <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: 14 }}>PIX expirado</Text>;
  }

  return (
    <Text style={{ color: '#9C9486', fontSize: 13 }}>
      Expira em{' '}
      <Text style={{ color: '#1C1A14', fontWeight: '700' }}>
        {h > 0 ? `${h}h ` : ''}{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
      </Text>
    </Text>
  );
}

export function PixPaymentScreen({ route, navigation }: Props) {
  const { orderId, pixQrCode, pixExpiresAt, totalCents, teamName } = route.params;

  const [copied, setCopied]       = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [polling, setPolling]     = useState(true);
  const [paid, setPaid]           = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkStatus = useCallback(async () => {
    try {
      const result = await PaymentsApi.getPaymentStatus(orderId);
      if (result.status === 'PAID' || result.pagarmeStatus === 'paid') {
        setPaid(true);
        setPolling(false);
        if (pollRef.current) clearInterval(pollRef.current);
      }
    } catch {
      // silently retry
    }
    setPollCount((n) => {
      if (n + 1 >= MAX_POLLS) {
        setPolling(false);
        if (pollRef.current) clearInterval(pollRef.current);
      }
      return n + 1;
    });
  }, [orderId]);

  useEffect(() => {
    pollRef.current = setInterval(checkStatus, POLL_INTERVAL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [checkStatus]);

  const handleCopy = () => {
    Clipboard.setString(pixQrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleGoToOrders = () => {
    navigation.reset({ index: 0, routes: [{ name: 'Main' as never }] });
    setTimeout(() => navigation.navigate('Orders'), 100);
  };

  if (paid) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F4EFE3' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Text style={{ fontSize: 64, marginBottom: 20 }}>✅</Text>
          <Text style={{ color: '#335336', fontWeight: '900', fontSize: 24, textAlign: 'center', marginBottom: 8 }}>
            Pagamento confirmado!
          </Text>
          <Text style={{ color: '#6B6357', fontSize: 15, textAlign: 'center', marginBottom: 32 }}>
            Seu pedido de{' '}
            <Text style={{ fontWeight: '700' }}>{teamName}</Text>
            {' '}foi pago com sucesso.
          </Text>
          <Pressable
            onPress={handleGoToOrders}
            style={{
              backgroundColor: '#335336', borderRadius: 16,
              paddingVertical: 16, paddingHorizontal: 32,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>
              Ver meus pedidos
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: '#F4EFE3' }}>

      {/* Header */}
      <View style={{
        backgroundColor: '#335336',
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 14, gap: 12,
      }}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={{ color: '#D4AF37', fontSize: 22 }}>←</Text>
        </Pressable>
        <Text style={{ color: '#F5E6B8', fontWeight: '800', fontSize: 17, flex: 1 }}>
          Pagamento via PIX
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>

        {/* Amount */}
        <View style={{
          alignItems: 'center', marginBottom: 24,
          backgroundColor: '#fff', borderRadius: 16, padding: 20,
          borderWidth: 1, borderColor: '#E5DCC4',
        }}>
          <Text style={{ color: '#9C9486', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 6 }}>
            TOTAL A PAGAR
          </Text>
          <Text style={{ color: '#D4AF37', fontWeight: '900', fontSize: 32 }}>
            {formatCents(totalCents)}
          </Text>
          <Text style={{ color: '#6B6357', fontSize: 13, marginTop: 4 }}>
            {teamName}
          </Text>
        </View>

        {/* Instructions */}
        <View style={{
          backgroundColor: '#335336',
          borderRadius: 16, padding: 20, marginBottom: 20,
        }}>
          <Text style={{ color: '#F5E6B8', fontWeight: '800', fontSize: 15, marginBottom: 12 }}>
            Como pagar com PIX:
          </Text>
          {[
            '1. Abra o app do seu banco',
            '2. Escolha pagar com PIX Copia e Cola',
            '3. Cole o código abaixo',
            '4. Confirme o pagamento',
          ].map((step) => (
            <Text key={step} style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 6, lineHeight: 20 }}>
              {step}
            </Text>
          ))}
        </View>

        {/* PIX code */}
        <View style={{
          backgroundColor: '#fff', borderRadius: 16,
          borderWidth: 1, borderColor: '#E5DCC4',
          padding: 16, marginBottom: 12,
        }}>
          <Text style={{ color: '#9C9486', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 }}>
            CÓDIGO PIX COPIA E COLA
          </Text>
          <Text
            selectable
            style={{
              color: '#1C1A14', fontSize: 11, lineHeight: 18,
              fontFamily: 'monospace',
              backgroundColor: '#F4EFE3', borderRadius: 8,
              padding: 12, marginBottom: 12,
            }}
            numberOfLines={3}
          >
            {pixQrCode}
          </Text>

          <Pressable
            onPress={handleCopy}
            style={({ pressed }) => ({
              backgroundColor: copied ? '#335336' : pressed ? '#B8942E' : '#D4AF37',
              borderRadius: 12, paddingVertical: 14, alignItems: 'center',
            })}
          >
            <Text style={{ color: '#211B15', fontWeight: '800', fontSize: 15 }}>
              {copied ? '✓ Copiado!' : '📋 Copiar código PIX'}
            </Text>
          </Pressable>
        </View>

        {/* Countdown */}
        <View style={{ alignItems: 'center', marginBottom: 12 }}>
          <CountdownTimer expiresAt={pixExpiresAt} />
        </View>

        {/* Polling indicator */}
        {polling && (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <ActivityIndicator size="small" color="#9C9486" />
            <Text style={{ color: '#9C9486', fontSize: 12 }}>
              Aguardando confirmação do pagamento...
            </Text>
          </View>
        )}

        {!polling && !paid && (
          <View style={{ alignItems: 'center', marginTop: 8 }}>
            <Text style={{ color: '#9C9486', fontSize: 12, textAlign: 'center' }}>
              Não conseguimos confirmar o pagamento automaticamente.{'\n'}
              Verifique seus pedidos em alguns instantes.
            </Text>
            <Pressable
              onPress={handleGoToOrders}
              style={{ marginTop: 12, padding: 12 }}
            >
              <Text style={{ color: '#335336', fontWeight: '700', fontSize: 14 }}>
                Ver meus pedidos →
              </Text>
            </Pressable>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

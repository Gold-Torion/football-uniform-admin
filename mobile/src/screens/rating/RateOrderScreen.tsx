import { useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../navigation/types';
import { RatingsApi } from '../../api/ratings';

type Props = NativeStackScreenProps<RootStackParamList, 'RateOrder'>;

const BUYER_CRITERIA = [
  'Camisa fiel à foto e informações do anúncio?',
  'Veio bem embalada?',
  'Vendedor enviou dentro do prazo combinado?',
  'Avaliação geral do vendedor',
];

const SELLER_CRITERIA = [
  'Comprador tirou dúvidas pertinentes?',
  'Pedidos do comprador foram atendidos?',
  'Avaliação geral do comprador',
];

// ── Star row component ────────────────────────────────────────────────────────

function StarRow({
  score,
  onScore,
}: {
  score: number;
  onScore: (s: number) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable key={star} onPress={() => onScore(star)} hitSlop={6}>
          <Text style={{ fontSize: 28, color: star <= score ? '#D4AF37' : '#E5DCC4' }}>
            {star <= score ? '★' : '☆'}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

// ── Screen ────────────────────────────────────────────────────────────────────

export function RateOrderScreen({ route, navigation }: Props) {
  const { orderId, rateeId, rateeName, raterRole } = route.params;

  const criteria = raterRole === 'BUYER' ? BUYER_CRITERIA : SELLER_CRITERIA;
  const [scores, setScores] = useState<number[]>(new Array(criteria.length).fill(0));
  const [submitting, setSubmitting] = useState(false);

  const allRated = scores.every((s) => s > 0);
  const average  = allRated
    ? scores.reduce((a, b) => a + b, 0) / scores.length
    : 0;

  const setScore = (index: number, value: number) => {
    setScores((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!allRated || submitting) return;
    setSubmitting(true);
    try {
      await RatingsApi.create({ orderId, rateeId, raterRole, scores });
      // Navigate back immediately — Alert.alert unreliable on web
      navigation.goBack();
    } catch {
      if (typeof window !== 'undefined') {
        window.alert('Não foi possível enviar a avaliação. Tente novamente.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: '#F4EFE3' }}>

      {/* Header */}
      <View style={{
        backgroundColor: '#335336',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
      }}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={{ color: '#D4AF37', fontSize: 22 }}>←</Text>
        </Pressable>
        <Text style={{ color: '#F5E6B8', fontWeight: '800', fontSize: 17, flex: 1 }} numberOfLines={1}>
          Avaliar {rateeName}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

        {/* Ratee avatar + name */}
        <View style={{
          backgroundColor: '#335336',
          borderRadius: 20,
          padding: 24,
          alignItems: 'center',
          marginBottom: 20,
        }}>
          <View style={{
            width: 64, height: 64, borderRadius: 32,
            backgroundColor: '#D4AF37',
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 10,
          }}>
            <Text style={{ color: '#211B15', fontWeight: '900', fontSize: 22 }}>
              {getInitials(rateeName)}
            </Text>
          </View>
          <Text style={{ color: '#F5E6B8', fontWeight: '800', fontSize: 18 }}>
            {rateeName}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, marginTop: 4 }}>
            {raterRole === 'BUYER' ? 'Vendedor' : 'Comprador'}
          </Text>
        </View>

        {/* Criteria list */}
        <View style={{
          backgroundColor: '#fff',
          borderRadius: 16,
          borderWidth: 1,
          borderColor: '#E5DCC4',
          padding: 16,
          marginBottom: 16,
          gap: 4,
        }}>
          {criteria.map((criterion, idx) => (
            <View
              key={idx}
              style={{
                paddingVertical: 12,
                borderBottomWidth: idx < criteria.length - 1 ? 1 : 0,
                borderColor: '#F4EFE3',
              }}
            >
              <Text style={{ color: '#1C1A14', fontSize: 14, lineHeight: 20 }}>
                {criterion}
              </Text>
              <StarRow score={scores[idx] ?? 0} onScore={(v) => setScore(idx, v)} />
            </View>
          ))}
        </View>

        {/* Live average */}
        {allRated && (
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#E5DCC4',
            padding: 16,
            marginBottom: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <Text style={{ color: '#9C9486', fontSize: 14 }}>Média</Text>
            <Text style={{ color: '#D4AF37', fontWeight: '800', fontSize: 22 }}>
              {average.toFixed(1)}
            </Text>
          </View>
        )}

        {/* Submit button */}
        <Pressable
          onPress={handleSubmit}
          disabled={!allRated || submitting}
          style={({ pressed }) => ({
            backgroundColor:
              !allRated || submitting
                ? '#E5DCC4'
                : pressed
                  ? '#B8942E'
                  : '#D4AF37',
            borderRadius: 16,
            paddingVertical: 18,
            alignItems: 'center',
          })}
        >
          {submitting ? (
            <ActivityIndicator color="#211B15" />
          ) : (
            <Text style={{
              color: !allRated ? '#9C9486' : '#211B15',
              fontWeight: '800',
              fontSize: 16,
            }}>
              {allRated ? 'Enviar avaliação' : 'Avalie todos os critérios'}
            </Text>
          )}
        </Pressable>

      </ScrollView>
    </SafeAreaView>
  );
}

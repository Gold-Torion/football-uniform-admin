import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Shirt, Package, Handshake, Ticket, Tag, X } from 'lucide-react-native';

import type { RootStackParamList } from '../../navigation/types';
import { OrdersApi, type DeliveryMethod, type ShippingOption } from '../../api/orders';
import { PaymentsApi } from '../../api/payments';
import { CouponsApi, type RedeemResult } from '../../api/coupons';
import { webAlert } from '../../utils/webAlert';

type Props = NativeStackScreenProps<RootStackParamList, 'Checkout'>;

function formatCep(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

const CONDITION_LABEL: Record<string, string> = {
  COM_ETIQUETA: 'Com etiqueta',
  PERFEITA:     'Perfeita',
  EXCELENTE:    'Excelente',
  BOA:          'Boa',
  REGULAR:      'Regular',
  DESGASTADA:   'Desgastada',
};

export function CheckoutScreen({ route, navigation }: Props) {
  const { listing } = route.params;

  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('CORREIOS');
  const [buyerCep, setBuyerCep]             = useState('');
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [calculatingShipping, setCalculatingShipping] = useState(false);
  const [creatingOrder, setCreatingOrder]   = useState(false);

  const [couponInput,    setCouponInput]    = useState('');
  const [couponResult,   setCouponResult]   = useState<RedeemResult | null>(null);
  const [couponLoading,  setCouponLoading]  = useState(false);
  const [couponError,    setCouponError]    = useState('');

  const priceCents    = listing.priceCents;
  const shippingCents = deliveryMethod === 'ENTREGA_EM_MAOS' ? 0 : (selectedShipping?.priceCents ?? null);
  const discountCents = couponResult ? Math.round(priceCents * (couponResult.discountPct / 100)) : 0;
  // Show discounted subtotal even before shipping is selected
  const totalCents    = shippingCents !== null
    ? priceCents + shippingCents - discountCents
    : discountCents > 0 ? priceCents - discountCents : null;

  const fmt = (cents: number) =>
    (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const cleanCep = buyerCep.replace(/\D/g, '');

  const handleCalculateShipping = async () => {
    if (cleanCep.length < 8) return;
    setCalculatingShipping(true);
    setShippingOptions([]);
    setSelectedShipping(null);
    try {
      const options = await OrdersApi.estimateShipping(listing.listingId, cleanCep);
      setShippingOptions(options);
    } catch {
      // silently ignore
    } finally {
      setCalculatingShipping(false);
    }
  };

  const handleCepChange = (text: string) => {
    const formatted = formatCep(text);
    setBuyerCep(formatted);
    // Reset shipping if CEP changes
    setShippingOptions([]);
    setSelectedShipping(null);
  };

  const handleDeliveryChange = (method: DeliveryMethod) => {
    setDeliveryMethod(method);
    setShippingOptions([]);
    setSelectedShipping(null);
  };

  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setCouponLoading(true);
    setCouponError('');
    setCouponResult(null);
    try {
      const result = await CouponsApi.redeem(code);
      setCouponResult(result);
      setCouponInput('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setCouponError(typeof msg === 'string' ? msg : 'Cupom inválido ou expirado.');
    } finally {
      setCouponLoading(false);
    }
  };

  const canProceed = deliveryMethod === 'ENTREGA_EM_MAOS' || selectedShipping !== null;

  const handlePayWithPix = async () => {
    if (!canProceed) {
      webAlert('Frete', 'Selecione uma opção de entrega primeiro.');
      return;
    }
    setCreatingOrder(true);
    try {
      // 1. Create the order
      const order = await OrdersApi.create({
        listingId:  listing.listingId,
        deliveryMethod,
        buyerCep:   deliveryMethod === 'CORREIOS' ? buyerCep.replace(/\D/g, '') : undefined,
        couponCode: couponResult?.code,
      });

      // 2. Initiate PIX payment
      const pix = await PaymentsApi.initiatePixPayment(order.orderId);

      // 3. Navigate to PIX payment screen
      navigation.replace('PixPayment', {
        orderId:      order.orderId,
        pixQrCode:    pix.pixQrCode,
        pixQrCodeUrl: pix.pixQrCodeUrl,
        pixExpiresAt: pix.pixExpiresAt,
        totalCents:   pix.totalCents,
        teamName:     listing.teamName,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Tente novamente.';
      webAlert('Erro ao criar pedido', msg);
    } finally {
      setCreatingOrder(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: '#3c3c3c' }}>

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
        <Text style={{ color: '#F5E6B8', fontWeight: '800', fontSize: 17, flex: 1 }}>
          Finalizar Pedido
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>

        {/* Product card */}
        <View style={{
          backgroundColor: '#fff',
          borderRadius: 16,
          borderWidth: 1,
          borderColor: '#E5DCC4',
          padding: 16,
          marginBottom: 16,
          flexDirection: 'row',
          gap: 14,
          alignItems: 'center',
        }}>
          <View style={{
            width: 64, height: 64, borderRadius: 12,
            backgroundColor: '#EFEFEF',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Shirt size={32} color="#335336" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#1C1A14', fontWeight: '700', fontSize: 16, marginBottom: 2 }}>
              {listing.teamName}
            </Text>
            <Text style={{ color: '#9C9486', fontSize: 13, marginBottom: 6 }}>
              {listing.supplier} · {listing.season}
            </Text>
            <View style={{
              alignSelf: 'flex-start',
              backgroundColor: '#335336',
              borderRadius: 20,
              paddingHorizontal: 10,
              paddingVertical: 3,
            }}>
              <Text style={{ color: '#F5E6B8', fontSize: 11, fontWeight: '700' }}>
                {listing.size} · {CONDITION_LABEL[listing.condition] ?? listing.condition}
              </Text>
            </View>
          </View>
        </View>

        {/* Delivery section */}
        <Text style={{
          color: '#9C9486', fontSize: 11, fontWeight: '700',
          letterSpacing: 1, marginBottom: 10,
        }}>
          ENTREGA
        </Text>

        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          {/* Correios */}
          <Pressable
            onPress={() => handleDeliveryChange('CORREIOS')}
            style={{
              flex: 1,
              backgroundColor: '#fff',
              borderRadius: 14,
              borderWidth: deliveryMethod === 'CORREIOS' ? 2 : 1,
              borderColor: deliveryMethod === 'CORREIOS' ? '#D4AF37' : '#E5DCC4',
              padding: 14,
              alignItems: 'center',
            }}
          >
            <Package size={22} color="#9C9486" style={{ marginBottom: 4 }} />
            <Text style={{ color: '#1C1A14', fontWeight: '700', fontSize: 14 }}>Correios</Text>
            {deliveryMethod === 'CORREIOS' && (
              <Text style={{ color: '#9C9486', fontSize: 11, marginTop: 2 }}>Calcular frete</Text>
            )}
          </Pressable>

          {/* Em Mãos */}
          <Pressable
            onPress={() => handleDeliveryChange('ENTREGA_EM_MAOS')}
            style={{
              flex: 1,
              backgroundColor: '#fff',
              borderRadius: 14,
              borderWidth: deliveryMethod === 'ENTREGA_EM_MAOS' ? 2 : 1,
              borderColor: deliveryMethod === 'ENTREGA_EM_MAOS' ? '#D4AF37' : '#E5DCC4',
              padding: 14,
              alignItems: 'center',
            }}
          >
            <Handshake size={22} color="#9C9486" style={{ marginBottom: 4 }} />
            <Text style={{ color: '#1C1A14', fontWeight: '700', fontSize: 14 }}>Em Mãos</Text>
            {deliveryMethod === 'ENTREGA_EM_MAOS' && (
              <Text style={{ color: '#9C9486', fontSize: 11, marginTop: 2 }}>Entrega pessoal • Sem frete</Text>
            )}
          </Pressable>
        </View>

        {/* CEP input — shown only for Correios */}
        {deliveryMethod === 'CORREIOS' && (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: '#9C9486', fontSize: 11, fontWeight: '700', marginBottom: 6 }}>
              SEU CEP
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                value={buyerCep}
                onChangeText={handleCepChange}
                placeholder="00000-000"
                placeholderTextColor="#9C9486"
                keyboardType="numeric"
                maxLength={9}
                style={{
                  flex: 1,
                  backgroundColor: '#EFEFEF',
                  borderWidth: 1,
                  borderColor: '#E5DCC4',
                  borderRadius: 12,
                  padding: 14,
                  fontSize: 15,
                  color: '#1C1A14',
                }}
              />
              <Pressable
                onPress={handleCalculateShipping}
                disabled={cleanCep.length < 8 || calculatingShipping}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? '#B8942E' : '#D4AF37',
                  borderRadius: 12,
                  paddingHorizontal: 20,
                  paddingVertical: 14,
                  justifyContent: 'center',
                  alignItems: 'center',
                  opacity: cleanCep.length < 8 ? 0.5 : 1,
                  minWidth: 90,
                })}
              >
                {calculatingShipping
                  ? <ActivityIndicator size="small" color="#211B15" />
                  : <Text style={{ color: '#211B15', fontWeight: '800', fontSize: 15 }}>Calcular</Text>
                }
              </Pressable>
            </View>

            {/* Shipping options */}
            {shippingOptions.length > 0 && (
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                {shippingOptions.map((opt) => (
                  <Pressable
                    key={opt.service}
                    onPress={() => setSelectedShipping(opt)}
                    style={{
                      flex: 1,
                      backgroundColor: '#fff',
                      borderRadius: 12,
                      borderWidth: selectedShipping?.service === opt.service ? 2 : 1,
                      borderColor: selectedShipping?.service === opt.service ? '#D4AF37' : '#E5DCC4',
                      padding: 12,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: '#1C1A14', fontWeight: '700', fontSize: 14 }}>
                      {opt.service}
                    </Text>
                    <Text style={{ color: '#9C9486', fontSize: 11, marginTop: 2 }}>
                      {opt.days} {opt.days === 1 ? 'dia' : 'dias'}
                    </Text>
                    <Text style={{ color: '#335336', fontWeight: '700', fontSize: 13, marginTop: 4 }}>
                      {fmt(opt.priceCents)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Order summary card */}
        <View style={{
          backgroundColor: '#fff',
          borderRadius: 16,
          borderWidth: 1,
          borderColor: '#E5DCC4',
          padding: 16,
          marginBottom: 12,
        }}>
          <Text style={{
            color: '#9C9486', fontSize: 11, fontWeight: '700',
            letterSpacing: 1, marginBottom: 12,
          }}>
            RESUMO
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={{ color: '#1C1A14', fontSize: 14 }}>Subtotal</Text>
            <Text style={{ color: '#1C1A14', fontSize: 14 }}>{fmt(priceCents)}</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ color: '#1C1A14', fontSize: 14 }}>Frete</Text>
            <Text style={{ color: '#1C1A14', fontSize: 14 }}>
              {deliveryMethod === 'ENTREGA_EM_MAOS'
                ? 'Grátis'
                : shippingCents !== null
                  ? fmt(shippingCents)
                  : '—'}
            </Text>
          </View>

          {/* Coupon discount line */}
          {couponResult && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ticket size={14} color="#22c55e" />
                <Text style={{ color: '#22c55e', fontSize: 14 }}>Cupom ({couponResult.discountPct}%)</Text>
                <Pressable onPress={() => { setCouponResult(null); }} hitSlop={8}>
                  <X size={12} color="#9C9486" />
                </Pressable>
              </View>
              <Text style={{ color: '#22c55e', fontSize: 14, fontWeight: '700' }}>
                -{fmt(discountCents)}
              </Text>
            </View>
          )}

          <View style={{ height: 1, backgroundColor: '#EFEFEF', marginBottom: 12 }} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: '#1C1A14', fontWeight: '700', fontSize: 16 }}>Total</Text>
            <Text style={{ color: '#D4AF37', fontWeight: '700', fontSize: 18 }}>
              {totalCents !== null ? fmt(totalCents) : fmt(priceCents)}
            </Text>
          </View>
        </View>

        {/* Coupon input */}
        <View style={{
          backgroundColor: '#fff', borderRadius: 16,
          borderWidth: 1, borderColor: '#E5DCC4', padding: 16, marginBottom: 12,
        }}>
          <Text style={{ color: '#9C9486', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 10 }}>
            CUPOM DE DESCONTO
          </Text>
          {couponResult ? (
            <View style={{
              backgroundColor: '#dcfce7', borderRadius: 10, padding: 12,
              flexDirection: 'row', alignItems: 'center', gap: 10,
            }}>
              <Ticket size={20} color="#166534" />
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#166534', fontWeight: '800', fontSize: 14 }}>
                  {couponResult.code} — {couponResult.discountPct}% off
                </Text>
                {couponResult.description ? (
                  <Text style={{ color: '#166534', fontSize: 12 }}>{couponResult.description}</Text>
                ) : null}
              </View>
              <Pressable onPress={() => setCouponResult(null)}>
                <X size={18} color="#166534" />
              </Pressable>
            </View>
          ) : (
            <>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TextInput
                  value={couponInput}
                  onChangeText={(t) => { setCouponInput(t.toUpperCase()); setCouponError(''); }}
                  placeholder="CÓDIGO DO CUPOM"
                  placeholderTextColor="#9C9486"
                  autoCapitalize="characters"
                  style={{
                    flex: 1, borderWidth: 1, borderColor: couponError ? '#ef4444' : '#E5DCC4',
                    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
                    fontSize: 14, color: '#1C1A14', backgroundColor: '#FAFAF8',
                  }}
                />
                <Pressable
                  onPress={handleApplyCoupon}
                  disabled={couponLoading || !couponInput.trim()}
                  style={({ pressed }) => ({
                    backgroundColor: pressed ? '#B8962B' : '#D4AF37',
                    borderRadius: 10,
                    paddingHorizontal: 20,
                    paddingVertical: 14,
                    justifyContent: 'center',
                    alignItems: 'center',
                    opacity: (!couponInput.trim() || couponLoading) ? 0.5 : 1,
                    minWidth: 90,
                  })}
                >
                  {couponLoading
                    ? <ActivityIndicator size="small" color="#211B15" />
                    : <Text style={{ color: '#211B15', fontWeight: '800', fontSize: 15 }}>Aplicar</Text>
                  }
                </Pressable>
              </View>
              {couponError ? (
                <Text style={{ color: '#ef4444', fontSize: 12, marginTop: 6 }}>{couponError}</Text>
              ) : null}
            </>
          )}
        </View>

        {/* Payment method info */}
        <View style={{
          backgroundColor: '#fff',
          borderRadius: 16,
          borderWidth: 1,
          borderColor: '#E5DCC4',
          padding: 16,
          marginBottom: 12,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Tag size={22} color="#335336" />
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#1C1A14', fontWeight: '700', fontSize: 14 }}>
                Pagamento via Pagar.me
              </Text>
              <Text style={{ color: '#9C9486', fontSize: 12, marginTop: 2 }}>
                PIX instantâneo · Ambiente seguro
              </Text>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* Fixed bottom bar */}
      <View style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        backgroundColor: '#3c3c3c',
        borderTopWidth: 1,
        borderColor: '#E5DCC4',
        padding: 16,
        paddingBottom: 28,
      }}>
        <Pressable
          onPress={handlePayWithPix}
          disabled={creatingOrder || !canProceed}
          style={({ pressed }) => ({
            backgroundColor: !canProceed
              ? '#9C9486'
              : creatingOrder
              ? '#B8942E'
              : pressed
              ? '#B8942E'
              : '#D4AF37',
            borderRadius: 16,
            paddingVertical: 16,
            alignItems: 'center',
          })}
        >
          {creatingOrder ? (
            <ActivityIndicator color="#211B15" />
          ) : (
            <Text style={{ color: '#211B15', fontWeight: '800', fontSize: 16 }}>
              {!canProceed
                ? 'Selecione o frete primeiro'
                : `Pagar ${totalCents !== null ? fmt(totalCents) : fmt(priceCents)} com PIX`}
            </Text>
          )}
        </Pressable>
        <Text style={{ color: '#9C9486', fontSize: 11, textAlign: 'center', marginTop: 8 }}>
          Processamento via Pagar.me • Ambiente seguro
        </Text>
      </View>

    </SafeAreaView>
  );
}

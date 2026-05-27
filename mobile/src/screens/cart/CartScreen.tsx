import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { Trash2, ShoppingCart } from 'lucide-react-native';

import { useCartStore } from '../../store/cart.store';
import { getPhotoUrl } from '../../utils/env';
import type { RootStackParamList } from '../../navigation/types';

export function CartScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { items, removeItem, clearCart } = useCartStore();

  const totalCents = items.reduce((sum, i) => sum + i.priceCents, 0);
  const totalBrl   = (totalCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const sellerIds = [...new Set(items.map((i) => i.sellerId))];
  const multiSeller = sellerIds.length > 1;

  if (items.length === 0) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: '#3c3c3c' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#335336', paddingHorizontal: 16, paddingVertical: 14 }}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Text style={{ color: '#D4AF37', fontSize: 16, fontWeight: '700' }}>← Voltar</Text>
          </Pressable>
          <Text style={{ color: '#EAEAEA', fontWeight: '800', fontSize: 17, marginLeft: 16 }}>Carrinho</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <ShoppingCart size={48} color="rgba(255,255,255,0.3)" />
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontWeight: '700', fontSize: 17, marginTop: 16 }}>
            Seu carrinho está vazio
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 8, textAlign: 'center' }}>
            Adicione camisas ao carrinho para comprar mais de uma de uma vez.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: '#3c3c3c' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#335336', paddingHorizontal: 16, paddingVertical: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Text style={{ color: '#D4AF37', fontSize: 16, fontWeight: '700' }}>← Voltar</Text>
          </Pressable>
          <Text style={{ color: '#EAEAEA', fontWeight: '800', fontSize: 17 }}>
            Carrinho ({items.length})
          </Text>
        </View>
        <Pressable onPress={clearCart} hitSlop={8}>
          <Text style={{ color: '#FF6B6B', fontSize: 13, fontWeight: '700' }}>Limpar tudo</Text>
        </Pressable>
      </View>

      {multiSeller && (
        <View style={{ backgroundColor: 'rgba(212,175,55,0.15)', borderBottomWidth: 1, borderColor: 'rgba(212,175,55,0.3)', paddingHorizontal: 16, paddingVertical: 10 }}>
          <Text style={{ color: '#D4AF37', fontSize: 12, fontWeight: '600' }}>
            ⚠ Itens de {sellerIds.length} vendedores diferentes. Cada vendedor será uma compra separada.
          </Text>
        </View>
      )}

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        {items.map((item) => {
          const photoUrl = item.photoKeys?.[0] ? getPhotoUrl(item.photoKeys[0]) : null;
          const price = (item.priceCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
          return (
            <View key={item.listingId} style={{
              backgroundColor: '#444444', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
              flexDirection: 'row', marginBottom: 12, overflow: 'hidden',
            }}>
              <View style={{ width: 90, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' }}>
                {photoUrl ? (
                  <Image source={{ uri: photoUrl }} style={{ width: 90, height: 90 }} resizeMode="cover" />
                ) : (
                  <Text style={{ fontSize: 32 }}>👕</Text>
                )}
              </View>
              <View style={{ flex: 1, padding: 12 }}>
                <Text style={{ color: '#EAEAEA', fontWeight: '800', fontSize: 14 }} numberOfLines={1}>
                  {item.teamName}
                </Text>
                <Text style={{ color: 'rgba(234,234,234,0.55)', fontSize: 12, marginTop: 2 }}>
                  {item.supplier} · {item.season} · Tam. {item.size}
                </Text>
                <Text style={{ color: '#335336', fontWeight: '900', fontSize: 16, marginTop: 6 }}>
                  {price}
                </Text>
              </View>
              <Pressable
                onPress={() => removeItem(item.listingId)}
                hitSlop={8}
                style={{ padding: 12, justifyContent: 'center' }}
              >
                <Trash2 size={18} color="#B91C1C" />
              </Pressable>
            </View>
          );
        })}
      </ScrollView>

      {/* Bottom bar */}
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#444444', paddingHorizontal: 16, paddingBottom: 28, paddingTop: 12,
        borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ color: '#EAEAEA', fontWeight: '700', fontSize: 15 }}>
            Total ({items.length} {items.length === 1 ? 'item' : 'itens'})
          </Text>
          <Text style={{ color: '#335336', fontWeight: '900', fontSize: 18 }}>{totalBrl}</Text>
        </View>
        {multiSeller ? (
          <View style={{ gap: 10 }}>
            {sellerIds.map((sellerId) => {
              const sellerItems = items.filter((i) => i.sellerId === sellerId);
              const sellerName = sellerItems[0].sellerName ?? 'Vendedor';
              return (
                <Pressable
                  key={sellerId}
                  onPress={() => navigation.navigate('Checkout', { listing: sellerItems[0] as unknown as import('../../navigation/types').ListingParam })}
                  style={({ pressed }) => ({
                    backgroundColor: pressed ? '#B8942E' : '#D4AF37',
                    borderRadius: 14, paddingVertical: 14, alignItems: 'center',
                  })}
                >
                  <Text style={{ color: '#211B15', fontWeight: '800', fontSize: 15 }}>
                    Comprar de {sellerName} ({sellerItems.length} item)
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <Pressable
            onPress={() => navigation.navigate('Checkout', { listing: items[0] as unknown as import('../../navigation/types').ListingParam })}
            style={({ pressed }) => ({
              backgroundColor: pressed ? '#B8942E' : '#D4AF37',
              borderRadius: 14, paddingVertical: 16, alignItems: 'center',
            })}
          >
            <Text style={{ color: '#211B15', fontWeight: '800', fontSize: 16 }}>
              Finalizar compra · {totalBrl}
            </Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

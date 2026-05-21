import { useCallback, useRef, useState } from 'react';
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
import { getPhotoUrl } from '../../utils/env';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { Pencil, Trash2, Shirt } from 'lucide-react-native';

import { useAuthStore } from '../../store/auth.store';
import type { MainTabParamList } from '../../navigation/types';
import { ListingsApi, type ListingPublic } from '../../api/listings';
import { TabHomeIcon } from '../../components/BrandIcons';

const LISTING_CAP = 20;

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function ListingBar({ active, cap }: { active: number; cap: number }) {
  const pct = Math.min(active / cap, 1);
  const minWidth = active === 0 ? 0 : Math.max(pct * 100, 4);
  return (
    <View style={{ marginTop: 12 }}>
      <View style={{ height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999 }}>
        <View
          style={{
            width: active === 0 ? 0 : `${minWidth}%`,
            minWidth: active > 0 ? 12 : 0,
            backgroundColor: '#D4AF37',
            height: '100%',
            borderRadius: 999,
          }}
        />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>{active} publicados</Text>
        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>{cap - active} disponíveis</Text>
      </View>
    </View>
  );
}

const CONDITION_LABEL: Record<string, string> = {
  COM_ETIQUETA: 'Com etiqueta',
  PERFEITA:     'Perfeita',
  EXCELENTE:    'Excelente',
  BOA:          'Boa',
  REGULAR:      'Regular',
  DESGASTADA:   'Desgastada',
};

const GARMENT_LABEL: Record<string, string> = {
  LOJA: 'Versão loja',
  JOGO: 'Versão jogo',
};

function Badge({ text }: { text: string }) {
  return (
    <View style={{ backgroundColor: '#EFEFEF', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
      <Text style={{ color: '#6B6357', fontSize: 11, fontWeight: '600' }}>{text}</Text>
    </View>
  );
}

function ListingCard({
  item,
  onEditPrice,
  onRemove,
}: {
  item: ListingPublic;
  onEditPrice: (item: ListingPublic) => void;
  onRemove: (item: ListingPublic) => void;
}) {
  const price = (item.priceCents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  return (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5DCC4',
        marginBottom: 10,
        flexDirection: 'row',
      }}
    >
      {/* Photo */}
      <View
        style={{
          width: 100,
          backgroundColor: '#EFEFEF',
          alignItems: 'center',
          justifyContent: 'center',
          borderRightWidth: 1,
          borderColor: '#E5DCC4',
          overflow: 'hidden',
          borderTopLeftRadius: 15,
          borderBottomLeftRadius: 15,
        }}
      >
        {item.photoKeys?.[0] && getPhotoUrl(item.photoKeys[0]) ? (
          <Image
            source={{ uri: getPhotoUrl(item.photoKeys[0])! }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        ) : (
          <Shirt size={36} color="#335336" />
        )}
      </View>

      {/* Info */}
      <View style={{ flex: 1, padding: 12 }}>
        <Text style={{ color: '#1C1A14', fontWeight: '800', fontSize: 14 }} numberOfLines={1}>
          {item.teamName}
        </Text>
        <Text style={{ color: '#6B6357', fontSize: 12, marginTop: 2 }}>
          {item.supplier} · {item.season}
        </Text>
        <View style={{ flexDirection: 'row', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
          <Badge text={`Tam. ${item.size}`} />
          <Badge text={GARMENT_LABEL[item.garmentType] ?? item.garmentType} />
          <Badge text={CONDITION_LABEL[item.condition] ?? item.condition} />
        </View>

        {/* Price + buttons on same row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, flexWrap: 'wrap', gap: 6 }}>
          <Text style={{ color: '#335336', fontWeight: '800', fontSize: 15, marginRight: 4 }}>
            {price}
          </Text>
          <Pressable
            onPress={() => onEditPrice(item)}
            hitSlop={8}
            style={({ pressed }) => ({
              backgroundColor: pressed ? '#EDE8DC' : '#EFEFEF',
              borderRadius: 8,
              paddingHorizontal: 8,
              paddingVertical: 4,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 3,
              borderWidth: 1,
              borderColor: '#E5DCC4',
            })}
          >
            <Pencil size={11} color="#335336" />
            <Text style={{ color: '#335336', fontSize: 11, fontWeight: '700' }}>Preço</Text>
          </Pressable>
          <Pressable
            onPress={() => onRemove(item)}
            hitSlop={8}
            style={({ pressed }) => ({
              backgroundColor: pressed ? '#F5D0D0' : '#FEE2E2',
              borderRadius: 8,
              paddingHorizontal: 8,
              paddingVertical: 4,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 3,
              borderWidth: 1,
              borderColor: '#FECACA',
            })}
          >
            <Trash2 size={11} color="#B91C1C" />
            <Text style={{ color: '#B91C1C', fontSize: 11, fontWeight: '700' }}>Remover</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <Text style={{ color: '#9C9486', fontSize: 18, transform: [{ rotate: open ? '90deg' : '0deg' }] }}>
      ›
    </Text>
  );
}

export function HomeScreen() {
  const user                   = useAuthStore((s) => s.user);
  const setListingsActiveCount = useAuthStore((s) => s.setListingsActiveCount);
  const nav                    = useNavigation<BottomTabNavigationProp<MainTabParamList>>();

  const firstName = user?.displayName?.split(' ')[0] ?? 'Vendedor';

  const [open, setOpen]         = useState(false);
  const [listings, setListings] = useState<ListingPublic[]>([]);
  const [loading, setLoading]   = useState(true);

  // Source of truth: actual fetched listings, not the stale DynamoDB counter
  const active = loading ? (user?.listingsActiveCount ?? 0) : listings.length;

  // Price edit bottom sheet
  const [editingItem, setEditingItem]   = useState<ListingPublic | null>(null);
  const [priceText, setPriceText]       = useState('');
  const [saving, setSaving]             = useState(false);
  const inputRef                        = useRef<TextInput>(null);

  const confirmRemove = async (item: ListingPublic) => {
    const ok = typeof window !== 'undefined'
      ? window.confirm(`Remover "${item.teamName}"? Esta ação não pode ser desfeita.`)
      : true;
    if (!ok) return;
    try {
      await ListingsApi.remove(item.listingId);
      setListings((prev) => prev.filter((l) => l.listingId !== item.listingId));
      const store = useAuthStore.getState();
      store.setListingsActiveCount(Math.max(0, (store.user?.listingsActiveCount ?? 1) - 1));
    } catch {
      if (typeof window !== 'undefined') window.alert('Não foi possível remover o anúncio.');
    }
  };

  const openPriceSheet = (item: ListingPublic) => {
    setPriceText(String((item.priceCents / 100).toFixed(2)).replace('.', ','));
    setEditingItem(item);
    setTimeout(() => inputRef.current?.focus(), 150);
  };

  const closePriceSheet = () => {
    setEditingItem(null);
    setPriceText('');
  };

  const savePrice = async () => {
    if (!editingItem) return;
    const parsed = parseFloat(priceText.replace(',', '.'));
    if (isNaN(parsed) || parsed < 1) {
      Alert.alert('Preço inválido', 'Digite um valor mínimo de R$ 1,00.');
      return;
    }
    const priceCents = Math.round(parsed * 100);
    setSaving(true);
    try {
      const updated = await ListingsApi.updatePrice(editingItem.listingId, priceCents);
      setListings((prev) => prev.map((l) => l.listingId === updated.listingId ? updated : l));
      closePriceSheet();
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar o preço. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const hasLoaded = useRef(false);

  const fetchListings = useCallback(() => {
    if (!hasLoaded.current) setLoading(true);
    ListingsApi.mine()
      .then((data) => {
        setListings(data);
        setListingsActiveCount(data.length);
        hasLoaded.current = true;
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [setListingsActiveCount]);

  useFocusEffect(useCallback(() => { fetchListings(); }, [fetchListings]));

  const toggleOpen = () => { setOpen((v) => !v); };

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: '#3c3c3c' }}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Header card ─────────────────────────────────── */}
        <LinearGradient
          colors={['#335336', '#2A4429']}
          style={{ paddingHorizontal: 20, paddingTop: 28, paddingBottom: 28 }}
        >
          {/* Avatar + name */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <View
              style={{
                width: 44, height: 44, borderRadius: 22,
                backgroundColor: '#D4AF37',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#211B15', fontWeight: '900', fontSize: 16 }}>
                {initials(user?.displayName ?? 'U')}
              </Text>
            </View>
            <View>
              <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>Olá,</Text>
              <Text style={{ color: '#EAEAEA', fontWeight: '800', fontSize: 16 }}>{firstName}</Text>
            </View>
          </View>

          {/* Counter */}
          <View
            style={{
              backgroundColor: 'rgba(0,0,0,0.25)',
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: 'rgba(212,175,55,0.25)',
            }}
          >
            <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>
              MEUS ANÚNCIOS
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginTop: 4 }}>
              <Text style={{ color: '#D4AF37', fontSize: 40, fontWeight: '900', lineHeight: 46 }}>
                {active}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 18, fontWeight: '600', marginBottom: 4 }}>
                / {LISTING_CAP}
              </Text>
            </View>
            <ListingBar active={active} cap={LISTING_CAP} />
          </View>
        </LinearGradient>

        {/* ── Content area ────────────────────────────────── */}
        <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 32 }}>

          {loading ? (
            <ActivityIndicator color="#335336" size="large" style={{ marginTop: 40 }} />
          ) : active === 0 ? (
            /* Empty state */
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 20,
                padding: 32,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#E5DCC4',
                borderStyle: 'dashed',
              }}
            >
              <View
                style={{
                  width: 64, height: 64, borderRadius: 32,
                  backgroundColor: '#EFEFEF',
                  alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <Shirt size={28} color="#335336" />
              </View>
              <Text style={{ color: '#1C1A14', fontWeight: '800', fontSize: 17, marginBottom: 8 }}>
                Nenhuma camisa ainda
              </Text>
              <Text style={{ color: '#9C9486', textAlign: 'center', fontSize: 14, lineHeight: 20, marginBottom: 24 }}>
                Publique suas camisas autênticas e comece a vender para colecionadores de todo o Brasil.
              </Text>
              <Pressable
                onPress={() => nav.navigate('NewListing')}
                style={{
                  backgroundColor: '#D4AF37',
                  borderRadius: 14,
                  paddingVertical: 13,
                  paddingHorizontal: 32,
                }}
              >
                <Text style={{ color: '#211B15', fontWeight: '800', fontSize: 15 }}>
                  Anunciar camisa
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
              {/* ── "Minhas camisas" collapsible tab ── */}
              <Pressable
                onPress={toggleOpen}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? '#EDE8DC' : '#FFFFFF',
                  borderRadius: open ? undefined : 16,
                  borderTopLeftRadius: 16,
                  borderTopRightRadius: 16,
                  borderBottomLeftRadius: open ? 0 : 16,
                  borderBottomRightRadius: open ? 0 : 16,
                  borderWidth: 1,
                  borderColor: '#E5DCC4',
                  borderBottomWidth: open ? 0 : 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                })}
              >
                <TabHomeIcon size={20} color="#335336" />
                <Text style={{ flex: 1, color: '#1C1A14', fontWeight: '700', fontSize: 15, marginLeft: 10 }}>
                  Minhas camisas
                </Text>
                <View
                  style={{
                    backgroundColor: '#335336',
                    borderRadius: 20,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    marginRight: 8,
                  }}
                >
                  <Text style={{ color: '#D4AF37', fontWeight: '800', fontSize: 12 }}>{active}</Text>
                </View>
                <ChevronIcon open={open} />
              </Pressable>

              {/* Listing cards panel */}
              {open && (
                <View
                  style={{
                    backgroundColor: '#FDFAF5',
                    borderWidth: 1,
                    borderTopWidth: 0,
                    borderColor: '#E5DCC4',
                    borderBottomLeftRadius: 16,
                    borderBottomRightRadius: 16,
                    padding: 12,
                  }}
                >
                  {listings.map((item) => (
                    <ListingCard
                      key={item.listingId}
                      item={item}
                      onEditPrice={openPriceSheet}
                      onRemove={confirmRemove}
                    />
                  ))}
                </View>
              )}

            </>
          )}

        </View>
      </ScrollView>

      {/* ── Price edit bottom sheet ─────────────────────── */}
      <Modal
        visible={editingItem !== null}
        transparent
        animationType="slide"
        onRequestClose={closePriceSheet}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }}
          onPress={closePriceSheet}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
              paddingBottom: 36,
            }}
          >
            {/* Handle */}
            <View
              style={{
                width: 40, height: 4, borderRadius: 2,
                backgroundColor: '#E5DCC4',
                alignSelf: 'center',
                marginBottom: 20,
              }}
            />

            <Text style={{ color: '#1C1A14', fontWeight: '800', fontSize: 17, marginBottom: 4 }}>
              Atualizar preço
            </Text>
            <Text style={{ color: '#9C9486', fontSize: 13, marginBottom: 20 }}>
              {editingItem?.teamName} · {editingItem?.supplier} · {editingItem?.season}
            </Text>

            {/* Price input */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 2,
                borderColor: '#335336',
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 12,
                marginBottom: 20,
              }}
            >
              <Text style={{ color: '#335336', fontWeight: '800', fontSize: 18, marginRight: 4 }}>R$</Text>
              <TextInput
                ref={inputRef}
                value={priceText}
                onChangeText={setPriceText}
                keyboardType="decimal-pad"
                style={{ flex: 1, fontSize: 22, fontWeight: '800', color: '#1C1A14' }}
                placeholder="0,00"
                placeholderTextColor="#C4BDB5"
                selectTextOnFocus
              />
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Pressable
                onPress={savePrice}
                disabled={saving}
                style={({ pressed }) => ({
                  backgroundColor: saving ? '#9C9486' : pressed ? '#B8942E' : '#D4AF37',
                  borderRadius: 14,
                  paddingVertical: 15,
                  paddingHorizontal: 32,
                  alignItems: 'center',
                })}
              >
                {saving
                  ? <ActivityIndicator color="#211B15" />
                  : <Text style={{ color: '#211B15', fontWeight: '800', fontSize: 16 }}>Salvar</Text>
                }
              </Pressable>

              <View style={{ flex: 1 }} />

              <Pressable
                onPress={closePriceSheet}
                disabled={saving}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? '#B8942E' : '#D4AF37',
                  borderRadius: 14,
                  paddingVertical: 15,
                  paddingHorizontal: 20,
                  alignItems: 'center',
                })}
              >
                <Text style={{ color: '#211B15', fontWeight: '800', fontSize: 16 }}>Cancelar</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

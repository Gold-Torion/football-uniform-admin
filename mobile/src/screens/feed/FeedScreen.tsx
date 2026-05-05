import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  PanResponder,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';

import { ListingsApi, type ListingPublic } from '../../api/listings';
import type { RootStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/auth.store';

// ── Constants ─────────────────────────────────────────────────────────────────

const PRICE_MIN = 99;
const PRICE_MAX = 5000;
const THUMB_R   = 13;

const CONDITION_LABEL: Record<string, string> = {
  COM_ETIQUETA: 'Com etiqueta',
  PERFEITA:     'Perfeita',
  EXCELENTE:    'Excelente',
  BOA:          'Boa',
  REGULAR:      'Regular',
  DESGASTADA:   'Desgastada',
};

const KIND_FILTERS = [
  { label: 'Todos',    value: null },
  { label: 'Clubes',   value: 'TIME' },
  { label: 'Seleções', value: 'SELECAO' },
  { label: '⭐ MPC',   value: 'MPC' },
] as const;

type KindFilter = 'TIME' | 'SELECAO' | 'MPC' | null;

// ── PriceRangeSlider ──────────────────────────────────────────────────────────

function PriceRangeSlider({
  values,
  onChange,
}: {
  values: [number, number];
  onChange: (v: [number, number]) => void;
}) {
  const [trackW, setTrackW] = useState(0);

  // Refs so PanResponder closures always see fresh data
  const valRef   = useRef(values);
  valRef.current = values;
  const trackRef = useRef(0);

  const snap = (raw: number) =>
    Math.max(PRICE_MIN, Math.min(PRICE_MAX, Math.round(raw / 100) * 100));

  const INSET = THUMB_R / 2;

  const usable = () => Math.max(1, trackRef.current - INSET * 2);

  const toPx = (val: number) =>
    INSET + ((val - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * usable();

  const toVal = (px: number) =>
    snap(PRICE_MIN + (Math.max(0, Math.min(usable(), px - INSET)) / usable()) * (PRICE_MAX - PRICE_MIN));

  const lStart = useRef(0);
  const rStart = useRef(0);

  const leftPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder:         () => true,
      onMoveShouldSetPanResponder:          () => true,
      onPanResponderTerminationRequest:     () => false,
      onPanResponderGrant: () => {
        lStart.current = toPx(valRef.current[0]);
      },
      onPanResponderMove: (_, { dx }) => {
        if (!trackRef.current) return;
        const maxPx = toPx(valRef.current[1]) - THUMB_R * 2.5;
        onChange([toVal(Math.min(maxPx, lStart.current + dx)), valRef.current[1]]);
      },
      onPanResponderRelease: (_, { dx }) => {
        if (!trackRef.current) return;
        const maxPx = toPx(valRef.current[1]) - THUMB_R * 2.5;
        onChange([toVal(Math.min(maxPx, lStart.current + dx)), valRef.current[1]]);
      },
    })
  ).current;

  const rightPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder:         () => true,
      onMoveShouldSetPanResponder:          () => true,
      onPanResponderTerminationRequest:     () => false,
      onPanResponderGrant: () => {
        rStart.current = toPx(valRef.current[1]);
      },
      onPanResponderMove: (_, { dx }) => {
        if (!trackRef.current) return;
        const minPx = toPx(valRef.current[0]) + THUMB_R * 2.5;
        onChange([valRef.current[0], toVal(Math.max(minPx, rStart.current + dx))]);
      },
      onPanResponderRelease: (_, { dx }) => {
        if (!trackRef.current) return;
        const minPx = toPx(valRef.current[0]) + THUMB_R * 2.5;
        onChange([valRef.current[0], toVal(Math.max(minPx, rStart.current + dx))]);
      },
    })
  ).current;

  const isDefault = values[0] === PRICE_MIN && values[1] === PRICE_MAX;
  const lPx = toPx(values[0]);
  const rPx = toPx(values[1]);

  const labelLeft  = `R$ ${values[0].toLocaleString('pt-BR')}`;
  const labelRight = `R$ ${values[1].toLocaleString('pt-BR')}${values[1] >= PRICE_MAX ? '+' : ''}`;

  return (
    <View style={{ marginTop: 14 }}>
      {/* Label row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
        <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '700', letterSpacing: 0.5, flex: 1 }}>
          PREÇO
        </Text>
        <Text style={{ color: isDefault ? 'rgba(255,255,255,0.45)' : '#D4AF37', fontSize: 12, fontWeight: '800' }}>
          {isDefault ? 'Todos os preços' : `${labelLeft} – ${labelRight}`}
        </Text>
      </View>

      {/* Track area — height = thumb diameter so thumbs fit without clipping */}
      <View
        style={{ height: THUMB_R * 2 }}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          setTrackW(w);
          trackRef.current = w;
        }}
      >
        {/* Background track — inset by INSET so it aligns with thumb travel range */}
        <View style={{
          position: 'absolute', left: THUMB_R / 2, right: THUMB_R / 2,
          height: 4, top: THUMB_R - 2,
          backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2,
        }} />

        {trackW > 0 && (
          <>
            {/* Active fill */}
            <View style={{
              position: 'absolute',
              left: lPx,
              width: Math.max(0, rPx - lPx),
              height: 4,
              top: THUMB_R - 2,
              backgroundColor: isDefault ? 'rgba(255,255,255,0.35)' : '#D4AF37',
              borderRadius: 2,
            }} />

            {/* Left thumb */}
            <View
              {...leftPan.panHandlers}
              style={{
                position: 'absolute',
                left: lPx - THUMB_R,
                top: 0,
                width: THUMB_R * 2,
                height: THUMB_R * 2,
                borderRadius: THUMB_R,
                backgroundColor: '#FFF',
                borderWidth: 3,
                borderColor: '#D4AF37',
                elevation: 5,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 3,
              }}
            />

            {/* Right thumb */}
            <View
              {...rightPan.panHandlers}
              style={{
                position: 'absolute',
                left: rPx - THUMB_R,
                top: 0,
                width: THUMB_R * 2,
                height: THUMB_R * 2,
                borderRadius: THUMB_R,
                backgroundColor: '#FFF',
                borderWidth: 3,
                borderColor: '#D4AF37',
                elevation: 5,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 3,
              }}
            />
          </>
        )}
      </View>

      {/* Min / Max axis labels */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
        <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>R$ 99</Text>
        <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>R$ 5.000+</Text>
      </View>
    </View>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────

function Badge({ text }: { text: string }) {
  return (
    <View style={{ backgroundColor: '#F4EFE3', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
      <Text style={{ color: '#6B6357', fontSize: 11, fontWeight: '600' }}>{text}</Text>
    </View>
  );
}

// ── ListingCard ───────────────────────────────────────────────────────────────

function ListingCard({ item, onPress }: { item: ListingPublic; onPress: () => void }) {
  const price = (item.priceCents / 100).toLocaleString('pt-BR', {
    style: 'currency', currency: 'BRL',
  });

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: pressed ? '#F0EAD8' : '#FFF',
        borderRadius: 16,
        borderWidth: item.isMpc ? 2 : 1,
        borderColor: item.isMpc ? '#D4AF37' : '#E5DCC4',
        marginHorizontal: 16,
        marginBottom: 12,
        overflow: 'hidden',
        opacity: pressed ? 0.82 : 1,
        transform: [{ scale: pressed ? 0.97 : 1 }],
      })}
    >
      <View style={{ flexDirection: 'row' }}>
        {/* Photo placeholder */}
        <View
          style={{
            width: 96,
            backgroundColor: '#F4EFE3',
            alignItems: 'center',
            justifyContent: 'center',
            borderRightWidth: 1,
            borderColor: '#E5DCC4',
          }}
        >
          <Text style={{ fontSize: 30 }}>👕</Text>
          <Text style={{ fontSize: 10, color: '#9C9486', marginTop: 4 }}>
            {item.kind === 'SELECAO' ? '🌎' : '🏟️'}
          </Text>
        </View>

        {/* Info */}
        <View style={{ flex: 1, padding: 12 }}>
          <Text style={{ color: '#1C1A14', fontWeight: '800', fontSize: 15 }} numberOfLines={1}>
            {item.teamName}
          </Text>
          <Text style={{ color: '#6B6357', fontSize: 13, marginTop: 2 }}>
            {item.supplier} · {item.season}
          </Text>
          {item.sellerName ? (
            <Text style={{ color: '#9C9486', fontSize: 11, marginTop: 1 }}>
              Vendedor: {item.sellerName}
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            <Badge text={`Tam. ${item.size}`} />
            <Badge text={CONDITION_LABEL[item.condition] ?? item.condition} />
            {item.isMpc && (
              <View style={{ backgroundColor: '#D4AF37', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                <Text style={{ color: '#211B15', fontSize: 11, fontWeight: '800' }}>⭐ MPC</Text>
              </View>
            )}
          </View>
          <Text style={{ color: '#335336', fontWeight: '900', fontSize: 17, marginTop: 8 }}>
            {price}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

// ── FeedScreen ────────────────────────────────────────────────────────────────

export function FeedScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const user = useAuthStore((s) => s.user);
  const [listings, setListings]     = useState<ListingPublic[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter]         = useState<KindFilter>(null);
  const [query, setQuery]           = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([PRICE_MIN, PRICE_MAX]);

  const hasLoaded = useRef(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else if (!hasLoaded.current) setLoading(true);
    try {
      const data = await ListingsApi.feed();
      setListings(data);
      hasLoaded.current = true;
    } catch {
      // silently fail — user can pull to refresh
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const filtered = useMemo(() => {
    const q           = query.trim().toLowerCase();
    const defaultMin  = priceRange[0] === PRICE_MIN;
    const defaultMax  = priceRange[1] === PRICE_MAX;

    return listings.filter((l) => {
      const matchKind = filter === 'MPC' ? l.isMpc : filter ? l.kind === filter : true;

      const matchQuery = q === '' ? true : (
        l.teamName.toLowerCase().includes(q) ||
        l.supplier.toLowerCase().includes(q) ||
        l.season.toLowerCase().includes(q) ||
        l.country.toLowerCase().includes(q)
      );

      // When right thumb is at PRICE_MAX (5000), no upper cap — show all prices above too
      const matchPrice = (
        (defaultMin || l.priceCents >= priceRange[0] * 100) &&
        (defaultMax || l.priceCents <= priceRange[1] * 100)
      );

      return matchKind && matchQuery && matchPrice;
    });
  }, [listings, filter, query, priceRange]);

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: '#F4EFE3' }}>

      {/* ── Header: search + filters + price slider ── */}
      <View style={{ backgroundColor: '#335336', paddingHorizontal: 16, paddingBottom: 16, paddingTop: 6 }}>

        {/* User badge */}
        {user && (
          <View style={{ alignItems: 'flex-end', marginBottom: 8 }}>
            <View style={{
              width: 34, height: 34, borderRadius: 17,
              backgroundColor: '#D4AF37',
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
            }}>
              <Text style={{ color: '#211B15', fontWeight: '900', fontSize: 12 }}>
                {user.displayName.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()}
              </Text>
            </View>
          </View>
        )}

        {/* Search bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(255,255,255,0.12)',
            borderRadius: 12,
            paddingHorizontal: 12,
            marginBottom: 10,
          }}
        >
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, marginRight: 8 }}>🔍</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar por time, fornecedor, temporada..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            style={{ flex: 1, color: '#FFF', fontSize: 14, paddingVertical: 10 }}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 18 }}>✕</Text>
            </Pressable>
          )}
        </View>

        {/* Kind filter chips */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {KIND_FILTERS.map((f) => {
            const active = filter === f.value;
            return (
              <Pressable
                key={String(f.value)}
                onPress={() => setFilter(f.value)}
                style={{
                  backgroundColor: active ? '#D4AF37' : 'rgba(255,255,255,0.12)',
                  borderRadius: 20,
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                }}
              >
                <Text style={{ color: active ? '#211B15' : '#FFF', fontWeight: '700', fontSize: 13 }}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Price range slider */}
        <PriceRangeSlider values={priceRange} onChange={setPriceRange} />
      </View>

      {loading ? (
        <ActivityIndicator color="#335336" size="large" style={{ marginTop: 60 }} />
      ) : filtered.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Text style={{ fontSize: 36, marginBottom: 12 }}>👕</Text>
          <Text style={{ color: '#1C1A14', fontWeight: '800', fontSize: 17, marginBottom: 8 }}>
            Nenhuma camisa encontrada
          </Text>
          <Text style={{ color: '#9C9486', textAlign: 'center', fontSize: 14, lineHeight: 20 }}>
            Tente ajustar os filtros ou o intervalo de preço.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.listingId}
          renderItem={({ item }) => (
            <ListingCard
              item={item}
              onPress={() => navigation.navigate('ListingDetail', { listing: item })}
            />
          )}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void load(true)}
              tintColor="#335336"
              colors={['#335336']}
            />
          }
          ListHeaderComponent={
            <Text style={{ color: '#9C9486', fontSize: 12, fontWeight: '700', marginLeft: 16, marginBottom: 8 }}>
              {filtered.length} camisa{filtered.length !== 1 ? 's' : ''} disponíve{filtered.length !== 1 ? 'is' : 'l'}
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { Heart, MapPin, Calendar, SlidersHorizontal, ChevronDown, ChevronUp, Star, Shirt, Building2, Search, X } from 'lucide-react-native';

import { ListingsApi, type ListingPublic } from '../../api/listings';
import { SearchApi } from '../../api/search';
import type { RootStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/auth.store';
import { getPhotoUrl } from '../../utils/env';

// ── Filter types ──────────────────────────────────────────────────────────────

type PriceFilter = null | 249 | 499 | 999;
type KindFilter  = 'TIME' | 'SELECAO' | 'MPC' | null;

const PRICE_BUTTONS: { label: string; value: PriceFilter }[] = [
  { label: 'Todos',        value: null },
  { label: 'Até R$249',    value: 249  },
  { label: 'Até R$499',    value: 499  },
  { label: 'Acima R$999',  value: 999  },
];

const KIND_FILTERS = [
  { label: 'Todos',    value: null },
  { label: 'Clubes',   value: 'TIME' },
  { label: 'Seleções', value: 'SELECAO' },
  { label: '⭐ MPC',   value: 'MPC' },
] as const;

const CONDITION_FILTERS = [
  { label: 'Com etiqueta', value: 'COM_ETIQUETA' },
  { label: 'Perfeita',     value: 'PERFEITA'     },
  { label: 'Excelente',    value: 'EXCELENTE'    },
  { label: 'Boa',          value: 'BOA'          },
  { label: 'Regular',      value: 'REGULAR'      },
];

const SIZE_FILTERS = ['PP', 'P', 'M', 'G', 'GG', 'XGG'];

const CONDITION_LABEL: Record<string, string> = {
  COM_ETIQUETA: 'Com etiqueta',
  PERFEITA:     'Perfeita',
  EXCELENTE:    'Excelente',
  BOA:          'Boa',
  REGULAR:      'Regular',
  DESGASTADA:   'Desgastada',
};

const CONDITION_COLOR: Record<string, string> = {
  COM_ETIQUETA: '#D4AF37',
  PERFEITA:     '#D4AF37',
  EXCELENTE:    '#D4AF37',
  BOA:          '#9C9486',
  REGULAR:      '#9C9486',
  DESGASTADA:   '#9C9486',
};

// ── Static events (will be replaced with API later) ───────────────────────────

const EVENTS = [
  {
    id: '1',
    title: 'Encontro de Colecionismo do Pacaembu',
    date: '13 de junho de 2026',
    location: 'Museu do Futebol · Pacaembu, São Paulo',
    image: null,
  },
];

// ── ListingCard (2-column grid) ───────────────────────────────────────────────

export function ListingCard({
  item,
  onPress,
  isFav,
  onToggleFav,
}: {
  item: ListingPublic;
  onPress: () => void;
  isFav: boolean;
  onToggleFav: () => void;
}) {
  const price = (item.priceCents / 100).toLocaleString('pt-BR', {
    style: 'currency', currency: 'BRL',
  });
  const photoUrl = item.photoKeys?.[0] ? getPhotoUrl(item.photoKeys[0]) : null;
  const conditionLabel = CONDITION_LABEL[item.condition] ?? item.condition;
  const badgeColor     = CONDITION_COLOR[item.condition] ?? '#9C9486';
  const avg = (item as ListingPublic & { ratingAvgAsSeller?: number }).ratingAvgAsSeller;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        backgroundColor: '#1a3a1c',
        borderRadius: 14,
        overflow: 'hidden',
        opacity: pressed ? 0.88 : 1,
        transform: [{ scale: pressed ? 0.97 : 1 }],
      })}
    >
      {/* Photo */}
      <View style={{ aspectRatio: 1, backgroundColor: '#122613', position: 'relative' }}>
        {photoUrl ? (
          <Image
            source={{ uri: photoUrl }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Shirt size={40} color="rgba(255,255,255,0.4)" />
          </View>
        )}

        {/* Condition badge */}
        <View style={{
          position: 'absolute', top: 8, left: 8,
          backgroundColor: badgeColor,
          borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
        }}>
          <Text style={{ color: '#1C1A14', fontSize: 10, fontWeight: '800' }}>
            {conditionLabel}
          </Text>
        </View>

        {/* Favorite button */}
        <Pressable
          onPress={(e) => { e.stopPropagation?.(); onToggleFav(); }}
          hitSlop={8}
          style={{
            position: 'absolute', top: 8, right: 8,
            width: 30, height: 30, borderRadius: 15,
            backgroundColor: 'rgba(0,0,0,0.45)',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Heart
            size={15}
            color={isFav ? '#FF6B6B' : '#fff'}
            fill={isFav ? '#FF6B6B' : 'transparent'}
          />
        </Pressable>
      </View>

      {/* Info */}
      <View style={{ padding: 10 }}>
        <Text style={{ color: '#EAEAEA', fontWeight: '800', fontSize: 13 }} numberOfLines={1}>
          {item.teamName}
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 2 }}>
          {item.season}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
          <Text style={{ color: '#D4AF37', fontWeight: '900', fontSize: 15 }}>
            {price}
          </Text>
          {avg != null && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Star size={11} color="#D4AF37" fill="#D4AF37" />
              <Text style={{ color: '#D4AF37', fontSize: 11, fontWeight: '700' }}>
                {avg.toFixed(1)}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

// ── Hero section ──────────────────────────────────────────────────────────────

function HeroSection({ onExplore, onSell }: { onExplore: () => void; onSell: () => void }) {
  return (
    <View style={{
      backgroundColor: '#1a3a1c',
      margin: 16,
      borderRadius: 18,
      padding: 20,
      borderWidth: 1,
      borderColor: 'rgba(212,175,55,0.3)',
    }}>
      <View style={{
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(212,175,55,0.15)',
        borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5,
        marginBottom: 14,
        borderWidth: 1, borderColor: 'rgba(212,175,55,0.4)',
        flexDirection: 'row', alignItems: 'center', gap: 6,
      }}>
        <Star size={11} color="#D4AF37" fill="#D4AF37" />
        <Text style={{ color: '#D4AF37', fontSize: 11, fontWeight: '700' }}>
          Novo na Arena
        </Text>
      </View>

      <Text style={{ color: '#EAEAEA', fontWeight: '900', fontSize: 22, lineHeight: 28, marginBottom: 10 }}>
        O maior marketplace de camisas de futebol do Brasil
      </Text>

      <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 19, marginBottom: 20 }}>
        Encontre camisas raras, originais e históricas. Compre e venda com segurança na maior comunidade de colecionadores.
      </Text>

      <Pressable
        onPress={onExplore}
        style={({ pressed }) => ({
          backgroundColor: pressed ? '#e8e8e8' : '#fff',
          borderRadius: 10, paddingVertical: 13,
          alignItems: 'center', marginBottom: 10,
          flexDirection: 'row', justifyContent: 'center', gap: 8,
        })}
      >
        <Text style={{ color: '#D4AF37', fontWeight: '700', fontSize: 15 }}>
          Explorar Catálogo
        </Text>
        <Text style={{ color: '#D4AF37', fontSize: 15 }}>→</Text>
      </Pressable>

      <Pressable
        onPress={onSell}
        style={({ pressed }) => ({
          backgroundColor: pressed ? '#e8e8e8' : '#fff',
          borderRadius: 10, paddingVertical: 13,
          alignItems: 'center',
        })}
      >
        <Text style={{ color: '#1C1A14', fontWeight: '700', fontSize: 15 }}>
          Anunciar Camisa
        </Text>
      </Pressable>
    </View>
  );
}

// ── Events section ────────────────────────────────────────────────────────────

function EventsSection() {
  return (
    <View style={{ paddingHorizontal: 16, marginBottom: 8, paddingTop: 16, paddingBottom: 4 }}>
      <Text style={{ color: '#1C1A14', fontWeight: '900', fontSize: 18, marginBottom: 4 }}>
        Eventos
      </Text>
      <Text style={{ color: '#9C9486', fontSize: 13, marginBottom: 14 }}>
        Encontros e feiras de colecionadores
      </Text>
      {EVENTS.map((ev) => (
        <View key={ev.id} style={{
          borderRadius: 14, overflow: 'hidden',
          borderWidth: 1, borderColor: '#E5DCC4',
          backgroundColor: '#fff', marginBottom: 12,
        }}>
          {/* Event image placeholder */}
          <View style={{
            height: 140, backgroundColor: '#1a3a1c',
            alignItems: 'flex-end', justifyContent: 'flex-end', padding: 12,
          }}>
            <Building2 size={32} color="rgba(255,255,255,0.6)" />
            <Text style={{ color: '#EAEAEA', fontWeight: '800', fontSize: 14, position: 'absolute', bottom: 12, left: 12 }}>
              {ev.title}
            </Text>
          </View>
          <View style={{ padding: 14, gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Calendar size={14} color="#9C9486" />
              <Text style={{ color: '#6B6357', fontSize: 13 }}>{ev.date}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MapPin size={14} color="#9C9486" />
              <Text style={{ color: '#6B6357', fontSize: 13 }}>{ev.location}</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

// ── Sell CTA section ──────────────────────────────────────────────────────────

function SellCTA({ onRegister, onLearnMore }: { onRegister: () => void; onLearnMore: () => void }) {
  return (
    <View style={{
      margin: 16, marginTop: 8,
      backgroundColor: '#1a3a1c',
      borderRadius: 18, padding: 20,
      borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)',
    }}>
      <Text style={{ color: '#EAEAEA', fontWeight: '900', fontSize: 18, marginBottom: 8 }}>
        Tem camisas para vender?
      </Text>
      <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 19, marginBottom: 20 }}>
        Cadastre-se gratuitamente e comece a anunciar suas camisas hoje mesmo. Alcance milhares de colecionadores.
      </Text>
      <Pressable
        onPress={onRegister}
        style={({ pressed }) => ({
          backgroundColor: pressed ? '#e8e8e8' : '#fff',
          borderRadius: 10, paddingVertical: 13,
          alignItems: 'center', marginBottom: 10,
        })}
      >
        <Text style={{ color: '#D4AF37', fontWeight: '700', fontSize: 15 }}>
          Criar conta grátis
        </Text>
      </Pressable>
      <Pressable
        onPress={onLearnMore}
        style={({ pressed }) => ({
          backgroundColor: pressed ? '#B8962B' : '#D4AF37',
          borderRadius: 10, paddingVertical: 13,
          alignItems: 'center',
        })}
      >
        <Text style={{ color: '#1C1A14', fontWeight: '700', fontSize: 15 }}>
          Conhecer mais
        </Text>
      </Pressable>
    </View>
  );
}

// ── FeedScreen ────────────────────────────────────────────────────────────────

export function FeedScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const user    = useAuthStore((s) => s.user);
  const isGuest = useAuthStore((s) => s.isGuest);
  const enterAsGuest = useAuthStore((s) => s.enterAsGuest);

  const [listings,      setListings]      = useState<ListingPublic[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [searchResults, setSearchResults] = useState<ListingPublic[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isSearchMode,  setIsSearchMode]  = useState(false);
  const [favorites,     setFavorites]     = useState<Set<string>>(new Set());

  const [filter,      setFilter]      = useState<KindFilter>(null);
  const [priceFilter, setPriceFilter] = useState<PriceFilter>(null);
  const [query,       setQuery]       = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [condFilter,  setCondFilter]  = useState<string | null>(null);
  const [sizeFilter,  setSizeFilter]  = useState<string | null>(null);
  const [catalogMode, setCatalogMode] = useState(false);

  const hasLoaded   = useRef(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else if (!hasLoaded.current) setLoading(true);
    try {
      const data = await ListingsApi.feed();
      setListings(data);
      hasLoaded.current = true;
    } catch { /* silently fail */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const runSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setIsSearchMode(false); setSearchResults([]); return; }
    setIsSearchMode(true);
    setSearchLoading(true);
    try {
      const algoliaFilters: string[] = [];
      if (filter === 'MPC') algoliaFilters.push('isMpc:true');
      else if (filter) algoliaFilters.push(`kind:${filter}`);
      const result = await SearchApi.search(q.trim(), algoliaFilters.join(' AND ') || undefined, 0, 40);
      setSearchResults(result.hits as ListingPublic[]);
    } catch { setIsSearchMode(false); } finally { setSearchLoading(false); }
  }, [filter]);

  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (!catalogMode) setCatalogMode(true);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (text.trim().length < 2) { setIsSearchMode(false); setSearchResults([]); return; }
    searchTimer.current = setTimeout(() => void runSearch(text), 350);
  };

  const filtered = useMemo(() => {
    const source = isSearchMode ? searchResults : listings;
    return source.filter((l) => {
      const matchKind = !isSearchMode
        ? (filter === 'MPC' ? l.isMpc : filter ? l.kind === filter : true)
        : true;
      const matchPrice = (() => {
        if (!priceFilter) return true;
        if (priceFilter === 249) return l.priceCents <= 24900;
        if (priceFilter === 499) return l.priceCents <= 49900;
        if (priceFilter === 999) return l.priceCents >= 99900;
        return true;
      })();
      const matchCond = !condFilter || l.condition === condFilter;
      const matchSize = !sizeFilter || l.size === sizeFilter;
      return matchKind && matchPrice && matchCond && matchSize;
    });
  }, [listings, searchResults, isSearchMode, filter, priceFilter, condFilter, sizeFilter]);

  const activeFilterCount = [priceFilter, condFilter, sizeFilter].filter(Boolean).length;

  const toggleFav = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const showHome = !catalogMode && !query;

  // ── Pair items for 2-column grid ──────────────────────────────────────────

  type Row = [ListingPublic, ListingPublic | null];
  const rows: Row[] = useMemo(() => {
    const r: Row[] = [];
    for (let i = 0; i < filtered.length; i += 2) {
      r.push([filtered[i], filtered[i + 1] ?? null]);
    }
    return r;
  }, [filtered]);

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: '#EFEFEF' }}>

      {/* ── Top bar ── */}
      <View style={{ backgroundColor: '#335336', paddingHorizontal: 16, paddingBottom: 12, paddingTop: 8 }}>
        {/* Logo + arena dos mantos + avatar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Image
              source={require('../../assets/title.png')}
              style={{ width: 30, height: 30 }}
              resizeMode="contain"
            />
            <Text style={{ color: '#D4AF37', fontWeight: '900', fontSize: 18 }}>
              Arena dos Mantos
            </Text>
          </View>
          {user && (
            <View style={{
              width: 34, height: 34, borderRadius: 17, backgroundColor: '#D4AF37',
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
            }}>
              <Text style={{ color: '#211B15', fontWeight: '900', fontSize: 12 }}>
                {user.displayName.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Search bar */}
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          backgroundColor: 'rgba(255,255,255,0.12)',
          borderRadius: 12, paddingHorizontal: 12, marginBottom: catalogMode ? 10 : 0,
        }}>
          <Search size={16} color="rgba(255,255,255,0.5)" style={{ marginRight: 8 }} />
          <TextInput
            value={query}
            onChangeText={handleQueryChange}
            onFocus={() => setCatalogMode(true)}
            placeholder="Buscar por time, fornecedor, temporada..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            style={{ flex: 1, color: '#FFF', fontSize: 14, paddingVertical: 10 }}
            returnKeyType="search"
            onSubmitEditing={() => void runSearch(query)}
          />
          {searchLoading && <ActivityIndicator size="small" color="rgba(255,255,255,0.6)" />}
          {(query.length > 0 || catalogMode) && (
            <Pressable onPress={() => { setQuery(''); setIsSearchMode(false); setSearchResults([]); setCatalogMode(false); }} hitSlop={8}>
              <X size={18} color="rgba(255,255,255,0.5)" style={{ marginLeft: 6 }} />
            </Pressable>
          )}
        </View>

        {/* Filters — only shown in catalog mode */}
        {catalogMode && (
          <>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {KIND_FILTERS.map((f) => {
                const active = filter === f.value;
                return (
                  <Pressable
                    key={String(f.value)}
                    onPress={() => setFilter(f.value)}
                    style={{
                      backgroundColor: active ? '#D4AF37' : 'rgba(255,255,255,0.12)',
                      borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
                    }}
                  >
                    <Text style={{ color: active ? '#211B15' : '#FFF', fontWeight: '700', fontSize: 13 }}>
                      {f.label}
                    </Text>
                  </Pressable>
                );
              })}
              <Pressable
                onPress={() => setFiltersOpen((v) => !v)}
                style={{
                  backgroundColor: activeFilterCount > 0 ? '#D4AF37' : 'rgba(255,255,255,0.12)',
                  borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
                  flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto',
                }}
              >
                <SlidersHorizontal size={14} color={activeFilterCount > 0 ? '#211B15' : '#FFF'} />
                {activeFilterCount > 0 && (
                  <Text style={{ color: '#211B15', fontWeight: '800', fontSize: 12 }}>{activeFilterCount}</Text>
                )}
                {filtersOpen
                  ? <ChevronUp   size={13} color={activeFilterCount > 0 ? '#211B15' : '#FFF'} />
                  : <ChevronDown size={13} color={activeFilterCount > 0 ? '#211B15' : '#FFF'} />
                }
              </Pressable>
            </View>

            {filtersOpen && (
              <View style={{ marginTop: 12, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.12)', paddingTop: 12 }}>
                <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 }}>PREÇO</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                  {PRICE_BUTTONS.map((p) => {
                    const active = priceFilter === p.value;
                    return (
                      <Pressable key={String(p.value)} onPress={() => setPriceFilter(p.value)}
                        style={{ backgroundColor: active ? '#D4AF37' : 'rgba(255,255,255,0.10)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: active ? '#D4AF37' : 'rgba(255,255,255,0.2)' }}>
                        <Text style={{ color: active ? '#211B15' : '#FFF', fontWeight: '700', fontSize: 12 }}>{p.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 }}>ESTADO</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                  {CONDITION_FILTERS.map((c) => {
                    const active = condFilter === c.value;
                    return (
                      <Pressable key={c.value} onPress={() => setCondFilter(active ? null : c.value)}
                        style={{ backgroundColor: active ? '#D4AF37' : 'rgba(255,255,255,0.10)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: active ? '#D4AF37' : 'rgba(255,255,255,0.2)' }}>
                        <Text style={{ color: active ? '#211B15' : '#FFF', fontWeight: '700', fontSize: 12 }}>{c.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 }}>TAMANHO</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
                  {SIZE_FILTERS.map((s) => {
                    const active = sizeFilter === s;
                    return (
                      <Pressable key={s} onPress={() => setSizeFilter(active ? null : s)}
                        style={{ backgroundColor: active ? '#D4AF37' : 'rgba(255,255,255,0.10)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, borderWidth: 1, borderColor: active ? '#D4AF37' : 'rgba(255,255,255,0.2)' }}>
                        <Text style={{ color: active ? '#211B15' : '#FFF', fontWeight: '700', fontSize: 12 }}>{s}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                {activeFilterCount > 0 && (
                  <Pressable onPress={() => { setPriceFilter(null); setCondFilter(null); setSizeFilter(null); }} style={{ alignSelf: 'flex-start', marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <X size={12} color="#FF6B6B" />
                    <Text style={{ color: '#FF6B6B', fontSize: 12, fontWeight: '700' }}>Limpar filtros</Text>
                  </Pressable>
                )}
              </View>
            )}
          </>
        )}
      </View>

      {/* ── Body ── */}
      {loading ? (
        <ActivityIndicator color="#335336" size="large" style={{ marginTop: 60 }} />
      ) : showHome ? (
        // ── HOME VIEW ─────────────────────────────────────────────────────────
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor="#335336" colors={['#335336']} />}
        >
          {/* Hero */}
          <HeroSection
            onExplore={() => setCatalogMode(true)}
            onSell={() => navigation.navigate('Main', { screen: 'NewListing' } as never)}
          />

          {/* Events */}
          <EventsSection />

          {/* Latest listings */}
          <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <Text style={{ color: '#1C1A14', fontWeight: '900', fontSize: 17 }}>
                As últimas camisas publicadas
              </Text>
              <Pressable onPress={() => setCatalogMode(true)}>
                <Text style={{ color: '#335336', fontWeight: '700', fontSize: 13 }}>Ver todos →</Text>
              </Pressable>
            </View>

            {listings.slice(0, 8).reduce<[ListingPublic, ListingPublic | null][]>((acc, _, i, arr) => {
              if (i % 2 === 0) acc.push([arr[i], arr[i + 1] ?? null]);
              return acc;
            }, []).map((pair, idx) => (
              <View key={idx} style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                <View style={{ flex: 1 }}>
                  <ListingCard
                    item={pair[0]}
                    onPress={() => navigation.navigate('ListingDetail', { listing: pair[0] })}
                    isFav={favorites.has(pair[0].listingId)}
                    onToggleFav={() => toggleFav(pair[0].listingId)}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  {pair[1] ? (
                    <ListingCard
                      item={pair[1]}
                      onPress={() => navigation.navigate('ListingDetail', { listing: pair[1]! })}
                      isFav={favorites.has(pair[1].listingId)}
                      onToggleFav={() => toggleFav(pair[1]!.listingId)}
                    />
                  ) : <View style={{ flex: 1 }} />}
                </View>
              </View>
            ))}
          </View>

          {/* Sell CTA */}
          {(!user || isGuest) && (
            <SellCTA
              onRegister={() => navigation.navigate('Auth', { screen: 'SignUp' } as never)}
              onLearnMore={() => setCatalogMode(true)}
            />
          )}
          <View style={{ height: 24 }} />
        </ScrollView>
      ) : (
        // ── CATALOG VIEW ──────────────────────────────────────────────────────
        filtered.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
            <Shirt size={36} color="#9C9486" style={{ marginBottom: 12 }} />
            <Text style={{ color: '#1C1A14', fontWeight: '800', fontSize: 17, marginBottom: 8 }}>
              Nenhuma camisa encontrada
            </Text>
            <Text style={{ color: '#9C9486', textAlign: 'center', fontSize: 14 }}>
              Tente ajustar os filtros.
            </Text>
          </View>
        ) : (
          <FlatList
            data={rows}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item: pair }) => (
              <View style={{ flexDirection: 'row', gap: 10, marginHorizontal: 16, marginBottom: 10 }}>
                <View style={{ flex: 1 }}>
                  <ListingCard
                    item={pair[0]}
                    onPress={() => navigation.navigate('ListingDetail', { listing: pair[0] })}
                    isFav={favorites.has(pair[0].listingId)}
                    onToggleFav={() => toggleFav(pair[0].listingId)}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  {pair[1] ? (
                    <ListingCard
                      item={pair[1]}
                      onPress={() => navigation.navigate('ListingDetail', { listing: pair[1]! })}
                      isFav={favorites.has(pair[1].listingId)}
                      onToggleFav={() => toggleFav(pair[1]!.listingId)}
                    />
                  ) : <View style={{ flex: 1 }} />}
                </View>
              </View>
            )}
            contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor="#335336" colors={['#335336']} />
            }
            ListHeaderComponent={
              <Text style={{ color: '#9C9486', fontSize: 12, fontWeight: '700', marginLeft: 16, marginBottom: 12 }}>
                {filtered.length} camisa{filtered.length !== 1 ? 's' : ''} disponíve{filtered.length !== 1 ? 'is' : 'l'}
              </Text>
            }
          />
        )
      )}
    </SafeAreaView>
  );
}

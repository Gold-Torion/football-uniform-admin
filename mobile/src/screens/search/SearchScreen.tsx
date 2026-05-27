import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { SlidersHorizontal, ChevronDown, ChevronUp, X } from 'lucide-react-native';

import { ListingsApi, type ListingPublic } from '../../api/listings';
import { SearchApi } from '../../api/search';
import type { RootStackParamList } from '../../navigation/types';
import { ListingCard } from '../feed/FeedScreen';

const PRICE_BUTTONS: { label: string; value: null | 249 | 499 | 999 }[] = [
  { label: 'Todos', value: null },
  { label: 'Até R$249', value: 249 },
  { label: 'Até R$499', value: 499 },
  { label: 'Acima R$999', value: 999 },
];

const CONDITION_FILTERS = [
  { label: 'Com etiqueta', value: 'COM_ETIQUETA' },
  { label: 'Perfeita',     value: 'PERFEITA'     },
  { label: 'Excelente',    value: 'EXCELENTE'    },
  { label: 'Boa',          value: 'BOA'          },
];

const SIZE_FILTERS = ['PP', 'P', 'M', 'G', 'GG', 'XGG'];

export function SearchScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [listings, setListings]         = useState<ListingPublic[]>([]);
  const [searchResults, setSearchResults] = useState<ListingPublic[]>([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [favorites, setFavorites]       = useState<Set<string>>(new Set());
  const [query, setQuery]               = useState('');
  const [priceFilter, setPriceFilter]   = useState<null | 249 | 499 | 999>(null);
  const [condFilter, setCondFilter]     = useState<string | null>(null);
  const [sizeFilter, setSizeFilter]     = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen]   = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef    = useRef<TextInput>(null);
  const hasLoaded   = useRef(false);

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

  useFocusEffect(useCallback(() => {
    void load();
    setTimeout(() => inputRef.current?.focus(), 300);
  }, [load]));

  const runSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setIsSearchMode(false); setSearchResults([]); return; }
    setIsSearchMode(true);
    setSearchLoading(true);
    try {
      const result = await SearchApi.search(q.trim(), undefined, 0, 40);
      setSearchResults(result.hits as ListingPublic[]);
    } catch { setIsSearchMode(false); } finally { setSearchLoading(false); }
  }, []);

  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (text.trim().length < 2) { setIsSearchMode(false); setSearchResults([]); return; }
    searchTimer.current = setTimeout(() => void runSearch(text), 350);
  };

  const filtered = useMemo(() => {
    const source = isSearchMode ? searchResults : listings;
    return source.filter((l) => {
      const matchPrice = !priceFilter ? true
        : priceFilter === 249 ? l.priceCents <= 24900
        : priceFilter === 499 ? l.priceCents <= 49900
        : l.priceCents >= 99900;
      const matchCond = !condFilter || l.condition === condFilter;
      const matchSize = !sizeFilter || l.size === sizeFilter;
      return matchPrice && matchCond && matchSize;
    });
  }, [listings, searchResults, isSearchMode, priceFilter, condFilter, sizeFilter]);

  const activeFilterCount = [priceFilter, condFilter, sizeFilter].filter(Boolean).length;

  const toggleFav = (id: string) => setFavorites(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next;
  });

  type Row = [ListingPublic, ListingPublic | null];
  const rows: Row[] = useMemo(() => {
    const r: Row[] = [];
    for (let i = 0; i < filtered.length; i += 2) r.push([filtered[i], filtered[i + 1] ?? null]);
    return r;
  }, [filtered]);

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: '#3c3c3c' }}>
      {/* Search header */}
      <View style={{ backgroundColor: '#335336', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <View style={{
            flex: 1, flexDirection: 'row', alignItems: 'center',
            backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, paddingHorizontal: 12,
          }}>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, marginRight: 8 }}>🔍</Text>
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={handleQueryChange}
              placeholder="Buscar por time, fornecedor..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              style={{ flex: 1, color: '#FFF', fontSize: 14, paddingVertical: 10 }}
              returnKeyType="search"
              onSubmitEditing={() => void runSearch(query)}
              autoFocus
            />
            {query.length > 0 && (
              <Pressable onPress={() => { setQuery(''); setIsSearchMode(false); setSearchResults([]); }} hitSlop={8}>
                <X size={16} color="rgba(255,255,255,0.5)" />
              </Pressable>
            )}
            {searchLoading && <ActivityIndicator size="small" color="rgba(255,255,255,0.6)" style={{ marginLeft: 4 }} />}
          </View>
          <Pressable
            onPress={() => setFiltersOpen(v => !v)}
            style={{
              backgroundColor: activeFilterCount > 0 ? '#D4AF37' : 'rgba(255,255,255,0.12)',
              borderRadius: 12, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 4,
            }}
          >
            <SlidersHorizontal size={16} color={activeFilterCount > 0 ? '#211B15' : '#FFF'} />
            {activeFilterCount > 0 && <Text style={{ color: '#211B15', fontWeight: '800', fontSize: 12 }}>{activeFilterCount}</Text>}
            {filtersOpen ? <ChevronUp size={13} color={activeFilterCount > 0 ? '#211B15' : '#FFF'} /> : <ChevronDown size={13} color={activeFilterCount > 0 ? '#211B15' : '#FFF'} />}
          </Pressable>
        </View>

        {filtersOpen && (
          <View style={{ borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.12)', paddingTop: 12 }}>
            <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 }}>PREÇO</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {PRICE_BUTTONS.map(p => {
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
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {CONDITION_FILTERS.map(c => {
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
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {SIZE_FILTERS.map(s => {
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
              <Pressable onPress={() => { setPriceFilter(null); setCondFilter(null); setSizeFilter(null); }} style={{ alignSelf: 'flex-start', marginTop: 10 }}>
                <Text style={{ color: '#FF6B6B', fontSize: 12, fontWeight: '700' }}>✕ Limpar filtros</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>

      {loading ? (
        <ActivityIndicator color="#335336" size="large" style={{ marginTop: 60 }} />
      ) : filtered.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Text style={{ fontSize: 36, marginBottom: 12 }}>🔍</Text>
          <Text style={{ color: '#EAEAEA', fontWeight: '800', fontSize: 17, marginBottom: 8, textAlign: 'center' }}>
            {query.length >= 2 ? 'Nenhum resultado encontrado' : 'Busque por time, marca ou temporada'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item: pair }) => (
            <View style={{ flexDirection: 'row', gap: 10, marginHorizontal: 16, marginBottom: 10 }}>
              <View style={{ flex: 1 }}>
                <ListingCard item={pair[0]} onPress={() => navigation.navigate('ListingDetail', { listing: pair[0] })} isFav={favorites.has(pair[0].listingId)} onToggleFav={() => toggleFav(pair[0].listingId)} />
              </View>
              <View style={{ flex: 1 }}>
                {pair[1] ? <ListingCard item={pair[1]} onPress={() => navigation.navigate('ListingDetail', { listing: pair[1]! })} isFav={favorites.has(pair[1].listingId)} onToggleFav={() => toggleFav(pair[1]!.listingId)} /> : <View style={{ flex: 1 }} />}
              </View>
            </View>
          )}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor="#335336" colors={['#335336']} />}
          ListHeaderComponent={
            <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: '700', marginLeft: 16, marginBottom: 12 }}>
              {filtered.length} camisa{filtered.length !== 1 ? 's' : ''} encontrada{filtered.length !== 1 ? 's' : ''}
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

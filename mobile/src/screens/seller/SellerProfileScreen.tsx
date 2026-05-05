import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../navigation/types';
import { RatingsApi, type UserRatingSummary } from '../../api/ratings';
import { ListingsApi, type ListingPublic } from '../../api/listings';

type Props = NativeStackScreenProps<RootStackParamList, 'SellerProfile'>;

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function StarDisplay({ average }: { average: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Text key={star} style={{ fontSize: 16, color: star <= Math.round(average) ? '#D4AF37' : '#E5DCC4' }}>
          {star <= Math.round(average) ? '★' : '☆'}
        </Text>
      ))}
    </View>
  );
}

// ── Listing card (2-column grid style) ───────────────────────────────────────

function MiniListingCard({ listing }: { listing: ListingPublic }) {
  const price = (listing.priceCents / 100).toLocaleString('pt-BR', {
    style: 'currency', currency: 'BRL',
  });

  return (
    <View style={{
      flex: 1,
      backgroundColor: '#fff',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#E5DCC4',
      padding: 12,
      minHeight: 120,
    }}>
      <View style={{
        width: '100%', aspectRatio: 1.2,
        backgroundColor: '#F4EFE3', borderRadius: 10,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 8,
      }}>
        <Text style={{ fontSize: 32 }}>👕</Text>
      </View>
      <Text style={{ color: '#1C1A14', fontWeight: '700', fontSize: 13, marginBottom: 2 }} numberOfLines={1}>
        {listing.teamName}
      </Text>
      <Text style={{ color: '#9C9486', fontSize: 11, marginBottom: 4 }} numberOfLines={1}>
        {listing.season} · {listing.size}
      </Text>
      <Text style={{ color: '#335336', fontWeight: '800', fontSize: 14 }}>{price}</Text>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export function SellerProfileScreen({ route, navigation }: Props) {
  const { sellerId, sellerName } = route.params;

  const [summary, setSummary]   = useState<UserRatingSummary | null>(null);
  const [listings, setListings] = useState<ListingPublic[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const [s, l] = await Promise.all([
          RatingsApi.getSummary(sellerId),
          ListingsApi.listBySeller(sellerId),
        ]);
        setSummary(s);
        setListings(l);
      } catch {
        // silently degrade
      } finally {
        setLoading(false);
      }
    })();
  }, [sellerId]);

  const sellerAvg   = summary?.asSeller.average ?? 0;
  const sellerCount = summary?.asSeller.count ?? 0;

  // Split listings into 2-column rows
  const rows: ListingPublic[][] = [];
  for (let i = 0; i < listings.length; i += 2) {
    rows.push(listings.slice(i, i + 2));
  }

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
        <Text style={{ color: '#F5E6B8', fontWeight: '800', fontSize: 17, flex: 1 }}>
          Perfil do Vendedor
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#335336" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

          {/* Hero section */}
          <View style={{
            backgroundColor: '#335336',
            borderRadius: 20,
            padding: 24,
            alignItems: 'center',
            marginBottom: 16,
          }}>
            <View style={{
              width: 72, height: 72, borderRadius: 36,
              backgroundColor: '#D4AF37',
              alignItems: 'center', justifyContent: 'center',
              marginBottom: 12,
            }}>
              <Text style={{ color: '#211B15', fontWeight: '900', fontSize: 26 }}>
                {getInitials(sellerName)}
              </Text>
            </View>
            <Text style={{ color: '#F5E6B8', fontWeight: '800', fontSize: 20, marginBottom: 8 }}>
              {sellerName}
            </Text>
            <StarDisplay average={sellerAvg} />
          </View>

          {/* Rating card */}
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#E5DCC4',
            padding: 16,
            marginBottom: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}>
            <Text style={{ fontSize: 28 }}>⭐</Text>
            <View>
              {sellerCount > 0 ? (
                <>
                  <Text style={{ color: '#1C1A14', fontWeight: '800', fontSize: 22 }}>
                    {sellerAvg.toFixed(1)} <Text style={{ color: '#9C9486', fontWeight: '400', fontSize: 16 }}>/ 5</Text>
                  </Text>
                  <Text style={{ color: '#9C9486', fontSize: 13, marginTop: 2 }}>
                    ({sellerCount} {sellerCount === 1 ? 'avaliação' : 'avaliações'})
                  </Text>
                </>
              ) : (
                <Text style={{ color: '#9C9486', fontSize: 15 }}>Sem avaliações ainda</Text>
              )}
            </View>
          </View>

          {/* Listings section */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ color: '#9C9486', fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>
              ANÚNCIOS ATIVOS
            </Text>
            {listings.length > 0 && (
              <View style={{
                backgroundColor: '#335336', borderRadius: 20,
                paddingHorizontal: 10, paddingVertical: 3,
              }}>
                <Text style={{ color: '#F5E6B8', fontSize: 12, fontWeight: '700' }}>
                  {listings.length}
                </Text>
              </View>
            )}
          </View>

          {listings.length === 0 ? (
            <View style={{
              backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#E5DCC4',
              padding: 24, alignItems: 'center',
            }}>
              <Text style={{ color: '#9C9486', fontSize: 15 }}>Nenhum anúncio ativo</Text>
            </View>
          ) : (
            rows.map((row, rowIdx) => (
              <View key={rowIdx} style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                {row.map((listing) => (
                  <MiniListingCard key={listing.listingId} listing={listing} />
                ))}
                {/* Fill empty slot if odd number */}
                {row.length === 1 && <View style={{ flex: 1 }} />}
              </View>
            ))
          )}

        </ScrollView>
      )}
    </SafeAreaView>
  );
}

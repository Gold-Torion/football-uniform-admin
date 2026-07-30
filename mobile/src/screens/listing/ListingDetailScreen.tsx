import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
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
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Shirt, Building2, Pencil, Trash2, ShoppingCart } from 'lucide-react-native';

import type { RootStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/auth.store';
import { useCartStore } from '../../store/cart.store';
import { ListingsApi } from '../../api/listings';
import { CommentsApi, type CommentPublic } from '../../api/comments';
import { getPhotoUrl } from '../../utils/env';
import { webAlert, webConfirm } from '../../utils/webAlert';

type Props = NativeStackScreenProps<RootStackParamList, 'ListingDetail'>;

// ── Labels ────────────────────────────────────────────────────────────────────

const CONDITION_LABEL: Record<string, string> = {
  COM_ETIQUETA: 'Com etiqueta',
  PERFEITA:     'Perfeita',
  EXCELENTE:    'Excelente',
  BOA:          'Boa',
  REGULAR:      'Regular',
  DESGASTADA:   'Desgastada',
};

const MODEL_LABEL: Record<string, string> = {
  TITULAR:      'Titular',
  RESERVA:      'Reserva',
  TERCEIRA:     'Terceira',
  GOLEIRO:      'Goleiro',
  TREINO:       'Treino',
  COMEMORATIVA: 'Comemorativa',
};

const CONTINENT_LABEL: Record<string, string> = {
  AMERICA: 'América',
  EUROPA:  'Europa',
  ASIA:    'Ásia',
  AFRICA:  'África',
  OCEANIA: 'Oceania',
};

const GARMENT_LABEL: Record<string, string> = {
  LOJA: 'De loja',
  JOGO: 'De jogo',
};

const GENDER_LABEL: Record<string, string> = {
  MASCULINO: 'Masculino',
  FEMININO:  'Feminina',
};

// ── Time-ago helper ───────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diffMs  = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `há ${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `há ${diffH}h`;
  return `há ${Math.floor(diffH / 24)}d`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

// ── Sub-components ────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
      <Text style={{ color: 'rgba(234,234,234,0.5)', fontSize: 14 }}>{label}</Text>
      <Text style={{ color: '#EAEAEA', fontSize: 14, fontWeight: '600', maxWidth: '60%', textAlign: 'right' }}>{value}</Text>
    </View>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 }}>
        {title}
      </Text>
      <View style={{ backgroundColor: '#2a2a2a', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 16 }}>
        {children}
      </View>
    </View>
  );
}

function CommentCard({
  comment,
  currentUserId,
  onReport,
}: {
  comment: CommentPublic;
  currentUserId?: string;
  onReport: (comment: CommentPublic) => void;
}) {
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
    }}>
      {/* Avatar */}
      <View style={{
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: '#335336',
        alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        marginTop: 2,
      }}>
        <Text style={{ color: '#D4AF37', fontWeight: '800', fontSize: 10 }}>
          {getInitials(comment.authorName)}
        </Text>
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#EAEAEA', fontWeight: '700', fontSize: 14, marginBottom: 2 }}>
          {comment.authorName}
        </Text>
        <Text style={{ color: 'rgba(234,234,234,0.8)', fontSize: 14, lineHeight: 20 }}>
          {comment.body}
        </Text>
        <Text style={{ color: 'rgba(234,234,234,0.4)', fontSize: 11, marginTop: 4 }}>
          {timeAgo(comment.createdAt)}
        </Text>
      </View>

      {/* Flag button — only if not the author */}
      {currentUserId !== comment.authorId && (
        <Pressable onPress={() => onReport(comment)} hitSlop={8} style={{ paddingTop: 2 }}>
          <Text style={{ fontSize: 14, color: 'rgba(234,234,234,0.4)' }}>⚑</Text>
        </Pressable>
      )}
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export function ListingDetailScreen({ route, navigation }: Props) {
  const { listing } = route.params;
  const currentUser = useAuthStore((s) => s.user);
  const cartItemCount = useCartStore((s) => s.items.length);
  const addToCart     = useCartStore((s) => s.addItem);

  const [priceCents, setPriceCents] = useState(listing.priceCents);
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceText, setPriceText]       = useState('');
  const [saving, setSaving]             = useState(false);

  // Comments state
  const [comments, setComments]         = useState<CommentPublic[]>([]);
  const [commentText, setCommentText]   = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const commentInputRef                 = useRef<TextInput>(null);

  const price = (priceCents / 100).toLocaleString('pt-BR', {
    style: 'currency', currency: 'BRL',
  });

  const isOwner = currentUser?.userId === listing.sellerId;

  // Load comments on mount
  useEffect(() => {
    CommentsApi.list(listing.listingId)
      .then(setComments)
      .catch(() => { /* silently ignore */ });
  }, [listing.listingId]);

  const openPriceEdit = () => {
    setPriceText(String((priceCents / 100).toFixed(2)).replace('.', ','));
    setEditingPrice(true);
  };

  const savePrice = async () => {
    const parsed = parseFloat(priceText.replace(',', '.'));
    if (isNaN(parsed) || parsed < 1) {
      webAlert('Preço inválido', 'Digite um valor mínimo de R$ 1,00.');
      return;
    }
    setSaving(true);
    try {
      const updated = await ListingsApi.updatePrice(listing.listingId, Math.round(parsed * 100));
      setPriceCents(updated.priceCents);
      setEditingPrice(false);
    } catch {
      webAlert('Erro', 'Não foi possível atualizar o preço.');
    } finally {
      setSaving(false);
    }
  };

  const confirmRemove = () => {
    webConfirm(
      'Remover anúncio',
      `Tem certeza que quer remover "${listing.teamName}"? Esta ação não pode ser desfeita.`,
      async () => {
        try {
          await ListingsApi.remove(listing.listingId);
          const store = useAuthStore.getState();
          store.setListingsActiveCount(Math.max(0, (store.user?.listingsActiveCount ?? 1) - 1));
          navigation.goBack();
        } catch {
          webAlert('Erro', 'Não foi possível remover o anúncio.');
        }
      },
      undefined,
      'Remover',
    );
  };

  const sendComment = async () => {
    if (!commentText.trim() || sendingComment) return;
    const body = commentText.trim();
    setSendingComment(true);
    // Optimistic add
    const optimistic: CommentPublic = {
      commentId:   `local-${Date.now()}`,
      listingId:   listing.listingId,
      authorId:    currentUser?.userId ?? '',
      authorName:  currentUser?.displayName ?? 'Eu',
      body,
      status:      'ACTIVE',
      reportCount: 0,
      createdAt:   new Date().toISOString(),
    };
    setComments((prev) => [...prev, optimistic]);
    setCommentText('');
    try {
      const created = await CommentsApi.create(listing.listingId, body);
      setComments((prev) =>
        prev.map((c) => (c.commentId === optimistic.commentId ? created : c)),
      );
    } catch {
      // Revert optimistic
      setComments((prev) => prev.filter((c) => c.commentId !== optimistic.commentId));
      setCommentText(body);
      webAlert('Erro', 'Não foi possível enviar o comentário.');
    } finally {
      setSendingComment(false);
    }
  };

  const handleReport = (comment: CommentPublic) => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Denunciar comentário',
        'Motivo da denúncia:',
        async (reason) => {
          if (!reason?.trim()) return;
          try {
            await CommentsApi.report(listing.listingId, comment.commentId, reason.trim());
            webAlert('Denúncia enviada', 'Obrigado! Iremos analisar em breve.');
          } catch {
            webAlert('Erro', 'Não foi possível enviar a denúncia.');
          }
        },
        'plain-text',
      );
    } else {
      // Android: simple two-step flow
      Alert.alert(
        'Denunciar comentário',
        'Deseja denunciar este comentário como inadequado?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Denunciar',
            style: 'destructive',
            onPress: async () => {
              try {
                await CommentsApi.report(listing.listingId, comment.commentId, 'Conteúdo inadequado');
                webAlert('Denúncia enviada', 'Obrigado! Iremos analisar em breve.');
              } catch {
                webAlert('Erro', 'Não foi possível enviar a denúncia.');
              }
            },
          },
        ],
      );
    }
  };

  const goToSellerProfile = () => {
    navigation.navigate('SellerProfile', {
      sellerId:   listing.sellerId,
      sellerName: listing.sellerName ?? 'Vendedor',
    });
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
        <Text style={{ color: '#F5E6B8', fontWeight: '800', fontSize: 17, flex: 1 }} numberOfLines={1}>
          {listing.teamName}
        </Text>
        <Text style={{ color: '#D4AF37', fontWeight: '900', fontSize: 18 }}>{price}</Text>
        <Pressable onPress={() => navigation.navigate('Cart')} hitSlop={8} style={{ position: 'relative' }}>
          <ShoppingCart size={22} color="#D4AF37" />
          {cartItemCount > 0 && (
            <View style={{ position: 'absolute', top: -6, right: -6, backgroundColor: '#EF4444', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 }}>
              <Text style={{ color: '#fff', fontSize: 9, fontWeight: '900' }}>{cartItemCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 160 }}>

          {/* Fotos */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            <View style={{
              flex: 2, aspectRatio: 1, borderRadius: 16,
              backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
              alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
            }}>
              {listing.photoKeys?.[0] && getPhotoUrl(listing.photoKeys[0]) ? (
                <Image
                  source={{ uri: getPhotoUrl(listing.photoKeys[0])! }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              ) : (
                <>
                  <Shirt size={56} color="rgba(255,255,255,0.15)" />
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}>
                    <Building2 size={12} color="rgba(234,234,234,0.4)" />
                    <Text style={{ color: 'rgba(234,234,234,0.4)', fontSize: 12 }}>
                      {listing.kind === 'SELECAO' ? 'Seleção' : 'Time'}
                    </Text>
                  </View>
                </>
              )}
            </View>
            <View style={{ flex: 1, gap: 8 }}>
              {[1, 2].map((i) => {
                const photoUrl = listing.photoKeys?.[i] ? getPhotoUrl(listing.photoKeys[i]) : null;
                return (
                  <View key={i} style={{
                    flex: 1, borderRadius: 12, minHeight: 80,
                    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
                    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                  }}>
                    {photoUrl ? (
                      <Image source={{ uri: photoUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    ) : (
                      <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 22 }}>+</Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {/* Badges */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {[
              listing.kind === 'SELECAO' ? 'Seleção' : 'Time',
              `Tam. ${listing.size}`,
              CONDITION_LABEL[listing.condition] ?? listing.condition,
              GARMENT_LABEL[listing.garmentType] ?? listing.garmentType,
            ].map((t) => (
              <View key={t} style={{ backgroundColor: '#335336', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 }}>
                <Text style={{ color: '#F5E6B8', fontSize: 12, fontWeight: '700' }}>{t}</Text>
              </View>
            ))}
          </View>

          {/* Detalhes */}
          <SectionCard title="DETALHES">
            <InfoRow label="Continente" value={CONTINENT_LABEL[listing.continent] ?? listing.continent} />
            <InfoRow label="País"       value={listing.country} />
            <InfoRow label="Temporada"  value={listing.season} />
            <InfoRow label="Fornecedora" value={listing.supplier} />
            <InfoRow label="Modelo"     value={MODEL_LABEL[listing.model] ?? listing.model} />
            <InfoRow label="Tipo"       value={GARMENT_LABEL[listing.garmentType] ?? listing.garmentType} />
            <InfoRow label="Tamanho"    value={listing.size} />
            <InfoRow label="Gênero"     value={GENDER_LABEL[listing.gender] ?? listing.gender} />
            <View style={{ paddingVertical: 10 }}>
              <Text style={{ color: 'rgba(234,234,234,0.5)', fontSize: 14, marginBottom: 4 }}>Condição</Text>
              <View style={{ alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ color: '#335336', fontWeight: '700', fontSize: 13 }}>
                  {CONDITION_LABEL[listing.condition] ?? listing.condition}
                </Text>
              </View>
            </View>
          </SectionCard>

          {/* Descrição */}
          {listing.description ? (
            <SectionCard title="DESCRIÇÃO">
              <Text style={{ color: 'rgba(234,234,234,0.85)', fontSize: 14, lineHeight: 22, paddingVertical: 14 }}>
                {listing.description}
              </Text>
            </SectionCard>
          ) : null}

          {/* Vendedor — tappable */}
          <SectionCard title="VENDEDOR">
            <Pressable
              onPress={goToSellerProfile}
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14,
                opacity: pressed ? 0.75 : 1,
              })}
            >
              <View style={{
                width: 44, height: 44, borderRadius: 22,
                backgroundColor: '#335336', alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ color: '#D4AF37', fontWeight: '800', fontSize: 16 }}>
                  {(listing.sellerName ?? 'V').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#EAEAEA', fontWeight: '700', fontSize: 15 }}>
                  {listing.sellerName ?? 'Vendedor'}
                </Text>
                <Text style={{ color: 'rgba(234,234,234,0.5)', fontSize: 12, marginTop: 2 }}>
                  Membro desde {new Date(listing.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </Text>
              </View>
              <Text style={{ color: 'rgba(234,234,234,0.4)', fontSize: 18 }}>›</Text>
            </Pressable>
          </SectionCard>

          {/* Comentários */}
          <SectionCard title="COMENTÁRIOS">
            {comments.length === 0 ? (
              <Text style={{ color: 'rgba(234,234,234,0.5)', fontSize: 14, textAlign: 'center', paddingVertical: 20 }}>
                Seja o primeiro a comentar
              </Text>
            ) : (
              comments.map((c) => (
                <CommentCard
                  key={c.commentId}
                  comment={c}
                  currentUserId={currentUser?.userId}
                  onReport={handleReport}
                />
              ))
            )}

            {/* Comment input — only if logged in */}
            {currentUser ? (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingVertical: 12,
                borderTopWidth: comments.length > 0 ? 1 : 0,
                borderColor: 'rgba(255,255,255,0.08)',
              }}>
                <TextInput
                  ref={commentInputRef}
                  value={commentText}
                  onChangeText={setCommentText}
                  placeholder="Adicionar comentário..."
                  placeholderTextColor="rgba(234,234,234,0.4)"
                  multiline
                  style={{
                    flex: 1,
                    fontSize: 14,
                    color: '#EAEAEA',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.15)',
                    borderRadius: 14,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    minHeight: 40,
                    maxHeight: 100,
                  }}
                />
                <Pressable
                  onPress={sendComment}
                  disabled={!commentText.trim() || sendingComment}
                  style={({ pressed }) => ({
                    width: 40, height: 40, borderRadius: 14,
                    backgroundColor:
                      !commentText.trim() || sendingComment
                        ? 'rgba(255,255,255,0.15)'
                        : pressed
                          ? '#B8942E'
                          : '#D4AF37',
                    alignItems: 'center', justifyContent: 'center',
                  })}
                >
                  {sendingComment
                    ? <ActivityIndicator size="small" color="#211B15" />
                    : <Text style={{ color: '#211B15', fontWeight: '800', fontSize: 18 }}>→</Text>
                  }
                </Pressable>
              </View>
            ) : null}
          </SectionCard>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Botão de ação */}
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#2a2a2a',
        paddingHorizontal: 16, paddingBottom: 32, paddingTop: 14,
        borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
      }}>
        {isOwner ? (
          <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center' }}>
            <Pressable
              onPress={openPriceEdit}
              style={({ pressed }) => ({
                backgroundColor: pressed ? '#B8942E' : '#D4AF37',
                borderRadius: 16, paddingVertical: 16, paddingHorizontal: 28, alignItems: 'center',
                flexDirection: 'row', gap: 6,
              })}
            >
              <Pencil size={15} color="#211B15" />
              <Text style={{ color: '#211B15', fontWeight: '800', fontSize: 15 }}>Editar preço</Text>
            </Pressable>
            <Pressable
              onPress={confirmRemove}
              style={({ pressed }) => ({
                backgroundColor: pressed ? '#F5D0D0' : '#FEE2E2',
                borderRadius: 16, paddingVertical: 16, paddingHorizontal: 28, alignItems: 'center',
                borderWidth: 1, borderColor: '#FECACA',
                flexDirection: 'row', gap: 6,
              })}
            >
              <Trash2 size={15} color="#B91C1C" />
              <Text style={{ color: '#B91C1C', fontWeight: '800', fontSize: 15 }}>Remover</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {/* Add to cart — outline button */}
            <Pressable
              onPress={async () => {
                const { alreadyInCart } = await addToCart({ ...listing, priceCents });
                if (alreadyInCart) {
                  webAlert('Já no carrinho', 'Esta camisa já está no seu carrinho.');
                } else {
                  webAlert('Adicionado! 🛒', `${listing.teamName} foi adicionado ao carrinho.`);
                }
              }}
              style={({ pressed }) => ({
                backgroundColor: pressed ? 'rgba(212,175,55,0.15)' : 'rgba(212,175,55,0.08)',
                borderRadius: 16,
                paddingVertical: 14,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
                borderWidth: 1.5,
                borderColor: '#D4AF37',
              })}
            >
              <ShoppingCart size={18} color="#D4AF37" />
              <Text style={{ color: '#D4AF37', fontWeight: '800', fontSize: 15 }} numberOfLines={1}>
                Adicionar ao Carrinho
              </Text>
            </Pressable>

            {/* Buy now — filled green button */}
            <Pressable
              onPress={() => navigation.navigate('Checkout', { listing: { ...listing, priceCents } })}
              style={({ pressed }) => ({
                backgroundColor: pressed ? '#243B26' : '#335336',
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: 'center',
              })}
            >
              <Text style={{ color: '#D4AF37', fontWeight: '900', fontSize: 17 }} numberOfLines={1}>
                Comprar — {price}
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Price edit modal */}
      <Modal visible={editingPrice} transparent animationType="slide" onRequestClose={() => setEditingPrice(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }} onPress={() => setEditingPrice(false)} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={{
            backgroundColor: '#2a2a2a', borderTopLeftRadius: 24, borderTopRightRadius: 24,
            padding: 24, paddingBottom: 36,
          }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'center', marginBottom: 20 }} />
            <Text style={{ color: '#EAEAEA', fontWeight: '800', fontSize: 17, marginBottom: 4 }}>Atualizar preço</Text>
            <Text style={{ color: 'rgba(234,234,234,0.5)', fontSize: 13, marginBottom: 20 }}>
              {listing.teamName} · {listing.supplier} · {listing.season}
            </Text>
            <View style={{
              flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: '#335336',
              borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 20,
            }}>
              <Text style={{ color: '#335336', fontWeight: '800', fontSize: 18, marginRight: 4 }}>R$</Text>
              <TextInput
                value={priceText}
                onChangeText={setPriceText}
                keyboardType="decimal-pad"
                style={{ flex: 1, fontSize: 22, fontWeight: '800', color: '#EAEAEA' }}
                placeholder="0,00"
                placeholderTextColor="rgba(234,234,234,0.4)"
                selectTextOnFocus
                autoFocus
              />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Pressable
                onPress={savePrice}
                disabled={saving}
                style={({ pressed }) => ({
                  backgroundColor: saving ? '#9C9486' : pressed ? '#B8942E' : '#D4AF37',
                  borderRadius: 14, paddingVertical: 15, paddingHorizontal: 36, alignItems: 'center',
                })}
              >
                {saving
                  ? <ActivityIndicator color="#211B15" />
                  : <Text style={{ color: '#211B15', fontWeight: '800', fontSize: 16 }}>Salvar</Text>
                }
              </Pressable>
              <Pressable
                onPress={() => setEditingPrice(false)}
                disabled={saving}
              >
                <Text style={{ color: '#EAEAEA', fontWeight: '800', fontSize: 16 }}>Cancelar</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

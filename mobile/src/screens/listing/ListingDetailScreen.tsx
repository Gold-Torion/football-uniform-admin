import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
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

import type { RootStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/auth.store';
import { ListingsApi } from '../../api/listings';
import { CommentsApi, type CommentPublic } from '../../api/comments';

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
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#F4EFE3' }}>
      <Text style={{ color: '#9C9486', fontSize: 14 }}>{label}</Text>
      <Text style={{ color: '#1C1A14', fontSize: 14, fontWeight: '600', maxWidth: '60%', textAlign: 'right' }}>{value}</Text>
    </View>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: '#9C9486', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 }}>
        {title}
      </Text>
      <View style={{ backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#E5DCC4', paddingHorizontal: 16 }}>
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
      borderColor: '#F4EFE3',
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
        <Text style={{ color: '#1C1A14', fontWeight: '700', fontSize: 14, marginBottom: 2 }}>
          {comment.authorName}
        </Text>
        <Text style={{ color: '#1C1A14', fontSize: 14, lineHeight: 20 }}>
          {comment.body}
        </Text>
        <Text style={{ color: '#9C9486', fontSize: 11, marginTop: 4 }}>
          {timeAgo(comment.createdAt)}
        </Text>
      </View>

      {/* Flag button — only if not the author */}
      {currentUserId !== comment.authorId && (
        <Pressable onPress={() => onReport(comment)} hitSlop={8} style={{ paddingTop: 2 }}>
          <Text style={{ fontSize: 14, color: '#9C9486' }}>⚑</Text>
        </Pressable>
      )}
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export function ListingDetailScreen({ route, navigation }: Props) {
  const { listing } = route.params;
  const currentUser = useAuthStore((s) => s.user);

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
      Alert.alert('Preço inválido', 'Digite um valor mínimo de R$ 1,00.');
      return;
    }
    setSaving(true);
    try {
      const updated = await ListingsApi.updatePrice(listing.listingId, Math.round(parsed * 100));
      setPriceCents(updated.priceCents);
      setEditingPrice(false);
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar o preço.');
    } finally {
      setSaving(false);
    }
  };

  const confirmRemove = () => {
    Alert.alert(
      'Remover anúncio',
      `Tem certeza que quer remover "${listing.teamName}"? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await ListingsApi.remove(listing.listingId);
              const store = useAuthStore.getState();
              store.setListingsActiveCount(Math.max(0, (store.user?.listingsActiveCount ?? 1) - 1));
              navigation.goBack();
            } catch {
              Alert.alert('Erro', 'Não foi possível remover o anúncio.');
            }
          },
        },
      ],
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
      Alert.alert('Erro', 'Não foi possível enviar o comentário.');
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
            Alert.alert('Denúncia enviada', 'Obrigado! Iremos analisar em breve.');
          } catch {
            Alert.alert('Erro', 'Não foi possível enviar a denúncia.');
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
                Alert.alert('Denúncia enviada', 'Obrigado! Iremos analisar em breve.');
              } catch {
                Alert.alert('Erro', 'Não foi possível enviar a denúncia.');
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
          {listing.teamName}
        </Text>
        <Text style={{ color: '#D4AF37', fontWeight: '900', fontSize: 18 }}>{price}</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>

          {/* Foto placeholder */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            <View style={{
              flex: 2, aspectRatio: 1, borderRadius: 16,
              backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5DCC4',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ fontSize: 56 }}>👕</Text>
              <Text style={{ color: '#9C9486', fontSize: 12, marginTop: 8 }}>
                {listing.kind === 'SELECAO' ? '🌎 Seleção' : '🏟️ Time'}
              </Text>
            </View>
            <View style={{ flex: 1, gap: 8 }}>
              {[1, 2].map((i) => (
                <View key={i} style={{
                  flex: 1, borderRadius: 12, minHeight: 80,
                  backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5DCC4',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ color: '#E5DCC4', fontSize: 22 }}>+</Text>
                </View>
              ))}
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
              <Text style={{ color: '#9C9486', fontSize: 14, marginBottom: 4 }}>Condição</Text>
              <View style={{ alignSelf: 'flex-start', backgroundColor: '#F4EFE3', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ color: '#335336', fontWeight: '700', fontSize: 13 }}>
                  {CONDITION_LABEL[listing.condition] ?? listing.condition}
                </Text>
              </View>
            </View>
          </SectionCard>

          {/* Descrição */}
          {listing.description ? (
            <SectionCard title="DESCRIÇÃO">
              <Text style={{ color: '#1C1A14', fontSize: 14, lineHeight: 22, paddingVertical: 14 }}>
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
                <Text style={{ color: '#1C1A14', fontWeight: '700', fontSize: 15 }}>
                  {listing.sellerName ?? 'Vendedor'}
                </Text>
                <Text style={{ color: '#9C9486', fontSize: 12, marginTop: 2 }}>
                  Membro desde {new Date(listing.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </Text>
              </View>
              <Text style={{ color: '#9C9486', fontSize: 18 }}>›</Text>
            </Pressable>
          </SectionCard>

          {/* Comentários */}
          <SectionCard title="COMENTÁRIOS">
            {comments.length === 0 ? (
              <Text style={{ color: '#9C9486', fontSize: 14, textAlign: 'center', paddingVertical: 20 }}>
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
                borderColor: '#F4EFE3',
              }}>
                <TextInput
                  ref={commentInputRef}
                  value={commentText}
                  onChangeText={setCommentText}
                  placeholder="Adicionar comentário..."
                  placeholderTextColor="#9C9486"
                  multiline
                  style={{
                    flex: 1,
                    fontSize: 14,
                    color: '#1C1A14',
                    borderWidth: 1,
                    borderColor: '#E5DCC4',
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
                        ? '#E5DCC4'
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
        backgroundColor: '#F4EFE3',
        paddingHorizontal: 16, paddingBottom: 28, paddingTop: 12,
        borderTopWidth: 1, borderColor: '#E5DCC4',
      }}>
        {isOwner ? (
          <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center' }}>
            <Pressable
              onPress={openPriceEdit}
              style={({ pressed }) => ({
                backgroundColor: pressed ? '#B8942E' : '#D4AF37',
                borderRadius: 16, paddingVertical: 16, paddingHorizontal: 28, alignItems: 'center',
              })}
            >
              <Text style={{ color: '#211B15', fontWeight: '800', fontSize: 15 }}>✏️ Editar preço</Text>
            </Pressable>
            <Pressable
              onPress={confirmRemove}
              style={({ pressed }) => ({
                backgroundColor: pressed ? '#F5D0D0' : '#FEE2E2',
                borderRadius: 16, paddingVertical: 16, paddingHorizontal: 28, alignItems: 'center',
                borderWidth: 1, borderColor: '#FECACA',
              })}
            >
              <Text style={{ color: '#B91C1C', fontWeight: '800', fontSize: 15 }}>🗑️ Remover</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={() => navigation.navigate('Checkout', { listing })}
            style={({ pressed }) => ({
              backgroundColor: pressed ? '#B8942E' : '#D4AF37',
              borderRadius: 16, paddingVertical: 16, alignItems: 'center',
            })}
          >
            <Text style={{ color: '#211B15', fontWeight: '800', fontSize: 16 }}>
              Comprar — R$ {(priceCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Price edit modal */}
      <Modal visible={editingPrice} transparent animationType="slide" onRequestClose={() => setEditingPrice(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }} onPress={() => setEditingPrice(false)} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={{
            backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
            padding: 24, paddingBottom: 36,
          }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5DCC4', alignSelf: 'center', marginBottom: 20 }} />
            <Text style={{ color: '#1C1A14', fontWeight: '800', fontSize: 17, marginBottom: 4 }}>Atualizar preço</Text>
            <Text style={{ color: '#9C9486', fontSize: 13, marginBottom: 20 }}>
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
                style={{ flex: 1, fontSize: 22, fontWeight: '800', color: '#1C1A14' }}
                placeholder="0,00"
                placeholderTextColor="#C4BDB5"
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
                <Text style={{ color: '#1C1A14', fontWeight: '800', fontSize: 16 }}>Cancelar</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

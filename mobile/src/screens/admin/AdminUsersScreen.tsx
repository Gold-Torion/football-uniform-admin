import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../navigation/types';
import { AdminApi, type UserPublic } from '../../api/admin';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminUsers'>;

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (diff < 1)  return 'agora';
  if (diff < 60) return `há ${diff}m`;
  const h = Math.floor(diff / 60);
  if (h < 24)    return `há ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30)    return `há ${d}d`;
  return `há ${Math.floor(d / 30)}m`;
}

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function UserCard({
  user,
  onSuspend,
  onRestore,
  busy,
}: {
  user:      UserPublic;
  onSuspend: () => void;
  onRestore: () => void;
  busy:      boolean;
}) {
  const suspended = user.status === 'SUSPENDED';

  return (
    <View style={{
      backgroundColor: '#fff',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: suspended ? '#FECACA' : '#E5DCC4',
      marginBottom: 12,
      overflow: 'hidden',
    }}>
      {suspended && (
        <View style={{ backgroundColor: '#FEE2E2', paddingHorizontal: 16, paddingVertical: 6 }}>
          <Text style={{ color: '#B91C1C', fontSize: 11, fontWeight: '700', letterSpacing: 0.8 }}>
            SUSPENSO
          </Text>
        </View>
      )}

      {/* User info */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, margin: 16, marginBottom: 12 }}>
        <View style={{
          width: 44, height: 44, borderRadius: 22,
          backgroundColor: suspended ? '#9C9486' : '#335336',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ color: '#D4AF37', fontWeight: '800', fontSize: 15 }}>
            {getInitials(user.displayName)}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#1C1A14', fontWeight: '700', fontSize: 15 }}>
            {user.displayName}
          </Text>
          {user.email ? (
            <Text style={{ color: '#9C9486', fontSize: 12 }} numberOfLines={1}>
              {user.email}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Stats row */}
      <View style={{ flexDirection: 'row', marginHorizontal: 16, marginBottom: 14, gap: 20 }}>
        <View>
          <Text style={{ color: '#9C9486', fontSize: 10, fontWeight: '700', letterSpacing: 0.6 }}>
            ANÚNCIOS
          </Text>
          <Text style={{ color: '#1C1A14', fontSize: 14, fontWeight: '700' }}>
            {user.listingsActiveCount}
          </Text>
        </View>
        <View>
          <Text style={{ color: '#9C9486', fontSize: 10, fontWeight: '700', letterSpacing: 0.6 }}>
            AVALIAÇÃO
          </Text>
          <Text style={{ color: '#1C1A14', fontSize: 14, fontWeight: '700' }}>
            {user.ratingAvgAsSeller ? `${user.ratingAvgAsSeller.toFixed(1)} ⭐` : '—'}
          </Text>
        </View>
        <View>
          <Text style={{ color: '#9C9486', fontSize: 10, fontWeight: '700', letterSpacing: 0.6 }}>
            DESDE
          </Text>
          <Text style={{ color: '#1C1A14', fontSize: 14, fontWeight: '700' }}>
            {timeAgo(user.createdAt)}
          </Text>
        </View>
      </View>

      {/* Divider */}
      <View style={{ height: 1, backgroundColor: '#EFEFEF' }} />

      {/* Action */}
      <Pressable
        onPress={suspended ? onRestore : onSuspend}
        disabled={busy}
        style={({ pressed }) => ({
          alignItems: 'center',
          paddingVertical: 14,
          backgroundColor: pressed
            ? (suspended ? '#D1FAE5' : '#FEE2E2')
            : '#fff',
        })}
      >
        <Text style={{
          color: suspended ? '#065F46' : '#B91C1C',
          fontWeight: '700',
          fontSize: 14,
        }}>
          {suspended ? 'Reativar conta' : 'Suspender conta'}
        </Text>
      </Pressable>
    </View>
  );
}

export function AdminUsersScreen({ route, navigation }: Props) {
  const { secret } = route.params;

  const [users, setUsers]   = useState<UserPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy]       = useState(false);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      AdminApi.listUsers(secret)
        .then(setUsers)
        .catch(() => Alert.alert('Erro', 'Não foi possível carregar os usuários.'))
        .finally(() => setLoading(false));
    }, [secret]),
  );

  const handleSuspend = (user: UserPublic) => {
    Alert.alert(
      'Suspender conta',
      `Suspender a conta de ${user.displayName}? O usuário não conseguirá fazer login.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Suspender',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              await AdminApi.suspendUser(secret, user.userId);
              setUsers((prev) =>
                prev.map((u) => u.userId === user.userId ? { ...u, status: 'SUSPENDED' } : u),
              );
            } catch {
              Alert.alert('Erro', 'Não foi possível suspender o usuário.');
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  };

  const handleRestore = (user: UserPublic) => {
    Alert.alert(
      'Reativar conta',
      `Reativar a conta de ${user.displayName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reativar',
          onPress: async () => {
            setBusy(true);
            try {
              await AdminApi.restoreUser(secret, user.userId);
              setUsers((prev) =>
                prev.map((u) => u.userId === user.userId ? { ...u, status: 'ACTIVE' } : u),
              );
            } catch {
              Alert.alert('Erro', 'Não foi possível reativar o usuário.');
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  };

  const suspended = users.filter((u) => u.status === 'SUSPENDED');
  const active    = users.filter((u) => u.status !== 'SUSPENDED');

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: '#EFEFEF' }}>

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
          Gerenciar Usuários
        </Text>
        {!loading && (
          <Text style={{ color: 'rgba(245,230,184,0.6)', fontSize: 13 }}>
            {users.length} usuários
          </Text>
        )}
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#335336" />
        </View>
      ) : users.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <Text style={{ color: '#9C9486', fontSize: 15 }}>Nenhum usuário encontrado</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

          {/* Suspended users first */}
          {suspended.length > 0 && (
            <>
              <Text style={{ color: '#B91C1C', fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8 }}>
                SUSPENSOS ({suspended.length})
              </Text>
              {suspended.map((user) => (
                <UserCard
                  key={user.userId}
                  user={user}
                  busy={busy}
                  onSuspend={() => handleSuspend(user)}
                  onRestore={() => handleRestore(user)}
                />
              ))}
              <Text style={{ color: '#9C9486', fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8, marginTop: 4 }}>
                ATIVOS ({active.length})
              </Text>
            </>
          )}

          {active.map((user) => (
            <UserCard
              key={user.userId}
              user={user}
              busy={busy}
              onSuspend={() => handleSuspend(user)}
              onRestore={() => handleRestore(user)}
            />
          ))}

        </ScrollView>
      )}

    </SafeAreaView>
  );
}

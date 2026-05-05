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
import { AdminApi, type ReportWithComment } from '../../api/admin';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminReports'>;

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (diff < 1)  return 'agora';
  if (diff < 60) return `há ${diff}m`;
  const h = Math.floor(diff / 60);
  if (h < 24)    return `há ${h}h`;
  return `há ${Math.floor(h / 24)}d`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ReportCard({
  report,
  onResolve,
  onDismiss,
  busy,
}: {
  report:    ReportWithComment;
  onResolve: () => void;
  onDismiss: () => void;
  busy:      boolean;
}) {
  return (
    <View style={{
      backgroundColor: '#fff',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#E5DCC4',
      marginBottom: 12,
      overflow: 'hidden',
    }}>
      {/* Comment block */}
      {report.comment ? (
        <View style={{
          borderLeftWidth: 3,
          borderLeftColor: '#D4AF37',
          margin: 16,
          marginBottom: 8,
          paddingLeft: 12,
        }}>
          <Text style={{ color: '#1C1A14', fontWeight: '700', fontSize: 14, marginBottom: 2 }}>
            {report.comment.authorName}
          </Text>
          <Text style={{ color: '#1C1A14', fontSize: 14, lineHeight: 20 }}>
            {report.comment.body}
          </Text>
          <Text style={{ color: '#9C9486', fontSize: 11, marginTop: 4 }}>
            {timeAgo(report.comment.createdAt)} · {report.comment.reportCount} denúncia(s)
          </Text>
        </View>
      ) : (
        <View style={{ margin: 16, marginBottom: 8 }}>
          <Text style={{ color: '#9C9486', fontSize: 13, fontStyle: 'italic' }}>
            Comentário removido ou não encontrado
          </Text>
        </View>
      )}

      {/* Reason */}
      <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
        <Text style={{ color: '#9C9486', fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 4 }}>
          MOTIVO DA DENÚNCIA
        </Text>
        <Text style={{ color: '#1C1A14', fontSize: 13, fontStyle: 'italic' }}>
          "{report.reason}"
        </Text>
        <Text style={{ color: '#9C9486', fontSize: 11, marginTop: 6 }}>
          {timeAgo(report.createdAt)}
        </Text>
      </View>

      {/* Divider */}
      <View style={{ height: 1, backgroundColor: '#F4EFE3' }} />

      {/* Actions */}
      <View style={{ flexDirection: 'row' }}>
        <Pressable
          onPress={onResolve}
          disabled={busy}
          style={({ pressed }) => ({
            flex: 1,
            alignItems: 'center',
            paddingVertical: 14,
            backgroundColor: pressed ? '#FEE2E2' : '#fff',
            borderRightWidth: 1,
            borderColor: '#F4EFE3',
          })}
        >
          <Text style={{ color: '#B91C1C', fontWeight: '700', fontSize: 14 }}>
            Remover comentário
          </Text>
        </Pressable>

        <Pressable
          onPress={onDismiss}
          disabled={busy}
          style={({ pressed }) => ({
            flex: 1,
            alignItems: 'center',
            paddingVertical: 14,
            backgroundColor: pressed ? '#F4EFE3' : '#fff',
          })}
        >
          <Text style={{ color: '#9C9486', fontWeight: '700', fontSize: 14 }}>
            Dispensar
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export function AdminReportsScreen({ route, navigation }: Props) {
  const { secret } = route.params;

  const [reports, setReports] = useState<ReportWithComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy]       = useState(false);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      AdminApi.listReports(secret)
        .then(setReports)
        .catch(() => Alert.alert('Erro', 'Não foi possível carregar as denúncias.'))
        .finally(() => setLoading(false));
    }, [secret]),
  );

  const handleResolve = (report: ReportWithComment) => {
    Alert.alert(
      'Remover comentário',
      `Remover o comentário de ${report.comment?.authorName ?? 'usuário'} e marcar a denúncia como resolvida?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              await AdminApi.resolve(secret, report.reportId);
              setReports((prev) => prev.filter((r) => r.reportId !== report.reportId));
            } catch {
              Alert.alert('Erro', 'Não foi possível processar a denúncia.');
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  };

  const handleDismiss = (report: ReportWithComment) => {
    Alert.alert(
      'Dispensar denúncia',
      'Marcar a denúncia como dispensada e manter o comentário?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Dispensar',
          onPress: async () => {
            setBusy(true);
            try {
              await AdminApi.dismiss(secret, report.reportId);
              setReports((prev) => prev.filter((r) => r.reportId !== report.reportId));
            } catch {
              Alert.alert('Erro', 'Não foi possível processar a denúncia.');
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
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
        <Text style={{ color: '#F5E6B8', fontWeight: '800', fontSize: 17, flex: 1 }}>
          Denúncias Pendentes
        </Text>
        {reports.length > 0 && (
          <View style={{
            backgroundColor: '#D4AF37',
            borderRadius: 12,
            paddingHorizontal: 10,
            paddingVertical: 3,
          }}>
            <Text style={{ color: '#211B15', fontWeight: '800', fontSize: 13 }}>
              {reports.length}
            </Text>
          </View>
        )}
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#335336" />
        </View>
      ) : reports.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <Text style={{ fontSize: 40 }}>✓</Text>
          <Text style={{ color: '#335336', fontWeight: '800', fontSize: 18 }}>
            Tudo limpo
          </Text>
          <Text style={{ color: '#9C9486', fontSize: 14 }}>
            Nenhuma denúncia pendente
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {reports.map((report) => (
            <ReportCard
              key={report.reportId}
              report={report}
              busy={busy}
              onResolve={() => handleResolve(report)}
              onDismiss={() => handleDismiss(report)}
            />
          ))}
        </ScrollView>
      )}

    </SafeAreaView>
  );
}

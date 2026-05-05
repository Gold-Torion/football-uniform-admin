import { useEffect, useRef, useState } from 'react';
import { Alert, Modal, Pressable, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let CameraView: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let useCameraPermissions: any = () => [null, () => Promise.resolve(false)];
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const cam = require('expo-camera');
  CameraView            = cam.CameraView;
  useCameraPermissions  = cam.useCameraPermissions;
} catch {
  // expo-camera not available in this environment
}

import { CouponsApi } from '../../api/coupons';

interface Props {
  visible: boolean;
  onClose: () => void;
}

type Phase = 'scanning' | 'loading' | 'success';

interface SuccessInfo {
  code: string;
  discountPct: number;
  description: string;
}

export function QRScannerScreen({ visible, onClose }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase]               = useState<Phase>('scanning');
  const [success, setSuccess]           = useState<SuccessInfo | null>(null);
  const scannedRef                      = useRef(false);

  useEffect(() => {
    if (visible) {
      scannedRef.current = false;
      setPhase('scanning');
      setSuccess(null);
    }
  }, [visible]);

  const handleBarcode = async ({ data }: { data: string }) => {
    if (scannedRef.current) return;
    scannedRef.current = true;
    setPhase('loading');

    try {
      const result = await CouponsApi.redeem(data.trim().toUpperCase());
      setSuccess(result);
      setPhase('success');
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Não foi possível aplicar o cupom.';
      Alert.alert('Cupom inválido', msg, [
        { text: 'Tentar novamente', onPress: () => { scannedRef.current = false; setPhase('scanning'); } },
        { text: 'Fechar', style: 'cancel', onPress: onClose },
      ]);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }} edges={['top', 'bottom']}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Escanear cupom</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={styles.closeBtn}>✕</Text>
          </Pressable>
        </View>

        {phase === 'success' && success ? (
          /* ── Tela de sucesso ── */
          <View style={styles.successContainer}>
            <View style={styles.successCard}>
              <Text style={styles.successEmoji}>🎉</Text>
              <Text style={styles.successTitle}>Cupom aplicado!</Text>
              <Text style={styles.successCode}>{success.code}</Text>
              <Text style={styles.successDesc}>{success.description}</Text>
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{success.discountPct}% OFF</Text>
              </View>
              <Pressable style={styles.closeCardBtn} onPress={onClose}>
                <Text style={styles.closeCardText}>Concluir</Text>
              </Pressable>
            </View>
          </View>
        ) : !permission?.granted ? (
          /* ── Permissão de câmera ── */
          <View style={styles.successContainer}>
            <Text style={styles.permText}>
              O app precisa acessar a câmera para escanear o QR code.
            </Text>
            <Pressable style={styles.permBtn} onPress={requestPermission}>
              <Text style={styles.permBtnText}>Permitir câmera</Text>
            </Pressable>
          </View>
        ) : (
          /* ── Câmera ── */
          <View style={{ flex: 1 }}>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              onBarcodeScanned={phase === 'scanning' ? handleBarcode : undefined}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            />

            {/* Overlay escuro com janela central */}
            <View style={styles.overlay}>
              <View style={styles.overlayTop} />
              <View style={styles.overlayMiddle}>
                <View style={styles.overlaySide} />
                <View style={styles.scanWindow}>
                  {/* Cantos do frame */}
                  {[
                    { top: 0,    left: 0,    borderTopWidth: 3,    borderLeftWidth: 3  },
                    { top: 0,    right: 0,   borderTopWidth: 3,    borderRightWidth: 3 },
                    { bottom: 0, left: 0,    borderBottomWidth: 3, borderLeftWidth: 3  },
                    { bottom: 0, right: 0,   borderBottomWidth: 3, borderRightWidth: 3 },
                  ].map((s, i) => (
                    <View key={i} style={[styles.corner, s]} />
                  ))}
                </View>
                <View style={styles.overlaySide} />
              </View>
              <View style={styles.overlayBottom}>
                <Text style={styles.scanHint}>
                  {phase === 'loading'
                    ? 'Verificando cupom...'
                    : 'Aponte para o QR code do evento'}
                </Text>
              </View>
            </View>
          </View>
        )}

      </SafeAreaView>
    </Modal>
  );
}

const SCAN_SIZE = 240;
const OVERLAY_COLOR = 'rgba(0,0,0,0.65)';

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#111',
  },
  headerTitle: { flex: 1, color: '#FFF', fontWeight: '800', fontSize: 17 },
  closeBtn:    { color: '#AAA', fontSize: 20, fontWeight: '700' },

  overlay:       { ...StyleSheet.absoluteFillObject },
  overlayTop:    { flex: 1, backgroundColor: OVERLAY_COLOR },
  overlayMiddle: { flexDirection: 'row', height: SCAN_SIZE },
  overlaySide:   { flex: 1, backgroundColor: OVERLAY_COLOR },
  overlayBottom: { flex: 1, backgroundColor: OVERLAY_COLOR, alignItems: 'center', paddingTop: 24 },

  scanWindow: {
    width: SCAN_SIZE,
    height: SCAN_SIZE,
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#D4AF37',
  },

  scanHint: { color: '#FFF', fontSize: 14, fontWeight: '600', textAlign: 'center', paddingHorizontal: 32 },

  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  successCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
  },
  successEmoji: { fontSize: 48, marginBottom: 12 },
  successTitle: { color: '#1C1A14', fontWeight: '800', fontSize: 22, marginBottom: 8 },
  successCode:  { color: '#335336', fontWeight: '700', fontSize: 16, marginBottom: 4 },
  successDesc:  { color: '#9C9486', fontSize: 14, textAlign: 'center', marginBottom: 20 },
  discountBadge: {
    backgroundColor: '#335336',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginBottom: 24,
  },
  discountText: { color: '#D4AF37', fontWeight: '900', fontSize: 28 },
  closeCardBtn: {
    backgroundColor: '#D4AF37',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 48,
  },
  closeCardText: { color: '#211B15', fontWeight: '800', fontSize: 16 },

  permText:    { color: '#FFF', fontSize: 15, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  permBtn:     { backgroundColor: '#D4AF37', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32 },
  permBtnText: { color: '#211B15', fontWeight: '800', fontSize: 15 },
});

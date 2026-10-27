import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { apiService } from '@/services/api.service';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';
import { alert } from '@/utils/alert';
import { LoadingView } from '@/components/ui/LoadingView';

type DisputeStatus = 'OPEN' | 'RESOLVED_RELEASE' | 'RESOLVED_REFUND';
type TabKey = 'OPEN' | 'RESOLVED';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'OPEN', label: 'En cours' },
  { key: 'RESOLVED', label: 'Résolus' },
];

const STATUS_LABEL: Record<DisputeStatus, string> = {
  OPEN: 'En cours',
  RESOLVED_RELEASE: 'Vendeur payé',
  RESOLVED_REFUND: 'Acheteur remboursé',
};
const STATUS_COLOR: Record<DisputeStatus, string> = {
  OPEN: '#E65100',
  RESOLVED_RELEASE: '#1565C0',
  RESOLVED_REFUND: '#2E7D32',
};

const ORDER_STATUS_FR: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  PROCESSING: 'En préparation',
  SHIPPED: 'Expédiée',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
  REFUNDED: 'Remboursée',
};

const money = (value: any, currency?: string) =>
  `${Number(value || 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} ${currency || 'XOF'}`;

const fullName = (u: any) => [u?.firstName, u?.lastName].filter(Boolean).join(' ') || u?.email || 'Inconnu';

export default function AdminDisputesScreen() {
  const router = useRouter();
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'background');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [tab, setTab] = useState<TabKey>('OPEN');
  const [treatingId, setTreatingId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiService.get<any[]>('/api/admin/disputes');
      if (res.success) setDisputes(Array.isArray(res.data) ? res.data : []);
      else alert('Erreur', (res as any).error?.message || 'Impossible de charger les litiges');
    } catch (e: any) {
      alert('Erreur', e?.message || 'Impossible de charger les litiges');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const visible = useMemo(
    () => disputes.filter((d) => (tab === 'OPEN' ? d.status === 'OPEN' : d.status !== 'OPEN')),
    [disputes, tab]
  );
  const openCount = useMemo(() => disputes.filter((d) => d.status === 'OPEN').length, [disputes]);

  const resolve = (dispute: any, resolution: 'RELEASE' | 'REFUND') => {
    const net = (dispute.order?.escrows || []).reduce((sum: number, e: any) => sum + Number(e.netAmount || 0), 0);
    const message =
      resolution === 'RELEASE'
        ? `Le vendeur recevra ${money(net, dispute.order?.currency)} (après commission). Cette décision est définitive.`
        : `L'acheteur sera remboursé de ${money(dispute.order?.total, dispute.order?.currency)} sur son portefeuille et le vendeur ne recevra rien. Cette décision est définitive.`;
    alert(resolution === 'RELEASE' ? 'Payer le vendeur ?' : "Rembourser l'acheteur ?", message, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Confirmer',
        style: resolution === 'REFUND' ? 'destructive' : 'default',
        onPress: async () => {
          setBusy(true);
          try {
            const res: any = await apiService.put(`/api/admin/disputes/${dispute.id}/resolve`, {
              resolution,
              note: note.trim() || undefined,
            });
            if (res.success) {
              setTreatingId(null);
              setNote('');
              alert('Litige résolu', resolution === 'RELEASE' ? 'Le vendeur a été payé.' : "L'acheteur a été remboursé.");
              await load();
            } else {
              alert('Erreur', res.error?.message || res.message || 'La décision a échoué');
            }
          } catch (e: any) {
            alert('Erreur', e?.message || 'La décision a échoué');
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: any }) => {
    const order = item.order || {};
    const status = item.status as DisputeStatus;
    const treating = treatingId === item.id;
    const sellerNames = (item.sellers || [])
      .map((s: any) => s.sellerProfile?.shopName || fullName(s))
      .join(', ');
    const net = (order.escrows || []).reduce((sum: number, e: any) => sum + Number(e.netAmount || 0), 0);
    const commission = (order.escrows || []).reduce((sum: number, e: any) => sum + Number(e.commissionAmount || 0), 0);

    return (
      <View style={[styles.card, { backgroundColor }]}>
        <View style={styles.cardHead}>
          <ThemedText style={styles.orderNumber}>#{order.orderNumber}</ThemedText>
          <View style={[styles.badge, { backgroundColor: STATUS_COLOR[status] + '20' }]}>
            <ThemedText style={[styles.badgeText, { color: STATUS_COLOR[status] }]}>{STATUS_LABEL[status]}</ThemedText>
          </View>
        </View>

        <ThemedText style={[styles.meta, { color: textColor + '80' }]}>
          Ouvert le {new Date(item.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          {' · '}commande {ORDER_STATUS_FR[order.status] || order.status}
        </ThemedText>

        <View style={styles.rows}>
          <ThemedText style={styles.rowLabel}>Acheteur</ThemedText>
          <ThemedText style={styles.rowValue}>
            {fullName(order.user)}
            {order.user?.phone ? ` · ${order.user.phone}` : ''}
          </ThemedText>
          <ThemedText style={styles.rowLabel}>Vendeur</ThemedText>
          <ThemedText style={styles.rowValue}>{sellerNames || 'Inconnu'}</ThemedText>
          <ThemedText style={styles.rowLabel}>Montant payé</ThemedText>
          <ThemedText style={styles.rowValue}>{money(order.total, order.currency)}</ThemedText>
          <ThemedText style={styles.rowLabel}>Part du vendeur</ThemedText>
          <ThemedText style={styles.rowValue}>
            {money(net, order.currency)} (commission {money(commission, order.currency)})
          </ThemedText>
        </View>

        <View style={styles.items}>
          {(order.items || []).map((it: any, i: number) => (
            <ThemedText key={i} style={[styles.itemLine, { color: textColor + 'B0' }]} numberOfLines={1}>
              {it.quantity} × {it.productSnapshot?.name || 'Article'} — {money(it.total, order.currency)}
            </ThemedText>
          ))}
        </View>

        <View style={[styles.reasonBox, { borderColor: textColor + '20' }]}>
          <ThemedText style={styles.reasonLabel}>Motif de l'acheteur</ThemedText>
          <ThemedText style={styles.reasonText}>{item.reason}</ThemedText>
        </View>

        {status !== 'OPEN' && (
          <View style={styles.decision}>
            <ThemedText style={styles.reasonLabel}>Décision</ThemedText>
            <ThemedText style={styles.reasonText}>
              {STATUS_LABEL[status]}
              {item.resolvedAt ? ` le ${new Date(item.resolvedAt).toLocaleDateString('fr-FR')}` : ''}
              {item.resolutionNote ? `\n${item.resolutionNote}` : ''}
            </ThemedText>
          </View>
        )}

        {status === 'OPEN' && !treating && (
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: tintColor }]}
            onPress={() => {
              setTreatingId(item.id);
              setNote('');
            }}
          >
            <ThemedText style={styles.primaryButtonText}>Traiter ce litige</ThemedText>
          </TouchableOpacity>
        )}

        {status === 'OPEN' && treating && (
          <View style={styles.treat}>
            <TextInput
              style={[styles.noteInput, { color: textColor, borderColor: textColor + '30' }]}
              value={note}
              onChangeText={setNote}
              placeholder="Note de décision (facultative, visible par l'acheteur)"
              placeholderTextColor={textColor + '60'}
              multiline
              maxLength={500}
            />
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#1565C0', opacity: busy ? 0.6 : 1 }]}
                onPress={() => resolve(item, 'RELEASE')}
                disabled={busy}
              >
                <ThemedText style={styles.primaryButtonText}>Payer le vendeur</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#2E7D32', opacity: busy ? 0.6 : 1 }]}
                onPress={() => resolve(item, 'REFUND')}
                disabled={busy}
              >
                <ThemedText style={styles.primaryButtonText}>Rembourser l'acheteur</ThemedText>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.cancelLink} onPress={() => setTreatingId(null)} disabled={busy}>
              <ThemedText style={{ color: textColor + '90' }}>Annuler</ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <LoadingView message="Chargement des litiges..." />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { backgroundColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.right" size={24} color={textColor} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: textColor }]}>Litiges</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabs}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, tab === t.key && { backgroundColor: tintColor }]}
            onPress={() => setTab(t.key)}
          >
            <ThemedText style={[styles.tabText, { color: tab === t.key ? '#FFF' : textColor }]}>
              {t.label}
              {t.key === 'OPEN' && openCount > 0 ? ` (${openCount})` : ''}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={visible}
        keyExtractor={(d) => d.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <IconSymbol name="checkmark.circle.fill" size={48} color="#9E9E9E" />
            <ThemedText style={styles.emptyText}>
              {tab === 'OPEN' ? 'Aucun litige en cours' : 'Aucun litige résolu pour le moment'}
            </ThemedText>
          </View>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 60 },
  backButton: { padding: 4, transform: [{ rotate: '180deg' }] },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: '#00000010' },
  tabText: { fontSize: 14, fontWeight: '600' },
  list: { padding: 16, paddingBottom: 40, gap: 12 },
  card: { borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#00000012' },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  orderNumber: { fontSize: 17, fontWeight: 'bold', flexShrink: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  meta: { fontSize: 12, marginTop: 4, marginBottom: 10 },
  rows: { gap: 2 },
  rowLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, opacity: 0.55, marginTop: 8 },
  rowValue: { fontSize: 14, fontWeight: '500' },
  items: { marginTop: 10, gap: 2 },
  itemLine: { fontSize: 13 },
  reasonBox: { borderWidth: 1, borderRadius: 10, padding: 12, marginTop: 12 },
  reasonLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, opacity: 0.55, marginBottom: 4 },
  reasonText: { fontSize: 14, lineHeight: 20 },
  decision: { marginTop: 12 },
  primaryButton: { marginTop: 14, paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  primaryButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  treat: { marginTop: 14 },
  noteInput: { borderWidth: 1, borderRadius: 10, padding: 12, minHeight: 70, fontSize: 14, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  actionButton: { flexGrow: 1, flexBasis: 140, paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  cancelLink: { alignItems: 'center', paddingVertical: 12 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { opacity: 0.6 },
});

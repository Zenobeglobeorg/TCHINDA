import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, RefreshControl, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { apiService } from '@/services/api.service';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/hooks/useAuth';
import { useThemeColor } from '@/hooks/useThemeColor';
import { LoadingView } from '@/components/ui/LoadingView';
import { alert } from '@/utils/alert';
import PaymentInfoForm from '@/components/PaymentInfoForm';

const MTN_METHOD = { id: 'mtn_money', name: 'MTN Mobile Money', icon: 'creditcard.fill', available: true };
type MomoStatus = 'PENDING' | 'SUCCESSFUL' | 'FAILED' | 'CANCELLED' | 'EXPIRED';

export default function OrderDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'background');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [order, setOrder] = useState<any>(null);

  const loadOrder = async () => {
    try {
      const res = await apiService.get(`/api/buyer/orders/${id}`);
      if (res.success) setOrder(res.data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    loadOrder();
  }, [user, id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrder();
  };

  const [acting, setActing] = useState(false);

  const runAction = async (endpoint: string, successTitle: string, successMsg: string) => {
    setActing(true);
    try {
      const res: any = await apiService.put(endpoint);
      if (res.success) {
        alert(successTitle, successMsg);
        await loadOrder();
      } else {
        alert('Erreur', res.error?.message || res.message || "L'action a échoué");
      }
    } catch (e: any) {
      alert('Erreur', e?.message || "L'action a échoué");
    } finally {
      setActing(false);
    }
  };

  const confirmReception = () =>
    alert(
      'Confirmer la réception',
      "En confirmant, l'argent est versé au vendeur. Ne confirmez que si vous avez bien reçu votre commande.",
      [
        { text: 'Pas encore', style: 'cancel' },
        {
          text: 'Oui, reçu',
          onPress: () =>
            runAction(`/api/buyer/orders/${id}/confirm-delivery`, 'Merci !', 'Réception confirmée, le vendeur a été payé.'),
        },
      ]
    );

  const cancelOrder = () =>
    alert('Annuler la commande', 'Vous serez remboursé sur votre portefeuille.', [
      { text: 'Non', style: 'cancel' },
      {
        text: "Oui, annuler",
        style: 'destructive',
        onPress: () => runAction(`/api/buyer/orders/${id}/cancel`, 'Commande annulée', 'Le montant a été remboursé sur votre portefeuille.'),
      },
    ]);

  // Reprise du paiement MTN d'une commande restée en attente ou échouée
  const [showPhoneForm, setShowPhoneForm] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payStatus, setPayStatus] = useState<MomoStatus | null>(null);
  const [payReference, setPayReference] = useState<string | null>(null);
  const [charge, setCharge] = useState<{ amount: number; currency: string } | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    pollRef.current = null;
    pollTimeoutRef.current = null;
  };

  useEffect(() => stopPolling, []);

  const startPolling = (referenceId: string) => {
    stopPolling();
    const poll = async () => {
      try {
        const res: any = await apiService.get(`/api/buyer/payments/mobile-money/${referenceId}/status`);
        if (!res.success) return;
        const status = res.data?.status as MomoStatus;
        setPayStatus(status);
        if (['SUCCESSFUL', 'FAILED', 'CANCELLED', 'EXPIRED'].includes(status)) {
          stopPolling();
          if (status === 'SUCCESSFUL') await loadOrder();
        }
      } catch {
        // on réessaie au prochain passage
      }
    };
    poll();
    pollRef.current = setInterval(poll, 5000);
    pollTimeoutRef.current = setTimeout(() => {
      stopPolling();
      setPayStatus((current) => (current === 'PENDING' ? 'EXPIRED' : current));
    }, 5 * 60 * 1000);
  };

  const openPayModal = (referenceId: string, info: { amount: number; currency: string } | null) => {
    setPayReference(referenceId);
    setCharge(info);
    setPayStatus('PENDING');
    setShowPayModal(true);
    startPolling(referenceId);
  };

  const submitPhone = async (info: any) => {
    setActing(true);
    try {
      const res: any = await apiService.post('/api/buyer/payments/mobile-money/initiate', {
        orderId: id,
        provider: 'MTN',
        phoneNumber: info.phoneNumber,
      });
      if (!res.success) {
        alert('Erreur', res.error?.message || res.message || "Impossible d'initier le paiement");
        return;
      }
      setShowPhoneForm(false);
      const d = res.data;
      openPayModal(d.referenceId, d.amount != null ? { amount: Number(d.amount), currency: String(d.currency || '') } : null);
    } catch (e: any) {
      alert('Erreur', e?.message || "Impossible d'initier le paiement");
    } finally {
      setActing(false);
    }
  };

  const cancelPendingPayment = async () => {
    stopPolling();
    if (payReference) {
      try {
        await apiService.post(`/api/buyer/payments/mobile-money/${payReference}/cancel`, {});
      } catch {
        // le serveur expirera la demande de toute façon
      }
    }
    closePayModal();
  };

  const closePayModal = () => {
    stopPolling();
    setShowPayModal(false);
    setPayReference(null);
    setPayStatus(null);
    loadOrder();
  };

  const abandonOrder = () =>
    alert(
      'Abandonner la commande',
      order?.groupCount > 1
        ? `Les ${order.groupCount} commandes de ce panier seront annulées. Vous n'avez rien payé, aucun montant n'est débité.`
        : "Cette commande sera annulée. Vous n'avez rien payé, aucun montant n'est débité.",
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, abandonner',
          style: 'destructive',
          onPress: () => runAction(`/api/buyer/orders/${id}/cancel`, 'Commande annulée', 'Aucun montant ne vous a été débité.'),
        },
      ]
    );

  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');

  const submitDispute = async () => {
    const reason = disputeReason.trim();
    if (reason.length < 10) {
      alert('Description trop courte', 'Décrivez le problème en au moins 10 caractères.');
      return;
    }
    setActing(true);
    try {
      const res: any = await apiService.post(`/api/buyer/orders/${id}/dispute`, { reason });
      if (res.success) {
        setShowDisputeForm(false);
        setDisputeReason('');
        alert('Litige ouvert', "Les fonds sont gelés. Un administrateur va examiner votre dossier.");
        await loadOrder();
      } else {
        alert('Erreur', res.error?.message || res.message || "Impossible d'ouvrir le litige");
      }
    } catch (e: any) {
      alert('Erreur', e?.message || "Impossible d'ouvrir le litige");
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <LoadingView message="Chargement de la commande..." />
      </ThemedView>
    );
  }

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.center}>
          <IconSymbol name="tray" size={64} color="#CCC" />
          <ThemedText style={styles.title}>Connectez-vous</ThemedText>
          <TouchableOpacity style={[styles.button, { backgroundColor: tintColor }]} onPress={() => router.push('/Login')}>
            <ThemedText style={styles.buttonText}>Se connecter</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  if (!order) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.center}>
          <IconSymbol name="tray" size={64} color="#CCC" />
          <ThemedText style={styles.title}>Commande introuvable</ThemedText>
          <TouchableOpacity style={[styles.button, { backgroundColor: tintColor }]} onPress={() => router.replace('/(tabs)/orders')}>
            <ThemedText style={styles.buttonText}>Retour</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  const STATUS_FR: Record<string, string> = {
    PENDING: 'En attente',
    CONFIRMED: 'Confirmée',
    PROCESSING: 'En préparation',
    SHIPPED: 'Expédiée',
    DELIVERED: 'Livrée',
    CANCELLED: 'Annulée',
    REFUNDED: 'Remboursée',
  };
  const dispute = order.disputes?.[0];
  const disputeOpen = dispute?.status === 'OPEN';
  const hasHeldFunds = (order.escrows || []).some((e: any) => e.status === 'HELD');
  const needsPayment = order.paymentStatus !== 'PAID' && !['CANCELLED', 'REFUNDED'].includes(order.status);
  const payTotal = parseFloat(order.groupTotal ?? order.total);
  const canConfirm = order.paymentStatus === 'PAID' && ['SHIPPED', 'DELIVERED'].includes(order.status) && hasHeldFunds && !disputeOpen;

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.right" size={24} color={textColor} />
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { color: textColor }]}>Commande</ThemedText>
          <View style={{ width: 40 }} />
        </View>

        <View style={[styles.card, { backgroundColor }]}>
          <ThemedText style={[styles.line, { color: textColor }]}>#{order.orderNumber}</ThemedText>
          <ThemedText style={[styles.subLine, { color: textColor + '80' }]}>{STATUS_FR[order.status] || order.status}</ThemedText>
          <ThemedText style={[styles.subLine, { color: textColor + '80' }]}>
            Total: {parseFloat(order.total).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} {order.currency || 'XOF'}
          </ThemedText>
        </View>

        {dispute && (
          <View
            style={[
              styles.banner,
              disputeOpen
                ? { backgroundColor: '#FFF4E5', borderColor: '#F0B35A' }
                : dispute.status === 'RESOLVED_REFUND'
                ? { backgroundColor: '#E8F5E9', borderColor: '#81C784' }
                : { backgroundColor: '#EEF2F7', borderColor: '#B0BEC5' },
            ]}
          >
            <ThemedText style={styles.bannerTitle}>
              {disputeOpen
                ? 'Litige en cours : vos fonds sont gelés'
                : dispute.status === 'RESOLVED_REFUND'
                ? 'Litige clos : vous avez été remboursé'
                : 'Litige clos : le vendeur a été payé'}
            </ThemedText>
            <ThemedText style={styles.bannerText}>Votre message : {dispute.reason}</ThemedText>
            {disputeOpen && (
              <ThemedText style={styles.bannerText}>Un administrateur examine votre dossier. Vous n'avez rien d'autre à faire.</ThemedText>
            )}
            {!disputeOpen && dispute.resolutionNote ? (
              <ThemedText style={styles.bannerText}>Décision : {dispute.resolutionNote}</ThemedText>
            ) : null}
          </View>
        )}

        {needsPayment && (
          <View style={[styles.banner, { backgroundColor: '#FFF4E5', borderColor: '#F0B35A' }]}>
            <ThemedText style={styles.bannerTitle}>
              {order.pendingPayment
                ? 'Paiement en cours'
                : order.paymentStatus === 'FAILED'
                ? 'Le paiement a échoué ou a expiré'
                : "Cette commande n'est pas encore payée"}
            </ThemedText>
            <ThemedText style={styles.bannerText}>
              {order.pendingPayment
                ? 'Une demande a été envoyée sur votre téléphone MTN. Confirmez-la avec votre code PIN.'
                : `Aucun montant n'a été débité. ${
                    order.groupCount > 1
                      ? `Le paiement couvre les ${order.groupCount} commandes de votre panier`
                      : 'Payez maintenant pour que le vendeur prépare votre commande'
                  } (${payTotal.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} ${order.currency || 'XOF'}).`}
            </ThemedText>
            {order.pendingPayment ? (
              <TouchableOpacity
                style={[styles.button, { backgroundColor: tintColor, alignItems: 'center', marginTop: 12 }]}
                onPress={() =>
                  openPayModal(order.pendingPayment.referenceId, {
                    amount: Number(order.pendingPayment.amount),
                    currency: String(order.pendingPayment.currency),
                  })
                }
              >
                <ThemedText style={styles.buttonText}>Suivre le paiement</ThemedText>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: tintColor, alignItems: 'center', marginTop: 12, opacity: acting ? 0.6 : 1 }]}
                  onPress={() => setShowPhoneForm(true)}
                  disabled={acting}
                >
                  <ThemedText style={styles.buttonText}>Payer maintenant avec MTN Mobile Money</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.linkButton} onPress={abandonOrder} disabled={acting}>
                  <ThemedText style={[styles.linkButtonText, { color: '#D32F2F' }]}>
                    {order.groupCount > 1 ? 'Abandonner ce panier' : 'Abandonner cette commande'}
                  </ThemedText>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {canConfirm && (
          <View style={[styles.card, { backgroundColor }]}>
            <ThemedText style={[styles.subLine, { color: textColor + '80', marginTop: 0, marginBottom: 12 }]}>
              Votre paiement est sécurisé : le vendeur n'est payé qu'après votre confirmation de réception
              (ou automatiquement 7 jours après la livraison).
            </ThemedText>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: tintColor, alignItems: 'center', opacity: acting ? 0.6 : 1 }]}
              onPress={confirmReception}
              disabled={acting}
            >
              <ThemedText style={styles.buttonText}>Confirmer la réception</ThemedText>
            </TouchableOpacity>
            {!showDisputeForm && (
              <TouchableOpacity style={styles.linkButton} onPress={() => setShowDisputeForm(true)} disabled={acting}>
                <ThemedText style={styles.linkButtonText}>Un problème avec cette commande ?</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        )}

        {canConfirm && showDisputeForm && (
          <View style={[styles.card, { backgroundColor }]}>
            <ThemedText style={[styles.sectionTitle, { color: textColor }]}>Signaler un problème</ThemedText>
            <ThemedText style={[styles.subLine, { color: textColor + '80', marginTop: 0, marginBottom: 10 }]}>
              Les fonds restent gelés pendant que l'administrateur examine votre cas. Décrivez ce qui ne va pas (colis non reçu, article abîmé ou non conforme…).
            </ThemedText>
            <TextInput
              style={[styles.input, { color: textColor }]}
              value={disputeReason}
              onChangeText={setDisputeReason}
              placeholder="Décrivez le problème (10 caractères minimum)"
              placeholderTextColor={textColor + '60'}
              multiline
              numberOfLines={4}
              maxLength={1000}
              textAlignVertical="top"
            />
            <ThemedText style={[styles.counter, { color: textColor + '60' }]}>{disputeReason.trim().length}/1000</ThemedText>
            <View style={styles.formActions}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#9E9E9E', flex: 1, alignItems: 'center' }]}
                onPress={() => {
                  setShowDisputeForm(false);
                  setDisputeReason('');
                }}
                disabled={acting}
              >
                <ThemedText style={styles.buttonText}>Annuler</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#E65100', flex: 1, alignItems: 'center', opacity: acting ? 0.6 : 1 }]}
                onPress={submitDispute}
                disabled={acting}
              >
                <ThemedText style={styles.buttonText}>Ouvrir le litige</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {order.paymentStatus === 'PAID' && ['CONFIRMED', 'PROCESSING'].includes(order.status) && (
          <TouchableOpacity
            style={[styles.card, { backgroundColor, alignItems: 'center', opacity: acting ? 0.6 : 1 }]}
            onPress={cancelOrder}
            disabled={acting}
          >
            <ThemedText style={{ color: '#D32F2F', fontWeight: 'bold' }}>Annuler la commande</ThemedText>
          </TouchableOpacity>
        )}

        <View style={[styles.card, { backgroundColor }]}>
          <ThemedText style={[styles.sectionTitle, { color: textColor }]}>Articles</ThemedText>
          {(order.items || []).map((it: any) => (
            <View key={it.id} style={styles.itemRow}>
              <ThemedText style={[styles.itemName, { color: textColor }]} numberOfLines={1}>
                {(it.productSnapshot?.name || it.product?.name || 'Produit') +
                  ((it.productSnapshot?.variantName || it.variant?.name)
                    ? ` • ${it.productSnapshot?.variantName || it.variant?.name}`
                    : '')}
              </ThemedText>
              <ThemedText style={[styles.itemQty, { color: textColor + '80' }]}>x{it.quantity}</ThemedText>
            </View>
          ))}
        </View>
      </ScrollView>

      <PaymentInfoForm
        visible={showPhoneForm}
        paymentMethod={MTN_METHOD}
        amount={payTotal}
        currency={order.currency || 'XOF'}
        onClose={() => setShowPhoneForm(false)}
        onSubmit={submitPhone}
        loading={acting}
        transactionType="deposit"
      />

      <Modal visible={showPayModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor }]}>
            <ThemedText style={[styles.sectionTitle, { color: textColor, fontSize: 20, textAlign: 'center' }]}>Paiement MTN MoMo</ThemedText>

            {payStatus === 'PENDING' && (
              <View style={styles.statusBox}>
                <ActivityIndicator size="large" color={tintColor} style={{ marginBottom: 16 }} />
                <ThemedText style={[styles.statusTitle, { color: textColor }]}>En attente de confirmation</ThemedText>
                <ThemedText style={[styles.statusText, { color: textColor + '80' }]}>
                  Une notification MTN MoMo a été envoyée sur votre téléphone. Entrez votre code PIN pour confirmer.
                </ThemedText>
                {charge && (
                  <ThemedText style={[styles.statusText, { color: textColor, fontWeight: '700' }]}>
                    Montant débité : {charge.amount.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} {charge.currency}
                    {charge.currency === 'EUR' ? '\n(le test MTN fonctionne en euros)' : ''}
                  </ThemedText>
                )}
              </View>
            )}

            {payStatus === 'SUCCESSFUL' && (
              <View style={styles.statusBox}>
                <ThemedText style={styles.statusIcon}>✅</ThemedText>
                <ThemedText style={[styles.statusTitle, { color: '#4CAF50' }]}>Paiement réussi !</ThemedText>
                <ThemedText style={[styles.statusText, { color: textColor + '80' }]}>
                  {order.groupCount > 1
                    ? `Vos ${order.groupCount} commandes (une par vendeur) sont confirmées.`
                    : 'Votre commande est confirmée.'}
                </ThemedText>
              </View>
            )}

            {(payStatus === 'FAILED' || payStatus === 'CANCELLED') && (
              <View style={styles.statusBox}>
                <ThemedText style={styles.statusIcon}>❌</ThemedText>
                <ThemedText style={[styles.statusTitle, { color: '#F44336' }]}>Paiement échoué</ThemedText>
                <ThemedText style={[styles.statusText, { color: textColor + '80' }]}>
                  Le paiement a été refusé ou annulé. Vous pouvez réessayer.
                </ThemedText>
              </View>
            )}

            {payStatus === 'EXPIRED' && (
              <View style={styles.statusBox}>
                <ThemedText style={styles.statusIcon}>⏰</ThemedText>
                <ThemedText style={[styles.statusTitle, { color: '#FF9800' }]}>Délai expiré</ThemedText>
                <ThemedText style={[styles.statusText, { color: textColor + '80' }]}>
                  Vous n'avez pas confirmé à temps. Vous pouvez relancer un paiement.
                </ThemedText>
              </View>
            )}

            {payStatus === 'PENDING' ? (
              <View style={styles.formActions}>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: '#9E9E9E', flex: 1, alignItems: 'center' }]}
                  onPress={closePayModal}
                >
                  <ThemedText style={styles.buttonText}>Fermer</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: '#F44336', flex: 1, alignItems: 'center' }]}
                  onPress={cancelPendingPayment}
                >
                  <ThemedText style={styles.buttonText}>Annuler le paiement</ThemedText>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.button, { backgroundColor: tintColor, alignItems: 'center' }]}
                onPress={closePayModal}
              >
                <ThemedText style={styles.buttonText}>{payStatus === 'SUCCESSFUL' ? 'Voir ma commande' : 'Fermer'}</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  backButton: { transform: [{ rotate: '180deg' }], padding: 6 },
  headerTitle: { fontSize: 22, fontWeight: 'bold' },
  card: { borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#00000010' },
  line: { fontSize: 18, fontWeight: 'bold' },
  subLine: { fontSize: 14, marginTop: 6 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, gap: 10 },
  itemName: { flex: 1, fontSize: 14, fontWeight: '600' },
  itemQty: { fontSize: 14 },
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginTop: 16, marginBottom: 12 },
  button: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  buttonText: { color: '#FFF', fontWeight: 'bold' },
  banner: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12 },
  bannerTitle: { fontSize: 15, fontWeight: 'bold', color: '#3A2A00', marginBottom: 6 },
  bannerText: { fontSize: 13, color: '#4A4A4A', lineHeight: 19, marginTop: 2 },
  linkButton: { alignItems: 'center', paddingVertical: 12, marginTop: 4 },
  linkButtonText: { color: '#E65100', fontWeight: '600', fontSize: 14 },
  input: { borderWidth: 1, borderColor: '#00000020', borderRadius: 10, padding: 12, minHeight: 100, fontSize: 14 },
  counter: { fontSize: 12, textAlign: 'right', marginTop: 4, marginBottom: 12 },
  formActions: { flexDirection: 'row', gap: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', borderRadius: 16, padding: 20 },
  statusBox: { alignItems: 'center', paddingVertical: 20 },
  statusIcon: { fontSize: 48, marginBottom: 12 },
  statusTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  statusText: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 8 },
});


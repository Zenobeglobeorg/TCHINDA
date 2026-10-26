import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { apiService } from '@/services/api.service';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/hooks/useAuth';
import PaymentMethodModal, { PaymentMethod, PAYMENT_METHODS } from '@/components/PaymentMethodModal';
import PaymentInfoForm from '@/components/PaymentInfoForm';
import { alert } from '@/utils/alert';

export default function DepositScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('XOF');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentInfoForm, setShowPaymentInfoForm] = useState(false);

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [depositStatus, setDepositStatus] = useState<'PENDING' | 'SUCCESSFUL' | 'FAILED' | 'CANCELLED' | 'EXPIRED' | null>(null);
  const [failureReason, setFailureReason] = useState<string | null>(null);
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [credited, setCredited] = useState<{ amount: number; currency: string } | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currencies = ['XOF', 'XAF', 'EUR'];
  const quickAmounts = [5000, 10000, 25000, 50000, 100000];

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setPaymentMethod(method);
    // Après sélection, afficher le formulaire d'informations
    setShowPaymentInfoForm(true);
  };

  const stopPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    pollRef.current = null;
    pollTimeoutRef.current = null;
  };

  useEffect(() => () => stopPolling(), []);

  const startPolling = (refId: string) => {
    stopPolling();
    const poll = async () => {
      try {
        const res = await apiService.get<any>(`/api/wallet/deposit/${refId}/status`);
        if (!res.success) return;
        const status = res.data?.status;
        setDepositStatus(status);
        if (status !== 'PENDING') {
          setFailureReason(res.data?.failureReason || null);
          stopPolling();
        }
      } catch (e) {
        // erreur réseau passagère : on réessaie au prochain tour
      }
    };
    poll();
    pollRef.current = setInterval(poll, 4000);
    pollTimeoutRef.current = setTimeout(() => {
      stopPolling();
      setDepositStatus((current) => (current === 'PENDING' ? 'EXPIRED' : current));
    }, 10 * 60 * 1000);
  };

  const handlePaymentInfoSubmit = async (paymentInfo: any) => {
    const value = parseFloat(amount);
    if (!value || value <= 0) {
      alert('Erreur', 'Veuillez entrer un montant valide');
      return;
    }
    if (!paymentMethod || paymentMethod.id !== 'mtn_money') {
      alert('Info', "Seul MTN Mobile Money est disponible pour recharger pour l'instant");
      return;
    }

    setLoading(true);
    try {
      const res = await apiService.post<any>('/api/wallet/deposit/mobile-money', {
        amount: value,
        currency,
        provider: 'MTN',
        phoneNumber: paymentInfo.phoneNumber,
      });

      if (!res.success) {
        alert('Erreur', res.error?.message || "Impossible d'initier la recharge");
        return;
      }

      setCredited({ amount: value, currency });
      setReferenceId(res.data.referenceId);
      setDepositStatus('PENDING');
      setFailureReason(null);
      setShowPaymentInfoForm(false);
      setShowStatusModal(true);
      startPolling(res.data.referenceId);
    } catch (error: any) {
      alert('Erreur', error.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDeposit = async () => {
    stopPolling();
    if (referenceId) {
      try {
        await apiService.post(`/api/wallet/deposit/${referenceId}/cancel`, {});
      } catch (e) {
        // sans conséquence : le paiement expirera de toute façon
      }
    }
    closeStatusModal();
  };

  const closeStatusModal = () => {
    const wasSuccess = depositStatus === 'SUCCESSFUL';
    stopPolling();
    setShowStatusModal(false);
    setReferenceId(null);
    setDepositStatus(null);
    if (wasSuccess) router.back();
  };

  const handleDeposit = () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Erreur', 'Veuillez entrer un montant valide');
      return;
    }

    // Ouvrir le modal de sélection de méthode de paiement
    setShowPaymentModal(true);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.right" size={24} color="#333" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Déposer des fonds</ThemedText>
          <View style={{ width: 40 }} />
        </View>

        {/* Amount Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Montant</ThemedText>
          
          <View style={styles.amountInputContainer}>
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
            <View style={styles.currencySelector}>
              {currencies.map((curr) => (
                <TouchableOpacity
                  key={curr}
                  style={[
                    styles.currencyButton,
                    currency === curr && styles.currencyButtonActive,
                  ]}
                  onPress={() => setCurrency(curr)}
                >
                  <ThemedText
                    style={[
                      styles.currencyButtonText,
                      currency === curr && styles.currencyButtonTextActive,
                    ]}
                  >
                    {curr}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Quick Amounts */}
          <View style={styles.quickAmounts}>
            <ThemedText style={styles.quickAmountsLabel}>Montants rapides</ThemedText>
            <View style={styles.quickAmountsGrid}>
              {quickAmounts.map((quickAmount) => (
                <TouchableOpacity
                  key={quickAmount}
                  style={styles.quickAmountButton}
                  onPress={() => setAmount(quickAmount.toString())}
                >
                  <ThemedText style={styles.quickAmountText}>
                    {quickAmount.toLocaleString('fr-FR')}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Payment Method Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Mode de paiement</ThemedText>
          
          <TouchableOpacity
            style={[
              styles.paymentMethodCard,
              paymentMethod && styles.paymentMethodCardActive,
            ]}
            onPress={() => setShowPaymentModal(true)}
          >
            <View style={styles.paymentMethodLeft}>
              <View style={styles.paymentMethodIcon}>
                <IconSymbol 
                  name={paymentMethod?.icon || 'creditcard.fill'} 
                  size={24} 
                  color="#624cacff" 
                />
              </View>
              <ThemedText style={styles.paymentMethodName}>
                {paymentMethod ? paymentMethod.name : 'Choisir un mode de paiement'}
              </ThemedText>
            </View>
            <IconSymbol name="chevron.right" size={20} color="#624cacff" />
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <IconSymbol name="info.circle.fill" size={20} color="#624cacff" />
          <ThemedText style={styles.infoText}>
            Les fonds sont crédités sur votre portefeuille uniquement après confirmation du paiement par MTN Mobile Money.
          </ThemedText>
        </View>

        {/* Deposit Button */}
        <TouchableOpacity
          style={[styles.depositButton, (loading || !amount) && styles.depositButtonDisabled]}
          onPress={handleDeposit}
          disabled={loading || !amount}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <ThemedText style={styles.depositButtonText}>
              Déposer {amount ? `${parseFloat(amount).toLocaleString('fr-FR')} ${currency}` : ''}
            </ThemedText>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Payment Method Selection Modal */}
      <PaymentMethodModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSelect={handlePaymentMethodSelect}
        title="Choisir un mode de paiement"
        loading={loading}
        excludeIds={['wallet']}
      />

      {/* Formulaire du numéro de téléphone */}
      {paymentMethod && (
        <PaymentInfoForm
          visible={showPaymentInfoForm}
          paymentMethod={paymentMethod}
          amount={parseFloat(amount) || 0}
          currency={currency}
          onClose={() => setShowPaymentInfoForm(false)}
          onSubmit={handlePaymentInfoSubmit}
          loading={loading}
          transactionType="deposit"
        />
      )}

      {/* Suivi de la recharge (le portefeuille n'est crédité qu'après confirmation de MTN) */}
      <Modal visible={showStatusModal} animationType="slide" transparent>
        <View style={styles.statusOverlay}>
          <View style={styles.statusCard}>
            {depositStatus === 'PENDING' && (
              <>
                <ActivityIndicator size="large" color="#624cacff" style={{ marginBottom: 16 }} />
                <ThemedText style={styles.statusTitle}>En attente de confirmation</ThemedText>
                <ThemedText style={styles.statusText}>
                  Une demande MTN Mobile Money a été envoyée sur votre téléphone.{'\n'}Entrez votre code PIN pour confirmer.
                </ThemedText>
              </>
            )}
            {depositStatus === 'SUCCESSFUL' && (
              <>
                <ThemedText style={styles.statusIcon}>✅</ThemedText>
                <ThemedText style={[styles.statusTitle, { color: '#4CAF50' }]}>Recharge réussie !</ThemedText>
                <ThemedText style={styles.statusText}>
                  {credited ? `${credited.amount.toLocaleString('fr-FR')} ${credited.currency}` : 'Le montant'} ajouté à votre portefeuille.
                </ThemedText>
              </>
            )}
            {(depositStatus === 'FAILED' || depositStatus === 'CANCELLED') && (
              <>
                <ThemedText style={styles.statusIcon}>❌</ThemedText>
                <ThemedText style={[styles.statusTitle, { color: '#F44336' }]}>Recharge non effectuée</ThemedText>
                <ThemedText style={styles.statusText}>
                  Le paiement a été refusé ou annulé. Aucun montant n'a été ajouté.
                  {failureReason ? `\n(${failureReason})` : ''}
                </ThemedText>
              </>
            )}
            {depositStatus === 'EXPIRED' && (
              <>
                <ThemedText style={styles.statusIcon}>⏰</ThemedText>
                <ThemedText style={[styles.statusTitle, { color: '#FF9800' }]}>Délai expiré</ThemedText>
                <ThemedText style={styles.statusText}>
                  Vous n'avez pas confirmé à temps. Relancez une recharge.
                </ThemedText>
              </>
            )}

            {depositStatus === 'PENDING' ? (
              <TouchableOpacity style={[styles.statusButton, { backgroundColor: '#F44336' }]} onPress={handleCancelDeposit}>
                <ThemedText style={styles.statusButtonText}>Annuler</ThemedText>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.statusButton, { backgroundColor: '#624cacff' }]} onPress={closeStatusModal}>
                <ThemedText style={styles.statusButtonText}>
                  {depositStatus === 'SUCCESSFUL' ? 'Terminer' : 'Fermer'}
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  backButton: {
    padding: 4,
    transform: [{ rotate: '180deg' }],
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  amountInputContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  amountInput: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  currencySelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  currencyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  currencyButtonActive: {
    backgroundColor: '#624cacff',
    borderColor: '#624cacff',
  },
  currencyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  currencyButtonTextActive: {
    color: '#FFF',
  },
  quickAmounts: {
    marginTop: 20,
  },
  quickAmountsLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  quickAmountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickAmountButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  paymentMethodCardActive: {
    borderColor: '#624cacff',
    backgroundColor: '#F0F7FF',
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentMethodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F7FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  depositButton: {
    backgroundColor: '#624cacff',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 40,
  },
  depositButtonDisabled: {
    opacity: 0.6,
  },
  statusOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  statusCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
  },
  statusIcon: { fontSize: 48, marginBottom: 12 },
  statusTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8, color: '#222', textAlign: 'center' },
  statusText: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  statusButton: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, alignSelf: 'stretch', alignItems: 'center' },
  statusButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  depositButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});



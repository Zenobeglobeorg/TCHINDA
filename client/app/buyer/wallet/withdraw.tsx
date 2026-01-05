import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { apiService } from '@/services/api.service';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/hooks/useAuth';
import PaymentMethodModal, { PaymentMethod } from '@/components/PaymentMethodModal';
import WithdrawConfirmationForm from '@/components/WithdrawConfirmationForm';
import { alert } from '@/utils/alert';

export default function WithdrawScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState<any>(null);
  const [currency, setCurrency] = useState('XOF');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showWithdrawConfirmation, setShowWithdrawConfirmation] = useState(false);

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    try {
      const response = await apiService.get('/api/buyer/wallet');
      if (response.success) {
        setWallet(response.data);
        if (response.data?.walletCurrencies?.length > 0) {
          setCurrency(response.data.walletCurrencies[0].currency);
        }
      }
    } catch (error) {
      console.error('Error loading wallet:', error);
    }
  };

  const currencies = wallet?.walletCurrencies?.map((wc: any) => wc.currency) || ['XOF'];

  const getAvailableBalance = () => {
    if (!wallet?.walletCurrencies) return 0;
    const walletCurrency = wallet.walletCurrencies.find((wc: any) => wc.currency === currency);
    return walletCurrency ? parseFloat(walletCurrency.balance) : 0;
  };

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setPaymentMethod(method);
    // Après sélection, afficher le formulaire de confirmation avec montant et mot de passe
    setShowWithdrawConfirmation(true);
  };

  const handleWithdrawConfirm = async (amount: number, paymentInfo: any, password: string) => {
    if (!paymentMethod) {
      alert('Erreur', 'Méthode de paiement non sélectionnée');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.post('/api/buyer/wallet/withdraw', {
        amount,
        currency,
        paymentMethod: paymentMethod.id,
        paymentInfo,
        password, // Mot de passe pour confirmation
      });

      if (response.success) {
        alert(
          'Succès',
          `Demande de retrait de ${amount.toLocaleString('fr-FR')} ${currency} via ${paymentMethod.name} effectuée. Le traitement peut prendre 24-48h.`,
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        alert('Erreur', response.error?.message || 'Erreur lors du retrait');
      }
    } catch (error: any) {
      alert('Erreur', error.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = () => {
    // Ouvrir directement le modal de sélection de méthode de paiement
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
          <ThemedText style={styles.headerTitle}>Retirer des fonds</ThemedText>
          <View style={{ width: 40 }} />
        </View>

        {/* Balance Info */}
        <View style={styles.balanceCard}>
          <ThemedText style={styles.balanceLabel}>Solde disponible</ThemedText>
          <ThemedText style={styles.balanceAmount}>
            {getAvailableBalance().toLocaleString('fr-FR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{' '}
            {currency}
          </ThemedText>
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <IconSymbol name="info.circle.fill" size={20} color="#624cacff" />
          <ThemedText style={styles.infoText}>
            Sélectionnez un mode de retrait, puis entrez le montant et confirmez avec votre mot de passe.
          </ThemedText>
        </View>

        {/* Withdraw Button */}
        <TouchableOpacity
          style={[
            styles.withdrawButton,
            loading && styles.withdrawButtonDisabled,
          ]}
          onPress={handleWithdraw}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <ThemedText style={styles.withdrawButtonText}>
              Retirer
            </ThemedText>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Payment Method Selection Modal */}
      <PaymentMethodModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSelect={handlePaymentMethodSelect}
        title="Choisir un mode de retrait"
        loading={loading}
      />

      {/* Withdraw Confirmation Form Modal */}
      {paymentMethod && (
        <WithdrawConfirmationForm
          visible={showWithdrawConfirmation}
          paymentMethod={paymentMethod}
          availableBalance={getAvailableBalance()}
          currency={currency}
          onClose={() => setShowWithdrawConfirmation(false)}
          onSubmit={handleWithdrawConfirm}
          loading={loading}
        />
      )}
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
  balanceCard: {
    backgroundColor: '#624cacff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    alignItems: 'center',
  },
  balanceLabel: {
    color: '#FFF',
    fontSize: 14,
    opacity: 0.9,
    marginBottom: 8,
  },
  balanceAmount: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  maxButton: {
    fontSize: 14,
    color: '#624cacff',
    fontWeight: '600',
  },
  amountInputContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 20,
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
  withdrawButton: {
    backgroundColor: '#624cacff',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 40,
  },
  withdrawButtonDisabled: {
    opacity: 0.6,
  },
  withdrawButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});



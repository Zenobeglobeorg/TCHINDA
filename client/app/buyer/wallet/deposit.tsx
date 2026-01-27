import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
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

  const currencies = ['XOF', 'XAF', 'EUR', 'USD'];
  const quickAmounts = [5000, 10000, 25000, 50000, 100000];

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setPaymentMethod(method);
    // Après sélection, afficher le formulaire d'informations
    setShowPaymentInfoForm(true);
  };

  const handlePaymentInfoSubmit = async (paymentInfo: any) => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Erreur', 'Veuillez entrer un montant valide');
      return;
    }

    if (!paymentMethod) {
      alert('Erreur', 'Méthode de paiement non sélectionnée');
      return;
    }

    setLoading(true);
    try {
      // Si c'est MTN ou Orange, utiliser le service mobile money
      if (paymentMethod.id === 'mtn_money' || paymentMethod.id === 'orange_money') {
        const provider = paymentMethod.id === 'mtn_money' ? 'MTN' : 'ORANGE';
        
        const paymentRes = await apiService.post('/api/buyer/payments/mobile-money/initiate', {
          amount: parseFloat(amount),
          currency,
          provider,
          phoneNumber: paymentInfo.phoneNumber,
          type: 'DEPOSIT',
        });

        if (paymentRes.success) {
          alert(
            'Paiement initié',
            `Un SMS de confirmation a été envoyé au ${paymentInfo.phoneNumber}. Veuillez confirmer le paiement avec le code reçu.`,
            [
              {
                text: 'OK',
                onPress: () => {
                  // En production, ouvrir un modal pour entrer le code de confirmation
                  // Pour l'instant, on simule la confirmation automatique
                  setTimeout(async () => {
                    try {
                      const confirmRes = await apiService.post(
                        `/api/buyer/payments/mobile-money/${paymentRes.data.paymentId}/confirm`,
                        { confirmationCode: '123456' } // Code de test
                      );
                      if (confirmRes.success) {
                        alert('Succès', 'Dépôt effectué avec succès', [
                          { text: 'OK', onPress: () => router.back() },
                        ]);
                      }
                    } catch (error: any) {
                      alert('Erreur', error.message || 'Erreur lors de la confirmation');
                    }
                  }, 2000);
                },
              },
            ]
          );
        } else {
          alert('Erreur', paymentRes.error?.message || 'Erreur lors de l\'initiation du paiement');
        }
      } else {
        // Autres méthodes de paiement (carte, virement, etc.)
        const response = await apiService.post('/api/buyer/wallet/deposit', {
          amount: parseFloat(amount),
          currency,
          paymentMethod: paymentMethod.id,
          paymentInfo,
        });

        if (response.success) {
          alert(
            'Succès',
            `Dépôt de ${parseFloat(amount).toLocaleString('fr-FR')} ${currency} via ${paymentMethod.name} effectué avec succès`,
            [
              {
                text: 'OK',
                onPress: () => router.back(),
              },
            ]
          );
        } else {
          alert('Erreur', response.error?.message || 'Erreur lors du dépôt');
        }
      }
    } catch (error: any) {
      alert('Erreur', error.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
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
            Les fonds seront crédités sur votre portefeuille après confirmation du paiement.
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
      />
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
  depositButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});



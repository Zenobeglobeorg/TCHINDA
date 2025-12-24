import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { apiService } from '@/services/api.service';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/hooks/useAuth';

export default function WithdrawScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('XOF');
  const [paymentMethod, setPaymentMethod] = useState('');

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
  const paymentMethods = [
    { id: 'orange_money', name: 'Orange Money', icon: 'creditcard.fill' },
    { id: 'mtn_money', name: 'MTN Money', icon: 'creditcard.fill' },
    { id: 'moov_money', name: 'Moov Money', icon: 'creditcard.fill' },
    { id: 'bank_transfer', name: 'Virement bancaire', icon: 'creditcard.fill' },
  ];

  const getAvailableBalance = () => {
    if (!wallet?.walletCurrencies) return 0;
    const walletCurrency = wallet.walletCurrencies.find((wc: any) => wc.currency === currency);
    return walletCurrency ? parseFloat(walletCurrency.balance) : 0;
  };

  const handleWithdraw = async () => {
    const availableBalance = getAvailableBalance();

    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un montant valide');
      return;
    }

    if (parseFloat(amount) > availableBalance) {
      Alert.alert('Erreur', 'Solde insuffisant');
      return;
    }

    if (!paymentMethod) {
      Alert.alert('Erreur', 'Veuillez sélectionner un mode de retrait');
      return;
    }

    Alert.alert(
      'Confirmer le retrait',
      `Voulez-vous retirer ${parseFloat(amount).toLocaleString('fr-FR')} ${currency} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            setLoading(true);
            try {
              const response = await apiService.post('/api/buyer/wallet/withdraw', {
                amount: parseFloat(amount),
                currency,
                paymentMethod,
              });

              if (response.success) {
                Alert.alert(
                  'Succès',
                  'Demande de retrait effectuée. Le traitement peut prendre 24-48h.',
                  [
                    {
                      text: 'OK',
                      onPress: () => router.back(),
                    },
                  ]
                );
              } else {
                Alert.alert('Erreur', response.error?.message || 'Erreur lors du retrait');
              }
            } catch (error: any) {
              Alert.alert('Erreur', error.message || 'Une erreur est survenue');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const setMaxAmount = () => {
    setAmount(getAvailableBalance().toString());
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

        {/* Amount Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Montant</ThemedText>
            <TouchableOpacity onPress={setMaxAmount}>
              <ThemedText style={styles.maxButton}>Max</ThemedText>
            </TouchableOpacity>
          </View>
          
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
                  onPress={() => {
                    setCurrency(curr);
                    setAmount('');
                  }}
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
        </View>

        {/* Payment Method Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Mode de retrait</ThemedText>
          
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.paymentMethodCard,
                paymentMethod === method.id && styles.paymentMethodCardActive,
              ]}
              onPress={() => setPaymentMethod(method.id)}
            >
              <View style={styles.paymentMethodLeft}>
                <View style={styles.paymentMethodIcon}>
                  <IconSymbol name={method.icon} size={24} color="#624cacff" />
                </View>
                <ThemedText style={styles.paymentMethodName}>{method.name}</ThemedText>
              </View>
              {paymentMethod === method.id && (
                <IconSymbol name="checkmark.circle.fill" size={24} color="#624cacff" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <IconSymbol name="info.circle.fill" size={20} color="#624cacff" />
          <ThemedText style={styles.infoText}>
            Les retraits sont traités sous 24-48h. Assurez-vous que vos informations de paiement sont à jour.
          </ThemedText>
        </View>

        {/* Withdraw Button */}
        <TouchableOpacity
          style={[
            styles.withdrawButton,
            (loading || parseFloat(amount) > getAvailableBalance()) && styles.withdrawButtonDisabled,
          ]}
          onPress={handleWithdraw}
          disabled={loading || parseFloat(amount) > getAvailableBalance()}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <ThemedText style={styles.withdrawButtonText}>
              Retirer {amount ? `${parseFloat(amount).toLocaleString('fr-FR')} ${currency}` : ''}
            </ThemedText>
          )}
        </TouchableOpacity>
      </ScrollView>
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



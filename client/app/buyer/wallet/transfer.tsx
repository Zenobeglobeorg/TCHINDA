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

export default function TransferScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState<any>(null);
  const [fromCurrency, setFromCurrency] = useState('XOF');
  const [toCurrency, setToCurrency] = useState('EUR');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    try {
      const response = await apiService.get('/api/buyer/wallet');
      if (response.success) {
        setWallet(response.data);
        if (response.data?.walletCurrencies?.length > 0) {
          setFromCurrency(response.data.walletCurrencies[0].currency);
          // Set toCurrency to a different currency if available
          if (response.data.walletCurrencies.length > 1) {
            setToCurrency(response.data.walletCurrencies[1].currency);
          }
        }
      }
    } catch (error) {
      console.error('Error loading wallet:', error);
    }
  };

  const currencies = wallet?.walletCurrencies?.map((wc: any) => wc.currency) || ['XOF'];
  const availableCurrencies = ['XOF', 'XAF', 'EUR', 'USD', 'GBP'];

  const getAvailableBalance = (currency: string) => {
    if (!wallet?.walletCurrencies) return 0;
    const walletCurrency = wallet.walletCurrencies.find((wc: any) => wc.currency === currency);
    return walletCurrency ? parseFloat(walletCurrency.balance) : 0;
  };

  // Simple exchange rate (in production, use real-time rates)
  const getExchangeRate = (from: string, to: string) => {
    // Example rates (should be fetched from API in production)
    const rates: { [key: string]: number } = {
      'XOF-EUR': 0.0015,
      'EUR-XOF': 655.957,
      'XOF-USD': 0.0017,
      'USD-XOF': 588.235,
      'XOF-XAF': 1,
      'XAF-XOF': 1,
    };
    return rates[`${from}-${to}`] || 1;
  };

  const calculateConvertedAmount = () => {
    if (!amount || parseFloat(amount) <= 0) return 0;
    const rate = getExchangeRate(fromCurrency, toCurrency);
    return parseFloat(amount) * rate;
  };

  const handleTransfer = async () => {
    const availableBalance = getAvailableBalance(fromCurrency);

    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un montant valide');
      return;
    }

    if (parseFloat(amount) > availableBalance) {
      Alert.alert('Erreur', 'Solde insuffisant');
      return;
    }

    if (fromCurrency === toCurrency) {
      Alert.alert('Erreur', 'Veuillez sélectionner des devises différentes');
      return;
    }

    const convertedAmount = calculateConvertedAmount();

    Alert.alert(
      'Confirmer le transfert',
      `Voulez-vous transférer ${parseFloat(amount).toLocaleString('fr-FR')} ${fromCurrency} vers ${convertedAmount.toLocaleString('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} ${toCurrency} ?\n\nTaux de change: 1 ${fromCurrency} = ${getExchangeRate(fromCurrency, toCurrency).toFixed(4)} ${toCurrency}`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            setLoading(true);
            try {
              const response = await apiService.post('/api/buyer/wallet/transfer', {
                fromCurrency,
                toCurrency,
                amount: parseFloat(amount),
              });

              if (response.success) {
                Alert.alert(
                  'Succès',
                  'Transfert effectué avec succès',
                  [
                    {
                      text: 'OK',
                      onPress: () => router.back(),
                    },
                  ]
                );
              } else {
                Alert.alert('Erreur', response.error?.message || 'Erreur lors du transfert');
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
    setAmount(getAvailableBalance(fromCurrency).toString());
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.right" size={24} color="#333" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Transférer entre devises</ThemedText>
          <View style={{ width: 40 }} />
        </View>

        {/* From Currency */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>De</ThemedText>
          
          <View style={styles.currencyCard}>
            <View style={styles.currencyHeader}>
              <ThemedText style={styles.currencyLabel}>Solde disponible</ThemedText>
              <TouchableOpacity onPress={setMaxAmount}>
                <ThemedText style={styles.maxButton}>Max</ThemedText>
              </TouchableOpacity>
            </View>
            <ThemedText style={styles.currencyBalance}>
              {getAvailableBalance(fromCurrency).toLocaleString('fr-FR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{' '}
              {fromCurrency}
            </ThemedText>
            
            <View style={styles.currencySelector}>
              {currencies.map((curr) => (
                <TouchableOpacity
                  key={curr}
                  style={[
                    styles.currencyButton,
                    fromCurrency === curr && styles.currencyButtonActive,
                  ]}
                  onPress={() => {
                    setFromCurrency(curr);
                    setAmount('');
                  }}
                >
                  <ThemedText
                    style={[
                      styles.currencyButtonText,
                      fromCurrency === curr && styles.currencyButtonTextActive,
                    ]}
                  >
                    {curr}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.amountInputContainer}>
              <TextInput
                style={styles.amountInput}
                placeholder="0"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Exchange Icon */}
        <View style={styles.exchangeIcon}>
          <IconSymbol name="arrow.left.arrow.right" size={32} color="#624cacff" />
        </View>

        {/* To Currency */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Vers</ThemedText>
          
          <View style={styles.currencyCard}>
            <ThemedText style={styles.currencyLabel}>Vous recevrez</ThemedText>
            <ThemedText style={styles.currencyBalance}>
              {calculateConvertedAmount().toLocaleString('fr-FR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{' '}
              {toCurrency}
            </ThemedText>
            
            <View style={styles.currencySelector}>
              {availableCurrencies
                .filter((curr) => curr !== fromCurrency)
                .map((curr) => (
                  <TouchableOpacity
                    key={curr}
                    style={[
                      styles.currencyButton,
                      toCurrency === curr && styles.currencyButtonActive,
                    ]}
                    onPress={() => setToCurrency(curr)}
                  >
                    <ThemedText
                      style={[
                        styles.currencyButtonText,
                        toCurrency === curr && styles.currencyButtonTextActive,
                      ]}
                    >
                      {curr}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
            </View>
          </View>
        </View>

        {/* Exchange Rate Info */}
        <View style={styles.infoCard}>
          <IconSymbol name="info.circle.fill" size={20} color="#624cacff" />
          <View style={styles.infoContent}>
            <ThemedText style={styles.infoTitle}>Taux de change</ThemedText>
            <ThemedText style={styles.infoText}>
              1 {fromCurrency} = {getExchangeRate(fromCurrency, toCurrency).toFixed(4)} {toCurrency}
            </ThemedText>
            <ThemedText style={styles.infoNote}>
              Les taux de change sont indicatifs et peuvent varier
            </ThemedText>
          </View>
        </View>

        {/* Transfer Button */}
        <TouchableOpacity
          style={[
            styles.transferButton,
            (loading || parseFloat(amount) > getAvailableBalance(fromCurrency) || fromCurrency === toCurrency) &&
              styles.transferButtonDisabled,
          ]}
          onPress={handleTransfer}
          disabled={
            loading ||
            parseFloat(amount) > getAvailableBalance(fromCurrency) ||
            fromCurrency === toCurrency
          }
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <ThemedText style={styles.transferButtonText}>Transférer</ThemedText>
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
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  currencyCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 20,
  },
  currencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  currencyLabel: {
    fontSize: 14,
    color: '#666',
  },
  maxButton: {
    fontSize: 14,
    color: '#624cacff',
    fontWeight: '600',
  },
  currencyBalance: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  currencySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
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
  amountInputContainer: {
    marginTop: 8,
  },
  amountInput: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
  },
  exchangeIcon: {
    alignItems: 'center',
    marginVertical: 20,
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
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  infoText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#624cacff',
    marginBottom: 4,
  },
  infoNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  transferButton: {
    backgroundColor: '#624cacff',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 40,
  },
  transferButtonDisabled: {
    opacity: 0.6,
  },
  transferButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});



import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/hooks/useAuth';
import { apiService } from '@/services/api.service';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';

export default function WalletScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState('XOF');

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      const [walletRes, transactionsRes] = await Promise.all([
        apiService.get('/api/buyer/wallet'),
        apiService.get('/api/buyer/wallet/transactions'),
      ]);

      if (walletRes.success) {
        setWallet(walletRes.data);
        if (walletRes.data?.walletCurrencies?.length > 0) {
          setSelectedCurrency(walletRes.data.walletCurrencies[0].currency);
        }
      }

      if (transactionsRes.success) {
        setTransactions(transactionsRes.data || []);
      }
    } catch (error) {
      console.error('Error loading wallet:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWalletData();
  };

  const getCurrencySymbol = (currency: string) => {
    const symbols: { [key: string]: string } = {
      XOF: 'CFA',
      XAF: 'CFA',
      EUR: '€',
      USD: '$',
      GBP: '£',
    };
    return symbols[currency] || currency;
  };

  const formatAmount = (amount: number, currency: string) => {
    return `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${getCurrencySymbol(currency)}`;
  };

  const getTransactionIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      DEPOSIT: 'arrow.down.circle.fill',
      WITHDRAWAL: 'arrow.up.circle.fill',
      PAYMENT: 'creditcard.fill',
      REFUND: 'arrow.counterclockwise.circle.fill',
      COMMISSION: 'percent',
    };
    return icons[type] || 'circle.fill';
  };

  const getTransactionColor = (type: string) => {
    const colors: { [key: string]: string } = {
      DEPOSIT: '#28A745',
      WITHDRAWAL: '#DC3545',
      PAYMENT: '#624cacff',
      REFUND: '#17A2B8',
      COMMISSION: '#FFC107',
    };
    return colors[type] || '#666';
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  const currentBalance = wallet?.walletCurrencies?.find(
    (wc: any) => wc.currency === selectedCurrency
  )?.balance || wallet?.balance || 0;

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={styles.title}>Mon Portefeuille</ThemedText>
          <TouchableOpacity onPress={() => router.push('/buyer/subscription')}>
            <View style={styles.subscriptionBadge}>
              <IconSymbol name="star.fill" size={16} color="#FFD700" />
              <ThemedText style={styles.subscriptionText}>
                {user?.subscriptionType === 'GOLD' ? 'GOLD' : user?.subscriptionType === 'DIAMOND' ? 'DIAMOND' : 'FREE'}
              </ThemedText>
            </View>
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <ThemedText style={styles.balanceLabel}>Solde disponible</ThemedText>
          <ThemedText style={styles.balanceAmount}>
            {formatAmount(parseFloat(currentBalance), selectedCurrency)}
          </ThemedText>
          
          {/* Currency Selector */}
          {wallet?.walletCurrencies && wallet.walletCurrencies.length > 1 && (
            <View style={styles.currencySelector}>
              {wallet.walletCurrencies.map((wc: any) => (
                <TouchableOpacity
                  key={wc.currency}
                  style={[
                    styles.currencyButton,
                    selectedCurrency === wc.currency && styles.currencyButtonActive,
                  ]}
                  onPress={() => setSelectedCurrency(wc.currency)}
                >
                  <ThemedText
                    style={[
                      styles.currencyButtonText,
                      selectedCurrency === wc.currency && styles.currencyButtonTextActive,
                    ]}
                  >
                    {wc.currency}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* All Balances */}
          {wallet?.walletCurrencies && wallet.walletCurrencies.length > 0 && (
            <View style={styles.allBalances}>
              {wallet.walletCurrencies.map((wc: any) => (
                <View key={wc.currency} style={styles.balanceItem}>
                  <ThemedText style={styles.balanceItemCurrency}>{wc.currency}</ThemedText>
                  <ThemedText style={styles.balanceItemAmount}>
                    {formatAmount(parseFloat(wc.balance), wc.currency)}
                  </ThemedText>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/buyer/wallet/deposit')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#28A745' }]}>
              <IconSymbol name="plus" size={24} color="#FFF" />
            </View>
            <ThemedText style={styles.actionText}>Déposer</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/buyer/wallet/withdraw')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#DC3545' }]}>
              <IconSymbol name="minus" size={24} color="#FFF" />
            </View>
            <ThemedText style={styles.actionText}>Retirer</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/buyer/wallet/transfer')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#624cacff' }]}>
              <IconSymbol name="arrow.left.arrow.right" size={24} color="#FFF" />
            </View>
            <ThemedText style={styles.actionText}>Transférer</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Wallet Limit Info */}
        {wallet?.limit && (
          <View style={styles.limitCard}>
            <View style={styles.limitHeader}>
              <IconSymbol name="info.circle.fill" size={20} color="#624cacff" />
              <ThemedText style={styles.limitTitle}>Limite du portefeuille</ThemedText>
            </View>
            <ThemedText style={styles.limitText}>
              {user?.verificationStatus === 'VERIFIED'
                ? 'Compte vérifié - Limite élevée'
                : 'Compte non vérifié - Limite réduite'}
            </ThemedText>
            <ThemedText style={styles.limitAmount}>
              Limite: {formatAmount(parseFloat(wallet.limit), wallet.currency)}
            </ThemedText>
            {user?.verificationStatus !== 'VERIFIED' && (
              <TouchableOpacity
                style={styles.verifyButton}
                onPress={() => router.push('/buyer/verification')}
              >
                <ThemedText style={styles.verifyButtonText}>Vérifier mon compte</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Historique des transactions</ThemedText>
            <TouchableOpacity onPress={() => router.push('/buyer/wallet/transactions')}>
              <ThemedText style={styles.seeAll}>Voir tout</ThemedText>
            </TouchableOpacity>
          </View>

          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol name="tray" size={48} color="#CCC" />
              <ThemedText style={styles.emptyText}>Aucune transaction</ThemedText>
            </View>
          ) : (
            transactions.slice(0, 10).map((transaction) => (
              <View key={transaction.id} style={styles.transactionCard}>
                <View style={styles.transactionLeft}>
                  <View
                    style={[
                      styles.transactionIcon,
                      { backgroundColor: getTransactionColor(transaction.type) + '20' },
                    ]}
                  >
                    <IconSymbol
                      name={getTransactionIcon(transaction.type)}
                      size={24}
                      color={getTransactionColor(transaction.type)}
                    />
                  </View>
                  <View style={styles.transactionInfo}>
                    <ThemedText style={styles.transactionType}>
                      {transaction.type === 'DEPOSIT' && 'Dépôt'}
                      {transaction.type === 'WITHDRAWAL' && 'Retrait'}
                      {transaction.type === 'PAYMENT' && 'Paiement'}
                      {transaction.type === 'REFUND' && 'Remboursement'}
                      {transaction.type === 'COMMISSION' && 'Commission'}
                    </ThemedText>
                    <ThemedText style={styles.transactionDate}>
                      {new Date(transaction.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.transactionRight}>
                  <ThemedText
                    style={[
                      styles.transactionAmount,
                      {
                        color:
                          transaction.type === 'DEPOSIT' || transaction.type === 'REFUND'
                            ? '#28A745'
                            : '#DC3545',
                      },
                    ]}
                  >
                    {transaction.type === 'DEPOSIT' || transaction.type === 'REFUND' ? '+' : '-'}
                    {formatAmount(parseFloat(transaction.amount), transaction.currency)}
                  </ThemedText>
                  <View
                    style={[
                      styles.statusBadge,
                      transaction.status === 'COMPLETED' && styles.statusBadgeSuccess,
                      transaction.status === 'PENDING' && styles.statusBadgePending,
                      transaction.status === 'FAILED' && styles.statusBadgeFailed,
                    ]}
                  >
                    <ThemedText style={styles.statusText}>
                      {transaction.status === 'COMPLETED' && 'Terminé'}
                      {transaction.status === 'PENDING' && 'En attente'}
                      {transaction.status === 'FAILED' && 'Échoué'}
                    </ThemedText>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subscriptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#624cacff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  subscriptionText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  balanceCard: {
    backgroundColor: '#624cacff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
  },
  balanceLabel: {
    color: '#FFF',
    fontSize: 14,
    opacity: 0.9,
    marginBottom: 8,
  },
  balanceAmount: {
    color: '#FFF',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  currencySelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  currencyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  currencyButtonActive: {
    backgroundColor: '#FFF',
  },
  currencyButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  currencyButtonTextActive: {
    color: '#624cacff',
  },
  allBalances: {
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  balanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  balanceItemCurrency: {
    color: '#FFF',
    fontSize: 14,
    opacity: 0.9,
  },
  balanceItemAmount: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  limitCard: {
    backgroundColor: '#F0F7FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#624cacff',
  },
  limitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  limitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#624cacff',
  },
  limitText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  limitAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  verifyButton: {
    backgroundColor: '#624cacff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  verifyButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  seeAll: {
    fontSize: 14,
    color: '#624cacff',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
  },
  statusBadgeSuccess: {
    backgroundColor: '#D4EDDA',
  },
  statusBadgePending: {
    backgroundColor: '#FFF3CD',
  },
  statusBadgeFailed: {
    backgroundColor: '#F8D7DA',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#333',
  },
});



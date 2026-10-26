import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Modal,
  TextInput,
  Platform,
  StatusBar,
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { apiService } from '@/services/api.service';
import { useRouter, useFocusEffect } from 'expo-router';
import { useThemeColor } from '@/hooks/useThemeColor';
import PaymentMethodModal, { PaymentMethod } from '@/components/PaymentMethodModal';
import PaymentInfoForm from '@/components/PaymentInfoForm';
import WithdrawConfirmationForm from '@/components/WithdrawConfirmationForm';
import { alert } from '@/utils/alert';
import { WITHDRAWALS_AVAILABLE, WITHDRAWALS_UNAVAILABLE_TITLE, WITHDRAWALS_UNAVAILABLE_MESSAGE } from '@/constants/Features';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { LoadingView } from '@/components/ui/LoadingView';

interface Wallet {
  id: string;
  balance: number;
  currency: string;
  limit?: number;
  walletCurrencies?: Array<{
    currency: string;
    balance: number;
    pendingBalance?: number;
  }>;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  description?: string;
  createdAt: string;
  paymentMethod?: string;
}

export default function SellerWallet() {
  const router = useRouter();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const mainCurrency = wallet?.walletCurrencies?.find((wc) => wc.currency === (wallet?.currency || 'XOF'));
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'currencies'>('overview');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  useFocusEffect(
    React.useCallback(() => {
      loadWallet();
      loadTransactions();
    }, [])
  );

  const loadWallet = async () => {
    try {
      const response = await apiService.get('/api/buyer/wallet');
      if (response.success && response.data) {
        setWallet(response.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du portefeuille:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const response = await apiService.get('/api/buyer/wallet/transactions');
      if (response.success && response.data) {
        setTransactions(response.data.transactions || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des transactions:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadWallet();
    loadTransactions();
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
        return 'Dépôt';
      case 'WITHDRAWAL':
        return 'Retrait';
      case 'PAYMENT':
        return 'Paiement';
      case 'REFUND':
        return 'Remboursement';
      case 'COMMISSION':
        return 'Commission';
      case 'SALE':
        return 'Vente';
      default:
        return type;
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
      case 'SALE':
      case 'REFUND':
        return '#4CAF50';
      case 'WITHDRAWAL':
      case 'PAYMENT':
        return '#F44336';
      case 'COMMISSION':
        return '#FF9800';
      default:
        return textColor;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return '#4CAF50';
      case 'PENDING':
        return '#FF9800';
      case 'FAILED':
        return '#F44336';
      case 'CANCELLED':
        return '#9E9E9E';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'Terminé';
      case 'PENDING':
        return 'En attente';
      case 'FAILED':
        return 'Échoué';
      case 'CANCELLED':
        return 'Annulé';
      default:
        return status;
    }
  };

  if (loading && !wallet) {
    return (
      <ThemedView style={styles.container}>
        <LoadingView message="Chargement du portefeuille..." />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <StatusBar barStyle="light-content" />
      {/* Header avec onglets */}
      <View style={[styles.header, { backgroundColor, paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 10 }]}>
        <ThemedText type="title">Portefeuille</ThemedText>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'overview' && { backgroundColor: tintColor }]}
            onPress={() => setActiveTab('overview')}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'overview' ? '#FFFFFF' : textColor },
              ]}
            >
              Vue d'ensemble
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'transactions' && { backgroundColor: tintColor }]}
            onPress={() => setActiveTab('transactions')}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'transactions' ? '#FFFFFF' : textColor },
              ]}
            >
              Transactions
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'currencies' && { backgroundColor: tintColor }]}
            onPress={() => setActiveTab('currencies')}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'currencies' ? '#FFFFFF' : textColor },
              ]}
            >
              Devises
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'overview' && (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Solde principal */}
          <View style={[styles.balanceCard, { backgroundColor }]}>
            <Text style={[styles.balanceLabel, { color: textColor }]}>Solde disponible</Text>
            <Text style={[styles.balanceAmount, { color: tintColor }]}>
              {mainCurrency ? Number(mainCurrency.balance).toLocaleString() : wallet?.balance?.toLocaleString() || 0}{' '}
              {wallet?.currency || 'XOF'}
            </Text>
            {Number(mainCurrency?.pendingBalance || 0) > 0 && (
              <Text style={[styles.balanceLimit, { color: textColor }]}>
                En séquestre : {Number(mainCurrency?.pendingBalance).toLocaleString()} {wallet?.currency || 'XOF'}
                {' '}(libéré à la confirmation de livraison)
              </Text>
            )}
            {wallet?.limit && (
              <Text style={[styles.balanceLimit, { color: textColor }]}>
                Limite: {wallet.limit.toLocaleString()} {wallet.currency}
              </Text>
            )}
          </View>

          {/* Actions rapides */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: tintColor }]}
              onPress={() => router.push('/buyer/wallet/deposit')}
            >
              <Text style={styles.actionButtonText}>Déposer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#F44336' }]}
              onPress={() => setShowWithdrawModal(true)}
            >
              <Text style={styles.actionButtonText}>Retirer</Text>
            </TouchableOpacity>
          </View>

          {/* Statistiques */}
          <View style={[styles.statsSection, { backgroundColor }]}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Statistiques
            </ThemedText>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={[styles.statLabel, { color: textColor }]}>Total reçu</Text>
                <Text style={[styles.statValue, { color: '#4CAF50' }]}>
                  {transactions
                    .filter((t) => ['DEPOSIT', 'SALE', 'REFUND'].includes(t.type) && t.status === 'COMPLETED')
                    .reduce((sum, t) => sum + Number(t.amount), 0)
                    .toLocaleString()}{' '}
                  {wallet?.currency || 'XOF'}
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statLabel, { color: textColor }]}>Total retiré</Text>
                <Text style={[styles.statValue, { color: '#F44336' }]}>
                  {transactions
                    .filter((t) => ['WITHDRAWAL', 'PAYMENT'].includes(t.type) && t.status === 'COMPLETED')
                    .reduce((sum, t) => sum + Number(t.amount), 0)
                    .toLocaleString()}{' '}
                  {wallet?.currency || 'XOF'}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      {activeTab === 'transactions' && (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <View style={[styles.transactionCard, { backgroundColor }]}>
              <View style={styles.transactionHeader}>
                <View>
                  <Text style={[styles.transactionType, { color: getTransactionTypeColor(item.type) }]}>
                    {getTransactionTypeLabel(item.type)}
                  </Text>
                  {item.description && (
                    <Text style={[styles.transactionDescription, { color: textColor }]}>
                      {item.description}
                    </Text>
                  )}
                  <Text style={[styles.transactionDate, { color: textColor }]}>
                    {new Date(item.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                <View style={styles.transactionAmount}>
                  <Text
                    style={[
                      styles.transactionAmountText,
                      {
                        color: ['DEPOSIT', 'SALE', 'REFUND'].includes(item.type)
                          ? '#4CAF50'
                          : '#F44336',
                      },
                    ]}
                  >
                    {['DEPOSIT', 'SALE', 'REFUND'].includes(item.type) ? '+' : '-'}
                    {item.amount.toLocaleString()} {item.currency}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(item.status) + '20' },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                      {getStatusLabel(item.status)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: textColor }]}>
                Aucune transaction trouvée
              </Text>
            </View>
          }
        />
      )}

      {activeTab === 'currencies' && (
        <ScrollView style={styles.content}>
          <View style={[styles.currenciesSection, { backgroundColor }]}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Multi-devises
            </ThemedText>
            {wallet?.walletCurrencies && wallet.walletCurrencies.length > 0 ? (
              wallet.walletCurrencies.map((wc) => (
                <View key={wc.currency} style={[styles.currencyCard, { backgroundColor }]}>
                  <Text style={[styles.currencyCode, { color: tintColor }]}>{wc.currency}</Text>
                  <Text style={[styles.currencyBalance, { color: textColor }]}>
                    {wc.balance.toLocaleString()}
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: textColor }]}>
                  Aucune autre devise configurée
                </Text>
                <Text style={[styles.emptySubtext, { color: textColor }]}>
                  Votre solde principal est en {wallet?.currency || 'XOF'}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* Modal de retrait */}
      {showWithdrawModal && (
        <WithdrawModal
          visible={showWithdrawModal}
          wallet={wallet}
          onClose={() => setShowWithdrawModal(false)}
          onSuccess={() => {
            setShowWithdrawModal(false);
            loadWallet();
            loadTransactions();
          }}
        />
      )}
    </ThemedView>
  );
}

// Modal de retrait
function WithdrawModal({
  visible,
  wallet,
  onClose,
  onSuccess,
}: {
  visible: boolean;
  wallet: Wallet | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showWithdrawConfirmation, setShowWithdrawConfirmation] = useState(false);
  const [currency, setCurrency] = useState(wallet?.currency || 'XOF');

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  // Calculer le solde disponible
  const getAvailableBalance = () => {
    if (!wallet) return 0;
    if (wallet.walletCurrencies && wallet.walletCurrencies.length > 0) {
      const walletCurrency = wallet.walletCurrencies.find((wc: any) => wc.currency === currency);
      return walletCurrency ? parseFloat(walletCurrency.balance) : 0;
    }
    return parseFloat(wallet.balance) || 0;
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
              onPress: () => {
                onSuccess();
                onClose();
              },
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
    if (!WITHDRAWALS_AVAILABLE) {
      alert(WITHDRAWALS_UNAVAILABLE_TITLE, WITHDRAWALS_UNAVAILABLE_MESSAGE);
      return;
    }
    // Ouvrir directement le modal de sélection de méthode de paiement
    setShowPaymentModal(true);
  };

  // Quand le modal s'ouvre, réinitialiser les états
  React.useEffect(() => {
    if (visible) {
      setPaymentMethod(null);
      setShowPaymentModal(false);
      setShowWithdrawConfirmation(false);
      if (wallet?.walletCurrencies && wallet.walletCurrencies.length > 0) {
        setCurrency(wallet.walletCurrencies[0].currency);
      } else {
        setCurrency(wallet?.currency || 'XOF');
      }
    }
  }, [visible, wallet]);

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor }]}>
            <ThemedText type="title" style={styles.modalTitle}>
              Retirer des fonds
            </ThemedText>

            {/* Balance Info */}
            <View style={[styles.balanceInfoCard, { backgroundColor: tintColor + '20' }]}>
              <Text style={[styles.balanceInfoLabel, { color: textColor + '80' }]}>
                Solde disponible
              </Text>
              <Text style={[styles.balanceInfoAmount, { color: tintColor }]}>
                {getAvailableBalance().toLocaleString('fr-FR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                {currency}
              </Text>
            </View>

            {/* Info */}
            <View style={[styles.infoCard, { backgroundColor: tintColor + '10' }]}>
              <IconSymbol name="info.circle.fill" size={20} color={tintColor} />
              <Text style={[styles.infoText, { color: textColor }]}>
                Sélectionnez un mode de retrait, puis entrez le montant et confirmez avec votre mot de passe.
              </Text>
            </View>

            {!WITHDRAWALS_AVAILABLE && (
              <View style={{ backgroundColor: '#FFF4E5', borderRadius: 12, padding: 14, marginBottom: 12 }}>
                <Text style={{ fontWeight: 'bold', color: '#B26A00', marginBottom: 4 }}>{WITHDRAWALS_UNAVAILABLE_TITLE}</Text>
                <Text style={{ color: '#7A5200', lineHeight: 20 }}>{WITHDRAWALS_UNAVAILABLE_MESSAGE}</Text>
              </View>
            )}

            {/* Withdraw Button */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#9E9E9E' }]}
                onPress={onClose}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#F44336' }]}
                onPress={handleWithdraw}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalButtonText}>Choisir un mode de retrait</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 10 : 10,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    marginTop: 15,
    gap: 10,
  },
  tab: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  balanceCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    marginBottom: 10,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  balanceLimit: {
    fontSize: 12,
    opacity: 0.7,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statsSection: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 8,
    opacity: 0.7,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  transactionCard: {
    padding: 15,
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  transactionType: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  transactionDescription: {
    fontSize: 14,
    marginBottom: 5,
  },
  transactionDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionAmountText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  currenciesSection: {
    padding: 15,
    borderRadius: 12,
  },
  currencyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  currencyCode: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  currencyBalance: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  balanceInfoCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  balanceInfoLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  balanceInfoAmount: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  currencySelector: {
    flexDirection: 'row',
    gap: 10,
  },
  currencyButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  currencyButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});


import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';
import { apiService } from '@/services/api.service';
import { alert } from '@/utils/alert';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  accountType: string;
  wallet?: {
    balance: string;
    currency: string;
  };
}

interface Stats {
  totalTransactions: number;
  totalDeposits: number;
  totalWithdrawals: number;
  depositsCount: number;
  withdrawalsCount: number;
}

export default function CommercialDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('XOF');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [description, setDescription] = useState('');
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  useEffect(() => {
    loadStats();
  }, [period]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await apiService.get(`/api/commercial/stats?period=${period}`);
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error: any) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const searchUsers = async () => {
    if (searchQuery.length < 2) {
      alert('Erreur', 'Veuillez saisir au moins 2 caractères');
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.get(`/api/commercial/users/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.success && response.data) {
        setSearchResults(response.data);
        setShowSearchModal(true);
      }
    } catch (error: any) {
      alert('Erreur', error.message || 'Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!selectedUser || !amount) {
      alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.post('/api/commercial/deposit', {
        userId: selectedUser.id,
        amount: parseFloat(amount),
        currency,
        paymentMethod,
        description,
      });

      if (response.success) {
        alert('Succès', 'Dépôt effectué avec succès');
        setShowDepositModal(false);
        setAmount('');
        setDescription('');
        setSelectedUser(null);
        loadStats();
      } else {
        alert('Erreur', response.error?.message || 'Erreur lors du dépôt');
      }
    } catch (error: any) {
      alert('Erreur', error.message || 'Erreur lors du dépôt');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!selectedUser || !amount) {
      alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.post('/api/commercial/withdraw', {
        userId: selectedUser.id,
        amount: parseFloat(amount),
        currency,
        paymentMethod,
        description,
      });

      if (response.success) {
        alert('Succès', 'Retrait effectué avec succès');
        setShowWithdrawModal(false);
        setAmount('');
        setDescription('');
        setSelectedUser(null);
        loadStats();
      } else {
        alert('Erreur', response.error?.message || 'Erreur lors du retrait');
      }
    } catch (error: any) {
      alert('Erreur', error.message || 'Erreur lors du retrait');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { backgroundColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.right" size={24} color={textColor} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: textColor }]}>
          Dashboard Commercial
        </ThemedText>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor }]}>
        <View style={[styles.searchBar, { backgroundColor: backgroundColor }]}>
          <IconSymbol name="magnifyingglass" size={20} color={textColor + '60'} />
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder="Rechercher un utilisateur..."
            placeholderTextColor={textColor + '60'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={searchUsers}
          />
          <TouchableOpacity onPress={searchUsers} style={styles.searchButton}>
            <ThemedText style={[styles.searchButtonText, { color: tintColor }]}>Rechercher</ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Cards */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {stats && (
          <>
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor }]}>
                <ThemedText style={[styles.statValue, { color: tintColor }]}>
                  {stats.totalTransactions}
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: textColor + '80' }]}>
                  Transactions
                </ThemedText>
              </View>
              <View style={[styles.statCard, { backgroundColor }]}>
                <ThemedText style={[styles.statValue, { color: '#4CAF50' }]}>
                  {stats.totalDeposits.toLocaleString()} {currency}
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: textColor + '80' }]}>
                  Dépôts ({stats.depositsCount})
                </ThemedText>
              </View>
            </View>
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor }]}>
                <ThemedText style={[styles.statValue, { color: '#FF9800' }]}>
                  {stats.totalWithdrawals.toLocaleString()} {currency}
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: textColor + '80' }]}>
                  Retraits ({stats.withdrawalsCount})
                </ThemedText>
              </View>
              <View style={[styles.statCard, { backgroundColor }]}>
                <ThemedText style={[styles.statValue, { color: tintColor }]}>
                  {(stats.totalDeposits - stats.totalWithdrawals).toLocaleString()} {currency}
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: textColor + '80' }]}>
                  Solde net
                </ThemedText>
              </View>
            </View>
          </>
        )}

        {/* Period Selector */}
        <View style={[styles.periodSelector, { backgroundColor }]}>
          {(['today', 'week', 'month'] as const).map((p) => (
            <TouchableOpacity
              key={p}
              style={[
                styles.periodButton,
                period === p && [styles.periodButtonActive, { backgroundColor: tintColor }],
              ]}
              onPress={() => setPeriod(p)}
            >
              <ThemedText
                style={[
                  styles.periodButtonText,
                  { color: period === p ? '#FFF' : textColor },
                ]}
              >
                {p === 'today' ? "Aujourd'hui" : p === 'week' ? 'Semaine' : 'Mois'}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Search Results Modal */}
      <Modal visible={showSearchModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: textColor }]}>
                Résultats de recherche
              </ThemedText>
              <TouchableOpacity onPress={() => setShowSearchModal(false)}>
                <IconSymbol name="xmark.circle.fill" size={28} color={textColor} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {searchResults.length === 0 ? (
                <ThemedText style={[styles.emptyText, { color: textColor + '60' }]}>
                  Aucun utilisateur trouvé
                </ThemedText>
              ) : (
                searchResults.map((user) => (
                  <TouchableOpacity
                    key={user.id}
                    style={[styles.userItem, { backgroundColor: backgroundColor }]}
                    onPress={() => {
                      setSelectedUser(user);
                      setShowSearchModal(false);
                    }}
                  >
                    <View style={styles.userInfo}>
                      <ThemedText style={[styles.userName, { color: textColor }]}>
                        {user.firstName} {user.lastName}
                      </ThemedText>
                      <ThemedText style={[styles.userEmail, { color: textColor + '80' }]}>
                        {user.email}
                      </ThemedText>
                      {user.wallet && (
                        <ThemedText style={[styles.userBalance, { color: tintColor }]}>
                          Solde: {user.wallet.balance} {user.wallet.currency}
                        </ThemedText>
                      )}
                    </View>
                    <IconSymbol name="chevron.right" size={20} color={textColor + '60'} />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Deposit Modal */}
      <Modal visible={showDepositModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: textColor }]}>
                Effectuer un dépôt
              </ThemedText>
              <TouchableOpacity onPress={() => setShowDepositModal(false)}>
                <IconSymbol name="xmark.circle.fill" size={28} color={textColor} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {selectedUser && (
                <View style={styles.selectedUserInfo}>
                  <ThemedText style={[styles.selectedUserName, { color: textColor }]}>
                    {selectedUser.firstName} {selectedUser.lastName}
                  </ThemedText>
                  <ThemedText style={[styles.selectedUserEmail, { color: textColor + '80' }]}>
                    {selectedUser.email}
                  </ThemedText>
                </View>
              )}
              <View style={styles.formGroup}>
                <ThemedText style={[styles.label, { color: textColor }]}>Montant *</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor, color: textColor, borderColor: tintColor + '40' }]}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  placeholderTextColor={textColor + '60'}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.formGroup}>
                <ThemedText style={[styles.label, { color: textColor }]}>Devise</ThemedText>
                <View style={styles.currencySelector}>
                  {['XOF', 'XAF', 'EUR', 'USD'].map((curr) => (
                    <TouchableOpacity
                      key={curr}
                      style={[
                        styles.currencyButton,
                        currency === curr && [styles.currencyButtonActive, { backgroundColor: tintColor }],
                      ]}
                      onPress={() => setCurrency(curr)}
                    >
                      <ThemedText
                        style={[
                          styles.currencyButtonText,
                          { color: currency === curr ? '#FFF' : textColor },
                        ]}
                      >
                        {curr}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.formGroup}>
                <ThemedText style={[styles.label, { color: textColor }]}>Méthode de paiement</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor, color: textColor, borderColor: tintColor + '40' }]}
                  value={paymentMethod}
                  onChangeText={setPaymentMethod}
                  placeholder="Ex: Espèces, Orange Money..."
                  placeholderTextColor={textColor + '60'}
                />
              </View>
              <View style={styles.formGroup}>
                <ThemedText style={[styles.label, { color: textColor }]}>Description</ThemedText>
                <TextInput
                  style={[
                    styles.textArea,
                    { backgroundColor, color: textColor, borderColor: tintColor + '40' },
                  ]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Description optionnelle..."
                  placeholderTextColor={textColor + '60'}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#9E9E9E' }]}
                onPress={() => setShowDepositModal(false)}
              >
                <ThemedText style={styles.modalButtonText}>Annuler</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#4CAF50' }]}
                onPress={handleDeposit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <ThemedText style={styles.modalButtonText}>Confirmer</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Withdraw Modal */}
      <Modal visible={showWithdrawModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: textColor }]}>
                Effectuer un retrait
              </ThemedText>
              <TouchableOpacity onPress={() => setShowWithdrawModal(false)}>
                <IconSymbol name="xmark.circle.fill" size={28} color={textColor} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {selectedUser && (
                <View style={styles.selectedUserInfo}>
                  <ThemedText style={[styles.selectedUserName, { color: textColor }]}>
                    {selectedUser.firstName} {selectedUser.lastName}
                  </ThemedText>
                  <ThemedText style={[styles.selectedUserEmail, { color: textColor + '80' }]}>
                    {selectedUser.email}
                  </ThemedText>
                  {selectedUser.wallet && (
                    <ThemedText style={[styles.selectedUserBalance, { color: tintColor }]}>
                      Solde disponible: {selectedUser.wallet.balance} {selectedUser.wallet.currency}
                    </ThemedText>
                  )}
                </View>
              )}
              <View style={styles.formGroup}>
                <ThemedText style={[styles.label, { color: textColor }]}>Montant *</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor, color: textColor, borderColor: tintColor + '40' }]}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  placeholderTextColor={textColor + '60'}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.formGroup}>
                <ThemedText style={[styles.label, { color: textColor }]}>Devise</ThemedText>
                <View style={styles.currencySelector}>
                  {['XOF', 'XAF', 'EUR', 'USD'].map((curr) => (
                    <TouchableOpacity
                      key={curr}
                      style={[
                        styles.currencyButton,
                        currency === curr && [styles.currencyButtonActive, { backgroundColor: tintColor }],
                      ]}
                      onPress={() => setCurrency(curr)}
                    >
                      <ThemedText
                        style={[
                          styles.currencyButtonText,
                          { color: currency === curr ? '#FFF' : textColor },
                        ]}
                      >
                        {curr}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.formGroup}>
                <ThemedText style={[styles.label, { color: textColor }]}>Méthode de paiement</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor, color: textColor, borderColor: tintColor + '40' }]}
                  value={paymentMethod}
                  onChangeText={setPaymentMethod}
                  placeholder="Ex: Espèces, Orange Money..."
                  placeholderTextColor={textColor + '60'}
                />
              </View>
              <View style={styles.formGroup}>
                <ThemedText style={[styles.label, { color: textColor }]}>Description</ThemedText>
                <TextInput
                  style={[
                    styles.textArea,
                    { backgroundColor, color: textColor, borderColor: tintColor + '40' },
                  ]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Description optionnelle..."
                  placeholderTextColor={textColor + '60'}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#9E9E9E' }]}
                onPress={() => setShowWithdrawModal(false)}
              >
                <ThemedText style={styles.modalButtonText}>Annuler</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#FF9800' }]}
                onPress={handleWithdraw}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <ThemedText style={styles.modalButtonText}>Confirmer</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Action Buttons */}
      {selectedUser && (
        <View style={[styles.actionButtons, { backgroundColor }]}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
            onPress={() => setShowDepositModal(true)}
          >
            <IconSymbol name="plus.circle.fill" size={24} color="#FFF" />
            <ThemedText style={styles.actionButtonText}>Dépôt</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#FF9800' }]}
            onPress={() => setShowWithdrawModal(true)}
          >
            <IconSymbol name="minus.circle.fill" size={24} color="#FFF" />
            <ThemedText style={styles.actionButtonText}>Retrait</ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    padding: 4,
    transform: [{ rotate: '180deg' }],
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  searchContainer: {
    padding: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  searchButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  searchButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  periodSelector: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginTop: 16,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#624cacff',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalBody: {
    paddingHorizontal: 20,
    maxHeight: 400,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 4,
  },
  userBalance: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectedUserInfo: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#F5F5F5',
  },
  selectedUserName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  selectedUserEmail: {
    fontSize: 14,
    marginBottom: 4,
  },
  selectedUserBalance: {
    fontSize: 16,
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  currencySelector: {
    flexDirection: 'row',
    gap: 8,
  },
  currencyButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  currencyButtonActive: {
    borderColor: 'transparent',
  },
  currencyButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 40,
  },
  actionButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

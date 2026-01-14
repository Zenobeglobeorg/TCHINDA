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
  Switch,
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
  accountStatus: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  kycVerified: boolean;
  createdAt: string;
}

interface Verification {
  id: string;
  userId: string;
  method: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  documentType?: string;
  documentNumber?: string;
  createdAt: string;
}

export default function UserManagementScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'verifications'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationAction, setVerificationAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  
  // États pour les modals utilisateur
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    accountType: '',
    accountStatus: '',
  });
  const [createForm, setCreateForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    accountType: 'BUYER',
    country: '',
  });
  const [actionLoading, setActionLoading] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    } else {
      loadVerifications();
    }
  }, [activeTab, filterType]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await apiService.get<User[]>('/api/admin/users');

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Impossible de charger les utilisateurs');
      }

      setUsers(response.data);
    } catch (error: any) {
      console.error('Error loading users:', error);
      alert('Erreur', error.message || 'Impossible de charger les utilisateurs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadVerifications = async () => {
    try {
      setLoading(true);
      // TODO: Remplacer par l'endpoint réel /api/admin/verifications
      // const response = await apiService.get('/api/admin/verifications?status=PENDING');
      const mockVerifications: Verification[] = [
        {
          id: '1',
          userId: '1',
          method: 'KYC_IDENTITY',
          status: 'PENDING',
          documentType: 'CNI',
          documentNumber: '123456789',
          createdAt: new Date().toISOString(),
        },
      ];
      setVerifications(mockVerifications);
    } catch (error) {
      console.error('Error loading verifications:', error);
      alert('Erreur', 'Impossible de charger les vérifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'users') {
      await loadUsers();
    } else {
      await loadVerifications();
    }
  };

  const handleUserAction = async (user: User, action: string) => {
    if (action === 'view') {
      try {
        setActionLoading(true);
        const response = await apiService.get(`/api/admin/users/${user.id}`);
        if (response.success && response.data) {
          setUserDetails(response.data);
          setShowViewModal(true);
        } else {
          alert('Erreur', response.error?.message || 'Impossible de charger les détails');
        }
      } catch (error: any) {
        alert('Erreur', error.message || 'Erreur lors du chargement');
      } finally {
        setActionLoading(false);
      }
    } else if (action === 'edit') {
      setSelectedUser(user);
      setEditForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        accountType: user.accountType || '',
        accountStatus: user.accountStatus || '',
      });
      setShowEditModal(true);
    } else if (action === 'suspend' || action === 'activate') {
      setSelectedUser(user);
      setShowStatusModal(true);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      const response = await apiService.put(`/api/admin/users/${selectedUser.id}`, editForm);
      if (response.success) {
        alert('Succès', 'Utilisateur mis à jour avec succès');
        setShowEditModal(false);
        setSelectedUser(null);
        loadUsers();
      } else {
        alert('Erreur', response.error?.message || 'Erreur lors de la mise à jour');
      }
    } catch (error: any) {
      alert('Erreur', error.message || 'Erreur lors de la mise à jour');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!selectedUser) return;

    const newStatus = selectedUser.accountStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';

    try {
      setActionLoading(true);
      const response = await apiService.put(`/api/admin/users/${selectedUser.id}/status`, {
        status: newStatus,
      });
      if (response.success) {
        alert(
          'Succès',
          `Utilisateur ${newStatus === 'SUSPENDED' ? 'suspendu' : 'activé'} avec succès`
        );
        setShowStatusModal(false);
        setSelectedUser(null);
        loadUsers();
      } else {
        alert('Erreur', response.error?.message || 'Erreur lors du changement de statut');
      }
    } catch (error: any) {
      alert('Erreur', error.message || 'Erreur lors du changement de statut');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!createForm.email || !createForm.password || !createForm.accountType) {
      alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setActionLoading(true);
      const response = await apiService.post('/api/admin/users', createForm);
      if (response.success) {
        alert('Succès', 'Utilisateur créé avec succès');
        setShowCreateModal(false);
        setCreateForm({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          phone: '',
          accountType: 'BUYER',
          country: '',
        });
        loadUsers();
      } else {
        alert('Erreur', response.error?.message || 'Erreur lors de la création');
      }
    } catch (error: any) {
      alert('Erreur', error.message || 'Erreur lors de la création');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerificationAction = (verification: Verification, action: 'approve' | 'reject') => {
    setSelectedVerification(verification);
    setVerificationAction(action);
    setShowVerificationModal(true);
  };

  const confirmVerificationAction = async () => {
    if (!selectedVerification) return;

    if (verificationAction === 'reject' && !rejectionReason.trim()) {
      alert('Erreur', 'Veuillez indiquer la raison du rejet');
      return;
    }

    try {
      // TODO: Implémenter l'appel API réel
      // await apiService.post(`/api/admin/verifications/${selectedVerification.id}/${verificationAction}`, {
      //   rejectionReason: verificationAction === 'reject' ? rejectionReason : undefined,
      // });
      alert('Succès', `Vérification ${verificationAction === 'approve' ? 'approuvée' : 'rejetée'}`);
      setShowVerificationModal(false);
      setSelectedVerification(null);
      setRejectionReason('');
      loadVerifications();
    } catch (error: any) {
      alert('Erreur', error.message || 'Erreur lors de l\'action');
    }
  };

  const getAccountTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      BUYER: 'Acheteur',
      SELLER: 'Vendeur',
      ADMIN: 'Administrateur',
      MODERATOR: 'Modérateur',
      ACCOUNTANT: 'Factureur',
      DELIVERY: 'Livreur',
      COMMERCIAL: 'Commercial',
    };
    return labels[type] || type;
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      ACTIVE: '#4CAF50',
      INACTIVE: '#9E9E9E',
      SUSPENDED: '#FF9800',
      BANNED: '#F44336',
      PENDING_VERIFICATION: '#2196F3',
    };
    return colors[status] || '#666';
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = !filterType || user.accountType === filterType;
    return matchesSearch && matchesFilter;
  });

  const pendingVerifications = verifications.filter((v) => v.status === 'PENDING');

  // Écran de chargement initial
  if (loading && users.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.header, { backgroundColor }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.right" size={24} color={textColor} />
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { color: textColor }]}>
            Gestion des utilisateurs
          </ThemedText>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
          <ThemedText style={[styles.loadingText, { color: textColor }]}>
            Chargement des utilisateurs...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { backgroundColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.right" size={24} color={textColor} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: textColor }]}>
          Gestion des utilisateurs
        </ThemedText>
        <TouchableOpacity
          onPress={() => setShowCreateModal(true)}
          style={[styles.createButton, { backgroundColor: tintColor }]}
        >
          <IconSymbol name="plus.circle.fill" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'users' && [styles.tabActive, { backgroundColor: tintColor }],
          ]}
          onPress={() => setActiveTab('users')}
        >
          <ThemedText
            style={[styles.tabText, { color: activeTab === 'users' ? '#FFF' : textColor }]}
          >
            Utilisateurs
          </ThemedText>
          {pendingVerifications.length > 0 && (
            <View style={styles.badge}>
              <ThemedText style={styles.badgeText}>{pendingVerifications.length}</ThemedText>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'verifications' && [styles.tabActive, { backgroundColor: tintColor }],
          ]}
          onPress={() => setActiveTab('verifications')}
        >
          <ThemedText
            style={[
              styles.tabText,
              { color: activeTab === 'verifications' ? '#FFF' : textColor },
            ]}
          >
            Vérifications
          </ThemedText>
          {pendingVerifications.length > 0 && (
            <View style={styles.badge}>
              <ThemedText style={styles.badgeText}>{pendingVerifications.length}</ThemedText>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {activeTab === 'users' && (
        <>
          {/* Search and Filters */}
          <View style={[styles.filtersContainer, { backgroundColor }]}>
            <View style={[styles.searchContainer, { backgroundColor: backgroundColor }]}>
              <IconSymbol name="magnifyingglass" size={20} color={textColor + '60'} />
              <TextInput
                style={[styles.searchInput, { color: textColor }]}
                placeholder="Rechercher un utilisateur..."
                placeholderTextColor={textColor + '60'}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              {[
                { label: 'Tous', value: null },
                { label: 'Acheteurs', value: 'BUYER' },
                { label: 'Vendeurs', value: 'SELLER' },
                { label: 'Administrateurs', value: 'ADMIN' },
                { label: 'Commerciaux', value: 'COMMERCIAL' },
                { label: 'Livreurs', value: 'DELIVERY' },
                { label: 'Factureurs', value: 'ACCOUNTANT' },
              ].map((filter) => (
                <TouchableOpacity
                  key={filter.value || 'all'}
                  style={[
                    styles.filterButton,
                    filter.value === filterType && [
                      styles.filterButtonActive,
                      { backgroundColor: tintColor },
                    ],
                  ]}
                  onPress={() => setFilterType(filter.value)}
                >
                  <ThemedText
                    style={[
                      styles.filterButtonText,
                      { color: filter.value === filterType ? '#FFF' : textColor },
                    ]}
                  >
                    {filter.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Users List */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            {loading && users.length > 0 && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="small" color={tintColor} />
              </View>
            )}
            {filteredUsers.length === 0 && !loading ? (
              <View style={styles.emptyContainer}>
                <IconSymbol name="person.fill" size={64} color={textColor + '40'} />
                <ThemedText style={[styles.emptyText, { color: textColor + '60' }]}>
                  Aucun utilisateur trouvé
                </ThemedText>
              </View>
            ) : (
              filteredUsers.map((user) => (
              <View key={user.id} style={[styles.userCard, { backgroundColor }]}>
                <View style={styles.userInfo}>
                  <View style={[styles.avatar, { backgroundColor: tintColor }]}>
                    <ThemedText style={styles.avatarText}>
                      {user.firstName[0]}{user.lastName[0]}
                    </ThemedText>
                  </View>
                  <View style={styles.userDetails}>
                    <ThemedText style={[styles.userName, { color: textColor }]}>
                      {user.firstName} {user.lastName}
                    </ThemedText>
                    <ThemedText style={[styles.userEmail, { color: textColor + '80' }]}>
                      {user.email}
                    </ThemedText>
                    <View style={styles.userMeta}>
                      <View
                        style={[
                          styles.typeBadge,
                          { backgroundColor: tintColor + '20' },
                        ]}
                      >
                        <ThemedText style={[styles.typeText, { color: tintColor }]}>
                          {getAccountTypeLabel(user.accountType)}
                        </ThemedText>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusColor(user.accountStatus) + '20' },
                        ]}
                      >
                        <ThemedText
                          style={[
                            styles.statusText,
                            { color: getStatusColor(user.accountStatus) },
                          ]}
                        >
                          {user.accountStatus}
                        </ThemedText>
                      </View>
                    </View>
                    <View style={styles.verificationStatus}>
                      <ThemedText style={[styles.verificationText, { color: textColor + '60' }]}>
                        Email: {user.isEmailVerified ? '✓' : '✗'} • Phone: {user.isPhoneVerified ? '✓' : '✗'} • KYC: {user.kycVerified ? '✓' : '✗'}
                      </ThemedText>
                    </View>
                  </View>
                </View>
                <View style={styles.userActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: tintColor + '20' }]}
                    onPress={() => handleUserAction(user, 'view')}
                  >
                    <IconSymbol name="eye.fill" size={18} color={tintColor} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#3498DB20' }]}
                    onPress={() => handleUserAction(user, 'edit')}
                  >
                    <IconSymbol name="pencil" size={18} color="#3498DB" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      {
                        backgroundColor:
                          user.accountStatus === 'ACTIVE' ? '#FF980020' : '#4CAF5020',
                      },
                    ]}
                    onPress={() =>
                      handleUserAction(
                        user,
                        user.accountStatus === 'ACTIVE' ? 'suspend' : 'activate'
                      )
                    }
                  >
                    <IconSymbol
                      name={user.accountStatus === 'ACTIVE' ? 'pause.fill' : 'play.fill'}
                      size={18}
                      color={user.accountStatus === 'ACTIVE' ? '#FF9800' : '#4CAF50'}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ))
            )}
          </ScrollView>
        </>
      )}

      {activeTab === 'verifications' && (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {pendingVerifications.map((verification) => (
            <View key={verification.id} style={[styles.verificationCard, { backgroundColor }]}>
              <View style={styles.verificationInfo}>
                <View style={[styles.verificationIcon, { backgroundColor: '#FF980020' }]}>
                  <IconSymbol name="doc.text.fill" size={24} color="#FF9800" />
                </View>
                <View style={styles.verificationDetails}>
                  <ThemedText style={[styles.verificationTitle, { color: textColor }]}>
                    Vérification {verification.documentType || 'KYC'}
                  </ThemedText>
                  <ThemedText style={[styles.verificationSubtitle, { color: textColor + '80' }]}>
                    Utilisateur ID: {verification.userId}
                  </ThemedText>
                  {verification.documentNumber && (
                    <ThemedText style={[styles.verificationText, { color: textColor + '60' }]}>
                      Document: {verification.documentNumber}
                    </ThemedText>
                  )}
                  <ThemedText style={[styles.verificationDate, { color: textColor + '60' }]}>
                    {new Date(verification.createdAt).toLocaleDateString('fr-FR')}
                  </ThemedText>
                </View>
              </View>
              <View style={styles.verificationActions}>
                <TouchableOpacity
                  style={[styles.verifyButton, { backgroundColor: '#4CAF5020' }]}
                  onPress={() => handleVerificationAction(verification, 'approve')}
                >
                  <IconSymbol name="checkmark.circle.fill" size={20} color="#4CAF50" />
                  <ThemedText style={[styles.verifyButtonText, { color: '#4CAF50' }]}>
                    Approuver
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.verifyButton, { backgroundColor: '#F4433620' }]}
                  onPress={() => handleVerificationAction(verification, 'reject')}
                >
                  <IconSymbol name="xmark.circle.fill" size={20} color="#F44336" />
                  <ThemedText style={[styles.verifyButtonText, { color: '#F44336' }]}>
                    Rejeter
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {pendingVerifications.length === 0 && (
            <View style={styles.emptyContainer}>
              <IconSymbol name="checkmark.shield.fill" size={64} color={textColor + '40'} />
              <ThemedText style={[styles.emptyText, { color: textColor + '60' }]}>
                Aucune vérification en attente
              </ThemedText>
            </View>
          )}
        </ScrollView>
      )}

      {/* View User Modal */}
      <Modal visible={showViewModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: textColor }]}>
                Détails de l'utilisateur
              </ThemedText>
              <TouchableOpacity
                onPress={() => {
                  setShowViewModal(false);
                  setUserDetails(null);
                }}
              >
                <IconSymbol name="xmark.circle.fill" size={28} color={textColor} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {userDetails && (
                <>
                  <View style={styles.detailRow}>
                    <ThemedText style={[styles.detailLabel, { color: textColor + '80' }]}>
                      Nom complet
                    </ThemedText>
                    <ThemedText style={[styles.detailValue, { color: textColor }]}>
                      {userDetails.firstName} {userDetails.lastName}
                    </ThemedText>
                  </View>
                  <View style={styles.detailRow}>
                    <ThemedText style={[styles.detailLabel, { color: textColor + '80' }]}>
                      Email
                    </ThemedText>
                    <ThemedText style={[styles.detailValue, { color: textColor }]}>
                      {userDetails.email}
                    </ThemedText>
                  </View>
                  {userDetails.phone && (
                    <View style={styles.detailRow}>
                      <ThemedText style={[styles.detailLabel, { color: textColor + '80' }]}>
                        Téléphone
                      </ThemedText>
                      <ThemedText style={[styles.detailValue, { color: textColor }]}>
                        {userDetails.phone}
                      </ThemedText>
                    </View>
                  )}
                  <View style={styles.detailRow}>
                    <ThemedText style={[styles.detailLabel, { color: textColor + '80' }]}>
                      Type de compte
                    </ThemedText>
                    <ThemedText style={[styles.detailValue, { color: textColor }]}>
                      {getAccountTypeLabel(userDetails.accountType)}
                    </ThemedText>
                  </View>
                  <View style={styles.detailRow}>
                    <ThemedText style={[styles.detailLabel, { color: textColor + '80' }]}>
                      Statut
                    </ThemedText>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(userDetails.accountStatus) + '20' },
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.statusText,
                          { color: getStatusColor(userDetails.accountStatus) },
                        ]}
                      >
                        {userDetails.accountStatus}
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.detailRow}>
                    <ThemedText style={[styles.detailLabel, { color: textColor + '80' }]}>
                      Vérifications
                    </ThemedText>
                    <ThemedText style={[styles.detailValue, { color: textColor }]}>
                      Email: {userDetails.isEmailVerified ? '✓' : '✗'} • Phone:{' '}
                      {userDetails.isPhoneVerified ? '✓' : '✗'} • KYC:{' '}
                      {userDetails.kycVerified ? '✓' : '✗'}
                    </ThemedText>
                  </View>
                  {userDetails.wallet && (
                    <View style={styles.detailRow}>
                      <ThemedText style={[styles.detailLabel, { color: textColor + '80' }]}>
                        Portefeuille
                      </ThemedText>
                      <ThemedText style={[styles.detailValue, { color: textColor }]}>
                        {userDetails.wallet.balance} {userDetails.wallet.currency}
                      </ThemedText>
                    </View>
                  )}
                  {userDetails.country && (
                    <View style={styles.detailRow}>
                      <ThemedText style={[styles.detailLabel, { color: textColor + '80' }]}>
                        Pays
                      </ThemedText>
                      <ThemedText style={[styles.detailValue, { color: textColor }]}>
                        {userDetails.country}
                      </ThemedText>
                    </View>
                  )}
                  <View style={styles.detailRow}>
                    <ThemedText style={[styles.detailLabel, { color: textColor + '80' }]}>
                      Date de création
                    </ThemedText>
                    <ThemedText style={[styles.detailValue, { color: textColor }]}>
                      {new Date(userDetails.createdAt).toLocaleDateString('fr-FR')}
                    </ThemedText>
                  </View>
                </>
              )}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#9E9E9E' }]}
                onPress={() => {
                  setShowViewModal(false);
                  setUserDetails(null);
                }}
              >
                <ThemedText style={styles.modalButtonText}>Fermer</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit User Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: textColor }]}>
                Modifier l'utilisateur
              </ThemedText>
              <TouchableOpacity
                onPress={() => {
                  setShowEditModal(false);
                  setSelectedUser(null);
                }}
              >
                <IconSymbol name="xmark.circle.fill" size={28} color={textColor} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <ThemedText style={[styles.label, { color: textColor }]}>Prénom</ThemedText>
                <TextInput
                  style={[
                    styles.textInput,
                    { backgroundColor, color: textColor, borderColor: tintColor + '40' },
                  ]}
                  value={editForm.firstName}
                  onChangeText={(text) => setEditForm({ ...editForm, firstName: text })}
                  placeholder="Prénom"
                  placeholderTextColor={textColor + '60'}
                />
              </View>
              <View style={styles.formGroup}>
                <ThemedText style={[styles.label, { color: textColor }]}>Nom</ThemedText>
                <TextInput
                  style={[
                    styles.textInput,
                    { backgroundColor, color: textColor, borderColor: tintColor + '40' },
                  ]}
                  value={editForm.lastName}
                  onChangeText={(text) => setEditForm({ ...editForm, lastName: text })}
                  placeholder="Nom"
                  placeholderTextColor={textColor + '60'}
                />
              </View>
              <View style={styles.formGroup}>
                <ThemedText style={[styles.label, { color: textColor }]}>Email</ThemedText>
                <TextInput
                  style={[
                    styles.textInput,
                    { backgroundColor, color: textColor, borderColor: tintColor + '40' },
                  ]}
                  value={editForm.email}
                  onChangeText={(text) => setEditForm({ ...editForm, email: text })}
                  placeholder="Email"
                  placeholderTextColor={textColor + '60'}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.formGroup}>
                <ThemedText style={[styles.label, { color: textColor }]}>Téléphone</ThemedText>
                <TextInput
                  style={[
                    styles.textInput,
                    { backgroundColor, color: textColor, borderColor: tintColor + '40' },
                  ]}
                  value={editForm.phone}
                  onChangeText={(text) => setEditForm({ ...editForm, phone: text })}
                  placeholder="Téléphone"
                  placeholderTextColor={textColor + '60'}
                  keyboardType="phone-pad"
                />
              </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#9E9E9E' }]}
                onPress={() => {
                  setShowEditModal(false);
                  setSelectedUser(null);
                }}
              >
                <ThemedText style={styles.modalButtonText}>Annuler</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: tintColor }]}
                onPress={handleUpdateUser}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <ThemedText style={styles.modalButtonText}>Enregistrer</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Status Change Modal */}
      <Modal visible={showStatusModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: textColor }]}>
                {selectedUser?.accountStatus === 'ACTIVE'
                  ? 'Suspendre l\'utilisateur'
                  : 'Activer l\'utilisateur'}
              </ThemedText>
              <TouchableOpacity
                onPress={() => {
                  setShowStatusModal(false);
                  setSelectedUser(null);
                }}
              >
                <IconSymbol name="xmark.circle.fill" size={28} color={textColor} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <ThemedText style={[styles.modalDescription, { color: textColor + '80' }]}>
                {selectedUser?.accountStatus === 'ACTIVE'
                  ? `Êtes-vous sûr de vouloir suspendre ${selectedUser?.firstName} ${selectedUser?.lastName} ? L'utilisateur ne pourra plus accéder à son compte.`
                  : `Êtes-vous sûr de vouloir activer ${selectedUser?.firstName} ${selectedUser?.lastName} ? L'utilisateur pourra à nouveau accéder à son compte.`}
              </ThemedText>
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#9E9E9E' }]}
                onPress={() => {
                  setShowStatusModal(false);
                  setSelectedUser(null);
                }}
              >
                <ThemedText style={styles.modalButtonText}>Annuler</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  {
                    backgroundColor:
                      selectedUser?.accountStatus === 'ACTIVE' ? '#FF9800' : '#4CAF50',
                  },
                ]}
                onPress={handleStatusChange}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <ThemedText style={styles.modalButtonText}>
                    {selectedUser?.accountStatus === 'ACTIVE' ? 'Suspendre' : 'Activer'}
                  </ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create User Modal */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: textColor }]}>
                Créer un nouvel utilisateur
              </ThemedText>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <IconSymbol name="xmark.circle.fill" size={28} color={textColor} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <ThemedText style={[styles.label, { color: textColor }]}>Prénom</ThemedText>
                <TextInput
                  style={[styles.textInput, { backgroundColor, color: textColor, borderColor: tintColor + '40' }]}
                  value={createForm.firstName}
                  onChangeText={(text) => setCreateForm({ ...createForm, firstName: text })}
                  placeholder="Prénom"
                  placeholderTextColor={textColor + '60'}
                />
              </View>
              <View style={styles.formGroup}>
                <ThemedText style={[styles.label, { color: textColor }]}>Nom</ThemedText>
                <TextInput
                  style={[styles.textInput, { backgroundColor, color: textColor, borderColor: tintColor + '40' }]}
                  value={createForm.lastName}
                  onChangeText={(text) => setCreateForm({ ...createForm, lastName: text })}
                  placeholder="Nom"
                  placeholderTextColor={textColor + '60'}
                />
              </View>
              <View style={styles.formGroup}>
                <ThemedText style={[styles.label, { color: textColor }]}>Email *</ThemedText>
                <TextInput
                  style={[styles.textInput, { backgroundColor, color: textColor, borderColor: tintColor + '40' }]}
                  value={createForm.email}
                  onChangeText={(text) => setCreateForm({ ...createForm, email: text })}
                  placeholder="email@example.com"
                  placeholderTextColor={textColor + '60'}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.formGroup}>
                <ThemedText style={[styles.label, { color: textColor }]}>Mot de passe *</ThemedText>
                <TextInput
                  style={[styles.textInput, { backgroundColor, color: textColor, borderColor: tintColor + '40' }]}
                  value={createForm.password}
                  onChangeText={(text) => setCreateForm({ ...createForm, password: text })}
                  placeholder="Mot de passe"
                  placeholderTextColor={textColor + '60'}
                  secureTextEntry
                />
              </View>
              <View style={styles.formGroup}>
                <ThemedText style={[styles.label, { color: textColor }]}>Téléphone</ThemedText>
                <TextInput
                  style={[styles.textInput, { backgroundColor, color: textColor, borderColor: tintColor + '40' }]}
                  value={createForm.phone}
                  onChangeText={(text) => setCreateForm({ ...createForm, phone: text })}
                  placeholder="+221 77 123 45 67"
                  placeholderTextColor={textColor + '60'}
                  keyboardType="phone-pad"
                />
              </View>
              <View style={styles.formGroup}>
                <ThemedText style={[styles.label, { color: textColor }]}>Type de compte *</ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accountTypeSelector}>
                  {[
                    { label: 'Acheteur', value: 'BUYER' },
                    { label: 'Vendeur', value: 'SELLER' },
                    { label: 'Modérateur', value: 'MODERATOR' },
                    { label: 'Factureur', value: 'ACCOUNTANT' },
                    { label: 'Livreur', value: 'DELIVERY' },
                    { label: 'Commercial', value: 'COMMERCIAL' },
                  ].map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      style={[
                        styles.accountTypeButton,
                        createForm.accountType === type.value && [
                          styles.accountTypeButtonActive,
                          { backgroundColor: tintColor },
                        ],
                      ]}
                      onPress={() => setCreateForm({ ...createForm, accountType: type.value })}
                    >
                      <ThemedText
                        style={[
                          styles.accountTypeButtonText,
                          { color: createForm.accountType === type.value ? '#FFF' : textColor },
                        ]}
                      >
                        {type.label}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.formGroup}>
                <ThemedText style={[styles.label, { color: textColor }]}>Pays</ThemedText>
                <TextInput
                  style={[styles.textInput, { backgroundColor, color: textColor, borderColor: tintColor + '40' }]}
                  value={createForm.country}
                  onChangeText={(text) => setCreateForm({ ...createForm, country: text })}
                  placeholder="SN, CI, CM, etc."
                  placeholderTextColor={textColor + '60'}
                />
              </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#9E9E9E' }]}
                onPress={() => setShowCreateModal(false)}
              >
                <ThemedText style={styles.modalButtonText}>Annuler</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: tintColor }]}
                onPress={handleCreateUser}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <ThemedText style={styles.modalButtonText}>Créer</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Verification Action Modal */}
      <Modal visible={showVerificationModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: textColor }]}>
                {verificationAction === 'approve' ? 'Approuver la vérification' : 'Rejeter la vérification'}
              </ThemedText>
              <TouchableOpacity onPress={() => setShowVerificationModal(false)}>
                <IconSymbol name="xmark.circle.fill" size={28} color={textColor} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {verificationAction === 'reject' && (
                <View style={styles.formGroup}>
                  <ThemedText style={[styles.label, { color: textColor }]}>
                    Raison du rejet *
                  </ThemedText>
                  <TextInput
                    style={[
                      styles.textArea,
                      { backgroundColor, color: textColor, borderColor: tintColor + '40' },
                    ]}
                    value={rejectionReason}
                    onChangeText={setRejectionReason}
                    placeholder="Expliquez pourquoi cette vérification est rejetée..."
                    placeholderTextColor={textColor + '60'}
                    multiline
                    numberOfLines={4}
                  />
                </View>
              )}

              {verificationAction === 'approve' && (
                <ThemedText style={[styles.modalDescription, { color: textColor + '80' }]}>
                  Êtes-vous sûr de vouloir approuver cette vérification ? L'utilisateur sera
                  automatiquement vérifié.
                </ThemedText>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#9E9E9E' }]}
                onPress={() => {
                  setShowVerificationModal(false);
                  setRejectionReason('');
                }}
              >
                <ThemedText style={styles.modalButtonText}>Annuler</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  {
                    backgroundColor:
                      verificationAction === 'approve' ? '#4CAF50' : '#F44336',
                  },
                ]}
                onPress={confirmVerificationAction}
              >
                <ThemedText style={styles.modalButtonText}>
                  {verificationAction === 'approve' ? 'Approuver' : 'Rejeter'}
                </ThemedText>
              </TouchableOpacity>
            </View>
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
  tabsContainer: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    gap: 8,
  },
  tabActive: {
    backgroundColor: '#624cacff',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#F44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  filtersContainer: {
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filterScroll: {
    marginTop: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  filterButtonActive: {
    borderColor: 'transparent',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  userCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 8,
  },
  userMeta: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  verificationStatus: {
    marginTop: 4,
  },
  verificationText: {
    fontSize: 12,
  },
  userActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verificationCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  verificationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  verificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  verificationDetails: {
    flex: 1,
  },
  verificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  verificationSubtitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  verificationDate: {
    fontSize: 12,
    marginTop: 4,
  },
  verificationActions: {
    flexDirection: 'row',
    gap: 12,
  },
  verifyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  verifyButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
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
  modalDescription: {
    fontSize: 14,
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
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
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountTypeSelector: {
    marginTop: 8,
  },
  accountTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  accountTypeButtonActive: {
    borderColor: 'transparent',
  },
  accountTypeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 1000,
  },
  detailRow: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
});


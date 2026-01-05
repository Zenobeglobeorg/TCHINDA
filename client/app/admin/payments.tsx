import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Switch,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';
import { alert } from '@/utils/alert';
import PaymentMethodLogo from '@/components/PaymentMethodLogo';

interface PaymentMethod {
  id: string;
  name: string;
  isActive: boolean;
  fees?: {
    percentage?: number;
    fixed?: number;
    currency?: string;
  };
  countries?: string[];
  minAmount?: number;
  maxAmount?: number;
}

export default function PaymentsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      // TODO: Remplacer par l'endpoint réel /api/admin/payment-methods
      const mockMethods: PaymentMethod[] = [
        { id: 'orange_money', name: 'Orange Money', isActive: true },
        { id: 'mtn_money', name: 'MTN Mobile Money', isActive: true },
        { id: 'moov_money', name: 'Moov Money', isActive: true },
        { id: 'paypal', name: 'PayPal', isActive: true },
        { id: 'card', name: 'Carte bancaire', isActive: true },
        { id: 'bank_transfer', name: 'Virement bancaire', isActive: false },
        { id: 'wave', name: 'Wave', isActive: true },
        { id: 'free_money', name: 'Free Money', isActive: true },
        { id: 'paseecard', name: 'Paseecard', isActive: true },
      ];
      setPaymentMethods(mockMethods);
    } catch (error) {
      console.error('Error loading payment methods:', error);
      alert('Erreur', 'Impossible de charger les modes de paiement');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPaymentMethods();
  };

  const handleToggleActive = async (method: PaymentMethod) => {
    try {
      // TODO: Implémenter l'appel API réel
      // await apiService.patch(`/api/admin/payment-methods/${method.id}/toggle`, {
      //   isActive: !method.isActive,
      // });
      setPaymentMethods((prev) =>
        prev.map((m) => (m.id === method.id ? { ...m, isActive: !m.isActive } : m))
      );
      alert('Succès', `Mode de paiement ${!method.isActive ? 'activé' : 'désactivé'}`);
    } catch (error: any) {
      alert('Erreur', error.message || 'Erreur lors de la mise à jour');
    }
  };

  const handleEditMethod = (method: PaymentMethod) => {
    setEditingMethod(method);
    setShowEditModal(true);
  };

  if (loading && paymentMethods.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.header, { backgroundColor }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.right" size={24} color={textColor} />
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { color: textColor }]}>
            Modes de paiement
          </ThemedText>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.right" size={24} color={textColor} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: textColor }]}>
          Modes de paiement
        </ThemedText>
        <View style={{ width: 40 }} />
      </View>

      {/* Info Card */}
      <View style={[styles.infoCard, { backgroundColor: tintColor + '20' }]}>
        <IconSymbol name="info.circle.fill" size={20} color={tintColor} />
        <ThemedText style={[styles.infoText, { color: textColor }]}>
          Activez ou désactivez les modes de paiement disponibles sur la plateforme.
        </ThemedText>
      </View>

      {/* Payment Methods List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {paymentMethods.map((method) => (
          <View key={method.id} style={[styles.methodCard, { backgroundColor }]}>
            <View style={styles.methodInfo}>
              <PaymentMethodLogo methodId={method.id} size={48} />
              <View style={styles.methodDetails}>
                <ThemedText style={[styles.methodName, { color: textColor }]}>
                  {method.name}
                </ThemedText>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: method.isActive ? '#4CAF5020' : '#9E9E9E20' },
                  ]}
                >
                  <ThemedText
                    style={[styles.statusText, { color: method.isActive ? '#4CAF50' : '#9E9E9E' }]}
                  >
                    {method.isActive ? 'Actif' : 'Inactif'}
                  </ThemedText>
                </View>
              </View>
            </View>
            <View style={styles.methodActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: tintColor + '20' }]}
                onPress={() => handleEditMethod(method)}
              >
                <IconSymbol name="pencil" size={18} color={tintColor} />
              </TouchableOpacity>
              <Switch
                value={method.isActive}
                onValueChange={() => handleToggleActive(method)}
                trackColor={{ false: '#E0E0E0', true: tintColor + '80' }}
                thumbColor={method.isActive ? tintColor : '#F4F3F4'}
              />
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: textColor }]}>
                Configurer {editingMethod?.name}
              </ThemedText>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <IconSymbol name="xmark.circle.fill" size={28} color={textColor} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <ThemedText style={[styles.modalDescription, { color: textColor + '80' }]}>
                Configuration des frais et limites pour ce mode de paiement.
              </ThemedText>
              {/* TODO: Ajouter les champs de configuration */}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#9E9E9E' }]}
                onPress={() => setShowEditModal(false)}
              >
                <ThemedText style={styles.modalButtonText}>Fermer</ThemedText>
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
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  methodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  methodDetails: {
    marginLeft: 12,
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  methodActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
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
});


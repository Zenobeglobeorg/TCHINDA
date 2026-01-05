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

interface Rate {
  id: string;
  type: 'COMMISSION' | 'TAX' | 'FEE';
  name: string;
  value: number; // Pourcentage ou montant fixe
  isPercentage: boolean;
  currency?: string;
  categoryId?: string;
  countryCode?: string;
  isActive: boolean;
}

export default function RatesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rates, setRates] = useState<Rate[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRate, setEditingRate] = useState<Rate | null>(null);
  const [formData, setFormData] = useState({
    type: 'COMMISSION' as 'COMMISSION' | 'TAX' | 'FEE',
    name: '',
    value: '',
    isPercentage: true,
    currency: 'XOF',
    countryCode: '',
  });

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  useEffect(() => {
    loadRates();
  }, []);

  const loadRates = async () => {
    try {
      setLoading(true);
      // TODO: Remplacer par l'endpoint réel /api/admin/rates
      const mockRates: Rate[] = [
        {
          id: '1',
          type: 'COMMISSION',
          name: 'Commission vendeur standard',
          value: 10,
          isPercentage: true,
          isActive: true,
        },
        {
          id: '2',
          type: 'COMMISSION',
          name: 'Commission vendeur premium',
          value: 7.5,
          isPercentage: true,
          isActive: true,
        },
        {
          id: '3',
          type: 'TAX',
          name: 'TVA standard',
          value: 18,
          isPercentage: true,
          currency: 'XOF',
          countryCode: 'SN',
          isActive: true,
        },
        {
          id: '4',
          type: 'FEE',
          name: 'Frais de transaction',
          value: 500,
          isPercentage: false,
          currency: 'XOF',
          isActive: true,
        },
      ];
      setRates(mockRates);
    } catch (error) {
      console.error('Error loading rates:', error);
      alert('Erreur', 'Impossible de charger les taux');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRates();
  };

  const handleAddRate = () => {
    setEditingRate(null);
    setFormData({
      type: 'COMMISSION',
      name: '',
      value: '',
      isPercentage: true,
      currency: 'XOF',
      countryCode: '',
    });
    setShowAddModal(true);
  };

  const handleEditRate = (rate: Rate) => {
    setEditingRate(rate);
    setFormData({
      type: rate.type,
      name: rate.name,
      value: rate.value.toString(),
      isPercentage: rate.isPercentage,
      currency: rate.currency || 'XOF',
      countryCode: rate.countryCode || '',
    });
    setShowAddModal(true);
  };

  const handleSaveRate = async () => {
    if (!formData.name.trim() || !formData.value) {
      alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      // TODO: Implémenter l'appel API réel
      alert('Succès', editingRate ? 'Taux mis à jour' : 'Taux créé');
      setShowAddModal(false);
      loadRates();
    } catch (error: any) {
      alert('Erreur', error.message || 'Erreur lors de la sauvegarde');
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      COMMISSION: 'Commission',
      TAX: 'Taxe',
      FEE: 'Frais',
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      COMMISSION: '#9B59B6',
      TAX: '#3498DB',
      FEE: '#E74C3C',
    };
    return colors[type] || '#666';
  };

  if (loading && rates.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.header, { backgroundColor }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.right" size={24} color={textColor} />
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { color: textColor }]}>Taux & Commissions</ThemedText>
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
        <ThemedText style={[styles.headerTitle, { color: textColor }]}>Taux & Commissions</ThemedText>
        <TouchableOpacity
          onPress={handleAddRate}
          style={[styles.addButton, { backgroundColor: tintColor }]}
        >
          <IconSymbol name="plus" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Info Card */}
      <View style={[styles.infoCard, { backgroundColor: tintColor + '20' }]}>
        <IconSymbol name="info.circle.fill" size={20} color={tintColor} />
        <ThemedText style={[styles.infoText, { color: textColor }]}>
          Gérer les taux de commission, taxes et frais pour chaque pays et catégorie.
        </ThemedText>
      </View>

      {/* Rates List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {rates.map((rate) => (
          <View key={rate.id} style={[styles.rateCard, { backgroundColor }]}>
            <View style={styles.rateInfo}>
              <View style={styles.rateHeader}>
                <View
                  style={[styles.typeBadge, { backgroundColor: getTypeColor(rate.type) + '20' }]}
                >
                  <ThemedText style={[styles.typeText, { color: getTypeColor(rate.type) }]}>
                    {getTypeLabel(rate.type)}
                  </ThemedText>
                </View>
                <View style={styles.statusBadge}>
                  <ThemedText
                    style={[
                      styles.statusText,
                      { color: rate.isActive ? '#4CAF50' : '#9E9E9E' },
                    ]}
                  >
                    {rate.isActive ? 'Actif' : 'Inactif'}
                  </ThemedText>
                </View>
              </View>
              <ThemedText style={[styles.rateName, { color: textColor }]}>{rate.name}</ThemedText>
              <View style={styles.rateValue}>
                <ThemedText style={[styles.rateValueText, { color: tintColor }]}>
                  {rate.isPercentage
                    ? `${rate.value}%`
                    : `${rate.value} ${rate.currency || 'XOF'}`}
                </ThemedText>
                {rate.countryCode && (
                  <ThemedText style={[styles.rateCountry, { color: textColor + '60' }]}>
                    {rate.countryCode}
                  </ThemedText>
                )}
              </View>
            </View>
            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: tintColor + '20' }]}
              onPress={() => handleEditRate(rate)}
            >
              <IconSymbol name="pencil" size={18} color={tintColor} />
            </TouchableOpacity>
          </View>
        ))}

        {rates.length === 0 && (
          <View style={styles.emptyContainer}>
            <IconSymbol name="percent" size={64} color={textColor + '40'} />
            <ThemedText style={[styles.emptyText, { color: textColor + '60' }]}>
              Aucun taux configuré
            </ThemedText>
          </View>
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: textColor }]}>
                {editingRate ? 'Modifier le taux' : 'Nouveau taux'}
              </ThemedText>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <IconSymbol name="xmark.circle.fill" size={28} color={textColor} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <ThemedText style={[styles.label, { color: textColor }]}>Type *</ThemedText>
                <View style={styles.typeSelector}>
                  {(['COMMISSION', 'TAX', 'FEE'] as const).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeButton,
                        formData.type === type && [styles.typeButtonActive, { backgroundColor: tintColor }],
                      ]}
                      onPress={() => setFormData({ ...formData, type })}
                    >
                      <ThemedText
                        style={[
                          styles.typeButtonText,
                          { color: formData.type === type ? '#FFF' : textColor },
                        ]}
                      >
                        {getTypeLabel(type)}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <ThemedText style={[styles.label, { color: textColor }]}>Nom *</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor, color: textColor, borderColor: tintColor + '40' }]}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="Nom du taux"
                  placeholderTextColor={textColor + '60'}
                />
              </View>

              <View style={styles.formGroup}>
                <ThemedText style={[styles.label, { color: textColor }]}>Valeur *</ThemedText>
                <View style={styles.valueInputContainer}>
                  <TextInput
                    style={[
                      styles.valueInput,
                      { backgroundColor, color: textColor, borderColor: tintColor + '40' },
                    ]}
                    value={formData.value}
                    onChangeText={(text) => setFormData({ ...formData, value: text })}
                    placeholder="0"
                    placeholderTextColor={textColor + '60'}
                    keyboardType="numeric"
                  />
                  <View style={styles.valueSuffix}>
                    <ThemedText style={[styles.valueSuffixText, { color: textColor }]}>
                      {formData.isPercentage ? '%' : formData.currency}
                    </ThemedText>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.percentageToggle}
                  onPress={() => setFormData({ ...formData, isPercentage: !formData.isPercentage })}
                >
                  <ThemedText style={[styles.toggleText, { color: textColor }]}>
                    {formData.isPercentage ? 'Pourcentage' : 'Montant fixe'}
                  </ThemedText>
                  <IconSymbol
                    name={formData.isPercentage ? 'togglepower' : 'power'}
                    size={20}
                    color={tintColor}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <ThemedText style={[styles.label, { color: textColor }]}>Devise</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor, color: textColor, borderColor: tintColor + '40' }]}
                  value={formData.currency}
                  onChangeText={(text) => setFormData({ ...formData, currency: text })}
                  placeholder="XOF"
                  placeholderTextColor={textColor + '60'}
                />
              </View>

              <View style={styles.formGroup}>
                <ThemedText style={[styles.label, { color: textColor }]}>Code pays (optionnel)</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor, color: textColor, borderColor: tintColor + '40' }]}
                  value={formData.countryCode}
                  onChangeText={(text) => setFormData({ ...formData, countryCode: text })}
                  placeholder="SN, CI, CM, etc."
                  placeholderTextColor={textColor + '60'}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#9E9E9E' }]}
                onPress={() => setShowAddModal(false)}
              >
                <ThemedText style={styles.modalButtonText}>Annuler</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: tintColor }]}
                onPress={handleSaveRate}
              >
                <ThemedText style={styles.modalButtonText}>
                  {editingRate ? 'Enregistrer' : 'Créer'}
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
  rateCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  rateInfo: {
    flex: 1,
  },
  rateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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
    backgroundColor: '#4CAF5020',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  rateName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  rateValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rateValueText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  rateCountry: {
    fontSize: 14,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
  loadingContainer: {
    flex: 1,
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
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  typeButtonActive: {
    borderColor: 'transparent',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  valueInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  valueSuffix: {
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  valueSuffixText: {
    fontSize: 16,
    fontWeight: '600',
  },
  percentageToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
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


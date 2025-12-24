import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  RefreshControl,
  Platform,
  StatusBar,
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { sellerService, Promotion } from '@/services/seller.service';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function MarketingManagement() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [activeTab, setActiveTab] = useState<'promotions' | 'reporting'>('promotions');

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    try {
      setLoading(true);
      const response = await sellerService.getPromotions();
      if (response.success && response.data) {
        setPromotions(response.data.promotions || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des promotions:', error);
      Alert.alert('Erreur', 'Impossible de charger les promotions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPromotions();
  };

  const handleDelete = async (promotionId: string) => {
    Alert.alert(
      'Supprimer la promotion',
      'Êtes-vous sûr de vouloir supprimer cette promotion ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await sellerService.deletePromotion(promotionId);
              if (response.success) {
                Alert.alert('Succès', 'Promotion supprimée');
                loadPromotions();
              } else {
                Alert.alert('Erreur', response.error?.message || 'Impossible de supprimer la promotion');
              }
            } catch (error: any) {
              Alert.alert('Erreur', error.message || 'Une erreur est survenue');
            }
          },
        },
      ]
    );
  };

  const isActive = (promotion: Promotion) => {
    const now = new Date();
    const start = new Date(promotion.startDate);
    const end = new Date(promotion.endDate);
    return promotion.isActive && now >= start && now <= end;
  };

  if (loading && promotions.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color={tintColor} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <StatusBar barStyle="light-content" />
      {/* Header avec onglets */}
      <View style={[styles.header, { backgroundColor, paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 10 }]}>
        <ThemedText type="title">Marketing</ThemedText>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'promotions' && { backgroundColor: tintColor }]}
            onPress={() => setActiveTab('promotions')}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'promotions' ? '#FFFFFF' : textColor },
              ]}
            >
              Promotions
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'reporting' && { backgroundColor: tintColor }]}
            onPress={() => setActiveTab('reporting')}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'reporting' ? '#FFFFFF' : textColor },
              ]}
            >
              Reporting
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'promotions' ? (
        <>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: tintColor }]}
            onPress={() => {
              setEditingPromotion(null);
              setShowModal(true);
            }}
          >
            <Text style={styles.addButtonText}>+ Créer une promotion</Text>
          </TouchableOpacity>

          <FlatList
            data={promotions}
            keyExtractor={(item) => item.id || Math.random().toString()}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            renderItem={({ item }) => (
              <View style={[styles.promotionCard, { backgroundColor }]}>
                <View style={styles.promotionHeader}>
                  <ThemedText type="subtitle" style={styles.promotionName}>
                    {item.name}
                  </ThemedText>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: isActive(item)
                          ? '#4CAF5020'
                          : '#9E9E9E20',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: isActive(item) ? '#4CAF50' : '#9E9E9E' },
                      ]}
                    >
                      {isActive(item) ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>

                {item.description && (
                  <Text style={[styles.promotionDescription, { color: textColor }]}>
                    {item.description}
                  </Text>
                )}

                <View style={styles.promotionDetails}>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: textColor }]}>Type:</Text>
                    <Text style={[styles.detailValue, { color: tintColor }]}>
                      {item.discountType === 'PERCENTAGE' ? 'Pourcentage' : 'Montant fixe'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: textColor }]}>Réduction:</Text>
                    <Text style={[styles.detailValue, { color: tintColor }]}>
                      {item.discountType === 'PERCENTAGE'
                        ? `${item.discountValue}%`
                        : `${item.discountValue.toLocaleString()} XOF`}
                    </Text>
                  </View>
                  {item.code && (
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: textColor }]}>Code:</Text>
                      <Text style={[styles.detailValue, { color: tintColor, fontWeight: 'bold' }]}>
                        {item.code}
                      </Text>
                    </View>
                  )}
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: textColor }]}>Période:</Text>
                    <Text style={[styles.detailValue, { color: textColor }]}>
                      {new Date(item.startDate).toLocaleDateString('fr-FR')} -{' '}
                      {new Date(item.endDate).toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                  {item.usageLimit && (
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: textColor }]}>Limite:</Text>
                      <Text style={[styles.detailValue, { color: textColor }]}>
                        {item.usageLimit} utilisations
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.promotionActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: tintColor + '20' }]}
                    onPress={() => {
                      setEditingPromotion(item);
                      setShowModal(true);
                    }}
                  >
                    <Text style={[styles.actionButtonText, { color: tintColor }]}>Modifier</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#F4433620' }]}
                    onPress={() => handleDelete(item.id || '')}
                  >
                    <Text style={[styles.actionButtonText, { color: '#F44336' }]}>Supprimer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: textColor }]}>
                  Aucune promotion créée
                </Text>
                <TouchableOpacity
                  style={[styles.addButton, { backgroundColor: tintColor }]}
                  onPress={() => setShowModal(true)}
                >
                  <Text style={styles.addButtonText}>Créer votre première promotion</Text>
                </TouchableOpacity>
              </View>
            }
          />
        </>
      ) : (
        <MarketingReporting />
      )}

      {/* Modal de création/édition */}
      {showModal && (
        <PromotionFormModal
          visible={showModal}
          promotion={editingPromotion}
          onClose={() => {
            setShowModal(false);
            setEditingPromotion(null);
          }}
          onSave={() => {
            setShowModal(false);
            setEditingPromotion(null);
            loadPromotions();
          }}
        />
      )}
    </ThemedView>
  );
}

// Composant de reporting marketing
function MarketingReporting() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await sellerService.getStats('MONTHLY');
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.reportingContainer}>
        <ActivityIndicator size="large" color={tintColor} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.reportingContainer}>
      <View style={[styles.statsSection, { backgroundColor }]}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Performance Marketing
        </ThemedText>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor }]}>
            <Text style={[styles.statLabel, { color: textColor }]}>Dépenses publicitaires</Text>
            <Text style={[styles.statValue, { color: tintColor }]}>
              {stats?.marketing?.adSpend?.toLocaleString() || 0} XOF
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor }]}>
            <Text style={[styles.statLabel, { color: textColor }]}>Impressions</Text>
            <Text style={[styles.statValue, { color: tintColor }]}>
              {stats?.marketing?.adImpressions?.toLocaleString() || 0}
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor }]}>
            <Text style={[styles.statLabel, { color: textColor }]}>Clics</Text>
            <Text style={[styles.statValue, { color: tintColor }]}>
              {stats?.marketing?.adClicks?.toLocaleString() || 0}
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor }]}>
            <Text style={[styles.statLabel, { color: textColor }]}>ROI</Text>
            <Text style={[styles.statValue, { color: tintColor }]}>
              {stats?.marketing?.roi?.toFixed(1) || 0}%
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.statsSection, { backgroundColor }]}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Conversions
        </ThemedText>
        <View style={[styles.statCard, { backgroundColor }]}>
          <Text style={[styles.statLabel, { color: textColor }]}>Taux de conversion</Text>
          <Text style={[styles.statValue, { color: tintColor }]}>
            {stats?.products?.conversionRate?.toFixed(2) || 0}%
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

// Modal de formulaire de promotion
function PromotionFormModal({
  visible,
  promotion,
  onClose,
  onSave,
}: {
  visible: boolean;
  promotion: Promotion | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState<Partial<Promotion>>({
    name: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: 0,
    minPurchaseAmount: 0,
    maxDiscountAmount: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    usageLimit: 0,
    code: '',
  });
  const [saving, setSaving] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  useEffect(() => {
    if (promotion) {
      setFormData({
        ...promotion,
        startDate: new Date(promotion.startDate).toISOString().split('T')[0],
        endDate: new Date(promotion.endDate).toISOString().split('T')[0],
      });
    } else {
      setFormData({
        name: '',
        description: '',
        discountType: 'PERCENTAGE',
        discountValue: 0,
        minPurchaseAmount: 0,
        maxDiscountAmount: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        usageLimit: 0,
        code: '',
      });
    }
  }, [promotion, visible]);

  const handleSave = async () => {
    if (!formData.name || !formData.discountValue) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setSaving(true);
      if (promotion && promotion.id) {
        await sellerService.updatePromotion(promotion.id, formData);
        Alert.alert('Succès', 'Promotion mise à jour');
      } else {
        await sellerService.createPromotion(formData as Promotion);
        Alert.alert('Succès', 'Promotion créée');
      }
      onSave();
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de sauvegarder la promotion');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <ThemedView style={styles.modalContainer}>
        <View style={[styles.modalHeader, { backgroundColor }]}>
          <ThemedText type="title">
            {promotion ? 'Modifier la promotion' : 'Nouvelle promotion'}
          </ThemedText>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.closeButton, { color: tintColor }]}>Fermer</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: textColor }]}>Nom de la promotion *</Text>
            <TextInput
              style={[styles.input, { backgroundColor, color: textColor, borderColor: tintColor }]}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Ex: Soldes d'été"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: textColor }]}>Description</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor, color: textColor, borderColor: tintColor }]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Description de la promotion"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: textColor }]}>Type de réduction *</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={[
                  styles.radioOption,
                  formData.discountType === 'PERCENTAGE' && { backgroundColor: tintColor },
                ]}
                onPress={() => setFormData({ ...formData, discountType: 'PERCENTAGE' })}
              >
                <Text
                  style={[
                    styles.radioText,
                    { color: formData.discountType === 'PERCENTAGE' ? '#FFFFFF' : textColor },
                  ]}
                >
                  Pourcentage
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.radioOption,
                  formData.discountType === 'FIXED_AMOUNT' && { backgroundColor: tintColor },
                ]}
                onPress={() => setFormData({ ...formData, discountType: 'FIXED_AMOUNT' })}
              >
                <Text
                  style={[
                    styles.radioText,
                    { color: formData.discountType === 'FIXED_AMOUNT' ? '#FFFFFF' : textColor },
                  ]}
                >
                  Montant fixe
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: textColor }]}>
              Valeur de réduction * ({formData.discountType === 'PERCENTAGE' ? '%' : 'XOF'})
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor, color: textColor, borderColor: tintColor }]}
              value={formData.discountValue?.toString()}
              onChangeText={(text) => setFormData({ ...formData, discountValue: parseFloat(text) || 0 })}
              keyboardType="numeric"
              placeholder="0"
            />
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: textColor }]}>Date de début *</Text>
              <TextInput
                style={[styles.input, { backgroundColor, color: textColor, borderColor: tintColor }]}
                value={formData.startDate}
                onChangeText={(text) => setFormData({ ...formData, startDate: text })}
                placeholder="YYYY-MM-DD"
              />
            </View>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: textColor }]}>Date de fin *</Text>
              <TextInput
                style={[styles.input, { backgroundColor, color: textColor, borderColor: tintColor }]}
                value={formData.endDate}
                onChangeText={(text) => setFormData({ ...formData, endDate: text })}
                placeholder="YYYY-MM-DD"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: textColor }]}>Code promotionnel (optionnel)</Text>
            <TextInput
              style={[styles.input, { backgroundColor, color: textColor, borderColor: tintColor }]}
              value={formData.code}
              onChangeText={(text) => setFormData({ ...formData, code: text.toUpperCase() })}
              placeholder="Ex: SOLDES2024"
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: textColor }]}>Montant minimum d'achat (optionnel)</Text>
            <TextInput
              style={[styles.input, { backgroundColor, color: textColor, borderColor: tintColor }]}
              value={formData.minPurchaseAmount?.toString()}
              onChangeText={(text) =>
                setFormData({ ...formData, minPurchaseAmount: parseFloat(text) || 0 })
              }
              keyboardType="numeric"
              placeholder="0"
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: tintColor }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>
                {promotion ? 'Mettre à jour' : 'Créer la promotion'}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    margin: 20,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  promotionCard: {
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
  promotionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  promotionName: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  promotionDescription: {
    fontSize: 14,
    marginBottom: 15,
  },
  promotionDetails: {
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  promotionActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 20,
  },
  reportingContainer: {
    flex: 1,
    padding: 20,
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
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '48%',
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
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  closeButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
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
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  radioOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  radioText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});


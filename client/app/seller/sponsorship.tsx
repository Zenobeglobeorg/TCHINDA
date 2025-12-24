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
import { sellerService, Sponsorship } from '@/services/seller.service';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function SponsorshipManagement() {
  const [sponsorships, setSponsorships] = useState<Sponsorship[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSponsorship, setEditingSponsorship] = useState<Sponsorship | null>(null);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  useEffect(() => {
    loadSponsorships();
  }, []);

  const loadSponsorships = async () => {
    try {
      setLoading(true);
      const response = await sellerService.getSponsorships();
      if (response.success && response.data) {
        setSponsorships(response.data.sponsorships || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des sponsorisations:', error);
      Alert.alert('Erreur', 'Impossible de charger les sponsorisations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSponsorships();
  };

  const isActive = (sponsorship: Sponsorship) => {
    const now = new Date();
    const start = new Date(sponsorship.startDate);
    const end = new Date(sponsorship.endDate);
    return sponsorship.isActive && now >= start && now <= end;
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'VIP':
        return '#9C27B0';
      case 'PREMIUM':
        return '#FF9800';
      case 'BASIC':
        return '#2196F3';
      default:
        return '#9E9E9E';
    }
  };

  const getLevelLabel = (level: string) => {
    switch (level) {
      case 'VIP':
        return 'VIP';
      case 'PREMIUM':
        return 'Premium';
      case 'BASIC':
        return 'Basique';
      default:
        return level;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'PRODUCT':
        return 'Produit';
      case 'SHOP':
        return 'Boutique';
      case 'CATEGORY':
        return 'Catégorie';
      default:
        return type;
    }
  };

  if (loading && sponsorships.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color={tintColor} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.header, { backgroundColor, paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 10 }]}>
        <ThemedText type="title">Sponsorisation</ThemedText>
        <Text style={[styles.subtitle, { color: textColor }]}>
          Boostez la visibilité de vos produits et de votre boutique
        </Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: tintColor }]}
          onPress={() => {
            setEditingSponsorship(null);
            setShowModal(true);
          }}
        >
          <Text style={styles.addButtonText}>+ Créer une sponsorisation</Text>
        </TouchableOpacity>
      </View>

      {/* Informations sur les niveaux */}
      <View style={[styles.infoCard, { backgroundColor }]}>
        <ThemedText type="subtitle" style={styles.infoTitle}>
          Niveaux de sponsorisation
        </ThemedText>
        <View style={styles.levelInfo}>
          <View style={styles.levelItem}>
            <View style={[styles.levelBadge, { backgroundColor: '#2196F320' }]}>
              <Text style={[styles.levelBadgeText, { color: '#2196F3' }]}>BASIC</Text>
            </View>
            <Text style={[styles.levelDescription, { color: textColor }]}>
              Visibilité standard
            </Text>
          </View>
          <View style={styles.levelItem}>
            <View style={[styles.levelBadge, { backgroundColor: '#FF980020' }]}>
              <Text style={[styles.levelBadgeText, { color: '#FF9800' }]}>PREMIUM</Text>
            </View>
            <Text style={[styles.levelDescription, { color: textColor }]}>
              Visibilité améliorée
            </Text>
          </View>
          <View style={styles.levelItem}>
            <View style={[styles.levelBadge, { backgroundColor: '#9C27B020' }]}>
              <Text style={[styles.levelBadgeText, { color: '#9C27B0' }]}>VIP</Text>
            </View>
            <Text style={[styles.levelDescription, { color: textColor }]}>
              Visibilité maximale
            </Text>
          </View>
        </View>
      </View>

      {/* Liste des sponsorisations */}
      <FlatList
        data={sponsorships}
        keyExtractor={(item) => item.id || Math.random().toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <View style={[styles.sponsorshipCard, { backgroundColor }]}>
            <View style={styles.sponsorshipHeader}>
              <View>
                <ThemedText type="subtitle" style={styles.sponsorshipType}>
                  {getTypeLabel(item.type)}
                </ThemedText>
                <View
                  style={[
                    styles.levelBadge,
                    { backgroundColor: getLevelColor(item.level) + '20' },
                  ]}
                >
                  <Text style={[styles.levelBadgeText, { color: getLevelColor(item.level) }]}>
                    {getLevelLabel(item.level)}
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: isActive(item) ? '#4CAF5020' : '#9E9E9E20',
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

            <View style={styles.sponsorshipDetails}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: textColor }]}>Coût:</Text>
                <Text style={[styles.detailValue, { color: tintColor }]}>
                  {item.cost.toLocaleString()} {item.currency || 'XOF'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: textColor }]}>Période:</Text>
                <Text style={[styles.detailValue, { color: textColor }]}>
                  {new Date(item.startDate).toLocaleDateString('fr-FR')} -{' '}
                  {new Date(item.endDate).toLocaleDateString('fr-FR')}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: textColor }]}>Impressions:</Text>
                <Text style={[styles.detailValue, { color: textColor }]}>
                  {item.impressions?.toLocaleString() || 0}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: textColor }]}>Clics:</Text>
                <Text style={[styles.detailValue, { color: textColor }]}>
                  {item.clicks?.toLocaleString() || 0}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: textColor }]}>Conversions:</Text>
                <Text style={[styles.detailValue, { color: textColor }]}>
                  {item.conversions?.toLocaleString() || 0}
                </Text>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: textColor }]}>
              Aucune sponsorisation active
            </Text>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: tintColor }]}
              onPress={() => setShowModal(true)}
            >
              <Text style={styles.addButtonText}>Créer votre première sponsorisation</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Modal de création */}
      {showModal && (
        <SponsorshipFormModal
          visible={showModal}
          sponsorship={editingSponsorship}
          onClose={() => {
            setShowModal(false);
            setEditingSponsorship(null);
          }}
          onSave={() => {
            setShowModal(false);
            setEditingSponsorship(null);
            loadSponsorships();
          }}
        />
      )}
    </ThemedView>
  );
}

// Modal de formulaire de sponsorisation
function SponsorshipFormModal({
  visible,
  sponsorship,
  onClose,
  onSave,
}: {
  visible: boolean;
  sponsorship: Sponsorship | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState<Partial<Sponsorship>>({
    type: 'PRODUCT',
    level: 'BASIC',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    cost: 0,
    currency: 'XOF',
  });
  const [saving, setSaving] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  useEffect(() => {
    if (sponsorship) {
      setFormData({
        ...sponsorship,
        startDate: new Date(sponsorship.startDate).toISOString().split('T')[0],
        endDate: new Date(sponsorship.endDate).toISOString().split('T')[0],
      });
    } else {
      setFormData({
        type: 'PRODUCT',
        level: 'BASIC',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        cost: 0,
        currency: 'XOF',
      });
    }
  }, [sponsorship, visible]);

  const handleSave = async () => {
    if (!formData.cost || !formData.startDate || !formData.endDate) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setSaving(true);
      await sellerService.createSponsorship(formData as Sponsorship);
      Alert.alert('Succès', 'Sponsorisation créée');
      onSave();
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de créer la sponsorisation');
    } finally {
      setSaving(false);
    }
  };

  const getLevelCost = (level: string) => {
    switch (level) {
      case 'BASIC':
        return 5000;
      case 'PREMIUM':
        return 15000;
      case 'VIP':
        return 30000;
      default:
        return 0;
    }
  };

  useEffect(() => {
    if (!sponsorship) {
      setFormData((prev) => ({
        ...prev,
        cost: getLevelCost(prev.level || 'BASIC'),
      }));
    }
  }, [formData.level]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <ThemedView style={styles.modalContainer}>
        <View style={[styles.modalHeader, { backgroundColor }]}>
          <ThemedText type="title">Nouvelle sponsorisation</ThemedText>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.closeButton, { color: tintColor }]}>Fermer</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: textColor }]}>Type *</Text>
            <View style={styles.radioGroup}>
              {['PRODUCT', 'SHOP', 'CATEGORY'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.radioOption,
                    formData.type === type && { backgroundColor: tintColor },
                  ]}
                  onPress={() => setFormData({ ...formData, type: type as any })}
                >
                  <Text
                    style={[
                      styles.radioText,
                      { color: formData.type === type ? '#FFFFFF' : textColor },
                    ]}
                  >
                    {type === 'PRODUCT' ? 'Produit' : type === 'SHOP' ? 'Boutique' : 'Catégorie'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: textColor }]}>Niveau *</Text>
            <View style={styles.radioGroup}>
              {['BASIC', 'PREMIUM', 'VIP'].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.radioOption,
                    formData.level === level && { backgroundColor: tintColor },
                  ]}
                  onPress={() => setFormData({ ...formData, level: level as any })}
                >
                  <Text
                    style={[
                      styles.radioText,
                      { color: formData.level === level ? '#FFFFFF' : textColor },
                    ]}
                  >
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.hint, { color: textColor }]}>
              Coût estimé: {getLevelCost(formData.level || 'BASIC').toLocaleString()} XOF
            </Text>
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
            <Text style={[styles.label, { color: textColor }]}>Coût (XOF) *</Text>
            <TextInput
              style={[styles.input, { backgroundColor, color: textColor, borderColor: tintColor }]}
              value={formData.cost?.toString()}
              onChangeText={(text) => setFormData({ ...formData, cost: parseFloat(text) || 0 })}
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
              <Text style={styles.saveButtonText}>Créer la sponsorisation</Text>
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
  subtitle: {
    fontSize: 14,
    marginTop: 5,
    marginBottom: 15,
  },
  addButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    padding: 15,
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  levelInfo: {
    gap: 10,
  },
  levelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  levelBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  levelDescription: {
    fontSize: 14,
    flex: 1,
  },
  sponsorshipCard: {
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
  sponsorshipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  sponsorshipType: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
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
  sponsorshipDetails: {
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
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
  hint: {
    fontSize: 12,
    marginTop: 5,
    fontStyle: 'italic',
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


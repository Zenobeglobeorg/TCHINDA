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
import { alert } from '@/utils/alert';

interface AdCampaign {
  id: string;
  name: string;
  type: 'BANNER' | 'SPONSORED' | 'POPUP';
  status: 'ACTIVE' | 'PAUSED' | 'ENDED';
  impressions: number;
  clicks: number;
  budget: number;
  spent: number;
  startDate: string;
  endDate: string;
}

export default function AdvertisingScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      // TODO: Remplacer par l'endpoint réel /api/admin/advertising/campaigns
      const mockCampaigns: AdCampaign[] = [
        {
          id: '1',
          name: 'Promotion produits premium',
          type: 'SPONSORED',
          status: 'ACTIVE',
          impressions: 12500,
          clicks: 450,
          budget: 500000,
          spent: 125000,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];
      setCampaigns(mockCampaigns);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      alert('Erreur', 'Impossible de charger les campagnes publicitaires');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCampaigns();
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      ACTIVE: '#4CAF50',
      PAUSED: '#FF9800',
      ENDED: '#9E9E9E',
    };
    return colors[status] || '#666';
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      ACTIVE: 'Active',
      PAUSED: 'En pause',
      ENDED: 'Terminée',
    };
    return labels[status] || status;
  };

  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      BANNER: 'Bannière',
      SPONSORED: 'Sponsorisé',
      POPUP: 'Popup',
    };
    return labels[type] || type;
  };

  if (loading && campaigns.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.header, { backgroundColor }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.right" size={24} color={textColor} />
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { color: textColor }]}>
            Configuration publicitaire
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
          Configuration publicitaire
        </ThemedText>
        <TouchableOpacity
          onPress={() => setShowAddModal(true)}
          style={[styles.addButton, { backgroundColor: tintColor }]}
        >
          <IconSymbol name="plus" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor }]}>
          <ThemedText style={[styles.statValue, { color: tintColor }]}>
            {campaigns.length}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: textColor + '80' }]}>
            Campagnes
          </ThemedText>
        </View>
        <View style={[styles.statCard, { backgroundColor }]}>
          <ThemedText style={[styles.statValue, { color: tintColor }]}>
            {campaigns.reduce((sum, c) => sum + c.impressions, 0).toLocaleString('fr-FR')}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: textColor + '80' }]}>
            Impressions
          </ThemedText>
        </View>
        <View style={[styles.statCard, { backgroundColor }]}>
          <ThemedText style={[styles.statValue, { color: tintColor }]}>
            {campaigns.reduce((sum, c) => sum + c.clicks, 0).toLocaleString('fr-FR')}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: textColor + '80' }]}>
            Clics
          </ThemedText>
        </View>
      </View>

      {/* Campaigns List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {campaigns.map((campaign) => (
          <View key={campaign.id} style={[styles.campaignCard, { backgroundColor }]}>
            <View style={styles.campaignHeader}>
              <View style={styles.campaignInfo}>
                <ThemedText style={[styles.campaignName, { color: textColor }]}>
                  {campaign.name}
                </ThemedText>
                <View style={styles.campaignMeta}>
                  <View
                    style={[
                      styles.typeBadge,
                      { backgroundColor: tintColor + '20' },
                    ]}
                  >
                    <ThemedText style={[styles.typeText, { color: tintColor }]}>
                      {getTypeLabel(campaign.type)}
                    </ThemedText>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(campaign.status) + '20' },
                    ]}
                  >
                    <ThemedText
                      style={[styles.statusText, { color: getStatusColor(campaign.status) }]}
                    >
                      {getStatusLabel(campaign.status)}
                    </ThemedText>
                  </View>
                </View>
              </View>
            </View>
            <View style={styles.campaignStats}>
              <View style={styles.statItem}>
                <ThemedText style={[styles.statItemLabel, { color: textColor + '80' }]}>
                  Impressions
                </ThemedText>
                <ThemedText style={[styles.statItemValue, { color: textColor }]}>
                  {campaign.impressions.toLocaleString('fr-FR')}
                </ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText style={[styles.statItemLabel, { color: textColor + '80' }]}>
                  Clics
                </ThemedText>
                <ThemedText style={[styles.statItemValue, { color: textColor }]}>
                  {campaign.clicks.toLocaleString('fr-FR')}
                </ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText style={[styles.statItemLabel, { color: textColor + '80' }]}>
                  Budget
                </ThemedText>
                <ThemedText style={[styles.statItemValue, { color: textColor }]}>
                  {campaign.spent.toLocaleString('fr-FR')} / {campaign.budget.toLocaleString('fr-FR')} XOF
                </ThemedText>
              </View>
            </View>
          </View>
        ))}

        {campaigns.length === 0 && (
          <View style={styles.emptyContainer}>
            <IconSymbol name="megaphone" size={64} color={textColor + '40'} />
            <ThemedText style={[styles.emptyText, { color: textColor + '60' }]}>
              Aucune campagne publicitaire
            </ThemedText>
          </View>
        )}
      </ScrollView>

      {/* Add Campaign Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: textColor }]}>
                Nouvelle campagne
              </ThemedText>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <IconSymbol name="xmark.circle.fill" size={28} color={textColor} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <ThemedText style={[styles.modalDescription, { color: textColor + '80' }]}>
                Créez une nouvelle campagne publicitaire pour promouvoir des produits ou services.
              </ThemedText>
              {/* TODO: Ajouter le formulaire de création */}
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
                onPress={() => {
                  alert('Info', 'Fonctionnalité à implémenter');
                  setShowAddModal(false);
                }}
              >
                <ThemedText style={styles.modalButtonText}>Créer</ThemedText>
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
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
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
  campaignCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  campaignHeader: {
    marginBottom: 12,
  },
  campaignInfo: {
    flex: 1,
  },
  campaignName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  campaignMeta: {
    flexDirection: 'row',
    gap: 8,
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
  campaignStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  statItem: {
    alignItems: 'center',
  },
  statItemLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statItemValue: {
    fontSize: 16,
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


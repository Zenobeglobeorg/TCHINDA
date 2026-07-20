import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { inventoryService, Warehouse, StockMovement } from '@/services/inventory.service';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function InventoryScreen() {
  const [activeTab, setActiveTab] = useState<'STOCK' | 'MOVEMENTS' | 'WAREHOUSES' | 'ALERTS'>('STOCK');
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [alerts, setAlerts] = useState<{ products: any[]; variants: any[] }>({ products: [], variants: [] });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'WAREHOUSES') {
        const res = await inventoryService.getWarehouses();
        if (res.success) setWarehouses(res.data);
      } else if (activeTab === 'MOVEMENTS') {
        const res = await inventoryService.getMovements();
        if (res.success) setMovements(res.data);
      } else if (activeTab === 'ALERTS' || activeTab === 'STOCK') {
        const res = await inventoryService.getAlerts();
        if (res.success) setAlerts(res.data);
      }
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de charger les données');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const renderTabs = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer}>
      {(['STOCK', 'MOVEMENTS', 'WAREHOUSES', 'ALERTS'] as const).map(tab => (
        <TouchableOpacity
          key={tab}
          style={[styles.tab, activeTab === tab && styles.activeTab]}
          onPress={() => setActiveTab(tab)}
        >
          <ThemedText style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
            {tab}
          </ThemedText>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    <ThemedView style={styles.container}>
      {renderTabs()}
      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading && !refreshing ? (
          <ThemedText style={{ textAlign: 'center', marginTop: 20 }}>Chargement...</ThemedText>
        ) : (
          <>
            {activeTab === 'ALERTS' && (
              <View>
                <ThemedText type="subtitle" style={styles.sectionTitle}>Alertes de Rupture</ThemedText>
                {alerts.products.map(p => (
                  <View key={`p-${p.id}`} style={[styles.card, { borderColor: 'red', borderWidth: 1 }]}>
                    <ThemedText style={{ fontWeight: 'bold' }}>{p.name} (SKU: {p.sku})</ThemedText>
                    <ThemedText style={{ color: 'red' }}>Stock critique : {p.stock} (Min: {p.minStock})</ThemedText>
                  </View>
                ))}
                {alerts.variants.map(v => (
                  <View key={`v-${v.id}`} style={[styles.card, { borderColor: 'red', borderWidth: 1 }]}>
                    <ThemedText style={{ fontWeight: 'bold' }}>{v.product?.name} - {v.name} (SKU: {v.sku})</ThemedText>
                    <ThemedText style={{ color: 'red' }}>Stock critique : {v.stock} (Min: {v.minStock})</ThemedText>
                  </View>
                ))}
                {alerts.products.length === 0 && alerts.variants.length === 0 && (
                  <ThemedText>Aucune alerte de rupture.</ThemedText>
                )}
              </View>
            )}

            {activeTab === 'MOVEMENTS' && (
              <View>
                <ThemedText type="subtitle" style={styles.sectionTitle}>Historique des mouvements</ThemedText>
                {movements.map(m => (
                  <View key={m.id} style={styles.card}>
                    <ThemedText style={{ fontWeight: 'bold' }}>
                      {m.type} de {Math.abs(m.quantity)} unités
                    </ThemedText>
                    <ThemedText>Produit: {m.product?.name} {m.variant ? `- ${m.variant.name}` : ''}</ThemedText>
                    <ThemedText>Stock: {m.previousStock} → {m.newStock}</ThemedText>
                    <ThemedText style={{ fontSize: 12, color: 'gray' }}>{new Date(m.createdAt).toLocaleString()}</ThemedText>
                  </View>
                ))}
              </View>
            )}

            {activeTab === 'WAREHOUSES' && (
              <View>
                <ThemedText type="subtitle" style={styles.sectionTitle}>Mes Entrepôts</ThemedText>
                {warehouses.map(w => (
                  <View key={w.id} style={styles.card}>
                    <ThemedText style={{ fontWeight: 'bold' }}>{w.name}</ThemedText>
                    <ThemedText>{w.location}</ThemedText>
                    <ThemedText style={{ fontSize: 12, color: w.isActive ? 'green' : 'red' }}>
                      {w.isActive ? 'Actif' : 'Inactif'}
                    </ThemedText>
                  </View>
                ))}
              </View>
            )}

            {activeTab === 'STOCK' && (
              <View>
                <ThemedText type="subtitle" style={styles.sectionTitle}>Aperçu du stock</ThemedText>
                <ThemedText>Veuillez consulter l'onglet Produits pour éditer le stock.</ThemedText>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabsContainer: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    maxHeight: 60,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  activeTab: { backgroundColor: '#FF8C00' },
  tabText: { fontWeight: 'bold', color: '#666' },
  activeTabText: { color: 'white' },
  content: { padding: 16 },
  sectionTitle: { marginBottom: 16 },
  card: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(150,150,150,0.1)',
    marginBottom: 12,
  },
});

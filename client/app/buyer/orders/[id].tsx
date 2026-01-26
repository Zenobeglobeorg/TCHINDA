import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { apiService } from '@/services/api.service';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/hooks/useAuth';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function OrderDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'background');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [order, setOrder] = useState<any>(null);

  const loadOrder = async () => {
    try {
      const res = await apiService.get(`/api/buyer/orders/${id}`);
      if (res.success) setOrder(res.data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    loadOrder();
  }, [user, id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrder();
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.center}>
          <IconSymbol name="tray" size={64} color="#CCC" />
          <ThemedText style={styles.title}>Connectez-vous</ThemedText>
          <TouchableOpacity style={[styles.button, { backgroundColor: tintColor }]} onPress={() => router.push('/Login')}>
            <ThemedText style={styles.buttonText}>Se connecter</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  if (!order) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.center}>
          <IconSymbol name="tray" size={64} color="#CCC" />
          <ThemedText style={styles.title}>Commande introuvable</ThemedText>
          <TouchableOpacity style={[styles.button, { backgroundColor: tintColor }]} onPress={() => router.replace('/(tabs)/orders')}>
            <ThemedText style={styles.buttonText}>Retour</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.right" size={24} color={textColor} />
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { color: textColor }]}>Commande</ThemedText>
          <View style={{ width: 40 }} />
        </View>

        <View style={[styles.card, { backgroundColor }]}>
          <ThemedText style={[styles.line, { color: textColor }]}>#{order.orderNumber}</ThemedText>
          <ThemedText style={[styles.subLine, { color: textColor + '80' }]}>{order.status}</ThemedText>
          <ThemedText style={[styles.subLine, { color: textColor + '80' }]}>
            Total: {parseFloat(order.total).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} {order.currency || 'XOF'}
          </ThemedText>
        </View>

        <View style={[styles.card, { backgroundColor }]}>
          <ThemedText style={[styles.sectionTitle, { color: textColor }]}>Articles</ThemedText>
          {(order.items || []).map((it: any) => (
            <View key={it.id} style={styles.itemRow}>
              <ThemedText style={[styles.itemName, { color: textColor }]} numberOfLines={1}>
                {(it.productSnapshot?.name || it.product?.name || 'Produit') +
                  ((it.productSnapshot?.variantName || it.variant?.name)
                    ? ` • ${it.productSnapshot?.variantName || it.variant?.name}`
                    : '')}
              </ThemedText>
              <ThemedText style={[styles.itemQty, { color: textColor + '80' }]}>x{it.quantity}</ThemedText>
            </View>
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  backButton: { transform: [{ rotate: '180deg' }], padding: 6 },
  headerTitle: { fontSize: 22, fontWeight: 'bold' },
  card: { borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#00000010' },
  line: { fontSize: 18, fontWeight: 'bold' },
  subLine: { fontSize: 14, marginTop: 6 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, gap: 10 },
  itemName: { flex: 1, fontSize: 14, fontWeight: '600' },
  itemQty: { fontSize: 14 },
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginTop: 16, marginBottom: 12 },
  button: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  buttonText: { color: '#FFF', fontWeight: 'bold' },
});


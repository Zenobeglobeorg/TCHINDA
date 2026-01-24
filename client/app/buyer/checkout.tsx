import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { apiService } from '@/services/api.service';
import { useAuth } from '@/hooks/useAuth';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function CheckoutScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cart, setCart] = useState<any>(null);
  const [creating, setCreating] = useState(false);

  const loadCart = async () => {
    try {
      const res = await apiService.get('/api/buyer/cart');
      if (res.success) setCart(res.data);
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
    if (user.accountType !== 'BUYER') {
      setLoading(false);
      return;
    }
    loadCart();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCart();
  };

  const subtotal = useMemo(() => {
    if (!cart?.items) return 0;
    return cart.items.reduce((sum: number, item: any) => sum + Number(item.price) * item.quantity, 0);
  }, [cart]);

  const shipping = useMemo(() => {
    // pour l'instant: 0 (Alibaba-like: shipping calc plus tard)
    return 0;
  }, []);

  const total = subtotal + shipping;

  const createOrder = async () => {
    if (!cart?.items?.length) {
      Alert.alert('Panier vide', 'Ajoutez des produits avant de commander.');
      return;
    }
    try {
      setCreating(true);
      const res = await apiService.post('/api/buyer/orders', {
        shippingCost: shipping,
        currency: cart.currency || 'XOF',
        paymentMethod: 'WALLET',
      });
      if (!res.success) {
        Alert.alert('Erreur', res.error?.message || 'Impossible de créer la commande');
        return;
      }
      Alert.alert('Succès', 'Commande créée !', [
        {
          text: 'Voir mes commandes',
          onPress: () => router.replace('/(tabs)/orders'),
        },
      ]);
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Erreur lors du paiement');
    } finally {
      setCreating(false);
    }
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
        <View style={styles.emptyState}>
          <IconSymbol name="bag.fill" size={64} color="#CCC" />
          <ThemedText style={styles.emptyTitle}>Connectez-vous</ThemedText>
          <ThemedText style={styles.emptyText}>Veuillez vous connecter pour finaliser l’achat.</ThemedText>
          <TouchableOpacity style={[styles.primaryButton, { backgroundColor: tintColor }]} onPress={() => router.push('/Login')}>
            <ThemedText style={styles.primaryButtonText}>Se connecter</ThemedText>
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
          <ThemedText style={[styles.title, { color: textColor }]}>Paiement</ThemedText>
          <View style={{ width: 40 }} />
        </View>

        {!cart?.items?.length ? (
          <View style={styles.emptyState}>
            <IconSymbol name="cart" size={64} color="#CCC" />
            <ThemedText style={styles.emptyTitle}>Panier vide</ThemedText>
            <ThemedText style={styles.emptyText}>Ajoutez des produits avant de payer.</ThemedText>
            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: tintColor }]} onPress={() => router.replace('/(tabs)')}>
              <ThemedText style={styles.primaryButtonText}>Retour à l’accueil</ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.summaryCard, { backgroundColor }]}>
            <ThemedText style={[styles.summaryTitle, { color: textColor }]}>Résumé</ThemedText>
            <View style={styles.row}>
              <ThemedText style={[styles.label, { color: textColor + '80' }]}>Sous-total</ThemedText>
              <ThemedText style={[styles.value, { color: textColor }]}>
                {subtotal.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} {cart.currency || 'XOF'}
              </ThemedText>
            </View>
            <View style={styles.row}>
              <ThemedText style={[styles.label, { color: textColor + '80' }]}>Livraison</ThemedText>
              <ThemedText style={[styles.value, { color: textColor }]}>
                {shipping.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} {cart.currency || 'XOF'}
              </ThemedText>
            </View>
            <View style={[styles.row, { marginTop: 8 }]}>
              <ThemedText style={[styles.totalLabel, { color: textColor }]}>Total</ThemedText>
              <ThemedText style={[styles.totalValue, { color: tintColor }]}>
                {total.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} {cart.currency || 'XOF'}
              </ThemedText>
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: tintColor, opacity: creating ? 0.7 : 1 }]}
              disabled={creating}
              onPress={createOrder}
            >
              {creating ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <ThemedText style={styles.primaryButtonText}>Payer maintenant</ThemedText>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backButton: { transform: [{ rotate: '180deg' }], padding: 6 },
  title: { fontSize: 22, fontWeight: 'bold' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#999', textAlign: 'center', marginBottom: 20 },
  summaryCard: { borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#00000010' },
  summaryTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  label: { fontSize: 14 },
  value: { fontSize: 14, fontWeight: '600' },
  totalLabel: { fontSize: 16, fontWeight: 'bold' },
  totalValue: { fontSize: 18, fontWeight: 'bold' },
  primaryButton: { marginTop: 16, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  primaryButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});


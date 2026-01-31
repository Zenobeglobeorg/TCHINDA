import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Modal,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { apiService } from '@/services/api.service';
import { useAuth } from '@/hooks/useAuth';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';
import PaymentMethodModal, { PaymentMethod } from '@/components/PaymentMethodModal';
import PaymentInfoForm from '@/components/PaymentInfoForm';

export default function CheckoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ productId?: string; variantId?: string; quantity?: string }>();
  const { user } = useAuth();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cart, setCart] = useState<any>(null);
  const [buyNowItem, setBuyNowItem] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'WALLET' | 'MTN' | 'ORANGE' | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentInfoForm, setShowPaymentInfoForm] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  const isBuyNow = !!params?.productId;

  const loadCart = async () => {
    try {
      const res = await apiService.get('/api/buyer/cart');
      if (res.success) setCart(res.data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadBuyNow = async () => {
    try {
      const productId = String(params.productId);
      const qty = Math.max(1, Number(params.quantity) || 1);
      const variantId = params.variantId ? String(params.variantId) : null;

      const res = await apiService.get(`/api/products/${productId}`);
      if (!res.success || !res.data) {
        setBuyNowItem(null);
        return;
      }
      const product: any = res.data;

      let variant: any = null;
      if (product?.hasVariants) {
        variant = (product.variants || []).find((v: any) => String(v.id) === String(variantId));
        if (!variant) {
          // fallback: première variante active
          variant = (product.variants || []).find((v: any) => v?.isActive) || null;
        }
      }

      const unitPrice = variant ? Number(variant.price) : Number(product.price);
      const currency = product.currency || 'XOF';

      setBuyNowItem({
        productId,
        variantId: variant?.id ? String(variant.id) : null,
        quantity: qty,
        currency,
        price: unitPrice,
        product,
        variant,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadWallet = async () => {
    try {
      const res = await apiService.get('/api/buyer/wallet');
      if (res.success) setWallet(res.data);
    } catch (error) {
      console.error('Error loading wallet:', error);
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
    loadWallet();
    if (isBuyNow) loadBuyNow();
    else loadCart();
  }, [user, isBuyNow, params?.productId, params?.variantId, params?.quantity]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (isBuyNow) await loadBuyNow();
    else await loadCart();
  };

  const subtotal = useMemo(() => {
    if (isBuyNow) {
      if (!buyNowItem) return 0;
      return Number(buyNowItem.price) * Number(buyNowItem.quantity);
    }
    if (!cart?.items) return 0;
    return cart.items.reduce((sum: number, item: any) => sum + Number(item.price) * item.quantity, 0);
  }, [cart, buyNowItem, isBuyNow]);

  const shipping = useMemo(() => {
    // pour l'instant: 0 (Alibaba-like: shipping calc plus tard)
    return 0;
  }, []);

  const total = subtotal + shipping;

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
    if (method.id === 'wallet') {
      setPaymentMethod('WALLET');
      setShowPaymentModal(false);
    } else if (method.id === 'mtn_money') {
      setPaymentMethod('MTN');
      setShowPaymentInfoForm(true);
    } else if (method.id === 'orange_money') {
      setPaymentMethod('ORANGE');
      setShowPaymentInfoForm(true);
    } else {
      setShowPaymentModal(false);
      Alert.alert('Info', 'Cette méthode de paiement sera disponible prochainement');
    }
  };

  const handlePaymentInfoSubmit = async (paymentInfo: any) => {
    if (!paymentMethod || !selectedPaymentMethod) return;

    setCreating(true);
    try {
      // D'abord créer la commande en PENDING
      const orderRes = isBuyNow
        ? await apiService.post('/api/buyer/orders/buy-now', {
            productId: buyNowItem?.productId,
            variantId: buyNowItem?.variantId || null,
            quantity: buyNowItem?.quantity || 1,
            shippingCost: shipping,
            currency: buyNowItem?.currency || 'XOF',
            paymentMethod: paymentMethod,
          })
        : await apiService.post('/api/buyer/orders', {
            shippingCost: shipping,
            currency: cart?.currency || 'XOF',
            paymentMethod: paymentMethod,
          });

      if (!orderRes.success) {
        Alert.alert('Erreur', orderRes.error?.message || 'Impossible de créer la commande');
        return;
      }

      const orderId = orderRes.data?.id;

      // Initier le paiement mobile money
      const paymentRes = await apiService.post('/api/buyer/payments/mobile-money/initiate', {
        amount: total,
        currency: isBuyNow ? buyNowItem?.currency || 'XOF' : cart?.currency || 'XOF',
        provider: paymentMethod,
        phoneNumber: paymentInfo.phoneNumber,
        type: 'ORDER',
        orderId,
      });

      if (!paymentRes.success) {
        Alert.alert('Erreur', paymentRes.error?.message || 'Impossible d\'initier le paiement');
        return;
      }

      setPaymentId(paymentRes.data?.paymentId);
      setShowPaymentInfoForm(false);
      setShowConfirmationModal(true);
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Erreur lors du paiement');
    } finally {
      setCreating(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!paymentId) return;

    setCreating(true);
    try {
      const res = await apiService.post(`/api/buyer/payments/mobile-money/${paymentId}/confirm`, {
        confirmationCode: confirmationCode || '123456', // Code de test
      });

      if (res.success) {
        setShowConfirmationModal(false);
        Alert.alert('Succès', 'Paiement confirmé ! Commande créée.', [
          {
            text: 'Voir mes commandes',
            onPress: () => router.replace('/(tabs)/orders'),
          },
        ]);
      } else {
        Alert.alert('Erreur', res.error?.message || 'Code de confirmation invalide');
      }
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Erreur lors de la confirmation');
    } finally {
      setCreating(false);
    }
  };

  const createOrder = async () => {
    if (!paymentMethod) {
      setShowPaymentModal(true);
      return;
    }

    try {
      setCreating(true);
      
      if (isBuyNow && !buyNowItem?.productId) {
        Alert.alert('Erreur', 'Informations produit manquantes');
        return;
      }

      // Si paiement par wallet, créer directement
      if (paymentMethod === 'WALLET') {
        const res = isBuyNow
          ? await apiService.post('/api/buyer/orders/buy-now', {
              productId: buyNowItem?.productId,
              variantId: buyNowItem?.variantId || null,
              quantity: buyNowItem?.quantity || 1,
              shippingCost: shipping,
              currency: buyNowItem?.currency || 'XOF',
              paymentMethod: 'WALLET',
            })
          : await apiService.post('/api/buyer/orders', {
              shippingCost: shipping,
              currency: cart?.currency || 'XOF',
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
      }
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

        {isBuyNow ? (
          !buyNowItem ? (
            <View style={styles.emptyState}>
              <IconSymbol name="tray" size={64} color="#CCC" />
              <ThemedText style={styles.emptyTitle}>Article introuvable</ThemedText>
              <ThemedText style={styles.emptyText}>Impossible de charger l’article.</ThemedText>
              <TouchableOpacity style={[styles.primaryButton, { backgroundColor: tintColor }]} onPress={() => router.replace('/(tabs)')}>
                <ThemedText style={styles.primaryButtonText}>Retour à l’accueil</ThemedText>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.summaryCard, { backgroundColor }]}>
              <ThemedText style={[styles.summaryTitle, { color: textColor }]}>Résumé</ThemedText>
              <View style={styles.row}>
                <ThemedText style={[styles.label, { color: textColor + '80' }]}>Article</ThemedText>
                <ThemedText style={[styles.value, { color: textColor }]} numberOfLines={1}>
                  {buyNowItem?.product?.name}
                </ThemedText>
              </View>
              {buyNowItem?.variant?.name && (
                <View style={styles.row}>
                  <ThemedText style={[styles.label, { color: textColor + '80' }]}>Variante</ThemedText>
                  <ThemedText style={[styles.value, { color: textColor }]} numberOfLines={1}>
                    {buyNowItem.variant.name}
                  </ThemedText>
                </View>
              )}
              <View style={styles.row}>
                <ThemedText style={[styles.label, { color: textColor + '80' }]}>Quantité</ThemedText>
                <ThemedText style={[styles.value, { color: textColor }]}>x{buyNowItem.quantity}</ThemedText>
              </View>
              <View style={styles.row}>
                <ThemedText style={[styles.label, { color: textColor + '80' }]}>Sous-total</ThemedText>
                <ThemedText style={[styles.value, { color: textColor }]}>
                  {subtotal.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} {buyNowItem.currency || 'XOF'}
                </ThemedText>
              </View>
              <View style={styles.row}>
                <ThemedText style={[styles.label, { color: textColor + '80' }]}>Livraison</ThemedText>
                <ThemedText style={[styles.value, { color: textColor }]}>
                  {shipping.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} {buyNowItem.currency || 'XOF'}
                </ThemedText>
              </View>
              <View style={[styles.row, { marginTop: 8 }]}>
                <ThemedText style={[styles.totalLabel, { color: textColor }]}>Total</ThemedText>
                <ThemedText style={[styles.totalValue, { color: tintColor }]}>
                  {total.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} {buyNowItem.currency || 'XOF'}
                </ThemedText>
              </View>

              {/* Payment Method Selection */}
              {!paymentMethod && (
                <TouchableOpacity
                  style={[styles.paymentMethodButton, { borderColor: tintColor }]}
                  onPress={() => setShowPaymentModal(true)}
                >
                  <IconSymbol name="creditcard.fill" size={20} color={tintColor} />
                  <ThemedText style={[styles.paymentMethodButtonText, { color: tintColor }]}>
                    Choisir un mode de paiement
                  </ThemedText>
                </TouchableOpacity>
              )}

              {paymentMethod && (
                <View style={styles.selectedPaymentMethod}>
                  <View style={styles.selectedPaymentMethodLeft}>
                    <IconSymbol 
                      name={paymentMethod === 'WALLET' ? 'wallet.pass.fill' : 'creditcard.fill'} 
                      size={20} 
                      color={tintColor} 
                    />
                    <ThemedText style={[styles.selectedPaymentMethodText, { color: textColor }]}>
                      {paymentMethod === 'WALLET' && 'Portefeuille'}
                      {paymentMethod === 'MTN' && 'MTN Mobile Money'}
                      {paymentMethod === 'ORANGE' && 'Orange Money'}
                    </ThemedText>
                  </View>
                  <TouchableOpacity onPress={() => {
                    setPaymentMethod(null);
                    setSelectedPaymentMethod(null);
                  }}>
                    <IconSymbol name="xmark.circle.fill" size={20} color={textColor + '60'} />
                  </TouchableOpacity>
                </View>
              )}

              {/* Wallet Balance Info */}
              {paymentMethod === 'WALLET' && wallet && (
                <View style={styles.walletInfo}>
                  <ThemedText style={[styles.walletInfoText, { color: textColor + '80' }]}>
                    Solde disponible: {wallet?.walletCurrencies?.[0]?.balance || 0} {isBuyNow ? buyNowItem?.currency || 'XOF' : cart?.currency || 'XOF'}
                  </ThemedText>
                  {parseFloat(wallet?.walletCurrencies?.[0]?.balance || 0) < total && (
                    <ThemedText style={[styles.walletWarning, { color: '#F44336' }]}>
                      Solde insuffisant. Veuillez recharger votre portefeuille.
                    </ThemedText>
                  )}
                </View>
              )}

              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: tintColor, opacity: (creating || !paymentMethod) ? 0.7 : 1 }]}
                disabled={creating || !paymentMethod}
                onPress={createOrder}
              >
                {creating ? <ActivityIndicator color="#FFF" /> : <ThemedText style={styles.primaryButtonText}>Payer maintenant</ThemedText>}
              </TouchableOpacity>
            </View>
          )
        ) : !cart?.items?.length ? (
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

            {/* Payment Method Selection */}
            {!paymentMethod && (
              <TouchableOpacity
                style={[styles.paymentMethodButton, { borderColor: tintColor }]}
                onPress={() => setShowPaymentModal(true)}
              >
                <IconSymbol name="creditcard.fill" size={20} color={tintColor} />
                <ThemedText style={[styles.paymentMethodButtonText, { color: tintColor }]}>
                  Choisir un mode de paiement
                </ThemedText>
              </TouchableOpacity>
            )}

            {paymentMethod && (
              <View style={styles.selectedPaymentMethod}>
                <View style={styles.selectedPaymentMethodLeft}>
                  <IconSymbol 
                    name={paymentMethod === 'WALLET' ? 'wallet.pass.fill' : 'creditcard.fill'} 
                    size={20} 
                    color={tintColor} 
                  />
                  <ThemedText style={[styles.selectedPaymentMethodText, { color: textColor }]}>
                    {paymentMethod === 'WALLET' && 'Portefeuille'}
                    {paymentMethod === 'MTN' && 'MTN Mobile Money'}
                    {paymentMethod === 'ORANGE' && 'Orange Money'}
                  </ThemedText>
                </View>
                <TouchableOpacity onPress={() => {
                  setPaymentMethod(null);
                  setSelectedPaymentMethod(null);
                }}>
                  <IconSymbol name="xmark.circle.fill" size={20} color={textColor + '60'} />
                </TouchableOpacity>
              </View>
            )}

            {/* Wallet Balance Info */}
            {paymentMethod === 'WALLET' && wallet && (
              <View style={styles.walletInfo}>
                <ThemedText style={[styles.walletInfoText, { color: textColor + '80' }]}>
                  Solde disponible: {wallet?.walletCurrencies?.[0]?.balance || 0} {cart?.currency || 'XOF'}
                </ThemedText>
                {parseFloat(wallet?.walletCurrencies?.[0]?.balance || 0) < total && (
                  <ThemedText style={[styles.walletWarning, { color: '#F44336' }]}>
                    Solde insuffisant. Veuillez recharger votre portefeuille.
                  </ThemedText>
                )}
              </View>
            )}

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: tintColor, opacity: (creating || !paymentMethod) ? 0.7 : 1 }]}
              disabled={creating || !paymentMethod}
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

      {/* Payment Method Modal */}
      <PaymentMethodModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSelect={handlePaymentMethodSelect}
        title="Choisir un mode de paiement"
        loading={creating}
      />

      {/* Payment Info Form */}
      {selectedPaymentMethod && (
        <PaymentInfoForm
          visible={showPaymentInfoForm}
          paymentMethod={selectedPaymentMethod}
          amount={total}
          currency={isBuyNow ? buyNowItem?.currency || 'XOF' : cart?.currency || 'XOF'}
          onClose={() => {
            setShowPaymentInfoForm(false);
            setSelectedPaymentMethod(null);
            setPaymentMethod(null);
          }}
          onSubmit={handlePaymentInfoSubmit}
          loading={creating}
          transactionType="deposit"
        />
      )}

      {/* Confirmation Code Modal */}
      <Modal visible={showConfirmationModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: textColor }]}>
                Confirmer le paiement
              </ThemedText>
              <TouchableOpacity onPress={() => setShowConfirmationModal(false)}>
                <IconSymbol name="xmark.circle.fill" size={28} color={textColor} />
              </TouchableOpacity>
            </View>
            <ThemedText style={[styles.modalText, { color: textColor + '80' }]}>
              Un SMS de confirmation a été envoyé. Entrez le code reçu :
            </ThemedText>
            <TextInput
              style={[styles.confirmationInput, { backgroundColor, color: textColor, borderColor: tintColor + '40' }]}
              placeholder="Code de confirmation"
              placeholderTextColor={textColor + '60'}
              value={confirmationCode}
              onChangeText={setConfirmationCode}
              keyboardType="numeric"
              maxLength={6}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#F5F5F5' }]}
                onPress={() => setShowConfirmationModal(false)}
              >
                <ThemedText style={styles.modalButtonText}>Annuler</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: tintColor }]}
                onPress={handleConfirmPayment}
                disabled={creating || !confirmationCode}
              >
                {creating ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <ThemedText style={[styles.modalButtonText, { color: '#FFF' }]}>
                    Confirmer
                  </ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  paymentMethodButton: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  paymentMethodButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  selectedPaymentMethod: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedPaymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedPaymentMethodText: {
    fontSize: 14,
    fontWeight: '600',
  },
  walletInfo: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F0F7FF',
  },
  walletInfoText: {
    fontSize: 12,
  },
  walletWarning: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalText: {
    fontSize: 14,
    marginBottom: 16,
  },
  confirmationInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});


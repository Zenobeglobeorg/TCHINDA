import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { IconSymbol } from './ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';
import PaymentMethodLogo from './PaymentMethodLogo';

export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  description?: string;
  available?: boolean;
}

interface PaymentMethodModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (method: PaymentMethod) => void;
  title?: string;
  loading?: boolean;
}

// Liste complète des méthodes de paiement
export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'wallet',
    name: 'Portefeuille',
    icon: 'wallet.pass.fill',
    description: 'Payer avec votre portefeuille',
    available: true,
  },
  {
    id: 'orange_money',
    name: 'Orange Money',
    icon: 'creditcard.fill',
    description: 'Paiement via Orange Money',
    available: true,
  },
  {
    id: 'mtn_money',
    name: 'MTN Mobile Money',
    icon: 'creditcard.fill',
    description: 'Paiement via MTN Mobile Money',
    available: true,
  },
  {
    id: 'moov_money',
    name: 'Moov Money',
    icon: 'creditcard.fill',
    description: 'Paiement via Moov Money',
    available: true,
  },
  {
    id: 'paypal',
    name: 'PayPal',
    icon: 'creditcard.fill',
    description: 'Paiement sécurisé via PayPal',
    available: true,
  },
  {
    id: 'paseecard',
    name: 'Paseecard',
    icon: 'creditcard.fill',
    description: 'Paiement via Paseecard',
    available: true,
  },
  {
    id: 'bank_transfer',
    name: 'Virement bancaire',
    icon: 'building.columns.fill',
    description: 'Virement bancaire direct',
    available: true,
  },
  {
    id: 'card',
    name: 'Carte bancaire',
    icon: 'creditcard.fill',
    description: 'Visa, Mastercard, etc.',
    available: true,
  },
  {
    id: 'wave',
    name: 'Wave',
    icon: 'creditcard.fill',
    description: 'Paiement via Wave',
    available: true,
  },
  {
    id: 'free_money',
    name: 'Free Money',
    icon: 'creditcard.fill',
    description: 'Paiement via Free Money',
    available: true,
  },
];

export default function PaymentMethodModal({
  visible,
  onClose,
  onSelect,
  title = 'Choisir un mode de paiement',
  loading = false,
}: PaymentMethodModalProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  const handleSelect = (method: PaymentMethod) => {
    if (!method.available) return;
    onSelect(method);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <ThemedView style={[styles.modalContent, { backgroundColor }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>{title}</ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <IconSymbol name="xmark.circle.fill" size={28} color={textColor} />
            </TouchableOpacity>
          </View>

          {/* Payment Methods List */}
          <ScrollView style={styles.methodsList} showsVerticalScrollIndicator={false}>
            {PAYMENT_METHODS.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.methodCard,
                  { backgroundColor, borderColor: tintColor + '40' },
                  !method.available && styles.methodCardDisabled,
                ]}
                onPress={() => handleSelect(method)}
                disabled={!method.available || loading}
              >
                <View style={styles.methodLeft}>
                  <PaymentMethodLogo methodId={method.id} size={56} />
                  <View style={styles.methodInfo}>
                    <ThemedText style={styles.methodName}>{method.name}</ThemedText>
                    {method.description && (
                      <ThemedText style={[styles.methodDescription, { color: textColor + '80' }]}>
                        {method.description}
                      </ThemedText>
                    )}
                  </View>
                </View>
                {method.available ? (
                  <IconSymbol name="chevron.right" size={20} color={textColor + '60'} />
                ) : (
                  <ThemedText style={styles.unavailableText}>Bientôt disponible</ThemedText>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={tintColor} />
            </View>
          )}
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 40,
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
  closeButton: {
    padding: 4,
  },
  methodsList: {
    padding: 20,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  methodCardDisabled: {
    opacity: 0.5,
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  methodIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  methodDescription: {
    fontSize: 12,
  },
  unavailableText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#999',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
});


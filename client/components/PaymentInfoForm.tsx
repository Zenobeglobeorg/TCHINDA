import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { IconSymbol } from './ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';
import { PaymentMethod } from './PaymentMethodModal';
import { alert } from '@/utils/alert';

interface PaymentInfoFormProps {
  visible: boolean;
  paymentMethod: PaymentMethod | null;
  amount: number;
  currency: string;
  onClose: () => void;
  onSubmit: (info: any) => void;
  loading?: boolean;
  transactionType?: 'deposit' | 'withdraw';
}

// Champs nécessaires pour chaque méthode de paiement
const PAYMENT_FIELDS: Record<string, Array<{ key: string; label: string; placeholder: string; keyboardType?: any }>> = {
  orange_money: [
    { key: 'phoneNumber', label: 'Numéro Orange Money', placeholder: 'Ex: +225 07 XX XX XX XX', keyboardType: 'phone-pad' },
  ],
  mtn_money: [
    { key: 'phoneNumber', label: 'Numéro MTN Mobile Money', placeholder: 'Ex: +225 05 XX XX XX XX', keyboardType: 'phone-pad' },
  ],
  moov_money: [
    { key: 'phoneNumber', label: 'Numéro Moov Money', placeholder: 'Ex: +225 01 XX XX XX XX', keyboardType: 'phone-pad' },
  ],
  paypal: [
    { key: 'email', label: 'Adresse email PayPal', placeholder: 'votre@email.com', keyboardType: 'email-address' },
  ],
  card: [
    { key: 'cardNumber', label: 'Numéro de carte', placeholder: '1234 5678 9012 3456', keyboardType: 'numeric' },
    { key: 'cardHolder', label: 'Nom sur la carte', placeholder: 'NOM PRÉNOM', keyboardType: 'default' },
    { key: 'expiryDate', label: 'Date d\'expiration', placeholder: 'MM/AA', keyboardType: 'numeric' },
    { key: 'cvv', label: 'CVV', placeholder: '123', keyboardType: 'numeric' },
  ],
  bank_transfer: [
    { key: 'iban', label: 'IBAN', placeholder: 'Ex: CI93 CI00 0001 2345 6789 0123 45', keyboardType: 'default' },
    { key: 'accountHolder', label: 'Nom du titulaire', placeholder: 'NOM PRÉNOM', keyboardType: 'default' },
    { key: 'bankName', label: 'Nom de la banque', placeholder: 'Nom de votre banque', keyboardType: 'default' },
  ],
  wave: [
    { key: 'phoneNumber', label: 'Numéro Wave', placeholder: 'Ex: +221 XX XXX XX XX', keyboardType: 'phone-pad' },
  ],
  free_money: [
    { key: 'phoneNumber', label: 'Numéro Free Money', placeholder: 'Ex: +225 XX XX XX XX', keyboardType: 'phone-pad' },
  ],
  paseecard: [
    { key: 'cardNumber', label: 'Numéro Paseecard', placeholder: 'Numéro de votre carte', keyboardType: 'numeric' },
  ],
};

export default function PaymentInfoForm({
  visible,
  paymentMethod,
  amount,
  currency,
  onClose,
  onSubmit,
  loading = false,
  transactionType = 'deposit',
}: PaymentInfoFormProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  const fields = paymentMethod ? PAYMENT_FIELDS[paymentMethod.id] || [] : [];
  const [formData, setFormData] = useState<Record<string, string>>({});

  const handleFieldChange = (key: string, value: string) => {
    setFormData({ ...formData, [key]: value });
  };

  const handleSubmit = () => {
    // Validation basique
    const missingFields = fields.filter(field => !formData[field.key] || formData[field.key].trim() === '');
    if (missingFields.length > 0) {
      alert('Erreur', `Veuillez remplir tous les champs obligatoires`);
      return;
    }
    onSubmit(formData);
    setFormData({});
  };

  const handleClose = () => {
    setFormData({});
    onClose();
  };

  if (!paymentMethod) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <ThemedView style={[styles.modalContent, { backgroundColor }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerContent}>
              <ThemedText style={styles.modalTitle}>
                Informations {transactionType === 'deposit' ? 'de dépôt' : 'de retrait'}
              </ThemedText>
              <ThemedText style={[styles.subtitle, { color: textColor + '80' }]}>
                {paymentMethod.name}
              </ThemedText>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <IconSymbol name="xmark.circle.fill" size={28} color={textColor} />
            </TouchableOpacity>
          </View>

          {/* Amount Info */}
          <View style={[styles.amountCard, { backgroundColor: tintColor + '20' }]}>
            <ThemedText style={[styles.amountLabel, { color: textColor + '80' }]}>
              Montant {transactionType === 'deposit' ? 'du dépôt' : 'du retrait'}
            </ThemedText>
            <ThemedText style={[styles.amountValue, { color: tintColor }]}>
              {amount.toLocaleString('fr-FR')} {currency}
            </ThemedText>
          </View>

          {/* Form Fields */}
          <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            {fields.map((field) => (
              <View key={field.key} style={styles.fieldContainer}>
                <ThemedText style={[styles.fieldLabel, { color: textColor }]}>
                  {field.label}
                </ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: backgroundColor,
                      color: textColor,
                      borderColor: tintColor + '40',
                    },
                  ]}
                  placeholder={field.placeholder}
                  placeholderTextColor={textColor + '60'}
                  value={formData[field.key] || ''}
                  onChangeText={(value) => handleFieldChange(field.key, value)}
                  keyboardType={field.keyboardType || 'default'}
                  autoCapitalize={field.key === 'email' ? 'none' : 'words'}
                  secureTextEntry={field.key === 'cvv' || field.key === 'cardNumber'}
                />
              </View>
            ))}
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: tintColor + '40' }]}
              onPress={handleClose}
              disabled={loading}
            >
              <ThemedText style={[styles.cancelButtonText, { color: textColor }]}>
                Annuler
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: tintColor }]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <ThemedText style={styles.submitButtonText}>
                  Confirmer
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>
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
    maxHeight: '85%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
  },
  headerContent: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  closeButton: {
    padding: 4,
    marginLeft: 12,
  },
  amountCard: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  formContainer: {
    paddingHorizontal: 20,
    maxHeight: 400,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});


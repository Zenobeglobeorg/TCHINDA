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
import PaymentMethodLogo from './PaymentMethodLogo';

interface WithdrawConfirmationFormProps {
  visible: boolean;
  paymentMethod: PaymentMethod | null;
  availableBalance: number;
  currency: string;
  onClose: () => void;
  onSubmit: (amount: number, paymentInfo: any, password: string) => void;
  loading?: boolean;
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

export default function WithdrawConfirmationForm({
  visible,
  paymentMethod,
  availableBalance,
  currency,
  onClose,
  onSubmit,
  loading = false,
}: WithdrawConfirmationFormProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  const fields = paymentMethod ? PAYMENT_FIELDS[paymentMethod.id] || [] : [];
  const [amount, setAmount] = useState('');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleFieldChange = (key: string, value: string) => {
    setFormData({ ...formData, [key]: value });
  };

  const handleSubmit = () => {
    // Validation du montant
    const amountValue = parseFloat(amount);
    if (!amount || amountValue <= 0) {
      alert('Erreur', 'Veuillez entrer un montant valide');
      return;
    }

    if (amountValue > availableBalance) {
      alert('Erreur', 'Montant supérieur au solde disponible');
      return;
    }

    // Validation des champs de paiement
    const missingFields = fields.filter(field => !formData[field.key] || formData[field.key].trim() === '');
    if (missingFields.length > 0) {
      alert('Erreur', `Veuillez remplir tous les champs obligatoires`);
      return;
    }

    // Validation du mot de passe
    if (!password || password.trim() === '') {
      alert('Erreur', 'Veuillez entrer votre mot de passe');
      return;
    }

    onSubmit(amountValue, formData, password);
    // Réinitialiser le formulaire après soumission
    setAmount('');
    setFormData({});
    setPassword('');
  };

  const handleClose = () => {
    setAmount('');
    setFormData({});
    setPassword('');
    onClose();
  };

  const setMaxAmount = () => {
    setAmount(availableBalance.toString());
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
              <ThemedText style={styles.modalTitle}>Confirmer le retrait</ThemedText>
              <View style={styles.paymentMethodRow}>
                <PaymentMethodLogo methodId={paymentMethod.id} size={32} />
                <ThemedText style={[styles.subtitle, { color: textColor + '80' }]}>
                  {paymentMethod.name}
                </ThemedText>
              </View>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <IconSymbol name="xmark.circle.fill" size={28} color={textColor} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Balance Info */}
            <View style={[styles.balanceCard, { backgroundColor: tintColor + '20' }]}>
              <ThemedText style={[styles.balanceLabel, { color: textColor + '80' }]}>
                Solde disponible
              </ThemedText>
              <ThemedText style={[styles.balanceValue, { color: tintColor }]}>
                {availableBalance.toLocaleString('fr-FR')} {currency}
              </ThemedText>
            </View>

            {/* Amount Input */}
            <View style={styles.fieldContainer}>
              <View style={styles.amountHeader}>
                <ThemedText style={[styles.fieldLabel, { color: textColor }]}>
                  Montant à retirer
                </ThemedText>
                <TouchableOpacity onPress={setMaxAmount}>
                  <ThemedText style={[styles.maxButton, { color: tintColor }]}>Max</ThemedText>
                </TouchableOpacity>
              </View>
              <TextInput
                style={[
                  styles.amountInput,
                  {
                    backgroundColor: backgroundColor,
                    color: textColor,
                    borderColor: tintColor + '40',
                  },
                ]}
                placeholder="0"
                placeholderTextColor={textColor + '60'}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />
            </View>

            {/* Payment Method Fields */}
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

            {/* Password Field */}
            <View style={styles.fieldContainer}>
              <ThemedText style={[styles.fieldLabel, { color: textColor }]}>
                Mot de passe
              </ThemedText>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.passwordInput,
                    {
                      backgroundColor: backgroundColor,
                      color: textColor,
                      borderColor: tintColor + '40',
                    },
                  ]}
                  placeholder="Votre mot de passe"
                  placeholderTextColor={textColor + '60'}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <ThemedText style={{ color: textColor + '60', fontSize: 16 }}>
                    {showPassword ? '🙈' : '👁️'}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
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
                  Confirmer le retrait
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
    maxHeight: '90%',
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
    marginBottom: 8,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  subtitle: {
    fontSize: 14,
  },
  closeButton: {
    padding: 4,
    marginLeft: 12,
  },
  scrollContent: {
    paddingHorizontal: 20,
    maxHeight: 500,
  },
  balanceCard: {
    marginVertical: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  fieldContainer: {
    marginBottom: 20,
  },
  amountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  maxButton: {
    fontSize: 14,
    fontWeight: '600',
  },
  amountInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    borderColor: '#E0E0E0',
  },
  passwordInput: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    borderWidth: 0,
  },
  passwordToggle: {
    padding: 14,
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


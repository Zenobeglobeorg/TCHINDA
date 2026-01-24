import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TextInput,
  TouchableOpacity,
  Platform,
  SafeAreaView,
  Alert,
  Dimensions,
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web' || width > 768;

export default function WithdrawalsScreen() {
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');
  const inputColor = useThemeColor({}, 'input');
  const inputBorderColor = useThemeColor({}, 'inputBorder');

  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('FCFA');
  const [withdrawalMethod, setWithdrawalMethod] = useState('');

  const withdrawalMethods = [
    { id: 'bank', name: 'Virement Bancaire', icon: 'creditcard.fill' },
    { id: 'orange', name: 'Orange Money', icon: 'creditcard.fill' },
    { id: 'mtn', name: 'MTN Mobile Money', icon: 'creditcard.fill' },
    { id: 'moov', name: 'Moov Money', icon: 'creditcard.fill' },
    { id: 'wave', name: 'Wave', icon: 'creditcard.fill' },
  ];

  const handleWithdrawal = () => {
    if (!accountNumber || !amount || !withdrawalMethod) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    Alert.alert('Succès', 'Retrait initié avec succès');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <View style={[styles.header, { backgroundColor: tintColor }]}>
        <ThemedText style={[styles.headerTitle, { color: '#FFFFFF' }]}>
          Nouveau Retrait
        </ThemedText>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ padding: isWeb ? 20 : 15 }}
      >
        <ThemedView style={[styles.card, { backgroundColor: cardColor }]}>
          <ThemedText type="subtitle" style={[styles.cardTitle, { color: tintColor }]}>
            Informations du Client
          </ThemedText>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: textColor }]}>
              Numéro de compte utilisateur
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: inputColor,
                  borderColor: inputBorderColor,
                  color: textColor,
                },
              ]}
              placeholder="Entrez le numéro de compte"
              placeholderTextColor={useThemeColor({}, 'placeholder')}
              value={accountNumber}
              onChangeText={setAccountNumber}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: textColor }]}>
              Montant à retirer
            </ThemedText>
            <View style={styles.amountRow}>
              <TextInput
                style={[
                  styles.input,
                  styles.amountInput,
                  {
                    backgroundColor: inputColor,
                    borderColor: inputBorderColor,
                    color: textColor,
                  },
                ]}
                placeholder="0"
                placeholderTextColor={useThemeColor({}, 'placeholder')}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />
              <View style={[styles.currencySelector, { borderColor: inputBorderColor }]}>
                <ThemedText style={[styles.currencyText, { color: textColor }]}>
                  {currency}
                </ThemedText>
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: textColor }]}>
              Moyen de retrait
            </ThemedText>
            <View style={styles.withdrawalMethodsGrid}>
              {withdrawalMethods.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.withdrawalMethodCard,
                    {
                      backgroundColor: withdrawalMethod === method.id ? tintColor : cardColor,
                      borderColor: withdrawalMethod === method.id ? tintColor : borderColor,
                    },
                  ]}
                  onPress={() => setWithdrawalMethod(method.id)}
                >
                  <IconSymbol
                    name={method.icon as any}
                    size={24}
                    color={withdrawalMethod === method.id ? '#FFFFFF' : tintColor}
                  />
                  <ThemedText
                    style={[
                      styles.withdrawalMethodText,
                      {
                        color: withdrawalMethod === method.id ? '#FFFFFF' : textColor,
                      },
                    ]}
                  >
                    {method.name}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={[styles.feeInfo, { backgroundColor: useThemeColor({}, 'section') }]}>
            <ThemedText style={[styles.feeLabel, { color: textColor }]}>
              Frais applicables:
            </ThemedText>
            <ThemedText style={[styles.feeValue, { color: tintColor }]}>
              25% des frais de retrait + 1.5% (local) ou 2.5% (carte)
            </ThemedText>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: tintColor }]}
            onPress={handleWithdrawal}
          >
            <ThemedText style={styles.submitButtonText}>Valider le Retrait</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <ThemedView style={[styles.card, { backgroundColor: cardColor }]}>
          <ThemedText type="subtitle" style={[styles.cardTitle, { color: tintColor }]}>
            Instructions
          </ThemedText>
          <ThemedText style={[styles.instructionText, { color: textColor }]}>
            • Vérifiez les limites autorisées{'\n'}
            • Contrôle anti-fraude activé{'\n'}
            • Validez les coordonnées bancaires{'\n'}
            • Les frais sont calculés automatiquement{'\n'}
            • Suivi de la transaction jusqu'à réception
          </ThemedText>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 15,
    elevation: 3,
    ...(Platform.OS === 'web' && {
      // @ts-ignore
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }),
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  card: {
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
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
  amountRow: {
    flexDirection: 'row',
    gap: 10,
  },
  amountInput: {
    flex: 1,
  },
  currencySelector: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    minWidth: 80,
  },
  currencyText: {
    fontSize: 16,
    fontWeight: '600',
  },
  withdrawalMethodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  withdrawalMethodCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    minWidth: isWeb ? 120 : 100,
    marginBottom: 10,
  },
  withdrawalMethodText: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  feeInfo: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  feeLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  feeValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 22,
  },
});

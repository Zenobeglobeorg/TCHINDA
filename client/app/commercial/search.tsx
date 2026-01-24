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

export default function SearchScreen() {
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');
  const inputColor = useThemeColor({}, 'input');
  const inputBorderColor = useThemeColor({}, 'inputBorder');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un numéro de compte');
      return;
    }
    // Simulation de résultats
    setSearchResults([
      {
        id: '1',
        accountNumber: searchQuery,
        name: 'Client Exemple',
        balance: '15000 FCFA',
        status: 'Actif',
      },
    ]);
  };

  const handleViewBalance = (accountNumber: string) => {
    Alert.alert(
      'Consultation du solde',
      `Voulez-vous consulter le solde du compte ${accountNumber} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Consulter',
          onPress: () => {
            Alert.alert('Solde', 'Solde: 15000 FCFA\nÉquivalent: ≈25 EUR');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <View style={[styles.header, { backgroundColor: tintColor }]}>
        <ThemedText style={[styles.headerTitle, { color: '#FFFFFF' }]}>
          Recherche & Consultation
        </ThemedText>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ padding: isWeb ? 20 : 15 }}
      >
        <ThemedView style={[styles.card, { backgroundColor: cardColor }]}>
          <ThemedText type="subtitle" style={[styles.cardTitle, { color: tintColor }]}>
            Rechercher un compte
          </ThemedText>

          <View style={styles.searchContainer}>
            <TextInput
              style={[
                styles.searchInput,
                {
                  backgroundColor: inputColor,
                  borderColor: inputBorderColor,
                  color: textColor,
                },
              ]}
              placeholder="Numéro de compte utilisateur"
              placeholderTextColor={useThemeColor({}, 'placeholder')}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity
              style={[styles.searchButton, { backgroundColor: tintColor }]}
              onPress={handleSearch}
            >
              <IconSymbol name="magnifyingglass" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </ThemedView>

        {searchResults.length > 0 && (
          <ThemedView style={[styles.card, { backgroundColor: cardColor }]}>
            <ThemedText type="subtitle" style={[styles.cardTitle, { color: tintColor }]}>
              Résultats de recherche
            </ThemedText>

            {searchResults.map((result) => (
              <View
                key={result.id}
                style={[styles.resultItem, { borderBottomColor: borderColor }]}
              >
                <View style={styles.resultInfo}>
                  <ThemedText style={[styles.resultName, { color: textColor }]}>
                    {result.name}
                  </ThemedText>
                  <ThemedText style={[styles.resultAccount, { color: textColor, opacity: 0.7 }]}>
                    Compte: {result.accountNumber}
                  </ThemedText>
                  <ThemedText style={[styles.resultBalance, { color: tintColor }]}>
                    {result.balance}
                  </ThemedText>
                </View>
                <TouchableOpacity
                  style={[styles.viewButton, { backgroundColor: tintColor }]}
                  onPress={() => handleViewBalance(result.accountNumber)}
                >
                  <ThemedText style={styles.viewButtonText}>Consulter</ThemedText>
                </TouchableOpacity>
              </View>
            ))}
          </ThemedView>
        )}

        <ThemedView style={[styles.card, { backgroundColor: cardColor }]}>
          <ThemedText type="subtitle" style={[styles.cardTitle, { color: tintColor }]}>
            Instructions
          </ThemedText>
          <ThemedText style={[styles.instructionText, { color: textColor }]}>
            • Entrez le numéro de compte utilisateur{'\n'}
            • La consultation du solde nécessite l'autorisation explicite{'\n'}
            • Vue consolidée des portefeuilles clients{'\n'}
            • Support multi-devises disponible
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
  searchContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  searchButton: {
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 50,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  resultAccount: {
    fontSize: 14,
    marginBottom: 4,
  },
  resultBalance: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  viewButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 22,
  },
});

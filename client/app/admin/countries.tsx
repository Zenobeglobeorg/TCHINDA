import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';

interface Country {
  code: string;
  name: string;
  isActive: boolean;
  users: number;
  orders: number;
  revenue: number;
  currency: string;
}

export default function CountriesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  useEffect(() => {
    loadCountries();
  }, []);

  const loadCountries = async () => {
    try {
      setLoading(true);
      // TODO: Remplacer par l'endpoint réel /api/admin/countries
      const mockCountries: Country[] = [
        { code: 'SN', name: 'Sénégal', isActive: true, users: 1234, orders: 567, revenue: 12500000, currency: 'XOF' },
        { code: 'CI', name: "Côte d'Ivoire", isActive: true, users: 890, orders: 345, revenue: 8900000, currency: 'XOF' },
        { code: 'CM', name: 'Cameroun', isActive: true, users: 567, orders: 234, revenue: 5600000, currency: 'XAF' },
        { code: 'GA', name: 'Gabon', isActive: true, users: 234, orders: 123, revenue: 3400000, currency: 'XAF' },
        { code: 'MA', name: 'Maroc', isActive: false, users: 0, orders: 0, revenue: 0, currency: 'MAD' },
      ];
      setCountries(mockCountries);
    } catch (error) {
      console.error('Error loading countries:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCountries();
  };

  if (loading && countries.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.header, { backgroundColor }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.right" size={24} color={textColor} />
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { color: textColor }]}>
            Tableau de bord multi-pays
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
      <View style={[styles.header, { backgroundColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.right" size={24} color={textColor} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: textColor }]}>
          Tableau de bord multi-pays
        </ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {countries.map((country) => (
          <TouchableOpacity
            key={country.code}
            style={[
              styles.countryCard,
              { backgroundColor },
              selectedCountry === country.code && { borderColor: tintColor, borderWidth: 2 },
            ]}
            onPress={() => setSelectedCountry(country.code)}
          >
            <View style={styles.countryHeader}>
              <View style={[styles.flagContainer, { backgroundColor: tintColor + '20' }]}>
                <ThemedText style={[styles.flagText, { color: tintColor }]}>
                  {country.code}
                </ThemedText>
              </View>
              <View style={styles.countryInfo}>
                <ThemedText style={[styles.countryName, { color: textColor }]}>
                  {country.name}
                </ThemedText>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: country.isActive ? '#4CAF5020' : '#9E9E9E20' },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.statusText,
                      { color: country.isActive ? '#4CAF50' : '#9E9E9E' },
                    ]}
                  >
                    {country.isActive ? 'Actif' : 'Inactif'}
                  </ThemedText>
                </View>
              </View>
            </View>
            <View style={styles.countryStats}>
              <View style={styles.statItem}>
                <ThemedText style={[styles.statLabel, { color: textColor + '80' }]}>
                  Utilisateurs
                </ThemedText>
                <ThemedText style={[styles.statValue, { color: textColor }]}>
                  {country.users.toLocaleString('fr-FR')}
                </ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText style={[styles.statLabel, { color: textColor + '80' }]}>
                  Commandes
                </ThemedText>
                <ThemedText style={[styles.statValue, { color: textColor }]}>
                  {country.orders.toLocaleString('fr-FR')}
                </ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText style={[styles.statLabel, { color: textColor + '80' }]}>
                  Revenus
                </ThemedText>
                <ThemedText style={[styles.statValue, { color: tintColor }]}>
                  {country.revenue.toLocaleString('fr-FR')} {country.currency}
                </ThemedText>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
  countryCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  countryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  flagContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  flagText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  countryInfo: {
    flex: 1,
  },
  countryName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  countryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
});


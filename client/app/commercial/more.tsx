import React from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  Platform,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web' || width > 768;

export default function MoreScreen() {
  const router = useRouter();
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');

  const moreOptions = [
    {
      id: 'search',
      title: 'Recherche & Consultation',
      description: 'Rechercher un compte et consulter les soldes',
      icon: 'magnifyingglass',
      route: '/commercial/search',
    },
    {
      id: 'support',
      title: 'Support & Assistance',
      description: 'Chat, téléphone, email et tickets',
      icon: 'info.circle.fill',
      route: '/commercial/support',
    },
    {
      id: 'training',
      title: 'Formation Continue',
      description: 'Cours et certifications obligatoires',
      icon: 'doc.text.fill',
      route: '/commercial/training',
    },
    {
      id: 'reports',
      title: 'Rapports & Analytics',
      description: 'Générer et exporter des rapports',
      icon: 'chart.bar.fill',
      route: '/commercial/reports',
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <View style={[styles.header, { backgroundColor: tintColor }]}>
        <ThemedText style={[styles.headerTitle, { color: '#FFFFFF' }]}>
          Plus d'Options
        </ThemedText>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ padding: isWeb ? 20 : 15 }}
      >
        <ThemedView style={[styles.card, { backgroundColor: cardColor }]}>
          <ThemedText type="subtitle" style={[styles.cardTitle, { color: tintColor }]}>
            Fonctionnalités Supplémentaires
          </ThemedText>

          {moreOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[styles.optionItem, { borderBottomColor: borderColor }]}
              onPress={() => router.push(option.route as any)}
            >
              <IconSymbol name={option.icon as any} size={32} color={tintColor} />
              <View style={styles.optionContent}>
                <ThemedText style={[styles.optionTitle, { color: textColor }]}>
                  {option.title}
                </ThemedText>
                <ThemedText style={[styles.optionDescription, { color: textColor, opacity: 0.7 }]}>
                  {option.description}
                </ThemedText>
              </View>
              <IconSymbol name="chevron.right" size={20} color={textColor} />
            </TouchableOpacity>
          ))}
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
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  optionContent: {
    flex: 1,
    marginLeft: 15,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
  },
});

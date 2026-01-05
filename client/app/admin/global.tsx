import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function GlobalManagementScreen() {
  const router = useRouter();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  const managementSections = [
    {
      id: 'categories',
      title: 'Catégories',
      description: 'Gérer les catégories de produits',
      icon: 'folder.fill',
      route: '/admin/categories',
      color: '#4A90E2',
    },
    {
      id: 'rates',
      title: 'Taux & Commissions',
      description: 'Configurer les taux de commission et taxes',
      icon: 'percent',
      route: '/admin/rates',
      color: '#9B59B6',
    },
    {
      id: 'payments',
      title: 'Modes de paiement',
      description: 'Gérer les méthodes de paiement disponibles',
      icon: 'creditcard.fill',
      route: '/admin/payments',
      color: '#3498DB',
    },
  ];

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.right" size={24} color={textColor} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: textColor }]}>
          Gestion globale du site
        </ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
          Configuration globale
        </ThemedText>
        <ThemedText style={[styles.sectionDescription, { color: textColor + '80' }]}>
          Gérez les paramètres globaux de la plateforme : catégories, taux, commissions et modes de paiement.
        </ThemedText>

        <View style={styles.cardsContainer}>
          {managementSections.map((section) => (
            <TouchableOpacity
              key={section.id}
              style={[styles.card, { backgroundColor }]}
              onPress={() => router.push(section.route)}
            >
              <View style={[styles.cardIcon, { backgroundColor: section.color + '20' }]}>
                <IconSymbol name={section.icon as any} size={32} color={section.color} />
              </View>
              <View style={styles.cardContent}>
                <ThemedText style={[styles.cardTitle, { color: textColor }]}>
                  {section.title}
                </ThemedText>
                <ThemedText style={[styles.cardDescription, { color: textColor + '80' }]}>
                  {section.description}
                </ThemedText>
              </View>
              <IconSymbol name="chevron.right" size={20} color={textColor + '60'} />
            </TouchableOpacity>
          ))}
        </View>
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
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 16,
    marginBottom: 24,
    lineHeight: 22,
  },
  cardsContainer: {
    gap: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
  },
});


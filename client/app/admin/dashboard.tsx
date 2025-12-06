import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/hooks/useAuth';
import { IconSymbol } from '@/components/ui/IconSymbol';

const { width } = Dimensions.get('window');

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { user, refreshUser, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshUser();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/Login');
  };

  // Statistiques (exemple - à connecter avec l'API)
  const stats = [
    {
      id: 1,
      title: 'Utilisateurs',
      value: '1,234',
      change: '+12%',
      icon: 'person.2.fill',
      color: '#4A90E2',
    },
    {
      id: 2,
      title: 'Commandes',
      value: '567',
      change: '+8%',
      icon: 'cart.fill',
      color: '#9B59B6',
    },
    {
      id: 3,
      title: 'Revenus',
      value: '€45,678',
      change: '+15%',
      icon: 'dollarsign.circle.fill',
      color: '#3498DB',
    },
    {
      id: 4,
      title: 'Produits',
      value: '890',
      change: '+5%',
      icon: 'cube.box.fill',
      color: '#8E44AD',
    },
  ];

  const quickActions = [
    { id: 1, title: 'Gérer les utilisateurs', icon: 'person.3.fill', route: '/admin/users' },
    { id: 2, title: 'Gérer les produits', icon: 'cube.box.fill', route: '/admin/products' },
    { id: 3, title: 'Commandes', icon: 'cart.fill', route: '/admin/orders' },
    { id: 4, title: 'Rapports', icon: 'chart.bar.fill', route: '/admin/reports' },
    { id: 5, title: 'Paramètres', icon: 'gearshape.fill', route: '/admin/settings' },
    { id: 6, title: 'Support', icon: 'message.fill', route: '/admin/support' },
  ];

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* En-tête */}
        <View style={styles.header}>
          <View>
            <ThemedText style={styles.greeting}>
              Dashboard Administrateur
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Bienvenue, {user?.firstName || 'Admin'}
            </ThemedText>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <IconSymbol name="rectangle.portrait.and.arrow.right" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Statistiques */}
        <View style={styles.statsContainer}>
          {stats.map((stat) => (
            <View key={stat.id} style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: stat.color }]}>
                <IconSymbol name={stat.icon} size={24} color="#FFFFFF" />
              </View>
              <View style={styles.statContent}>
                <ThemedText style={styles.statValue}>{stat.value}</ThemedText>
                <ThemedText style={styles.statTitle}>{stat.title}</ThemedText>
                <ThemedText style={styles.statChange}>{stat.change}</ThemedText>
              </View>
            </View>
          ))}
        </View>

        {/* Actions rapides */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Actions rapides</ThemedText>
          <View style={styles.actionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionCard}
                onPress={() => router.push(action.route)}
              >
                <View style={styles.actionIconContainer}>
                  <IconSymbol name={action.icon} size={32} color="#624cacff" />
                </View>
                <ThemedText style={styles.actionTitle}>{action.title}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Activités récentes */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Activités récentes</ThemedText>
          <View style={styles.activityCard}>
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <IconSymbol name="person.fill" size={20} color="#4A90E2" />
              </View>
              <View style={styles.activityContent}>
                <ThemedText style={styles.activityText}>
                  Nouvel utilisateur inscrit
                </ThemedText>
                <ThemedText style={styles.activityTime}>Il y a 5 minutes</ThemedText>
              </View>
            </View>
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <IconSymbol name="cart.fill" size={20} color="#9B59B6" />
              </View>
              <View style={styles.activityContent}>
                <ThemedText style={styles.activityText}>
                  Nouvelle commande reçue
                </ThemedText>
                <ThemedText style={styles.activityTime}>Il y a 15 minutes</ThemedText>
              </View>
            </View>
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <IconSymbol name="exclamationmark.triangle.fill" size={20} color="#E74C3C" />
              </View>
              <View style={styles.activityContent}>
                <ThemedText style={styles.activityText}>
                  Signalement d'un produit
                </ThemedText>
                <ThemedText style={styles.activityTime}>Il y a 1 heure</ThemedText>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#624cacff',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  logoutButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 15,
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 50) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1D3D47',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  statChange: {
    fontSize: 12,
    color: '#27AE60',
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1D3D47',
    marginBottom: 15,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: (width - 60) / 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(98, 76, 172, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    fontWeight: '600',
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
  },
});


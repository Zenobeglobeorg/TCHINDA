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

  // Statistiques globales (à connecter avec l'API)
  const stats = [
    {
      id: 1,
      title: 'Revenus totaux',
      value: '1,245,000',
      change: '+15%',
      icon: 'dollarsign.circle.fill',
      color: '#4CAF50',
    },
    {
      id: 2,
      title: 'Litiges en attente',
      value: '3',
      change: '-2',
      icon: 'exclamationmark.triangle.fill',
      color: '#F44336',
    },
    {
      id: 3,
      title: 'Alertes actives',
      value: '5',
      change: '+2',
      icon: 'bell.badge.fill',
      color: '#FF9800',
    },
    {
      id: 4,
      title: 'Pays actifs',
      value: '6',
      change: '+1',
      icon: 'globe',
      color: '#2196F3',
    },
  ];

  const quickActions = [
    { id: 1, title: 'Gestion globale', icon: 'gearshape.2.fill' as const, route: '/admin/global' as const },
    { id: 2, title: 'Utilisateurs', icon: 'person.3.fill' as const, route: '/admin/user-management' as const },
    { id: 3, title: 'Finance & Litiges', icon: 'dollarsign.circle.fill' as const, route: '/admin/finance' as const },
    { id: 4, title: 'Publicité', icon: 'megaphone.fill' as const, route: '/admin/advertising' as const },
    { id: 5, title: 'Maintenance', icon: 'wrench.and.screwdriver.fill' as const, route: '/admin/maintenance' as const },
    { id: 6, title: 'Modérateurs', icon: 'person.badge.shield.checkmark.fill' as const, route: '/admin/moderators' as const },
    { id: 7, title: 'Analytics', icon: 'chart.line.uptrend.xyaxis' as const, route: '/admin/analytics' as const },
    { id: 8, title: 'Multi-pays', icon: 'globe' as const, route: '/admin/countries' as const },
    { id: 9, title: 'Rapports', icon: 'chart.bar.fill' as const, route: '/admin/reports' as const },
    { id: 10, title: 'Alertes', icon: 'bell.badge.fill' as const, route: '/admin/alerts' as const },
    { id: 11, title: 'Chat', icon: 'message.fill' as const, route: '/chat' as const },
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
                <IconSymbol name={stat.icon as any} size={24} color="#FFFFFF" />
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
                  <IconSymbol name={action.icon as any} size={32} color="#624cacff" />
                </View>
                <ThemedText style={styles.actionTitle}>{action.title}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Alertes système récentes */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Alertes système récentes</ThemedText>
          <View style={styles.activityCard}>
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <IconSymbol name="exclamationmark.triangle.fill" size={20} color="#F44336" />
              </View>
              <View style={styles.activityContent}>
                <ThemedText style={styles.activityText}>
                  Litige nécessitant une attention
                </ThemedText>
                <ThemedText style={styles.activityTime}>Il y a 5 minutes</ThemedText>
              </View>
            </View>
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <IconSymbol name="bell.fill" size={20} color="#FF9800" />
              </View>
              <View style={styles.activityContent}>
                <ThemedText style={styles.activityText}>
                  Nouvelle alerte système
                </ThemedText>
                <ThemedText style={styles.activityTime}>Il y a 15 minutes</ThemedText>
              </View>
            </View>
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <IconSymbol name="chart.line.uptrend.xyaxis" size={20} color="#4CAF50" />
              </View>
              <View style={styles.activityContent}>
                <ThemedText style={styles.activityText}>
                  Rapport analytics généré
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


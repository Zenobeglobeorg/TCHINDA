import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useAuth } from '@/hooks/useAuth';
import { alert } from '@/utils/alert';

export default function AdminSettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  const [notifications, setNotifications] = useState(true);
  const [emailReports, setEmailReports] = useState(true);

  const handleLogout = async () => {
    await logout();
    router.replace('/Login');
  };

  const settingsSections = [
    {
      title: 'Notifications',
      items: [
        {
          id: 'notifications',
          label: 'Notifications push',
          description: 'Recevoir des notifications sur les activités importantes',
          type: 'switch',
          value: notifications,
          onToggle: setNotifications,
        },
        {
          id: 'email-reports',
          label: 'Rapports par email',
          description: 'Recevoir des rapports hebdomadaires par email',
          type: 'switch',
          value: emailReports,
          onToggle: setEmailReports,
        },
      ],
    },
    {
      title: 'Compte',
      items: [
        {
          id: 'profile',
          label: 'Modifier le profil',
          description: 'Changer vos informations personnelles',
          type: 'button',
          icon: 'person.fill',
          onPress: () => alert('Profil', 'Modification du profil'),
        },
        {
          id: 'password',
          label: 'Changer le mot de passe',
          description: 'Mettre à jour votre mot de passe',
          type: 'button',
          icon: 'lock.fill',
          onPress: () => alert('Mot de passe', 'Changement de mot de passe'),
        },
      ],
    },
    {
      title: 'Plateforme',
      items: [
        {
          id: 'maintenance',
          label: 'Mode maintenance',
          description: 'Activer le mode maintenance',
          type: 'button',
          icon: 'wrench.and.screwdriver.fill',
          onPress: () => alert('Maintenance', 'Mode maintenance'),
        },
        {
          id: 'backup',
          label: 'Sauvegarde',
          description: 'Gérer les sauvegardes de la base de données',
          type: 'button',
          icon: 'externaldrive.fill',
          onPress: () => alert('Sauvegarde', 'Gestion des sauvegardes'),
        },
      ],
    },
  ];

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.right" size={24} color={textColor} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: textColor }]}>Paramètres</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
              {section.title}
            </ThemedText>
            <View style={[styles.sectionContent, { backgroundColor }]}>
              {section.items.map((item, itemIndex) => (
                <View key={item.id}>
                  {item.type === 'switch' ? (
                    <View style={styles.settingItem}>
                      <View style={styles.settingInfo}>
                        <ThemedText style={[styles.settingLabel, { color: textColor }]}>
                          {item.label}
                        </ThemedText>
                        <ThemedText style={[styles.settingDescription, { color: textColor + '80' }]}>
                          {item.description}
                        </ThemedText>
                      </View>
                      <Switch
                        value={item.value}
                        onValueChange={item.onToggle}
                        trackColor={{ false: '#E0E0E0', true: tintColor + '80' }}
                        thumbColor={item.value ? tintColor : '#F4F3F4'}
                      />
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.settingItem}
                      onPress={item.onPress}
                    >
                      <View style={styles.settingInfo}>
                        <View style={styles.settingHeader}>
                          {item.icon && (
                            <IconSymbol
                              name={item.icon as any}
                              size={20}
                              color={tintColor}
                              style={styles.settingIcon}
                            />
                          )}
                          <ThemedText style={[styles.settingLabel, { color: textColor }]}>
                            {item.label}
                          </ThemedText>
                        </View>
                        <ThemedText style={[styles.settingDescription, { color: textColor + '80' }]}>
                          {item.description}
                        </ThemedText>
                      </View>
                      <IconSymbol name="chevron.right" size={20} color={textColor + '60'} />
                    </TouchableOpacity>
                  )}
                  {itemIndex < section.items.length - 1 && (
                    <View style={[styles.divider, { backgroundColor: textColor + '20' }]} />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: '#DC3545' }]}
          onPress={handleLogout}
        >
          <IconSymbol name="rectangle.portrait.and.arrow.right" size={24} color="#FFF" />
          <ThemedText style={styles.logoutButtonText}>Déconnexion</ThemedText>
        </TouchableOpacity>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  sectionContent: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  settingIcon: {
    marginRight: 8,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 14,
    marginTop: 4,
  },
  divider: {
    height: 1,
    marginLeft: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 12,
  },
  logoutButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});



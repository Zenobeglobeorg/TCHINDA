import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  Switch,
  Platform,
  SafeAreaView,
  Alert,
  Dimensions,
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web' || width > 768;

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [geolocationEnabled, setGeolocationEnabled] = useState(true);

  const handleLogout = async () => {
    Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/Login');
        },
      },
    ]);
  };

  const settingsSections = [
    {
      title: 'Sécurité',
      items: [
        {
          id: '2fa',
          title: 'Authentification à deux facteurs (2FA)',
          description: 'Protection renforcée de votre compte',
          icon: 'checkmark.shield.fill',
          type: 'switch',
          value: twoFactorEnabled,
          onToggle: setTwoFactorEnabled,
        },
        {
          id: 'pin',
          title: 'PIN de transaction',
          description: 'Code PIN requis pour chaque opération',
          icon: 'lock.fill',
          type: 'navigate',
          action: () => Alert.alert('PIN', 'Configuration du PIN à venir'),
        },
        {
          id: 'geolocation',
          title: 'Géolocalisation',
          description: 'Limiter les opérations à des zones autorisées',
          icon: 'location.fill',
          type: 'switch',
          value: geolocationEnabled,
          onToggle: setGeolocationEnabled,
        },
      ],
    },
    {
      title: 'Notifications',
      items: [
        {
          id: 'notifications',
          title: 'Notifications push',
          description: 'Recevoir des notifications pour les transactions',
          icon: 'bell.badge.fill',
          type: 'switch',
          value: notificationsEnabled,
          onToggle: setNotificationsEnabled,
        },
        {
          id: 'email',
          title: 'Notifications par email',
          description: 'Recevoir des emails pour les opérations importantes',
          icon: 'doc.text.fill',
          type: 'navigate',
          action: () => Alert.alert('Email', 'Configuration des emails à venir'),
        },
      ],
    },
    {
      title: 'Compte',
      items: [
        {
          id: 'profile',
          title: 'Profil',
          description: 'Modifier vos informations personnelles',
          icon: 'person.fill',
          type: 'navigate',
          action: () => Alert.alert('Profil', 'Modification du profil à venir'),
        },
        {
          id: 'language',
          title: 'Langue',
          description: 'Changer la langue de l\'interface',
          icon: 'globe',
          type: 'navigate',
          action: () => Alert.alert('Langue', 'Sélection de la langue à venir'),
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <View style={[styles.header, { backgroundColor: tintColor }]}>
        <ThemedText style={[styles.headerTitle, { color: '#FFFFFF' }]}>
          Paramètres
        </ThemedText>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ padding: isWeb ? 20 : 15 }}
      >
        {settingsSections.map((section) => (
          <ThemedView key={section.title} style={[styles.card, { backgroundColor: cardColor }]}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: tintColor }]}>
              {section.title}
            </ThemedText>

            {section.items.map((item) => (
              <View
                key={item.id}
                style={[styles.settingItem, { borderBottomColor: borderColor }]}
              >
                <IconSymbol name={item.icon as any} size={24} color={tintColor} />
                <View style={styles.settingContent}>
                  <ThemedText style={[styles.settingTitle, { color: textColor }]}>
                    {item.title}
                  </ThemedText>
                  <ThemedText style={[styles.settingDescription, { color: textColor, opacity: 0.7 }]}>
                    {item.description}
                  </ThemedText>
                </View>
                {item.type === 'switch' && (
                  <Switch
                    value={item.value}
                    onValueChange={item.onToggle}
                    trackColor={{ false: borderColor, true: tintColor }}
                    thumbColor="#FFFFFF"
                  />
                )}
                {item.type === 'navigate' && (
                  <TouchableOpacity onPress={item.action}>
                    <IconSymbol name="chevron.right" size={20} color={textColor} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </ThemedView>
        ))}

        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: useThemeColor({}, 'error') }]}
          onPress={handleLogout}
        >
          <IconSymbol name="rectangle.portrait.and.arrow.right" size={24} color="#FFFFFF" />
          <ThemedText style={styles.logoutButtonText}>Déconnexion</ThemedText>
        </TouchableOpacity>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  settingContent: {
    flex: 1,
    marginLeft: 15,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    gap: 10,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

import React from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  Platform,
  SafeAreaView,
  Linking,
  Dimensions,
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web' || width > 768;

export default function SupportScreen() {
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');

  const supportOptions = [
    {
      id: 'chat',
      title: 'Chat en Direct',
      description: 'Support instantané 24/7',
      icon: 'info.circle.fill',
      action: () => {
        // Ouvrir le chat
      },
    },
    {
      id: 'phone',
      title: 'Assistance Téléphonique',
      description: '+33 1 23 45 67 89',
      icon: 'iphone',
      action: () => {
        Linking.openURL('tel:+33123456789');
      },
    },
    {
      id: 'email',
      title: 'Tickets par Email',
      description: 'support@tchinda.com',
      icon: 'doc.text.fill',
      action: () => {
        Linking.openURL('mailto:support@tchinda.com');
      },
    },
    {
      id: 'help',
      title: 'Centre d\'Aide',
      description: 'Guides et FAQ',
      icon: 'info.circle.fill',
      action: () => {
        // Ouvrir le centre d'aide
      },
    },
  ];

  const supportFor = [
    {
      title: 'Aux Acheteurs',
      items: [
        'Support pour rechargement du portefeuille',
        'Assistance pour paiements échoués',
        'Explication des frais de transactions',
        'Gestion des litiges financiers',
      ],
    },
    {
      title: 'Aux Vendeurs',
      items: [
        'Assistance pour configuration des paiements',
        'Optimisation des flux financiers',
        'Conseils en gestion de trésorerie',
        'Formation sur les outils financiers',
      ],
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <View style={[styles.header, { backgroundColor: tintColor }]}>
        <ThemedText style={[styles.headerTitle, { color: '#FFFFFF' }]}>
          Support & Assistance
        </ThemedText>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ padding: isWeb ? 20 : 15 }}
      >
        <ThemedView style={[styles.card, { backgroundColor: cardColor }]}>
          <ThemedText type="subtitle" style={[styles.cardTitle, { color: tintColor }]}>
            Canaux de Support
          </ThemedText>

          {supportOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[styles.supportOption, { borderBottomColor: borderColor }]}
              onPress={option.action}
            >
              <IconSymbol name={option.icon as any} size={32} color={tintColor} />
              <View style={styles.supportOptionContent}>
                <ThemedText style={[styles.supportOptionTitle, { color: textColor }]}>
                  {option.title}
                </ThemedText>
                <ThemedText style={[styles.supportOptionDesc, { color: textColor, opacity: 0.7 }]}>
                  {option.description}
                </ThemedText>
              </View>
              <IconSymbol name="chevron.right" size={20} color={textColor} />
            </TouchableOpacity>
          ))}
        </ThemedView>

        {supportFor.map((section) => (
          <ThemedView key={section.title} style={[styles.card, { backgroundColor: cardColor }]}>
            <ThemedText type="subtitle" style={[styles.cardTitle, { color: tintColor }]}>
              {section.title}
            </ThemedText>
            {section.items.map((item, index) => (
              <View key={index} style={styles.supportItem}>
                <IconSymbol name="checkmark.circle.fill" size={20} color={tintColor} />
                <ThemedText style={[styles.supportItemText, { color: textColor }]}>
                  {item}
                </ThemedText>
              </View>
            ))}
          </ThemedView>
        ))}

        <ThemedView style={[styles.card, { backgroundColor: cardColor }]}>
          <ThemedText type="subtitle" style={[styles.cardTitle, { color: tintColor }]}>
            Services Généraux
          </ThemedText>
          <ThemedText style={[styles.generalText, { color: textColor }]}>
            • Vue consolidée de tous les portefeuilles clients{'\n'}
            • Diagnostic des issues de paiement{'\n'}
            • Remboursements d'urgence{'\n'}
            • Compensations commerciales{'\n'}
            • Escalade vers administrateurs si nécessaire
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
  supportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  supportOptionContent: {
    flex: 1,
    marginLeft: 15,
  },
  supportOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  supportOptionDesc: {
    fontSize: 14,
  },
  supportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  supportItemText: {
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
  generalText: {
    fontSize: 14,
    lineHeight: 24,
  },
});

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ChatButton } from '@/components/chat/ChatButton';

export default function BuyerActivityScreen() {
  return (
    <ThemedView style={styles.container}>
      <View style={styles.center}>
        <IconSymbol name="clock.fill" size={56} color="#CCC" />
        <ThemedText style={styles.title}>Activité</ThemedText>
        <ThemedText style={styles.subtitle}>Écran en cours de construction.</ThemedText>
        
        {/* Bouton de chat - intégration minimale */}
        <View style={styles.chatButtonContainer}>
          <ChatButton variant="button" />
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', marginTop: 12, marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#999', textAlign: 'center' },
  chatButtonContainer: { marginTop: 24 },
});

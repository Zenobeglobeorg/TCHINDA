import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function BoutiqueScreen() {
  return (
    <ThemedView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <ThemedText type="title">Boutique & Services</ThemedText>
        </View>
        <View style={styles.content}>
          <View style={styles.serviceCard} accessible={true} accessibilityLabel="Services Locaux Eneo Camwater à venir">
            <IconSymbol name="storefront.fill" size={40} color="#624cacff" />
            <ThemedText style={styles.serviceTitle}>Services Locaux</ThemedText>
            <ThemedText style={styles.serviceDesc}>Paiement Eneo, Camwater, etc. (À venir)</ThemedText>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingTop: 60, paddingBottom: 10 },
  content: { padding: 20 },
  serviceCard: { backgroundColor: '#FFF', padding: 24, borderRadius: 12, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 } ,
  serviceTitle: { fontSize: 18, fontWeight: 'bold' as any, marginTop: 16 },
  serviceDesc: { fontSize: 14, color: '#666', marginTop: 8, textAlign: 'center' }
});

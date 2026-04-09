import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/hooks/useAuth';

export default function MenuScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <ThemedView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <ThemedText type="title">Menu</ThemedText>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(tabs)/orders')} accessible={true} accessibilityLabel="Mes Commandes" accessibilityRole="button">
            <IconSymbol name="bag.fill" size={24} color="#624cacff" />
            <ThemedText style={styles.menuText}>Mes Commandes</ThemedText>
            <IconSymbol name="chevron.right" size={20} color="#CCC" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(tabs)/wishlist')} accessible={true} accessibilityLabel="Mes Favoris" accessibilityRole="button">
            <IconSymbol name="heart.fill" size={24} color="#624cacff" />
            <ThemedText style={styles.menuText}>Mes Favoris</ThemedText>
            <IconSymbol name="chevron.right" size={20} color="#CCC" />
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Boutique & Services</ThemedText>
        </View>
        <View style={styles.content}>
          <View style={styles.serviceCard} accessible={true} accessibilityLabel="Services Locaux Eneo Camwater à venir">
            <IconSymbol name="storefront.fill" size={40} color="#624cacff" />
            <ThemedText style={styles.serviceTitle}>Services Locaux</ThemedText>
            <ThemedText style={styles.serviceDesc}>Paiement Eneo, Camwater, etc. (À venir)</ThemedText>
          </View>
        </View>

        <View style={styles.section}>
           <TouchableOpacity style={styles.menuItemLogOut} onPress={logout} accessible={true} accessibilityLabel="Se déconnecter" accessibilityRole="button">
            <IconSymbol name="rectangle.portrait.and.arrow.right" size={24} color="#E74C3C" />
            <ThemedText style={[styles.menuText, {color: '#E74C3C'}]}>Déconnexion</ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingTop: 60, paddingBottom: 10 },
  sectionHeader: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 0 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' as any },
  content: { padding: 20 },
  serviceCard: { backgroundColor: '#FFF', padding: 24, borderRadius: 12, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 } ,
  serviceTitle: { fontSize: 18, fontWeight: 'bold' as any, marginTop: 16 },
  serviceDesc: { fontSize: 14, color: '#666', marginTop: 8, textAlign: 'center' },
  section: { backgroundColor: '#FFF', marginHorizontal: 16, marginTop: 16, borderRadius: 12, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  menuItemLogOut: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  menuText: { flex: 1, marginLeft: 16, fontSize: 16, fontWeight: '500' as any }
});

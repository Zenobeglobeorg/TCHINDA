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
          
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(tabs)/profile')} accessible={true} accessibilityLabel="Mon Profil" accessibilityRole="button">
            <IconSymbol name="person.fill" size={24} color="#624cacff" />
            <ThemedText style={styles.menuText}>Mon Profil</ThemedText>
            <IconSymbol name="chevron.right" size={20} color="#CCC" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
           <TouchableOpacity style={styles.menuItem} onPress={logout} accessible={true} accessibilityLabel="Se déconnecter" accessibilityRole="button">
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
  section: { backgroundColor: '#FFF', marginHorizontal: 16, marginTop: 16, borderRadius: 12, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  menuText: { flex: 1, marginLeft: 16, fontSize: 16, fontWeight: '500' as any }
});

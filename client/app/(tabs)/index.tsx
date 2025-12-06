import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/hooks/useAuth';
import { IconSymbol } from '@/components/ui/IconSymbol';

const { width } = Dimensions.get('window');

export default function BuyerHomeScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshUser();
    setRefreshing(false);
  };

  // Catégories de produits (exemple)
  const categories = [
    { id: 1, name: 'Électronique', icon: 'iphone', color: '#4A90E2' },
    { id: 2, name: 'Mode', icon: 'tshirt', color: '#9B59B6' },
    { id: 3, name: 'Maison', icon: 'house.fill', color: '#3498DB' },
    { id: 4, name: 'Sport', icon: 'figure.run', color: '#8E44AD' },
    { id: 5, name: 'Beauté', icon: 'sparkles', color: '#5DADE2' },
    { id: 6, name: 'Alimentation', icon: 'cart.fill', color: '#7D3C98' },
  ];

  // Produits en vedette (exemple)
  const featuredProducts = [
    { id: 1, name: 'Produit 1', price: '29.99€', image: null },
    { id: 2, name: 'Produit 2', price: '49.99€', image: null },
    { id: 3, name: 'Produit 3', price: '19.99€', image: null },
    { id: 4, name: 'Produit 4', price: '39.99€', image: null },
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
        {/* En-tête avec salutation */}
        <View style={styles.header}>
          <View>
            <ThemedText style={styles.greeting}>
              Bonjour {user?.firstName || 'Acheteur'} 👋
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Découvrez nos meilleures offres
            </ThemedText>
          </View>
          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => router.push('/cart')}
          >
            <IconSymbol name="cart.fill" size={24} color="#FFFFFF" />
            <View style={styles.cartBadge}>
              <ThemedText style={styles.cartBadgeText}>0</ThemedText>
            </View>
          </TouchableOpacity>
        </View>

        {/* Barre de recherche */}
        <TouchableOpacity style={styles.searchBar}>
          <IconSymbol name="magnifyingglass" size={20} color="#999" />
          <ThemedText style={styles.searchPlaceholder}>
            Rechercher des produits...
          </ThemedText>
        </TouchableOpacity>

        {/* Bannières promotionnelles */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.bannerContainer}
          contentContainerStyle={styles.bannerContent}
        >
          <View style={[styles.banner, styles.bannerBlue]}>
            <ThemedText style={styles.bannerTitle}>Super Promo !</ThemedText>
            <ThemedText style={styles.bannerSubtitle}>
              Jusqu'à -50% sur tous les produits
            </ThemedText>
          </View>
          <View style={[styles.banner, styles.bannerViolet]}>
            <ThemedText style={styles.bannerTitle}>Nouveautés</ThemedText>
            <ThemedText style={styles.bannerSubtitle}>
              Découvrez les derniers arrivages
            </ThemedText>
          </View>
        </ScrollView>

        {/* Catégories */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Catégories</ThemedText>
          <View style={styles.categoriesGrid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                onPress={() => router.push(`/category/${category.id}`)}
              >
                <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                  <IconSymbol name={category.icon} size={28} color="#FFFFFF" />
                </View>
                <ThemedText style={styles.categoryName}>{category.name}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Produits en vedette */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Produits en vedette</ThemedText>
            <TouchableOpacity onPress={() => router.push('/products')}>
              <ThemedText style={styles.seeAll}>Voir tout</ThemedText>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.productsContainer}
          >
            {featuredProducts.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={styles.productCard}
                onPress={() => router.push(`/product/${product.id}`)}
              >
                <View style={styles.productImagePlaceholder}>
                  <IconSymbol name="photo" size={40} color="#CCC" />
                </View>
                <ThemedText style={styles.productName} numberOfLines={2}>
                  {product.name}
                </ThemedText>
                <ThemedText style={styles.productPrice}>{product.price}</ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Offres flash */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Offres Flash ⚡</ThemedText>
          <View style={styles.flashOffer}>
            <View style={styles.flashOfferContent}>
              <ThemedText style={styles.flashOfferTitle}>
                Vente Flash - 24h seulement !
              </ThemedText>
              <ThemedText style={styles.flashOfferSubtitle}>
                Profitez de réductions exceptionnelles
              </ThemedText>
            </View>
            <TouchableOpacity style={styles.flashOfferButton}>
              <ThemedText style={styles.flashOfferButtonText}>Voir</ThemedText>
            </TouchableOpacity>
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
    backgroundColor: '#FFFFFF',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D3D47',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  cartButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#624cacff',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#E74C3C',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 20,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchPlaceholder: {
    marginLeft: 10,
    color: '#999',
    fontSize: 14,
  },
  bannerContainer: {
    marginBottom: 20,
  },
  bannerContent: {
    paddingHorizontal: 20,
  },
  banner: {
    width: width - 40,
    height: 150,
    borderRadius: 15,
    padding: 20,
    marginRight: 15,
    justifyContent: 'center',
  },
  bannerBlue: {
    backgroundColor: '#4A90E2',
  },
  bannerViolet: {
    backgroundColor: '#9B59B6',
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  bannerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  section: {
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1D3D47',
    marginBottom: 15,
  },
  seeAll: {
    fontSize: 14,
    color: '#624cacff',
    fontWeight: '600',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: (width - 60) / 3,
    alignItems: 'center',
    marginBottom: 15,
  },
  categoryIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  productsContainer: {
    paddingRight: 20,
  },
  productCard: {
    width: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImagePlaceholder: {
    width: '100%',
    height: 140,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#624cacff',
  },
  flashOffer: {
    flexDirection: 'row',
    backgroundColor: '#624cacff',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flashOfferContent: {
    flex: 1,
  },
  flashOfferTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  flashOfferSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  flashOfferButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  flashOfferButtonText: {
    color: '#624cacff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { apiService } from '@/services/api.service';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Colors } from '@/constants/Colors';

const { width } = Dimensions.get('window');

export default function BuyerHomeScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const colors = useThemeColors();
  const [refreshing, setRefreshing] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; slug?: string }>>([]);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Rediriger les vendeurs vers l'espace vendeur
  useEffect(() => {
    if (user && user.accountType === 'SELLER') {
      router.replace('/seller/dashboard');
    }
  }, [user]);

  useEffect(() => {
    loadCatalog(null);
  }, []);

  useEffect(() => {
    // Charger le panier uniquement si on est bien connecté en acheteur
    if (user && user.accountType === 'BUYER') {
      loadCartCount();
    }
  }, [user]);

  const loadCartCount = async () => {
    try {
      const response = await apiService.get('/api/buyer/cart');
      if (response.success && response.data) {
        const cartData = response.data as { items?: Array<{ quantity: number }> };
        if (cartData.items) {
          const count = cartData.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
          setCartCount(count);
        }
      }
    } catch (error) {
      // Silently fail if user is not authenticated
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshUser();
    await loadCartCount();
    await loadCatalog(selectedCategoryId);
    setRefreshing(false);
  };

  const loadCatalog = useCallback(async (categoryId: string | null) => {
    try {
      const [catRes, prodRes] = await Promise.all([
        apiService.get('/api/categories'),
        apiService.get(
          `/api/products?sortBy=newest&limit=10${categoryId ? `&categoryId=${encodeURIComponent(categoryId)}` : ''}`
        ),
      ]);

      if (catRes.success) {
        const data = (catRes.data as any) || [];
        setCategories(Array.isArray(data) ? data : data.categories || []);
      }

      if (prodRes.success) {
        const data = (prodRes.data as any) || {};
        const products = Array.isArray(data) ? data : data.products || [];
        setFeaturedProducts(products);
      }
    } catch (e) {
      // non bloquant pour la home
    }
  }, []);

  const getCategoryIcon = (slugOrName?: string) => {
    const key = (slugOrName || '').toLowerCase();
    if (key.includes('elect') || key.includes('tech') || key.includes('phone')) return 'iphone' as const;
    if (key.includes('mode') || key.includes('vet') || key.includes('cloth')) return 'tshirt' as const;
    if (key.includes('maison') || key.includes('home') || key.includes('jardin')) return 'house.fill' as const;
    if (key.includes('sport')) return 'figure.walk' as const;
    if (key.includes('beaute') || key.includes('beaut')) return 'sparkles' as const;
    if (key.includes('alim') || key.includes('food')) return 'cart.fill' as const;
    return 'bag.fill' as const;
  };

  const categoryColors = ['#4A90E2', '#9B59B6', '#3498DB', '#8E44AD', '#5DADE2', '#7D3C98'];

  const uiCategories = useMemo(() => {
    const base = categories.map((c, idx) => ({
      id: c.id,
      name: c.name,
      icon: getCategoryIcon(c.slug || c.name),
      color: categoryColors[idx % categoryColors.length],
    }));
    return [
      { id: 'ALL', name: 'Tous', icon: 'bag.fill' as const, color: colors.tint },
      ...base,
    ];
  }, [categories, colors.tint]);

  const formatPrice = (p: any) => {
    const price = Number(p?.price);
    const currency = p?.currency || 'XOF';
    if (!Number.isFinite(price)) return `${p?.price || ''} ${currency}`.trim();
    return `${price.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currency}`;
  };

  // Styles dynamiques basés sur le thème
  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.section,
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
      backgroundColor: colors.card,
    },
    greeting: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: colors.placeholder,
    },
    cartButton: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: colors.tint,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    cartBadge: {
      position: 'absolute',
      top: -5,
      right: -5,
      backgroundColor: colors.error,
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
      backgroundColor: colors.card,
      marginHorizontal: 20,
      marginTop: 15,
      marginBottom: 20,
      paddingHorizontal: 15,
      paddingVertical: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchPlaceholder: {
      marginLeft: 10,
      color: colors.placeholder,
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
      color: colors.text,
      marginBottom: 15,
    },
    seeAll: {
      fontSize: 14,
      color: colors.tint,
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
      color: colors.text,
      textAlign: 'center',
    },
    productsContainer: {
      paddingRight: 20,
    },
    productCard: {
      width: 160,
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 12,
      marginRight: 15,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: colors === Colors.dark ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    productImagePlaceholder: {
      width: '100%',
      height: 140,
      backgroundColor: colors.section,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
    },
    productName: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 6,
    },
    productPrice: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.tint,
    },
    flashOffer: {
      flexDirection: 'row',
      backgroundColor: colors.tint,
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
      color: colors.tint,
      fontWeight: 'bold',
      fontSize: 14,
    },
  }), [colors]);

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
            onPress={() => router.push('/(tabs)/cart')}
          >
            <IconSymbol name="cart.fill" size={24} color="#FFFFFF" />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <ThemedText style={styles.cartBadgeText}>{cartCount}</ThemedText>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Barre de recherche */}
        <TouchableOpacity style={styles.searchBar}>
          <IconSymbol name="magnifyingglass" size={20} color={colors.placeholder} />
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
            {uiCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                onPress={() => {
                  if (category.id === 'ALL') {
                    setSelectedCategoryId(null);
                    loadCatalog(null);
                    return;
                  }
                  const next = selectedCategoryId === category.id ? null : category.id;
                  setSelectedCategoryId(next);
                  loadCatalog(next);
                }}
                onLongPress={() => {
                  if (category.id !== 'ALL') {
                    router.push(`/category/${category.id}`);
                  }
                }}
              >
                <View
                  style={[
                    styles.categoryIcon,
                    {
                      backgroundColor: category.color,
                      opacity: selectedCategoryId && category.id !== 'ALL' && selectedCategoryId !== category.id ? 0.75 : 1,
                    },
                  ]}
                >
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
            <ThemedText style={styles.sectionTitle}>
              {selectedCategoryId ? 'Produits' : 'Produits en vedette'}
            </ThemedText>
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
                {product?.images?.[0] && /^https?:\/\//i.test(product.images[0]) ? (
                  <Image
                    source={{ uri: product.images[0] }}
                    style={{ width: '100%', height: 140, borderRadius: 8, marginBottom: 10 }}
                  />
                ) : (
                  <View style={styles.productImagePlaceholder}>
                    <IconSymbol name="photo" size={40} color={colors.placeholder} />
                  </View>
                )}
                <ThemedText style={styles.productName} numberOfLines={2}>
                  {product.name}
                </ThemedText>
                <ThemedText style={styles.productPrice}>{formatPrice(product)}</ThemedText>
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

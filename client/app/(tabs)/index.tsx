import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Platform,
  useWindowDimensions,
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

export default function BuyerHomeScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const colors = useThemeColors();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const [refreshing, setRefreshing] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; slug?: string }>>([]);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [topSales, setTopSales] = useState<any[]>([]);
  const [recommended, setRecommended] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [homeSearch, setHomeSearch] = useState('');

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
      const limit = isWeb ? 24 : 10;
      const [catRes, prodRes, topRes, recRes, dealsRes] = await Promise.all([
        apiService.get('/api/categories'),
        apiService.get(
          `/api/products?sortBy=newest&limit=${limit}${categoryId ? `&categoryId=${encodeURIComponent(categoryId)}` : ''}`
        ),
        apiService.get(`/api/products?sortBy=popular&limit=${isWeb ? 16 : 10}`),
        apiService.get(`/api/products?sortBy=rating&limit=${isWeb ? 16 : 10}`),
        apiService.get(`/api/deals?limit=${isWeb ? 16 : 10}`),
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

      if (topRes.success) {
        const data = (topRes.data as any) || {};
        const products = Array.isArray(data) ? data : data.products || [];
        setTopSales(products);
      }

      if (recRes.success) {
        const data = (recRes.data as any) || {};
        const products = Array.isArray(data) ? data : data.products || [];
        setRecommended(products);
      }

      if (dealsRes.success) {
        const data = (dealsRes.data as any) || [];
        setDeals(Array.isArray(data) ? data : data.deals || []);
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
    contentMaxWidth: {
      width: '100%',
      maxWidth: 1200,
      alignSelf: 'center',
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
    verificationPill: {
      marginTop: 10,
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      gap: 6,
      borderWidth: 1,
    },
    verificationPillOk: {
      backgroundColor: '#D4EDDA',
      borderColor: '#C3E6CB',
    },
    verificationPillWarn: {
      backgroundColor: '#FFF3CD',
      borderColor: '#FFEEBA',
    },
    verificationPillText: {
      fontSize: 12,
      fontWeight: '600',
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
    searchInput: {
      flex: 1,
      marginLeft: 10,
      color: colors.text,
      fontSize: 14,
      paddingVertical: 0,
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
    categoryCarousel: {
      paddingRight: 20,
      gap: 10,
    },
    categoryChip: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 999,
      gap: 8,
      minWidth: 110,
    },
    categoryChipIcon: {
      width: 26,
      height: 26,
      borderRadius: 13,
      justifyContent: 'center',
      alignItems: 'center',
    },
    categoryChipText: {
      fontSize: 13,
      color: colors.text,
      fontWeight: '600',
      maxWidth: 120,
    },
    productsContainer: {
      paddingRight: 20,
    },
    productsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
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
    productCardWeb: {
      width: Math.max(220, Math.floor((width - 40 - 16 * 3) / 4)),
      marginRight: 0,
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
    productCardInner: {
      position: 'relative',
    },
    badgePromo: {
      position: 'absolute',
      zIndex: 2,
      top: 8,
      left: 8,
      backgroundColor: '#FF6A00',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
    },
    badgePromoText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '800',
    },
    dealPriceRow: {
      marginTop: 8,
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 8,
    },
    dealNewPrice: {
      color: '#FF6A00',
      fontWeight: '800',
    },
    dealOldPrice: {
      color: colors.placeholder,
      textDecorationLine: 'line-through',
      fontSize: 12,
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

  const goToProducts = (opts?: { search?: string; categoryId?: string | null; sortBy?: string }) => {
    const search = (opts?.search ?? '').trim();
    const categoryId = opts?.categoryId ?? null;
    const sortBy = opts?.sortBy;
    router.push({
      pathname: '/products',
      params: {
        ...(search ? { search } : {}),
        ...(categoryId ? { categoryId } : {}),
        ...(sortBy ? { sortBy } : {}),
      },
    });
  };

  const renderProductCard = (product: any, extra?: { badgeText?: string }) => {
    const img = product?.images?.[0];
    const hasImg = img && /^https?:\/\//i.test(img);
    return (
      <View style={styles.productCardInner}>
        {extra?.badgeText ? (
          <View style={styles.badgePromo}>
            <ThemedText style={styles.badgePromoText}>{extra.badgeText}</ThemedText>
          </View>
        ) : null}
        {hasImg ? (
          <Image
            source={{ uri: img }}
            style={{ width: '100%', height: 160, borderRadius: 8, marginBottom: 10 }}
          />
        ) : (
          <View style={styles.productImagePlaceholder}>
            <IconSymbol name="photo" size={40} color={colors.placeholder} />
          </View>
        )}
        <ThemedText style={styles.productName} numberOfLines={2}>
          {product?.name}
        </ThemedText>
        <ThemedText style={styles.productPrice}>{formatPrice(product)}</ThemedText>
      </View>
    );
  };

  const renderProductsSection = (title: string, items: any[], opts?: { seeAllSortBy?: string }) => {
    if (!items || items.length === 0) return null;
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
          <TouchableOpacity onPress={() => goToProducts({ sortBy: opts?.seeAllSortBy })}>
            <ThemedText style={styles.seeAll}>Voir tout</ThemedText>
          </TouchableOpacity>
        </View>
        {isWeb ? (
          <View style={styles.productsGrid}>
            {items.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[styles.productCard, styles.productCardWeb]}
                onPress={() => router.push(`/product/${p.id}`)}
              >
                {renderProductCard(p)}
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productsContainer}>
            {items.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.productCard}
                onPress={() => router.push(`/product/${p.id}`)}
              >
                {renderProductCard(p)}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    );
  };

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
            {!!user && user.accountType === 'BUYER' && (
              <TouchableOpacity
                style={[
                  styles.verificationPill,
                  user.kycVerified ? styles.verificationPillOk : styles.verificationPillWarn,
                ]}
                onPress={() => router.push('/buyer/verification')}
              >
                <IconSymbol
                  name={user.kycVerified ? 'checkmark.shield.fill' : 'exclamationmark.triangle.fill'}
                  size={14}
                  color={user.kycVerified ? '#1B5E20' : '#7A5A00'}
                />
                <ThemedText
                  style={[
                    styles.verificationPillText,
                    { color: user.kycVerified ? '#1B5E20' : '#7A5A00' },
                  ]}
                >
                  {user.kycVerified ? 'Compte vérifié (KYC)' : 'Compte non vérifié: limites'}
                </ThemedText>
              </TouchableOpacity>
            )}
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

        <View style={styles.contentMaxWidth}>
        {/* Barre de recherche */}
        <View style={styles.searchBar}>
          <IconSymbol name="magnifyingglass" size={20} color={colors.placeholder} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher des produits..."
            placeholderTextColor={colors.placeholder}
            value={homeSearch}
            onChangeText={setHomeSearch}
            returnKeyType="search"
            onSubmitEditing={() => goToProducts({ search: homeSearch, categoryId: selectedCategoryId })}
          />
          <TouchableOpacity onPress={() => goToProducts({ search: homeSearch, categoryId: selectedCategoryId })}>
            <IconSymbol name="arrow.right.circle.fill" size={22} color={colors.tint} />
          </TouchableOpacity>
        </View>

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

        {/* Catégories (carousel) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Catégories</ThemedText>
            <TouchableOpacity onPress={() => goToProducts()}>
              <ThemedText style={styles.seeAll}>Voir tout</ThemedText>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryCarousel}>
            {uiCategories.map((category) => {
              const active =
                category.id === 'ALL'
                  ? !selectedCategoryId
                  : selectedCategoryId === category.id;
              return (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryChip,
                    active && { borderColor: colors.tint, backgroundColor: colors.tint + '18' },
                  ]}
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
                >
                  <View style={[styles.categoryChipIcon, { backgroundColor: category.color }]}>
                    <IconSymbol name={category.icon} size={16} color="#FFFFFF" />
                  </View>
                  <ThemedText style={styles.categoryChipText} numberOfLines={1}>
                    {category.name}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Top deals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Top deals</ThemedText>
            <TouchableOpacity onPress={() => router.push('/products')}>
              <ThemedText style={styles.seeAll}>Voir tout</ThemedText>
            </TouchableOpacity>
          </View>
          {deals?.length ? (
            isWeb ? (
              <View style={styles.productsGrid}>
                {deals.map((d: any) => (
                  <TouchableOpacity
                    key={d?.promotion?.id || d?.product?.id}
                    style={[styles.productCard, styles.productCardWeb]}
                    onPress={() => router.push(`/product/${d.product.id}`)}
                  >
                    {renderProductCard(d.product, { badgeText: d?.pricing?.discountLabel || 'Promo' })}
                    <View style={styles.dealPriceRow}>
                      <ThemedText style={styles.dealNewPrice}>
                        {Number(d?.pricing?.dealPrice || 0).toLocaleString('fr-FR')} {d?.pricing?.currency || 'XOF'}
                      </ThemedText>
                      <ThemedText style={styles.dealOldPrice}>
                        {Number(d?.pricing?.originalPrice || 0).toLocaleString('fr-FR')} {d?.pricing?.currency || 'XOF'}
                      </ThemedText>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productsContainer}>
                {deals.map((d: any) => (
                  <TouchableOpacity
                    key={d?.promotion?.id || d?.product?.id}
                    style={styles.productCard}
                    onPress={() => router.push(`/product/${d.product.id}`)}
                  >
                    {renderProductCard(d.product, { badgeText: d?.pricing?.discountLabel || 'Promo' })}
                    <View style={styles.dealPriceRow}>
                      <ThemedText style={styles.dealNewPrice}>
                        {Number(d?.pricing?.dealPrice || 0).toLocaleString('fr-FR')} {d?.pricing?.currency || 'XOF'}
                      </ThemedText>
                      <ThemedText style={styles.dealOldPrice}>
                        {Number(d?.pricing?.originalPrice || 0).toLocaleString('fr-FR')} {d?.pricing?.currency || 'XOF'}
                      </ThemedText>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )
          ) : (
            <ThemedText style={{ color: colors.placeholder }}>Aucune promotion active.</ThemedText>
          )}
        </View>

        {renderProductsSection('Top ventes', topSales, { seeAllSortBy: 'popular' })}
        {renderProductsSection('Recommandés', recommended, { seeAllSortBy: 'rating' })}

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
          {isWeb ? (
            <View style={styles.productsGrid}>
              {featuredProducts.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  style={[styles.productCard, styles.productCardWeb]}
                  onPress={() => router.push(`/product/${product.id}`)}
                >
                  {product?.images?.[0] && /^https?:\/\//i.test(product.images[0]) ? (
                    <Image
                      source={{ uri: product.images[0] }}
                      style={{ width: '100%', height: 160, borderRadius: 8, marginBottom: 10 }}
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
            </View>
          ) : (
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
          )}
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
        </View>
      </ScrollView>
    </ThemedView>
  );
}

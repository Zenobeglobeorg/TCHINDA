import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  FlatList,
  RefreshControl,
  Platform,
  StatusBar,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { sellerService, Product, ProductVariant } from '@/services/seller.service';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useAuth } from '@/hooks/useAuth';
import { apiService } from '@/services/api.service';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function ProductsManagement() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const params = useLocalSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [filters, setFilters] = useState({ status: '', search: '' });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isChanging, setIsChanging] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  useEffect(() => {
    if (params.action === 'create') {
      setShowModal(true);
    }
    loadProducts();
  }, [filters]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await sellerService.getProducts({
        ...filters,
        page: 1,
        limit: 20,
      });
      if (response.success && response.data) {
        const data = response.data as any;
        setProducts(data.products || []);
        setHasMore(data.pagination?.totalPages > 1);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
      Alert.alert('Erreur', 'Impossible de charger les produits');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  const handleSwitchToBuyer = async () => {
    Alert.alert(
      'Revenir en mode client',
      'Voulez-vous revenir en mode client (acheteur) ? Vous pourrez toujours revenir en mode vendeur plus tard.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              setIsChanging(true);
              const response = await apiService.post('/api/users/revert-to-buyer');

              if (response.success) {
                const data = response.data as any;
                if (data?.token) {
                  await apiService.setToken(data.token);
                }
                
                await refreshUser();
                await new Promise(resolve => setTimeout(resolve, 300));
                
                Alert.alert(
                  'Succès',
                  'Vous êtes maintenant en mode client',
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        router.replace('/(tabs)');
                      },
                    },
                  ]
                );
              } else {
                Alert.alert('Erreur', response.error?.message || 'Une erreur est survenue');
              }
            } catch (error: any) {
              Alert.alert('Erreur', error.message || 'Une erreur est survenue');
            } finally {
              setIsChanging(false);
            }
          },
        },
      ]
    );
  };

  const handleDelete = (productId: string) => {
    Alert.alert(
      'Supprimer le produit',
      'Êtes-vous sûr de vouloir supprimer ce produit ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await sellerService.deleteProduct(productId);
              if (response.success) {
                Alert.alert('Succès', 'Produit supprimé');
                loadProducts();
              }
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer le produit');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return '#4CAF50';
      case 'PENDING':
        return '#FF9800';
      case 'INACTIVE':
        return '#9E9E9E';
      case 'OUT_OF_STOCK':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Actif';
      case 'PENDING':
        return 'En attente';
      case 'INACTIVE':
        return 'Inactif';
      case 'OUT_OF_STOCK':
        return 'Rupture';
      default:
        return status;
    }
  };

  if (loading && products.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={tintColor} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <StatusBar barStyle="light-content" />
      {/* Header avec filtres */}
      <View style={[styles.header, { backgroundColor, paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 10 }]}>
        <View style={styles.headerTop}>
          <ThemedText type="title">Mes Produits</ThemedText>
          <TouchableOpacity
            style={[styles.switchButton, { backgroundColor: '#2196F3' + '20', borderColor: '#2196F3' }]}
            onPress={handleSwitchToBuyer}
            disabled={isChanging}
          >
            {isChanging ? (
              <ActivityIndicator size="small" color="#2196F3" />
            ) : (
              <>
                <IconSymbol name="person.fill" size={14} color="#2196F3" />
                <Text style={[styles.switchButtonText, { color: '#2196F3' }]}>Client</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.filterRow}>
          <TextInput
            style={[styles.searchInput, { backgroundColor, color: textColor, borderColor: tintColor }]}
            placeholder="Rechercher..."
            placeholderTextColor={textColor + '80'}
            value={filters.search}
            onChangeText={(text) => setFilters({ ...filters, search: text })}
          />
          <TouchableOpacity
            style={[styles.filterButton, { backgroundColor: tintColor }]}
            onPress={() => {
              Alert.alert(
                'Filtrer par statut',
                '',
                [
                  { text: 'Tous', onPress: () => setFilters({ ...filters, status: '' }) },
                  { text: 'Actifs', onPress: () => setFilters({ ...filters, status: 'ACTIVE' }) },
                  { text: 'En attente', onPress: () => setFilters({ ...filters, status: 'PENDING' }) },
                  { text: 'Rupture', onPress: () => setFilters({ ...filters, status: 'OUT_OF_STOCK' }) },
                  { text: 'Annuler', style: 'cancel' },
                ]
              );
            }}
          >
            <Text style={styles.filterButtonText}>Filtrer</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: tintColor }]}
          onPress={() => {
            setEditingProduct(null);
            setShowModal(true);
          }}
        >
          <Text style={styles.addButtonText}>+ Ajouter un produit</Text>
        </TouchableOpacity>
      </View>

      {/* Liste des produits */}
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <View style={[styles.productCard, { backgroundColor }]}>
            <Image
              source={
                item.images && item.images.length > 0
                  ? { uri: item.images[0] }
                  : require('@/assets/images/assets_images_logo.webp')
              }
              style={styles.productImage}
            />
            <View style={styles.productInfo}>
              <ThemedText type="subtitle" style={styles.productName}>
                {item.name}
              </ThemedText>
              <Text style={[styles.productPrice, { color: tintColor }]}>
                {item.price.toLocaleString()} {item.currency}
              </Text>
              <View style={styles.productMeta}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(item.status || 'INACTIVE') + '20' },
                  ]}
                >
                  <Text style={[styles.statusText, { color: getStatusColor(item.status || 'INACTIVE') }]}>
                    {getStatusLabel(item.status || 'INACTIVE')}
                  </Text>
                </View>
                <Text style={[styles.stockText, { color: textColor }]}>
                  Stock: {item.stock}
                </Text>
              </View>
              {item.variants && item.variants.length > 0 && (
                <Text style={[styles.variantText, { color: textColor }]}>
                  {item.variants.length} variante(s)
                </Text>
              )}
            </View>
            <View style={styles.productActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: tintColor + '20' }]}
                onPress={() => {
                  setEditingProduct(item);
                  setShowModal(true);
                }}
              >
                <Text style={[styles.actionButtonText, { color: tintColor }]}>Modifier</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#F4433620' }]}
                onPress={() => handleDelete(item.id)}
              >
                <Text style={[styles.actionButtonText, { color: '#F44336' }]}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: textColor }]}>Aucun produit trouvé</Text>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: tintColor }]}
              onPress={() => setShowModal(true)}
            >
              <Text style={styles.addButtonText}>Ajouter votre premier produit</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Modal d'ajout/édition */}
      {showModal && (
        <ProductFormModal
          visible={showModal}
          product={editingProduct}
          onClose={() => {
            setShowModal(false);
            setEditingProduct(null);
          }}
          onSave={() => {
            setShowModal(false);
            setEditingProduct(null);
            loadProducts();
          }}
        />
      )}
    </ThemedView>
  );
}

// Composant modal pour le formulaire de produit
function ProductFormModal({
  visible,
  product,
  onClose,
  onSave,
}: {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
  onSave: () => void;
}) {
  type CatalogCategory = { id: string; name: string; slug?: string };
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    shortDescription: '',
    price: 0,
    compareAtPrice: 0,
    currency: 'XOF',
    sku: '',
    stock: 0,
    minStock: 0,
    images: [],
    tags: [],
    variants: [],
  });
  const [saving, setSaving] = useState(false);
  const [showVariants, setShowVariants] = useState(false);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  useEffect(() => {
    if (product) {
      setFormData({
        ...product,
        variants: product.variants || [],
      });
      setShowVariants((product.variants?.length || 0) > 0);
    } else {
      setFormData({
        name: '',
        description: '',
        shortDescription: '',
        price: 0,
        compareAtPrice: 0,
        currency: 'XOF',
        sku: '',
        stock: 0,
        minStock: 0,
        images: [],
        tags: [],
        variants: [],
      });
      setShowVariants(false);
    }
  }, [product, visible]);

  useEffect(() => {
    if (!visible) return;
    (async () => {
      try {
        setLoadingCategories(true);
        const res = await apiService.get('/api/categories');
        if (res.success) {
          const data = (res.data as any) || [];
          setCategories(Array.isArray(data) ? data : data.categories || []);
        }
      } catch {
        // non bloquant
      } finally {
        setLoadingCategories(false);
      }
    })();
  }, [visible]);

  const handleSave = async () => {
    if (!formData.name || !formData.price) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setSaving(true);

      // Upload images locales vers Supabase (via backend) avant création/mise à jour
      const images = (formData.images || []) as any[];
      const remoteImages = images.filter((u) => typeof u === 'string' && /^https?:\/\//i.test(u));
      const localImages = images.filter((u) => typeof u === 'string' && !/^https?:\/\//i.test(u));

      let uploadedUrls: string[] = [];
      if (localImages.length > 0) {
        const fd = new FormData();
        for (let i = 0; i < localImages.length; i++) {
          const uri = localImages[i] as string;
          const filename = `product-${Date.now()}-${i}.jpg`;

          if (Platform.OS === 'web') {
            // Sur web, convertir l'URI en Blob
            const resp = await fetch(uri);
            const blob = await resp.blob();
            // @ts-ignore
            fd.append('files', blob, filename);
          } else {
            // Sur mobile, FormData supporte l'objet { uri, name, type }
            // @ts-ignore
            fd.append('files', { uri, name: filename, type: 'image/jpeg' });
          }
        }

        const uploadRes = await apiService.upload<{ urls: string[] }>('/api/seller/uploads/images', fd);
        if (!uploadRes.success) {
          throw new Error(uploadRes.error?.message || "Impossible d'uploader les images");
        }
        const data: any = uploadRes.data as any;
        uploadedUrls = data?.urls || data || [];
      }

      const payload: any = {
        ...formData,
        images: [...remoteImages, ...uploadedUrls],
      };

      if (product) {
        await sellerService.updateProduct(product.id, payload);
        Alert.alert('Succès', 'Produit mis à jour');
      } else {
        await sellerService.createProduct(payload as Product);
        Alert.alert('Succès', 'Produit créé');
      }
      onSave();
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de sauvegarder le produit');
    } finally {
      setSaving(false);
    }
  };

  const addVariant = () => {
    const newVariants: ProductVariant[] = [...(formData.variants || []), {
      name: '',
      price: formData.price || 0,
      stock: 0,
      minStock: 0,
    }];
    setFormData({ ...formData, variants: newVariants });
  };

  const updateVariant = (index: number, field: keyof ProductVariant, value: any) => {
    const variants = [...(formData.variants || [])];
    variants[index] = { ...variants[index], [field]: value };
    setFormData({ ...formData, variants });
  };

  const requestImagePickerPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
        Alert.alert(
          'Permissions requises',
          'Nous avons besoin de votre permission pour accéder à la caméra et à la galerie.'
        );
        return false;
      }
    }
    return true;
  };

  const handleWebFilePick = async () => {
    try {
      // React Native Web: utiliser un input file natif
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = true;

      input.onchange = () => {
        const files = Array.from(input.files || []);
        files.forEach((file) => {
          // Créer une URL locale pour prévisualisation + upload FormData
          const uri = URL.createObjectURL(file);
          addImageToProduct(uri);
        });
      };

      input.click();
    } catch (e) {
      Alert.alert('Erreur', "Impossible d'ouvrir le sélecteur de fichiers");
    }
  };

  const handleImagePick = async () => {
    if (Platform.OS === 'web') {
      await handleWebFilePick();
      return;
    }
    const hasPermission = await requestImagePickerPermissions();
    if (!hasPermission) return;

    Alert.alert(
      'Sélectionner une image',
      'Choisissez une option',
      [
        {
          text: 'Caméra',
          onPress: async () => {
            try {
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
              });

              if (!result.canceled && result.assets && result.assets[0]) {
                const imageUri = result.assets[0].uri;
                addImageToProduct(imageUri);
              }
            } catch (error) {
              Alert.alert('Erreur', 'Impossible d\'accéder à la caméra');
            }
          },
        },
        {
          text: 'Galerie',
          onPress: async () => {
            try {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
                allowsMultipleSelection: true,
              });

              if (!result.canceled && result.assets) {
                result.assets.forEach((asset: any) => {
                  if (asset.uri) {
                    addImageToProduct(asset.uri);
                  }
                });
              }
            } catch (error) {
              Alert.alert('Erreur', 'Impossible d\'accéder à la galerie');
            }
          },
        },
        {
          text: 'Annuler',
          style: 'cancel',
        },
      ]
    );
  };

  const addImageToProduct = (imageUri: string) => {
    const currentImages = formData.images || [];
    setFormData({
      ...formData,
      images: [...currentImages, imageUri],
    });
  };

  const removeImage = (index: number) => {
    const currentImages = formData.images || [];
    // Si web: libérer l'objectURL + supprimer le File associé
    if (Platform.OS === 'web') {
      const uri = currentImages[index];
      try {
        if (uri && typeof uri === 'string' && uri.startsWith('blob:')) {
          URL.revokeObjectURL(uri);
        }
      } catch {}
    }
    const newImages = currentImages.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      images: newImages,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <ThemedView style={styles.modalContainer}>
        <View style={[styles.modalHeader, { backgroundColor }]}>
          <ThemedText type="title">
            {product ? 'Modifier le produit' : 'Nouveau produit'}
          </ThemedText>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.closeButton, { color: tintColor }]}>Fermer</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: textColor }]}>Nom du produit *</Text>
            <TextInput
              style={[styles.input, { backgroundColor, color: textColor, borderColor: tintColor }]}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Nom du produit"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: textColor }]}>Images du produit</Text>
            <View style={styles.imageContainer}>
              {formData.images && formData.images.length > 0 && (
                <View style={styles.imageList}>
                  {formData.images.map((imageUri, index) => (
                    <View key={index} style={styles.imageItem}>
                      <Image source={{ uri: imageUri }} style={styles.previewImage} />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => removeImage(index)}
                      >
                        <IconSymbol name="xmark.circle.fill" size={24} color="#F44336" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
              <TouchableOpacity
                style={[styles.addImageButton, { backgroundColor: tintColor + '20', borderColor: tintColor }]}
                onPress={handleImagePick}
              >
                <IconSymbol name="camera.fill" size={24} color={tintColor} />
                <Text style={[styles.addImageButtonText, { color: tintColor }]}>
                  {formData.images && formData.images.length > 0 ? 'Ajouter une image' : 'Ajouter des images'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: textColor }]}>Description courte</Text>
            <TextInput
              style={[styles.input, { backgroundColor, color: textColor, borderColor: tintColor }]}
              value={formData.shortDescription}
              onChangeText={(text) => setFormData({ ...formData, shortDescription: text })}
              placeholder="Description courte"
              multiline
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: textColor }]}>Description complète</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor, color: textColor, borderColor: tintColor }]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Description détaillée"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: textColor }]}>Catégorie</Text>
            {loadingCategories ? (
              <ActivityIndicator color={tintColor} />
            ) : (
              <View style={[styles.pickerContainer, { borderColor: tintColor, backgroundColor }]}>
                <Picker
                  selectedValue={formData.categoryId || ''}
                  onValueChange={(value) =>
                    setFormData({ ...formData, categoryId: value ? String(value) : undefined })
                  }
                  style={{ color: textColor }}
                >
                  <Picker.Item label="Aucune catégorie" value="" />
                  {categories.map((c) => (
                    <Picker.Item key={c.id} label={c.name} value={c.id} />
                  ))}
                </Picker>
              </View>
            )}
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: textColor }]}>Prix *</Text>
              <TextInput
                style={[styles.input, { backgroundColor, color: textColor, borderColor: tintColor }]}
                value={formData.price?.toString()}
                onChangeText={(text) => setFormData({ ...formData, price: parseFloat(text) || 0 })}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: textColor }]}>Ancien prix</Text>
              <TextInput
                style={[styles.input, { backgroundColor, color: textColor, borderColor: tintColor }]}
                value={formData.compareAtPrice?.toString()}
                onChangeText={(text) => setFormData({ ...formData, compareAtPrice: parseFloat(text) || 0 })}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: textColor }]}>Stock *</Text>
              <TextInput
                style={[styles.input, { backgroundColor, color: textColor, borderColor: tintColor }]}
                value={formData.stock?.toString()}
                onChangeText={(text) => setFormData({ ...formData, stock: parseInt(text) || 0 })}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: textColor }]}>Stock minimum</Text>
              <TextInput
                style={[styles.input, { backgroundColor, color: textColor, borderColor: tintColor }]}
                value={formData.minStock?.toString()}
                onChangeText={(text) => setFormData({ ...formData, minStock: parseInt(text) || 0 })}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: textColor }]}>SKU</Text>
            <TextInput
              style={[styles.input, { backgroundColor, color: textColor, borderColor: tintColor }]}
              value={formData.sku}
              onChangeText={(text) => setFormData({ ...formData, sku: text })}
              placeholder="Code SKU"
            />
          </View>

          <TouchableOpacity
            style={[styles.toggleButton, { backgroundColor: tintColor + '20' }]}
            onPress={() => setShowVariants(!showVariants)}
          >
            <Text style={[styles.toggleButtonText, { color: tintColor }]}>
              {showVariants ? 'Masquer' : 'Afficher'} les variantes
            </Text>
          </TouchableOpacity>

          {showVariants && (
            <View style={styles.variantsSection}>
              <View style={styles.variantsHeader}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>Variantes</Text>
                <TouchableOpacity
                  style={[styles.addVariantButton, { backgroundColor: tintColor }]}
                  onPress={addVariant}
                >
                  <Text style={styles.addVariantButtonText}>+ Ajouter</Text>
                </TouchableOpacity>
              </View>
              {formData.variants?.map((variant, index) => (
                <View key={index} style={[styles.variantCard, { backgroundColor }]}>
                  <TextInput
                    style={[styles.input, { backgroundColor, color: textColor, borderColor: tintColor }]}
                    value={variant.name}
                    onChangeText={(text) => updateVariant(index, 'name', text)}
                    placeholder="Nom de la variante (ex: Rouge - L)"
                  />
                  <View style={styles.formRow}>
                    <View style={[styles.formGroup, { flex: 1 }]}>
                      <TextInput
                        style={[styles.input, { backgroundColor, color: textColor, borderColor: tintColor }]}
                        value={variant.price?.toString()}
                        onChangeText={(text) => updateVariant(index, 'price', parseFloat(text) || 0)}
                        keyboardType="numeric"
                        placeholder="Prix"
                      />
                    </View>
                    <View style={[styles.formGroup, { flex: 1 }]}>
                      <TextInput
                        style={[styles.input, { backgroundColor, color: textColor, borderColor: tintColor }]}
                        value={variant.stock?.toString()}
                        onChangeText={(text) => updateVariant(index, 'stock', parseInt(text) || 0)}
                        keyboardType="numeric"
                        placeholder="Stock"
                      />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: tintColor }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>
                {product ? 'Mettre à jour' : 'Créer le produit'}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    gap: 5,
  },
  switchButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  filterButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  addButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  productCard: {
    flexDirection: 'row',
    padding: 15,
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  stockText: {
    fontSize: 12,
  },
  variantText: {
    fontSize: 11,
    marginTop: 4,
    fontStyle: 'italic',
  },
  productActions: {
    gap: 8,
    justifyContent: 'center',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 20,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  closeButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  toggleButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  variantsSection: {
    marginBottom: 20,
  },
  variantsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  addVariantButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addVariantButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  variantCard: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  saveButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  imageContainer: {
    marginTop: 10,
  },
  imageList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 15,
  },
  imageItem: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 2,
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    gap: 10,
  },
  addImageButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

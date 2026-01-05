import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';
import { apiService } from '@/services/api.service';
import { alert } from '@/utils/alert';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
  isActive: boolean;
  children?: Category[];
  productCount?: number;
}

export default function CategoriesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentId: '',
  });

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      // TODO: Remplacer par l'endpoint réel /api/admin/categories
      // const response = await apiService.get('/api/admin/categories');
      // Pour l'instant, utiliser des données mockées
      const mockCategories: Category[] = [
        { id: '1', name: 'Électronique', slug: 'electronique', isActive: true, productCount: 45 },
        { id: '2', name: 'Vêtements', slug: 'vetements', isActive: true, productCount: 123 },
        { id: '3', name: 'Alimentaire', slug: 'alimentaire', isActive: true, productCount: 67 },
        { id: '4', name: 'Maison & Jardin', slug: 'maison-jardin', isActive: true, productCount: 89 },
      ];
      setCategories(mockCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
      alert('Erreur', 'Impossible de charger les catégories');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCategories();
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '', parentId: '' });
    setShowAddModal(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      parentId: category.parentId || '',
    });
    setShowAddModal(true);
  };

  const handleSaveCategory = async () => {
    if (!formData.name.trim()) {
      alert('Erreur', 'Le nom de la catégorie est requis');
      return;
    }

    try {
      // TODO: Implémenter l'appel API réel
      // if (editingCategory) {
      //   await apiService.put(`/api/admin/categories/${editingCategory.id}`, formData);
      // } else {
      //   await apiService.post('/api/admin/categories', formData);
      // }
      alert('Succès', editingCategory ? 'Catégorie mise à jour' : 'Catégorie créée');
      setShowAddModal(false);
      loadCategories();
    } catch (error: any) {
      alert('Erreur', error.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleDeleteCategory = (category: Category) => {
    alert(
      'Confirmation',
      `Êtes-vous sûr de vouloir supprimer la catégorie "${category.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Implémenter l'appel API réel
              // await apiService.delete(`/api/admin/categories/${category.id}`);
              alert('Succès', 'Catégorie supprimée');
              loadCategories();
            } catch (error: any) {
              alert('Erreur', error.message || 'Erreur lors de la suppression');
            }
          },
        },
      ]
    );
  };

  const handleToggleActive = async (category: Category) => {
    try {
      // TODO: Implémenter l'appel API réel
      // await apiService.patch(`/api/admin/categories/${category.id}/toggle-active`, {
      //   isActive: !category.isActive,
      // });
      alert('Succès', `Catégorie ${!category.isActive ? 'activée' : 'désactivée'}`);
      loadCategories();
    } catch (error: any) {
      alert('Erreur', error.message || 'Erreur lors de la mise à jour');
    }
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && categories.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.header, { backgroundColor }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.right" size={24} color={textColor} />
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { color: textColor }]}>Catégories</ThemedText>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.right" size={24} color={textColor} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: textColor }]}>Gestion des catégories</ThemedText>
        <TouchableOpacity
          onPress={handleAddCategory}
          style={[styles.addButton, { backgroundColor: tintColor }]}
        >
          <IconSymbol name="plus" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor }]}>
        <IconSymbol name="magnifyingglass" size={20} color={textColor + '60'} />
        <TextInput
          style={[styles.searchInput, { color: textColor }]}
          placeholder="Rechercher une catégorie..."
          placeholderTextColor={textColor + '60'}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <IconSymbol name="xmark.circle.fill" size={20} color={textColor + '60'} />
          </TouchableOpacity>
        )}
      </View>

      {/* Categories List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filteredCategories.map((category) => (
          <View key={category.id} style={[styles.categoryCard, { backgroundColor }]}>
            <View style={styles.categoryInfo}>
              <View style={styles.categoryHeader}>
                <View style={[styles.categoryIcon, { backgroundColor: tintColor + '20' }]}>
                  <IconSymbol name="folder.fill" size={24} color={tintColor} />
                </View>
                <View style={styles.categoryDetails}>
                  <ThemedText style={[styles.categoryName, { color: textColor }]}>
                    {category.name}
                  </ThemedText>
                  {category.description && (
                    <ThemedText style={[styles.categoryDescription, { color: textColor + '80' }]}>
                      {category.description}
                    </ThemedText>
                  )}
                  <View style={styles.categoryMeta}>
                    <ThemedText style={[styles.categoryMetaText, { color: textColor + '60' }]}>
                      {category.productCount || 0} produits
                    </ThemedText>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: category.isActive ? '#4CAF5020' : '#9E9E9E20',
                        },
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.statusText,
                          { color: category.isActive ? '#4CAF50' : '#9E9E9E' },
                        ]}
                      >
                        {category.isActive ? 'Actif' : 'Inactif'}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              </View>
            </View>
            <View style={styles.categoryActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: tintColor + '20' }]}
                onPress={() => handleEditCategory(category)}
              >
                <IconSymbol name="pencil" size={18} color={tintColor} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: category.isActive ? '#FF980020' : '#4CAF5020' },
                ]}
                onPress={() => handleToggleActive(category)}
              >
                <IconSymbol
                  name={category.isActive ? 'eye.slash.fill' : 'eye.fill'}
                  size={18}
                  color={category.isActive ? '#FF9800' : '#4CAF50'}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#F4433620' }]}
                onPress={() => handleDeleteCategory(category)}
              >
                <IconSymbol name="trash.fill" size={18} color="#F44336" />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {filteredCategories.length === 0 && (
          <View style={styles.emptyContainer}>
            <IconSymbol name="folder" size={64} color={textColor + '40'} />
            <ThemedText style={[styles.emptyText, { color: textColor + '60' }]}>
              Aucune catégorie trouvée
            </ThemedText>
          </View>
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: textColor }]}>
                {editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
              </ThemedText>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <IconSymbol name="xmark.circle.fill" size={28} color={textColor} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <ThemedText style={[styles.label, { color: textColor }]}>Nom *</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor, color: textColor, borderColor: tintColor + '40' }]}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="Nom de la catégorie"
                  placeholderTextColor={textColor + '60'}
                />
              </View>

              <View style={styles.formGroup}>
                <ThemedText style={[styles.label, { color: textColor }]}>Description</ThemedText>
                <TextInput
                  style={[
                    styles.textArea,
                    { backgroundColor, color: textColor, borderColor: tintColor + '40' },
                  ]}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="Description de la catégorie"
                  placeholderTextColor={textColor + '60'}
                  multiline
                  numberOfLines={4}
                />
              </View>

              {/* TODO: Ajouter sélecteur de catégorie parente */}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#9E9E9E' }]}
                onPress={() => setShowAddModal(false)}
              >
                <ThemedText style={styles.modalButtonText}>Annuler</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: tintColor }]}
                onPress={handleSaveCategory}
              >
                <ThemedText style={styles.modalButtonText}>
                  {editingCategory ? 'Enregistrer' : 'Créer'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    padding: 4,
    transform: [{ rotate: '180deg' }],
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  categoryCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryDetails: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  categoryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryMetaText: {
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalBody: {
    paddingHorizontal: 20,
    maxHeight: 400,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});


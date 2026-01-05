import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';
import { alert } from '@/utils/alert';

export default function SupportScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  const categories = [
    { id: 'all', label: 'Toutes', icon: 'list.bullet' },
    { id: 'pending', label: 'En attente', icon: 'clock.fill', count: 5 },
    { id: 'open', label: 'Ouvertes', icon: 'envelope.open.fill', count: 12 },
    { id: 'resolved', label: 'Résolues', icon: 'checkmark.circle.fill', count: 48 },
  ];

  const tickets = [
    {
      id: '1',
      title: 'Problème de paiement',
      user: 'user@example.com',
      category: 'Paiement',
      status: 'open',
      date: new Date(),
      priority: 'high',
    },
    {
      id: '2',
      title: 'Question sur la livraison',
      user: 'buyer@example.com',
      category: 'Livraison',
      status: 'pending',
      date: new Date(Date.now() - 3600000),
      priority: 'medium',
    },
    {
      id: '3',
      title: 'Problème de connexion',
      user: 'seller@example.com',
      category: 'Technique',
      status: 'resolved',
      date: new Date(Date.now() - 86400000),
      priority: 'low',
    },
  ];

  const getPriorityColor = (priority: string) => {
    const colors: { [key: string]: string } = {
      high: '#DC3545',
      medium: '#FFC107',
      low: '#28A745',
    };
    return colors[priority] || '#666';
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      open: '#3498DB',
      pending: '#FFC107',
      resolved: '#28A745',
    };
    return colors[status] || '#666';
  };

  const renderTicket = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.ticketCard, { backgroundColor }]}
      onPress={() => alert('Ticket', `Détails du ticket: ${item.title}`)}
    >
      <View style={styles.ticketHeader}>
        <View style={styles.ticketInfo}>
          <ThemedText style={[styles.ticketTitle, { color: textColor }]} numberOfLines={1}>
            {item.title}
          </ThemedText>
          <ThemedText style={[styles.ticketUser, { color: textColor + '80' }]}>
            {item.user}
          </ThemedText>
        </View>
        <View
          style={[
            styles.priorityBadge,
            { backgroundColor: getPriorityColor(item.priority) + '20' },
          ]}
        >
          <ThemedText
            style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}
          >
            {item.priority === 'high' ? 'Urgent' : item.priority === 'medium' ? 'Moyen' : 'Faible'}
          </ThemedText>
        </View>
      </View>
      <View style={styles.ticketMeta}>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) + '20' },
          ]}
        >
          <ThemedText
            style={[styles.statusText, { color: getStatusColor(item.status) }]}
          >
            {item.status === 'open' ? 'Ouvert' : item.status === 'pending' ? 'En attente' : 'Résolu'}
          </ThemedText>
        </View>
        <ThemedText style={[styles.ticketCategory, { color: textColor + '60' }]}>
          {item.category}
        </ThemedText>
        <ThemedText style={[styles.ticketDate, { color: textColor + '60' }]}>
          {item.date.toLocaleDateString('fr-FR')}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.right" size={24} color={textColor} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: textColor }]}>Support</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor }]}>
        <View style={[styles.searchBox, { backgroundColor: backgroundColor, borderColor: textColor + '30' }]}>
          <IconSymbol name="magnifyingglass" size={20} color={textColor + '60'} />
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder="Rechercher un ticket..."
            placeholderTextColor={textColor + '60'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              selectedCategory === category.id && [
                styles.categoryButtonActive,
                { backgroundColor: tintColor },
              ],
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <IconSymbol
              name={category.icon as any}
              size={20}
              color={selectedCategory === category.id ? '#FFF' : textColor}
            />
            <ThemedText
              style={[
                styles.categoryLabel,
                { color: selectedCategory === category.id ? '#FFF' : textColor },
              ]}
            >
              {category.label}
            </ThemedText>
            {category.count && (
              <View
                style={[
                  styles.categoryBadge,
                  { backgroundColor: selectedCategory === category.id ? '#FFF' : tintColor },
                ]}
              >
                <ThemedText
                  style={[
                    styles.categoryBadgeText,
                    { color: selectedCategory === category.id ? tintColor : '#FFF' },
                  ]}
                >
                  {category.count}
                </ThemedText>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tickets List */}
      <FlatList
        data={tickets}
        keyExtractor={(item) => item.id}
        renderItem={renderTicket}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconSymbol name="ticket" size={64} color={textColor + '40'} />
            <ThemedText style={[styles.emptyText, { color: textColor + '60' }]}>
              Aucun ticket trouvé
            </ThemedText>
          </View>
        }
      />
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
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  categoriesContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  categoriesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
    gap: 8,
    marginRight: 8,
  },
  categoryButtonActive: {
    borderColor: 'transparent',
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  ticketCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  ticketInfo: {
    flex: 1,
    marginRight: 12,
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  ticketUser: {
    fontSize: 14,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  ticketMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  ticketCategory: {
    fontSize: 12,
  },
  ticketDate: {
    fontSize: 12,
    marginLeft: 'auto',
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
});



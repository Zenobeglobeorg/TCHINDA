import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  Platform,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web' || width > 768;

export default function TrainingScreen() {
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');
  const successColor = useThemeColor({}, 'success');

  const [completedCourses, setCompletedCourses] = useState<string[]>(['1']);

  const courses = [
    {
      id: '1',
      title: 'Introduction aux Outils Financiers',
      description: 'Découvrez les bases des outils financiers de la plateforme',
      duration: '30 min',
      completed: true,
      icon: 'doc.text.fill',
    },
    {
      id: '2',
      title: 'Conformité et KYC',
      description: 'Apprenez les procédures de vérification d\'identité',
      duration: '45 min',
      completed: false,
      icon: 'checkmark.shield.fill',
    },
    {
      id: '3',
      title: 'Gestion des Transactions',
      description: 'Maîtrisez le traitement des dépôts et retraits',
      duration: '60 min',
      completed: false,
      icon: 'arrow.left.arrow.right',
    },
    {
      id: '4',
      title: 'Détection et Prévention de la Fraude',
      description: 'Techniques pour identifier et prévenir les fraudes',
      duration: '45 min',
      completed: false,
      icon: 'exclamationmark.triangle.fill',
    },
    {
      id: '5',
      title: 'Support Client Avancé',
      description: 'Meilleures pratiques pour l\'assistance client',
      duration: '30 min',
      completed: false,
      icon: 'info.circle.fill',
    },
  ];

  const handleStartCourse = (courseId: string) => {
    // Logique pour démarrer un cours
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <View style={[styles.header, { backgroundColor: tintColor }]}>
        <ThemedText style={[styles.headerTitle, { color: '#FFFFFF' }]}>
          Formation Continue
        </ThemedText>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ padding: isWeb ? 20 : 15 }}
      >
        <ThemedView style={[styles.card, { backgroundColor: cardColor }]}>
          <ThemedText type="subtitle" style={[styles.cardTitle, { color: tintColor }]}>
            Progression Globale
          </ThemedText>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${(completedCourses.length / courses.length) * 100}%`,
                    backgroundColor: successColor,
                  },
                ]}
              />
            </View>
            <ThemedText style={[styles.progressText, { color: textColor }]}>
              {completedCourses.length} / {courses.length} cours complétés
            </ThemedText>
          </View>
        </ThemedView>

        <ThemedView style={[styles.card, { backgroundColor: cardColor }]}>
          <ThemedText type="subtitle" style={[styles.cardTitle, { color: tintColor }]}>
            Cours Disponibles
          </ThemedText>

          {courses.map((course) => (
            <View
              key={course.id}
              style={[styles.courseItem, { borderBottomColor: borderColor }]}
            >
              <View style={styles.courseIcon}>
                <IconSymbol name={course.icon as any} size={32} color={tintColor} />
              </View>
              <View style={styles.courseContent}>
                <View style={styles.courseHeader}>
                  <ThemedText style={[styles.courseTitle, { color: textColor }]}>
                    {course.title}
                  </ThemedText>
                  {course.completed && (
                    <View style={[styles.completedBadge, { backgroundColor: successColor }]}>
                      <IconSymbol name="checkmark.circle.fill" size={16} color="#FFFFFF" />
                      <ThemedText style={styles.completedText}>Terminé</ThemedText>
                    </View>
                  )}
                </View>
                <ThemedText style={[styles.courseDescription, { color: textColor, opacity: 0.7 }]}>
                  {course.description}
                </ThemedText>
                <ThemedText style={[styles.courseDuration, { color: textColor, opacity: 0.6 }]}>
                  Durée: {course.duration}
                </ThemedText>
              </View>
              <TouchableOpacity
                style={[
                  styles.startButton,
                  {
                    backgroundColor: course.completed ? borderColor : tintColor,
                  },
                ]}
                onPress={() => handleStartCourse(course.id)}
                disabled={course.completed}
              >
                <ThemedText
                  style={[
                    styles.startButtonText,
                    { color: course.completed ? textColor : '#FFFFFF' },
                  ]}
                >
                  {course.completed ? 'Réviser' : 'Commencer'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          ))}
        </ThemedView>

        <ThemedView style={[styles.card, { backgroundColor: cardColor }]}>
          <ThemedText type="subtitle" style={[styles.cardTitle, { color: tintColor }]}>
            Informations
          </ThemedText>
          <ThemedText style={[styles.infoText, { color: textColor }]}>
            • Formation obligatoire pour tous les agents commerciaux{'\n'}
            • Mise à jour continue des contenus{'\n'}
            • Certificats de complétion disponibles{'\n'}
            • Supervision par les administrateurs
          </ThemedText>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 15,
    elevation: 3,
    ...(Platform.OS === 'web' && {
      // @ts-ignore
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }),
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  card: {
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  progressContainer: {
    marginTop: 10,
  },
  progressBar: {
    height: 10,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressText: {
    fontSize: 14,
    textAlign: 'center',
  },
  courseItem: {
    flexDirection: 'row',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  courseIcon: {
    marginRight: 15,
    justifyContent: 'center',
  },
  courseContent: {
    flex: 1,
  },
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  completedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  courseDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  courseDuration: {
    fontSize: 12,
  },
  startButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    marginLeft: 10,
  },
  startButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 24,
  },
});

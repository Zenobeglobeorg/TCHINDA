# Guide d'application du thème (Dark Mode)

Ce guide explique comment appliquer le thème dynamique à toutes les pages de l'application.

## Pattern à suivre

1. **Importer les hooks et constantes nécessaires** :
```typescript
import { useThemeColors } from '@/hooks/useThemeColors';
import { Colors } from '@/constants/Colors';
```

2. **Utiliser le hook dans le composant** :
```typescript
const colors = useThemeColors();
```

3. **Créer les styles dynamiquement avec useMemo** :
```typescript
const styles = useMemo(() => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background, // Au lieu de '#FFFFFF'
  },
  text: {
    color: colors.text, // Au lieu de '#333'
  },
  // ... autres styles
}), [colors]);
```

## Couleurs disponibles

- `colors.background` - Couleur de fond principale
- `colors.card` - Couleur pour les cartes
- `colors.text` - Couleur du texte principal
- `colors.placeholder` - Couleur pour les placeholders
- `colors.border` - Couleur des bordures
- `colors.tint` - Couleur d'accentuation (violet)
- `colors.section` - Couleur de fond pour les sections
- `colors.sectionBackground` - Couleur de fond pour les sections avec transparence
- `colors.error` - Couleur pour les erreurs
- `colors.success` - Couleur pour les succès
- `colors.warning` - Couleur pour les avertissements
- `colors.info` - Couleur pour les informations

## Exemple complet

```typescript
import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Colors } from '@/constants/Colors';

export default function MyScreen() {
  const colors = useThemeColors();
  
  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
    },
    text: {
      color: colors.text,
      fontSize: 16,
    },
  }), [colors]);

  return (
    <ThemedView style={styles.container}>
      {/* Contenu */}
    </ThemedView>
  );
}
```



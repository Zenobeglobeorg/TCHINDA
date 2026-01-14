# 🌓 Système de Thème - Documentation

## Vue d'ensemble

Le système de thème a été amélioré pour :
- ✅ Détecter automatiquement le thème système du navigateur
- ✅ Permettre de changer le thème manuellement via les paramètres
- ✅ Appliquer correctement les couleurs sombres/claires sur web et mobile
- ✅ Sauvegarder les préférences utilisateur

## Architecture

### 1. ThemeContext (`contexts/ThemeContext.tsx`)

Le contexte gère :
- **themeMode** : `'light' | 'dark' | 'auto'` - Le mode choisi par l'utilisateur
- **colorScheme** : `'light' | 'dark'` - Le thème effectif actuel
- **setThemeMode** : Fonction pour changer le mode

**Détection du thème système :**
- Sur **mobile** : Utilise `useColorScheme()` de React Native
- Sur **web** : Détecte via `window.matchMedia('(prefers-color-scheme: dark)')`
- Écoute les changements en temps réel

**Logique de détermination :**
```typescript
if (themeMode === 'auto') {
  // Utiliser le thème système (navigateur ou OS)
  return systemColorScheme;
} else {
  // Utiliser le mode choisi manuellement
  return themeMode;
}
```

### 2. WebThemeProvider (`components/WebThemeProvider.tsx`)

Applique dynamiquement le thème sur le web :
- Met à jour `document.documentElement.style.colorScheme`
- Change les couleurs de fond et texte
- Ajoute des classes CSS pour le thème
- Met à jour les styles des inputs et autres éléments

**Couleurs appliquées :**
- **Thème clair** : Fond `#FFFFFF`, Texte `#11181C`
- **Thème sombre** : Fond `#121212`, Texte `#ECEDEE`

### 3. Colors (`constants/Colors.ts`)

Définit toutes les couleurs pour les deux thèmes :
- `Colors.light` : Couleurs pour le thème clair
- `Colors.dark` : Couleurs pour le thème sombre

**Utilisation :**
```typescript
import { useThemeColors } from '@/hooks/useThemeColors';

const colors = useThemeColors(); // Retourne Colors.light ou Colors.dark selon le thème actuel
```

## Utilisation dans les composants

### Hook useTheme

```typescript
import { useTheme } from '@/contexts/ThemeContext';

const { themeMode, colorScheme, setThemeMode } = useTheme();
```

### Hook useThemeColors

```typescript
import { useThemeColors } from '@/hooks/useThemeColors';

const colors = useThemeColors();
// colors.text, colors.background, colors.tint, etc.
```

## Page Settings (`app/(tabs)/settings.tsx`)

La page de paramètres permet de :
1. **Voir l'état actuel** : Affiche si le thème sombre est activé
2. **Switch rapide** : Toggle pour activer/désactiver le mode sombre
3. **Options détaillées** : 3 boutons pour choisir :
   - ☀️ **Clair** : Force le thème clair
   - 🌙 **Sombre** : Force le thème sombre
   - ⚙️ **Auto** : Suit le thème système

**Comportement du Switch :**
- Si activé → Mode sombre forcé
- Si désactivé → Mode clair forcé
- Le mode "Auto" peut être sélectionné via les boutons

## Fonctionnalités

### ✅ Détection automatique
- Détecte le thème du navigateur au chargement
- Écoute les changements en temps réel
- Fonctionne sur web et mobile

### ✅ Contrôle manuel
- L'utilisateur peut forcer un thème spécifique
- Les préférences sont sauvegardées dans AsyncStorage
- Persiste entre les sessions

### ✅ Application dynamique
- Les couleurs changent instantanément
- Pas de rechargement nécessaire
- Styles CSS mis à jour automatiquement sur web

## Test

### Sur Web
1. Ouvrir l'application dans le navigateur
2. Aller dans **Paramètres**
3. Tester le switch et les boutons de thème
4. Vérifier que les couleurs changent correctement
5. Changer le thème du navigateur → Vérifier que "Auto" suit le changement

### Sur Mobile
1. Ouvrir l'application
2. Aller dans **Paramètres**
3. Tester le switch et les boutons
4. Changer le thème système de l'appareil → Vérifier que "Auto" suit

## Notes importantes

- ⚠️ Le thème est sauvegardé localement (AsyncStorage)
- ⚠️ Chaque utilisateur a ses propres préférences
- ⚠️ Le mode "Auto" suit le thème système, pas les préférences de l'app
- ✅ Les couleurs sont optimisées pour la lisibilité dans les deux modes


# 🔧 Correction du Conflit de Dépendances

## Problème Identifié

Conflit de peer dependencies lors de la mise à jour vers Expo SDK 54 :
- `@types/react@19.0.14` installé
- `react-native@0.81.5` requiert `@types/react@^19.1.0`

## ✅ Solution

### Option 1 : Installation avec --legacy-peer-deps (Recommandé)

```bash
cd client
npm install --legacy-peer-deps
```

Cette option ignore les conflits de peer dependencies et installe les packages.

### Option 2 : Mettre à jour @types/react manuellement

J'ai déjà mis à jour `@types/react` dans `package.json` à `~19.1.10`. Exécutez :

```bash
cd client
npm install
```

Si cela ne fonctionne toujours pas, utilisez :

```bash
npm install --legacy-peer-deps
```

### Option 3 : Nettoyer et réinstaller

```bash
cd client

# Supprimer node_modules et package-lock.json
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json

# Réinstaller avec legacy-peer-deps
npm install --legacy-peer-deps
```

## 📝 Commandes Complètes

```bash
cd client

# Nettoyer
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue

# Installer avec legacy-peer-deps
npm install --legacy-peer-deps

# Vérifier que tout est installé
npx expo install --fix

# Démarrer
npx expo start --clear
```

## ⚠️ Note

Le flag `--legacy-peer-deps` est souvent nécessaire lors des mises à jour majeures d'Expo car certaines dépendances peuvent avoir des conflits mineurs qui n'affectent pas réellement le fonctionnement de l'application.

## 🎯 Après l'Installation

Une fois les dépendances installées :

1. **Vérifier les versions** :
```bash
npx expo install --check
```

2. **Démarrer l'application** :
```bash
npx expo start --clear
```

3. **Tester sur votre appareil** avec Expo Go SDK 54


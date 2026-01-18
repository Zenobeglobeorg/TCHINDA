# 📦 Guide de Mise à Niveau vers Expo SDK 54

Ce guide vous permet de passer de SDK 53 à SDK 54 pour utiliser Expo Go.

Référence officielle : https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/

## ⚠️ Prérequis

1. Assurez-vous d'être dans le dossier `client`
2. Fermez Expo Go ou le serveur de développement s'il est en cours d'exécution
3. Sauvegardez votre travail (commit Git recommandé)

## 📋 Étapes de Mise à Niveau

### Étape 1 : Installer Expo SDK 54

```bash
cd client
npm install expo@^54.0.0
```

### Étape 2 : Mettre à Jour Toutes les Dépendances

Cette commande met automatiquement à jour toutes les dépendances Expo pour correspondre à SDK 54 :

```bash
npx expo install --fix
```

### Étape 3 : Vérifier les Problèmes

Vérifiez les problèmes potentiels avec :

```bash
npx expo-doctor
```

### Étape 4 : Nettoyer le Cache (Recommandé)

Pour éviter les problèmes de cache :

```bash
npx expo start --clear
```

## 🔍 Notes de Version SDK 54

Consultez les notes de version pour les changements importants :
- https://expo.dev/changelog/2025/01-07-sdk-54/

## ✅ Vérification

Après la mise à niveau :

1. Vérifiez que `package.json` contient `"expo": "~54.0.0"`
2. Démarrez le serveur : `npx expo start --clear`
3. Ouvrez Expo Go et scannez le QR code
4. Vérifiez que l'application fonctionne correctement

## 🐛 Problèmes Courants

### Si `npx expo install --fix` échoue

Essayez de mettre à jour manuellement les packages problématiques :
```bash
npx expo install [nom-du-package]@latest
```

### Si Expo Go ne fonctionne toujours pas

1. Désinstallez et réinstallez Expo Go sur votre appareil
2. Vérifiez que vous utilisez la dernière version d'Expo Go (SDK 54)

### Si des erreurs de dépendances persistent

```bash
# Supprimer node_modules et package-lock.json
rm -rf node_modules package-lock.json

# Réinstaller les dépendances
npm install

# Réessayer la mise à jour
npx expo install --fix
```

## 📝 Commandes Complètes (Copier-Coller)

Pour PowerShell :
```powershell
cd client
npm install expo@^54.0.0
npx expo install --fix
npx expo-doctor
npx expo start --clear
```

Pour Bash/Linux/Mac :
```bash
cd client && npm install expo@^54.0.0 && npx expo install --fix && npx expo-doctor && npx expo start --clear
```


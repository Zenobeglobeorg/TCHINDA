# Guide de Test en Local - TCHINDA Market

Ce guide vous explique comment tester l'application TCHINDA Market avec le backend en local, sur téléphone et web.

## 📋 Prérequis

1. **Backend démarré** : Le serveur Node.js doit être en cours d'exécution sur le port 5000
2. **Base de données** : PostgreSQL doit être configurée et accessible
3. **Expo CLI** : Installé globalement (`npm install -g expo-cli`)

## 🚀 Démarrage du Backend

### 1. Démarrer le serveur backend

```bash
cd server
npm install
npm run dev
```

Le serveur devrait démarrer sur `http://localhost:5000`

### 2. Vérifier que le backend fonctionne

Ouvrez votre navigateur et allez sur : `http://localhost:5000/api/health` (si cette route existe)

Ou testez avec curl :
```bash
curl http://localhost:5000/api/auth/register
```

## 📱 Tester sur Téléphone (Appareil Physique)

### Option 1 : Utiliser votre IP locale (Recommandé)

1. **Trouver votre IP locale** :
   - **Windows** : Ouvrez PowerShell et tapez `ipconfig`. Cherchez "IPv4 Address" (ex: 192.168.1.100)
   - **Mac/Linux** : Ouvrez Terminal et tapez `ifconfig` ou `ip addr`. Cherchez votre IP locale

2. **Modifier la configuration** :
   - Ouvrez `client/constants/config.ts`
   - Pour Android, modifiez la ligne :
     ```typescript
     return 'http://192.168.1.100:5000'; // Remplacez par votre IP
     ```
   - Pour iOS, modifiez la ligne :
     ```typescript
     return 'http://192.168.1.100:5000'; // Remplacez par votre IP
     ```

3. **Vérifier le firewall** :
   - Assurez-vous que le port 5000 n'est pas bloqué par votre firewall
   - Sur Windows, autorisez Node.js dans le pare-feu Windows

4. **Démarrer Expo** :
   ```bash
   cd client
   npm start
   ```

5. **Scanner le QR code** avec l'application Expo Go sur votre téléphone

6. **Vérifier la connexion** :
   - Assurez-vous que votre téléphone et votre ordinateur sont sur le même réseau Wi-Fi
   - Testez l'inscription/connexion dans l'application

### Option 2 : Utiliser ngrok (Alternative)

Si vous ne pouvez pas utiliser votre IP locale, vous pouvez utiliser ngrok pour créer un tunnel :

1. **Installer ngrok** : https://ngrok.com/download

2. **Créer un tunnel** :
   ```bash
   ngrok http 5000
   ```

3. **Copier l'URL HTTPS** fournie par ngrok (ex: `https://abc123.ngrok.io`)

4. **Modifier la configuration** :
   - Ouvrez `client/constants/config.ts`
   - Remplacez `BASE_URL` par l'URL ngrok :
     ```typescript
     BASE_URL: __DEV__ ? 'https://abc123.ngrok.io' : 'https://api.tchinda.com',
     ```

## 🌐 Tester sur Web (Navigateur)

1. **Démarrer Expo** :
   ```bash
   cd client
   npm start
   ```

2. **Ouvrir dans le navigateur** :
   - Appuyez sur `w` dans le terminal Expo
   - Ou ouvrez `http://localhost:8081` dans votre navigateur

3. **La configuration est automatique** :
   - Pour le web, l'application utilise automatiquement `http://localhost:5000`
   - Pas besoin de modifier la configuration

## 🔧 Configuration Automatique

L'application détecte automatiquement la plateforme :

- **Web** : Utilise `http://localhost:5000`
- **Android Emulator** : Utilise `http://10.0.2.2:5000`
- **iOS Simulator** : Utilise `http://localhost:5000`
- **Appareil physique** : Nécessite votre IP locale (voir Option 1 ci-dessus)

## 🐛 Résolution de Problèmes

### Problème : "Network request failed" sur téléphone

**Solutions** :
1. Vérifiez que votre téléphone et ordinateur sont sur le même réseau Wi-Fi
2. Vérifiez que le backend est bien démarré sur le port 5000
3. Vérifiez votre IP locale dans `client/constants/config.ts`
4. Désactivez temporairement le firewall pour tester
5. Vérifiez que le port 5000 n'est pas utilisé par un autre processus

### Problème : "Connection refused" sur web

**Solutions** :
1. Vérifiez que le backend est bien démarré : `npm run dev` dans le dossier `server`
2. Vérifiez que le backend écoute sur le port 5000
3. Testez directement : `http://localhost:5000/api/auth/register` dans le navigateur

### Problème : CORS errors

**Solutions** :
1. Vérifiez que CORS est configuré dans `server/src/server.js`
2. Assurez-vous que l'origine est autorisée dans la configuration CORS

### Problème : Expo ne détecte pas le téléphone

**Solutions** :
1. Installez l'application Expo Go sur votre téléphone
2. Assurez-vous que votre téléphone et ordinateur sont sur le même réseau
3. Essayez de scanner le QR code à nouveau
4. Redémarrez Expo : `npx expo start --clear`

## 📝 Checklist de Test

- [ ] Backend démarré sur le port 5000
- [ ] Base de données PostgreSQL accessible
- [ ] Configuration API correcte dans `client/constants/config.ts`
- [ ] Téléphone et ordinateur sur le même réseau Wi-Fi
- [ ] Firewall configuré pour autoriser le port 5000
- [ ] Expo démarré : `npm start` dans le dossier `client`
- [ ] Application Expo Go installée sur le téléphone
- [ ] Test d'inscription fonctionnel
- [ ] Test de connexion fonctionnel
- [ ] Test de changement de type de compte fonctionnel

## 🎯 Commandes Utiles

```bash
# Démarrer le backend
cd server
npm run dev

# Démarrer le frontend
cd client
npm start

# Démarrer avec cache vidé
cd client
npx expo start --clear

# Vérifier l'IP locale (Windows)
ipconfig

# Vérifier l'IP locale (Mac/Linux)
ifconfig
# ou
ip addr
```

## 🌍 Hébergement du Backend

**Vous n'avez PAS besoin d'héberger le backend pour tester en local !**

Le backend peut rester en local pendant le développement. Vous n'avez besoin de l'héberger que lorsque vous voulez :
- Déployer l'application en production
- Tester avec des utilisateurs réels
- Utiliser l'application depuis différents réseaux

### Options d'hébergement (pour plus tard) :

1. **Heroku** : Gratuit pour commencer, facile à déployer
2. **Railway** : Alternative moderne à Heroku
3. **Render** : Simple et gratuit
4. **AWS/Google Cloud/Azure** : Pour la production à grande échelle
5. **VPS** : Contrôle total (DigitalOcean, Linode, etc.)

Pour l'instant, continuez avec le backend en local ! 🚀


# 🔐 Guide d'Authentification - TCHINDA Mobile

## 📦 Installation des dépendances

Avant de commencer, installez les dépendances nécessaires :

```bash
cd client
npm install
```

Les dépendances suivantes sont requises :
- `@react-native-async-storage/async-storage` - Pour stocker les tokens
- `@react-native-picker/picker` - Pour les sélecteurs dans le formulaire d'inscription

## ⚙️ Configuration

### 1. Configurer l'URL de l'API

Éditez le fichier `constants/config.ts` et modifiez `BASE_URL` selon votre environnement :

```typescript
export const API_CONFIG = {
  BASE_URL: __DEV__ 
    ? 'http://localhost:5000' // Développement local
    : 'https://api.tchinda.com', // Production
  // ...
};
```

**⚠️ Important pour les appareils physiques :**

- **Android Emulator** : Utilisez `http://10.0.2.2:5000`
- **iOS Simulator** : Utilisez `http://localhost:5000`
- **Appareil physique** : Utilisez l'IP de votre machine (ex: `http://192.168.1.100:5000`)

Pour trouver votre IP locale :
- **Windows** : `ipconfig` dans PowerShell
- **Mac/Linux** : `ifconfig` ou `ip addr`

### 2. Démarrer le serveur backend

Assurez-vous que le serveur backend est démarré :

```bash
cd server
npm run dev
```

Le serveur doit être accessible sur `http://localhost:5000`

## 🚀 Utilisation

### Structure de l'authentification

```
client/
├── constants/
│   └── config.ts              # Configuration API
├── services/
│   ├── api.service.ts         # Service API générique
│   └── auth.service.ts        # Service d'authentification
├── contexts/
│   └── AuthContext.tsx        # Contexte d'authentification
├── hooks/
│   └── useAuth.ts             # Hook pour utiliser l'auth
└── app/
    ├── Login.tsx              # Écran de connexion
    └── SignUp.tsx              # Écran d'inscription
```

### Utiliser l'authentification dans vos composants

```typescript
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();

  if (!isAuthenticated) {
    return <Text>Non connecté</Text>;
  }

  return (
    <View>
      <Text>Bonjour {user?.firstName}!</Text>
      <Button onPress={logout} title="Déconnexion" />
    </View>
  );
}
```

### Types de comptes disponibles

Lors de l'inscription, les utilisateurs peuvent choisir entre :

- **BUYER** - Acheteur
- **SELLER** - Vendeur
- **COMMERCIAL** - Commercial/Agent

## 🔑 Fonctionnalités

### Inscription

- Validation des champs
- Validation de la force du mot de passe
- Sélection du type de compte
- Sélection du pays
- Stockage automatique des tokens

### Connexion

- Validation email/mot de passe
- Gestion des erreurs
- Stockage automatique des tokens
- Redirection automatique après connexion

### Gestion des tokens

- Stockage sécurisé avec AsyncStorage
- Rafraîchissement automatique des tokens expirés
- Nettoyage automatique lors de la déconnexion

## 🧪 Tester l'authentification

### 1. Créer un compte

1. Lancez l'application
2. Allez sur l'écran d'inscription
3. Remplissez le formulaire :
   - Type de compte : Acheteur
   - Prénom : Test
   - Nom : User
   - Email : test@example.com
   - Mot de passe : Test1234!
   - Confirmer : Test1234!
4. Cliquez sur "S'inscrire"

### 2. Se connecter

1. Allez sur l'écran de connexion
2. Entrez :
   - Email : test@example.com
   - Mot de passe : Test1234!
3. Cliquez sur "Se connecter"

### 3. Compte admin par défaut

Vous pouvez aussi vous connecter avec le compte admin créé par le seed :

- **Email** : admin@tchinda.com
- **Mot de passe** : Admin@1234

## 🐛 Dépannage

### Erreur de connexion réseau

**Problème** : "Erreur de connexion. Vérifiez votre connexion internet."

**Solutions** :
1. Vérifiez que le serveur backend est démarré
2. Vérifiez l'URL dans `constants/config.ts`
3. Pour un appareil physique, utilisez l'IP de votre machine au lieu de `localhost`
4. Vérifiez que le port 5000 n'est pas bloqué par un firewall

### Token expiré

**Problème** : L'utilisateur est déconnecté automatiquement

**Solution** : Le système rafraîchit automatiquement les tokens. Si cela échoue, l'utilisateur doit se reconnecter.

### Erreur de validation

**Problème** : "Erreur de validation" lors de l'inscription

**Solutions** :
1. Vérifiez que tous les champs requis sont remplis
2. Le mot de passe doit contenir :
   - Au moins 8 caractères
   - Une majuscule
   - Une minuscule
   - Un chiffre
   - Un caractère spécial (@$!%*?&)
3. L'email doit être valide

## 📝 Prochaines étapes

- [ ] Implémenter la vérification email/SMS
- [ ] Ajouter la réinitialisation de mot de passe
- [ ] Implémenter l'authentification sociale (Google, Facebook, Apple)
- [ ] Ajouter la vérification 2FA
- [ ] Implémenter la gestion du profil utilisateur

## 🔗 Liens utiles

- [Documentation AsyncStorage](https://react-native-async-storage.github.io/async-storage/)
- [Documentation Expo Router](https://docs.expo.dev/router/introduction/)
- [Documentation React Context](https://react.dev/reference/react/createContext)



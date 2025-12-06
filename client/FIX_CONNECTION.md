# 🔧 Résolution des Problèmes de Connexion

## Problème : "Network request failed" / "ERR_CONNECTION_REFUSED"

Cette erreur signifie que le frontend ne peut pas se connecter au backend.

## ✅ Solution 1 : Utiliser Railway (Recommandé)

Puisque votre backend est déjà déployé sur Railway, utilisez-le même en développement :

### Modifier `client/constants/config.ts`

Remplacez la fonction `getBaseURL()` par :

```typescript
const getBaseURL = () => {
  // Utiliser Railway même en développement
  return 'https://tchinda-production.up.railway.app';
  
  // OU garder la détection automatique mais utiliser Railway :
  // if (Platform.OS === 'web') {
  //   return 'https://tchinda-production.up.railway.app';
  // }
  // etc...
};
```

**Avantages** :
- ✅ Pas besoin de démarrer le backend local
- ✅ Fonctionne partout (web, mobile, téléphone)
- ✅ Base de données déjà configurée

## ✅ Solution 2 : Démarrer le Backend Local

Si vous préférez utiliser le backend local :

### 1. Démarrer le backend

```bash
cd server
npm run dev
```

Le serveur devrait démarrer sur `http://localhost:5000`

### 2. Vérifier que le backend fonctionne

Ouvrez votre navigateur et allez sur : `http://localhost:5000/health`

Vous devriez voir :
```json
{
  "status": "OK",
  "message": "TCHINDA API is running",
  "timestamp": "..."
}
```

### 3. Pour Expo Go (appareil physique)

Si vous testez sur un téléphone physique avec Expo Go :

1. **Trouvez votre IP locale** :
   - Windows : `ipconfig` dans PowerShell
   - Cherchez "IPv4 Address" (ex: 192.168.1.100)

2. **Modifiez `client/constants/config.ts`** :
   ```typescript
   const LOCAL_IP = '192.168.1.100'; // Votre IP
   
   // Pour Android physique
   return `http://${LOCAL_IP}:5000`;
   ```

3. **Vérifiez le firewall** :
   - Autorisez le port 5000 dans le pare-feu Windows

## 🔍 Vérifications

### Vérifier que le backend répond

**Railway** :
```bash
curl https://tchinda-production.up.railway.app/health
```

**Local** :
```bash
curl http://localhost:5000/health
```

### Vérifier la configuration

Dans `client/constants/config.ts`, la fonction `getBaseURL()` doit retourner l'URL correcte.

Pour voir quelle URL est utilisée, ajoutez temporairement :
```typescript
const baseURL = getBaseURL();
console.log('API URL:', baseURL);
export const API_CONFIG = {
  BASE_URL: baseURL,
  // ...
};
```

## 🐛 Autres Erreurs Corrigées

### 1. "Style property 'width' is not supported by native animated module"

✅ **Corrigé** : Remplacé `width` par `flex` dans l'animation du splash screen.

### 2. "window is not defined" (AsyncStorage sur web)

✅ **Corrigé** : Ajout d'une vérification `typeof window === 'undefined'` avant d'utiliser AsyncStorage.

## 📝 Configuration Recommandée

Pour le moment, utilisez **Railway** même en développement :

```typescript
const getBaseURL = () => {
  // Toujours utiliser Railway (même en dev)
  return 'https://tchinda-production.up.railway.app';
};
```

Cela évite tous les problèmes de connexion locale !

## 🎯 Test Rapide

1. Modifiez `client/constants/config.ts` pour utiliser Railway
2. Redémarrez Expo : `npx expo start --clear`
3. Testez la connexion

Si ça ne fonctionne toujours pas, vérifiez :
- Que Railway est bien déployé et accessible
- Que les migrations Prisma ont été exécutées
- Que les variables d'environnement sont configurées dans Railway


# Solution pour l'erreur socket.io-client

## Problème
```
Impossible de résoudre le module socket.io-client depuis socket.service.ts
```

## Solutions

### 1. Redémarrer le serveur de développement

Le problème est souvent dû au cache TypeScript/Metro qui n'a pas été rafraîchi après l'installation du package.

**Étapes :**
1. Arrêter le serveur Expo (Ctrl+C)
2. Nettoyer le cache :
   ```bash
   cd TCHINDA/client
   npx expo start --clear
   ```

### 2. Vérifier l'installation

Vérifier que le package est bien installé :
```bash
cd TCHINDA/client
npm list socket.io-client
```

Si le package n'est pas listé, réinstaller :
```bash
npm install socket.io-client@^4.8.3
```

### 3. Redémarrer l'IDE

Parfois, l'IDE (VS Code, etc.) doit être redémarré pour que TypeScript reconnaisse le nouveau package.

1. Fermer complètement l'IDE
2. Rouvrir le projet
3. Attendre que TypeScript indexe les nouveaux modules

### 4. Vérifier node_modules

Vérifier que le dossier existe :
```bash
cd TCHINDA/client
ls node_modules/socket.io-client
```

Si le dossier n'existe pas :
```bash
rm -rf node_modules
npm install
```

### 5. Solution alternative (si le problème persiste)

Si le problème persiste après toutes ces étapes, il se peut que socket.io-client ait des problèmes de compatibilité avec React Native. Dans ce cas, vous pouvez utiliser une version spécifique ou un polyfill.

**Option A : Utiliser une version compatible**
```bash
npm install socket.io-client@4.5.4
```

**Option B : Ajouter une configuration Metro (si nécessaire)**

Créer `metro.config.js` :
```javascript
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ajouter socket.io-client aux résolveurs
config.resolver.sourceExts.push('cjs');

module.exports = config;
```

## Vérification

Après avoir appliqué les solutions, vérifier que l'import fonctionne :
```typescript
import { io, Socket } from 'socket.io-client';
```

Si l'erreur persiste, vérifier :
- Que `node_modules/socket.io-client` existe
- Que `package.json` contient `"socket.io-client": "^4.8.3"`
- Que le serveur Expo a été redémarré avec `--clear`

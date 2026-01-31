# Module de Chat Temps Réel - Guide d'Installation

## 📦 Installation

### 1. Installer les dépendances

```bash
cd server
npm install socket.io
```

### 2. Appliquer les migrations Prisma

```bash
# Générer le client Prisma avec les nouveaux modèles
npm run prisma:generate

# Créer et appliquer la migration
npm run prisma:migrate

# OU en développement (push direct)
npm run prisma:push
```

### 3. Configuration (optionnelle)

Ajouter dans `.env` :

```env
# Activer/désactiver le chat (activé par défaut)
ENABLE_CHAT=true

# Redis pour la présence (optionnel)
REDIS_URL=redis://localhost:6379
```

## 🚀 Démarrage

Le module de chat est automatiquement initialisé au démarrage du serveur si `ENABLE_CHAT` n'est pas défini à `false`.

```bash
npm start
# ou
npm run dev
```

Vous devriez voir :
```
✅ Module de chat temps réel activé
💬 Chat temps réel: activé
```

## 📡 Utilisation

### Connexion WebSocket

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: {
    token: 'VOTRE_JWT_TOKEN'
  },
  transports: ['websocket', 'polling']
});

// Écouter les événements
socket.on('connect', () => {
  console.log('Connecté au chat');
});

socket.on('message:new', (data) => {
  console.log('Nouveau message:', data.message);
});
```

### API REST

Toutes les routes nécessitent l'authentification JWT :

```bash
# Créer une conversation
POST /api/chat/conversation
Authorization: Bearer <token>
{
  "participant2Id": "user-id",
  "type": "ORDER",
  "orderId": "order-id"
}

# Envoyer un message
POST /api/chat/conversation/:id/message
Authorization: Bearer <token>
{
  "content": "Bonjour !",
  "language": "fr"
}

# Récupérer les messages
GET /api/chat/conversation/:id/messages?limit=50
Authorization: Bearer <token>
```

## 🔧 Intégrations futures

### Traduction

Le service de traduction est actuellement une abstraction. Pour intégrer un service réel :

1. Modifier `src/services/chat/translation.service.js`
2. Ajouter les clés API dans `.env`
3. Implémenter les fonctions `translateText`, `translateToMultipleLanguages`, `detectLanguage`

### Redis pour la présence

1. Installer Redis
2. Configurer `REDIS_URL` dans `.env`
3. Décommenter le code Redis dans `presence.service.js`

### Notifications Push

1. Configurer FCM/APNs
2. Créer un service de notifications
3. Intégrer dans `websocket.service.js` (voir TODO)

## 📝 Notes importantes

- Le module est **totalement isolé** et n'affecte pas l'architecture existante
- Toutes les routes utilisent le middleware `authenticate` existant
- Les modèles Prisma sont ajoutés sans modifier les modèles existants
- Le chat est **contextuel** : pas de chat libre global

## 🐛 Dépannage

### Le chat ne démarre pas

- Vérifier que `socket.io` est installé : `npm list socket.io`
- Vérifier les logs au démarrage
- Vérifier que `ENABLE_CHAT` n'est pas défini à `false`

### Erreurs de migration Prisma

- Vérifier que la base de données est accessible
- Vérifier que le schéma Prisma est valide : `npx prisma validate`
- Essayer `npm run prisma:push` en développement

### WebSocket ne se connecte pas

- Vérifier que le token JWT est valide
- Vérifier les CORS dans `server.js`
- Vérifier que le serveur HTTP est bien créé (pas juste Express)

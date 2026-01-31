# Module de Chat Temps Réel - Documentation

## 📋 Vue d'ensemble

Module de chat contextuel intégré au backend TCHINDA, permettant la communication temps réel entre utilisateurs selon des règles d'autorisation strictes.

## 🏗️ Architecture

```
src/services/chat/
├── chat.service.js          # Logique métier (conversations, messages)
├── websocket.service.js     # Service WebSocket (Socket.IO)
├── translation.service.js  # Service de traduction (abstraction)
└── presence.service.js      # Gestion de la présence en ligne/hors ligne
```

## 🔐 Règles d'autorisation

### Types de conversations autorisées

1. **ORDER / DELIVERY** :
   - BUYER ↔ SELLER
   - BUYER ↔ DELIVERY
   - SELLER ↔ DELIVERY

2. **SUPPORT** :
   - USER ↔ SUPPORT (ADMIN, MODERATOR, COMMERCIAL)

### Accès Admin/Moderator

- **Lecture** : Accès en lecture seule à toutes les conversations
- **Actions** : Peuvent supprimer des messages, traiter les signalements

## 📡 API REST

### Conversations

- `POST /api/chat/conversation` - Créer une conversation
- `GET /api/chat/conversations` - Lister les conversations de l'utilisateur
- `GET /api/chat/conversation/:id/messages` - Récupérer les messages
- `POST /api/chat/conversation/:id/message` - Envoyer un message
- `POST /api/chat/conversation/:id/read` - Marquer comme lu

### Messages

- `DELETE /api/chat/message/:id` - Supprimer un message
- `POST /api/chat/message/:id/report` - Signaler un message

### Signalements (Admin/Moderator)

- `GET /api/chat/reports` - Lister les signalements
- `PATCH /api/chat/report/:id` - Traiter un signalement

### Audit (Admin uniquement)

- `GET /api/chat/audit-logs` - Logs d'audit

## 🔌 WebSocket Events

### Client → Server

- `conversation:join` - Rejoindre une conversation
- `conversation:leave` - Quitter une conversation
- `message:send` - Envoyer un message
- `messages:read` - Marquer comme lu
- `typing:start` - Indicateur de frappe (début)
- `typing:stop` - Indicateur de frappe (fin)

### Server → Client

- `message:new` - Nouveau message reçu
- `messages:read` - Messages marqués comme lus
- `message:deleted` - Message supprimé
- `conversation:joined` - Confirmation de jointure
- `conversation:left` - Confirmation de sortie
- `user:online` - Utilisateur en ligne
- `user:offline` - Utilisateur hors ligne
- `typing:start` - Autre utilisateur en train de taper
- `typing:stop` - Autre utilisateur a arrêté de taper
- `error` - Erreur

## 🔧 Configuration

### Variables d'environnement

```env
# Activer le module de chat (optionnel, activé par défaut en dev)
ENABLE_CHAT=true

# Redis pour la présence (optionnel, utilise Map en mémoire si non configuré)
REDIS_URL=redis://localhost:6379
```

### Installation des dépendances

```bash
npm install socket.io
```

## 📦 Modèles Prisma

### Conversation
- Type (ORDER, DELIVERY, SUPPORT)
- Participants (participant1Id, participant2Id)
- Contexte (orderId, deliveryId, supportTicketId)
- Statut (ACTIVE, ARCHIVED, CLOSED)
- Compteurs de messages non lus

### Message
- Contenu original et traduit
- Statut (SENT, DELIVERED, READ, EDITED, DELETED)
- Accusé de lecture
- Réponse à un message (replyToId)

### Attachment
- Type (image, document, video, audio)
- URL et métadonnées

### MessageReport
- Raison du signalement
- Statut de traitement

### ChatAuditLog
- Journalisation complète de toutes les actions

## 🚀 Intégrations futures

### TODO: Services à intégrer

1. **Traduction** :
   - [ ] Google Cloud Translation API
   - [ ] DeepL API
   - [ ] AWS Translate

2. **Présence** :
   - [ ] Redis pour la persistance
   - [ ] Synchronisation multi-instances

3. **Notifications Push** :
   - [ ] Firebase Cloud Messaging (FCM)
   - [ ] Apple Push Notification Service (APNs)
   - [ ] Fallback email/SMS

4. **Stockage de fichiers** :
   - [ ] Intégration avec le service d'upload existant
   - [ ] Compression d'images
   - [ ] Génération de miniatures

## 🔒 Sécurité

- Authentification JWT obligatoire pour WebSocket
- Vérification des permissions à chaque action
- Rate limiting sur les routes REST
- Logs d'audit complets
- Validation des données d'entrée

## 📝 Notes importantes

- Le chat est **contextuel** : pas de chat libre global
- Les conversations sont liées à des entités (commande, livraison, ticket)
- La traduction est automatique selon la langue préférée du destinataire
- Les admins/moderators ont accès en lecture à toutes les conversations
- Toutes les actions sont journalisées pour l'audit

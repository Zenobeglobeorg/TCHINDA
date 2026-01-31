# Module de Chat - Documentation Frontend

## 📦 Installation

### 1. Installer les dépendances

```bash
cd client
npm install socket.io-client
```

### 2. Structure créée

```
client/
├── services/
│   ├── chat.service.ts          ✅ Service API REST
│   └── socket.service.ts        ✅ Service WebSocket
├── hooks/
│   ├── useChat.ts               ✅ Hook pour gérer le chat
│   └── useSocket.ts             ✅ Hook pour gérer la connexion WebSocket
├── components/
│   └── chat/
│       ├── ChatButton.tsx       ✅ Bouton pour ouvrir le chat
│       ├── ChatModal.tsx        ✅ Modal de chat
│       ├── ChatList.tsx         ✅ Liste des conversations
│       ├── ChatRoom.tsx          ✅ Fenêtre de chat
│       ├── MessageBubble.tsx    ✅ Bulle de message
│       └── AttachmentPreview.tsx ✅ Prévisualisation des pièces jointes
└── app/
    ├── buyer/activity.tsx        ✅ Intégration (bouton ajouté)
    ├── seller/dashboard.tsx     ✅ Intégration (bouton ajouté)
    └── admin/support.tsx        ✅ Intégration (bouton ajouté)
```

## 🚀 Utilisation

### Utilisation basique

```tsx
import { ChatButton } from '@/components/chat/ChatButton';

// Dans votre composant
<ChatButton variant="button" />
```

### Variantes du bouton

```tsx
// Icône simple
<ChatButton variant="icon" />

// Bouton avec texte
<ChatButton variant="button" />

// Badge avec compteur
<ChatButton variant="badge" badgeCount={5} />
```

### Chat contextuel

```tsx
// Chat lié à une commande
<ChatButton
  contextType="ORDER"
  contextId="order-123"
  targetUserId="seller-id"
/>

// Chat de support
<ChatButton
  contextType="SUPPORT"
  contextId="ticket-456"
  targetUserId="admin-id"
/>
```

### Utilisation avancée avec le hook

```tsx
import { useChat } from '@/hooks/useChat';

function MyComponent() {
  const {
    conversations,
    messages,
    loading,
    sendMessage,
    loadConversations,
  } = useChat({ conversationId: 'conv-123' });

  // Utiliser les données...
}
```

## 🎨 Composants

### ChatButton
Bouton réutilisable pour ouvrir le chat.

**Props:**
- `conversationId?: string` - ID de conversation existante
- `contextType?: 'ORDER' | 'DELIVERY' | 'SUPPORT'` - Type de contexte
- `contextId?: string` - ID du contexte (order, ticket, etc.)
- `targetUserId?: string` - ID de l'utilisateur cible
- `variant?: 'icon' | 'button' | 'badge'` - Style du bouton
- `badgeCount?: number` - Nombre de messages non lus

### ChatModal
Modal pour afficher le chat.

**Props:**
- `visible: boolean` - Visibilité du modal
- `onClose: () => void` - Callback de fermeture
- `initialConversationId?: string` - Conversation à ouvrir
- `contextType?: 'ORDER' | 'DELIVERY' | 'SUPPORT'` - Type de contexte
- `contextId?: string` - ID du contexte
- `targetUserId?: string` - ID de l'utilisateur cible

### ChatList
Liste des conversations.

**Props:**
- `conversations: Conversation[]` - Liste des conversations
- `loading?: boolean` - État de chargement
- `onRefresh?: () => void` - Callback de rafraîchissement
- `onConversationPress: (conversation: Conversation) => void` - Callback de sélection
- `emptyMessage?: string` - Message si vide

### ChatRoom
Fenêtre de chat principale.

**Props:**
- `conversationId: string` - ID de la conversation
- `onBack?: () => void` - Callback de retour

### MessageBubble
Bulle de message.

**Props:**
- `message: Message` - Message à afficher
- `onPress?: () => void` - Callback de clic
- `onLongPress?: () => void` - Callback de long press
- `onReport?: () => void` - Callback de signalement
- `showTranslation?: boolean` - Afficher la traduction

## 🔌 Services

### chatService
Service API REST pour le chat.

```tsx
import { chatService } from '@/services/chat.service';

// Créer une conversation
await chatService.createOrGetConversation({
  participant2Id: 'user-id',
  type: 'ORDER',
  orderId: 'order-123',
});

// Récupérer les messages
await chatService.getMessages('conversation-id', 50);

// Envoyer un message
await chatService.sendMessage({
  conversationId: 'conv-id',
  content: 'Bonjour !',
  language: 'fr',
});
```

### socketService
Service WebSocket pour le chat temps réel.

```tsx
import { socketService } from '@/services/socket.service';

// Connecter
await socketService.connect();

// Envoyer un message
socketService.sendMessage({
  conversationId: 'conv-id',
  content: 'Hello!',
});

// Écouter les nouveaux messages
socketService.on('message:new', (message) => {
  console.log('Nouveau message:', message);
});
```

## 🪝 Hooks

### useSocket
Hook pour gérer la connexion WebSocket.

```tsx
import { useSocket } from '@/hooks/useSocket';

const { isConnected, error, reconnect } = useSocket();
```

### useChat
Hook principal pour gérer le chat.

```tsx
import { useChat } from '@/hooks/useChat';

const {
  conversations,        // Liste des conversations
  messages,            // Messages de la conversation active
  currentConversation, // Conversation actuelle
  loading,             // État de chargement
  error,               // Erreur éventuelle
  typingUsers,         // Utilisateurs en train d'écrire
  onlineUsers,         // Utilisateurs en ligne
  sendMessage,         // Fonction pour envoyer un message
  markAsRead,          // Marquer comme lu
  deleteMessage,       // Supprimer un message
  reportMessage,       // Signaler un message
  loadConversations,   // Charger les conversations
} = useChat({ conversationId: 'conv-123' });
```

## 🎯 Intégrations existantes

### Buyer Activity
- Bouton de chat ajouté dans `app/buyer/activity.tsx`

### Seller Dashboard
- Bouton de chat ajouté dans le header de `app/seller/dashboard.tsx`

### Admin Support
- Bouton de chat ajouté dans le header de `app/admin/support.tsx`

## 🔧 Configuration

Le module utilise automatiquement :
- L'authentification JWT existante (`@tchinda_token`)
- Le service API existant (`apiService`)
- Le système de thème existant (`useThemeColor`, `ThemedView`, `ThemedText`)

## 📝 Notes importantes

- ✅ **Non intrusif** : Aucune modification des dashboards existants (seulement ajout de boutons)
- ✅ **Réutilisable** : Composants indépendants et réutilisables
- ✅ **Thème** : Respecte automatiquement le thème clair/sombre
- ✅ **Responsive** : Compatible web et mobile
- ✅ **TypeScript** : Entièrement typé

## 🐛 Dépannage

### Le WebSocket ne se connecte pas

1. Vérifier que le token JWT est valide
2. Vérifier que `socket.io-client` est installé
3. Vérifier les logs dans la console
4. Vérifier que le backend WebSocket est actif

### Les messages ne s'affichent pas

1. Vérifier que la conversation existe
2. Vérifier les permissions (BUYER ↔ SELLER, etc.)
3. Vérifier les logs d'erreur dans la console

### Erreurs TypeScript

1. Vérifier que tous les types sont importés correctement
2. Vérifier que `socket.io-client` est installé
3. Redémarrer le serveur TypeScript

## 🚀 Prochaines étapes

- [ ] Intégrer les notifications push (FCM)
- [ ] Améliorer la prévisualisation des pièces jointes
- [ ] Ajouter la recherche dans les conversations
- [ ] Ajouter les filtres de conversations
- [ ] Améliorer l'UI mobile

---

**Module créé le** : $(date)
**Statut** : ✅ Prêt pour utilisation

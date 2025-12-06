# TCHINDA Market - Backend Server

Backend API pour la plateforme e-commerce TCHINDA avec système de portefeuille intégré.

## 🚀 Installation

### Prérequis

- Node.js 18+ 
- PostgreSQL 14+ (local ou Supabase)
- npm ou yarn

### Étapes d'installation

1. **Installer les dépendances**

```bash
npm install
```

2. **Configurer les variables d'environnement**

Copiez le fichier `env.example` vers `.env` et configurez vos variables :

```bash
cp env.example .env
```

Éditez `.env` avec vos configurations :
- `DATABASE_URL` : URL de connexion PostgreSQL (local ou Supabase)
- `JWT_SECRET` : Clé secrète pour les tokens JWT
- `JWT_REFRESH_SECRET` : Clé secrète pour les refresh tokens
- Autres configurations selon vos besoins

3. **Configurer Prisma**

Générer le client Prisma :

```bash
npm run prisma:generate
```

Créer la base de données et appliquer les migrations :

```bash
npm run prisma:migrate
```

Ou pousser le schéma directement (développement) :

```bash
npm run prisma:push
```

4. **Démarrer le serveur**

Mode développement (avec nodemon) :

```bash
npm run dev
```

Mode production :

```bash
npm start
```

Le serveur démarre sur `http://localhost:5000`

## 📁 Structure du projet

```
server/
├── prisma/
│   └── schema.prisma          # Schéma de base de données Prisma
├── src/
│   ├── controllers/           # Contrôleurs (logique métier)
│   │   └── auth.controller.js
│   ├── middleware/            # Middlewares Express
│   │   ├── auth.middleware.js
│   │   ├── error.middleware.js
│   │   └── notFound.middleware.js
│   ├── routes/                # Routes API
│   │   ├── auth.routes.js
│   │   └── user.routes.js
│   ├── services/              # Services (logique métier)
│   │   └── auth.service.js
│   ├── utils/                 # Utilitaires
│   │   ├── jwt.utils.js
│   │   ├── password.utils.js
│   │   └── validation.utils.js
│   └── server.js              # Point d'entrée du serveur
├── .env                       # Variables d'environnement (à créer)
├── env.example                # Exemple de configuration
├── package.json
└── README.md
```

## 🔐 Types de comptes

La plateforme supporte 7 types de comptes :

1. **BUYER** - Acheteur
2. **SELLER** - Vendeur
3. **ADMIN** - Administrateur Fondateur
4. **MODERATOR** - Modérateur
5. **ACCOUNTANT** - Factureur
6. **DELIVERY** - Livreur
7. **COMMERCIAL** - Commercial/Agent

## 📡 API Endpoints

### Authentification

- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/refresh-token` - Rafraîchir le token
- `POST /api/auth/logout` - Déconnexion
- `GET /api/auth/me` - Obtenir l'utilisateur connecté
- `POST /api/auth/verify/email` - Vérifier l'email
- `POST /api/auth/verify/phone` - Vérifier le téléphone
- `POST /api/auth/send-verification-email` - Envoyer code email
- `POST /api/auth/send-verification-sms` - Envoyer code SMS
- `POST /api/auth/forgot-password` - Mot de passe oublié
- `POST /api/auth/reset-password` - Réinitialiser mot de passe

### Utilisateurs

- `GET /api/users/profile` - Obtenir le profil
- `PUT /api/users/profile` - Mettre à jour le profil

## 🔒 Sécurité

- **JWT** : Authentification par tokens
- **bcrypt** : Hashage des mots de passe (12 rounds)
- **Helmet** : Sécurité HTTP
- **Rate Limiting** : Protection contre les attaques par force brute
- **CORS** : Configuration des origines autorisées
- **Validation** : Validation des données d'entrée avec express-validator

## 🗄️ Base de données

Le schéma Prisma inclut :

- **User** : Table principale des utilisateurs
- **Verification** : Vérifications KYC
- **VerificationCode** : Codes de vérification email/SMS
- **PasswordResetToken** : Tokens de réinitialisation de mot de passe
- **Address** : Adresses de livraison
- **Wallet** : Portefeuilles électroniques
- **Transaction** : Transactions financières
- **Profils spécifiques** : BuyerProfile, SellerProfile, AdminProfile, etc.

## 🛠️ Commandes Prisma

```bash
# Générer le client Prisma
npm run prisma:generate

# Créer une migration
npm run prisma:migrate

# Pousser le schéma (développement)
npm run prisma:push

# Ouvrir Prisma Studio
npm run prisma:studio
```

## 📝 Notes

- Les mots de passe doivent contenir au moins 8 caractères avec majuscule, minuscule, chiffre et caractère spécial
- Les comptes COMMERCIAL nécessitent une vérification manuelle par un administrateur
- Les portefeuilles sont créés automatiquement pour les BUYER et SELLER
- Les tokens JWT expirent après 24h, les refresh tokens après 7 jours

## ✅ Fonctionnalités Implémentées

- [x] Implémenter l'envoi d'emails (nodemailer) - ✅ **Complété**
- [x] Implémenter l'envoi de SMS (Twilio) - ✅ **Complété**
- [x] Implémenter la réinitialisation de mot de passe - ✅ **Complété**
- [x] Système de codes de vérification email/SMS - ✅ **Complété**

Voir `EMAIL_SMS_SETUP.md` pour la configuration détaillée.

## 🔄 Prochaines étapes

- [ ] Implémenter la vérification 2FA (speakeasy)
- [ ] Ajouter les routes pour la gestion KYC
- [ ] Ajouter les routes pour la gestion des portefeuilles
- [ ] Implémenter les routes pour chaque type de compte



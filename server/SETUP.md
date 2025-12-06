# Guide de Configuration - TCHINDA Backend

## 📋 Configuration Initiale

### 1. Installation des dépendances

```bash
cd server
npm install
```

### 2. Configuration de la base de données

#### Option A : PostgreSQL Local

1. Installez PostgreSQL sur votre machine
2. Créez une base de données :

```sql
CREATE DATABASE tchinda_market;
```

3. Configurez la `DATABASE_URL` dans `.env` :

```env
DATABASE_URL="postgresql://username:password@localhost:5432/tchinda_market?schema=public"
```

#### Option B : Supabase (Recommandé pour production)

1. Créez un projet sur [Supabase](https://supabase.com)
2. Allez dans **Settings > Database**
3. Copiez la **Connection String** (URI)
4. Configurez dans `.env` :

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

### 3. Configuration des variables d'environnement

Copiez `env.example` vers `.env` :

```bash
cp env.example .env
```

Éditez `.env` avec vos valeurs :

```env
# Base de données
DATABASE_URL="votre-url-de-connexion"

# JWT (Générez des clés sécurisées)
JWT_SECRET="votre-clé-secrète-jwt-très-longue-et-aléatoire"
JWT_REFRESH_SECRET="votre-clé-secrète-refresh-très-longue-et-aléatoire"

# Frontend (pour CORS)
FRONTEND_URL="http://localhost:8081"
MOBILE_APP_URL="exp://localhost:8081"
```

**⚠️ Important :** Générez des clés JWT sécurisées :

```bash
# Sur Linux/Mac
openssl rand -base64 32

# Ou utilisez un générateur en ligne
```

### 4. Initialisation de Prisma

Générer le client Prisma :

```bash
npm run prisma:generate
```

Créer la base de données et appliquer le schéma :

```bash
# Pour développement (crée directement les tables)
npm run prisma:push

# Pour production (crée des migrations)
npm run prisma:migrate
```

### 5. Créer l'administrateur par défaut

Exécutez le script de seed :

```bash
npm run prisma:seed
```

Cela créera un compte administrateur :
- **Email :** admin@tchinda.com
- **Mot de passe :** Admin@1234

**⚠️ Changez ce mot de passe immédiatement après la première connexion !**

### 6. Démarrer le serveur

Mode développement :

```bash
npm run dev
```

Le serveur démarre sur `http://localhost:5000`

## 🧪 Tester l'API

### Health Check

```bash
curl http://localhost:5000/health
```

### Inscription d'un acheteur

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "acheteur@test.com",
    "password": "Test1234!",
    "accountType": "BUYER",
    "firstName": "Jean",
    "lastName": "Dupont",
    "country": "SN"
  }'
```

### Connexion

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "acheteur@test.com",
    "password": "Test1234!"
  }'
```

### Obtenir le profil (avec token)

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer VOTRE_TOKEN_JWT"
```

## 🔧 Outils Utiles

### Prisma Studio

Interface graphique pour visualiser et modifier la base de données :

```bash
npm run prisma:studio
```

Ouvre `http://localhost:5555`

### Vérifier la connexion à la base de données

```bash
npx prisma db pull
```

## 📝 Notes Importantes

1. **Sécurité :**
   - Ne commitez jamais le fichier `.env`
   - Utilisez des clés JWT longues et aléatoires
   - Activez HTTPS en production

2. **Base de données :**
   - Faites des sauvegardes régulières
   - Utilisez les migrations Prisma pour les changements de schéma
   - Testez toujours sur un environnement de développement d'abord

3. **Développement :**
   - Utilisez `prisma:push` en développement pour des changements rapides
   - Utilisez `prisma:migrate` en production pour un historique des changements

## 🐛 Dépannage

### Erreur de connexion à la base de données

- Vérifiez que PostgreSQL est démarré
- Vérifiez la `DATABASE_URL` dans `.env`
- Testez la connexion avec `psql` ou un client PostgreSQL

### Erreur Prisma

```bash
# Régénérer le client Prisma
npm run prisma:generate

# Réinitialiser la base de données (⚠️ supprime toutes les données)
npx prisma migrate reset
```

### Port déjà utilisé

Changez le `PORT` dans `.env` ou arrêtez le processus utilisant le port 5000.

## 🚀 Prochaines étapes

1. Configurez l'envoi d'emails (nodemailer)
2. Configurez l'envoi de SMS (Twilio)
3. Implémentez la vérification 2FA
4. Ajoutez les routes pour la gestion des produits
5. Implémentez le système de portefeuille




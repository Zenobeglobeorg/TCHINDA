# Guide de Déploiement sur Railway - TCHINDA Backend

Ce guide vous explique comment déployer le backend TCHINDA sur Railway.

## 📋 Prérequis

1. **Compte Railway** : Créez un compte gratuit sur [railway.app](https://railway.app)
2. **GitHub/GitLab** : Votre code doit être sur GitHub ou GitLab (recommandé)
3. **PostgreSQL** : Railway fournit une base de données PostgreSQL gratuite

## 🚀 Étapes de Déploiement

### 1. Préparer le Repository

Assurez-vous que votre code est sur GitHub/GitLab :

```bash
# Si vous n'avez pas encore de repository Git
cd server
git init
git add .
git commit -m "Initial commit - Backend ready for Railway"
git remote add origin https://github.com/votre-username/tchinda-market.git
git push -u origin main
```

### 2. Créer un Projet sur Railway

1. Allez sur [railway.app](https://railway.app) et connectez-vous
2. Cliquez sur **"New Project"**
3. Sélectionnez **"Deploy from GitHub repo"** (ou GitLab)
4. Autorisez Railway à accéder à votre repository
5. Sélectionnez votre repository `tchinda-market`

### 3. Ajouter une Base de Données PostgreSQL

1. Dans votre projet Railway, cliquez sur **"+ New"**
2. Sélectionnez **"Database"** → **"Add PostgreSQL"**
3. Railway créera automatiquement une base de données PostgreSQL
4. Notez la variable `DATABASE_URL` qui sera automatiquement ajoutée

### 4. Configurer les Variables d'Environnement

Dans votre projet Railway, allez dans **"Variables"** et ajoutez toutes les variables nécessaires :

#### Variables Obligatoires

```env
# Server Configuration
PORT=5000
NODE_ENV=production

# Database (ajoutée automatiquement par Railway)
# DATABASE_URL est déjà configurée automatiquement

# JWT Configuration (GÉNÉREZ DES CLÉS SÉCURISÉES)
JWT_SECRET=votre-clé-jwt-super-secrète-et-longue-minimum-32-caractères
JWT_REFRESH_SECRET=votre-clé-refresh-super-secrète-et-longue-minimum-32-caractères
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# 2FA Configuration
TWO_FACTOR_ISSUER=TCHINDA

# Email Configuration (optionnel pour commencer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre-email@gmail.com
EMAIL_PASS=votre-app-password
EMAIL_FROM=noreply@tchinda.com

# SMS Configuration (optionnel pour commencer)
SMS_PROVIDER=test

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
BCRYPT_ROUNDS=12
SESSION_SECRET=votre-session-secret-super-secrète

# Frontend URL (pour CORS)
FRONTEND_URL=https://votre-frontend.vercel.app
MOBILE_APP_URL=exp://localhost:8081
```

#### Générer des Secrets Sécurisés

Pour générer des secrets sécurisés, utilisez :

```bash
# Sur Linux/Mac
openssl rand -base64 32

# Sur Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

Ou utilisez un générateur en ligne : https://www.lastpass.com/fr/features/password-generator

### 5. Déployer l'Application

1. Railway détectera automatiquement que c'est un projet Node.js
2. Il exécutera automatiquement :
   - `npm install`
   - `npx prisma generate`
   - `npm start`

### 6. Exécuter les Migrations Prisma

Une fois le déploiement terminé, vous devez exécuter les migrations :

**Option 1 : Via Railway CLI (Recommandé)**

1. Installez Railway CLI :
   ```bash
   npm install -g @railway/cli
   ```

2. Connectez-vous :
   ```bash
   railway login
   ```

3. Liez votre projet :
   ```bash
   cd server
   railway link
   ```

4. Exécutez les migrations :
   ```bash
   railway run npx prisma migrate deploy
   ```

5. (Optionnel) Exécutez le seed :
   ```bash
   railway run npm run prisma:seed
   ```

**Option 2 : Via Railway Dashboard**

1. Allez dans votre service sur Railway
2. Cliquez sur **"Deployments"**
3. Cliquez sur le dernier déploiement
4. Ouvrez la console
5. Exécutez :
   ```bash
   npx prisma migrate deploy
   npm run prisma:seed
   ```

### 7. Obtenir l'URL de votre API

1. Dans Railway, allez dans votre service
2. Cliquez sur **"Settings"**
3. Activez **"Generate Domain"** pour obtenir une URL publique
4. Votre API sera accessible sur : `https://votre-projet.up.railway.app`

### 8. Tester le Déploiement

Testez votre API déployée :

```bash
# Health check
curl https://votre-projet.up.railway.app/health

# Test d'inscription
curl -X POST https://votre-projet.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!",
    "accountType": "BUYER",
    "firstName": "Test",
    "lastName": "User"
  }'
```

## 🔧 Configuration du Frontend

Une fois le backend déployé, mettez à jour votre frontend :

1. Ouvrez `client/constants/config.ts`
2. Modifiez l'URL de production :

```typescript
export const API_CONFIG = {
  BASE_URL: __DEV__ 
    ? 'http://localhost:5000' // Développement local
    : 'https://votre-projet.up.railway.app', // Production Railway
  // ...
};
```

## 📊 Monitoring et Logs

### Voir les Logs

1. Dans Railway, allez dans votre service
2. Cliquez sur **"Deployments"**
3. Cliquez sur un déploiement pour voir les logs en temps réel

### Métriques

Railway fournit automatiquement :
- Utilisation CPU/Mémoire
- Requêtes par seconde
- Temps de réponse

## 🔄 Déploiements Automatiques

Railway déploie automatiquement à chaque push sur votre branche principale.

Pour désactiver :
1. Allez dans **"Settings"** → **"Source"**
2. Désactivez **"Auto Deploy"**

## 🐛 Résolution de Problèmes

### Erreur : "Prisma Client not generated"

**Solution** : Ajoutez un script de build dans `package.json` :

```json
{
  "scripts": {
    "build": "prisma generate",
    "start": "node src/server.js",
    "postinstall": "prisma generate"
  }
}
```

### Erreur : "Database connection failed"

**Solutions** :
1. Vérifiez que la variable `DATABASE_URL` est bien configurée
2. Vérifiez que la base de données PostgreSQL est bien créée
3. Vérifiez que les migrations ont été exécutées

### Erreur : "Port already in use"

**Solution** : Railway définit automatiquement le port via `process.env.PORT`. Votre code utilise déjà `process.env.PORT || 5000`, donc c'est bon.

### Erreur : "Module not found"

**Solution** : Vérifiez que tous les packages sont dans `dependencies` et non `devDependencies` (sauf pour Prisma qui peut rester en devDependencies).

## 💰 Coûts

Railway offre :
- **500 heures gratuites** par mois
- **$5 de crédit gratuit** par mois
- Parfait pour le développement et les tests

Pour la production, les prix commencent à partir de **$5/mois**.

## 🔐 Sécurité

⚠️ **Important** :
- Ne commitez JAMAIS votre fichier `.env`
- Utilisez des secrets forts pour `JWT_SECRET` et `JWT_REFRESH_SECRET`
- Activez HTTPS (automatique sur Railway)
- Configurez CORS correctement avec `FRONTEND_URL`

## 📝 Checklist de Déploiement

- [ ] Code sur GitHub/GitLab
- [ ] Projet créé sur Railway
- [ ] Base de données PostgreSQL ajoutée
- [ ] Variables d'environnement configurées
- [ ] Secrets JWT générés et configurés
- [ ] Migrations Prisma exécutées
- [ ] Seed exécuté (optionnel)
- [ ] URL publique générée
- [ ] Health check fonctionne
- [ ] Test d'inscription fonctionne
- [ ] Frontend configuré avec la nouvelle URL

## 🎉 C'est Fait !

Votre backend est maintenant déployé sur Railway ! 🚀

Vous pouvez maintenant :
- Tester l'API depuis votre frontend
- Partager l'URL avec votre équipe
- Continuer le développement avec des déploiements automatiques

## 📚 Ressources

- [Documentation Railway](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)
- [Guide Prisma sur Railway](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-railway)


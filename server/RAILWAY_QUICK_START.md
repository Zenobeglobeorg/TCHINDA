# 🚀 Déploiement Rapide sur Railway

## Étapes Rapides (5 minutes)

### 1. Créer un compte Railway
- Allez sur [railway.app](https://railway.app)
- Connectez-vous avec GitHub

### 2. Créer un nouveau projet
- Cliquez sur **"New Project"**
- Sélectionnez **"Deploy from GitHub repo"**
- Choisissez votre repository `tchinda-market`

### 3. Ajouter PostgreSQL
- Cliquez sur **"+ New"** → **"Database"** → **"Add PostgreSQL"**
- Railway créera automatiquement `DATABASE_URL`

### 4. Configurer les Variables d'Environnement

Dans **"Variables"**, ajoutez :

```env
# Server
PORT=5000
NODE_ENV=production

# JWT (GÉNÉREZ DES CLÉS SÉCURISÉES - voir ci-dessous)
JWT_SECRET=votre-clé-jwt-32-caractères-minimum
JWT_REFRESH_SECRET=votre-clé-refresh-32-caractères-minimum
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# 2FA
TWO_FACTOR_ISSUER=TCHINDA

# Email (optionnel)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre-email@gmail.com
EMAIL_PASS=votre-app-password
EMAIL_FROM=noreply@tchinda.com

# SMS (optionnel)
SMS_PROVIDER=test

# Security
BCRYPT_ROUNDS=12
SESSION_SECRET=votre-session-secret-32-caractères

# CORS
FRONTEND_URL=https://votre-frontend.vercel.app
MOBILE_APP_URL=exp://localhost:8081

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 5. Générer des Secrets Sécurisés

**Windows (PowerShell)** :
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**Linux/Mac** :
```bash
openssl rand -base64 32
```

Ou utilisez : https://www.lastpass.com/fr/features/password-generator

### 6. Exécuter les Migrations

**Option A : Via Railway CLI (Recommandé)**

```bash
# Installer Railway CLI
npm install -g @railway/cli

# Se connecter
railway login

# Lier le projet
cd server
railway link

# Exécuter les migrations
railway run npx prisma migrate deploy

# Exécuter le seed (optionnel)
railway run npm run prisma:seed
```

**Option B : Via Railway Dashboard**

1. Allez dans votre service
2. Cliquez sur **"Deployments"** → Dernier déploiement
3. Ouvrez la console
4. Exécutez :
   ```bash
   npx prisma migrate deploy
   npm run prisma:seed
   ```

### 7. Obtenir l'URL de l'API

1. Allez dans **"Settings"** de votre service
2. Activez **"Generate Domain"**
3. Votre API sera sur : `https://votre-projet.up.railway.app`

### 8. Tester

```bash
# Health check
curl https://votre-projet.up.railway.app/health
```

## ✅ Checklist

- [ ] Compte Railway créé
- [ ] Projet créé et lié à GitHub
- [ ] PostgreSQL ajouté
- [ ] Variables d'environnement configurées
- [ ] Secrets JWT générés
- [ ] Migrations exécutées
- [ ] Seed exécuté (optionnel)
- [ ] URL publique générée
- [ ] Health check fonctionne

## 🔗 Mettre à jour le Frontend

Dans `client/constants/config.ts` :

```typescript
BASE_URL: __DEV__ 
  ? 'http://localhost:5000'
  : 'https://votre-projet.up.railway.app',
```

## 📚 Documentation Complète

Voir `DEPLOY_RAILWAY.md` pour plus de détails.

## 🆘 Problèmes ?

- Vérifiez les logs dans Railway Dashboard
- Vérifiez que toutes les variables sont configurées
- Vérifiez que les migrations ont été exécutées


# 🎉 Prochaines Étapes après Déploiement Railway

Votre backend est maintenant déployé sur Railway ! 🚀

**URL de votre API** : `https://tchinda-production.up.railway.app`

## ✅ Étape 1 : Tester l'API

Testez que votre API fonctionne :

```bash
# Health check
curl https://tchinda-production.up.railway.app/health
```

Vous devriez voir :
```json
{
  "status": "OK",
  "message": "TCHINDA API is running",
  "timestamp": "..."
}
```

## 🔧 Étape 2 : Exécuter les Migrations Prisma

Vous devez exécuter les migrations pour créer les tables dans votre base de données Supabase.

### Option A : Via Railway CLI (Recommandé)

```bash
# Installer Railway CLI (si pas déjà fait)
npm install -g @railway/cli

# Se connecter
railway login

# Lier le projet (dans le dossier server)
cd server
railway link

# Exécuter les migrations
railway run npx prisma migrate deploy

# (Optionnel) Exécuter le seed pour créer un admin
railway run npm run prisma:seed
```

### Option B : Via Railway Dashboard

1. Allez dans votre service sur Railway
2. Cliquez sur **"Deployments"**
3. Cliquez sur le dernier déploiement
4. Cliquez sur **"View Logs"** ou **"Open Shell"**
5. Exécutez :
   ```bash
   npx prisma migrate deploy
   npm run prisma:seed
   ```

## 🔐 Étape 3 : Vérifier les Variables d'Environnement

Assurez-vous que toutes les variables sont configurées dans Railway :

**Variables obligatoires** :
- ✅ `DATABASE_URL` (votre URL Supabase)
- ✅ `JWT_SECRET` (généré)
- ✅ `JWT_REFRESH_SECRET` (généré)
- ✅ `NODE_ENV=production`
- ✅ `PORT` (défini automatiquement par Railway)

**Variables optionnelles** (pour plus tard) :
- `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS`
- `SMS_PROVIDER`, `TWILIO_ACCOUNT_SID`, etc.

## 🌐 Étape 4 : Mettre à jour le Frontend

Mettez à jour `client/constants/config.ts` pour utiliser l'URL Railway en production :

```typescript
export const API_CONFIG = {
  BASE_URL: __DEV__ 
    ? 'http://localhost:5000' // Développement local
    : 'https://tchinda-production.up.railway.app', // Production Railway
  // ...
};
```

## 🧪 Étape 5 : Tester l'Inscription et la Connexion

Testez depuis votre frontend ou avec curl :

```bash
# Test d'inscription
curl -X POST https://tchinda-production.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!",
    "accountType": "BUYER",
    "firstName": "Test",
    "lastName": "User"
  }'
```

## 🔄 Étape 6 : Configurer CORS (si nécessaire)

Si vous avez des erreurs CORS depuis le frontend, ajoutez dans Railway :

**Variable d'environnement** :
```
FRONTEND_URL=https://votre-frontend.vercel.app
```

Ou pour tester en local :
```
FRONTEND_URL=http://localhost:8081
```

## 📊 Étape 7 : Monitoring

Railway fournit automatiquement :
- **Logs en temps réel** : Dashboard → Deployments → View Logs
- **Métriques** : CPU, Mémoire, Requêtes
- **Domaines personnalisés** : Settings → Generate Domain

## ✅ Checklist Finale

- [ ] API répond sur `/health`
- [ ] Migrations Prisma exécutées
- [ ] Seed exécuté (admin créé)
- [ ] Variables d'environnement configurées
- [ ] Frontend mis à jour avec l'URL Railway
- [ ] Test d'inscription fonctionne
- [ ] Test de connexion fonctionne
- [ ] CORS configuré (si nécessaire)

## 🎯 Votre API est Prête !

Votre backend est maintenant accessible publiquement sur :
**https://tchinda-production.up.railway.app**

Vous pouvez maintenant :
- Connecter votre frontend React Native
- Tester depuis n'importe où
- Partager l'API avec votre équipe

## 🆘 Problèmes Courants

### Erreur : "Database connection failed"
- Vérifiez que `DATABASE_URL` pointe vers Supabase
- Vérifiez que Supabase accepte les connexions externes

### Erreur : "Prisma Client not generated"
- Exécutez : `railway run npx prisma generate`

### Erreur CORS
- Ajoutez `FRONTEND_URL` dans les variables d'environnement

### Erreur : "JWT_SECRET not defined"
- Vérifiez que toutes les variables JWT sont configurées


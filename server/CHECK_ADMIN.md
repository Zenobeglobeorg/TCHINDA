# 🔍 Vérifier et Créer l'Admin sur Railway

## Problème : Erreur 401 - Email ou mot de passe incorrect

Cela signifie que l'admin n'existe probablement pas dans la base de données Railway.

## ✅ Solution : Exécuter le Seed sur Railway

### Option 1 : Via Railway CLI (Recommandé)

```bash
# Installer Railway CLI (si pas déjà fait)
npm install -g @railway/cli

# Se connecter
railway login

# Lier le projet
cd server
railway link

# Exécuter le seed pour créer l'admin
railway run npm run prisma:seed
```

### Option 2 : Via Railway Dashboard

1. Allez dans votre service sur Railway
2. Cliquez sur **"Deployments"** → Dernier déploiement
3. Ouvrez la console/shell
4. Exécutez :
   ```bash
   npm run prisma:seed
   ```

## 🔐 Identifiants Admin

Après avoir exécuté le seed, utilisez :

- **Email** : `admin@tchinda.com`
- **Mot de passe** : `Admin@1234`

## ⚠️ Important

Assurez-vous que :
1. ✅ Les migrations Prisma ont été exécutées : `railway run npx prisma migrate deploy`
2. ✅ Le seed a été exécuté : `railway run npm run prisma:seed`
3. ✅ La variable `DATABASE_URL` est bien configurée dans Railway

## 🧪 Tester la Connexion

Une fois le seed exécuté, testez :

```bash
curl -X POST https://tchinda-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@tchinda.com",
    "password": "Admin@1234"
  }'
```

Vous devriez recevoir un token JWT si la connexion réussit.


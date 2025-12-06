# 🧪 Tester l'API Railway

Votre API est déployée sur : **https://tchinda-production.up.railway.app**

## Tests Rapides

### 1. Health Check

```bash
curl https://tchinda-production.up.railway.app/health
```

**Résultat attendu** :
```json
{
  "status": "OK",
  "message": "TCHINDA API is running",
  "timestamp": "2025-12-06T..."
}
```

### 2. Test d'Inscription

```bash
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

**Résultat attendu** :
```json
{
  "success": true,
  "message": "Inscription réussie",
  "data": {
    "user": {...},
    "token": "...",
    "refreshToken": "..."
  }
}
```

### 3. Test de Connexion

```bash
curl -X POST https://tchinda-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!"
  }'
```

## ⚠️ Important : Exécuter les Migrations

Avant de tester l'inscription, vous DEVEZ exécuter les migrations Prisma :

```bash
# Via Railway CLI
railway run npx prisma migrate deploy

# Puis créer un admin (optionnel)
railway run npm run prisma:seed
```

Sans les migrations, vous aurez une erreur de base de données !


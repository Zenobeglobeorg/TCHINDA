# 🔧 Résoudre l'Erreur CORS avec Vercel

Ce guide explique comment résoudre l'erreur CORS lorsque ton frontend est déployé sur Vercel.

## ❌ Erreur Rencontrée

```
Access to fetch at 'https://tchinda-production.up.railway.app/api/auth/login' 
from origin 'https://tchinda-three.vercel.app' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## 🔍 Cause du Problème

Le backend Railway bloque les requêtes provenant de `https://tchinda-three.vercel.app` car cette origine n'est pas dans la liste des origines autorisées dans la configuration CORS.

## ✅ Solution : Redéployer le Backend

Le code du backend a été mis à jour pour **accepter automatiquement tous les domaines Vercel** (`*.vercel.app`). Tu dois juste redéployer ton backend sur Railway.

### Option 1 : Via Git (Recommandé)

Si ton backend est déjà sur GitHub :

1. **Commit les changements** :
```powershell
cd "C:\Users\FABRICIA\Mes_projets\projet cthinda\TCHINDA\server"
git add .
git commit -m "Fix CORS: Autoriser automatiquement les domaines Vercel"
git push
```

2. **Railway redéploiera automatiquement** si ton repo GitHub est connecté à Railway.

### Option 2 : Via Railway Dashboard (Manuel)

Si tu ne veux pas utiliser Git :

1. **Va sur Railway Dashboard** : [railway.app](https://railway.app)
2. **Sélectionne ton projet** (TCHINDA backend)
3. **Clique sur "Deployments"** → **"Redeploy"** ou **"Deploy Latest"**
4. **Attends** que le déploiement se termine (2-3 minutes)

### Option 3 : Ajouter l'URL Manuellement dans Railway (Alternative)

Si tu veux être plus spécifique, tu peux ajouter l'URL Vercel dans les variables d'environnement :

1. **Va sur Railway Dashboard** → Ton projet → **Variables**
2. **Ajoute une nouvelle variable** :
   - **Name** : `FRONTEND_URLS`
   - **Value** : `https://tchinda-three.vercel.app`
   - (Ou plusieurs URLs séparées par des virgules : `https://tchinda-three.vercel.app,https://www.tchinda.com`)
3. **Redéploie** ton service (Railway le fera automatiquement)

## 🎯 Solution Automatique (Déjà Implémentée)

Le code a été mis à jour pour **accepter automatiquement tous les domaines `*.vercel.app`** sans configuration supplémentaire. Cela signifie que :

- ✅ `https://tchinda-three.vercel.app` → **Autorisé automatiquement**
- ✅ `https://tchinda-market-xyz.vercel.app` → **Autorisé automatiquement**
- ✅ Tous les domaines `*.vercel.app` → **Autorisés automatiquement**

**Tu n'as plus besoin d'ajouter chaque URL Vercel manuellement !**

## 🔄 Comment Redéployer le Backend

### Méthode 1 : Via Railway Dashboard

1. Ouvre [railway.app](https://railway.app)
2. Sélectionne ton projet backend
3. Clique sur l'onglet **"Deployments"**
4. Clique sur **"Redeploy"** ou le bouton **"Deploy Latest"**
5. Attends 2-3 minutes

### Méthode 2 : Via GitHub (Si connecté)

1. Commits les changements :
```powershell
cd "C:\Users\FABRICIA\Mes_projets\projet cthinda\TCHINDA\server"
git add src/server.js
git commit -m "Fix CORS pour Vercel"
git push
```

2. Railway redéploiera automatiquement

### Méthode 3 : Via Railway CLI

Si tu as Railway CLI installé :

```powershell
cd "C:\Users\FABRICIA\Mes_projets\projet cthinda\TCHINDA\server"
railway up
```

## ✅ Vérifier que ça Fonctionne

Après le redéploiement :

1. **Attends 2-3 minutes** que le backend redémarre
2. **Ouvre ton app Vercel** : `https://tchinda-three.vercel.app`
3. **Essaie de te connecter**
4. **Ouvre la console du navigateur** (F12) → Onglet **Network**
5. **Vérifie que les requêtes fonctionnent** (statut 200 OK au lieu de CORS error)

### Test Rapide

Tu peux tester avec curl depuis PowerShell :

```powershell
curl -X OPTIONS https://tchinda-production.up.railway.app/api/auth/login `
  -H "Origin: https://tchinda-three.vercel.app" `
  -H "Access-Control-Request-Method: POST" `
  -H "Access-Control-Request-Headers: Content-Type" `
  -v
```

Tu devrais voir dans les headers de réponse :
```
Access-Control-Allow-Origin: https://tchinda-three.vercel.app
```

## 🐛 Si ça ne Fonctionne Toujours Pas

### Vérification 1 : Le backend est-il bien redéployé ?

1. Va sur Railway Dashboard → Deployments
2. Vérifie que le dernier déploiement est récent (il y a moins de 5 minutes)
3. Clique sur le déploiement → Vérifie les logs pour voir s'il n'y a pas d'erreurs

### Vérification 2 : Les logs du backend

1. Railway Dashboard → Ton projet → **Deployments** → Clique sur le dernier → **Logs**
2. Cherche des erreurs liées à CORS ou au démarrage

### Vérification 3 : Vérifier la configuration CORS

Si tu veux vérifier que la configuration CORS est correcte, tu peux tester directement :

```powershell
# Test de la route /health
curl https://tchinda-production.up.railway.app/health

# Test CORS avec ton domaine Vercel
curl -X OPTIONS https://tchinda-production.up.railway.app/api/auth/login `
  -H "Origin: https://tchinda-three.vercel.app" `
  -H "Access-Control-Request-Method: POST" `
  -i
```

### Si le problème persiste

1. **Vérifie que le code a bien été mis à jour** : Ouvre `server/src/server.js` et cherche la ligne avec `origin.endsWith('.vercel.app')`
2. **Vérifie que Railway a bien redéployé** : Les logs doivent montrer le nouveau démarrage du serveur
3. **Vide le cache de ton navigateur** : Ctrl + Shift + R (Windows) ou Cmd + Shift + R (Mac)
4. **Ouvre en navigation privée** pour éviter le cache

## 📚 Documentation Complémentaire

- [Documentation CORS MDN](https://developer.mozilla.org/fr/docs/Web/HTTP/CORS)
- [Documentation Railway](https://docs.railway.app)
- [Documentation Express CORS](https://expressjs.com/en/resources/middleware/cors.html)

## 🎉 Résultat Attendu

Après le redéploiement, tu devrais pouvoir :
- ✅ Te connecter depuis `https://tchinda-three.vercel.app`
- ✅ T'inscrire avec un nouveau compte
- ✅ Utiliser toutes les fonctionnalités de l'API sans erreur CORS

---

**Note** : Les changements de code dans `server/src/server.js` permettent maintenant d'accepter automatiquement tous les domaines Vercel. Tu n'as plus besoin de configurer chaque URL individuellement dans Railway ! 🚀

# 🔧 Correction du Problème Railway

## Problème identifié

Railway essaie d'utiliser `npm ci` mais ne trouve pas le `package-lock.json` dans le contexte de build.

## Solutions

### ✅ Solution 1 : Vérifier la configuration du Root Directory

Dans Railway Dashboard :

1. Allez dans votre **service** (pas le projet)
2. Cliquez sur **"Settings"**
3. Vérifiez la section **"Root Directory"**
4. Assurez-vous que c'est bien défini sur : **`server`**

Si ce n'est pas le cas :
- Définissez **Root Directory** = `server`
- Redéployez

### ✅ Solution 2 : Utiliser la détection automatique (Recommandé)

J'ai supprimé le fichier `nixpacks.toml` pour laisser Railway détecter automatiquement.

Railway devrait maintenant :
1. Détecter automatiquement Node.js
2. Exécuter `npm install` (au lieu de `npm ci`)
3. Exécuter automatiquement `npm run postinstall` (génère Prisma)
4. Démarrer avec `npm start`

### ✅ Solution 3 : Si Railway utilise toujours npm ci

Si Railway utilise toujours `npm ci`, vous pouvez forcer `npm install` en créant un fichier `.railwayignore` (déjà créé) et en ajoutant cette variable d'environnement dans Railway :

**Variable d'environnement** :
```
RAILWAY_NPM_COMMAND=install
```

Ou créez un fichier `Procfile` dans le dossier `server` :

```
web: npm start
```

### ✅ Solution 4 : Vérifier que package-lock.json est bien présent

Le fichier est bien dans Git. Vérifiez dans Railway :

1. Allez dans **"Deployments"**
2. Cliquez sur le dernier déploiement
3. Ouvrez les **logs de build**
4. Vérifiez si `package-lock.json` est mentionné

## Configuration Supabase

Puisque vous utilisez Supabase, assurez-vous que dans Railway :

1. **Variables d'environnement** → Ajoutez :
   ```
   DATABASE_URL=votre-url-supabase-complete
   ```
   
   Format Supabase :
   ```
   postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?sslmode=require
   ```

2. **Ne créez PAS** de base de données PostgreSQL dans Railway (vous utilisez Supabase)

## Étapes pour redéployer

1. **Commitez les changements** (suppression de nixpacks.toml) :
   ```bash
   cd server
   git add .
   git commit -m "Fix Railway build configuration"
   git push
   ```

2. **Dans Railway Dashboard** :
   - Vérifiez que **Root Directory** = `server`
   - Vérifiez les **Variables d'environnement**
   - Railway redéploiera automatiquement

3. **Surveillez les logs** :
   - Allez dans **"Deployments"**
   - Regardez les logs en temps réel
   - Vérifiez que `npm install` s'exécute correctement

## Vérification finale

Après le déploiement, testez :

```bash
curl https://votre-projet.up.railway.app/health
```

Vous devriez voir :
```json
{
  "status": "OK",
  "message": "TCHINDA API is running",
  "timestamp": "..."
}
```

## Si le problème persiste

1. **Vérifiez les logs complets** dans Railway
2. **Vérifiez que toutes les variables d'environnement sont configurées**
3. **Vérifiez que DATABASE_URL pointe vers Supabase**
4. **Essayez de redéployer manuellement** : Settings → Redeploy


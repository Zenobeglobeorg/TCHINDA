# Explication du Processus de Paiement Mobile Money

## État Actuel (Simulation)

### Comment ça fonctionne actuellement :

1. **Initiation du paiement** (`initiateMobileMoneyPayment`) :
   - L'utilisateur entre son numéro de téléphone et choisit MTN ou Orange
   - Le système génère une référence de paiement unique
   - **IMPORTANT** : Actuellement, **AUCUN SMS n'est réellement envoyé**
   - Le système simule l'envoi d'un SMS et stocke le paiement en mémoire (Map)

2. **Confirmation du paiement** (`confirmMobileMoneyPayment`) :
   - L'utilisateur entre un code de confirmation (pour test : `123456`)
   - Le système vérifie le code (actuellement accepte `123456` ou n'importe quel code)
   - Si confirmé, le paiement est marqué comme `COMPLETED`
   - Le portefeuille est crédité (si DEPOSIT) ou la commande est marquée comme payée (si ORDER)

### Limitations actuelles :

- ❌ **Pas d'envoi réel de SMS** : Les SMS ne sont pas envoyés
- ❌ **Stockage en mémoire** : Les paiements sont stockés dans une Map JavaScript (perdus au redémarrage)
- ❌ **Pas de vérification réelle** : Le code de confirmation est simulé
- ❌ **Pas d'intégration avec MTN/Orange** : Aucune API réelle n'est appelée

## Processus Réel avec MTN MoMo API

### Ce qui doit être fait pour intégrer l'API MTN MoMo :

1. **Inscription sur MTN Developer Portal** :
   - URL : https://momodeveloper.mtn.com
   - Identifiants : à ne jamais écrire dans le dépôt (voir le gestionnaire de mots de passe de l'équipe)

2. **Obtenir les clés API** :
   - Subscription Key (Primary/Secondary)
   - API User ID
   - API Key
   - Target Environment (sandbox ou production)

3. **Intégration dans le code** :
   - Appeler l'API MTN MoMo pour initier le paiement
   - L'API MTN enverra réellement un SMS au client
   - Le client confirmera via son téléphone
   - MTN enverra un webhook pour confirmer le paiement

### Flux réel avec MTN MoMo :

```
1. Client entre numéro → Backend appelle MTN API
2. MTN envoie SMS réel au client
3. Client confirme sur son téléphone MTN
4. MTN envoie webhook au backend
5. Backend met à jour le statut du paiement
```

### Obtenir les clés (sandbox)

1. Créer un compte sur le portail, puis s'abonner au produit « Collections » : la Subscription Key (Primary) est dans Profile > Subscriptions.
2. Générer l'API User et l'API Key avec le script fourni, depuis le dossier `server` :
   `node scripts/momo-setup.mjs <SUBSCRIPTION_KEY>`
3. Copier les lignes `MOMO_*` affichées dans `server/.env` (fichier ignoré par git, ne jamais le commiter).
4. Webhooks : `MOMO_CALLBACK_URL` est optionnel, l'application vérifie déjà le statut par polling.

## Note Importante

Ne jamais écrire de mot de passe ou de clé API dans ce dépôt : uniquement dans `server/.env`.

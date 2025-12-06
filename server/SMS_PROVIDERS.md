# 📱 Configuration des Providers SMS - TCHINDA

## ✅ Système Modulaire Implémenté

Le système SMS a été refactorisé pour supporter **plusieurs fournisseurs SMS**. Vous pouvez facilement changer de provider en modifiant une seule variable d'environnement.

## 🎯 Providers Disponibles

### 1. **Test** (Par défaut - Développement)
- **Provider** : `test`
- **Avantages** : Aucune configuration nécessaire, affiche les SMS dans la console
- **Utilisation** : Parfait pour le développement et les tests

### 2. **Twilio** (Recommandé pour production)
- **Provider** : `twilio`
- **Avantages** : Très fiable, bonne couverture mondiale, API simple
- **Coût** : ~$0.0075/SMS
- **Documentation** : [Twilio Docs](https://www.twilio.com/docs)

### 3. **MessageBird** (Alternative populaire)
- **Provider** : `messagebird`
- **Avantages** : Bonne couverture, prix compétitifs, API simple
- **Coût** : Variable selon le pays
- **Documentation** : [MessageBird Docs](https://developers.messagebird.com/)

### 4. **Vonage** (ex-Nexmo)
- **Provider** : `vonage`
- **Avantages** : Bonne couverture, API robuste
- **Coût** : Variable selon le pays
- **Documentation** : [Vonage Docs](https://developer.vonage.com/)

### 5. **AWS SNS** (Pour utilisateurs AWS)
- **Provider** : `aws-sns`
- **Avantages** : Intégration AWS, scalable, fiable
- **Coût** : Variable selon la région
- **Documentation** : [AWS SNS Docs](https://docs.aws.amazon.com/sns/)

## ⚙️ Configuration

### Étape 1 : Choisir votre Provider

Dans votre fichier `.env`, définissez le provider :

```env
SMS_PROVIDER=test  # test, twilio, messagebird, vonage, aws-sns
```

### Étape 2 : Configurer les Credentials

#### Configuration Twilio

```env
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID="your-account-sid"
TWILIO_AUTH_TOKEN="your-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"
```

**Comment obtenir les credentials :**
1. Créez un compte sur [Twilio](https://www.twilio.com/)
2. Allez dans le Dashboard
3. Copiez l'Account SID et l'Auth Token
4. Obtenez un numéro de téléphone Twilio

#### Configuration MessageBird

```env
SMS_PROVIDER=messagebird
MESSAGEBIRD_API_KEY="your-api-key"
MESSAGEBIRD_ORIGINATOR="TCHINDA"  # Optionnel
```

**Comment obtenir les credentials :**
1. Créez un compte sur [MessageBird](https://www.messagebird.com/)
2. Allez dans Settings > API access
3. Créez une nouvelle API key
4. Copiez la clé API

**Installation :**
```bash
npm install messagebird
```

#### Configuration Vonage

```env
SMS_PROVIDER=vonage
VONAGE_API_KEY="your-api-key"
VONAGE_API_SECRET="your-api-secret"
VONAGE_BRAND_NAME="TCHINDA"  # Optionnel
```

**Comment obtenir les credentials :**
1. Créez un compte sur [Vonage](https://www.vonage.com/)
2. Allez dans Dashboard > API Settings
3. Copiez l'API Key et l'API Secret

**Installation :**
```bash
npm install @vonage/server-sdk
```

#### Configuration AWS SNS

```env
SMS_PROVIDER=aws-sns
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"  # Optionnel, défaut: us-east-1
```

**Comment obtenir les credentials :**
1. Créez un compte AWS
2. Allez dans IAM > Users
3. Créez un utilisateur avec les permissions SNS
4. Générez les Access Keys

**Installation :**
```bash
npm install @aws-sdk/client-sns
```

## 📦 Installation des Dépendances

### Installation Complète (Tous les providers)

```bash
npm install twilio messagebird @vonage/server-sdk @aws-sdk/client-sns
```

### Installation Sélective

Installez uniquement le provider que vous utilisez :

```bash
# Pour Twilio uniquement
npm install twilio

# Pour MessageBird uniquement
npm install messagebird

# Pour Vonage uniquement
npm install @vonage/server-sdk

# Pour AWS SNS uniquement
npm install @aws-sdk/client-sns
```

## 🚀 Utilisation

Une fois configuré, le système utilise automatiquement le provider choisi. Aucun changement de code n'est nécessaire !

```javascript
// Le service SMS détecte automatiquement le provider configuré
import { sendSMS } from './services/sms.service.js';

// Envoie un SMS avec le provider configuré
await sendSMS('+221771234567', 'Votre message');
```

## 🔄 Changer de Provider

Pour changer de provider, modifiez simplement la variable `SMS_PROVIDER` dans `.env` :

```env
# Passer de Twilio à MessageBird
SMS_PROVIDER=messagebird
```

Redémarrez le serveur et le nouveau provider sera utilisé automatiquement.

## 🧪 Mode Test

Le mode test est activé par défaut et ne nécessite aucune configuration. Les SMS sont affichés dans la console :

```
📱 SMS (mode test):
To: +221771234567
Message: Votre code de vérification TCHINDA est : 123456
---
```

## 📊 Comparaison des Providers

| Provider | Coût/SMS | Couverture | Facilité | Recommandation |
|----------|----------|------------|----------|----------------|
| **Test** | Gratuit | - | ⭐⭐⭐⭐⭐ | Développement |
| **Twilio** | ~$0.0075 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Production |
| **MessageBird** | Variable | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Alternative |
| **Vonage** | Variable | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Alternative |
| **AWS SNS** | Variable | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Si déjà sur AWS |

## 🎯 Recommandations

### Pour le Développement
- Utilisez `SMS_PROVIDER=test` (par défaut)
- Aucune configuration nécessaire
- Les SMS s'affichent dans la console

### Pour la Production

**Option 1 : Twilio** (Recommandé)
- Très fiable et populaire
- Bonne documentation
- Support client excellent
- Configuration simple

**Option 2 : MessageBird**
- Bonne alternative à Twilio
- Prix compétitifs
- API simple

**Option 3 : AWS SNS**
- Si vous utilisez déjà AWS
- Intégration facile avec d'autres services AWS
- Scalable

## 🔧 Ajouter un Nouveau Provider

Si vous voulez ajouter un autre provider (ex: Plivo, Bandwidth), créez un nouveau fichier dans `server/src/services/sms-providers/` :

```javascript
// server/src/services/sms-providers/mon-provider.provider.js
export class MonProvider {
  constructor(config) {
    this.apiKey = config.apiKey;
  }

  async sendSMS(to, message) {
    // Implémentez l'envoi SMS
    return {
      success: true,
      messageId: '...',
      provider: 'mon-provider',
    };
  }
}
```

Puis ajoutez-le dans `sms.service.js` :

```javascript
import { MonProvider } from './sms-providers/mon-provider.provider.js';

// Dans initSMSProvider()
case 'mon-provider':
  smsProvider = new MonProvider({
    apiKey: process.env.MON_PROVIDER_API_KEY,
  });
  break;
```

## 🐛 Dépannage

### Provider non reconnu

Vérifiez que `SMS_PROVIDER` est en minuscules et correspond exactement à un provider disponible.

### Credentials manquants

Si les credentials ne sont pas configurés, le système bascule automatiquement en mode test.

### Erreur d'envoi

1. Vérifiez les logs du serveur
2. Vérifiez que les credentials sont corrects
3. Vérifiez que le numéro est au format international (+221...)
4. Vérifiez que vous avez des crédits sur votre compte

## 📝 Notes

- Le système bascule automatiquement en mode test si les credentials sont manquants
- Tous les providers utilisent la même interface, donc le code reste identique
- Vous pouvez facilement tester différents providers en changeant juste la variable d'environnement
- Les dépendances sont optionnelles - installez seulement ce dont vous avez besoin

## ✨ Avantages de ce Système

1. **Flexibilité** : Changez de provider sans modifier le code
2. **Test facile** : Mode test intégré pour le développement
3. **Extensible** : Facile d'ajouter de nouveaux providers
4. **Robuste** : Bascule automatique en mode test si configuration manquante
5. **Maintenable** : Code propre et modulaire



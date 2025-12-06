import { TwilioProvider } from './sms-providers/twilio.provider.js';
import { MessageBirdProvider } from './sms-providers/messagebird.provider.js';
import { VonageProvider } from './sms-providers/vonage.provider.js';
import { AWSSNSProvider } from './sms-providers/aws-sns.provider.js';
import { TestProvider } from './sms-providers/test.provider.js';

let smsProvider = null;

/**
 * Initialise le provider SMS selon la configuration
 */
const initSMSProvider = () => {
  if (smsProvider) return smsProvider;

  const providerType = process.env.SMS_PROVIDER?.toLowerCase() || 'test';

  switch (providerType) {
    case 'twilio':
      if (!process.env.TWILIO_ACCOUNT_SID) {
        console.warn('⚠️  Twilio configuré mais credentials manquants. Utilisation du mode test.');
        smsProvider = new TestProvider();
        return smsProvider;
      }
      smsProvider = new TwilioProvider({
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        phoneNumber: process.env.TWILIO_PHONE_NUMBER,
      });
      break;

    case 'messagebird':
      if (!process.env.MESSAGEBIRD_API_KEY) {
        console.warn('⚠️  MessageBird configuré mais credentials manquants. Utilisation du mode test.');
        smsProvider = new TestProvider();
        return smsProvider;
      }
      smsProvider = new MessageBirdProvider({
        apiKey: process.env.MESSAGEBIRD_API_KEY,
        originator: process.env.MESSAGEBIRD_ORIGINATOR || 'TCHINDA',
      });
      break;

    case 'vonage':
      if (!process.env.VONAGE_API_KEY) {
        console.warn('⚠️  Vonage configuré mais credentials manquants. Utilisation du mode test.');
        smsProvider = new TestProvider();
        return smsProvider;
      }
      smsProvider = new VonageProvider({
        apiKey: process.env.VONAGE_API_KEY,
        apiSecret: process.env.VONAGE_API_SECRET,
        brandName: process.env.VONAGE_BRAND_NAME || 'TCHINDA',
      });
      break;

    case 'aws-sns':
      if (!process.env.AWS_ACCESS_KEY_ID) {
        console.warn('⚠️  AWS SNS configuré mais credentials manquants. Utilisation du mode test.');
        smsProvider = new TestProvider();
        return smsProvider;
      }
      smsProvider = new AWSSNSProvider({
        region: process.env.AWS_REGION || 'us-east-1',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      });
      break;

    case 'test':
    default:
      smsProvider = new TestProvider();
      break;
  }

  return smsProvider;
};

/**
 * Envoie un SMS
 */
export const sendSMS = async (to, message) => {
  try {
    const provider = initSMSProvider();
    const result = await provider.sendSMS(to, message);
    console.log(`✅ SMS envoyé via ${result.provider}:`, result.messageId || result.messageSid || 'OK');
    return result;
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi du SMS:', error);
    throw new Error(`Erreur lors de l'envoi du SMS: ${error.message}`);
  }
};

/**
 * Envoie un code de vérification par SMS
 */
export const sendVerificationCodeSMS = async (phone, code) => {
  const message = `Votre code de vérification TCHINDA est : ${code}\n\nCe code est valide pendant 10 minutes.\n\nSi vous n'avez pas demandé ce code, ignorez ce message.`;
  
  return await sendSMS(phone, message);
};

/**
 * Envoie un SMS de notification
 */
export const sendNotificationSMS = async (phone, message) => {
  const fullMessage = `TCHINDA : ${message}`;
  return await sendSMS(phone, fullMessage);
};

/**
 * Provider SMS Vonage (ex-Nexmo) - API REST uniquement (sans SDK)
 * Évite les erreurs ESM du @vonage/server-sdk sur Railway/Node 24.
 */
const VONAGE_SMS_URL = 'https://rest.nexmo.com/sms/json';

export class VonageProvider {
  constructor(config) {
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.brandName = config.brandName || 'TCHINDA';
  }

  /**
   * Envoie un SMS via l'API REST Vonage
   */
  async sendSMS(to, message) {
    try {
      const body = new URLSearchParams({
        api_key: this.apiKey,
        api_secret: this.apiSecret,
        from: this.brandName,
        to: String(to).replace(/\D/g, ''),
        text: message,
      });

      const res = await fetch(VONAGE_SMS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });

      const data = await res.json();

      if (!data.messages || data.messages.length === 0) {
        throw new Error(data['error-text'] || 'Réponse Vonage invalide');
      }

      const msg = data.messages[0];
      if (msg.status === '0') {
        return {
          success: true,
          messageId: msg['message-id'],
          provider: 'vonage',
        };
      }

      throw new Error(msg['error-text'] || `Vonage status ${msg.status}`);
    } catch (error) {
      throw new Error(`Erreur Vonage: ${error.message}`);
    }
  }
}

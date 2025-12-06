import { Vonage } from '@vonage/server-sdk';

/**
 * Provider SMS Vonage (ex-Nexmo)
 */
export class VonageProvider {
  constructor(config) {
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.brandName = config.brandName || 'TCHINDA';
    this.client = null;
  }

  /**
   * Initialise le client Vonage
   */
  init() {
    if (!this.client) {
      this.client = new Vonage({
        apiKey: this.apiKey,
        apiSecret: this.apiSecret,
      });
    }
    return this.client;
  }

  /**
   * Envoie un SMS
   */
  async sendSMS(to, message) {
    try {
      const client = this.init();
      
      const result = await client.sms.send({
        to: to,
        from: this.brandName,
        text: message,
      });

      if (result.messages[0].status === '0') {
        return {
          success: true,
          messageId: result.messages[0]['message-id'],
          provider: 'vonage',
        };
      } else {
        throw new Error(result.messages[0]['error-text']);
      }
    } catch (error) {
      throw new Error(`Erreur Vonage: ${error.message}`);
    }
  }
}



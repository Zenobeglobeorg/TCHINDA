import twilio from 'twilio';

/**
 * Provider SMS Twilio
 */
export class TwilioProvider {
  constructor(config) {
    this.accountSid = config.accountSid;
    this.authToken = config.authToken;
    this.phoneNumber = config.phoneNumber;
    this.client = null;
  }

  /**
   * Initialise le client Twilio
   */
  init() {
    if (!this.client) {
      this.client = twilio(this.accountSid, this.authToken);
    }
    return this.client;
  }

  /**
   * Envoie un SMS
   */
  async sendSMS(to, message) {
    try {
      const client = this.init();
      const result = await client.messages.create({
        body: message,
        from: this.phoneNumber,
        to: to,
      });

      return {
        success: true,
        messageSid: result.sid,
        provider: 'twilio',
      };
    } catch (error) {
      throw new Error(`Erreur Twilio: ${error.message}`);
    }
  }
}



import messagebird from 'messagebird';

/**
 * Provider SMS MessageBird
 */
export class MessageBirdProvider {
  constructor(config) {
    this.apiKey = config.apiKey;
    this.originator = config.originator || 'TCHINDA';
    this.client = null;
  }

  /**
   * Initialise le client MessageBird
   */
  init() {
    if (!this.client) {
      this.client = messagebird(this.apiKey);
    }
    return this.client;
  }

  /**
   * Envoie un SMS
   */
  async sendSMS(to, message) {
    try {
      const client = this.init();
      
      return new Promise((resolve, reject) => {
        client.messages.create(
          {
            originator: this.originator,
            recipients: [to],
            body: message,
          },
          (err, response) => {
            if (err) {
              reject(new Error(`Erreur MessageBird: ${err.message || err}`));
            } else {
              resolve({
                success: true,
                messageId: response.id,
                provider: 'messagebird',
              });
            }
          }
        );
      });
    } catch (error) {
      throw new Error(`Erreur MessageBird: ${error.message}`);
    }
  }
}



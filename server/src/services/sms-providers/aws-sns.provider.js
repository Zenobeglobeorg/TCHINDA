import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

/**
 * Provider SMS AWS SNS
 */
export class AWSSNSProvider {
  constructor(config) {
    this.region = config.region || 'us-east-1';
    this.accessKeyId = config.accessKeyId;
    this.secretAccessKey = config.secretAccessKey;
    this.client = null;
  }

  /**
   * Initialise le client AWS SNS
   */
  init() {
    if (!this.client) {
      this.client = new SNSClient({
        region: this.region,
        credentials: {
          accessKeyId: this.accessKeyId,
          secretAccessKey: this.secretAccessKey,
        },
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
      
      const command = new PublishCommand({
        PhoneNumber: to,
        Message: message,
        MessageAttributes: {
          'AWS.SNS.SMS.SMSType': {
            DataType: 'String',
            StringValue: 'Transactional',
          },
        },
      });

      const result = await client.send(command);

      return {
        success: true,
        messageId: result.MessageId,
        provider: 'aws-sns',
      };
    } catch (error) {
      throw new Error(`Erreur AWS SNS: ${error.message}`);
    }
  }
}



/**
 * Provider SMS de test (pour développement)
 * Affiche les SMS dans la console au lieu de les envoyer
 */
export class TestProvider {
  constructor(config) {
    this.config = config;
  }

  /**
   * Envoie un SMS (mode test - affichage console)
   */
  async sendSMS(to, message) {
    console.log('📱 SMS (mode test):');
    console.log('To:', to);
    console.log('Message:', message);
    console.log('---');
    
    return {
      success: true,
      message: 'SMS envoyé (mode test)',
      provider: 'test',
    };
  }
}



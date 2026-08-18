import axios from 'axios';
import config from '../config/index.js';

/**
 * Serviço para integração com Evolution API
 * Gerencia instâncias, envio de mensagens e webhooks
 */
class EvolutionApiService {
  constructor() {
    this.baseUrl = config.evolutionApi.url;
    this.apiKey = config.evolutionApi.apiKey;
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.apiKey,
      },
    });
  }

  /**
   * Cria uma nova instância do WhatsApp
   */
  async createInstance(instanceName, webhookUrl) {
    try {
      const response = await this.client.post('/instance/create', {
        instanceName,
        webhook: {
          url: webhookUrl,
          events: ['messages.upsert', 'connection.update', 'qrcode.updated'],
        },
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao criar instância:', error.response?.data || error.message);
      throw new Error('Falha ao criar instância na Evolution API');
    }
  }

  /**
   * Conecta uma instância (gera QR Code)
   */
  async connectInstance(instanceName) {
    try {
      const response = await this.client.get(`/instance/connect/${instanceName}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao conectar instância:', error.response?.data || error.message);
      throw new Error('Falha ao conectar instância');
    }
  }

  /**
   * Obtém QR Code da instância
   */
  async getQrCode(instanceName) {
    try {
      const response = await this.client.get(`/instance/qrcode/${instanceName}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter QR Code:', error.response?.data || error.message);
      throw new Error('Falha ao obter QR Code');
    }
  }

  /**
   * Envia mensagem de texto
   */
  async sendTextMessage(instanceName, phoneNumber, message) {
    try {
      const response = await this.client.post(`/message/sendText/${instanceName}`, {
        number: phoneNumber,
        textMessage: {
          text: message,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error.response?.data || error.message);
      throw new Error('Falha ao enviar mensagem');
    }
  }

  /**
   * Envia imagem
   */
  async sendImageMessage(instanceName, phoneNumber, imageUrl, caption = '') {
    try {
      const response = await this.client.post(`/message/sendMedia/${instanceName}`, {
        number: phoneNumber,
        mediaMessage: {
          mediatype: 'image',
          media: imageUrl,
          caption,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao enviar imagem:', error.response?.data || error.message);
      throw new Error('Falha ao enviar imagem');
    }
  }

  /**
   * Envia áudio
   */
  async sendAudioMessage(instanceName, phoneNumber, audioUrl) {
    try {
      const response = await this.client.post(`/message/sendMedia/${instanceName}`, {
        number: phoneNumber,
        mediaMessage: {
          mediatype: 'audio',
          media: audioUrl,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao enviar áudio:', error.response?.data || error.message);
      throw new Error('Falha ao enviar áudio');
    }
  }

  /**
   * Envia documento
   */
  async sendDocumentMessage(instanceName, phoneNumber, documentUrl, fileName) {
    try {
      const response = await this.client.post(`/message/sendMedia/${instanceName}`, {
        number: phoneNumber,
        mediaMessage: {
          mediatype: 'document',
          media: documentUrl,
          fileName,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao enviar documento:', error.response?.data || error.message);
      throw new Error('Falha ao enviar documento');
    }
  }

  /**
   * Envia botão (interactive message)
   */
  async sendButtonMessage(instanceName, phoneNumber, title, description, buttons) {
    try {
      const response = await this.client.post(`/message/sendButtons/${instanceName}`, {
        number: phoneNumber,
        buttonMessage: {
          title,
          description,
          footerText: 'DiixWhatsapp',
          buttons: buttons.map((btn, index) => ({
            buttonText: { displayText: btn.text },
            buttonId: `btn_${index}`,
          })),
        },
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao enviar botões:', error.response?.data || error.message);
      throw new Error('Falha ao enviar botões');
    }
  }

  /**
   * Envia lista (interactive list)
   */
  async sendListMessage(instanceName, phoneNumber, title, description, sections) {
    try {
      const response = await this.client.post(`/message/sendList/${instanceName}`, {
        number: phoneNumber,
        listMessage: {
          title,
          description,
          footerText: 'DiixWhatsapp',
          buttonText: 'Ver opções',
          sections,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao enviar lista:', error.response?.data || error.message);
      throw new Error('Falha ao enviar lista');
    }
  }

  /**
   * Deleta uma instância
   */
  async deleteInstance(instanceName) {
    try {
      const response = await this.client.delete(`/instance/delete/${instanceName}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao deletar instância:', error.response?.data || error.message);
      throw new Error('Falha ao deletar instância');
    }
  }

  /**
   * Verifica status da conexão
   */
  async checkConnection(instanceName) {
    try {
      const response = await this.client.get(`/instance/connectionState/${instanceName}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao verificar conexão:', error.response?.data || error.message);
      throw new Error('Falha ao verificar conexão');
    }
  }

  /**
   * Logout da instância
   */
  async logoutInstance(instanceName) {
    try {
      const response = await this.client.post(`/instance/logout/${instanceName}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao fazer logout:', error.response?.data || error.message);
      throw new Error('Falha ao fazer logout');
    }
  }

  /**
   * Lista todas as instâncias
   */
  async listInstances() {
    try {
      const response = await this.client.get('/instance/fetchInstances');
      return response.data;
    } catch (error) {
      console.error('Erro ao listar instâncias:', error.response?.data || error.message);
      throw new Error('Falha ao listar instâncias');
    }
  }
}

export default new EvolutionApiService();

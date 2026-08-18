import EvolutionApiService from '../../src/services/EvolutionApiService.js';
import config from '../../src/config/index.js';

// Mock do axios
const mockAxios = {
  create: jest.fn(() => ({
    post: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
  })),
};

jest.mock('axios', () => mockAxios);

describe('EvolutionApiService', () => {
  let service;
  let mockClient;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configurar mock do client
    mockClient = {
      post: jest.fn(),
      get: jest.fn(),
      delete: jest.fn(),
    };
    
    mockAxios.create.mockReturnValue(mockClient);
    
    // Re-importar o serviço após o mock
    service = EvolutionApiService;
  });

  describe('createInstance', () => {
    it('deve criar uma instância com sucesso', async () => {
      const instanceName = 'test-instance';
      const webhookUrl = 'http://test.com/webhook';
      const mockResponse = { instanceId: '123', status: 'created' };

      mockClient.post.mockResolvedValue({ data: mockResponse });

      const result = await service.createInstance(instanceName, webhookUrl);

      expect(mockClient.post).toHaveBeenCalledWith('/instance/create', {
        instanceName,
        webhook: {
          url: webhookUrl,
          events: ['messages.upsert', 'connection.update', 'qrcode.updated'],
        },
      });
      expect(result).toEqual(mockResponse);
    });

    it('deve lançar erro ao falhar na criação da instância', async () => {
      const instanceName = 'test-instance';
      const webhookUrl = 'http://test.com/webhook';

      mockClient.post.mockRejectedValue({
        response: { data: { error: 'Failed' } },
        message: 'Network Error',
      });

      await expect(service.createInstance(instanceName, webhookUrl)).rejects.toThrow(
        'Falha ao criar instância na Evolution API'
      );
    });
  });

  describe('connectInstance', () => {
    it('deve conectar uma instância com sucesso', async () => {
      const instanceName = 'test-instance';
      const mockResponse = { status: 'connected' };

      mockClient.get.mockResolvedValue({ data: mockResponse });

      const result = await service.connectInstance(instanceName);

      expect(mockClient.get).toHaveBeenCalledWith(`/instance/connect/${instanceName}`);
      expect(result).toEqual(mockResponse);
    });

    it('deve lançar erro ao falhar na conexão', async () => {
      const instanceName = 'test-instance';

      mockClient.get.mockRejectedValue(new Error('Connection failed'));

      await expect(service.connectInstance(instanceName)).rejects.toThrow(
        'Falha ao conectar instância'
      );
    });
  });

  describe('getQrCode', () => {
    it('deve obter QR Code com sucesso', async () => {
      const instanceName = 'test-instance';
      const mockResponse = { qrcode: 'data:image/png;base64,...' };

      mockClient.get.mockResolvedValue({ data: mockResponse });

      const result = await service.getQrCode(instanceName);

      expect(mockClient.get).toHaveBeenCalledWith(`/instance/qrcode/${instanceName}`);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('sendTextMessage', () => {
    it('deve enviar mensagem de texto com sucesso', async () => {
      const instanceName = 'test-instance';
      const phoneNumber = '5511999999999';
      const message = 'Hello World';
      const mockResponse = { messageId: 'msg-123' };

      mockClient.post.mockResolvedValue({ data: mockResponse });

      const result = await service.sendTextMessage(instanceName, phoneNumber, message);

      expect(mockClient.post).toHaveBeenCalledWith(`/message/sendText/${instanceName}`, {
        number: phoneNumber,
        textMessage: {
          text: message,
        },
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('sendImageMessage', () => {
    it('deve enviar imagem com sucesso', async () => {
      const instanceName = 'test-instance';
      const phoneNumber = '5511999999999';
      const imageUrl = 'http://example.com/image.jpg';
      const caption = 'Test image';
      const mockResponse = { messageId: 'msg-123' };

      mockClient.post.mockResolvedValue({ data: mockResponse });

      const result = await service.sendImageMessage(instanceName, phoneNumber, imageUrl, caption);

      expect(mockClient.post).toHaveBeenCalledWith(`/message/sendMedia/${instanceName}`, {
        number: phoneNumber,
        mediaMessage: {
          mediatype: 'image',
          media: imageUrl,
          caption,
        },
      });
    });
  });

  describe('deleteInstance', () => {
    it('deve deletar instância com sucesso', async () => {
      const instanceName = 'test-instance';
      const mockResponse = { status: 'deleted' };

      mockClient.delete.mockResolvedValue({ data: mockResponse });

      const result = await service.deleteInstance(instanceName);

      expect(mockClient.delete).toHaveBeenCalledWith(`/instance/delete/${instanceName}`);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('checkConnection', () => {
    it('deve verificar status da conexão com sucesso', async () => {
      const instanceName = 'test-instance';
      const mockResponse = { status: 'open' };

      mockClient.get.mockResolvedValue({ data: mockResponse });

      const result = await service.checkConnection(instanceName);

      expect(mockClient.get).toHaveBeenCalledWith(`/instance/connectionState/${instanceName}`);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('listInstances', () => {
    it('deve listar todas as instâncias com sucesso', async () => {
      const mockResponse = [{ instanceName: 'inst-1', status: 'connected' }];

      mockClient.get.mockResolvedValue({ data: mockResponse });

      const result = await service.listInstances();

      expect(mockClient.get).toHaveBeenCalledWith('/instance/fetchInstances');
      expect(result).toEqual(mockResponse);
    });
  });
});

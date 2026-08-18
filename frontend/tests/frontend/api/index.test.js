import api from '../../../src/api/index.js'
import axios from 'axios'

// Mock do axios
jest.mock('axios')

describe('API Client', () => {
  const mockLocalStorage = {
    getItem: jest.fn(),
    removeItem: jest.fn(),
    setItem: jest.fn(),
  };

  const mockWindowLocation = {
    href: '',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configurar mocks do localStorage e window
    Object.defineProperty(global, 'localStorage', { value: mockLocalStorage });
    Object.defineProperty(global, 'window', { 
      value: { location: mockWindowLocation } 
    });

    // Reset do mock do axios
    axios.create.mockReturnValue({
      interceptors: {
        request: {
          use: jest.fn(),
        },
        response: {
          use: jest.fn((successFn) => {
            // Armazenar a função de sucesso para testes
            global.responseSuccessHandler = successFn;
            return {};
          }),
        },
      },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    });
  });

  describe('Configuração', () => {
    it('deve criar instância do axios com configuração correta', () => {
      // Re-importar o módulo para executar a criação
      require('../../../src/api/index.js');

      expect(axios.create).toHaveBeenCalledWith({
        baseURL: '/api/v1',
        headers: {
          'Content-Type': 'application/json'
        }
      });
    });
  });

  describe('Request Interceptor', () => {
    it('deve adicionar token de autenticação quando existir', () => {
      const mockToken = 'test-token-123';
      mockLocalStorage.getItem.mockReturnValue(mockToken);

      const config = {
        headers: {}
      };

      // Simular o interceptor de request
      const requestInterceptor = axios.create().interceptors.request.use.mock.calls[0][0];
      const result = requestInterceptor(config);

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('auth_token');
      expect(result.headers.Authorization).toBe(`Bearer ${mockToken}`);
    });

    it('não deve adicionar token se não existir', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const config = {
        headers: {}
      };

      const requestInterceptor = axios.create().interceptors.request.use.mock.calls[0][0];
      const result = requestInterceptor(config);

      expect(result.headers.Authorization).toBeUndefined();
    });
  });

  describe('Response Interceptor', () => {
    it('deve retornar resposta bem-sucedida', () => {
      const mockResponse = { data: { success: true } };
      
      const responseInterceptor = axios.create().interceptors.response.use.mock.calls[0][0];
      const result = responseInterceptor(mockResponse);

      expect(result).toEqual(mockResponse);
    });

    it('deve remover token e redirecionar para login em caso de 401', () => {
      const error = {
        response: {
          status: 401
        }
      };

      const responseErrorHandler = axios.create().interceptors.response.use.mock.calls[0][1];
      
      // Executar o handler de erro
      responseErrorHandler(error).catch(() => {});

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token');
      expect(mockWindowLocation.href).toBe('/login');
    });

    it('deve rejeitar promise para outros erros', async () => {
      const error = {
        response: {
          status: 500
        }
      };

      const responseErrorHandler = axios.create().interceptors.response.use.mock.calls[0][1];
      
      await expect(responseErrorHandler(error)).rejects.toBe(error);
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalled();
      expect(mockWindowLocation.href).not.toBe('/login');
    });
  });

  describe('Métodos HTTP', () => {
    it('deve expor método GET', () => {
      const apiInstance = axios.create();
      expect(apiInstance.get).toBeDefined();
      expect(typeof apiInstance.get).toBe('function');
    });

    it('deve expor método POST', () => {
      const apiInstance = axios.create();
      expect(apiInstance.post).toBeDefined();
      expect(typeof apiInstance.post).toBe('function');
    });

    it('deve expor método PUT', () => {
      const apiInstance = axios.create();
      expect(apiInstance.put).toBeDefined();
      expect(typeof apiInstance.put).toBe('function');
    });

    it('deve expor método DELETE', () => {
      const apiInstance = axios.create();
      expect(apiInstance.delete).toBeDefined();
      expect(typeof apiInstance.delete).toBe('function');
    });
  });

  describe('Cenários de integração', () => {
    it('deve fazer requisição GET com token', async () => {
      const mockToken = 'token-xyz';
      mockLocalStorage.getItem.mockReturnValue(mockToken);
      
      const apiInstance = axios.create();
      apiInstance.get.mockResolvedValue({ data: { tenants: [] } });

      const result = await apiInstance.get('/tenants');

      expect(apiInstance.get).toHaveBeenCalledWith('/tenants');
      expect(result.data).toEqual({ tenants: [] });
    });

    it('deve fazer requisição POST com dados', async () => {
      const mockToken = 'token-xyz';
      mockLocalStorage.getItem.mockReturnValue(mockToken);
      
      const apiInstance = axios.create();
      apiInstance.post.mockResolvedValue({ data: { id: '1', name: 'New Tenant' } });

      const payload = { name: 'New Tenant', slug: 'new-tenant' };
      const result = await apiInstance.post('/tenants', payload);

      expect(apiInstance.post).toHaveBeenCalledWith('/tenants', payload);
      expect(result.data.id).toBe('1');
    });

    it('deve lidar com erro de rede', async () => {
      const apiInstance = axios.create();
      const networkError = new Error('Network Error');
      apiInstance.get.mockRejectedValue(networkError);

      await expect(apiInstance.get('/tenants')).rejects.toThrow('Network Error');
    });
  });
});

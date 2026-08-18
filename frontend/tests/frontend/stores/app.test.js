import { setActivePinia, createPinia } from 'pinia'
import { useAppStore } from '../../../src/stores/app.js'

describe('App Store', () => {
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useAppStore();
  });

  describe('State', () => {
    it('deve inicializar com estado padrão', () => {
      expect(store.loading).toBe(false);
      expect(store.systemConfig).toEqual({
        dbProvider: 'postgresql',
        redisEnabled: false,
        evolutionApiUrl: '',
        evolutionApiKey: ''
      });
      expect(store.tenants).toEqual([]);
      expect(store.whatsappAccounts).toEqual([]);
    });
  });

  describe('Getters', () => {
    it('deve retornar isLoading corretamente', () => {
      expect(store.isLoading).toBe(false);
      
      store.setLoading(true);
      expect(store.isLoading).toBe(true);
    });

    it('deve retornar getSystemConfig corretamente', () => {
      const config = store.getSystemConfig;
      expect(config.dbProvider).toBe('postgresql');
      expect(config.redisEnabled).toBe(false);
    });

    it('deve retornar getTenants corretamente', () => {
      expect(store.getTenants).toEqual([]);
    });

    it('deve retornar getWhatsappAccounts corretamente', () => {
      expect(store.getWhatsappAccounts).toEqual([]);
    });
  });

  describe('Actions', () => {
    it('deve atualizar loading', () => {
      store.setLoading(true);
      expect(store.loading).toBe(true);
      expect(store.isLoading).toBe(true);

      store.setLoading(false);
      expect(store.loading).toBe(false);
      expect(store.isLoading).toBe(false);
    });

    it('deve atualizar systemConfig parcialmente', () => {
      store.setSystemConfig({ 
        dbProvider: 'mongodb',
        redisEnabled: true 
      });

      expect(store.systemConfig.dbProvider).toBe('mongodb');
      expect(store.systemConfig.redisEnabled).toBe(true);
      expect(store.systemConfig.evolutionApiUrl).toBe('');
    });

    it('deve definir tenants', () => {
      const mockTenants = [
        { id: '1', name: 'Tenant 1', slug: 'tenant-1' },
        { id: '2', name: 'Tenant 2', slug: 'tenant-2' }
      ];

      store.setTenants(mockTenants);

      expect(store.tenants).toEqual(mockTenants);
      expect(store.getTenants).toEqual(mockTenants);
    });

    it('deve definir whatsapp accounts', () => {
      const mockAccounts = [
        { id: 'acc-1', instanceName: 'WhatsApp 1', status: 'connected' },
        { id: 'acc-2', instanceName: 'WhatsApp 2', status: 'disconnected' }
      ];

      store.setWhatsappAccounts(mockAccounts);

      expect(store.whatsappAccounts).toEqual(mockAccounts);
      expect(store.getWhatsappAccounts).toEqual(mockAccounts);
    });
  });

  describe('Cenários de uso', () => {
    it('deve gerenciar múltiplas atualizações de estado', () => {
      // Carregar dados iniciais
      store.setLoading(true);
      
      store.setSystemConfig({
        dbProvider: 'postgresql',
        redisEnabled: true,
        evolutionApiUrl: 'http://api.example.com',
        evolutionApiKey: 'key-123'
      });

      store.setTenants([
        { id: '1', name: 'Tenant Test' }
      ]);

      store.setWhatsappAccounts([
        { id: 'acc-1', instanceName: 'WA Test' }
      ]);

      store.setLoading(false);

      expect(store.isLoading).toBe(false);
      expect(store.systemConfig.redisEnabled).toBe(true);
      expect(store.systemConfig.evolutionApiUrl).toBe('http://api.example.com');
      expect(store.getTenants.length).toBe(1);
      expect(store.getWhatsappAccounts.length).toBe(1);
    });

    it('deve mesclar configurações ao atualizar', () => {
      store.setSystemConfig({ dbProvider: 'mongodb' });
      expect(store.systemConfig.dbProvider).toBe('mongodb');
      expect(store.systemConfig.redisEnabled).toBe(false);

      store.setSystemConfig({ redisEnabled: true });
      expect(store.systemConfig.dbProvider).toBe('mongodb');
      expect(store.systemConfig.redisEnabled).toBe(true);
    });
  });
});

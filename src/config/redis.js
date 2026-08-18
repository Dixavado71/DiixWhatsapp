import Redis from 'ioredis';
import config from './index.js';

let redisClient = null;
let isConnected = false;

/**
 * Configurações padrão do Redis
 */
const defaultRedisConfig = {
  host: config.redis?.host || 'localhost',
  port: config.redis?.port || 6379,
  password: config.redis?.password || undefined,
  db: config.redis?.db || 0,
  retryStrategy: (times) => {
    if (times > 10) {
      console.error('🚫 Redis: Máximo de tentativas de reconexão atingido.');
      return null; // Para de tentar
    }
    // Retry exponencial: 1s, 2s, 4s, 8s...
    return Math.min(times * 1000, 10000);
  },
};

/**
 * Inicializa o cliente Redis
 */
export function initializeRedis() {
  if (redisClient) {
    console.log('⚠️ Redis já está inicializado.');
    return redisClient;
  }
  
  const useRedis = config.redis?.enabled !== false; // Habilitado por padrão
  
  if (!useRedis) {
    console.log('ℹ️ Redis desabilitado na configuração.');
    return null;
  }
  
  console.log(`📦 Inicializando Redis em ${defaultRedisConfig.host}:${defaultRedisConfig.port}`);
  
  redisClient = new Redis(defaultRedisConfig);
  
  // Event listeners
  redisClient.on('connect', () => {
    console.log('✅ Redis conectado com sucesso!');
    isConnected = true;
  });
  
  redisClient.on('ready', () => {
    console.log('🟢 Redis pronto para uso.');
  });
  
  redisClient.on('error', (err) => {
    console.error('❌ Erro no Redis:', err.message);
    isConnected = false;
  });
  
  redisClient.on('close', () => {
    console.log('🔴 Redis conexão fechada.');
    isConnected = false;
  });
  
  redisClient.on('reconnecting', (delay) => {
    console.log(`🔄 Redis reconectando em ${delay}ms...`);
  });
  
  return redisClient;
}

/**
 * Obtém instância do Redis (singleton)
 */
export function getRedisClient() {
  if (!redisClient) {
    return initializeRedis();
  }
  return redisClient;
}

/**
 * Verifica se o Redis está conectado
 */
export function isRedisConnected() {
  return isConnected && redisClient !== null;
}

/**
 * Testa a conexão com o Redis
 */
export async function checkRedisHealth() {
  try {
    if (!redisClient) {
      return { status: 'disconnected', connected: false };
    }
    
    const result = await redisClient.ping();
    return {
      status: result === 'PONG' ? 'healthy' : 'unhealthy',
      connected: result === 'PONG',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      connected: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Desconecta do Redis gracefulmente
 */
export async function disconnectRedis() {
  if (redisClient) {
    try {
      await redisClient.quit();
      console.log('🔌 Redis desconectado.');
      redisClient = null;
      isConnected = false;
    } catch (error) {
      console.error('Erro ao desconectar Redis:', error);
      redisClient.disconnect();
      redisClient = null;
      isConnected = false;
    }
  }
}

// Cache helpers
export const cache = {
  /**
   * Define um valor no cache com TTL opcional
   */
  async set(key, value, ttlSeconds = 3600) {
    if (!isRedisConnected()) return false;
    
    try {
      const serialized = JSON.stringify(value);
      await redisClient.setex(key, ttlSeconds, serialized);
      return true;
    } catch (error) {
      console.error('Erro ao definir cache:', error);
      return false;
    }
  },
  
  /**
   * Obtém um valor do cache
   */
  async get(key) {
    if (!isRedisConnected()) return null;
    
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Erro ao obter cache:', error);
      return null;
    }
  },
  
  /**
   * Remove uma chave do cache
   */
  async delete(key) {
    if (!isRedisConnected()) return false;
    
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.error('Erro ao remover cache:', error);
      return false;
    }
  },
  
  /**
   * Remove múltiplas chaves que correspondem a um pattern
   */
  async deletePattern(pattern) {
    if (!isRedisConnected()) return 0;
    
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length === 0) return 0;
      
      await redisClient.del(...keys);
      return keys.length;
    } catch (error) {
      console.error('Erro ao remover padrão de cache:', error);
      return 0;
    }
  },
  
  /**
   * Incrementa um contador
   */
  async increment(key, amount = 1) {
    if (!isRedisConnected()) return null;
    
    try {
      return await redisClient.incrby(key, amount);
    } catch (error) {
      console.error('Erro ao incrementar contador:', error);
      return null;
    }
  },
  
  /**
   * Define um contador com expiração
   */
  async setCounter(key, initialValue = 0, ttlSeconds = 3600) {
    if (!isRedisConnected()) return null;
    
    try {
      const exists = await redisClient.exists(key);
      if (!exists) {
        await redisClient.setex(key, ttlSeconds, initialValue);
        return initialValue;
      }
      return await this.increment(key);
    } catch (error) {
      console.error('Erro ao definir contador:', error);
      return null;
    }
  },
};

export default {
  initializeRedis,
  getRedisClient,
  isRedisConnected,
  checkRedisHealth,
  disconnectRedis,
  cache,
};

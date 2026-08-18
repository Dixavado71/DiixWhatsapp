import { PrismaClient } from '@prisma/client';
import config from './index.js';

let prisma = null;

/**
 * Inicializa o cliente Prisma baseado na configuração do banco de dados
 * Suporta PostgreSQL e MongoDB através do Prisma
 */
export function initializeDatabase() {
  if (prisma) {
    return prisma;
  }
  
  const dbProvider = config.database?.provider || 'postgresql';
  
  console.log(`📦 Inicializando banco de dados: ${dbProvider.toUpperCase()}`);
  
  prisma = new PrismaClient({
    log: config.nodeEnv === 'development' 
      ? ['query', 'info', 'warn', 'error'] 
      : ['error', 'warn'],
    datasources: {
      db: {
        url: config.databaseUrl,
      },
    },
  });
  
  return prisma;
}

/**
 * Conecta ao banco de dados com retry lógico
 */
export async function connectDatabase(maxRetries = 5) {
  const instance = initializeDatabase();
  
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      await instance.$connect();
      console.log('✅ Banco de dados conectado com sucesso!');
      return instance;
    } catch (error) {
      attempt++;
      console.error(`❌ Falha na conexão (tentativa ${attempt}/${maxRetries}):`, error.message);
      
      if (attempt >= maxRetries) {
        console.error('🚫 Todas as tentativas de conexão falharam. Encerrando...');
        throw error;
      }
      
      // Wait time aumenta exponencialmente: 1s, 2s, 4s, 8s...
      const waitTime = Math.pow(2, attempt) * 1000;
      console.log(`⏳ Aguardando ${waitTime}ms antes da próxima tentativa...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

/**
 * Desconecta do banco de dados gracefulmente
 */
export async function disconnectDatabase() {
  if (prisma) {
    try {
      await prisma.$disconnect();
      console.log('🔌 Banco de dados desconectado.');
      prisma = null;
    } catch (error) {
      console.error('Erro ao desconectar banco de dados:', error);
    }
  }
}

/**
 * Verifica se a conexão está saudável
 */
export async function checkDatabaseHealth() {
  try {
    if (!prisma) {
      return { status: 'disconnected', connected: false };
    }
    
    await prisma.$queryRaw`SELECT 1`;
    return { 
      status: 'healthy', 
      connected: true,
      provider: config.database?.provider || 'postgresql',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      connected: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Obtém a instância do Prisma - garante inicialização prévia
 * Deve ser chamado APÓS connectDatabase() ser executado
 */
export function getPrisma() {
  if (!prisma) {
    throw new Error('Prisma não inicializado. Chame connectDatabase() primeiro.');
  }
  return prisma;
}

export default getPrisma;

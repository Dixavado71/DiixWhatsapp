import app from './app.js';
import config from './config/index.js';
import { connectDatabase, disconnectDatabase, checkDatabaseHealth } from './config/database.js';
import { initializeRedis, disconnectRedis, checkRedisHealth } from './config/redis.js';

/**
 * Servidor principal do DiixWhatsapp
 * Inicializa o servidor Express e conecta aos bancos de dados (PostgreSQL/MongoDB + Redis)
 */

async function bootstrap() {
  let dbConnected = false;
  let redisConnected = false;

  try {
    // ===========================================
    // 1. Conectar ao Banco de Dados Principal
    // ===========================================
    console.log('📦 Inicializando banco de dados...');
    await connectDatabase();
    dbConnected = true;

    // ===========================================
    // 2. Inicializar Redis (Opcional)
    // ===========================================
    if (config.redis?.enabled !== false) {
      console.log('📦 Inicializando Redis...');
      initializeRedis();
      // Aguarda conexão assíncrona do Redis
      setTimeout(async () => {
        const redisHealth = await checkRedisHealth();
        if (redisHealth.connected) {
          redisConnected = true;
          console.log('✅ Redis inicializado com sucesso!');
        } else {
          console.warn('⚠️ Redis não conectado. O sistema continuará sem cache.');
        }
      }, 2000);
    } else {
      console.log('ℹ️ Redis desabilitado na configuração.');
    }

    // ===========================================
    // 3. Iniciar Servidor HTTP
    // ===========================================
    const server = app.listen(config.port, async () => {
      // Verifica saúde do banco de dados
      const dbHealth = await checkDatabaseHealth();
      
      // Verifica saúde do Redis (se habilitado)
      let redisHealth = { status: 'disabled', connected: false };
      if (config.redis?.enabled !== false) {
        redisHealth = await checkRedisHealth();
      }

      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 DiixWhatsapp API                                     ║
║                                                           ║
║   Servidor rodando em: http://${config.host}:${config.port}         ║
║   Ambiente: ${config.nodeEnv.padEnd(43)}║
║                                                           ║
║   Configuração do Banco de Dados:                         ║
║   - Provider: ${config.database.provider.padEnd(45)}║
║   - Status: ${dbHealth.status.padEnd(49)}║
║                                                           ║
║   Configuração do Redis:                                  ║
║   - Habilitado: ${(config.redis?.enabled !== false).toString().padEnd(46)}║
║   - Status: ${redisHealth.status.padEnd(49)}║
║                                                           ║
║   Endpoints:                                              ║
║   - Health:   /health                                     ║
║   - API:      /api/v1                                     ║
║   - Webhook:  /webhook                                    ║
║   - Docs:     /docs                                       ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });

    // ===========================================
    // 4. Graceful Shutdown
    // ===========================================
    const gracefulShutdown = async (signal) => {
      console.log(`\n⚠️  Recebido sinal ${signal}. Iniciando desligamento...`);
      
      // Para de aceitar novas conexões
      server.close(async () => {
        console.log('📴 Servidor HTTP fechado.');
        
        // Desconecta do banco de dados principal
        if (dbConnected) {
          await disconnectDatabase();
        }
        
        // Desconecta do Redis
        if (redisConnected || config.redis?.enabled !== false) {
          await disconnectRedis();
        }
        
        console.log('✅ Desligamento concluído com sucesso.');
        process.exit(0);
      });

      // Forçar fechamento após 10 segundos
      setTimeout(() => {
        console.error('❌ Desligamento forçado após timeout de 10s.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Handler para erros não tratados
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection em:', promise, 'razão:', reason);
    });

  } catch (error) {
    console.error('❌ Erro crítico ao inicializar o servidor:', error);
    
    // Limpeza de emergência
    if (dbConnected) {
      await disconnectDatabase().catch(() => {});
    }
    if (redisConnected || config.redis?.enabled !== false) {
      await disconnectRedis().catch(() => {});
    }
    
    process.exit(1);
  }
}

bootstrap();

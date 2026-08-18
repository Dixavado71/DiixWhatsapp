import app from './app.js';
import config from './config/index.js';
import prisma from './config/database.js';

/**
 * Servidor principal do DiixWhatsapp
 * Inicializa o servidor Express e conecta ao banco de dados
 */

async function bootstrap() {
  try {
    // Conectar ao banco de dados
    await prisma.$connect();
    console.log('✅ Banco de dados conectado com sucesso!');

    // Iniciar servidor
    const server = app.listen(config.port, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 DiixWhatsapp API                                     ║
║                                                           ║
║   Servidor rodando em: http://${config.host}:${config.port}         ║
║   Ambiente: ${config.nodeEnv.padEnd(43)}║
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

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`\n⚠️  Recebido sinal ${signal}. Iniciando desligamento...`);
      
      server.close(async () => {
        console.log('📴 Servidor HTTP fechado.');
        
        await prisma.$disconnect();
        console.log('📴 Conexão com banco de dados fechada.');
        
        process.exit(0);
      });

      // Forçar fechamento após 10 segundos
      setTimeout(() => {
        console.error('❌ Desligamento forçado após timeout.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Erro ao inicializar o servidor:', error);
    
    await prisma.$disconnect();
    process.exit(1);
  }
}

bootstrap();

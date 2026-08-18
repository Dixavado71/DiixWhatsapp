/**
 * Controller de Health Checks e Métricas
 * Endpoints para monitoramento de saúde da aplicação
 */

import { PrismaClient } from '@prisma/client';
import queueService from '../config/queue.js';
import redisConfig from '../config/redis.js';

const prisma = new PrismaClient();

/**
 * Health Check Básico (Liveness Probe)
 * Verifica se o servidor está rodando
 * GET /health/live
 */
export async function healthLive(req, res) {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '3.0.0',
  });
}

/**
 * Health Check Completo (Readiness Probe)
 * Verifica dependências: Database, Redis, Evolution API
 * GET /health/ready
 */
export async function healthReady(req, res) {
  const checks = {
    database: { status: 'unknown', latency: null },
    redis: { status: 'unknown', latency: null },
    evolutionApi: { status: 'unknown', latency: null },
  };
  
  let allHealthy = true;
  
  // Check Database
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.database.latency = Date.now() - start;
    checks.database.status = 'healthy';
  } catch (error) {
    checks.database.status = 'unhealthy';
    checks.database.error = error.message;
    allHealthy = false;
  }
  
  // Check Redis
  try {
    const start = Date.now();
    await redisConfig.ping();
    checks.redis.latency = Date.now() - start;
    checks.redis.status = 'healthy';
  } catch (error) {
    checks.redis.status = 'unhealthy';
    checks.redis.error = error.message;
    allHealthy = false;
  }
  
  // Check Evolution API (opcional, não bloqueia readiness)
  try {
    const start = Date.now();
    // Aqui faria uma chamada simples à Evolution API
    // Por enquanto, apenas marca como healthy se URL estiver configurada
    if (process.env.EVOLUTION_API_URL) {
      checks.evolutionApi.latency = Date.now() - start;
      checks.evolutionApi.status = 'healthy';
    } else {
      checks.evolutionApi.status = 'not_configured';
    }
  } catch (error) {
    checks.evolutionApi.status = 'unhealthy';
    checks.evolutionApi.error = error.message;
    // Não falha o readiness por causa da Evolution API
  }
  
  const status = allHealthy ? 'ready' : 'not_ready';
  const statusCode = allHealthy ? 200 : 503;
  
  res.status(statusCode).json({
    status,
    timestamp: new Date().toISOString(),
    checks,
  });
}

/**
 * Métricas da Aplicação (Prometheus-style)
 * GET /health/metrics
 */
export async function healthMetrics(req, res) {
  try {
    // Métricas do processo Node.js
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // Métricas das filas
    let queueMetrics = {};
    try {
      queueMetrics = await queueService.getAllQueuesStatus();
    } catch (error) {
      queueMetrics = { error: 'Queue service not available' };
    }
    
    // Contagem de registros no banco (por tenant)
    const tenantCounts = await prisma.tenant.count();
    const userCounts = await prisma.user.count();
    const orderCounts = await prisma.order.count();
    const customerCounts = await prisma.customer.count();
    
    res.status(200).json({
      timestamp: new Date().toISOString(),
      process: {
        uptime: process.uptime(),
        memory: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
          external: Math.round(memoryUsage.external / 1024), // KB
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system,
        },
      },
      database: {
        tenants: tenantCounts,
        users: userCounts,
        orders: orderCounts,
        customers: customerCounts,
      },
      queues: queueMetrics,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve metrics',
      message: error.message,
    });
  }
}

/**
 * Status detalhado do sistema
 * GET /health/status
 */
export async function healthStatus(req, res) {
  try {
    // Informações do ambiente
    const environment = {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      DATABASE_CONFIGURED: !!process.env.DATABASE_URL,
      REDIS_CONFIGURED: !!process.env.REDIS_HOST,
      EVOLUTION_API_CONFIGURED: !!process.env.EVOLUTION_API_URL,
      JWT_SECRET_CONFIGURED: !!process.env.JWT_SECRET,
    };
    
    // Estatísticas gerais
    const stats = {
      totalTenants: await prisma.tenant.count(),
      activeTenants: await prisma.tenant.count({ where: { status: 'ACTIVE' } }),
      totalUsers: await prisma.user.count(),
      totalWhatsAppAccounts: await prisma.whatsAppAccount.count(),
      connectedWhatsAppAccounts: await prisma.whatsAppAccount.count({ 
        where: { status: 'connected' } 
      }),
      totalOrders: await prisma.order.count(),
      totalCustomers: await prisma.customer.count(),
      totalProducts: await prisma.product.count(),
    };
    
    res.status(200).json({
      timestamp: new Date().toISOString(),
      version: '3.0.0',
      environment,
      stats,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve status',
      message: error.message,
    });
  }
}

export default {
  healthLive,
  healthReady,
  healthMetrics,
  healthStatus,
};

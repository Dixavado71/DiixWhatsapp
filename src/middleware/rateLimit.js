/**
 * Middleware de Rate Limiting Dinâmico por Tenant
 * Limita requisições baseado no plano do tenant
 */

import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Limites por plano (requisições por hora)
const PLAN_LIMITS = {
  FREE: 100,
  BASIC: 500,
  PRO: 2000,
  ENTERPRISE: 10000,
};

// Cache de limites para evitar queries constantes
const tenantLimitsCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Obter limite do tenant (com cache)
 */
async function getTenantLimit(tenantId) {
  const cached = tenantLimitsCache.get(tenantId);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.limit;
  }
  
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true },
    });
    
    const limit = tenant ? PLAN_LIMITS[tenant.plan] : PLAN_LIMITS.FREE;
    
    tenantLimitsCache.set(tenantId, {
      limit,
      timestamp: Date.now(),
    });
    
    return limit;
  } catch (error) {
    console.error('[RateLimit] Erro ao obter limite do tenant:', error.message);
    return PLAN_LIMITS.FREE;
  }
}

/**
 * Criar store customizada para rate limit por tenant
 */
class TenantRateLimitStore {
  constructor() {
    this.store = new Map();
  }
  
  async incr(key, cb) {
    const now = Date.now();
    const windowMs = 60 * 60 * 1000; // 1 hora
    
    let record = this.store.get(key);
    
    if (!record || now - record.resetTime > windowMs) {
      record = {
        count: 0,
        resetTime: now + windowMs,
      };
    }
    
    record.count++;
    this.store.set(key, record);
    
    cb(null, {
      totalHits: record.count,
      resetTime: record.resetTime,
    });
  }
  
  async decrement(key) {
    const record = this.store.get(key);
    if (record && record.count > 0) {
      record.count--;
      this.store.set(key, record);
    }
  }
  
  async resetKey(key) {
    this.store.delete(key);
  }
}

/**
 * Middleware de rate limiting dinâmico
 */
export function createTenantRateLimiter() {
  const store = new TenantRateLimitStore();
  
  return async (req, res, next) => {
    // Extrair tenantId do request
    const tenantId = req.user?.tenantId || req.tenant?.id;
    
    if (!tenantId) {
      // Sem tenant identificado, usar limite padrão baixo
      const limiter = rateLimit({
        windowMs: 60 * 60 * 1000,
        max: 50,
        store,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
          error: 'TooManyRequests',
          message: 'Muitas requisições. Por favor, tente novamente mais tarde.',
        },
      });
      
      return limiter(req, res, next);
    }
    
    // Obter limite baseado no plano do tenant
    const maxRequests = await getTenantLimit(tenantId);
    
    const limiter = rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hora
      max: maxRequests,
      store,
      keyGenerator: (req) => {
        // Chave única por tenant + IP (para evitar abuso dentro do mesmo tenant)
        const ip = req.ip || req.connection.remoteAddress;
        return `tenant:${tenantId}:ip:${ip}`;
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        res.status(429).json({
          error: 'TooManyRequests',
          message: `Limite de ${maxRequests} requisições por hora excedido.`,
          retryAfter: Math.ceil(60 * 60), // Segundos até reset
          plan: req.user?.tenant?.plan || 'FREE',
        });
      },
    });
    
    return limiter(req, res, next);
  };
}

/**
 * Middleware específico para rotas críticas (login, webhook)
 */
export function createStrictRateLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10, // 10 tentativas
    message: {
      error: 'TooManyRequests',
      message: 'Muitas tentativas. Tente novamente em 15 minutos.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
}

/**
 * Limpar cache de limites (útil quando tenant muda de plano)
 */
export function clearTenantLimitCache(tenantId) {
  if (tenantId) {
    tenantLimitsCache.delete(tenantId);
  } else {
    tenantLimitsCache.clear();
  }
}

export default {
  createTenantRateLimiter,
  createStrictRateLimiter,
  clearTenantLimitCache,
  PLAN_LIMITS,
};

/**
 * Configuração de Logger Estruturado com Winston
 * Logs em formato JSON para fácil integração com ELK/Datadog
 */

import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Definição de níveis customizados
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Cores para terminal (desenvolvimento)
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// Formato dos logs
const format = winston.format.combine(
  // Adicionar timestamp
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  
  // Adicionar cor no desenvolvimento
  winston.format.colorize({ all: true }),
  
  // Formatar como JSON ou texto
  winston.format.printf((info) => {
    // Em produção, sempre JSON
    if (process.env.NODE_ENV === 'production') {
      return JSON.stringify({
        timestamp: info.timestamp,
        level: info.level,
        message: info.message,
        service: 'diix-whatsapp-api',
        ...info.metadata,
      });
    }
    
    // Em desenvolvimento, formato legível
    return `${info.timestamp} [${info.level}]: ${info.message} ${
      Object.keys(info.metadata).length ? JSON.stringify(info.metadata) : ''
    }`;
  })
);

// Transports (destinos dos logs)
const transports = [
  // Console (sempre ativo)
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      winston.format.simple()
    ),
  }),
  
  // Arquivo de erros
  new winston.transports.File({
    filename: path.join(__dirname, '../../logs/error.log'),
    level: 'error',
    format: winston.format.combine(winston.format.json()),
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
  
  // Arquivo de todos os logs
  new winston.transports.File({
    filename: path.join(__dirname, '../../logs/all.log'),
    format: winston.format.combine(winston.format.json()),
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
];

// Criar logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'debug',
  levels,
  format,
  transports,
  defaultMeta: {
    service: 'diix-whatsapp-api',
    version: process.env.npm_package_version || '3.0.0',
  },
});

/**
 * Middleware para log de requisições HTTP
 */
export function requestLogger(req, res, next) {
  const start = Date.now();
  
  // Capturar resposta
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    };
    
    // Adicionar userId se autenticado
    if (req.user) {
      logData.userId = req.user.id;
      logData.userRole = req.user.role;
    }
    
    // Adicionar tenantId se presente
    if (req.tenant) {
      logData.tenantId = req.tenant.id;
      logData.tenantSlug = req.tenant.slug;
    }
    
    // Log baseado no status
    if (res.statusCode >= 500) {
      logger.error('Request error', { ...logData, error: res.locals.errorMessage });
    } else if (res.statusCode >= 400) {
      logger.warn('Request client error', logData);
    } else {
      logger.http('Request completed', logData);
    }
  });
  
  next();
}

/**
 * Logger estruturado para auditoria
 */
export function auditLog(action, details) {
  logger.info('Audit event', {
    type: 'audit',
    action,
    ...details,
  });
}

/**
 * Logger para métricas de negócio
 */
export function businessMetric(metricName, value, metadata = {}) {
  logger.info('Business metric', {
    type: 'metric',
    metricName,
    value,
    ...metadata,
  });
}

/**
 * Logger para erros críticos (com stack trace)
 */
export function criticalError(error, context = {}) {
  logger.error('Critical error', {
    type: 'critical',
    error: error.message,
    stack: error.stack,
    ...context,
  });
}

// Exportação padrão
export default logger;

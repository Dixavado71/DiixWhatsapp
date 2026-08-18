import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'diix-whatsapp-secret-key-change-in-production';

/**
 * Middleware de Autenticação
 * Verifica se o token JWT é válido e anexa o usuário à requisição
 */
export const authenticate = async (req, res, next) => {
  try {
    // Extrair token do header Authorization: Bearer <token>
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token de autenticação não fornecido.',
      });
    }

    const token = authHeader.split(' ')[1];

    // Verificar token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Buscar usuário no banco
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { tenant: true },
    });

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Usuário não encontrado.',
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Usuário inativo ou bloqueado.',
      });
    }

    // Anexar usuário à requisição
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
      tenant: user.tenant,
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token inválido.',
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token expirado.',
      });
    }

    console.error('Erro na autenticação:', error);
    return res.status(500).json({
      error: 'InternalServerError',
      message: 'Erro interno na autenticação.',
    });
  }
};

/**
 * Middleware de Autorização por Role
 * Verifica se o usuário possui pelo menos um dos roles permitidos
 * @param  {...string} allowedRoles - Roles permitidos
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Usuário não autenticado.',
      });
    }

    const hasPermission = allowedRoles.includes(req.user.role);

    if (!hasPermission) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Acesso negado. É necessário uma das permissões: ${allowedRoles.join(', ')}.`,
      });
    }

    next();
  };
};

/**
 * Middleware para verificar se o usuário é SUPER_ADMIN
 */
export const requireSuperAdmin = authorize('SUPER_ADMIN');

/**
 * Middleware para verificar se o usuário é TENANT_ADMIN ou SUPER_ADMIN
 */
export const requireTenantAdmin = authorize('TENANT_ADMIN', 'SUPER_ADMIN');

/**
 * Middleware para garantir que o usuário pertença ao tenant especificado
 * (útil para SUPER_ADMIN acessar dados de tenants específicos)
 */
export const ensureTenantAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Usuário não autenticado.',
    });
  }

  // SUPER_ADMIN pode acessar qualquer tenant
  if (req.user.role === 'SUPER_ADMIN') {
    return next();
  }

  // Outros roles só podem acessar seu próprio tenant
  const tenantIdFromParams = req.params.tenantId || req.body.tenantId;
  
  if (tenantIdFromParams && tenantIdFromParams !== req.user.tenantId) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Acesso negado a este tenant.',
    });
  }

  // Se não houver tenantId nos params/body, usa o do usuário
  if (!tenantIdFromParams && !req.user.tenantId) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Usuário não associado a nenhum tenant.',
    });
  }

  req.accessibleTenantId = tenantIdFromParams || req.user.tenantId;
  next();
};

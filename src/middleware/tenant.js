/**
 * Middleware para identificação e isolamento do tenant
 * Extrai o tenant da requisição e valida permissões
 */

import tenantRepository from '../models/TenantRepository.js';

/**
 * Extrai o tenant da requisição
 * Pode vir de:
 * - Header: X-Tenant-ID ou X-Tenant-Slug
 * - Subdomínio: tenant.dominio.com
 * - Path: /api/tenant/slug/...
 */
export async function identifyTenant(req, res, next) {
  try {
    let tenantId = null;
    let tenantSlug = null;

    // Tentar extrair do header
    tenantId = req.headers['x-tenant-id'];
    tenantSlug = req.headers['x-tenant-slug'];

    // Se não veio por header, tentar subdomínio
    if (!tenantId && !tenantSlug) {
      const host = req.headers.host || '';
      const parts = host.split('.');
      
      // Se tiver subdomínio (ex: loja1.app.com)
      if (parts.length > 2) {
        tenantSlug = parts[0];
      }
    }

    // Se ainda não encontrou, tentar do path
    if (!tenantId && !tenantSlug) {
      tenantSlug = req.params.tenantSlug;
    }

    // Se não encontrou nenhum identificador
    if (!tenantId && !tenantSlug) {
      return res.status(400).json({
        error: 'Tenant não identificado',
        message: 'É necessário informar o tenant via header X-Tenant-ID, X-Tenant-Slug, subdomínio ou path.',
      });
    }

    // Buscar tenant no banco
    let tenant;
    if (tenantId) {
      tenant = await tenantRepository.findById(tenantId);
    } else {
      tenant = await tenantRepository.findBySlug(tenantSlug);
    }

    if (!tenant) {
      return res.status(404).json({
        error: 'Tenant não encontrado',
        message: 'O tenant especificado não existe ou foi desativado.',
      });
    }

    // Verificar status do tenant
    if (tenant.status !== 'active') {
      return res.status(403).json({
        error: 'Tenant inativo',
        message: `Este tenant está com status "${tenant.status}". Entre em contato com o suporte.`,
      });
    }

    // Anexar tenant ao request
    req.tenant = {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      plan: tenant.plan,
      maxAccounts: tenant.maxAccounts,
      maxMessages: tenant.maxMessages,
    };

    next();
  } catch (error) {
    console.error('Erro ao identificar tenant:', error);
    res.status(500).json({
      error: 'Erro interno',
      message: 'Falha ao identificar o tenant.',
    });
  }
}

/**
 * Middleware para verificar limites do tenant
 */
export async function checkTenantLimits(req, res, next) {
  try {
    const tenantId = req.tenant?.id;

    if (!tenantId) {
      return next();
    }

    const limits = await tenantRepository.checkLimits(tenantId);

    // Verificar se excedeu limite de contas
    if (limits.accounts.exceeded) {
      return res.status(403).json({
        error: 'Limite excedido',
        message: `Você atingiu o limite máximo de ${limits.accounts.max} contas WhatsApp.`,
        limits,
      });
    }

    // Anexar limites ao request
    req.tenantLimits = limits;

    next();
  } catch (error) {
    console.error('Erro ao verificar limites:', error);
    next(); // Não bloqueia, apenas loga o erro
  }
}

/**
 * Middleware para registrar auditoria
 */
export async function auditLog(req, res, next) {
  // Implementar logging de ações
  next();
}

export default {
  identifyTenant,
  checkTenantLimits,
  auditLog,
};

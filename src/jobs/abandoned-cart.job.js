/**
 * Jobs de Recuperação de Carrinhos Abandonados
 * Envia mensagens automáticas para clientes que abandonaram carrinho
 */

import { PrismaClient } from '@prisma/client';
import queueService, { registerWorker } from '../config/queue.js';
import { EvolutionApiService } from '../services/EvolutionApiService.js';

const prisma = new PrismaClient();

/**
 * Processador de jobs de carrinho abandonado
 * @param {Job} job - Job com dados do carrinho
 */
async function processAbandonedCart(job) {
  const { cartId, tenantId, customerId, customerPhone, items, delayHours } = job.data;
  
  try {
    // Verificar se carrinho ainda está ativo
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
      },
    });
    
    if (!cart || cart.status !== 'ACTIVE') {
      console.log(`[AbandonedCart] Carrinho ${cartId} não está mais ativo, ignorando`);
      return;
    }
    
    // Calcular tempo desde última atualização
    const lastUpdate = new Date(cart.updatedAt);
    const now = new Date();
    const hoursSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60);
    
    // Só enviar se passou do tempo mínimo
    if (hoursSinceUpdate < delayHours) {
      console.log(`[AbandonedCart] Carrinho ${cartId} ainda não atingiu ${delayHours}h`);
      return;
    }
    
    // Buscar conta WhatsApp ativa do tenant
    const whatsappAccount = await prisma.whatsAppAccount.findFirst({
      where: {
        tenantId,
        status: 'connected',
      },
    });
    
    if (!whatsappAccount) {
      console.log(`[AbandonedCart] Nenhuma conta WhatsApp conectada para tenant ${tenantId}`);
      return;
    }
    
    // Montar mensagem personalizada
    const productNames = cart.items.map(item => item.product.name).join(', ');
    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const customerName = cart.customer?.name || customerPhone;
    
    // Mensagem padrão (pode ser customizada por tenant)
    const message = `👋 Olá, ${customerName}!
    
Vi que você deixou ${totalItems} produto(s) no seu carrinho:
${productNames}

💰 Total: R$ ${cart.total.toFixed(2)}

Que tal finalizar sua compra agora? 
Estou aqui se precisar de ajuda! 😊

🛒 Finalizar: [link-do-checkout]`;

    // Enviar mensagem via Evolution API
    const evolutionService = new EvolutionApiService(whatsappAccount);
    
    const result = await evolutionService.sendTextMessage({
      number: customerPhone,
      message,
    });
    
    if (result.success) {
      // Atualizar carrinho com metadata de recuperação
      await prisma.cart.update({
        where: { id: cartId },
        data: {
          metadata: {
            ...cart.metadata,
            recoveryMessageSent: true,
            recoveryMessageSentAt: new Date(),
            recoveryMessageType: 'automatic',
          },
        },
      });
      
      console.log(`[AbandonedCart] Mensagem enviada para carrinho ${cartId}`);
      
      // Agendar próxima tentativa (se configurado)
      if (delayHours < 48) { // Máximo 2 tentativas
        await queueService.scheduleJob(
          'abandonedCart',
          new Date(Date.now() + 24 * 60 * 60 * 1000), // +24 horas
          {
            cartId,
            tenantId,
            customerId,
            customerPhone,
            items,
            delayHours: delayHours + 24,
          }
        );
      }
    } else {
      console.error(`[AbandonedCart] Falha ao enviar mensagem: ${result.error}`);
      throw new Error(result.error);
    }
    
  } catch (error) {
    console.error(`[AbandonedCart] Erro ao processar job ${job.id}:`, error.message);
    throw error; // Para retry automático
  }
}

/**
 * Inicializar worker de carrinhos abandonados
 */
export function initAbandonedCartWorker() {
  registerWorker('abandonedCart', processAbandonedCart);
  console.log('[AbandonedCart] Worker inicializado');
}

/**
 * Agendar verificação de carrinhos abandonados
 * Deve ser chamado periodicamente (ex: a cada 30 minutos)
 */
export async function scheduleAbandonedCartCheck() {
  try {
    // Buscar todos os carrinhos ativos sem conversão
    const abandonedCarts = await prisma.cart.findMany({
      where: {
        status: 'ACTIVE',
        convertedToOrderId: null,
        updatedAt: {
          lte: new Date(Date.now() - 60 * 60 * 1000), // +1 hora atrás
        },
      },
      include: {
        tenant: true,
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });
    
    for (const cart of abandonedCarts) {
      // Verificar se já não foi enviado mensagem de recuperação
      const metadata = cart.metadata || {};
      if (metadata.recoveryMessageSent) {
        continue; // Já enviado
      }
      
      // Agendar job de recuperação
      await queueService.addJob('abandonedCart', {
        cartId: cart.id,
        tenantId: cart.tenantId,
        customerId: cart.customerId,
        customerPhone: cart.customer?.phone,
        items: cart.items.map(item => ({
          productId: item.productId,
          productName: item.product.name,
          quantity: item.quantity,
        })),
        delayHours: 1, // Primeira tentativa após 1 hora
      });
    }
    
    console.log(`[AbandonedCart] ${abandonedCarts.length} carrinhos agendados para recuperação`);
    
  } catch (error) {
    console.error('[AbandonedCart] Erro ao agendar verificação:', error.message);
  }
}

// Exportações
export default {
  initAbandonedCartWorker,
  scheduleAbandonedCartCheck,
  processAbandonedCart,
};

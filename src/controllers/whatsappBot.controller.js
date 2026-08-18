import { PrismaClient } from '@prisma/client';
import evolutionApiService from '../services/EvolutionApiService.js';

const prisma = new PrismaClient();

/**
 * Controller do Bot WhatsApp com Evolution API
 * Gerencia fluxos de conversa, carrinho, pedidos e atendimento por tenant
 */
export const whatsappBotController = {
  /**
   * Recebe webhooks da Evolution API
   * POST /api/v1/whatsapp/webhook/:tenantId
   */
  receiveWebhook: async (req, res) => {
    try {
      const { tenantId } = req.params;
      const webhookData = req.body;

      console.log(`[Webhook] Tenant ${tenantId}:`, JSON.stringify(webhookData, null, 2));

      // Validar tenant
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        include: { settings: true },
      });

      if (!tenant) {
        return res.status(404).json({ error: 'Tenant não encontrado' });
      }

      if (!tenant.active) {
        return res.status(403).json({ error: 'Tenant inativo' });
      }

      // Processar不同类型的 webhook
      if (webhookData.event === 'messages.upsert') {
        await whatsappBotController.handleMessage(tenant, webhookData);
      } else if (webhookData.event === 'connection.update') {
        await whatsappBotController.handleConnectionUpdate(tenant, webhookData);
      } else if (webhookData.event === 'qrcode.updated') {
        await whatsappBotController.handleQrCode(tenant, webhookData);
      }

      res.status(200).json({ success: true, message: 'Webhook recebido' });
    } catch (error) {
      console.error('Erro ao processar webhook:', error);
      res.status(500).json({ error: 'Erro interno ao processar webhook' });
    }
  },

  /**
   * Processa mensagens recebidas
   */
  handleMessage: async (tenant, data) => {
    try {
      const messages = data.data?.messages || [];
      
      for (const message of messages) {
        // Ignorar mensagens enviadas pelo próprio bot
        if (message.key.fromMe) {
          continue;
        }

        const phoneNumber = message.key.remoteJid.replace(/\D/g, '');
        const messageType = message.messageType;
        const content = message.content || message.message?.conversation || '';

        console.log(`[Mensagem] ${phoneNumber} (${messageType}): ${content.substring(0, 100)}`);

        // Obter ou criar sessão do cliente
        let session = await prisma.session.findFirst({
          where: {
            tenantId: tenant.id,
            phoneNumber,
          },
          orderBy: { createdAt: 'desc' },
        });

        if (!session) {
          session = await prisma.session.create({
            data: {
              tenantId: tenant.id,
              phoneNumber,
              status: 'ACTIVE',
              metadata: { source: 'whatsapp' },
            },
          });
        }

        // Processar mensagem baseado no estado da sessão
        await whatsappBotController.processMessageState(tenant, session, message, phoneNumber, content, messageType);
      }
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
    }
  },

  /**
   * Processa mensagem baseada no estado atual da sessão
   */
  processMessageState: async (tenant, session, message, phoneNumber, content, messageType) => {
    try {
      const currentState = session.currentState || 'INITIAL';
      
      // Salvar histórico da mensagem
      await prisma.chatMessage.create({
        data: {
          sessionId: session.id,
          direction: 'INCOMING',
          messageType: messageType || 'TEXT',
          content: content,
          metadata: message,
        },
      });

      // Máquina de estados do bot
      switch (currentState) {
        case 'INITIAL':
          await whatsappBotController.handleInitialState(tenant, session, phoneNumber, content);
          break;
        
        case 'BROWSING_PRODUCTS':
          await whatsappBotController.handleBrowsingProducts(tenant, session, phoneNumber, content);
          break;
        
        case 'VIEWING_PRODUCT':
          await whatsappBotController.handleViewingProduct(tenant, session, phoneNumber, content);
          break;
        
        case 'ADDING_TO_CART':
          await whatsappBotController.handleAddingToCart(tenant, session, phoneNumber, content);
          break;
        
        case 'CHECKOUT':
          await whatsappBotController.handleCheckout(tenant, session, phoneNumber, content);
          break;
        
        case 'SELECTING_ADDRESS':
          await whatsappBotController.handleSelectingAddress(tenant, session, phoneNumber, content);
          break;
        
        case 'CHOOSING_PAYMENT':
          await whatsappBotController.handleChoosingPayment(tenant, session, phoneNumber, content);
          break;
        
        case 'CONFIRMING_ORDER':
          await whatsappBotController.handleConfirmingOrder(tenant, session, phoneNumber, content);
          break;
        
        case 'CUSTOMER_SUPPORT':
          await whatsappBotController.handleCustomerSupport(tenant, session, phoneNumber, content);
          break;
        
        default:
          await whatsappBotController.showMainMenu(tenant, session, phoneNumber);
      }
    } catch (error) {
      console.error('Erro ao processar estado da mensagem:', error);
      await evolutionApiService.sendTextMessage(
        `tenant_${tenant.id}`,
        phoneNumber,
        '⚠️ Desculpe, ocorreu um erro. Por favor, tente novamente ou digite "menu" para reiniciar.'
      );
    }
  },

  /**
   * Estado inicial - Boas vindas e menu principal
   */
  handleInitialState: async (tenant, session, phoneNumber, content) => {
    const lowerContent = content.toLowerCase().trim();

    // Comandos especiais
    if (lowerContent === 'menu' || lowerContent === 'início' || lowerContent === 'inicio') {
      await whatsappBotController.showMainMenu(tenant, session, phoneNumber);
      return;
    }

    if (lowerContent === 'pedidos' || lowerContent === 'meus pedidos') {
      await whatsappBotController.showMyOrders(tenant, session, phoneNumber);
      return;
    }

    if (lowerContent === 'carrinho' || lowerContent === 'meu carrinho') {
      await whatsappBotController.showCart(tenant, session, phoneNumber);
      return;
    }

    if (lowerContent === 'ajuda' || lowerContent === 'suporte') {
      await whatsappBotController.showSupport(tenant, session, phoneNumber);
      return;
    }

    // Primeira interação - mostrar menu principal
    await whatsappBotController.showMainMenu(tenant, session, phoneNumber);
  },

  /**
   * Exibe menu principal
   */
  showMainMenu: async (tenant, session, phoneNumber) => {
    try {
      // Atualizar estado da sessão
      await prisma.session.update({
        where: { id: session.id },
        data: { currentState: 'INITIAL' },
      });

      const welcomeMessage = `
👋 *Olá! Bem-vindo à ${tenant.name}!*

Sou seu assistente virtual de vendas. Como posso ajudar você hoje?

*Menu Principal:*
1️⃣ Ver Produtos
2️⃣ Ver Promoções
3️⃣ Meus Pedidos
4️⃣ Meu Carrinho
5️⃣ Falar com Atendente
6️⃣ Ajuda

_Digite o número da opção desejada_
      `.trim();

      const buttons = [
        { text: '🛍️ Ver Produtos', id: 'products' },
        { text: '🏷️ Promoções', id: 'promotions' },
        { text: '📦 Meus Pedidos', id: 'orders' },
        { text: '🛒 Carrinho', id: 'cart' },
        { text: '👨‍💼 Atendente', id: 'support' },
        { text: '❓ Ajuda', id: 'help' },
      ];

      await evolutionApiService.sendButtonMessage(
        `tenant_${tenant.id}`,
        phoneNumber,
        `Bem-vindo à ${tenant.name}`,
        welcomeMessage,
        buttons
      );

      // Salvar mensagem no histórico
      await prisma.chatMessage.create({
        data: {
          sessionId: session.id,
          direction: 'OUTGOING',
          messageType: 'BUTTON',
          content: welcomeMessage,
          metadata: { buttons },
        },
      });
    } catch (error) {
      console.error('Erro ao mostrar menu principal:', error);
    }
  },

  /**
   * Navegação de produtos
   */
  handleBrowsingProducts: async (tenant, session, phoneNumber, content) => {
    const option = content.trim();

    if (option === '0' || option.toLowerCase() === 'voltar') {
      await whatsappBotController.showMainMenu(tenant, session, phoneNumber);
      return;
    }

    // Listar categorias
    const categories = await prisma.product.groupBy({
      by: ['category'],
      where: {
        tenantId: tenant.id,
        active: true,
        category: { not: null },
      },
      _count: { id: true },
    });

    if (option === '1') {
      // Mostrar todos os produtos
      const products = await prisma.product.findMany({
        where: { tenantId: tenant.id, active: true },
        take: 10,
        orderBy: { createdAt: 'desc' },
      });

      let message = '*🛍️ Todos os Produtos:*\n\n';
      products.forEach((product, index) => {
        message += `*${index + 1}. ${product.name}*\n`;
        message += `R$ ${product.price.toFixed(2)}\n`;
        if (product.stock > 0) {
          message += `✅ Em estoque: ${product.stock} un.\n`;
        } else {
          message += `❌ Sem estoque\n`;
        }
        message += '\n';
      });
      message += '_Digite o número do produto para ver detalhes ou "0" para voltar_';

      await evolutionApiService.sendTextMessage(`tenant_${tenant.id}`, phoneNumber, message);
      
      await prisma.session.update({
        where: { id: session.id },
        data: { 
          currentState: 'VIEWING_PRODUCT',
          metadata: { ...session.metadata, productList: products.map(p => p.id) }
        },
      });
      return;
    }

    // Mostrar categorias
    let message = '*📂 Categorias:*\n\n';
    categories.forEach((cat, index) => {
      message += `${index + 1}. *${cat.category}* (${cat._count.id} produtos)\n`;
    });
    message += '\n0️⃣ Voltar\n\n_Digite o número da categoria_';

    await evolutionApiService.sendTextMessage(`tenant_${tenant.id}`, phoneNumber, message);
    
    await prisma.session.update({
      where: { id: session.id },
      data: { 
        currentState: 'SELECTING_CATEGORY',
        metadata: { ...session.metadata, categories }
      },
    });
  },

  /**
   * Visualização de produto específico
   */
  handleViewingProduct: async (tenant, session, phoneNumber, content) => {
    const option = content.trim();

    if (option === '0' || option.toLowerCase() === 'voltar') {
      await whatsappBotController.handleBrowsingProducts(tenant, session, phoneNumber, '1');
      return;
    }

    const productIndex = parseInt(option) - 1;
    const productList = session.metadata?.productList || [];
    
    if (isNaN(productIndex) || productIndex < 0 || productIndex >= productList.length) {
      await evolutionApiService.sendTextMessage(
        `tenant_${tenant.id}`,
        phoneNumber,
        '⚠️ Opção inválida. Digite o número correto do produto ou "0" para voltar.'
      );
      return;
    }

    const productId = productList[productIndex];
    const product = await prisma.product.findUnique({ where: { id: productId } });

    if (!product) {
      await evolutionApiService.sendTextMessage(
        `tenant_${tenant.id}`,
        phoneNumber,
        '❌ Produto não encontrado.'
      );
      return;
    }

    let message = `*${product.name}*\n\n`;
    if (product.description) {
      message += `${product.description}\n\n`;
    }
    message += `💰 *R$ ${product.price.toFixed(2)}*\n`;
    if (product.costPrice) {
      message += `_Custo: R$ ${product.costPrice.toFixed(2)}_\n`;
    }
    message += `\n📦 Estoque: ${product.stock > 0 ? `${product.stock} unidades` : 'Sem estoque'}\n`;
    
    if (product.images && product.images.length > 0) {
      message += `\n🖼️ Imagens disponíveis\n`;
    }

    if (product.stock > 0) {
      message += `\n_Digite a quantidade que deseja comprar ou "0" para voltar_`;
      
      await evolutionApiService.sendTextMessage(`tenant_${tenant.id}`, phoneNumber, message);
      
      // Enviar imagem se disponível
      if (product.images && product.images.length > 0) {
        await evolutionApiService.sendImageMessage(
          `tenant_${tenant.id}`,
          phoneNumber,
          product.images[0],
          product.name
        );
      }

      await prisma.session.update({
        where: { id: session.id },
        data: { 
          currentState: 'ADDING_TO_CART',
          metadata: { ...session.metadata, selectedProductId: product.id }
        },
      });
    } else {
      message += '\n\n❌ Produto sem estoque no momento.';
      await evolutionApiService.sendTextMessage(`tenant_${tenant.id}`, phoneNumber, message);
      await whatsappBotController.showMainMenu(tenant, session, phoneNumber);
    }
  },

  /**
   * Adicionar produto ao carrinho
   */
  handleAddingToCart: async (tenant, session, phoneNumber, content) => {
    const quantity = parseInt(content.trim());

    if (isNaN(quantity) || quantity <= 0) {
      if (content.toLowerCase() === 'voltar' || content === '0') {
        await whatsappBotController.handleBrowsingProducts(tenant, session, phoneNumber, '1');
        return;
      }
      await evolutionApiService.sendTextMessage(
        `tenant_${tenant.id}`,
        phoneNumber,
        '⚠️ Digite uma quantidade válida (número maior que 0) ou "0" para voltar.'
      );
      return;
    }

    const selectedProductId = session.metadata?.selectedProductId;
    
    if (!selectedProductId) {
      await evolutionApiService.sendTextMessage(
        `tenant_${tenant.id}`,
        phoneNumber,
        '❌ Erro: Produto não selecionado. Por favor, comece novamente.'
      );
      await whatsappBotController.showMainMenu(tenant, session, phoneNumber);
      return;
    }

    const product = await prisma.product.findUnique({ where: { id: selectedProductId } });

    if (!product || product.stock < quantity) {
      await evolutionApiService.sendTextMessage(
        `tenant_${tenant.id}`,
        phoneNumber,
        `❌ Quantidade indisponível. Estoque máximo: ${product?.stock || 0} unidades.`
      );
      return;
    }

    // Obter ou criar carrinho ativo
    let cart = await prisma.cart.findFirst({
      where: {
        tenantId: tenant.id,
        sessionId: session.id,
        status: 'ACTIVE',
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          tenantId: tenant.id,
          sessionId: session.id,
          status: 'ACTIVE',
          subtotal: 0,
          discountAmount: 0,
          total: 0,
        },
      });
    }

    // Adicionar ou atualizar item no carrinho
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: selectedProductId,
      },
    });

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > product.stock) {
        await evolutionApiService.sendTextMessage(
          `tenant_${tenant.id}`,
          phoneNumber,
          `⚠️ Quantidade excede o estoque disponível. Máximo: ${product.stock} unidades.`
        );
        return;
      }

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: selectedProductId,
          quantity,
          price: product.price,
        },
      });
    }

    // Recalcular totais do carrinho
    await whatsappBotController.recalculateCart(cart.id);

    await evolutionApiService.sendTextMessage(
      `tenant_${tenant.id}`,
      phoneNumber,
      `✅ *${quantity}x ${product.name}* adicionado(s) ao carrinho!\n\n_Digite "carrinho" para ver seu carrinho ou continue comprando._`
    );

    await prisma.session.update({
      where: { id: session.id },
      data: { 
        currentState: 'INITIAL',
        metadata: { ...session.metadata, selectedProductId: null }
      },
    });
  },

  /**
   * Mostrar carrinho
   */
  showCart: async (tenant, session, phoneNumber) => {
    try {
      const cart = await prisma.cart.findFirst({
        where: {
          tenantId: tenant.id,
          sessionId: session.id,
          status: 'ACTIVE',
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!cart || cart.items.length === 0) {
        await evolutionApiService.sendTextMessage(
          `tenant_${tenant.id}`,
          phoneNumber,
          '🛒 Seu carrinho está vazio!\n\nDigite "produtos" para começar a comprar.'
        );
        return;
      }

      let message = '*🛒 Seu Carrinho:*\n\n';
      cart.items.forEach((item, index) => {
        message += `${index + 1}. *${item.product.name}*\n`;
        message += `   ${item.quantity}x R$ ${item.price.toFixed(2)} = R$ ${(item.quantity * item.price).toFixed(2)}\n\n`;
      });

      message += `━━━━━━━━━━━━━━━━━━━━\n`;
      message += `*Subtotal:* R$ ${cart.subtotal.toFixed(2)}\n`;
      if (cart.discountAmount > 0) {
        message += `*Desconto:* -R$ ${cart.discountAmount.toFixed(2)}\n`;
      }
      if (cart.shippingCost > 0) {
        message += `*Frete:* R$ ${cart.shippingCost.toFixed(2)}\n`;
      }
      message += `\n*TOTAL: R$ ${cart.total.toFixed(2)}*\n\n`;
      message += `_Digite "checkout" para finalizar ou "remover X" para remover itens_`;

      await evolutionApiService.sendTextMessage(`tenant_${tenant.id}`, phoneNumber, message);

      await prisma.session.update({
        where: { id: session.id },
        data: { currentState: 'CHECKOUT' },
      });
    } catch (error) {
      console.error('Erro ao mostrar carrinho:', error);
    }
  },

  /**
   * Processar checkout
   */
  handleCheckout: async (tenant, session, phoneNumber, content) => {
    const lowerContent = content.toLowerCase().trim();

    if (lowerContent === 'finalizar' || lowerContent === 'checkout' || lowerContent === 'sim') {
      // Verificar se há carrinho ativo
      const cart = await prisma.cart.findFirst({
        where: {
          tenantId: tenant.id,
          sessionId: session.id,
          status: 'ACTIVE',
        },
        include: { items: true },
      });

      if (!cart || cart.items.length === 0) {
        await evolutionApiService.sendTextMessage(
          `tenant_${tenant.id}`,
          phoneNumber,
          '⚠️ Seu carrinho está vazio!'
        );
        return;
      }

      // Buscar ou criar cliente
      let customer = await prisma.customer.findFirst({
        where: { phone: phoneNumber, tenantId: tenant.id },
      });

      if (!customer) {
        await evolutionApiService.sendTextMessage(
          `tenant_${tenant.id}`,
          phoneNumber,
          '👤 Para finalizar, preciso do seu nome completo. Por favor, digite:'
        );
        
        await prisma.session.update({
          where: { id: session.id },
          data: { 
            currentState: 'COLLECTING_CUSTOMER_NAME',
            metadata: { ...session.metadata, pendingCartId: cart.id }
          },
        });
        return;
      }

      // Prosseguir para seleção de endereço
      await whatsappBotController.selectAddress(tenant, session, phoneNumber, customer, cart);
      return;
    }

    if (lowerContent.startsWith('remover')) {
      // Implementar remoção de item
      await evolutionApiService.sendTextMessage(
        `tenant_${tenant.id}`,
        phoneNumber,
        'ℹ️ Funcionalidade de remoção em desenvolvimento. Por favor, finalize o pedido e entre em contato para ajustes.'
      );
      return;
    }

    await whatsappBotController.showCart(tenant, session, phoneNumber);
  },

  /**
   * Selecionar endereço de entrega
   */
  selectAddress: async (tenant, session, phoneNumber, customer, cart) => {
    try {
      const addresses = await prisma.address.findMany({
        where: {
          customerId: customer.id,
          type: { in: ['RESIDENTIAL', 'DELIVERY'] },
        },
      });

      if (addresses.length === 0) {
        await evolutionApiService.sendTextMessage(
          `tenant_${tenant.id}`,
          phoneNumber,
          '📍 Não encontramos endereços cadastrados. Vamos cadastrar um novo endereço de entrega.\n\nPor favor, digite seu CEP:'
        );

        await prisma.session.update({
          where: { id: session.id },
          data: { 
            currentState: 'COLLECTING_ZIPCODE',
            metadata: { ...session.metadata, customerId: customer.id, cartId: cart.id }
          },
        });
        return;
      }

      let message = '*📍 Selecione o endereço de entrega:*\n\n';
      addresses.forEach((addr, index) => {
        message += `${index + 1}. ${addr.street}, ${addr.number} - ${addr.neighborhood}\n`;
        message += `   ${addr.city}/${addr.state} - CEP: ${addr.zipCode}\n`;
        if (addr.isDefault) {
          message += `   ✅ Endereço padrão\n`;
        }
        message += '\n';
      });
      message += '0. Cadastrar novo endereço\n\n_Digite o número da opção_';

      await evolutionApiService.sendTextMessage(`tenant_${tenant.id}`, phoneNumber, message);

      await prisma.session.update({
        where: { id: session.id },
        data: { 
          currentState: 'ADDRESS_SELECTED',
          metadata: { ...session.metadata, customerId: customer.id, cartId: cart.id, addresses }
        },
      });
    } catch (error) {
      console.error('Erro ao selecionar endereço:', error);
    }
  },

  /**
   * Escolher forma de pagamento
   */
  handleChoosingPayment: async (tenant, session, phoneNumber, content) => {
    const option = content.trim();

    // Obter chaves PIX do tenant
    const pixKeys = await prisma.pixKey.findMany({
      where: { tenantId: tenant.id, active: true },
    });

    if (option === '1') {
      // PIX
      if (pixKeys.length === 0) {
        await evolutionApiService.sendTextMessage(
          `tenant_${tenant.id}`,
          phoneNumber,
          '⚠️ Nenhuma chave PIX cadastrada. Por favor, entre em contato com o atendente.'
        );
        return;
      }

      const defaultPixKey = pixKeys.find(k => k.isDefault) || pixKeys[0];
      
      let message = '*💠 Pagamento via PIX*\n\n';
      message += `Chave: ${defaultPixKey.key}\n`;
      message += `Tipo: ${defaultPixKey.type}\n`;
      if (defaultPixKey.bankName) {
        message += `Banco: ${defaultPixKey.bankName}\n`;
      }
      message += `\nEnvie o comprovante após realizar o pagamento.\n\n`;
      message += `_Aguardando confirmação do pagamento..._`;

      await evolutionApiService.sendTextMessage(`tenant_${tenant.id}`, phoneNumber, message);

      // Se tiver QR Code, enviar
      if (defaultPixKey.qrCodeStatic) {
        // Poderia enviar como imagem se estivesse armazenado
      }

      await prisma.session.update({
        where: { id: session.id },
        data: { 
          currentState: 'WAITING_PAYMENT_CONFIRMATION',
          metadata: { ...session.metadata, paymentMethod: 'PIX', pixKeyId: defaultPixKey.id }
        },
      });
      return;
    }

    if (option === '2') {
      // Dinheiro
      await evolutionApiService.sendTextMessage(
        `tenant_${tenant.id}`,
        phoneNumber,
        '💵 Pagamento em dinheiro na entrega.\n\n_Digite o valor em notas que você terá para troco:_'
      );

      await prisma.session.update({
        where: { id: session.id },
        data: { 
          currentState: 'COLLECTING_CHANGE_INFO',
          metadata: { ...session.metadata, paymentMethod: 'CASH' }
        },
      });
      return;
    }

    if (option === '3') {
      // Cartão na entrega
      await evolutionApiService.sendTextMessage(
        `tenant_${tenant.id}`,
        phoneNumber,
        '💳 Pagamento com cartão na entrega.\n\n_Cartão de Crédito ou Débito?_'
      );

      await prisma.session.update({
        where: { id: session.id },
        data: { 
          currentState: 'COLLECTING_CARD_TYPE',
          metadata: { ...session.metadata, paymentMethod: 'CARD_ON_DELIVERY' }
        },
      });
      return;
    }

    await evolutionApiService.sendTextMessage(
      `tenant_${tenant.id}`,
      phoneNumber,
      '⚠️ Opção inválida. Escolha 1, 2 ou 3.'
    );
  },

  /**
   * Confirmar pedido
   */
  handleConfirmingOrder: async (tenant, session, phoneNumber, content) => {
    const lowerContent = content.toLowerCase().trim();

    if (lowerContent === 'sim' || lowerContent === 'confirmar') {
      // Criar pedido
      const metadata = session.metadata || {};
      const cartId = metadata.cartId;

      if (!cartId) {
        await evolutionApiService.sendTextMessage(
          `tenant_${tenant.id}`,
          phoneNumber,
          '❌ Erro: Carrinho não encontrado.'
        );
        return;
      }

      const cart = await prisma.cart.findUnique({
        where: { id: cartId },
        include: {
          items: { include: { product: true } },
          customer: true,
          shippingAddress: true,
        },
      });

      if (!cart) {
        await evolutionApiService.sendTextMessage(
          `tenant_${tenant.id}`,
          phoneNumber,
          '❌ Erro: Carrinho não encontrado.'
        );
        return;
      }

      // Criar pedido
      const order = await prisma.order.create({
        data: {
          tenantId: tenant.id,
          customerId: cart.customerId,
          cartId: cart.id,
          status: 'PENDING',
          paymentStatus: metadata.paymentMethod === 'PIX' ? 'PENDING' : 'PENDING',
          paymentMethod: metadata.paymentMethod || 'OTHER',
          subtotal: cart.subtotal,
          discountAmount: cart.discountAmount,
          shippingCost: cart.shippingCost || 0,
          total: cart.total,
          pixKeyId: metadata.pixKeyId,
          shippingAddressId: cart.shippingAddressId,
          billingAddressId: cart.billingAddressId,
          notes: metadata.notes,
        },
      });

      // Criar itens do pedido
      for (const cartItem of cart.items) {
        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            productId: cartItem.productId,
            quantity: cartItem.quantity,
            price: cartItem.price,
            subtotal: cartItem.quantity * cartItem.price,
          },
        });

        // Atualizar estoque
        await prisma.product.update({
          where: { id: cartItem.productId },
          data: { stock: { decrement: cartItem.quantity } },
        });
      }

      // Atualizar carrinho para CONVERTED
      await prisma.cart.update({
        where: { id: cartId },
        data: { status: 'CONVERTED' },
      });

      // Mensagem de confirmação
      let message = `✅ *Pedido Confirmado!*\n\n`;
      message += `Número do pedido: *#${order.id.slice(-6)}*\n`;
      message += `Total: *R$ ${order.total.toFixed(2)}*\n\n`;
      
      if (metadata.paymentMethod === 'PIX') {
        message += `💠 Aguardando confirmação do pagamento PIX...\n`;
      } else if (metadata.paymentMethod === 'CASH') {
        message += `💵 Pagamento em dinheiro na entrega.\n`;
      } else if (metadata.paymentMethod === 'CARD_ON_DELIVERY') {
        message += `💳 Pagamento com cartão na entrega.\n`;
      }

      message += `\n_Você receberá atualizações sobre seu pedido._`;

      await evolutionApiService.sendTextMessage(`tenant_${tenant.id}`, phoneNumber, message);

      // Resetar sessão
      await prisma.session.update({
        where: { id: session.id },
        data: { 
          currentState: 'INITIAL',
          metadata: { lastOrderId: order.id }
        },
      });

      // Mostrar menu principal
      setTimeout(async () => {
        await whatsappBotController.showMainMenu(tenant, session, phoneNumber);
      }, 3000);

      return;
    }

    if (lowerContent === 'não' || lowerContent === 'nao' || lowerContent === 'cancelar') {
      await evolutionApiService.sendTextMessage(
        `tenant_${tenant.id}`,
        phoneNumber,
        '❌ Pedido cancelado. Você pode fazer um novo pedido quando quiser.'
      );
      await whatsappBotController.showMainMenu(tenant, session, phoneNumber);
      return;
    }

    await evolutionApiService.sendTextMessage(
      `tenant_${tenant.id}`,
      phoneNumber,
      '⚠️ Digite "sim" para confirmar ou "não" para cancelar.'
    );
  },

  /**
   * Atendimento ao cliente
   */
  handleCustomerSupport: async (tenant, session, phoneNumber, content) => {
    await evolutionApiService.sendTextMessage(
      `tenant_${tenant.id}`,
      phoneNumber,
      `👨‍💼 *Atendimento Humano*\n\n` +
      `Um de nossos atendentes irá te responder em breve.\n\n` +
      `Enquanto isso, você pode:\n` +
      `• Continuar comprando (digite "produtos")\n` +
      `• Ver seus pedidos (digite "pedidos")\n` +
      `• Voltar ao menu (digite "menu")`
    );

    await prisma.session.update({
      where: { id: session.id },
      data: { 
        currentState: 'CUSTOMER_SUPPORT',
        metadata: { ...session.metadata, supportRequested: true, supportRequestedAt: new Date() }
      },
    });

    // Notificar administradores (implementar depois)
    // await notifyAdmins(tenant.id, phoneNumber, 'Solicitação de suporte');
  },

  /**
   * Mostrar meus pedidos
   */
  showMyOrders: async (tenant, session, phoneNumber) => {
    try {
      // Obter cliente pelo telefone
      const customer = await prisma.customer.findFirst({
        where: { phone: phoneNumber, tenantId: tenant.id },
      });

      if (!customer) {
        await evolutionApiService.sendTextMessage(
          `tenant_${tenant.id}`,
          phoneNumber,
          '📦 Você ainda não tem pedidos cadastrados.\n\nComece comprando! Digite "produtos".'
        );
        return;
      }

      const orders = await prisma.order.findMany({
        where: { customerId: customer.id },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: { product: true },
          },
        },
      });

      if (orders.length === 0) {
        await evolutionApiService.sendTextMessage(
          `tenant_${tenant.id}`,
          phoneNumber,
          '📦 Você ainda não tem pedidos.\n\nComece comprando! Digite "produtos".'
        );
        return;
      }

      let message = '*📦 Seus Pedidos:*\n\n';
      orders.forEach((order, index) => {
        const statusEmoji = {
          'PENDING': '⏳',
          'CONFIRMED': '✅',
          'PROCESSING': '🔄',
          'SHIPPED': '🚚',
          'DELIVERED': '✅',
          'CANCELLED': '❌',
        }[order.status] || '📦';

        message += `${index + 1}. Pedido #${order.id.slice(-6)}\n`;
        message += `   ${statusEmoji} Status: ${order.status}\n`;
        message += `   💰 Total: R$ ${order.total.toFixed(2)}\n`;
        message += `   📅 Data: ${order.createdAt.toLocaleDateString('pt-BR')}\n\n`;
      });

      message += '_Digite o número do pedido para ver detalhes ou "0" para voltar_';

      await evolutionApiService.sendTextMessage(`tenant_${tenant.id}`, phoneNumber, message);
    } catch (error) {
      console.error('Erro ao mostrar pedidos:', error);
    }
  },

  /**
   * Mostrar ajuda
   */
  showSupport: async (tenant, session, phoneNumber) => {
    const helpMessage = `
*❓ Central de Ajuda*

*Comandos disponíveis:*
• "menu" - Volta ao menu principal
• "produtos" - Ver produtos
• "carrinho" - Ver meu carrinho
• "pedidos" - Ver meus pedidos
• "ajuda" - Esta mensagem
• "suporte" - Falar com atendente

*Dicas:*
• Durante a navegação, digite "0" para voltar
• Você pode cancelar seu pedido a qualquer momento antes da confirmação
• Para dúvidas sobre produtos, fale com nosso atendente

_Precisa de mais ajuda? Digite "suporte"_
    `.trim();

    await evolutionApiService.sendTextMessage(`tenant_${tenant.id}`, phoneNumber, helpMessage);
  },

  /**
   * Recalcular totais do carrinho
   */
  recalculateCart: async (cartId) => {
    try {
      const items = await prisma.cartItem.findMany({
        where: { cartId },
        include: { product: true },
      });

      let subtotal = 0;
      for (const item of items) {
        subtotal += item.quantity * item.price;
      }

      // Aplicar descontos se houver
      let discountAmount = 0;
      // TODO: Implementar lógica de descontos

      const total = subtotal - discountAmount;

      await prisma.cart.update({
        where: { id: cartId },
        data: { subtotal, discountAmount, total },
      });
    } catch (error) {
      console.error('Erro ao recalcular carrinho:', error);
    }
  },

  /**
   * Handler para atualização de conexão
   */
  handleConnectionUpdate: async (tenant, data) => {
    try {
      const state = data.data?.state;
      console.log(`[Conexão] Tenant ${tenant.id}: ${state}`);

      // Atualizar status da instância no banco
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          metadata: {
            ...tenant.metadata,
            whatsappConnectionState: state,
            lastConnectionUpdate: new Date(),
          },
        },
      });

      if (state === 'open') {
        console.log(`✅ WhatsApp do tenant ${tenant.name} conectado!`);
      } else if (state === 'closed') {
        console.log(`❌ WhatsApp do tenant ${tenant.name} desconectado!`);
      }
    } catch (error) {
      console.error('Erro ao atualizar conexão:', error);
    }
  },

  /**
   * Handler para QR Code
   */
  handleQrCode: async (tenant, data) => {
    try {
      const qrCode = data.data?.qrcode;
      console.log(`[QR Code] Tenant ${tenant.id}: QR Code atualizado`);

      // Aqui poderia notificar o admin para escanear o QR Code
      // Ou salvar no banco para exibição no dashboard
    } catch (error) {
      console.error('Erro ao processar QR Code:', error);
    }
  },
};

export default whatsappBotController;

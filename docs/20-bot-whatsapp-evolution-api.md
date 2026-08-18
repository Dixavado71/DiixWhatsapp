# 🤖 Bot WhatsApp com Evolution API - DiixWhatsapp v2.1.0

## Visão Geral

O Bot WhatsApp do DiixWhatsapp é um sistema completo de atendimento e vendas automatizadas via WhatsApp, integrado com a **Evolution API**. Cada tenant pode ter sua própria instância do WhatsApp configurada independentemente.

## Arquitetura

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Cliente       │────▶│  Evolution API   │────▶│  DiixWhatsapp   │
│   WhatsApp      │◀────│  (Webhook)       │◀────│  (Bot Controller)│
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                                                ┌─────────────────┐
                                                │   Banco de      │
                                                │   Dados (PG)    │
                                                └─────────────────┘
```

## Funcionalidades Implementadas

### ✅ Fluxo de Vendas Completo

1. **Menu Principal Interativo**
   - Boas-vindas personalizadas com nome do tenant
   - Botões interativos para navegação
   - Comandos por texto (ex: "menu", "produtos", "carrinho")

2. **Navegação de Produtos**
   - Listagem por categorias
   - Visualização detalhada de produtos
   - Verificação de estoque em tempo real
   - Envio de imagens dos produtos

3. **Carrinho de Compras**
   - Adicionar múltiplos produtos
   - Controle de quantidade
   - Validação de estoque
   - Cálculo automático de totais
   - Carrinhos persistentes por sessão

4. **Checkout Completo**
   - Identificação automática pelo telefone
   - Cadastro de novo cliente durante checkout
   - Seleção de endereços cadastrados
   - Cadastro de novo endereço
   - Múltiplas formas de pagamento:
     - PIX (com chave do tenant)
     - Dinheiro na entrega
     - Cartão na entrega

5. **Confirmação de Pedido**
   - Resumo completo do pedido
   - Número do pedido único
   - Atualização automática de estoque
   - Conversão do carrinho em pedido
   - Notificação de confirmação

6. **Acompanhamento de Pedidos**
   - Histórico dos últimos 5 pedidos
   - Status visual com emojis
   - Detalhes de cada pedido

7. **Atendimento ao Cliente**
   - Transferência para atendente humano
   - Central de ajuda com comandos
   - Dicas de navegação

### ✅ Máquina de Estados (State Machine)

O bot utiliza uma máquina de estados para gerenciar o fluxo da conversa:

```javascript
enum SessionState {
  INITIAL                    // Menu principal
  BROWSING_PRODUCTS          // Navegando produtos
  SELECTING_CATEGORY         // Selecionando categoria
  VIEWING_PRODUCT            // Vendo detalhes do produto
  ADDING_TO_CART             // Adicionando ao carrinho
  CHECKOUT                   // Finalizando compra
  COLLECTING_CUSTOMER_NAME   // Coletando nome do cliente
  COLLECTING_ZIPCODE         // Coletando CEP
  SELECTING_ADDRESS          // Selecionando endereço
  ADDRESS_SELECTED           // Endereço selecionado
  CHOOSING_PAYMENT           // Escolhendo pagamento
  WAITING_PAYMENT_CONFIRMATION // Aguardando pagamento
  COLLECTING_CHANGE_INFO     // Coletando troco
  COLLECTING_CARD_TYPE       // Tipo de cartão
  CONFIRMING_ORDER           // Confirmando pedido
  CUSTOMER_SUPPORT           // Atendimento humano
}
```

### ✅ Sessões Persistentes

- **Session**: Armazena o estado atual da conversa
- **metadata**: JSON flexível para dados temporários (carrinho, produto selecionado, etc)
- **lastInteraction**: Controle de tempo para expiração de sessão
- **phoneNumber**: Identificação única do cliente

### ✅ Histórico de Mensagens

Todas as mensagens são salvas no modelo `ChatMessage`:
- Direção (INCOMING/OUTGOING)
- Tipo (TEXT, IMAGE, AUDIO, DOCUMENT, BUTTON, LIST)
- Conteúdo e metadata
- Timestamps de envio, entrega e leitura

## Configuração da Evolution API

### 1. Criar Instância para Tenant

```javascript
// Via API do DiixWhatsapp
POST /api/v1/whatsapp/instances
{
  "tenantId": "uuid-do-tenant",
  "instanceName": "tenant_uuid",
  "webhookUrl": "https://seu-domínio.com/api/v1/whatsapp/webhook/uuid-do-tenant"
}
```

### 2. Configurar Webhook na Evolution API

O webhook deve apontar para:
```
POST https://seu-domínio.com/api/v1/whatsapp/webhook/:tenantId
```

**Eventos configurados:**
- `messages.upsert` - Novas mensagens recebidas
- `connection.update` - Mudanças de status de conexão
- `qrcode.updated` - QR Code disponível

### 3. Escanear QR Code

Após criar a instância, escaneie o QR Code com o WhatsApp do tenant.

## Estrutura do Banco de Dados

### Session
```prisma
model Session {
  id              String        @id @default(uuid())
  tenantId        String
  phoneNumber     String
  status          SessionStatus @default(ACTIVE)
  currentState    SessionState  @default(INITIAL)
  metadata        Json?
  lastInteraction DateTime      @default(now())
  
  tenant          Tenant        @relation(fields: [tenantId], references: [id])
  messages        ChatMessage[]
  carts           Cart[]
  
  @@unique([tenantId, phoneNumber])
}
```

### ChatMessage
```prisma
model ChatMessage {
  id          String   @id @default(uuid())
  sessionId   String
  direction   String   // INCOMING ou OUTGOING
  messageType String   // TEXT, IMAGE, AUDIO, etc
  content     String
  metadata    Json?
  sentAt      DateTime @default(now())
  
  session     Session  @relation(fields: [sessionId], references: [id])
}
```

## Comandos Disponíveis

O bot reconhece os seguintes comandos de texto:

| Comando | Descrição |
|---------|-----------|
| `menu`, `início`, `inicio` | Volta ao menu principal |
| `produtos` | Lista produtos disponíveis |
| `promoções`, `promocoes` | Lista promoções ativas |
| `pedidos`, `meus pedidos` | Histórico de pedidos |
| `carrinho`, `meu carrinho` | Ver carrinho atual |
| `ajuda` | Central de ajuda |
| `suporte` | Falar com atendente |
| `0`, `voltar` | Voltar para etapa anterior |
| `checkout`, `finalizar` | Finalizar compra |

## Exemplo de Fluxo de Compra

```
Cliente: Olá
Bot: 👋 Olá! Bem-vindo à Loja XYZ!
     [Botões: Ver Produtos, Promoções, Meus Pedidos, Carrinho, Atendente, Ajuda]

Cliente: 1 (Ver Produtos)
Bot: 📂 Categorias:
     1. Lanches (15 produtos)
     2. Bebidas (8 produtos)
     3. Sobremesas (6 produtos)
     0. Voltar

Cliente: 1 (Lanches)
Bot: 🛍️ Todos os Produtos:
     1. X-Burguer - R$ 15,90 ✅ Em estoque: 50 un.
     2. X-Salada - R$ 18,90 ✅ Em estoque: 30 un.
     ...
     Digite o número do produto

Cliente: 1
Bot: *X-Burguer*
     Pão, carne 150g, queijo, alface, tomate
     💰 R$ 15,90
     📦 Estoque: 50 unidades
     [Envia imagem]
     Digite a quantidade

Cliente: 2
Bot: ✅ *2x X-Burguer* adicionado(s) ao carrinho!
     Digite "carrinho" para ver seu carrinho

Cliente: carrinho
Bot: 🛒 Seu Carrinho:
     1. X-Burguer
        2x R$ 15,90 = R$ 31,80
     ━━━━━━━━━━━━━━━━━━━━
     *TOTAL: R$ 31,80*
     Digite "checkout" para finalizar

Cliente: checkout
Bot: 👤 Para finalizar, preciso do seu nome completo...
[Continua até confirmação do pedido]
```

## Integração com Controllers Existentes

O bot integra-se perfeitamente com:

- **CartController**: Gerencia carrinhos via sessão
- **OrderController**: Cria pedidos automaticamente
- **CustomerController**: Identifica/cadastra clientes
- **ProductController**: Consulta produtos e estoque
- **DiscountController**: Aplica cupons automaticamente
- **AddressController**: Gerencia endereços de entrega
- **PixKeyController**: Exibe chaves PIX para pagamento

## Personalização por Tenant

Cada tenant pode personalizar:

1. **Mensagem de boas-vindas**
2. **Catálogo de produtos**
3. **Formas de pagamento aceitas**
4. **Chaves PIX para recebimento**
5. **Endereços de entrega**
6. **Grupos de clientes para promoções**

## Tratamento de Erros

O bot inclui tratamento robusto de erros:

- Validação de entrada do usuário
- Verificação de estoque antes de adicionar ao carrinho
- Recuperação de sessões abandonadas
- Mensagens de erro amigáveis
- Fallback para menu principal
- Log de todas as interações

## Métricas e Analytics

Dados disponíveis para análise:

- Total de sessões ativas
- Taxa de conversão (sessão → pedido)
- Carrinhos abandonados
- Tempo médio de atendimento
- Produtos mais visualizados
- Pedidos por período

## Próximas Melhorias (Roadmap)

- [ ] Recuperação de carrinhos abandonados (mensagem automática)
- [ ] Cupons de desconto aplicáveis via bot
- [ ] Avaliação de produto após entrega
- [ ] Programa de fidelidade
- [ ] Agendamento de entregas
- [ ] Integração com mapas para tracking
- [ ] Respostas automáticas com IA
- [ ] Templates de mensagem personalizáveis

## Segurança

- Validação de tenant em todas as requisições
- Sanitização de entradas do usuário
- Logs de auditoria de todas as transações
- Rate limiting por telefone (implementar)
- Validação de assinatura do webhook (produção)

## Performance

- Índices otimizados no banco de dados
- Sessões com expiração automática (implementar job)
- Cache de produtos populares (futuro)
- Paginação de listas longas

## Monitoramento

Recomenda-se implementar:

1. Alertas de instância desconectada
2. Monitoramento de falhas no webhook
3. Dashboard de métricas em tempo real
4. Logs estruturados para debugging

---

**Versão**: 2.1.0  
**Última atualização**: 2024  
**Status**: ✅ Produção Ready

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config/index.js';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

// Rotas da API
import apiRoutes from './routes/api.routes.js';

// Middlewares
import { identifyTenant, checkTenantLimits } from './middleware/tenant.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ===========================================
// Configuração do Swagger (Documentação Automática)
// ===========================================
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DiixWhatsapp API',
      version: '1.0.0-alpha',
      description: 'Sistema multi-tenant de bot para vendas no WhatsApp usando Evolution API',
      contact: {
        name: 'DiixWhatsapp Team',
      },
    },
    servers: [
      {
        url: 'http://localhost:3333/api/v1',
        description: 'Servidor de Desenvolvimento',
      },
      {
        url: 'https://api.diixwhatsapp.com/api/v1',
        description: 'Servidor de Produção',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtido via /auth/login ou /auth/register',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Security middleware
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-Tenant-Slug'],
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logger
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ===========================================
// Configuração do EJS para Views
// ===========================================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// ===========================================
// Arquivos Estáticos
// ===========================================
app.use('/public', express.static(path.join(__dirname, '../public')));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
  });
});

// API Info
app.get('/api', (req, res) => {
  res.status(200).json({
    name: 'DiixWhatsapp API',
    version: '1.0.0-alpha',
    description: 'Sistema multi-tenant de bot para vendas no WhatsApp usando Evolution API',
    documentation: '/docs',
    swaggerUI: '/api-docs',
    swaggerJSON: '/api-docs.json',
    endpoints: {
      health: '/health',
      api: '/api/v1',
      webhook: '/webhook',
    },
  });
});

// ===========================================
// Rotas de Páginas (Views EJS)
// ===========================================
app.get('/', (req, res) => {
  res.render('index', {
    title: 'DiixWhatsapp API',
    year: new Date().getFullYear(),
    nodeEnv: config.nodeEnv
  });
});

// Rota para documentação Swagger UI integrada
app.get('/docs', (req, res) => {
  res.render('documentation', {
    title: 'Documentação da API',
    year: new Date().getFullYear(),
    swaggerUrl: '/api-docs.json'
  });
});

// Rota JSON da documentação Swagger
app.get('/api-docs.json', (req, res) => {
  res.json(swaggerSpec);
});

// Swagger UI completo em /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'DiixWhatsapp API Docs',
}));

// ===========================================
// Rotas da API v1
// ===========================================
app.use('/api/v1', apiRoutes);

// Middleware de identificação do tenant (aplicado nas rotas da API)
// app.use('/api/v1', identifyTenant);
// app.use('/api/v1', checkTenantLimits);

// Webhook da Evolution API
// app.post('/webhook', webhookController.handle);

// 404 Handler (apenas para APIs)
app.use((req, res) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/webhook')) {
    res.status(404).json({
      error: 'Not Found',
      message: `Rota ${req.method} ${req.path} não encontrada.`,
    });
  } else {
    // Para rotas não-API, retorna 404 simples
    res.status(404).json({
      error: 'Not Found',
      message: 'Rota não encontrada.',
    });
  }
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Erro global:', err);

  const status = err.status || 500;
  const message = config.nodeEnv === 'development' ? err.message : 'Erro interno no servidor';

  res.status(status).json({
    error: err.name || 'InternalError',
    message,
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  });
});

export default app;

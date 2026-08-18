import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config/index.js';

// Rotas da API
import apiRoutes from './routes/api.routes.js';

// Middlewares
import { identifyTenant, checkTenantLimits } from './middleware/tenant.js';

// Configurações de caminho para servir o frontend
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicPath = path.resolve(__dirname, '../public');

const app = express();

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
// Servir Frontend Estático (Vue 3 Buildado)
// ===========================================
console.log(`📁 Servindo frontend estático de: ${publicPath}`);
app.use(express.static(publicPath));

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
    endpoints: {
      health: '/health',
      api: '/api/v1',
      webhook: '/webhook',
    },
  });
});

// ===========================================
// Rotas da API v1
// ===========================================
app.use('/api/v1', apiRoutes);

// Middleware de identificação do tenant (aplicado nas rotas da API)
// app.use('/api/v1', identifyTenant);
// app.use('/api/v1', checkTenantLimits);

// Webhook da Evolution API
// app.post('/webhook', webhookController.handle);

// ===========================================
// Rota Catch-all para SPA Vue Router
// Serve index.html para todas as rotas não-API
// ===========================================
app.get('/{*path}', (req, res) => {
  // Se for uma rota de API, ignora (não deve chegar aqui)
  if (req.path.startsWith('/api') || req.path.startsWith('/webhook')) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Rota ${req.method} ${req.path} não encontrada.`,
    });
  }
  
  // Caso contrário, serve o index.html para o Vue Router lidar
  res.sendFile(path.join(publicPath, 'index.html'));
});

// 404 Handler (apenas para APIs)
app.use((req, res) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/webhook')) {
    res.status(404).json({
      error: 'Not Found',
      message: `Rota ${req.method} ${req.path} não encontrada.`,
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

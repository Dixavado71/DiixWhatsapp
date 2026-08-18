import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import config from './config/index.js';

// Middlewares
import { identifyTenant, checkTenantLimits } from './middleware/tenant.js';

// Rotas (serão criadas)
// import routes from './routes/index.js';

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
app.get('/', (req, res) => {
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

// Middleware de identificação do tenant (aplicado nas rotas da API)
// app.use('/api/v1', identifyTenant);
// app.use('/api/v1', checkTenantLimits);

// Rotas da API
// app.use('/api/v1', routes);

// Webhook da Evolution API
// app.post('/webhook', webhookController.handle);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Rota ${req.method} ${req.path} não encontrada.`,
  });
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

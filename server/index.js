const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Logger estructurado
const logger = require('./config/logger');
const requestLogger = require('./middleware/requestLogger');
const metricsMiddleware = require('./middleware/metricsMiddleware');

const app = express();

// Trust proxy configuration (for development and production)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// Función helper para obtener orígenes permitidos (reutilizable)
const getAllowedOrigins = () => {
  const frontendPort = process.env.FRONTEND_PORT || '3000'; // Cambiar default a 3000
  return [
    'http://localhost:3000',             // Puerto principal React
    'http://127.0.0.1:3000',            // Localhost alternativo
    `http://localhost:${frontendPort}`,  // Puerto configurado del frontend
    'http://localhost:1000',             // Puerto alternativo
    'http://localhost:3001',             // Puerto alternativo
    process.env.FRONTEND_URL,            // URL de producción
    process.env.ALLOWED_ORIGINS?.split(',') || [] // Orígenes adicionales separados por coma
  ].flat().filter(Boolean);
};

// CORS configuration - Simplificado para desarrollo
if (process.env.NODE_ENV === 'development') {
  // En desarrollo, permitir todo desde localhost
  app.use(cors({
    origin: true, // Permitir cualquier origen en desarrollo
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Content-Disposition', 'Content-Type', 'Content-Length']
  }));
  logger.info('CORS configurado en modo desarrollo', { allowAll: true });
} else {
  // En producción, usar configuración estricta
  const corsOptions = {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      
      const allowedOrigins = getAllowedOrigins();
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        logger.info('CORS: Origen permitido', { origin });
        callback(null, true);
      } else {
        logger.warn('CORS: Origen no permitido', { origin });
        callback(new Error('No permitido por CORS'));
      }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Content-Disposition', 'Content-Type', 'Content-Length']
  };
  
  app.use(cors(corsOptions));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Demasiadas peticiones desde esta IP, intenta de nuevo más tarde.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting for development environment
  skip: (req, res) => process.env.NODE_ENV === 'development' && req.ip === '::1'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use(requestLogger);

// Middleware simplificado para descargas
app.use((req, res, next) => {
  // Log para debugging de descargas
  if (req.path.includes('/pdf') || req.path.includes('/excel')) {
    logger.debug('Petición de descarga', { 
      method: req.method, 
      path: req.path, 
      origin: req.headers.origin 
    });
  }
  next();
});

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sundeck-crm', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => logger.info('Conectado a MongoDB exitosamente'))
.catch(err => logger.error('Error conectando a MongoDB', { error: err.message, stack: err.stack }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/proyectos', metricsMiddleware);
app.use('/api/cotizaciones', metricsMiddleware);
app.use('/api/instalaciones', metricsMiddleware);
app.use('/api/metrics', require('./routes/metrics'));
app.use('/api/prospectos', require('./routes/prospectos'));
app.use('/api/cotizaciones', require('./routes/cotizaciones'));
app.use('/api/pedidos', require('./routes/pedidos'));
app.use('/api/pedidos/dashboard', require('./routes/dashboardPedidos'));
app.use('/api/fabricacion', require('./routes/fabricacion'));
app.use('/api/instalaciones', require('./routes/instalaciones'));
app.use('/api/kpis-instalaciones', require('./routes/kpisInstalaciones'));
app.use('/api/postventa', require('./routes/postventa'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/recordatorios', require('./routes/recordatorios'));
app.use('/api/productos', require('./routes/productos'));
app.use('/api/reportes', require('./routes/reportes'));
app.use('/api/plantillas', require('./routes/plantillas'));
app.use('/api/plantillas-whatsapp', require('./routes/plantillasWhatsApp'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/etapas', require('./routes/etapas'));
app.use('/api/proyectos', require('./routes/proyectos'));
app.use('/api/proyecto-pedido', require('./routes/proyectoPedido')); // ✅ NUEVO - Modelo Unificado
app.use('/api/exportacion', require('./routes/exportacion')); // ✅ REACTIVADO - Proyecto Unificado
app.use('/api/kpis', require('./routes/kpis')); // ✅ NUEVO - KPIs y Métricas de Ventas
app.use('/api/storage', require('./routes/storage'));
app.use('/api/backup', require('./routes/backup'));
app.use('/api/fix', require('./routes/fix')); // Ruta temporal para correcciones

// Servir archivos estáticos desde uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
logger.info('Archivos estáticos configurados', { directory: path.join(__dirname, 'uploads') });

// Servir archivos estáticos públicos (imágenes, logos, etc.)
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Debug: Listar archivos de evidencias
app.get('/api/debug/evidencias', (req, res) => {
  const evidenciasDir = path.join(__dirname, 'uploads/evidencias');
  try {
    const files = fs.readdirSync(evidenciasDir);
    res.json({
      directory: evidenciasDir,
      files: files.map(file => ({
        name: file,
        url: `/uploads/evidencias/${file}`,
        fullPath: path.join(evidenciasDir, file)
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Error no manejado', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    userId: req.user?.id
  });
  
  res.status(500).json({ 
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  logger.info('Servidor iniciado exitosamente', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    corsOrigins: getAllowedOrigins().length,
    timestamp: new Date().toISOString()
  });
  
  logger.info('Configuración CORS', { 
    allowedOrigins: getAllowedOrigins() 
  });
});

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

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

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origin (como aplicaciones móviles o Postman)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = getAllowedOrigins();
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log(`✅ CORS: Origen permitido: ${origin}`);
      callback(null, true);
    } else {
      console.warn(`🚫 CORS: Origen no permitido: ${origin}`);
      console.warn(`📋 Orígenes permitidos: ${allowedOrigins.join(', ')}`);
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

// Middleware para manejar descargas de archivos
app.use((req, res, next) => {
  // Permitir descargas de PDF y Excel
  if (req.path.includes('/pdf') || req.path.includes('/excel')) {
    const origin = req.headers.origin;
    const allowedOrigins = getAllowedOrigins();
    
    // Solo exponer headers adicionales para descargas, CORS ya maneja Access-Control-Allow-Origin
    res.header('Access-Control-Expose-Headers', 'Content-Disposition, Content-Type, Content-Length');
    
    // Log para debugging (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      console.log(`📥 Descarga desde origen: ${origin}`);
      console.log(`✅ Orígenes permitidos: ${allowedOrigins.join(', ')}`);
    }
  }
  next();
});

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sundeck-crm', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Conectado a MongoDB'))
.catch(err => console.error('❌ Error conectando a MongoDB:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/prospectos', require('./routes/prospectos'));
app.use('/api/cotizaciones', require('./routes/cotizaciones'));
app.use('/api/pedidos', require('./routes/pedidos'));
app.use('/api/fabricacion', require('./routes/fabricacion'));
app.use('/api/instalaciones', require('./routes/instalaciones'));
app.use('/api/postventa', require('./routes/postventa'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/recordatorios', require('./routes/recordatorios'));
app.use('/api/productos', require('./routes/productos'));
app.use('/api/reportes', require('./routes/reportes'));
app.use('/api/plantillas', require('./routes/plantillas'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/etapas', require('./routes/etapas'));
app.use('/api/storage', require('./routes/storage'));

// Servir archivos estáticos desde uploads
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
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
  console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
  console.log(`🌐 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Orígenes CORS permitidos: ${getAllowedOrigins().join(', ')}`);
});

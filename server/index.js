const path = require('path');
const dotenvPath = path.join(__dirname, '../.env');
require('dotenv').config({ path: dotenvPath });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');

// Logger y Tareas Programadas
const logger = require('./config/logger');
const requestLogger = require('./middleware/requestLogger');
const { initScheduledJobs } = require('./config/scheduler'); // <-- IMPORTAMOS EL TEMPORIZADOR

const metricsMiddleware = require('./middleware/metricsMiddleware');

const app = express();
app.set('trust proxy', 1);
app.use(helmet());

const getAllowedOrigins = () => {
  const frontendPort = process.env.FRONTEND_PORT || '3000';
  return [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    `http://localhost:${frontendPort}`,
    'http://localhost:1000',
    'http://localhost:3001',
    process.env.FRONTEND_URL,
    process.env.ALLOWED_ORIGINS?.split(',') || []
  ].flat().filter(Boolean);
};

if (process.env.NODE_ENV === 'development') {
  app.use(cors({
    origin: true, 
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Content-Disposition', 'Content-Type', 'Content-Length']
  }));
  logger.info('CORS configurado en modo desarrollo');
} else {
  const corsOptions = {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      const allowedOrigins = getAllowedOrigins();
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        logger.warn('CORS: Origen no permitido', { origin });
        callback(new Error('No permitido por CORS'));
      }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Content-Disposition', 'Content-Type', 'Content-Length']
  };
  app.use(cors(corsOptions));
}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 1000, // Aumentado para desarrollo y APIs internas
  message: 'Demasiadas peticiones desde esta IP, intenta de nuevo más tarde.',
  standardHeaders: true, 
  legacyHeaders: false,
  skip: (req, res) => process.env.NODE_ENV === 'development' && req.ip === '::1'
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sundeck-crm', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => logger.info('Conectado a MongoDB exitosamente'))
.catch(err => logger.error('Error conectando a MongoDB', { error: err.message, stack: err.stack }));

app.use('/api', metricsMiddleware);

// --- Carga de Rutas ---
const routes = require('./routes');
app.use('/api', routes);


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.use((err, req, res, next) => {
  logger.error('Error no manejado', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
  });
  res.status(500).json({ 
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

app.use('*', (req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  logger.info(`Servidor iniciado en puerto ${PORT} en modo ${process.env.NODE_ENV || 'development'}`);
  
  // Iniciar el programador de tareas para el snapshot de KPIs
  initScheduledJobs(); // <-- ACTIVAMOS EL TEMPORIZADOR
});

/**
 * Logger Estructurado - Winston
 * 
 * Sistema de logging centralizado con rotación automática de archivos
 * Niveles: error, warn, info, http, debug
 * 
 * Uso:
 *   const logger = require('./config/logger');
 *   logger.info('Mensaje informativo');
 *   logger.error('Error crítico', { error: err });
 */

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// Crear directorio de logs si no existe
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Formato personalizado para logs
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Formato para consola (desarrollo)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Transporte para errores (rotación diaria)
const errorFileTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxSize: '20m',
  maxFiles: '30d',
  format: customFormat
});

// Transporte para logs combinados (rotación diaria)
const combinedFileTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'combined-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: customFormat
});

// Transporte para consola (solo en desarrollo)
const consoleTransport = new winston.transports.Console({
  format: consoleFormat,
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
});

// Crear logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  defaultMeta: { service: 'sundeck-crm' },
  transports: [
    errorFileTransport,
    combinedFileTransport,
    consoleTransport
  ],
  exitOnError: false
});

// Métodos de conveniencia con contexto
logger.logRequest = (req, message, meta = {}) => {
  logger.info(message, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?.id,
    ...meta
  });
};

logger.logError = (error, context = {}) => {
  logger.error(error.message, {
    stack: error.stack,
    ...context
  });
};

logger.logPerformance = (operation, duration, meta = {}) => {
  const level = duration > 1000 ? 'warn' : 'info';
  logger[level](`Performance: ${operation}`, {
    duration: `${duration}ms`,
    ...meta
  });
};

// Evento de rotación de archivos
errorFileTransport.on('rotate', (oldFilename, newFilename) => {
  logger.info('Log file rotated', { oldFilename, newFilename });
});

combinedFileTransport.on('rotate', (oldFilename, newFilename) => {
  logger.info('Log file rotated', { oldFilename, newFilename });
});

// Log inicial
logger.info('Logger inicializado correctamente', {
  environment: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  logsDirectory: logsDir
});

module.exports = logger;

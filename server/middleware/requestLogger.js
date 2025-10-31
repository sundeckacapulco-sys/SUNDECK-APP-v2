/**
 * Middleware de Logging de Requests
 * 
 * Registra automáticamente todas las peticiones HTTP con métricas de performance
 */

const logger = require('../config/logger');

const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log de request entrante
  logger.http('Request recibido', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.id
  });

  // Interceptar el response para medir tiempo
  const originalSend = res.send;
  res.send = function (data) {
    const duration = Date.now() - startTime;
    
    // Log de response
    const logLevel = res.statusCode >= 500 ? 'error' : 
                     res.statusCode >= 400 ? 'warn' : 'http';
    
    logger[logLevel]('Request completado', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id
    });

    // Alertar si la request es muy lenta
    if (duration > 3000) {
      logger.warn('Request lento detectado', {
        method: req.method,
        url: req.originalUrl,
        duration: `${duration}ms`
      });
    }

    originalSend.call(this, data);
  };

  next();
};

module.exports = requestLogger;

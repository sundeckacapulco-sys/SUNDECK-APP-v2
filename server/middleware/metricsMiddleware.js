const logger = require('../config/logger');
const Metric = require('../models/Metric');

const metricsMiddleware = (req, res, next) => {
  const startTime = Date.now();

  res.on('finish', async () => {
    const duration = Date.now() - startTime;
    const endpoint = req.originalUrl || req.path;

    try {
      await Metric.create({
        tipo: 'performance',
        valor: duration,
        metadata: {
          endpoint,
          metodo: req.method,
          statusCode: res.statusCode,
          duracion: duration,
          userId: req.user?._id
        },
        endpoint,
        metodo: req.method,
        statusCode: res.statusCode,
        duracion: duration,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Error guardando métrica', {
        error: error.message,
        stack: error.stack,
        endpoint,
        method: req.method,
        statusCode: res.statusCode
      });
    }
  });

  next();
};

module.exports = metricsMiddleware;

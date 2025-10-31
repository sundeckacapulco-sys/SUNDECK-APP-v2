const express = require('express');
const Metric = require('../models/Metric');
const logger = require('../config/logger');

const router = express.Router();

const parseInteger = (value, defaultValue, maxValue) => {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return defaultValue;
  }

  if (maxValue && parsed > maxValue) {
    return maxValue;
  }

  return parsed;
};

const parseDate = value => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

router.get('/', async (req, res) => {
  try {
    const {
      tipo,
      endpoint,
      metodo,
      statusCode,
      desde,
      hasta,
      limit = '100',
      skip = '0'
    } = req.query;

    const filtros = {};

    if (tipo) filtros.tipo = tipo;
    if (endpoint) filtros.endpoint = endpoint;
    if (metodo) filtros.metodo = metodo;
    if (statusCode) {
      const statusCodeNumber = Number(statusCode);
      if (!Number.isNaN(statusCodeNumber)) {
        filtros.statusCode = statusCodeNumber;
      }
    }

    const fechaInicio = parseDate(desde);
    const fechaFin = parseDate(hasta);

    if (fechaInicio || fechaFin) {
      filtros.timestamp = {};
      if (fechaInicio) filtros.timestamp.$gte = fechaInicio;
      if (fechaFin) filtros.timestamp.$lte = fechaFin;
    }

    const options = {
      sort: { timestamp: -1 },
      limit: parseInteger(limit, 100, 500),
      skip: parseInteger(skip, 0)
    };

    const metricas = await Metric.find(filtros, null, options);

    res.json({
      total: metricas.length,
      data: metricas
    });
  } catch (error) {
    logger.error('Error listando métricas', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      message: 'Error obteniendo métricas',
      error: error.message
    });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const estadisticas = await Metric.obtenerEstadisticas();

    res.json({
      data: estadisticas
    });
  } catch (error) {
    logger.error('Error obteniendo estadísticas de métricas', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      message: 'Error obteniendo estadísticas de métricas',
      error: error.message
    });
  }
});

router.get('/performance', async (req, res) => {
  try {
    const { endpoint, limit = '10' } = req.query;

    const matchStage = { tipo: 'performance' };
    if (endpoint) {
      matchStage.endpoint = endpoint;
    }

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: '$endpoint',
          promedio: { $avg: '$valor' },
          minimo: { $min: '$valor' },
          maximo: { $max: '$valor' },
          total: { $sum: 1 }
        }
      },
      { $sort: { promedio: -1 } }
    ];

    const parsedLimit = parseInteger(limit, 10, 100);
    if (parsedLimit) {
      pipeline.push({ $limit: parsedLimit });
    }

    const rendimiento = await Metric.aggregate(pipeline);

    res.json({
      data: rendimiento
    });
  } catch (error) {
    logger.error('Error obteniendo métricas de rendimiento', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      message: 'Error obteniendo métricas de rendimiento',
      error: error.message
    });
  }
});

router.get('/errors', async (req, res) => {
  try {
    const { endpoint, limit = '50' } = req.query;

    const filtros = { tipo: 'error' };
    if (endpoint) filtros.endpoint = endpoint;

    const metricas = await Metric.find(filtros, null, {
      sort: { timestamp: -1 },
      limit: parseInteger(limit, 50, 200)
    });

    res.json({
      total: metricas.length,
      data: metricas
    });
  } catch (error) {
    logger.error('Error obteniendo métricas de error', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      message: 'Error obteniendo métricas de error',
      error: error.message
    });
  }
});

module.exports = router;

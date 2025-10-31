# 🚀 CONTINUAR AQUÍ - Sprint 2

**Fecha:** 31 Oct 2025  
**Estado:** Tarea 2.2 ✅ COMPLETADA → Tarea 2.3 🚀 INICIAR

---

## ✅ COMPLETADO

### Tarea 2.1: Modelo Metric ✅
- Modelo Metric creado con agregaciones
- 3 pruebas unitarias pasando

### Tarea 2.2: Middleware de Métricas ✅
- Middleware capturando métricas automáticamente
- Aplicado globalmente a todas las rutas /api/*
- 3 pruebas de integración pasando
- **10/10 tests totales** ✅
- Fase 0: 70%

---

## 🎯 SIGUIENTE TAREA: 2.3 API de Métricas

### Crear archivo: `server/routes/metrics.js`

```javascript
const express = require('express');
const router = express.Router();
const Metric = require('../models/Metric');
const logger = require('../config/logger');

// GET /api/metrics - Listar métricas con filtros
router.get('/', async (req, res) => {
  try {
    const {
      tipo,
      endpoint,
      fechaInicio,
      fechaFin,
      limit = 100,
      skip = 0
    } = req.query;

    const query = {};
    
    if (tipo) query.tipo = tipo;
    if (endpoint) query.endpoint = new RegExp(endpoint, 'i');
    if (fechaInicio || fechaFin) {
      query.timestamp = {};
      if (fechaInicio) query.timestamp.$gte = new Date(fechaInicio);
      if (fechaFin) query.timestamp.$lte = new Date(fechaFin);
    }

    const metricas = await Metric.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Metric.countDocuments(query);

    res.json({
      success: true,
      data: metricas,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: total > (parseInt(skip) + parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Error obteniendo métricas', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Error obteniendo métricas'
    });
  }
});

// GET /api/metrics/stats - Estadísticas agregadas
router.get('/stats', async (req, res) => {
  try {
    const { tipo, periodo = 'dia' } = req.query;

    let stats;
    if (tipo) {
      stats = await Metric.agregarPorTipo(tipo, periodo);
    } else {
      stats = await Metric.obtenerEstadisticas();
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error obteniendo estadísticas', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Error obteniendo estadísticas'
    });
  }
});

// GET /api/metrics/performance - Métricas de rendimiento
router.get('/performance', async (req, res) => {
  try {
    const { endpoint, limit = 50 } = req.query;

    const query = { tipo: 'performance' };
    if (endpoint) query.endpoint = new RegExp(endpoint, 'i');

    const metricas = await Metric.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    // Calcular promedios
    const promedios = await Metric.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$endpoint',
          promedioMs: { $avg: '$duracion' },
          minimoMs: { $min: '$duracion' },
          maximoMs: { $max: '$duracion' },
          total: { $sum: 1 }
        }
      },
      { $sort: { promedioMs: -1 } },
      { $limit: 20 }
    ]);

    res.json({
      success: true,
      data: {
        recientes: metricas,
        promedios
      }
    });
  } catch (error) {
    logger.error('Error obteniendo métricas de performance', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Error obteniendo métricas de performance'
    });
  }
});

// GET /api/metrics/errors - Métricas de errores
router.get('/errors', async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const errores = await Metric.find({ tipo: 'error' })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    // Agrupar por endpoint
    const porEndpoint = await Metric.aggregate([
      { $match: { tipo: 'error' } },
      {
        $group: {
          _id: '$endpoint',
          total: { $sum: 1 },
          ultimoError: { $max: '$timestamp' }
        }
      },
      { $sort: { total: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        recientes: errores,
        porEndpoint
      }
    });
  } catch (error) {
    logger.error('Error obteniendo métricas de errores', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Error obteniendo métricas de errores'
    });
  }
});

module.exports = router;
```

### Integrar en `server/index.js`

Agregar después de las otras rutas:

```javascript
// Después de las rutas existentes
app.use('/api/metrics', require('./routes/metrics'));
```

### Crear pruebas: `server/tests/metrics.routes.test.js`

```javascript
const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const Metric = require('../models/Metric');
const metricsRouter = require('../routes/metrics');

const app = express();
app.use(express.json());
app.use('/api/metrics', metricsRouter);

describe('API de Métricas', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/sundeck-test');
  });

  afterAll(async () => {
    await Metric.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Metric.deleteMany({});
    
    // Crear datos de prueba
    await Metric.create([
      {
        tipo: 'performance',
        valor: 150,
        endpoint: '/api/prospectos',
        metodo: 'GET',
        statusCode: 200,
        duracion: 150,
        timestamp: new Date('2025-10-31T10:00:00Z')
      },
      {
        tipo: 'performance',
        valor: 250,
        endpoint: '/api/cotizaciones',
        metodo: 'POST',
        statusCode: 201,
        duracion: 250,
        timestamp: new Date('2025-10-31T11:00:00Z')
      },
      {
        tipo: 'error',
        valor: 1,
        endpoint: '/api/proyectos',
        metodo: 'GET',
        statusCode: 500,
        timestamp: new Date('2025-10-31T12:00:00Z')
      }
    ]);
  });

  test('GET /api/metrics debe listar métricas', async () => {
    const response = await request(app).get('/api/metrics');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBe(3);
    expect(response.body.pagination).toBeDefined();
    expect(response.body.pagination.total).toBe(3);
  });

  test('GET /api/metrics debe filtrar por tipo', async () => {
    const response = await request(app).get('/api/metrics?tipo=performance');

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBe(2);
    expect(response.body.data.every(m => m.tipo === 'performance')).toBe(true);
  });

  test('GET /api/metrics/stats debe retornar estadísticas', async () => {
    const response = await request(app).get('/api/metrics/stats');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  test('GET /api/metrics/performance debe retornar métricas de rendimiento', async () => {
    const response = await request(app).get('/api/metrics/performance');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('recientes');
    expect(response.body.data).toHaveProperty('promedios');
    expect(Array.isArray(response.body.data.recientes)).toBe(true);
  });

  test('GET /api/metrics/errors debe retornar métricas de errores', async () => {
    const response = await request(app).get('/api/metrics/errors');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('recientes');
    expect(response.body.data).toHaveProperty('porEndpoint');
    expect(response.body.data.recientes.length).toBe(1);
  });
});
```

### Instalar dependencia (si no está)

```bash
npm install --save-dev supertest
```

### Ejecutar pruebas

```bash
npm test
# Debe mostrar: 15/15 tests pasando (10 anteriores + 5 nuevos)
```

---

## 📚 Documentos de Referencia

- `docschecklists/GUIA_CONTINUACION_TRABAJO.md` - Contexto completo
- `server/models/Metric.js` - Modelo con métodos de agregación
- `docs/logger_usage.md` - Cómo usar el logger

---

## ✅ Checklist

- [ ] Crear `server/routes/metrics.js`
- [ ] Integrar en `server/index.js`
- [ ] Crear `server/tests/metrics.routes.test.js`
- [ ] Instalar `supertest` (si no está)
- [ ] Ejecutar `npm test` (15/15 pasando)
- [ ] Actualizar `ESTADO_ACTUAL.md` (Fase 0: 85%)

---

**¡Adelante con la Tarea 2.3!** 🚀

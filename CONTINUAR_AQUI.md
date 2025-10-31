# 🚀 CONTINUAR AQUÍ - Sprint 2

**Fecha:** 31 Oct 2025  
**Estado:** Tarea 2.1 ✅ COMPLETADA → Tarea 2.2 🚀 INICIAR

---

## ✅ COMPLETADO (Tarea 2.1)

- Modelo Metric creado
- 3 pruebas pasando
- 7/7 tests totales (logger + metric)
- Fase 0: 67.5%

---

## 🎯 SIGUIENTE TAREA: 2.2 Middleware de Métricas

### Crear archivo: `server/middleware/metricsMiddleware.js`

```javascript
const Metric = require('../models/Metric');
const logger = require('../config/logger');

const metricsMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // Capturar respuesta
  res.on('finish', async () => {
    const duration = Date.now() - startTime;
    
    try {
      // Registrar métrica de performance
      await Metric.registrar('performance', duration, {
        endpoint: req.originalUrl,
        metodo: req.method,
        statusCode: res.statusCode,
        duracion: duration
      });
      
      // Log si es lento (>1000ms)
      if (duration > 1000) {
        logger.warn('Request lento detectado', {
          endpoint: req.originalUrl,
          metodo: req.method,
          duracion: `${duration}ms`
        });
      }
      
      // Registrar error si statusCode >= 400
      if (res.statusCode >= 400) {
        await Metric.registrar('error', 1, {
          endpoint: req.originalUrl,
          metodo: req.method,
          statusCode: res.statusCode
        });
      }
    } catch (error) {
      logger.error('Error registrando métrica', { error: error.message });
    }
  });
  
  next();
};

module.exports = metricsMiddleware;
```

### Integrar en `server/index.js`

Agregar después del requestLogger:

```javascript
const metricsMiddleware = require('./middleware/metricsMiddleware');

// Después de:
app.use(requestLogger);

// Agregar:
app.use(metricsMiddleware);
```

### Crear pruebas: `server/tests/metricsMiddleware.test.js`

```javascript
const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const Metric = require('../models/Metric');
const metricsMiddleware = require('../middleware/metricsMiddleware');

const app = express();
app.use(metricsMiddleware);

app.get('/test-success', (req, res) => {
  res.status(200).json({ ok: true });
});

app.get('/test-slow', (req, res) => {
  setTimeout(() => res.status(200).json({ ok: true }), 1100);
});

app.get('/test-error', (req, res) => {
  res.status(500).json({ error: true });
});

describe('Middleware de Métricas', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/sundeck-test');
  });

  afterAll(async () => {
    await Metric.deleteMany({});
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await Metric.deleteMany({});
  });

  test('Debe capturar métrica de performance', async () => {
    await request(app).get('/test-success');
    
    // Esperar a que se registre
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const metricas = await Metric.find({ tipo: 'performance' });
    expect(metricas.length).toBe(1);
    expect(metricas[0].endpoint).toBe('/test-success');
    expect(metricas[0].metodo).toBe('GET');
    expect(metricas[0].statusCode).toBe(200);
  });

  test('Debe detectar requests lentos', async () => {
    await request(app).get('/test-slow');
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const metricas = await Metric.find({ tipo: 'performance' });
    expect(metricas[0].duracion).toBeGreaterThan(1000);
  });

  test('Debe registrar errores', async () => {
    await request(app).get('/test-error');
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const errores = await Metric.find({ tipo: 'error' });
    expect(errores.length).toBe(1);
    expect(errores[0].statusCode).toBe(500);
  });

  test('Debe continuar el flujo normal', async () => {
    const response = await request(app).get('/test-success');
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
  });
});
```

### Instalar dependencia

```bash
npm install --save-dev supertest
```

### Ejecutar pruebas

```bash
npm test
# Debe mostrar: 11/11 tests pasando (7 anteriores + 4 nuevos)
```

---

## 📚 Documentos de Referencia

- `docschecklists/GUIA_CONTINUACION_TRABAJO.md` - Contexto completo
- `docschecklists/SPRINT_01_FINAL.md` - Sprint 1 completado
- `docs/logger_usage.md` - Cómo usar el logger

---

## ✅ Checklist

- [ ] Crear `server/middleware/metricsMiddleware.js`
- [ ] Integrar en `server/index.js`
- [ ] Crear `server/tests/metricsMiddleware.test.js`
- [ ] Instalar `supertest`
- [ ] Ejecutar `npm test` (11/11 pasando)
- [ ] Actualizar `ESTADO_ACTUAL.md`

---

**¡Adelante con la Tarea 2.2!** 🚀

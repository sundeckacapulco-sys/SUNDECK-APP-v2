# 🤖 PROMPT PARA EL AGENTE

**Fecha:** 31 de Octubre, 2025  
**Contexto:** Sprint 1 completado, iniciar Sprint 2

---

## 📋 INSTRUCCIONES PARA EL AGENTE

Hola. Necesito que continúes el trabajo del proyecto Sundeck CRM. El Sprint 1 ya está completado y necesito que inicies el Sprint 2.

### Paso 1: Revisar el contexto (15 minutos)

Por favor lee estos 3 documentos en este orden:

1. **`INICIO_RAPIDO_SPRINT_2.md`** (2 min)
   - Resumen rápido del estado actual
   - Qué se completó en Sprint 1
   - Qué hay que hacer en Sprint 2

2. **`docschecklists/GUIA_CONTINUACION_TRABAJO.md`** (10 min)
   - Guía completa con todo el contexto
   - Plan detallado del Sprint 2
   - Archivos importantes
   - Comandos útiles

3. **`docschecklists/SPRINT_01_FINAL.md`** (3 min)
   - Resumen completo del Sprint 1
   - Logros y métricas finales
   - Lecciones aprendidas

### Paso 2: Verificar que todo funciona (5 minutos)

Ejecuta estos comandos para verificar el estado del sistema:

```bash
# Verificar que las pruebas pasan
npm test
# Resultado esperado: 4/4 tests pasando

# Verificar que los logs se están generando
ls logs/
# Resultado esperado: Ver archivos combined-*.log y error-*.log

# Ver contenido de los logs
cat logs/combined-2025-10-31.log
# Resultado esperado: Ver logs en formato JSON
```

### Paso 3: Iniciar Sprint 2 - Tarea 2.1

Una vez que hayas leído la documentación y verificado el sistema, inicia con la primera tarea del Sprint 2:

**Tarea 2.1: Crear Modelo Metric**

Crea el archivo `server/models/Metric.js` con el siguiente schema:

```javascript
const mongoose = require('mongoose');

const metricSchema = new mongoose.Schema({
  tipo: {
    type: String,
    required: true,
    enum: ['performance', 'error', 'uso', 'negocio'],
    index: true
  },
  valor: {
    type: Number,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  endpoint: String,
  metodo: String,
  statusCode: Number,
  duracion: Number,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Índices compuestos para consultas rápidas
metricSchema.index({ tipo: 1, timestamp: -1 });
metricSchema.index({ endpoint: 1, timestamp: -1 });

// Método estático para registrar métrica
metricSchema.statics.registrar = async function(tipo, valor, metadata = {}) {
  return await this.create({ tipo, valor, metadata });
};

// Método estático para obtener por período
metricSchema.statics.obtenerPorPeriodo = async function(fechaInicio, fechaFin) {
  return await this.find({
    timestamp: { $gte: fechaInicio, $lte: fechaFin }
  }).sort({ timestamp: -1 });
};

// Método estático para agregar por tipo
metricSchema.statics.agregarPorTipo = async function(tipo, periodo = 'dia') {
  // Implementar agregación según período
  const groupBy = periodo === 'hora' ? {
    year: { $year: '$timestamp' },
    month: { $month: '$timestamp' },
    day: { $dayOfMonth: '$timestamp' },
    hour: { $hour: '$timestamp' }
  } : {
    year: { $year: '$timestamp' },
    month: { $month: '$timestamp' },
    day: { $dayOfMonth: '$timestamp' }
  };

  return await this.aggregate([
    { $match: { tipo } },
    {
      $group: {
        _id: groupBy,
        promedio: { $avg: '$valor' },
        minimo: { $min: '$valor' },
        maximo: { $max: '$valor' },
        total: { $sum: '$valor' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } }
  ]);
};

// Método estático para obtener estadísticas
metricSchema.statics.obtenerEstadisticas = async function() {
  return await this.aggregate([
    {
      $group: {
        _id: '$tipo',
        promedio: { $avg: '$valor' },
        minimo: { $min: '$valor' },
        maximo: { $max: '$valor' },
        total: { $sum: 1 }
      }
    }
  ]);
};

module.exports = mongoose.model('Metric', metricSchema);
```

Luego crea las pruebas en `server/tests/metric.test.js`:

```javascript
const Metric = require('../models/Metric');
const mongoose = require('mongoose');

describe('Modelo Metric', () => {
  beforeAll(async () => {
    // Conectar a base de datos de prueba
    await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/sundeck-test');
  });

  afterAll(async () => {
    await Metric.deleteMany({});
    await mongoose.connection.close();
  });

  test('Debe crear una métrica correctamente', async () => {
    const metric = await Metric.registrar('performance', 150, {
      endpoint: '/api/prospectos',
      metodo: 'GET'
    });

    expect(metric).toBeDefined();
    expect(metric.tipo).toBe('performance');
    expect(metric.valor).toBe(150);
    expect(metric.metadata.endpoint).toBe('/api/prospectos');
  });

  test('Debe obtener métricas por período', async () => {
    const fechaInicio = new Date('2025-10-01');
    const fechaFin = new Date('2025-10-31');
    
    const metricas = await Metric.obtenerPorPeriodo(fechaInicio, fechaFin);
    
    expect(Array.isArray(metricas)).toBe(true);
  });

  test('Debe agregar métricas por tipo', async () => {
    await Metric.registrar('performance', 100);
    await Metric.registrar('performance', 200);
    await Metric.registrar('performance', 150);

    const agregadas = await Metric.agregarPorTipo('performance', 'dia');
    
    expect(Array.isArray(agregadas)).toBe(true);
    expect(agregadas[0]).toHaveProperty('promedio');
    expect(agregadas[0]).toHaveProperty('minimo');
    expect(agregadas[0]).toHaveProperty('maximo');
  });
});
```

### Paso 4: Ejecutar pruebas

```bash
npm test
# Resultado esperado: 7/7 tests pasando (4 del logger + 3 del metric)
```

### Paso 5: Documentar progreso

Actualiza el archivo `docschecklists/ESTADO_ACTUAL.md`:

En la sección de Fase 0, actualiza:
```
KPIs baseline                  [████████████████░░░░]  80% ⚙️ Modelo creado
```

---

## ❓ Si tienes dudas

- **Sobre el logger:** Lee `docs/logger_usage.md`
- **Sobre el plan:** Lee `docschecklists/PLAN_TRABAJO_DETALLADO.md`
- **Sobre Sprint 1:** Lee `docschecklists/SPRINT_01_FINAL.md`
- **Sobre Sprint 2:** Lee `docschecklists/GUIA_CONTINUACION_TRABAJO.md`

---

## ✅ Checklist

Antes de empezar, verifica:
- [ ] Leí los 3 documentos principales
- [ ] Ejecuté `npm test` y veo 4/4 tests pasando
- [ ] Verifiqué que existe la carpeta `logs/`
- [ ] Entiendo qué se hizo en Sprint 1
- [ ] Entiendo qué hay que hacer en Sprint 2

---

## 🎯 Objetivo Final del Sprint 2

**Completar Fase 0 al 100%** implementando métricas baseline reales.

**Tiempo estimado:** 8 días (2 semanas)

**Resultado esperado:** Sistema con métricas automáticas capturando performance, errores, uso y métricas de negocio.

---

**¡Éxito!** 🚀

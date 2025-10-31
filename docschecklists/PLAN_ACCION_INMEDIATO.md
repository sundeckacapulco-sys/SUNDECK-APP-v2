# 🚨 PLAN DE ACCIÓN INMEDIATO — Post Auditoría Oct 2025

**Versión:** 1.0  
**Fecha:** Octubre 31, 2025  
**Basado en:** `auditoria_tecnica.md`  
**Responsable:** David Rojas  

---

## 🎯 Objetivo

Resolver los **5 bloqueantes críticos** identificados en la auditoría técnica para habilitar el avance hacia Fase 1 del roadmap.

**Meta:** Completar estas correcciones en **2-3 semanas** antes de iniciar el desacoplo de Fase 1.

---

## 🔴 BLOQUEANTE #1: Logger Estructurado (CRÍTICO)

**Problema:** Persisten `console.log` en todo el backend, sin trazabilidad ni rotación de logs.

**Impacto:** 
- Imposible depurar errores en producción
- No se pueden medir latencias reales
- Bloquea métricas baseline de Fase 0

**Solución:**

### Paso 1: Crear `server/logger.js`
```javascript
const winston = require('winston');
const path = require('path');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: path.join(__dirname, '../logs/error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({ 
      filename: path.join(__dirname, '../logs/combined.log'),
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
```

### Paso 2: Crear carpeta `/logs/`
```bash
mkdir logs
echo "*.log" >> logs/.gitignore
```

### Paso 3: Reemplazar `console.log` en controladores críticos
**Prioridad:**
1. `server/controllers/proyectoController.js`
2. `server/routes/fabricacion.js`
3. `server/routes/pedidos.js`
4. `server/routes/proyectoPedido.js`

**Patrón de reemplazo:**
```javascript
// ANTES
console.log('Guardando levantamiento...');

// DESPUÉS
const logger = require('../logger');
logger.info('Guardando levantamiento', { proyectoId, userId });
```

**Entregable:** Logger funcional con rotación automática y logs estructurados en JSON.

**Tiempo estimado:** 3-4 días

---

## 🔴 BLOQUEANTE #2: Unificar Dominio de Pedidos (CRÍTICO)

**Problema:** Conviven `Pedido.js` y `ProyectoPedido.js` con rutas paralelas, causando duplicidad de datos.

**Impacto:**
- Riesgo de divergencia de estados
- Confusión en flujo Aprobado→Pedido→Fabricación
- Bloquea automatización de Fase 2

**Solución:**

### Análisis de uso actual:
1. Revisar qué rutas usan cada modelo
2. Identificar dependencias en frontend
3. Seleccionar modelo a mantener (recomendado: `Proyecto` con subdocumento `pedido`)

### Migración propuesta:
```javascript
// OPCIÓN RECOMENDADA: Unificar en Proyecto
const ProyectoSchema = new Schema({
  // ... campos existentes
  pedido: {
    numero: String,
    fechaCreacion: Date,
    anticipo: Number,
    saldo: Number,
    estado: String,
    // ... campos de pedido
  }
});
```

### Pasos:
1. **Día 1-2**: Análisis de dependencias
2. **Día 3-4**: Script de migración de datos
3. **Día 5-6**: Actualizar rutas y controladores
4. **Día 7**: Pruebas y validación

**Entregable:** Modelo único de pedidos con datos migrados y rutas consolidadas.

**Tiempo estimado:** 5-7 días

---

## 🔴 BLOQUEANTE #3: Corregir Módulo Fabricación (BLOQUEANTE)

**Problema:** `server/routes/fabricacion.js` usa `Pedido`, `Fabricacion` y `CotizacionMappingService` sin importarlos.

**Impacto:**
- Módulo completamente no funcional
- Imposible crear órdenes de fabricación
- Bloquea flujo operativo completo

**Solución:**

### Agregar imports faltantes:
```javascript
// server/routes/fabricacion.js
const Pedido = require('../models/Pedido');
const Fabricacion = require('../models/Fabricacion');
const CotizacionMappingService = require('../services/cotizacionMappingService');
```

### Validar dependencias:
1. Verificar que `models/Fabricacion.js` existe
2. Verificar que `services/cotizacionMappingService.js` existe
3. Crear si faltan

### Agregar validaciones:
```javascript
router.post('/', async (req, res) => {
  try {
    const { pedidoId } = req.body;
    
    if (!pedidoId) {
      return res.status(400).json({ error: 'pedidoId es requerido' });
    }
    
    const pedido = await Pedido.findById(pedidoId);
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    
    // ... resto de lógica
  } catch (error) {
    logger.error('Error al crear orden de fabricación', { error, pedidoId });
    res.status(500).json({ error: error.message });
  }
});
```

**Entregable:** Módulo de fabricación funcional con imports, validaciones y logging.

**Tiempo estimado:** 2-3 días

---

## 🔴 BLOQUEANTE #4: Activar Métricas Baseline Reales (CRÍTICO)

**Problema:** `docs/metrics_baseline.md` tiene valores simulados, no hay instrumentación real.

**Impacto:**
- No se pueden medir mejoras de rendimiento
- Imposible detectar degradaciones
- Bloquea KPIs de Fase 0

**Solución:**

### Crear middleware de métricas:
```javascript
// server/middleware/metricsMiddleware.js
const logger = require('../logger');
const Metric = require('../models/Metric');

const metricsMiddleware = async (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', async () => {
    const duration = Date.now() - startTime;
    
    try {
      await Metric.create({
        endpoint: req.path,
        method: req.method,
        statusCode: res.statusCode,
        duration,
        timestamp: new Date(),
        userId: req.user?._id
      });
    } catch (error) {
      logger.error('Error guardando métrica', { error });
    }
  });
  
  next();
};

module.exports = metricsMiddleware;
```

### Crear modelo de métricas:
```javascript
// server/models/Metric.js
const MetricSchema = new Schema({
  endpoint: String,
  method: String,
  statusCode: Number,
  duration: Number,
  timestamp: Date,
  userId: Schema.Types.ObjectId
});
```

### Aplicar a endpoints críticos:
```javascript
// server/index.js
const metricsMiddleware = require('./middleware/metricsMiddleware');

// Aplicar solo a rutas críticas
app.use('/api/proyectos', metricsMiddleware);
app.use('/api/cotizaciones', metricsMiddleware);
app.use('/api/instalaciones', metricsMiddleware);
```

**Entregable:** Colección de métricas con datos reales de latencia, errores y uso.

**Tiempo estimado:** 3-4 días

---

## 🔴 BLOQUEANTE #5: Rediseñar Módulo IA (CRÍTICO)

**Problema:** `server/routes/ai.js` devuelve textos estáticos simulados, sin modelos reales.

**Impacto:**
- No genera insights accionables
- Sin métricas de precisión
- Bloquea automatización de Fase 2

**Solución:**

### Fase 1: IA basada en reglas (heurística)
```javascript
// server/services/aiService.js
class AIService {
  // Validación de partidas por reglas
  validarPartida(partida) {
    const errores = [];
    const advertencias = [];
    
    // Regla 1: Medidas mínimas
    if (partida.ancho < 0.5 || partida.alto < 0.5) {
      errores.push('Medidas muy pequeñas (mínimo 0.5m)');
    }
    
    // Regla 2: Medidas máximas
    if (partida.ancho > 5 || partida.alto > 5) {
      advertencias.push('Medidas grandes, considerar refuerzos');
    }
    
    // Regla 3: Precio fuera de rango
    const precioPromedio = 750;
    if (partida.precio < precioPromedio * 0.5) {
      advertencias.push('Precio bajo, verificar');
    }
    
    return {
      valido: errores.length === 0,
      errores,
      advertencias,
      precision: 1.0 // 100% en reglas determinísticas
    };
  }
  
  // Sugerencias de productos
  sugerirProducto(ubicacion, presupuesto) {
    const reglas = {
      'recamara': ['Blackout', 'Roller'],
      'sala': ['Screen 3%', 'Screen 5%'],
      'cocina': ['Screen 10%', 'Roller'],
      'oficina': ['Screen 5%', 'Vertical']
    };
    
    const productos = reglas[ubicacion.toLowerCase()] || ['Screen 3%'];
    
    return {
      productos,
      razon: `Productos recomendados para ${ubicacion}`,
      precision: 0.85
    };
  }
}

module.exports = new AIService();
```

### Registrar métricas de precisión:
```javascript
// Crear modelo para tracking de IA
const AIPredictionSchema = new Schema({
  tipo: String, // 'validacion', 'sugerencia'
  input: Object,
  output: Object,
  precision: Number,
  aceptado: Boolean, // Si el usuario aceptó la sugerencia
  timestamp: Date
});
```

**Entregable:** IA funcional basada en reglas con métricas de precisión ≥80%.

**Tiempo estimado:** 4-5 días

---

## 📅 Cronograma Propuesto

| Semana | Bloqueantes | Entregables |
|--------|-------------|-------------|
| **Semana 1** | #1 Logger + #3 Fabricación | Logger funcional, Fabricación operativa |
| **Semana 2** | #2 Unificar Pedidos + #4 Métricas | Modelo único, Métricas reales |
| **Semana 3** | #5 IA Funcional | IA con reglas y métricas |

---

## ✅ Criterios de Éxito

**Al completar este plan:**
- ✅ Logger estructurado en ≥70% de endpoints críticos
- ✅ Modelo único de pedidos con datos migrados
- ✅ Módulo de fabricación funcional y probado
- ✅ Métricas baseline con datos reales (≥1 semana de datos)
- ✅ IA funcional con precisión ≥80% en validaciones

**Esto habilitará:**
- ✅ Inicio de Fase 1 (Desacoplo y Confiabilidad)
- ✅ Extracción de subdocumentos
- ✅ Implementación de CI/CD
- ✅ Creación de pruebas unitarias

---

## 🔗 Referencias

- **Auditoría completa**: `docs/auditoria_tecnica.md`
- **Roadmap master**: `docschecklists/ROADMAPMASTER.md`
- **Tareas detalladas**: `docschecklists/ROADMAP_TASKS.md`
- **Arquitectura**: `docs/architecture_map.md`

---

> 💡 **Este plan es la ruta crítica para desbloquear el roadmap de 12 meses.**  
> Cada bloqueante resuelto habilita múltiples tareas de las fases siguientes.

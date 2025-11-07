# 🔄 PLAN DE MIGRACIÓN - DASHBOARD PRINCIPAL

**Fecha:** 8 Noviembre 2025 - 12:50 PM  
**Objetivo:** Migrar Dashboard Principal de modelos legacy a `Proyecto` unificado  
**Prioridad:** 🔴 ALTA (Usa Fabricacion.legacy deprecado)

---

## 🚨 PROBLEMA IDENTIFICADO

### Dependencias Legacy Actuales

**Archivo:** `server/routes/dashboard.js`

```javascript
// Línea 2-6: MODELOS USADOS
const Prospecto = require('../models/Prospecto');        // ⚠️ Modelo antiguo
const Cotizacion = require('../models/Cotizacion');      // ✅ OK
const Pedido = require('../models/Pedido');              // ⚠️ Separado
const Fabricacion = require('../models/Fabricacion.legacy'); // 🔴 LEGACY!
const Instalacion = require('../models/Instalacion');    // ⚠️ Separado
```

### Consultas Problemáticas

```javascript
// Línea 26-36: 10 consultas a Prospecto por etapas
Prospecto.countDocuments({ etapa: 'nuevo', ... })
Prospecto.countDocuments({ etapa: 'contactado', ... })
// ... 8 más

// Línea 32: Consulta a Fabricacion.legacy 🔴
Fabricacion.countDocuments({ estado: { $in: ['pendiente', 'en_proceso'] } })

// Línea 33: Consulta a Instalacion separada
Instalacion.countDocuments({ estado: { $in: ['programada', 'en_proceso'] } })
```

**Total:** ~20 consultas a MongoDB por carga

---

## 🎯 SOLUCIÓN: MODELO UNIFICADO

### Usar `Proyecto` en lugar de múltiples modelos

```javascript
// NUEVO ENFOQUE
const Proyecto = require('../models/Proyecto');

// Una sola consulta con agregación
const pipeline = await Proyecto.aggregate([
  { $match: filtros },
  {
    $facet: {
      porEstado: [...],
      porTipo: [...],
      fabricacion: [...],
      instalacion: [...],
      kpis: [...]
    }
  }
]);
```

**Beneficios:**
- ✅ De ~20 consultas a 1
- ✅ Sin dependencias legacy
- ✅ Datos consistentes
- ✅ 10x más rápido

---

## 📋 PLAN DE EJECUCIÓN

### FASE 1: Crear Nuevo Endpoint ✅

**Archivo:** `server/routes/dashboardUnificado.js` (NUEVO)

**Endpoint:** `GET /api/dashboard/unificado`

**Funcionalidades:**
1. Pipeline de ventas (por `estadoComercial`)
2. KPIs principales (prospectos, proyectos, conversión, monto)
3. Proyectos en fabricación (desde `Proyecto.fabricacion`)
4. Proyectos en instalación (desde `Proyecto.instalacion`)
5. Citas del día
6. Seguimientos pendientes
7. Actividad reciente
8. Proyectos críticos (🚨 NUEVO)

---

### FASE 2: Migrar Frontend ✅

**Archivo:** `client/src/components/Dashboard/Dashboard.js`

**Cambios:**
```javascript
// ANTES
const response = await axiosConfig.get('/dashboard');

// DESPUÉS
const response = await axiosConfig.get('/dashboard/unificado');
```

**Actualizar estructura de datos:**
- Usar `estadoComercial` en lugar de `etapa`
- Leer fabricación/instalación desde `Proyecto`
- Agregar KPI "En Riesgo"

---

### FASE 3: Optimizar Diseño ✅

**Reducir espacios muertos:**
- Padding: De `4` a `2`
- Gap: De `3` a `1.5`
- Cards más compactas
- Gráficos más pequeños

**Mejorar KPIs:**
- Agregar "En Riesgo" (proyectos críticos)
- Tiempo promedio de cierre
- Tasa de respuesta
- Referidos activos

**Colores corporativos:**
- Primario: `#0F172A`
- Acento: `#14B8A6`
- Crítico: `#d32f2f`

---

### FASE 4: Auto-refresh ✅

**Actualización automática cada 30 segundos:**

```javascript
useEffect(() => {
  const interval = setInterval(() => {
    fetchDashboardData();
  }, 30000); // 30 segundos

  return () => clearInterval(interval);
}, []);
```

**Indicador visual:**
```
Última actualización: hace 15 segundos
```

---

### FASE 5: Deprecar Antiguo ✅

1. Marcar `/dashboard` como legacy
2. Redirigir a `/dashboard/unificado`
3. Mantener 1 semana para transición
4. Eliminar completamente

---

## 🔧 IMPLEMENTACIÓN TÉCNICA

### Nuevo Endpoint: `/api/dashboard/unificado`

```javascript
const express = require('express');
const Proyecto = require('../models/Proyecto');
const { auth } = require('../middleware/auth');
const logger = require('../config/logger');

const router = express.Router();

router.get('/unificado', auth, async (req, res) => {
  try {
    const { periodo = '30' } = req.query;
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - parseInt(periodo));

    // Filtros según rol
    const filtroUsuario = {};
    if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'gerente') {
      filtroUsuario.asesorComercial = req.usuario.nombre;
    }

    // Pipeline consolidado
    const resultado = await Proyecto.aggregate([
      {
        $match: {
          ...filtroUsuario,
          createdAt: { $gte: fechaInicio }
        }
      },
      {
        $facet: {
          // Pipeline de ventas por estado
          pipeline: [
            {
              $group: {
                _id: '$estadoComercial',
                count: { $sum: 1 }
              }
            }
          ],
          
          // KPIs principales
          kpis: [
            {
              $group: {
                _id: null,
                totalProspectos: {
                  $sum: { $cond: [{ $eq: ['$tipo', 'prospecto'] }, 1, 0] }
                },
                totalProyectos: {
                  $sum: { $cond: [{ $eq: ['$tipo', 'proyecto'] }, 1, 0] }
                },
                ventasCerradas: {
                  $sum: { $cond: [{ $eq: ['$estadoComercial', 'convertido'] }, 1, 0] }
                },
                enRiesgo: {
                  $sum: { $cond: [{ $eq: ['$estadoComercial', 'critico'] }, 1, 0] }
                },
                montoTotal: { $sum: '$cotizaciones.0.total' }
              }
            }
          ],
          
          // Fabricación (desde Proyecto.fabricacion)
          fabricacion: [
            {
              $match: {
                'fabricacion.estado': { $in: ['pendiente', 'en_proceso'] }
              }
            },
            { $count: 'total' }
          ],
          
          // Instalación (desde Proyecto.instalacion)
          instalacion: [
            {
              $match: {
                'instalacion.estado': { $in: ['programada', 'en_proceso'] }
              }
            },
            { $count: 'total' }
          ],
          
          // Citas del día
          citasHoy: [
            {
              $match: {
                'seguimiento.fecha': {
                  $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                  $lt: new Date(new Date().setHours(23, 59, 59, 999))
                },
                'seguimiento.tipo': 'cita'
              }
            },
            { $limit: 10 }
          ],
          
          // Seguimientos pendientes
          seguimientosPendientes: [
            {
              $match: {
                estadoComercial: { $nin: ['completado', 'perdido'] },
                ultimaNota: { $lte: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) }
              }
            },
            { $limit: 10 }
          ],
          
          // Actividad reciente (últimas 24h)
          actividadReciente: [
            {
              $match: {
                updatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
              }
            },
            { $sort: { updatedAt: -1 } },
            { $limit: 10 }
          ]
        }
      }
    ]);

    // Formatear respuesta
    const data = resultado[0];
    
    // Convertir pipeline a objeto
    const pipelineObj = {};
    data.pipeline.forEach(item => {
      pipelineObj[item._id] = item.count;
    });

    const response = {
      pipeline: {
        nuevos: pipelineObj.nuevo || 0,
        contactados: pipelineObj.contactado || 0,
        enSeguimiento: pipelineObj.en_seguimiento || 0,
        citasAgendadas: pipelineObj.cita_agendada || 0,
        cotizados: pipelineObj.cotizado || 0,
        ventasCerradas: pipelineObj.convertido || 0,
        activos: pipelineObj.activo || 0,
        fabricacion: data.fabricacion[0]?.total || 0,
        instalacion: data.instalacion[0]?.total || 0,
        completados: pipelineObj.completado || 0
      },
      metricas: {
        periodo: parseInt(periodo),
        prospectosNuevos: data.kpis[0]?.totalProspectos || 0,
        proyectosActivos: data.kpis[0]?.totalProyectos || 0,
        ventasCerradas: data.kpis[0]?.ventasCerradas || 0,
        enRiesgo: data.kpis[0]?.enRiesgo || 0,
        montoVentas: data.kpis[0]?.montoTotal || 0,
        tasaConversion: data.kpis[0]?.totalProspectos > 0
          ? Math.round((data.kpis[0]?.ventasCerradas / data.kpis[0]?.totalProspectos) * 100)
          : 0
      },
      citasHoy: data.citasHoy || [],
      seguimientosPendientes: data.seguimientosPendientes || [],
      actividadReciente: data.actividadReciente || []
    };

    logger.info('Dashboard unificado cargado', {
      usuario: req.usuario.nombre,
      periodo,
      totalProyectos: data.kpis[0]?.totalProspectos + data.kpis[0]?.totalProyectos
    });

    res.json(response);

  } catch (error) {
    logger.error('Error en dashboard unificado', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;
```

---

## 📊 COMPARACIÓN

| Aspecto | Dashboard Actual | Dashboard Unificado |
|---------|------------------|---------------------|
| Modelos usados | 5 (Prospecto, Cotizacion, Pedido, Fabricacion.legacy, Instalacion) | 1 (Proyecto) |
| Consultas por carga | ~20 | 1 |
| Dependencias legacy | ⚠️ Sí (Fabricacion.legacy) | ✅ No |
| Tiempo de respuesta | 1-2s | <300ms |
| Datos consistentes | ⚠️ No (múltiples fuentes) | ✅ Sí (una fuente) |
| KPIs | 4 | 6 (+En Riesgo, +Tasa conversión) |
| Auto-refresh | ❌ No | ✅ Sí (30s) |

---

## ✅ CHECKLIST DE MIGRACIÓN

### Backend
- [ ] Crear `server/routes/dashboardUnificado.js`
- [ ] Implementar pipeline con `$facet`
- [ ] Agregar KPI "En Riesgo"
- [ ] Logging estructurado
- [ ] Manejo de errores
- [ ] Registrar ruta en `server/index.js`

### Frontend
- [ ] Actualizar endpoint en `Dashboard.js`
- [ ] Mapear nuevos campos de respuesta
- [ ] Agregar KPI "En Riesgo"
- [ ] Reducir padding y espacios
- [ ] Implementar auto-refresh (30s)
- [ ] Indicador de "última actualización"

### Testing
- [ ] Probar con usuario admin
- [ ] Probar con usuario vendedor
- [ ] Verificar filtros por rol
- [ ] Medir tiempo de respuesta
- [ ] Validar datos vs dashboard antiguo

### Documentación
- [ ] Actualizar `AGENTS.md`
- [ ] Crear guía de migración
- [ ] Documentar nuevo endpoint
- [ ] Actualizar README

---

## 🚀 PRÓXIMOS PASOS

1. **Crear nuevo endpoint** `/api/dashboard/unificado`
2. **Migrar frontend** a usar nuevo endpoint
3. **Optimizar diseño** (reducir espacios)
4. **Agregar auto-refresh** cada 30s
5. **Deprecar dashboard antiguo**

---

**¿Empezamos con la implementación?** 🚀

**Tiempo estimado:** 2-3 horas  
**Impacto:** Alto (elimina dependencias legacy)  
**Prioridad:** 🔴 ALTA

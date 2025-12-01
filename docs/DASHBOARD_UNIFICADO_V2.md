# Dashboard Unificado v2.0

**Fecha:** 1 Diciembre 2025  
**Estado:** ✅ Implementado y funcionando

---

## ⚠️ Contexto: Fallo Post-Purga

### ¿Qué pasó?

Después de una purga/reorganización de archivos en el proyecto, el servidor dejó de arrancar con los siguientes errores:

```
Error: Cannot find module '../scripts/fixCotizaciones'
Require stack:
- server/routes/fix.js
- server/index.js

Error: Cannot find module '../models/Cotizacion'
Require stack:
- server/scripts/migraciones/fixCotizaciones.js
```

### Causa Raíz

Durante la reorganización de archivos:
1. El archivo `fixCotizaciones.js` fue movido de `server/scripts/` a `server/scripts/migraciones/`
2. Las rutas relativas dentro del archivo no fueron actualizadas
3. La ruta en `fix.js` tampoco fue actualizada

### Síntomas

- **Error 500** al intentar login: `ECONNREFUSED` al puerto 5001
- **Network Error** en el frontend
- El backend no arrancaba (proceso de Node terminaba inmediatamente)

### Lección Aprendida

Al mover archivos entre carpetas, siempre verificar:
1. ✅ Rutas de importación en el archivo movido
2. ✅ Rutas de importación en archivos que lo referencian
3. ✅ Probar que el servidor arranca después del cambio

---

## 📋 Resumen

El Dashboard Unificado centraliza todas las métricas del sistema CRM en un solo endpoint optimizado, reemplazando la versión anterior que causaba crashes por queries de agregación complejas.

---

## 🔧 Cambios Realizados (1 Dic 2025)

### 1. Corrección de Errores de Arranque

**Problema:** El servidor no arrancaba debido a rutas de importación incorrectas.

**Archivos corregidos:**

| Archivo | Error | Solución |
|---------|-------|----------|
| `server/routes/fix.js` | `Cannot find module '../scripts/fixCotizaciones'` | Cambiar a `../scripts/migraciones/fixCotizaciones` |
| `server/scripts/migraciones/fixCotizaciones.js` | `Cannot find module '../models/Cotizacion'` | Cambiar a `../../models/Cotizacion` |
| `server/scripts/migraciones/fixCotizaciones.js` | `Cannot find module '../config/logger'` | Cambiar a `../../config/logger` |

### 2. Dashboard Unificado Reescrito

**Archivo:** `server/routes/dashboardUnificado.js`

**Versión anterior (problemática):**
- Usaba un pipeline de agregación masivo
- Una falla tumbaba todo el endpoint
- Sin valores por defecto
- Causaba crashes del servidor

**Versión nueva (v2.0):**
- Queries paralelas con `Promise.allSettled()`
- Manejo de errores por sección
- Valores por defecto robustos
- Logging estructurado con tiempos

### 3. Frontend Protegido

**Archivo:** `client/src/components/Dashboard/Dashboard.js`

Agregados valores por defecto para evitar errores `toLocaleString()` en datos undefined:

```javascript
const pipeline = dashboardData.pipeline || {
  nuevos: 0, contactados: 0, citasAgendadas: 0, cotizados: 0,
  ventasCerradas: 0, pedidos: 0, fabricacion: 0, instalacion: 0, entregados: 0
};
const metricas = dashboardData.metricas || {
  montoVentas: 0, tasaConversion: 0, prospectosNuevos: 0,
  cotizacionesPendientes: 0, pedidosEnProceso: 0
};
```

---

## 📊 Estructura de Datos del Endpoint

### Endpoint
```
GET /api/dashboard/unificado?periodo=30
```

### Respuesta
```javascript
{
  // Contadores por etapa del pipeline de ventas
  pipeline: {
    nuevos: Number,
    contactados: Number,
    citasAgendadas: Number,
    cotizados: Number,
    ventasCerradas: Number,
    pedidos: Number,
    fabricacion: Number,
    instalacion: Number,
    entregados: Number
  },
  
  // KPIs principales
  metricas: {
    periodo: Number,           // Días del período (default: 30)
    prospectosNuevos: Number,  // Nuevos en el período
    cotizacionesEnviadas: Number,
    ventasCerradas: Number,
    montoVentas: Number,       // Suma de pedidos en $
    tasaConversion: Number,    // Porcentaje
    enRiesgo: Number           // Sin contacto en 7+ días
  },
  
  // Prospectos que necesitan seguimiento
  seguimientosPendientes: [{
    _id: ObjectId,
    nombre: String,
    telefono: String,
    etapa: String,
    fechaProximoSeguimiento: Date,
    vendedorAsignado: { nombre, apellido }
  }],
  
  // Actividad de últimas 24 horas
  actividadReciente: [{
    _id: ObjectId,
    nombre: String,
    telefono: String,
    etapa: String,
    updatedAt: Date,
    vendedorAsignado: { nombre, apellido }
  }],
  
  // Citas programadas para hoy
  citasHoy: [{
    _id: ObjectId,
    nombre: String,
    fechaCita: Date,
    horaCita: String,
    estadoCita: String,
    vendedorAsignado: { nombre, apellido }
  }],
  
  // Placeholder para supervisión en tiempo real
  supervisionEnVivo: [],
  
  // Resumen de ventas por mes (solo admin/gerente)
  cierresMensuales: [{
    mes: String,           // "2025-12"
    totalPedidos: Number,
    montoTotal: Number,
    promedioTicket: Number
  }]
}
```

---

## 🏗️ Arquitectura

### Flujo de Datos

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Dashboard.js)                   │
│  - Llama a /api/dashboard/unificado                         │
│  - Aplica valores por defecto si faltan datos               │
│  - Renderiza gráficos y métricas                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend (dashboardUnificado.js)                 │
│                                                              │
│  Promise.allSettled([                                        │
│    obtenerPipeline(),        // Contadores por etapa        │
│    obtenerMetricas(),        // KPIs principales            │
│    obtenerSeguimientos(),    // Pendientes de seguimiento   │
│    obtenerActividad(),       // Últimas 24 horas            │
│    obtenerCitas(),           // Citas del día               │
│    obtenerCierres()          // Resumen mensual             │
│  ])                                                          │
│                                                              │
│  Si una query falla → usa valor por defecto                 │
│  Si todas fallan → devuelve estructura vacía válida         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      MongoDB                                 │
│                                                              │
│  Colecciones consultadas:                                    │
│  - prospectos    (pipeline, métricas, seguimientos, citas)  │
│  - cotizaciones  (métricas)                                  │
│  - pedidos       (pipeline, métricas, cierres)              │
│  - instalaciones (pipeline)                                  │
└─────────────────────────────────────────────────────────────┘
```

### Funciones Auxiliares

| Función | Descripción | Modelos |
|---------|-------------|---------|
| `obtenerPipeline()` | Cuenta prospectos por etapa | Prospecto, Pedido, Instalacion |
| `obtenerMetricas()` | Calcula KPIs del período | Prospecto, Cotizacion, Pedido |
| `obtenerSeguimientosPendientes()` | Top 10 pendientes | Prospecto |
| `obtenerActividadReciente()` | Últimas 24 horas | Prospecto |
| `obtenerCitasHoy()` | Citas del día | Prospecto |
| `obtenerCierresMensuales()` | Resumen 6 meses | Pedido |

---

## 🔒 Seguridad y Permisos

### Filtros por Rol

| Rol | Acceso |
|-----|--------|
| `admin` / `gerente` | Ve todos los datos + cierres mensuales |
| `vendedor` | Solo ve sus prospectos asignados |

### Implementación
```javascript
const esAdmin = req.usuario.rol === 'admin' || req.usuario.rol === 'gerente';

if (!esAdmin) {
  filtroUsuario.vendedorAsignado = req.usuario._id;
}
```

---

## 📈 Optimizaciones

### 1. Queries Paralelas
```javascript
// ANTES: Secuencial (lento)
const pipeline = await obtenerPipeline();
const metricas = await obtenerMetricas();
// ... cada query espera a la anterior

// AHORA: Paralelo (rápido)
const [pipeline, metricas, ...] = await Promise.allSettled([
  obtenerPipeline(),
  obtenerMetricas(),
  // ... todas corren simultáneamente
]);
```

### 2. Manejo de Errores Resiliente
```javascript
// Si una sección falla, las demás siguen funcionando
const response = {
  pipeline: pipelineData.status === 'fulfilled' 
    ? pipelineData.value 
    : defaultPipeline(),  // ← Valor por defecto
  // ...
};
```

### 3. Logging con Tiempos
```javascript
const startTime = Date.now();
// ... queries ...
const duration = Date.now() - startTime;
logger.info('Dashboard completado', { duration: `${duration}ms` });
```

---

## 🧪 Pruebas

### Verificar que el endpoint funciona
```bash
curl -X GET http://localhost:5001/api/dashboard/unificado \
  -H "Authorization: Bearer <TOKEN>"
```

### Verificar logs del servidor
```bash
# Buscar en logs
grep "Dashboard unificado" logs/combined.log
```

---

## 📁 Archivos Relacionados

```
server/
├── routes/
│   ├── dashboardUnificado.js  ← PRINCIPAL (reescrito)
│   ├── dashboard.js           ← LEGACY (puede eliminarse)
│   └── dashboardPedidos.js    ← Métricas específicas de pedidos
│
client/src/components/Dashboard/
├── Dashboard.js               ← Frontend (valores por defecto agregados)
└── SupervisionEnVivo.js       ← Componente de supervisión
```

---

## 🚀 Próximos Pasos Sugeridos

1. **Eliminar `dashboard.js` legacy** - Ya no se usa
2. **Implementar `supervisionEnVivo`** - Actualmente devuelve array vacío
3. **Agregar caché** - Redis para métricas que no cambian frecuentemente
4. **Índices MongoDB** - Optimizar queries de conteo por etapa

---

## 📝 Historial de Cambios

| Fecha | Versión | Cambios |
|-------|---------|---------|
| 1 Dic 2025 | v2.0 | Reescritura completa con queries paralelas y manejo de errores |
| Anterior | v1.0 | Pipeline de agregación único (causaba crashes) |

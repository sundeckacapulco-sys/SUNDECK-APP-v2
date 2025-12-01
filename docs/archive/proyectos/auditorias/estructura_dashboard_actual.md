# 📊 ESTRUCTURA ACTUAL DEL DASHBOARD – SUNDECK CRM

**Fecha de auditoría:** 8 Noviembre 2025  
**Versión del sistema:** 2.x (Pre-v3.0)  
**Auditor:** Agente Técnico  
**Objetivo:** Documentar estructura antes de migración a Dashboard Unificado v3.0

---

## 🎯 RESUMEN EJECUTIVO

El dashboard actual (`/dashboard`) es un **sistema unificado** que consolida datos de múltiples fuentes:
- **Prospectos** (modelo principal)
- **Cotizaciones**
- **Pedidos**
- **Fabricación** (legacy)
- **Instalación**

**Estado:** ✅ Funcional pero con dependencias legacy  
**Complejidad:** Media-Alta (múltiples consultas agregadas)  
**Performance:** Aceptable (< 2s con datos moderados)

---

## 1. 📁 FRONTEND

### Ubicación Principal
```
/client/src/components/Dashboard/Dashboard.js
```

### Código Principal - useEffect

```javascript
const fetchDashboardData = async () => {
  try {
    setLoading(true);
    const response = await axiosConfig.get('/dashboard');
    setDashboardData(response.data);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  fetchDashboardData();
}, []);
```

**Endpoint llamado:** `GET /api/dashboard`

### Estructura de Datos Recibida

```javascript
const { 
  pipeline,                    // Contadores por etapa
  metricas,                    // KPIs del período
  seguimientosPendientes,      // Prospectos a seguir
  actividadReciente,           // Últimas 24 horas
  citasHoy                     // Citas programadas hoy
} = dashboardData;
```

### Pipeline de Ventas (Embudo)

```javascript
const embudoData = [
  { name: 'Nuevos', value: pipeline.nuevos },
  { name: 'Contactados', value: pipeline.contactados },
  { name: 'Citas', value: pipeline.citasAgendadas },
  { name: 'Cotizaciones', value: pipeline.cotizaciones },
  { name: 'Ventas Cerradas', value: pipeline.ventasCerradas },
  { name: 'Pedidos', value: pipeline.pedidos },
  { name: 'Fabricación', value: pipeline.fabricacion },
  { name: 'Instalación', value: pipeline.instalacion },
  { name: 'Entregados', value: pipeline.entregados }
];
```

---

## 2. 🔌 ENDPOINTS UTILIZADOS

### Endpoint Principal

```
GET /api/dashboard
```

**Parámetros query:**
- `periodo` (opcional): Número de días para métricas (default: 30)

**Respuesta:**
```json
{
  "pipeline": {
    "nuevos": 15,
    "contactados": 12,
    "citasAgendadas": 8,
    "cotizaciones": 6,
    "ventasCerradas": 4,
    "pedidos": 3,
    "fabricacion": 2,
    "instalacion": 1,
    "entregados": 5
  },
  "metricas": {
    "periodo": 30,
    "prospectosNuevos": 15,
    "cotizacionesEnviadas": 8,
    "ventasCerradas": 4,
    "montoVentas": 125000,
    "tasaConversion": 26
  },
  "seguimientosPendientes": [...],
  "actividadReciente": [...],
  "citasHoy": [...]
}
```

### Endpoints Secundarios

- `GET /api/dashboard/vendedores` - Métricas por vendedor (admin/gerente)
- `GET /api/dashboard/embudo` - Datos del embudo de conversión
- `GET /api/kpis/dashboard` - KPIs generales del sistema

---

## 3. 🎛️ CONTROLADORES BACKEND

### Archivo Principal

**Ruta:** `/server/routes/dashboard.js`

**Nota:** No existe un controlador separado, la lógica está en el router.

### Modelos Consultados

1. `Prospecto` - Modelo principal
2. `Cotizacion` - Cotizaciones generadas
3. `Pedido` - Pedidos creados
4. `Fabricacion.legacy` ⚠️ - Modelo legacy
5. `Instalacion` - Instalaciones programadas

### Flujo de Consultas

```javascript
// 1. Filtros según rol del usuario
const filtroUsuario = {};
if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'gerente') {
  filtroUsuario.vendedorAsignado = req.usuario._id;
}

// 2. Contadores por etapa del pipeline (10 consultas paralelas)
const contadoresPipeline = await Promise.all([
  Prospecto.countDocuments({ ...filtroUsuario, etapa: 'nuevo', activo: true }),
  Prospecto.countDocuments({ ...filtroUsuario, etapa: 'contactado', activo: true }),
  Prospecto.countDocuments({ ...filtroUsuario, etapa: 'cita_agendada', activo: true }),
  // ... 7 consultas más
]);

// 3. Métricas adicionales (4 consultas paralelas)
const metricas = await Promise.all([
  Cotizacion.countDocuments({ ... }),
  Cotizacion.countDocuments({ estado: 'aprobada', ... }),
  Pedido.countDocuments({ ... }),
  Pedido.aggregate([...]) // Suma de montos
]);

// 4. Seguimientos, actividad y citas (3 consultas)
const seguimientosPendientes = await Prospecto.find({ ... }).limit(10);
const actividadReciente = await Prospecto.find({ ... }).limit(10);
const citasHoy = await Prospecto.find({ ... });
```

**Total de consultas:** ~20 consultas a MongoDB por carga

---

## 4. 📊 CÁLCULOS DE KPIs

### KPI 1: Prospectos Nuevos

```javascript
const prospectosNuevos = await Prospecto.countDocuments({
  ...filtroUsuario,
  createdAt: { $gte: fechaInicio },
  activo: true
});
```

**Fuente:** Modelo `Prospecto`  
**Filtro:** Creados en el período

---

### KPI 2: Cotizaciones Enviadas

```javascript
const cotizacionesEnviadas = await Cotizacion.countDocuments({
  elaboradaPor: req.usuario._id,
  createdAt: { $gte: fechaInicio }
});
```

**Fuente:** Modelo `Cotizacion`  
**Filtro:** Creadas en el período

---

### KPI 3: Ventas Cerradas

```javascript
const ventasCerradas = await Promise.all([
  Prospecto.countDocuments({ etapa: 'venta_cerrada', ... }),
  Prospecto.countDocuments({ etapa: 'pedido', ... })
]).then(([ventasCerradas, pedidosEtapa]) => ventasCerradas + pedidosEtapa);
```

**Fuente:** Modelo `Prospecto`  
**Filtro:** Etapas `venta_cerrada` + `pedido`  
**Nota:** Incluye front-end y backstage

---

### KPI 4: Monto Total de Ventas

```javascript
// Monto de cotizaciones + Monto de pedidos
const montoVentasTotal = 
  (montoVentasProspectos[0]?.total || 0) + 
  (montoVentasPedidos[0]?.total || 0);
```

**Fuente:** `Prospecto` (con lookup a `Cotizacion`) + `Pedido`  
**Cálculo:** Suma de ambas fuentes

---

### KPI 5: Tasa de Conversión

```javascript
const tasaConversion = totalProspectos > 0 ? 
  Math.round((ventasCerradas / totalProspectos) * 100) : 0;
```

**Fórmula:** `(Ventas Cerradas / Total Prospectos) * 100`

---

## 5. ⚠️ LIMITACIONES Y PROBLEMAS DETECTADOS

### 🔴 CRÍTICO

#### 1. Dependencia de Modelo Legacy

```javascript
const Fabricacion = require('../models/Fabricacion.legacy');
```

**Impacto:**
- ⚠️ Modelo deprecado en uso
- ⚠️ Advertencia en logs
- ⚠️ Datos no sincronizados con `Proyecto.fabricacion`

**Solución:** Migrar a `Proyecto.fabricacion`

---

#### 2. Múltiples Fuentes de Verdad

**Problema:**
- Ventas: `Prospecto.etapa`
- Pedidos: Modelo `Pedido` separado
- Fabricación: Modelo `Fabricacion.legacy`
- Instalación: Modelo `Instalacion`

**Impacto:**
- ⚠️ Datos duplicados o inconsistentes
- ⚠️ Consultas complejas

**Solución:** Usar modelo `Proyecto` unificado (v3.0)

---

### 🟡 MEDIO

#### 3. Performance - Múltiples Consultas

**Problema:** ~20 consultas a MongoDB por carga

**Impacto:**
- ⚠️ Tiempo de carga: 1-2 segundos
- ⚠️ No escalable

**Solución:** Implementar caché, consolidar consultas

---

#### 4. Filtros por Rol Inconsistentes

**Problema:** Lógica de permisos en múltiples lugares

**Solución:** Centralizar en middleware

---

### 🟢 BAJO

#### 5. Período Hardcoded

```javascript
const { periodo = '30' } = req.query;
```

**Solución:** Agregar selector de período en UI

---

## 6. 📊 COMPARACIÓN CON DASHBOARD v3.0

| Característica | v2.x (Actual) | v3.0 (Nuevo) |
|----------------|---------------|--------------|
| Modelo principal | `Prospecto` | `Proyecto` |
| Consultas por carga | ~20 | ~5-8 |
| Filtros | Por rol | 6 tipos |
| KPIs | 7 métricas | 6 (+1 pendiente) |
| Gráficos | 2 (Bar + Pie) | 0 (pendiente) |
| Dependencias legacy | ⚠️ Sí | ✅ No |
| Performance | 1-2s | <1s |

---

## 7. 🔄 PLAN DE MIGRACIÓN

### Fase 1: Coexistencia ✅ (ACTUAL)

- ✅ Dashboard v2.x en `/dashboard`
- ✅ Dashboard v3.0 en `/proyectos`
- ✅ Ambos funcionales

### Fase 2: Transición ⏳ (PRÓXIMA)

1. ⏳ Completar KPI "En Riesgo" en v3.0
2. ⏳ Agregar gráficos a v3.0
3. ⏳ Migrar funcionalidades faltantes

### Fase 3: Deprecación ⏳ (FUTURA)

1. ⏳ Marcar `/dashboard` como legacy
2. ⏳ Redirigir a `/proyectos` por defecto

### Fase 4: Eliminación ⏳ (FINAL)

1. ⏳ Eliminar `/dashboard` antiguo
2. ⏳ Limpiar código legacy

---

## 8. 📝 RECOMENDACIONES

### Inmediatas

1. ⭐ Completar KPI "En Riesgo" (30 min)
2. ⭐ Agregar gráficos a v3.0 (2 horas)

### Corto Plazo

1. ⭐ Migrar funcionalidades faltantes
2. ⭐ Optimizar consultas
3. ⭐ Implementar caché

### Mediano Plazo

1. ⭐ Deprecar dashboard v2.x
2. ⭐ Eliminar `Fabricacion.legacy`
3. ⭐ Consolidar en `Proyecto`

---

## 9. 🎯 CONCLUSIONES

### Fortalezas

- ✅ Funcional y estable
- ✅ Completo (todas las métricas)
- ✅ Gráficos visuales

### Debilidades

- ⚠️ Dependencia legacy
- ⚠️ Múltiples fuentes
- ⚠️ Performance mejorable

### Oportunidades con v3.0

- ✅ Modelo unificado
- ✅ Mejor performance
- ✅ Sin dependencias legacy
- ✅ Más filtros y flexibilidad

---

**Estado:** ✅ Auditoría completada  
**Próxima acción:** Migrar funcionalidades faltantes a v3.0  
**Responsable:** Equipo Técnico Sundeck  
**Fecha de entrega:** 8 Noviembre 2025

# 🔔 ROADMAP DE ALERTAS INTELIGENTES

**Fecha:** 13 Noviembre 2025  
**Estado:** Fase 1 Completada (Comercial) ✅  
**Próximas fases:** Fabricación, Instalación, Post-venta

---

## 📊 VISIÓN GENERAL

El sistema de alertas inteligentes es **modular y extensible**, diseñado para cubrir todo el ciclo de vida del proyecto:

```
COMERCIAL → FABRICACIÓN → INSTALACIÓN → POST-VENTA
   ✅            ⏳            ⏳            ⏳
```

---

## ✅ FASE 1: ALERTAS COMERCIALES (COMPLETADA)

### Implementado
- ✅ Servicio centralizado: `alertasInteligentesService.js`
- ✅ Detección automática de prospectos sin seguimiento (5+ días)
- ✅ Detección automática de proyectos sin movimiento (10+ días)
- ✅ Actualización automática de estados comerciales
- ✅ Panel de alertas en Dashboard Comercial
- ✅ Vista dedicada de alertas (`/alertas`)
- ✅ Hook compartido: `useAlertasInteligentes`

### Categorías activas
1. **Prospectos inactivos**
   - Sin nota en 5+ días
   - Auto-actualiza a estado "sin respuesta"
   
2. **Proyectos sin movimiento**
   - Sin actualización en 10+ días
   - Auto-actualiza a estado "pausado"

---

## 🏭 FASE 2: ALERTAS DE FABRICACIÓN (PENDIENTE)

### Objetivo
Monitorear el proceso de fabricación y detectar retrasos o problemas de producción.

### Categorías propuestas

#### 1. Órdenes de Fabricación Retrasadas
- **Detección:** Órdenes que exceden el tiempo estimado de producción
- **Umbral:** 3+ días de retraso
- **Prioridad:** Crítica
- **Acción automática:**
  - Notificar: coordinador_fabricacion, asesor_comercial
  - Actualizar estado: "fabricacion_retrasada"

#### 2. Materiales Faltantes
- **Detección:** Órdenes que no pueden iniciar por falta de materiales
- **Prioridad:** Alta
- **Acción automática:**
  - Notificar: compras, coordinador_fabricacion
  - Crear tarea: "solicitar_materiales"

#### 3. Control de Calidad Pendiente
- **Detección:** Productos terminados sin revisión de calidad
- **Umbral:** 1+ día sin inspección
- **Prioridad:** Importante
- **Acción automática:**
  - Notificar: control_calidad
  - Bloquear envío hasta aprobación

### Archivos a crear
```
server/services/alertasFabricacionService.js
client/src/modules/fabricacion/components/PanelAlertasFabricacion.jsx
```

---

## 🚚 FASE 3: ALERTAS DE INSTALACIÓN (PENDIENTE)

### Objetivo
Monitorear instalaciones programadas y detectar problemas de logística o ejecución.

### Categorías propuestas

#### 1. Instalaciones Próximas sin Confirmar
- **Detección:** Instalaciones a 48 horas sin confirmación con cliente
- **Umbral:** 2 días antes de instalación
- **Prioridad:** Alta
- **Acción automática:**
  - Notificar: coordinador_instalacion, asesor_comercial
  - Crear tarea: "confirmar_instalacion"

#### 2. Instalaciones Retrasadas
- **Detección:** Instalaciones en proceso por más tiempo del estimado
- **Umbral:** 4+ horas de retraso
- **Prioridad:** Crítica
- **Acción automática:**
  - Notificar: coordinador_instalacion, gerente_operaciones
  - Actualizar estado: "instalacion_retrasada"

#### 3. Herramientas o Materiales Faltantes
- **Detección:** Cuadrillas reportan falta de materiales en sitio
- **Prioridad:** Crítica
- **Acción automática:**
  - Notificar: coordinador_instalacion, almacen
  - Pausar instalación
  - Crear tarea: "enviar_materiales_urgente"

### Archivos a crear
```
server/services/alertasInstalacionService.js
client/src/modules/instalacion/components/PanelAlertasInstalacion.jsx
```

---

## 🛠️ FASE 4: ALERTAS DE POST-VENTA (PENDIENTE)

### Objetivo
Monitorear garantías, mantenimientos y satisfacción del cliente post-instalación.

### Categorías propuestas

#### 1. Garantías Próximas a Vencer
- **Detección:** Garantías que vencen en 30 días
- **Umbral:** 30 días antes de vencimiento
- **Prioridad:** Normal
- **Acción automática:**
  - Notificar: cliente, asesor_comercial
  - Crear tarea: "ofrecer_extension_garantia"

#### 2. Mantenimientos Programados
- **Detección:** Mantenimientos próximos o vencidos
- **Umbral:** 7 días antes / 1 día después
- **Prioridad:** Alta
- **Acción automática:**
  - Notificar: cliente, coordinador_mantenimiento
  - Crear tarea: "programar_visita"

#### 3. Quejas sin Resolver
- **Detección:** Quejas o incidencias sin respuesta
- **Umbral:** 24 horas sin respuesta
- **Prioridad:** Crítica
- **Acción automática:**
  - Notificar: gerente_servicio, asesor_comercial
  - Escalar a gerencia si > 48h

#### 4. Encuestas de Satisfacción Pendientes
- **Detección:** Instalaciones completadas sin encuesta
- **Umbral:** 7 días post-instalación
- **Prioridad:** Normal
- **Acción automática:**
  - Enviar encuesta automática
  - Notificar: asesor_comercial si no responde en 14 días

### Archivos a crear
```
server/services/alertasPostVentaService.js
client/src/modules/postventa/components/PanelAlertasPostVenta.jsx
```

---

## 🏗️ ARQUITECTURA EXTENSIBLE

### Estructura actual (Fase 1)
```
server/
  services/
    alertasInteligentesService.js  ← Servicio base (comercial)
  routes/
    alertas.js                      ← Endpoint /api/alertas/inteligentes
  jobs/
    alertasProspectos.js            ← Cron job prospectos
    alertasProyectos.js             ← Cron job proyectos

client/
  modules/
    alertas/
      AlertasView.jsx               ← Vista dedicada
      hooks/
        useAlertasInteligentes.js   ← Hook compartido
    proyectos/
      components/
        PanelAlertas.jsx            ← Panel en dashboard
```

### Estructura futura (Fases 2-4)
```
server/
  services/
    alertasInteligentesService.js     ← Base (comercial)
    alertasFabricacionService.js      ← Nuevo (Fase 2)
    alertasInstalacionService.js      ← Nuevo (Fase 3)
    alertasPostVentaService.js        ← Nuevo (Fase 4)
  routes/
    alertas.js                         ← Endpoint unificado
  jobs/
    alertasProspectos.js
    alertasProyectos.js
    alertasFabricacion.js             ← Nuevo (Fase 2)
    alertasInstalacion.js             ← Nuevo (Fase 3)
    alertasPostVenta.js               ← Nuevo (Fase 4)

client/
  modules/
    alertas/
      AlertasView.jsx                  ← Vista unificada (todas las fases)
      hooks/
        useAlertasInteligentes.js      ← Hook compartido
    fabricacion/
      components/
        PanelAlertasFabricacion.jsx   ← Nuevo (Fase 2)
    instalacion/
      components/
        PanelAlertasInstalacion.jsx   ← Nuevo (Fase 3)
    postventa/
      components/
        PanelAlertasPostVenta.jsx     ← Nuevo (Fase 4)
```

---

## 🔧 CÓMO AGREGAR NUEVAS CATEGORÍAS

### 1. Crear servicio específico

```javascript
// server/services/alertasFabricacionService.js
const Proyecto = require('../models/Proyecto');
const logger = require('../config/logger');

class AlertasFabricacionService {
  async obtenerOrdenesRetrasadas({ umbral = 3 } = {}) {
    const limiteFecha = new Date(Date.now() - umbral * 24 * 60 * 60 * 1000);
    
    const ordenes = await Proyecto.find({
      'fabricacion.estado': { $nin: ['completado', 'cancelado'] },
      'fabricacion.fecha_estimada': { $lt: new Date() }
    }).lean();
    
    return ordenes.map(orden => this.formatearOrdenRetrasada(orden));
  }
  
  formatearOrdenRetrasada(orden) {
    return {
      id: orden._id,
      tipo: 'fabricacion_retrasada',
      prioridad: 'critica',
      // ... resto de campos
    };
  }
}

module.exports = new AlertasFabricacionService();
```

### 2. Agregar endpoint en rutas

```javascript
// server/routes/alertas.js
const alertasFabricacion = require('../services/alertasFabricacionService');

router.get('/inteligentes/fabricacion', async (req, res) => {
  const ordenes = await alertasFabricacion.obtenerOrdenesRetrasadas();
  res.json({ data: ordenes });
});
```

### 3. Crear panel específico

```javascript
// client/src/modules/fabricacion/components/PanelAlertasFabricacion.jsx
import useAlertasInteligentes from '../../alertas/hooks/useAlertasInteligentes';

const PanelAlertasFabricacion = () => {
  const { data, loading } = useAlertasInteligentes({ 
    endpoint: '/alertas/inteligentes/fabricacion' 
  });
  
  // Renderizar alertas de fabricación
};
```

### 4. Agregar cron job

```javascript
// server/jobs/alertasFabricacion.js
const cron = require('node-cron');
const alertasFabricacion = require('../services/alertasFabricacionService');

cron.schedule('0 */4 * * *', async () => {
  // Ejecutar cada 4 horas
  const ordenes = await alertasFabricacion.obtenerOrdenesRetrasadas();
  // Enviar notificaciones
});
```

---

## 📊 MÉTRICAS POR FASE

| Fase | Categorías | Archivos | Duración Est. | Prioridad |
|------|-----------|----------|---------------|-----------|
| 1 - Comercial | 2 | 7 | 1 día | ✅ Completada |
| 2 - Fabricación | 3 | 4 | 2 días | Alta |
| 3 - Instalación | 3 | 4 | 2 días | Media |
| 4 - Post-venta | 4 | 4 | 2 días | Media |

**Total estimado:** 7 días para completar todas las fases

---

## 🎯 PRÓXIMOS PASOS

### Inmediato (Esta semana)
1. ✅ Documentar roadmap de alertas
2. ⏳ Probar alertas comerciales en producción
3. ⏳ Obtener feedback del equipo

### Corto plazo (Próximas 2 semanas)
1. Iniciar Fase 2 (Fabricación)
2. Definir umbrales específicos con el equipo
3. Implementar primeras alertas de fabricación

### Mediano plazo (Próximo mes)
1. Completar Fases 2 y 3
2. Integrar con sistema de notificaciones
3. Dashboard unificado de alertas

---

## 💡 CONSIDERACIONES TÉCNICAS

### Escalabilidad
- Cada servicio es independiente
- Fácil agregar nuevas categorías
- No requiere modificar código existente

### Performance
- Cron jobs programables por prioridad
- Caché de alertas frecuentes
- Paginación en vistas

### Notificaciones
- Email automático para alertas críticas
- Push notifications en app
- Integración con Slack/WhatsApp (futuro)

---

**Estado:** Fase 1 completada ✅  
**Próxima fase:** Fabricación (2 días estimados)  
**Responsable:** Equipo de desarrollo  
**Revisión:** Semanal

---

**Versión:** 1.0  
**Fecha:** 13 Noviembre 2025  
**Última actualización:** 4:05 PM

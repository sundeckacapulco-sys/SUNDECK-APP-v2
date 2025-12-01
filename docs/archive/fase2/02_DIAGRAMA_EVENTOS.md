# 📊 Diagrama de Eventos - Sundeck CRM

**Fecha:** 5 Noviembre 2025  
**Fase:** 2 - Orquestación y Automatización  
**Propósito:** Mapeo completo de eventos del sistema

---

## 🎯 Flujo Principal: Levantamiento → Entrega

```
┌──────────────┐
│ LEVANTAMIENTO│
└──────┬───────┘
       │ levantamiento.completado
       ▼
┌──────────────┐
│  COTIZACIÓN  │
└──────┬───────┘
       │ cotizacion.aprobada ⭐
       ▼
┌──────────────┐
│    PEDIDO    │
└──────┬───────┘
       │ pedido.anticipo_pagado ⭐
       ▼
┌──────────────┐
│ FABRICACIÓN  │
└──────┬───────┘
       │ fabricacion.completada ⭐
       ▼
┌──────────────┐
│ INSTALACIÓN  │
└──────┬───────┘
       │ instalacion.completada ⭐
       ▼
┌──────────────┐
│   ENTREGA    │
└──────────────┘
```

---

## 📋 Catálogo Completo de Eventos

### 🔵 Módulo: Prospectos

| Evento | Trigger | Datos | Listeners |
|--------|---------|-------|-----------|
| `prospecto.creado` | Nuevo prospecto | `{ prospectoId, nombre, telefono }` | KPI, Notificación |
| `prospecto.contactado` | Primera llamada | `{ prospectoId, fecha }` | KPI |
| `prospecto.convertido` | Pasa a proyecto | `{ prospectoId, proyectoId }` | KPI, Notificación |

---

### 🟢 Módulo: Levantamientos

| Evento | Trigger | Datos | Listeners |
|--------|---------|-------|-----------|
| `levantamiento.programado` | Agendar visita | `{ levantamientoId, fecha, direccion }` | Notificación |
| `levantamiento.iniciado` | Inicio de visita | `{ levantamientoId, timestamp }` | KPI |
| `levantamiento.completado` | Medidas capturadas | `{ levantamientoId, totalM2, piezas }` | Cotización, KPI |

---

### 🟡 Módulo: Cotizaciones

| Evento | Trigger | Datos | Listeners |
|--------|---------|-------|-----------|
| `cotizacion.creada` | Nueva cotización | `{ cotizacionId, monto, cliente }` | KPI |
| `cotizacion.enviada` | Envío al cliente | `{ cotizacionId, canal }` | Notificación, KPI |
| `cotizacion.aprobada` ⭐ | Cliente acepta | `{ cotizacionId, monto, anticipo }` | **Pedido**, KPI, Notificación |
| `cotizacion.rechazada` | Cliente rechaza | `{ cotizacionId, motivo }` | KPI, Notificación |
| `cotizacion.vencida` | Expira validez | `{ cotizacionId }` | Notificación |
| `cotizacion.modificada` | Cambios en cotización | `{ cotizacionId, cambios }` | KPI |

---

### 🔴 Módulo: Pedidos

| Evento | Trigger | Datos | Listeners |
|--------|---------|-------|-----------|
| `pedido.creado` ⭐ | Nuevo pedido | `{ pedidoId, cotizacionId, monto }` | **Fabricación**, KPI, Notificación |
| `pedido.confirmado` | Confirmación cliente | `{ pedidoId }` | Notificación |
| `pedido.anticipo_pagado` ⭐ | Pago de anticipo | `{ pedidoId, monto, metodoPago }` | **Fabricación**, KPI |
| `pedido.saldo_pagado` | Pago de saldo | `{ pedidoId, monto }` | KPI, Notificación |
| `pedido.cancelado` | Cancelación | `{ pedidoId, motivo }` | KPI, Notificación |
| `pedido.modificado` | Cambios en pedido | `{ pedidoId, cambios }` | Fabricación, KPI |

---

### 🟠 Módulo: Fabricación

| Evento | Trigger | Datos | Listeners |
|--------|---------|-------|-----------|
| `fabricacion.iniciada` ⭐ | Inicio de producción | `{ fabricacionId, pedidoId, productos }` | KPI, Notificación |
| `fabricacion.en_proceso` | Actualización de estado | `{ fabricacionId, progreso }` | KPI |
| `fabricacion.completada` ⭐ | Producción terminada | `{ fabricacionId, pedidoId }` | **Instalación**, KPI, Notificación |
| `fabricacion.pausada` | Pausa temporal | `{ fabricacionId, motivo }` | Notificación |
| `fabricacion.error` | Problema en producción | `{ fabricacionId, error }` | Notificación, Alerta |
| `fabricacion.material_faltante` | Falta material | `{ fabricacionId, material }` | Notificación, Alerta |

---

### 🟣 Módulo: Instalación

| Evento | Trigger | Datos | Listeners |
|--------|---------|-------|-----------|
| `instalacion.programada` | Agendar instalación | `{ instalacionId, fecha, direccion }` | Notificación, KPI |
| `instalacion.iniciada` | Inicio de instalación | `{ instalacionId, timestamp }` | KPI |
| `instalacion.completada` ⭐ | Instalación terminada | `{ instalacionId, pedidoId }` | **Entrega**, KPI, Notificación |
| `instalacion.reprogramada` | Cambio de fecha | `{ instalacionId, nuevaFecha, motivo }` | Notificación |
| `instalacion.problema` | Incidencia | `{ instalacionId, problema }` | Notificación, Alerta |

---

### 🟤 Módulo: Entrega

| Evento | Trigger | Datos | Listeners |
|--------|---------|-------|-----------|
| `entrega.completada` | Entrega final | `{ entregaId, pedidoId, conformidad }` | KPI, Notificación, Postventa |
| `entrega.rechazada` | Cliente no conforme | `{ entregaId, motivo }` | Alerta, Notificación |

---

### ⚫ Módulo: Sistema

| Evento | Trigger | Datos | Listeners |
|--------|---------|-------|-----------|
| `sistema.error` | Error crítico | `{ modulo, error, stack }` | Alerta, Logger |
| `sistema.alerta` | Advertencia | `{ tipo, mensaje }` | Notificación |
| `sistema.backup_completado` | Backup exitoso | `{ timestamp, tamaño }` | Logger |

---

## 🔄 Cadenas de Eventos Automáticas

### Cadena 1: Cotización → Pedido → Fabricación

```
cotizacion.aprobada
       ↓
  [Validar anticipo]
       ↓
   pedido.creado
       ↓
  [Esperar pago]
       ↓
pedido.anticipo_pagado
       ↓
fabricacion.iniciada
```

**Condiciones:**
- Anticipo debe estar pagado
- Productos deben estar disponibles
- No debe haber pedidos bloqueantes

---

### Cadena 2: Fabricación → Instalación → Entrega

```
fabricacion.completada
       ↓
  [Notificar cliente]
       ↓
instalacion.programada
       ↓
  [Ejecutar instalación]
       ↓
instalacion.completada
       ↓
  [Verificar conformidad]
       ↓
entrega.completada
```

**Condiciones:**
- Fabricación debe estar 100% completa
- Cliente debe confirmar fecha
- Cuadrilla debe estar disponible

---

## 📊 Matriz de Listeners

| Listener | Eventos que Escucha | Acciones |
|----------|---------------------|----------|
| **PedidoListener** | `cotizacion.aprobada` | Crear pedido automáticamente |
| **FabricacionListener** | `pedido.anticipo_pagado` | Iniciar orden de fabricación |
| **InstalacionListener** | `fabricacion.completada` | Notificar para programar |
| **NotificacionListener** | Todos los eventos ⭐ | Enviar notificaciones |
| **KPIListener** | Todos los eventos ⭐ | Actualizar métricas |
| **AlertaListener** | `*.error`, `*.problema` | Enviar alertas urgentes |

---

## 🎯 Eventos Prioritarios (Fase 2.1)

### Sprint 1: Implementar estos primero

1. **`cotizacion.aprobada`** → Crear pedido
2. **`pedido.anticipo_pagado`** → Iniciar fabricación
3. **`fabricacion.completada`** → Notificar instalación

### Sprint 2: Agregar estos después

4. **`instalacion.completada`** → Completar entrega
5. **`sistema.error`** → Alertas
6. **Todos** → Actualizar KPIs

---

## 📋 Formato Estándar de Evento

```javascript
{
  // Identificación
  tipo: 'modulo.accion',           // Ej: 'cotizacion.aprobada'
  
  // Datos del evento
  datos: {
    // IDs relevantes
    [moduloId]: ObjectId,
    
    // Datos específicos
    // ...
  },
  
  // Metadata
  origen: 'NombreController',
  usuario: ObjectId,                // Quien generó el evento
  timestamp: ISODate,
  
  // Estado de procesamiento
  procesado: Boolean,
  listeners: [{
    nombre: String,
    estado: 'pendiente|procesado|error',
    resultado: Object,
    error: String,
    timestamp: ISODate
  }]
}
```

---

## 🔧 Ejemplo de Implementación

### Emitir Evento:
```javascript
// En CotizacionController
const cotizacion = await Cotizacion.findByIdAndUpdate(id, {
  estado: 'aprobada'
});

await eventBus.emit('cotizacion.aprobada', {
  cotizacionId: cotizacion._id,
  monto: cotizacion.total,
  cliente: cotizacion.cliente,
  anticipo: cotizacion.anticipo
});
```

### Escuchar Evento:
```javascript
// En PedidoListener
eventBus.on('cotizacion.aprobada', async (event) => {
  const { cotizacionId, monto, anticipo } = event.datos;
  
  // Validar que anticipo esté pagado
  if (!anticipo.pagado) {
    logger.info('Esperando pago de anticipo');
    return;
  }
  
  // Crear pedido automáticamente
  const pedido = await Pedido.create({
    cotizacion: cotizacionId,
    montoTotal: monto,
    estado: 'confirmado'
  });
  
  // Emitir nuevo evento
  await eventBus.emit('pedido.creado', {
    pedidoId: pedido._id,
    cotizacionId
  });
});
```

---

## ✅ Checklist de Diseño

- [ ] Todos los eventos críticos identificados
- [ ] Cadenas de eventos definidas
- [ ] Listeners asignados
- [ ] Condiciones de activación claras
- [ ] Formato estándar definido
- [ ] Prioridades establecidas

---

**Próximo documento:** `03_EVENTOS_CRITICOS.md`

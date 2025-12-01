# 📚 Event-Driven Architecture - Guía de Implementación

**Fecha:** 5 Noviembre 2025  
**Fase:** 2 - Orquestación y Automatización  
**Propósito:** Fundamentos para implementar Event Bus Service

---

## 🎯 ¿Qué es Event-Driven Architecture?

**Definición:** Patrón arquitectónico donde los componentes se comunican mediante eventos en lugar de llamadas directas.

### Ventajas para Sundeck CRM:
- ✅ **Desacoplamiento:** Módulos independientes
- ✅ **Escalabilidad:** Fácil agregar nuevos listeners
- ✅ **Trazabilidad:** Historial completo de eventos
- ✅ **Automatización:** Reacciones automáticas a eventos
- ✅ **Sin costos:** Todo local en MongoDB

---

## 🏗️ Arquitectura Propuesta

```
┌─────────────┐
│   Cliente   │
│  (Frontend) │
└──────┬──────┘
       │ HTTP Request
       ▼
┌─────────────────┐
│   Controller    │ ──┐
│ (cotizaciones)  │   │
└─────────────────┘   │
                      │ emit('cotizacion.aprobada')
                      ▼
              ┌──────────────────┐
              │   Event Bus      │
              │   (MongoDB)      │
              └────────┬─────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
         ▼             ▼             ▼
    ┌────────┐   ┌────────┐   ┌────────┐
    │Listener│   │Listener│   │Listener│
    │Pedidos │   │Notif.  │   │KPIs    │
    └────────┘   └────────┘   └────────┘
```

---

## 📊 Componentes del Sistema

### 1. Event Bus Service
**Archivo:** `server/services/eventBusService.js`

**Responsabilidades:**
- Registrar eventos en MongoDB
- Notificar a listeners suscritos
- Mantener historial de eventos
- Manejar errores de listeners

### 2. Event Schema
**Archivo:** `server/models/Event.js`

**Estructura:**
```javascript
{
  tipo: String,           // 'cotizacion.aprobada'
  datos: Object,          // { cotizacionId, monto, ... }
  origen: String,         // 'CotizacionController'
  timestamp: Date,
  procesado: Boolean,
  listeners: [{
    nombre: String,
    estado: String,       // 'pendiente', 'procesado', 'error'
    resultado: Object,
    timestamp: Date
  }]
}
```

### 3. Listeners
**Ubicación:** `server/listeners/`

**Tipos:**
- `pedidoListener.js` - Crea pedidos automáticamente
- `notificacionListener.js` - Envía notificaciones
- `kpiListener.js` - Actualiza métricas
- `fabricacionListener.js` - Inicia fabricación

---

## 🔄 Flujo de Eventos

### Ejemplo: Cotización Aprobada

```javascript
// 1. Controller emite evento
eventBus.emit('cotizacion.aprobada', {
  cotizacionId: '123',
  monto: 10000,
  cliente: 'Juan Pérez'
});

// 2. Event Bus registra en MongoDB
await Event.create({
  tipo: 'cotizacion.aprobada',
  datos: { ... },
  origen: 'CotizacionController',
  timestamp: new Date()
});

// 3. Event Bus notifica a listeners
listeners.forEach(listener => {
  listener.handle(event);
});

// 4. Listener de Pedidos reacciona
async function handle(event) {
  const pedido = await Pedido.create({
    cotizacion: event.datos.cotizacionId,
    monto: event.datos.monto
  });
  
  // Emite nuevo evento
  eventBus.emit('pedido.creado', {
    pedidoId: pedido._id
  });
}
```

---

## 📋 Eventos Críticos del Sistema

### Módulo: Cotizaciones
- `cotizacion.creada`
- `cotizacion.enviada`
- `cotizacion.aprobada` ⭐
- `cotizacion.rechazada`
- `cotizacion.vencida`

### Módulo: Pedidos
- `pedido.creado` ⭐
- `pedido.confirmado`
- `pedido.anticipo_pagado` ⭐
- `pedido.saldo_pagado`
- `pedido.cancelado`

### Módulo: Fabricación
- `fabricacion.iniciada` ⭐
- `fabricacion.en_proceso`
- `fabricacion.completada` ⭐
- `fabricacion.pausada`
- `fabricacion.error`

### Módulo: Instalación
- `instalacion.programada`
- `instalacion.iniciada`
- `instalacion.completada` ⭐
- `instalacion.reprogramada`

### Módulo: Sistema
- `sistema.error`
- `sistema.alerta`
- `sistema.backup_completado`

---

## 🎯 Casos de Uso Prioritarios

### 1. Automatización de Pedidos
**Trigger:** `cotizacion.aprobada`  
**Acción:** Crear pedido automáticamente si anticipo está pagado

### 2. Inicio de Fabricación
**Trigger:** `pedido.anticipo_pagado`  
**Acción:** Crear orden de fabricación automáticamente

### 3. Programación de Instalación
**Trigger:** `fabricacion.completada`  
**Acción:** Notificar para programar instalación

### 4. Actualización de KPIs
**Trigger:** Cualquier evento crítico  
**Acción:** Actualizar métricas en tiempo real

---

## 🔧 Implementación Técnica

### Patrón Observer
```javascript
class EventBus {
  constructor() {
    this.listeners = new Map();
  }
  
  on(eventType, listener) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(listener);
  }
  
  async emit(eventType, data) {
    // 1. Registrar en MongoDB
    const event = await Event.create({
      tipo: eventType,
      datos: data,
      timestamp: new Date()
    });
    
    // 2. Notificar listeners
    const listeners = this.listeners.get(eventType) || [];
    for (const listener of listeners) {
      try {
        await listener.handle(event);
      } catch (error) {
        logger.error('Error en listener', { error });
      }
    }
  }
}
```

---

## 📊 Persistencia en MongoDB

### Colección: events
```javascript
{
  _id: ObjectId,
  tipo: 'cotizacion.aprobada',
  datos: {
    cotizacionId: '123',
    monto: 10000,
    cliente: 'Juan Pérez'
  },
  origen: 'CotizacionController',
  timestamp: ISODate('2025-11-05T19:00:00Z'),
  procesado: true,
  listeners: [
    {
      nombre: 'PedidoListener',
      estado: 'procesado',
      resultado: { pedidoId: '456' },
      timestamp: ISODate('2025-11-05T19:00:01Z')
    }
  ]
}
```

### Índices Recomendados:
```javascript
db.events.createIndex({ tipo: 1, timestamp: -1 });
db.events.createIndex({ procesado: 1 });
db.events.createIndex({ 'listeners.estado': 1 });
```

---

## 🎯 Beneficios Esperados

### Operativos:
- ✅ Automatización del 90% del flujo
- ✅ Reducción de errores manuales
- ✅ Trazabilidad completa
- ✅ Reacciones en tiempo real

### Técnicos:
- ✅ Código desacoplado
- ✅ Fácil agregar nuevas funcionalidades
- ✅ Testing simplificado
- ✅ Mantenibilidad mejorada

### Comerciales:
- ✅ Respuesta más rápida
- ✅ Menos trabajo manual
- ✅ Mayor satisfacción del cliente
- ✅ Escalabilidad sin costos

---

## 📚 Referencias

- **Patrón Observer:** https://refactoring.guru/design-patterns/observer
- **Event Sourcing:** https://martinfowler.com/eaaDev/EventSourcing.html
- **CQRS:** https://martinfowler.com/bliki/CQRS.html

---

## ✅ Checklist de Comprensión

Antes de implementar, asegúrate de entender:

- [ ] ¿Qué es un evento?
- [ ] ¿Cómo se emite un evento?
- [ ] ¿Cómo se suscribe un listener?
- [ ] ¿Dónde se persisten los eventos?
- [ ] ¿Qué pasa si un listener falla?
- [ ] ¿Cómo se consulta el historial?

---

**Próximo documento:** `02_DIAGRAMA_EVENTOS.md`

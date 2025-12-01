# 🏗️ Estructura Básica - Event Bus Service

**Fecha:** 5 Noviembre 2025  
**Fase:** 2 - Orquestación y Automatización  
**Propósito:** Plantilla de código para implementar

---

## 📁 Estructura de Archivos

```
server/
├── models/
│   └── Event.js                    ← Modelo de eventos
├── services/
│   └── eventBusService.js          ← Event Bus principal
├── listeners/
│   ├── index.js                    ← Registro de listeners
│   ├── pedidoListener.js           ← Listener de pedidos
│   ├── fabricacionListener.js      ← Listener de fabricación
│   ├── instalacionListener.js      ← Listener de instalación
│   ├── notificacionListener.js     ← Listener de notificaciones
│   └── kpiListener.js              ← Listener de KPIs
└── tests/
    ├── services/
    │   └── eventBusService.test.js
    └── listeners/
        └── pedidoListener.test.js
```

---

## 📄 1. Modelo de Evento (`server/models/Event.js`)

```javascript
const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  // Identificación
  tipo: {
    type: String,
    required: true,
    index: true,
    // Formato: 'modulo.accion'
    // Ej: 'cotizacion.aprobada'
  },
  
  // Datos del evento
  datos: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  
  // Metadata
  origen: {
    type: String,
    required: true
    // Ej: 'CotizacionController'
  },
  
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Estado de procesamiento
  procesado: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // Listeners que procesaron el evento
  listeners: [{
    nombre: String,
    estado: {
      type: String,
      enum: ['pendiente', 'procesado', 'error'],
      default: 'pendiente'
    },
    resultado: mongoose.Schema.Types.Mixed,
    error: String,
    timestamp: Date
  }]
}, {
  timestamps: true
});

// Índices compuestos
EventSchema.index({ tipo: 1, timestamp: -1 });
EventSchema.index({ procesado: 1, timestamp: -1 });
EventSchema.index({ 'listeners.estado': 1 });

// Método para marcar como procesado
EventSchema.methods.marcarProcesado = function() {
  this.procesado = this.listeners.every(l => l.estado === 'procesado');
  return this.save();
};

module.exports = mongoose.model('Event', EventSchema);
```

---

## 📄 2. Event Bus Service (`server/services/eventBusService.js`)

```javascript
const Event = require('../models/Event');
const logger = require('../config/logger');

class EventBusService {
  constructor() {
    this.listeners = new Map();
  }
  
  /**
   * Registrar un listener para un tipo de evento
   * @param {String} eventType - Tipo de evento (ej: 'cotizacion.aprobada')
   * @param {Object} listener - Objeto listener con método handle()
   */
  on(eventType, listener) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    
    this.listeners.get(eventType).push(listener);
    
    logger.info('Listener registrado', {
      service: 'EventBusService',
      eventType,
      listener: listener.constructor.name
    });
  }
  
  /**
   * Emitir un evento
   * @param {String} eventType - Tipo de evento
   * @param {Object} data - Datos del evento
   * @param {String} origen - Origen del evento
   * @param {String} usuarioId - ID del usuario que generó el evento
   */
  async emit(eventType, data, origen = 'Sistema', usuarioId = null) {
    try {
      // 1. Registrar evento en MongoDB
      const event = await Event.create({
        tipo: eventType,
        datos: data,
        origen,
        usuario: usuarioId,
        timestamp: new Date()
      });
      
      logger.info('Evento emitido', {
        service: 'EventBusService',
        eventId: event._id,
        tipo: eventType,
        origen
      });
      
      // 2. Obtener listeners registrados
      const listeners = this.listeners.get(eventType) || [];
      
      if (listeners.length === 0) {
        logger.warn('No hay listeners para este evento', {
          service: 'EventBusService',
          eventType
        });
        return event;
      }
      
      // 3. Notificar a cada listener
      for (const listener of listeners) {
        const listenerName = listener.constructor.name;
        
        try {
          // Registrar listener en el evento
          event.listeners.push({
            nombre: listenerName,
            estado: 'pendiente',
            timestamp: new Date()
          });
          await event.save();
          
          // Ejecutar listener
          const resultado = await listener.handle(event);
          
          // Actualizar estado del listener
          const listenerIndex = event.listeners.findIndex(
            l => l.nombre === listenerName && l.estado === 'pendiente'
          );
          
          if (listenerIndex !== -1) {
            event.listeners[listenerIndex].estado = 'procesado';
            event.listeners[listenerIndex].resultado = resultado;
            event.listeners[listenerIndex].timestamp = new Date();
          }
          
          await event.save();
          
          logger.info('Listener procesado exitosamente', {
            service: 'EventBusService',
            eventId: event._id,
            listener: listenerName
          });
          
        } catch (error) {
          // Registrar error del listener
          const listenerIndex = event.listeners.findIndex(
            l => l.nombre === listenerName && l.estado === 'pendiente'
          );
          
          if (listenerIndex !== -1) {
            event.listeners[listenerIndex].estado = 'error';
            event.listeners[listenerIndex].error = error.message;
            event.listeners[listenerIndex].timestamp = new Date();
          }
          
          await event.save();
          
          logger.error('Error en listener', {
            service: 'EventBusService',
            eventId: event._id,
            listener: listenerName,
            error: error.message
          });
        }
      }
      
      // 4. Marcar evento como procesado si todos los listeners terminaron
      await event.marcarProcesado();
      
      return event;
      
    } catch (error) {
      logger.error('Error emitiendo evento', {
        service: 'EventBusService',
        eventType,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
  
  /**
   * Obtener historial de eventos
   * @param {Object} filtros - Filtros de búsqueda
   * @param {Number} limite - Límite de resultados
   */
  async getHistorial(filtros = {}, limite = 100) {
    try {
      const eventos = await Event.find(filtros)
        .sort({ timestamp: -1 })
        .limit(limite)
        .lean();
      
      return eventos;
    } catch (error) {
      logger.error('Error obteniendo historial', {
        service: 'EventBusService',
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Obtener eventos pendientes de procesar
   */
  async getEventosPendientes() {
    try {
      const eventos = await Event.find({
        procesado: false
      }).sort({ timestamp: 1 });
      
      return eventos;
    } catch (error) {
      logger.error('Error obteniendo eventos pendientes', {
        service: 'EventBusService',
        error: error.message
      });
      throw error;
    }
  }
}

// Exportar instancia singleton
module.exports = new EventBusService();
```

---

## 📄 3. Listener Base (`server/listeners/BaseListener.js`)

```javascript
const logger = require('../config/logger');

class BaseListener {
  constructor(nombre) {
    this.nombre = nombre;
  }
  
  /**
   * Método que debe implementar cada listener
   * @param {Object} event - Evento a procesar
   * @returns {Object} - Resultado del procesamiento
   */
  async handle(event) {
    throw new Error('Método handle() debe ser implementado');
  }
  
  /**
   * Log de información
   */
  log(mensaje, datos = {}) {
    logger.info(mensaje, {
      listener: this.nombre,
      ...datos
    });
  }
  
  /**
   * Log de error
   */
  logError(mensaje, error) {
    logger.error(mensaje, {
      listener: this.nombre,
      error: error.message,
      stack: error.stack
    });
  }
}

module.exports = BaseListener;
```

---

## 📄 4. Listener de Pedidos (`server/listeners/pedidoListener.js`)

```javascript
const BaseListener = require('./BaseListener');
const Pedido = require('../models/Pedido');
const eventBus = require('../services/eventBusService');

class PedidoListener extends BaseListener {
  constructor() {
    super('PedidoListener');
  }
  
  async handle(event) {
    const { tipo, datos } = event;
    
    switch (tipo) {
      case 'cotizacion.aprobada':
        return await this.crearPedidoDesdeCotizacion(datos);
      
      default:
        this.log('Evento no manejado', { tipo });
        return null;
    }
  }
  
  async crearPedidoDesdeCotizacion(datos) {
    try {
      const { cotizacionId, monto, anticipo, productos } = datos;
      
      // Validar que anticipo esté pagado
      if (!anticipo.pagado) {
        this.log('Anticipo no pagado, esperando pago', { cotizacionId });
        return { accion: 'esperando_pago' };
      }
      
      // Crear pedido
      const pedido = await Pedido.create({
        cotizacion: cotizacionId,
        montoTotal: monto,
        anticipo: {
          porcentaje: anticipo.porcentaje,
          monto: anticipo.monto,
          pagado: true,
          metodoPago: anticipo.metodoPago
        },
        productos: productos,
        estado: 'confirmado'
      });
      
      this.log('Pedido creado exitosamente', {
        pedidoId: pedido._id,
        cotizacionId
      });
      
      // Emitir evento de pedido creado
      await eventBus.emit('pedido.creado', {
        pedidoId: pedido._id,
        cotizacionId,
        monto
      }, 'PedidoListener');
      
      return {
        accion: 'pedido_creado',
        pedidoId: pedido._id
      };
      
    } catch (error) {
      this.logError('Error creando pedido', error);
      throw error;
    }
  }
}

module.exports = new PedidoListener();
```

---

## 📄 5. Registro de Listeners (`server/listeners/index.js`)

```javascript
const eventBus = require('../services/eventBusService');
const pedidoListener = require('./pedidoListener');
const fabricacionListener = require('./fabricacionListener');
const instalacionListener = require('./instalacionListener');
const notificacionListener = require('./notificacionListener');
const kpiListener = require('./kpiListener');

/**
 * Registrar todos los listeners al iniciar la aplicación
 */
function registrarListeners() {
  // Pedidos
  eventBus.on('cotizacion.aprobada', pedidoListener);
  
  // Fabricación
  eventBus.on('pedido.anticipo_pagado', fabricacionListener);
  eventBus.on('pedido.creado', fabricacionListener);
  
  // Instalación
  eventBus.on('fabricacion.completada', instalacionListener);
  
  // Notificaciones (escucha todos los eventos críticos)
  eventBus.on('cotizacion.aprobada', notificacionListener);
  eventBus.on('pedido.creado', notificacionListener);
  eventBus.on('fabricacion.completada', notificacionListener);
  eventBus.on('instalacion.completada', notificacionListener);
  
  // KPIs (escucha todos los eventos)
  eventBus.on('cotizacion.aprobada', kpiListener);
  eventBus.on('pedido.creado', kpiListener);
  eventBus.on('fabricacion.completada', kpiListener);
  eventBus.on('instalacion.completada', kpiListener);
  
  console.log('✅ Listeners registrados exitosamente');
}

module.exports = { registrarListeners };
```

---

## 📄 6. Inicialización en `server/index.js`

```javascript
const express = require('express');
const mongoose = require('mongoose');
const { registrarListeners } = require('./listeners');

const app = express();

// ... configuración de express

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB conectado');
    
    // Registrar listeners después de conectar a BD
    registrarListeners();
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    });
  })
  .catch(error => {
    console.error('❌ Error conectando a MongoDB:', error);
    process.exit(1);
  });
```

---

## 📄 7. Uso en Controllers

```javascript
// En CotizacionController
const eventBus = require('../services/eventBusService');

const aprobarCotizacion = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Actualizar cotización
    const cotizacion = await Cotizacion.findByIdAndUpdate(id, {
      estado: 'aprobada',
      fechaAprobacion: new Date()
    }, { new: true });
    
    // Emitir evento
    await eventBus.emit('cotizacion.aprobada', {
      cotizacionId: cotizacion._id,
      numero: cotizacion.numero,
      monto: cotizacion.total,
      cliente: {
        id: cotizacion.cliente,
        nombre: cotizacion.clienteNombre
      },
      anticipo: cotizacion.anticipo,
      productos: cotizacion.productos
    }, 'CotizacionController', req.user._id);
    
    res.json({
      success: true,
      cotizacion
    });
    
  } catch (error) {
    logger.error('Error aprobando cotizacion', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};
```

---

## ✅ Checklist de Implementación

### Paso 1: Modelo
- [ ] Crear `server/models/Event.js`
- [ ] Definir schema completo
- [ ] Agregar índices
- [ ] Agregar métodos útiles

### Paso 2: Event Bus
- [ ] Crear `server/services/eventBusService.js`
- [ ] Implementar método `on()`
- [ ] Implementar método `emit()`
- [ ] Implementar método `getHistorial()`
- [ ] Agregar logging completo

### Paso 3: Listeners
- [ ] Crear `server/listeners/BaseListener.js`
- [ ] Crear `server/listeners/pedidoListener.js`
- [ ] Crear `server/listeners/index.js`
- [ ] Registrar listeners en `server/index.js`

### Paso 4: Tests
- [ ] Tests unitarios de Event Bus
- [ ] Tests unitarios de Listeners
- [ ] Tests de integración

### Paso 5: Integración
- [ ] Emitir eventos desde controllers
- [ ] Verificar que listeners se ejecuten
- [ ] Validar persistencia en MongoDB

---

## 📊 Resultado Esperado

Al completar la implementación:

1. ✅ Event Bus operativo
2. ✅ Eventos registrados en MongoDB
3. ✅ Listeners ejecutándose automáticamente
4. ✅ Historial de eventos consultable
5. ✅ Logging completo
6. ✅ Tests pasando

---

**Tiempo estimado:** 2-3 semanas  
**Complejidad:** Media  
**Dependencias:** MongoDB, Logger estructurado

---

**Siguiente paso:** Implementar según esta estructura

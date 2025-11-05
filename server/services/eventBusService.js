const Event = require('../models/Event');
const logger = require('../config/logger');

class EventBusService {
  constructor() {
    this.listeners = new Map();
  }

  on(eventType, listener) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }

    this.listeners.get(eventType).push(listener);

    logger.info('Listener registrado', {
      service: 'EventBusService',
      eventType,
      listener: listener.constructor?.name || listener.name || 'Anonimo'
    });
  }

  async emit(eventType, data, origen = 'Sistema', usuarioId = null) {
    try {
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

      const listeners = this.listeners.get(eventType) || [];

      if (listeners.length === 0) {
        logger.warn('No hay listeners para este evento', {
          service: 'EventBusService',
          eventType
        });
        return event;
      }

      for (const listener of listeners) {
        const listenerName = listener.constructor?.name || listener.name || 'Anonimo';

        try {
          event.listeners.push({
            nombre: listenerName,
            estado: 'pendiente',
            timestamp: new Date()
          });
          await event.save();

          const resultado = await listener.handle(event);

          const listenerIndex = event.listeners.findIndex(l => l.nombre === listenerName && l.estado === 'pendiente');

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
          const listenerIndex = event.listeners.findIndex(l => l.nombre === listenerName && l.estado === 'pendiente');

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
            error: error.message,
            stack: error.stack
          });
        }
      }

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

  async getEventosPendientes() {
    try {
      const eventos = await Event.find({ procesado: false }).sort({ timestamp: 1 });
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

module.exports = new EventBusService();

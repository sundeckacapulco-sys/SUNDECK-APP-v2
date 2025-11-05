const logger = require('../config/logger');
const eventBus = require('../services/eventBusService');
const pedidoListener = require('./pedidoListener');
const fabricacionListener = require('./fabricacionListener');
const instalacionListener = require('./instalacionListener');

let registrados = false;

function registrarListeners() {
  if (registrados) {
    logger.warn('Listeners ya estaban registrados, se omite registro duplicado', {
      service: 'EventBusService'
    });
    return;
  }

  eventBus.on('cotizacion.aprobada', pedidoListener);
  eventBus.on('pedido.creado', fabricacionListener);
  eventBus.on('pedido.anticipo_pagado', fabricacionListener);
  eventBus.on('fabricacion.completada', instalacionListener);

  registrados = true;

  logger.info('Listeners registrados exitosamente', {
    service: 'EventBusService',
    listeners: ['cotizacion.aprobada', 'pedido.creado', 'pedido.anticipo_pagado', 'fabricacion.completada']
  });
}

module.exports = { registrarListeners };

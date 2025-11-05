const BaseListener = require('./BaseListener');
const Pedido = require('../models/Pedido');
const OrdenFabricacion = require('../models/OrdenFabricacion');
const eventBus = require('../services/eventBusService');

class FabricacionListener extends BaseListener {
  constructor() {
    super('FabricacionListener');
  }

  async handle(event) {
    const { tipo } = event;

    switch (tipo) {
      case 'pedido.anticipo_pagado':
      case 'pedido.creado':
        return this.iniciarFabricacion(event);
      default:
        this.logWarn('Evento no manejado por FabricacionListener', { tipo });
        return null;
    }
  }

  async iniciarFabricacion(event) {
    const { datos, tipo } = event;
    const {
      pedidoId,
      anticipo = {},
      prioridad = 'normal',
      fechaInicio = new Date(),
      productos = []
    } = datos || {};

    if (!pedidoId) {
      this.logWarn('Evento de fabricación sin pedidoId', { tipo });
      return { accion: 'datos_incompletos' };
    }

    const anticipoPagado = anticipo.pagado ?? false;

    if (!anticipoPagado) {
      this.log('Anticipo no pagado, fabricación en espera', {
        pedidoId,
        evento: tipo
      });
      return { accion: 'esperando_anticipo' };
    }

    try {
      const pedido = await Pedido.findById(pedidoId).populate('prospecto');
      if (!pedido) {
        this.logWarn('Pedido no encontrado, no se puede iniciar fabricación', { pedidoId });
        return { accion: 'pedido_no_encontrado' };
      }

      const ordenExistente = await OrdenFabricacion.findOne({ pedido: pedidoId });
      if (ordenExistente) {
        this.log('Orden de fabricación ya existe, no se genera nueva', {
          pedidoId,
          ordenId: ordenExistente._id
        });
        return { accion: 'orden_existente', ordenId: ordenExistente._id };
      }

      const fechaInicioReal = fechaInicio ? new Date(fechaInicio) : new Date();
      const tiempoEstimado = this.calcularTiempoFabricacion(productos.length > 0 ? productos : pedido.productos || []);
      const fechaFinEstimada = this.calcularFechaFin(fechaInicioReal, tiempoEstimado);

      const orden = await OrdenFabricacion.create({
        pedido: pedido._id,
        cliente: {
          nombre: pedido.prospecto?.nombre,
          telefono: pedido.prospecto?.telefono,
          direccion: pedido.prospecto?.direccion?.calle || ''
        },
        productos: (productos.length > 0 ? productos : pedido.productos || []).map(prod => this.normalizarProducto(prod)),
        prioridad,
        estado: 'pendiente',
        fechaInicioEstimada: fechaInicioReal,
        fechaFinEstimada: fechaFinEstimada,
        notas: [{
          fecha: new Date(),
          contenido: 'Orden generada automáticamente por pago de anticipo',
          tipo: 'fabricacion'
        }]
      });

      pedido.estado = 'en_fabricacion';
      pedido.fechaInicioFabricacion = fechaInicioReal;
      pedido.fechaFinFabricacion = fechaFinEstimada;
      await pedido.save();

      this.log('Orden de fabricación generada automáticamente', {
        pedidoId: pedido._id,
        ordenId: orden._id,
        evento: tipo
      });

      await eventBus.emit('fabricacion.iniciada', {
        ordenId: orden._id,
        pedidoId: pedido._id,
        productos: orden.productos,
        fechaInicio: fechaInicioReal,
        fechaFinEstimada,
        prioridad
      }, 'FabricacionListener');

      return {
        accion: 'fabricacion_iniciada',
        ordenId: orden._id
      };
    } catch (error) {
      this.logError('Error creando orden de fabricación automática', error, {
        pedidoId,
        evento: tipo
      });
      throw error;
    }
  }

  normalizarProducto(producto = {}) {
    const base = producto?.toObject ? producto.toObject() : producto;

    return {
      nombre: base.nombre,
      descripcion: base.descripcion,
      categoria: base.categoria,
      material: base.material,
      color: base.color,
      cristal: base.cristal,
      herrajes: base.herrajes,
      medidas: base.medidas || {},
      cantidad: base.cantidad || 1,
      requiereR24: base.requiereR24,
      especificacionesTecnicas: base.especificacionesTecnicas || {},
      materiales: base.materiales || [],
      instrucciones: base.instrucciones || [],
      estadoFabricacion: base.estadoFabricacion || 'pendiente'
    };
  }

  calcularTiempoFabricacion(productos = []) {
    return productos.reduce((total, producto) => {
      const base = producto?.toObject ? producto.toObject() : producto;
      const tiempo = base.tiempoFabricacion || (base.requiereR24 ? 15 : 10);
      const cantidad = base.cantidad || 1;
      return total + (tiempo * cantidad);
    }, 0) || 10;
  }

  calcularFechaFin(fechaInicio, tiempoDias) {
    const fecha = new Date(fechaInicio);
    const dias = Math.max(1, Math.ceil(tiempoDias / 8));
    fecha.setDate(fecha.getDate() + dias);
    return fecha;
  }
}

module.exports = new FabricacionListener();

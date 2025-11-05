const BaseListener = require('./BaseListener');
const Pedido = require('../models/Pedido');
const OrdenFabricacion = require('../models/OrdenFabricacion');
const Instalacion = require('../models/Instalacion');
const eventBus = require('../services/eventBusService');

class InstalacionListener extends BaseListener {
  constructor() {
    super('InstalacionListener');
  }

  async handle(event) {
    const { tipo } = event;

    switch (tipo) {
      case 'fabricacion.completada':
        return this.programarInstalacion(event);
      default:
        this.logWarn('Evento no manejado por InstalacionListener', { tipo });
        return null;
    }
  }

  async programarInstalacion(event) {
    const { datos } = event;
    const {
      pedidoId,
      fabricacionId,
      fechaFin,
      productos = [],
      cliente = {},
      prioridad = 'media'
    } = datos || {};

    if (!pedidoId) {
      this.logWarn('Evento de fabricación completada sin pedidoId');
      return { accion: 'datos_incompletos' };
    }

    try {
      const pedido = await Pedido.findById(pedidoId).populate('prospecto');
      if (!pedido) {
        this.logWarn('Pedido no encontrado al programar instalación', { pedidoId });
        return { accion: 'pedido_no_encontrado' };
      }

      const instalacionExistente = await Instalacion.findOne({ pedido: pedidoId });
      if (instalacionExistente) {
        this.log('Instalación ya programada para el pedido', {
          pedidoId,
          instalacionId: instalacionExistente._id
        });
        return { accion: 'instalacion_existente', instalacionId: instalacionExistente._id };
      }

      const fechaProgramada = this.obtenerFechaProgramada(pedido, fechaFin);

      const instalacion = await Instalacion.create({
        pedido: pedido._id,
        fabricacion: fabricacionId,
        proyectoId: pedido._id.toString(),
        fechaProgramada,
        estado: 'programada',
        prioridad,
        tipoInstalacion: 'estandar',
        tiempoEstimado: 4,
        direccion: pedido.direccionEntrega || {},
        contactoSitio: pedido.contactoEntrega || {
          nombre: cliente?.nombre || pedido.prospecto?.nombre,
          telefono: cliente?.telefono || pedido.prospecto?.telefono
        },
        productos: (productos.length > 0 ? productos : pedido.productos || []).map(prod => ({
          nombre: prod.nombre,
          ubicacion: prod.ubicacion || 'General',
          estado: 'pendiente'
        }))
      });

      pedido.estado = 'en_instalacion';
      pedido.fechaInstalacion = fechaProgramada;
      await pedido.save();

      if (fabricacionId) {
        await OrdenFabricacion.findByIdAndUpdate(fabricacionId, {
          estado: 'terminado'
        });
      }

      this.log('Instalación programada automáticamente', {
        pedidoId: pedido._id,
        instalacionId: instalacion._id
      });

      await eventBus.emit('instalacion.programada', {
        instalacionId: instalacion._id,
        pedidoId: pedido._id,
        fechaProgramada,
        prioridad
      }, 'InstalacionListener');

      return {
        accion: 'instalacion_programada',
        instalacionId: instalacion._id
      };
    } catch (error) {
      this.logError('Error programando instalación automática', error, {
        pedidoId
      });
      throw error;
    }
  }

  obtenerFechaProgramada(pedido, fechaFinFabricacion) {
    if (pedido.fechaInstalacion) {
      return pedido.fechaInstalacion;
    }

    if (fechaFinFabricacion) {
      const fecha = new Date(fechaFinFabricacion);
      fecha.setDate(fecha.getDate() + 1);
      return fecha;
    }

    const fechaBase = new Date();
    fechaBase.setDate(fechaBase.getDate() + 2);
    return fechaBase;
  }
}

module.exports = new InstalacionListener();

const BaseListener = require('./BaseListener');
const Pedido = require('../models/Pedido');
const Cotizacion = require('../models/Cotizacion');
const Prospecto = require('../models/Prospecto');
const eventBus = require('../services/eventBusService');

class PedidoListener extends BaseListener {
  constructor() {
    super('PedidoListener');
  }

  async handle(event) {
    const { tipo } = event;

    switch (tipo) {
      case 'cotizacion.aprobada':
        return this.crearPedidoDesdeCotizacion(event);
      default:
        this.logWarn('Evento no manejado por PedidoListener', { tipo });
        return null;
    }
  }

  async crearPedidoDesdeCotizacion(event) {
    const { datos } = event;
    const {
      cotizacionId,
      prospectoId,
      monto,
      anticipo = {},
      productos = [],
      usuarioId,
      numero: numeroCotizacion
    } = datos || {};

    if (!cotizacionId || !prospectoId) {
      this.logWarn('Datos incompletos para crear pedido desde cotización', {
        cotizacionId,
        prospectoId
      });
      return { accion: 'datos_incompletos' };
    }

    if (!anticipo.pagado) {
      this.log('Anticipo pendiente, se omite creación automática de pedido', {
        cotizacionId,
        numeroCotizacion
      });
      return { accion: 'esperando_pago' };
    }

    try {
      const pedidoExistente = await Pedido.findOne({ cotizacion: cotizacionId });
      if (pedidoExistente) {
        this.log('Pedido ya existe para la cotización, no se crea duplicado', {
          cotizacionId,
          pedidoId: pedidoExistente._id
        });
        return { accion: 'pedido_existente', pedidoId: pedidoExistente._id };
      }

      const cotizacion = await Cotizacion.findById(cotizacionId)
        .select('prospecto total productos formaPago instalacion descuento pago entrega vendedor')
        .populate('prospecto');

      const prospecto = cotizacion?.prospecto || await Prospecto.findById(prospectoId);

      if (!cotizacion && !prospecto) {
        this.logWarn('No se encontró cotización ni prospecto para crear pedido', {
          cotizacionId,
          prospectoId
        });
        return { accion: 'sin_datos' };
      }

      const pedido = await Pedido.create({
        cotizacion: cotizacionId,
        prospecto: prospecto?._id || prospectoId,
        montoTotal: monto || cotizacion?.total,
        anticipo: {
          porcentaje: anticipo.porcentaje,
          monto: anticipo.monto,
          pagado: true,
          metodoPago: anticipo.metodoPago,
          fechaPago: anticipo.fechaPago ? new Date(anticipo.fechaPago) : new Date(),
          referencia: anticipo.referencia || '',
          comprobante: anticipo.comprobante || ''
        },
        saldo: {
          monto: typeof anticipo.porcentaje === 'number' ? monto * ((100 - anticipo.porcentaje) / 100) : monto - (anticipo.monto || 0),
          porcentaje: typeof anticipo.porcentaje === 'number' ? 100 - anticipo.porcentaje : undefined,
          pagado: false
        },
        productos: productos.map(producto => ({
          nombre: producto.nombre,
          descripcion: producto.descripcion,
          categoria: producto.categoria,
          material: producto.material,
          color: producto.color,
          cristal: producto.cristal,
          herrajes: producto.herrajes,
          medidas: producto.medidas,
          cantidad: producto.cantidad,
          precioUnitario: producto.precioUnitario,
          subtotal: producto.subtotal,
          requiereR24: producto.requiereR24,
          tiempoFabricacion: producto.tiempoFabricacion,
          estadoFabricacion: 'pendiente'
        })),
        estado: 'confirmado',
        vendedor: datos.vendedorId,
        notas: [{
          contenido: 'Pedido creado automáticamente al aprobar cotización',
          usuario: usuarioId,
          tipo: 'info',
          fecha: new Date()
        }]
      });

      this.log('Pedido creado exitosamente desde cotización aprobada', {
        cotizacionId,
        pedidoId: pedido._id
      });

      if (prospecto) {
        prospecto.etapa = 'pedido';
        prospecto.fechaUltimoContacto = new Date();
        await prospecto.save();
      }

      await eventBus.emit('pedido.creado', {
        pedidoId: pedido._id,
        cotizacionId,
        numeroCotizacion,
        monto,
        anticipo,
        productos,
        prospectoId: prospecto?._id || prospectoId
      }, 'PedidoListener');

      return {
        accion: 'pedido_creado',
        pedidoId: pedido._id
      };
    } catch (error) {
      this.logError('Error creando pedido desde cotización', error, {
        cotizacionId,
        prospectoId
      });
      throw error;
    }
  }
}

module.exports = new PedidoListener();

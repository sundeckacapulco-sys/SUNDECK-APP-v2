const FabricacionService = require('../services/fabricacionService');
const CotizacionMappingService = require('../services/cotizacionMappingService');
const Pedido = require('../models/Pedido');
const OrdenFabricacion = require('../models/OrdenFabricacion');
const logger = require('../config/logger');

const ESTADOS_VALIDOS_ORDEN = ['pendiente', 'en_proceso', 'terminado', 'entregado_instalacion', 'cancelado'];

async function obtenerColaFabricacion(req, res) {
  try {
    const proyectos = await FabricacionService.obtenerColaFabricacion(req.query || {});

    logger.info('Cola de fabricación obtenida correctamente', {
      controlador: 'fabricacionController',
      accion: 'obtenerColaFabricacion',
      filtros: req.query,
      total: proyectos?.length || 0
    });

    return res.json(proyectos);
  } catch (error) {
    logger.error('Error obteniendo cola de fabricación', {
      controlador: 'fabricacionController',
      accion: 'obtenerColaFabricacion',
      filtros: req.query,
      error: error.message,
      stack: error.stack
    });

    return res.status(500).json({
      message: 'Error obteniendo cola de fabricación',
      error: error.message
    });
  }
}

async function obtenerMetricasFabricacion(req, res) {
  let fechaInicio;
  let fechaFin;

  try {
    if (req.query?.fechaInicio) {
      fechaInicio = new Date(req.query.fechaInicio);
    } else {
      fechaInicio = new Date();
      fechaInicio.setMonth(fechaInicio.getMonth() - 1);
    }

    if (req.query?.fechaFin) {
      fechaFin = new Date(req.query.fechaFin);
    } else {
      fechaFin = new Date();
    }

    const metricas = await FabricacionService.obtenerMetricas(fechaInicio, fechaFin);

    logger.info('Métricas de fabricación calculadas correctamente', {
      controlador: 'fabricacionController',
      accion: 'obtenerMetricasFabricacion',
      rangoFechas: { fechaInicio, fechaFin }
    });

    return res.json(metricas);
  } catch (error) {
    logger.error('Error obteniendo métricas de fabricación', {
      controlador: 'fabricacionController',
      accion: 'obtenerMetricasFabricacion',
      rangoFechas: { fechaInicio, fechaFin },
      error: error.message,
      stack: error.stack
    });

    return res.status(500).json({
      message: 'Error obteniendo métricas',
      error: error.message
    });
  }
}

async function crearOrdenDesdePedido(req, res) {
  try {
    const { pedidoId } = req.params;
    const {
      fechaInicioDeseada,
      prioridad = 'media',
      observacionesFabricacion = '',
      asignadoA = null
    } = req.body || {};

    const pedido = await Pedido.findById(pedidoId)
      .populate('prospecto', 'nombre telefono direccion');

    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    if (pedido.estado !== 'confirmado') {
      return res.status(400).json({
        message: 'Solo se pueden enviar a fabricación pedidos confirmados'
      });
    }

    const ordenExistente = await OrdenFabricacion.findOne({ pedido: pedidoId });
    if (ordenExistente) {
      return res.status(400).json({
        message: 'Ya existe una orden de fabricación para este pedido'
      });
    }

    const payloadFabricacion = CotizacionMappingService.generarPayloadUnificado({
      prospectoId: pedido.prospecto?._id,
      productos: pedido.productos || [],
      origen: 'pedido_confirmado'
    }, 'produccion');

    const tiemposFabricacion = calcularTiemposFabricacion(pedido.productos || []);

    const ordenFabricacion = new OrdenFabricacion({
      pedido: pedido._id,
      cliente: {
        nombre: pedido.prospecto?.nombre,
        telefono: pedido.prospecto?.telefono,
        direccion: pedido.prospecto?.direccion || ''
      },
      productos: (pedido.productos || []).map(producto => normalizarProductoParaOrden(producto)),
      prioridad,
      estado: 'pendiente',
      fechaInicioEstimada: fechaInicioDeseada ? new Date(fechaInicioDeseada) : new Date(),
      fechaFinEstimada: calcularFechaFinEstimada(fechaInicioDeseada || new Date(), tiemposFabricacion.total),
      fabricante: asignadoA || undefined,
      notas: observacionesFabricacion ? [{
        fecha: new Date(),
        usuario: req.usuario?._id,
        contenido: observacionesFabricacion,
        tipo: 'fabricacion'
      }] : []
    });

    await ordenFabricacion.save();

    pedido.estado = 'en_fabricacion';
    pedido.fechaInicioFabricacion = new Date();
    await pedido.save();

    const ordenCompleta = await OrdenFabricacion.findById(ordenFabricacion._id)
      .populate('pedido', 'numero total')
      .populate('fabricante', 'nombre apellido');

    logger.info('Orden de fabricación creada desde pedido', {
      controlador: 'fabricacionController',
      accion: 'crearOrdenDesdePedido',
      ordenId: ordenCompleta?._id,
      pedidoId: pedido._id,
      usuarioId: req.usuario?._id,
      prioridad,
      tiemposFabricacion
    });

    return res.status(201).json({
      message: 'Orden de fabricación creada exitosamente',
      orden: ordenCompleta,
      tiempos: tiemposFabricacion
    });
  } catch (error) {
    logger.error('Error creando orden de fabricación', {
      controlador: 'fabricacionController',
      accion: 'crearOrdenDesdePedido',
      pedidoId: req.params?.pedidoId,
      body: req.body,
      error: error.message,
      stack: error.stack
    });

    return res.status(500).json({
      message: 'Error interno del servidor al crear orden de fabricación',
      error: error.message
    });
  }
}

async function actualizarEstadoOrden(req, res) {
  try {
    const { id } = req.params;
    const { estado, observaciones = '', fechaCompletado = null } = req.body || {};

    if (!ESTADOS_VALIDOS_ORDEN.includes(estado)) {
      return res.status(400).json({
        message: 'Estado no válido. Estados permitidos: ' + ESTADOS_VALIDOS_ORDEN.join(', ')
      });
    }

    const orden = await OrdenFabricacion.findById(id);
    if (!orden) {
      return res.status(404).json({ message: 'Orden de fabricación no encontrada' });
    }

    const estadoAnterior = orden.estado;
    orden.estado = estado;

    if (estado === 'en_proceso' && estadoAnterior === 'pendiente') {
      orden.fechaInicioReal = new Date();
    }

    if (estado === 'terminado') {
      orden.fechaFinReal = fechaCompletado ? new Date(fechaCompletado) : new Date();

      await Pedido.findByIdAndUpdate(orden.pedido, {
        estado: 'fabricado',
        fechaFinFabricacion: orden.fechaFinReal
      });
    }

    if (observaciones) {
      orden.notas = orden.notas || [];
      orden.notas.push({
        fecha: new Date(),
        usuario: req.usuario?._id,
        contenido: observaciones,
        tipo: 'fabricacion'
      });
    }

    await orden.save();

    const ordenActualizada = await OrdenFabricacion.findById(id)
      .populate('pedido', 'numero')
      .populate('fabricante', 'nombre apellido');

    logger.info('Estado de orden de fabricación actualizado', {
      controlador: 'fabricacionController',
      accion: 'actualizarEstadoOrden',
      ordenId: id,
      estadoAnterior,
      nuevoEstado: estado,
      usuarioId: req.usuario?._id
    });

    return res.json({
      message: 'Estado actualizado exitosamente',
      orden: ordenActualizada
    });
  } catch (error) {
    logger.error('Error actualizando estado de fabricación', {
      controlador: 'fabricacionController',
      accion: 'actualizarEstadoOrden',
      ordenId: req.params?.id,
      nuevoEstado: req.body?.estado,
      error: error.message,
      stack: error.stack
    });

    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

function normalizarProductoParaOrden(producto) {
  const base = producto?.toObject ? producto.toObject() : producto;
  if (!base) return {};

  const especificacionesTecnicas = {
    tipoInstalacion: base.tipoInstalacion,
    tipoSoporte: base.tipoSoporte,
    orientacion: base.orientacion,
    exposicionSolar: base.exposicionSolar,
    tipoViento: base.tipoViento,
    requiereR24: base.requiereR24 || base?.medidas?.ancho > 2.5 || base?.medidas?.alto > 2.5,
    tiempoFabricacionEstimado: base.tiempoFabricacion || calcularTiempoProducto(base),
    motorizado: base.motorizado,
    esToldo: base.esToldo
  };

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
    requiereR24: especificacionesTecnicas.requiereR24,
    especificacionesTecnicas,
    materiales: base.materiales || [],
    instrucciones: base.instrucciones || [],
    estadoFabricacion: base.estadoFabricacion || 'pendiente'
  };
}

function calcularTiemposFabricacion(productos) {
  let tiempoTotal = 0;
  const detalles = [];

  for (const producto of productos || []) {
    let tiempoProducto = calcularTiempoProducto(producto);

    const cantidad = producto?.cantidad || 1;
    const tiempoTotalProducto = tiempoProducto * cantidad;
    tiempoTotal += tiempoTotalProducto;

    detalles.push({
      ubicacion: producto?.ubicacion,
      tiempoUnitario: tiempoProducto,
      cantidad,
      tiempoTotal: tiempoTotalProducto
    });
  }

  return {
    total: Math.max(tiempoTotal, 1),
    detalles
  };
}

function calcularTiempoProducto(producto = {}) {
  let tiempo = 1;

  if (producto.esToldo) tiempo += 2;
  if (producto.motorizado) tiempo += 1;
  if (producto.requiereR24 || producto?.medidas?.ancho > 2.5 || producto?.medidas?.alto > 2.5) {
    tiempo += 1;
  }

  return tiempo;
}

function calcularFechaFinEstimada(fechaInicio, diasFabricacion) {
  const fecha = new Date(fechaInicio);
  fecha.setDate(fecha.getDate() + diasFabricacion);
  return fecha;
}

module.exports = {
  obtenerColaFabricacion,
  obtenerMetricasFabricacion,
  crearOrdenDesdePedido,
  actualizarEstadoOrden,
  // Exportar helpers para facilitar pruebas si es necesario
  __test__: {
    normalizarProductoParaOrden,
    calcularTiemposFabricacion,
    calcularTiempoProducto,
    calcularFechaFinEstimada
  }
};

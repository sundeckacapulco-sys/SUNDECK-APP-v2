const FabricacionService = require('../services/fabricacionService');
const CotizacionMappingService = require('../services/cotizacionMappingService');
const OrdenProduccionService = require('../services/ordenProduccionService');
const Pedido = require('../models/Pedido');
const OrdenFabricacion = require('../models/OrdenFabricacion');
const logger = require('../config/logger');
const eventBus = require('../services/eventBusService');

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

    let pedidoEvento = null;
    let datosEventoFabricacion = null;

    if (estado === 'terminado') {
      orden.fechaFinReal = fechaCompletado ? new Date(fechaCompletado) : new Date();

      pedidoEvento = await Pedido.findByIdAndUpdate(orden.pedido, {
        estado: 'fabricado',
        fechaFinFabricacion: orden.fechaFinReal
      }, { new: true }).populate('prospecto', 'nombre telefono direccion email');

      datosEventoFabricacion = {
        fabricacionId: orden._id,
        pedidoId: pedidoEvento?._id,
        numero: orden.numero,
        productos: orden.productos,
        cliente: {
          nombre: pedidoEvento?.prospecto?.nombre,
          telefono: pedidoEvento?.prospecto?.telefono,
          direccion: pedidoEvento?.direccionEntrega || {}
        },
        fechaInicio: orden.fechaInicioReal || orden.fechaInicioEstimada,
        fechaFin: orden.fechaFinReal,
        tiempoTotal: orden.fechaFinReal && (orden.fechaInicioReal || orden.fechaInicioEstimada)
          ? Math.max(1, Math.ceil((orden.fechaFinReal - (orden.fechaInicioReal || orden.fechaInicioEstimada)) / (1000 * 60 * 60 * 24)))
          : null,
        prioridad: orden.prioridad || 'normal'
      };
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
      .populate({
        path: 'pedido',
        select: 'numero prospecto productos estado fechaInstalacion fechaEntrega direccionEntrega contactoEntrega',
        populate: { path: 'prospecto', select: 'nombre telefono email direccion' }
      })
      .populate('fabricante', 'nombre apellido');

    logger.info('Estado de orden de fabricación actualizado', {
      controlador: 'fabricacionController',
      accion: 'actualizarEstadoOrden',
      ordenId: id,
      estadoAnterior,
      nuevoEstado: estado,
      usuarioId: req.usuario?._id
    });

    if (datosEventoFabricacion) {
      await eventBus.emit('fabricacion.completada', {
        ...datosEventoFabricacion,
        pedidoId: datosEventoFabricacion.pedidoId || ordenActualizada.pedido?._id,
        productos: ordenActualizada.productos,
        cliente: datosEventoFabricacion.cliente || {
          nombre: ordenActualizada.pedido?.prospecto?.nombre,
          telefono: ordenActualizada.pedido?.prospecto?.telefono,
          direccion: ordenActualizada.pedido?.direccionEntrega
        }
      }, 'fabricacionController', req.usuario?._id || null);
    }

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

  // ⭐ USAR ESPECIFICACIONES TÉCNICAS DEL PEDIDO (13 campos desde levantamiento)
  const especificacionesTecnicas = base.especificacionesTecnicas || {
    sistema: base.sistema || [],
    control: base.control || '',
    tipoInstalacion: base.tipoInstalacion || '',
    tipoFijacion: base.tipoFijacion || '',
    caida: base.caida || '',
    galeria: base.galeria || '',
    telaMarca: base.telaMarca || base.material || '',
    baseTabla: base.baseTabla || '',
    modoOperacion: base.modoOperacion || '',
    detalleTecnico: base.detalleTecnico || '',
    traslape: base.traslape || '',
    modeloCodigo: base.modeloCodigo || '',
    observacionesTecnicas: base.observacionesTecnicas || base.observaciones || ''
  };

  // Agregar información adicional de fabricación
  especificacionesTecnicas.requiereR24 = base.requiereR24 || base?.medidas?.ancho > 2.5 || base?.medidas?.alto > 2.5;
  especificacionesTecnicas.tiempoFabricacionEstimado = base.tiempoFabricacion || calcularTiempoProducto(base);
  especificacionesTecnicas.motorizado = base.motorizado || false;
  especificacionesTecnicas.esToldo = base.esToldo || false;

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
    estadoFabricacion: base.estadoFabricacion || 'pendiente',
    
    // Metadata de trazabilidad
    partidaOriginal: base.partidaOriginal || null,
    piezaOriginal: base.piezaOriginal || null
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

/**
 * Generar orden de producción con integración de almacén
 */
async function generarOrdenProduccionConAlmacen(req, res) {
  try {
    const { proyectoId } = req.params;
    const usuarioId = req.user?._id;
    
    logger.info('Generando orden de producción con almacén', {
      controlador: 'fabricacionController',
      accion: 'generarOrdenProduccionConAlmacen',
      proyectoId,
      usuarioId
    });
    
    // Procesar orden con almacén integrado
    const resultado = await OrdenProduccionService.procesarOrdenConAlmacen(
      proyectoId,
      usuarioId
    );
    
    if (!resultado.success) {
      logger.warn('Stock insuficiente para orden de producción', {
        controlador: 'fabricacionController',
        proyectoId,
        faltantes: resultado.etapas?.verificacion?.faltantes
      });
      
      return res.status(400).json({
        success: false,
        message: 'No hay stock suficiente para procesar la orden',
        faltantes: resultado.etapas?.verificacion?.faltantes || [],
        advertencias: resultado.etapas?.verificacion?.advertencias || []
      });
    }
    
    logger.info('Orden de producción generada exitosamente', {
      controlador: 'fabricacionController',
      proyectoId,
      materialesUsados: resultado.materiales?.length || 0,
      sobrantesGenerados: resultado.sobrantes?.length || 0
    });
    
    return res.json({
      success: true,
      message: 'Orden de producción procesada exitosamente',
      data: {
        materiales: resultado.materiales,
        sobrantes: resultado.sobrantes,
        etapas: resultado.etapas,
        resumen: {
          materialesUsados: resultado.materiales?.length || 0,
          sobrantesGenerados: resultado.sobrantes?.length || 0,
          barrasNuevas: resultado.etapas?.optimizacion?.resumen?.barrasNuevas || 0,
          sobrantesReutilizados: resultado.etapas?.optimizacion?.resumen?.sobrantesReutilizados || 0,
          eficienciaGlobal: resultado.etapas?.optimizacion?.resumen?.eficienciaGlobal || 0
        }
      }
    });
    
  } catch (error) {
    logger.error('Error generando orden de producción', {
      controlador: 'fabricacionController',
      accion: 'generarOrdenProduccionConAlmacen',
      proyectoId: req.params?.proyectoId,
      error: error.message,
      stack: error.stack
    });
    
    return res.status(500).json({
      success: false,
      message: 'Error generando orden de producción',
      error: error.message
    });
  }
}

module.exports = {
  obtenerColaFabricacion,
  obtenerMetricasFabricacion,
  crearOrdenDesdePedido,
  actualizarEstadoOrden,
  generarOrdenProduccionConAlmacen,
  // Exportar helpers para facilitar pruebas si es necesario
  __test__: {
    normalizarProductoParaOrden,
    calcularTiemposFabricacion,
    calcularTiempoProducto,
    calcularFechaFinEstimada
  }
};

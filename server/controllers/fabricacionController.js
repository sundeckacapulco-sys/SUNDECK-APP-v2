const Pedido = require('../models/Pedido');
const Proyecto = require('../models/Proyecto');
const OrdenFabricacion = require('../models/OrdenFabricacion');
const FabricacionService = require('../services/fabricacionService');
const CotizacionMappingService = require('../services/cotizacionMappingService');
const OrdenProduccionService = require('../services/ordenProduccionService');
const AlmacenProduccionService = require('../services/almacenProduccionService');
const OptimizadorCortesService = require('../services/optimizadorCortesService');
const PDFOrdenFabricacionService = require('../services/pdfOrdenFabricacionService');
const PDFListaPedidoV3Service = require('../services/pdfListaPedidoV3Service');
const logger = require('../config/logger');
const eventBus = require('../services/eventBusService');

// Etapas válidas de fabricación
const ETAPAS_FABRICACION = ['corte', 'armado', 'ensamble', 'revision', 'empaque'];
const ESTADOS_ETAPA = ['pendiente', 'en_proceso', 'completado'];
const ESTADOS_REVISION = ['pendiente', 'en_proceso', 'aprobado', 'rechazado'];

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

/**
 * Generar y descargar PDF de LISTA DE PEDIDO (para proveedores)
 */
async function descargarPDFListaPedido(req, res) {
  try {
    const { proyectoId } = req.params;
    
    logger.info('Generando PDF de lista de pedido', {
      controlador: 'fabricacionController',
      accion: 'descargarPDFListaPedido',
      proyectoId
    });
    
    // Obtener datos de la orden
    const datosOrden = await OrdenProduccionService.obtenerDatosOrdenProduccion(proyectoId);
    
    // Generar PDF de lista de pedido (solo materiales)
    const pdfBuffer = await PDFListaPedidoV3Service.generarPDF(
      datosOrden
    );
    
    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Lista-Pedido-${datosOrden.proyecto.numero}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);
    
    logger.info('PDF de lista de pedido generado exitosamente', {
      controlador: 'fabricacionController',
      accion: 'descargarPDFListaPedido',
      proyectoId,
      tamano: pdfBuffer.length
    });
    
  } catch (error) {
    logger.error('Error generando PDF de lista de pedido', {
      controlador: 'fabricacionController',
      accion: 'descargarPDFListaPedido',
      proyectoId: req.params?.proyectoId,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      message: 'Error generando PDF de lista de pedido',
      error: error.message
    });
  }
}

/**
 * Generar y descargar PDF de ORDEN DE TALLER (con especificaciones técnicas)
 */
async function descargarPDFOrdenTaller(req, res) {
  try {
    const { proyectoId } = req.params;
    
    logger.info('Generando PDF de orden de taller', {
      controlador: 'fabricacionController',
      accion: 'descargarPDFOrdenTaller',
      proyectoId
    });
    
    // Obtener datos de la orden
    const datosOrden = await OrdenProduccionService.obtenerDatosOrdenProduccion(proyectoId);
    
    // Generar PDF completo (con especificaciones técnicas)
    const pdfBuffer = await PDFOrdenFabricacionService.generarPDF(
      datosOrden,
      datosOrden.listaPedido
    );
    
    // Configurar headers para visualización inline (no descarga automática)
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Orden-Taller-${datosOrden.proyecto.numero}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    // Usar write + end para asegurar que el buffer se envíe completo
    res.write(pdfBuffer);
    res.end();
    
    logger.info('PDF de orden de taller generado exitosamente', {
      controlador: 'fabricacionController',
      accion: 'descargarPDFOrdenTaller',
      proyectoId,
      tamano: pdfBuffer.length
    });
    
  } catch (error) {
    logger.error('Error generando PDF de orden de taller', {
      controlador: 'fabricacionController',
      accion: 'descargarPDFOrdenTaller',
      proyectoId: req.params?.proyectoId,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      message: 'Error generando PDF de orden de taller',
      error: error.message
    });
  }
}

/**
 * Obtener PDF de ORDEN DE TALLER como base64 (evita que IDM intercepte)
 * POST /api/fabricacion/orden-taller/:proyectoId/base64
 */
async function obtenerPDFOrdenTallerBase64(req, res) {
  try {
    const { proyectoId } = req.params;
    
    logger.info('Generando PDF de orden de taller (base64)', {
      controlador: 'fabricacionController',
      accion: 'obtenerPDFOrdenTallerBase64',
      proyectoId
    });
    
    // Obtener datos de la orden
    const datosOrden = await OrdenProduccionService.obtenerDatosOrdenProduccion(proyectoId);
    
    // Generar PDF completo
    const pdfBuffer = await PDFOrdenFabricacionService.generarPDF(
      datosOrden,
      datosOrden.listaPedido
    );
    
    // Convertir a base64
    const base64 = pdfBuffer.toString('base64');
    
    logger.info('PDF de orden de taller (base64) generado exitosamente', {
      controlador: 'fabricacionController',
      accion: 'obtenerPDFOrdenTallerBase64',
      proyectoId,
      tamano: pdfBuffer.length
    });
    
    // Devolver como JSON (IDM no intercepta JSON)
    res.json({
      success: true,
      pdf: base64,
      filename: `Orden-Taller-${datosOrden.proyecto.numero}.pdf`,
      size: pdfBuffer.length
    });
    
  } catch (error) {
    logger.error('Error generando PDF de orden de taller (base64)', {
      controlador: 'fabricacionController',
      accion: 'obtenerPDFOrdenTallerBase64',
      proyectoId: req.params?.proyectoId,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      message: 'Error generando PDF de orden de taller',
      error: error.message
    });
  }
}

// ===== ENDPOINTS PARA 5 ETAPAS DE FABRICACIÓN =====

/**
 * Obtener estado de etapas de un proyecto
 * GET /api/proyectos/:id/fabricacion/etapas
 */
async function obtenerEtapasFabricacion(req, res) {
  try {
    const { id } = req.params;
    
    const proyecto = await Proyecto.findById(id)
      .select('fabricacion.etapas fabricacion.estado fabricacion.progreso cliente.nombre numero')
      .lean();
    
    if (!proyecto) {
      return res.status(404).json({ success: false, message: 'Proyecto no encontrado' });
    }
    
    // Calcular progreso por etapa
    const etapas = proyecto.fabricacion?.etapas || {};
    const resumenEtapas = ETAPAS_FABRICACION.map(nombre => {
      const etapa = etapas[nombre] || {};
      return {
        nombre,
        estado: etapa.estado || 'pendiente',
        fechaInicio: etapa.fechaInicio,
        fechaFin: etapa.fechaFin,
        fotos: etapa.fotos?.length || 0,
        comentarios: etapa.comentarios || '',
        codigoPieza: etapa.codigoPieza || ''
      };
    });
    
    // Calcular progreso general
    const completadas = resumenEtapas.filter(e => 
      e.estado === 'completado' || e.estado === 'aprobado'
    ).length;
    const progreso = Math.round((completadas / ETAPAS_FABRICACION.length) * 100);
    
    return res.json({
      success: true,
      data: {
        proyectoId: id,
        cliente: proyecto.cliente?.nombre,
        numero: proyecto.numero,
        estadoGeneral: proyecto.fabricacion?.estado || 'pendiente',
        progreso,
        etapas: resumenEtapas
      }
    });
    
  } catch (error) {
    logger.error('Error obteniendo etapas de fabricación', {
      controlador: 'fabricacionController',
      accion: 'obtenerEtapasFabricacion',
      proyectoId: req.params?.id,
      error: error.message
    });
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Actualizar estado de una etapa
 * PATCH /api/proyectos/:id/fabricacion/etapas/:etapa
 */
async function actualizarEtapaFabricacion(req, res) {
  try {
    const { id, etapa } = req.params;
    const { estado, comentarios, codigoPieza } = req.body;
    
    // Validar etapa
    if (!ETAPAS_FABRICACION.includes(etapa)) {
      return res.status(400).json({ 
        success: false, 
        message: `Etapa inválida. Válidas: ${ETAPAS_FABRICACION.join(', ')}` 
      });
    }
    
    // Validar estado
    const estadosValidos = etapa === 'revision' ? ESTADOS_REVISION : ESTADOS_ETAPA;
    if (estado && !estadosValidos.includes(estado)) {
      return res.status(400).json({ 
        success: false, 
        message: `Estado inválido. Válidos: ${estadosValidos.join(', ')}` 
      });
    }
    
    const proyecto = await Proyecto.findById(id);
    if (!proyecto) {
      return res.status(404).json({ success: false, message: 'Proyecto no encontrado' });
    }
    
    // Inicializar estructura si no existe
    if (!proyecto.fabricacion) proyecto.fabricacion = {};
    if (!proyecto.fabricacion.etapas) proyecto.fabricacion.etapas = {};
    if (!proyecto.fabricacion.etapas[etapa]) proyecto.fabricacion.etapas[etapa] = {};
    
    const etapaActual = proyecto.fabricacion.etapas[etapa];
    const estadoAnterior = etapaActual.estado;
    
    // Actualizar campos
    if (estado) {
      etapaActual.estado = estado;
      
      // Registrar fechas automáticamente
      if (estado === 'en_proceso' && !etapaActual.fechaInicio) {
        etapaActual.fechaInicio = new Date();
      }
      if (['completado', 'aprobado'].includes(estado)) {
        etapaActual.fechaFin = new Date();
      }
    }
    
    if (comentarios !== undefined) etapaActual.comentarios = comentarios;
    if (codigoPieza !== undefined) etapaActual.codigoPieza = codigoPieza;
    if (req.usuario?._id) etapaActual.responsable = req.usuario._id;
    
    // Recalcular progreso general
    const etapas = proyecto.fabricacion.etapas;
    const completadas = ETAPAS_FABRICACION.filter(e => {
      const est = etapas[e]?.estado;
      return est === 'completado' || est === 'aprobado';
    }).length;
    proyecto.fabricacion.progreso = Math.round((completadas / ETAPAS_FABRICACION.length) * 100);
    
    // Actualizar estado general si todas completadas
    if (completadas === ETAPAS_FABRICACION.length) {
      proyecto.fabricacion.estado = 'terminado';
      proyecto.fabricacion.fechaFinFabricacion = new Date();
      
      // Emitir evento de fabricación completada
      await eventBus.emit('fabricacion.completada', {
        proyectoId: id,
        numero: proyecto.numero,
        cliente: proyecto.cliente?.nombre
      }, 'fabricacionController', req.usuario?._id);
    }
    
    proyecto.fabricacion.fechaUltimaActualizacion = new Date();
    await proyecto.save();
    
    logger.info('Etapa de fabricación actualizada', {
      controlador: 'fabricacionController',
      accion: 'actualizarEtapaFabricacion',
      proyectoId: id,
      etapa,
      estadoAnterior,
      nuevoEstado: estado,
      progreso: proyecto.fabricacion.progreso
    });
    
    return res.json({
      success: true,
      message: `Etapa ${etapa} actualizada`,
      data: {
        etapa,
        estado: etapaActual.estado,
        progreso: proyecto.fabricacion.progreso
      }
    });
    
  } catch (error) {
    logger.error('Error actualizando etapa de fabricación', {
      controlador: 'fabricacionController',
      accion: 'actualizarEtapaFabricacion',
      proyectoId: req.params?.id,
      etapa: req.params?.etapa,
      error: error.message
    });
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Subir foto a una etapa
 * POST /api/proyectos/:id/fabricacion/etapas/:etapa/fotos
 */
async function subirFotoEtapa(req, res) {
  try {
    const { id, etapa } = req.params;
    const { url, descripcion } = req.body;
    
    if (!ETAPAS_FABRICACION.includes(etapa)) {
      return res.status(400).json({ success: false, message: 'Etapa inválida' });
    }
    
    if (!url) {
      return res.status(400).json({ success: false, message: 'URL de foto requerida' });
    }
    
    const proyecto = await Proyecto.findById(id);
    if (!proyecto) {
      return res.status(404).json({ success: false, message: 'Proyecto no encontrado' });
    }
    
    // Inicializar estructura
    if (!proyecto.fabricacion) proyecto.fabricacion = {};
    if (!proyecto.fabricacion.etapas) proyecto.fabricacion.etapas = {};
    if (!proyecto.fabricacion.etapas[etapa]) proyecto.fabricacion.etapas[etapa] = {};
    if (!proyecto.fabricacion.etapas[etapa].fotos) proyecto.fabricacion.etapas[etapa].fotos = [];
    
    // Agregar foto
    proyecto.fabricacion.etapas[etapa].fotos.push({
      url,
      descripcion: descripcion || '',
      fechaSubida: new Date(),
      subidaPor: req.usuario?._id
    });
    
    proyecto.fabricacion.fechaUltimaActualizacion = new Date();
    await proyecto.save();
    
    logger.info('Foto subida a etapa de fabricación', {
      controlador: 'fabricacionController',
      accion: 'subirFotoEtapa',
      proyectoId: id,
      etapa,
      totalFotos: proyecto.fabricacion.etapas[etapa].fotos.length
    });
    
    return res.json({
      success: true,
      message: 'Foto agregada exitosamente',
      data: {
        etapa,
        totalFotos: proyecto.fabricacion.etapas[etapa].fotos.length
      }
    });
    
  } catch (error) {
    logger.error('Error subiendo foto a etapa', {
      controlador: 'fabricacionController',
      accion: 'subirFotoEtapa',
      proyectoId: req.params?.id,
      etapa: req.params?.etapa,
      error: error.message
    });
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Obtener fotos de una etapa
 * GET /api/proyectos/:id/fabricacion/etapas/:etapa/fotos
 */
async function obtenerFotosEtapa(req, res) {
  try {
    const { id, etapa } = req.params;
    
    if (!ETAPAS_FABRICACION.includes(etapa)) {
      return res.status(400).json({ success: false, message: 'Etapa inválida' });
    }
    
    const proyecto = await Proyecto.findById(id)
      .select(`fabricacion.etapas.${etapa}.fotos`)
      .populate(`fabricacion.etapas.${etapa}.fotos.subidaPor`, 'nombre apellido')
      .lean();
    
    if (!proyecto) {
      return res.status(404).json({ success: false, message: 'Proyecto no encontrado' });
    }
    
    const fotos = proyecto.fabricacion?.etapas?.[etapa]?.fotos || [];
    
    return res.json({
      success: true,
      data: {
        etapa,
        fotos
      }
    });
    
  } catch (error) {
    logger.error('Error obteniendo fotos de etapa', {
      controlador: 'fabricacionController',
      accion: 'obtenerFotosEtapa',
      proyectoId: req.params?.id,
      etapa: req.params?.etapa,
      error: error.message
    });
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  obtenerColaFabricacion,
  obtenerMetricasFabricacion,
  crearOrdenDesdePedido,
  actualizarEstadoOrden,
  generarOrdenProduccionConAlmacen,
  descargarPDFListaPedido,
  descargarPDFOrdenTaller,
  obtenerPDFOrdenTallerBase64,
  // Nuevos endpoints de etapas
  obtenerEtapasFabricacion,
  actualizarEtapaFabricacion,
  subirFotoEtapa,
  obtenerFotosEtapa,
  // Exportar helpers para facilitar pruebas si es necesario
  __test__: {
    normalizarProductoParaOrden,
    calcularTiemposFabricacion,
    calcularTiempoProducto,
    calcularFechaFinEstimada,
    ETAPAS_FABRICACION
  }
};

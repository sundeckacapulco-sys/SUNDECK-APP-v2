const Proyecto = require('../models/Proyecto');
const Prospecto = require('../models/Prospecto');
const Cotizacion = require('../models/Cotizacion');
const mongoose = require('mongoose');
const pdfService = require('../services/pdfService');
const excelService = require('../services/excelService');
const logger = require('../config/logger');
const qrCodeGenerator = require('../utils/qrcodeGenerator');
const notificacionService = require('../services/notificacionService');

const toNumber = (value, defaultValue = 0) => {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : defaultValue;
};

const roundNumber = (value, decimals = 2) => {
  const factor = 10 ** decimals;
  return Math.round(toNumber(value) * factor) / factor;
};

// FASE 5: Generación de PDF
const generarPDFProyecto = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo, documentoId } = req.query;

    if (!tipo) {
      return res.status(400).json({
        success: false,
        message: 'Debes especificar el tipo de documento a generar.'
      });
    }

    logger.info('Generando PDF de proyecto', { proyectoId: id, tipo });

    let pdfBuffer;

    if (tipo === 'cotizacion') {
      if (!documentoId) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere el ID de la cotización para generar el PDF.'
        });
      }
      pdfBuffer = await pdfService.generarPDFCotizacion(id, documentoId);
    } else if (tipo === 'levantamiento') {
      pdfBuffer = await pdfService.generarPDFLevantamiento(id);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Tipo de documento no válido'
      });
    }

    logger.info('PDF generado exitosamente', {
      proyectoId: id,
      tipo,
      documentoId: documentoId || null,
      userId: req.usuario?.id
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${tipo}-${id}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error) {
    logger.logError(error, {
      context: 'generarPDFProyecto',
      proyectoId: req.params.id,
      tipo: req.query.tipo,
      userId: req.usuario?.id
    });
    res.status(500).json({
      success: false,
      message: 'Error al generar el PDF',
      error: error.message
    });
  }
};

// Generación de Excel para Levantamiento
const generarExcelLevantamiento = async (req, res) => {
  try {
    const { id } = req.params;

    logger.info('Generando Excel de levantamiento', { proyectoId: id });

    // Obtener el proyecto con sus datos
    const proyecto = await Proyecto.findById(id).populate('prospecto_original');
    
    if (!proyecto) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    // Obtener datos del levantamiento
    const partidas = proyecto.levantamiento?.partidas || [];
    const prospecto = proyecto.prospecto_original || proyecto.cliente || {};
    const precioGeneral = proyecto.levantamiento?.precioGeneral || 0;
    const totalM2 = proyecto.levantamiento?.totalM2 || 0;
    const unidadMedida = proyecto.levantamiento?.unidadMedida || 'm';

    // Generar Excel usando el servicio
    const excelBuffer = await excelService.generarLevantamientoExcel(
      prospecto,
      partidas,
      precioGeneral,
      totalM2,
      unidadMedida,
      'levantamiento' // tipo de visita
    );

    logger.info('Excel generado exitosamente', {
      proyectoId: id,
      tipo: 'levantamiento',
      userId: req.usuario?.id
    });

    const clienteNombre = prospecto?.nombre || proyecto.cliente?.nombre || id;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Levantamiento-${clienteNombre}.xlsx"`
    );
    res.send(excelBuffer);
  } catch (error) {
    logger.logError(error, {
      context: 'generarExcelLevantamiento',
      proyectoId: req.params.id,
      userId: req.usuario?.id
    });
    res.status(500).json({
      success: false,
      message: 'Error al generar el Excel',
      error: error.message
    });
  }
};

const normalizarPartidas = (partidas = [], { incluirPrecios = false } = {}) => {
  return partidas.map(partida => {
    const piezas = (partida.piezas || []).map(pieza => {
      const ancho = roundNumber(pieza.ancho, 4);
      const alto = roundNumber(pieza.alto, 4);
      const m2 = roundNumber(ancho * alto, 4);

      return {
        ancho,
        alto,
        m2,
        sistema: Array.isArray(pieza.sistema)
          ? pieza.sistema.filter(Boolean).join(', ')
          : (pieza.sistema || ''),
        control: pieza.control || pieza.tipoControl || '',
        instalacion: pieza.instalacion || pieza.tipoInstalacion || '',
        fijacion: pieza.fijacion || pieza.tipoFijacion || '',
        caida: pieza.caida || pieza.orientacion || '',
        galeria: pieza.galeria || '',
        telaMarca: pieza.telaMarca || '',
        baseTabla: pieza.baseTabla || '',
        operacion: pieza.operacion || pieza.modoOperacion || '',
        detalle: pieza.detalle || pieza.detalleTecnico || '',
        traslape: pieza.traslape || '',
        modeloCodigo: pieza.modeloCodigo || partida.modelo || '',
        color: pieza.color || partida.color || '',
        observacionesTecnicas: pieza.observacionesTecnicas || '',
        precioM2: incluirPrecios ? roundNumber(pieza.precioM2 ?? partida.precioM2) : undefined
      };
    });

    const fallbackArea = piezas.reduce((sum, pieza) => sum + pieza.m2, 0);
    const areaTotal = roundNumber(partida?.totales?.m2 ?? fallbackArea);

    const subtotal = incluirPrecios
      ? roundNumber(partida?.totales?.subtotal ?? piezas.reduce((sum, pieza) => {
          if (pieza.precioM2 === undefined) return sum;
          return sum + (pieza.precioM2 * pieza.m2);
        }, 0))
      : 0;

    const costoMotorizacion = incluirPrecios
      ? roundNumber(partida?.totales?.costoMotorizacion)
      : 0;

    const costoInstalacion = incluirPrecios
      ? roundNumber(partida?.totales?.costoInstalacion)
      : 0;

    const motorizacionPayload = partida.motorizacion || {};
    const instalacionEspecialPayload = partida.instalacionEspecial || {};

    const cantidadNormalizada = Math.max(1, Math.round(toNumber(partida.cantidad, piezas.length || 1)));
    const cantidadMotoresNormalizada = Math.max(
      0,
      Math.round(
        toNumber(
          motorizacionPayload.cantidadMotores ?? motorizacionPayload.numMotores,
          0
        )
      )
    );
    const piezasPorControlNormalizado = Math.max(
      0,
      Math.round(toNumber(motorizacionPayload.piezasPorControl, 0))
    );

    return {
      ubicacion: partida.ubicacion || '',
      producto: partida.producto || '',
      color: partida.color || '',
      modelo: partida.modelo || partida.modeloCodigo || '',
      cantidad: cantidadNormalizada,
      piezas,
      motorizacion: {
        activa: Boolean(motorizacionPayload.activa),
        modeloMotor: motorizacionPayload.modeloMotor || '',
        precioMotor: incluirPrecios ? roundNumber(motorizacionPayload.precioMotor) : 0,
        cantidadMotores: cantidadMotoresNormalizada,
        modeloControl: motorizacionPayload.modeloControl || '',
        precioControl: incluirPrecios ? roundNumber(motorizacionPayload.precioControl) : 0,
        tipoControl: motorizacionPayload.tipoControl || '',
        piezasPorControl: piezasPorControlNormalizado
      },
      instalacionEspecial: {
        activa: Boolean(instalacionEspecialPayload.activa),
        tipoCobro: instalacionEspecialPayload.tipoCobro || '',
        precioBase: incluirPrecios ? roundNumber(instalacionEspecialPayload.precioBase) : 0,
        precioPorPieza: incluirPrecios ? roundNumber(instalacionEspecialPayload.precioPorPieza) : 0,
        observaciones: instalacionEspecialPayload.observaciones || ''
      },
      totales: {
        m2: areaTotal,
        subtotal,
        costoMotorizacion,
        costoInstalacion
      }
    };
  });
};

const construirTotalesProyecto = (partidasNormalizadas, totalesPayload = {}) => {
  const areaCalculada = partidasNormalizadas.reduce(
    (sum, partida) => sum + (partida.totales?.m2 || 0),
    0
  );
  const subtotalCalculado = partidasNormalizadas.reduce(
    (sum, partida) => sum + (partida.totales?.subtotal || 0),
    0
  );

  const resumen = {
    m2: roundNumber(totalesPayload.m2 ?? areaCalculada),
    subtotal: roundNumber(totalesPayload.subtotal ?? subtotalCalculado),
    descuento: roundNumber(totalesPayload.descuento),
    iva: roundNumber(totalesPayload.iva)
  };

  const totalCalculado = resumen.subtotal - resumen.descuento + resumen.iva;
  resumen.total = roundNumber(totalesPayload.total ?? totalCalculado);

  return resumen;
};

const construirRegistroMedidas = (
  partidasNormalizadas,
  { personaVisita = '', observaciones = '', incluirPrecios = false }
) => {
  const totalPartidas = partidasNormalizadas.length;
  const totalPiezas = partidasNormalizadas.reduce(
    (sum, partida) => sum + (partida.piezas?.length || 0),
    0
  );
  const areaTotal = partidasNormalizadas.reduce(
    (sum, partida) => sum + (partida.totales?.m2 || 0),
    0
  );
  const precioTotal = partidasNormalizadas.reduce(
    (sum, partida) => sum + (partida.totales?.subtotal || 0),
    0
  );

  return {
    tipo: 'levantamiento',
    personaVisita,
    observacionesGenerales: observaciones,
    fechaHora: new Date(),
    esPartidasV2: true,
    piezas: partidasNormalizadas.map(partida => ({
      ubicacion: partida.ubicacion,
      cantidad: partida.cantidad,
      producto: partida.producto,
      productoLabel: partida.producto,
      modeloCodigo: partida.modelo,
      color: partida.color,
      observaciones: partida.observaciones || '',
      areaTotal: roundNumber(partida.totales?.m2 || 0),
      precioTotal: incluirPrecios ? roundNumber(partida.totales?.subtotal || 0) : undefined,
      totalPiezas: partida.piezas?.length || 0,
      motorizado: partida.motorizacion?.activa || false,
      motorModelo: partida.motorizacion?.modeloMotor,
      motorPrecio: incluirPrecios ? partida.motorizacion?.precioMotor : undefined,
      controlModelo: partida.motorizacion?.modeloControl,
      controlPrecio: incluirPrecios ? partida.motorizacion?.precioControl : undefined,
      medidas: partida.piezas.map(medida => ({
        ancho: medida.ancho,
        alto: medida.alto,
        producto: partida.producto,
        productoLabel: partida.producto,
        modeloCodigo: medida.modeloCodigo,
        color: medida.color,
        galeria: medida.galeria,
        tipoControl: medida.control,
        caida: medida.caida,
        tipoInstalacion: medida.instalacion,
        tipoFijacion: medida.fijacion,
        modoOperacion: medida.operacion,
        detalleTecnico: medida.detalle,
        sistema: medida.sistema,
        telaMarca: medida.telaMarca,
        baseTabla: medida.baseTabla,
        observacionesTecnicas: medida.observacionesTecnicas,
        traslape: medida.traslape,
        precioM2: incluirPrecios ? medida.precioM2 : undefined
      }))
    })),
    totales: {
      totalPartidas,
      totalPiezas,
      areaTotal: roundNumber(areaTotal),
      precioTotal: incluirPrecios ? roundNumber(precioTotal) : undefined
    }
  };
};

const normalizarPrecioReglas = (precioReglas = {}) => ({
  precio_m2: roundNumber(precioReglas.precio_m2),
  aplicaDescuento: Boolean(precioReglas.aplicaDescuento),
  tipoDescuento: precioReglas.tipoDescuento === 'monto' ? 'monto' : 'porcentaje',
  valorDescuento: roundNumber(precioReglas.valorDescuento)
});

const normalizarFacturacion = (facturacion = {}) => ({
  requiereFactura: Boolean(facturacion.requiereFactura),
  razonSocial: facturacion.razonSocial ? String(facturacion.razonSocial).trim() : '',
  rfc: facturacion.rfc ? String(facturacion.rfc).trim() : ''
});

const construirProductosDesdePartidas = partidasNormalizadas => {
  return partidasNormalizadas.map(partida => {
    const area = roundNumber(partida.totales?.m2 || 0);
    const subtotal = roundNumber(partida.totales?.subtotal || 0);
    const cantidad = toNumber(partida.cantidad, 1) || 1;
    const precioM2 = area > 0 ? roundNumber(subtotal / area) : 0;
    const precioUnitario = cantidad > 0 ? roundNumber(subtotal / cantidad) : subtotal;

    return {
      ubicacion: partida.ubicacion,
      cantidad,
      area,
      nombre: partida.producto,
      nombreProducto: partida.producto,
      productoLabel: partida.producto,
      modeloCodigo: partida.modelo,
      color: partida.color,
      precioM2,
      precioUnitario,
      subtotal,
      observaciones: '',
      medidas: {
        ancho: null,
        alto: null,
        area
      },
      motorizado: partida.motorizacion?.activa || false,
      motorModelo: partida.motorizacion?.modeloMotor,
      motorPrecio: partida.motorizacion?.precioMotor,
      controlModelo: partida.motorizacion?.modeloControl,
      controlPrecio: partida.motorizacion?.precioControl
    };
  });
};

const generarNumeroCotizacionSecuencial = async () => {
  const ultimaCotizacion = await Cotizacion.findOne({ numero: /^COT-\d{4}$/ })
    .sort({ createdAt: -1 })
    .lean();

  let secuencia = 1;
  if (ultimaCotizacion?.numero) {
    const match = ultimaCotizacion.numero.match(/COT-(\d{4})$/);
    if (match) {
      secuencia = parseInt(match[1], 10) + 1;
    }
  }

  return `COT-${String(secuencia).padStart(4, '0')}`;
};

// Crear nuevo proyecto
const crearProyecto = async (req, res) => {
  try {
    const {
      cliente,
      tipo_fuente,
      observaciones,
      medidas,
      materiales,
      productos,
      fotos,
      responsable,
      monto_estimado,
      prospecto_original
    } = req.body;

    // Validar datos requeridos
    if (!cliente || !cliente.nombre || !cliente.telefono) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y teléfono del cliente son requeridos'
      });
    }

    // Crear el proyecto
    const nuevoProyecto = new Proyecto({
      cliente,
      tipo_fuente: tipo_fuente || 'simple',
      observaciones,
      medidas: medidas || [],
      materiales: materiales || [],
      productos: productos || [],
      fotos: fotos || [],
      responsable,
      monto_estimado: monto_estimado || 0,
      prospecto_original,
      creado_por: req.usuario.id,
      actualizado_por: req.usuario.id
    });

    // Calcular totales automáticamente
    nuevoProyecto.subtotal = calcularSubtotal(nuevoProyecto);
    nuevoProyecto.iva = nuevoProyecto.subtotal * 0.16;
    nuevoProyecto.total = nuevoProyecto.subtotal + nuevoProyecto.iva;

    await nuevoProyecto.save();

    // Poblar referencias para la respuesta
    await nuevoProyecto.populate([
      { path: 'creado_por', select: 'nombre email' },
      { path: 'asesor_asignado', select: 'nombre email' },
      { path: 'prospecto_original', select: 'nombre telefono' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Proyecto creado exitosamente',
      data: nuevoProyecto
    });

  } catch (error) {
    logger.logError(error, {
      context: 'crearProyecto',
      body: req.body,
      userId: req.usuario?.id
    });
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener todos los proyectos con filtros y paginación
const obtenerProyectos = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      estado,
      tipo_fuente,
      asesor_asignado,
      busqueda,
      fechaDesde,
      fechaHasta
    } = req.query;

    // Construir filtros
    const filtros = {};
    
    if (estado) filtros.estado = estado;
    if (tipo_fuente) filtros.tipo_fuente = tipo_fuente;
    if (asesor_asignado) filtros.asesor_asignado = asesor_asignado;
    
    if (fechaDesde || fechaHasta) {
      filtros.fecha_creacion = {};
      if (fechaDesde) filtros.fecha_creacion.$gte = new Date(fechaDesde);
      if (fechaHasta) filtros.fecha_creacion.$lte = new Date(fechaHasta);
    }

    // Búsqueda por texto
    if (busqueda) {
      filtros.$or = [
        { 'cliente.nombre': { $regex: busqueda, $options: 'i' } },
        { 'cliente.telefono': { $regex: busqueda, $options: 'i' } },
        { 'cliente.correo': { $regex: busqueda, $options: 'i' } },
        { observaciones: { $regex: busqueda, $options: 'i' } }
      ];
    }

    // Si no es admin, solo ver sus proyectos asignados
    if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'gerente') {
      filtros.$or = [
        { creado_por: req.usuario.id },
        { asesor_asignado: req.usuario.id },
        { tecnico_asignado: req.usuario.id }
      ];
    }

    const opciones = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { fecha_creacion: -1 },
      populate: [
        { path: 'creado_por', select: 'nombre email' },
        { path: 'asesor_asignado', select: 'nombre email telefono' },
        { path: 'tecnico_asignado', select: 'nombre email telefono' },
        { path: 'prospecto_original', select: 'nombre telefono email etapa' }
      ]
    };

    const proyectos = await Proyecto.paginate(filtros, opciones);

    // Calcular estadísticas adicionales para cada proyecto
    const proyectosConEstadisticas = proyectos.docs.map(proyecto => {
      const proyectoObj = proyecto.toObject();
      
      // Calcular progreso
      const estados = ['levantamiento', 'cotizacion', 'aprobado', 'fabricacion', 'instalacion', 'completado'];
      const indiceEstado = estados.indexOf(proyecto.estado);
      const progreso = indiceEstado >= 0 ? Math.round((indiceEstado / (estados.length - 1)) * 100) : 0;
      
      // Calcular totales
      const totalArea = proyecto.medidas.reduce((sum, medida) => sum + ((medida.ancho || 0) * (medida.alto || 0) * (medida.cantidad || 1)), 0);
      const totalMedidas = proyecto.medidas.length;
      
      return {
        ...proyectoObj,
        estadisticas: {
          progreso,
          totalArea: parseFloat(totalArea.toFixed(2)),
          totalMedidas,
          diasTranscurridos: Math.ceil((new Date() - new Date(proyecto.fecha_creacion)) / (1000 * 60 * 60 * 24))
        }
      };
    });

    res.json({
      success: true,
      data: {
        ...proyectos,
        docs: proyectosConEstadisticas
      }
    });

  } catch (error) {
    logger.logError(error, {
      context: 'obtenerProyectos',
      query: req.query,
      userId: req.usuario?.id
    });
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener proyecto por ID
const obtenerProyectoPorId = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de proyecto inválido'
      });
    }

    const proyecto = await Proyecto.findById(id)
      .populate([
        { path: 'creado_por', select: 'nombre email' },
        { path: 'actualizado_por', select: 'nombre email' },
        { path: 'asesor_asignado', select: 'nombre email telefono' },
        { path: 'tecnico_asignado', select: 'nombre email telefono' },
        { path: 'prospecto_original', select: 'nombre telefono email direccion' },
        { path: 'cotizaciones', select: 'numero fecha_creacion subtotal total estado' },
        { path: 'pedidos', select: 'numero fecha_creacion total estado' },
        { path: 'ordenes_fabricacion', select: 'numero fecha_creacion estado' },
        { path: 'instalaciones', select: 'numero fecha_programada estado' }
      ]);

    if (!proyecto) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    res.json({
      success: true,
      data: proyecto
    });

  } catch (error) {
    logger.logError(error, {
      context: 'obtenerProyectoPorId',
      proyectoId: req.params.id,
      userId: req.usuario?.id
    });
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Actualizar proyecto
const actualizarProyecto = async (req, res) => {
  try {
    const { id } = req.params;
    const actualizaciones = req.body;

    logger.info('Actualizando proyecto', {
      proyectoId: id,
      hasActualizaciones: Object.keys(actualizaciones).length,
      hasMedidas: !!actualizaciones.medidas,
      medidasCount: actualizaciones.medidas?.length || 0
    });
    
    if (actualizaciones.medidas && actualizaciones.medidas.length > 0) {
      logger.debug('Medidas recibidas', {
        proyectoId: id,
        count: actualizaciones.medidas.length,
        primeraMedida: actualizaciones.medidas[0]
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de proyecto inválido'
      });
    }

    // Agregar información de auditoría
    actualizaciones.actualizado_por = req.usuario.id;
    actualizaciones.fecha_actualizacion = new Date();

    const proyecto = await Proyecto.findByIdAndUpdate(
      id,
      actualizaciones,
      { new: true, runValidators: true }
    ).populate([
      { path: 'creado_por', select: 'nombre email' },
      { path: 'actualizado_por', select: 'nombre email' },
      { path: 'asesor_asignado', select: 'nombre email' },
      { path: 'prospecto_original', select: 'nombre telefono' }
    ]);

    if (!proyecto) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    // Recalcular totales si se actualizaron productos o materiales
    if (actualizaciones.productos || actualizaciones.materiales || actualizaciones.medidas) {
      proyecto.subtotal = calcularSubtotal(proyecto);
      proyecto.iva = proyecto.subtotal * 0.16;
      proyecto.total = proyecto.subtotal + proyecto.iva;
      await proyecto.save();
    }

    logger.info('Proyecto actualizado exitosamente', {
      proyectoId: id,
      medidasGuardadas: proyecto.medidas?.length || 0,
      estado: proyecto.estado
    });

    res.json({
      success: true,
      message: 'Proyecto actualizado exitosamente',
      data: proyecto
    });

  } catch (error) {
    logger.logError(error, {
      context: 'actualizarProyecto',
      proyectoId: req.params.id,
      userId: req.usuario?.id
    });
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Cambiar estado del proyecto
const cambiarEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { nuevo_estado, observaciones } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de proyecto inválido'
      });
    }

    const estadosValidos = ['levantamiento', 'cotizacion', 'aprobado', 'fabricacion', 'instalacion', 'completado', 'cancelado'];
    
    if (!estadosValidos.includes(nuevo_estado)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido'
      });
    }

    const proyecto = await Proyecto.findById(id);
    
    if (!proyecto) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    const estadoAnterior = proyecto.estado;
    proyecto.estado = nuevo_estado;
    proyecto.actualizado_por = req.usuario.id;

    if (observaciones) {
      proyecto.observaciones = proyecto.observaciones 
        ? `${proyecto.observaciones}\n\n[${new Date().toLocaleString()}] Cambio de estado de ${estadoAnterior} a ${nuevo_estado}: ${observaciones}`
        : `[${new Date().toLocaleString()}] Cambio de estado de ${estadoAnterior} a ${nuevo_estado}: ${observaciones}`;
    }

    await proyecto.save();

    // Aquí se pueden agregar triggers automáticos según el nuevo estado
    await ejecutarTriggersEstado(proyecto, estadoAnterior, nuevo_estado, req.usuario.id);

    res.json({
      success: true,
      message: `Estado del proyecto cambiado de ${estadoAnterior} a ${nuevo_estado}`,
      data: {
        id: proyecto._id,
        estado_anterior: estadoAnterior,
        estado_nuevo: nuevo_estado,
        fecha_cambio: new Date()
      }
    });

  } catch (error) {
    logger.logError(error, {
      context: 'cambiarEstado',
      proyectoId: req.params.id,
      nuevoEstado: req.body.estado,
      userId: req.usuario?.id
    });
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Eliminar proyecto (soft delete)
const eliminarProyecto = async (req, res) => {
  try {
    const { id } = req.params;
    const { permanente } = req.query; // Permitir eliminación permanente con query param

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de proyecto inválido'
      });
    }

    let proyecto;
    
    if (permanente === 'true') {
      // Hard delete - Eliminación permanente
      proyecto = await Proyecto.findByIdAndDelete(id);
      
      if (!proyecto) {
        return res.status(404).json({
          success: false,
          message: 'Proyecto no encontrado'
        });
      }
      
      logger.info('Proyecto eliminado permanentemente', {
        context: 'eliminarProyecto',
        proyectoId: id,
        numero: proyecto.numero,
        userId: req.usuario?.id
      });
      
      res.json({
        success: true,
        message: 'Proyecto eliminado permanentemente'
      });
    } else {
      // Soft delete - Marcar como inactivo
      proyecto = await Proyecto.findByIdAndUpdate(
        id,
        { 
          activo: false,
          actualizado_por: req.usuario.id,
          fecha_actualizacion: new Date()
        },
        { new: true }
      );

      if (!proyecto) {
        return res.status(404).json({
          success: false,
          message: 'Proyecto no encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Proyecto desactivado exitosamente'
      });
    }

  } catch (error) {
    logger.logError(error, {
      context: 'eliminarProyecto',
      proyectoId: req.params.id,
      userId: req.usuario?.id
    });
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Crear proyecto desde prospecto existente
const crearDesdeProspecto = async (req, res) => {
  try {
    const { prospectoId } = req.params;
    const { tipo_fuente = 'formal' } = req.body;

    if (!mongoose.Types.ObjectId.isValid(prospectoId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de prospecto inválido'
      });
    }

    const prospecto = await Prospecto.findById(prospectoId);
    
    if (!prospecto) {
      return res.status(404).json({
        success: false,
        message: 'Prospecto no encontrado'
      });
    }

    // Crear proyecto basado en el prospecto
    const nuevoProyecto = new Proyecto({
      cliente: {
        nombre: prospecto.nombre,
        telefono: prospecto.telefono,
        correo: prospecto.email,
        direccion: prospecto.direccion,
        zona: prospecto.zona
      },
      tipo_fuente,
      observaciones: prospecto.observaciones,
      responsable: prospecto.asesorAsignado,
      prospecto_original: prospectoId,
      creado_por: req.usuario.id,
      actualizado_por: req.usuario.id
    });

    await nuevoProyecto.save();

    res.status(201).json({
      success: true,
      message: 'Proyecto creado desde prospecto exitosamente',
      data: nuevoProyecto
    });

  } catch (error) {
    logger.logError(error, {
      context: 'crearDesdeProspecto',
      prospectoId: req.params.prospectoId,
      userId: req.usuario?.id
    });
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener datos para exportación
const obtenerDatosExportacion = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de proyecto inválido'
      });
    }

    const proyecto = await Proyecto.findById(id)
      .populate([
        { path: 'cotizaciones' },
        { path: 'pedidos' },
        { path: 'ordenes_fabricacion' },
        { path: 'instalaciones' }
      ]);

    if (!proyecto) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    const datosExportacion = proyecto.toExportData();

    res.json({
      success: true,
      data: datosExportacion
    });

  } catch (error) {
    logger.logError(error, {
      context: 'obtenerDatosExportacion',
      proyectoId: req.params.id,
      userId: req.usuario?.id
    });
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

const generarEtiquetasProduccion = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de proyecto inválido'
      });
    }

    logger.info('Generando etiquetas de producción', {
      proyectoId: id,
      userId: req.usuario?.id
    });

    const proyecto = await Proyecto.findById(id);

    if (!proyecto) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    const etiquetas = proyecto.generarEtiquetasProduccion();
    const etiquetasConQr = await Promise.all(
      etiquetas.map(async etiqueta => ({
        ...etiqueta,
        codigoQR: await qrCodeGenerator.toDataURL(etiqueta.codigoQR)
      }))
    );

    res.json({
      success: true,
      data: etiquetasConQr
    });
  } catch (error) {
    logger.logError(error, {
      context: 'generarEtiquetasProduccion',
      proyectoId: req.params.id,
      userId: req.usuario?.id
    });
    res.status(500).json({
      success: false,
      message: 'Error generando etiquetas de producción',
      error: error.message
    });
  }
};

const calcularTiempoInstalacion = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de proyecto inválido'
      });
    }

    logger.info('Calculando tiempo estimado de instalación', {
      proyectoId: id,
      userId: req.usuario?.id
    });

    const proyecto = await Proyecto.findById(id);

    if (!proyecto) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    const calculo = proyecto.calcularTiempoInstalacion();

    res.json({
      success: true,
      data: calculo
    });
  } catch (error) {
    logger.logError(error, {
      context: 'calcularTiempoInstalacion',
      proyectoId: req.params.id,
      userId: req.usuario?.id
    });
    res.status(500).json({
      success: false,
      message: 'Error calculando tiempo de instalación',
      error: error.message
    });
  }
};

const optimizarRutaDiaria = async (req, res) => {
  try {
    const { fecha } = req.params;
    const fechaParam = new Date(fecha);

    if (Number.isNaN(fechaParam.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Fecha inválida'
      });
    }

    logger.info('Optimizando ruta diaria de instalación', {
      fecha,
      userId: req.usuario?.id
    });

    const resultado = await Proyecto.optimizarRutaDiaria(
      new Date(fechaParam.getTime())
    );

    res.json({
      success: true,
      data: resultado
    });
  } catch (error) {
    logger.logError(error, {
      context: 'optimizarRutaDiaria',
      fecha: req.params.fecha,
      userId: req.usuario?.id
    });
    res.status(500).json({
      success: false,
      message: 'Error optimizando ruta diaria',
      error: error.message
    });
  }
};

// Funciones auxiliares

function calcularSubtotal(proyecto) {
  let subtotal = 0;

  // Sumar productos
  if (proyecto.productos && proyecto.productos.length > 0) {
    subtotal += proyecto.productos.reduce((sum, producto) => {
      return sum + (producto.subtotal || (producto.cantidad * producto.precio_unitario) || 0);
    }, 0);
  }

  // Sumar materiales
  if (proyecto.materiales && proyecto.materiales.length > 0) {
    subtotal += proyecto.materiales.reduce((sum, material) => {
      return sum + (material.subtotal || (material.cantidad * material.precio_unitario) || 0);
    }, 0);
  }

  // Sumar medidas con precios
  if (proyecto.medidas && proyecto.medidas.length > 0) {
    subtotal += proyecto.medidas.reduce((sum, medida) => {
      const area = (medida.ancho || 0) * (medida.alto || 0) * (medida.cantidad || 1);
      const precioKit = medida.kitPrecio || 0;
      const precioMotor = medida.motorPrecio || 0;
      const precioControl = medida.controlPrecio || 0;
      return sum + area + precioKit + precioMotor + precioControl;
    }, 0);
  }

  return subtotal;
}

async function ejecutarTriggersEstado(proyecto, estadoAnterior, nuevoEstado, usuarioId) {
  try {
    // Ejecutar triggers de sincronización
    const sincronizacionService = require('../services/sincronizacionService');
    await sincronizacionService.ejecutarTriggersEstado(proyecto, estadoAnterior, nuevoEstado, usuarioId);

    // Enviar notificación automática al aprobar pedido
    if (nuevoEstado === 'aprobado' && estadoAnterior !== 'aprobado') {
      logger.info('Enviando notificación de aprobación de pedido', {
        proyectoId: proyecto._id,
        proyectoNumero: proyecto.numero,
        cliente: proyecto.cliente?.nombre,
        total: proyecto.total
      });

      const resultadoNotificacion = await notificacionService.enviarNotificacionAprobacionPedido(proyecto);
      
      if (resultadoNotificacion.success) {
        logger.info('Notificación de aprobación enviada exitosamente', {
          proyectoId: proyecto._id,
          whatsappEnviado: resultadoNotificacion.resultados?.whatsapp?.enviado || false,
          correoEnviado: resultadoNotificacion.resultados?.correo?.enviado || false
        });
      } else {
        logger.warn('Error al enviar notificación de aprobación', {
          proyectoId: proyecto._id,
          error: resultadoNotificacion.message
        });
      }
    }

  } catch (error) {
    logger.warn('Error en triggers de estado', {
      error: error.message,
      stack: error.stack,
      proyectoId: proyecto._id,
      estadoAnterior,
      nuevoEstado
    });
    // No lanzar el error para no interrumpir el cambio de estado
  }
}

// Sincronizar proyecto manualmente
const sincronizarProyecto = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de proyecto inválido'
      });
    }

    const sincronizacionService = require('../services/sincronizacionService');
    const nuevoEstado = await sincronizacionService.sincronizarProyecto(id);

    res.json({
      success: true,
      message: 'Proyecto sincronizado exitosamente',
      data: {
        proyectoId: id,
        nuevoEstado,
        fechaSincronizacion: new Date()
      }
    });

  } catch (error) {
    logger.logError(error, {
      context: 'sincronizarProyecto',
      proyectoId: req.params.id,
      userId: req.usuario?.id
    });
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener estadísticas del proyecto
const obtenerEstadisticasProyecto = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de proyecto inválido'
      });
    }

    const proyecto = await Proyecto.findById(id)
      .populate([
        { path: 'cotizaciones', select: 'numero estado fechaCreacion total' },
        { path: 'pedidos', select: 'numero estado fechaCreacion total anticipo saldo' },
        { path: 'ordenes_fabricacion', select: 'numero estado fechaCreacion fechaRequerida' },
        { path: 'instalaciones', select: 'numero estado fechaProgramada fechaCompletada' }
      ]);

    if (!proyecto) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    // Calcular estadísticas
    const estadisticas = {
      resumen: {
        estado_actual: proyecto.estado,
        progreso_porcentaje: proyecto.progreso_porcentaje,
        area_total: proyecto.area_total,
        total_medidas: proyecto.medidas.length,
        fecha_creacion: proyecto.fecha_creacion,
        dias_transcurridos: Math.floor((new Date() - proyecto.fecha_creacion) / (1000 * 60 * 60 * 24))
      },
      financiero: {
        subtotal: proyecto.subtotal,
        iva: proyecto.iva,
        total: proyecto.total,
        anticipo: proyecto.anticipo,
        saldo_pendiente: proyecto.saldo_pendiente
      },
      flujo: {
        cotizaciones: {
          total: proyecto.cotizaciones.length,
          estados: proyecto.cotizaciones.reduce((acc, cot) => {
            acc[cot.estado] = (acc[cot.estado] || 0) + 1;
            return acc;
          }, {})
        },
        pedidos: {
          total: proyecto.pedidos.length,
          estados: proyecto.pedidos.reduce((acc, ped) => {
            acc[ped.estado] = (acc[ped.estado] || 0) + 1;
            return acc;
          }, {})
        },
        fabricacion: {
          total: proyecto.ordenes_fabricacion.length,
          estados: proyecto.ordenes_fabricacion.reduce((acc, ord) => {
            acc[ord.estado] = (acc[ord.estado] || 0) + 1;
            return acc;
          }, {})
        },
        instalaciones: {
          total: proyecto.instalaciones.length,
          estados: proyecto.instalaciones.reduce((acc, ins) => {
            acc[ins.estado] = (acc[ins.estado] || 0) + 1;
            return acc;
          }, {})
        }
      },
      timeline: [
        ...proyecto.cotizaciones.map(c => ({
          tipo: 'cotizacion',
          numero: c.numero,
          estado: c.estado,
          fecha: c.fechaCreacion
        })),
        ...proyecto.pedidos.map(p => ({
          tipo: 'pedido',
          numero: p.numero,
          estado: p.estado,
          fecha: p.fechaCreacion
        })),
        ...proyecto.ordenes_fabricacion.map(o => ({
          tipo: 'fabricacion',
          numero: o.numero,
          estado: o.estado,
          fecha: o.fechaCreacion
        })),
        ...proyecto.instalaciones.map(i => ({
          tipo: 'instalacion',
          numero: i.numero,
          estado: i.estado,
          fecha: i.fechaProgramada
        }))
      ].sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
    };

    res.json({
      success: true,
      data: estadisticas
    });

  } catch (error) {
    logger.logError(error, {
      context: 'obtenerEstadisticasProyecto',
      proyectoId: req.params.id,
      userId: req.usuario?.id
    });
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// FASE 4: Guardar levantamiento técnico (sin precios)
const guardarLevantamiento = async (req, res) => {
  try {
    const { id } = req.params;
    const { partidas = [], totales = {}, observaciones = '', personaVisita = '' } = req.body;

    logger.info('Guardando levantamiento', {
      proyectoId: id,
      partidasCount: partidas.length,
      userId: req.usuario?.id
    });

    if (!Array.isArray(partidas) || partidas.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debes proporcionar al menos una partida para guardar el levantamiento.'
      });
    }

    const proyecto = await Proyecto.findById(id);
    if (!proyecto) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    const partidasNormalizadas = normalizarPartidas(partidas, { incluirPrecios: false });
    const totalesProyecto = construirTotalesProyecto(partidasNormalizadas, totales);
    const registroMedidas = construirRegistroMedidas(partidasNormalizadas, {
      personaVisita,
      observaciones,
      incluirPrecios: false
    });

    proyecto.levantamiento = {
      partidas: partidasNormalizadas,
      totales: totalesProyecto,
      observaciones,
      personaVisita,
      actualizadoEn: new Date()
    };

    const medidasExistentes = Array.isArray(proyecto.medidas)
      ? proyecto.medidas.filter(medida => !medida.esPartidasV2)
      : [];
    proyecto.medidas = [...medidasExistentes, registroMedidas];

    if (observaciones) {
      proyecto.observaciones = observaciones;
    }

    proyecto.estado = 'levantamiento';
    proyecto.actualizado_por = req.usuario.id;

    await proyecto.save();

    logger.info('Levantamiento guardado exitosamente', {
      proyectoId: id,
      userId: req.usuario.id,
      partidasCount: partidasNormalizadas.length
    });

    res.json({
      success: true,
      message: 'Levantamiento guardado exitosamente',
      data: proyecto
    });
  } catch (error) {
    logger.logError(error, {
      context: 'guardarLevantamiento',
      proyectoId: req.params.id,
      partidasCount: req.body.partidas?.length,
      userId: req.usuario?.id
    });
    res.status(500).json({
      success: false,
      message: 'Error al guardar el levantamiento',
      error: error.message
    });
  }
};

// FASE 4: Crear/actualizar cotización desde proyecto
const crearCotizacionDesdeProyecto = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      partidas = [],
      precioReglas = {},
      facturacion = {},
      totales = {},
      observaciones = '',
      personaVisita = ''
    } = req.body;

    logger.info('Creando cotización desde proyecto', {
      proyectoId: id,
      partidasCount: partidas.length,
      userId: req.usuario?.id
    });

    if (!Array.isArray(partidas) || partidas.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debes proporcionar al menos una partida para generar la cotización.'
      });
    }

    const proyecto = await Proyecto.findById(id);
    if (!proyecto) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    const partidasNormalizadas = normalizarPartidas(partidas, { incluirPrecios: true });
    const totalesProyecto = construirTotalesProyecto(partidasNormalizadas, totales);
    const precioReglasNormalizado = normalizarPrecioReglas(precioReglas);
    const facturacionNormalizada = normalizarFacturacion(facturacion);
    const registroMedidas = construirRegistroMedidas(partidasNormalizadas, {
      personaVisita,
      observaciones,
      incluirPrecios: true
    });

    const productosCotizacion = construirProductosDesdePartidas(partidasNormalizadas);
    const costoInstalacionTotal = partidasNormalizadas.reduce(
      (sum, partida) => sum + (partida.totales?.costoInstalacion || 0),
      0
    );

    const numeroCotizacion = await generarNumeroCotizacionSecuencial();

    const nuevaCotizacion = new Cotizacion({
      numero: numeroCotizacion,
      fecha: new Date(),
      proyecto: proyecto._id,
      prospecto: proyecto.prospecto_original,
      origen: 'cotizacion_vivo',
      estado: 'borrador',
      comentarios: observaciones,
      precioGeneralM2: precioReglasNormalizado.precio_m2 || undefined,
      unidadMedida: 'm2',
      productos: productosCotizacion,
      instalacion: {
        incluye: costoInstalacionTotal > 0,
        costo: roundNumber(costoInstalacionTotal),
        tipo: costoInstalacionTotal > 0 ? 'personalizado' : undefined
      },
      descuento: {
        aplica: precioReglasNormalizado.aplicaDescuento && totalesProyecto.descuento > 0,
        tipo: precioReglasNormalizado.tipoDescuento === 'monto' ? 'monto' : 'porcentaje',
        valor: precioReglasNormalizado.valorDescuento,
        monto: totalesProyecto.descuento
      },
      facturacion: {
        requiere: facturacionNormalizada.requiereFactura,
        iva: totalesProyecto.iva
      },
      subtotal: totalesProyecto.subtotal,
      iva: totalesProyecto.iva,
      total: totalesProyecto.total,
      elaboradaPor: req.usuario.id
    });

    await nuevaCotizacion.save();

    const medidasExistentes = Array.isArray(proyecto.medidas)
      ? proyecto.medidas.filter(medida => !medida.esPartidasV2)
      : [];
    proyecto.medidas = [...medidasExistentes, registroMedidas];

    proyecto.levantamiento = {
      partidas: partidasNormalizadas,
      totales: totalesProyecto,
      observaciones,
      personaVisita,
      actualizadoEn: new Date()
    };

    proyecto.cotizacionActual = {
      cotizacion: nuevaCotizacion._id,
      numero: numeroCotizacion,
      totales: totalesProyecto,
      precioReglas: precioReglasNormalizado,
      facturacion: facturacionNormalizada,
      observaciones,
      personaVisita,
      fechaCreacion: new Date()
    };

    if (observaciones) {
      proyecto.observaciones = observaciones;
    }

    proyecto.estado = 'cotizacion';
    proyecto.subtotal = totalesProyecto.subtotal;
    proyecto.iva = totalesProyecto.iva;
    proyecto.total = totalesProyecto.total;
    proyecto.actualizado_por = req.usuario.id;

    if (!Array.isArray(proyecto.cotizaciones)) {
      proyecto.cotizaciones = [];
    }

    if (!proyecto.cotizaciones.some(cotId => cotId.equals(nuevaCotizacion._id))) {
      proyecto.cotizaciones.push(nuevaCotizacion._id);
    }

    await proyecto.save();

    logger.info('Cotización creada exitosamente', {
      proyectoId: id,
      cotizacionId: nuevaCotizacion._id,
      numero: numeroCotizacion,
      userId: req.usuario.id,
      total: nuevaCotizacion.total
    });

    res.json({
      success: true,
      message: 'Cotización creada exitosamente',
      data: {
        proyecto,
        cotizacion: nuevaCotizacion
      }
    });
  } catch (error) {
    logger.logError(error, {
      context: 'crearCotizacionDesdeProyecto',
      proyectoId: req.params.id,
      partidasCount: req.body.partidas?.length,
      userId: req.usuario?.id
    });
    res.status(500).json({
      success: false,
      message: 'Error al crear la cotización',
      error: error.message
    });
  }
};

// Subir fotos del levantamiento
const subirFotosLevantamiento = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se recibieron archivos'
      });
    }

    // Generar URLs de las fotos subidas
    const fotosUrls = req.files.map(file => ({
      url: `/uploads/levantamientos/${file.filename}`,
      descripcion: '',
      fechaSubida: new Date()
    }));

    logger.info('Fotos de levantamiento subidas', {
      context: 'subirFotosLevantamiento',
      cantidadFotos: fotosUrls.length,
      userId: req.usuario?.id
    });

    res.json({
      success: true,
      message: `${fotosUrls.length} foto(s) subida(s) exitosamente`,
      data: fotosUrls
    });

  } catch (error) {
    logger.logError(error, {
      context: 'subirFotosLevantamiento',
      userId: req.usuario?.id
    });
    res.status(500).json({
      success: false,
      message: 'Error al subir las fotos',
      error: error.message
    });
  }
};

module.exports = {
  crearProyecto,
  obtenerProyectos,
  obtenerProyectoPorId,
  actualizarProyecto,
  cambiarEstado,
  eliminarProyecto,
  crearDesdeProspecto,
  obtenerDatosExportacion,
  generarEtiquetasProduccion,
  calcularTiempoInstalacion,
  optimizarRutaDiaria,
  sincronizarProyecto,
  obtenerEstadisticasProyecto,
  guardarLevantamiento,
  crearCotizacionDesdeProyecto,
  generarPDFProyecto,
  generarExcelLevantamiento,
  subirFotosLevantamiento
};

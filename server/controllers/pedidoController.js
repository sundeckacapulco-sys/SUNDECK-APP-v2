const Cotizacion = require('../models/Cotizacion');
const Pedido = require('../models/Pedido');
const Prospecto = require('../models/Prospecto');
const Proyecto = require('../models/Proyecto');
const logger = require('../config/logger');
const eventBus = require('../services/eventBusService');
const { construirProductosDesdePartidas, normalizarProductoParaPedido } = require('../utils/cotizacionMapper');

/**
 * Generar pedido directamente desde un proyecto
 * POST /api/proyectos/:id/generar-pedido
 */
exports.generarPedidoDesdeProyecto = async (req, res) => {
  try {
    const { id: proyectoId } = req.params;
    const { 
      fechaCompromiso, 
      prioridad = 'media',
      observaciones 
    } = req.body;

    // Validar fecha de compromiso
    if (!fechaCompromiso) {
      return res.status(400).json({ 
        success: false,
        message: 'La fecha de compromiso es requerida' 
      });
    }

    // Buscar proyecto con cotización
    const proyecto = await Proyecto.findById(proyectoId)
      .populate('cliente')
      .populate('cotizacionActual.cotizacion');

    if (!proyecto) {
      return res.status(404).json({ 
        success: false,
        message: 'Proyecto no encontrado' 
      });
    }

    // Verificar que tenga cotización aprobada
    const cotizacion = proyecto.cotizacionActual?.cotizacion;
    if (!cotizacion) {
      return res.status(400).json({ 
        success: false,
        message: 'El proyecto no tiene cotización asociada' 
      });
    }

    // Verificar que no exista pedido previo
    const pedidoExistente = await Pedido.findOne({ proyecto: proyectoId });
    if (pedidoExistente) {
      return res.status(400).json({ 
        success: false,
        message: 'Ya existe un pedido para este proyecto',
        pedido: pedidoExistente
      });
    }

    // Calcular fechas
    const fechaInicio = new Date();
    const tiempoFabricacion = 15; // días por defecto
    const fechaFinFabricacion = new Date(fechaInicio);
    fechaFinFabricacion.setDate(fechaFinFabricacion.getDate() + tiempoFabricacion);

    // Construir productos desde levantamiento
    let productosPedido = [];
    if (proyecto.levantamiento?.partidas?.length > 0) {
      productosPedido = construirProductosDesdePartidas(proyecto.levantamiento.partidas, cotizacion);
    } else if (cotizacion.productos?.length > 0) {
      productosPedido = cotizacion.productos.map(p => normalizarProductoParaPedido(p));
    }

    // Crear pedido
    const nuevoPedido = new Pedido({
      // Referencias
      proyecto: proyectoId,
      cotizacion: cotizacion._id,
      prospecto: proyecto.cliente?._id,
      
      // Campos críticos
      fechaCompromiso: new Date(fechaCompromiso),
      prioridad,
      origen: 'cotizacion_aprobada',
      
      // Montos
      montoTotal: cotizacion.total || proyecto.cotizacionActual?.total || 0,
      anticipo: {
        monto: (cotizacion.total || 0) * 0.6,
        porcentaje: 60,
        pagado: false
      },
      saldo: {
        monto: (cotizacion.total || 0) * 0.4,
        porcentaje: 40,
        pagado: false
      },
      
      // Productos
      productos: productosPedido,
      
      // Dirección
      direccionEntrega: {
        calle: proyecto.cliente?.direccion?.calle || '',
        colonia: proyecto.cliente?.direccion?.colonia || '',
        ciudad: proyecto.cliente?.direccion?.ciudad || '',
        codigoPostal: proyecto.cliente?.direccion?.codigoPostal || ''
      },
      contactoEntrega: {
        nombre: proyecto.cliente?.nombre || '',
        telefono: proyecto.cliente?.telefono || ''
      },
      
      // Fechas
      fechaInicioFabricacion: fechaInicio,
      fechaFinFabricacion: fechaFinFabricacion,
      fechaInstalacion: new Date(fechaCompromiso),
      fechaEntrega: new Date(fechaCompromiso),
      
      // Estado
      estado: 'confirmado',
      vendedor: proyecto.asesor,
      
      // Notas
      notas: [{
        usuario: req.usuario?._id,
        contenido: `📋 Pedido generado desde proyecto. Prioridad: ${prioridad}. Fecha compromiso: ${new Date(fechaCompromiso).toLocaleDateString('es-MX')}.${observaciones ? ` Obs: ${observaciones}` : ''}`,
        tipo: 'info',
        etapa: 'general'
      }]
    });

    const pedidoGuardado = await nuevoPedido.save();

    // Actualizar proyecto
    await Proyecto.findByIdAndUpdate(proyectoId, {
      $push: { pedidos: pedidoGuardado._id },
      estado: 'fabricacion',
      estadoComercial: 'en_fabricacion',
      'cronograma.fechaPedido': new Date()
    });

    // Emitir evento
    await eventBus.emit('pedido.creado', {
      pedidoId: pedidoGuardado._id,
      proyectoId,
      numero: pedidoGuardado.numero,
      prioridad,
      fechaCompromiso
    }, 'PedidoController', req.usuario?._id);

    logger.info('Pedido generado desde proyecto', {
      controlador: 'PedidoController',
      accion: 'generarPedidoDesdeProyecto',
      pedidoId: pedidoGuardado._id,
      proyectoId,
      numero: pedidoGuardado.numero,
      prioridad
    });

    return res.status(201).json({
      success: true,
      message: 'Pedido generado exitosamente',
      pedido: pedidoGuardado
    });

  } catch (error) {
    logger.error('Error generando pedido desde proyecto', {
      controlador: 'PedidoController',
      accion: 'generarPedidoDesdeProyecto',
      proyectoId: req.params?.id,
      error: error.message,
      stack: error.stack
    });

    return res.status(500).json({
      success: false,
      message: 'Error generando pedido',
      error: error.message
    });
  }
};

/**
 * Obtener pedidos de un proyecto
 * GET /api/proyectos/:id/pedidos
 */
exports.obtenerPedidosProyecto = async (req, res) => {
  try {
    const { id: proyectoId } = req.params;

    const pedidos = await Pedido.find({ proyecto: proyectoId })
      .sort({ createdAt: -1 })
      .populate('vendedor', 'nombre apellido')
      .lean();

    return res.json({
      success: true,
      data: pedidos,
      total: pedidos.length
    });

  } catch (error) {
    logger.error('Error obteniendo pedidos del proyecto', {
      controlador: 'PedidoController',
      accion: 'obtenerPedidosProyecto',
      proyectoId: req.params?.id,
      error: error.message
    });

    return res.status(500).json({
      success: false,
      message: 'Error obteniendo pedidos',
      error: error.message
    });
  }
};

exports.aplicarAnticipo = async (req, res) => {
  try {
    const { cotizacionId } = req.params;
    const {
      metodoPago,
      referencia,
      comprobante,
      fechaPago = new Date(),
      direccionEntrega,
      contactoEntrega,
      observaciones
    } = req.body;

    const cotizacion = await Cotizacion.findById(cotizacionId).populate('prospecto');
    if (!cotizacion) {
      return res.status(404).json({ message: 'Cotización no encontrada' });
    }

    const pedidoExistente = await Pedido.findOne({ cotizacion: cotizacionId });
    if (pedidoExistente) {
      return res.status(400).json({ message: 'Ya existe un pedido para esta cotización' });
    }

    const fechaInicio = new Date();
    const tiemposFabricacion = (cotizacion.productos || []).map(p => p.tiempoFabricacion || 15);
    const tiempoMaxFabricacion = tiemposFabricacion.length > 0 ? Math.max(...tiemposFabricacion) : 15;
    const fechaFinFabricacion = new Date(fechaInicio);
    fechaFinFabricacion.setDate(fechaFinFabricacion.getDate() + tiempoMaxFabricacion);

    const fechaInstalacion = new Date(fechaFinFabricacion);
    fechaInstalacion.setDate(fechaInstalacion.getDate() + (cotizacion.tiempoInstalacion || 1));

    const anticipoConfigurado = cotizacion.formaPago?.anticipo || {};
    const saldoConfigurado = cotizacion.formaPago?.saldo || {};

    // ⭐ USAR MAPPER UNIFICADO PARA CONSTRUIR PRODUCTOS CON ESPECIFICACIONES TÉCNICAS
    let productosPedido = [];
    
    // Intentar obtener productos desde el levantamiento del proyecto (fuente de verdad)
    try {
      const proyecto = await Proyecto.findOne({ 
        'cotizacionActual.cotizacion': cotizacionId 
      }).lean();
      
      if (proyecto?.levantamiento?.partidas && proyecto.levantamiento.partidas.length > 0) {
        // Construir productos desde levantamiento (incluye 13 campos técnicos)
        productosPedido = construirProductosDesdePartidas(proyecto.levantamiento.partidas, cotizacion);
        
        logger.info('Productos construidos desde levantamiento con especificaciones técnicas', {
          controlador: 'PedidoController',
          accion: 'aplicarAnticipo',
          cotizacionId,
          proyectoId: proyecto._id,
          totalProductos: productosPedido.length,
          conEspecificacionesTecnicas: true
        });
      } else {
        // Fallback: normalizar productos desde cotización
        productosPedido = cotizacion.productos.map(producto => normalizarProductoParaPedido(producto));
        
        logger.warn('Productos construidos desde cotización (sin levantamiento)', {
          controlador: 'PedidoController',
          accion: 'aplicarAnticipo',
          cotizacionId,
          totalProductos: productosPedido.length,
          conEspecificacionesTecnicas: false
        });
      }
    } catch (errorMapper) {
      // Si falla el mapper, usar productos de cotización directamente
      productosPedido = cotizacion.productos.map(producto => normalizarProductoParaPedido(producto));
      
      logger.error('Error usando mapper, fallback a productos de cotización', {
        controlador: 'PedidoController',
        accion: 'aplicarAnticipo',
        cotizacionId,
        error: errorMapper.message
      });
    }

    // Buscar proyecto asociado
    let proyectoId = null;
    const proyecto = await Proyecto.findOne({ 
      $or: [
        { 'cotizacionActual.cotizacion': cotizacionId },
        { cotizaciones: cotizacionId }
      ]
    });
    if (proyecto) {
      proyectoId = proyecto._id;
    }

    // Calcular prioridad basada en monto y tiempo
    let prioridad = 'media';
    if (cotizacion.total > 100000) prioridad = 'alta';
    if (cotizacion.total > 200000) prioridad = 'urgente';
    if (req.body.prioridad) prioridad = req.body.prioridad;

    const nuevoPedido = new Pedido({
      // ===== REFERENCIAS PRINCIPALES =====
      proyecto: proyectoId,
      cotizacion: cotizacionId,
      prospecto: cotizacion.prospecto?._id,
      
      // ===== CAMPOS CRÍTICOS NUEVOS =====
      fechaCompromiso: req.body.fechaCompromiso || fechaInstalacion,
      prioridad: prioridad,
      origen: 'cotizacion_aprobada',
      
      // ===== MONTOS =====
      montoTotal: cotizacion.total,
      anticipo: {
        monto: anticipoConfigurado.monto || (cotizacion.total * 0.6),
        porcentaje: anticipoConfigurado.porcentaje || 60,
        fechaPago: new Date(fechaPago),
        metodoPago: metodoPago || anticipoConfigurado.metodoPago || 'transferencia',
        referencia: referencia || anticipoConfigurado.referencia || '',
        comprobante: comprobante || anticipoConfigurado.comprobante || '',
        pagado: true
      },
      saldo: {
        monto: saldoConfigurado.monto || (cotizacion.total * 0.4),
        porcentaje: saldoConfigurado.porcentaje || 40,
        fechaVencimiento: fechaInstalacion,
        pagado: false
      },
      productos: productosPedido,
      direccionEntrega: direccionEntrega || cotizacion.prospecto?.direccion || {},
      contactoEntrega: contactoEntrega || {
        nombre: cotizacion.prospecto?.nombre,
        telefono: cotizacion.prospecto?.telefono,
        horarioPreferido: '9:00 AM - 6:00 PM'
      },
      fechaInicioFabricacion: fechaInicio,
      fechaFinFabricacion: fechaFinFabricacion,
      fechaInstalacion: fechaInstalacion,
      fechaEntrega: fechaInstalacion,
      vendedor: cotizacion.elaboradaPor,
      estado: 'confirmado',
      notas: [{
        usuario: req.usuario?._id,
        contenido: `🎉 Pedido creado automáticamente al recibir anticipo de $${(anticipoConfigurado.monto || (cotizacion.total * 0.6)).toLocaleString()}. Método: ${metodoPago || 'transferencia'}. Prioridad: ${prioridad}.${observaciones ? ` Obs: ${observaciones}` : ''}`,
        tipo: 'pago'
      }]
    });

    const pedidoGuardado = await nuevoPedido.save();

    if (cotizacion.prospecto?._id) {
      await Prospecto.findByIdAndUpdate(cotizacion.prospecto._id, {
        etapa: 'pedido',
        fechaUltimoContacto: new Date()
      });
    }

    const pedidoCompleto = await Pedido.findById(pedidoGuardado._id)
      .populate('prospecto', 'nombre telefono email direccion')
      .populate('vendedor', 'nombre apellido');

    logger.info('Pedido creado automáticamente desde anticipo', {
      controlador: 'PedidoController',
      accion: 'aplicarAnticipo',
      pedidoId: pedidoCompleto?._id,
      cotizacionId,
      usuarioId: req.usuario?._id || null
    });

    const eventoPedido = {
      pedidoId: pedidoCompleto._id,
      cotizacionId,
      numero: pedidoCompleto.numero,
      monto: pedidoCompleto.montoTotal,
      anticipo: {
        ...pedidoCompleto.anticipo,
        pagado: true
      },
      productos: pedidoCompleto.productos.map(producto => ({
        nombre: producto.nombre,
        cantidad: producto.cantidad,
        subtotal: producto.subtotal,
        requiereR24: producto.requiereR24,
        tiempoFabricacion: producto.tiempoFabricacion
      })),
      prospectoId: pedidoCompleto.prospecto?._id,
      prioridad: 'normal',
      fechaInicio
    };

    await eventBus.emit('pedido.creado', eventoPedido, 'PedidoController', req.usuario?._id || null);
    await eventBus.emit('pedido.anticipo_pagado', eventoPedido, 'PedidoController', req.usuario?._id || null);

    return res.status(201).json({
      message: 'Pedido creado exitosamente desde anticipo',
      pedido: pedidoCompleto,
      totales: {
        subtotal: cotizacion.subtotal,
        instalacion: cotizacion.instalacion?.incluye ? cotizacion.instalacion.costo : 0,
        descuento: cotizacion.descuento?.monto || 0,
        iva: cotizacion.facturacion?.iva || 0,
        total: cotizacion.total,
        anticipo: pedidoCompleto.anticipo?.monto,
        saldo: pedidoCompleto.saldo?.monto
      }
    });
  } catch (error) {
    logger.error('Error aplicando anticipo y creando pedido', {
      controlador: 'PedidoController',
      accion: 'aplicarAnticipo',
      cotizacionId: req.params?.cotizacionId,
      usuarioId: req.usuario?._id || null,
      error: error.message,
      stack: error.stack
    });

    return res.status(500).json({
      message: 'Error interno del servidor al crear pedido',
      error: error.message
    });
  }
};

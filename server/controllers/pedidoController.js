const Cotizacion = require('../models/Cotizacion');
const Pedido = require('../models/Pedido');
const Prospecto = require('../models/Prospecto');
const Proyecto = require('../models/Proyecto');
const logger = require('../config/logger');
const eventBus = require('../services/eventBusService');
const { construirProductosDesdePartidas, normalizarProductoParaPedido } = require('../utils/cotizacionMapper');

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

    const nuevoPedido = new Pedido({
      cotizacion: cotizacionId,
      prospecto: cotizacion.prospecto?._id,
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
        contenido: `🎉 Pedido creado automáticamente al recibir anticipo de $${(anticipoConfigurado.monto || (cotizacion.total * 0.6)).toLocaleString()}. Método: ${metodoPago || 'transferencia'}.${observaciones ? ` Obs: ${observaciones}` : ''}`,
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

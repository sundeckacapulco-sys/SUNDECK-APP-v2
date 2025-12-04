/**
 * Controlador de Caja
 * Gestión de apertura, cierre, movimientos y cortes de caja
 */

const Caja = require('../models/Caja');
const Proyecto = require('../models/Proyecto');
const logger = require('../config/logger');
const mongoose = require('mongoose');

// ===== APERTURA DE CAJA =====

/**
 * Abrir caja del día
 * POST /api/caja/abrir
 */
const abrirCaja = async (req, res) => {
  try {
    const { fondoInicial = 0, observaciones } = req.body;
    const usuarioId = req.usuario._id;

    // Validar fondo inicial (permitir 0 o valores positivos)
    const fondoInicialNum = parseFloat(fondoInicial) || 0;
    if (fondoInicialNum < 0) {
      return res.status(400).json({
        success: false,
        message: 'El fondo inicial debe ser un número mayor o igual a 0'
      });
    }

    // Verificar si ya hay caja abierta hoy
    const cajaExistente = await Caja.obtenerCajaAbierta();
    if (cajaExistente) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una caja abierta para hoy',
        data: { cajaId: cajaExistente._id, numero: cajaExistente.numero }
      });
    }

    // Obtener fondo de la última caja cerrada (si existe)
    const ultimaCaja = await Caja.obtenerUltimaCajaCerrada();
    const fondoSugerido = ultimaCaja?.cierre?.fondoParaSiguiente || 0;

    // Crear nueva caja
    const nuevaCaja = new Caja({
      fecha: new Date(),
      apertura: {
        hora: new Date(),
        fondoInicial: fondoInicialNum,
        usuario: usuarioId,
        observaciones: observaciones || ''
      },
      estado: 'abierta'
    });

    await nuevaCaja.save();

    logger.info('Caja abierta exitosamente', {
      cajaId: nuevaCaja._id,
      numero: nuevaCaja.numero,
      fondoInicial: fondoInicialNum,
      usuario: req.usuario?.nombre
    });

    res.status(201).json({
      success: true,
      message: 'Caja abierta exitosamente',
      data: {
        caja: nuevaCaja,
        fondoSugerido: fondoSugerido
      }
    });

  } catch (error) {
    logger.error('Error abriendo caja', {
      error: error.message,
      stack: error.stack,
      usuario: req.usuario?.nombre
    });
    res.status(500).json({
      success: false,
      message: 'Error al abrir caja',
      error: error.message
    });
  }
};

// ===== MOVIMIENTOS =====

/**
 * Registrar movimiento en caja
 * POST /api/caja/movimiento
 */
const registrarMovimiento = async (req, res) => {
  try {
    const {
      tipo,
      categoria,
      concepto,
      monto,
      metodoPago,
      referencia,
      proyectoId,
      pedidoId,
      tipoPago,
      comprobante,
      cliente,
      proveedor,
      notas
    } = req.body;

    const usuarioId = req.usuario._id;

    // Validaciones básicas
    if (!tipo || !['ingreso', 'egreso'].includes(tipo)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de movimiento inválido. Debe ser "ingreso" o "egreso"'
      });
    }

    if (!categoria) {
      return res.status(400).json({
        success: false,
        message: 'La categoría es requerida'
      });
    }

    if (!concepto || concepto.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El concepto es requerido'
      });
    }

    if (!monto || monto <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El monto debe ser mayor a 0'
      });
    }

    if (!metodoPago) {
      return res.status(400).json({
        success: false,
        message: 'El método de pago es requerido'
      });
    }

    // Obtener caja abierta
    const caja = await Caja.obtenerCajaAbierta();
    if (!caja) {
      return res.status(400).json({
        success: false,
        message: 'No hay caja abierta. Debe abrir la caja primero.'
      });
    }

    // Crear movimiento
    const movimiento = {
      tipo,
      categoria,
      concepto: concepto.trim(),
      monto: parseFloat(monto),
      metodoPago,
      referencia: referencia || '',
      proyecto: proyectoId || null,
      pedido: pedidoId || null,
      tipoPago: tipoPago || 'otro',
      comprobante: comprobante || '',
      cliente: cliente || {},
      proveedor: proveedor || {},
      hora: new Date(),
      usuario: usuarioId,
      notas: notas || '',
      estado: 'activo'
    };

    // Agregar movimiento a la caja
    await caja.agregarMovimiento(movimiento);

    // Si es un pago de proyecto, actualizar el proyecto también
    if (proyectoId && tipoPago && ['anticipo', 'saldo'].includes(tipoPago)) {
      try {
        const proyecto = await Proyecto.findById(proyectoId);
        if (proyecto) {
          // Registrar referencia a la caja en el proyecto
          if (!proyecto.pagos) proyecto.pagos = {};
          if (!proyecto.pagos[tipoPago]) proyecto.pagos[tipoPago] = {};
          
          proyecto.pagos[tipoPago].cajaMovimientoId = movimiento._id;
          proyecto.pagos[tipoPago].cajaNumero = caja.numero;
          
          await proyecto.save();
          
          logger.info('Proyecto actualizado con referencia a caja', {
            proyectoId: proyectoId,
            tipoPago: tipoPago,
            cajaNumero: caja.numero
          });
        }
      } catch (proyectoError) {
        // No fallar el movimiento si falla la actualización del proyecto
        logger.warn('No se pudo actualizar proyecto con referencia a caja', {
          proyectoId: proyectoId,
          error: proyectoError.message
        });
      }
    }

    logger.info('Movimiento registrado en caja', {
      cajaId: caja._id,
      cajaNumero: caja.numero,
      tipo: tipo,
      categoria: categoria,
      monto: monto,
      metodoPago: metodoPago,
      usuario: req.usuario.nombre
    });

    res.status(201).json({
      success: true,
      message: `${tipo === 'ingreso' ? 'Ingreso' : 'Egreso'} registrado exitosamente`,
      data: {
        movimiento: caja.movimientos[caja.movimientos.length - 1],
        totales: caja.totales,
        saldoActual: caja.calcularSaldoEsperado()
      }
    });

  } catch (error) {
    logger.error('Error registrando movimiento', {
      error: error.message,
      stack: error.stack,
      usuario: req.usuario?.nombre
    });
    res.status(500).json({
      success: false,
      message: 'Error al registrar movimiento',
      error: error.message
    });
  }
};

/**
 * Anular movimiento
 * PUT /api/caja/movimiento/:movimientoId/anular
 */
const anularMovimiento = async (req, res) => {
  try {
    const { movimientoId } = req.params;
    const { motivo } = req.body;
    const usuarioId = req.usuario._id;

    if (!motivo || motivo.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El motivo de anulación es requerido'
      });
    }

    // Obtener caja abierta
    const caja = await Caja.obtenerCajaAbierta();
    if (!caja) {
      return res.status(400).json({
        success: false,
        message: 'No hay caja abierta'
      });
    }

    // Anular movimiento
    await caja.anularMovimiento(movimientoId, motivo, usuarioId);

    logger.info('Movimiento anulado', {
      cajaId: caja._id,
      movimientoId: movimientoId,
      motivo: motivo,
      usuario: req.usuario.nombre
    });

    res.json({
      success: true,
      message: 'Movimiento anulado exitosamente',
      data: {
        totales: caja.totales,
        saldoActual: caja.calcularSaldoEsperado()
      }
    });

  } catch (error) {
    logger.error('Error anulando movimiento', {
      error: error.message,
      movimientoId: req.params.movimientoId
    });
    res.status(500).json({
      success: false,
      message: error.message || 'Error al anular movimiento'
    });
  }
};

// ===== CIERRE DE CAJA =====

/**
 * Cerrar caja del día
 * POST /api/caja/cerrar
 */
const cerrarCaja = async (req, res) => {
  try {
    const {
      saldoReal,
      desglose,
      observaciones,
      retiroEfectivo,
      fondoParaSiguiente
    } = req.body;

    const usuarioId = req.usuario._id;

    // Obtener caja abierta
    const caja = await Caja.obtenerCajaAbierta();
    if (!caja) {
      return res.status(400).json({
        success: false,
        message: 'No hay caja abierta para cerrar'
      });
    }

    // Validar saldo real
    if (saldoReal === undefined || saldoReal < 0) {
      return res.status(400).json({
        success: false,
        message: 'El saldo real es requerido y debe ser mayor o igual a 0'
      });
    }

    // Cerrar caja
    await caja.cerrarCaja({
      saldoReal: parseFloat(saldoReal),
      desglose: desglose || {},
      observaciones: observaciones || '',
      retiroEfectivo: retiroEfectivo || { monto: 0 },
      fondoParaSiguiente: parseFloat(fondoParaSiguiente) || 0,
      usuario: usuarioId
    });

    logger.info('Caja cerrada exitosamente', {
      cajaId: caja._id,
      numero: caja.numero,
      saldoEsperado: caja.cierre.saldoEsperado,
      saldoReal: caja.cierre.saldoReal,
      diferencia: caja.cierre.diferencia,
      usuario: req.usuario.nombre
    });

    res.json({
      success: true,
      message: 'Caja cerrada exitosamente',
      data: {
        caja: caja,
        resumen: {
          fondoInicial: caja.apertura.fondoInicial,
          ingresosEfectivo: caja.totales.ingresosEfectivo,
          egresosEfectivo: caja.totales.egresosEfectivo,
          saldoEsperado: caja.cierre.saldoEsperado,
          saldoReal: caja.cierre.saldoReal,
          diferencia: caja.cierre.diferencia,
          fondoParaSiguiente: caja.cierre.fondoParaSiguiente
        }
      }
    });

  } catch (error) {
    logger.error('Error cerrando caja', {
      error: error.message,
      stack: error.stack,
      usuario: req.usuario?.nombre
    });
    res.status(500).json({
      success: false,
      message: 'Error al cerrar caja',
      error: error.message
    });
  }
};

// ===== CONSULTAS =====

/**
 * Obtener caja actual (abierta)
 * GET /api/caja/actual
 */
const obtenerCajaActual = async (req, res) => {
  try {
    const caja = await Caja.obtenerCajaAbierta();
    
    if (!caja) {
      // Obtener última caja cerrada para sugerir fondo
      const ultimaCaja = await Caja.obtenerUltimaCajaCerrada();
      
      return res.json({
        success: true,
        data: {
          cajaAbierta: false,
          ultimaCaja: ultimaCaja ? {
            numero: ultimaCaja.numero,
            fecha: ultimaCaja.fecha,
            fondoParaSiguiente: ultimaCaja.cierre?.fondoParaSiguiente || 0
          } : null
        }
      });
    }

    // Poblar usuarios
    await caja.populate('apertura.usuario movimientos.usuario', 'nombre email');

    res.json({
      success: true,
      data: {
        cajaAbierta: true,
        caja: caja,
        saldoActual: caja.calcularSaldoEsperado(),
        totales: caja.totales
      }
    });

  } catch (error) {
    logger.error('Error obteniendo caja actual', {
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Error al obtener caja actual',
      error: error.message
    });
  }
};

/**
 * Obtener historial de cajas
 * GET /api/caja/historial
 */
const obtenerHistorial = async (req, res) => {
  try {
    const { 
      fechaInicio, 
      fechaFin, 
      estado,
      page = 1, 
      limit = 10 
    } = req.query;

    const filtro = {};

    // Filtro por fechas
    if (fechaInicio || fechaFin) {
      filtro.fecha = {};
      if (fechaInicio) {
        filtro.fecha.$gte = new Date(fechaInicio);
      }
      if (fechaFin) {
        const fin = new Date(fechaFin);
        fin.setHours(23, 59, 59, 999);
        filtro.fecha.$lte = fin;
      }
    }

    // Filtro por estado
    if (estado && ['abierta', 'cerrada', 'en_revision'].includes(estado)) {
      filtro.estado = estado;
    }

    const cajas = await Caja.find(filtro)
      .sort({ fecha: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('apertura.usuario cierre.usuario', 'nombre email')
      .select('-movimientos'); // Excluir movimientos para lista

    const total = await Caja.countDocuments(filtro);

    res.json({
      success: true,
      data: {
        cajas: cajas,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    logger.error('Error obteniendo historial de cajas', {
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial',
      error: error.message
    });
  }
};

/**
 * Obtener detalle de una caja
 * GET /api/caja/:id
 */
const obtenerCaja = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de caja inválido'
      });
    }

    const caja = await Caja.findById(id)
      .populate('apertura.usuario cierre.usuario', 'nombre email')
      .populate('movimientos.usuario', 'nombre email')
      .populate('movimientos.proyecto', 'numero cliente.nombre')
      .populate('movimientos.pedido', 'numero');

    if (!caja) {
      return res.status(404).json({
        success: false,
        message: 'Caja no encontrada'
      });
    }

    res.json({
      success: true,
      data: {
        caja: caja,
        saldoCalculado: caja.calcularSaldoEsperado()
      }
    });

  } catch (error) {
    logger.error('Error obteniendo caja', {
      error: error.message,
      cajaId: req.params.id
    });
    res.status(500).json({
      success: false,
      message: 'Error al obtener caja',
      error: error.message
    });
  }
};

// ===== REPORTES =====

/**
 * Obtener resumen de caja
 * GET /api/caja/resumen
 */
const obtenerResumen = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    const inicio = fechaInicio ? new Date(fechaInicio) : new Date();
    inicio.setHours(0, 0, 0, 0);

    const fin = fechaFin ? new Date(fechaFin) : new Date();
    fin.setHours(23, 59, 59, 999);

    // Agregación para resumen
    const resumen = await Caja.aggregate([
      {
        $match: {
          fecha: { $gte: inicio, $lte: fin }
        }
      },
      {
        $group: {
          _id: null,
          totalCajas: { $sum: 1 },
          cajasAbiertas: {
            $sum: { $cond: [{ $eq: ['$estado', 'abierta'] }, 1, 0] }
          },
          cajasCerradas: {
            $sum: { $cond: [{ $eq: ['$estado', 'cerrada'] }, 1, 0] }
          },
          totalIngresosEfectivo: { $sum: '$totales.ingresosEfectivo' },
          totalIngresosBanco: { $sum: '$totales.ingresosBanco' },
          totalEgresosEfectivo: { $sum: '$totales.egresosEfectivo' },
          totalEgresosBanco: { $sum: '$totales.egresosBanco' },
          totalMovimientos: { $sum: '$totales.cantidadMovimientos' },
          diferenciaTotal: { $sum: '$cierre.diferencia' }
        }
      }
    ]);

    // Obtener caja actual si existe
    const cajaActual = await Caja.obtenerCajaAbierta();

    res.json({
      success: true,
      data: {
        periodo: {
          inicio: inicio,
          fin: fin
        },
        resumen: resumen[0] || {
          totalCajas: 0,
          cajasAbiertas: 0,
          cajasCerradas: 0,
          totalIngresosEfectivo: 0,
          totalIngresosBanco: 0,
          totalEgresosEfectivo: 0,
          totalEgresosBanco: 0,
          totalMovimientos: 0,
          diferenciaTotal: 0
        },
        cajaActual: cajaActual ? {
          numero: cajaActual.numero,
          saldoActual: cajaActual.calcularSaldoEsperado(),
          movimientosHoy: cajaActual.totales.cantidadMovimientos
        } : null
      }
    });

  } catch (error) {
    logger.error('Error obteniendo resumen de caja', {
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Error al obtener resumen',
      error: error.message
    });
  }
};

/**
 * Obtener movimientos pendientes de cobro (saldos)
 * GET /api/caja/pendientes
 */
const obtenerPendientes = async (req, res) => {
  try {
    // Buscar proyectos con saldo pendiente
    const proyectosPendientes = await Proyecto.find({
      'pagos.anticipo.pagado': true,
      'pagos.saldo.pagado': { $ne: true },
      estado: { $in: ['fabricacion', 'instalacion', 'completado'] }
    })
    .select('numero cliente pagos estado fechaInstalacion')
    .sort({ 'pagos.saldo.fechaVencimiento': 1 })
    .limit(50);

    const pendientes = proyectosPendientes.map(p => ({
      proyectoId: p._id,
      numero: p.numero,
      cliente: p.cliente?.nombre || 'Sin nombre',
      telefono: p.cliente?.telefono || '',
      saldoPendiente: p.pagos?.saldo?.monto || 0,
      fechaVencimiento: p.pagos?.saldo?.fechaVencimiento,
      estado: p.estado,
      diasVencido: p.pagos?.saldo?.fechaVencimiento 
        ? Math.max(0, Math.floor((new Date() - new Date(p.pagos.saldo.fechaVencimiento)) / (1000 * 60 * 60 * 24)))
        : 0
    }));

    const totalPendiente = pendientes.reduce((sum, p) => sum + p.saldoPendiente, 0);

    res.json({
      success: true,
      data: {
        pendientes: pendientes,
        total: pendientes.length,
        montoTotal: totalPendiente
      }
    });

  } catch (error) {
    logger.error('Error obteniendo pendientes', {
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Error al obtener pendientes',
      error: error.message
    });
  }
};

module.exports = {
  abrirCaja,
  registrarMovimiento,
  anularMovimiento,
  cerrarCaja,
  obtenerCajaActual,
  obtenerHistorial,
  obtenerCaja,
  obtenerResumen,
  obtenerPendientes
};

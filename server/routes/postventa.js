const express = require('express');
const Postventa = require('../models/Postventa');
const Pedido = require('../models/Pedido');
const Recordatorio = require('../models/Recordatorio');
const { auth, verificarPermiso } = require('../middleware/auth');
const logger = require('../config/logger');
const eventBus = require('../services/eventBusService');

const router = express.Router();

// ===== ENDPOINTS DE COBRO =====

// Registrar pago de saldo
router.post('/cobro/:pedidoId', auth, verificarPermiso('postventa', 'crear'), async (req, res) => {
  try {
    const { pedidoId } = req.params;
    const { monto, metodoPago, referencia, comprobante } = req.body;
    
    const pedido = await Pedido.findById(pedidoId);
    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }
    
    if (pedido.saldo?.pagado) {
      return res.status(400).json({ message: 'El saldo ya fue pagado' });
    }
    
    // Registrar pago
    pedido.saldo.fechaPago = new Date();
    pedido.saldo.metodoPago = metodoPago;
    pedido.saldo.referencia = referencia || '';
    pedido.saldo.comprobante = comprobante || '';
    pedido.saldo.pagado = true;
    
    // Actualizar estado si corresponde
    if (pedido.estado === 'instalado') {
      pedido.estado = 'entregado';
      pedido.fechaEntrega = new Date();
    }
    
    // Agregar nota
    pedido.notas.push({
      fecha: new Date(),
      usuario: req.usuario?._id,
      contenido: `💰 Saldo pagado: $${monto?.toLocaleString() || pedido.saldo.monto?.toLocaleString()}. Método: ${metodoPago}`,
      etapa: 'pago',
      tipo: 'info'
    });
    
    await pedido.save();
    
    // Emitir evento
    await eventBus.emit('pago.saldo_recibido', {
      pedidoId,
      monto: pedido.saldo.monto,
      metodoPago
    }, 'postventaRoutes', req.usuario?._id);
    
    logger.info('Saldo registrado', {
      ruta: 'postventaRoutes',
      accion: 'registrarSaldo',
      pedidoId,
      monto: pedido.saldo.monto
    });
    
    res.json({
      success: true,
      message: 'Pago de saldo registrado',
      pedido: {
        numero: pedido.numero,
        estado: pedido.estado,
        saldo: pedido.saldo
      }
    });
    
  } catch (error) {
    logger.error('Error registrando saldo', {
      ruta: 'postventaRoutes',
      accion: 'registrarSaldo',
      pedidoId: req.params.pedidoId,
      error: error.message
    });
    res.status(500).json({ message: error.message });
  }
});

// Obtener pedidos con saldo pendiente
router.get('/cobro/pendientes', auth, verificarPermiso('postventa', 'leer'), async (req, res) => {
  try {
    const pedidos = await Pedido.find({
      'saldo.pagado': false,
      estado: { $in: ['instalado', 'entregado'] }
    })
    .populate('prospecto', 'nombre telefono')
    .select('numero montoTotal saldo prospecto estado fechaInstalacion')
    .sort({ 'saldo.fechaVencimiento': 1 })
    .lean();
    
    res.json({
      success: true,
      data: pedidos,
      total: pedidos.length,
      montoTotal: pedidos.reduce((sum, p) => sum + (p.saldo?.monto || 0), 0)
    });
    
  } catch (error) {
    logger.error('Error obteniendo saldos pendientes', {
      ruta: 'postventaRoutes',
      accion: 'obtenerSaldosPendientes',
      error: error.message
    });
    res.status(500).json({ message: error.message });
  }
});

// ===== ENDPOINTS DE SATISFACCIÓN =====

// Registrar encuesta de satisfacción
router.post('/satisfaccion/:postventaId', auth, verificarPermiso('postventa', 'crear'), async (req, res) => {
  try {
    const { postventaId } = req.params;
    const { calificaciones, comentarios, recomendaria, mejoras } = req.body;
    
    const postventa = await Postventa.findById(postventaId);
    if (!postventa) {
      return res.status(404).json({ message: 'Registro de postventa no encontrado' });
    }
    
    // Registrar encuesta
    postventa.encuestaSatisfaccion = {
      fechaRealizada: new Date(),
      calificaciones: calificaciones || {},
      comentarios: comentarios || '',
      recomendaria: recomendaria,
      mejoras: mejoras || '',
      realizada: true
    };
    
    await postventa.save();
    
    // Calcular promedio
    const cals = calificaciones || {};
    const valores = Object.values(cals).filter(v => typeof v === 'number');
    const promedio = valores.length > 0 ? valores.reduce((a, b) => a + b, 0) / valores.length : 0;
    
    logger.info('Encuesta de satisfacción registrada', {
      ruta: 'postventaRoutes',
      accion: 'registrarSatisfaccion',
      postventaId,
      promedio: promedio.toFixed(1)
    });
    
    res.json({
      success: true,
      message: 'Encuesta registrada',
      promedio: promedio.toFixed(1),
      recomendaria
    });
    
  } catch (error) {
    logger.error('Error registrando satisfacción', {
      ruta: 'postventaRoutes',
      accion: 'registrarSatisfaccion',
      postventaId: req.params.postventaId,
      error: error.message
    });
    res.status(500).json({ message: error.message });
  }
});

// Crear recordatorio de seguimiento
router.post('/recordatorio', auth, verificarPermiso('postventa', 'crear'), async (req, res) => {
  try {
    const { pedidoId, tipo, fecha, mensaje } = req.body;
    
    const recordatorio = new Recordatorio({
      tipo: tipo || 'seguimiento_postventa',
      fecha: new Date(fecha),
      mensaje,
      referencia: {
        tipo: 'pedido',
        id: pedidoId
      },
      creadoPor: req.usuario?._id,
      estado: 'pendiente'
    });
    
    await recordatorio.save();
    
    logger.info('Recordatorio de postventa creado', {
      ruta: 'postventaRoutes',
      accion: 'crearRecordatorio',
      pedidoId,
      tipo
    });
    
    res.json({
      success: true,
      message: 'Recordatorio creado',
      recordatorio
    });
    
  } catch (error) {
    logger.error('Error creando recordatorio', {
      ruta: 'postventaRoutes',
      accion: 'crearRecordatorio',
      error: error.message
    });
    res.status(500).json({ message: error.message });
  }
});

// Obtener registros de postventa
router.get('/', auth, verificarPermiso('postventa', 'leer'), async (req, res) => {
  try {
    const { estado } = req.query;
    const filtros = {};
    if (estado) filtros.estado = estado;

    const postventa = await Postventa.find(filtros)
      .populate('cliente', 'nombre telefono email')
      .populate('pedido', 'numero')
      .sort({ createdAt: -1 });

    res.json(postventa);
  } catch (error) {
    logger.error('Error obteniendo postventa', {
      ruta: 'postventaRoutes',
      accion: 'listarPostventa',
      error: error.message
    });
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;

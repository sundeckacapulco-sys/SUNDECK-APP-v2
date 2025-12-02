const express = require('express');
const { auth, verificarPermiso } = require('../middleware/auth');
const Pedido = require('../models/Pedido');
const Proyecto = require('../models/Proyecto');
const Prospecto = require('../models/Prospecto');
const router = express.Router();
const logger = require('../config/logger');

// GET /api/kpis/dashboard - La nueva Torre de Control del Negocio
router.get('/dashboard', auth, verificarPermiso('reportes', 'leer'), async (req, res) => {
  try {
    const fechaFin = new Date();
    const fechaInicio = new Date(fechaFin.getFullYear(), fechaFin.getMonth(), 1);

    const [
      // KPIs Comerciales (Mundo Prospecto/Proyecto)
      prospectosActivos,
      nuevosProspectosMes,
      ventasConcretadasMes,

      // KPIs de Operaciones (Mundo Pedido)
      pedidosEnFabricacion,
      valorEnProduccion,
      pedidosParaInstalar,

      // KPIs Financieros (Mundo Pedido)
      montoVentasMes,
      anticiposRecibidosMes,
      saldoTotalPorCobrar
    ] = await Promise.all([
      // --- Comerciales ---
      Prospecto.countDocuments({ activo: true, archivado: { $ne: true }, etapa: { $nin: ['venta_cerrada', 'pedido', 'perdido'] } }),
      Prospecto.countDocuments({ createdAt: { $gte: fechaInicio, $lte: fechaFin } }),
      Pedido.countDocuments({ createdAt: { $gte: fechaInicio, $lte: fechaFin } }),

      // --- Operaciones ---
      Pedido.countDocuments({ estado: { $in: ['confirmado', 'en_proceso'] } }),
      Pedido.aggregate([
        { $match: { estado: { $in: ['confirmado', 'en_proceso'] } } },
        { $group: { _id: null, total: { $sum: '$montoTotal' } } }
      ]),
      Pedido.countDocuments({ estado: 'terminado' }),

      // --- Financieros ---
      Pedido.aggregate([
        { $match: { createdAt: { $gte: fechaInicio, $lte: fechaFin } } },
        { $group: { _id: null, total: { $sum: '$montoTotal' } } }
      ]),
      Pedido.aggregate([
        { $match: { 'anticipo.fechaPago': { $gte: fechaInicio, $lte: fechaFin } } },
        { $group: { _id: null, total: { $sum: '$anticipo.monto' } } }
      ]),
      Pedido.aggregate([
        { $match: { 'saldo.pagado': { $ne: true } } },
        { $group: { _id: null, total: { $sum: '$saldo.monto' } } }
      ])
    ]);

    // --- Cálculos Derivados ---
    const tasaConversion = nuevosProspectosMes > 0 ? (ventasConcretadasMes / nuevosProspectosMes) * 100 : 0;
    const ticketPromedio = ventasConcretadasMes > 0 ? (montoVentasMes[0]?.total || 0) / ventasConcretadasMes : 0;

    res.json({
      meta: {
        fechaInicio,
        fechaFin,
        actualizado: new Date(),
        fuente: 'Real-time (Proyecto & Pedido models)'
      },
      comercial: {
        titulo: 'Pipeline Comercial',
        prospectosActivos: { valor: prospectosActivos, etiqueta: 'Prospectos Activos' },
        nuevosProspectosMes: { valor: nuevosProspectosMes, etiqueta: 'Nuevos Prospectos (Mes)' },
        ventasConcretadasMes: { valor: ventasConcretadasMes, etiqueta: 'Ventas Concretadas (Mes)' },
        tasaConversion: { valor: parseFloat(tasaConversion.toFixed(1)), etiqueta: 'Tasa de Conversión (Mes)', unidad: '%' }
      },
      operaciones: {
        titulo: 'Taller e Instalaciones',
        pedidosEnFabricacion: { valor: pedidosEnFabricacion, etiqueta: 'Pedidos en Taller' },
        valorEnProduccion: { valor: valorEnProduccion[0]?.total || 0, etiqueta: 'Valor en Producción', unidad: 'currency' },
        pedidosParaInstalar: { valor: pedidosParaInstalar, etiqueta: 'Listos para Instalar' },
      },
      financiero: {
        titulo: 'Salud Financiera',
        montoVentasMes: { valor: montoVentasMes[0]?.total || 0, etiqueta: 'Ventas del Mes', unidad: 'currency' },
        ticketPromedio: { valor: ticketPromedio, etiqueta: 'Ticket Promedio (Mes)', unidad: 'currency' },
        anticiposRecibidosMes: { valor: anticiposRecibidosMes[0]?.total || 0, etiqueta: 'Anticipos Recibidos (Mes)', unidad: 'currency' },
        saldoTotalPorCobrar: { valor: saldoTotalPorCobrar[0]?.total || 0, etiqueta: 'Cuentas por Cobrar', unidad: 'currency' },
      }
    });

  } catch (error) {
    logger.error('Error generando el dashboard de la Torre de Control', {
      ruta: 'kpis.js',
      accion: 'getDashboard',
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ message: 'Error obteniendo métricas del dashboard', error: error.message });
  }
});

// GET /api/kpis/operacionales-diarios - La Cabina de Supervisión Activa
router.get('/operacionales-diarios', auth, verificarPermiso('reportes', 'leer'), async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const [
      nuevosProspectosHoy,
      ordenesIniciadasHoy,
      ordenesFinalizadasHoy,
      instalacionesProgramadasHoy,
      instalacionesCompletadasHoy,
      instalacionesEnCurso
    ] = await Promise.all([
      // --- Actividad Comercial (Hoy) ---
      Prospecto.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd } }),

      // --- Fabricación (Hoy) ---
      Pedido.countDocuments({ fechaInicioFabricacion: { $gte: todayStart, $lte: todayEnd } }),
      Pedido.countDocuments({ fechaFinFabricacion: { $gte: todayStart, $lte: todayEnd } }),

      // --- Instalaciones (Hoy) ---
      Pedido.countDocuments({ fechaInstalacion: { $gte: todayStart, $lte: todayEnd } }),
      Pedido.countDocuments({ estado: 'entregado', fechaEntrega: { $gte: todayStart, $lte: todayEnd } }),
      Pedido.countDocuments({ estado: 'en_instalacion' })
    ]);
    
    // NOTA: Visitas y Check-ins no se pueden calcular aún. Se necesita clarificar el modelo de datos de Visitas.

    res.json({
      meta: {
        fecha: todayStart,
        actualizado: new Date(),
        fuente: 'Real-time (Pedido & Prospecto models)'
      },
      comercial: {
        titulo: 'Actividad Comercial (Hoy)',
        nuevosProspectosHoy: { valor: nuevosProspectosHoy, etiqueta: 'Nuevos Prospectos Hoy' },
        visitasAgendadasHoy: { valor: 'N/A', etiqueta: 'Visitas Agendadas Hoy' },
        checkInsRealizadosHoy: { valor: 'N/A', etiqueta: 'Check-ins Realizados' }
      },
      fabricacion: {
        titulo: 'Fabricación en Taller (Hoy)',
        ordenesIniciadasHoy: { valor: ordenesIniciadasHoy, etiqueta: 'Órdenes Iniciadas Hoy' },
        ordenesFinalizadasHoy: { valor: ordenesFinalizadasHoy, etiqueta: 'Órdenes Finalizadas Hoy' }
      },
      instalaciones: {
        titulo: 'Instalaciones en Ruta (Hoy)',
        instalacionesProgramadasHoy: { valor: instalacionesProgramadasHoy, etiqueta: 'Instalaciones Programadas' },
        instalacionesEnCurso: { valor: instalacionesEnCurso, etiqueta: 'Instalaciones en Curso' },
        instalacionesCompletadasHoy: { valor: instalacionesCompletadasHoy, etiqueta: 'Instalaciones Completadas' }
      }
    });

  } catch (error) {
    logger.error('Error generando los KPIs operacionales diarios', {
      ruta: 'kpis.js',
      accion: 'getOperacionalesDiarios',
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ message: 'Error obteniendo métricas operacionales', error: error.message });
  }
});


// --- RUTAS LEGACY (Mantenidas para no romper otras partes, pero vacías) ---

const notImplementedStatus = 501;
const disabledMessage = { message: 'Ruta de KPI legacy desactivada. Los cálculos ahora se hacen en tiempo real.' };

router.get('/conversion', auth, (req, res) => {
  logger.warn('Acceso a ruta de KPI legacy desactivada (GET /conversion)', { ruta: 'routes/kpis' });
  res.json({ conversionPorEtapa: [], embudo: {}, tasasEmbudo: {}, resumen: {} });
});

router.get('/perdidas', auth, (req, res) => {
  logger.warn('Acceso a ruta de KPI legacy desactivada (GET /perdidas)', { ruta: 'routes/kpis' });
  res.json({ razonesAnalisis: [], perdidasPorEtapa: [], perdidasPorVendedor: [], tendenciaPerdidas: [] });
});

router.get('/recuperables', auth, (req, res) => {
  logger.warn('Acceso a ruta de KPI legacy desactivada (GET /recuperables)', { ruta: 'routes/kpis' });
  res.json({ prospectosRecuperables: [], porPrioridad: {}, proximosSeguimientos: [] });
});

router.post('/calcular', auth, (req, res) => {
  logger.warn('Acceso a ruta de KPI legacy desactivada (POST /calcular)', { ruta: 'routes/kpis' });
  res.status(notImplementedStatus).json(disabledMessage);
});

module.exports = router;

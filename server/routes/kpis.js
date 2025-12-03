const express = require('express');
const { auth, verificarPermiso } = require('../middleware/auth');
const Pedido = require('../models/Pedido');
const Prospecto = require('../models/Prospecto');
const MetricaHistorica = require('../models/MetricaHistorica');
const router = express.Router();
const logger = require('../config/logger');

// GET /api/kpis/historico?fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD
router.get('/historico', auth, verificarPermiso('reportes', 'leer'), async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ message: 'Los parámetros fechaInicio y fechaFin son obligatorios.' });
    }

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    fin.setHours(23, 59, 59, 999);

    const historicos = await MetricaHistorica.find({
      fecha: { $gte: inicio, $lte: fin },
      actividadDetectada: true,
    }).sort({ fecha: 'asc' });

    if (historicos.length === 0) {
      return res.json({
        message: 'No se encontraron datos históricos para el rango de fechas seleccionado.',
        seriesDeTiempo: {},
        resumenes: {},
      });
    }

    const seriesDeTiempo = {
      ventas: [],
      prospectos: [],
      ordenesIniciadas: [],
      ordenesFinalizadas: [],
      fechas: historicos.map(h => h.fecha.toISOString().split('T')[0]),
    };

    let totalVentas = 0;
    let totalProspectos = 0;
    let totalOrdenesIniciadas = 0;
    let totalOrdenesFinalizadas = 0;

    historicos.forEach(h => {
      seriesDeTiempo.ventas.push(h.torreDeControl.financiero.montoVentasMes.valor > 0 ? h.torreDeControl.financiero.montoVentasMes.valor : null);
      seriesDeTiempo.prospectos.push(h.supervisionActiva.comercial.nuevosProspectosHoy.valor);
      seriesDeTiempo.ordenesIniciadas.push(h.supervisionActiva.fabricacion.ordenesIniciadasHoy.valor);
      seriesDeTiempo.ordenesFinalizadas.push(h.supervisionActiva.fabricacion.ordenesFinalizadasHoy.valor);

      totalVentas += h.torreDeControl.financiero.montoVentasMes.valor;
      totalProspectos += h.supervisionActiva.comercial.nuevosProspectosHoy.valor;
      totalOrdenesIniciadas += h.supervisionActiva.fabricacion.ordenesIniciadasHoy.valor;
      totalOrdenesFinalizadas += h.supervisionActiva.fabricacion.ordenesFinalizadasHoy.valor;
    });
    
    res.json({
      meta: { /* ... */ },
      seriesDeTiempo,
      resumenes: { /* ... */ },
      tablaDeDatos: historicos.map(h => ({
        fecha: h.fecha.toISOString().split('T')[0],
        ventas: h.torreDeControl.financiero.montoVentasMes.valor,
        prospectos: h.supervisionActiva.comercial.nuevosProspectosHoy.valor,
        iniciadas: h.supervisionActiva.fabricacion.ordenesIniciadasHoy.valor,
        finalizadas: h.supervisionActiva.fabricacion.ordenesFinalizadasHoy.valor,
      }))
    });

  } catch (error) {
    logger.error('Error en /historico', { error: error.message });
    res.status(500).json({ message: 'Error obteniendo datos históricos' });
  }
});

// --- Demás rutas sin cambios ---
router.get('/dashboard', auth, verificarPermiso('reportes', 'leer'), async (req, res) => {
  try {
    const fechaFin = new Date();
    const fechaInicio = new Date(fechaFin.getFullYear(), fechaFin.getMonth(), 1);

    const [
      prospectosActivos, nuevosProspectosMes, ventasConcretadasMes,
      pedidosEnFabricacion, valorEnProduccion, pedidosParaInstalar,
      montoVentasMes, anticiposRecibidosMes, saldoTotalPorCobrar
    ] = await Promise.all([
      Prospecto.countDocuments({ activo: true, archivado: { $ne: true }, etapa: { $nin: ['venta_cerrada', 'pedido', 'perdido'] } }),
      Prospecto.countDocuments({ createdAt: { $gte: fechaInicio, $lte: fechaFin } }),
      Pedido.countDocuments({ createdAt: { $gte: fechaInicio, $lte: fechaFin } }),
      Pedido.countDocuments({ estado: { $in: ['confirmado', 'en_proceso'] } }),
      Pedido.aggregate([ { $match: { estado: { $in: ['confirmado', 'en_proceso'] } } }, { $group: { _id: null, total: { $sum: '$montoTotal' } } }]),
      Pedido.countDocuments({ estado: 'terminado' }),
      Pedido.aggregate([ { $match: { createdAt: { $gte: fechaInicio, $lte: fechaFin } } }, { $group: { _id: null, total: { $sum: '$montoTotal' } } }]),
      Pedido.aggregate([ { $match: { 'anticipo.fechaPago': { $gte: fechaInicio, $lte: fechaFin } } }, { $group: { _id: null, total: { $sum: '$anticipo.monto' } } }]),
      Pedido.aggregate([ { $match: { 'saldo.pagado': { $ne: true } } }, { $group: { _id: null, total: { $sum: '$saldo.monto' } } }])
    ]);

    const tasaConversion = nuevosProspectosMes > 0 ? (ventasConcretadasMes / nuevosProspectosMes) * 100 : 0;
    const ticketPromedio = ventasConcretadasMes > 0 ? (montoVentasMes[0]?.total || 0) / ventasConcretadasMes : 0;

    res.json({
      meta: { fechaInicio, fechaFin, actualizado: new Date(), fuente: 'Real-time' },
      comercial: {
        titulo: 'Pipeline Comercial',
        prospectosActivos: { valor: prospectosActivos, etiqueta: 'Prospectos Activos' },
        nuevosProspectosMes: { valor: nuevosProspectosMes, etiqueta: 'Nuevos Prospectos (Mes)' },
        ventasConcretadasMes: { valor: ventasConcretadasMes, etiqueta: 'Ventas Concretadas (Mes)' },
        tasaConversion: { valor: parseFloat(tasaConversion.toFixed(1)), etiqueta: 'Tasa de Conversión', unidad: '%' }
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
        ticketPromedio: { valor: ticketPromedio, etiqueta: 'Ticket Promedio', unidad: 'currency' },
        anticiposRecibidosMes: { valor: anticiposRecibidosMes[0]?.total || 0, etiqueta: 'Anticipos Recibidos', unidad: 'currency' },
        saldoTotalPorCobrar: { valor: saldoTotalPorCobrar[0]?.total || 0, etiqueta: 'Cuentas por Cobrar', unidad: 'currency' },
      }
    });
  } catch (error) {
    logger.error('Error en /dashboard', { error: error.message });
    res.status(500).json({ message: 'Error obteniendo métricas' });
  }
});

router.get('/operacionales-diarios', auth, verificarPermiso('reportes', 'leer'), async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const [
      nuevosProspectosHoy, ordenesIniciadasHoy, ordenesFinalizadasHoy,
      instalacionesProgramadasHoy, instalacionesCompletadasHoy, instalacionesEnCurso
    ] = await Promise.all([
      Prospecto.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd } }),
      Pedido.countDocuments({ fechaInicioFabricacion: { $gte: todayStart, $lte: todayEnd } }),
      Pedido.countDocuments({ fechaFinFabricacion: { $gte: todayStart, $lte: todayEnd } }),
      Pedido.countDocuments({ fechaInstalacion: { $gte: todayStart, $lte: todayEnd } }),
      Pedido.countDocuments({ estado: 'entregado', fechaEntrega: { $gte: todayStart, $lte: todayEnd } }),
      Pedido.countDocuments({ estado: 'en_instalacion' })
    ]);

    res.json({
      meta: { fecha: todayStart, actualizado: new Date(), fuente: 'Real-time' },
      comercial: { titulo: 'Actividad Comercial', nuevosProspectosHoy: { valor: nuevosProspectosHoy, etiqueta: 'Nuevos Prospectos Hoy' } },
      fabricacion: { titulo: 'Fabricación en Taller', ordenesIniciadasHoy: { valor: ordenesIniciadasHoy, etiqueta: 'Órdenes Iniciadas Hoy' }, ordenesFinalizadasHoy: { valor: ordenesFinalizadasHoy, etiqueta: 'Órdenes Finalizadas Hoy' } },
      instalaciones: { titulo: 'Instalaciones en Ruta', instalacionesProgramadasHoy: { valor: instalacionesProgramadasHoy, etiqueta: 'Instalaciones Programadas' }, instalacionesEnCurso: { valor: instalacionesEnCurso, etiqueta: 'Instalaciones en Curso' }, instalacionesCompletadasHoy: { valor: instalacionesCompletadasHoy, etiqueta: 'Instalaciones Completadas' } }
    });
  } catch (error) {
    logger.error('Error en /operacionales-diarios', { error: error.message });
    res.status(500).json({ message: 'Error obteniendo métricas' });
  }
});

module.exports = router;

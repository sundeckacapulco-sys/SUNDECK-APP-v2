const express = require('express');
const { auth, verificarPermiso } = require('../middleware/auth');
const Proyecto = require('../models/Proyecto'); // UNIFICADO: Fuente única de verdad
const MetricaHistorica = require('../models/MetricaHistorica');
const router = express.Router();
const logger = require('../config/logger');
const kpiController = require('../controllers/kpiController');

// Rutas para el nuevo Dashboard de KPIs
router.get('/conversion', auth, verificarPermiso('reportes', 'leer'), kpiController.getConversion);
router.get('/perdidas', auth, verificarPermiso('reportes', 'leer'), kpiController.getPerdidas);
router.get('/recuperables', auth, verificarPermiso('reportes', 'leer'), kpiController.getRecuperables);


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

// --- DASHBOARD UNIFICADO: Usa modelo Proyecto como fuente única ---
router.get('/dashboard', auth, verificarPermiso('reportes', 'leer'), async (req, res) => {
  try {
    const fechaFin = new Date();
    const fechaInicio = new Date(fechaFin.getFullYear(), fechaFin.getMonth(), 1);

    const [
      prospectosActivos, nuevosProspectosMes, ventasConcretadasMes,
      proyectosEnFabricacion, valorEnProduccion, proyectosParaInstalar,
      montoVentasMes, anticiposRecibidosMes, saldoTotalPorCobrar
    ] = await Promise.all([
      // COMERCIAL: Prospectos activos (tipo='prospecto', no perdidos ni convertidos)
      Proyecto.countDocuments({ 
        tipo: 'prospecto', 
        estadoComercial: { $nin: ['perdido', 'convertido', 'completado'] } 
      }),
      // Nuevos prospectos este mes
      Proyecto.countDocuments({ 
        tipo: 'prospecto', 
        createdAt: { $gte: fechaInicio, $lte: fechaFin } 
      }),
      // Ventas concretadas (proyectos creados este mes)
      Proyecto.countDocuments({ 
        tipo: 'proyecto', 
        createdAt: { $gte: fechaInicio, $lte: fechaFin } 
      }),
      // OPERACIONES: Proyectos en fabricación
      Proyecto.countDocuments({ 
        tipo: 'proyecto', 
        estadoComercial: { $in: ['en_fabricacion', 'en fabricacion', 'activo'] } 
      }),
      // Valor en producción
      Proyecto.aggregate([
        { $match: { tipo: 'proyecto', estadoComercial: { $in: ['en_fabricacion', 'en fabricacion', 'activo'] } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      // Proyectos listos para instalar
      Proyecto.countDocuments({ 
        tipo: 'proyecto', 
        estadoComercial: { $in: ['en_instalacion', 'en instalacion'] } 
      }),
      // FINANCIERO: Monto ventas del mes
      Proyecto.aggregate([
        { $match: { tipo: 'proyecto', createdAt: { $gte: fechaInicio, $lte: fechaFin } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      // Anticipos recibidos
      Proyecto.aggregate([
        { $match: { tipo: 'proyecto', createdAt: { $gte: fechaInicio, $lte: fechaFin }, anticipo: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$anticipo' } } }
      ]),
      // Saldo por cobrar
      Proyecto.aggregate([
        { $match: { tipo: 'proyecto', saldo_pendiente: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$saldo_pendiente' } } }
      ])
    ]);

    const tasaConversion = nuevosProspectosMes > 0 ? (ventasConcretadasMes / nuevosProspectosMes) * 100 : 0;
    const ticketPromedio = ventasConcretadasMes > 0 ? (montoVentasMes[0]?.total || 0) / ventasConcretadasMes : 0;

    res.json({
      meta: { fechaInicio, fechaFin, actualizado: new Date(), fuente: 'Proyecto (Unificado)' },
      comercial: {
        titulo: 'Pipeline Comercial',
        prospectosActivos: { valor: prospectosActivos, etiqueta: 'Prospectos Activos' },
        nuevosProspectosMes: { valor: nuevosProspectosMes, etiqueta: 'Nuevos Prospectos (Mes)' },
        ventasConcretadasMes: { valor: ventasConcretadasMes, etiqueta: 'Ventas Cerradas (Mes)' },
        tasaConversion: { valor: parseFloat(tasaConversion.toFixed(1)), etiqueta: 'Tasa de Conversión', unidad: '%' }
      },
      operaciones: {
        titulo: 'Taller e Instalaciones',
        pedidosEnFabricacion: { valor: proyectosEnFabricacion, etiqueta: 'Proyectos en Taller' },
        valorEnProduccion: { valor: valorEnProduccion[0]?.total || 0, etiqueta: 'Valor en Producción', unidad: 'currency' },
        pedidosParaInstalar: { valor: proyectosParaInstalar, etiqueta: 'Listos para Instalar' },
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
    logger.error('Error en /dashboard', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Error obteniendo métricas' });
  }
});

// --- OPERACIONALES DIARIOS: Usa modelo Proyecto como fuente única ---
router.get('/operacionales-diarios', auth, verificarPermiso('reportes', 'leer'), async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const [
      nuevosProspectosHoy, ordenesIniciadasHoy, ordenesFinalizadasHoy,
      instalacionesProgramadasHoy, instalacionesCompletadasHoy, instalacionesEnCurso
    ] = await Promise.all([
      // Nuevos prospectos hoy
      Proyecto.countDocuments({ 
        tipo: 'prospecto', 
        createdAt: { $gte: todayStart, $lte: todayEnd } 
      }),
      // Órdenes iniciadas hoy (usando cronograma.fechaInicioFabricacion)
      Proyecto.countDocuments({ 
        tipo: 'proyecto', 
        'cronograma.fechaInicioFabricacion': { $gte: todayStart, $lte: todayEnd } 
      }),
      // Órdenes finalizadas hoy
      Proyecto.countDocuments({ 
        tipo: 'proyecto', 
        'cronograma.fechaFinFabricacionReal': { $gte: todayStart, $lte: todayEnd } 
      }),
      // Instalaciones programadas hoy
      Proyecto.countDocuments({ 
        tipo: 'proyecto', 
        'cronograma.fechaInstalacionProgramada': { $gte: todayStart, $lte: todayEnd } 
      }),
      // Instalaciones completadas hoy
      Proyecto.countDocuments({ 
        tipo: 'proyecto', 
        estadoComercial: 'completado',
        'cronograma.fechaInstalacionReal': { $gte: todayStart, $lte: todayEnd } 
      }),
      // Instalaciones en curso
      Proyecto.countDocuments({ 
        tipo: 'proyecto', 
        estadoComercial: { $in: ['en_instalacion', 'en instalacion'] } 
      })
    ]);

    res.json({
      meta: { fecha: todayStart, actualizado: new Date(), fuente: 'Proyecto (Unificado)' },
      comercial: { titulo: 'Actividad Comercial', nuevosProspectosHoy: { valor: nuevosProspectosHoy, etiqueta: 'Nuevos Prospectos Hoy' } },
      fabricacion: { titulo: 'Fabricación en Taller', ordenesIniciadasHoy: { valor: ordenesIniciadasHoy, etiqueta: 'Órdenes Iniciadas Hoy' }, ordenesFinalizadasHoy: { valor: ordenesFinalizadasHoy, etiqueta: 'Órdenes Finalizadas Hoy' } },
      instalaciones: { titulo: 'Instalaciones en Ruta', instalacionesProgramadasHoy: { valor: instalacionesProgramadasHoy, etiqueta: 'Instalaciones Programadas' }, instalacionesEnCurso: { valor: instalacionesEnCurso, etiqueta: 'Instalaciones en Curso' }, instalacionesCompletadasHoy: { valor: instalacionesCompletadasHoy, etiqueta: 'Instalaciones Completadas' } }
    });
  } catch (error) {
    logger.error('Error en /operacionales-diarios', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Error obteniendo métricas' });
  }
});

module.exports = router;

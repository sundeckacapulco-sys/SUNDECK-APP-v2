const express = require('express');
const { auth, verificarPermiso } = require('../middleware/auth');
const KPI = require('../models/KPI');
const ProspectoNoConvertido = require('../models/ProspectoNoConvertido');
// const ProyectoPedido = require('../models/ProyectoPedido.legacy'); // Modelo no disponible, rutas dependientes desactivadas
const router = express.Router();
const logger = require('../config/logger');

const notImplementedStatus = 501;
const disabledMessage = { message: 'Ruta de KPI legacy desactivada. Pendiente de migración a nuevos modelos.' };

// GET /api/kpis/dashboard - Dashboard principal de KPIs
router.get('/dashboard', auth, verificarPermiso('reportes', 'leer'), async (req, res) => {
  try {
    const { periodo = 'mensual', meses = 3 } = req.query;
    
    // Obtener KPIs del período actual
    const fechaFin = new Date();
    const fechaInicio = new Date();
    
    if (periodo === 'mensual') {
      fechaInicio.setMonth(fechaInicio.getMonth() - 1);
    } else if (periodo === 'semanal') {
      fechaInicio.setDate(fechaInicio.getDate() - 7);
    } else if (periodo === 'diario') {
      fechaInicio.setDate(fechaInicio.getDate() - 1);
    }
    
    // Calcular KPIs en tiempo real
    const kpiActual = await KPI.calcularKPIs(fechaInicio, fechaFin, periodo);
    
    // Obtener tendencias históricas
    const tendencias = await KPI.obtenerTendencias(meses);
    
    // Obtener top razones de pérdida
    const razonesPerdidasQuery = await ProspectoNoConvertido.analizarPerdidas(fechaInicio, fechaFin);
    
    // Obtener prospectos recuperables
    const prospectosRecuperables = await ProspectoNoConvertido.obtenerRecuperables(10);
    
    // Métricas de alerta
    const alertas = {
      conversionBaja: kpiActual.conversiones.conversionGeneral < 15,
      tiempoCicloAlto: kpiActual.tiempos.cicloCompleto > 45,
      prospectosAbandonados: await ProspectoNoConvertido.countDocuments({
        'tiempos.diasUltimoContacto': { $gt: 30 },
        estadoRecuperacion: 'en_seguimiento'
      })
    };
    
    res.json({
      kpiActual: {
        ...kpiActual.toObject(),
        _id: undefined
      },
      tendencias,
      razonesPerdidasQuery,
      prospectosRecuperables,
      alertas,
      resumen: {
        totalProspectos: kpiActual.metricas.prospectosNuevos,
        totalVentas: kpiActual.metricas.montoVentas,
        conversionGeneral: kpiActual.conversiones.conversionGeneral,
        ticketPromedio: kpiActual.metricas.ticketPromedio,
        prospectosEnRiesgo: prospectosRecuperables.length
      }
    });
  } catch (error) {
    console.error('Error obteniendo dashboard KPIs:', error);
    res.status(500).json({ message: 'Error obteniendo métricas', error: error.message });
  }
});

// GET /api/kpis/conversion - Análisis detallado de conversión (RUTA DESACTIVADA)
router.get('/conversion', auth, verificarPermiso('reportes', 'leer'), async (req, res) => {
  logger.warn('Acceso a ruta de KPI legacy desactivada (GET /conversion)', { ruta: 'routes/kpis' });
  res.json({
    conversionPorEtapa: [],
    embudo: { prospectos: 0, levantamientos: 0, cotizaciones: 0, ventas: 0, completados: 0 },
    tasasEmbudo: { prospectoALevantamiento: 0, levantamientoACotizacion: 0, cotizacionAVenta: 0, ventaACompletado: 0 },
    resumen: { conversionGeneral: 0, puntosCriticos: { etapa: 'N/A', tasa: 0 } }
  });
});

// GET /api/kpis/perdidas - Análisis detallado de pérdidas
router.get('/perdidas', auth, verificarPermiso('reportes', 'leer'), async (req, res) => {
  try {
    const { fechaInicio, fechaFin, razon, etapa } = req.query;
    
    let filtro = {};
    if (fechaInicio && fechaFin) {
      filtro.fechaPerdida = {
        $gte: new Date(fechaInicio),
        $lte: new Date(fechaFin)
      };
    }
    if (razon) filtro['razonPerdida.tipo'] = razon;
    if (etapa) filtro.etapaPerdida = etapa;
    
    const opcionesFecha = {
      $gte: filtro.fechaPerdida?.$gte || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      $lte: filtro.fechaPerdida?.$lte || new Date()
    };

    const [razonesAnalisis, perdidasPorEtapa, perdidasPorVendedor, tendenciaPerdidas] = await Promise.all([
      ProspectoNoConvertido.analizarPerdidas(opcionesFecha.$gte, opcionesFecha.$lte),
      ProspectoNoConvertido.aggregate([
        { $match: filtro },
        { $group: { _id: '$etapaPerdida', cantidad: { $sum: 1 }, montoTotal: { $sum: '$montoEstimado' }, scorePromedioRecuperacion: { $avg: '$scoreRecuperacion' } } },
        { $sort: { cantidad: -1 } }
      ]),
      ProspectoNoConvertido.aggregate([
        { $match: filtro },
        { $group: { _id: '$vendedorAsignado', cantidad: { $sum: 1 }, montoTotal: { $sum: '$montoEstimado' } } },
        { $lookup: { from: 'usuarios', localField: '_id', foreignField: '_id', as: 'vendedor' } },
        { $sort: { cantidad: -1 } }
      ]),
      ProspectoNoConvertido.aggregate([
        { $match: { fechaPerdida: { $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: { año: { $year: '$fechaPerdida' }, mes: { $month: '$fechaPerdida' } }, cantidad: { $sum: 1 }, montoTotal: { $sum: '$montoEstimado' } } },
        { $sort: { '_id.año': 1, '_id.mes': 1 } }
      ])
    ]);
    
    res.json({
      razonesAnalisis,
      perdidasPorEtapa,
      perdidasPorVendedor: perdidasPorVendedor.map(v => ({...v, vendedor: v.vendedor[0]})),
      tendenciaPerdidas,
      resumen: {
        totalPerdidas: razonesAnalisis.reduce((sum, r) => sum + r.cantidad, 0),
        montoTotalPerdido: razonesAnalisis.reduce((sum, r) => sum + r.montoTotal, 0),
        razonPrincipal: razonesAnalisis[0] || null,
        etapaCritica: perdidasPorEtapa[0] || null
      }
    });
  } catch (error) {
    console.error('Error obteniendo análisis de pérdidas:', error);
    res.status(500).json({ message: 'Error obteniendo análisis de pérdidas', error: error.message });
  }
});


// GET /api/kpis/recuperables - Prospectos recuperables con priorización
router.get('/recuperables', auth, verificarPermiso('ventas', 'leer'), async (req, res) => {
  try {
    const { limite = 20, scoreMinimo = 30, vendedor } = req.query;
    
    let filtro = {
      estadoRecuperacion: { $in: ['en_seguimiento', 'recuperable'] },
      scoreRecuperacion: { $gte: parseInt(scoreMinimo) },
      'alertas.alertaActiva': true
    };
    
    if (vendedor) {
      filtro.vendedorAsignado = vendedor;
    }
    
    const prospectosRecuperables = await ProspectoNoConvertido.find(filtro)
      .sort({ scoreRecuperacion: -1, 'alertas.proximoSeguimiento': 1 })
      .limit(parseInt(limite))
      .populate('vendedorAsignado', 'nombre email telefono')
      .populate('proyecto', 'numero fechaCreacion')
      .lean();
    
    // Agrupar por prioridad
    const porPrioridad = {
      alta: prospectosRecuperables.filter(p => p.scoreRecuperacion >= 70),
      media: prospectosRecuperables.filter(p => p.scoreRecuperacion >= 50 && p.scoreRecuperacion < 70),
      baja: prospectosRecuperables.filter(p => p.scoreRecuperacion < 50)
    };
    
    // Próximos seguimientos (próximos 7 días)
    const proximosSeguimientos = await ProspectoNoConvertido.find({
      'alertas.proximoSeguimiento': {
        $gte: new Date(),
        $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      },
      'alertas.alertaActiva': true
    })
    .populate('vendedorAsignado', 'nombre')
    .sort({ 'alertas.proximoSeguimiento': 1 })
    .limit(10);
    
    res.json({
      prospectosRecuperables,
      porPrioridad: {
        alta: { cantidad: porPrioridad.alta.length, prospectos: porPrioridad.alta },
        media: { cantidad: porPrioridad.media.length, prospectos: porPrioridad.media },
        baja: { cantidad: porPrioridad.baja.length, prospectos: porPrioridad.baja }
      },
      proximosSeguimientos,
      resumen: {
        totalRecuperables: prospectosRecuperables.length,
        montoTotalRecuperable: prospectosRecuperables.reduce((sum, p) => sum + (p.montoEstimado || 0), 0),
        scorePromedio: prospectosRecuperables.length > 0 
          ? prospectosRecuperables.reduce((sum, p) => sum + p.scoreRecuperacion, 0) / prospectosRecuperables.length 
          : 0
      }
    });
  } catch (error) {
    console.error('Error obteniendo prospectos recuperables:', error);
    res.status(500).json({ message: 'Error obteniendo prospectos recuperables', error: error.message });
  }
});

// POST /api/kpis/calcular - Calcular KPIs manualmente
router.post('/calcular', auth, verificarPermiso('admin', 'crear'), async (req, res) => {
  try {
    const { fechaInicio, fechaFin, periodo = 'mensual' } = req.body;
    
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    
    const kpi = await KPI.calcularKPIs(inicio, fin, periodo);
    kpi.calculadoPor = req.user.id;
    
    await kpi.save();
    
    res.json({
      message: 'KPIs calculados exitosamente',
      kpi
    });
  } catch (error) {
    console.error('Error calculando KPIs:', error);
    res.status(500).json({ message: 'Error calculando KPIs', error: error.message });
  }
});

// POST /api/kpis/perdidas/:proyectoId - Registrar prospecto como perdido (RUTA DESACTIVADA)
router.post('/perdidas/:proyectoId', auth, verificarPermiso('ventas', 'editar'), async (req, res) => {
  logger.warn('Acceso a ruta de KPI legacy desactivada (POST /perdidas/:proyectoId)', { ruta: 'routes/kpis', proyectoId: req.params.proyectoId });
  res.status(notImplementedStatus).json(disabledMessage);
});

// PUT /api/kpis/recuperacion/:id - Actualizar intento de recuperación
router.put('/recuperacion/:id', auth, verificarPermiso('ventas', 'editar'), async (req, res) => {
  try {
    const { id } = req.params;
    const { metodo, descripcion, resultado, proximoSeguimiento } = req.body;
    
    const prospecto = await ProspectoNoConvertido.findById(id);
    if (!prospecto) {
      return res.status(404).json({ message: 'Prospecto no encontrado' });
    }
    
    prospecto.intentosRecuperacion.push({
      metodo, descripcion, resultado, proximoSeguimiento: proximoSeguimiento ? new Date(proximoSeguimiento) : undefined, usuario: req.user.id
    });
    
    if (resultado === 'recuperado') {
      prospecto.estadoRecuperacion = 'recuperado';
      prospecto.alertas.alertaActiva = false;
    } else if (resultado === 'interesado' || resultado === 'reagendado') {
      prospecto.estadoRecuperacion = 'en_seguimiento';
      if (proximoSeguimiento) prospecto.alertas.proximoSeguimiento = new Date(proximoSeguimiento);
    } else if (resultado === 'rechazado') {
      prospecto.estadoRecuperacion = 'perdido_definitivo';
      prospecto.alertas.alertaActiva = false;
    }
    
    await prospecto.save();
    
    res.json({ message: 'Intento de recuperación registrado', prospecto });
  } catch (error) {
    console.error('Error actualizando recuperación:', error);
    res.status(500).json({ message: 'Error actualizando recuperación', error: error.message });
  }
});


// GET /api/kpis/prospectos - KPIs del módulo de prospectos unificados
router.get('/prospectos', auth, async (req, res) => {
  try {
    const Proyecto = require('../models/Proyecto'); // Importación local para claridad
    
    const { asesor } = req.query;
    const filtroBase = { tipo: 'prospecto' };
    if (asesor) filtroBase.asesorComercial = asesor;
    
    // Conteos por estado
    const [total, enSeguimiento, cotizados, sinRespuesta, convertidos, perdidos] = await Promise.all([
      Proyecto.countDocuments(filtroBase),
      Proyecto.countDocuments({ ...filtroBase, estadoComercial: 'en seguimiento' }),
      Proyecto.countDocuments({ ...filtroBase, estadoComercial: 'cotizado' }),
      Proyecto.countDocuments({ ...filtroBase, estadoComercial: 'sin respuesta' }),
      Proyecto.countDocuments({ ...filtroBase, estadoComercial: 'convertido' }),
      Proyecto.countDocuments({ ...filtroBase, estadoComercial: 'perdido' })
    ]);
    
    const conversionRate = total > 0 ? ((convertidos / total) * 100).toFixed(2) : 0;
    
    const limiteInactividad = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    const inactivos = await Proyecto.countDocuments({
      ...filtroBase,
      estadoComercial: { $in: ['en seguimiento', 'cotizado'] },
      $or: [{ ultimaNota: { $lt: limiteInactividad } }, { ultimaNota: null }]
    });
    
    const porFuente = await Proyecto.aggregate([
      { $match: filtroBase },
      { $group: { _id: '$origenComercial.fuente', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    const porAsesor = await Proyecto.aggregate([
      { $match: { ...filtroBase, asesorComercial: { $exists: true, $ne: null } } },
      { $group: { _id: '$asesorComercial', count: { $sum: 1 }, convertidos: { $sum: { $cond: [{ $eq: ['$estadoComercial', 'convertido'] }, 1, 0] } } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'usuarios', localField: '_id', foreignField: '_id', as: 'asesor' } },
      { $unwind: { path: '$asesor', preserveNullAndEmptyArrays: true } }
    ]);
    
    res.json({
      total,
      porEstado: { enSeguimiento, cotizados, sinRespuesta, convertidos, perdidos },
      conversionRate: parseFloat(conversionRate),
      inactivos,
      porFuente,
      porAsesor: porAsesor.map(a => ({
        asesor: a.asesor?.nombre || 'Sin asignar',
        total: a.count,
        convertidos: a.convertidos,
        conversionRate: a.count > 0 ? ((a.convertidos / a.count) * 100).toFixed(2) : 0
      }))
    });
  } catch (error) {
    console.error('Error obteniendo KPIs de prospectos:', error);
    res.status(500).json({ message: 'Error obteniendo KPIs de prospectos', error: error.message });
  }
});

module.exports = router;

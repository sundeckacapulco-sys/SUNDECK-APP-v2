/**
 * Dashboard Unificado v2.0
 * Centraliza todas las métricas del sistema en un solo endpoint optimizado
 * 
 * Características:
 * - Queries paralelas para mejor rendimiento
 * - Manejo de errores por sección (una falla no tumba todo)
 * - Valores por defecto para robustez
 * - Logging estructurado
 */

const express = require('express');
const { auth } = require('../middleware/auth');
const logger = require('../config/logger');

// Modelos
const Prospecto = require('../models/Prospecto');
const Cotizacion = require('../models/Cotizacion');
const Pedido = require('../models/Pedido');
const Instalacion = require('../models/Instalacion');

const router = express.Router();

// ===============================================================
// DASHBOARD UNIFICADO - ENDPOINT PRINCIPAL
// ===============================================================
router.get('/', auth, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { periodo = '30' } = req.query;
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - parseInt(periodo));

    // Filtros base según rol del usuario
    const filtroUsuario = {};
    const esAdmin = req.usuario.rol === 'admin' || req.usuario.rol === 'gerente';
    
    if (!esAdmin) {
      filtroUsuario.vendedorAsignado = req.usuario._id;
    }

    logger.info('Dashboard unificado: iniciando consultas', {
      usuario: req.usuario?.nombre,
      rol: req.usuario?.rol,
      periodo,
      esAdmin
    });

    // ============================================================
    // EJECUTAR TODAS LAS QUERIES EN PARALELO
    // ============================================================
    const [
      pipelineData,
      metricasData,
      seguimientosData,
      actividadData,
      citasData,
      cierresData
    ] = await Promise.allSettled([
      // 1. PIPELINE - Contadores por etapa
      obtenerPipeline(filtroUsuario),
      
      // 2. MÉTRICAS - KPIs principales
      obtenerMetricas(filtroUsuario, fechaInicio, esAdmin, req.usuario._id),
      
      // 3. SEGUIMIENTOS PENDIENTES
      obtenerSeguimientosPendientes(filtroUsuario),
      
      // 4. ACTIVIDAD RECIENTE
      obtenerActividadReciente(filtroUsuario),
      
      // 5. CITAS DEL DÍA
      obtenerCitasHoy(filtroUsuario),
      
      // 6. CIERRES MENSUALES (solo admin/gerente)
      esAdmin ? obtenerCierresMensuales() : Promise.resolve([])
    ]);

    // ============================================================
    // CONSTRUIR RESPUESTA CON VALORES POR DEFECTO
    // ============================================================
    const response = {
      pipeline: pipelineData.status === 'fulfilled' ? pipelineData.value : defaultPipeline(),
      metricas: metricasData.status === 'fulfilled' ? metricasData.value : defaultMetricas(periodo),
      seguimientosPendientes: seguimientosData.status === 'fulfilled' ? seguimientosData.value : [],
      actividadReciente: actividadData.status === 'fulfilled' ? actividadData.value : [],
      citasHoy: citasData.status === 'fulfilled' ? citasData.value : [],
      supervisionEnVivo: [], // TODO: Implementar si se necesita
      cierresMensuales: cierresData.status === 'fulfilled' ? cierresData.value : []
    };

    // Log de errores parciales (no críticos)
    const errores = [pipelineData, metricasData, seguimientosData, actividadData, citasData, cierresData]
      .filter(r => r.status === 'rejected')
      .map(r => r.reason?.message);
    
    if (errores.length > 0) {
      logger.warn('Dashboard unificado: algunas secciones fallaron', { errores });
    }

    const duration = Date.now() - startTime;
    logger.info('Dashboard unificado: completado', { 
      duration: `${duration}ms`,
      usuario: req.usuario?.nombre 
    });

    res.json(response);

  } catch (error) {
    logger.error('Dashboard unificado: error crítico', {
      error: error.message,
      stack: error.stack,
      usuario: req.usuario?.nombre
    });
    
    // Devolver estructura vacía pero válida para no romper el frontend
    res.json({
      pipeline: defaultPipeline(),
      metricas: defaultMetricas(req.query.periodo || '30'),
      seguimientosPendientes: [],
      actividadReciente: [],
      citasHoy: [],
      supervisionEnVivo: [],
      cierresMensuales: []
    });
  }
});

// ===============================================================
// FUNCIONES AUXILIARES - QUERIES INDIVIDUALES
// ===============================================================

/**
 * Obtener contadores del pipeline por etapa
 */
async function obtenerPipeline(filtroUsuario) {
  const [
    nuevos,
    contactados,
    citasAgendadas,
    cotizados,
    ventasCerradas,
    pedidos,
    instalacion,
    entregados
  ] = await Promise.all([
    Prospecto.countDocuments({ ...filtroUsuario, etapa: 'nuevo', activo: true }),
    Prospecto.countDocuments({ ...filtroUsuario, etapa: 'contactado', activo: true }),
    Prospecto.countDocuments({ ...filtroUsuario, etapa: 'cita_agendada', activo: true }),
    Prospecto.countDocuments({ ...filtroUsuario, etapa: 'cotizacion', activo: true }),
    Prospecto.countDocuments({ ...filtroUsuario, etapa: 'venta_cerrada', activo: true }),
    Prospecto.countDocuments({ ...filtroUsuario, etapa: 'pedido', activo: true }),
    Instalacion.countDocuments({ estado: { $in: ['programada', 'en_proceso'] } }),
    Prospecto.countDocuments({ ...filtroUsuario, etapa: 'entregado', activo: true })
  ]);

  // Fabricación: contar pedidos en estado de fabricación
  const fabricacion = await Pedido.countDocuments({ 
    estado: { $in: ['en_fabricacion', 'pendiente_fabricacion'] } 
  });

  return {
    nuevos,
    contactados,
    citasAgendadas,
    cotizados,
    ventasCerradas,
    pedidos,
    fabricacion,
    instalacion,
    entregados
  };
}

/**
 * Obtener métricas principales (KPIs)
 */
async function obtenerMetricas(filtroUsuario, fechaInicio, esAdmin, usuarioId) {
  const filtroElaborador = esAdmin ? { $exists: true } : usuarioId;

  const [
    prospectosNuevos,
    cotizacionesEnviadas,
    ventasCerradasCount,
    montoVentasResult,
    totalProspectos,
    enRiesgoCount
  ] = await Promise.all([
    // Prospectos nuevos en el período
    Prospecto.countDocuments({
      ...filtroUsuario,
      createdAt: { $gte: fechaInicio },
      activo: true
    }),
    
    // Cotizaciones enviadas
    Cotizacion.countDocuments({
      elaboradaPor: filtroElaborador,
      createdAt: { $gte: fechaInicio }
    }),
    
    // Ventas cerradas (venta_cerrada + pedido)
    Prospecto.countDocuments({
      ...filtroUsuario,
      etapa: { $in: ['venta_cerrada', 'pedido'] },
      updatedAt: { $gte: fechaInicio },
      activo: true
    }),
    
    // Monto total de ventas (de pedidos)
    Pedido.aggregate([
      {
        $match: {
          createdAt: { $gte: fechaInicio },
          ...(esAdmin ? {} : { vendedor: usuarioId })
        }
      },
      { $group: { _id: null, total: { $sum: '$montoTotal' } } }
    ]),
    
    // Total prospectos para calcular tasa de conversión
    Prospecto.countDocuments({
      ...filtroUsuario,
      createdAt: { $gte: fechaInicio },
      activo: true
    }),
    
    // Prospectos en riesgo (sin contacto en 7+ días)
    Prospecto.countDocuments({
      ...filtroUsuario,
      activo: true,
      etapa: { $nin: ['entregado', 'perdido', 'postventa'] },
      updatedAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    })
  ]);

  const montoVentas = montoVentasResult[0]?.total || 0;
  const tasaConversion = totalProspectos > 0 
    ? Math.round((ventasCerradasCount / totalProspectos) * 100) 
    : 0;

  return {
    periodo: parseInt(fechaInicio ? '30' : '30'),
    prospectosNuevos,
    cotizacionesEnviadas,
    ventasCerradas: ventasCerradasCount,
    montoVentas,
    tasaConversion,
    enRiesgo: enRiesgoCount
  };
}

/**
 * Obtener seguimientos pendientes
 */
async function obtenerSeguimientosPendientes(filtroUsuario) {
  return Prospecto.find({
    ...filtroUsuario,
    fechaProximoSeguimiento: { $lte: new Date() },
    etapa: { $nin: ['entregado', 'postventa', 'perdido'] },
    activo: true
  })
  .populate('vendedorAsignado', 'nombre apellido')
  .sort({ fechaProximoSeguimiento: 1 })
  .limit(10)
  .lean();
}

/**
 * Obtener actividad reciente (últimas 24 horas)
 */
async function obtenerActividadReciente(filtroUsuario) {
  const hace24Horas = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  return Prospecto.find({
    ...filtroUsuario,
    updatedAt: { $gte: hace24Horas },
    activo: true
  })
  .populate('vendedorAsignado', 'nombre apellido')
  .sort({ updatedAt: -1 })
  .limit(10)
  .select('nombre telefono etapa updatedAt vendedorAsignado')
  .lean();
}

/**
 * Obtener citas del día
 */
async function obtenerCitasHoy(filtroUsuario) {
  const hoy = new Date();
  const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const finDia = new Date(inicioDia.getTime() + 24 * 60 * 60 * 1000);

  return Prospecto.find({
    ...filtroUsuario,
    fechaCita: { $gte: inicioDia, $lt: finDia },
    estadoCita: { $in: ['pendiente', 'confirmada'] },
    activo: true
  })
  .populate('vendedorAsignado', 'nombre apellido')
  .sort({ horaCita: 1 })
  .lean();
}

/**
 * Obtener cierres mensuales (últimos 6 meses)
 */
async function obtenerCierresMensuales() {
  const hace6Meses = new Date();
  hace6Meses.setMonth(hace6Meses.getMonth() - 6);

  const cierres = await Pedido.aggregate([
    {
      $match: {
        createdAt: { $gte: hace6Meses }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        totalPedidos: { $sum: 1 },
        montoTotal: { $sum: '$montoTotal' }
      }
    },
    {
      $sort: { '_id.year': -1, '_id.month': -1 }
    },
    {
      $limit: 6
    }
  ]);

  return cierres.map(c => ({
    mes: `${c._id.year}-${String(c._id.month).padStart(2, '0')}`,
    totalPedidos: c.totalPedidos,
    montoTotal: c.montoTotal,
    promedioTicket: c.totalPedidos > 0 ? Math.round(c.montoTotal / c.totalPedidos) : 0
  }));
}

// ===============================================================
// VALORES POR DEFECTO
// ===============================================================

function defaultPipeline() {
  return {
    nuevos: 0,
    contactados: 0,
    citasAgendadas: 0,
    cotizados: 0,
    ventasCerradas: 0,
    pedidos: 0,
    fabricacion: 0,
    instalacion: 0,
    entregados: 0
  };
}

function defaultMetricas(periodo) {
  return {
    periodo: parseInt(periodo) || 30,
    prospectosNuevos: 0,
    cotizacionesEnviadas: 0,
    ventasCerradas: 0,
    montoVentas: 0,
    tasaConversion: 0,
    enRiesgo: 0
  };
}

module.exports = router;

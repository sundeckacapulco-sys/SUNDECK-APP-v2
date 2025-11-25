/**
 * Servicio de KPIs para Instalaciones - CORREGIDO
 * 
 * Métricas específicas para el seguimiento y optimización de instalaciones
 * REFACTORIZADO para usar el modelo unificado `Proyecto` como única fuente de verdad.
 */

const Proyecto = require('../models/Proyecto');
const mongoose = require('mongoose');
const logger = require('../config/logger');

class KPIsInstalacionesService {

  /**
   * Obtener dashboard completo de KPIs de instalaciones
   */
  async obtenerDashboardInstalaciones(fechaInicio = null, fechaFin = null) {
    try {
      const hoy = new Date();
      const inicioMes = fechaInicio || new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      const finMes = fechaFin || new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

      logger.info('Calculando KPIs de instalaciones desde modelo unificado', {
        servicio: 'kpisInstalaciones',
        metodo: 'obtenerDashboardInstalaciones',
        periodo: `${inicioMes.toISOString().split('T')[0]} - ${finMes.toISOString().split('T')[0]}`
      });

      const [metricasGenerales, metricasTiempo, metricasCalidad, metricasProductividad, metricasCuadrillas, tendenciasSemanales, alertasOperativas] = await Promise.all([
        this.calcularMetricasGenerales(inicioMes, finMes),
        this.calcularMetricasTiempo(inicioMes, finMes),
        this.calcularMetricasCalidad(inicioMes, finMes),
        this.calcularMetricasProductividad(inicioMes, finMes),
        this.calcularMetricasCuadrillas(inicioMes, finMes),
        this.calcularTendenciasSemanales(inicioMes, finMes),
        this.generarAlertasOperativas()
      ]);

      return {
        generales: metricasGenerales,
        tiempo: metricasTiempo,
        calidad: metricasCalidad,
        productividad: metricasProductividad,
        cuadrillas: metricasCuadrillas,
        tendencias: tendenciasSemanales,
        alertas: alertasOperativas,
        fechaActualizacion: new Date(),
        fuente: 'Modelo Unificado Proyecto'
      };

    } catch (error) {
      logger.error('Error calculando KPIs de instalaciones (unificado)', {
        servicio: 'kpisInstalaciones',
        metodo: 'obtenerDashboardInstalaciones',
        error: error.message,
        stack: error.stack
      });
      throw new Error('Error al obtener KPIs de instalaciones');
    }
  }

  /**
   * Métricas generales de instalaciones
   */
  async calcularMetricasGenerales(fechaInicio, fechaFin) {
    const pipeline = [
      { $match: { 'instalacion.fechaProgramada': { $exists: true, $ne: null } } },
      { $match: { 'instalacion.fechaProgramada': { $gte: fechaInicio, $lte: fechaFin } } },
      { $group: {
          _id: '$instalacion.estado',
          cantidad: { $sum: 1 },
          tiempoPromedio: { $avg: '$instalacion.tiempoEstimado' }
        }
      }
    ];

    const resultados = await Proyecto.aggregate(pipeline);
    
    const metricas = { totalInstalaciones: 0, programadas: 0, enProceso: 0, completadas: 0, canceladas: 0, pausadas: 0, tasaCompletitud: 0, tasaCancelacion: 0 };
    resultados.forEach(item => {
      metricas.totalInstalaciones += item.cantidad;
      metricas[item._id] = item.cantidad;
    });

    if (metricas.totalInstalaciones > 0) {
      metricas.tasaCompletitud = Math.round((metricas.completadas / metricas.totalInstalaciones) * 100);
      metricas.tasaCancelacion = Math.round((metricas.canceladas / metricas.totalInstalaciones) * 100);
    }

    return metricas;
  }

  /**
   * Métricas de tiempo y puntualidad
   */
  async calcularMetricasTiempo(fechaInicio, fechaFin) {
    const pipeline = [
      { $match: { 'instalacion.fechaProgramada': { $gte: fechaInicio, $lte: fechaFin }, 'instalacion.estado': { $in: ['completada', 'en_proceso'] } } },
      { $project: {
          instalacion: '$instalacion',
          esPuntual: {
            $cond: {
              if: { $and: [ { $ne: ['$instalacion.fechaRealizada', null] }, { $lte: [ { $abs: { $subtract: ['$instalacion.fechaRealizada', '$instalacion.fechaProgramada'] } }, 1800000 ] } ] },
              then: 1, else: 0
            }
          },
          variacionTiempo: {
            $cond: {
              if: { $and: [ { $ne: ['$instalacion.tiempos.tiempoReal', null] }, { $ne: ['$instalacion.tiempoEstimado', null] } ] },
              then: { $subtract: ['$instalacion.tiempos.tiempoReal', '$instalacion.tiempoEstimado'] }, else: 0
            }
          }
        }
      },
      { $group: {
          _id: null,
          totalInstalaciones: { $sum: 1 },
          instalacionesPuntuales: { $sum: '$esPuntual' },
          tiempoEstimadoPromedio: { $avg: '$instalacion.tiempoEstimado' },
          tiempoRealPromedio: { $avg: '$instalacion.tiempos.tiempoReal' },
          variacionTiempoPromedio: { $avg: '$variacionTiempo' },
          instalacionesATiempo: { $sum: { $cond: [{ $lte: ['$variacionTiempo', 0.5] }, 1, 0] } }
        }
      }
    ];

    const resultado = await Proyecto.aggregate(pipeline);
    const datos = resultado[0] || {};

    return {
      tiempoEstimadoPromedio: Math.round((datos.tiempoEstimadoPromedio || 0) * 10) / 10,
      tiempoRealPromedio: Math.round((datos.tiempoRealPromedio || 0) * 10) / 10,
      variacionTiempoPromedio: Math.round((datos.variacionTiempoPromedio || 0) * 10) / 10,
      tasaPuntualidad: datos.totalInstalaciones > 0 ? Math.round((datos.instalacionesPuntuales / datos.totalInstalaciones) * 100) : 0,
      tasaTiempoEstimado: datos.totalInstalaciones > 0 ? Math.round((datos.instalacionesATiempo / datos.totalInstalaciones) * 100) : 0,
      eficienciaTemporal: datos.tiempoEstimadoPromedio > 0 ? Math.round((datos.tiempoEstimadoPromedio / (datos.tiempoRealPromedio || datos.tiempoEstimadoPromedio)) * 100) : 100
    };
  }

  /**
   * Métricas de calidad y satisfacción
   */
  async calcularMetricasCalidad(fechaInicio, fechaFin) {
    const pipeline = [
      { $match: { 'instalacion.fechaProgramada': { $gte: fechaInicio, $lte: fechaFin }, 'instalacion.estado': 'completada' } },
      { $project: {
          checklistCompletitud: { $cond: { if: { $gt: [{ $size: '$instalacion.checklist' }, 0] }, then: { $divide: [ { $size: { $filter: { input: '$instalacion.checklist', cond: { $eq: ['$$this.completado', true] } } } }, { $size: '$instalacion.checklist' } ] }, else: 0 } },
          tieneProblemas: { $cond: { if: { $gt: [{ $size: { $ifNull: ['$instalacion.incidencias', []] } }, 0] }, then: 1, else: 0 } },
          satisfaccionCliente: '$instalacion.satisfaccionCliente.calificacion'
        }
      },
      { $group: {
          _id: null,
          totalCompletadas: { $sum: 1 },
          checklistPromedioCompletitud: { $avg: '$checklistCompletitud' },
          instalacionesConProblemas: { $sum: '$tieneProblemas' },
          satisfaccionPromedio: { $avg: '$satisfaccionCliente' },
          instalacionesSinProblemas: { $sum: { $cond: [{ $eq: ['$tieneProblemas', 0] }, 1, 0] } }
        }
      }
    ];

    const resultado = await Proyecto.aggregate(pipeline);
    const datos = resultado[0] || {};

    return {
      calidadPromedio: Math.round((datos.checklistPromedioCompletitud || 0) * 100),
      tasaSinProblemas: datos.totalCompletadas > 0 ? Math.round((datos.instalacionesSinProblemas / datos.totalCompletadas) * 100) : 100,
      satisfaccionCliente: Math.round((datos.satisfaccionPromedio || 0) * 10) / 10,
      instalacionesConIncidencias: datos.instalacionesConProblemas || 0
    };
  }

  /**
   * Métricas de productividad
   */
  async calcularMetricasProductividad(fechaInicio, fechaFin) {
    const pipeline = [
        { $match: { 'instalacion.fechaProgramada': { $gte: fechaInicio, $lte: fechaFin } } },
        { $project: {
            instalacion: '$instalacion',
            diaSemana: { $dayOfWeek: '$instalacion.fechaProgramada' },
            productividadPorInstalador: { $cond: { if: { $gt: [{ $size: { $ifNull: ['$instalacion.instaladores', []] } }, 0] }, then: { $divide: ['$instalacion.tiempoEstimado', { $size: '$instalacion.instaladores' }] }, else: 0 } }
        } },
        { $group: {
            _id: null,
            totalInstalaciones: { $sum: 1 },
            horasTotalesEstimadas: { $sum: '$instalacion.tiempoEstimado' },
            instaladoresPromedioPorInstalacion: { $avg: { $size: { $ifNull: ['$instalacion.instaladores', []] } } },
            productividadPromedioPorInstalador: { $avg: '$productividadPorInstalador' },
            instalacionesLunes: { $sum: { $cond: [{ $eq: ['$diaSemana', 2] }, 1, 0] } },
            instalacionesMartes: { $sum: { $cond: [{ $eq: ['$diaSemana', 3] }, 1, 0] } },
            instalacionesMiercoles: { $sum: { $cond: [{ $eq: ['$diaSemana', 4] }, 1, 0] } },
            instalacionesJueves: { $sum: { $cond: [{ $eq: ['$diaSemana', 5] }, 1, 0] } },
            instalacionesViernes: { $sum: { $cond: [{ $eq: ['$diaSemana', 6] }, 1, 0] } },
            instalacionesSabado: { $sum: { $cond: [{ $eq: ['$diaSemana', 7] }, 1, 0] } }
        } }
    ];

    const resultado = await Proyecto.aggregate(pipeline);
    const datos = resultado[0] || {};
    const distribucionSemanal = { 'Lunes': datos.instalacionesLunes || 0, 'Martes': datos.instalacionesMartes || 0, 'Miércoles': datos.instalacionesMiercoles || 0, 'Jueves': datos.instalacionesJueves || 0, 'Viernes': datos.instalacionesViernes || 0, 'Sábado': datos.instalacionesSabado || 0 };
    const diaMasProductivo = Object.keys(distribucionSemanal).length > 0 ? Object.entries(distribucionSemanal).sort(([,a], [,b]) => b - a)[0][0] : 'N/A';

    return {
      instalacionesPorDia: Math.round((datos.totalInstalaciones || 0) / 30 * 10) / 10,
      horasPromedioInstalacion: Math.round((datos.horasTotalesEstimadas / (datos.totalInstalaciones || 1)) * 10) / 10,
      instaladoresPromedio: Math.round((datos.instaladoresPromedioPorInstalacion || 0) * 10) / 10,
      productividadPorInstalador: Math.round((datos.productividadPromedioPorInstalador || 0) * 10) / 10,
      diaMasProductivo,
      distribucionSemanal
    };
  }

  /**
   * Métricas por cuadrilla
   */
  async calcularMetricasCuadrillas(fechaInicio, fechaFin) {
    const pipeline = [
      { $match: { 'instalacion.fechaProgramada': { $gte: fechaInicio, $lte: fechaFin }, 'instalacion.instaladores.0': { $exists: true } } },
      { $unwind: '$instalacion.instaladores' },
      { $lookup: { from: 'usuarios', localField: 'instalacion.instaladores.usuario', foreignField: '_id', as: 'instaladorInfo' } },
      { $unwind: '$instaladorInfo' },
      { $group: {
          _id: '$instaladorInfo._id',
          nombre: { $first: '$instaladorInfo.nombre' },
          apellido: { $first: '$instaladorInfo.apellido' },
          totalInstalaciones: { $sum: 1 },
          instalacionesCompletadas: { $sum: { $cond: [{ $eq: ['$instalacion.estado', 'completada'] }, 1, 0] } },
          horasTrabajadas: { $sum: '$instalacion.tiempoEstimado' },
          esResponsable: { $sum: { $cond: [{ $eq: ['$instalacion.instaladores.rol', 'responsable'] }, 1, 0] } }
        }
      },
      { $project: {
          nombre: { $concat: ['$nombre', ' ', '$apellido'] },
          totalInstalaciones: 1,
          instalacionesCompletadas: 1,
          horasTrabajadas: 1,
          tasaCompletitud: { $cond: { if: { $gt: ['$totalInstalaciones', 0] }, then: { $multiply: [{ $divide: ['$instalacionesCompletadas', '$totalInstalaciones'] }, 100] }, else: 0 } },
          esLider: { $gt: ['$esResponsable', 0] },
          productividad: { $cond: { if: { $gt: ['$horasTrabajadas', 0] }, then: { $divide: ['$instalacionesCompletadas', '$horasTrabajadas'] }, else: 0 } }
        }
      },
      { $sort: { instalacionesCompletadas: -1 } },
      { $limit: 10 }
    ];

    const cuadrillas = await Proyecto.aggregate(pipeline);

    return {
      topInstaladores: cuadrillas.map(instalador => ({ ...instalador, tasaCompletitud: Math.round(instalador.tasaCompletitud), productividad: Math.round(instalador.productividad * 100) / 100 })),
      totalInstaladores: cuadrillas.length,
      mejorInstalador: cuadrillas[0] || null
    };
  }

  /**
   * Tendencias semanales
   */
  async calcularTendenciasSemanales(fechaInicio, fechaFin) {
    const pipeline = [
      { $match: { 'instalacion.fechaProgramada': { $gte: fechaInicio, $lte: fechaFin } } },
      { $group: {
          _id: { semana: { $week: '$instalacion.fechaProgramada' }, año: { $year: '$instalacion.fechaProgramada' } },
          instalaciones: { $sum: 1 },
          completadas: { $sum: { $cond: [{ $eq: ['$instalacion.estado', 'completada'] }, 1, 0] } },
          tiempoPromedio: { $avg: '$instalacion.tiempoEstimado' }
        }
      },
      { $sort: { '_id.año': 1, '_id.semana': 1 } }
    ];

    const tendencias = await Proyecto.aggregate(pipeline);

    return tendencias.map(item => ({ semana: `S${item._id.semana}/${item._id.año}`, instalaciones: item.instalaciones, completadas: item.completadas, tasaCompletitud: item.instalaciones > 0 ? Math.round((item.completadas / item.instalaciones) * 100) : 0, tiempoPromedio: Math.round(item.tiempoPromedio * 10) / 10 }));
  }

  /**
   * Generar alertas operativas
   */
  async generarAlertasOperativas() {
    const hoy = new Date();
    const [instalacionesHoy, instalacionesAtrasadas, instalacionesSinCuadrilla] = await Promise.all([
      Proyecto.countDocuments({ 'instalacion.fechaProgramada': { $gte: new Date(hoy.setHours(0, 0, 0, 0)), $lt: new Date(hoy.setHours(23, 59, 59, 999)) }, 'instalacion.estado': { $in: ['programada', 'en_proceso'] } }),
      Proyecto.countDocuments({ 'instalacion.fechaProgramada': { $lt: hoy }, 'instalacion.estado': { $in: ['programada', 'en_proceso'] } }),
      Proyecto.countDocuments({ 'instalacion.estado': 'programada', $or: [ { 'instalacion.instaladores': { $size: 0 } }, { 'instalacion.instaladores': { $exists: false } } ] })
    ]);

    const alertas = [];
    if (instalacionesHoy > 0) alertas.push({ tipo: 'info', titulo: 'Instalaciones de Hoy', mensaje: `${instalacionesHoy} instalaciones programadas para hoy`, prioridad: 'media' });
    if (instalacionesAtrasadas > 0) alertas.push({ tipo: 'warning', titulo: 'Instalaciones Atrasadas', mensaje: `${instalacionesAtrasadas} instalaciones pendientes de fechas pasadas`, prioridad: 'alta' });
    if (instalacionesSinCuadrilla > 0) alertas.push({ tipo: 'error', titulo: 'Sin Cuadrilla Asignada', mensaje: `${instalacionesSinCuadrilla} instalaciones sin cuadrilla asignada`, prioridad: 'alta' });

    return alertas;
  }
}

module.exports = new KPIsInstalacionesService();

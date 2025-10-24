/**
 * Servicio de KPIs para Instalaciones
 * 
 * Métricas específicas para el seguimiento y optimización de instalaciones
 */

const Instalacion = require('../models/Instalacion');
const mongoose = require('mongoose');

class KPIsInstalacionesService {

  /**
   * Obtener dashboard completo de KPIs de instalaciones
   */
  async obtenerDashboardInstalaciones(fechaInicio = null, fechaFin = null) {
    try {
      const hoy = new Date();
      const inicioMes = fechaInicio || new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      const finMes = fechaFin || new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

      console.log('📊 Calculando KPIs de instalaciones', {
        periodo: `${inicioMes.toISOString().split('T')[0]} - ${finMes.toISOString().split('T')[0]}`
      });

      // Ejecutar todas las métricas en paralelo
      const [
        metricasGenerales,
        metricasTiempo,
        metricasCalidad,
        metricasProductividad,
        metricasCuadrillas,
        tendenciasSemanales,
        alertasOperativas
      ] = await Promise.all([
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
        fechaActualizacion: new Date()
      };

    } catch (error) {
      console.error('❌ Error calculando KPIs de instalaciones:', error);
      throw new Error('Error al obtener KPIs de instalaciones');
    }
  }

  /**
   * Métricas generales de instalaciones
   */
  async calcularMetricasGenerales(fechaInicio, fechaFin) {
    const pipeline = [
      {
        $match: {
          fechaProgramada: { $gte: fechaInicio, $lte: fechaFin }
        }
      },
      {
        $group: {
          _id: '$estado',
          cantidad: { $sum: 1 },
          tiempoPromedio: { $avg: '$tiempoEstimado' }
        }
      }
    ];

    const resultados = await Instalacion.aggregate(pipeline);
    
    const metricas = {
      totalInstalaciones: 0,
      programadas: 0,
      enProceso: 0,
      completadas: 0,
      canceladas: 0,
      pausadas: 0,
      tasaCompletitud: 0,
      tasaCancelacion: 0
    };

    resultados.forEach(item => {
      metricas.totalInstalaciones += item.cantidad;
      metricas[item._id] = item.cantidad;
    });

    // Calcular tasas
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
      {
        $match: {
          fechaProgramada: { $gte: fechaInicio, $lte: fechaFin },
          estado: { $in: ['completada', 'en_proceso'] }
        }
      },
      {
        $project: {
          tiempoEstimado: 1,
          tiempoReal: '$tiempos.tiempoReal',
          fechaProgramada: 1,
          fechaRealizada: 1,
          estado: 1,
          // Calcular si fue puntual (dentro de 30 min de tolerancia)
          esPuntual: {
            $cond: {
              if: { $and: [
                { $ne: ['$fechaRealizada', null] },
                { $lte: [
                  { $abs: { $subtract: ['$fechaRealizada', '$fechaProgramada'] } },
                  1800000 // 30 minutos en milisegundos
                ]}
              ]},
              then: 1,
              else: 0
            }
          },
          // Calcular variación de tiempo
          variacionTiempo: {
            $cond: {
              if: { $and: [
                { $ne: ['$tiempos.tiempoReal', null] },
                { $ne: ['$tiempoEstimado', null] }
              ]},
              then: { $subtract: ['$tiempos.tiempoReal', '$tiempoEstimado'] },
              else: 0
            }
          }
        }
      },
      {
        $group: {
          _id: null,
          totalInstalaciones: { $sum: 1 },
          instalacionesPuntuales: { $sum: '$esPuntual' },
          tiempoEstimadoPromedio: { $avg: '$tiempoEstimado' },
          tiempoRealPromedio: { $avg: '$tiempoReal' },
          variacionTiempoPromedio: { $avg: '$variacionTiempo' },
          instalacionesATiempo: {
            $sum: {
              $cond: [{ $lte: ['$variacionTiempo', 0.5] }, 1, 0] // Dentro de 30 min
            }
          }
        }
      }
    ];

    const resultado = await Instalacion.aggregate(pipeline);
    const datos = resultado[0] || {};

    return {
      tiempoEstimadoPromedio: Math.round((datos.tiempoEstimadoPromedio || 0) * 10) / 10,
      tiempoRealPromedio: Math.round((datos.tiempoRealPromedio || 0) * 10) / 10,
      variacionTiempoPromedio: Math.round((datos.variacionTiempoPromedio || 0) * 10) / 10,
      tasaPuntualidad: datos.totalInstalaciones > 0 ? 
        Math.round((datos.instalacionesPuntuales / datos.totalInstalaciones) * 100) : 0,
      tasaTiempoEstimado: datos.totalInstalaciones > 0 ? 
        Math.round((datos.instalacionesATiempo / datos.totalInstalaciones) * 100) : 0,
      eficienciaTemporal: datos.tiempoEstimadoPromedio > 0 ? 
        Math.round((datos.tiempoEstimadoPromedio / (datos.tiempoRealPromedio || datos.tiempoEstimadoPromedio)) * 100) : 100
    };
  }

  /**
   * Métricas de calidad y satisfacción
   */
  async calcularMetricasCalidad(fechaInicio, fechaFin) {
    const pipeline = [
      {
        $match: {
          fechaProgramada: { $gte: fechaInicio, $lte: fechaFin },
          estado: 'completada'
        }
      },
      {
        $project: {
          // Calidad del trabajo (basado en checklist completado)
          checklistCompletitud: {
            $cond: {
              if: { $gt: [{ $size: '$checklist' }, 0] },
              then: {
                $divide: [
                  { $size: { $filter: { input: '$checklist', cond: { $eq: ['$$this.completado', true] } } } },
                  { $size: '$checklist' }
                ]
              },
              else: 0
            }
          },
          // Problemas reportados
          tieneProblemas: {
            $cond: {
              if: { $gt: [{ $size: { $ifNull: ['$incidencias', []] } }, 0] },
              then: 1,
              else: 0
            }
          },
          // Satisfacción del cliente (si existe)
          satisfaccionCliente: '$satisfaccionCliente.calificacion'
        }
      },
      {
        $group: {
          _id: null,
          totalCompletadas: { $sum: 1 },
          checklistPromedioCompletitud: { $avg: '$checklistCompletitud' },
          instalacionesConProblemas: { $sum: '$tieneProblemas' },
          satisfaccionPromedio: { $avg: '$satisfaccionCliente' },
          instalacionesSinProblemas: {
            $sum: { $cond: [{ $eq: ['$tieneProblemas', 0] }, 1, 0] }
          }
        }
      }
    ];

    const resultado = await Instalacion.aggregate(pipeline);
    const datos = resultado[0] || {};

    return {
      calidadPromedio: Math.round((datos.checklistPromedioCompletitud || 0) * 100),
      tasaSinProblemas: datos.totalCompletadas > 0 ? 
        Math.round((datos.instalacionesSinProblemas / datos.totalCompletadas) * 100) : 100,
      satisfaccionCliente: Math.round((datos.satisfaccionPromedio || 0) * 10) / 10,
      instalacionesConIncidencias: datos.instalacionesConProblemas || 0,
      indiceCalidadGeneral: this.calcularIndiceCalidad({
        checklistCompletitud: datos.checklistPromedioCompletitud || 0,
        tasaSinProblemas: datos.instalacionesSinProblemas / (datos.totalCompletadas || 1),
        satisfaccionCliente: datos.satisfaccionPromedio || 0
      })
    };
  }

  /**
   * Métricas de productividad
   */
  async calcularMetricasProductividad(fechaInicio, fechaFin) {
    const pipeline = [
      {
        $match: {
          fechaProgramada: { $gte: fechaInicio, $lte: fechaFin }
        }
      },
      {
        $project: {
          estado: 1,
          tiempoEstimado: 1,
          numeroInstaladores: { $size: { $ifNull: ['$instaladores', []] } },
          fechaProgramada: 1,
          // Calcular días de la semana
          diaSemana: { $dayOfWeek: '$fechaProgramada' },
          // Calcular productividad por instalador
          productividadPorInstalador: {
            $cond: {
              if: { $gt: [{ $size: { $ifNull: ['$instaladores', []] } }, 0] },
              then: { $divide: ['$tiempoEstimado', { $size: '$instaladores' }] },
              else: 0
            }
          }
        }
      },
      {
        $group: {
          _id: null,
          totalInstalaciones: { $sum: 1 },
          horasTotalesEstimadas: { $sum: '$tiempoEstimado' },
          instaladoresPromedioPorInstalacion: { $avg: '$numeroInstaladores' },
          productividadPromedioPorInstalador: { $avg: '$productividadPorInstalador' },
          // Distribución por día de la semana
          instalacionesLunes: { $sum: { $cond: [{ $eq: ['$diaSemana', 2] }, 1, 0] } },
          instalacionesMartes: { $sum: { $cond: [{ $eq: ['$diaSemana', 3] }, 1, 0] } },
          instalacionesMiercoles: { $sum: { $cond: [{ $eq: ['$diaSemana', 4] }, 1, 0] } },
          instalacionesJueves: { $sum: { $cond: [{ $eq: ['$diaSemana', 5] }, 1, 0] } },
          instalacionesViernes: { $sum: { $cond: [{ $eq: ['$diaSemana', 6] }, 1, 0] } },
          instalacionesSabado: { $sum: { $cond: [{ $eq: ['$diaSemana', 7] }, 1, 0] } }
        }
      }
    ];

    const resultado = await Instalacion.aggregate(pipeline);
    const datos = resultado[0] || {};

    // Calcular días más productivos
    const distribucionSemanal = {
      'Lunes': datos.instalacionesLunes || 0,
      'Martes': datos.instalacionesMartes || 0,
      'Miércoles': datos.instalacionesMiercoles || 0,
      'Jueves': datos.instalacionesJueves || 0,
      'Viernes': datos.instalacionesViernes || 0,
      'Sábado': datos.instalacionesSabado || 0
    };

    const diaMasProductivo = Object.entries(distribucionSemanal)
      .sort(([,a], [,b]) => b - a)[0][0];

    return {
      instalacionesPorDia: Math.round((datos.totalInstalaciones || 0) / 30 * 10) / 10,
      horasPromedioInstalacion: Math.round((datos.horasTotalesEstimadas / (datos.totalInstalaciones || 1)) * 10) / 10,
      instaladoresPromedio: Math.round((datos.instaladoresPromedioPorInstalacion || 0) * 10) / 10,
      productividadPorInstalador: Math.round((datos.productividadPromedioPorInstalador || 0) * 10) / 10,
      diaMasProductivo,
      distribucionSemanal,
      eficienciaOperativa: this.calcularEficienciaOperativa(datos)
    };
  }

  /**
   * Métricas por cuadrilla
   */
  async calcularMetricasCuadrillas(fechaInicio, fechaFin) {
    const pipeline = [
      {
        $match: {
          fechaProgramada: { $gte: fechaInicio, $lte: fechaFin },
          'instaladores.0': { $exists: true }
        }
      },
      {
        $unwind: '$instaladores'
      },
      {
        $lookup: {
          from: 'usuarios',
          localField: 'instaladores.usuario',
          foreignField: '_id',
          as: 'instaladorInfo'
        }
      },
      {
        $unwind: '$instaladorInfo'
      },
      {
        $group: {
          _id: '$instaladorInfo._id',
          nombre: { $first: '$instaladorInfo.nombre' },
          apellido: { $first: '$instaladorInfo.apellido' },
          totalInstalaciones: { $sum: 1 },
          instalacionesCompletadas: {
            $sum: { $cond: [{ $eq: ['$estado', 'completada'] }, 1, 0] }
          },
          horasTrabajadas: { $sum: '$tiempoEstimado' },
          esResponsable: {
            $sum: { $cond: [{ $eq: ['$instaladores.rol', 'responsable'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          nombre: { $concat: ['$nombre', ' ', '$apellido'] },
          totalInstalaciones: 1,
          instalacionesCompletadas: 1,
          horasTrabajadas: 1,
          tasaCompletitud: {
            $cond: {
              if: { $gt: ['$totalInstalaciones', 0] },
              then: { $multiply: [{ $divide: ['$instalacionesCompletadas', '$totalInstalaciones'] }, 100] },
              else: 0
            }
          },
          esLider: { $gt: ['$esResponsable', 0] },
          productividad: {
            $cond: {
              if: { $gt: ['$horasTrabajadas', 0] },
              then: { $divide: ['$instalacionesCompletadas', '$horasTrabajadas'] },
              else: 0
            }
          }
        }
      },
      {
        $sort: { instalacionesCompletadas: -1 }
      },
      {
        $limit: 10
      }
    ];

    const cuadrillas = await Instalacion.aggregate(pipeline);

    return {
      topInstaladores: cuadrillas.map(instalador => ({
        ...instalador,
        tasaCompletitud: Math.round(instalador.tasaCompletitud),
        productividad: Math.round(instalador.productividad * 100) / 100
      })),
      totalInstaladores: cuadrillas.length,
      mejorInstalador: cuadrillas[0] || null
    };
  }

  /**
   * Tendencias semanales
   */
  async calcularTendenciasSemanales(fechaInicio, fechaFin) {
    const pipeline = [
      {
        $match: {
          fechaProgramada: { $gte: fechaInicio, $lte: fechaFin }
        }
      },
      {
        $group: {
          _id: {
            semana: { $week: '$fechaProgramada' },
            año: { $year: '$fechaProgramada' }
          },
          instalaciones: { $sum: 1 },
          completadas: {
            $sum: { $cond: [{ $eq: ['$estado', 'completada'] }, 1, 0] }
          },
          tiempoPromedio: { $avg: '$tiempoEstimado' }
        }
      },
      {
        $sort: { '_id.año': 1, '_id.semana': 1 }
      }
    ];

    const tendencias = await Instalacion.aggregate(pipeline);

    return tendencias.map(item => ({
      semana: `S${item._id.semana}/${item._id.año}`,
      instalaciones: item.instalaciones,
      completadas: item.completadas,
      tasaCompletitud: item.instalaciones > 0 ? 
        Math.round((item.completadas / item.instalaciones) * 100) : 0,
      tiempoPromedio: Math.round(item.tiempoPromedio * 10) / 10
    }));
  }

  /**
   * Generar alertas operativas
   */
  async generarAlertasOperativas() {
    const hoy = new Date();
    const mañana = new Date();
    mañana.setDate(mañana.getDate() + 1);

    const [
      instalacionesHoy,
      instalacionesAtrasadas,
      instalacionesSinCuadrilla
    ] = await Promise.all([
      Instalacion.countDocuments({
        fechaProgramada: {
          $gte: new Date(hoy.setHours(0, 0, 0, 0)),
          $lt: new Date(hoy.setHours(23, 59, 59, 999))
        },
        estado: { $in: ['programada', 'en_proceso'] }
      }),
      Instalacion.countDocuments({
        fechaProgramada: { $lt: hoy },
        estado: { $in: ['programada', 'en_proceso'] }
      }),
      Instalacion.countDocuments({
        estado: 'programada',
        $or: [
          { instaladores: { $size: 0 } },
          { instaladores: { $exists: false } }
        ]
      })
    ]);

    const alertas = [];

    if (instalacionesHoy > 0) {
      alertas.push({
        tipo: 'info',
        titulo: 'Instalaciones de Hoy',
        mensaje: `${instalacionesHoy} instalaciones programadas para hoy`,
        prioridad: 'media'
      });
    }

    if (instalacionesAtrasadas > 0) {
      alertas.push({
        tipo: 'warning',
        titulo: 'Instalaciones Atrasadas',
        mensaje: `${instalacionesAtrasadas} instalaciones pendientes de fechas pasadas`,
        prioridad: 'alta'
      });
    }

    if (instalacionesSinCuadrilla > 0) {
      alertas.push({
        tipo: 'error',
        titulo: 'Sin Cuadrilla Asignada',
        mensaje: `${instalacionesSinCuadrilla} instalaciones sin cuadrilla asignada`,
        prioridad: 'alta'
      });
    }

    return alertas;
  }

  // ===== MÉTODOS AUXILIARES =====

  calcularIndiceCalidad({ checklistCompletitud, tasaSinProblemas, satisfaccionCliente }) {
    const pesoChecklist = 0.4;
    const pesoProblemas = 0.3;
    const pesoSatisfaccion = 0.3;

    const indice = (
      (checklistCompletitud * pesoChecklist) +
      (tasaSinProblemas * pesoProblemas) +
      ((satisfaccionCliente / 5) * pesoSatisfaccion)
    ) * 100;

    return Math.round(indice);
  }

  calcularEficienciaOperativa(datos) {
    const factorVolumen = Math.min((datos.totalInstalaciones || 0) / 50, 1); // Normalizar a 50 instalaciones/mes
    const factorTiempo = Math.min((datos.horasTotalesEstimadas || 0) / 200, 1); // Normalizar a 200 horas/mes
    const factorRecursos = 1 / Math.max((datos.instaladoresPromedioPorInstalacion || 1), 1);

    return Math.round((factorVolumen + factorTiempo + factorRecursos) / 3 * 100);
  }
}

module.exports = new KPIsInstalacionesService();

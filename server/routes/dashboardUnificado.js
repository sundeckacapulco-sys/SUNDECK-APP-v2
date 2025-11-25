const express = require('express');
const Proyecto = require('../models/Proyecto');
const { auth } = require('../middleware/auth');
const logger = require('../config/logger');

const router = express.Router();

// Dashboard unificado - Sin dependencias legacy
router.get('/', auth, async (req, res) => {
  try {
    const { periodo = '30' } = req.query;
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - parseInt(periodo));

    // Filtros según rol del usuario
    const filtroUsuario = {};
    if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'gerente') {
      filtroUsuario.asesorComercial = req.usuario.nombre;
    }

    // Pipeline consolidado - UNA SOLA CONSULTA
    const resultado = await Proyecto.aggregate([
      {
        $match: {
          ...filtroUsuario,
          createdAt: { $gte: fechaInicio }
        }
      },
      {
        $facet: {
          // Pipeline de ventas por estado comercial
          pipeline: [
            {
              $group: {
                _id: '$estadoComercial',
                count: { $sum: 1 }
              }
            }
          ],
          
          // KPIs principales
          kpis: [
            {
              $group: {
                _id: null,
                totalProspectos: {
                  $sum: { $cond: [{ $eq: ['$tipo', 'prospecto'] }, 1, 0] }
                },
                totalProyectos: {
                  $sum: { $cond: [{ $eq: ['$tipo', 'proyecto'] }, 1, 0] }
                },
                ventasCerradas: {
                  $sum: { $cond: [{ $eq: ['$estadoComercial', 'convertido'] }, 1, 0] }
                },
                enRiesgo: {
                  $sum: { $cond: [{ $eq: ['$estadoComercial', 'critico'] }, 1, 0] }
                },
                enFabricacion: {
                  $sum: { $cond: [{ $eq: ['$estadoComercial', 'en_fabricacion'] }, 1, 0] }
                },
                enInstalacion: {
                  $sum: { $cond: [{ $eq: ['$estadoComercial', 'en_instalacion'] }, 1, 0] }
                },
                completados: {
                  $sum: { $cond: [{ $eq: ['$estadoComercial', 'completado'] }, 1, 0] }
                }
              }
            }
          ],
          
          // Monto total de ventas (CORRECCIÓN DEFINITIVA)
          montos: [
            {
              $group: {
                _id: null,
                // Priorizar el total del proyecto (fuente de verdad), fallback a cotización
                montoTotal: { 
                  $sum: { 
                    $cond: {
                      if: { $gt: [{ $ifNull: ['$total', 0] }, 0] },
                      then: '$total',
                      else: { $ifNull: ['$cotizacionActual.totales.total', 0] }
                    }
                  } 
                }
              }
            }
          ],
          
          // Citas del día (desde notas con tipo cita)
          citasHoy: [
            {
              $unwind: {
                path: '$notas',
                preserveNullAndEmptyArrays: false
              }
            },
            {
              $match: {
                'notas.tipo': 'cita',
                'notas.fechaCita': {
                  $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                  $lt: new Date(new Date().setHours(23, 59, 59, 999))
                }
              }
            },
            {
              $project: {
                _id: 1,
                'cliente.nombre': 1,
                'cliente.telefono': 1,
                estadoComercial: 1,
                asesorComercial: 1,
                fechaCita: '$notas.fechaCita',
                horaCita: '$notas.horaCita',
                notaCita: '$notas.nota'
              }
            },
            { $sort: { fechaCita: 1 } },
            { $limit: 10 }
          ],
          
          // Seguimientos pendientes (sin nota en 5+ días)
          seguimientosPendientes: [
            {
              $match: {
                tipo: 'prospecto',
                estadoComercial: { $nin: ['completado', 'perdido', 'convertido'] },
                $or: [
                  { ultimaNota: { $lte: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) } },
                  { ultimaNota: { $exists: false } }
                ]
              }
            },
            {
              $project: {
                _id: 1,
                'cliente.nombre': 1,
                'cliente.telefono': 1,
                estadoComercial: 1,
                asesorComercial: 1,
                ultimaNota: 1
              }
            },
            { $sort: { ultimaNota: 1 } },
            { $limit: 10 }
          ],
          
          // Actividad reciente (últimas 24 horas)
          actividadReciente: [
            {
              $match: {
                updatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
              }
            },
            {
              $project: {
                _id: 1,
                'cliente.nombre': 1,
                estadoComercial: 1,
                tipo: 1,
                updatedAt: 1
              }
            },
            { $sort: { updatedAt: -1 } },
            { $limit: 10 }
          ],
          
          // Supervisión en vivo (técnicos activos hoy)
          supervisionEnVivo: [
            {
              $match: {
                'instalacion.ejecucion.checkIn.fecha': {
                  $gte: new Date(new Date().setHours(0, 0, 0, 0))
                }
              }
            },
            {
              $project: {
                _id: 1,
                numero: 1,
                'cliente.nombre': 1,
                'cliente.direccion': 1,
                'instalacion.ejecucion.checkIn': 1,
                'instalacion.ejecucion.checkOut': 1,
                'instalacion.ejecucion.metricas': 1,
                'instalacion.programacion.horaInicio': 1,
                'instalacion.programacion.tiempoEstimado': 1,
                'instalacion.estado': 1
              }
            },
            { $sort: { 'instalacion.ejecucion.checkIn.fecha': -1 } }
          ],
          
          // Cierres mensuales (últimos 6 meses - CORREGIDO)
          cierresMensuales: [
            {
              $match: {
                estadoComercial: 'convertido',
                createdAt: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) },
              }
            },
            {
              $group: {
                _id: {
                  year: { $year: '$createdAt' },
                  month: { $month: '$createdAt' }
                },
                totalVentas: { $sum: 1 },
                montoTotal: {
                  $sum: {
                    $cond: {
                      if: { $gt: [{ $ifNull: ['$total', 0] }, 0] },
                      then: '$total',
                      else: { $ifNull: ['$cotizacionActual.totales.total', 0] }
                    }
                  }
                },
                promedioTicket: {
                  $avg: {
                    $cond: {
                      if: { $gt: [{ $ifNull: ['$total', 0] }, 0] },
                      then: '$total',
                      else: { $ifNull: ['$cotizacionActual.totales.total', 0] }
                    }
                  }
                }
              }
            },
            {
              $sort: { '_id.year': -1, '_id.month': -1 }
            },
            {
              $project: {
                _id: 0,
                mes: {
                  $concat: [
                    { $toString: '$_id.year' },
                    '-',
                    {
                      $cond: [
                        { $lt: ['$_id.month', 10] },
                        { $concat: ['0', { $toString: '$_id.month' }] },
                        { $toString: '$_id.month' }
                      ]
                    }
                  ]
                },
                totalVentas: 1,
                montoTotal: { $round: ['$montoTotal', 2] },
                promedioTicket: { $round: ['$promedioTicket', 2] }
              }
            },
            { $limit: 6 }
          ]
        }
      }
    ]);

    // Formatear respuesta
    const data = resultado[0];
    const pipelineObj = {};
    (data.pipeline || []).forEach(item => {
      pipelineObj[item._id] = item.count;
    });

    const kpis = data.kpis[0] || {};
    const montos = data.montos[0] || {};

    // Calcular tasa de conversión
    const totalRegistros = (kpis.totalProspectos || 0) + (kpis.totalProyectos || 0);
    const tasaConversion = totalRegistros > 0
      ? Math.round(((kpis.ventasCerradas || 0) / totalRegistros) * 100)
      : 0;

    const response = {
      pipeline: {
        nuevos: pipelineObj.nuevo || 0,
        contactados: pipelineObj.contactado || 0,
        enSeguimiento: pipelineObj.en_seguimiento || 0,
        citasAgendadas: pipelineObj.cita_agendada || 0,
        cotizados: pipelineObj.cotizado || 0,
        ventasCerradas: pipelineObj.convertido || 0,
        pedidos: pipelineObj.activo || 0,
        fabricacion: kpis.enFabricacion || 0,
        instalacion: kpis.enInstalacion || 0,
        entregados: kpis.completados || 0,
        postventa: 0 // No usado en modelo unificado
      },
      metricas: {
        periodo: parseInt(periodo),
        prospectosNuevos: kpis.totalProspectos || 0,
        cotizacionesEnviadas: pipelineObj.cotizado || 0,
        ventasCerradas: kpis.ventasCerradas || 0,
        enRiesgo: kpis.enRiesgo || 0,
        montoVentas: montos.montoTotal || 0,
        tasaConversion,
        // Métricas adicionales
        totalCotizaciones: pipelineObj.cotizado || 0,
        cotizacionesAprobadas: kpis.ventasCerradas || 0,
        totalPedidos: kpis.totalProyectos || 0,
        valorTotalPedidos: montos.montoTotal || 0,
        tasaConversionCotizacion: pipelineObj.cotizado > 0
          ? parseFloat(((kpis.ventasCerradas / pipelineObj.cotizado) * 100).toFixed(1))
          : 0,
        tasaConversionPedido: kpis.ventasCerradas > 0
          ? parseFloat(((kpis.totalProyectos / kpis.ventasCerradas) * 100).toFixed(1))
          : 0
      },
      seguimientosPendientes: data.seguimientosPendientes || [],
      actividadReciente: data.actividadReciente || [],
      citasHoy: data.citasHoy || [],
      supervisionEnVivo: data.supervisionEnVivo || [],
      cierresMensuales: data.cierresMensuales || []
    };

    logger.info('Dashboard unificado cargado exitosamente', {
      usuario: req.usuario.nombre,
      rol: req.usuario.rol,
      periodo,
      totalProspectos: kpis.totalProspectos,
      totalProyectos: kpis.totalProyectos,
      enRiesgo: kpis.enRiesgo
    });

    res.json(response);

  } catch (error) {
    logger.error('Error en dashboard unificado', {
      error: error.message,
      stack: error.stack,
      usuario: req.usuario?.nombre
    });
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;

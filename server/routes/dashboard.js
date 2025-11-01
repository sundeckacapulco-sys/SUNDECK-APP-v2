const express = require('express');
const Prospecto = require('../models/Prospecto');
const Cotizacion = require('../models/Cotizacion');
const Pedido = require('../models/Pedido');
const Fabricacion = require('../models/Fabricacion.legacy');
const Instalacion = require('../models/Instalacion');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Dashboard principal con métricas
router.get('/', auth, async (req, res) => {
  try {
    const { periodo = '30' } = req.query; // días
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - parseInt(periodo));

    // Filtros base según rol del usuario
    const filtroUsuario = {};
    if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'gerente') {
      filtroUsuario.vendedorAsignado = req.usuario._id;
    }

    // Contadores por etapa del pipeline
    const contadoresPipeline = await Promise.all([
      Prospecto.countDocuments({ ...filtroUsuario, etapa: 'nuevo', activo: true }),
      Prospecto.countDocuments({ ...filtroUsuario, etapa: 'contactado', activo: true }),
      Prospecto.countDocuments({ ...filtroUsuario, etapa: 'cita_agendada', activo: true }),
      Prospecto.countDocuments({ ...filtroUsuario, etapa: 'cotizacion', activo: true }),
      Prospecto.countDocuments({ ...filtroUsuario, etapa: 'venta_cerrada', activo: true }),
      Prospecto.countDocuments({ ...filtroUsuario, etapa: 'pedido', activo: true }),
      Fabricacion.countDocuments({ estado: { $in: ['pendiente', 'en_proceso'] } }),
      Instalacion.countDocuments({ estado: { $in: ['programada', 'en_proceso'] } }),
      Prospecto.countDocuments({ ...filtroUsuario, etapa: 'entregado', activo: true }),
      Prospecto.countDocuments({ ...filtroUsuario, etapa: 'postventa', activo: true })
    ]);

    // Métricas adicionales de cotizaciones y pedidos
    const metricas = await Promise.all([
      // Total cotizaciones generadas
      Cotizacion.countDocuments({ 
        elaboradaPor: req.usuario.rol === 'admin' || req.usuario.rol === 'gerente' ? 
          { $exists: true } : req.usuario._id,
        createdAt: { $gte: fechaInicio }
      }),
      // Cotizaciones aprobadas
      Cotizacion.countDocuments({ 
        elaboradaPor: req.usuario.rol === 'admin' || req.usuario.rol === 'gerente' ? 
          { $exists: true } : req.usuario._id,
        estado: 'aprobada',
        createdAt: { $gte: fechaInicio }
      }),
      // Total pedidos
      Pedido.countDocuments({ 
        vendedor: req.usuario.rol === 'admin' || req.usuario.rol === 'gerente' ? 
          { $exists: true } : req.usuario._id,
        createdAt: { $gte: fechaInicio }
      }),
      // Valor total de pedidos
      Pedido.aggregate([
        { 
          $match: { 
            vendedor: req.usuario.rol === 'admin' || req.usuario.rol === 'gerente' ? 
              { $exists: true } : req.usuario._id,
            createdAt: { $gte: fechaInicio }
          } 
        },
        { $group: { _id: null, total: { $sum: '$montoTotal' } } }
      ])
    ]);

    const pipeline = {
      nuevos: contadoresPipeline[0],
      contactados: contadoresPipeline[1],
      citasAgendadas: contadoresPipeline[2],
      cotizaciones: contadoresPipeline[3],
      ventasCerradas: contadoresPipeline[4],
      pedidos: contadoresPipeline[5],
      fabricacion: contadoresPipeline[6],
      instalacion: contadoresPipeline[7],
      entregados: contadoresPipeline[8],
      postventa: contadoresPipeline[9]
    };

    // Calcular tasas de conversión
    const totalCotizaciones = metricas[0];
    const cotizacionesAprobadas = metricas[1];
    const totalPedidos = metricas[2];
    const valorTotalPedidos = metricas[3][0]?.total || 0;

    const tasaConversionCotizacion = totalCotizaciones > 0 ? 
      ((cotizacionesAprobadas / totalCotizaciones) * 100).toFixed(1) : 0;
    
    const tasaConversionPedido = cotizacionesAprobadas > 0 ? 
      ((totalPedidos / cotizacionesAprobadas) * 100).toFixed(1) : 0;

    // Métricas del período
    const [
      prospectosNuevos,
      cotizacionesEnviadas,
      ventasCerradasProspectos,
      ventasCerradasPedidos,
      montoVentasProspectos,
      montoVentasPedidos
    ] = await Promise.all([
      Prospecto.countDocuments({
        ...filtroUsuario,
        createdAt: { $gte: fechaInicio },
        activo: true
      }),
      Cotizacion.countDocuments({
        elaboradaPor: req.usuario.rol === 'admin' || req.usuario.rol === 'gerente' ? 
          { $exists: true } : req.usuario._id,
        createdAt: { $gte: fechaInicio }
      }),
      // Contar prospectos en etapa "venta_cerrada" + pedidos (backstage)
      Promise.all([
        Prospecto.countDocuments({
          ...filtroUsuario,
          etapa: 'venta_cerrada',
          updatedAt: { $gte: fechaInicio },
          activo: true
        }),
        Prospecto.countDocuments({
          ...filtroUsuario,
          etapa: 'pedido',
          updatedAt: { $gte: fechaInicio },
          activo: true
        })
      ]).then(([ventasCerradas, pedidosEtapa]) => ventasCerradas + pedidosEtapa),
      // Contar pedidos creados (solo para métricas internas)
      Pedido.countDocuments({
        vendedor: req.usuario.rol === 'admin' || req.usuario.rol === 'gerente' ? 
          { $exists: true } : req.usuario._id,
        createdAt: { $gte: fechaInicio }
      }),
      // Monto de cotizaciones en prospectos venta_cerrada
      Prospecto.aggregate([
        {
          $match: {
            ...filtroUsuario,
            etapa: 'venta_cerrada',
            updatedAt: { $gte: fechaInicio },
            activo: true,
            'cotizaciones.0': { $exists: true }
          }
        },
        {
          $lookup: {
            from: 'cotizaciones',
            localField: 'cotizaciones',
            foreignField: '_id',
            as: 'cotizacionesData'
          }
        },
        {
          $unwind: '$cotizacionesData'
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$cotizacionesData.total' }
          }
        }
      ]),
      // Monto de pedidos
      Pedido.aggregate([
        {
          $match: {
            vendedor: req.usuario.rol === 'admin' || req.usuario.rol === 'gerente' ? 
              { $exists: true } : req.usuario._id,
            createdAt: { $gte: fechaInicio }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$montoTotal' }
          }
        }
      ])
    ]);

    // Ventas cerradas incluye venta_cerrada + pedido (backstage)
    const ventasCerradas = ventasCerradasProspectos; // Ya incluye ambas etapas
    const montoVentasTotal = (montoVentasProspectos[0]?.total || 0) + (montoVentasPedidos[0]?.total || 0);

    // Seguimientos pendientes
    const seguimientosPendientes = await Prospecto.find({
      ...filtroUsuario,
      fechaProximoSeguimiento: { $lte: new Date() },
      etapa: { $nin: ['entregado', 'postventa', 'perdido'] },
      activo: true
    })
    .populate('vendedorAsignado', 'nombre apellido')
    .sort({ fechaProximoSeguimiento: 1 })
    .limit(10);

    // Actividad reciente
    const actividadReciente = await Prospecto.find({
      ...filtroUsuario,
      updatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // últimas 24 horas
      activo: true
    })
    .populate('vendedorAsignado', 'nombre apellido')
    .sort({ updatedAt: -1 })
    .limit(10)
    .select('nombre telefono etapa updatedAt vendedorAsignado');

    // Citas del día
    const hoy = new Date();
    const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const finDia = new Date(inicioDia.getTime() + 24 * 60 * 60 * 1000);

    const citasHoy = await Prospecto.find({
      ...filtroUsuario,
      fechaCita: { $gte: inicioDia, $lt: finDia },
      estadoCita: { $in: ['pendiente', 'confirmada'] },
      activo: true
    })
    .populate('vendedorAsignado', 'nombre apellido')
    .sort({ horaCita: 1 });

    // Calcular tasa de conversión
    const totalProspectos = await Prospecto.countDocuments({
      ...filtroUsuario,
      createdAt: { $gte: fechaInicio },
      activo: true
    });

    const tasaConversion = totalProspectos > 0 ? 
      Math.round((ventasCerradas / totalProspectos) * 100) : 0;

    res.json({
      pipeline,
      metricas: {
        periodo: parseInt(periodo),
        prospectosNuevos,
        cotizacionesEnviadas,
        ventasCerradas,
        montoVentas: montoVentasTotal,
        tasaConversion,
        // Nuevas métricas de cotizaciones y pedidos
        totalCotizaciones,
        cotizacionesAprobadas,
        totalPedidos,
        valorTotalPedidos,
        tasaConversionCotizacion: parseFloat(tasaConversionCotizacion),
        tasaConversionPedido: parseFloat(tasaConversionPedido)
      },
      seguimientosPendientes,
      actividadReciente,
      citasHoy
    });

  } catch (error) {
    console.error('Error obteniendo dashboard:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Métricas detalladas por vendedor (solo admin/gerente)
router.get('/vendedores', auth, async (req, res) => {
  try {
    if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'gerente') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const { periodo = '30' } = req.query;
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - parseInt(periodo));

    const metricas = await Prospecto.aggregate([
      {
        $match: {
          createdAt: { $gte: fechaInicio },
          activo: true,
          vendedorAsignado: { $exists: true }
        }
      },
      {
        $group: {
          _id: '$vendedorAsignado',
          totalProspectos: { $sum: 1 },
          contactados: {
            $sum: {
              $cond: [{ $ne: ['$etapa', 'nuevo'] }, 1, 0]
            }
          },
          citasAgendadas: {
            $sum: {
              $cond: [{ $eq: ['$etapa', 'cita_agendada'] }, 1, 0]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'usuarios',
          localField: '_id',
          foreignField: '_id',
          as: 'vendedor'
        }
      },
      {
        $unwind: '$vendedor'
      },
      {
        $project: {
          vendedor: {
            nombre: '$vendedor.nombre',
            apellido: '$vendedor.apellido'
          },
          totalProspectos: 1,
          contactados: 1,
          citasAgendadas: 1,
          tasaContacto: {
            $multiply: [
              { $divide: ['$contactados', '$totalProspectos'] },
              100
            ]
          }
        }
      }
    ]);

    res.json(metricas);
  } catch (error) {
    console.error('Error obteniendo métricas de vendedores:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Gráfico de conversión del embudo
router.get('/embudo', auth, async (req, res) => {
  try {
    const { periodo = '30' } = req.query;
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - parseInt(periodo));

    const filtroUsuario = {};
    if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'gerente') {
      filtroUsuario.vendedorAsignado = req.usuario._id;
    }

    const embudo = await Prospecto.aggregate([
      {
        $match: {
          ...filtroUsuario,
          createdAt: { $gte: fechaInicio },
          activo: true
        }
      },
      {
        $group: {
          _id: '$etapa',
          cantidad: { $sum: 1 }
        }
      }
    ]);

    // Ordenar etapas según el flujo
    const ordenEtapas = [
      'nuevo', 'contactado', 'cita_agendada', 'cotizacion', 'venta_cerrada',
      'pedido', 'fabricacion', 'instalacion', 'entregado', 'postventa'
    ];

    const embudoOrdenado = ordenEtapas.map(etapa => {
      const item = embudo.find(e => e._id === etapa);
      return {
        etapa,
        cantidad: item ? item.cantidad : 0
      };
    });

    res.json(embudoOrdenado);
  } catch (error) {
    console.error('Error obteniendo embudo:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;

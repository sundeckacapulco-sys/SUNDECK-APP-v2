const express = require('express');
const { auth, verificarPermiso } = require('../middleware/auth');
const KPI = require('../models/KPI');
const ProspectoNoConvertido = require('../models/ProspectoNoConvertido');
const ProyectoPedido = require('../models/ProyectoPedido');
const router = express.Router();

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

// GET /api/kpis/conversion - Análisis detallado de conversión
router.get('/conversion', auth, verificarPermiso('reportes', 'leer'), async (req, res) => {
  try {
    const { fechaInicio, fechaFin, vendedor, tipoProducto } = req.query;
    
    let filtro = {};
    if (fechaInicio && fechaFin) {
      filtro.fechaCreacion = {
        $gte: new Date(fechaInicio),
        $lte: new Date(fechaFin)
      };
    }
    
    // Pipeline de agregación para análisis de conversión
    const pipeline = [
      { $match: filtro },
      {
        $group: {
          _id: '$estado',
          cantidad: { $sum: 1 },
          montoTotal: { $sum: '$precios.total' },
          tiempoPromedio: { $avg: '$tiempos.cicloCompleto' }
        }
      },
      {
        $sort: { cantidad: -1 }
      }
    ];
    
    const conversionPorEtapa = await ProyectoPedido.aggregate(pipeline);
    
    // Análisis de embudo de conversión
    const embudo = {
      prospectos: conversionPorEtapa.reduce((sum, etapa) => sum + etapa.cantidad, 0),
      levantamientos: conversionPorEtapa.filter(e => !['levantamiento'].includes(e._id)).reduce((sum, etapa) => sum + etapa.cantidad, 0),
      cotizaciones: conversionPorEtapa.filter(e => ['cotizacion', 'aprobado', 'confirmado', 'en_fabricacion', 'fabricado', 'en_instalacion', 'completado'].includes(e._id)).reduce((sum, etapa) => sum + etapa.cantidad, 0),
      ventas: conversionPorEtapa.filter(e => ['confirmado', 'en_fabricacion', 'fabricado', 'en_instalacion', 'completado'].includes(e._id)).reduce((sum, etapa) => sum + etapa.cantidad, 0),
      completados: conversionPorEtapa.filter(e => e._id === 'completado').reduce((sum, etapa) => sum + etapa.cantidad, 0)
    };
    
    // Calcular tasas de conversión del embudo
    const tasasEmbudo = {
      prospectoALevantamiento: embudo.prospectos > 0 ? (embudo.levantamientos / embudo.prospectos) * 100 : 0,
      levantamientoACotizacion: embudo.levantamientos > 0 ? (embudo.cotizaciones / embudo.levantamientos) * 100 : 0,
      cotizacionAVenta: embudo.cotizaciones > 0 ? (embudo.ventas / embudo.cotizaciones) * 100 : 0,
      ventaACompletado: embudo.ventas > 0 ? (embudo.completados / embudo.ventas) * 100 : 0
    };
    
    res.json({
      conversionPorEtapa,
      embudo,
      tasasEmbudo,
      resumen: {
        conversionGeneral: embudo.prospectos > 0 ? (embudo.completados / embudo.prospectos) * 100 : 0,
        puntosCriticos: {
          mayorPerdida: Object.entries(tasasEmbudo).reduce((min, [etapa, tasa]) => 
            tasa < min.tasa ? { etapa, tasa } : min, 
            { etapa: '', tasa: 100 }
          )
        }
      }
    });
  } catch (error) {
    console.error('Error obteniendo análisis de conversión:', error);
    res.status(500).json({ message: 'Error obteniendo análisis de conversión', error: error.message });
  }
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
    
    // Análisis de razones de pérdida
    const razonesAnalisis = await ProspectoNoConvertido.analizarPerdidas(
      filtro.fechaPerdida?.$gte || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      filtro.fechaPerdida?.$lte || new Date()
    );
    
    // Pérdidas por etapa
    const perdidasPorEtapa = await ProspectoNoConvertido.aggregate([
      { $match: filtro },
      {
        $group: {
          _id: '$etapaPerdida',
          cantidad: { $sum: 1 },
          montoTotal: { $sum: '$montoEstimado' },
          scorePromedioRecuperacion: { $avg: '$scoreRecuperacion' }
        }
      },
      { $sort: { cantidad: -1 } }
    ]);
    
    // Pérdidas por vendedor
    const perdidasPorVendedor = await ProspectoNoConvertido.aggregate([
      { $match: filtro },
      {
        $group: {
          _id: '$vendedorAsignado',
          cantidad: { $sum: 1 },
          montoTotal: { $sum: '$montoEstimado' }
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
      { $sort: { cantidad: -1 } }
    ]);
    
    // Tendencia de pérdidas (últimos 6 meses)
    const tendenciaPerdidas = await ProspectoNoConvertido.aggregate([
      {
        $match: {
          fechaPerdida: {
            $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        $group: {
          _id: {
            año: { $year: '$fechaPerdida' },
            mes: { $month: '$fechaPerdida' }
          },
          cantidad: { $sum: 1 },
          montoTotal: { $sum: '$montoEstimado' }
        }
      },
      { $sort: { '_id.año': 1, '_id.mes': 1 } }
    ]);
    
    res.json({
      razonesAnalisis,
      perdidasPorEtapa,
      perdidasPorVendedor,
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

// POST /api/kpis/perdidas/:proyectoId - Registrar prospecto como perdido
router.post('/perdidas/:proyectoId', auth, verificarPermiso('ventas', 'editar'), async (req, res) => {
  try {
    const { proyectoId } = req.params;
    const { razonPerdida, descripcion, competidor, precioCompetidor } = req.body;
    
    const proyecto = await ProyectoPedido.findById(proyectoId);
    if (!proyecto) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }
    
    // Crear registro de prospecto no convertido
    const prospectoNoConvertido = new ProspectoNoConvertido({
      proyecto: proyectoId,
      cliente: proyecto.cliente,
      tipoProducto: proyecto.tipoProyecto || 'otro',
      descripcionProyecto: proyecto.descripcion,
      montoEstimado: proyecto.precios?.total || 0,
      etapaPerdida: proyecto.estado,
      razonPerdida: {
        tipo: razonPerdida,
        descripcion,
        competidor,
        precioCompetidor
      },
      vendedorAsignado: req.user.id,
      creadoPor: req.user.id,
      tiempos: {
        diasEnProceso: Math.floor((new Date() - proyecto.fechaCreacion) / (1000 * 60 * 60 * 24))
      }
    });
    
    await prospectoNoConvertido.save();
    
    // Actualizar estado del proyecto
    proyecto.estado = 'cancelado';
    proyecto.historial.push({
      fecha: new Date(),
      tipo: 'cancelacion',
      descripcion: `Proyecto cancelado - Razón: ${razonPerdida}`,
      usuario: req.user.id
    });
    
    await proyecto.save();
    
    res.json({
      message: 'Prospecto registrado como perdido',
      prospectoNoConvertido
    });
  } catch (error) {
    console.error('Error registrando prospecto perdido:', error);
    res.status(500).json({ message: 'Error registrando prospecto perdido', error: error.message });
  }
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
    
    // Agregar intento de recuperación
    prospecto.intentosRecuperacion.push({
      metodo,
      descripcion,
      resultado,
      proximoSeguimiento: proximoSeguimiento ? new Date(proximoSeguimiento) : undefined,
      usuario: req.user.id
    });
    
    // Actualizar estado según resultado
    if (resultado === 'recuperado') {
      prospecto.estadoRecuperacion = 'recuperado';
      prospecto.alertas.alertaActiva = false;
    } else if (resultado === 'interesado' || resultado === 'reagendado') {
      prospecto.estadoRecuperacion = 'en_seguimiento';
      if (proximoSeguimiento) {
        prospecto.alertas.proximoSeguimiento = new Date(proximoSeguimiento);
      }
    } else if (resultado === 'rechazado') {
      prospecto.estadoRecuperacion = 'perdido_definitivo';
      prospecto.alertas.alertaActiva = false;
    }
    
    await prospecto.save();
    
    res.json({
      message: 'Intento de recuperación registrado',
      prospecto
    });
  } catch (error) {
    console.error('Error actualizando recuperación:', error);
    res.status(500).json({ message: 'Error actualizando recuperación', error: error.message });
  }
});

module.exports = router;

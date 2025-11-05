const mongoose = require('mongoose');
const logger = require('../config/logger');

// Modelo para tracking de KPIs y métricas comerciales
const kpiSchema = new mongoose.Schema({
  // Identificación del período
  fecha: {
    type: Date,
    required: true,
    default: Date.now
  },
  periodo: {
    type: String,
    enum: ['diario', 'semanal', 'mensual', 'trimestral', 'anual'],
    required: true
  },
  
  // Métricas de volumen
  metricas: {
    // Prospectos
    prospectosNuevos: { type: Number, default: 0 },
    prospectosActivos: { type: Number, default: 0 },
    prospectosConvertidos: { type: Number, default: 0 },
    prospectosPerdidos: { type: Number, default: 0 },
    
    // Cotizaciones
    cotizacionesEnviadas: { type: Number, default: 0 },
    cotizacionesAprobadas: { type: Number, default: 0 },
    cotizacionesRechazadas: { type: Number, default: 0 },
    
    // Ventas
    ventasCerradas: { type: Number, default: 0 },
    montoVentas: { type: Number, default: 0 },
    ticketPromedio: { type: Number, default: 0 },
    
    // Proyectos
    proyectosCompletados: { type: Number, default: 0 },
    proyectosEnProceso: { type: Number, default: 0 },
    proyectosCancelados: { type: Number, default: 0 }
  },
  
  // Tasas de conversión
  conversiones: {
    prospectoACotizacion: { type: Number, default: 0 }, // %
    cotizacionAVenta: { type: Number, default: 0 }, // %
    ventaAEntrega: { type: Number, default: 0 }, // %
    conversionGeneral: { type: Number, default: 0 } // %
  },
  
  // Tiempos promedio (en días)
  tiempos: {
    prospectoACotizacion: { type: Number, default: 0 },
    cotizacionAAprobacion: { type: Number, default: 0 },
    aprobacionAEntrega: { type: Number, default: 0 },
    cicloCompleto: { type: Number, default: 0 }
  },
  
  // Análisis de pérdidas
  perdidas: {
    enLevantamiento: { type: Number, default: 0 },
    enCotizacion: { type: Number, default: 0 },
    enNegociacion: { type: Number, default: 0 },
    enFabricacion: { type: Number, default: 0 },
    razones: [{
      razon: {
        type: String,
        enum: [
          'precio_alto',
          'tiempo_entrega',
          'competencia',
          'presupuesto_insuficiente',
          'cambio_necesidades',
          'no_responde',
          'decidio_no_comprar',
          'otro'
        ]
      },
      cantidad: { type: Number, default: 0 },
      porcentaje: { type: Number, default: 0 }
    }]
  },
  
  // Métricas por vendedor
  porVendedor: [{
    vendedor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario'
    },
    prospectosAsignados: { type: Number, default: 0 },
    ventasCerradas: { type: Number, default: 0 },
    montoVentas: { type: Number, default: 0 },
    tasaConversion: { type: Number, default: 0 }
  }],
  
  // Métricas por producto
  porProducto: [{
    tipoProducto: {
      type: String,
      enum: ['persianas', 'cortinas', 'toldos', 'proteccion_solar', 'mixto', 'otro']
    },
    cantidad: { type: Number, default: 0 },
    montoVentas: { type: Number, default: 0 },
    porcentajeTotal: { type: Number, default: 0 }
  }],
  
  // Metadatos
  calculadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  fechaCalculo: {
    type: Date,
    default: Date.now
  },
  version: {
    type: String,
    default: '1.0'
  }
}, {
  timestamps: true
});

// Índices para consultas eficientes
kpiSchema.index({ fecha: -1, periodo: 1 });
kpiSchema.index({ 'porVendedor.vendedor': 1, fecha: -1 });

// Método para calcular KPIs automáticamente (actualizado con adaptador legacy)
kpiSchema.statics.calcularKPIs = async function(fechaInicio, fechaFin, periodo = 'mensual') {
  const Proyecto = mongoose.model('Proyecto');
  const Pedido = mongoose.model('Pedido');
  const ProyectoPedido = mongoose.model('ProyectoPedido'); // Temporal durante transición
  
  // Verificar si existen registros legacy recientes
  const legacyCount = await ProyectoPedido.countDocuments({
    createdAt: { $gte: fechaInicio }
  });
  
  if (legacyCount > 0) {
    logger.warn('KPI: Detectados registros legacy en el período', {
      cantidad: legacyCount,
      fechaInicio,
      fechaFin,
      recomendacion: 'Ejecutar migración completa'
    });
  }
  
  // Obtener datos de TODAS las fuentes durante transición
  const proyectos = await Proyecto.find({
    createdAt: { $gte: fechaInicio, $lte: fechaFin }
  }).lean();
  
  const pedidos = await Pedido.find({
    fechaPedido: { $gte: fechaInicio, $lte: fechaFin }
  }).lean();
  
  // TEMPORAL: Incluir legacy solo si existen
  let proyectosLegacy = [];
  if (legacyCount > 0) {
    proyectosLegacy = await ProyectoPedido.find({
      createdAt: { $gte: fechaInicio, $lte: fechaFin }
    }).lean();
  }
  
  // Normalizar datos de todas las fuentes
  const datosNormalizados = [
    ...proyectos.map(p => this.normalizarProyecto(p)),
    ...pedidos.map(p => this.normalizarPedido(p)),
    ...proyectosLegacy.map(p => this.normalizarLegacy(p))
  ];
  
  // Calcular métricas básicas sobre datos normalizados
  const estadosVenta = ['confirmado', 'en_fabricacion', 'fabricado', 'en_instalacion', 'completado', 'entregado', 'instalado'];
  const estadosCompletados = ['completado', 'entregado', 'instalado'];
  const estadosProceso = ['confirmado', 'en_fabricacion', 'fabricado', 'en_instalacion'];
  
  const metricas = {
    prospectosNuevos: datosNormalizados.length,
    prospectosActivos: datosNormalizados.filter(p => !['completado', 'cancelado', 'entregado', 'instalado'].includes(p.estado)).length,
    prospectosConvertidos: datosNormalizados.filter(p => estadosCompletados.includes(p.estado)).length,
    prospectosPerdidos: datosNormalizados.filter(p => p.estado === 'cancelado').length,
    
    cotizacionesEnviadas: datosNormalizados.filter(p => estadosVenta.includes(p.estado) || p.estado === 'cotizado').length,
    cotizacionesAprobadas: datosNormalizados.filter(p => estadosVenta.includes(p.estado)).length,
    cotizacionesRechazadas: datosNormalizados.filter(p => p.estado === 'cancelado').length,
    
    ventasCerradas: datosNormalizados.filter(p => estadosVenta.includes(p.estado)).length,
    montoVentas: datosNormalizados
      .filter(p => estadosVenta.includes(p.estado))
      .reduce((sum, p) => sum + (p.montoTotal || 0), 0),
    
    proyectosCompletados: datosNormalizados.filter(p => estadosCompletados.includes(p.estado)).length,
    proyectosEnProceso: datosNormalizados.filter(p => estadosProceso.includes(p.estado)).length,
    proyectosCancelados: datosNormalizados.filter(p => p.estado === 'cancelado').length
  };
  
  logger.info('KPIs calculados desde fuentes unificadas', {
    totalRegistros: datosNormalizados.length,
    proyectos: proyectos.length,
    pedidos: pedidos.length,
    legacy: proyectosLegacy.length,
    ventasCerradas: metricas.ventasCerradas,
    montoVentas: metricas.montoVentas
  });
  
  // Calcular ticket promedio
  metricas.ticketPromedio = metricas.ventasCerradas > 0 ? metricas.montoVentas / metricas.ventasCerradas : 0;
  
  // Calcular tasas de conversión
  const conversiones = {
    prospectoACotizacion: metricas.prospectosNuevos > 0 ? (metricas.cotizacionesEnviadas / metricas.prospectosNuevos) * 100 : 0,
    cotizacionAVenta: metricas.cotizacionesEnviadas > 0 ? (metricas.ventasCerradas / metricas.cotizacionesEnviadas) * 100 : 0,
    ventaAEntrega: metricas.ventasCerradas > 0 ? (metricas.proyectosCompletados / metricas.ventasCerradas) * 100 : 0,
    conversionGeneral: metricas.prospectosNuevos > 0 ? (metricas.proyectosCompletados / metricas.prospectosNuevos) * 100 : 0
  };
  
  // Calcular análisis de pérdidas
  const perdidas = {
    enLevantamiento: proyectos.filter(p => p.estado === 'cancelado' && p.historial?.length === 1).length,
    enCotizacion: proyectos.filter(p => p.estado === 'cancelado' && p.historial?.some(h => h.tipo === 'cotizacion')).length,
    enNegociacion: proyectos.filter(p => p.estado === 'cancelado' && p.historial?.some(h => h.tipo === 'aprobado')).length,
    enFabricacion: proyectos.filter(p => p.estado === 'cancelado' && ['en_fabricacion', 'fabricado'].some(e => p.historial?.some(h => h.descripcion?.includes(e)))).length,
    razones: [
      { razon: 'precio_alto', cantidad: 0, porcentaje: 0 },
      { razon: 'tiempo_entrega', cantidad: 0, porcentaje: 0 },
      { razon: 'competencia', cantidad: 0, porcentaje: 0 },
      { razon: 'presupuesto_insuficiente', cantidad: 0, porcentaje: 0 },
      { razon: 'no_responde', cantidad: 0, porcentaje: 0 }
    ]
  };
  
  // Crear registro de KPI
  const kpi = new this({
    fecha: fechaFin,
    periodo,
    metricas,
    conversiones,
    perdidas,
    fechaCalculo: new Date()
  });
  
  return kpi;
};

// Método para obtener tendencias
kpiSchema.statics.obtenerTendencias = async function(meses = 6) {
  const fechaInicio = new Date();
  fechaInicio.setMonth(fechaInicio.getMonth() - meses);
  
  return await this.find({
    fecha: { $gte: fechaInicio },
    periodo: 'mensual'
  }).sort({ fecha: 1 });
};

// Funciones de normalización para adaptador multi-fuente
kpiSchema.statics.normalizarProyecto = function(proyecto) {
  return {
    id: proyecto._id,
    tipo: 'proyecto',
    estado: proyecto.estado,
    montoTotal: proyecto.pagos?.montoTotal || 0,
    fechaCreacion: proyecto.createdAt,
    fuente: 'Proyecto'
  };
};

kpiSchema.statics.normalizarPedido = function(pedido) {
  return {
    id: pedido._id,
    tipo: 'pedido',
    estado: pedido.estado,
    montoTotal: pedido.montoTotal || 0,
    fechaCreacion: pedido.fechaPedido || pedido.createdAt,
    fuente: 'Pedido'
  };
};

kpiSchema.statics.normalizarLegacy = function(legacy) {
  return {
    id: legacy._id,
    tipo: 'legacy',
    estado: legacy.estado,
    montoTotal: legacy.pagos?.montoTotal || 0,
    fechaCreacion: legacy.createdAt,
    fuente: 'ProyectoPedido.legacy'
  };
};

module.exports = mongoose.model('KPI', kpiSchema);

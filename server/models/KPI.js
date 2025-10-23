const mongoose = require('mongoose');

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

// Método para calcular KPIs automáticamente
kpiSchema.statics.calcularKPIs = async function(fechaInicio, fechaFin, periodo = 'mensual') {
  const ProyectoPedido = mongoose.model('ProyectoPedido');
  
  // Obtener todos los proyectos del período
  const proyectos = await ProyectoPedido.find({
    fechaCreacion: {
      $gte: fechaInicio,
      $lte: fechaFin
    }
  }).populate('cliente').lean();
  
  // Calcular métricas básicas
  const metricas = {
    prospectosNuevos: proyectos.length,
    prospectosActivos: proyectos.filter(p => !['completado', 'cancelado'].includes(p.estado)).length,
    prospectosConvertidos: proyectos.filter(p => p.estado === 'completado').length,
    prospectosPerdidos: proyectos.filter(p => p.estado === 'cancelado').length,
    
    cotizacionesEnviadas: proyectos.filter(p => ['cotizacion', 'aprobado', 'confirmado', 'en_fabricacion', 'fabricado', 'en_instalacion', 'completado'].includes(p.estado)).length,
    cotizacionesAprobadas: proyectos.filter(p => ['aprobado', 'confirmado', 'en_fabricacion', 'fabricado', 'en_instalacion', 'completado'].includes(p.estado)).length,
    cotizacionesRechazadas: proyectos.filter(p => p.estado === 'cancelado' && p.historial?.some(h => h.tipo === 'cotizacion')).length,
    
    ventasCerradas: proyectos.filter(p => ['confirmado', 'en_fabricacion', 'fabricado', 'en_instalacion', 'completado'].includes(p.estado)).length,
    montoVentas: proyectos.filter(p => ['confirmado', 'en_fabricacion', 'fabricado', 'en_instalacion', 'completado'].includes(p.estado)).reduce((sum, p) => sum + (p.precios?.total || 0), 0),
    
    proyectosCompletados: proyectos.filter(p => p.estado === 'completado').length,
    proyectosEnProceso: proyectos.filter(p => ['confirmado', 'en_fabricacion', 'fabricado', 'en_instalacion'].includes(p.estado)).length,
    proyectosCancelados: proyectos.filter(p => p.estado === 'cancelado').length
  };
  
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

module.exports = mongoose.model('KPI', kpiSchema);

const mongoose = require('mongoose');

// Modelo específico para tracking de prospectos que no cierran
const prospectoNoConvertidoSchema = new mongoose.Schema({
  // Referencia al proyecto original
  proyecto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProyectoPedido',
    required: true
  },
  
  // Información del cliente
  cliente: {
    nombre: { type: String, required: true },
    telefono: { type: String, required: true },
    email: String,
    direccion: {
      calle: String,
      colonia: String,
      ciudad: String
    }
  },
  
  // Información del proyecto perdido
  tipoProducto: {
    type: String,
    enum: ['persianas', 'cortinas', 'toldos', 'proteccion_solar', 'mixto', 'otro'],
    required: true
  },
  descripcionProyecto: String,
  montoEstimado: {
    type: Number,
    default: 0
  },
  
  // Análisis de la pérdida
  etapaPerdida: {
    type: String,
    enum: ['levantamiento', 'cotizacion', 'negociacion', 'confirmacion', 'fabricacion', 'instalacion'],
    required: true
  },
  fechaPerdida: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  // Razón principal de pérdida
  razonPerdida: {
    tipo: {
      type: String,
      enum: [
        'precio_alto',
        'tiempo_entrega_largo',
        'competencia_mejor_oferta',
        'presupuesto_insuficiente',
        'cambio_necesidades',
        'cliente_no_responde',
        'decidio_no_comprar',
        'calidad_percibida',
        'servicio_inadecuado',
        'ubicacion_inconveniente',
        'otro'
      ],
      required: true
    },
    descripcion: String, // Detalles adicionales
    competidor: String, // Si eligió competencia
    precioCompetidor: Number // Si fue por precio
  },
  
  // Esfuerzos de recuperación
  intentosRecuperacion: [{
    fecha: { type: Date, default: Date.now },
    metodo: {
      type: String,
      enum: ['llamada', 'whatsapp', 'email', 'visita', 'descuento', 'promocion']
    },
    descripcion: String,
    resultado: {
      type: String,
      enum: ['sin_respuesta', 'interesado', 'rechazado', 'reagendado', 'recuperado']
    },
    proximoSeguimiento: Date,
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario'
    }
  }],
  
  // Estado actual del prospecto perdido
  estadoRecuperacion: {
    type: String,
    enum: ['perdido_definitivo', 'en_seguimiento', 'recuperable', 'recuperado', 'no_contactable'],
    default: 'perdido_definitivo'
  },
  
  // Análisis de recuperabilidad
  scoreRecuperacion: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  factoresRecuperacion: {
    tiempoSinContacto: Number, // días
    razonRecuperable: Boolean,
    montoAtractivo: Boolean,
    clienteRespondio: Boolean,
    competenciaDebil: Boolean
  },
  
  // Lecciones aprendidas
  leccionesAprendidas: [{
    categoria: {
      type: String,
      enum: ['precio', 'producto', 'servicio', 'proceso', 'comunicacion', 'timing']
    },
    leccion: String,
    accionCorrectiva: String,
    implementada: { type: Boolean, default: false }
  }],
  
  // Información del vendedor
  vendedorAsignado: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  
  // Métricas de tiempo
  tiempos: {
    diasEnProceso: Number, // Total de días desde inicio hasta pérdida
    diasUltimoContacto: Number, // Días desde último contacto
    diasSinActividad: Number // Días sin ninguna actividad
  },
  
  // Alertas y seguimiento
  alertas: {
    proximoSeguimiento: Date,
    frecuenciaSeguimiento: {
      type: String,
      enum: ['diario', 'semanal', 'quincenal', 'mensual', 'trimestral', 'nunca'],
      default: 'mensual'
    },
    alertaActiva: { type: Boolean, default: true }
  },
  
  // Metadatos
  creadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  },
  ultimaActualizacion: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índices para consultas eficientes
prospectoNoConvertidoSchema.index({ fechaPerdida: -1 });
prospectoNoConvertidoSchema.index({ vendedorAsignado: 1, estadoRecuperacion: 1 });
prospectoNoConvertidoSchema.index({ 'razonPerdida.tipo': 1 });
prospectoNoConvertidoSchema.index({ 'alertas.proximoSeguimiento': 1, 'alertas.alertaActiva': 1 });

// Middleware para actualizar fechas
prospectoNoConvertidoSchema.pre('save', function(next) {
  this.ultimaActualizacion = new Date();
  
  // Calcular días sin contacto
  if (this.intentosRecuperacion.length > 0) {
    const ultimoIntento = this.intentosRecuperacion[this.intentosRecuperacion.length - 1];
    this.tiempos.diasUltimoContacto = Math.floor((new Date() - ultimoIntento.fecha) / (1000 * 60 * 60 * 24));
  } else {
    this.tiempos.diasUltimoContacto = Math.floor((new Date() - this.fechaPerdida) / (1000 * 60 * 60 * 24));
  }
  
  // Calcular score de recuperación
  this.calcularScoreRecuperacion();
  
  next();
});

// Método para calcular score de recuperación
prospectoNoConvertidoSchema.methods.calcularScoreRecuperacion = function() {
  let score = 50; // Base
  
  // Factor tiempo (mientras más reciente, mejor)
  if (this.tiempos.diasUltimoContacto <= 7) score += 20;
  else if (this.tiempos.diasUltimoContacto <= 30) score += 10;
  else if (this.tiempos.diasUltimoContacto <= 90) score -= 10;
  else score -= 30;
  
  // Factor razón de pérdida
  const razonesRecuperables = ['precio_alto', 'tiempo_entrega_largo', 'presupuesto_insuficiente'];
  if (razonesRecuperables.includes(this.razonPerdida.tipo)) score += 15;
  
  // Factor monto
  if (this.montoEstimado > 50000) score += 10;
  else if (this.montoEstimado > 20000) score += 5;
  
  // Factor respuesta del cliente
  const ultimoIntento = this.intentosRecuperacion[this.intentosRecuperacion.length - 1];
  if (ultimoIntento && ['interesado', 'reagendado'].includes(ultimoIntento.resultado)) {
    score += 25;
  }
  
  // Factor etapa de pérdida (más avanzado = más recuperable)
  const etapasScore = {
    'levantamiento': -5,
    'cotizacion': 0,
    'negociacion': 10,
    'confirmacion': 15,
    'fabricacion': -20,
    'instalacion': -30
  };
  score += etapasScore[this.etapaPerdida] || 0;
  
  this.scoreRecuperacion = Math.max(0, Math.min(100, score));
};

// Método estático para obtener prospectos recuperables
prospectoNoConvertidoSchema.statics.obtenerRecuperables = function(limite = 50) {
  return this.find({
    estadoRecuperacion: { $in: ['en_seguimiento', 'recuperable'] },
    scoreRecuperacion: { $gte: 30 },
    'alertas.alertaActiva': true
  })
  .sort({ scoreRecuperacion: -1, fechaPerdida: -1 })
  .limit(limite)
  .populate('vendedorAsignado', 'nombre email')
  .populate('proyecto', 'numero');
};

// Método estático para análisis de pérdidas
prospectoNoConvertidoSchema.statics.analizarPerdidas = async function(fechaInicio, fechaFin) {
  const pipeline = [
    {
      $match: {
        fechaPerdida: {
          $gte: fechaInicio,
          $lte: fechaFin
        }
      }
    },
    {
      $group: {
        _id: '$razonPerdida.tipo',
        cantidad: { $sum: 1 },
        montoTotal: { $sum: '$montoEstimado' },
        promedioMonto: { $avg: '$montoEstimado' },
        etapas: { $push: '$etapaPerdida' }
      }
    },
    {
      $sort: { cantidad: -1 }
    }
  ];
  
  return await this.aggregate(pipeline);
};

// Método para programar seguimiento automático
prospectoNoConvertidoSchema.methods.programarSeguimiento = function(dias = 7) {
  const proximaFecha = new Date();
  proximaFecha.setDate(proximaFecha.getDate() + dias);
  
  this.alertas.proximoSeguimiento = proximaFecha;
  this.alertas.alertaActiva = true;
  
  return this.save();
};

module.exports = mongoose.model('ProspectoNoConvertido', prospectoNoConvertidoSchema);

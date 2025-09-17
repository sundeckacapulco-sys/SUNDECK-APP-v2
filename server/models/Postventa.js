const mongoose = require('mongoose');

const postventaSchema = new mongoose.Schema({
  // Referencias
  pedido: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pedido',
    required: true
  },
  instalacion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Instalacion',
    required: true
  },
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prospecto',
    required: true
  },
  
  // Información básica
  numero: {
    type: String,
    unique: true,
    required: true
  },
  fechaInicio: {
    type: Date,
    default: Date.now
  },
  
  // Encuesta de satisfacción
  encuestaSatisfaccion: {
    fechaRealizada: Date,
    calificaciones: {
      calidadProducto: { type: Number, min: 1, max: 5 },
      calidadInstalacion: { type: Number, min: 1, max: 5 },
      atencionCliente: { type: Number, min: 1, max: 5 },
      tiemposEntrega: { type: Number, min: 1, max: 5 },
      satisfaccionGeneral: { type: Number, min: 1, max: 5 }
    },
    comentarios: String,
    recomendaria: { type: Boolean },
    mejoras: String,
    realizada: { type: Boolean, default: false }
  },
  
  // Seguimiento de garantía
  garantia: {
    fechaInicio: Date,
    vigencia: Number, // meses
    estado: {
      type: String,
      enum: ['activa', 'vencida', 'anulada'],
      default: 'activa'
    },
    reclamaciones: [{
      fecha: { type: Date, default: Date.now },
      descripcion: String,
      tipo: {
        type: String,
        enum: ['defecto_fabricacion', 'defecto_instalacion', 'desgaste_normal', 'mal_uso', 'otro']
      },
      estado: {
        type: String,
        enum: ['reportada', 'en_revision', 'aprobada', 'rechazada', 'resuelta'],
        default: 'reportada'
      },
      solucion: String,
      costoReparacion: Number,
      fechaResolucion: Date,
      fotos: [String],
      responsable: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }
    }]
  },
  
  // Mantenimiento preventivo
  mantenimiento: [{
    tipo: {
      type: String,
      enum: ['limpieza', 'lubricacion', 'ajuste', 'revision_general']
    },
    fechaProgramada: Date,
    fechaRealizada: Date,
    realizado: { type: Boolean, default: false },
    tecnico: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    observaciones: String,
    fotos: [String],
    proximaFecha: Date
  }],
  
  // Referidos generados
  referidos: [{
    nombre: String,
    telefono: String,
    email: String,
    fechaReferido: { type: Date, default: Date.now },
    contactado: { type: Boolean, default: false },
    fechaContacto: Date,
    convertido: { type: Boolean, default: false },
    montoVenta: Number,
    comisionReferido: Number
  }],
  
  // Comunicaciones post-venta
  comunicaciones: [{
    fecha: { type: Date, default: Date.now },
    tipo: {
      type: String,
      enum: ['llamada', 'whatsapp', 'email', 'visita', 'encuesta']
    },
    motivo: {
      type: String,
      enum: ['seguimiento', 'garantia', 'mantenimiento', 'referidos', 'satisfaccion', 'otro']
    },
    contenido: String,
    respuesta: String,
    responsable: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }
  }],
  
  // Oportunidades de venta adicional
  oportunidadesVenta: [{
    fecha: { type: Date, default: Date.now },
    descripcion: String,
    productos: [String],
    montoEstimado: Number,
    probabilidad: {
      type: String,
      enum: ['baja', 'media', 'alta']
    },
    estado: {
      type: String,
      enum: ['identificada', 'contactado', 'cotizado', 'cerrada', 'perdida'],
      default: 'identificada'
    },
    responsable: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }
  }],
  
  // Programa de fidelización
  fidelizacion: {
    puntos: { type: Number, default: 0 },
    nivel: {
      type: String,
      enum: ['bronce', 'plata', 'oro', 'platino'],
      default: 'bronce'
    },
    beneficios: [String],
    descuentosAplicados: [{
      fecha: Date,
      porcentaje: Number,
      monto: Number,
      concepto: String
    }]
  },
  
  // Recordatorios automáticos
  recordatorios: [{
    tipo: {
      type: String,
      enum: ['encuesta', 'mantenimiento', 'garantia', 'referidos', 'seguimiento']
    },
    fechaProgramada: Date,
    enviado: { type: Boolean, default: false },
    fechaEnvio: Date,
    respuesta: String
  }],
  
  // Estado general de postventa
  estado: {
    type: String,
    enum: ['activo', 'completado', 'inactivo'],
    default: 'activo'
  },
  
  // Métricas
  metricas: {
    npsScore: Number, // Net Promoter Score
    tiempoRespuestaPromedio: Number, // horas
    satisfaccionPromedio: Number,
    referidosGenerados: { type: Number, default: 0 },
    ventasAdicionales: { type: Number, default: 0 }
  },
  
  // Notas generales
  notas: [{
    fecha: { type: Date, default: Date.now },
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    contenido: String,
    tipo: {
      type: String,
      enum: ['general', 'satisfaccion', 'garantia', 'oportunidad', 'problema']
    }
  }]
}, {
  timestamps: true
});

// Generar número de postventa automáticamente
postventaSchema.pre('save', async function(next) {
  if (this.isNew && !this.numero) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1)
      }
    });
    this.numero = `PV-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Método para calcular NPS Score
postventaSchema.methods.calcularNPS = function() {
  if (!this.encuestaSatisfaccion.realizada || !this.encuestaSatisfaccion.calificaciones.satisfaccionGeneral) {
    return null;
  }
  
  const score = this.encuestaSatisfaccion.calificaciones.satisfaccionGeneral;
  if (score >= 4) return 'promotor';
  if (score >= 3) return 'neutro';
  return 'detractor';
};

// Método para verificar garantía vigente
postventaSchema.methods.garantiaVigente = function() {
  if (!this.garantia.fechaInicio || !this.garantia.vigencia) return false;
  
  const fechaVencimiento = new Date(this.garantia.fechaInicio);
  fechaVencimiento.setMonth(fechaVencimiento.getMonth() + this.garantia.vigencia);
  
  return new Date() <= fechaVencimiento && this.garantia.estado === 'activa';
};

// Método para calcular satisfacción promedio
postventaSchema.methods.calcularSatisfaccionPromedio = function() {
  if (!this.encuestaSatisfaccion.realizada) return 0;
  
  const calificaciones = this.encuestaSatisfaccion.calificaciones;
  const valores = Object.values(calificaciones).filter(val => typeof val === 'number');
  
  if (valores.length === 0) return 0;
  
  const suma = valores.reduce((total, val) => total + val, 0);
  return Math.round((suma / valores.length) * 100) / 100;
};

// Índices
postventaSchema.index({ numero: 1 });
postventaSchema.index({ pedido: 1 });
postventaSchema.index({ cliente: 1 });
postventaSchema.index({ estado: 1 });
postventaSchema.index({ 'garantia.estado': 1 });

module.exports = mongoose.model('Postventa', postventaSchema);

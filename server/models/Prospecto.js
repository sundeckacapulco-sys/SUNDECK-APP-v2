const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const prospectoSchema = new mongoose.Schema({
  // Información básica del cliente
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  telefono: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  direccion: {
    calle: String,
    colonia: String,
    ciudad: String,
    codigoPostal: String,
    referencias: String,
    linkMapa: String
  },
  
  // Información del producto/servicio
  producto: {
    type: String,
    required: true
  },
  tipoProducto: {
    type: String,
    enum: ['visita_servicio', 'toma_medidas', 'cotizacion', 'instalacion', 'mantenimiento', 'reparacion', 'garantia', 'asesoria', 'otro'],
    default: 'visita_servicio'
  },
  descripcionNecesidad: String,
  presupuestoEstimado: Number,
  
  // Gestión de citas y seguimiento
  fechaCita: Date,
  horaCita: String,
  estadoCita: {
    type: String,
    enum: ['pendiente', 'confirmada', 'reagendada', 'completada', 'cancelada'],
    default: 'pendiente'
  },
  
  // Información de reagendamiento
  motivoReagendamiento: String,
  evidenciasReagendamiento: [{
    nombre: String,
    url: String,
    tipo: String,
    fechaSubida: { type: Date, default: Date.now }
  }],
  
  // Estado en el pipeline
  etapa: {
    type: String,
    enum: ['nuevo', 'contactado', 'cita_agendada', 'cotizacion', 'venta_cerrada', 'pedido', 'fabricacion', 'instalacion', 'entregado', 'postventa', 'perdido'],
    default: 'nuevo'
  },
  
  // Seguimiento y notas
  notas: [{
    fecha: { type: Date, default: Date.now },
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    contenido: String,
    tipo: {
      type: String,
      enum: ['llamada', 'whatsapp', 'email', 'visita', 'nota', 'reagendamiento'],
      default: 'nota'
    },
    categoria: {
      type: String,
      enum: ['General', 'Puntualidad', 'Calidad', 'Cliente'],
      default: 'General'
    }
  }],
  
  // Timeline de instalación / etapas
  etapas: [{
    nombre: { type: String, required: true },
    fechaHora: { type: Date, default: Date.now },
    observaciones: String,
    archivos: [{
      nombre: String,
      url: String,
      tipo: String,
      fechaSubida: { type: Date, default: Date.now }
    }],
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }
  }],
  
  // Asignación y responsabilidad
  vendedorAsignado: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  
  // Origen del prospecto
  fuente: {
    type: String,
    enum: ['web', 'telefono', 'referido', 'Referido', 'facebook', 'Facebook', 'instagram', 'Instagram', 'google', 'Google', 'volante', 'cotizacion_directa', 'otro'],
    default: 'web'
  },
  referidoPor: String,
  
  // Prioridad y urgencia
  prioridad: {
    type: String,
    enum: ['baja', 'media', 'alta', 'urgente'],
    default: 'media'
  },
  
  // Fechas importantes
  fechaUltimoContacto: Date,
  fechaProximoSeguimiento: Date,
  
  // Calificación del prospecto
  calificacion: {
    interes: { type: Number, min: 1, max: 5 },
    presupuesto: { type: Number, min: 1, max: 5 },
    urgencia: { type: Number, min: 1, max: 5 },
    autoridad: { type: Number, min: 1, max: 5 }
  },
  
  // Información adicional
  comoSeEntero: String,
  competencia: [String],
  motivoCompra: {
    type: String,
    enum: ['privacidad', 'control_luz', 'decoracion', 'ahorro_energia', 'proteccion_solar', 'seguridad', 'reemplazo', 'casa_nueva', 'remodelacion', 'recomendacion', 'precio_oferta', 'otro', '']
  },
  
  // Archivos adjuntos
  archivos: [{
    nombre: String,
    url: String,
    tipo: String,
    fechaSubida: { type: Date, default: Date.now }
  }],
  
  // Estado del registro
  activo: {
    type: Boolean,
    default: true
  },
  archivado: {
    type: Boolean,
    default: false
  },
  fechaArchivado: {
    type: Date,
    default: null
  },
  motivoArchivado: {
    type: String,
    enum: ['perdido', 'no_interesado', 'sin_presupuesto', 'competencia', 'no_contacta', 'otro'],
    required: false
  },
  enPapelera: {
    type: Boolean,
    default: false
  },
  fechaEliminacion: {
    type: Date,
    default: null
  },
  eliminadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    default: null
  }
}, {
  timestamps: true
});

// Índices para búsquedas eficientes
prospectoSchema.index({ telefono: 1 });
prospectoSchema.index({ email: 1 });
prospectoSchema.index({ etapa: 1 });
prospectoSchema.index({ vendedorAsignado: 1 });
prospectoSchema.index({ fechaProximoSeguimiento: 1 });
prospectoSchema.index({ archivado: 1 });
prospectoSchema.index({ enPapelera: 1 });
prospectoSchema.index({ createdAt: -1 });

// Método para calcular score del prospecto
prospectoSchema.methods.calcularScore = function() {
  if (!this.calificacion) return 0;
  const { interes, presupuesto, urgencia, autoridad } = this.calificacion;
  return Math.round((interes + presupuesto + urgencia + autoridad) / 4 * 20);
};

// Método para verificar si necesita seguimiento
prospectoSchema.methods.necesitaSeguimiento = function() {
  if (!this.fechaProximoSeguimiento) return false;
  return new Date() >= this.fechaProximoSeguimiento;
};

// Agregar plugin de paginación
prospectoSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Prospecto', prospectoSchema);

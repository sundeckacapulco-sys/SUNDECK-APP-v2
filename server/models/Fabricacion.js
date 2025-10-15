const mongoose = require('mongoose');

const fabricacionSchema = new mongoose.Schema({
  // Referencias
  pedido: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pedido',
    required: true
  },
  prospecto: {
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
  fechaFinEstimada: Date,
  fechaFinReal: Date,
  
  // Estado de fabricación
  estado: {
    type: String,
    enum: ['pendiente', 'en_proceso', 'pausado', 'completada', 'terminado', 'entregado'],
    default: 'pendiente'
  },
  
  // Asignación
  asignadoA: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  prioridad: {
    type: String,
    enum: ['baja', 'media', 'alta'],
    default: 'media'
  },
  
  // Productos a fabricar
  productos: [{
    productoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto' },
    nombre: String,
    cantidad: Number,
    medidas: {
      ancho: Number,
      alto: Number,
      area: Number
    },
    especificaciones: {
      material: String,
      color: String,
      cristal: String,
      herrajes: String
    },
    requiereR24: Boolean,
    estado: {
      type: String,
      enum: ['pendiente', 'cortado', 'armado', 'terminado'],
      default: 'pendiente'
    },
    fechaInicio: Date,
    fechaTermino: Date,
    operario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }
  }],
  
  // Materiales necesarios
  materiales: [{
    nombre: String,
    tipo: String, // perfil, cristal, herraje, sellador, etc.
    cantidad: Number,
    unidad: String,
    disponible: { type: Boolean, default: false },
    fechaSolicitud: Date,
    fechaRecepcion: Date,
    proveedor: String,
    costo: Number
  }],
  
  // Proceso de fabricación
  procesos: [{
    nombre: String,
    descripcion: String,
    orden: Number,
    estado: {
      type: String,
      enum: ['pendiente', 'en_proceso', 'completado'],
      default: 'pendiente'
    },
    fechaInicio: Date,
    fechaFin: Date,
    operario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    tiempoEstimado: Number, // minutos
    tiempoReal: Number, // minutos
    notas: String
  }],
  
  // Control de calidad
  controlCalidad: [{
    fecha: { type: Date, default: Date.now },
    inspector: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    producto: String,
    resultado: {
      type: String,
      enum: ['aprobado', 'rechazado', 'requiere_correccion'],
      default: 'aprobado'
    },
    observaciones: String,
    fotos: [String],
    correccionesRequeridas: [String]
  }],
  
  // Responsables
  supervisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  operarios: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  }],
  
  // Seguimiento y notas
  notas: [{
    fecha: { type: Date, default: Date.now },
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    contenido: String,
    tipo: {
      type: String,
      enum: ['general', 'problema', 'solucion', 'cambio', 'calidad']
    }
  }],
  
  // Archivos y fotos
  archivos: [{
    tipo: {
      type: String,
      enum: ['plano', 'foto_proceso', 'foto_terminado', 'especificacion', 'otro']
    },
    nombre: String,
    url: String,
    fechaSubida: { type: Date, default: Date.now }
  }],
  
  // Costos reales
  costos: {
    materiales: Number,
    manoObra: Number,
    overhead: Number,
    total: Number
  },
  
  // Información de entrega a instalación
  entregaInstalacion: {
    fecha: Date,
    responsable: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    ubicacion: String,
    notas: String,
    fotos: [String]
  }
}, {
  timestamps: true
});

// Generar número de fabricación automáticamente
fabricacionSchema.pre('save', async function(next) {
  if (this.isNew && !this.numero) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1)
      }
    });
    this.numero = `FAB-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Método para calcular progreso
fabricacionSchema.methods.calcularProgreso = function() {
  const totalProcesos = this.procesos.length;
  if (totalProcesos === 0) return 0;
  
  const procesosCompletados = this.procesos.filter(p => p.estado === 'completado').length;
  return Math.round((procesosCompletados / totalProcesos) * 100);
};

// Método para verificar si todos los materiales están disponibles
fabricacionSchema.methods.materialesDisponibles = function() {
  return this.materiales.every(material => material.disponible);
};

// Método para calcular días de retraso
fabricacionSchema.methods.diasRetraso = function() {
  if (!this.fechaFinEstimada || this.estado === 'terminado') return 0;
  
  const hoy = new Date();
  if (hoy <= this.fechaFinEstimada) return 0;
  
  return Math.ceil((hoy - this.fechaFinEstimada) / (1000 * 60 * 60 * 24));
};

// Índices
fabricacionSchema.index({ numero: 1 });
fabricacionSchema.index({ pedido: 1 });
fabricacionSchema.index({ estado: 1 });
fabricacionSchema.index({ fechaFinEstimada: 1 });
fabricacionSchema.index({ supervisor: 1 });

module.exports = mongoose.model('Fabricacion', fabricacionSchema);

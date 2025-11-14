const mongoose = require('mongoose');

/**
 * Modelo para gestionar sobrantes de materiales
 * Permite reutilizar cortes sobrantes en futuras órdenes
 */
const sobranteMaterialSchema = new mongoose.Schema({
  // Información del material
  tipo: {
    type: String,
    required: true,
    enum: ['Tubo', 'Cofre', 'Barra de Giro', 'Contrapeso', 'Tela', 'Cable', 'Madera'],
    index: true
  },
  
  descripcion: {
    type: String,
    required: true
  },
  
  codigo: {
    type: String,
    index: true
  },
  
  // Características del sobrante
  longitud: {
    type: Number,
    required: true,
    min: 0
  },
  
  unidad: {
    type: String,
    default: 'ml',
    enum: ['ml', 'm', 'cm']
  },
  
  // Metadata adicional
  diametro: String, // Para tubos
  color: String,
  acabado: String,
  
  // Estado y ubicación
  estado: {
    type: String,
    enum: ['disponible', 'reservado', 'usado', 'descartado'],
    default: 'disponible',
    index: true
  },
  
  ubicacionAlmacen: {
    type: String,
    default: 'Almacén General'
  },
  
  etiqueta: {
    type: String,
    unique: true,
    sparse: true
  },
  
  // Origen del sobrante
  origenProyecto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Proyecto'
  },
  
  origenOrdenProduccion: {
    type: String // Número de orden
  },
  
  fechaGenerado: {
    type: Date,
    default: Date.now
  },
  
  // Uso del sobrante
  usadoEn: {
    proyecto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Proyecto'
    },
    fecha: Date,
    observaciones: String
  },
  
  // Observaciones
  observaciones: {
    type: String
  },
  
  // Calidad
  condicion: {
    type: String,
    enum: ['excelente', 'buena', 'regular', 'mala'],
    default: 'excelente'
  },
  
  // Metadata
  creadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  
  actualizadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  }
}, {
  timestamps: true
});

// Índices compuestos
sobranteMaterialSchema.index({ tipo: 1, estado: 1, longitud: -1 });
sobranteMaterialSchema.index({ codigo: 1, estado: 1 });
sobranteMaterialSchema.index({ estado: 1, fechaGenerado: -1 });

// Métodos de instancia
sobranteMaterialSchema.methods.marcarComoUsado = function(proyectoId, observaciones) {
  this.estado = 'usado';
  this.usadoEn = {
    proyecto: proyectoId,
    fecha: new Date(),
    observaciones: observaciones || ''
  };
  return this.save();
};

sobranteMaterialSchema.methods.reservar = function() {
  this.estado = 'reservado';
  return this.save();
};

sobranteMaterialSchema.methods.liberar = function() {
  this.estado = 'disponible';
  return this.save();
};

// Métodos estáticos
sobranteMaterialSchema.statics.buscarDisponibles = function(tipo, longitudMinima, filtros = {}) {
  const query = {
    tipo,
    estado: 'disponible',
    longitud: { $gte: longitudMinima },
    ...filtros
  };
  
  return this.find(query)
    .sort({ longitud: 1 }) // Ordenar por longitud ascendente (usar el más pequeño primero)
    .lean();
};

sobranteMaterialSchema.statics.buscarOptimo = function(tipo, longitudNecesaria, margen = 0.10) {
  return this.findOne({
    tipo,
    estado: 'disponible',
    longitud: { 
      $gte: longitudNecesaria,
      $lte: longitudNecesaria + margen // Buscar sobrantes que no desperdicien mucho
    }
  })
  .sort({ longitud: 1 })
  .lean();
};

sobranteMaterialSchema.statics.generarEtiqueta = function(tipo, codigo) {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${tipo.substring(0, 3).toUpperCase()}-${codigo || 'GEN'}-${timestamp}-${random}`;
};

// Virtual para saber si es reutilizable
sobranteMaterialSchema.virtual('esReutilizable').get(function() {
  // Considerar reutilizable si tiene más de 1m y está en buena condición
  return this.longitud >= 1.00 && 
         this.estado === 'disponible' && 
         ['excelente', 'buena'].includes(this.condicion);
});

// Configurar virtuals en JSON
sobranteMaterialSchema.set('toJSON', { virtuals: true });
sobranteMaterialSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('SobranteMaterial', sobranteMaterialSchema);

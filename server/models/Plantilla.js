const mongoose = require('mongoose');

const plantillaSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  descripcion: {
    type: String,
    trim: true
  },
  texto: {
    type: String,
    required: true
  },
  categoria: {
    type: String,
    enum: ['whatsapp', 'email', 'sms'],
    default: 'whatsapp'
  },
  variables: [{
    nombre: String,
    descripcion: String
  }],
  activa: {
    type: Boolean,
    default: true
  },
  creador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  },
  fechaUltimaModificacion: {
    type: Date,
    default: Date.now
  },
  vecesUsada: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Índices
plantillaSchema.index({ nombre: 1 });
plantillaSchema.index({ categoria: 1 });
plantillaSchema.index({ activa: 1 });

// Middleware para actualizar fechaUltimaModificacion
plantillaSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.fechaUltimaModificacion = new Date();
  }
  next();
});

// Método para incrementar uso
plantillaSchema.methods.incrementarUso = function() {
  this.vecesUsada += 1;
  return this.save();
};

module.exports = mongoose.model('Plantilla', plantillaSchema);

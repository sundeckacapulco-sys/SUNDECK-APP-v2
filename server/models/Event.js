const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  // Identificación
  tipo: {
    type: String,
    required: true,
    index: true,
  },

  // Datos del evento
  datos: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },

  // Metadata
  origen: {
    type: String,
    required: true
  },

  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },

  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },

  // Estado de procesamiento
  procesado: {
    type: Boolean,
    default: false,
    index: true
  },

  // Listeners que procesaron el evento
  listeners: [{
    nombre: String,
    estado: {
      type: String,
      enum: ['pendiente', 'procesado', 'error'],
      default: 'pendiente'
    },
    resultado: mongoose.Schema.Types.Mixed,
    error: String,
    timestamp: Date
  }]
}, {
  timestamps: true
});

EventSchema.index({ tipo: 1, timestamp: -1 });
EventSchema.index({ procesado: 1, timestamp: -1 });
EventSchema.index({ 'listeners.estado': 1 });

EventSchema.methods.marcarProcesado = function marcarProcesado() {
  this.procesado = this.listeners.every(listener => listener.estado === 'procesado');
  return this.save();
};

module.exports = mongoose.model('Event', EventSchema);

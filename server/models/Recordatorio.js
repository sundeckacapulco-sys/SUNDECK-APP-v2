const mongoose = require('mongoose');

const recordatorioSchema = new mongoose.Schema({
  // Información básica
  titulo: {
    type: String,
    required: true
  },
  descripcion: String,
  
  // Tipo de recordatorio
  tipo: {
    type: String,
    enum: ['seguimiento', 'cita', 'pago', 'fabricacion', 'instalacion', 'postventa', 'mantenimiento', 'garantia'],
    required: true
  },
  
  // Prioridad
  prioridad: {
    type: String,
    enum: ['baja', 'media', 'alta', 'urgente'],
    default: 'media'
  },
  
  // Fechas
  fechaCreacion: {
    type: Date,
    default: Date.now
  },
  fechaProgramada: {
    type: Date,
    required: true
  },
  fechaEjecutado: Date,
  
  // Estado
  estado: {
    type: String,
    enum: ['pendiente', 'enviado', 'completado', 'cancelado', 'vencido'],
    default: 'pendiente'
  },
  
  // Referencias
  prospecto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prospecto'
  },
  pedido: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pedido'
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  
  // Configuración de repetición
  recurrente: {
    type: Boolean,
    default: false
  },
  frecuencia: {
    tipo: {
      type: String,
      enum: ['diario', 'semanal', 'mensual', 'personalizado']
    },
    intervalo: Number, // cada X días/semanas/meses
    diasSemana: [Number], // para frecuencia semanal
    diaMes: Number // para frecuencia mensual
  },
  
  // Canales de notificación
  canales: [{
    tipo: {
      type: String,
      enum: ['email', 'whatsapp', 'sms', 'push', 'sistema']
    },
    activo: { type: Boolean, default: true },
    configuracion: mongoose.Schema.Types.Mixed
  }],
  
  // Plantilla de mensaje
  plantilla: {
    asunto: String,
    mensaje: String,
    variables: mongoose.Schema.Types.Mixed // {nombre}, {fecha}, etc.
  },
  
  // Escalación automática
  escalacion: {
    activa: { type: Boolean, default: false },
    niveles: [{
      tiempo: Number, // minutos después del vencimiento
      usuarios: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }],
      mensaje: String
    }]
  },
  
  // Historial de envíos
  envios: [{
    fecha: { type: Date, default: Date.now },
    canal: String,
    destinatario: String,
    estado: {
      type: String,
      enum: ['enviado', 'entregado', 'leido', 'error']
    },
    respuesta: String,
    error: String
  }],
  
  // Respuesta del usuario
  respuesta: {
    fecha: Date,
    contenido: String,
    accion: {
      type: String,
      enum: ['completado', 'reagendado', 'cancelado', 'escalado']
    }
  },
  
  // Configuración AI
  inteligente: {
    activo: { type: Boolean, default: false },
    contexto: mongoose.Schema.Types.Mixed,
    personalizacion: {
      tono: {
        type: String,
        enum: ['formal', 'casual', 'amigable', 'urgente']
      },
      horarioPreferido: String,
      frecuenciaOptima: Number
    }
  },
  
  // Métricas
  metricas: {
    tasaRespuesta: Number,
    tiempoRespuestaPromedio: Number, // minutos
    efectividad: Number // porcentaje
  }
}, {
  timestamps: true
});

// Índices
recordatorioSchema.index({ fechaProgramada: 1 });
recordatorioSchema.index({ estado: 1 });
recordatorioSchema.index({ tipo: 1 });
recordatorioSchema.index({ usuario: 1 });
recordatorioSchema.index({ prospecto: 1 });

// Método para verificar si está vencido
recordatorioSchema.methods.estaVencido = function() {
  return new Date() > this.fechaProgramada && this.estado === 'pendiente';
};

// Método para generar próxima fecha (recordatorios recurrentes)
recordatorioSchema.methods.calcularProximaFecha = function() {
  if (!this.recurrente || !this.frecuencia) return null;
  
  const fechaBase = new Date(this.fechaProgramada);
  
  switch(this.frecuencia.tipo) {
    case 'diario':
      fechaBase.setDate(fechaBase.getDate() + (this.frecuencia.intervalo || 1));
      break;
    case 'semanal':
      fechaBase.setDate(fechaBase.getDate() + (this.frecuencia.intervalo || 1) * 7);
      break;
    case 'mensual':
      fechaBase.setMonth(fechaBase.getMonth() + (this.frecuencia.intervalo || 1));
      break;
  }
  
  return fechaBase;
};

module.exports = mongoose.model('Recordatorio', recordatorioSchema);

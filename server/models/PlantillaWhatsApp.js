const mongoose = require('mongoose');

const plantillaWhatsAppSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  categoria: {
    type: String,
    required: true,
    enum: [
      'cotizacion_enviada',
      'seguimiento_cotizacion', 
      'negociacion_hunter',
      'negociacion_farmer',
      'manejo_objeciones',
      'cotizacion_vencimiento',
      'post_vencimiento',
      'anticipo_confirmado',
      'fabricacion_iniciada',
      'fabricacion_progreso',
      'producto_terminado',
      'instalacion_programada',
      'instalacion_completada',
      'cobranza_saldo',
      'post_instalacion',
      'fidelizacion',
      'promocional',
      'recontacto'
    ]
  },
  estilo: {
    type: String,
    required: true,
    enum: ['formal_profesional', 'breve_persuasivo']
  },
  mensaje: {
    type: String,
    required: true,
    maxlength: 1000
  },
  variables: [{
    nombre: {
      type: String,
      required: true
    },
    descripcion: {
      type: String,
      required: true
    },
    tipo: {
      type: String,
      enum: ['texto', 'numero', 'fecha', 'moneda'],
      default: 'texto'
    },
    requerida: {
      type: Boolean,
      default: true
    }
  }],
  metricas: {
    veces_usada: {
      type: Number,
      default: 0
    },
    respuestas_positivas: {
      type: Number,
      default: 0
    },
    conversiones: {
      type: Number,
      default: 0
    },
    rating_total: {
      type: Number,
      default: 0
    },
    rating_count: {
      type: Number,
      default: 0
    }
  },
  activa: {
    type: Boolean,
    default: true
  },
  es_predeterminada: {
    type: Boolean,
    default: false
  },
  creada_por: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  fecha_creacion: {
    type: Date,
    default: Date.now
  },
  fecha_actualizacion: {
    type: Date,
    default: Date.now
  },
  tags: [{
    type: String,
    trim: true
  }],
  notas_admin: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Índices para optimizar consultas
plantillaWhatsAppSchema.index({ categoria: 1, activa: 1 });
plantillaWhatsAppSchema.index({ estilo: 1 });
plantillaWhatsAppSchema.index({ 'metricas.veces_usada': -1 });

// Virtual para calcular efectividad
plantillaWhatsAppSchema.virtual('efectividad').get(function() {
  if (this.metricas.veces_usada === 0) return 0;
  return Math.round((this.metricas.respuestas_positivas / this.metricas.veces_usada) * 100);
});

// Virtual para calcular rating promedio
plantillaWhatsAppSchema.virtual('rating_promedio').get(function() {
  if (this.metricas.rating_count === 0) return 0;
  return Math.round((this.metricas.rating_total / this.metricas.rating_count) * 10) / 10;
});

// Virtual para calcular tasa de conversión
plantillaWhatsAppSchema.virtual('tasa_conversion').get(function() {
  if (this.metricas.veces_usada === 0) return 0;
  return Math.round((this.metricas.conversiones / this.metricas.veces_usada) * 100);
});

// Middleware para actualizar fecha de modificación
plantillaWhatsAppSchema.pre('save', function(next) {
  this.fecha_actualizacion = Date.now();
  next();
});

// Método para generar mensaje personalizado
plantillaWhatsAppSchema.methods.generarMensaje = function(datos) {
  let mensajeGenerado = this.mensaje;
  
  // Reemplazar variables en el mensaje
  this.variables.forEach(variable => {
    const valor = datos[variable.nombre];
    if (valor !== undefined && valor !== null) {
      const placeholder = `{${variable.nombre}}`;
      let valorFormateado = valor;
      
      // Formatear según el tipo de variable
      switch (variable.tipo) {
        case 'moneda':
          valorFormateado = `$${Number(valor).toLocaleString()}`;
          break;
        case 'fecha':
          valorFormateado = new Date(valor).toLocaleDateString('es-MX');
          break;
        case 'numero':
          valorFormateado = Number(valor).toLocaleString();
          break;
        default:
          valorFormateado = String(valor);
      }
      
      mensajeGenerado = mensajeGenerado.replace(new RegExp(placeholder, 'g'), valorFormateado);
    }
  });
  
  return mensajeGenerado;
};

// Método para incrementar uso
plantillaWhatsAppSchema.methods.incrementarUso = function() {
  this.metricas.veces_usada += 1;
  return this.save();
};

// Método para registrar respuesta positiva
plantillaWhatsAppSchema.methods.registrarRespuestaPositiva = function() {
  this.metricas.respuestas_positivas += 1;
  return this.save();
};

// Método para registrar conversión
plantillaWhatsAppSchema.methods.registrarConversion = function() {
  this.metricas.conversiones += 1;
  return this.save();
};

// Método para agregar rating
plantillaWhatsAppSchema.methods.agregarRating = function(rating) {
  if (rating >= 1 && rating <= 5) {
    this.metricas.rating_total += rating;
    this.metricas.rating_count += 1;
    return this.save();
  }
  throw new Error('Rating debe estar entre 1 y 5');
};

// Configurar virtuals en JSON
plantillaWhatsAppSchema.set('toJSON', { virtuals: true });
plantillaWhatsAppSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('PlantillaWhatsApp', plantillaWhatsAppSchema);

const mongoose = require('mongoose');

const whatsAppTrackingSchema = new mongoose.Schema({
  plantilla: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PlantillaWhatsApp',
    required: true
  },
  prospecto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prospecto',
    required: true
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  mensaje_generado: {
    type: String,
    required: true,
    maxlength: 1000
  },
  evento: {
    type: String,
    required: true,
    enum: [
      'mensaje_generado',    // Se generó el mensaje
      'mensaje_enviado',     // Se confirmó el envío
      'cliente_respondio',   // El cliente respondió
      'respuesta_positiva',  // Respuesta positiva del cliente
      'conversion',          // Se logró una conversión (cotización→pedido, etc.)
      'rating_agregado'      // Se agregó un rating a la plantilla
    ]
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: function() {
      return this.evento === 'rating_agregado';
    }
  },
  notas: {
    type: String,
    maxlength: 500
  },
  metadata: {
    categoria_plantilla: String,
    estilo_plantilla: String,
    etapa_prospecto: String,
    dispositivo: String,
    duracion_respuesta: Number // en minutos
  },
  fecha_evento: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índices para optimizar consultas
whatsAppTrackingSchema.index({ plantilla: 1, evento: 1 });
whatsAppTrackingSchema.index({ prospecto: 1, fecha_evento: -1 });
whatsAppTrackingSchema.index({ usuario: 1, fecha_evento: -1 });
whatsAppTrackingSchema.index({ fecha_evento: -1 });

// Método estático para obtener estadísticas de una plantilla
whatsAppTrackingSchema.statics.obtenerEstadisticasPlantilla = async function(plantillaId, fechaInicio, fechaFin) {
  const pipeline = [
    {
      $match: {
        plantilla: mongoose.Types.ObjectId(plantillaId),
        fecha_evento: {
          $gte: fechaInicio || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 días por defecto
          $lte: fechaFin || new Date()
        }
      }
    },
    {
      $group: {
        _id: '$evento',
        count: { $sum: 1 },
        ratings: {
          $push: {
            $cond: [
              { $eq: ['$evento', 'rating_agregado'] },
              '$rating',
              null
            ]
          }
        }
      }
    }
  ];

  const resultados = await this.aggregate(pipeline);
  
  const estadisticas = {
    mensajes_generados: 0,
    mensajes_enviados: 0,
    respuestas_recibidas: 0,
    respuestas_positivas: 0,
    conversiones: 0,
    ratings: [],
    tasa_envio: 0,
    tasa_respuesta: 0,
    tasa_conversion: 0,
    rating_promedio: 0
  };

  resultados.forEach(resultado => {
    switch(resultado._id) {
      case 'mensaje_generado':
        estadisticas.mensajes_generados = resultado.count;
        break;
      case 'mensaje_enviado':
        estadisticas.mensajes_enviados = resultado.count;
        break;
      case 'cliente_respondio':
        estadisticas.respuestas_recibidas = resultado.count;
        break;
      case 'respuesta_positiva':
        estadisticas.respuestas_positivas = resultado.count;
        break;
      case 'conversion':
        estadisticas.conversiones = resultado.count;
        break;
      case 'rating_agregado':
        estadisticas.ratings = resultado.ratings.filter(r => r !== null);
        break;
    }
  });

  // Calcular tasas
  if (estadisticas.mensajes_generados > 0) {
    estadisticas.tasa_envio = Math.round((estadisticas.mensajes_enviados / estadisticas.mensajes_generados) * 100);
  }
  
  if (estadisticas.mensajes_enviados > 0) {
    estadisticas.tasa_respuesta = Math.round((estadisticas.respuestas_recibidas / estadisticas.mensajes_enviados) * 100);
    estadisticas.tasa_conversion = Math.round((estadisticas.conversiones / estadisticas.mensajes_enviados) * 100);
  }

  // Calcular rating promedio
  if (estadisticas.ratings.length > 0) {
    const suma = estadisticas.ratings.reduce((acc, rating) => acc + rating, 0);
    estadisticas.rating_promedio = Math.round((suma / estadisticas.ratings.length) * 10) / 10;
  }

  return estadisticas;
};

// Método estático para obtener mejores plantillas por categoría
whatsAppTrackingSchema.statics.obtenerMejoresPlantillas = async function(categoria, limite = 5) {
  const pipeline = [
    {
      $lookup: {
        from: 'plantillawhatsapps',
        localField: 'plantilla',
        foreignField: '_id',
        as: 'plantillaInfo'
      }
    },
    {
      $unwind: '$plantillaInfo'
    },
    {
      $match: categoria ? { 'plantillaInfo.categoria': categoria } : {}
    },
    {
      $group: {
        _id: '$plantilla',
        plantilla: { $first: '$plantillaInfo' },
        mensajes_enviados: {
          $sum: { $cond: [{ $eq: ['$evento', 'mensaje_enviado'] }, 1, 0] }
        },
        conversiones: {
          $sum: { $cond: [{ $eq: ['$evento', 'conversion'] }, 1, 0] }
        },
        rating_promedio: {
          $avg: { $cond: [{ $eq: ['$evento', 'rating_agregado'] }, '$rating', null] }
        }
      }
    },
    {
      $addFields: {
        tasa_conversion: {
          $cond: [
            { $gt: ['$mensajes_enviados', 0] },
            { $multiply: [{ $divide: ['$conversiones', '$mensajes_enviados'] }, 100] },
            0
          ]
        },
        score: {
          $add: [
            { $multiply: ['$tasa_conversion', 0.5] },
            { $multiply: [{ $ifNull: ['$rating_promedio', 0] }, 20] }
          ]
        }
      }
    },
    {
      $sort: { score: -1 }
    },
    {
      $limit: limite
    }
  ];

  return await this.aggregate(pipeline);
};

module.exports = mongoose.model('WhatsAppTracking', whatsAppTrackingSchema);

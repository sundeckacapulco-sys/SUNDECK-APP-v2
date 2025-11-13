const mongoose = require('mongoose');

/**
 * Configuración de materiales para cálculo de BOM
 * Permite configurar reglas de cálculo por producto/sistema
 */
const configuracionMaterialesSchema = new mongoose.Schema({
  // Identificación
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  
  // Filtros de aplicación
  producto: {
    type: String, // screen_5, blackout, sunscreen, etc.
    trim: true
  },
  
  sistema: {
    type: String, // Enrollable, Panel, Sheer, etc.
    default: 'Enrollable'
  },
  
  // Reglas de materiales
  materiales: [{
    tipo: {
      type: String,
      required: true,
      enum: ['Tela', 'Tubo', 'Soportes', 'Mecanismo', 'Motor', 'Galería', 'Herrajes', 'Accesorios']
    },
    
    descripcion: {
      type: String,
      required: true
    },
    
    unidad: {
      type: String,
      required: true,
      enum: ['ml', 'm²', 'pza', 'kit', 'juego']
    },
    
    // Fórmula de cálculo (JavaScript expression)
    formula: {
      type: String,
      required: true,
      // Ejemplos:
      // "ancho + 0.10" - Ancho más 10cm
      // "area * 1.1" - Área más 10% merma
      // "Math.ceil(ancho / 1.5)" - Soportes cada 1.5m
    },
    
    // Condición para aplicar (opcional)
    condicion: {
      type: String,
      // Ejemplos:
      // "motorizado === true"
      // "ancho > 2.5"
      // "galeria !== 'sin_galeria'"
    },
    
    // Precio unitario (opcional, para costos)
    precioUnitario: {
      type: Number,
      default: 0
    },
    
    // Observaciones
    observaciones: {
      type: String,
      trim: true
    },
    
    // Activo/Inactivo
    activo: {
      type: Boolean,
      default: true
    }
  }],
  
  // Metadata
  activo: {
    type: Boolean,
    default: true
  },
  
  creado_por: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  
  actualizado_por: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  }
}, {
  timestamps: true
});

// Índices
configuracionMaterialesSchema.index({ producto: 1, sistema: 1 });
configuracionMaterialesSchema.index({ activo: 1 });

module.exports = mongoose.model('ConfiguracionMateriales', configuracionMaterialesSchema);

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
    required: true,
    enum: ['Roller Shade', 'Sheer Elegance', 'Toldos Contempo'],
    default: 'Roller Shade'
  },
  
  // Reglas de selección de componentes
  reglasSeleccion: {
    // Reglas de tubos
    tubos: [{
      condicion: String, // "ancho <= 2.50 && esManual"
      diametro: String, // "38mm", "50mm", etc.
      codigo: String,
      descripcion: String
    }],
    
    // Reglas de mecanismos
    mecanismos: [{
      condicion: String, // "ancho <= 2.50"
      tipo: String, // "SL-16", "R-24", "Motor"
      codigo: String,
      descripcion: String,
      incluye: [String] // ["Clutch", "Soportes"]
    }],
    
    // Reglas de kits (para Toldos)
    kits: [{
      condicion: String, // "ancho <= 4.00"
      tamano: String, // "4.00m", "5.80m"
      codigo: String,
      descripcion: String
    }]
  },
  
  // Optimización de cortes
  optimizacion: {
    habilitada: {
      type: Boolean,
      default: true
    },
    longitudEstandar: {
      type: Number,
      default: 5.80 // metros
    },
    materialesOptimizables: [{
      tipo: String, // "tubo", "contrapeso", "cofre", etc.
      longitudEstandar: Number,
      margenCorte: Number // en metros
    }]
  },
  
  // Reglas especiales
  reglasEspeciales: [{
    nombre: String,
    descripcion: String,
    condicion: String,
    accion: String,
    prioridad: {
      type: String,
      enum: ['alta', 'media', 'baja'],
      default: 'media'
    }
  }],
  
  // Colores disponibles (para sistemas con opciones de color)
  coloresDisponibles: [{
    nombre: String, // "Ivory", "Chocolate", "Gris", "Negro"
    codigo: String,
    hexColor: String
  }],
  
  // Reglas de materiales
  materiales: [{
    tipo: {
      type: String,
      required: true,
      enum: [
        'Tela', 'Tubo', 'Cofre', 'Barra de Giro', 'Contrapeso', 
        'Soportes', 'Mecanismo', 'Motor', 'Cadena', 'Cable',
        'Tapas', 'Insertos', 'Cinta', 'Galería', 'Herrajes', 'Accesorios', 'Kit'
      ]
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
    
    // Permite rotación (solo para telas)
    puedeRotar: {
      type: Boolean,
      default: false
    },
    
    // Altura máxima para rotación
    alturaMaxRotacion: {
      type: Number,
      default: 2.80 // metros
    },
    
    // Permite termosello
    permiteTermosello: {
      type: Boolean,
      default: false
    },
    
    // Anchos de rollo disponibles (para telas)
    anchosRollo: [Number],
    
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

// Validadores
configuracionMaterialesSchema.pre('save', function(next) {
  // Validar fórmulas de materiales
  if (this.materiales && this.materiales.length > 0) {
    for (const material of this.materiales) {
      if (material.formula) {
        try {
          // Validar que la fórmula no contenga código malicioso
          const forbiddenKeywords = ['require', 'import', 'eval', 'Function', 'process', 'fs', 'child_process'];
          const hasForbidden = forbiddenKeywords.some(keyword => material.formula.includes(keyword));
          
          if (hasForbidden) {
            return next(new Error(`Fórmula inválida en ${material.descripcion}: contiene palabras prohibidas`));
          }
        } catch (error) {
          return next(new Error(`Error validando fórmula en ${material.descripcion}: ${error.message}`));
        }
      }
    }
  }
  
  next();
});

// Métodos de instancia
configuracionMaterialesSchema.methods.calcularMaterial = function(material, variables) {
  try {
    // Crear contexto seguro para evaluar la fórmula
    const context = {
      ancho: variables.ancho || 0,
      alto: variables.alto || 0,
      area: (variables.ancho || 0) * (variables.alto || 0),
      motorizado: variables.motorizado || false,
      galeria: variables.galeria || 'sin_galeria',
      Math: Math,
      Number: Number
    };
    
    // Evaluar condición si existe
    if (material.condicion) {
      const condicionFn = new Function(...Object.keys(context), `return ${material.condicion}`);
      const cumpleCondicion = condicionFn(...Object.values(context));
      
      if (!cumpleCondicion) {
        return null; // No aplica este material
      }
    }
    
    // Evaluar fórmula
    const formulaFn = new Function(...Object.keys(context), `return ${material.formula}`);
    const cantidad = formulaFn(...Object.values(context));
    
    return {
      tipo: material.tipo,
      descripcion: material.descripcion,
      cantidad: Number(cantidad.toFixed(3)),
      unidad: material.unidad,
      precioUnitario: material.precioUnitario || 0,
      precioTotal: (cantidad * (material.precioUnitario || 0)).toFixed(2)
    };
  } catch (error) {
    throw new Error(`Error calculando ${material.descripcion}: ${error.message}`);
  }
};

configuracionMaterialesSchema.methods.calcularTodosMateriales = function(variables) {
  const resultados = [];
  
  for (const material of this.materiales) {
    if (!material.activo) continue;
    
    try {
      const resultado = this.calcularMaterial(material, variables);
      if (resultado) {
        resultados.push(resultado);
      }
    } catch (error) {
      console.error(`Error en material ${material.descripcion}:`, error.message);
    }
  }
  
  return resultados;
};

// Índices
configuracionMaterialesSchema.index({ producto: 1, sistema: 1 });
configuracionMaterialesSchema.index({ sistema: 1, activo: 1 });
configuracionMaterialesSchema.index({ activo: 1 });

module.exports = mongoose.model('ConfiguracionMateriales', configuracionMaterialesSchema);

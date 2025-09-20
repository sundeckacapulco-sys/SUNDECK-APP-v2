const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema({
  // Información básica del producto
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  codigo: {
    type: String,
    unique: true,
    required: true
  },
  descripcion: String,
  
  // Categorización
  categoria: {
    type: String,
    enum: ['ventana', 'puerta', 'cancel', 'domo', 'accesorio', 'motor', 'control', 'kit', 'galeria', 'canaleta', 'herraje', 'repuesto'],
    required: true
  },
  subcategoria: String,
  
  // Especificaciones técnicas
  material: {
    type: String,
    enum: ['aluminio', 'pvc', 'madera', 'acero', 'mixto', 'plastico', 'tela', 'fibra', 'otro'],
    required: true
  },
  coloresDisponibles: [String],
  tiposCristal: [String],
  herrajesDisponibles: [String],
  
  // Precios y costos
  precioBase: {
    type: Number,
    required: true
  },
  unidadMedida: {
    type: String,
    enum: ['m2', 'ml', 'pieza', 'metro', 'par', 'juego', 'kit'],
    default: 'm2'
  },
  // Configuración específica por unidad de medida
  configuracionUnidad: {
    requiereMedidas: { type: Boolean, default: true }, // false para piezas/kits
    calculoPorArea: { type: Boolean, default: true }, // false para ml o piezas
    minimoVenta: { type: Number, default: 1 }, // mínimo de piezas/metros
    incremento: { type: Number, default: 0.1 } // incremento mínimo (0.1m, 1 pieza, etc.)
  },
  costoMaterial: Number,
  costoManoObra: Number,
  margenGanancia: Number, // porcentaje
  
  // Dimensiones y restricciones
  dimensiones: {
    anchoMinimo: Number,
    anchoMaximo: Number,
    altoMinimo: Number,
    altoMaximo: Number
  },
  
  // Tiempos de fabricación
  tiempoFabricacion: {
    base: Number, // días base
    porM2Adicional: Number // días adicionales por m²
  },
  
  // Reglas especiales
  reglas: [{
    condicion: String, // ej: "alto > 2.5"
    accion: String, // ej: "requiere_refuerzo_R24"
    costoAdicional: Number,
    tiempoAdicional: Number
  }],
  
  // Imágenes y archivos
  imagenes: [{
    url: String,
    descripcion: String,
    esPrincipal: { type: Boolean, default: false }
  }],
  fichasTecnicas: [{
    nombre: String,
    url: String,
    tipo: String
  }],
  
  // Estado y disponibilidad
  activo: {
    type: Boolean,
    default: true
  },
  disponible: {
    type: Boolean,
    default: true
  },
  
  // Información adicional
  tags: [String],
  popularidad: { type: Number, default: 0 },
  garantia: {
    fabricacion: Number, // meses
    instalacion: Number // meses
  },
  requiereInstalacion: {
    type: Boolean,
    default: true
  },
  especificaciones: String,
  peso: String,
  dimensiones: String,
  palabrasClave: [String],
  descripcionSEO: String,
  
  // Metadatos
  vecesVendido: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Método para calcular precio final con reglas
productoSchema.methods.calcularPrecio = function(medidas, opciones = {}) {
  let precio = this.precioBase;
  let multiplicador = 1;
  
  // Calcular multiplicador según unidad de medida
  switch (this.unidadMedida) {
    case 'm2':
      multiplicador = medidas.ancho * medidas.alto;
      break;
    case 'ml':
    case 'metro':
      // Para galerías y canaletas - usar el ancho como metros lineales
      multiplicador = medidas.ancho || medidas.metrosLineales || 1;
      break;
    case 'pieza':
    case 'par':
    case 'juego':
    case 'kit':
      // Para motores, controles, kits - precio fijo por pieza
      multiplicador = medidas.cantidad || 1;
      break;
    default:
      multiplicador = medidas.ancho * medidas.alto;
  }
  
  // Aplicar reglas especiales
  this.reglas.forEach(regla => {
    if (this.evaluarCondicion(regla.condicion, medidas)) {
      precio += regla.costoAdicional || 0;
    }
  });
  
  // Aplicar costos por opciones (color especial, cristal especial, etc.)
  if (opciones.colorEspecial) precio *= 1.1;
  if (opciones.cristalEspecial) precio *= 1.15;
  
  return precio * multiplicador;
};

// Método para calcular tiempo de fabricación
productoSchema.methods.calcularTiempoFabricacion = function(medidas) {
  let tiempo = this.tiempoFabricacion?.base || 1;
  
  // Calcular tiempo según unidad de medida
  switch (this.unidadMedida) {
    case 'm2':
      const area = medidas.ancho * medidas.alto;
      if (this.tiempoFabricacion?.porM2Adicional && area > 1) {
        tiempo += (area - 1) * this.tiempoFabricacion.porM2Adicional;
      }
      break;
    case 'ml':
    case 'metro':
      const metros = medidas.ancho || medidas.metrosLineales || 1;
      // Tiempo adicional por metro lineal
      if (metros > 1) {
        tiempo += (metros - 1) * 0.5; // 0.5 días por metro adicional
      }
      break;
    case 'pieza':
    case 'par':
    case 'juego':
    case 'kit':
      // Para accesorios, tiempo fijo o por cantidad
      const cantidad = medidas.cantidad || 1;
      if (cantidad > 1) {
        tiempo += (cantidad - 1) * 0.2; // 0.2 días por pieza adicional
      }
      break;
  }
  
  // Aplicar reglas especiales
  this.reglas?.forEach(regla => {
    if (this.evaluarCondicion(regla.condicion, medidas)) {
      tiempo += regla.tiempoAdicional || 0;
    }
  });
  
  return Math.ceil(tiempo);
};

// Método auxiliar para evaluar condiciones
productoSchema.methods.evaluarCondicion = function(condicion, medidas) {
  // Implementación simple de evaluación de condiciones
  try {
    const contexto = {
      ancho: medidas.ancho || 0,
      alto: medidas.alto || 0,
      area: (medidas.ancho || 0) * (medidas.alto || 0),
      metrosLineales: medidas.metrosLineales || medidas.ancho || 0,
      cantidad: medidas.cantidad || 1
    };
    
    // Reemplazar variables en la condición
    let condicionEvaluable = condicion;
    Object.keys(contexto).forEach(key => {
      condicionEvaluable = condicionEvaluable.replace(
        new RegExp(key, 'g'), 
        contexto[key]
      );
    });
    
    // Evaluar condición simple (solo operadores básicos por seguridad)
    return eval(condicionEvaluable);
  } catch (error) {
    console.error('Error evaluando condición:', condicion, error);
    return false;
  }
};

// Método para obtener la etiqueta de la unidad de medida
productoSchema.methods.getEtiquetaUnidad = function() {
  const etiquetas = {
    'm2': 'm²',
    'ml': 'm.l.',
    'metro': 'm',
    'pieza': 'pza',
    'par': 'par',
    'juego': 'juego',
    'kit': 'kit'
  };
  return etiquetas[this.unidadMedida] || this.unidadMedida;
};

// Método para validar si requiere medidas
productoSchema.methods.requiereMedidas = function() {
  return this.configuracionUnidad?.requiereMedidas !== false && 
         ['m2', 'ml', 'metro'].includes(this.unidadMedida);
};

// Índices
productoSchema.index({ codigo: 1 });
productoSchema.index({ categoria: 1 });
productoSchema.index({ unidadMedida: 1 });
productoSchema.index({ activo: 1, disponible: 1 });
productoSchema.index({ popularidad: -1 });
productoSchema.index({ nombre: 'text', descripcion: 'text' });

module.exports = mongoose.model('Producto', productoSchema);

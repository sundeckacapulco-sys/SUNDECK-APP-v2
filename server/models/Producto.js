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
    enum: ['ventana', 'puerta', 'cancel', 'domo', 'accesorio'],
    required: true
  },
  subcategoria: String,
  
  // Especificaciones técnicas
  material: {
    type: String,
    enum: ['aluminio', 'pvc', 'madera', 'acero', 'mixto'],
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
    enum: ['m2', 'ml', 'pieza'],
    default: 'm2'
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
  garantia: {
    fabricacion: Number, // meses
    instalacion: Number // meses
  },
  requiereInstalacion: {
    type: Boolean,
    default: true
  },
  
  // Metadatos
  tags: [String],
  popularidad: { type: Number, default: 0 },
  vecesVendido: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Método para calcular precio final con reglas
productoSchema.methods.calcularPrecio = function(medidas, opciones = {}) {
  let precio = this.precioBase;
  const area = medidas.ancho * medidas.alto;
  
  // Aplicar reglas especiales
  this.reglas.forEach(regla => {
    if (this.evaluarCondicion(regla.condicion, medidas)) {
      precio += regla.costoAdicional || 0;
    }
  });
  
  // Aplicar costos por opciones (color especial, cristal especial, etc.)
  if (opciones.colorEspecial) precio *= 1.1;
  if (opciones.cristalEspecial) precio *= 1.15;
  
  return precio * area;
};

// Método para calcular tiempo de fabricación
productoSchema.methods.calcularTiempoFabricacion = function(medidas) {
  let tiempo = this.tiempoFabricacion.base;
  const area = medidas.ancho * medidas.alto;
  
  // Tiempo adicional por área
  if (this.tiempoFabricacion.porM2Adicional && area > 1) {
    tiempo += (area - 1) * this.tiempoFabricacion.porM2Adicional;
  }
  
  // Aplicar reglas especiales
  this.reglas.forEach(regla => {
    if (this.evaluarCondicion(regla.condicion, medidas)) {
      tiempo += regla.tiempoAdicional || 0;
    }
  });
  
  return Math.ceil(tiempo);
};

// Método auxiliar para evaluar condiciones
productoSchema.methods.evaluarCondicion = function(condicion, medidas) {
  // Implementación simple de evaluación de condiciones
  // En producción se podría usar una librería más robusta
  try {
    const contexto = {
      ancho: medidas.ancho,
      alto: medidas.alto,
      area: medidas.ancho * medidas.alto
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

// Índices
productoSchema.index({ codigo: 1 });
productoSchema.index({ categoria: 1 });
productoSchema.index({ activo: 1, disponible: 1 });
productoSchema.index({ popularidad: -1 });

module.exports = mongoose.model('Producto', productoSchema);

const mongoose = require('mongoose');

/**
 * Modelo para gestionar inventario de materiales en almacén
 * Control completo de stock, ubicaciones y costos
 */
const almacenSchema = new mongoose.Schema({
  // Identificación del material
  tipo: {
    type: String,
    required: true,
    enum: ['Tubo', 'Cofre', 'Barra de Giro', 'Contrapeso', 'Tela', 'Cable', 
           'Mecanismo', 'Motor', 'Soportes', 'Herrajes', 'Accesorios', 'Kit'],
    index: true
  },
  
  codigo: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  descripcion: {
    type: String,
    required: true
  },
  
  // Características del material
  especificaciones: {
    diametro: String,        // Para tubos: 38mm, 50mm, etc.
    longitud: Number,        // Longitud estándar de barra/rollo
    ancho: Number,           // Para telas
    color: String,
    acabado: String,
    marca: String,
    modelo: String
  },
  
  // Inventario
  cantidad: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  
  unidad: {
    type: String,
    required: true,
    enum: ['pza', 'ml', 'm²', 'kit', 'juego', 'rollo', 'barra'],
    default: 'pza'
  },
  
  // Control de stock
  stockMinimo: {
    type: Number,
    default: 5
  },
  
  stockMaximo: {
    type: Number,
    default: 100
  },
  
  puntoReorden: {
    type: Number,
    default: 10
  },
  
  // Ubicación física en almacén
  ubicacion: {
    almacen: {
      type: String,
      default: 'Almacén General'
    },
    zona: String,      // Ej: "Zona A", "Zona B"
    pasillo: String,   // Ej: "P-01"
    estante: String,   // Ej: "E-05"
    nivel: String      // Ej: "N-2"
  },
  
  // Costos y precios
  costos: {
    precioCompra: {
      type: Number,
      default: 0,
      min: 0
    },
    precioVenta: {
      type: Number,
      default: 0,
      min: 0
    },
    moneda: {
      type: String,
      default: 'MXN',
      enum: ['MXN', 'USD']
    },
    ultimaActualizacion: Date
  },
  
  // Información del proveedor
  proveedor: {
    nombre: String,
    contacto: String,
    telefono: String,
    email: String,
    tiempoEntrega: Number, // días
    ultimaCompra: Date,
    codigoProveedor: String
  },
  
  // Estado y control
  activo: {
    type: Boolean,
    default: true,
    index: true
  },
  
  reservado: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Observaciones y notas
  observaciones: String,
  
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

// Índices compuestos para búsquedas rápidas
almacenSchema.index({ tipo: 1, codigo: 1 });
almacenSchema.index({ tipo: 1, activo: 1 });
almacenSchema.index({ cantidad: 1, stockMinimo: 1 });
almacenSchema.index({ 'ubicacion.almacen': 1, tipo: 1 });

// Virtuals
almacenSchema.virtual('disponible').get(function() {
  return this.cantidad - this.reservado;
});

almacenSchema.virtual('bajoPuntoReorden').get(function() {
  return this.cantidad <= this.puntoReorden;
});

almacenSchema.virtual('sinStock').get(function() {
  return this.cantidad === 0;
});

almacenSchema.virtual('valorInventario').get(function() {
  return this.cantidad * (this.costos?.precioCompra || 0);
});

// Métodos de instancia
almacenSchema.methods.agregarStock = async function(cantidad, motivo = 'Entrada', usuarioId = null) {
  this.cantidad += cantidad;
  this.actualizadoPor = usuarioId;
  return await this.save();
};

almacenSchema.methods.retirarStock = async function(cantidad, motivo = 'Salida', usuarioId = null) {
  const disponible = this.cantidad - this.reservado;
  
  if (disponible < cantidad) {
    throw new Error(
      `Stock insuficiente. Disponible: ${disponible}, Solicitado: ${cantidad}, Reservado: ${this.reservado}`
    );
  }
  
  this.cantidad -= cantidad;
  this.actualizadoPor = usuarioId;
  return await this.save();
};

almacenSchema.methods.reservarStock = async function(cantidad) {
  const disponible = this.cantidad - this.reservado;
  
  if (disponible < cantidad) {
    throw new Error(`Stock disponible insuficiente para reservar. Disponible: ${disponible}`);
  }
  
  this.reservado += cantidad;
  return await this.save();
};

almacenSchema.methods.liberarReserva = async function(cantidad) {
  this.reservado = Math.max(0, this.reservado - cantidad);
  return await this.save();
};

almacenSchema.methods.ajustarStock = async function(nuevaCantidad, motivo = 'Ajuste', usuarioId = null) {
  const diferencia = nuevaCantidad - this.cantidad;
  this.cantidad = nuevaCantidad;
  this.actualizadoPor = usuarioId;
  return { diferencia, material: await this.save() };
};

// Métodos estáticos
almacenSchema.statics.buscarPorCodigo = function(codigo) {
  return this.findOne({ codigo, activo: true });
};

almacenSchema.statics.buscarPorTipo = function(tipo) {
  return this.find({ tipo, activo: true }).sort({ descripcion: 1 });
};

almacenSchema.statics.materialesBajoStock = function() {
  return this.find({
    activo: true,
    $expr: { $lte: ['$cantidad', '$puntoReorden'] }
  }).sort({ cantidad: 1 });
};

almacenSchema.statics.materialesSinStock = function() {
  return this.find({
    activo: true,
    cantidad: 0
  }).sort({ tipo: 1, descripcion: 1 });
};

almacenSchema.statics.valorTotalInventario = async function() {
  const materiales = await this.find({ activo: true });
  return materiales.reduce((total, m) => total + m.valorInventario, 0);
};

// Configurar virtuals en JSON
almacenSchema.set('toJSON', { virtuals: true });
almacenSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Almacen', almacenSchema);

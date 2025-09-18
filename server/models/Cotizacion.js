const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const cotizacionSchema = new mongoose.Schema({
  // Referencia al prospecto
  prospecto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prospecto',
    required: true
  },
  
  // Información básica de la cotización
  numero: {
    type: String,
    unique: true,
    required: true
  },
  fecha: {
    type: Date,
    default: Date.now
  },
  validoHasta: {
    type: Date,
    required: true
  },
  
  // Mediciones y especificaciones
  mediciones: [{
    ambiente: String, // sala, cocina, recámara, etc.
    ancho: Number, // en metros
    alto: Number, // en metros
    area: Number, // m² calculado automáticamente
    cantidad: { type: Number, default: 1 },
    notas: String,
    fotos: [{
      url: String,
      descripcion: String,
      fechaToma: { type: Date, default: Date.now }
    }]
  }],
  
  // Productos cotizados
  productos: [{
    nombre: String,
    descripcion: String,
    categoria: {
      type: String,
      enum: ['ventana', 'puerta', 'cancel', 'domo', 'accesorio']
    },
    material: String, // aluminio, PVC, madera, etc.
    color: String,
    cristal: String, // tipo de cristal
    herrajes: String,
    medidas: {
      ancho: Number,
      alto: Number,
      area: Number
    },
    cantidad: Number,
    precioUnitario: Number,
    subtotal: Number,
    // Reglas automáticas
    requiereR24: { type: Boolean, default: false }, // si >2.50m
    tiempoFabricacion: Number // días estimados
  }],
  
  // Cálculos de precios
  subtotal: Number,
  descuento: {
    porcentaje: Number,
    monto: Number,
    motivo: String
  },
  iva: Number,
  total: Number,
  
  // Condiciones comerciales
  formaPago: {
    anticipo: {
      porcentaje: Number,
      monto: Number
    },
    saldo: {
      porcentaje: Number,
      monto: Number,
      condiciones: String // "contra entrega", "a 30 días", etc.
    }
  },
  
  // Tiempos estimados
  tiempoFabricacion: Number, // días
  tiempoInstalacion: Number, // días
  fechaEntregaEstimada: Date,
  
  // Estado de la cotización
  estado: {
    type: String,
    enum: ['borrador', 'enviada', 'vista', 'aprobada', 'rechazada', 'vencida', 'convertida'],
    default: 'borrador'
  },
  
  // Seguimiento
  fechaEnvio: Date,
  fechaVista: Date,
  fechaRespuesta: Date,
  motivoRechazo: String,
  
  // Versiones y revisiones
  version: { type: Number, default: 1 },
  cotizacionPadre: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cotizacion'
  },
  
  // Archivos generados
  archivos: [{
    tipo: {
      type: String,
      enum: ['pdf', 'imagen', 'plano', 'otro']
    },
    nombre: String,
    url: String,
    fechaGeneracion: { type: Date, default: Date.now }
  }],
  
  // Notas y observaciones
  notas: [{
    fecha: { type: Date, default: Date.now },
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    contenido: String
  }],
  
  // Usuario responsable
  elaboradaPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  
  // Información de instalación
  requiereInstalacion: { type: Boolean, default: true },
  costoInstalacion: Number,
  
  // Garantías
  garantia: {
    fabricacion: Number, // meses
    instalacion: Number, // meses
    descripcion: String
  }
}, {
  timestamps: true
});

// Middleware para calcular área automáticamente
cotizacionSchema.pre('save', function(next) {
  // Calcular área en mediciones
  this.mediciones.forEach(medicion => {
    if (medicion.ancho && medicion.alto) {
      medicion.area = medicion.ancho * medicion.alto;
    }
  });
  
  // Calcular área en productos
  this.productos.forEach(producto => {
    if (producto.medidas.ancho && producto.medidas.alto) {
      producto.medidas.area = producto.medidas.ancho * producto.medidas.alto;
    }
    
    // Verificar regla R24 (si >2.50m requiere refuerzo)
    if (producto.medidas.alto > 2.5 || producto.medidas.ancho > 2.5) {
      producto.requiereR24 = true;
    }
    
    // Calcular subtotal del producto
    producto.subtotal = producto.precioUnitario * producto.cantidad;
  });
  
  // Calcular totales
  this.subtotal = this.productos.reduce((sum, prod) => sum + prod.subtotal, 0);
  
  if (this.descuento && this.descuento.porcentaje) {
    this.descuento.monto = this.subtotal * (this.descuento.porcentaje / 100);
  }
  
  const subtotalConDescuento = this.subtotal - (this.descuento?.monto || 0);
  const subtotalConInstalacion = subtotalConDescuento + (this.costoInstalacion || 0);
  this.iva = subtotalConInstalacion * 0.16; // IVA 16%
  this.total = subtotalConInstalacion + this.iva;
  
  // Calcular montos de anticipo y saldo
  if (this.formaPago?.anticipo?.porcentaje) {
    this.formaPago.anticipo.monto = this.total * (this.formaPago.anticipo.porcentaje / 100);
  }
  if (this.formaPago?.saldo?.porcentaje) {
    this.formaPago.saldo.monto = this.total * (this.formaPago.saldo.porcentaje / 100);
  }
  
  next();
});

// Generar número de cotización automáticamente
cotizacionSchema.pre('save', async function(next) {
  if (this.isNew && !this.numero) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1)
      }
    });
    this.numero = `COT-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Índices
cotizacionSchema.index({ numero: 1 });
cotizacionSchema.index({ prospecto: 1 });
cotizacionSchema.index({ estado: 1 });
cotizacionSchema.index({ fechaEntregaEstimada: 1 });
cotizacionSchema.index({ elaboradaPor: 1 });

// Agregar plugin de paginación
cotizacionSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Cotizacion', cotizacionSchema);

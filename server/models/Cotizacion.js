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
      enum: [
        'ventana', 'puerta', 'cancel', 'domo', 'accesorio', 
        'motor', 'kit', 'control', 'galeria', 'persiana',
        'cortina', 'toldo', 'mosquitero', 'cristal', 'herraje',
        'instalacion', 'mantenimiento', 'canaleta', 'otro'
      ]
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
  incluirIVA: { type: Boolean, default: true }, // Flag para indicar si incluye IVA
  
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

// Generar número de cotización automáticamente (PRIMERO)
cotizacionSchema.pre('save', async function(next) {
  try {
    if (this.isNew && !this.numero) {
      console.log('Generando número de cotización...');
      const year = new Date().getFullYear();
      const count = await this.constructor.countDocuments({
        createdAt: {
          $gte: new Date(year, 0, 1),
          $lt: new Date(year + 1, 0, 1)
        }
      });
      this.numero = `COT-${year}-${String(count + 1).padStart(4, '0')}`;
      console.log('Número generado:', this.numero);
    }
    next();
  } catch (error) {
    console.error('Error generando número de cotización:', error);
    next(error);
  }
});

// Middleware para calcular área automáticamente
cotizacionSchema.pre('save', function(next) {
  // Calcular área en mediciones
  if (this.mediciones) {
    this.mediciones.forEach(medicion => {
      if (medicion.ancho && medicion.alto) {
        medicion.area = medicion.ancho * medicion.alto;
      }
    });
  }
  
  // Calcular área en productos
  if (this.productos) {
    this.productos.forEach(producto => {
      if (producto.medidas && producto.medidas.ancho && producto.medidas.alto) {
        producto.medidas.area = producto.medidas.ancho * producto.medidas.alto;
      }
      
      // Verificar regla R24 (si >2.50m requiere refuerzo)
      if (producto.medidas && (producto.medidas.alto > 2.5 || producto.medidas.ancho > 2.5)) {
        producto.requiereR24 = true;
      }
      
      // Calcular subtotal del producto según su tipo
      if (producto.precioUnitario && producto.cantidad) {
        const precio = producto.precioUnitario || 0;
        const cantidad = producto.cantidad || 1;
        const unidadMedida = producto.unidadMedida;
        
        if (['pieza', 'par', 'juego', 'kit'].includes(unidadMedida)) {
          // Productos por pieza: precio × cantidad
          producto.subtotal = precio * cantidad;
        } else {
          // Productos por área o lineales: área × precio × cantidad
          const area = producto.medidas?.area || 0;
          producto.subtotal = area * precio * cantidad;
        }
      }
    });
  }
  
  // Calcular totales
  if (this.productos && this.productos.length > 0) {
    this.subtotal = this.productos.reduce((sum, prod) => sum + (prod.subtotal || 0), 0);
  }
  
  if (this.descuento && this.descuento.porcentaje && this.subtotal) {
    this.descuento.monto = this.subtotal * (this.descuento.porcentaje / 100);
  }
  
  const subtotalConDescuento = (this.subtotal || 0) - (this.descuento?.monto || 0);
  const subtotalConInstalacion = subtotalConDescuento + (this.costoInstalacion || 0);
  
  // El IVA y total se envían desde el frontend ya calculados
  // Solo calcular si no se proporcionan Y no es una actualización
  if ((this.iva === undefined || this.iva === null) && this.isNew) {
    this.iva = this.incluirIVA ? subtotalConInstalacion * 0.16 : 0;
  }
  if ((this.total === undefined || this.total === null) && this.isNew) {
    this.total = subtotalConInstalacion + this.iva;
  }
  
  // Si no es nuevo (es una actualización), no recalcular automáticamente
  // Confiar en los valores enviados desde el frontend
  
  // Calcular montos de anticipo y saldo
  if (this.formaPago?.anticipo?.porcentaje && this.total) {
    this.formaPago.anticipo.monto = this.total * (this.formaPago.anticipo.porcentaje / 100);
  }
  if (this.formaPago?.saldo?.porcentaje && this.total) {
    this.formaPago.saldo.monto = this.total * (this.formaPago.saldo.porcentaje / 100);
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

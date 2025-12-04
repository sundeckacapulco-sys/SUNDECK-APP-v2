const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const logger = require('../config/logger');

const cotizacionSchema = new mongoose.Schema({
  prospecto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prospecto'
  },
  proyecto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Proyecto'
  },
  numero: {
    type: String,
    unique: true,
    required: true
  },
  nombre: {
    type: String,
    // Cambiado de required: true a opcional para permitir el archivado de documentos antiguos/incompletos.
    // La lógica de creación debe asegurar que este campo se establezca si es necesario para nuevas cotizaciones.
  },
  fecha: {
    type: Date,
    default: Date.now
  },
  validoHasta: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  },
  estado: {
    type: String,
    enum: ['borrador', 'enviada', 'Activa', 'vista', 'aprobada', 'rechazada', 'vencida', 'convertida'],
    default: 'borrador'
  },
  origen: {
    type: String,
    enum: ['levantamiento', 'cotizacion_vivo', 'directa', 'normal', 'etapa_directa'],
    default: 'normal'
  },
  comentarios: String,
  descripcionGeneral: String, // Descripción general de la cotización generada por IA
  precioGeneralM2: Number,
  unidadMedida: String,

  productos: [{
    ubicacion: String,
    cantidad: { type: Number, default: 1 },
    ancho: Number,
    alto: Number,
    area: Number,
    nombre: String,
    nombreProducto: String,
    productoLabel: String,
    descripcion: String,
    categoria: String,
    material: String,
    productoId: { type: String }, // <-- CAMBIO AQUÍ: Ahora es String en lugar de ObjectId
    color: String,
    precioM2: Number,
    precioUnitario: Number,
    subtotal: Number,
    observaciones: String,
    fotoUrls: [String],
    videoUrl: String,
    medidas: {
      ancho: Number,
      alto: Number,
      area: Number
    },
    requiereR24: { type: Boolean, default: false },
    tiempoFabricacion: Number,
    esToldo: { type: Boolean, default: false },
    tipoToldo: String,
    kitModelo: String,
    kitModeloManual: String,
    kitPrecio: Number,
    motorizado: { type: Boolean, default: false },
    motorModelo: String,
    motorModeloManual: String,
    motorPrecio: Number,
    controlModelo: String,
    controlModeloManual: String,
    controlPrecio: Number,
  }],

  instalacion: {
    incluye: { type: Boolean, default: false },
    costo: { type: Number, default: 0 },
    tipo: String
  },

  descuento: {
    aplica: { type: Boolean, default: false },
    tipo: { type: String, enum: ['porcentaje', 'monto', 'fijo'] },
    valor: Number,
    monto: Number,
  },

  facturacion: {
    requiere: { type: Boolean, default: false },
    iva: { type: Number, default: 0 }
  },

  pago: {
    metodoAnticipo: String,
  },

  entrega: {
    tipo: { type: String, enum: ['normal', 'expres'], default: 'normal' },
    diasExpres: Number,
    fechaEstimada: Date,
  },

  terminos: {
    incluir: { type: Boolean, default: true },
  },

  subtotal: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  iva: { type: Number, default: 0 },
  
  // Tiempos de fabricación e instalación
  tiempoFabricacion: { type: Number, default: 15 },
  tiempoInstalacion: { type: Number, default: 1 },
  requiereInstalacion: { type: Boolean, default: true },
  costoInstalacion: { type: Number, default: 0 },

  elaboradaPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  notas: [{
    fecha: { type: Date, default: Date.now },
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    contenido: String
  }],
  archivada: {
    type: Boolean,
    default: false
  },
  fechaArchivado: Date,
  archivadaPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  // PDF guardado
  pdfPath: {
    type: String,
    default: null
  },
  pdfGeneradoEn: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

cotizacionSchema.pre('save', async function(next) {
  if (this.isNew && !this.numero) {
    try {
      logger.info('Generando número consecutivo para cotización', {
        modelo: 'Cotizacion',
        hook: 'preSaveNumero',
        cotizacionId: this._id?.toString()
      });
      const year = new Date().getFullYear();
      
      // Intentar contar por createdAt, si falla usar método alternativo
      let count = 0;
      try {
        count = await this.constructor.countDocuments({
          createdAt: {
            $gte: new Date(year, 0, 1),
            $lt: new Date(year + 1, 0, 1)
          }
        });
        logger.info('Conteo de cotizaciones por createdAt obtenido', {
          modelo: 'Cotizacion',
          hook: 'preSaveNumero',
          cotizacionId: this._id?.toString(),
          year,
          cantidad: count
        });
      } catch (countError) {
        logger.warn('No fue posible contar cotizaciones por createdAt, usando método alternativo', {
          modelo: 'Cotizacion',
          hook: 'preSaveNumero',
          cotizacionId: this._id?.toString(),
          year,
          error: countError.message,
          stack: countError.stack
        });
        // Método alternativo: contar todas y usar timestamp
        const totalCount = await this.constructor.countDocuments({});
        count = totalCount;
        logger.info('Conteo total de cotizaciones usando método alternativo', {
          modelo: 'Cotizacion',
          hook: 'preSaveNumero',
          cotizacionId: this._id?.toString(),
          year,
          cantidad: count
        });
      }

      this.numero = `COT-${year}-${String(count + 1).padStart(4, '0')}`;
      logger.info('Número de cotización generado', {
        modelo: 'Cotizacion',
        hook: 'preSaveNumero',
        cotizacionId: this._id?.toString(),
        numero: this.numero
      });
    } catch (error) {
      logger.error('Error generando número de cotización en pre-save', {
        modelo: 'Cotizacion',
        hook: 'preSaveNumero',
        cotizacionId: this._id?.toString(),
        error: error.message,
        stack: error.stack
      });
      // Respaldo con timestamp para garantizar unicidad
      const timestamp = Date.now().toString().slice(-6);
      this.numero = `COT-${new Date().getFullYear()}-${timestamp}`;
      logger.info('Número de respaldo de cotización generado', {
        modelo: 'Cotizacion',
        hook: 'preSaveNumero',
        cotizacionId: this._id?.toString(),
        numero: this.numero
      });
    }
  }
  next();
});

// ===== MÉTODO UNIFICADO PARA CALCULAR TOTALES =====
cotizacionSchema.methods.calcularTotales = function() {
  // 1. Calcular subtotal de productos
  let subtotalProductos = 0;
  
  if (this.productos && this.productos.length > 0) {
    subtotalProductos = this.productos.reduce((sum, producto) => {
      const subtotalProducto = producto.subtotal || 
        (producto.precioUnitario || 0) * (producto.cantidad || 1);
      return sum + subtotalProducto;
    }, 0);
  }
  
  // 2. Agregar costo de instalación
  const costoInstalacion = this.instalacion?.incluye ? (this.instalacion.costo || 0) : 0;
  
  // 3. Calcular subtotal antes de descuento
  let subtotalAntesDescuento = subtotalProductos + costoInstalacion;
  
  // 4. Aplicar descuento
  let montoDescuento = 0;
  if (this.descuento?.aplica && this.descuento.valor) {
    if (this.descuento.tipo === 'porcentaje') {
      montoDescuento = subtotalAntesDescuento * (this.descuento.valor / 100);
    } else {
      montoDescuento = this.descuento.valor;
    }
  }
  
  // 5. Subtotal después de descuento
  const subtotal = subtotalAntesDescuento - montoDescuento;
  
  // 6. Calcular IVA
  const iva = this.facturacion?.requiere ? subtotal * 0.16 : 0;
  
  // 7. Total final
  const total = subtotal + iva;
  
  // Actualizar campos
  this.subtotal = Math.round(subtotal * 100) / 100;
  this.iva = Math.round(iva * 100) / 100;
  this.total = Math.round(total * 100) / 100;
  if (this.descuento) {
    this.descuento.monto = Math.round(montoDescuento * 100) / 100;
  }
  
  logger.debug('Totales calculados', {
    modelo: 'Cotizacion',
    cotizacionId: this._id,
    subtotalProductos,
    costoInstalacion,
    montoDescuento,
    subtotal: this.subtotal,
    iva: this.iva,
    total: this.total
  });
  
  return {
    subtotalProductos,
    costoInstalacion,
    montoDescuento,
    subtotal: this.subtotal,
    iva: this.iva,
    total: this.total
  };
};

// Método para obtener resumen limpio (para PDF/Excel)
cotizacionSchema.methods.obtenerResumen = function() {
  const totales = this.calcularTotales();
  
  return {
    numero: this.numero,
    fecha: this.fecha,
    validoHasta: this.validoHasta,
    estado: this.estado,
    cliente: this.prospecto?.nombre || 'Sin cliente',
    productos: this.productos?.length || 0,
    ...totales,
    tiempoFabricacion: this.tiempoFabricacion || 15,
    tiempoInstalacion: this.tiempoInstalacion || 1,
    incluyeInstalacion: this.instalacion?.incluye || false,
    requiereFactura: this.facturacion?.requiere || false
  };
};

// Hook pre-save para recalcular totales automáticamente
cotizacionSchema.pre('save', function(next) {
  if (this.isModified('productos') || this.isModified('instalacion') || 
      this.isModified('descuento') || this.isModified('facturacion')) {
    this.calcularTotales();
  }
  next();
});

cotizacionSchema.index({ numero: 1 });
cotizacionSchema.index({ prospecto: 1 });
cotizacionSchema.index({ estado: 1 });
cotizacionSchema.index({ fecha: 1 });
cotizacionSchema.index({ elaboradaPor: 1 });
cotizacionSchema.index({ archivada: 1 });
cotizacionSchema.index({ proyecto: 1 });

cotizacionSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Cotizacion', cotizacionSchema);

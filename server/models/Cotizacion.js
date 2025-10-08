const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const cotizacionSchema = new mongoose.Schema({
  prospecto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prospecto',
    required: true
  },
  numero: {
    type: String,
    unique: true,
    required: true
  },
  nombre: { // Nuevo campo para el nombre de la cotización
    type: String,
    required: true
  },
  fecha: {
    type: Date,
    default: Date.now
  },
  validoHasta: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días por defecto
  },
  estado: {
    type: String,
    enum: ['borrador', 'enviada', 'Activa', 'vista', 'aprobada', 'rechazada', 'vencida', 'convertida'], // Añadido 'Activa'
    default: 'borrador'
  },
  comentarios: String,
  precioGeneralM2: Number, // Precio general por m² de referencia
  unidadMedida: String,

  // Productos cotizados con estructura anidada para múltiples medidas/detalles por partida
  productos: [{
    ubicacion: String,
    cantidad: { type: Number, default: 1 }, // Cantidad de piezas en esta partida
    medidas: [{
      ancho: Number,
      alto: Number,
      area: Number,
      productoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto' }, // Referencia a Producto si existe
      nombreProducto: String,
      color: String,
      precioM2: Number, // Precio específico por m² para esta medida
    }],
    observaciones: String,
    fotoUrls: [String],
    videoUrl: String,
    // Campos específicos para toldos
    esToldo: { type: Boolean, default: false },
    tipoToldo: String,
    kitModelo: String,
    kitModeloManual: String,
    kitPrecio: Number,
    // Campos específicos para motorización
    motorizado: { type: Boolean, default: false },
    motorModelo: String,
    motorModeloManual: String,
    motorPrecio: Number,
    controlModelo: String,
    controlModeloManual: String,
    controlPrecio: Number,
  }],

  // Información de instalación
  instalacion: {
    incluye: { type: Boolean, default: false },
    costo: { type: Number, default: 0 },
    tipo: String // Ej: 'estandar', 'electrica', 'estructural'
  },

  // Información de descuento
  descuento: {
    aplica: { type: Boolean, default: false }, // Nuevo campo para indicar si aplica descuento
    tipo: { type: String, enum: ['porcentaje', 'monto'] },
    valor: Number, // Valor original del descuento (%, o monto)
    monto: Number, // Monto calculado del descuento
  },

  // Información de facturación
  facturacion: {
    requiere: { type: Boolean, default: false },
    iva: { type: Number, default: 0 } // IVA calculado
  },

  // Información de pago (anticipo/saldo)
  pago: {
    metodoAnticipo: String, // Ej: 'efectivo', 'transferencia'
    // Puedes añadir campos para anticipo y saldo calculados aquí si se necesitan almacenar
    // anticipoMonto: Number,
    // saldoMonto: Number,
  },

  // Información de entrega
  entrega: {
    tipo: { type: String, enum: ['normal', 'expres'], default: 'normal' },
    diasExpres: Number, // Solo si es 'expres'
    fechaEstimada: Date, // Se puede calcular en el controlador si es necesario
  },

  // Términos y condiciones
  terminos: {
    incluir: { type: Boolean, default: true },
    // Puedes añadir un campo para el texto de los términos si es dinámico
    // texto: String,
  },

  // Totales finales (calculados en el controlador)
  subtotal: { type: Number, default: 0 }, // Subtotal de productos + instalación antes de descuento
  total: { type: Number, default: 0 }, // Total final (con descuentos, instalación, IVA)
  iva: { type: Number, default: 0 }, // IVA aplicado

  // Auditoría
  elaboradaPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  // La propiedad 'notas' en el esquema de Cotizacion ahora se mapeará a 'comentarios' del frontend
  // y se puede manejar como un array de objetos con contenido, usuario, fecha.
  notas: [{
    fecha: { type: Date, default: Date.now },
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    contenido: String
  }],
}, {
  timestamps: true // Añade createdAt y updatedAt automáticamente
});

// Middleware para generar número de cotización automáticamente antes de guardar
cotizacionSchema.pre('save', async function(next) {
  if (this.isNew && !this.numero) {
    try {
      const year = new Date().getFullYear();
      const count = await this.constructor.countDocuments({
        createdAt: {
          $gte: new Date(year, 0, 1),
          $lt: new Date(year + 1, 0, 1)
        }
      });
      this.numero = `COT-${year}-${String(count + 1).padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generando número de cotización en pre-save:', error);
      // Continúa con un número de fallback o lanza el error
      this.numero = `COT-${new Date().getFullYear()}-${Date.now()}`;
    }
  }
  next();
});

// Índices
cotizacionSchema.index({ numero: 1 });
cotizacionSchema.index({ prospecto: 1 });
cotizacionSchema.index({ estado: 1 });
cotizacionSchema.index({ fecha: 1 });
cotizacionSchema.index({ elaboradaPor: 1 });

// Agregar plugin de paginación
cotizacionSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Cotizacion', cotizacionSchema);

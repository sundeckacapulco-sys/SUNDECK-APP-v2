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
  nombre: {
    type: String,
    required: true
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
  comentarios: String,
  precioGeneralM2: Number,
  unidadMedida: String,

  productos: [{
    ubicacion: String,
    cantidad: { type: Number, default: 1 },
    ancho: Number,
    alto: Number,
    area: Number,
    productoId: { type: String }, // <-- CAMBIO AQUÍ: Ahora es String en lugar de ObjectId
    nombreProducto: String,
    color: String,
    precioM2: Number,
    observaciones: String,
    fotoUrls: [String],
    videoUrl: String,
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
    tipo: { type: String, enum: ['porcentaje', 'monto'] },
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
}, {
  timestamps: true
});

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
      this.numero = `COT-${new Date().getFullYear()}-${Date.now()}`;
    }
  }
  next();
});

cotizacionSchema.index({ numero: 1 });
cotizacionSchema.index({ prospecto: 1 });
cotizacionSchema.index({ estado: 1 });
cotizacionSchema.index({ fecha: 1 });
cotizacionSchema.index({ elaboradaPor: 1 });

cotizacionSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Cotizacion', cotizacionSchema);

const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const pagoSchema = new mongoose.Schema({
  fecha: { type: Date, default: Date.now },
  monto: { type: Number, required: true },
  metodo: { type: String, enum: ['transferencia', 'efectivo', 'tarjeta', 'credito'], default: 'transferencia' },
  referencia: String,
  comprobanteUrl: String,
  registradoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }
});

const productoCompraSchema = new mongoose.Schema({
  producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto' }, // Opcional, para referencia
  descripcion: { type: String, required: true },
  cantidad: { type: Number, required: true },
  unidad: { type: String, required: true, default: 'm' },
  costoUnitario: { type: Number, required: true },
  costoTotal: { type: Number, required: true }
});

const ordenCompraSchema = new mongoose.Schema({
  numeroOrden: { 
    type: String, 
    unique: true,
    required: true,
    default: () => `OC-${Date.now()}`
  },
  proveedor: {
    // Esto podría ser un string o referenciar a un futuro modelo de Proveedores
    nombre: { type: String, required: true },
    contacto: String,
    telefono: String
  },
  pedido: { type: mongoose.Schema.Types.ObjectId, ref: 'Pedido' }, // Pedido interno que origina la compra
  fechaEmision: { type: Date, default: Date.now },
  fechaEntregaEsperada: Date,
  
  productos: [productoCompraSchema],
  
  subtotal: { type: Number, required: true },
  impuestos: { type: Number, default: 0 },
  total: { type: Number, required: true },
  
  pagos: [pagoSchema],
  saldoPendiente: { type: Number, required: true },

  estado: {
    type: String,
    enum: ['borrador', 'enviada', 'confirmada', 'parcialmente_recibida', 'recibida', 'cancelada'],
    default: 'borrador'
  },
  
  notas: String,
  creadaPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
}, {
  timestamps: true
});

ordenCompraSchema.plugin(mongoosePaginate);

// Middleware para calcular el saldo pendiente antes de guardar
ordenCompraSchema.pre('save', function(next) {
  const totalPagado = this.pagos.reduce((acc, pago) => acc + pago.monto, 0);
  this.saldoPendiente = this.total - totalPagado;
  next();
});

const OrdenCompra = mongoose.model('OrdenCompra', ordenCompraSchema);

module.exports = OrdenCompra;
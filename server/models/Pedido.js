const mongoose = require('mongoose');

const pedidoSchema = new mongoose.Schema({
  // Referencia a cotización y prospecto
  cotizacion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cotizacion',
    required: true
  },
  prospecto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prospecto',
    required: true
  },
  
  // Información del pedido
  numero: {
    type: String,
    unique: true,
    required: true
  },
  fechaPedido: {
    type: Date,
    default: Date.now
  },
  
  // Montos y pagos
  montoTotal: {
    type: Number,
    required: true
  },
  anticipo: {
    monto: Number,
    porcentaje: Number,
    fechaPago: Date,
    metodoPago: {
      type: String,
      enum: ['efectivo', 'transferencia', 'cheque', 'tarjeta', 'deposito']
    },
    referencia: String,
    comprobante: String, // URL del comprobante
    pagado: { type: Boolean, default: false }
  },
  saldo: {
    monto: Number,
    porcentaje: Number,
    fechaVencimiento: Date,
    fechaPago: Date,
    metodoPago: String,
    referencia: String,
    comprobante: String,
    pagado: { type: Boolean, default: false }
  },
  
  // Estado del pedido
  estado: {
    type: String,
    enum: ['confirmado', 'en_fabricacion', 'fabricado', 'en_instalacion', 'instalado', 'entregado', 'cancelado'],
    default: 'confirmado'
  },
  
  // Fechas importantes
  fechaInicioFabricacion: Date,
  fechaFinFabricacion: Date,
  fechaInstalacion: Date,
  fechaEntrega: Date,
  
  // Productos del pedido (copiados de cotización)
  productos: [{
    nombre: String,
    descripcion: String,
    categoria: String,
    material: String,
    color: String,
    cristal: String,
    herrajes: String,
    medidas: {
      ancho: Number,
      alto: Number,
      area: Number
    },
    cantidad: Number,
    precioUnitario: Number,
    subtotal: Number,
    requiereR24: Boolean,
    tiempoFabricacion: Number,
    // Estado específico del producto
    estadoFabricacion: {
      type: String,
      enum: ['pendiente', 'en_proceso', 'terminado', 'instalado'],
      default: 'pendiente'
    }
  }],
  
  // Información de entrega
  direccionEntrega: {
    calle: String,
    colonia: String,
    ciudad: String,
    codigoPostal: String,
    referencias: String
  },
  
  // Contacto para entrega
  contactoEntrega: {
    nombre: String,
    telefono: String,
    horarioPreferido: String
  },
  
  // Notas y observaciones
  notas: [{
    fecha: { type: Date, default: Date.now },
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    contenido: String,
    tipo: {
      type: String,
      enum: ['general', 'fabricacion', 'instalacion', 'pago', 'entrega']
    }
  }],
  
  // Archivos del pedido
  archivos: [{
    tipo: {
      type: String,
      enum: ['contrato', 'comprobante_pago', 'plano', 'foto', 'otro']
    },
    nombre: String,
    url: String,
    fechaSubida: { type: Date, default: Date.now }
  }],
  
  // Responsables
  vendedor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  fabricante: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  instalador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  
  // Información de cancelación
  cancelacion: {
    fecha: Date,
    motivo: String,
    responsable: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    reembolso: {
      monto: Number,
      fecha: Date,
      metodo: String,
      referencia: String
    }
  }
}, {
  timestamps: true
});

// Generar número de pedido automáticamente
pedidoSchema.pre('save', async function(next) {
  if (this.isNew && !this.numero) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1)
      }
    });
    this.numero = `PED-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Método para verificar si está completamente pagado
pedidoSchema.methods.estaPagado = function() {
  return this.anticipo.pagado && this.saldo.pagado;
};

// Método para calcular días de retraso
pedidoSchema.methods.diasRetraso = function() {
  const hoy = new Date();
  let fechaLimite;
  
  switch(this.estado) {
    case 'confirmado':
      fechaLimite = this.fechaInicioFabricacion;
      break;
    case 'en_fabricacion':
      fechaLimite = this.fechaFinFabricacion;
      break;
    case 'fabricado':
      fechaLimite = this.fechaInstalacion;
      break;
    default:
      return 0;
  }
  
  if (!fechaLimite || hoy <= fechaLimite) return 0;
  return Math.ceil((hoy - fechaLimite) / (1000 * 60 * 60 * 24));
};

// Índices
pedidoSchema.index({ numero: 1 });
pedidoSchema.index({ prospecto: 1 });
pedidoSchema.index({ cotizacion: 1 });
pedidoSchema.index({ estado: 1 });
pedidoSchema.index({ fechaEntrega: 1 });
pedidoSchema.index({ vendedor: 1 });

module.exports = mongoose.model('Pedido', pedidoSchema);

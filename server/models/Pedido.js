const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const logger = require('../config/logger');

const pedidoSchema = new mongoose.Schema({
  // ===== REFERENCIAS PRINCIPALES =====
  proyecto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Proyecto',
    required: true,
    index: true
  },
  cotizacion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cotizacion',
    required: true
  },
  prospecto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prospecto'
  },
  
  // ===== IDENTIFICACIÓN DEL PEDIDO =====
  numero: {
    type: String,
    unique: true,
    required: true
  },
  fechaPedido: {
    type: Date,
    default: Date.now
  },
  
  // ===== CAMPOS NUEVOS CRÍTICOS =====
  fechaCompromiso: {
    type: Date,
    required: true  // Fecha prometida al cliente
  },
  prioridad: {
    type: String,
    enum: ['urgente', 'alta', 'media', 'baja'],
    default: 'media'
  },
  origen: {
    type: String,
    enum: ['cotizacion_aprobada', 'directo', 'renovacion'],
    default: 'cotizacion_aprobada'
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
    
    // ⭐ ESPECIFICACIONES TÉCNICAS COMPLETAS (13 campos)
    // Flujo: Proyecto.levantamiento → Cotización → Pedido → Fabricación
    especificacionesTecnicas: {
      sistema: [String],              // Campo 1: Tipo de sistema (Roller, Zebra, Panel, etc.)
      control: String,                // Campo 2: Tipo de control (Manual, Motorizado, Micro)
      tipoInstalacion: String,        // Campo 3: Tipo de instalación (Muro, Techo, Empotrado, Exterior)
      tipoFijacion: String,           // Campo 4: Tipo de fijación (Concreto, Tablaroca, Aluminio, Madera)
      caida: String,                  // Campo 5: Orientación de caída (Frontal, Lateral, etc.)
      galeria: String,                // Campo 6: Galería (Sí/No)
      telaMarca: String,              // Campo 7: Marca de tela (Screen 3%, Blackout, etc.)
      baseTabla: String,              // Campo 8: Medida de base/tabla (7cm, 15cm, 18cm)
      modoOperacion: String,          // Campo 9: Modo de operación (Cadena, Motor, etc.)
      detalleTecnico: String,         // Campo 10: Detalle técnico adicional
      traslape: String,               // Campo 11: Traslape (Sí/No)
      modeloCodigo: String,           // Campo 12: Modelo/código del producto
      observacionesTecnicas: String   // Campo 13: Observaciones técnicas específicas
    },
    
    // Motorización (si aplica)
    motorizado: Boolean,
    motorModelo: String,
    motorModeloManual: String,
    motorPrecio: Number,
    controlModelo: String,
    controlModeloManual: String,
    controlPrecio: Number,
    esControlMulticanal: Boolean,
    numMotores: Number,
    
    // Toldos (si aplica)
    esToldo: Boolean,
    tipoToldo: String,
    kitModelo: String,
    kitModeloManual: String,
    kitPrecio: Number,
    
    // Instalación especial
    requiereAndamios: Boolean,
    requiereObraElectrica: Boolean,
    nivelAndamio: String,
    costoAndamios: Number,
    costoObraElectrica: Number,
    requiereInstalacionEspecial: Boolean,
    tipoCobroInstalacion: String,
    costoInstalacionBase: Number,
    costoInstalacionPorPieza: Number,
    
    // Medidas individuales (para productos con múltiples piezas)
    medidasIndividuales: [{
      ancho: Number,
      alto: Number,
      area: Number
    }],
    
    // Multimedia
    fotoUrls: [String],
    videoUrl: String,
    
    // Garantías
    garantiaMotor: String,
    garantiaTela: String,
    
    // Detalles adicionales
    accionamiento: String,
    montaje: String,
    tipoTela: String,
    forroBlackout: Boolean,
    rielDecorativo: Boolean,
    
    // Observaciones generales
    observaciones: String,
    
    // Metadata para trazabilidad
    partidaOriginal: {
      index: Number,
      ubicacion: String,
      producto: String
    },
    piezaOriginal: {
      index: Number,
      total: Number
    },
    
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
  
  // Notas y observaciones (extendido desde legacy)
  notas: [{
    fecha: { type: Date, default: Date.now },
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    contenido: String,
    etapa: {
      type: String,
      enum: ['general', 'fabricacion', 'instalacion', 'pago', 'entrega'],
      default: 'general'
    },
    tipo: {
      type: String,
      enum: ['info', 'cambio', 'problema', 'solucion', 'recordatorio'],
      default: 'info'
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

// Hook pre-save: Generación de número y cálculos automáticos (portado desde legacy)
pedidoSchema.pre('save', async function(next) {
  try {
    // Generar número secuencial si es nuevo
    if (this.isNew && !this.numero) {
      const year = new Date().getFullYear();
      const count = await this.constructor.countDocuments({
        numero: new RegExp(`^PED-${year}-`)
      });
      this.numero = `PED-${year}-${String(count + 1).padStart(4, '0')}`;
      
      logger.info('Número de pedido generado', {
        pedidoId: this._id,
        numero: this.numero,
        script: 'Pedido.pre-save'
      });
    }
    
    // Calcular montos automáticamente si hay productos
    if (this.productos && this.productos.length > 0) {
      const subtotal = this.productos.reduce((sum, p) => sum + (p.subtotal || 0), 0);
      const iva = subtotal * 0.16;
      this.montoTotal = subtotal + iva;
      
      // Calcular anticipo si hay porcentaje definido
      if (this.anticipo && this.anticipo.porcentaje) {
        this.anticipo.monto = this.montoTotal * (this.anticipo.porcentaje / 100);
      }
      
      // Calcular saldo si hay porcentaje definido
      if (this.saldo && this.saldo.porcentaje) {
        this.saldo.monto = this.montoTotal * (this.saldo.porcentaje / 100);
      }
      
      logger.debug('Montos calculados automáticamente', {
        pedidoId: this._id,
        numero: this.numero,
        subtotal,
        iva,
        montoTotal: this.montoTotal,
        anticipoMonto: this.anticipo?.monto,
        saldoMonto: this.saldo?.monto
      });
    }
    
    // Actualizar fecha de modificación
    this.updatedAt = new Date();
    
    next();
  } catch (error) {
    logger.error('Error en pre-save de Pedido', {
      pedidoId: this._id,
      error: error.message,
      stack: error.stack
    });
    next(error);
  }
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

// Método para agregar nota (portado desde legacy)
pedidoSchema.methods.agregarNota = function(contenido, usuario, etapa = 'general', tipo = 'info') {
  if (!this.notas) this.notas = [];
  
  this.notas.push({
    contenido,
    usuario,
    etapa,
    tipo,
    fecha: new Date()
  });
  
  logger.info('Nota agregada a pedido', {
    pedidoId: this._id,
    numero: this.numero,
    usuario,
    etapa,
    tipo
  });
  
  return this.save();
};

// Método para cambiar estado con logging automático (portado desde legacy)
pedidoSchema.methods.cambiarEstado = function(nuevoEstado, usuario, nota = null) {
  const estadoAnterior = this.estado;
  this.estado = nuevoEstado;
  
  // Agregar nota automática del cambio de estado
  const mensajeNota = `Estado cambiado de "${estadoAnterior}" a "${nuevoEstado}"${nota ? `. ${nota}` : ''}`;
  this.notas.push({
    contenido: mensajeNota,
    usuario,
    etapa: 'general',
    tipo: 'cambio',
    fecha: new Date()
  });
  
  // Actualizar fechas según el estado
  const ahora = new Date();
  switch(nuevoEstado) {
    case 'confirmado':
      if (!this.fechaPedido) this.fechaPedido = ahora;
      break;
    case 'en_fabricacion':
      if (!this.fechaInicioFabricacion) this.fechaInicioFabricacion = ahora;
      break;
    case 'fabricado':
      if (!this.fechaFinFabricacion) this.fechaFinFabricacion = ahora;
      break;
    case 'en_instalacion':
      if (!this.fechaInstalacion) this.fechaInstalacion = ahora;
      break;
    case 'entregado':
      if (!this.fechaEntrega) this.fechaEntrega = ahora;
      break;
  }
  
  logger.info('Estado de pedido cambiado', {
    pedidoId: this._id,
    numero: this.numero,
    estadoAnterior,
    nuevoEstado,
    usuario
  });
  
  return this.save();
};

// Método para calcular progreso (portado desde legacy)
pedidoSchema.methods.calcularProgreso = function() {
  const estados = ['confirmado', 'en_fabricacion', 'fabricado', 'en_instalacion', 'instalado', 'entregado'];
  const indice = estados.indexOf(this.estado);
  return indice >= 0 ? Math.round((indice / (estados.length - 1)) * 100) : 0;
};

// Índices
pedidoSchema.index({ numero: 1 });
pedidoSchema.index({ proyecto: 1 });
pedidoSchema.index({ prospecto: 1 });
pedidoSchema.index({ cotizacion: 1 });
pedidoSchema.index({ estado: 1 });
pedidoSchema.index({ fechaCompromiso: 1 });
pedidoSchema.index({ prioridad: 1 });
pedidoSchema.index({ fechaEntrega: 1 });
pedidoSchema.index({ vendedor: 1 });

// Agregar plugin de paginación
pedidoSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Pedido', pedidoSchema);

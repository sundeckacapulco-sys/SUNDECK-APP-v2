/**
 * Modelo de Caja
 * Control de efectivo, cortes diarios y movimientos financieros
 */

const mongoose = require('mongoose');
const logger = require('../config/logger');

const movimientoSchema = new mongoose.Schema({
  // Tipo de movimiento
  tipo: {
    type: String,
    enum: ['ingreso', 'egreso'],
    required: true
  },
  
  // Categoría del movimiento
  categoria: {
    type: String,
    enum: [
      // Ingresos
      'anticipo_proyecto',
      'saldo_proyecto',
      'pago_adicional',
      'otro_ingreso',
      // Egresos
      'compra_materiales',
      'gasolina',
      'viaticos',
      'nomina',
      'servicios',
      'otro_egreso'
    ],
    required: true
  },
  
  // Descripción del movimiento
  concepto: {
    type: String,
    required: true,
    trim: true
  },
  
  // Monto (siempre positivo, el tipo indica si es ingreso o egreso)
  monto: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Método de pago
  metodoPago: {
    type: String,
    enum: ['efectivo', 'transferencia', 'tarjeta', 'cheque', 'deposito'],
    required: true
  },
  
  // Referencia del pago (número de transferencia, folio, etc.)
  referencia: {
    type: String,
    trim: true
  },
  
  // Referencias a otros documentos
  proyecto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Proyecto'
  },
  pedido: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pedido'
  },
  
  // Tipo de pago si es de proyecto
  tipoPago: {
    type: String,
    enum: ['anticipo', 'saldo', 'adicional', 'gasto', 'otro']
  },
  
  // Comprobante (URL o base64)
  comprobante: String,
  
  // Información del cliente (para ingresos)
  cliente: {
    nombre: String,
    telefono: String
  },
  
  // Información del proveedor (para egresos)
  proveedor: {
    nombre: String,
    rfc: String
  },
  
  // Hora del movimiento
  hora: {
    type: Date,
    default: Date.now
  },
  
  // Usuario que registró
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  
  // Notas adicionales
  notas: String,
  
  // Estado del movimiento
  estado: {
    type: String,
    enum: ['activo', 'anulado'],
    default: 'activo'
  },
  
  // Si fue anulado
  anulacion: {
    fecha: Date,
    motivo: String,
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }
  }
});

const cajaSchema = new mongoose.Schema({
  // ===== IDENTIFICACIÓN =====
  numero: {
    type: String,
    unique: true
    // Se genera automáticamente en pre-save
  },
  
  fecha: {
    type: Date,
    required: true,
    index: true
  },
  
  // Sucursal (si hay múltiples)
  sucursal: {
    type: String,
    default: 'Principal',
    trim: true
  },
  
  // ===== APERTURA =====
  apertura: {
    hora: {
      type: Date,
      required: true
    },
    fondoInicial: {
      type: Number,
      required: true,
      min: 0
    },
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true
    },
    observaciones: String
  },
  
  // ===== MOVIMIENTOS =====
  movimientos: [movimientoSchema],
  
  // ===== CIERRE =====
  cierre: {
    hora: Date,
    
    // Desglose de efectivo físico
    desglose: {
      billetes: {
        mil: { type: Number, default: 0 },
        quinientos: { type: Number, default: 0 },
        doscientos: { type: Number, default: 0 },
        cien: { type: Number, default: 0 },
        cincuenta: { type: Number, default: 0 },
        veinte: { type: Number, default: 0 }
      },
      monedas: {
        veinte: { type: Number, default: 0 },
        diez: { type: Number, default: 0 },
        cinco: { type: Number, default: 0 },
        dos: { type: Number, default: 0 },
        uno: { type: Number, default: 0 },
        cincuentaCentavos: { type: Number, default: 0 }
      }
    },
    
    saldoEsperado: Number,
    saldoReal: Number,
    diferencia: Number,
    
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario'
    },
    
    observaciones: String,
    
    // Acciones con el efectivo
    retiroEfectivo: {
      monto: { type: Number, default: 0 },
      destino: String, // 'banco', 'caja_fuerte', 'otro'
      referencia: String
    },
    
    fondoParaSiguiente: {
      type: Number,
      default: 0
    }
  },
  
  // Estado de la caja
  estado: {
    type: String,
    enum: ['abierta', 'cerrada', 'en_revision'],
    default: 'abierta'
  },
  
  // ===== TOTALES CALCULADOS =====
  totales: {
    // Ingresos
    ingresosEfectivo: { type: Number, default: 0 },
    ingresosBanco: { type: Number, default: 0 },
    totalIngresos: { type: Number, default: 0 },
    
    // Egresos
    egresosEfectivo: { type: Number, default: 0 },
    egresosBanco: { type: Number, default: 0 },
    totalEgresos: { type: Number, default: 0 },
    
    // Por categoría
    porCategoria: {
      anticipo_proyecto: { type: Number, default: 0 },
      saldo_proyecto: { type: Number, default: 0 },
      pago_adicional: { type: Number, default: 0 },
      otro_ingreso: { type: Number, default: 0 },
      compra_materiales: { type: Number, default: 0 },
      gasolina: { type: Number, default: 0 },
      viaticos: { type: Number, default: 0 },
      nomina: { type: Number, default: 0 },
      servicios: { type: Number, default: 0 },
      otro_egreso: { type: Number, default: 0 }
    },
    
    // Conteo de movimientos
    cantidadMovimientos: { type: Number, default: 0 },
    cantidadIngresos: { type: Number, default: 0 },
    cantidadEgresos: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// ===== HOOKS =====

// Pre-save: Generar número y calcular totales
cajaSchema.pre('save', async function(next) {
  try {
    // Generar número si es nuevo
    if (this.isNew && !this.numero) {
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const count = await this.constructor.countDocuments({
        numero: new RegExp(`^CAJA-${year}${month}-`)
      });
      this.numero = `CAJA-${year}${month}-${String(count + 1).padStart(4, '0')}`;
      
      logger.info('Número de caja generado', {
        cajaId: this._id,
        numero: this.numero
      });
    }
    
    // Recalcular totales
    this.recalcularTotales();
    
    next();
  } catch (error) {
    logger.error('Error en pre-save de Caja', {
      cajaId: this._id,
      error: error.message
    });
    next(error);
  }
});

// ===== MÉTODOS =====

// Recalcular totales
cajaSchema.methods.recalcularTotales = function() {
  const movimientosActivos = this.movimientos.filter(m => m.estado === 'activo');
  
  // Resetear totales
  this.totales = {
    ingresosEfectivo: 0,
    ingresosBanco: 0,
    totalIngresos: 0,
    egresosEfectivo: 0,
    egresosBanco: 0,
    totalEgresos: 0,
    porCategoria: {},
    cantidadMovimientos: movimientosActivos.length,
    cantidadIngresos: 0,
    cantidadEgresos: 0
  };
  
  movimientosActivos.forEach(mov => {
    const esEfectivo = mov.metodoPago === 'efectivo';
    
    if (mov.tipo === 'ingreso') {
      this.totales.cantidadIngresos++;
      this.totales.totalIngresos += mov.monto;
      
      if (esEfectivo) {
        this.totales.ingresosEfectivo += mov.monto;
      } else {
        this.totales.ingresosBanco += mov.monto;
      }
    } else {
      this.totales.cantidadEgresos++;
      this.totales.totalEgresos += mov.monto;
      
      if (esEfectivo) {
        this.totales.egresosEfectivo += mov.monto;
      } else {
        this.totales.egresosBanco += mov.monto;
      }
    }
    
    // Por categoría
    if (!this.totales.porCategoria[mov.categoria]) {
      this.totales.porCategoria[mov.categoria] = 0;
    }
    this.totales.porCategoria[mov.categoria] += mov.monto;
  });
  
  return this.totales;
};

// Agregar movimiento
cajaSchema.methods.agregarMovimiento = function(movimiento) {
  this.movimientos.push(movimiento);
  this.recalcularTotales();
  
  logger.info('Movimiento agregado a caja', {
    cajaId: this._id,
    numero: this.numero,
    tipo: movimiento.tipo,
    monto: movimiento.monto,
    categoria: movimiento.categoria
  });
  
  return this.save();
};

// Anular movimiento
cajaSchema.methods.anularMovimiento = function(movimientoId, motivo, usuarioId) {
  const movimiento = this.movimientos.id(movimientoId);
  
  if (!movimiento) {
    throw new Error('Movimiento no encontrado');
  }
  
  if (movimiento.estado === 'anulado') {
    throw new Error('El movimiento ya está anulado');
  }
  
  movimiento.estado = 'anulado';
  movimiento.anulacion = {
    fecha: new Date(),
    motivo: motivo,
    usuario: usuarioId
  };
  
  this.recalcularTotales();
  
  logger.info('Movimiento anulado', {
    cajaId: this._id,
    movimientoId: movimientoId,
    motivo: motivo
  });
  
  return this.save();
};

// Calcular saldo esperado
cajaSchema.methods.calcularSaldoEsperado = function() {
  const fondoInicial = this.apertura?.fondoInicial || 0;
  const ingresosEfectivo = this.totales?.ingresosEfectivo || 0;
  const egresosEfectivo = this.totales?.egresosEfectivo || 0;
  
  return fondoInicial + ingresosEfectivo - egresosEfectivo;
};

// Cerrar caja
cajaSchema.methods.cerrarCaja = function(datosCierre) {
  const saldoEsperado = this.calcularSaldoEsperado();
  const saldoReal = datosCierre.saldoReal || 0;
  
  this.cierre = {
    hora: new Date(),
    desglose: datosCierre.desglose || {},
    saldoEsperado: saldoEsperado,
    saldoReal: saldoReal,
    diferencia: saldoReal - saldoEsperado,
    usuario: datosCierre.usuario,
    observaciones: datosCierre.observaciones || '',
    retiroEfectivo: datosCierre.retiroEfectivo || { monto: 0 },
    fondoParaSiguiente: datosCierre.fondoParaSiguiente || 0
  };
  
  this.estado = 'cerrada';
  
  logger.info('Caja cerrada', {
    cajaId: this._id,
    numero: this.numero,
    saldoEsperado: saldoEsperado,
    saldoReal: saldoReal,
    diferencia: this.cierre.diferencia
  });
  
  return this.save();
};

// Calcular total de desglose
cajaSchema.methods.calcularTotalDesglose = function() {
  const desglose = this.cierre?.desglose || {};
  const billetes = desglose.billetes || {};
  const monedas = desglose.monedas || {};
  
  const totalBilletes = 
    (billetes.mil || 0) * 1000 +
    (billetes.quinientos || 0) * 500 +
    (billetes.doscientos || 0) * 200 +
    (billetes.cien || 0) * 100 +
    (billetes.cincuenta || 0) * 50 +
    (billetes.veinte || 0) * 20;
    
  const totalMonedas =
    (monedas.veinte || 0) * 20 +
    (monedas.diez || 0) * 10 +
    (monedas.cinco || 0) * 5 +
    (monedas.dos || 0) * 2 +
    (monedas.uno || 0) * 1 +
    (monedas.cincuentaCentavos || 0) * 0.5;
    
  return totalBilletes + totalMonedas;
};

// ===== STATICS =====

// Obtener caja abierta del día
cajaSchema.statics.obtenerCajaAbierta = async function(fecha = new Date()) {
  const inicioDia = new Date(fecha);
  inicioDia.setHours(0, 0, 0, 0);
  
  const finDia = new Date(fecha);
  finDia.setHours(23, 59, 59, 999);
  
  return this.findOne({
    fecha: { $gte: inicioDia, $lte: finDia },
    estado: 'abierta'
  }).populate('apertura.usuario', 'nombre email');
};

// Verificar si hay caja abierta
cajaSchema.statics.hayCajaAbierta = async function(fecha = new Date()) {
  const caja = await this.obtenerCajaAbierta(fecha);
  return !!caja;
};

// Obtener última caja cerrada
cajaSchema.statics.obtenerUltimaCajaCerrada = async function() {
  return this.findOne({ estado: 'cerrada' })
    .sort({ fecha: -1 })
    .populate('apertura.usuario cierre.usuario', 'nombre email');
};

// ===== ÍNDICES =====
cajaSchema.index({ numero: 1 });
cajaSchema.index({ fecha: -1 });
cajaSchema.index({ estado: 1 });
cajaSchema.index({ 'apertura.usuario': 1 });
cajaSchema.index({ sucursal: 1, fecha: -1 });

module.exports = mongoose.model('Caja', cajaSchema);

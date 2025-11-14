const mongoose = require('mongoose');

/**
 * Modelo para registrar todos los movimientos de almacén
 * Historial completo de entradas, salidas, ajustes y transferencias
 */
const movimientoAlmacenSchema = new mongoose.Schema({
  // Tipo de movimiento
  tipoMovimiento: {
    type: String,
    required: true,
    enum: ['entrada', 'salida', 'ajuste', 'transferencia', 'devolucion'],
    index: true
  },
  
  // Material afectado
  material: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Almacen',
    required: true,
    index: true
  },
  
  // Información del material (snapshot)
  materialInfo: {
    codigo: String,
    descripcion: String,
    tipo: String
  },
  
  // Cantidad del movimiento
  cantidad: {
    type: Number,
    required: true
  },
  
  unidad: {
    type: String,
    required: true
  },
  
  // Stock antes y después
  stockAnterior: {
    type: Number,
    required: true
  },
  
  stockPosterior: {
    type: Number,
    required: true
  },
  
  // Motivo y detalles
  motivo: {
    type: String,
    required: true,
    enum: [
      'compra',           // Entrada por compra
      'produccion',       // Salida por uso en producción
      'devolucion',       // Entrada por devolución
      'ajuste_inventario',// Ajuste por conteo físico
      'merma',            // Salida por merma/desperdicio
      'transferencia',    // Transferencia entre almacenes
      'sobrante',         // Entrada por sobrante de producción
      'otro'
    ]
  },
  
  descripcion: {
    type: String,
    required: true
  },
  
  // Referencias
  referencias: {
    proyecto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Proyecto'
    },
    ordenProduccion: String,
    ordenCompra: String,
    factura: String,
    remision: String
  },
  
  // Costos (para entradas)
  costo: {
    precioUnitario: Number,
    total: Number,
    moneda: {
      type: String,
      default: 'MXN'
    }
  },
  
  // Proveedor (para entradas)
  proveedor: {
    nombre: String,
    contacto: String
  },
  
  // Ubicación
  ubicacion: {
    origen: String,
    destino: String
  },
  
  // Usuario responsable
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  
  usuarioNombre: String,
  
  // Observaciones
  observaciones: String,
  
  // Documentos adjuntos
  documentos: [{
    nombre: String,
    url: String,
    tipo: String
  }],
  
  // Fecha del movimiento
  fechaMovimiento: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Índices compuestos
movimientoAlmacenSchema.index({ material: 1, fechaMovimiento: -1 });
movimientoAlmacenSchema.index({ tipoMovimiento: 1, fechaMovimiento: -1 });
movimientoAlmacenSchema.index({ 'referencias.proyecto': 1 });
movimientoAlmacenSchema.index({ 'referencias.ordenProduccion': 1 });

// Métodos estáticos
movimientoAlmacenSchema.statics.registrarEntrada = async function(data) {
  const { materialId, cantidad, motivo, descripcion, usuarioId, costo, proveedor, referencias } = data;
  
  const Almacen = mongoose.model('Almacen');
  const material = await Almacen.findById(materialId);
  
  if (!material) {
    throw new Error('Material no encontrado');
  }
  
  const stockAnterior = material.cantidad;
  await material.agregarStock(cantidad, motivo, usuarioId);
  
  const movimiento = new this({
    tipoMovimiento: 'entrada',
    material: materialId,
    materialInfo: {
      codigo: material.codigo,
      descripcion: material.descripcion,
      tipo: material.tipo
    },
    cantidad,
    unidad: material.unidad,
    stockAnterior,
    stockPosterior: material.cantidad,
    motivo,
    descripcion,
    usuario: usuarioId,
    costo,
    proveedor,
    referencias
  });
  
  return await movimiento.save();
};

movimientoAlmacenSchema.statics.registrarSalida = async function(data) {
  const { materialId, cantidad, motivo, descripcion, usuarioId, referencias } = data;
  
  const Almacen = mongoose.model('Almacen');
  const material = await Almacen.findById(materialId);
  
  if (!material) {
    throw new Error('Material no encontrado');
  }
  
  const stockAnterior = material.cantidad;
  await material.retirarStock(cantidad, motivo, usuarioId);
  
  const movimiento = new this({
    tipoMovimiento: 'salida',
    material: materialId,
    materialInfo: {
      codigo: material.codigo,
      descripcion: material.descripcion,
      tipo: material.tipo
    },
    cantidad,
    unidad: material.unidad,
    stockAnterior,
    stockPosterior: material.cantidad,
    motivo,
    descripcion,
    usuario: usuarioId,
    referencias
  });
  
  return await movimiento.save();
};

movimientoAlmacenSchema.statics.registrarAjuste = async function(data) {
  const { materialId, nuevaCantidad, motivo, descripcion, usuarioId } = data;
  
  const Almacen = mongoose.model('Almacen');
  const material = await Almacen.findById(materialId);
  
  if (!material) {
    throw new Error('Material no encontrado');
  }
  
  const stockAnterior = material.cantidad;
  const { diferencia } = await material.ajustarStock(nuevaCantidad, motivo, usuarioId);
  
  const movimiento = new this({
    tipoMovimiento: 'ajuste',
    material: materialId,
    materialInfo: {
      codigo: material.codigo,
      descripcion: material.descripcion,
      tipo: material.tipo
    },
    cantidad: Math.abs(diferencia),
    unidad: material.unidad,
    stockAnterior,
    stockPosterior: material.cantidad,
    motivo,
    descripcion: `${descripcion} (${diferencia > 0 ? '+' : ''}${diferencia})`,
    usuario: usuarioId
  });
  
  return await movimiento.save();
};

movimientoAlmacenSchema.statics.obtenerHistorial = function(materialId, limite = 50) {
  return this.find({ material: materialId })
    .sort({ fechaMovimiento: -1 })
    .limit(limite)
    .populate('usuario', 'nombre email');
};

movimientoAlmacenSchema.statics.reporteMovimientos = function(filtros = {}) {
  const { fechaInicio, fechaFin, tipoMovimiento, materialId } = filtros;
  
  const query = {};
  
  if (fechaInicio || fechaFin) {
    query.fechaMovimiento = {};
    if (fechaInicio) query.fechaMovimiento.$gte = new Date(fechaInicio);
    if (fechaFin) query.fechaMovimiento.$lte = new Date(fechaFin);
  }
  
  if (tipoMovimiento) query.tipoMovimiento = tipoMovimiento;
  if (materialId) query.material = materialId;
  
  return this.find(query)
    .sort({ fechaMovimiento: -1 })
    .populate('material')
    .populate('usuario', 'nombre email');
};

module.exports = mongoose.model('MovimientoAlmacen', movimientoAlmacenSchema);

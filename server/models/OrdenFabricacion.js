const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const ordenFabricacionSchema = new mongoose.Schema({
  // Referencia al pedido original
  pedido: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pedido',
    required: true
  },
  
  // Información básica
  numero: {
    type: String,
    unique: true,
    required: true
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  },
  
  // Información del cliente (sin precios)
  cliente: {
    nombre: String,
    telefono: String,
    direccion: String,
    referencias: String
  },
  
  // Productos a fabricar (SIN PRECIOS)
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
      area: Number,
      // Medidas adicionales específicas para fabricación
      profundidad: Number,
      diametroTubo: Number,
      largoTubo: Number
    },
    cantidad: Number,
    requiereR24: Boolean,
    
    // Especificaciones técnicas para fabricación
    especificacionesTecnicas: {
      tipoInstalacion: {
        type: String,
        enum: ['interior', 'exterior', 'empotrado', 'sobrepuesto']
      },
      tipoSoporte: {
        type: String,
        enum: ['pared', 'techo', 'piso', 'mixto']
      },
      orientacion: {
        type: String,
        enum: ['norte', 'sur', 'este', 'oeste', 'noreste', 'noroeste', 'sureste', 'suroeste']
      },
      exposicionSolar: {
        type: String,
        enum: ['alta', 'media', 'baja']
      },
      tipoViento: {
        type: String,
        enum: ['normal', 'fuerte', 'huracanado']
      }
    },
    
    // Materiales específicos
    materiales: [{
      tipo: String, // ej: 'tubo', 'tela', 'herraje', 'motor'
      descripcion: String,
      cantidad: Number,
      unidad: String, // ej: 'metros', 'piezas', 'kg'
      proveedor: String
    }],
    
    // Instrucciones de fabricación
    instrucciones: [{
      paso: Number,
      descripcion: String,
      herramientasRequeridas: [String],
      tiempoEstimado: Number, // en minutos
      observaciones: String
    }],
    
    // Estado de fabricación
    estadoFabricacion: {
      type: String,
      enum: ['pendiente', 'cortado', 'armado', 'terminado', 'control_calidad', 'listo_instalacion'],
      default: 'pendiente'
    },
    
    // Control de calidad
    controlCalidad: {
      revisado: { type: Boolean, default: false },
      fechaRevision: Date,
      revisor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
      observaciones: String,
      aprobado: { type: Boolean, default: false }
    },
    
    // Tiempos de fabricación
    tiempos: {
      inicioFabricacion: Date,
      finFabricacion: Date,
      tiempoEstimado: Number, // días
      tiempoReal: Number // días
    }
  }],
  
  // Estado general de la orden
  estado: {
    type: String,
    enum: ['pendiente', 'en_proceso', 'terminado', 'entregado_instalacion', 'cancelado'],
    default: 'pendiente'
  },
  
  // Fechas importantes
  fechaInicioEstimada: Date,
  fechaFinEstimada: Date,
  fechaInicioReal: Date,
  fechaFinReal: Date,
  
  // Responsables
  fabricante: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  supervisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  
  // Prioridad
  prioridad: {
    type: String,
    enum: ['baja', 'normal', 'alta', 'urgente'],
    default: 'normal'
  },
  
  // Notas de fabricación
  notas: [{
    fecha: { type: Date, default: Date.now },
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    contenido: String,
    tipo: {
      type: String,
      enum: ['fabricacion', 'materiales', 'calidad', 'retraso', 'observacion']
    }
  }],
  
  // Archivos técnicos
  archivos: [{
    tipo: {
      type: String,
      enum: ['plano', 'especificacion', 'foto_referencia', 'manual', 'otro']
    },
    nombre: String,
    url: String,
    fechaSubida: { type: Date, default: Date.now }
  }],
  
  // Información de instalación
  instalacion: {
    fechaProgramada: Date,
    instalador: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    herramientasEspeciales: [String],
    observacionesInstalacion: String,
    tiempoEstimadoInstalacion: Number // horas
  }
}, {
  timestamps: true
});

// Generar número de orden automáticamente
ordenFabricacionSchema.pre('save', async function(next) {
  if (this.isNew && !this.numero) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1)
      }
    });
    this.numero = `FAB-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Método para calcular progreso de fabricación
ordenFabricacionSchema.methods.calcularProgreso = function() {
  if (!this.productos || this.productos.length === 0) return 0;
  
  const estadosProgreso = {
    'pendiente': 0,
    'cortado': 20,
    'armado': 50,
    'terminado': 80,
    'control_calidad': 90,
    'listo_instalacion': 100
  };
  
  const totalProgreso = this.productos.reduce((sum, producto) => {
    return sum + (estadosProgreso[producto.estadoFabricacion] || 0);
  }, 0);
  
  return Math.round(totalProgreso / this.productos.length);
};

// Método para verificar si está listo para instalación
ordenFabricacionSchema.methods.listoParaInstalacion = function() {
  return this.productos.every(producto => 
    producto.estadoFabricacion === 'listo_instalacion' && 
    producto.controlCalidad.aprobado
  );
};

// Método para calcular días de retraso
ordenFabricacionSchema.methods.diasRetraso = function() {
  const hoy = new Date();
  const fechaLimite = this.fechaFinEstimada;
  
  if (!fechaLimite || hoy <= fechaLimite) return 0;
  return Math.ceil((hoy - fechaLimite) / (1000 * 60 * 60 * 24));
};

// Índices
ordenFabricacionSchema.index({ numero: 1 });
ordenFabricacionSchema.index({ pedido: 1 });
ordenFabricacionSchema.index({ estado: 1 });
ordenFabricacionSchema.index({ prioridad: 1 });
ordenFabricacionSchema.index({ fabricante: 1 });
ordenFabricacionSchema.index({ fechaFinEstimada: 1 });

// Agregar plugin de paginación
ordenFabricacionSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('OrdenFabricacion', ordenFabricacionSchema);

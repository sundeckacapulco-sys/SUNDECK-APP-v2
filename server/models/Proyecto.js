const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const proyectoSchema = new mongoose.Schema({
  // Información del cliente
  cliente: {
    nombre: {
      type: String,
      required: true,
      trim: true
    },
    telefono: {
      type: String,
      required: true,
      trim: true
    },
    correo: {
      type: String,
      trim: true,
      lowercase: true
    },
    direccion: {
      type: String,
      trim: true
    },
    zona: {
      type: String,
      trim: true
    }
  },

  // Número de proyecto profesional
  numero: {
    type: String,
    unique: true,
    sparse: true
  },

  // Tipo de fuente del proyecto
  tipo_fuente: {
    type: String,
    enum: ['simple', 'en_vivo', 'formal', 'directo'],
    required: true,
    default: 'simple'
  },

  // Estado del proyecto en el flujo
  estado: {
    type: String,
    enum: [
      'levantamiento',
      'cotizacion',
      'aprobado',
      'fabricacion',
      'instalacion',
      'completado',
      'cancelado'
    ],
    default: 'levantamiento'
  },

  // Fechas importantes
  fecha_creacion: {
    type: Date,
    default: Date.now
  },
  fecha_actualizacion: {
    type: Date,
    default: Date.now
  },
  fecha_compromiso: {
    type: Date
  },

  // Información técnica
  observaciones: {
    type: String,
    trim: true
  },

  // Levantamiento técnico normalizado (FASE 4)
  levantamiento: {
    partidas: [{
      ubicacion: String,
      producto: String,
      color: String,
      modelo: String,
      cantidad: Number,
      piezas: [{
        ancho: Number,
        alto: Number,
        m2: Number,
        sistema: String,
        control: String,
        instalacion: String,
        fijacion: String,
        caida: String,
        galeria: String,
        telaMarca: String,
        baseTabla: String,
        operacion: String,
        detalle: String,
        traslape: String,
        modeloCodigo: String,
        color: String,
        observacionesTecnicas: String,
        precioM2: Number
      }],
      motorizacion: {
        activa: Boolean,
        modeloMotor: String,
        precioMotor: Number,
        cantidadMotores: Number,
        modeloControl: String,
        precioControl: Number,
        tipoControl: String,
        piezasPorControl: Number
      },
      instalacionEspecial: {
        activa: Boolean,
        tipoCobro: String,
        precioBase: Number,
        precioPorPieza: Number,
        observaciones: String
      },
      totales: {
        m2: Number,
        subtotal: Number,
        costoMotorizacion: Number,
        costoInstalacion: Number
      }
    }],
    totales: {
      m2: Number,
      subtotal: Number,
      descuento: Number,
      iva: Number,
      total: Number
    },
    observaciones: String,
    personaVisita: String,
    actualizadoEn: {
      type: Date,
      default: Date.now
    }
  },

  // Resumen de la última cotización generada desde proyectos
  cotizacionActual: {
    cotizacion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cotizacion'
    },
    numero: String,
    totales: {
      m2: Number,
      subtotal: Number,
      descuento: Number,
      iva: Number,
      total: Number
    },
    precioReglas: {
      precio_m2: Number,
      aplicaDescuento: Boolean,
      tipoDescuento: String,
      valorDescuento: Number
    },
    facturacion: {
      requiereFactura: Boolean,
      razonSocial: String,
      rfc: String
    },
    observaciones: String,
    personaVisita: String,
    fechaCreacion: {
      type: Date,
      default: Date.now
    }
  },

  // Medidas estructuradas (Levantamientos con partidas)
  medidas: [{
    // Información general del levantamiento
    tipo: String, // 'levantamiento'
    personaVisita: String,
    fechaCotizacion: Date,
    quienRecibe: String,
    observacionesGenerales: String,
    fechaHora: Date,
    esPartidasV2: {
      type: Boolean,
      default: false
    },

    // Partidas (piezas)
    piezas: [{
      ubicacion: String,
      cantidad: Number,
      producto: String,
      productoLabel: String,
      modeloCodigo: String,
      color: String,
      observaciones: String,
      areaTotal: Number,
      precioTotal: Number,
      totalPiezas: Number,
      motorizado: Boolean,
      motorModelo: String,
      motorPrecio: Number,
      controlModelo: String,
      controlPrecio: Number,

      // Medidas individuales por pieza
      medidas: [{
        ancho: Number,
        alto: Number,
        producto: String,
        productoLabel: String,
        modeloCodigo: String,
        color: String,
        
        // Especificaciones técnicas
        galeria: String, // 'galeria', 'cassette', 'cabezal', 'sin_galeria'
        tipoControl: String, // 'izquierda', 'derecha', 'centro', 'motorizado'
        caida: String, // 'normal', 'frente'
        tipoInstalacion: String, // 'techo', 'muro', 'piso_techo', 'empotrado'
        tipoFijacion: String, // 'concreto', 'tablaroca', 'aluminio', 'madera', 'otro'
        modoOperacion: String, // 'manual', 'motorizado'
        detalleTecnico: String, // 'traslape', 'corte', 'sin_traslape'
        sistema: String,
        telaMarca: String,
        baseTabla: String,
        observacionesTecnicas: String,
        traslape: String,
        precioM2: Number,
      }]
    }],

    // Totales del levantamiento
    totales: {
      totalPartidas: Number,
      totalPiezas: Number,
      areaTotal: Number,
      precioTotal: Number
    },
    // Información de toldos
    esToldo: Boolean,
    tipoToldo: String,
    kitModelo: String,
    kitPrecio: Number,
    // Información de motorización
    motorizado: Boolean,
    motorModelo: String,
    motorPrecio: Number,
    controlModelo: String,
    controlPrecio: Number,
    // Fotos por medida
    fotoUrls: [String]
  }],

  // Materiales y productos
  materiales: [{
    nombre: String,
    cantidad: Number,
    unidad: String,
    precio_unitario: Number,
    subtotal: Number
  }],

  productos: [{
    nombre: String,
    descripcion: String,
    cantidad: Number,
    precio_unitario: Number,
    subtotal: Number
  }],

  // Fotos generales del proyecto
  fotos: [String],

  // Responsables
  responsable: {
    type: String,
    trim: true
  },
  asesor_asignado: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  tecnico_asignado: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },

  // Información financiera
  monto_estimado: {
    type: Number,
    default: 0
  },
  subtotal: {
    type: Number,
    default: 0
  },
  iva: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    default: 0
  },
  anticipo: {
    type: Number,
    default: 0
  },
  saldo_pendiente: {
    type: Number,
    default: 0
  },

  // Referencias a otras colecciones
  prospecto_original: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prospecto'
  },
  cotizaciones: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cotizacion'
  }],
  pedidos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pedido'
  }],
  ordenes_fabricacion: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OrdenFabricacion'
  }],
  instalaciones: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Instalacion'
  }],

  // Metadatos
  creado_por: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  actualizado_por: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },

  // Configuraciones especiales
  requiere_factura: {
    type: Boolean,
    default: false
  },
  metodo_pago_anticipo: {
    type: String,
    enum: ['efectivo', 'transferencia', 'tarjeta_credito', 'tarjeta_debito', 'cheque', 'deposito', 'otro']
  },
  tiempo_entrega: {
    tipo: {
      type: String,
      enum: ['normal', 'expres'],
      default: 'normal'
    },
    dias_estimados: Number,
    fecha_estimada: Date
  },

  // Campos de auditoría
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para optimizar consultas
proyectoSchema.index({ 'cliente.telefono': 1 });
proyectoSchema.index({ estado: 1 });
proyectoSchema.index({ fecha_creacion: -1 });
proyectoSchema.index({ asesor_asignado: 1 });
proyectoSchema.index({ tipo_fuente: 1 });

// Middleware para actualizar fecha_actualizacion y generar número de proyecto
proyectoSchema.pre('save', async function(next) {
  this.fecha_actualizacion = new Date();
  
  // Generar número de proyecto si no existe
  if (this.isNew && !this.numero) {
    try {
      const year = new Date().getFullYear();
      
      // Buscar el último proyecto del año actual
      const lastProyecto = await this.constructor.findOne({
        numero: new RegExp(`^${year}-`)
      }).sort({ numero: -1 });
      
      let secuencial = 1;
      if (lastProyecto && lastProyecto.numero) {
        const match = lastProyecto.numero.match(/-(\d+)$/);
        if (match) {
          secuencial = parseInt(match[1]) + 1;
        }
      }
      
      // Limpiar nombre del cliente (solo primeras 2 palabras, sin caracteres especiales)
      let nombreCorto = this.cliente.nombre
        .split(' ')
        .slice(0, 2)
        .join(' ')
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
        .replace(/[^A-Z0-9\s]/g, '') // Solo letras y números
        .replace(/\s+/g, '-') // Espacios a guiones
        .substring(0, 15); // Máximo 15 caracteres
      
      // Formato: 2025-SAHID-CAMPOS-001
      this.numero = `${year}-${nombreCorto}-${String(secuencial).padStart(3, '0')}`;
      console.log('✅ Número de proyecto generado:', this.numero);
    } catch (error) {
      console.error('Error generando número de proyecto:', error);
      // Si falla, usar timestamp como fallback
      this.numero = `PROY-${Date.now()}`;
    }
  }
  
  next();
});

// Virtual para calcular el área total
proyectoSchema.virtual('area_total').get(function() {
  return this.medidas.reduce((total, medida) => {
    return total + ((medida.ancho || 0) * (medida.alto || 0) * (medida.cantidad || 1));
  }, 0);
});

// Virtual para obtener el nombre completo del cliente
proyectoSchema.virtual('cliente_nombre_completo').get(function() {
  return this.cliente.nombre;
});

// Virtual para calcular el progreso del proyecto
proyectoSchema.virtual('progreso_porcentaje').get(function() {
  const estados = ['levantamiento', 'cotizacion', 'aprobado', 'fabricacion', 'instalacion', 'completado'];
  const indiceActual = estados.indexOf(this.estado);
  return Math.round((indiceActual / (estados.length - 1)) * 100);
});

// Método para convertir a formato de exportación
proyectoSchema.methods.toExportData = function() {
  return {
    id: this._id,
    cliente: this.cliente,
    direccion: this.cliente.direccion,
    zona: this.cliente.zona,
    tipo_fuente: this.tipo_fuente,
    estado: this.estado,
    productos: this.productos,
    materiales: this.materiales,
    medidas: this.medidas,
    observaciones: this.observaciones,
    fotos: this.fotos,
    fecha: this.fecha_creacion,
    responsable: this.responsable,
    monto_estimado: this.monto_estimado,
    subtotal: this.subtotal,
    iva: this.iva,
    total: this.total,
    area_total: this.area_total,
    progreso: this.progreso_porcentaje
  };
};

// Plugin de paginación
proyectoSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Proyecto', proyectoSchema);

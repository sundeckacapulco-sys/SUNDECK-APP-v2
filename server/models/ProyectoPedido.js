const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const proyectoPedidoSchema = new mongoose.Schema({
  // ===== REFERENCIAS =====
  prospecto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prospecto',
    required: true
  },
  cotizacion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cotizacion',
    required: true
  },
  
  // ===== IDENTIFICACIÓN =====
  numero: {
    type: String,
    unique: true,
    required: true
  },
  
  // ===== INFORMACIÓN DEL CLIENTE (UNIFICADA) =====
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
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    direccion: {
      calle: String,
      colonia: String,
      ciudad: String,
      codigoPostal: String,
      referencias: String,
      linkMapa: String
    }
  },
  
  // ===== ESTADO UNIFICADO DEL PROYECTO =====
  estado: {
    type: String,
    enum: [
      'cotizado',           // Cotización aprobada, esperando confirmación
      'confirmado',         // Pedido confirmado (anticipo pagado)
      'en_fabricacion',     // En proceso de fabricación
      'fabricado',          // Listo para instalación
      'en_instalacion',     // Instalando
      'completado',         // Proyecto terminado
      'cancelado'           // Cancelado en cualquier etapa
    ],
    default: 'cotizado'
  },
  
  // ===== PRODUCTOS Y MEDIDAS (UNIFICADO) =====
  productos: [{
    // Información técnica
    nombre: {
      type: String,
      required: true
    },
    descripcion: String,
    categoria: String,
    material: String,
    color: String,
    cristal: String,
    herrajes: String,
    ubicacion: String,
    
    // Medidas y cálculos
    medidas: {
      ancho: {
        type: Number,
        required: true
      },
      alto: {
        type: Number,
        required: true
      },
      area: {
        type: Number,
        required: true
      }
    },
    cantidad: {
      type: Number,
      default: 1,
      min: 1
    },
    
    // Precios
    precioUnitario: {
      type: Number,
      required: true
    },
    subtotal: {
      type: Number,
      required: true
    },
    
    // Fabricación
    requiereR24: {
      type: Boolean,
      default: false
    },
    tiempoFabricacion: {
      type: Number,
      default: 15 // días
    },
    
    // Estado específico del producto
    estadoFabricacion: {
      type: String,
      enum: ['pendiente', 'en_proceso', 'terminado', 'instalado'],
      default: 'pendiente'
    },
    
    // Fechas específicas del producto
    fechaInicioFabricacion: Date,
    fechaFinFabricacion: Date,
    fechaInstalacion: Date
  }],
  
  // ===== CRONOGRAMA UNIFICADO =====
  cronograma: {
    fechaPedido: {
      type: Date,
      default: Date.now
    },
    fechaInicioFabricacion: Date,
    fechaFinFabricacionEstimada: Date,
    fechaFinFabricacionReal: Date,
    fechaInstalacionProgramada: Date,
    fechaInstalacionReal: Date,
    fechaEntrega: Date,
    fechaCompletado: Date
  },

  // ===== FABRICACIÓN DETALLADA =====
  fabricacion: {
    // Estado general de fabricación
    estado: {
      type: String,
      enum: ['pendiente', 'materiales_pedidos', 'en_proceso', 'control_calidad', 'terminado', 'empacado'],
      default: 'pendiente'
    },
    
    // Asignación y responsables
    asignadoA: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario'
    },
    prioridad: {
      type: String,
      enum: ['baja', 'media', 'alta', 'urgente'],
      default: 'media'
    },
    
    // Materiales necesarios
    materiales: [{
      nombre: String,
      cantidad: Number,
      unidad: String,
      disponible: { type: Boolean, default: false },
      fechaPedido: Date,
      fechaLlegada: Date,
      proveedor: String,
      costo: Number
    }],
    
    // Procesos de fabricación
    procesos: [{
      nombre: String,
      descripcion: String,
      orden: Number,
      tiempoEstimado: Number, // en horas
      tiempoReal: Number,
      fechaInicio: Date,
      fechaFin: Date,
      responsable: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario'
      },
      estado: {
        type: String,
        enum: ['pendiente', 'en_proceso', 'completado', 'pausado'],
        default: 'pendiente'
      },
      observaciones: String,
      evidenciasFotos: [String]
    }],
    
    // Control de calidad
    controlCalidad: {
      realizado: { type: Boolean, default: false },
      fechaRevision: Date,
      revisadoPor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario'
      },
      resultado: {
        type: String,
        enum: ['aprobado', 'rechazado', 'requiere_ajustes']
      },
      observaciones: String,
      evidenciasFotos: [String],
      defectosEncontrados: [{
        descripcion: String,
        gravedad: {
          type: String,
          enum: ['menor', 'mayor', 'critico']
        },
        corregido: { type: Boolean, default: false }
      }]
    },
    
    // Empaque y preparación para entrega
    empaque: {
      realizado: { type: Boolean, default: false },
      fechaEmpaque: Date,
      responsable: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario'
      },
      tipoEmpaque: String,
      observaciones: String,
      evidenciasFotos: [String]
    },
    
    // Costos de fabricación
    costos: {
      materiales: { type: Number, default: 0 },
      manoObra: { type: Number, default: 0 },
      overhead: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    },
    
    // Observaciones generales de fabricación
    observaciones: String,
    
    // Progreso general (calculado automáticamente)
    progreso: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },
  
  // ===== PAGOS Y MONTOS (UNIFICADO) =====
  pagos: {
    montoTotal: {
      type: Number,
      required: true
    },
    subtotal: Number,
    iva: Number,
    descuentos: Number,
    
    anticipo: {
      monto: Number,
      porcentaje: {
        type: Number,
        default: 60
      },
      fechaPago: Date,
      metodoPago: {
        type: String,
        enum: ['efectivo', 'transferencia', 'cheque', 'tarjeta', 'deposito']
      },
      referencia: String,
      comprobante: String, // URL del comprobante
      pagado: {
        type: Boolean,
        default: false
      }
    },
    
    saldo: {
      monto: Number,
      porcentaje: {
        type: Number,
        default: 40
      },
      fechaVencimiento: Date,
      fechaPago: Date,
      metodoPago: String,
      referencia: String,
      comprobante: String,
      pagado: {
        type: Boolean,
        default: false
      }
    }
  },
  
  // ===== RESPONSABLES POR ETAPA =====
  responsables: {
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
    coordinador: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario'
    }
  },
  
  // ===== ARCHIVOS ORGANIZADOS POR ETAPA =====
  archivos: [{
    tipo: {
      type: String,
      enum: ['contrato', 'comprobante_pago', 'plano', 'foto_levantamiento', 'foto_fabricacion', 'foto_instalacion', 'evidencia_entrega', 'otro']
    },
    etapa: {
      type: String,
      enum: ['cotizacion', 'confirmacion', 'fabricacion', 'instalacion', 'entrega']
    },
    nombre: String,
    url: String,
    descripcion: String,
    fechaSubida: {
      type: Date,
      default: Date.now
    },
    subidoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario'
    }
  }],
  
  // ===== HISTORIAL COMPLETO DE NOTAS =====
  notas: [{
    fecha: {
      type: Date,
      default: Date.now
    },
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true
    },
    contenido: {
      type: String,
      required: true
    },
    etapa: {
      type: String,
      enum: ['cotizacion', 'confirmacion', 'fabricacion', 'instalacion', 'entrega', 'general'],
      default: 'general'
    },
    tipo: {
      type: String,
      enum: ['info', 'alerta', 'problema', 'solucion', 'cambio'],
      default: 'info'
    },
    privada: {
      type: Boolean,
      default: false
    }
  }],
  
  // ===== INFORMACIÓN DE ENTREGA =====
  entrega: {
    direccion: {
      calle: String,
      colonia: String,
      ciudad: String,
      codigoPostal: String,
      referencias: String
    },
    contacto: {
      nombre: String,
      telefono: String,
      horarioPreferido: String
    },
    instrucciones: String,
    evidencias: [String] // URLs de fotos
  },
  
  // ===== INSTALACIÓN DETALLADA (Integrada del modelo existente) =====
  instalacion: {
    // Estado de instalación
    estado: {
      type: String,
      enum: ['pendiente', 'programada', 'en_proceso', 'pausada', 'completada', 'cancelada'],
      default: 'pendiente'
    },
    
    // Información básica
    numero: String, // Se genera automáticamente
    fechaProgramada: Date,
    fechaRealizada: Date,
    
    // Equipo de instalación (del modelo existente)
    instaladores: [{
      usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
      rol: {
        type: String,
        enum: ['jefe_cuadrilla', 'instalador', 'ayudante']
      },
      presente: { type: Boolean, default: true }
    }],
    
    // Información del sitio
    direccion: {
      calle: String,
      colonia: String,
      ciudad: String,
      codigoPostal: String,
      referencias: String
    },
    contactoSitio: {
      nombre: String,
      telefono: String,
      disponibilidad: String
    },
    
    // Checklist de instalación (del modelo existente)
    checklist: [{
      item: String,
      categoria: {
        type: String,
        enum: ['preparacion', 'medicion', 'instalacion', 'acabados', 'limpieza', 'entrega']
      },
      completado: { type: Boolean, default: false },
      fechaCompletado: Date,
      responsable: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
      notas: String,
      fotos: [String]
    }],
    
    // Productos instalados
    productosInstalacion: [{
      productoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto' },
      nombre: String,
      ubicacion: String, // sala, cocina, recámara, etc.
      estado: {
        type: String,
        enum: ['pendiente', 'en_proceso', 'instalado', 'con_problema'],
        default: 'pendiente'
      },
      fechaInicio: Date,
      fechaTermino: Date,
      problemas: [String],
      solucionProblemas: [String]
    }],
    
    // Mediciones finales
    medicionesFinales: [{
      producto: String,
      ubicacion: String,
      medidas: {
        ancho: Number,
        alto: Number,
        area: Number
      },
      diferenciasPlano: String,
      ajustesRealizados: String
    }],
    
    // Materiales y herramientas
    materialesUsados: [{
      nombre: String,
      cantidad: Number,
      unidad: String,
      sobrante: Number
    }],
    herramientasUsadas: [String],
    
    // Documentación fotográfica
    fotos: [{
      categoria: {
        type: String,
        enum: ['antes', 'proceso', 'terminado', 'problema', 'solucion']
      },
      descripcion: String,
      url: String,
      ubicacion: String,
      fecha: { type: Date, default: Date.now }
    }],
    
    // Control de tiempo
    tiempos: {
      inicioReal: Date,
      finReal: Date,
      tiempoEstimado: Number, // horas
      tiempoReal: Number, // horas
      pausas: [{
        motivo: String,
        inicio: Date,
        fin: Date,
        duracion: Number // minutos
      }]
    },
    
    // Problemas y soluciones (incidencias del modelo existente)
    incidencias: [{
      fecha: { type: Date, default: Date.now },
      tipo: {
        type: String,
        enum: ['medida_incorrecta', 'material_defectuoso', 'problema_sitio', 'herramienta', 'otro']
      },
      descripcion: String,
      solucion: String,
      responsable: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
      tiempoResolucion: Number, // minutos
      costoAdicional: Number
    }],
    
    // Entrega y conformidad
    entrega: {
      fecha: Date,
      recibidoPor: String,
      documentoIdentidad: String,
      conformidad: { type: Boolean, default: false },
      observaciones: String,
      firmaCliente: String, // URL de imagen de firma
      fotos: [String]
    },
    
    // Garantía
    garantia: {
      fechaInicio: Date,
      vigencia: Number, // meses
      cobertura: String,
      exclusiones: [String]
    },
    
    // Notas y observaciones
    notas: [{
      fecha: { type: Date, default: Date.now },
      usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
      contenido: String,
      tipo: {
        type: String,
        enum: ['general', 'problema', 'solucion', 'cliente', 'tecnica']
      }
    }],
    
    // Costos de instalación
    costos: {
      manoObra: { type: Number, default: 0 },
      materiales: { type: Number, default: 0 },
      transporte: { type: Number, default: 0 },
      extras: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    },
    
    // Progreso general (calculado automáticamente)
    progreso: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },
  
  // ===== INFORMACIÓN DE CANCELACIÓN =====
  cancelacion: {
    fecha: Date,
    motivo: String,
    responsable: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario'
    },
    reembolso: {
      monto: Number,
      fecha: Date,
      metodo: String,
      referencia: String,
      procesado: {
        type: Boolean,
        default: false
      }
    }
  },
  
  // ===== MÉTRICAS Y ESTADÍSTICAS =====
  metricas: {
    diasTotalProyecto: Number,
    diasFabricacion: Number,
    diasInstalacion: Number,
    rentabilidad: Number,
    satisfaccionCliente: Number,
    problemas: Number,
    cambios: Number
  },
  
  // ===== METADATOS =====
  creado_por: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  actualizado_por: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  }
}, {
  timestamps: true
});

// ===== MIDDLEWARE PRE-SAVE =====
proyectoPedidoSchema.pre('save', async function(next) {
  // Generar número de proyecto automáticamente
  if (this.isNew && !this.numero) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1)
      }
    });
    this.numero = `PROJ-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  
  // Calcular totales automáticamente
  if (this.productos && this.productos.length > 0) {
    const subtotal = this.productos.reduce((sum, producto) => sum + (producto.subtotal || 0), 0);
    this.pagos.subtotal = subtotal;
    this.pagos.iva = subtotal * 0.16;
    this.pagos.montoTotal = subtotal + this.pagos.iva - (this.pagos.descuentos || 0);
    
    // Calcular anticipo y saldo
    this.pagos.anticipo.monto = this.pagos.montoTotal * (this.pagos.anticipo.porcentaje / 100);
    this.pagos.saldo.monto = this.pagos.montoTotal * (this.pagos.saldo.porcentaje / 100);
  }
  
  // Actualizar fechas estimadas
  if (this.cronograma.fechaInicioFabricacion && !this.cronograma.fechaFinFabricacionEstimada) {
    const diasFabricacion = this.productos.reduce((max, producto) => 
      Math.max(max, producto.tiempoFabricacion || 15), 15);
    this.cronograma.fechaFinFabricacionEstimada = new Date(
      this.cronograma.fechaInicioFabricacion.getTime() + (diasFabricacion * 24 * 60 * 60 * 1000)
    );
  }
  
  next();
});

// ===== MÉTODOS DE INSTANCIA =====
proyectoPedidoSchema.methods.estaPagado = function() {
  return this.pagos.anticipo.pagado && this.pagos.saldo.pagado;
};

proyectoPedidoSchema.methods.calcularProgreso = function() {
  const estados = ['cotizado', 'confirmado', 'en_fabricacion', 'fabricado', 'en_instalacion', 'completado'];
  const indice = estados.indexOf(this.estado);
  return indice >= 0 ? Math.round((indice / (estados.length - 1)) * 100) : 0;
};

proyectoPedidoSchema.methods.diasRetraso = function() {
  const hoy = new Date();
  let fechaLimite;
  
  switch(this.estado) {
    case 'confirmado':
      fechaLimite = this.cronograma.fechaInicioFabricacion;
      break;
    case 'en_fabricacion':
      fechaLimite = this.cronograma.fechaFinFabricacionEstimada;
      break;
    case 'fabricado':
      fechaLimite = this.cronograma.fechaInstalacionProgramada;
      break;
    default:
      return 0;
  }
  
  if (!fechaLimite || hoy <= fechaLimite) return 0;
  return Math.ceil((hoy - fechaLimite) / (1000 * 60 * 60 * 24));
};

proyectoPedidoSchema.methods.agregarNota = function(contenido, usuario, etapa = 'general', tipo = 'info') {
  this.notas.push({
    contenido,
    usuario,
    etapa,
    tipo
  });
  return this.save();
};

proyectoPedidoSchema.methods.cambiarEstado = function(nuevoEstado, usuario, nota = null) {
  const estadoAnterior = this.estado;
  this.estado = nuevoEstado;
  this.actualizado_por = usuario;
  
  // Agregar nota automática del cambio de estado
  this.notas.push({
    contenido: `Estado cambiado de "${estadoAnterior}" a "${nuevoEstado}"${nota ? `. ${nota}` : ''}`,
    usuario,
    etapa: 'general',
    tipo: 'cambio'
  });
  
  // Actualizar fechas según el estado
  const ahora = new Date();
  switch(nuevoEstado) {
    case 'confirmado':
      if (!this.cronograma.fechaPedido) this.cronograma.fechaPedido = ahora;
      break;
    case 'en_fabricacion':
      if (!this.cronograma.fechaInicioFabricacion) this.cronograma.fechaInicioFabricacion = ahora;
      break;
    case 'fabricado':
      if (!this.cronograma.fechaFinFabricacionReal) this.cronograma.fechaFinFabricacionReal = ahora;
      break;
    case 'en_instalacion':
      if (!this.cronograma.fechaInstalacionReal) this.cronograma.fechaInstalacionReal = ahora;
      break;
    case 'completado':
      if (!this.cronograma.fechaCompletado) this.cronograma.fechaCompletado = ahora;
      if (!this.cronograma.fechaEntrega) this.cronograma.fechaEntrega = ahora;
      break;
  }
  
  return this.save();
};

// ===== ÍNDICES =====
proyectoPedidoSchema.index({ numero: 1 });
proyectoPedidoSchema.index({ prospecto: 1 });
proyectoPedidoSchema.index({ cotizacion: 1 });
proyectoPedidoSchema.index({ estado: 1 });
proyectoPedidoSchema.index({ 'cliente.nombre': 1 });
proyectoPedidoSchema.index({ 'cliente.telefono': 1 });
proyectoPedidoSchema.index({ 'responsables.vendedor': 1 });
proyectoPedidoSchema.index({ 'cronograma.fechaEntrega': 1 });
proyectoPedidoSchema.index({ createdAt: -1 });

// ===== PLUGIN DE PAGINACIÓN =====
proyectoPedidoSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('ProyectoPedido', proyectoPedidoSchema);

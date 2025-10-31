const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const logger = require('../config/logger');

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

  // ===== CRONOGRAMA UNIFICADO =====
  cronograma: {
    fechaPedido: Date,
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
    },
    
    // Etiquetas de producción para empaques
    etiquetas: [{
      numeroOrden: String,
      numeroPieza: String,
      cliente: {
        nombre: String,
        telefono: String,
        direccion: String
      },
      ubicacion: String,
      especificaciones: {
        producto: String,
        medidas: {
          ancho: Number,
          alto: Number,
          area: Number
        },
        color: String,
        tela: String,
        sistema: String,
        control: String,
        motorizado: Boolean
      },
      instalacion: {
        tipo: String,
        fijacion: String,
        observaciones: String
      },
      codigoQR: String,
      fechaFabricacion: Date,
      fechaInstalacionProgramada: Date
    }]
  },

  // ===== INSTALACIÓN COMPLETA =====
  instalacion: {
    numeroOrden: String,
    
    // Estado de instalación
    estado: {
      type: String,
      enum: ['programada', 'en_ruta', 'instalando', 'completada', 'cancelada', 'reprogramada'],
      default: 'programada'
    },
    
    // Programación con algoritmo inteligente
    programacion: {
      fechaProgramada: Date,
      horaInicio: String,
      horaFinEstimada: String,
      tiempoEstimado: Number, // minutos - calculado por algoritmo
      
      // Cuadrilla asignada
      cuadrilla: [{
        tecnico: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Usuario'
        },
        nombre: String,
        rol: {
          type: String,
          enum: ['lider', 'ayudante', 'especialista']
        },
        especialidad: String
      }]
    },
    
    // Productos a instalar con detalles técnicos completos
    productosInstalar: [{
      productoId: String,
      ubicacion: String,
      
      // Especificaciones técnicas
      especificaciones: {
        producto: String,
        medidas: {
          ancho: Number,
          alto: Number,
          area: Number
        },
        color: String,
        tela: String,
        sistema: String,
        control: String,
        motorizado: Boolean,
        
        // Detalles de instalación
        tipoInstalacion: String,
        tipoFijacion: String,
        galeria: String,
        baseTabla: String,
        caida: String,
        traslape: String
      },
      
      // Herramientas necesarias
      herramientasNecesarias: [String],
      
      // Materiales adicionales
      materialesAdicionales: [{
        nombre: String,
        cantidad: Number,
        costo: Number
      }],
      
      // Observaciones técnicas
      observacionesTecnicas: String,
      
      // Estado
      instalado: { type: Boolean, default: false },
      fechaInstalacion: Date
    }],
    
    // Checklist de instalación
    checklist: [{
      item: String,
      completado: { type: Boolean, default: false },
      observaciones: String,
      foto: String
    }],
    
    // Ruta optimizada y logística
    ruta: {
      ordenEnRuta: Number, // Posición en la ruta del día
      ubicacionAnterior: {
        nombre: String,
        direccion: String,
        coordenadas: {
          lat: Number,
          lng: Number
        }
      },
      ubicacionActual: {
        nombre: String,
        direccion: String,
        coordenadas: {
          lat: Number,
          lng: Number
        }
      },
      ubicacionSiguiente: {
        nombre: String,
        direccion: String,
        coordenadas: {
          lat: Number,
          lng: Number
        }
      },
      distanciaKm: Number,
      tiempoTrasladoMinutos: Number
    },
    
    // Ejecución real
    ejecucion: {
      fechaInicioReal: Date,
      fechaFinReal: Date,
      horasReales: Number,
      
      // Materiales adicionales usados
      materialesAdicionalesUsados: [{
        material: String,
        cantidad: Number,
        motivo: String,
        costo: Number
      }],
      
      // Incidencias durante instalación
      incidencias: [{
        fecha: Date,
        tipo: String,
        descripcion: String,
        resolucion: String,
        resuelta: { type: Boolean, default: false },
        fotos: [String]
      }]
    },
    
    // Evidencias
    evidencias: {
      fotosAntes: [String],
      fotosDurante: [String],
      fotosDespues: [String],
      firmaCliente: String,
      nombreQuienRecibe: String,
      comentariosCliente: String
    },
    
    // Garantía
    garantia: {
      vigente: { type: Boolean, default: true },
      fechaInicio: Date,
      fechaFin: Date,
      terminos: String
    },
    
    // Costos de instalación
    costos: {
      manoObra: { type: Number, default: 0 },
      materiales: { type: Number, default: 0 },
      transporte: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    }
  },

  // ===== PAGOS ESTRUCTURADOS =====
  pagos: {
    montoTotal: Number,
    subtotal: Number,
    iva: Number,
    descuentos: Number,
    
    anticipo: {
      monto: Number,
      porcentaje: { type: Number, default: 60 },
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
      porcentaje: { type: Number, default: 40 },
      fechaVencimiento: Date,
      fechaPago: Date,
      metodoPago: String,
      referencia: String,
      comprobante: String,
      pagado: { type: Boolean, default: false }
    },
    
    pagosAdicionales: [{
      concepto: String,
      monto: Number,
      fecha: Date,
      metodoPago: String,
      referencia: String,
      comprobante: String
    }]
  },

  // ===== HISTORIAL DE NOTAS =====
  notas: [{
    fecha: { type: Date, default: Date.now },
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario'
    },
    tipo: {
      type: String,
      enum: ['general', 'fabricacion', 'instalacion', 'pago', 'cliente', 'problema']
    },
    contenido: String,
    importante: { type: Boolean, default: false },
    archivosAdjuntos: [String]
  }],

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
      logger.info('Número de proyecto generado automáticamente', {
        modelo: 'Proyecto',
        metodo: 'preSaveGenerateNumber',
        proyectoId: this._id,
        numeroGenerado: this.numero,
        cliente: this.cliente?.nombre,
        year,
        secuencial
      });
    } catch (error) {
      logger.error('Error generando número de proyecto automático', {
        modelo: 'Proyecto',
        metodo: 'preSaveGenerateNumber',
        proyectoId: this._id,
        cliente: this.cliente?.nombre,
        error: error.message,
        stack: error.stack
      });
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

// ===== MÉTODOS INTELIGENTES DE PRODUCCIÓN E INSTALACIÓN =====

// Generar etiquetas de producción para empaques
proyectoSchema.methods.generarEtiquetasProduccion = function() {
  const QRCode = require('qrcode');
  const etiquetas = [];
  
  // Generar etiqueta por cada producto
  if (this.productos && this.productos.length > 0) {
    this.productos.forEach((producto, index) => {
      const etiqueta = {
        numeroOrden: this.numero,
        numeroPieza: `${index + 1}/${this.productos.length}`,
        cliente: {
          nombre: this.cliente.nombre,
          telefono: this.cliente.telefono,
          direccion: this.cliente.direccion || ''
        },
        ubicacion: producto.ubicacion || producto.nombre,
        especificaciones: {
          producto: producto.nombre,
          medidas: {
            ancho: producto.ancho || producto.medidas?.ancho || 0,
            alto: producto.alto || producto.medidas?.alto || 0,
            area: producto.area || producto.medidas?.area || 0
          },
          color: producto.color || '',
          tela: producto.telaMarca || producto.tela || '',
          sistema: producto.sistema || '',
          control: producto.tipoControl || producto.control || '',
          motorizado: producto.motorizado || false
        },
        instalacion: {
          tipo: producto.tipoInstalacion || '',
          fijacion: producto.tipoFijacion || '',
          observaciones: producto.observacionesTecnicas || producto.observaciones || ''
        },
        fechaFabricacion: this.cronograma?.fechaFinFabricacionReal || new Date(),
        fechaInstalacionProgramada: this.cronograma?.fechaInstalacionProgramada || null
      };
      
      // Generar código QR con información del producto
      const qrData = JSON.stringify({
        proyecto: this.numero,
        producto: index + 1,
        cliente: this.cliente.telefono
      });
      
      // El QR se generará de forma asíncrona en el endpoint
      etiqueta.codigoQR = qrData;
      
      etiquetas.push(etiqueta);
    });
  }
  
  return etiquetas;
};

// Calcular tiempo estimado de instalación (algoritmo inteligente)
proyectoSchema.methods.calcularTiempoInstalacion = function() {
  let tiempoTotal = 0;
  const factores = {
    complejidad: 1.0,
    acceso: 1.0,
    motorizado: 1.0,
    altura: 1.0
  };
  
  // 1. Tiempo base por producto
  if (this.productos && this.productos.length > 0) {
    this.productos.forEach(producto => {
      let tiempoBase = 30; // minutos base
      
      // Por tipo de sistema
      const sistema = producto.sistema || '';
      if (sistema.toLowerCase().includes('roller')) tiempoBase = 30;
      else if (sistema.toLowerCase().includes('romana')) tiempoBase = 45;
      else if (sistema.toLowerCase().includes('panel')) tiempoBase = 60;
      else if (sistema.toLowerCase().includes('vertical')) tiempoBase = 40;
      else if (sistema.toLowerCase().includes('zebra')) tiempoBase = 35;
      
      // Por tamaño
      const ancho = producto.ancho || producto.medidas?.ancho || 0;
      const alto = producto.alto || producto.medidas?.alto || 0;
      const area = ancho * alto;
      
      if (area > 6) tiempoBase *= 1.3; // +30% para áreas grandes
      if (area > 10) tiempoBase *= 1.5; // +50% para áreas muy grandes
      
      // Por motorización
      if (producto.motorizado) {
        tiempoBase += 20; // +20 min por motorización
        factores.motorizado = 1.2;
      }
      
      // Por tipo de instalación
      const tipoInstalacion = producto.tipoInstalacion || '';
      if (tipoInstalacion.toLowerCase().includes('techo')) tiempoBase *= 1.2;
      if (tipoInstalacion.toLowerCase().includes('empotrado')) tiempoBase *= 1.4;
      if (tipoInstalacion.toLowerCase().includes('piso')) tiempoBase *= 1.3;
      
      // Por tipo de fijación
      const tipoFijacion = producto.tipoFijacion || '';
      if (tipoFijacion.toLowerCase().includes('concreto')) tiempoBase *= 1.2;
      if (tipoFijacion.toLowerCase().includes('tablaroca')) tiempoBase *= 1.1;
      
      // Por altura
      if (alto > 2.5) {
        tiempoBase *= 1.3; // +30% por altura
        factores.altura = 1.3;
      }
      
      tiempoTotal += tiempoBase;
    });
  }
  
  // 2. Factores de complejidad del sitio
  if (this.cliente.direccion) {
    // Accesibilidad (si hay información)
    if (this.cliente.direccion.pisoAlto && !this.cliente.direccion.tieneElevador) {
      tiempoTotal *= 1.2; // +20% por escaleras
      factores.acceso = 1.2;
    }
    
    // Zona de difícil acceso
    if (this.cliente.direccion.zonaRemota) {
      tiempoTotal *= 1.1;
    }
  }
  
  // 3. Tiempo de preparación y limpieza
  const tiempoPreparacion = 15; // minutos
  const tiempoLimpieza = 10; // minutos
  
  // 4. Buffer de seguridad (10%)
  const buffer = tiempoTotal * 0.1;
  
  // Total
  const tiempoFinal = Math.ceil(
    tiempoPreparacion + 
    tiempoTotal + 
    tiempoLimpieza + 
    buffer
  );
  
  return {
    tiempoEstimadoMinutos: tiempoFinal,
    tiempoEstimadoHoras: (tiempoFinal / 60).toFixed(1),
    desglose: {
      preparacion: tiempoPreparacion,
      instalacion: Math.ceil(tiempoTotal),
      limpieza: tiempoLimpieza,
      buffer: Math.ceil(buffer)
    },
    factores: factores,
    recomendaciones: this.generarRecomendacionesInstalacion(factores)
  };
};

// Generar recomendaciones de instalación
proyectoSchema.methods.generarRecomendacionesInstalacion = function(factores) {
  const recomendaciones = [];
  
  if (factores.motorizado > 1) {
    recomendaciones.push('Incluir técnico especializado en motorizaciones');
  }
  
  if (factores.altura > 1) {
    recomendaciones.push('Llevar escalera de 3 metros o andamio');
    recomendaciones.push('Considerar medidas de seguridad adicionales');
  }
  
  if (factores.acceso > 1) {
    recomendaciones.push('Planificar tiempo extra para traslado de materiales');
  }
  
  if (factores.complejidad > 1.3) {
    recomendaciones.push('Asignar cuadrilla de 2 técnicos mínimo');
  }
  
  return recomendaciones;
};

// Método estático para optimizar ruta diaria de instalaciones
proyectoSchema.statics.optimizarRutaDiaria = async function(fecha) {
  const logger = require('../config/logger');
  
  try {
    // 1. Obtener instalaciones programadas para la fecha
    const instalaciones = await this.find({
      'instalacion.programacion.fechaProgramada': {
        $gte: new Date(fecha.setHours(0, 0, 0, 0)),
        $lt: new Date(fecha.setHours(23, 59, 59, 999))
      },
      'instalacion.estado': { $in: ['programada', 'reprogramada'] }
    });
    
    if (instalaciones.length === 0) {
      return {
        fecha: fecha,
        ruta: [],
        resumen: {
          totalInstalaciones: 0,
          mensaje: 'No hay instalaciones programadas para esta fecha'
        }
      };
    }
    
    // 2. Punto de inicio (oficina/bodega)
    const puntoInicio = {
      nombre: "Oficina Sundeck",
      coordenadas: { lat: 32.5149, lng: -117.0382 }
    };
    
    // 3. Calcular distancias usando fórmula de Haversine
    const calcularDistancia = (coord1, coord2) => {
      const R = 6371; // Radio de la Tierra en km
      const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
      const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
      
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(coord1.lat * Math.PI / 180) * 
        Math.cos(coord2.lat * Math.PI / 180) *
        Math.sin(dLng/2) * Math.sin(dLng/2);
      
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return Math.round(R * c * 10) / 10;
    };
    
    // 4. Algoritmo Nearest Neighbor (vecino más cercano)
    const rutaOptimizada = [];
    const visitados = new Set();
    let ubicacionActual = puntoInicio.coordenadas;
    
    while (rutaOptimizada.length < instalaciones.length) {
      let distanciaMinima = Infinity;
      let siguienteInstalacion = null;
      let siguienteIndex = null;
      
      instalaciones.forEach((instalacion, index) => {
        if (!visitados.has(index)) {
          const coordenadas = instalacion.cliente?.direccion?.coordenadas || 
                            instalacion.instalacion?.ruta?.ubicacionActual?.coordenadas;
          
          if (coordenadas && coordenadas.lat && coordenadas.lng) {
            const distancia = calcularDistancia(ubicacionActual, coordenadas);
            if (distancia < distanciaMinima) {
              distanciaMinima = distancia;
              siguienteInstalacion = instalacion;
              siguienteIndex = index;
            }
          }
        }
      });
      
      if (siguienteInstalacion) {
        rutaOptimizada.push(siguienteInstalacion);
        visitados.add(siguienteIndex);
        ubicacionActual = siguienteInstalacion.cliente?.direccion?.coordenadas ||
                         siguienteInstalacion.instalacion?.ruta?.ubicacionActual?.coordenadas;
      } else {
        break; // No hay más instalaciones con coordenadas
      }
    }
    
    // 5. Calcular horarios
    let horaActual = new Date(fecha);
    horaActual.setHours(8, 0, 0); // Inicio a las 8:00 AM
    
    const horarios = rutaOptimizada.map((instalacion, index) => {
      const coordenadas = instalacion.cliente?.direccion?.coordenadas ||
                         instalacion.instalacion?.ruta?.ubicacionActual?.coordenadas;
      
      const coordenadasAnterior = index === 0 
        ? puntoInicio.coordenadas
        : (rutaOptimizada[index-1].cliente?.direccion?.coordenadas ||
           rutaOptimizada[index-1].instalacion?.ruta?.ubicacionActual?.coordenadas);
      
      // Tiempo de traslado
      const distanciaKm = calcularDistancia(coordenadasAnterior, coordenadas);
      const tiempoTraslado = Math.ceil(distanciaKm / 0.5); // ~30 km/h promedio en ciudad
      
      // Hora de llegada
      const horaLlegada = new Date(horaActual.getTime() + tiempoTraslado * 60000);
      
      // Tiempo de instalación
      const tiempoInstalacion = instalacion.instalacion?.programacion?.tiempoEstimado || 
                               instalacion.calcularTiempoInstalacion().tiempoEstimadoMinutos;
      
      // Hora de salida
      const horaSalida = new Date(horaLlegada.getTime() + tiempoInstalacion * 60000);
      
      // Actualizar hora actual
      horaActual = horaSalida;
      
      return {
        ordenEnRuta: index + 1,
        proyectoId: instalacion._id,
        numero: instalacion.numero,
        cliente: instalacion.cliente.nombre,
        direccion: instalacion.cliente.direccion?.calle || '',
        telefono: instalacion.cliente.telefono,
        
        horaLlegadaEstimada: horaLlegada,
        horaSalidaEstimada: horaSalida,
        tiempoInstalacionMinutos: tiempoInstalacion,
        tiempoTrasladoMinutos: tiempoTraslado,
        distanciaKm: distanciaKm,
        
        ubicacionAnterior: index === 0 
          ? puntoInicio.nombre
          : rutaOptimizada[index-1].cliente.nombre,
        ubicacionSiguiente: index < rutaOptimizada.length - 1
          ? rutaOptimizada[index+1].cliente.nombre
          : "Fin de ruta"
      };
    });
    
    // 6. Resumen
    const resumen = {
      totalInstalaciones: horarios.length,
      horaInicio: horarios[0]?.horaLlegadaEstimada,
      horaFin: horarios[horarios.length - 1]?.horaSalidaEstimada,
      tiempoTotalMinutos: horarios.reduce((sum, h) => 
        sum + h.tiempoInstalacionMinutos + h.tiempoTrasladoMinutos, 0
      ),
      distanciaTotalKm: horarios.reduce((sum, h) => sum + h.distanciaKm, 0)
    };
    
    logger.info('Ruta diaria optimizada', {
      modelo: 'Proyecto',
      metodo: 'optimizarRutaDiaria',
      fecha: fecha,
      totalInstalaciones: resumen.totalInstalaciones,
      distanciaTotal: resumen.distanciaTotalKm
    });
    
    return {
      fecha: fecha,
      ruta: horarios,
      resumen: resumen
    };
    
  } catch (error) {
    logger.error('Error optimizando ruta diaria', {
      modelo: 'Proyecto',
      metodo: 'optimizarRutaDiaria',
      fecha: fecha,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

// Plugin de paginación
proyectoSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Proyecto', proyectoSchema);

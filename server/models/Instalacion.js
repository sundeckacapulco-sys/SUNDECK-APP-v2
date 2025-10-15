const mongoose = require('mongoose');
const ValidacionTecnicaService = require('../services/validacionTecnicaService');

const instalacionSchema = new mongoose.Schema({
  // Referencia al pedido y fabricación
  pedido: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pedido',
    required: true
  },
  fabricacion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Fabricacion',
    required: true
  },
  
  // Información básica
  numero: {
    type: String,
    unique: true,
    required: true
  },
  fechaProgramada: {
    type: Date,
    required: true
  },
  fechaRealizada: Date,
  
  // Estado de instalación
  estado: {
    type: String,
    enum: ['programada', 'en_proceso', 'pausada', 'completada', 'cancelada'],
    default: 'programada'
  },
  
  // Equipo de instalación
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
  
  // Checklist de instalación
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
  productos: [{
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
  
  // Problemas y soluciones
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
    manoObra: Number,
    materiales: Number,
    transporte: Number,
    extras: Number,
    total: Number
  }
}, {
  timestamps: true
});

// Generar número de instalación automáticamente
instalacionSchema.pre('save', async function(next) {
  if (this.isNew && !this.numero) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1)
      }
    });
    this.numero = `INS-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Método para calcular progreso del checklist
instalacionSchema.methods.calcularProgreso = function() {
  const totalItems = this.checklist.length;
  if (totalItems === 0) return 0;
  
  const itemsCompletados = this.checklist.filter(item => item.completado).length;
  return Math.round((itemsCompletados / totalItems) * 100);
};

// Método para verificar si está lista para entrega
instalacionSchema.methods.listaParaEntrega = function() {
  const checklistCompleto = this.checklist.every(item => item.completado);
  const productosInstalados = this.productos.every(prod => prod.estado === 'instalado');
  return checklistCompleto && productosInstalados;
};

// Método para generar orden de instalación con información técnica completa
instalacionSchema.methods.generarOrdenInstalacion = function() {
  try {
    // Extraer productos con información técnica
    const productosConInfo = this.productos.map(producto => ({
      ...producto.toObject(),
      // Asegurar que tenga la información técnica necesaria
      medidas: producto.medidas || [],
      especificacionesTecnicas: producto.especificacionesTecnicas || {}
    }));
    
    // Generar orden usando el servicio de validación
    const ordenCompleta = ValidacionTecnicaService.generarOrdenInstalacion(productosConInfo, {
      cliente: {
        nombre: this.cliente?.nombre || '',
        telefono: this.cliente?.telefono || '',
        direccion: this.direccion || {}
      },
      instalacion: {
        numero: this.numero,
        fechaProgramada: this.fechaProgramada,
        instaladores: this.instaladores
      }
    });
    
    return ordenCompleta;
  } catch (error) {
    console.error('Error generando orden de instalación:', error);
    throw new Error(`No se puede generar la orden de instalación: ${error.message}`);
  }
};

// Método para calcular tiempo total de instalación
instalacionSchema.methods.calcularTiempoTotal = function() {
  if (!this.tiempos.inicioReal || !this.tiempos.finReal) return 0;
  
  const tiempoTotal = (this.tiempos.finReal - this.tiempos.inicioReal) / (1000 * 60 * 60); // horas
  const tiempoPausas = this.tiempos.pausas.reduce((total, pausa) => total + (pausa.duracion || 0), 0) / 60; // convertir a horas
  
  return Math.round((tiempoTotal - tiempoPausas) * 100) / 100;
};

// Índices
instalacionSchema.index({ numero: 1 });
instalacionSchema.index({ pedido: 1 });
instalacionSchema.index({ fabricacion: 1 });
instalacionSchema.index({ estado: 1 });
instalacionSchema.index({ fechaProgramada: 1 });

module.exports = mongoose.model('Instalacion', instalacionSchema);

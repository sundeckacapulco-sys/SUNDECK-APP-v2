const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const usuarioSchema = new mongoose.Schema({
  // Información personal
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  apellido: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  telefono: {
    type: String,
    trim: true
  },
  
  // Autenticación
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  
  // Rol y permisos
  rol: {
    type: String,
    enum: ['admin', 'gerente', 'vendedor', 'fabricante', 'instalador', 'coordinador'],
    required: true
  },
  permisos: [{
    modulo: {
      type: String,
      enum: ['prospectos', 'cotizaciones', 'pedidos', 'fabricacion', 'instalaciones', 'postventa', 'reportes', 'usuarios', 'configuracion']
    },
    acciones: [{
      type: String,
      enum: ['crear', 'leer', 'actualizar', 'eliminar', 'exportar']
    }]
  }],
  
  // Estado del usuario
  activo: {
    type: Boolean,
    default: true
  },
  fechaUltimoAcceso: Date,
  
  // Configuración personal
  configuracion: {
    notificaciones: {
      email: { type: Boolean, default: true },
      whatsapp: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    },
    horarioTrabajo: {
      inicio: { type: String, default: '09:00' },
      fin: { type: String, default: '18:00' },
      diasSemana: [{ type: Number, min: 0, max: 6 }] // 0=domingo, 6=sábado
    },
    recordatorios: {
      anticipacion: { type: Number, default: 60 }, // minutos
      frecuencia: { type: Number, default: 24 } // horas
    }
  },
  
  // Información de contacto adicional
  whatsapp: String,
  extension: String,
  
  // Métricas de desempeño
  metricas: {
    prospectosAsignados: { type: Number, default: 0 },
    cotizacionesRealizadas: { type: Number, default: 0 },
    ventasCerradas: { type: Number, default: 0 },
    montoVentas: { type: Number, default: 0 },
    tasaConversion: { type: Number, default: 0 },
    tiempoPromedioRespuesta: { type: Number, default: 0 } // minutos
  },
  
  // Información adicional
  fechaIngreso: {
    type: Date,
    default: Date.now
  },
  supervisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  
  // Tokens para reset de password
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  
  // Avatar/foto de perfil
  avatar: String
}, {
  timestamps: true
});

// Hash password antes de guardar
usuarioSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar passwords
usuarioSchema.methods.compararPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// Método para obtener nombre completo
usuarioSchema.methods.nombreCompleto = function() {
  return `${this.nombre} ${this.apellido}`;
};

// Método para verificar permisos
usuarioSchema.methods.tienePermiso = function(modulo, accion) {
  if (this.rol === 'admin') return true;
  
  const permisoModulo = this.permisos.find(p => p.modulo === modulo);
  if (!permisoModulo) return false;
  
  return permisoModulo.acciones.includes(accion);
};

// Método para verificar si está en horario de trabajo
usuarioSchema.methods.enHorarioTrabajo = function() {
  const ahora = new Date();
  const dia = ahora.getDay();
  const hora = ahora.getHours() * 100 + ahora.getMinutes();
  
  if (!this.configuracion.horarioTrabajo.diasSemana.includes(dia)) {
    return false;
  }
  
  const inicio = parseInt(this.configuracion.horarioTrabajo.inicio.replace(':', ''));
  const fin = parseInt(this.configuracion.horarioTrabajo.fin.replace(':', ''));
  
  return hora >= inicio && hora <= fin;
};

// Índices
usuarioSchema.index({ email: 1 });
usuarioSchema.index({ rol: 1 });
usuarioSchema.index({ activo: 1 });

module.exports = mongoose.model('Usuario', usuarioSchema);

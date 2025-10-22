const mongoose = require('mongoose');

const piezaSchema = new mongoose.Schema({
  ubicacion: { type: String, trim: true },
  cantidad: { type: Number, default: 1 },
  ancho: { type: Number },
  alto: { type: Number },
  producto: { type: String, trim: true },
  productoLabel: { type: String, trim: true },
  color: { type: String, trim: true },
  precioM2: { type: Number },
  observaciones: { type: String, trim: true },
  fotoUrls: { type: [String], default: [] },
  videoUrl: { type: String, trim: true },
  // Mantener fotoUrl para compatibilidad hacia atrás
  fotoUrl: { type: String },
  // Campos para levantamiento técnico
  medidas: { type: [mongoose.Schema.Types.Mixed], default: [] },
  // CAMPOS TÉCNICOS CRÍTICOS PARA FABRICACIÓN
  sistema: { type: [String], default: [] },
  sistemaEspecial: { type: [String], default: [] },
  tipoControl: { type: String, trim: true },
  galeria: { type: String, trim: true },
  baseTabla: { type: String, trim: true },
  orientacion: { type: String, trim: true },
  tipoInstalacion: { type: String, trim: true },
  eliminacion: { type: String, trim: true },
  risoAlto: { type: String, trim: true },
  risoBajo: { type: String, trim: true },
  telaMarca: { type: String, trim: true },
  // CAMPOS DE TOLDOS Y MOTORIZACIÓN
  esToldo: { type: Boolean, default: false },
  tipoToldo: { type: String, trim: true },
  kitModelo: { type: String, trim: true },
  kitModeloManual: { type: String, trim: true },
  kitPrecio: { type: Number, default: 0 },
  motorizado: { type: Boolean, default: false },
  motorModelo: { type: String, trim: true },
  motorModeloManual: { type: String, trim: true },
  motorPrecio: { type: Number, default: 0 },
  controlModelo: { type: String, trim: true },
  controlModeloManual: { type: String, trim: true },
  controlPrecio: { type: Number, default: 0 }
}, { _id: false });

const etapaSchema = new mongoose.Schema({
  prospectoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prospecto',
    required: true,
    index: true
  },
  nombreEtapa: {
    type: String,
    required: true,
    trim: true
  },
  fecha: { type: Date },
  hora: { type: String, trim: true },
  unidadMedida: {
    type: String,
    enum: ['m', 'cm'],
    default: 'm'
  },
  piezas: {
    type: [piezaSchema],
    default: []
  },
  comentarios: { type: String, trim: true },
  precioGeneral: { type: Number },
  totalM2: { type: Number },
  creadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  creadoEn: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Etapa', etapaSchema);

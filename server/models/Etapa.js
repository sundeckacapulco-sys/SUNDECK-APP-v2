const mongoose = require('mongoose');

const piezaSchema = new mongoose.Schema({
  ubicacion: { type: String, trim: true },
  ancho: { type: Number },
  alto: { type: Number },
  producto: { type: String, trim: true },
  color: { type: String, trim: true },
  control: {
    type: String,
    enum: ['manual', 'motorizado'],
    default: 'manual'
  },
  observaciones: { type: String, trim: true },
  fotoUrl: { type: String }
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

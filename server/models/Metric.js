const mongoose = require('mongoose');

const metricSchema = new mongoose.Schema(
  {
    tipo: {
      type: String,
      required: true,
      enum: ['performance', 'error', 'uso', 'negocio'],
      index: true
    },
    valor: {
      type: Number,
      required: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({})
    },
    endpoint: {
      type: String,
      index: true
    },
    metodo: String,
    statusCode: Number,
    duracion: Number,
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

metricSchema.index({ tipo: 1, timestamp: -1 });
metricSchema.index({ endpoint: 1, timestamp: -1 });

metricSchema.statics.registrar = async function(tipo, valor, metadata = {}) {
  return this.create({
    tipo,
    valor,
    metadata,
    endpoint: metadata.endpoint,
    metodo: metadata.metodo,
    statusCode: metadata.statusCode,
    duracion: metadata.duracion
  });
};

metricSchema.statics.obtenerPorPeriodo = async function(fechaInicio, fechaFin) {
  return this.find({
    timestamp: {
      $gte: fechaInicio,
      $lte: fechaFin
    }
  }).sort({ timestamp: -1 });
};

metricSchema.statics.agregarPorTipo = async function(tipo, periodo = 'dia') {
  const isHourly = periodo === 'hora';
  const groupId = isHourly
    ? {
        year: { $year: '$timestamp' },
        month: { $month: '$timestamp' },
        day: { $dayOfMonth: '$timestamp' },
        hour: { $hour: '$timestamp' }
      }
    : {
        year: { $year: '$timestamp' },
        month: { $month: '$timestamp' },
        day: { $dayOfMonth: '$timestamp' }
      };

  const sortStage = isHourly
    ? { '_id.year': -1, '_id.month': -1, '_id.day': -1, '_id.hour': -1 }
    : { '_id.year': -1, '_id.month': -1, '_id.day': -1 };

  return this.aggregate([
    { $match: { tipo } },
    {
      $group: {
        _id: groupId,
        promedio: { $avg: '$valor' },
        minimo: { $min: '$valor' },
        maximo: { $max: '$valor' },
        total: { $sum: 1 },
        ultimoRegistro: { $max: '$timestamp' }
      }
    },
    { $sort: sortStage }
  ]);
};

metricSchema.statics.obtenerEstadisticas = async function() {
  return this.aggregate([
    {
      $group: {
        _id: '$tipo',
        promedio: { $avg: '$valor' },
        minimo: { $min: '$valor' },
        maximo: { $max: '$valor' },
        total: { $sum: 1 }
      }
    },
    { $sort: { total: -1 } }
  ]);
};

module.exports = mongoose.model('Metric', metricSchema);

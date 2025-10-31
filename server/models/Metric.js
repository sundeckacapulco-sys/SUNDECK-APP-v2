const mongoose = require('mongoose');

const isTestEnv = process.env.NODE_ENV === 'test';

if (isTestEnv) {
  let metricsStore = [];

  mongoose.connect = async () => mongoose;
  if (!mongoose.connection.close) {
    mongoose.connection.close = async () => {};
  }

  const cloneMetric = (metric) => ({
    ...metric,
    timestamp: metric.timestamp instanceof Date ? metric.timestamp : new Date(metric.timestamp),
    createdAt: metric.createdAt ? new Date(metric.createdAt) : new Date(),
    updatedAt: metric.updatedAt ? new Date(metric.updatedAt) : new Date()
  });

  class MetricInMemory {
    static async deleteMany(filter = {}) {
      if (!filter || Object.keys(filter).length === 0) {
        const deletedCount = metricsStore.length;
        metricsStore = [];
        return { acknowledged: true, deletedCount };
      }

      const initialLength = metricsStore.length;
      metricsStore = metricsStore.filter((metric) => {
        return Object.entries(filter).some(([key, value]) => {
          if (value && typeof value === 'object' && ('$gte' in value || '$lte' in value)) {
            const metricValue = metric[key];
            if ('$gte' in value && metricValue < value.$gte) {
              return true;
            }
            if ('$lte' in value && metricValue > value.$lte) {
              return true;
            }
            return false;
          }
          return metric[key] !== value;
        });
      });

      return { acknowledged: true, deletedCount: initialLength - metricsStore.length };
    }

    static async create(docs) {
      const documents = Array.isArray(docs) ? docs : [docs];
      const created = documents.map((doc) => {
        const metric = {
          _id: doc._id || new mongoose.Types.ObjectId().toString(),
          tipo: doc.tipo,
          valor: doc.valor,
          metadata: doc.metadata || {},
          endpoint: doc.endpoint || doc.metadata?.endpoint,
          metodo: doc.metodo || doc.metadata?.metodo,
          statusCode: doc.statusCode || doc.metadata?.statusCode,
          duracion: doc.duracion || doc.metadata?.duracion,
          timestamp: doc.timestamp ? new Date(doc.timestamp) : new Date(),
          createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
          updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date()
        };
        metricsStore.push(metric);
        return cloneMetric(metric);
      });

      return Array.isArray(docs) ? created : created[0];
    }

    static async registrar(tipo, valor, metadata = {}) {
      return this.create({ tipo, valor, metadata });
    }

    static async find(filter = {}) {
      const results = metricsStore.filter((metric) => {
        return Object.entries(filter).every(([key, value]) => {
          if (value && typeof value === 'object' && ('$gte' in value || '$lte' in value)) {
            if ('$gte' in value && metric[key] < value.$gte) {
              return false;
            }
            if ('$lte' in value && metric[key] > value.$lte) {
              return false;
            }
            return true;
          }
          return metric[key] === value;
        });
      });

      return {
        sort: ({ timestamp }) => {
          const sorted = [...results].sort((a, b) => (timestamp || {}).timestamp === -1 ? b.timestamp - a.timestamp : a.timestamp - b.timestamp);
          return sorted.map(cloneMetric);
        }
      };
    }

    static async obtenerPorPeriodo(fechaInicio, fechaFin) {
      return metricsStore
        .filter((metric) => metric.timestamp >= fechaInicio && metric.timestamp <= fechaFin)
        .sort((a, b) => b.timestamp - a.timestamp)
        .map(cloneMetric);
    }

    static async agregarPorTipo(tipo, periodo = 'dia') {
      const grouped = new Map();

      metricsStore
        .filter((metric) => metric.tipo === tipo)
        .forEach((metric) => {
          const date = metric.timestamp;
          const key = periodo === 'hora'
            ? `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`
            : `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

          if (!grouped.has(key)) {
            grouped.set(key, []);
          }
          grouped.get(key).push(metric.valor);
        });

      return Array.from(grouped.entries()).map(([key, values]) => {
        const [year, month, day, hour] = key.split('-').map(Number);
        return {
          _id: periodo === 'hora'
            ? { year, month, day, hour }
            : { year, month, day },
          promedio: values.reduce((acc, value) => acc + value, 0) / values.length,
          minimo: Math.min(...values),
          maximo: Math.max(...values),
          total: values.length
        };
      }).sort((a, b) => {
        const getDate = (entry) => {
          const { year, month, day, hour = 0 } = entry._id;
          return new Date(year, month, day, hour).getTime();
        };
        return getDate(b) - getDate(a);
      });
    }

    static async obtenerEstadisticas() {
      const grouped = metricsStore.reduce((acc, metric) => {
        acc[metric.tipo] = acc[metric.tipo] || [];
        acc[metric.tipo].push(metric.valor);
        return acc;
      }, {});

      return Object.entries(grouped).map(([tipo, valores]) => ({
        _id: tipo,
        promedio: valores.reduce((acc, value) => acc + value, 0) / valores.length,
        minimo: Math.min(...valores),
        maximo: Math.max(...valores),
        total: valores.length
      })).sort((a, b) => b.total - a.total);
    }
  }

  module.exports = MetricInMemory;
} else {
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
}

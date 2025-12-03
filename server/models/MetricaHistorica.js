const mongoose = require('mongoose');

const kpiSchema = new mongoose.Schema({
  valor: { type: mongoose.Schema.Types.Mixed, required: true },
  etiqueta: { type: String, required: true },
  unidad: { type: String },
});

const MetricaHistoricaSchema = new mongoose.Schema(
  {
    fecha: { type: Date, required: true, unique: true, index: true },
    // --- KPIs de la Torre de Control (Snapshot al final del día) ---
    torreDeControl: {
      comercial: {
        prospectosActivos: kpiSchema,
        nuevosProspectosMes: kpiSchema,
        ventasConcretadasMes: kpiSchema,
        tasaConversion: kpiSchema,
      },
      operaciones: {
        pedidosEnFabricacion: kpiSchema,
        valorEnProduccion: kpiSchema,
        pedidosParaInstalar: kpiSchema,
      },
      financiero: {
        montoVentasMes: kpiSchema,
        ticketPromedio: kpiSchema,
        anticiposRecibidosMes: kpiSchema,
        saldoTotalPorCobrar: kpiSchema,
      },
    },
    // --- KPIs de la Cabina de Supervisión (Resumen del día) ---
    supervisionActiva: {
      comercial: {
        nuevosProspectosHoy: kpiSchema,
      },
      fabricacion: {
        ordenesIniciadasHoy: kpiSchema,
        ordenesFinalizadasHoy: kpiSchema,
      },
      instalaciones: {
        instalacionesProgramadasHoy: kpiSchema,
        instalacionesEnCurso: kpiSchema,
        instalacionesCompletadasHoy: kpiSchema,
      },
    },
    // Campo de control para saber si hubo actividad
    actividadDetectada: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// Índice compuesto para consultas eficientes de rangos de fechas con actividad
MetricaHistoricaSchema.index({ fecha: 1, actividadDetectada: 1 });

const MetricaHistorica = mongoose.model('MetricaHistorica', MetricaHistoricaSchema);

module.exports = MetricaHistorica;

require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const logger = require('../config/logger');
const MetricaHistorica = require('../models/MetricaHistorica');
const Pedido = require('../models/Pedido');
const Prospecto = require('../models/Prospecto');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sundeck-crm';

// --- LÓGICA DE CÁLCULO DE KPIs (Replicando la de las rutas) ---

async function calcularKpisDelDia() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // --- Cálculos de Torre de Control (Estado al final del día) ---
  const [
    prospectosActivos, nuevosProspectosMes, ventasConcretadasMes, 
    pedidosEnFabricacion, valorEnProduccion, pedidosParaInstalar, 
    montoVentasMes, anticiposRecibidosMes, saldoTotalPorCobrar
  ] = await Promise.all([
    Prospecto.countDocuments({ activo: true, archivado: { $ne: true }, etapa: { $nin: ['venta_cerrada', 'pedido', 'perdido'] } }),
    Prospecto.countDocuments({ createdAt: { $gte: monthStart, $lte: todayEnd } }),
    Pedido.countDocuments({ createdAt: { $gte: monthStart, $lte: todayEnd } }),
    Pedido.countDocuments({ estado: { $in: ['confirmado', 'en_proceso'] } }),
    Pedido.aggregate([{ $match: { estado: { $in: ['confirmado', 'en_proceso'] } } }, { $group: { _id: null, total: { $sum: '$montoTotal' } } }]),
    Pedido.countDocuments({ estado: 'terminado' }),
    Pedido.aggregate([{ $match: { createdAt: { $gte: monthStart, $lte: todayEnd } } }, { $group: { _id: null, total: { $sum: '$montoTotal' } } }]),
    Pedido.aggregate([{ $match: { 'anticipo.fechaPago': { $gte: monthStart, $lte: todayEnd } } }, { $group: { _id: null, total: { $sum: '$anticipo.monto' } } }]),
    Pedido.aggregate([{ $match: { 'saldo.pagado': { $ne: true } } }, { $group: { _id: null, total: { $sum: '$saldo.monto' } } }])
  ]);

  // --- Cálculos de Supervisión Activa (Actividad SÓLO de hoy) ---
  const [
    nuevosProspectosHoy, ordenesIniciadasHoy, ordenesFinalizadasHoy,
    instalacionesProgramadasHoy, instalacionesCompletadasHoy, instalacionesEnCurso
  ] = await Promise.all([
    Prospecto.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd } }),
    Pedido.countDocuments({ fechaInicioFabricacion: { $gte: todayStart, $lte: todayEnd } }),
    Pedido.countDocuments({ fechaFinFabricacion: { $gte: todayStart, $lte: todayEnd } }),
    Pedido.countDocuments({ fechaInstalacion: { $gte: todayStart, $lte: todayEnd } }),
    Pedido.countDocuments({ estado: 'entregado', fechaEntrega: { $gte: todayStart, $lte: todayEnd } }),
    Pedido.countDocuments({ estado: 'en_instalacion' })
  ]);
  
  const tasaConversion = nuevosProspectosMes > 0 ? (ventasConcretadasMes / nuevosProspectosMes) * 100 : 0;
  const ticketPromedio = ventasConcretadasMes > 0 ? (montoVentasMes[0]?.total || 0) / ventasConcretadasMes : 0;

  // --- Empaquetado de Datos ---
  const snapshot = {
    fecha: todayStart,
    torreDeControl: {
      comercial: {
        prospectosActivos: { valor: prospectosActivos, etiqueta: 'Prospectos Activos' },
        nuevosProspectosMes: { valor: nuevosProspectosMes, etiqueta: 'Nuevos Prospectos (Mes)' },
        ventasConcretadasMes: { valor: ventasConcretadasMes, etiqueta: 'Ventas Concretadas (Mes)' },
        tasaConversion: { valor: parseFloat(tasaConversion.toFixed(1)), etiqueta: 'Tasa de Conversión (Mes)', unidad: '%' },
      },
      operaciones: {
        pedidosEnFabricacion: { valor: pedidosEnFabricacion, etiqueta: 'Pedidos en Taller' },
        valorEnProduccion: { valor: valorEnProduccion[0]?.total || 0, etiqueta: 'Valor en Producción', unidad: 'currency' },
        pedidosParaInstalar: { valor: pedidosParaInstalar, etiqueta: 'Listos para Instalar' },
      },
      financiero: {
        montoVentasMes: { valor: montoVentasMes[0]?.total || 0, etiqueta: 'Ventas del Mes', unidad: 'currency' },
        ticketPromedio: { valor: ticketPromedio, etiqueta: 'Ticket Promedio (Mes)', unidad: 'currency' },
        anticiposRecibidosMes: { valor: anticiposRecibidosMes[0]?.total || 0, etiqueta: 'Anticipos Recibidos (Mes)', unidad: 'currency' },
        saldoTotalPorCobrar: { valor: saldoTotalPorCobrar[0]?.total || 0, etiqueta: 'Cuentas por Cobrar', unidad: 'currency' },
      },
    },
    supervisionActiva: {
      comercial: { nuevosProspectosHoy: { valor: nuevosProspectosHoy, etiqueta: 'Nuevos Prospectos Hoy' } },
      fabricacion: {
        ordenesIniciadasHoy: { valor: ordenesIniciadasHoy, etiqueta: 'Órdenes Iniciadas Hoy' },
        ordenesFinalizadasHoy: { valor: ordenesFinalizadasHoy, etiqueta: 'Órdenes Finalizadas Hoy' },
      },
      instalaciones: {
        instalacionesProgramadasHoy: { valor: instalacionesProgramadasHoy, etiqueta: 'Instalaciones Programadas' },
        instalacionesEnCurso: { valor: instalacionesEnCurso, etiqueta: 'Instalaciones en Curso' },
        instalacionesCompletadasHoy: { valor: instalacionesCompletadasHoy, etiqueta: 'Instalaciones Completadas' },
      },
    },
  };

  // --- Verificación de Actividad ---
  const actividadTotal = 
    nuevosProspectosHoy + ordenesIniciadasHoy + ordenesFinalizadasHoy + instalacionesCompletadasHoy;
  
  snapshot.actividadDetectada = actividadTotal > 0;

  return snapshot;
}

const generarSnapshotKPIs = async () => {
  logger.info('Iniciando script de snapshot de KPIs...', { script: 'generarSnapshotKPIs.js' });

  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    logger.info('Conexión a la base de datos establecida.', { script: 'generarSnapshotKPIs.js' });

    const snapshot = await calcularKpisDelDia();

    if (!snapshot.actividadDetectada) {
      logger.info('No se detectó actividad hoy. Omitiendo la creación del snapshot.', {
        script: 'generarSnapshotKPIs.js',
        fecha: snapshot.fecha.toISOString().split('T')[0],
      });
      return;
    }

    // Usamos updateOne con upsert:true para evitar duplicados si el script se corre más de una vez al día
    await MetricaHistorica.updateOne(
      { fecha: snapshot.fecha },
      { $set: snapshot },
      { upsert: true } // Crea el documento si no existe, lo actualiza si sí
    );

    logger.info('✅ Snapshot de KPIs guardado exitosamente.', {
      script: 'generarSnapshotKPIs.js',
      fecha: snapshot.fecha.toISOString().split('T')[0],
    });

  } catch (error) {
    logger.error('Error durante la ejecución del script de snapshot de KPIs.', {
      script: 'generarSnapshotKPIs.js',
      error: error.message,
      stack: error.stack,
    });
  } finally {
    await mongoose.disconnect();
    logger.info('Desconexión de la base de datos.', { script: 'generarSnapshotKPIs.js' });
  }
};

// Si el script se ejecuta directamente, llama a la función principal
if (require.main === module) {
  generarSnapshotKPIs();
}

module.exports = generarSnapshotKPIs;

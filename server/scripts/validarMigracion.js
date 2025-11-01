const mongoose = require('mongoose');
require('dotenv').config();
const Proyecto = require('../models/Proyecto');
const ProyectoPedido = require('../models/ProyectoPedido');
const logger = require('../config/logger');

const ESTADOS_PROYECTO_MAP = {
  cotizado: 'cotizacion',
  confirmado: 'aprobado',
  en_fabricacion: 'fabricacion',
  fabricado: 'fabricacion',
  en_instalacion: 'instalacion',
  completado: 'completado',
  cancelado: 'cancelado'
};

const ESTADOS_INSTALACION_MAP = {
  pendiente: 'programada',
  programada: 'programada',
  en_proceso: 'instalando',
  pausada: 'reprogramada',
  completada: 'completada',
  cancelada: 'cancelada'
};

function mapEstadoProyecto(estado) {
  return ESTADOS_PROYECTO_MAP[estado] || 'levantamiento';
}

function mapEstadoInstalacion(estado) {
  return ESTADOS_INSTALACION_MAP[estado] || 'programada';
}

function compareNumbers(a, b) {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  return Math.abs(a - b) < 0.01;
}

async function conectarDB() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sundeck-crm';
  await mongoose.connect(mongoUri);
  logger.info('Conexión a MongoDB establecida para validar migración', {
    script: 'validarMigracion',
    mongoUri: process.env.MONGODB_URI ? 'env:MONGODB_URI' : mongoUri
  });
}

async function validar() {
  const resumen = {
    totalProyectoPedido: 0,
    totalProyecto: 0,
    proyectosSinNumero: 0,
    faltantes: 0,
    diferenciasMontoTotal: 0,
    diferenciasAnticipo: 0,
    diferenciasSaldo: 0,
    diferenciasEstadoProyecto: 0,
    diferenciasEstadoFabricacion: 0,
    diferenciasEstadoInstalacion: 0,
    diferenciasTelefono: 0
  };

  resumen.totalProyectoPedido = await ProyectoPedido.countDocuments({});
  resumen.totalProyecto = await Proyecto.countDocuments({});

  logger.info('Totales globales antes de validación detallada', {
    script: 'validarMigracion',
    totalProyectoPedido: resumen.totalProyectoPedido,
    totalProyecto: resumen.totalProyecto
  });

  const proyectosPedido = await ProyectoPedido.find({})
    .select('numero estado pagos cliente.telefono fabricacion.estado instalacion.estado')
    .lean();

  const numeros = [];

  for (const proyectoPedido of proyectosPedido) {
    if (!proyectoPedido.numero) {
      resumen.proyectosSinNumero += 1;
      logger.warn('ProyectoPedido sin número detectado', {
        script: 'validarMigracion',
        proyectoPedidoId: proyectoPedido._id
      });
      continue;
    }

    numeros.push(proyectoPedido.numero);
  }

  const proyectos = await Proyecto.find({ numero: { $in: numeros } })
    .select('numero estado pagos cliente.telefono fabricacion.estado instalacion.estado')
    .lean();

  const proyectosMap = new Map(proyectos.map((proyecto) => [proyecto.numero, proyecto]));

  for (const proyectoPedido of proyectosPedido) {
    if (!proyectoPedido.numero) {
      continue;
    }

    const proyecto = proyectosMap.get(proyectoPedido.numero);

    if (!proyecto) {
      resumen.faltantes += 1;
      logger.error('Proyecto faltante tras migración', {
        script: 'validarMigracion',
        proyectoPedidoId: proyectoPedido._id,
        numero: proyectoPedido.numero
      });
      continue;
    }

    if (!compareNumbers(proyectoPedido.pagos?.montoTotal, proyecto.pagos?.montoTotal)) {
      resumen.diferenciasMontoTotal += 1;
      logger.warn('Diferencia en montoTotal detectada', {
        script: 'validarMigracion',
        numero: proyectoPedido.numero,
        montoProyectoPedido: proyectoPedido.pagos?.montoTotal || null,
        montoProyecto: proyecto.pagos?.montoTotal || null
      });
    }

    if (!compareNumbers(proyectoPedido.pagos?.anticipo?.monto, proyecto.pagos?.anticipo?.monto)) {
      resumen.diferenciasAnticipo += 1;
      logger.warn('Diferencia en anticipo detectada', {
        script: 'validarMigracion',
        numero: proyectoPedido.numero,
        anticipoProyectoPedido: proyectoPedido.pagos?.anticipo?.monto || null,
        anticipoProyecto: proyecto.pagos?.anticipo?.monto || null
      });
    }

    if (!compareNumbers(proyectoPedido.pagos?.saldo?.monto, proyecto.pagos?.saldo?.monto)) {
      resumen.diferenciasSaldo += 1;
      logger.warn('Diferencia en saldo detectada', {
        script: 'validarMigracion',
        numero: proyectoPedido.numero,
        saldoProyectoPedido: proyectoPedido.pagos?.saldo?.monto || null,
        saldoProyecto: proyecto.pagos?.saldo?.monto || null
      });
    }

    const estadoEsperado = mapEstadoProyecto(proyectoPedido.estado);
    if (estadoEsperado !== proyecto.estado) {
      resumen.diferenciasEstadoProyecto += 1;
      logger.warn('Estado de proyecto no coincide', {
        script: 'validarMigracion',
        numero: proyectoPedido.numero,
        estadoProyectoPedido: proyectoPedido.estado,
        estadoEsperado,
        estadoProyecto: proyecto.estado
      });
    }

    if (
      proyectoPedido.fabricacion?.estado &&
      proyecto.fabricacion?.estado &&
      proyectoPedido.fabricacion.estado !== proyecto.fabricacion.estado
    ) {
      resumen.diferenciasEstadoFabricacion += 1;
      logger.warn('Estado de fabricación no coincide', {
        script: 'validarMigracion',
        numero: proyectoPedido.numero,
        fabricacionProyectoPedido: proyectoPedido.fabricacion.estado,
        fabricacionProyecto: proyecto.fabricacion.estado
      });
    }

    const estadoInstalacionEsperado = mapEstadoInstalacion(proyectoPedido.instalacion?.estado);
    if (
      proyectoPedido.instalacion?.estado &&
      proyecto.instalacion?.estado &&
      estadoInstalacionEsperado !== proyecto.instalacion.estado
    ) {
      resumen.diferenciasEstadoInstalacion += 1;
      logger.warn('Estado de instalación no coincide', {
        script: 'validarMigracion',
        numero: proyectoPedido.numero,
        instalacionProyectoPedido: proyectoPedido.instalacion?.estado,
        instalacionEsperado: estadoInstalacionEsperado,
        instalacionProyecto: proyecto.instalacion.estado
      });
    }

    const telefonoPedido = proyectoPedido.cliente?.telefono || null;
    const telefonoProyecto = proyecto.cliente?.telefono || null;
    if (telefonoPedido && telefonoProyecto && telefonoPedido !== telefonoProyecto) {
      resumen.diferenciasTelefono += 1;
      logger.warn('Teléfono del cliente no coincide', {
        script: 'validarMigracion',
        numero: proyectoPedido.numero,
        telefonoProyectoPedido: telefonoPedido,
        telefonoProyecto
      });
    }
  }

  logger.info('Resumen de validación de migración', {
    script: 'validarMigracion',
    ...resumen
  });
}

async function main() {
  try {
    await conectarDB();
    await validar();
  } catch (error) {
    logger.error('Error general durante validación de migración', {
      script: 'validarMigracion',
      error: error.message,
      stack: error.stack
    });
  } finally {
    await mongoose.disconnect();
    logger.info('Conexión a MongoDB cerrada tras validar migración', {
      script: 'validarMigracion'
    });
    process.exit(0);
  }
}

main();

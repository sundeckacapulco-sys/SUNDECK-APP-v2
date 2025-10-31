const mongoose = require('mongoose');
require('dotenv').config();
const Proyecto = require('../models/Proyecto');
const logger = require('../config/logger');

async function verificar() {
  const proyectoId = '68f8f89aca4798f5414480fe';

  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sundeck-crm';
    await mongoose.connect(mongoUri);
    logger.info('Conexión a MongoDB establecida para verificación de proyecto', {
      script: 'verificarProyecto',
      proyectoId,
      mongoUri: process.env.MONGODB_URI ? 'env:MONGODB_URI' : mongoUri
    });

    const proyecto = await Proyecto.findById(proyectoId);

    if (!proyecto) {
      logger.error('Proyecto no encontrado durante verificación', {
        script: 'verificarProyecto',
        proyectoId
      });
      return;
    }

    logger.info('Totales del proyecto verificados', {
      script: 'verificarProyecto',
      proyectoId,
      subtotal: proyecto.subtotal,
      total: proyecto.total,
      totalesLevantamiento: proyecto.levantamiento?.totales || null
    });

    const primeraPieza = proyecto.levantamiento?.partidas?.[0]?.piezas?.[0];

    if (primeraPieza) {
      logger.info('Detalle de la primera pieza del levantamiento', {
        script: 'verificarProyecto',
        proyectoId,
        precioM2: primeraPieza.precioM2,
        totales: primeraPieza.totales || null
      });
    }
  } catch (error) {
    logger.error('Error verificando proyecto', {
      script: 'verificarProyecto',
      error: error.message,
      stack: error.stack
    });
  } finally {
    await mongoose.connection.close();
    logger.info('Conexión a MongoDB cerrada tras verificación', {
      script: 'verificarProyecto',
      proyectoId
    });
    process.exit(0);
  }
}

verificar();

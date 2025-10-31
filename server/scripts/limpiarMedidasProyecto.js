const mongoose = require('mongoose');
require('dotenv').config();
const Proyecto = require('../models/Proyecto');
const logger = require('../config/logger');

async function limpiarMedidas() {
  const proyectoId = '68f8f89aca4798f5414480fe';

  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sundeck-crm';
    await mongoose.connect(mongoUri);
    logger.info('Conexión a MongoDB establecida para limpiar medidas', {
      script: 'limpiarMedidasProyecto',
      proyectoId,
      mongoUri: process.env.MONGODB_URI ? 'env:MONGODB_URI' : mongoUri
    });

    const proyecto = await Proyecto.findById(proyectoId);

    if (!proyecto) {
      logger.error('Proyecto no encontrado durante limpieza de medidas', {
        script: 'limpiarMedidasProyecto',
        proyectoId
      });
      return;
    }

    logger.info('Iniciando limpieza de medidas de proyecto', {
      script: 'limpiarMedidasProyecto',
      proyectoId,
      medidasIniciales: proyecto.medidas?.length || 0
    });

    // Limpiar precios de todas las medidas
    if (proyecto.medidas && Array.isArray(proyecto.medidas)) {
      proyecto.medidas.forEach((medida) => {
        // Si tiene piezas (formato nuevo)
        if (medida.piezas && Array.isArray(medida.piezas)) {
          medida.piezas.forEach((pieza) => {
            pieza.precioM2 = 0;
            pieza.precioTotal = 0;
            pieza.areaTotal = pieza.areaTotal || 0; // Mantener área

            if (pieza.totales) {
              pieza.totales.subtotal = 0;
              pieza.totales.costoMotorizacion = 0;
              pieza.totales.costoInstalacion = 0;
            }
          });
        }

        // Si es formato viejo
        if (medida.precioM2) medida.precioM2 = 0;
        if (medida.precioTotal) medida.precioTotal = 0;
      });
    }

    await proyecto.save();

    logger.info('Medidas de proyecto limpiadas', {
      script: 'limpiarMedidasProyecto',
      proyectoId,
      medidasFinales: proyecto.medidas?.length || 0
    });
  } catch (error) {
    logger.error('Error limpiando medidas del proyecto', {
      script: 'limpiarMedidasProyecto',
      proyectoId,
      error: error.message,
      stack: error.stack
    });
  } finally {
    await mongoose.connection.close();
    logger.info('Conexión a MongoDB cerrada tras limpieza de medidas', {
      script: 'limpiarMedidasProyecto',
      proyectoId
    });
    process.exit(0);
  }
}

limpiarMedidas();

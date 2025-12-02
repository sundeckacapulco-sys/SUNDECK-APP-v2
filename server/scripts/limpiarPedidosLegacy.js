const mongoose = require('mongoose');
const logger = require('../config/logger');

/**
 * Script para limpiar la colección 'pedidos' y eliminar datos duplicados/legacy.
 * ADVERTENCIA: Esta acción es destructiva y eliminará todos los documentos de la colección.
 */

async function limpiarColeccion() {
  // URI corregida basada en la documentación del proyecto (mongodump --db sundeck)
  const mongoUri = 'mongodb://localhost:27017/sundeck'; 

  logger.info(`Intentando conectar a la base de datos en: ${mongoUri}`, { script: 'limpiarPedidosLegacy' });

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    logger.info("Conectado a la base de datos para limpieza.", { script: 'limpiarPedidosLegacy' });

    const db = mongoose.connection;
    const collectionName = 'pedidos';
    const collections = await db.db.listCollections({ name: collectionName }).toArray();

    if (collections.length > 0) {
      logger.info(`La colección '${collectionName}' existe. Procediendo a eliminarla.`, { script: 'limpiarPedidosLegacy' });
      await db.collection(collectionName).drop();
      logger.info(`✅ Colección '${collectionName}' eliminada exitosamente.`, { script: 'limpiarPedidosLegacy' });
    } else {
      logger.warn(`La colección '${collectionName}' no existe. No hay nada que limpiar.`, { script: 'limpiarPedidosLegacy' });
    }

  } catch (error) {
    logger.error('Error durante el proceso de limpieza de la colección.', {
      script: 'limpiarPedidosLegacy',
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      logger.info('Conexión a la base de datos cerrada.', { script: 'limpiarPedidosLegacy' });
    }
  }
}

// Ejecutar la función principal
limpiarColeccion();

const mongoose = require('mongoose');
const logger = require('../config/logger');
const SyncLegacyService = require('../services/syncLegacyService');
require('dotenv').config({ path: './.env' }); // Asegurarse que las variables de entorno se carguen

/**
 * Script de línea de comandos para ejecutar la consolidación de datos legacy.
 *
 * Uso: node server/scripts/ejecutarConsolidacionLegacy.js [limite]
 * 
 * [limite] (opcional): Número de registros a procesar. Si no se especifica, procesa todos.
 */

// --- Conexión a la Base de Datos ---
async function conectarDB() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/sundeck-crm';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    logger.info('Conectado a la base de datos MongoDB', { script: 'ejecutarConsolidacionLegacy' });
  } catch (error) {
    logger.error('Error al conectar a la base de datos', {
      script: 'ejecutarConsolidacionLegacy',
      error: error.message,
      stack: error.stack
    });
    process.exit(1); // Salir si no se puede conectar a la DB
  }
}

// --- Lógica Principal del Script ---
async function ejecutarScript() {
  await conectarDB();

  const limite = process.argv[2] ? parseInt(process.argv[2], 10) : 0;

  if (isNaN(limite)) {
    logger.error('El límite proporcionado no es un número válido.', { script: 'ejecutarConsolidacionLegacy' });
    mongoose.connection.close();
    process.exit(1);
  }

  const syncService = new SyncLegacyService();

  try {
    logger.info(`Iniciando la consolidación de datos con un límite de ${limite === 0 ? 'todos' : limite} registros...`, {
      script: 'ejecutarConsolidacionLegacy'
    });

    const stats = await syncService.ejecutar(limite);

    if (stats.errores > 0) {
      logger.warn('El proceso de consolidación finalizó con errores.', { script: 'ejecutarConsolidacionLegacy' });
    } else {
      logger.info('✅ Proceso de consolidación finalizado exitosamente.', { script: 'ejecutarConsolidacionLegacy' });
    }

  } catch (error) {
    logger.error('Ocurrió un error catastrófico durante la ejecución del script de consolidación.', {
      script: 'ejecutarConsolidacionLegacy',
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  } finally {
    logger.info('Cerrando la conexión a la base de datos.', { script: 'ejecutarConsolidacionLegacy' });
    await mongoose.connection.close();
  }
}

// --- Ejecutar el script ---
ejecutarScript();

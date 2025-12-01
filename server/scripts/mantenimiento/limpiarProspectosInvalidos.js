const mongoose = require('mongoose');
const logger = require('../config/logger');
const Proyecto = require('../models/Proyecto');

async function limpiarProspectosInvalidos() {
  try {
    await mongoose.connect('mongodb://localhost:27017/sundeck');
    logger.info('Conectado a MongoDB');

    // Eliminar prospectos sin nombre o sin teléfono
    const resultado = await Proyecto.deleteMany({
      $or: [
        { 'cliente.nombre': { $in: [null, '', 'Sin nombre'] } },
        { 'cliente.telefono': { $in: [null, '', 'Sin teléfono'] } }
      ]
    });

    logger.info('Prospectos inválidos eliminados', {
      eliminados: resultado.deletedCount
    });

    console.log(`✅ ${resultado.deletedCount} prospectos inválidos eliminados`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    logger.error('Error al limpiar prospectos', { error: error.message });
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

limpiarProspectosInvalidos();

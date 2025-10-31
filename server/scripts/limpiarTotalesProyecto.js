/**
 * Script para limpiar totales de un proyecto específico
 * Ejecutar: node server/scripts/limpiarTotalesProyecto.js <ID_PROYECTO>
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Proyecto = require('../models/Proyecto');
const logger = require('../config/logger');

async function limpiarTotalesProyecto(proyectoId) {
  try {
    // Conectar a MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sundeck-crm';
    await mongoose.connect(mongoUri);
    logger.info('Conexión a MongoDB establecida para limpieza de totales', {
      script: 'limpiarTotalesProyecto',
      proyectoId,
      mongoUri: process.env.MONGODB_URI ? 'env:MONGODB_URI' : mongoUri
    });

    if (!proyectoId) {
      logger.error('ID del proyecto no proporcionado', {
        script: 'limpiarTotalesProyecto'
      });
      logger.info('Uso correcto del script', {
        script: 'limpiarTotalesProyecto',
        comando: 'node server/scripts/limpiarTotalesProyecto.js <ID_PROYECTO>'
      });
      process.exit(1);
    }

    const proyecto = await Proyecto.findById(proyectoId);

    if (!proyecto) {
      logger.error('Proyecto no encontrado para limpieza', {
        script: 'limpiarTotalesProyecto',
        proyectoId
      });
      process.exit(1);
    }

    logger.info('Proyecto encontrado para limpieza de totales', {
      script: 'limpiarTotalesProyecto',
      proyectoId,
      cliente: proyecto.cliente?.nombre || 'Sin nombre',
      estadoActual: proyecto.estado,
      totales: {
        subtotal: proyecto.subtotal,
        iva: proyecto.iva,
        total: proyecto.total
      }
    });

    // Limpiar totales
    proyecto.subtotal = 0;
    proyecto.iva = 0;
    proyecto.total = 0;
    proyecto.cotizacionActual = null;
    
    // Si no tiene cotizaciones, volver a levantamiento
    if (!proyecto.cotizaciones || proyecto.cotizaciones.length === 0) {
      if (proyecto.estado === 'cotizacion') {
        proyecto.estado = 'levantamiento';
        logger.warn('Estado de proyecto ajustado al no tener cotizaciones', {
          script: 'limpiarTotalesProyecto',
          proyectoId,
          nuevoEstado: proyecto.estado
        });
      }
    }

    await proyecto.save();

    logger.info('Proyecto actualizado exitosamente tras limpieza de totales', {
      script: 'limpiarTotalesProyecto',
      proyectoId,
      totales: {
        subtotal: proyecto.subtotal,
        iva: proyecto.iva,
        total: proyecto.total
      },
      estado: proyecto.estado
    });

  } catch (error) {
    logger.error('Error limpiando totales de proyecto', {
      script: 'limpiarTotalesProyecto',
      proyectoId,
      error: error.message,
      stack: error.stack
    });
  } finally {
    await mongoose.connection.close();
    logger.info('Conexión a MongoDB cerrada tras limpieza de totales', {
      script: 'limpiarTotalesProyecto',
      proyectoId
    });
    process.exit(0);
  }
}

// Obtener ID del proyecto de los argumentos
const proyectoId = process.argv[2];
limpiarTotalesProyecto(proyectoId);

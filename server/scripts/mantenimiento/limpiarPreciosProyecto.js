/**
 * Script para limpiar todos los precios de un proyecto
 * Ejecutar: node server/scripts/limpiarPreciosProyecto.js <ID_PROYECTO>
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Proyecto = require('../models/Proyecto');
const logger = require('../config/logger');

async function limpiarPreciosProyecto(proyectoId) {
  try {
    // Conectar a MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sundeck-crm';
    await mongoose.connect(mongoUri);
    logger.info('Conexión a MongoDB establecida para limpieza de precios', {
      script: 'limpiarPreciosProyecto',
      proyectoId,
      mongoUri: process.env.MONGODB_URI ? 'env:MONGODB_URI' : mongoUri
    });

    if (!proyectoId) {
      logger.error('ID del proyecto no proporcionado', {
        script: 'limpiarPreciosProyecto'
      });
      logger.info('Uso correcto del script', {
        script: 'limpiarPreciosProyecto',
        comando: 'node server/scripts/limpiarPreciosProyecto.js <ID_PROYECTO>'
      });
      process.exit(1);
    }

    const proyecto = await Proyecto.findById(proyectoId);

    if (!proyecto) {
      logger.error('Proyecto no encontrado para limpieza de precios', {
        script: 'limpiarPreciosProyecto',
        proyectoId
      });
      process.exit(1);
    }

    logger.info('Proyecto encontrado para limpieza de precios', {
      script: 'limpiarPreciosProyecto',
      proyectoId,
      cliente: proyecto.cliente?.nombre || 'Sin nombre',
      totalActual: proyecto.total
    });

    // Limpiar totales a nivel raíz
    proyecto.cotizacionActual = null;
    proyecto.subtotal = 0;
    proyecto.iva = 0;
    proyecto.total = 0;
    proyecto.anticipo = 0;
    proyecto.saldo_pendiente = 0;

    // Limpiar levantamiento
    if (proyecto.levantamiento) {
      if (proyecto.levantamiento.totales) {
        proyecto.levantamiento.totales = {
          m2: proyecto.levantamiento.totales.m2 || 0,
          subtotal: 0,
          descuento: 0,
          iva: 0,
          total: 0
        };
      }

      if (proyecto.levantamiento.partidas && Array.isArray(proyecto.levantamiento.partidas)) {
        proyecto.levantamiento.partidas.forEach(partida => {
          if (partida.totales) {
            partida.totales.subtotal = 0;
            partida.totales.costoMotorizacion = 0;
            partida.totales.costoInstalacion = 0;
          }

          if (partida.piezas && Array.isArray(partida.piezas)) {
            partida.piezas.forEach(pieza => {
              pieza.precioM2 = 0;
              if (pieza.totales) {
                pieza.totales.subtotal = 0;
                pieza.totales.costoMotorizacion = 0;
                pieza.totales.costoInstalacion = 0;
              }
            });
          }

          if (partida.motorizacion) {
            partida.motorizacion.precioMotor = 0;
            partida.motorizacion.precioControl = 0;
          }

          if (partida.instalacionEspecial) {
            partida.instalacionEspecial.precioBase = 0;
            partida.instalacionEspecial.precioPorPieza = 0;
          }
        });
      }
    }

    await proyecto.save();

    logger.info('Proyecto limpiado exitosamente', {
      script: 'limpiarPreciosProyecto',
      proyectoId,
      nuevoTotal: proyecto.total,
      partidasLimpias: proyecto.levantamiento?.partidas?.length || 0
    });

  } catch (error) {
    logger.error('Error limpiando precios de proyecto', {
      script: 'limpiarPreciosProyecto',
      proyectoId,
      error: error.message,
      stack: error.stack
    });
  } finally {
    await mongoose.connection.close();
    logger.info('Conexión a MongoDB cerrada tras limpieza de precios', {
      script: 'limpiarPreciosProyecto',
      proyectoId
    });
    process.exit(0);
  }
}

// Obtener ID del proyecto de los argumentos
const proyectoId = process.argv[2];
limpiarPreciosProyecto(proyectoId);

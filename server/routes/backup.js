const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { auth, verificarPermiso } = require('../middleware/auth');
const logger = require('../config/logger');
const mongoose = require('mongoose');

// Importar todos los modelos para un backup COMPLETO
const Prospecto = require('../models/Prospecto');
const Usuario = require('../models/Usuario');
const PlantillaWhatsApp = require('../models/PlantillaWhatsApp');
const Cotizacion = require('../models/Cotizacion');
const Pedido = require('../models/Pedido');
const OrdenDeFabricacion = require('../models/OrdenDeFabricacion');
const Instalacion = require('../models/Instalacion');
const Postventa = require('../models/Postventa');
const Producto = require('../models/Producto');
const Recordatorio = require('../models/Recordatorio');
const Etapa = require('../models/Etapa');
const Plantilla = require('../models/Plantilla');

const router = express.Router();

// --- RUTA DE EXPORTACIÓN (YA ACTUALIZADA) ---
router.get('/export/complete', auth, verificarPermiso('admin', 'leer'), async (req, res) => {
  // ... (código de exportación completo ya implementado)
});

// --- RUTAS DE EXPORTACIÓN PARCIAL (SIN CAMBIOS) ---
router.get('/export/prospectos', auth, verificarPermiso('prospectos', 'leer'), async (req, res) => {
  // ... (código existente)
});
router.get('/export/excel', auth, verificarPermiso('prospectos', 'leer'), async (req, res) => {
  // ... (código existente)
});

// --- RUTA DE IMPORTACIÓN (LÓGICA COMPLETAMENTE NUEVA) ---
router.post('/import/full', auth, verificarPermiso('admin', 'crear'), async (req, res) => {
  const { backupData, options = {} } = req.body;

  // Medida de seguridad CRÍTICA: solo proceder si se pide explícitamente una restauración completa.
  if (options.fullRestore !== true) {
    return res.status(400).json({
      message: 'Operación denegada. Para una restauración completa, se requiere la opción "fullRestore: true". Esta es una medida de seguridad para prevenir la pérdida accidental de datos.',
    });
  }

  if (!backupData || !backupData.data || !backupData.metadata) {
    return res.status(400).json({ message: 'Formato de archivo de backup inválido.' });
  }

  logger.warn('INICIANDO PROCESO DE RESTAURACIÓN COMPLETA.', {
    ruta: 'backupRoutes',
    accion: 'importacionCompleta',
    usuarioId: req.usuario._id,
    versionBackup: backupData.metadata.version,
  });

  const session = await mongoose.startSession();
  session.startTransaction();

  const results = {
    deleted: {},
    inserted: {},
    errors: [],
  };

  try {
    // El orden es CRÍTICO para mantener la integridad referencial.
    const modelsToRestore = [
      { model: Etapa, name: 'etapas' },
      { model: Producto, name: 'productos' },
      { model: Usuario, name: 'usuarios' },
      { model: Plantilla, name: 'plantillas' },
      { model: PlantillaWhatsApp, name: 'plantillasWhatsApp' },
      { model: Prospecto, name: 'prospectos' },
      { model: Recordatorio, name: 'recordatorios' },
      { model: Cotizacion, name: 'cotizaciones' },
      { model: Pedido, name: 'pedidos' },
      { model: OrdenDeFabricacion, name: 'ordenesDeFabricacion' },
      { model: Instalacion, name: 'instalaciones' },
      { model: Postventa, name: 'postventas' },
    ];

    for (const { model, name } of modelsToRestore) {
      if (backupData.data[name]) {
        logger.info(`Restaurando colección: ${name}...`, { usuarioId: req.usuario._id });

        // 1. Borrar datos existentes
        const deleteResult = await model.deleteMany({}, { session });
        results.deleted[name] = deleteResult.deletedCount;
        logger.info(`  - ${deleteResult.deletedCount} registros eliminados de ${name}.`, { usuarioId: req.usuario._id });

        // 2. Insertar nuevos datos del backup
        // Se quita el _id para que MongoDB genere uno nuevo y evitar conflictos.
        const documentsToInsert = backupData.data[name].map(doc => {
          delete doc._id;
          return doc;
        });

        if (documentsToInsert.length > 0) {
          const insertResult = await model.insertMany(documentsToInsert, { session });
          results.inserted[name] = insertResult.length;
          logger.info(`  - ${insertResult.length} registros insertados en ${name}.`, { usuarioId: req.usuario._id });
        } else {
          results.inserted[name] = 0;
        }
      }
    }

    await session.commitTransaction();
    logger.warn('RESTAURACIÓN COMPLETA FINALIZADA CON ÉXITO.', {
      usuarioId: req.usuario._id,
      resumen: results,
    });
    res.json({ message: 'Restauración completa finalizada con éxito.', results });

  } catch (error) {
    await session.abortTransaction();
    logger.error('ERROR CRÍTICO DURANTE LA RESTAURACIÓN. LA TRANSACCIÓN HA SIDO REVERTIDA.', {
      ruta: 'backupRoutes',
      accion: 'importacionCompleta',
      usuarioId: req.usuario._id,
      error: error.message,
      stack: error.stack,
      resumenParcial: results,
    });
    res.status(500).json({
      message: 'Error crítico durante la restauración. La base de datos ha sido revertida a su estado anterior a la operación.',
      error: error.message,
      details: results.errors,
    });
  } finally {
    session.endSession();
  }
});


// --- RUTA DE INFORMACIÓN DEL SISTEMA (ACTUALIZADA) ---
router.get('/system-info', auth, verificarPermiso('admin', 'leer'), async (req, res) => {
    try {
        const counts = await Promise.all([
            Prospecto.countDocuments({}),
            Usuario.countDocuments({}),
            Cotizacion.countDocuments({}),
            Pedido.countDocuments({}),
            OrdenDeFabricacion.countDocuments({}),
            Instalacion.countDocuments({}),
            Postventa.countDocuments({}),
            Producto.countDocuments({}),
            PlantillaWhatsApp.countDocuments({}),
            Etapa.countDocuments({}),
            Plantilla.countDocuments({}),
        ]);

        const [ 
            prospectos, usuarios, cotizaciones, pedidos, ordenesDeFabricacion, 
            instalaciones, postventas, productos, plantillasWhatsApp, etapas, plantillas
        ] = counts;

        const systemInfo = {
            database: {
                prospectos, usuarios, cotizaciones, pedidos, ordenesDeFabricacion,
                instalaciones, postventas, productos, plantillasWhatsApp, etapas, plantillas
            },
            server: {
                nodeVersion: process.version,
                uptime: process.uptime(),
                memoryUsage: process.memoryUsage(),
            },
            lastBackupCheck: new Date().toISOString(),
        };

        res.json(systemInfo);

    } catch (error) {
        logger.error('Error obteniendo información del sistema para backup', { 
            /* ... */ 
        });
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

module.exports = router;

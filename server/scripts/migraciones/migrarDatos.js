const mongoose = require('mongoose');
const Prospecto = require('../models/Prospecto');
const Proyecto = require('../models/Proyecto');
const Etapa = require('../models/Etapa');
// const ProyectoSyncMiddleware = require('../middleware/proyectoSync'); // ❌ LEGACY - Desactivado 6 Nov 2025
const logger = require('../config/logger');

/**
 * Script de migración para convertir datos existentes al sistema unificado
 * Ejecutar con: node server/scripts/migrarDatos.js
 */

async function conectarBaseDatos() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sundeck-crm';
    await mongoose.connect(mongoUri);
    logger.info('Conexión a MongoDB establecida para migración', {
      script: 'migrarDatos',
      mongoUri: process.env.MONGODB_URI ? 'env:MONGODB_URI' : mongoUri
    });
  } catch (error) {
    logger.error('Error conectando a MongoDB para migración', {
      script: 'migrarDatos',
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

async function migrarProspectosAProyectos() {
  try {
    logger.info('Iniciando migración de prospectos a proyectos', {
      script: 'migrarDatos',
      etapa: 'migrarProspectosAProyectos'
    });

    // Obtener todos los prospectos que no tengan proyecto asociado
    const prospectos = await Prospecto.find({}).lean();
    logger.info('Prospectos recuperados para sincronización', {
      script: 'migrarDatos',
      etapa: 'migrarProspectosAProyectos',
      totalProspectos: prospectos.length
    });

    let proyectosCreados = 0;
    let proyectosActualizados = 0;
    let errores = 0;

    for (const prospecto of prospectos) {
      try {
        // Verificar si ya existe un proyecto para este prospecto
        const proyectoExistente = await Proyecto.findOne({
          prospecto_original: prospecto._id
        });

        if (proyectoExistente) {
          // Actualizar proyecto existente
          await ProyectoSyncMiddleware.sincronizarProspecto(prospecto, 'update');
          proyectosActualizados++;
        } else {
          // Crear nuevo proyecto
          await ProyectoSyncMiddleware.sincronizarProspecto(prospecto, 'create');
          proyectosCreados++;
        }

        // Sincronizar medidas desde etapas
        const proyecto = await Proyecto.findOne({ prospecto_original: prospecto._id });
        if (proyecto) {
          await ProyectoSyncMiddleware.sincronizarMedidasDesdeEtapas(
            proyecto._id,
            prospecto._id
          );
          logger.info('Proyecto sincronizado desde prospecto', {
            script: 'migrarDatos',
            etapa: 'migrarProspectosAProyectos',
            accion: proyectoExistente ? 'actualizado' : 'creado',
            prospectoId: prospecto._id,
            prospectoNombre: prospecto.nombre,
            proyectoId: proyecto._id
          });
        } else {
          logger.warn('Proyecto no encontrado tras sincronización', {
            script: 'migrarDatos',
            etapa: 'migrarProspectosAProyectos',
            prospectoId: prospecto._id,
            prospectoNombre: prospecto.nombre,
            accion: proyectoExistente ? 'actualizado' : 'creado'
          });
        }

      } catch (error) {
        logger.error('Error procesando prospecto durante migración', {
          script: 'migrarDatos',
          etapa: 'migrarProspectosAProyectos',
          prospectoId: prospecto._id,
          prospectoNombre: prospecto.nombre,
          error: error.message,
          stack: error.stack
        });
        errores++;
      }
    }

    logger.info('Resumen de migración de prospectos a proyectos', {
      script: 'migrarDatos',
      etapa: 'migrarProspectosAProyectos',
      proyectosCreados,
      proyectosActualizados,
      errores,
      totalProcesados: proyectosCreados + proyectosActualizados + errores
    });

  } catch (error) {
    logger.error('Error general en migración de prospectos a proyectos', {
      script: 'migrarDatos',
      etapa: 'migrarProspectosAProyectos',
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

async function verificarIntegridad() {
  try {
    logger.info('Iniciando verificación de integridad de datos', {
      script: 'migrarDatos',
      etapa: 'verificarIntegridad'
    });

    const totalProspectos = await Prospecto.countDocuments({});
    const totalProyectos = await Proyecto.countDocuments({});
    const proyectosConProspecto = await Proyecto.countDocuments({
      prospecto_original: { $exists: true, $ne: null }
    });

    logger.info('Totales generales tras migración', {
      script: 'migrarDatos',
      etapa: 'verificarIntegridad',
      totalProspectos,
      totalProyectos,
      proyectosConProspecto
    });

    // Verificar proyectos sin medidas
    const proyectosSinMedidas = await Proyecto.countDocuments({
      $or: [
        { medidas: { $exists: false } },
        { medidas: { $size: 0 } }
      ]
    });

    const logMethod = proyectosSinMedidas > 0 ? 'warn' : 'info';
    logger[logMethod]('Proyectos sin medidas detectados', {
      script: 'migrarDatos',
      etapa: 'verificarIntegridad',
      proyectosSinMedidas
    });

    // Verificar estados
    const estadosProyectos = await Proyecto.aggregate([
      { $group: { _id: '$estado', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    estadosProyectos.forEach(estado => {
      logger.info('Distribución de proyectos por estado', {
        script: 'migrarDatos',
        etapa: 'verificarIntegridad',
        estado: estado._id || 'sin_estado',
        total: estado.count
      });
    });

    // Verificar tipos de fuente
    const tiposFuente = await Proyecto.aggregate([
      { $group: { _id: '$tipo_fuente', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    tiposFuente.forEach(tipo => {
      logger.info('Distribución de proyectos por tipo de fuente', {
        script: 'migrarDatos',
        etapa: 'verificarIntegridad',
        tipoFuente: tipo._id || 'sin_tipo',
        total: tipo.count
      });
    });

  } catch (error) {
    logger.error('Error verificando integridad de datos', {
      script: 'migrarDatos',
      etapa: 'verificarIntegridad',
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

async function limpiarDuplicados() {
  try {
    logger.info('Iniciando limpieza de proyectos duplicados', {
      script: 'migrarDatos',
      etapa: 'limpiarDuplicados'
    });

    // Buscar proyectos duplicados por prospecto_original
    const duplicados = await Proyecto.aggregate([
      {
        $match: {
          prospecto_original: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$prospecto_original',
          proyectos: { $push: { id: '$_id', fecha: '$fecha_creacion' } },
          count: { $sum: 1 }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]);

    logger.info('Proyectos duplicados detectados por prospecto', {
      script: 'migrarDatos',
      etapa: 'limpiarDuplicados',
      prospectosDuplicados: duplicados.length
    });

    let eliminados = 0;

    for (const grupo of duplicados) {
      // Ordenar por fecha y mantener el más reciente
      grupo.proyectos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      
      // Eliminar todos excepto el primero (más reciente)
      for (let i = 1; i < grupo.proyectos.length; i++) {
        await Proyecto.findByIdAndDelete(grupo.proyectos[i].id);
        eliminados++;
        logger.warn('Proyecto duplicado eliminado', {
          script: 'migrarDatos',
          etapa: 'limpiarDuplicados',
          prospectoId: grupo._id,
          proyectoEliminado: grupo.proyectos[i].id,
          proyectoConservado: grupo.proyectos[0].id
        });
      }
    }

    logger.info('Resumen de limpieza de duplicados', {
      script: 'migrarDatos',
      etapa: 'limpiarDuplicados',
      proyectosEliminados: eliminados
    });

  } catch (error) {
    logger.error('Error durante la limpieza de duplicados', {
      script: 'migrarDatos',
      etapa: 'limpiarDuplicados',
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

async function actualizarIndices() {
  try {
    logger.info('Iniciando actualización de índices de base de datos', {
      script: 'migrarDatos',
      etapa: 'actualizarIndices'
    });

    // Crear índices para Proyecto
    await Proyecto.collection.createIndex({ prospecto_original: 1 });
    await Proyecto.collection.createIndex({ estado: 1 });
    await Proyecto.collection.createIndex({ tipo_fuente: 1 });
    await Proyecto.collection.createIndex({ fecha_creacion: -1 });
    await Proyecto.collection.createIndex({ 'cliente.nombre': 'text', 'cliente.telefono': 'text' });

    logger.info('Índices de base de datos actualizados', {
      script: 'migrarDatos',
      etapa: 'actualizarIndices',
      indices: [
        'prospecto_original',
        'estado',
        'tipo_fuente',
        'fecha_creacion',
        'cliente.nombre/cliente.telefono'
      ]
    });

  } catch (error) {
    logger.error('Error actualizando índices de proyecto', {
      script: 'migrarDatos',
      etapa: 'actualizarIndices',
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

async function generarReporte() {
  try {
    logger.info('Generando reporte final de la migración', {
      script: 'migrarDatos',
      etapa: 'generarReporte'
    });

    const reporte = {
      fecha_migracion: new Date(),
      estadisticas: {
        total_prospectos: await Prospecto.countDocuments({}),
        total_proyectos: await Proyecto.countDocuments({}),
        proyectos_vinculados: await Proyecto.countDocuments({ 
          prospecto_original: { $exists: true, $ne: null } 
        }),
        proyectos_con_medidas: await Proyecto.countDocuments({
          medidas: { $exists: true, $ne: [], $size: { $gt: 0 } }
        })
      },
      estados: await Proyecto.aggregate([
        { $group: { _id: '$estado', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      tipos_fuente: await Proyecto.aggregate([
        { $group: { _id: '$tipo_fuente', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    };

    logger.info('Reporte final de migración generado', {
      script: 'migrarDatos',
      etapa: 'generarReporte',
      fecha: reporte.fecha_migracion,
      estadisticas: reporte.estadisticas,
      estados: reporte.estados,
      tiposFuente: reporte.tipos_fuente
    });

    // Guardar reporte en archivo
    const fs = require('fs');
    const path = require('path');
    
    const reportePath = path.join(__dirname, `reporte-migracion-${Date.now()}.json`);
    fs.writeFileSync(reportePath, JSON.stringify(reporte, null, 2));
    
    logger.info('Reporte de migración almacenado en archivo', {
      script: 'migrarDatos',
      etapa: 'generarReporte',
      rutaReporte: reportePath
    });

  } catch (error) {
    logger.error('Error generando reporte final de migración', {
      script: 'migrarDatos',
      etapa: 'generarReporte',
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

async function main() {
  try {
    logger.info('Iniciando migración al sistema unificado SUNDECK', {
      script: 'migrarDatos',
      etapa: 'inicio'
    });

    await conectarBaseDatos();

    // Ejecutar migración paso a paso
    await migrarProspectosAProyectos();
    await limpiarDuplicados();
    await verificarIntegridad();
    await actualizarIndices();
    await generarReporte();

    logger.info('Migración completada exitosamente', {
      script: 'migrarDatos',
      etapa: 'finalizacion',
      mensaje: 'El sistema unificado está listo para usar',
      rutasDisponibles: ['/proyectos']
    });

  } catch (error) {
    logger.error('Error crítico durante la migración al sistema unificado', {
      script: 'migrarDatos',
      etapa: 'finalizacion',
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    logger.info('Conexión a MongoDB cerrada tras migración', {
      script: 'migrarDatos',
      etapa: 'finalizacion'
    });
  }
}

// Ejecutar migración si se llama directamente
if (require.main === module) {
  main();
}

module.exports = {
  migrarProspectosAProyectos,
  verificarIntegridad,
  limpiarDuplicados,
  actualizarIndices,
  generarReporte
};

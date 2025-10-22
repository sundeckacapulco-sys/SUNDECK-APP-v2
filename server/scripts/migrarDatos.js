const mongoose = require('mongoose');
const Prospecto = require('../models/Prospecto');
const Proyecto = require('../models/Proyecto');
const Etapa = require('../models/Etapa');
const ProyectoSyncMiddleware = require('../middleware/proyectoSync');

/**
 * Script de migración para convertir datos existentes al sistema unificado
 * Ejecutar con: node server/scripts/migrarDatos.js
 */

async function conectarBaseDatos() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sundeck-crm');
    console.log('✅ Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    process.exit(1);
  }
}

async function migrarProspectosAProyectos() {
  try {
    console.log('🔄 Iniciando migración de Prospectos a Proyectos...');

    // Obtener todos los prospectos que no tengan proyecto asociado
    const prospectos = await Prospecto.find({}).lean();
    console.log(`📊 Encontrados ${prospectos.length} prospectos para revisar`);

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
          console.log(`🔄 Proyecto actualizado para prospecto: ${prospecto.nombre}`);
        } else {
          // Crear nuevo proyecto
          await ProyectoSyncMiddleware.sincronizarProspecto(prospecto, 'create');
          proyectosCreados++;
          console.log(`✅ Proyecto creado para prospecto: ${prospecto.nombre}`);
        }

        // Sincronizar medidas desde etapas
        const proyecto = await Proyecto.findOne({ prospecto_original: prospecto._id });
        if (proyecto) {
          await ProyectoSyncMiddleware.sincronizarMedidasDesdeEtapas(
            proyecto._id, 
            prospecto._id
          );
        }

      } catch (error) {
        console.error(`❌ Error procesando prospecto ${prospecto.nombre}:`, error.message);
        errores++;
      }
    }

    console.log('\n📊 RESUMEN DE MIGRACIÓN:');
    console.log(`✅ Proyectos creados: ${proyectosCreados}`);
    console.log(`🔄 Proyectos actualizados: ${proyectosActualizados}`);
    console.log(`❌ Errores: ${errores}`);
    console.log(`📈 Total procesados: ${proyectosCreados + proyectosActualizados + errores}`);

  } catch (error) {
    console.error('❌ Error en migración:', error);
    throw error;
  }
}

async function verificarIntegridad() {
  try {
    console.log('\n🔍 Verificando integridad de datos...');

    const totalProspectos = await Prospecto.countDocuments({});
    const totalProyectos = await Proyecto.countDocuments({});
    const proyectosConProspecto = await Proyecto.countDocuments({ 
      prospecto_original: { $exists: true, $ne: null } 
    });

    console.log(`📊 Total prospectos: ${totalProspectos}`);
    console.log(`📊 Total proyectos: ${totalProyectos}`);
    console.log(`📊 Proyectos vinculados a prospectos: ${proyectosConProspecto}`);

    // Verificar proyectos sin medidas
    const proyectosSinMedidas = await Proyecto.countDocuments({
      $or: [
        { medidas: { $exists: false } },
        { medidas: { $size: 0 } }
      ]
    });

    console.log(`⚠️ Proyectos sin medidas: ${proyectosSinMedidas}`);

    // Verificar estados
    const estadosProyectos = await Proyecto.aggregate([
      { $group: { _id: '$estado', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    console.log('\n📊 Distribución por estados:');
    estadosProyectos.forEach(estado => {
      console.log(`  ${estado._id}: ${estado.count}`);
    });

    // Verificar tipos de fuente
    const tiposFuente = await Proyecto.aggregate([
      { $group: { _id: '$tipo_fuente', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    console.log('\n📊 Distribución por tipo de fuente:');
    tiposFuente.forEach(tipo => {
      console.log(`  ${tipo._id}: ${tipo.count}`);
    });

  } catch (error) {
    console.error('❌ Error verificando integridad:', error);
    throw error;
  }
}

async function limpiarDuplicados() {
  try {
    console.log('\n🧹 Limpiando proyectos duplicados...');

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

    console.log(`🔍 Encontrados ${duplicados.length} prospectos con proyectos duplicados`);

    let eliminados = 0;

    for (const grupo of duplicados) {
      // Ordenar por fecha y mantener el más reciente
      grupo.proyectos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      
      // Eliminar todos excepto el primero (más reciente)
      for (let i = 1; i < grupo.proyectos.length; i++) {
        await Proyecto.findByIdAndDelete(grupo.proyectos[i].id);
        eliminados++;
        console.log(`🗑️ Eliminado proyecto duplicado: ${grupo.proyectos[i].id}`);
      }
    }

    console.log(`✅ Eliminados ${eliminados} proyectos duplicados`);

  } catch (error) {
    console.error('❌ Error limpiando duplicados:', error);
    throw error;
  }
}

async function actualizarIndices() {
  try {
    console.log('\n📇 Actualizando índices de base de datos...');

    // Crear índices para Proyecto
    await Proyecto.collection.createIndex({ prospecto_original: 1 });
    await Proyecto.collection.createIndex({ estado: 1 });
    await Proyecto.collection.createIndex({ tipo_fuente: 1 });
    await Proyecto.collection.createIndex({ fecha_creacion: -1 });
    await Proyecto.collection.createIndex({ 'cliente.nombre': 'text', 'cliente.telefono': 'text' });

    console.log('✅ Índices actualizados correctamente');

  } catch (error) {
    console.error('❌ Error actualizando índices:', error);
    throw error;
  }
}

async function generarReporte() {
  try {
    console.log('\n📋 Generando reporte final...');

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

    console.log('\n📊 REPORTE FINAL DE MIGRACIÓN:');
    console.log('================================');
    console.log(`Fecha: ${reporte.fecha_migracion.toLocaleString()}`);
    console.log(`Total prospectos: ${reporte.estadisticas.total_prospectos}`);
    console.log(`Total proyectos: ${reporte.estadisticas.total_proyectos}`);
    console.log(`Proyectos vinculados: ${reporte.estadisticas.proyectos_vinculados}`);
    console.log(`Proyectos con medidas: ${reporte.estadisticas.proyectos_con_medidas}`);
    
    console.log('\nDistribución por estados:');
    reporte.estados.forEach(estado => {
      console.log(`  ${estado._id}: ${estado.count}`);
    });

    console.log('\nDistribución por tipo de fuente:');
    reporte.tipos_fuente.forEach(tipo => {
      console.log(`  ${tipo._id}: ${tipo.count}`);
    });

    // Guardar reporte en archivo
    const fs = require('fs');
    const path = require('path');
    
    const reportePath = path.join(__dirname, `reporte-migracion-${Date.now()}.json`);
    fs.writeFileSync(reportePath, JSON.stringify(reporte, null, 2));
    
    console.log(`\n💾 Reporte guardado en: ${reportePath}`);

  } catch (error) {
    console.error('❌ Error generando reporte:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 INICIANDO MIGRACIÓN AL SISTEMA UNIFICADO SUNDECK');
    console.log('==================================================\n');

    await conectarBaseDatos();
    
    // Ejecutar migración paso a paso
    await migrarProspectosAProyectos();
    await limpiarDuplicados();
    await verificarIntegridad();
    await actualizarIndices();
    await generarReporte();

    console.log('\n🎉 ¡MIGRACIÓN COMPLETADA EXITOSAMENTE!');
    console.log('=====================================');
    console.log('El sistema unificado está listo para usar.');
    console.log('Puedes acceder al módulo de Proyectos en: /proyectos');

  } catch (error) {
    console.error('\n💥 ERROR CRÍTICO EN MIGRACIÓN:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado de MongoDB');
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

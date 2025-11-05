/**
 * Script de Ejecución: Consolidación Legacy → Moderno
 * 
 * Ejecuta la migración completa de ProyectoPedido.legacy a Pedido
 * y genera reporte de validación.
 * 
 * Uso: node server/scripts/ejecutarConsolidacionLegacy.js [limite]
 * 
 * @since 4 Nov 2025
 */

const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../config/logger');
const syncLegacyService = require('../services/syncLegacyService');

// Configuración de MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sundeck';

/**
 * Conectar a MongoDB
 */
async function conectarDB() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    logger.info('Conectado a MongoDB', {
      script: 'ejecutarConsolidacionLegacy',
      uri: MONGODB_URI.replace(/\/\/.*@/, '//***@') // Ocultar credenciales
    });
  } catch (error) {
    logger.error('Error conectando a MongoDB', {
      script: 'ejecutarConsolidacionLegacy',
      error: error.message
    });
    throw error;
  }
}

/**
 * Desconectar de MongoDB
 */
async function desconectarDB() {
  try {
    await mongoose.connection.close();
    logger.info('Desconectado de MongoDB', {
      script: 'ejecutarConsolidacionLegacy'
    });
  } catch (error) {
    logger.error('Error desconectando de MongoDB', {
      script: 'ejecutarConsolidacionLegacy',
      error: error.message
    });
  }
}

/**
 * Ejecutar migración completa
 */
async function ejecutarMigracion() {
  const limite = parseInt(process.argv[2]) || 100;
  
  console.log('\n=================================================');
  console.log('🔄 CONSOLIDACIÓN LEGACY → MODERNO');
  console.log('=================================================\n');
  
  try {
    // Conectar a BD
    await conectarDB();
    
    // Paso 1: Migrar datos
    console.log('📦 Paso 1/3: Migrando datos...\n');
    const resultadoMigracion = await syncLegacyService.migrarTodos(limite);
    
    console.log('\n✅ Migración completada:');
    console.log(`   - Total registros: ${resultadoMigracion.total}`);
    console.log(`   - Procesados: ${resultadoMigracion.procesados}`);
    console.log(`   - Exitosos: ${resultadoMigracion.exitosos}`);
    console.log(`   - Actualizados: ${resultadoMigracion.actualizados}`);
    console.log(`   - Errores: ${resultadoMigracion.errores}`);
    
    if (resultadoMigracion.erroresDetalle && resultadoMigracion.erroresDetalle.length > 0) {
      console.log('\n⚠️  Errores detectados:');
      resultadoMigracion.erroresDetalle.slice(0, 5).forEach((e, i) => {
        console.log(`   ${i + 1}. ${e.numero}: ${e.error}`);
      });
      if (resultadoMigracion.erroresDetalle.length > 5) {
        console.log(`   ... y ${resultadoMigracion.erroresDetalle.length - 5} más`);
      }
    }
    
    // Paso 2: Validar integridad
    console.log('\n🔍 Paso 2/3: Validando integridad...\n');
    const resultadoValidacion = await syncLegacyService.validarMigracion();
    
    console.log(`\n${resultadoValidacion.estado === 'EXITOSO' ? '✅' : '⚠️'} Validación: ${resultadoValidacion.estado}`);
    console.log(`   - Registros legacy: ${resultadoValidacion.totales.legacy}`);
    console.log(`   - Registros modernos: ${resultadoValidacion.totales.moderno}`);
    console.log(`   - Diferencia: ${resultadoValidacion.totales.diferencia}`);
    console.log(`   - Monto legacy: $${resultadoValidacion.montos.legacy.toLocaleString('es-MX', {minimumFractionDigits: 2})}`);
    console.log(`   - Monto moderno: $${resultadoValidacion.montos.moderno.toLocaleString('es-MX', {minimumFractionDigits: 2})}`);
    console.log(`   - Diferencia: $${resultadoValidacion.montos.diferencia.toLocaleString('es-MX', {minimumFractionDigits: 2})}`);
    
    if (resultadoValidacion.discrepancias.length > 0) {
      console.log(`\n⚠️  ${resultadoValidacion.discrepancias.length} discrepancia(s) detectada(s):`);
      resultadoValidacion.discrepancias.forEach((d, i) => {
        console.log(`   ${i + 1}. ${d.tipo}: ${JSON.stringify(d, null, 2)}`);
      });
    }
    
    // Paso 3: Generar reporte
    console.log('\n📄 Paso 3/3: Generando reporte...\n');
    const reporte = await syncLegacyService.generarReporte();
    
    // Guardar reporte
    const docsDir = path.join(__dirname, '../../docs');
    const reportePath = path.join(docsDir, 'consolidacion_resultados.md');
    
    await fs.writeFile(reportePath, reporte, 'utf8');
    
    console.log(`✅ Reporte generado: ${reportePath}\n`);
    
    // Resumen final
    console.log('=================================================');
    console.log('✅ CONSOLIDACIÓN COMPLETADA');
    console.log('=================================================\n');
    console.log(`Estado: ${resultadoValidacion.estado}`);
    console.log(`Migrados: ${resultadoMigracion.exitosos} nuevos + ${resultadoMigracion.actualizados} actualizados`);
    console.log(`Errores: ${resultadoMigracion.errores}`);
    console.log(`Discrepancias: ${resultadoValidacion.discrepancias.length}`);
    console.log(`\nReporte completo: docs/consolidacion_resultados.md\n`);
    
    // Recomendaciones
    if (resultadoValidacion.estado === 'EXITOSO' && resultadoMigracion.errores === 0) {
      console.log('✅ RECOMENDACIÓN: La migración fue exitosa.');
      console.log('   Próximos pasos:');
      console.log('   1. Revisar el reporte en docs/consolidacion_resultados.md');
      console.log('   2. Monitorear KPIs por 1 semana');
      console.log('   3. Desactivar rutas legacy');
      console.log('   4. Eliminar código legacy\n');
    } else {
      console.log('⚠️  RECOMENDACIÓN: Revisar discrepancias antes de continuar.');
      console.log('   1. Analizar errores en el reporte');
      console.log('   2. Corregir datos problemáticos');
      console.log('   3. Re-ejecutar migración\n');
    }
    
    // Desconectar
    await desconectarDB();
    
    // Exit code según resultado
    process.exit(resultadoValidacion.estado === 'EXITOSO' && resultadoMigracion.errores === 0 ? 0 : 1);
    
  } catch (error) {
    console.error('\n❌ ERROR EN CONSOLIDACIÓN:', error.message);
    console.error(error.stack);
    
    logger.error('Error fatal en consolidación', {
      script: 'ejecutarConsolidacionLegacy',
      error: error.message,
      stack: error.stack
    });
    
    await desconectarDB();
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  ejecutarMigracion();
}

module.exports = { ejecutarMigracion };

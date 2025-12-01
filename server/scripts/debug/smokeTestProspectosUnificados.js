/**
 * SMOKE TEST: MÓDULO DE PROSPECTOS UNIFICADOS
 * Valida la integración completa del módulo
 */

const mongoose = require('mongoose');
const Proyecto = require('../models/Proyecto');
const logger = require('../config/logger');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function smokeTest() {
  try {
    await mongoose.connect('mongodb://localhost:27017/sundeck');
    log('\n✅ Conectado a MongoDB\n', 'green');

    let testProspectoId = null;
    let errores = 0;
    let exitos = 0;

    // TEST 1: Crear prospecto
    log('🧪 TEST 1: Crear prospecto con tipo="prospecto"', 'cyan');
    try {
      const nuevoProspecto = new Proyecto({
        tipo: 'prospecto',
        cliente: {
          nombre: 'Test Cliente Prospecto',
          telefono: '6641234567'
        },
        asesorComercial: new mongoose.Types.ObjectId(),
        origenComercial: {
          fuente: 'web',
          fechaPrimerContacto: new Date()
        },
        estadoComercial: 'en seguimiento',
        creado_por: new mongoose.Types.ObjectId()
      });

      await nuevoProspecto.save();
      testProspectoId = nuevoProspecto._id;
      
      log(`   ✅ Prospecto creado: ${nuevoProspecto._id}`, 'green');
      log(`   📋 Número: ${nuevoProspecto.numero}`, 'blue');
      log(`   👤 Cliente: ${nuevoProspecto.cliente.nombre}`, 'blue');
      log(`   📊 Estado: ${nuevoProspecto.estadoComercial}`, 'blue');
      exitos++;
    } catch (error) {
      log(`   ❌ Error: ${error.message}`, 'red');
      errores++;
    }

    // TEST 2: Verificar que se guardó correctamente
    log('\n🧪 TEST 2: Verificar prospecto en BD', 'cyan');
    try {
      const prospecto = await Proyecto.findById(testProspectoId);
      
      if (!prospecto) {
        throw new Error('Prospecto no encontrado en BD');
      }
      
      if (prospecto.tipo !== 'prospecto') {
        throw new Error(`Tipo incorrecto: ${prospecto.tipo}`);
      }
      
      if (prospecto.estadoComercial !== 'en seguimiento') {
        throw new Error(`Estado incorrecto: ${prospecto.estadoComercial}`);
      }
      
      log(`   ✅ Prospecto verificado en BD`, 'green');
      log(`   📋 Tipo: ${prospecto.tipo}`, 'blue');
      log(`   📊 Estado comercial: ${prospecto.estadoComercial}`, 'blue');
      exitos++;
    } catch (error) {
      log(`   ❌ Error: ${error.message}`, 'red');
      errores++;
    }

    // TEST 3: Agregar nota de seguimiento
    log('\n🧪 TEST 3: Agregar nota de seguimiento', 'cyan');
    try {
      const prospecto = await Proyecto.findById(testProspectoId);
      
      prospecto.seguimiento.push({
        autor: new mongoose.Types.ObjectId(),
        mensaje: 'Primera llamada realizada - Cliente interesado',
        tipo: 'llamada',
        fecha: new Date()
      });
      
      prospecto.ultimaNota = new Date();
      await prospecto.save();
      
      log(`   ✅ Nota agregada exitosamente`, 'green');
      log(`   📝 Total de notas: ${prospecto.seguimiento.length}`, 'blue');
      log(`   📅 Última nota: ${prospecto.ultimaNota}`, 'blue');
      exitos++;
    } catch (error) {
      log(`   ❌ Error: ${error.message}`, 'red');
      errores++;
    }

    // TEST 4: Convertir a proyecto
    log('\n🧪 TEST 4: Convertir prospecto a proyecto', 'cyan');
    try {
      const prospecto = await Proyecto.findById(testProspectoId);
      
      prospecto.tipo = 'proyecto';
      prospecto.estadoComercial = 'convertido';
      prospecto.seguimiento.push({
        autor: new mongoose.Types.ObjectId(),
        mensaje: 'Prospecto convertido a proyecto formal',
        tipo: 'nota',
        fecha: new Date()
      });
      
      await prospecto.save();
      
      log(`   ✅ Prospecto convertido a proyecto`, 'green');
      log(`   📋 Tipo: ${prospecto.tipo}`, 'blue');
      log(`   📊 Estado comercial: ${prospecto.estadoComercial}`, 'blue');
      exitos++;
    } catch (error) {
      log(`   ❌ Error: ${error.message}`, 'red');
      errores++;
    }

    // TEST 5: Verificar conversión
    log('\n🧪 TEST 5: Verificar conversión en BD', 'cyan');
    try {
      const proyecto = await Proyecto.findById(testProspectoId);
      
      if (proyecto.tipo !== 'proyecto') {
        throw new Error(`Tipo no convertido: ${proyecto.tipo}`);
      }
      
      if (proyecto.estadoComercial !== 'convertido') {
        throw new Error(`Estado no actualizado: ${proyecto.estadoComercial}`);
      }
      
      log(`   ✅ Conversión verificada`, 'green');
      log(`   📋 Tipo: ${proyecto.tipo}`, 'blue');
      log(`   📊 Estado: ${proyecto.estadoComercial}`, 'blue');
      log(`   📝 Notas de seguimiento: ${proyecto.seguimiento.length}`, 'blue');
      exitos++;
    } catch (error) {
      log(`   ❌ Error: ${error.message}`, 'red');
      errores++;
    }

    // TEST 6: Contar prospectos y proyectos
    log('\n🧪 TEST 6: Conteo de prospectos y proyectos', 'cyan');
    try {
      const [totalProspectos, totalProyectos, totalConvertidos] = await Promise.all([
        Proyecto.countDocuments({ tipo: 'prospecto' }),
        Proyecto.countDocuments({ tipo: 'proyecto' }),
        Proyecto.countDocuments({ estadoComercial: 'convertido' })
      ]);
      
      log(`   ✅ Conteo realizado`, 'green');
      log(`   📊 Total prospectos: ${totalProspectos}`, 'blue');
      log(`   📊 Total proyectos: ${totalProyectos}`, 'blue');
      log(`   📊 Total convertidos: ${totalConvertidos}`, 'blue');
      
      const conversionRate = (totalProspectos + totalProyectos) > 0 
        ? ((totalConvertidos / (totalProspectos + totalProyectos)) * 100).toFixed(2)
        : 0;
      
      log(`   📈 Tasa de conversión: ${conversionRate}%`, 'blue');
      exitos++;
    } catch (error) {
      log(`   ❌ Error: ${error.message}`, 'red');
      errores++;
    }

    // TEST 7: Limpiar datos de prueba
    log('\n🧪 TEST 7: Limpiar datos de prueba', 'cyan');
    try {
      await Proyecto.findByIdAndDelete(testProspectoId);
      log(`   ✅ Datos de prueba eliminados`, 'green');
      exitos++;
    } catch (error) {
      log(`   ❌ Error: ${error.message}`, 'red');
      errores++;
    }

    // Resumen
    log('\n' + '='.repeat(60), 'cyan');
    log('📊 RESUMEN DE SMOKE TESTS', 'cyan');
    log('='.repeat(60), 'cyan');
    log(`✅ Tests exitosos: ${exitos}`, exitos === 7 ? 'green' : 'yellow');
    log(`❌ Tests fallidos: ${errores}`, errores === 0 ? 'green' : 'red');
    log(`📈 Tasa de éxito: ${((exitos / 7) * 100).toFixed(2)}%`, exitos === 7 ? 'green' : 'yellow');
    log('='.repeat(60) + '\n', 'cyan');

    if (exitos === 7) {
      log('🎉 TODOS LOS TESTS PASARON EXITOSAMENTE\n', 'green');
      log('✅ El módulo de Prospectos Unificados está funcionando correctamente\n', 'green');
    } else {
      log('⚠️  ALGUNOS TESTS FALLARON\n', 'yellow');
      log('Por favor, revisa los errores arriba\n', 'yellow');
    }

    await mongoose.connection.close();
    process.exit(exitos === 7 ? 0 : 1);

  } catch (error) {
    log(`\n❌ Error fatal: ${error.message}\n`, 'red');
    logger.error('Error en smoke test de prospectos', {
      script: 'smokeTestProspectosUnificados',
      error: error.message,
      stack: error.stack
    });
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Ejecutar smoke test
smokeTest();

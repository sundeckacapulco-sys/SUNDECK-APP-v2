/**
 * VALIDACIÓN: MODELO PROYECTO.JS ACTUALIZADO
 * Verifica la estructura base definitiva sin campo medidas
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

async function validarModelo() {
  try {
    await mongoose.connect('mongodb://localhost:27017/sundeck');
    log('\n✅ Conectado a MongoDB\n', 'green');

    let testProyectoId = null;
    let errores = 0;
    let exitos = 0;

    // TEST 1: Verificar que campo medidas NO existe en schema
    log('🧪 TEST 1: Verificar eliminación de campo "medidas"', 'cyan');
    try {
      const schema = Proyecto.schema.obj;
      
      if (schema.medidas) {
        throw new Error('Campo "medidas" aún existe en el schema');
      }
      
      log('   ✅ Campo "medidas" eliminado correctamente', 'green');
      exitos++;
    } catch (error) {
      log(`   ❌ Error: ${error.message}`, 'red');
      errores++;
    }

    // TEST 2: Verificar que historialEstados existe
    log('\n🧪 TEST 2: Verificar campo "historialEstados"', 'cyan');
    try {
      const schema = Proyecto.schema.obj;
      
      if (!schema.historialEstados) {
        throw new Error('Campo "historialEstados" no existe');
      }
      
      log('   ✅ Campo "historialEstados" presente en schema', 'green');
      exitos++;
    } catch (error) {
      log(`   ❌ Error: ${error.message}`, 'red');
      errores++;
    }

    // TEST 3: Crear prospecto tipo="prospecto" por defecto
    log('\n🧪 TEST 3: Crear prospecto con tipo por defecto', 'cyan');
    try {
      const nuevoProspecto = new Proyecto({
        cliente: {
          nombre: 'Test Validación Modelo',
          telefono: '6641111111'
        },
        creado_por: new mongoose.Types.ObjectId()
      });

      await nuevoProspecto.save();
      testProyectoId = nuevoProspecto._id;
      
      if (nuevoProspecto.tipo !== 'prospecto') {
        throw new Error(`Tipo incorrecto: ${nuevoProspecto.tipo}, esperado: prospecto`);
      }
      
      log(`   ✅ Prospecto creado con tipo="prospecto" por defecto`, 'green');
      log(`   📋 ID: ${nuevoProspecto._id}`, 'blue');
      log(`   📋 Número: ${nuevoProspecto.numero}`, 'blue');
      log(`   📊 Tipo: ${nuevoProspecto.tipo}`, 'blue');
      exitos++;
    } catch (error) {
      log(`   ❌ Error: ${error.message}`, 'red');
      errores++;
    }

    // TEST 4: Verificar historialEstados inicial
    log('\n🧪 TEST 4: Verificar historialEstados inicial', 'cyan');
    try {
      const prospecto = await Proyecto.findById(testProyectoId);
      
      if (!prospecto.historialEstados || prospecto.historialEstados.length === 0) {
        throw new Error('historialEstados vacío en nuevo prospecto');
      }
      
      const estadoInicial = prospecto.historialEstados[0];
      
      if (estadoInicial.estado !== 'en seguimiento') {
        throw new Error(`Estado inicial incorrecto: ${estadoInicial.estado}`);
      }
      
      if (estadoInicial.observaciones !== 'Prospecto creado') {
        throw new Error(`Observación incorrecta: ${estadoInicial.observaciones}`);
      }
      
      log(`   ✅ historialEstados inicializado correctamente`, 'green');
      log(`   📝 Estado inicial: ${estadoInicial.estado}`, 'blue');
      log(`   📝 Observación: ${estadoInicial.observaciones}`, 'blue');
      log(`   📅 Fecha: ${estadoInicial.fecha}`, 'blue');
      exitos++;
    } catch (error) {
      log(`   ❌ Error: ${error.message}`, 'red');
      errores++;
    }

    // TEST 5: Actualizar estadoComercial y verificar historial
    log('\n🧪 TEST 5: Actualizar estadoComercial y verificar historial', 'cyan');
    try {
      const prospecto = await Proyecto.findById(testProyectoId);
      
      prospecto.estadoComercial = 'cotizado';
      prospecto.actualizado_por = new mongoose.Types.ObjectId();
      await prospecto.save();
      
      // Recargar para verificar
      const prospectoActualizado = await Proyecto.findById(testProyectoId);
      
      if (prospectoActualizado.historialEstados.length !== 2) {
        throw new Error(`Historial incorrecto: ${prospectoActualizado.historialEstados.length} registros, esperado: 2`);
      }
      
      const ultimoCambio = prospectoActualizado.historialEstados[1];
      
      if (ultimoCambio.estado !== 'cotizado') {
        throw new Error(`Estado en historial incorrecto: ${ultimoCambio.estado}`);
      }
      
      log(`   ✅ historialEstados actualizado automáticamente`, 'green');
      log(`   📝 Total de cambios: ${prospectoActualizado.historialEstados.length}`, 'blue');
      log(`   📝 Último estado: ${ultimoCambio.estado}`, 'blue');
      log(`   📝 Observación: ${ultimoCambio.observaciones}`, 'blue');
      exitos++;
    } catch (error) {
      log(`   ❌ Error: ${error.message}`, 'red');
      errores++;
    }

    // TEST 6: Verificar relaciones con cotizaciones y pedidos
    log('\n🧪 TEST 6: Verificar relaciones con cotizaciones y pedidos', 'cyan');
    try {
      const schema = Proyecto.schema.obj;
      
      if (!schema.cotizaciones) {
        throw new Error('Relación con cotizaciones no existe');
      }
      
      if (!schema.pedidos) {
        throw new Error('Relación con pedidos no existe');
      }
      
      log('   ✅ Relaciones con cotizaciones y pedidos intactas', 'green');
      exitos++;
    } catch (error) {
      log(`   ❌ Error: ${error.message}`, 'red');
      errores++;
    }

    // TEST 7: Verificar campo levantamiento existe
    log('\n🧪 TEST 7: Verificar campo "levantamiento"', 'cyan');
    try {
      const schema = Proyecto.schema.obj;
      
      if (!schema.levantamiento) {
        throw new Error('Campo "levantamiento" no existe');
      }
      
      log('   ✅ Campo "levantamiento" presente (reemplazo de medidas)', 'green');
      exitos++;
    } catch (error) {
      log(`   ❌ Error: ${error.message}`, 'red');
      errores++;
    }

    // TEST 8: Verificar campos de trazabilidad comercial
    log('\n🧪 TEST 8: Verificar campos de trazabilidad comercial', 'cyan');
    try {
      const schema = Proyecto.schema.obj;
      
      const camposRequeridos = [
        'tipo',
        'estadoComercial',
        'origenComercial',
        'asesorComercial',
        'seguimiento',
        'probabilidadCierre',
        'ultimaNota',
        'historialEstados'
      ];
      
      const faltantes = [];
      camposRequeridos.forEach(campo => {
        if (!schema[campo]) {
          faltantes.push(campo);
        }
      });
      
      if (faltantes.length > 0) {
        throw new Error(`Campos faltantes: ${faltantes.join(', ')}`);
      }
      
      log('   ✅ Todos los campos de trazabilidad comercial presentes', 'green');
      log(`   📋 Campos verificados: ${camposRequeridos.length}`, 'blue');
      exitos++;
    } catch (error) {
      log(`   ❌ Error: ${error.message}`, 'red');
      errores++;
    }

    // TEST 9: Limpiar datos de prueba
    log('\n🧪 TEST 9: Limpiar datos de prueba', 'cyan');
    try {
      await Proyecto.findByIdAndDelete(testProyectoId);
      log('   ✅ Datos de prueba eliminados', 'green');
      exitos++;
    } catch (error) {
      log(`   ❌ Error: ${error.message}`, 'red');
      errores++;
    }

    // Resumen
    log('\n' + '='.repeat(60), 'cyan');
    log('📊 RESUMEN DE VALIDACIÓN', 'cyan');
    log('='.repeat(60), 'cyan');
    log(`✅ Tests exitosos: ${exitos}`, exitos === 9 ? 'green' : 'yellow');
    log(`❌ Tests fallidos: ${errores}`, errores === 0 ? 'green' : 'red');
    log(`📈 Tasa de éxito: ${((exitos / 9) * 100).toFixed(2)}%`, exitos === 9 ? 'green' : 'yellow');
    log('='.repeat(60) + '\n', 'cyan');

    if (exitos === 9) {
      log('🎉 MODELO PROYECTO.JS ACTUALIZADO CORRECTAMENTE\n', 'green');
      log('✅ Campo "medidas" eliminado', 'green');
      log('✅ Campo "historialEstados" operativo', 'green');
      log('✅ Trazabilidad comercial activa', 'green');
      log('✅ Flujo técnico sin cambios\n', 'green');
    } else {
      log('⚠️  ALGUNOS TESTS FALLARON\n', 'yellow');
      log('Por favor, revisa los errores arriba\n', 'yellow');
    }

    await mongoose.connection.close();
    process.exit(exitos === 9 ? 0 : 1);

  } catch (error) {
    log(`\n❌ Error fatal: ${error.message}\n`, 'red');
    logger.error('Error en validación de modelo', {
      script: 'validarModeloProyectoActualizado',
      error: error.message,
      stack: error.stack
    });
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Ejecutar validación
validarModelo();

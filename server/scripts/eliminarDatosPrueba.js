/**
 * Script para eliminar todos los datos de prueba
 */

const mongoose = require('mongoose');
const Proyecto = require('../models/Proyecto');
const Cotizacion = require('../models/Cotizacion');
const Pedido = require('../models/Pedido');
const Prospecto = require('../models/Prospecto');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function eliminarDatos() {
  try {
    await mongoose.connect('mongodb://localhost:27017/sundeck');
    log('\n✅ Conectado a MongoDB\n', 'green');

    log('🗑️  Eliminando datos de prueba...', 'yellow');

    // Eliminar datos de prueba
    const resultProspectos = await Prospecto.deleteMany({ nombre: 'Juan Pérez García' });
    const resultProyectos = await Proyecto.deleteMany({ numero: /^PROY-TEST/ });
    const resultCotizaciones = await Cotizacion.deleteMany({ numero: /^COT-TEST/ });
    const resultPedidos = await Pedido.deleteMany({ numero: /^PED-TEST/ });

    log('\n📊 DATOS ELIMINADOS:', 'cyan');
    log(`   Prospectos: ${resultProspectos.deletedCount}`, 'reset');
    log(`   Proyectos: ${resultProyectos.deletedCount}`, 'reset');
    log(`   Cotizaciones: ${resultCotizaciones.deletedCount}`, 'reset');
    log(`   Pedidos: ${resultPedidos.deletedCount}`, 'reset');

    log('\n✅ Datos de prueba eliminados exitosamente\n', 'green');

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    log(`\n❌ Error: ${error.message}\n`, 'red');
    await mongoose.connection.close();
    process.exit(1);
  }
}

eliminarDatos();

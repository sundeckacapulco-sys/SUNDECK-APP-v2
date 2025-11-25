const mongoose = require('mongoose');
const Almacen = require('../models/Almacen');
const SobranteMaterial = require('../models/SobranteMaterial');
const MovimientoAlmacen = require('../models/MovimientoAlmacen');

async function resetAlmacen() {
  try {
    await mongoose.connect('mongodb://localhost:27017/sundeck-crm');
    console.log('🔌 Conectado a MongoDB');

    console.log('🧹 Limpiando Almacén (Inventario)...');
    const resAlmacen = await Almacen.deleteMany({});
    console.log(`   - Eliminados ${resAlmacen.deletedCount} items de inventario.`);

    console.log('🧹 Limpiando Sobrantes...');
    const resSobrantes = await SobranteMaterial.deleteMany({});
    console.log(`   - Eliminados ${resSobrantes.deletedCount} sobrantes.`);

    console.log('🧹 Limpiando Historial de Movimientos...');
    const resMovimientos = await MovimientoAlmacen.deleteMany({});
    console.log(`   - Eliminados ${resMovimientos.deletedCount} registros de historial.`);

    console.log('✨ Almacén reseteado a 0 exitosamente.');
    console.log('📝 Nota: Las configuraciones de la calculadora NO han sido afectadas.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado');
  }
}

resetAlmacen();

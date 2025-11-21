const mongoose = require('mongoose');
const Proyecto = require('../models/Proyecto');

async function ver() {
  await mongoose.connect('mongodb://localhost:27017/sundeck');
  
  const proyecto = await Proyecto.findOne({ numero: '2025-ARQ-HECTOR-003' });
  
  if (!proyecto) {
    console.log('❌ Proyecto 2025-ARQ-HECTOR-003 NO encontrado');
    process.exit(1);
  }
  
  console.log('\n✅ PROYECTO ENCONTRADO\n');
  console.log('='.repeat(70));
  console.log(`ID: ${proyecto._id}`);
  console.log(`Número: ${proyecto.numero}`);
  console.log(`Cliente: ${proyecto.cliente?.nombre || 'N/A'}`);
  console.log(`Total piezas: ${proyecto.piezas?.length || 0}`);
  console.log('\n📋 PIEZAS CON ROTACIÓN:\n');
  
  proyecto.piezas.forEach((p, i) => {
    console.log(`${i + 1}. ${p.ubicacion || 'Sin ubicación'} - ${p.modelo || p.producto}`);
    console.log(`   Dimensiones: ${p.ancho}m × ${p.alto}m`);
    console.log(`   Producto: ${p.producto}`);
    console.log(`   Rotada: ${p.rotada !== undefined ? (p.rotada ? '✅ SÍ' : '❌ NO') : '⚠️  UNDEFINED'}`);
    console.log(`   Motorizado: ${p.motorizado ? 'SÍ' : 'NO'}`);
    console.log('');
  });
  
  console.log('='.repeat(70));
  
  await mongoose.disconnect();
  process.exit(0);
}

ver();

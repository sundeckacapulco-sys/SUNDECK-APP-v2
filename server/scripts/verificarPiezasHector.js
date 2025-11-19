const mongoose = require('mongoose');
const Proyecto = require('../models/Proyecto');

async function verificar() {
  await mongoose.connect('mongodb://localhost:27017/sundeck');
  
  const proyecto = await Proyecto.findById('690e69251346d61cfcd5178d');
  
  if (!proyecto) {
    console.log('❌ Proyecto no encontrado');
    process.exit(1);
  }
  
  console.log('\n📋 PIEZAS DEL PROYECTO:', proyecto.numero);
  console.log('='.repeat(70));
  
  proyecto.piezas.forEach((pieza, i) => {
    console.log(`\n${i + 1}. ${pieza.ubicacion || 'Sin ubicación'}`);
    console.log(`   Dimensiones: ${pieza.ancho}m × ${pieza.alto}m`);
    console.log(`   Producto: ${pieza.producto}`);
    console.log(`   Rotada: ${pieza.rotada ? '✅ SÍ' : '❌ NO (undefined o false)'}`);
    console.log(`   Motorizado: ${pieza.motorizado ? 'SÍ' : 'NO'}`);
  });
  
  console.log('\n' + '='.repeat(70));
  console.log(`\nTotal piezas: ${proyecto.piezas.length}`);
  console.log(`Piezas rotadas: ${proyecto.piezas.filter(p => p.rotada).length}`);
  
  await mongoose.disconnect();
  process.exit(0);
}

verificar();

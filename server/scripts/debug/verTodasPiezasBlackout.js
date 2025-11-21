const mongoose = require('mongoose');
const Proyecto = require('../models/Proyecto');
require('dotenv').config();

async function ver() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const proyecto = await Proyecto.findById('690e69251346d61cfcd5178d').lean();
  
  console.log('\n📋 TODAS LAS PIEZAS DE BLACKOUT:\n');
  console.log('='.repeat(70));
  
  const medidas = proyecto.medidas[0];
  let totalPiezas = 0;
  
  medidas.piezas.forEach(partida => {
    const piezasBlackout = partida.medidas.filter(m => m.producto === 'blackout');
    
    if (piezasBlackout.length > 0) {
      console.log(`\n📍 ${partida.ubicacion} (${piezasBlackout.length} piezas)`);
      
      piezasBlackout.forEach((m, i) => {
        totalPiezas++;
        console.log(`\n   ${totalPiezas}. ${m.ancho}m x ${m.alto}m`);
        console.log(`      Modelo: ${m.modeloCodigo} ${m.color}`);
        console.log(`      Modo: ${m.modoOperacion}`);
        console.log(`      Detalle: "${m.detalleTecnico}"`);
        console.log(`      Rotada: ${m.detalleTecnico === 'rotada' ? '✅ SÍ' : '❌ NO'}`);
      });
    }
  });
  
  console.log('\n' + '='.repeat(70));
  console.log(`\nTotal piezas blackout: ${totalPiezas}`);
  
  await mongoose.disconnect();
  process.exit(0);
}

ver();

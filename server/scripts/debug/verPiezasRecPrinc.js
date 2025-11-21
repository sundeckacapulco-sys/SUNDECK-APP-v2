const mongoose = require('mongoose');
const Proyecto = require('../models/Proyecto');
require('dotenv').config();

async function ver() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const proyecto = await Proyecto.findById('690e69251346d61cfcd5178d').lean();
  
  console.log('\n📋 PIEZAS DE REC PRINC:\n');
  
  const medidas = proyecto.medidas[0];
  const partidaRecPrinc = medidas.piezas.find(p => p.ubicacion.includes('Rec Princ'));
  
  if (partidaRecPrinc) {
    console.log(`Ubicación: ${partidaRecPrinc.ubicacion}`);
    console.log(`Total medidas: ${partidaRecPrinc.medidas.length}\n`);
    
    partidaRecPrinc.medidas.forEach((m, i) => {
      console.log(`${i + 1}. ${m.ancho}m x ${m.alto}m`);
      console.log(`   Producto: ${m.producto}`);
      console.log(`   Modelo: ${m.modeloCodigo}`);
      console.log(`   Modo operación: ${m.modoOperacion}`);
      console.log(`   Detalle técnico: "${m.detalleTecnico}"`);
      console.log(`   Rotada: ${m.detalleTecnico === 'rotada' ? '✅ SÍ' : '❌ NO'}`);
      console.log('');
    });
  }
  
  await mongoose.disconnect();
  process.exit(0);
}

ver();

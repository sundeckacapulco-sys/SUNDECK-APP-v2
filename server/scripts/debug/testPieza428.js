const mongoose = require('mongoose');
const OptimizadorCortesService = require('../services/optimizadorCortesService');
require('dotenv').config();

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  console.log('\n🧪 TEST PIEZA 4.28m x 2.80m\n');
  console.log('='.repeat(60));
  
  const materiales = await OptimizadorCortesService.calcularMaterialesPieza({
    ancho: 4.28,
    alto: 2.80,
    motorizado: true,
    sistema: 'Roller Shade',
    producto: 'blackout',
    rotada: true  // ✅ MARCADA COMO ROTADA
  });
  
  const tela = materiales.find(m => m.tipo === 'Tela');
  
  console.log(`\n📏 Pieza: 4.28m × 2.80m`);
  console.log(`   Rotada: SÍ`);
  
  if (tela) {
    console.log(`\n✅ Tela encontrada:`);
    console.log(`   Cantidad: ${tela.cantidad} ml`);
    console.log(`   Rotada en material: ${tela.rotada ? 'SÍ' : 'NO'}`);
    console.log(`   Esperado: 4.28 ml`);
    console.log(`   ${Math.abs(tela.cantidad - 4.28) < 0.01 ? '✅ CORRECTO' : '❌ INCORRECTO'}`);
  } else {
    console.log('\n❌ NO SE ENCONTRÓ TELA');
  }
  
  console.log('\n' + '='.repeat(60));
  
  await mongoose.disconnect();
  process.exit(0);
}

test();

const mongoose = require('mongoose');
const OptimizadorCortesService = require('../services/optimizadorCortesService');

async function test() {
  await mongoose.connect('mongodb://localhost:27017/sundeck');
  
  console.log('\n🧪 TEST DE ROTACIÓN\n');
  console.log('='.repeat(60));
  
  const piezas = [
    { ancho: 3.28, alto: 2.56, rotada: true, desc: 'Sala Comedor 1' },
    { ancho: 3.38, alto: 2.56, rotada: true, desc: 'Sala Comedor 2' },
    { ancho: 4.28, alto: 2.80, rotada: true, desc: 'Rec Principal 1' },
    { ancho: 1.32, alto: 2.80, rotada: false, desc: 'Rec Principal 2 (NO rotada)' }
  ];
  
  for (const p of piezas) {
    console.log(`\n📏 ${p.desc}: ${p.ancho}m × ${p.alto}m`);
    
    const materiales = await OptimizadorCortesService.calcularMaterialesPieza({
      ancho: p.ancho,
      alto: p.alto,
      motorizado: true,
      sistema: 'Roller Shade',
      producto: 'screen_5',
      rotada: p.rotada
    });
    
    const tela = materiales.find(m => m.tipo === 'Tela');
    
    if (tela) {
      console.log(`   Tela: ${tela.cantidad} ml`);
      console.log(`   Rotada: ${tela.rotada ? 'SÍ' : 'NO'}`);
      
      // Si está rotada, se pide solo el ancho. Si no, alto + 0.25
      const esperado = p.rotada ? p.ancho : (p.alto + 0.25);
      console.log(`   Esperado: ${esperado.toFixed(2)} ml`);
      
      const correcto = Math.abs(tela.cantidad - esperado) < 0.01;
      console.log(`   ${correcto ? '✅ CORRECTO' : '❌ INCORRECTO'}`);
    } else {
      console.log('   ❌ NO SE ENCONTRÓ TELA');
    }
  }
  
  console.log('\n' + '='.repeat(60));
  process.exit(0);
}

test();

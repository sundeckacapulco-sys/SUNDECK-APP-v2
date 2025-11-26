const OptimizadorCortesService = require('../services/optimizadorCortesService');

function runTest() {
  console.log('🧪 TEST: Optimización de Telas (Grupos A, B, C)');

  const anchoRollo = 2.50;
  const margen = 0.05; // Usando 5cm de margen para coincidir con ejemplo del usuario (1.20 -> 1.25)

  const piezas = [
    { ancho: 2.50, alto: 2.70, codigo: 'SCREEN', descripcion: 'Pieza Grande' },
    { ancho: 1.20, alto: 1.20, codigo: 'SCREEN', descripcion: 'Pieza Chica 1' },
    { ancho: 1.20, alto: 1.20, codigo: 'SCREEN', descripcion: 'Pieza Chica 2' }
  ];

  console.log('📦 Piezas de entrada:', piezas);

  const resultado = OptimizadorCortesService.optimizarCortesTela(piezas, anchoRollo, margen);

  console.log('\n📊 Resultado Optimización:');
  console.log(`Total Metros: ${resultado.totalMetrosLineales} ml`);
  console.log(`Total Grupos: ${resultado.totalGrupos}`);
  
  resultado.grupos.forEach(g => {
    console.log(`\n🟦 GRUPO ${g.letra} (Alto: ${g.alto}m, Corte: ${g.longitudCorte.toFixed(2)}ml)`);
    console.log(`   Ancho Acumulado: ${g.anchoAcumulado.toFixed(2)}m / ${g.anchoRollo}m`);
    console.log('   Lienzos:');
    g.piezas.forEach(p => {
      console.log(`   - ${p.ancho} x ${p.alto} (${p.descripcion})`);
    });
  });
}

runTest();

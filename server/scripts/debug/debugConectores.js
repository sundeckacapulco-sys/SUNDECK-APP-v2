const mongoose = require('mongoose');
const path = require('path');
const OrdenProduccionService = require('../services/ordenProduccionService');
const logger = require('../config/logger');

// Cargar variables de entorno desde la raíz del proyecto
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function debugConectores() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sundeck');
    
    const proyectoId = '690e69251346d61cfcd5178d'; // Hector Huerta
    
    console.log('\n🔍 DEBUG: Verificando conectores y topes\n');
    console.log('='.repeat(60));
    
    const datos = await OrdenProduccionService.obtenerDatosOrdenProduccion(proyectoId);
    
    console.log('\n📋 PIEZAS DEL PROYECTO:\n');
    datos.piezas.forEach(pieza => {
      console.log(`${pieza.numero}. ${pieza.ubicacion}`);
      console.log(`   Motorizado: ${pieza.motorizado ? 'SÍ' : 'NO'}`);
      console.log(`   Ancho: ${pieza.ancho}m | Alto: ${pieza.alto}m`);
      console.log('');
    });
    
    console.log('\n🔧 MATERIALES CONSOLIDADOS:\n');
    const conectores = datos.materialesConsolidados.filter(m => m.descripcion === 'Conector de cadena');
    const topes = datos.materialesConsolidados.filter(m => m.descripcion === 'Tope de cadena');
    
    console.log(`Conectores: ${conectores.length > 0 ? conectores[0].cantidad : 0} pza`);
    console.log(`Topes: ${topes.length > 0 ? topes[0].cantidad : 0} pza`);
    
    // Contar piezas manuales que deberían generar conectores/topes
    const piezasManuales = datos.piezas.filter(p => !p.motorizado);
    console.log(`\n📊 ANÁLISIS:`);
    console.log(`   Piezas manuales: ${piezasManuales.length}`);
    console.log(`   Conectores esperados: ${piezasManuales.length}`);
    console.log(`   Topes esperados: ${piezasManuales.length}`);
    
    if (piezasManuales.length > 0) {
      console.log('\n   Piezas manuales:');
      piezasManuales.forEach(p => {
        console.log(`    - Pieza ${p.numero}: ${p.ubicacion} (${p.ancho}m × ${p.alto}m)`);
      });
    }
    
    // Validación
    const conectoresOK = conectores.length > 0 && conectores[0].cantidad === piezasManuales.length;
    const topesOK = topes.length > 0 && topes[0].cantidad === piezasManuales.length;
    
    console.log(`\n✅ VALIDACIÓN:`);
    console.log(`   Conectores: ${conectoresOK ? '✅ CORRECTO' : '❌ INCORRECTO'}`);
    console.log(`   Topes: ${topesOK ? '✅ CORRECTO' : '❌ INCORRECTO'}`)
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Debug completado\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

debugConectores();

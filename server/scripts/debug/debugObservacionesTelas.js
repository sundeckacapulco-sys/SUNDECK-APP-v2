const mongoose = require('mongoose');
const path = require('path');
const OrdenProduccionService = require('../services/ordenProduccionService');

// Cargar variables de entorno desde la raíz del proyecto
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function debugObservacionesTelas() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sundeck');
    
    const proyectoId = '690e69251346d61cfcd5178d'; // Hector Huerta
    
    console.log('\n🔍 DEBUG: Observaciones de Telas\n');
    console.log('='.repeat(60));
    
    const datos = await OrdenProduccionService.obtenerDatosOrdenProduccion(proyectoId);
    
    console.log('\n📋 TELAS EN LISTA DE PEDIDO:\n');
    
    if (datos.listaPedido?.telas) {
      datos.listaPedido.telas.forEach((tela, index) => {
        console.log(`${index + 1}. ${tela.descripcion}`);
        console.log(`   Código: ${tela.codigo || 'N/A'}`);
        console.log(`   Modelo: ${tela.modelo || 'N/A'}`);
        console.log(`   Color: ${tela.color || 'N/A'}`);
        console.log(`   Metros lineales: ${tela.metrosLineales}ml`);
        console.log(`   Ancho de rollo: ${tela.anchoRollo}m`);
        console.log(`   Anchos disponibles: ${tela.anchosDisponibles || 'N/A'}`);
        console.log(`   Rollos necesarios: ${tela.rollosNecesarios}`);
        
        if (tela.anchosPiezas && tela.anchosPiezas.length > 0) {
          console.log(`   Anchos de piezas: [${tela.anchosPiezas.join(', ')}]m`);
        }
        
        console.log(`   📝 OBSERVACIONES:`);
        if (tela.observaciones) {
          console.log(`      "${tela.observaciones}"`);
        } else {
          console.log(`      ❌ NO HAY OBSERVACIONES`);
        }
        console.log('');
      });
    } else {
      console.log('   ❌ No hay telas en la lista de pedido');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Debug completado\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

debugObservacionesTelas();

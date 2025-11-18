const mongoose = require('mongoose');
const path = require('path');
const OrdenProduccionService = require('../services/ordenProduccionService');

// Cargar variables de entorno desde la raíz del proyecto
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function debugConsolidacion() {
  try {
    await mongoose.connect('mongodb://localhost:27017/sundeck');
    
    const proyectoId = '690e69251346d61cfcd5178d';
    
    console.log('\n🔍 DEBUG: Consolidación de materiales\n');
    console.log('='.repeat(60));
    
    const datos = await OrdenProduccionService.obtenerDatosOrdenProduccion(proyectoId);
    
    // Buscar conectores y topes en materiales consolidados
    const conectores = datos.materialesConsolidados.filter(m => m.descripcion.includes('Conector'));
    const topes = datos.materialesConsolidados.filter(m => m.descripcion.includes('Tope'));
    
    console.log('\n📦 MATERIALES CONSOLIDADOS:\n');
    console.log('Conectores encontrados:', conectores.length);
    conectores.forEach(c => {
      console.log(`  - ${c.descripcion}: ${c.cantidad} ${c.unidad}`);
      console.log(`    Tipo: ${c.tipo}`);
      console.log(`    Código: ${c.codigo || 'N/A'}`);
    });
    
    console.log('\nTopes encontrados:', topes.length);
    topes.forEach(t => {
      console.log(`  - ${t.descripcion}: ${t.cantidad} ${t.unidad}`);
      console.log(`    Tipo: ${t.tipo}`);
      console.log(`    Código: ${t.codigo || 'N/A'}`);
    });
    
    // Buscar en lista de pedido
    console.log('\n📋 LISTA DE PEDIDO - ACCESORIOS:\n');
    if (datos.listaPedido?.accesorios) {
      const accConectores = datos.listaPedido.accesorios.filter(a => a.descripcion.includes('Conector'));
      const accTopes = datos.listaPedido.accesorios.filter(a => a.descripcion.includes('Tope'));
      
      console.log('Conectores:', accConectores.length);
      accConectores.forEach(c => console.log(`  - ${c.descripcion}: ${c.cantidad} ${c.unidad}`));
      
      console.log('\nTopes:', accTopes.length);
      accTopes.forEach(t => console.log(`  - ${t.descripcion}: ${t.cantidad} ${t.unidad}`));
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

debugConsolidacion();

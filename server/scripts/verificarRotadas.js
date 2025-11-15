const mongoose = require('mongoose');
const Proyecto = require('../models/Proyecto');
require('dotenv').config();

async function verificarRotadas() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const proyecto = await Proyecto.findOne({ 'cliente.nombre': /Huerta/i });
    
    if (!proyecto) {
      console.log('❌ No se encontró proyecto de Huerta');
      process.exit(1);
    }
    
    console.log('\n📋 PIEZAS DEL PROYECTO HUERTA:\n');
    console.log('='.repeat(80));
    
    // Buscar en cotización.productos
    const productos = proyecto.cotizacion?.productos || [];
    
    if (productos.length === 0) {
      console.log('⚠️ No hay productos en cotización, buscando en levantamiento...\n');
    }
    
    productos.forEach((producto, i) => {
      console.log(`\n${i+1}. ${producto.ubicacion || 'Sin ubicación'}`);
      console.log(`   Ancho: ${producto.ancho}m | Alto: ${producto.alto}m`);
      console.log(`   Rotada: ${producto.rotada ? '✅ SÍ' : '❌ NO'}`);
      console.log(`   Motorizado: ${producto.motorizado ? '✅ SÍ' : '❌ NO'}`);
      console.log(`   Producto: ${producto.nombre || 'N/A'}`);
      
      // Calcular qué fórmula de tela se usaría
      const rotada = producto.rotada || false;
      const alto = producto.alto || 0;
      const ancho = producto.ancho || 0;
      const galeria = producto.galeria || false;
      
      if (rotada && alto <= 2.80) {
        console.log(`   📏 Tela: ${ancho} + 0.03 = ${(ancho + 0.03).toFixed(2)}ml (ROTADA - usa ANCHO)`);
      } else if (!rotada && galeria) {
        console.log(`   📏 Tela: ${alto} + 0.50 = ${(alto + 0.50).toFixed(2)}ml (con galería)`);
      } else if (!rotada && !galeria) {
        console.log(`   📏 Tela: ${alto} + 0.25 = ${(alto + 0.25).toFixed(2)}ml (normal - usa ALTO)`);
      }
    });
    
    console.log('\n\n📋 LEVANTAMIENTO (si existe):\n');
    console.log('='.repeat(80));
    
    proyecto.levantamiento.partidas.forEach((partida, i) => {
      console.log(`\n${i+1}. ${partida.ubicacion || 'Sin ubicación'}`);
      console.log(`   Ancho: ${partida.medidas?.ancho}m | Alto: ${partida.medidas?.alto}m`);
      console.log(`   Rotada: ${partida.medidas?.rotada ? '✅ SÍ' : '❌ NO'}`);
      console.log(`   Motorizado: ${partida.medidas?.modoOperacion === 'motorizado' ? '✅ SÍ' : '❌ NO'}`);
      console.log(`   Producto: ${partida.producto?.nombre || 'N/A'}`);
      
      // Calcular qué fórmula de tela se usaría
      const rotada = partida.medidas?.rotada || false;
      const alto = partida.medidas?.alto || 0;
      const ancho = partida.medidas?.ancho || 0;
      const galeria = partida.medidas?.galeria || false;
      
      if (rotada && alto <= 2.80) {
        console.log(`   📏 Tela: ${ancho} + 0.03 = ${(ancho + 0.03).toFixed(2)}ml (ROTADA)`);
      } else if (!rotada && galeria) {
        console.log(`   📏 Tela: ${alto} + 0.50 = ${(alto + 0.50).toFixed(2)}ml (con galería)`);
      } else if (!rotada && !galeria) {
        console.log(`   📏 Tela: ${alto} + 0.25 = ${(alto + 0.25).toFixed(2)}ml (normal)`);
      }
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Verificación completada\n');
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

verificarRotadas();

/**
 * Script para debug de piezas rotadas
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const mongoose = require('mongoose');
const ordenProduccionService = require('../services/ordenProduccionService');
const logger = require('../config/logger');

async function debugPiezasRotadas() {
  try {
    console.log('🔍 DEBUG: Piezas Rotadas\n');
    console.log('='.repeat(60));
    
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    
    const proyectoId = '690e69251346d61cfcd5178d'; // 2025-ARQ-HECTOR-003
    
    // Obtener datos de la orden
    const datosOrden = await ordenProduccionService.obtenerDatosOrdenProduccion(proyectoId);
    
    console.log('\n📋 PIEZAS EN LA ORDEN:\n');
    
    datosOrden.piezas.forEach((pieza, index) => {
      console.log(`${index + 1}. Pieza #${pieza.numero}`);
      console.log(`   Ubicación: ${pieza.ubicacion}`);
      console.log(`   Producto: ${pieza.producto || 'N/A'}`);
      console.log(`   Color: ${pieza.color || 'N/A'}`);
      console.log(`   Dimensiones: ${pieza.ancho}m × ${pieza.alto}m`);
      console.log(`   Motorizado: ${pieza.motorizado ? 'Sí' : 'No'}`);
      console.log(`   Galería: ${pieza.galeria || 'No'}`);
      console.log(`   🔄 ROTADA: ${pieza.rotada ? '✅ SÍ' : '❌ NO'}`);
      
      // Buscar material de tela
      const materialTela = pieza.materiales?.find(m => m.tipo === 'Tela');
      if (materialTela) {
        console.log(`   📦 Material Tela:`);
        console.log(`      - Descripción: ${materialTela.descripcion}`);
        console.log(`      - Cantidad: ${materialTela.cantidad} ${materialTela.unidad}`);
        console.log(`      - Metadata rotada: ${materialTela.metadata?.rotada ? '✅ SÍ' : '❌ NO'}`);
        if (materialTela.observaciones) {
          console.log(`      - Observaciones: ${materialTela.observaciones}`);
        }
      }
      
      console.log('');
    });
    
    console.log('='.repeat(60));
    console.log('✅ Debug completado');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

debugPiezasRotadas();

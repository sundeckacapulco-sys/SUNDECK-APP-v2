/**
 * Script de debug para verificar sugerencias en PDF de Orden de Producción
 * 
 * Uso: node server/scripts/debugSugerenciasPDF.js <proyectoId>
 */

const mongoose = require('mongoose');
const OrdenProduccionService = require('../services/ordenProduccionService');
const logger = require('../config/logger');

async function debugSugerencias(proyectoId) {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sundeck-crm');
    logger.info('Conectado a MongoDB');
    
    // Obtener datos de la orden
    const datosOrden = await OrdenProduccionService.obtenerDatosOrdenProduccion(proyectoId);
    
    console.log('\n=== DEBUG SUGERENCIAS PDF ===\n');
    console.log('Proyecto:', datosOrden.proyecto.numero);
    console.log('Total piezas:', datosOrden.totalPiezas);
    
    // Verificar si existe listaPedido
    if (!datosOrden.listaPedido) {
      console.log('\n❌ ERROR: No existe listaPedido en datosOrden');
      return;
    }
    
    console.log('\n✅ listaPedido existe');
    console.log('Telas en listaPedido:', datosOrden.listaPedido.telas?.length || 0);
    
    // Revisar cada tela
    if (datosOrden.listaPedido.telas && datosOrden.listaPedido.telas.length > 0) {
      console.log('\n=== ANÁLISIS DE TELAS ===\n');
      
      datosOrden.listaPedido.telas.forEach((tela, index) => {
        console.log(`\nTela ${index + 1}:`);
        console.log('  Descripción:', tela.descripcion);
        console.log('  Modelo:', tela.modelo);
        console.log('  Color:', tela.color);
        console.log('  Metros lineales:', tela.metrosLineales);
        console.log('  Ancho rollo:', tela.anchoRollo);
        console.log('  Piezas pequeñas:', tela.piezasPequenas);
        console.log('  Piezas grandes:', tela.piezasGrandes);
        
        // VERIFICAR SUGERENCIAS
        console.log('\n  🔍 SUGERENCIAS:');
        if (tela.sugerencias) {
          console.log('  ✅ Campo sugerencias existe');
          console.log('  Tipo:', typeof tela.sugerencias);
          console.log('  Es array:', Array.isArray(tela.sugerencias));
          console.log('  Longitud:', tela.sugerencias.length);
          
          if (tela.sugerencias.length > 0) {
            console.log('\n  📋 Contenido de sugerencias:');
            tela.sugerencias.forEach((sug, i) => {
              console.log(`    ${i + 1}. ${sug}`);
            });
          } else {
            console.log('  ⚠️ Array de sugerencias está vacío');
          }
        } else {
          console.log('  ❌ Campo sugerencias NO existe o es null/undefined');
        }
        
        // Verificar detalles de piezas
        if (tela.detallesPiezas && tela.detallesPiezas.length > 0) {
          console.log('\n  📐 Detalles de piezas:');
          tela.detallesPiezas.forEach((pieza, i) => {
            console.log(`    ${i + 1}. ${pieza.ubicacion}: ${pieza.ancho}m`);
          });
        }
        
        console.log('\n  ' + '='.repeat(60));
      });
    } else {
      console.log('\n❌ No hay telas en listaPedido');
    }
    
    // Verificar estructura completa
    console.log('\n=== ESTRUCTURA COMPLETA DE listaPedido ===');
    console.log(JSON.stringify(datosOrden.listaPedido, null, 2));
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  }
}

// Ejecutar
const proyectoId = process.argv[2];

if (!proyectoId) {
  console.error('❌ Uso: node server/scripts/debugSugerenciasPDF.js <proyectoId>');
  process.exit(1);
}

debugSugerencias(proyectoId);

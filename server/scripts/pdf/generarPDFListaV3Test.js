/**
 * Script para probar PDF Lista de Pedido V3.1
 * Implementa algoritmo oficial de cálculo de telas
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const OrdenProduccionService = require('../services/ordenProduccionService');
const PDFListaPedidoV3Service = require('../services/pdfListaPedidoV3Service');
const logger = require('../config/logger');

async function generarPDFListaV3() {
  try {
    await mongoose.connect('mongodb://localhost:27017/sundeck-crm');
    logger.info('Conectado a MongoDB');
    
    const proyectoId = '690e69251346d61cfcd5178d'; // Héctor Huerta
    
    console.log('\n📄 Generando PDF LISTA DE PEDIDO V3.1...\n');
    console.log('Proyecto ID:', proyectoId);
    
    // Obtener datos
    const datosOrden = await OrdenProduccionService.obtenerDatosOrdenProduccion(proyectoId);
    
    console.log('✅ Datos obtenidos');
    console.log('   Proyecto:', datosOrden.proyecto.numero);
    console.log('   Cliente:', datosOrden.cliente.nombre);
    console.log('   Total piezas:', datosOrden.totalPiezas);
    
    // Generar PDF V3.1
    console.log('\n📋 Generando PDF Lista de Pedido V3.1...\n');
    const pdfBuffer = await PDFListaPedidoV3Service.generarPDF(datosOrden);
    
    // Guardar PDF
    const outputPath = path.join(__dirname, '../../test-lista-pedido-v3.1.pdf');
    fs.writeFileSync(outputPath, pdfBuffer);
    
    console.log('✅ PDF V3.1 generado exitosamente');
    console.log(`   Ubicación: ${outputPath}`);
    console.log(`   Tamaño: ${(pdfBuffer.length / 1024).toFixed(2)} KB\n`);
    
    console.log('🎯 ESTRUCTURA DEL PDF:');
    console.log('   HOJA 1: Material Consolidado (imprimible)');
    console.log('   HOJA 2: Despiece por Pieza (técnico)');
    console.log('   HOJA 3: Almacén + Garantías\n');
    
    console.log('📊 CARACTERÍSTICAS V3.1:');
    console.log('   ✅ Telas agrupadas por tipo (Screen/Blackout/Sheer)');
    console.log('   ✅ Orden del despiece mantenido');
    console.log('   ✅ Análisis de rollo óptimo (2.00/2.50/3.00)');
    console.log('   ✅ Regla: <22ml = metros, >=22ml = rollo');
    console.log('   ✅ Stock de almacén simulado');
    console.log('   ✅ Despiece detallado por pieza');
    console.log('   ✅ Garantías completas\n');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Desconectado de MongoDB');
  }
}

generarPDFListaV3();

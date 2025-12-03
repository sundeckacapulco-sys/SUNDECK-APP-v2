/**
 * Script para generar PDF usando generarPDFListaPedido
 * Usa el método que estás viendo en el IDE (línea 615)
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const OrdenProduccionService = require('../../services/ordenProduccionService');
const PDFOrdenFabricacionService = require('../../services/pdfOrdenFabricacionService');
const logger = require('../../config/logger');

async function generarPDFListaPedidoDirecto() {
  try {
    await mongoose.connect('mongodb://localhost:27017/sundeck-crm');
    logger.info('Conectado a MongoDB');
    
    const proyectoId = '690e69251346d61cfcd5178d'; // Héctor Huerta
    
    console.log('\n📄 Generando PDF usando generarPDFListaPedido()...\n');
    console.log('Proyecto ID:', proyectoId);
    console.log('Método: PDFOrdenFabricacionService.generarPDFListaPedido()\n');
    
    // Obtener datos
    const datosOrden = await OrdenProduccionService.obtenerDatosOrdenProduccion(proyectoId);
    
    console.log('✅ Datos obtenidos');
    console.log('   Proyecto:', datosOrden.proyecto.numero);
    console.log('   Cliente:', datosOrden.cliente.nombre);
    console.log('   Total piezas:', datosOrden.totalPiezas);
    console.log('   Telas en lista:', datosOrden.listaPedido.telas?.length || 0);
    
    // Generar PDF usando el método generarPDFListaPedido (línea 615)
    console.log('\n📋 Generando PDF Lista de Pedido para Proveedor...\n');
    const pdfBuffer = await PDFOrdenFabricacionService.generarPDFListaPedido(
      datosOrden, 
      datosOrden.listaPedido
    );
    
    // Guardar PDF
    const outputPath = path.join(__dirname, '../../test-lista-pedido-directo.pdf');
    fs.writeFileSync(outputPath, pdfBuffer);
    
    console.log('✅ PDF generado exitosamente');
    console.log(`   Ubicación: ${outputPath}`);
    console.log(`   Tamaño: ${(pdfBuffer.length / 1024).toFixed(2)} KB\n`);
    
    console.log('📊 ESTRUCTURA DEL PDF (generarPDFListaPedido):');
    console.log('   PÁGINA 1: Lista de Pedido para Proveedor');
    console.log('   PÁGINA 2: Detalle de Materiales por Pieza');
    console.log('   PÁGINA 3: Materiales Consolidados\n');
    
    console.log('🎯 CARACTERÍSTICAS:');
    console.log('   ✅ Datos del pedido (proyecto, cliente, fecha)');
    console.log('   ✅ Tubos con barras necesarias');
    console.log('   ✅ Telas con especificaciones');
    console.log('   ✅ Mecanismos manuales');
    console.log('   ✅ Motores y controles');
    console.log('   ✅ Contrapesos');
    console.log('   ✅ Checklist de empaque\n');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Desconectado de MongoDB');
  }
}

generarPDFListaPedidoDirecto();

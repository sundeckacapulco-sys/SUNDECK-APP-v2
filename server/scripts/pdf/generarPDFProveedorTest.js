/**
 * Script para generar PDF de LISTA DE PEDIDO PARA PROVEEDOR
 * Este es el PDF que debe tener las sugerencias
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const OrdenProduccionService = require('../services/ordenProduccionService');
const PDFOrdenFabricacionService = require('../services/pdfOrdenFabricacionService');
const logger = require('../config/logger');

async function generarPDFProveedor() {
  try {
    await mongoose.connect('mongodb://localhost:27017/sundeck-crm');
    logger.info('Conectado a MongoDB');
    
    const proyectoId = '690e69251346d61cfcd5178d'; // Héctor Huerta
    
    console.log('\n📄 Generando PDF de LISTA DE PEDIDO PARA PROVEEDOR...\n');
    console.log('Proyecto ID:', proyectoId);
    
    // Obtener datos
    const datosOrden = await OrdenProduccionService.obtenerDatosOrdenProduccion(proyectoId);
    
    console.log('✅ Datos obtenidos');
    console.log('   Proyecto:', datosOrden.proyecto.numero);
    console.log('   Cliente:', datosOrden.cliente.nombre);
    console.log('   Total piezas:', datosOrden.totalPiezas);
    console.log('   Telas en lista:', datosOrden.listaPedido.telas?.length || 0);
    
    // Verificar sugerencias ANTES de generar PDF
    console.log('\n🔍 Verificando sugerencias en telas:\n');
    datosOrden.listaPedido.telas?.forEach((tela, index) => {
      console.log(`Tela ${index + 1}: ${tela.descripcion}`);
      console.log(`  Modelo: ${tela.modelo}`);
      console.log(`  Color: ${tela.color}`);
      console.log(`  Sugerencias: ${tela.sugerencias ? tela.sugerencias.length : 0}`);
      if (tela.sugerencias && tela.sugerencias.length > 0) {
        tela.sugerencias.forEach((sug, i) => {
          console.log(`    ${i + 1}. ${sug}`);
        });
      } else {
        console.log('    ❌ No hay sugerencias');
      }
      console.log('');
    });
    
    // Generar PDF DE LISTA DE PEDIDO (PROVEEDOR)
    console.log('📋 Generando PDF de Lista de Pedido para Proveedor...\n');
    const pdfBuffer = await PDFOrdenFabricacionService.generarPDFListaPedido(datosOrden, datosOrden.listaPedido);
    
    // Guardar PDF
    const outputPath = path.join(__dirname, '../../test-lista-pedido-proveedor.pdf');
    fs.writeFileSync(outputPath, pdfBuffer);
    
    console.log('✅ PDF generado exitosamente');
    console.log(`   Ubicación: ${outputPath}`);
    console.log(`   Tamaño: ${(pdfBuffer.length / 1024).toFixed(2)} KB\n`);
    
    console.log('🎯 PRÓXIMO PASO:');
    console.log('   1. Abre el PDF: test-lista-pedido-proveedor.pdf');
    console.log('   2. Ve a la PÁGINA 1: "LISTA DE PEDIDO PARA PROVEEDOR"');
    console.log('   3. Busca la sección "TELAS"');
    console.log('   4. Verifica si aparece "[>>] SUGERENCIAS:" en azul\n');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Desconectado de MongoDB');
  }
}

generarPDFProveedor();

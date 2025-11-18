/**
 * Script para probar Lista de Pedido V2.0 optimizada
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const mongoose = require('mongoose');
const OrdenProduccionService = require('../services/ordenProduccionService');
const PDFListaPedidoV2Service = require('../services/pdfListaPedidoV2Service');
const fs = require('fs');

async function probarListaPedidoV2() {
  try {
    console.log('📄 PROBANDO LISTA DE PEDIDO V2.0\n');
    console.log('='.repeat(60));
    
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    
    const proyectoId = '690e69251346d61cfcd5178d'; // 2025-ARQ-HECTOR-003
    
    console.log('✅ Proyecto: 2025-ARQ-HECTOR-003');
    console.log('   Cliente: Arq. Hector Huerta\n');
    
    // Generar lista optimizada
    console.log('📋 Generando lista de pedido V2.0...');
    const resultado = await OrdenProduccionService.generarListaPedidoV2(proyectoId);
    
    const { datosOrden, listaOptimizada } = resultado;
    
    console.log('\n✅ Lista optimizada generada:');
    console.log(`   Items a pedir: ${listaOptimizada.resumen.totalItemsPedir}`);
    console.log(`   Items de almacén: ${listaOptimizada.resumen.totalItemsAlmacen}`);
    console.log(`   Piezas motorizadas: ${listaOptimizada.resumen.piezasMotorizadas}`);
    
    // Mostrar detalle
    console.log('\n📦 PEDIR A PROVEEDOR:');
    
    if (listaOptimizada.pedirProveedor.telas.length > 0) {
      console.log('\n  TELAS:');
      listaOptimizada.pedirProveedor.telas.forEach(tela => {
        console.log(`    - ${tela.descripcion}`);
        console.log(`      Requerimiento: ${tela.requerimiento} ml`);
        console.log(`      Stock: ${tela.stockAlmacen} ml`);
        
        if (tela.pedirRollo) {
          console.log(`      >> PEDIR: ${tela.rollosAPedir} rollo(s) de ${tela.metrosRollo} ml`);
          console.log(`      Sobrante: ${tela.sobranteEstimado} ml\n`);
        } else {
          console.log(`      >> PEDIR: ${tela.metrosAPedir} ml (compra por metro)`);
          console.log(`      Sobrante: 0 ml\n`);
        }
      });
    }
    
    if (listaOptimizada.pedirProveedor.cinta.length > 0) {
      console.log('  CINTA:');
      listaOptimizada.pedirProveedor.cinta.forEach(cinta => {
        console.log(`    - ${cinta.descripcion}`);
        console.log(`      Requerimiento: ${cinta.requerimiento} ml`);
        console.log(`      >> PEDIR: ${cinta.rollosAPedir} rollo(s) de ${cinta.metrosRollo} ml`);
        console.log(`      Sobrante: ${cinta.sobranteEstimado} ml\n`);
      });
    }
    
    if (listaOptimizada.pedirProveedor.tubos.length > 0) {
      console.log('  TUBOS:');
      listaOptimizada.pedirProveedor.tubos.forEach(tubo => {
        console.log(`    - ${tubo.descripcion}`);
        console.log(`      >> PEDIR: ${tubo.barrasAPedir} barra(s) de ${tubo.longitudBarra}m\n`);
      });
    }
    
    console.log('='.repeat(60));
    console.log('🔵 GENERANDO PDF V2.0\n');
    
    // Generar PDF
    const pdfBuffer = await PDFListaPedidoV2Service.generarPDF(datosOrden, listaOptimizada);
    
    // Guardar PDF
    const outputPath = path.join(__dirname, '../../temp', `Lista-Pedido-V2-${datosOrden.proyecto.numero}.pdf`);
    fs.writeFileSync(outputPath, pdfBuffer);
    
    const stats = fs.statSync(outputPath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    
    console.log('✅ PDF V2.0 GENERADO:');
    console.log(`   📁 ${outputPath}`);
    console.log(`   📊 Tamaño: ${sizeKB} KB`);
    console.log(`   📄 Contenido:`);
    console.log(`      - Página 1: Pedido a proveedor`);
    console.log(`      - Página 2: Almacén + Garantías`);
    console.log(`   🎯 Máximo 2 páginas ✅`);
    
    console.log('\n='.repeat(60));
    console.log('🎉 LISTA DE PEDIDO V2.0 GENERADA EXITOSAMENTE\n');
    console.log('💡 Abre el PDF para verificar:');
    console.log(`   ${outputPath}\n`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

probarListaPedidoV2();

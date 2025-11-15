/**
 * Script para probar generación de PDF de orden de producción
 * Ejecutar: node server/scripts/probarPDFOrden.js
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Proyecto = require('../models/Proyecto');
const OrdenProduccionService = require('../services/ordenProduccionService');
const PDFOrdenFabricacionService = require('../services/pdfOrdenFabricacionService');
require('dotenv').config();

async function probarPDF() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('\n📄 PROBANDO GENERACIÓN DE PDF\n');
    console.log('='.repeat(60));
    
    // Buscar proyecto de Huerta
    const proyecto = await Proyecto.findOne({ 
      'cliente.nombre': /Huerta/i 
    });
    
    if (!proyecto) {
      console.log('❌ No se encontró proyecto de Huerta');
      await mongoose.connection.close();
      process.exit(1);
    }
    
    console.log(`✅ Proyecto: ${proyecto.numero}`);
    console.log(`   Cliente: ${proyecto.cliente?.nombre}\n`);
    
    // Obtener datos de la orden
    console.log('📋 Obteniendo datos de la orden...');
    const datosOrden = await OrdenProduccionService.obtenerDatosOrdenProduccion(proyecto._id);
    
    console.log(`✅ Datos obtenidos:`);
    console.log(`   Piezas: ${datosOrden.totalPiezas}`);
    console.log(`   Materiales: ${datosOrden.materialesConsolidados?.length || 0}`);
    console.log(`   Lista de pedido: ${datosOrden.listaPedido ? 'Sí' : 'No'}\n`);
    
    // Generar PDF
    console.log('🔄 Generando PDF...');
    const pdfBuffer = await PDFOrdenFabricacionService.generarPDF(
      datosOrden,
      datosOrden.listaPedido
    );
    
    console.log(`✅ PDF generado: ${pdfBuffer.length} bytes\n`);
    
    // Guardar PDF
    const outputDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const filename = `Orden-${datosOrden.proyecto.numero}-${Date.now()}.pdf`;
    const filepath = path.join(outputDir, filename);
    
    fs.writeFileSync(filepath, pdfBuffer);
    
    console.log('='.repeat(60));
    console.log('✅ PDF GUARDADO EXITOSAMENTE\n');
    console.log(`📁 Ubicación: ${filepath}`);
    console.log(`📊 Tamaño: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);
    console.log(`📄 Nombre: ${filename}\n`);
    
    console.log('📋 CONTENIDO DEL PDF:');
    console.log('   Página 1: Orden de Producción');
    console.log('   Página 2: Lista de Pedido para Proveedor');
    console.log('   Página 3: Detalle de Materiales por Pieza\n');
    
    if (datosOrden.listaPedido) {
      console.log('🛒 LISTA DE PEDIDO INCLUIDA:');
      if (datosOrden.listaPedido.tubos) {
        console.log(`   📏 Tubos: ${datosOrden.listaPedido.tubos.length} tipos`);
      }
      if (datosOrden.listaPedido.telas) {
        console.log(`   🎨 Telas: ${datosOrden.listaPedido.telas.length} tipos`);
      }
      if (datosOrden.listaPedido.mecanismos) {
        console.log(`   ⚙️  Mecanismos: ${datosOrden.listaPedido.mecanismos.length} tipos`);
      }
      if (datosOrden.listaPedido.resumen) {
        console.log(`\n   📊 RESUMEN:`);
        console.log(`      Barras totales: ${datosOrden.listaPedido.resumen.totalBarras}`);
        console.log(`      Rollos totales: ${datosOrden.listaPedido.resumen.totalRollos}`);
        console.log(`      Items totales: ${datosOrden.listaPedido.resumen.totalItems}`);
      }
    }
    
    console.log('\n🎉 PRUEBA COMPLETADA\n');
    console.log(`💡 Abre el PDF en: ${filepath}\n`);
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    await mongoose.connection.close();
    process.exit(1);
  }
}

probarPDF();

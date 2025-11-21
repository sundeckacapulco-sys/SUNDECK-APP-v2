/**
 * Script para probar ambos PDFs: Lista de Pedido y Orden de Taller
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Proyecto = require('../models/Proyecto');
const OrdenProduccionService = require('../services/ordenProduccionService');
const PDFOrdenFabricacionService = require('../services/pdfOrdenFabricacionService');

// Cargar variables de entorno desde la raíz del proyecto
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function probarAmbosPDFs() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('\n📄 PROBANDO AMBOS PDFs\n');
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
    console.log(`   Materiales: ${datosOrden.materialesConsolidados?.length || 0}\n`);
    
    const outputDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // ============================================
    // PDF 1: LISTA DE PEDIDO (para proveedores)
    // ============================================
    console.log('='.repeat(60));
    console.log('🔵 GENERANDO PDF 1: LISTA DE PEDIDO (Proveedores)\n');
    
    const pdfListaPedido = await PDFOrdenFabricacionService.generarPDFListaPedido(
      datosOrden,
      datosOrden.listaPedido
    );
    
    const filenameLista = `Lista-Pedido-${datosOrden.proyecto.numero}.pdf`;
    const filepathLista = path.join(outputDir, filenameLista);
    fs.writeFileSync(filepathLista, pdfListaPedido);
    
    console.log(`✅ PDF 1 GENERADO:`);
    console.log(`   📁 ${filepathLista}`);
    console.log(`   📊 Tamaño: ${(pdfListaPedido.length / 1024).toFixed(2)} KB`);
    console.log(`   📄 Contenido:`);
    console.log(`      - Página 1: Lista de pedido para proveedor`);
    console.log(`      - Página 2: Materiales consolidados`);
    console.log(`   🎯 Enfoque: Solo materiales y cantidades\n`);
    
    // ============================================
    // PDF 2: ORDEN DE TALLER (con especificaciones)
    // ============================================
    console.log('='.repeat(60));
    console.log('🟡 GENERANDO PDF 2: ORDEN DE TALLER (Fabricación)\n');
    
    const pdfOrdenTaller = await PDFOrdenFabricacionService.generarPDF(
      datosOrden,
      datosOrden.listaPedido
    );
    
    const filenameTaller = `Orden-Taller-${datosOrden.proyecto.numero}.pdf`;
    const filepathTaller = path.join(outputDir, filenameTaller);
    fs.writeFileSync(filepathTaller, pdfOrdenTaller);
    
    console.log(`✅ PDF 2 GENERADO:`);
    console.log(`   📁 ${filepathTaller}`);
    console.log(`   📊 Tamaño: ${(pdfOrdenTaller.length / 1024).toFixed(2)} KB`);
    console.log(`   📄 Contenido:`);
    console.log(`      - Página 1: Resumen de piezas`);
    console.log(`      - Página 2: Lista de pedido`);
    console.log(`      - Página 3+: Detalle por pieza con especificaciones técnicas`);
    console.log(`      - Última: Checklist y firmas`);
    console.log(`   🎯 Enfoque: Especificaciones técnicas completas\n`);
    
    // ============================================
    // COMPARACIÓN
    // ============================================
    console.log('='.repeat(60));
    console.log('📊 COMPARACIÓN:\n');
    console.log(`   Lista de Pedido: ${(pdfListaPedido.length / 1024).toFixed(2)} KB`);
    console.log(`   Orden de Taller: ${(pdfOrdenTaller.length / 1024).toFixed(2)} KB`);
    console.log(`   Diferencia: ${((pdfOrdenTaller.length - pdfListaPedido.length) / 1024).toFixed(2)} KB más en Orden de Taller\n`);
    
    console.log('🎉 AMBOS PDFs GENERADOS EXITOSAMENTE\n');
    console.log('💡 Abre los PDFs para verificar el contenido:\n');
    console.log(`   🔵 Lista de Pedido: ${filepathLista}`);
    console.log(`   🟡 Orden de Taller: ${filepathTaller}\n`);
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    await mongoose.connection.close();
    process.exit(1);
  }
}

probarAmbosPDFs();

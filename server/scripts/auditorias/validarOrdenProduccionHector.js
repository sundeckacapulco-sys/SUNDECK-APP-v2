/**
 * Script para validar Orden de Producción con proyecto de Héctor
 */

const mongoose = require('mongoose');
const PDFService = require('../services/pdfService');
const Proyecto = require('../models/Proyecto');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../config/logger');

// Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/sundeck')
  .then(() => logger.info('Conectado a MongoDB'))
  .catch(err => {
    logger.error('Error conectando a MongoDB', { error: err.message });
    process.exit(1);
  });

async function validarOrdenProduccion() {
  try {
    console.log('\n🧪 VALIDANDO ORDEN DE PRODUCCIÓN\n');
    
    // Buscar proyecto de Héctor
    console.log('🔍 Buscando proyecto de Héctor...');
    const proyectos = await Proyecto.find({
      'cliente.nombre': /hector/i
    }).select('_id numero cliente.nombre estado').limit(5).lean();
    
    if (proyectos.length === 0) {
      console.log('❌ No se encontró proyecto de Héctor');
      console.log('\n📋 Buscando cualquier proyecto con fabricación...');
      
      const proyectoAlt = await Proyecto.findOne({
        'fabricacion.estado': { $exists: true }
      }).select('_id numero cliente.nombre estado').lean();
      
      if (!proyectoAlt) {
        console.log('❌ No hay proyectos con fabricación');
        process.exit(1);
      }
      
      console.log(`✅ Usando proyecto alternativo: ${proyectoAlt.numero} - ${proyectoAlt.cliente?.nombre}`);
      proyectos.push(proyectoAlt);
    }
    
    console.log(`\n📋 Proyectos encontrados: ${proyectos.length}\n`);
    proyectos.forEach((p, i) => {
      console.log(`${i + 1}. ${p.numero} - ${p.cliente?.nombre} (${p.estado})`);
    });
    
    // Usar el primer proyecto
    const proyectoId = proyectos[0]._id;
    console.log(`\n🎯 Generando Orden de Producción para: ${proyectos[0].numero}\n`);
    
    // Generar PDF
    console.log('📄 Generando PDF de Orden de Producción...');
    const pdfBuffer = await PDFService.generarPDFOrdenProduccion(proyectoId);
    
    // Guardar PDF
    const outputDir = path.join(__dirname, '../../temp');
    await fs.mkdir(outputDir, { recursive: true });
    
    const outputPath = path.join(outputDir, `orden_produccion_${proyectos[0].numero}.pdf`);
    await fs.writeFile(outputPath, pdfBuffer);
    
    console.log(`\n✅ PDF GENERADO EXITOSAMENTE\n`);
    console.log(`📁 Ubicación: ${outputPath}`);
    console.log(`📊 Tamaño: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);
    console.log(`📋 Proyecto: ${proyectos[0].numero} - ${proyectos[0].cliente?.nombre}`);
    
    console.log(`\n🔍 VERIFICAR EN EL PDF:\n`);
    console.log(`PÁGINA 1: ORDEN DE FABRICACIÓN`);
    console.log(`  ✓ Información del proyecto`);
    console.log(`  ✓ Cliente`);
    console.log(`  ✓ Resumen de piezas`);
    console.log(`  ✓ Cronograma`);
    
    console.log(`\nPÁGINA 2: LISTA DE PEDIDO (PROVEEDOR)`);
    console.log(`  ✓ Tubos con optimización`);
    console.log(`  ✓ Telas con modelo y color ⭐`);
    console.log(`  ✓ Mecanismos`);
    console.log(`  ✓ Motores y controles`);
    console.log(`  ✓ Contrapesos`);
    console.log(`  ✓ Accesorios`);
    console.log(`  ✓ Resumen de pedido`);
    
    console.log(`\nPÁGINA 3: DETALLE POR PIEZA`);
    console.log(`  ✓ 13 campos técnicos por pieza`);
    console.log(`  ✓ BOM (materiales) por pieza`);
    console.log(`  ✓ Checklist de empaque`);
    console.log(`  ✓ Firmas`);
    
    console.log(`\n⭐ PUNTOS CLAVE A VERIFICAR:`);
    console.log(`  1. Modelo y color aparecen en telas (Página 2)`);
    console.log(`  2. Anchos disponibles mostrados`);
    console.log(`  3. Observaciones/sugerencias si existen`);
    console.log(`  4. Optimización de cortes (barras/rollos)`);
    console.log(`  5. Separación por modelo y color\n`);
    
  } catch (error) {
    logger.error('Error validando orden de producción', {
      error: error.message,
      stack: error.stack
    });
    console.error('\n❌ ERROR:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Conexión cerrada\n');
    process.exit(0);
  }
}

// Ejecutar validación
validarOrdenProduccion();

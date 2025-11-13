const mongoose = require('mongoose');
const Cotizacion = require('../models/Cotizacion');
const Prospecto = require('../models/Prospecto');
const Usuario = require('../models/Usuario');
const pdfService = require('../services/pdfService');
const logger = require('../config/logger');
const fs = require('fs').promises;
const path = require('path');

async function generarYGuardarPDF() {
  try {
    await mongoose.connect('mongodb://localhost:27017/sundeck-crm');
    console.log('✅ Conectado a MongoDB\n');

    // ID de la cotizacion de Hector Huerta
    const cotizacionId = '69152a4d91f868b9f75a337b';
    
    console.log('📄 Cargando cotización...');
    const cotizacion = await Cotizacion.findById(cotizacionId)
      .populate('prospecto')
      .populate('elaboradaPor', 'nombre apellido');
    
    if (!cotizacion) {
      console.log('❌ Cotización no encontrada');
      process.exit(1);
    }
    
    console.log(`✅ Cotización encontrada: ${cotizacion.numero}`);
    console.log(`   Cliente: ${cotizacion.prospecto?.nombre || 'Sin prospecto'}`);
    console.log(`   Total: $${cotizacion.total?.toFixed(2) || '0.00'}`);
    
    // Crear directorio para PDFs si no existe (dentro de server/uploads)
    const uploadsDir = path.join(__dirname, '../uploads/cotizaciones');
    await fs.mkdir(uploadsDir, { recursive: true });
    console.log(`\n📁 Directorio de PDFs: ${uploadsDir}`);
    
    // Generar PDF
    console.log('\n🔄 Generando PDF...');
    const pdf = await pdfService.generarCotizacionPDF(cotizacion);
    
    // Guardar PDF en el servidor
    const nombreArchivo = `${cotizacion.numero}-${Date.now()}.pdf`;
    const rutaCompleta = path.join(uploadsDir, nombreArchivo);
    await fs.writeFile(rutaCompleta, pdf);
    
    console.log(`✅ PDF guardado en: ${rutaCompleta}`);
    
    // Actualizar cotización con la ruta del PDF
    cotizacion.pdfPath = `/uploads/cotizaciones/${nombreArchivo}`;
    cotizacion.pdfGeneradoEn = new Date();
    await cotizacion.save();
    
    console.log(`\n✅ Cotización actualizada con ruta del PDF`);
    console.log(`   pdfPath: ${cotizacion.pdfPath}`);
    console.log(`   pdfGeneradoEn: ${cotizacion.pdfGeneradoEn}`);
    
    console.log('\n🎉 ¡Proceso completado exitosamente!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

generarYGuardarPDF();

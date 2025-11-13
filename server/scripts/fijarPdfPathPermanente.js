const mongoose = require('mongoose');
const Cotizacion = require('../models/Cotizacion');
const logger = require('../config/logger');

async function fijarPdfPath() {
  try {
    await mongoose.connect('mongodb://localhost:27017/sundeck-crm');
    logger.info('Conectado a MongoDB');

    const cotizacionId = '69152a4d91f868b9f75a337b';
    const pdfPathFijo = '/uploads/cotizaciones/COT-2025-0007-1763053619881.pdf';

    // Actualizar usando findByIdAndUpdate para evitar middleware
    const resultado = await Cotizacion.findByIdAndUpdate(
      cotizacionId,
      {
        $set: {
          pdfPath: pdfPathFijo,
          pdfGeneradoEn: new Date('2025-11-13T17:06:59.881Z')
        }
      },
      { new: true }
    );

    console.log('✅ pdfPath fijado permanentemente');
    console.log('📄 pdfPath:', resultado.pdfPath);
    console.log('📅 pdfGeneradoEn:', resultado.pdfGeneradoEn);

    // Verificar que se guardó
    const verificacion = await Cotizacion.findById(cotizacionId);
    console.log('\n🔍 VERIFICACIÓN:');
    console.log('pdfPath en BD:', verificacion.pdfPath);
    console.log('¿Coincide?', verificacion.pdfPath === pdfPathFijo ? '✅' : '❌');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fijarPdfPath();

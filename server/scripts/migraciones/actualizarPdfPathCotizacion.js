const mongoose = require('mongoose');
const Cotizacion = require('../models/Cotizacion');
const logger = require('../config/logger');

async function actualizarPdfPath() {
  try {
    await mongoose.connect('mongodb://localhost:27017/sundeck-crm');
    logger.info('Conectado a MongoDB');

    // Buscar cotización COT-2025-0007
    const cotizacion = await Cotizacion.findOne({ numero: 'COT-2025-0007' });
    
    if (!cotizacion) {
      console.log('❌ Cotización COT-2025-0007 no encontrada');
      process.exit(1);
    }

    console.log('✅ Cotización encontrada:', cotizacion._id);
    console.log('📄 pdfPath actual:', cotizacion.pdfPath);

    // Usar el primer PDF generado
    const primerPdf = '/uploads/cotizaciones/COT-2025-0007-1763053619881.pdf';
    
    cotizacion.pdfPath = primerPdf;
    cotizacion.pdfGeneradoEn = new Date('2025-11-13T17:06:59.881Z');
    await cotizacion.save();

    console.log('✅ pdfPath actualizado a:', cotizacion.pdfPath);
    console.log('✅ pdfGeneradoEn:', cotizacion.pdfGeneradoEn);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

actualizarPdfPath();

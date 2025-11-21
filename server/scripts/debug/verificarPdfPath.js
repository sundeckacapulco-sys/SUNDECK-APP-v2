const mongoose = require('mongoose');
const Cotizacion = require('../models/Cotizacion');

async function verificar() {
  try {
    await mongoose.connect('mongodb://localhost:27017/sundeck-crm');
    console.log('✅ Conectado a MongoDB');

    const cotizacion = await Cotizacion.findById('69152a4d91f868b9f75a337b');
    
    if (!cotizacion) {
      console.log('❌ Cotización no encontrada');
      process.exit(1);
    }

    console.log('\n📊 DATOS DE LA COTIZACIÓN:');
    console.log('ID:', cotizacion._id);
    console.log('Número:', cotizacion.numero);
    console.log('pdfPath:', cotizacion.pdfPath);
    console.log('pdfGeneradoEn:', cotizacion.pdfGeneradoEn);
    console.log('\n📋 TODOS LOS CAMPOS:');
    console.log(JSON.stringify(cotizacion.toObject(), null, 2));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verificar();

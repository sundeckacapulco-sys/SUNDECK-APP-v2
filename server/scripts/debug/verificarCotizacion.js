const mongoose = require('mongoose');
require('dotenv').config();
const Cotizacion = require('../models/Cotizacion');

async function verificarCotizacion() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sundeck');
    console.log('✅ Conectado a MongoDB');

    // Buscar la última cotización con proyecto
    const cotizacion = await Cotizacion.findOne({ 
      proyecto: { $ne: null, $exists: true } 
    }).sort({ createdAt: -1 });

    if (!cotizacion) {
      console.log('❌ No se encontró cotización con proyecto');
      process.exit(0);
    }

    console.log('\n📋 COTIZACIÓN ENCONTRADA:');
    console.log('Número:', cotizacion.numero);
    console.log('Proyecto:', cotizacion.proyecto);
    console.log('Prospecto:', cotizacion.prospecto);
    console.log('\n💰 TOTALES:');
    console.log('Subtotal:', cotizacion.subtotal);
    console.log('IVA:', cotizacion.iva);
    console.log('Total:', cotizacion.total);
    console.log('\n📦 FACTURACIÓN:');
    console.log('Facturación:', JSON.stringify(cotizacion.facturacion, null, 2));
    console.log('\n📦 PRODUCTOS:');
    console.log('Total productos:', cotizacion.productos?.length || 0);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Conexión cerrada');
  }
}

verificarCotizacion();

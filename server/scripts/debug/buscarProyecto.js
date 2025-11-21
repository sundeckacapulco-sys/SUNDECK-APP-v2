const mongoose = require('mongoose');
const Proyecto = require('../models/Proyecto');

async function buscar() {
  try {
    await mongoose.connect('mongodb://localhost:27017/sundeck');
    console.log('✅ Conectado\n');

    const nombre = process.argv[2] || '';
    
    let query = {};
    if (nombre) {
      query = { 'cliente.nombre': new RegExp(nombre, 'i') };
    }

    const proyectos = await Proyecto.find(query)
      .select('numero cliente estado levantamiento cotizacionActual')
      .lean();

    console.log(`📊 Total proyectos: ${proyectos.length}\n`);
    
    proyectos.forEach((p, i) => {
      console.log(`${i + 1}. ${p.numero || 'Sin número'}`);
      console.log(`   Cliente: ${p.cliente?.nombre || 'N/A'}`);
      console.log(`   Teléfono: ${p.cliente?.telefono || 'N/A'}`);
      console.log(`   Estado: ${p.estado}`);
      console.log(`   Partidas: ${p.levantamiento?.partidas?.length || 0}`);
      console.log(`   Tiene cotización: ${p.cotizacionActual?.cotizacion ? 'Sí' : 'No'}`);
      console.log(`   ID: ${p._id}\n`);
    });

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

buscar();

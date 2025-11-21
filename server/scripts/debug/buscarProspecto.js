const mongoose = require('mongoose');
const Prospecto = require('../models/Prospecto');

async function buscar() {
  try {
    await mongoose.connect('mongodb://localhost:27017/sundeck');
    console.log('✅ Conectado\n');

    const nombre = process.argv[2] || '';
    
    let query = {};
    if (nombre) {
      query = { nombre: new RegExp(nombre, 'i') };
    }

    const prospectos = await Prospecto.find(query)
      .select('nombre telefono email estado producto')
      .lean();

    console.log(`📊 Total prospectos: ${prospectos.length}\n`);
    
    prospectos.forEach((p, i) => {
      console.log(`${i + 1}. ${p.nombre}`);
      console.log(`   Teléfono: ${p.telefono || 'N/A'}`);
      console.log(`   Email: ${p.email || 'N/A'}`);
      console.log(`   Producto: ${p.producto || 'N/A'}`);
      console.log(`   Estado: ${p.estado}`);
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

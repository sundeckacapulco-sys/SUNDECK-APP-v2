const mongoose = require('mongoose');
const Proyecto = require('../models/Proyecto');

async function verProspectos() {
  try {
    await mongoose.connect('mongodb://localhost:27017/sundeck');
    console.log('✅ Conectado a MongoDB\n');

    const prospectos = await Proyecto.find({ tipo: 'prospecto' }).limit(10);

    console.log(`📊 Total de prospectos: ${prospectos.length}\n`);

    prospectos.forEach((p, index) => {
      console.log(`\n--- Prospecto ${index + 1} ---`);
      console.log(`ID: ${p._id}`);
      console.log(`Nombre: ${p.cliente?.nombre || 'SIN NOMBRE'}`);
      console.log(`Teléfono: ${p.cliente?.telefono || 'SIN TELÉFONO'}`);
      console.log(`Estado: ${p.estadoComercial || 'sin estado'}`);
      console.log(`Tipo: ${p.tipo || 'sin tipo'}`);
      console.log(`Asesor: ${p.asesorComercial || 'sin asesor'}`);
    });

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verProspectos();

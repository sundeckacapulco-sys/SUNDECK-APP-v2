const mongoose = require('mongoose');
const Proyecto = require('../models/Proyecto');

async function listarProyectos() {
  try {
    await mongoose.connect('mongodb://localhost:27017/sundeck');
    console.log('✅ Conectado a MongoDB\n');
    
    const proyectos = await Proyecto.find()
      .select('_id numero cliente.nombre estado')
      .limit(10)
      .lean();
    
    console.log(`📋 Proyectos disponibles (${proyectos.length}):\n`);
    
    proyectos.forEach((p, index) => {
      console.log(`${index + 1}. ID: ${p._id}`);
      console.log(`   Número: ${p.numero || 'Sin número'}`);
      console.log(`   Cliente: ${p.cliente?.nombre || 'Sin nombre'}`);
      console.log(`   Estado: ${p.estado || 'Sin estado'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Desconectado');
  }
}

listarProyectos();

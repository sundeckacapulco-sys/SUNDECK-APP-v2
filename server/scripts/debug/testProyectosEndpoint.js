const mongoose = require('mongoose');
require('dotenv').config();

const Proyecto = require('../models/Proyecto');

async function testEndpoint() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sundeck');
    console.log('✅ Conectado a MongoDB');

    console.log('\n📊 Probando consulta de proyectos...');
    
    const filtros = {};
    const total = await Proyecto.countDocuments(filtros);
    console.log(`✅ Total de proyectos: ${total}`);

    const proyectos = await Proyecto.find(filtros)
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    console.log(`✅ Primeros 5 proyectos obtenidos: ${proyectos.length}`);
    
    proyectos.forEach((p, i) => {
      console.log(`\n${i + 1}. ${p.cliente?.nombre || 'Sin nombre'}`);
      console.log(`   Tipo: ${p.tipo || 'N/A'}`);
      console.log(`   Estado: ${p.estadoComercial || p.estado || 'N/A'}`);
      console.log(`   Asesor: ${p.asesorComercial || 'N/A'}`);
      console.log(`   Fecha: ${p.createdAt || p.fecha_creacion || 'N/A'}`);
    });

    console.log('\n✅ Test completado exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en test:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testEndpoint();

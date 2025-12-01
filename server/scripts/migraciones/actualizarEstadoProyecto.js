const mongoose = require('mongoose');
const Proyecto = require('../models/Proyecto');
const logger = require('../config/logger');

async function actualizarEstado() {
  try {
    await mongoose.connect('mongodb://localhost:27017/sundeck-crm');
    console.log('✅ Conectado a MongoDB\n');

    const proyectoId = '690e69251346d61cfcd5178d'; // Hector Huerta
    
    const proyecto = await Proyecto.findById(proyectoId);
    
    if (!proyecto) {
      console.log('❌ Proyecto no encontrado');
      process.exit(1);
    }
    
    console.log('=== ANTES DE ACTUALIZAR ===');
    console.log('Cliente:', proyecto.cliente?.nombre);
    console.log('Estado:', proyecto.estado);
    console.log('Estado Comercial:', proyecto.estadoComercial);
    
    // Actualizar estado a cotizacion
    proyecto.estado = 'cotizacion';
    await proyecto.save();
    
    console.log('\n=== DESPUÉS DE ACTUALIZAR ===');
    console.log('Estado:', proyecto.estado);
    console.log('Estado Comercial:', proyecto.estadoComercial);
    
    console.log('\n✅ Estado actualizado correctamente');
    console.log('📊 Progreso esperado: 20% (Cotización)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

actualizarEstado();

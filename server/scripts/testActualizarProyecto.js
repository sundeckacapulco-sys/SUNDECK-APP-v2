const mongoose = require('mongoose');
require('dotenv').config();

const Proyecto = require('../models/Proyecto');

async function testActualizaciones() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sundeck');
    console.log('✅ Conectado a MongoDB\n');

    // Obtener un proyecto de prueba
    const proyecto = await Proyecto.findOne({ tipo: 'prospecto' });
    
    if (!proyecto) {
      console.log('❌ No hay prospectos para probar');
      process.exit(1);
    }

    console.log('📋 Proyecto de prueba encontrado:');
    console.log(`   ID: ${proyecto._id}`);
    console.log(`   Cliente: ${proyecto.cliente?.nombre}`);
    console.log(`   Tipo: ${proyecto.tipo}`);
    console.log(`   Estado: ${proyecto.estadoComercial}`);
    console.log(`   Asesor: ${proyecto.asesorComercial || 'Sin asignar'}\n`);

    // TEST 1: Asignar asesor
    console.log('🧪 TEST 1: Asignar Asesor');
    try {
      proyecto.asesorComercial = 'Abigail';
      await proyecto.save();
      console.log('✅ Asesor asignado correctamente');
      console.log(`   Nuevo asesor: ${proyecto.asesorComercial}\n`);
    } catch (error) {
      console.error('❌ Error al asignar asesor:', error.message);
    }

    // TEST 2: Cambiar estado
    console.log('🧪 TEST 2: Cambiar Estado');
    try {
      const estadoAnterior = proyecto.estadoComercial;
      proyecto.estadoComercial = 'contactado';
      await proyecto.save();
      console.log('✅ Estado cambiado correctamente');
      console.log(`   Estado anterior: ${estadoAnterior}`);
      console.log(`   Estado nuevo: ${proyecto.estadoComercial}\n`);
    } catch (error) {
      console.error('❌ Error al cambiar estado:', error.message);
    }

    // TEST 3: Marcar como perdido
    console.log('🧪 TEST 3: Marcar como Perdido');
    try {
      proyecto.estadoComercial = 'perdido';
      await proyecto.save();
      console.log('✅ Marcado como perdido correctamente');
      console.log(`   Estado final: ${proyecto.estadoComercial}\n`);
    } catch (error) {
      console.error('❌ Error al marcar como perdido:', error.message);
    }

    // TEST 4: Actualización con findByIdAndUpdate (como lo hace el endpoint)
    console.log('🧪 TEST 4: Actualización con findByIdAndUpdate');
    try {
      const actualizado = await Proyecto.findByIdAndUpdate(
        proyecto._id,
        { 
          asesorComercial: 'Carlos',
          estadoComercial: 'en seguimiento'
        },
        { new: true, runValidators: false }
      );
      console.log('✅ Actualización con findByIdAndUpdate exitosa');
      console.log(`   Asesor: ${actualizado.asesorComercial}`);
      console.log(`   Estado: ${actualizado.estadoComercial}\n`);
    } catch (error) {
      console.error('❌ Error con findByIdAndUpdate:', error.message);
      console.error('   Stack:', error.stack);
    }

    // Verificar estado final
    console.log('📊 Estado Final del Proyecto:');
    const proyectoFinal = await Proyecto.findById(proyecto._id);
    console.log(`   ID: ${proyectoFinal._id}`);
    console.log(`   Cliente: ${proyectoFinal.cliente?.nombre}`);
    console.log(`   Tipo: ${proyectoFinal.tipo}`);
    console.log(`   Estado: ${proyectoFinal.estadoComercial}`);
    console.log(`   Asesor: ${proyectoFinal.asesorComercial}`);

    console.log('\n✅ Todos los tests completados');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en tests:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testActualizaciones();

const mongoose = require('mongoose');
const CalculadoraMaterialesService = require('../services/calculadoraMaterialesService');
const logger = require('../config/logger');

async function inicializarCalculadora() {
  try {
    console.log('🧮 INICIALIZANDO CALCULADORA DE MATERIALES...\n');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sundeck-crm');
    console.log('✅ Conectado a MongoDB\n');
    
    console.log('📝 Creando configuración inicial...');
    const config = await CalculadoraMaterialesService.crearConfiguracionInicial();
    
    console.log('\n✅ CONFIGURACIÓN CREADA:');
    console.log('   ID:', config._id.toString());
    console.log('   Nombre:', config.nombre);
    console.log('   Sistema:', config.sistema);
    console.log('   Materiales configurados:', config.materiales.length);
    console.log('');
    
    console.log('📋 MATERIALES CONFIGURADOS:');
    config.materiales.forEach((m, i) => {
      console.log(`\n   ${i + 1}. ${m.tipo} - ${m.descripcion}`);
      console.log(`      Fórmula: ${m.formula}`);
      console.log(`      Unidad: ${m.unidad}`);
      if (m.condicion) {
        console.log(`      Condición: ${m.condicion}`);
      }
    });
    
    console.log('\n\n✅ CALCULADORA INICIALIZADA');
    console.log('\n💡 PRÓXIMOS PASOS:');
    console.log('   1. Reinicia el servidor');
    console.log('   2. Genera una orden de producción');
    console.log('   3. Los materiales se calcularán automáticamente');
    console.log('');
    console.log('📝 PARA PERSONALIZAR:');
    console.log('   - Edita la configuración en la base de datos');
    console.log('   - Colección: configuracionmateriales');
    console.log('   - Modifica fórmulas según tus necesidades');
    
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

inicializarCalculadora();

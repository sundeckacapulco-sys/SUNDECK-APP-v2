const mongoose = require('mongoose');
const ConfiguracionMateriales = require('../models/ConfiguracionMateriales');
require('dotenv').config();

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado');
    
    // Eliminar todas
    await ConfiguracionMateriales.deleteMany({});
    console.log('🗑️  Configuraciones eliminadas');
    
    // Crear una simple
    const config = await ConfiguracionMateriales.create({
      nombre: 'Test Config',
      sistema: 'Roller Shade',
      materiales: [
        {
          tipo: 'Tela',
          descripcion: 'Tela Test',
          unidad: 'ml',
          formula: 'alto + 0.25',
          formulaRotada: 'ancho',
          puedeRotar: true,
          alturaMaxRotacion: 2.80
        }
      ]
    });
    
    console.log('✅ Config creada:', config._id);
    
    // Verificar inmediatamente
    const verificar = await ConfiguracionMateriales.findById(config._id);
    console.log('✅ Verificación:', verificar ? 'ENCONTRADA' : 'NO ENCONTRADA');
    
    if (verificar) {
      console.log('   Sistema:', verificar.sistema);
      console.log('   Materiales:', verificar.materiales?.length);
      const tela = verificar.materiales[0];
      console.log('   Tela formula:', tela.formula);
      console.log('   Tela formulaRotada:', tela.formulaRotada);
    }
    
    await mongoose.disconnect();
    console.log('✅ Desconectado');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
}

test();

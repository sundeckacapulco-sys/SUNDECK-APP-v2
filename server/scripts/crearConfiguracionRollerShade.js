const mongoose = require('mongoose');
const ConfiguracionMateriales = require('../models/ConfiguracionMateriales');
const logger = require('../config/logger');

async function crearConfiguracionRollerShade() {
  try {
    console.log('🎨 CREANDO CONFIGURACIÓN ROLLER SHADE...\n');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sundeck-crm');
    console.log('✅ Conectado a MongoDB\n');
    
    // Verificar si ya existe
    const existe = await ConfiguracionMateriales.findOne({ nombre: 'Roller Shade Manual' });
    if (existe) {
      console.log('⚠️  La configuración "Roller Shade Manual" ya existe');
      console.log('   ID:', existe._id.toString());
      console.log('\n¿Deseas actualizarla? Elimínala primero desde el panel web.');
      process.exit(0);
    }
    
    console.log('📝 Creando configuración con todos los componentes...\n');
    
    const config = new ConfiguracionMateriales({
      nombre: 'Roller Shade Manual',
      sistema: 'Enrollable',
      materiales: [
        // ESTRUCTURA PRINCIPAL
        {
          tipo: 'Tubo',
          descripcion: 'C - Roller Tube (Tubo enrollador)',
          unidad: 'ml',
          formula: 'ancho + 0.10',
          observaciones: 'Ancho + 10cm. Ajusta según necesites',
          activo: true
        },
        {
          tipo: 'Tela',
          descripcion: 'E - Roller Fabric (Tela enrollable)',
          unidad: 'ml',
          formula: 'alto * 1.15',
          observaciones: 'Alto + 15% merma. Ajusta el porcentaje según tu tela',
          activo: true
        },
        
        // SOPORTES
        {
          tipo: 'Soportes',
          descripcion: 'A - Drive End Bracket (Soporte lado motor)',
          unidad: 'pza',
          formula: '1',
          observaciones: 'Soporte lado del mecanismo',
          activo: true
        },
        {
          tipo: 'Soportes',
          descripcion: 'G - Idle End Bracket (Soporte lado inactivo)',
          unidad: 'pza',
          formula: '1',
          observaciones: 'Soporte lado opuesto',
          activo: true
        },
        
        // MECANISMO MANUAL
        {
          tipo: 'Mecanismo',
          descripcion: 'B - Clutch (Embrague/mecanismo)',
          unidad: 'pza',
          formula: '1',
          condicion: 'motorizado !== true',
          observaciones: 'Solo para persianas manuales',
          activo: true
        },
        {
          tipo: 'Mecanismo',
          descripcion: 'H - Bead Chain (Cadena de control)',
          unidad: 'ml',
          formula: '(alto * 2) + 0.50',
          condicion: 'motorizado !== true',
          observaciones: 'Doble del alto + 50cm. Solo manual',
          activo: true
        },
        {
          tipo: 'Accesorios',
          descripcion: 'I - Chain Connector (Conector de cadena)',
          unidad: 'pza',
          formula: '1',
          condicion: 'motorizado !== true',
          observaciones: 'Solo para persianas manuales',
          activo: true
        },
        {
          tipo: 'Accesorios',
          descripcion: 'J - Chain Crimp (Prensa de cadena)',
          unidad: 'pza',
          formula: '1',
          condicion: 'motorizado !== true',
          observaciones: 'Solo para persianas manuales',
          activo: true
        },
        {
          tipo: 'Accesorios',
          descripcion: 'K - Chain Tensioner (Tensor de cadena)',
          unidad: 'pza',
          formula: '1',
          condicion: 'motorizado !== true',
          observaciones: 'Solo para persianas manuales',
          activo: true
        },
        
        // MOTOR (ALTERNATIVA)
        {
          tipo: 'Motor',
          descripcion: 'Motor tubular (alternativa a mecanismo manual)',
          unidad: 'pza',
          formula: '1',
          condicion: 'motorizado === true',
          observaciones: 'Solo para persianas motorizadas',
          activo: true
        },
        
        // ACCESORIOS GENERALES
        {
          tipo: 'Accesorios',
          descripcion: 'D - Adhesive Strip (Cinta adhesiva para tela)',
          unidad: 'ml',
          formula: 'ancho',
          observaciones: 'Para pegar tela al tubo',
          activo: true
        },
        {
          tipo: 'Accesorios',
          descripcion: 'F - End Plug (Tapón lateral tubo)',
          unidad: 'pza',
          formula: '2',
          observaciones: 'Uno por cada lado del tubo',
          activo: true
        },
        
        // BASE
        {
          tipo: 'Herrajes',
          descripcion: 'M - Bottom Rail (Riel inferior/contrapeso)',
          unidad: 'ml',
          formula: 'ancho',
          observaciones: 'Mismo ancho que la tela. Ajusta si necesitas margen',
          activo: true
        },
        {
          tipo: 'Accesorios',
          descripcion: 'L - End Cap (Tapa lateral inferior)',
          unidad: 'pza',
          formula: '2',
          observaciones: 'Tapas para el riel inferior',
          activo: true
        }
      ],
      activo: true
    });
    
    await config.save();
    
    console.log('✅ CONFIGURACIÓN CREADA EXITOSAMENTE\n');
    console.log('📋 DETALLES:');
    console.log('   ID:', config._id.toString());
    console.log('   Nombre:', config.nombre);
    console.log('   Sistema:', config.sistema);
    console.log('   Total componentes:', config.materiales.length);
    console.log('');
    
    console.log('📦 COMPONENTES AGREGADOS:\n');
    config.materiales.forEach((m, i) => {
      console.log(`   ${i + 1}. ${m.tipo} - ${m.descripcion}`);
      console.log(`      Fórmula: ${m.formula} ${m.unidad}`);
      if (m.condicion) {
        console.log(`      Condición: ${m.condicion}`);
      }
      console.log('');
    });
    
    console.log('✅ LISTO PARA USAR\n');
    console.log('💡 PRÓXIMOS PASOS:');
    console.log('   1. Ve a http://localhost:3000/calculadora');
    console.log('   2. Verás la configuración "Roller Shade Manual"');
    console.log('   3. Edita las fórmulas según tus necesidades');
    console.log('   4. Genera una orden de producción para probar');
    console.log('');
    console.log('📝 NOTA: Todas las fórmulas son editables desde el panel web');
    
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

crearConfiguracionRollerShade();

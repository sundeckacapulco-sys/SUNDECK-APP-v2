/**
 * Configuración de Materiales Tecnoline - Actualizado Dic 2025
 * Basado en tablas oficiales del proveedor
 */
const mongoose = require('mongoose');

async function configurarMateriales() {
  await mongoose.connect('mongodb://localhost:27017/sundeck-crm');
  
  const ConfiguracionMateriales = require('../server/models/ConfiguracionMateriales');
  
  // Limpiar configuraciones anteriores
  await ConfiguracionMateriales.deleteMany({});
  console.log('✅ Configuraciones anteriores eliminadas');
  
  // ========================================
  // ROLLER SHADE (ENROLLABLES)
  // ========================================
  const rollerShade = new ConfiguracionMateriales({
    nombre: 'Roller Shade - Tecnoline 2025',
    sistema: 'Roller Shade',
    activo: true,
    
    reglasSeleccion: {
      // TUBOS MANUAL (según tabla pág 34)
      tubos: [
        {
          condicion: '!motorizado && ancho <= 1.9 && alto <= 1.7',
          diametro: '38mm',
          codigo: 'TUB38ENR',
          descripcion: 'Tubo 1 1/2" (38mm)'
        },
        {
          condicion: '!motorizado && ancho <= 2.5 && alto <= 2.7',
          diametro: '38mm',
          codigo: 'TUB-2M-REF',
          descripcion: 'Tubo 1 1/2" Reforzado (38mm)'
        },
        {
          condicion: '!motorizado && ancho <= 4.3 && alto <= 4.3',
          diametro: '70mm',
          codigo: 'TUBA-70-5.8',
          descripcion: 'Tubo 2 1/2" (70mm)'
        },
        {
          condicion: '!motorizado && ancho <= 4.7 && alto <= 5.0',
          diametro: '79mm',
          codigo: 'TUBA-79-5.8',
          descripcion: 'Tubo 3" (79mm)'
        },
        // TUBOS MOTORIZADO (según tabla pág 35)
        {
          condicion: 'motorizado && ancho <= 1.5 && alto <= 1.7',
          diametro: '38mm',
          codigo: 'TUB-2M-REF',
          descripcion: 'Tubo 1 1/2" Reforzado (38mm) - Motor 25mm'
        },
        {
          condicion: 'motorizado && ancho <= 3.0 && alto <= 4.0',
          diametro: '45mm',
          codigo: 'TUBSG-35-5.8',
          descripcion: 'Tubo 35SG (45mm) - Motor 35mm'
        },
        {
          condicion: 'motorizado && ancho <= 3.5 && alto <= 4.3',
          diametro: '45mm',
          codigo: 'TUBSG-45-5.8',
          descripcion: 'Tubo 45SG (45mm) - Motor 35/45mm'
        },
        {
          condicion: 'motorizado && ancho <= 4.5 && alto <= 4.8',
          diametro: '70mm',
          codigo: 'TUBA-70-5.8',
          descripcion: 'Tubo 2 1/2" (70mm) - Motor 45mm'
        },
        {
          condicion: 'motorizado && (ancho > 4.5 || alto > 4.8)',
          diametro: '79mm',
          codigo: 'TUBA-79-5.8',
          descripcion: 'Tubo 3" (79mm) - Motor 45mm'
        }
      ],
      
      // MECANISMOS (según tabla pág 32) - SIN SL-10
      mecanismos: [
        // MANUALES
        {
          condicion: '!motorizado && ancho <= 1.8 && alto <= 1.8',
          tipo: 'SL-16',
          codigo: 'MTEC-SL16',
          descripcion: 'Mecanismo SL-16'
        },
        {
          condicion: '!motorizado && ancho <= 2.7 && alto <= 4.0',
          tipo: 'SL-20',
          codigo: 'MTEC-SL20',
          descripcion: 'Mecanismo SL-20'
        },
        {
          condicion: '!motorizado && ancho <= 3.5 && alto <= 4.8',
          tipo: 'R-24',
          codigo: 'R-24',
          descripcion: 'Mecanismo Rollease R-24'
        },
        
        // MOTORES (según tabla pág 37) - SIN BATTERY 1.1Nm
        {
          condicion: 'motorizado && ancho <= 2.5 && alto <= 3.3',
          tipo: 'Motor',
          codigo: 'DM35LEU/S047-6N',
          descripcion: 'Motor 35mm 6N Baterías (6Nm)'
        },
        {
          condicion: 'motorizado && ancho <= 3.0 && alto <= 3.5',
          tipo: 'Motor',
          codigo: 'DM35F/SW016-6N',
          descripcion: 'Motor 35mm 6N WiFi (6Nm)'
        },
        {
          condicion: 'motorizado && ancho <= 3.5 && alto <= 3.8',
          tipo: 'Motor',
          codigo: 'DM35S016-6N',
          descripcion: 'Motor 35mm 6N Alámbrico (6Nm)'
        },
        {
          condicion: 'motorizado && ancho <= 4.0 && alto <= 4.0',
          tipo: 'Motor',
          codigo: 'DM35RL/SF016-10N',
          descripcion: 'Motor 35mm T. Manual (10Nm)'
        },
        {
          condicion: 'motorizado && ancho <= 4.3 && alto <= 4.3',
          tipo: 'Motor',
          codigo: 'DM35F/S016-10N',
          descripcion: 'Motor 35mm T. Electrónico (10Nm)'
        },
        {
          condicion: 'motorizado && ancho <= 5.0 && alto <= 5.0',
          tipo: 'Motor',
          codigo: 'DM45EQ/S043-10N',
          descripcion: 'Motor 45mm 10N Silencioso (10Nm)'
        },
        {
          condicion: 'motorizado && ancho <= 5.5 && alto <= 5.5',
          tipo: 'Motor',
          codigo: 'DM45RL/SF052-20N',
          descripcion: 'Motor 45mm 20N T. Manual (20Nm)'
        },
        {
          condicion: 'motorizado && (ancho > 5.5 || alto > 5.5)',
          tipo: 'Motor',
          codigo: 'DM45E/SW043-20N',
          descripcion: 'Motor 45mm 20N WiFi (20Nm)'
        }
      ]
    },
    
    // MATERIALES
    materiales: [
      {
        tipo: 'Tela',
        descripcion: 'Tela Enrollable',
        formula: 'alto + 0.25',
        formulaRotada: 'ancho',
        unidad: 'ml',
        puedeRotar: true,
        alturaMaxRotacion: 2.80,
        anchosRollo: [2.50, 3.00]
      },
      {
        tipo: 'Tubo',
        descripcion: 'Tubo Enrollable',
        formula: 'ancho - 0.03',
        unidad: 'ml'
      },
      {
        tipo: 'Accesorio',
        descripcion: 'Cinta doble cara (para Tubo)',
        formula: 'ancho - 0.03',
        unidad: 'ml'
      },
      // CONTRAPESO PLANO (rotada o con galería)
      {
        tipo: 'Contrapeso',
        descripcion: 'Contrapeso Plano (barra 5.80m)',
        condicion: 'rotada || (galeria && galeria !== "Sin galería")',
        formula: 'ancho - 0.03',
        unidad: 'ml'
      },
      {
        tipo: 'Accesorio',
        descripcion: 'Inserto para Contrapeso Plano',
        condicion: 'rotada || (galeria && galeria !== "Sin galería")',
        formula: 'ancho - 0.03',
        unidad: 'ml'
      },
      // CONTRAPESO OVALADO (normal sin galería)
      {
        tipo: 'Contrapeso',
        descripcion: 'Contrapeso Ovalado (barra 5.80m)',
        condicion: '!rotada && (!galeria || galeria === "Sin galería")',
        formula: 'ancho - 0.03',
        unidad: 'ml'
      },
      {
        tipo: 'Accesorio',
        descripcion: 'Cinta doble cara (para Contrapeso Ovalado)',
        condicion: '!rotada && (!galeria || galeria === "Sin galería")',
        formula: 'ancho - 0.03',
        unidad: 'ml'
      },
      {
        tipo: 'Accesorio',
        descripcion: 'Piola #5',
        condicion: '!rotada && (!galeria || galeria === "Sin galería")',
        formula: 'ancho - 0.03',
        unidad: 'ml'
      },
      {
        tipo: 'Cadena',
        descripcion: 'Cadena HD',
        condicion: '!motorizado',
        formula: 'alto * 2 + 0.5',
        unidad: 'ml'
      },
      {
        tipo: 'Soportes',
        descripcion: 'Soporte Enrollable',
        formula: 'ancho <= 1.5 ? 2 : (ancho <= 3.0 ? 3 : 4)',
        unidad: 'pza'
      },
      {
        tipo: 'Tapas',
        descripcion: 'Tapas para soporte',
        formula: '(ancho <= 1.5 ? 2 : (ancho <= 3.0 ? 3 : 4)) * 2',
        unidad: 'pza'
      },
      {
        tipo: 'Accesorio',
        descripcion: 'Kit de fijación',
        formula: 'ancho <= 1.5 ? 2 : (ancho <= 3.0 ? 3 : 4)',
        unidad: 'kit'
      },
      // NOTA: Motor y Control remoto vienen de la cotización/levantamiento, NO se calculan aquí
      {
        tipo: 'Accesorio',
        descripcion: 'Conector de cadena',
        condicion: '!motorizado',
        formula: '1',
        unidad: 'pza'
      },
      {
        tipo: 'Accesorio',
        descripcion: 'Tope de cadena',
        condicion: '!motorizado',
        formula: '1',
        unidad: 'pza'
      }
    ],
    
    optimizacion: {
      habilitada: true,
      longitudEstandar: 5.80,
      materialesOptimizables: [
        { tipo: 'tubo', longitudEstandar: 5.80, margenCorte: 0.03 },
        { tipo: 'contrapeso', longitudEstandar: 5.80, margenCorte: 0.03 }
      ]
    }
  });
  
  await rollerShade.save();
  console.log('✅ Roller Shade configurado');
  
  // ========================================
  // SHEER ELEGANCE (DUOLINE)
  // ========================================
  const sheerElegance = new ConfiguracionMateriales({
    nombre: 'Sheer Elegance - Tecnoline 2025',
    sistema: 'Sheer Elegance',
    activo: true,
    
    reglasSeleccion: {
      // TUBOS DUOLINE (según tabla pág 36)
      tubos: [
        {
          condicion: 'motorizado && ancho <= 1.5 && alto <= 1.7',
          diametro: '38mm',
          codigo: 'TUB-2M-REF',
          descripcion: 'Tubo 1 1/2" Reforzado (38mm) - Motor 25mm'
        },
        {
          condicion: 'ancho <= 3.0 && alto <= 4.0',
          diametro: '45mm',
          codigo: 'TUBSG-35-5.8',
          descripcion: 'Tubo 35SG (45mm) - Motor 35mm'
        }
      ],
      
      // MECANISMOS DUOLINE (según tabla pág 36)
      mecanismos: [
        // MANUAL
        {
          condicion: '!motorizado && ancho <= 3.0 && alto <= 4.0',
          tipo: 'MEC-DUO38',
          codigo: 'MEC-DUO38',
          descripcion: 'Mecanismo DUO38'
        },
        
        // MOTORES DUOLINE (según tabla pág 36 y 37)
        {
          condicion: 'motorizado && ancho <= 1.8 && alto <= 2.5',
          tipo: 'Motor',
          codigo: 'DM35LEU/S047-6N',
          descripcion: 'Motor 35mm 6N Baterías (6Nm)'
        },
        {
          condicion: 'motorizado && ancho <= 2.8 && alto <= 3.5',
          tipo: 'Motor',
          codigo: 'DM35F/SW016-6N',
          descripcion: 'Motor 35mm 6N WiFi (6Nm)'
        },
        {
          condicion: 'motorizado && (ancho > 2.8 || alto > 3.5)',
          tipo: 'Motor',
          codigo: 'DM35F/S016-10N',
          descripcion: 'Motor 35mm T. Electrónico (10Nm)'
        }
      ]
    },
    
    materiales: [
      {
        tipo: 'Tela',
        descripcion: 'Tela Sheer Elegance',
        formula: 'alto + 0.25',
        formulaRotada: 'ancho',
        unidad: 'ml',
        puedeRotar: true,
        alturaMaxRotacion: 2.80,
        anchosRollo: [2.50, 3.00]
      },
      {
        tipo: 'Tubo',
        descripcion: 'Tubo Sheer Elegance',
        formula: 'ancho - 0.03',
        unidad: 'ml'
      },
      // TODO: Sheer Elegance tiene configuración diferente - pendiente definir materiales específicos
      {
        tipo: 'Cadena',
        descripcion: 'Cadena HD',
        condicion: '!motorizado',
        formula: 'alto * 2 + 0.5',
        unidad: 'ml'
      },
      {
        tipo: 'Soportes',
        descripcion: 'Soporte Sheer Elegance',
        formula: 'ancho <= 1.5 ? 2 : (ancho <= 3.0 ? 3 : 4)',
        unidad: 'pza'
      },
      {
        tipo: 'Tapas',
        descripcion: 'Tapas para soporte',
        formula: '(ancho <= 1.5 ? 2 : (ancho <= 3.0 ? 3 : 4)) * 2',
        unidad: 'pza'
      },
      {
        tipo: 'Accesorio',
        descripcion: 'Kit de fijación',
        formula: 'ancho <= 1.5 ? 2 : (ancho <= 3.0 ? 3 : 4)',
        unidad: 'kit'
      },
      // NOTA: Motor y Control remoto vienen de la cotización/levantamiento, NO se calculan aquí
      {
        tipo: 'Accesorio',
        descripcion: 'Conector de cadena',
        condicion: '!motorizado',
        formula: '1',
        unidad: 'pza'
      },
      {
        tipo: 'Accesorio',
        descripcion: 'Tope de cadena',
        condicion: '!motorizado',
        formula: '1',
        unidad: 'pza'
      }
    ],
    
    optimizacion: {
      habilitada: true,
      longitudEstandar: 5.80,
      materialesOptimizables: [
        { tipo: 'tubo', longitudEstandar: 5.80, margenCorte: 0.03 },
        { tipo: 'contrapeso', longitudEstandar: 5.80, margenCorte: 0.03 }
      ]
    }
  });
  
  await sheerElegance.save();
  console.log('✅ Sheer Elegance configurado');
  
  // ========================================
  // RESUMEN
  // ========================================
  const configs = await ConfiguracionMateriales.find({}).lean();
  console.log('\n========================================');
  console.log('CONFIGURACIÓN TECNOLINE 2025 COMPLETADA');
  console.log('========================================\n');
  
  configs.forEach(c => {
    console.log(`📋 ${c.sistema}:`);
    console.log(`   - Tubos: ${c.reglasSeleccion?.tubos?.length || 0}`);
    console.log(`   - Mecanismos: ${c.reglasSeleccion?.mecanismos?.length || 0}`);
    console.log(`   - Materiales: ${c.materiales?.length || 0}`);
    console.log('');
  });
  
  console.log('EXCLUIDOS:');
  console.log('   ❌ SL-10 (no se usa)');
  console.log('   ❌ Motor 25mm BATTERY 1.1Nm (no se usa)');
  
  await mongoose.disconnect();
  console.log('\n✅ Configuración guardada exitosamente');
}

configurarMateriales().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});

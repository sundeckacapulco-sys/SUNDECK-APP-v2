/**
 * Script para actualizar configuraciones de materiales con datos correctos
 * Basado en: docs/REGLAS_CALCULADORA_v1.2.md
 * Ejecutar: node server/scripts/actualizarConfiguracionesMateriales.js
 */

const mongoose = require('mongoose');
const ConfiguracionMateriales = require('../models/ConfiguracionMateriales');
const logger = require('../config/logger');
require('dotenv').config();

async function actualizarConfiguraciones() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('\n🔄 ACTUALIZANDO CONFIGURACIONES DE MATERIALES\n');
    console.log('Basado en: docs/REGLAS_CALCULADORA_v1.2.md\n');
    console.log('='.repeat(60));
    
    // BORRAR CONFIGURACIONES ANTIGUAS
    console.log('\n🗑️  Eliminando configuraciones antiguas...');
    await ConfiguracionMateriales.deleteMany({});
    console.log('✅ Configuraciones antiguas eliminadas\n');
    
    // ============================================
    // 1. ROLLER SHADE
    // ============================================
    console.log('📋 1. ROLLER SHADE (Enrollable)');
    console.log('-'.repeat(60));
    
    const rollerShade = new ConfiguracionMateriales({
      sistema: 'Roller Shade',
      activo: true,
      
      // REGLAS DE SELECCIÓN DE TUBOS
      reglasSeleccion: {
        tubos: [
          {
            condicion: { campo: 'ancho', operador: '<=', valor: 2.50, motorizado: false },
            resultado: { diametro: '38mm', codigo: 'T38-M', descripcion: 'Tubo 38mm Manual' }
          },
          {
            condicion: { campo: 'ancho', operador: '>', valor: 2.50, operador2: '<=', valor2: 3.00, motorizado: false },
            resultado: { diametro: '50mm', codigo: 'T50-M', descripcion: 'Tubo 50mm Manual' }
          },
          {
            condicion: { campo: 'ancho', operador: '<', valor: 2.50, motorizado: true },
            resultado: { diametro: '35mm', codigo: 'T35', descripcion: 'Tubo 35mm Motorizado' }
          },
          {
            condicion: { campo: 'ancho', operador: '>=', valor: 2.50, operador2: '<=', valor2: 3.00, motorizado: true },
            resultado: { diametro: '50mm', codigo: 'T50', descripcion: 'Tubo 50mm Motorizado' }
          },
          {
            condicion: { campo: 'ancho', operador: '>', valor: 3.00, operador2: '<=', valor2: 4.00, motorizado: true },
            resultado: { diametro: '70mm', codigo: 'T70', descripcion: 'Tubo 70mm Motorizado' }
          },
          {
            condicion: { campo: 'ancho', operador: '>', valor: 4.00, motorizado: true },
            resultado: { diametro: '79mm', codigo: 'T79', descripcion: 'Tubo 79mm Motorizado' }
          }
        ],
        
        mecanismos: [
          {
            condicion: { campo: 'ancho', operador: '<=', valor: 2.50, motorizado: false },
            resultado: { tipo: 'Kit SL-16', codigo: 'SL-16', descripcion: 'Kit completo: Clutch + Soportes' }
          },
          {
            condicion: { campo: 'ancho', operador: '>', valor: 2.50, operador2: '<=', valor2: 3.00, motorizado: false },
            resultado: { tipo: 'Kit R-24', codigo: 'R-24', descripcion: 'Kit completo: Clutch + Soportes' }
          },
          {
            condicion: { campo: 'ancho', operador: '>', valor: 3.00 },
            resultado: { tipo: 'Motor', codigo: 'MOTOR', descripcion: 'Motor + Soportes básicos', obligatorio: true }
          }
        ]
      },
      
      // MATERIALES Y FÓRMULAS
      materiales: [
        {
          tipo: 'Tubo',
          codigo: 'TUB',
          descripcion: 'Tubo enrollable',
          formula: 'ancho - 0.005',
          unidad: 'ml',
          longitudEstandar: 5.80,
          optimizar: true
        },
        {
          tipo: 'Tela',
          codigo: 'TELA',
          descripcion: 'Tela para persiana',
          formula: 'alto + 0.25',
          formulaConGaleria: 'alto + 0.50',
          formulaRotada: 'ancho + 0.03',
          unidad: 'ml',
          anchosRollo: [2.00, 2.50, 3.00],
          puedeRotar: true,
          alturaMaxRotada: 2.80,
          observaciones: 'Altura máxima rotada: 2.80m. Si supera → termosello'
        },
        {
          tipo: 'Cadena',
          codigo: 'CADENA',
          descripcion: 'Cadena de control',
          formula: '(alto - 0.80) * 2',
          unidad: 'ml',
          soloManual: true
        },
        {
          tipo: 'Conector Cadena',
          codigo: 'CONECTOR',
          descripcion: 'Conector de cadena',
          formula: '1',
          unidad: 'pza',
          soloManual: true
        },
        {
          tipo: 'Tope Cadena',
          codigo: 'TOPE',
          descripcion: 'Tope inferior de cadena',
          formula: '1',
          unidad: 'pza',
          soloManual: true
        },
        {
          tipo: 'Contrapeso',
          codigo: 'CONTRAPESO',
          descripcion: 'Contrapeso ovalado sin acabado',
          formula: 'ancho - 0.030',
          unidad: 'ml',
          longitudEstandar: 5.80,
          optimizar: true
        },
        {
          tipo: 'Contrapeso Elegance',
          codigo: 'CONTRAPESO-ELEGANCE',
          descripcion: 'Contrapeso Elegance',
          formula: 'ancho - 0.030',
          formulaConGaleria: 'ancho',
          unidad: 'ml',
          longitudEstandar: 5.80,
          optimizar: true
        },
        {
          tipo: 'Tapas Contrapeso',
          codigo: 'TAPAS-CONTRA',
          descripcion: 'Tapas laterales de contrapeso',
          formula: '2',
          unidad: 'pza'
        },
        {
          tipo: 'Cinta Adhesiva',
          codigo: 'CINTA',
          descripcion: 'Cinta adhesiva doble cara',
          formula: 'ancho * 2',
          unidad: 'ml',
          observaciones: 'Una para tubo, una para contrapeso'
        },
        {
          tipo: 'Inserto Contrapeso',
          codigo: 'INSERTO-CONTRA',
          descripcion: 'Inserto de contrapeso ovalado',
          formula: 'ancho',
          unidad: 'ml'
        },
        {
          tipo: 'Inserto Adherible',
          codigo: 'INSERTO-ELEGANCE',
          descripcion: 'Inserto adherible para Elegance',
          formula: 'ancho',
          unidad: 'ml'
        },
        {
          tipo: 'Madera Galería',
          codigo: 'MADERA-GALERIA',
          descripcion: 'Madera para galería',
          formula: 'ancho <= 2.40 ? 1 : 2',
          unidad: 'pza',
          longitudEstandar: 2.40,
          optimizar: true,
          opcional: true
        }
      ],
      
      // COLORES DISPONIBLES
      colores: ['Ivory', 'Chocolate', 'Gris', 'Negro', 'Blanco'],
      
      // OPTIMIZACIÓN
      optimizacion: {
        tubos: {
          longitudEstandar: 5.80,
          minimoAprovechable: 0.50,
          toleranciaCorte: 0.005
        },
        contrapesos: {
          longitudEstandar: 5.80,
          minimoAprovechable: 0.50,
          toleranciaCorte: 0.005
        }
      }
    });
    
    await rollerShade.save();
    console.log('✅ Roller Shade configurado\n');
    
    // ============================================
    // 2. SHEER ELEGANCE
    // ============================================
    console.log('📋 2. SHEER ELEGANCE');
    console.log('-'.repeat(60));
    
    const sheerElegance = new ConfiguracionMateriales({
      sistema: 'Sheer Elegance',
      activo: true,
      
      reglasSeleccion: {
        tubos: [
          {
            condicion: { campo: 'ancho', operador: '<=', valor: 2.50, motorizado: true },
            resultado: { diametro: '35mm', codigo: 'TUB-35-MOT', descripcion: 'Tubo 35mm Motorizado' }
          },
          {
            condicion: { campo: 'ancho', operador: '>', valor: 2.50, motorizado: true },
            resultado: { diametro: '50mm', codigo: 'TUB-50-MOT', descripcion: 'Tubo 50mm Motorizado' }
          },
          {
            condicion: { campo: 'ancho', operador: '<=', valor: 2.50, motorizado: false },
            resultado: { diametro: '38mm', codigo: 'TUB-38-MAN', descripcion: 'Tubo 38mm Manual' }
          },
          {
            condicion: { campo: 'ancho', operador: '>', valor: 2.50, motorizado: false },
            resultado: { diametro: '50mm', codigo: 'TUB-50-MAN', descripcion: 'Tubo 50mm Manual' }
          }
        ],
        
        mecanismos: [
          {
            condicion: { campo: 'ancho', operador: '<=', valor: 3.00, motorizado: false },
            resultado: { tipo: 'SL-16', codigo: 'MEC-SL16', descripcion: 'Mecanismo SL-16 + soportes' }
          }
        ]
      },
      
      materiales: [
        {
          tipo: 'Tubo',
          codigo: 'TUB',
          descripcion: 'Tubo',
          formula: 'ancho - 0.005',
          unidad: 'ml',
          longitudEstandar: 5.80,
          optimizar: true
        },
        {
          tipo: 'Cofre/Fascia',
          codigo: 'COFRE',
          descripcion: 'Cofre decorativo',
          formula: 'ancho - 0.005',
          unidad: 'ml',
          longitudEstandar: 5.80,
          optimizar: true
        },
        {
          tipo: 'Tapas Cofre',
          codigo: 'TAPAS-COFRE',
          descripcion: 'Tapas para cofre (juego)',
          formula: '1',
          unidad: 'juego'
        },
        {
          tipo: 'Inserto Cofre',
          codigo: 'INSERTO-COFRE',
          descripcion: 'Inserto del cofre',
          formula: 'ancho',
          unidad: 'ml'
        },
        {
          tipo: 'Tela Sheer',
          codigo: 'TELA-SHEER',
          descripcion: 'Tela Sheer Elegance',
          formula: '(alto * 2) + 0.35',
          unidad: 'ml',
          anchosRollo: [2.80, 3.00],
          puedeRotar: false,
          observaciones: 'NO se puede rotar'
        },
        {
          tipo: 'Barra Giro',
          codigo: 'BARRA-GIRO',
          descripcion: 'Barra de giro',
          formula: 'ancho - 0.035',
          unidad: 'ml',
          longitudEstandar: 5.80,
          optimizar: true
        },
        {
          tipo: 'Tapas Barra Giro',
          codigo: 'TAPAS-BARRA',
          descripcion: 'Tapas barra de giro (juego)',
          formula: '1',
          unidad: 'juego'
        },
        {
          tipo: 'Contrapeso Oculto',
          codigo: 'CONTRAPESO',
          descripcion: 'Contrapeso oculto',
          formula: 'ancho - 0.030',
          unidad: 'ml',
          longitudEstandar: 5.80,
          optimizar: true
        },
        {
          tipo: 'Tapas Contrapeso',
          codigo: 'TAPAS-CONTRA',
          descripcion: 'Tapas contrapeso (juego)',
          formula: '1',
          unidad: 'juego'
        },
        {
          tipo: 'Cadena Sin Fin',
          codigo: 'CADENA',
          descripcion: 'Cadena sin fin',
          formula: 'alto - 0.40',
          unidad: 'ml'
        },
        {
          tipo: 'Soportes',
          codigo: 'SOPORTES',
          descripcion: 'Soportes',
          formula: 'Math.ceil(ancho / 0.60)',
          unidad: 'pza',
          observaciones: '1 cada 60cm'
        },
        {
          tipo: 'Cinta Doble Cara',
          codigo: 'CINTA',
          descripcion: 'Cinta doble cara',
          formula: 'ancho - 0.005',
          unidad: 'ml'
        }
      ],
      
      colores: ['Ivory', 'Chocolate', 'Gris', 'Negro'],
      
      optimizacion: {
        tubos: {
          longitudEstandar: 5.80,
          minimoAprovechable: 0.50,
          toleranciaCorte: 0.005
        }
      }
    });
    
    await sheerElegance.save();
    console.log('✅ Sheer Elegance configurado\n');
    
    // ============================================
    // 3. TOLDOS CONTEMPO
    // ============================================
    console.log('📋 3. TOLDOS CONTEMPO (Caída Vertical)');
    console.log('-'.repeat(60));
    
    const toldosContempo = new ConfiguracionMateriales({
      sistema: 'Toldos Contempo',
      activo: true,
      
      reglasSeleccion: {
        kits: [
          {
            condicion: { campo: 'ancho', operador: '<=', valor: 4.00 },
            resultado: { tipo: 'Kit 4.00m', codigo: 'KIT-4.00', descripcion: 'Kit Toldo Contempo 4.00m', longitud: 4.00 }
          },
          {
            condicion: { campo: 'ancho', operador: '>', valor: 4.00 },
            resultado: { tipo: 'Kit 5.80m', codigo: 'KIT-5.80', descripcion: 'Kit Toldo Contempo 5.80m', longitud: 5.80 }
          }
        ]
      },
      
      materiales: [
        {
          tipo: 'Kit Toldo',
          codigo: 'KIT',
          descripcion: 'Kit completo (Tubo + Contrapeso + Soportes + Mecanismo)',
          formula: '1',
          unidad: 'kit',
          corte: {
            tubo: 'ancho - 0.12',
            contrapeso: 'ancho - 0.12'
          },
          observaciones: 'Kit incluye TODO. Tubo y contrapeso se cortan a medida'
        },
        {
          tipo: 'Tela Screen',
          codigo: 'TELA-SCREEN',
          descripcion: 'Tela Screen',
          formula: 'alto + 0.25',
          formulaRotada: 'ancho + 0.03',
          unidad: 'ml',
          anchosRollo: [2.50, 3.00],
          puedeRotar: true,
          alturaMaxRotada: 2.80,
          observaciones: 'Casi siempre se rota. Altura máx rotada: 2.80m'
        },
        {
          tipo: 'Cable Acerado',
          codigo: 'CABLE',
          descripcion: 'Cable acerado (guías laterales)',
          formula: 'alto * 2',
          unidad: 'ml',
          observaciones: 'Alto por 2'
        }
      ],
      
      colores: ['Blanco', 'Negro', 'Gris'],
      
      optimizacion: {
        tela: {
          anchosDisponibles: [2.50, 3.00],
          alturaMaxRotada: 2.80,
          toleranciaCorte: 0.03
        }
      }
    });
    
    await toldosContempo.save();
    console.log('✅ Toldos Contempo configurado\n');
    
    // RESUMEN FINAL
    console.log('='.repeat(60));
    console.log('✅ ACTUALIZACIÓN COMPLETADA\n');
    
    const total = await ConfiguracionMateriales.countDocuments();
    console.log(`📊 Total de configuraciones: ${total}`);
    console.log('   - Roller Shade: ✅');
    console.log('   - Sheer Elegance: ✅');
    console.log('   - Toldos Contempo: ✅');
    
    console.log('\n🎉 Todas las configuraciones actualizadas correctamente\n');
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

actualizarConfiguraciones();

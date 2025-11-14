/**
 * Script para actualizar configuraciones de materiales con datos correctos
 * Basado en: docs/REGLAS_CALCULADORA_v1.2.md
 * Ejecutar: node server/scripts/actualizarConfiguracionesCorrectas.js
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
      nombre: 'Roller Shade - Configuración Completa',
      sistema: 'Roller Shade',
      activo: true,
      
      // REGLAS DE SELECCIÓN
      reglasSeleccion: {
        tubos: [
          {
            condicion: 'ancho <= 2.50 && !motorizado',
            diametro: '38mm',
            codigo: 'T38-M',
            descripcion: 'Tubo 38mm Manual (hasta 2.50m)'
          },
          {
            condicion: 'ancho > 2.50 && ancho <= 3.00 && !motorizado',
            diametro: '50mm',
            codigo: 'T50-M',
            descripcion: 'Tubo 50mm Manual (2.50m - 3.00m)'
          },
          {
            condicion: 'ancho < 2.50 && motorizado',
            diametro: '35mm',
            codigo: 'T35',
            descripcion: 'Tubo 35mm Motorizado'
          },
          {
            condicion: 'ancho >= 2.50 && ancho <= 3.00 && motorizado',
            diametro: '50mm',
            codigo: 'T50',
            descripcion: 'Tubo 50mm Motorizado'
          },
          {
            condicion: 'ancho > 3.00 && ancho <= 4.00 && motorizado',
            diametro: '70mm',
            codigo: 'T70',
            descripcion: 'Tubo 70mm Motorizado (3.00m - 4.00m)'
          },
          {
            condicion: 'ancho > 4.00 && motorizado',
            diametro: '79mm',
            codigo: 'T79',
            descripcion: 'Tubo 79mm Motorizado (mayor a 4.00m)'
          }
        ],
        
        mecanismos: [
          {
            condicion: 'ancho <= 2.50 && !motorizado',
            tipo: 'Kit SL-16',
            codigo: 'SL-16',
            descripcion: 'Kit completo: Clutch + Soportes',
            incluye: ['Clutch', 'Drive End', 'Idle End']
          },
          {
            condicion: 'ancho > 2.50 && ancho <= 3.00 && !motorizado',
            tipo: 'Kit R-24',
            codigo: 'R-24',
            descripcion: 'Kit completo: Clutch + Soportes',
            incluye: ['Clutch', 'Drive End', 'Idle End']
          },
          {
            condicion: 'ancho > 3.00 || motorizado',
            tipo: 'Motor',
            codigo: 'MOTOR',
            descripcion: 'Motor tubular + Soportes básicos',
            incluye: ['Motor', 'Soportes básicos']
          }
        ]
      },
      
      // MATERIALES
      materiales: [
        {
          tipo: 'Tubo',
          descripcion: 'Tubo enrollable',
          unidad: 'ml',
          formula: 'ancho - 0.005',
          observaciones: 'Ancho menos 5mm. Longitud estándar: 5.80m'
        },
        {
          tipo: 'Tela',
          descripcion: 'Tela para persiana',
          unidad: 'ml',
          formula: 'alto + 0.25',
          condicion: '!rotada && !galeria',
          observaciones: 'Alto + 25cm para enrolle'
        },
        {
          tipo: 'Tela',
          descripcion: 'Tela para persiana con galería',
          unidad: 'ml',
          formula: 'alto + 0.50',
          condicion: '!rotada && galeria',
          observaciones: 'Alto + 25cm enrolle + 25cm galería'
        },
        {
          tipo: 'Tela',
          descripcion: 'Tela rotada',
          unidad: 'ml',
          formula: 'ancho + 0.03',
          condicion: 'rotada && alto <= 2.80',
          observaciones: 'Ancho + 3cm. Altura máxima: 2.80m'
        },
        {
          tipo: 'Cadena',
          descripcion: 'Cadena de control',
          unidad: 'ml',
          formula: '(alto - 0.80) * 2',
          condicion: '!motorizado',
          observaciones: 'Doble de la altura de operación'
        },
        {
          tipo: 'Accesorios',
          descripcion: 'Conector de cadena',
          unidad: 'pza',
          formula: '1',
          condicion: '!motorizado'
        },
        {
          tipo: 'Accesorios',
          descripcion: 'Tope de cadena',
          unidad: 'pza',
          formula: '1',
          condicion: '!motorizado'
        },
        {
          tipo: 'Contrapeso',
          descripcion: 'Contrapeso ovalado',
          unidad: 'ml',
          formula: 'ancho - 0.030',
          observaciones: 'Ancho menos 30mm. Longitud estándar: 5.80m'
        },
        {
          tipo: 'Tapas',
          descripcion: 'Tapas laterales de contrapeso',
          unidad: 'pza',
          formula: '2'
        },
        {
          tipo: 'Cinta',
          descripcion: 'Cinta adhesiva doble cara',
          unidad: 'ml',
          formula: 'ancho * 2',
          observaciones: 'Una para tubo, una para contrapeso'
        },
        {
          tipo: 'Insertos',
          descripcion: 'Inserto de contrapeso',
          unidad: 'ml',
          formula: 'ancho'
        },
        {
          tipo: 'Galería',
          descripcion: 'Madera para galería',
          unidad: 'pza',
          formula: 'ancho <= 2.40 ? 1 : 2',
          condicion: 'galeria',
          observaciones: 'Longitud estándar: 2.40m por pieza'
        }
      ],
      
      // COLORES
      coloresDisponibles: [
        { nombre: 'Ivory', codigo: 'IVO' },
        { nombre: 'Chocolate', codigo: 'CHO' },
        { nombre: 'Gris', codigo: 'GRI' },
        { nombre: 'Negro', codigo: 'NEG' },
        { nombre: 'Blanco', codigo: 'BLA' }
      ],
      
      // OPTIMIZACIÓN
      optimizacion: {
        habilitada: true,
        longitudEstandar: 5.80,
        materialesOptimizables: [
          { tipo: 'Tubo', longitudEstandar: 5.80, margenCorte: 0.005 },
          { tipo: 'Contrapeso', longitudEstandar: 5.80, margenCorte: 0.005 }
        ]
      },
      
      // REGLAS ESPECIALES
      reglasEspeciales: [
        {
          nombre: 'Motorización obligatoria',
          descripcion: 'Anchos mayores a 3.00m requieren motorización',
          condicion: 'ancho > 3.00',
          accion: 'motorizado = true',
          prioridad: 'alta'
        },
        {
          nombre: 'Altura máxima rotada',
          descripcion: 'Tela rotada solo hasta 2.80m de alto',
          condicion: 'rotada && alto > 2.80',
          accion: 'termosello = true',
          prioridad: 'alta'
        }
      ]
    });
    
    await rollerShade.save();
    console.log('✅ Roller Shade configurado\n');
    
    // ============================================
    // 2. SHEER ELEGANCE
    // ============================================
    console.log('📋 2. SHEER ELEGANCE');
    console.log('-'.repeat(60));
    
    const sheerElegance = new ConfiguracionMateriales({
      nombre: 'Sheer Elegance - Configuración Completa',
      sistema: 'Sheer Elegance',
      activo: true,
      
      reglasSeleccion: {
        tubos: [
          {
            condicion: 'ancho <= 2.50 && motorizado',
            diametro: '35mm',
            codigo: 'TUB-35-MOT',
            descripcion: 'Tubo 35mm Motorizado'
          },
          {
            condicion: 'ancho > 2.50 && motorizado',
            diametro: '50mm',
            codigo: 'TUB-50-MOT',
            descripcion: 'Tubo 50mm Motorizado'
          },
          {
            condicion: 'ancho <= 2.50 && !motorizado',
            diametro: '38mm',
            codigo: 'TUB-38-MAN',
            descripcion: 'Tubo 38mm Manual'
          },
          {
            condicion: 'ancho > 2.50 && !motorizado',
            diametro: '50mm',
            codigo: 'TUB-50-MAN',
            descripcion: 'Tubo 50mm Manual'
          }
        ],
        
        mecanismos: [
          {
            condicion: 'ancho <= 3.00 && !motorizado',
            tipo: 'SL-16',
            codigo: 'MEC-SL16',
            descripcion: 'Mecanismo SL-16 + soportes',
            incluye: ['Mecanismo', 'Soportes']
          }
        ]
      },
      
      materiales: [
        {
          tipo: 'Tubo',
          descripcion: 'Tubo',
          unidad: 'ml',
          formula: 'ancho - 0.005'
        },
        {
          tipo: 'Cofre',
          descripcion: 'Cofre/Fascia decorativo',
          unidad: 'ml',
          formula: 'ancho - 0.005'
        },
        {
          tipo: 'Tapas',
          descripcion: 'Tapas para cofre',
          unidad: 'juego',
          formula: '1'
        },
        {
          tipo: 'Insertos',
          descripcion: 'Inserto del cofre',
          unidad: 'ml',
          formula: 'ancho'
        },
        {
          tipo: 'Tela',
          descripcion: 'Tela Sheer Elegance',
          unidad: 'ml',
          formula: '(alto * 2) + 0.35',
          observaciones: 'NO se puede rotar. Anchos: 2.80m y 3.00m'
        },
        {
          tipo: 'Barra de Giro',
          descripcion: 'Barra de giro superior',
          unidad: 'ml',
          formula: 'ancho - 0.035'
        },
        {
          tipo: 'Tapas',
          descripcion: 'Tapas barra de giro',
          unidad: 'juego',
          formula: '1'
        },
        {
          tipo: 'Contrapeso',
          descripcion: 'Contrapeso oculto',
          unidad: 'ml',
          formula: 'ancho - 0.030'
        },
        {
          tipo: 'Tapas',
          descripcion: 'Tapas contrapeso',
          unidad: 'juego',
          formula: '1'
        },
        {
          tipo: 'Cadena',
          descripcion: 'Cadena sin fin',
          unidad: 'ml',
          formula: 'alto - 0.40',
          condicion: '!motorizado'
        },
        {
          tipo: 'Soportes',
          descripcion: 'Soportes',
          unidad: 'pza',
          formula: 'Math.ceil(ancho / 0.60)',
          observaciones: '1 cada 60cm'
        },
        {
          tipo: 'Cinta',
          descripcion: 'Cinta doble cara',
          unidad: 'ml',
          formula: 'ancho - 0.005'
        }
      ],
      
      coloresDisponibles: [
        { nombre: 'Ivory', codigo: 'IVO' },
        { nombre: 'Chocolate', codigo: 'CHO' },
        { nombre: 'Gris', codigo: 'GRI' },
        { nombre: 'Negro', codigo: 'NEG' }
      ],
      
      optimizacion: {
        habilitada: true,
        longitudEstandar: 5.80,
        materialesOptimizables: [
          { tipo: 'Tubo', longitudEstandar: 5.80, margenCorte: 0.005 },
          { tipo: 'Cofre', longitudEstandar: 5.80, margenCorte: 0.005 },
          { tipo: 'Barra de Giro', longitudEstandar: 5.80, margenCorte: 0.005 },
          { tipo: 'Contrapeso', longitudEstandar: 5.80, margenCorte: 0.005 }
        ]
      },
      
      reglasEspeciales: [
        {
          nombre: 'Ancho máximo',
          descripcion: 'Ancho máximo 3.00m',
          condicion: 'ancho > 3.00',
          accion: 'error',
          prioridad: 'alta'
        },
        {
          nombre: 'Tela no rotable',
          descripcion: 'La tela Sheer NO se puede rotar',
          condicion: 'true',
          accion: 'rotada = false',
          prioridad: 'alta'
        }
      ]
    });
    
    await sheerElegance.save();
    console.log('✅ Sheer Elegance configurado\n');
    
    // ============================================
    // 3. TOLDOS CONTEMPO
    // ============================================
    console.log('📋 3. TOLDOS CONTEMPO (Caída Vertical)');
    console.log('-'.repeat(60));
    
    const toldosContempo = new ConfiguracionMateriales({
      nombre: 'Toldos Contempo - Configuración Completa',
      sistema: 'Toldos Contempo',
      activo: true,
      
      reglasSeleccion: {
        kits: [
          {
            condicion: 'ancho <= 4.00',
            tamano: '4.00m',
            codigo: 'KIT-4.00',
            descripcion: 'Kit Toldo Contempo 4.00m'
          },
          {
            condicion: 'ancho > 4.00',
            tamano: '5.80m',
            codigo: 'KIT-5.80',
            descripcion: 'Kit Toldo Contempo 5.80m'
          }
        ]
      },
      
      materiales: [
        {
          tipo: 'Kit',
          descripcion: 'Kit Toldo Contempo (completo)',
          unidad: 'kit',
          formula: '1',
          observaciones: 'Incluye: Tubo + Contrapeso + Soportes + Mecanismo. Se corta a: ancho - 0.12'
        },
        {
          tipo: 'Tela',
          descripcion: 'Tela Screen',
          unidad: 'ml',
          formula: 'alto + 0.25',
          condicion: '!rotada',
          observaciones: 'Alto + 25cm para enrolle'
        },
        {
          tipo: 'Tela',
          descripcion: 'Tela Screen rotada',
          unidad: 'ml',
          formula: 'ancho + 0.03',
          condicion: 'rotada && alto <= 2.80',
          observaciones: 'Ancho + 3cm. Altura máxima: 2.80m. Casi siempre se rota'
        },
        {
          tipo: 'Cable',
          descripcion: 'Cable acerado (guías laterales)',
          unidad: 'ml',
          formula: 'alto * 2',
          observaciones: 'Alto por 2'
        }
      ],
      
      coloresDisponibles: [
        { nombre: 'Blanco', codigo: 'BLA' },
        { nombre: 'Negro', codigo: 'NEG' },
        { nombre: 'Gris', codigo: 'GRI' }
      ],
      
      optimizacion: {
        habilitada: false,
        longitudEstandar: 5.80
      },
      
      reglasEspeciales: [
        {
          nombre: 'Altura máxima rotada',
          descripcion: 'Tela rotada solo hasta 2.80m de alto',
          condicion: 'rotada && alto > 2.80',
          accion: 'termosello = true',
          prioridad: 'alta'
        },
        {
          nombre: 'Rotación preferida',
          descripcion: 'Casi siempre se rota la tela en toldos',
          condicion: 'ancho > 2.50',
          accion: 'rotada = true',
          prioridad: 'media'
        }
      ]
    });
    
    await toldosContempo.save();
    console.log('✅ Toldos Contempo configurado\n');
    
    // RESUMEN FINAL
    console.log('='.repeat(60));
    console.log('✅ ACTUALIZACIÓN COMPLETADA\n');
    
    const total = await ConfiguracionMateriales.countDocuments();
    const configs = await ConfiguracionMateriales.find({}, 'nombre sistema activo');
    
    console.log(`📊 Total de configuraciones: ${total}\n`);
    configs.forEach(config => {
      console.log(`   ✅ ${config.nombre}`);
      console.log(`      Sistema: ${config.sistema}`);
      console.log(`      Estado: ${config.activo ? 'Activo' : 'Inactivo'}\n`);
    });
    
    console.log('🎉 Todas las configuraciones actualizadas correctamente\n');
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

actualizarConfiguraciones();

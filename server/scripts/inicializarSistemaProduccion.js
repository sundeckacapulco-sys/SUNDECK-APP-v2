/**
 * Script para inicializar el sistema de producción
 * Carga configuraciones, inventario inicial y datos de ejemplo
 * 
 * Ejecutar: node server/scripts/inicializarSistemaProduccion.js
 */

const mongoose = require('mongoose');
const ConfiguracionMateriales = require('../models/ConfiguracionMateriales');
const Almacen = require('../models/Almacen');
const SobranteMaterial = require('../models/SobranteMaterial');
const logger = require('../config/logger');
require('dotenv').config();

async function inicializarSistema() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    logger.info('Conectado a MongoDB');
    
    console.log('\n🚀 INICIALIZANDO SISTEMA DE PRODUCCIÓN\n');
    
    // PASO 1: Configuraciones de Materiales
    await cargarConfiguracionesMateriales();
    
    // PASO 2: Inventario Inicial
    await cargarInventarioInicial();
    
    // PASO 3: Sobrantes de Ejemplo
    await cargarSobrantesEjemplo();
    
    console.log('\n✅ SISTEMA INICIALIZADO CORRECTAMENTE\n');
    
    // Mostrar resumen
    await mostrarResumen();
    
    process.exit(0);
    
  } catch (error) {
    logger.error('Error inicializando sistema', { error: error.message });
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

async function cargarConfiguracionesMateriales() {
  console.log('📋 Cargando configuraciones de materiales...');
  
  const configuraciones = [
    // ROLLER SHADE
    {
      nombre: 'Roller Shade - Configuración Estándar',
      sistema: 'Roller Shade',
      activo: true,
      reglasSeleccion: {
        tubos: [
          {
            condicion: 'ancho <= 2.50 && esManual',
            diametro: '38mm',
            codigo: 'T38',
            descripcion: 'Tubo 38mm (hasta 2.50m manual)'
          },
          {
            condicion: 'ancho > 2.50 && ancho <= 3.00 && esManual',
            diametro: '50mm',
            codigo: 'T50',
            descripcion: 'Tubo 50mm (2.50m - 3.00m manual)'
          },
          {
            condicion: 'ancho > 3.00 || motorizado',
            diametro: '65mm',
            codigo: 'T65',
            descripcion: 'Tubo 65mm (mayor a 3.00m o motorizado)'
          }
        ],
        mecanismos: [
          {
            condicion: 'ancho <= 2.50 && esManual',
            tipo: 'Mecanismo',
            codigo: 'SL-16',
            descripcion: 'Mecanismo SL-16 (hasta 2.50m)',
            incluye: ['Clutch', 'Soportes', 'Cadena']
          },
          {
            condicion: 'ancho > 2.50 && ancho <= 3.00 && esManual',
            tipo: 'Mecanismo',
            codigo: 'R-24',
            descripcion: 'Mecanismo R-24 (2.50m - 3.00m)',
            incluye: ['Clutch', 'Soportes', 'Cadena']
          },
          {
            condicion: 'ancho > 3.00 || motorizado',
            tipo: 'Motor',
            codigo: 'MOTOR',
            descripcion: 'Motor tubular (obligatorio > 3.00m)',
            incluye: ['Motor', 'Control remoto', 'Soportes']
          }
        ]
      },
      materiales: [
        {
          tipo: 'Tela',
          descripcion: 'Tela Blackout',
          unidad: 'ml',
          formula: 'alto + 0.25',
          condicion: '',
          activo: true,
          puedeRotar: true,
          alturaMaxRotacion: 2.80,
          permiteTermosello: true,
          anchosRollo: [2.50, 2.80, 3.00]
        },
        {
          tipo: 'Tubo',
          descripcion: 'Tubo aluminio',
          unidad: 'ml',
          formula: 'ancho - 0.10',
          condicion: '',
          activo: true
        },
        {
          tipo: 'Contrapeso',
          descripcion: 'Contrapeso aluminio',
          unidad: 'ml',
          formula: 'ancho - 0.12',
          condicion: '',
          activo: true
        }
      ],
      optimizacion: {
        habilitada: true,
        longitudEstandar: 5.80,
        materialesOptimizables: [
          { tipo: 'tubo', longitudEstandar: 5.80, margenCorte: 0.005 },
          { tipo: 'contrapeso', longitudEstandar: 5.80, margenCorte: 0.005 }
        ]
      },
      coloresDisponibles: [
        { nombre: 'Ivory', codigo: 'IVY-01', hexColor: '#FFFFF0' },
        { nombre: 'Chocolate', codigo: 'CHO-01', hexColor: '#3B2414' },
        { nombre: 'Gris', codigo: 'GRI-01', hexColor: '#808080' }
      ]
    },
    
    // SHEER ELEGANCE
    {
      nombre: 'Sheer Elegance - Configuración Estándar',
      sistema: 'Sheer Elegance',
      activo: true,
      reglasSeleccion: {
        tubos: [
          {
            condicion: 'ancho <= 3.00',
            diametro: '38mm',
            codigo: 'T38',
            descripcion: 'Tubo 38mm Elegance'
          }
        ],
        mecanismos: [
          {
            condicion: 'ancho <= 3.00 && esManual',
            tipo: 'Mecanismo',
            codigo: 'ELEGANCE',
            descripcion: 'Mecanismo Elegance',
            incluye: ['Mecanismo', 'Cadena', 'Soportes']
          }
        ]
      },
      materiales: [
        {
          tipo: 'Tela Sheer',
          descripcion: 'Tela Sheer Elegance',
          unidad: 'ml',
          formula: '(alto * 2) + 0.35',
          condicion: '',
          activo: true,
          puedeRotar: false,
          anchosRollo: [2.50, 2.80]
        }
      ],
      coloresDisponibles: [
        { nombre: 'Blanco', codigo: 'BLA-01', hexColor: '#FFFFFF' },
        { nombre: 'Beige', codigo: 'BEI-01', hexColor: '#F5F5DC' }
      ]
    },
    
    // TOLDOS CONTEMPO
    {
      nombre: 'Toldos Contempo - Configuración Estándar',
      sistema: 'Toldos Contempo',
      activo: true,
      reglasSeleccion: {
        kits: [
          {
            condicion: 'ancho <= 4.00',
            tamano: '4.00m',
            codigo: 'KIT-4.00',
            descripcion: 'Kit Toldo 4.00m'
          },
          {
            condicion: 'ancho > 4.00',
            tamano: '5.80m',
            codigo: 'KIT-5.80',
            descripcion: 'Kit Toldo 5.80m'
          }
        ]
      },
      materiales: [
        {
          tipo: 'Tela',
          descripcion: 'Tela Screen',
          unidad: 'ml',
          formula: 'alto + 0.25',
          condicion: '',
          activo: true,
          puedeRotar: true,
          alturaMaxRotacion: 2.80,
          permiteTermosello: true,
          anchosRollo: [3.00]
        },
        {
          tipo: 'Cable',
          descripcion: 'Cable acerado',
          unidad: 'ml',
          formula: 'alto * 2',
          condicion: '',
          activo: true
        }
      ],
      coloresDisponibles: [
        { nombre: 'Blanco', codigo: 'BLA-01', hexColor: '#FFFFFF' },
        { nombre: 'Negro', codigo: 'NEG-01', hexColor: '#000000' },
        { nombre: 'Gris', codigo: 'GRI-01', hexColor: '#808080' }
      ]
    }
  ];
  
  for (const config of configuraciones) {
    const existe = await ConfiguracionMateriales.findOne({ 
      sistema: config.sistema 
    });
    
    if (existe) {
      console.log(`  ⚠️  ${config.sistema} ya existe, actualizando...`);
      await ConfiguracionMateriales.findByIdAndUpdate(existe._id, config);
    } else {
      await ConfiguracionMateriales.create(config);
      console.log(`  ✅ ${config.sistema} creado`);
    }
  }
  
  console.log('✅ Configuraciones cargadas\n');
}

async function cargarInventarioInicial() {
  console.log('📦 Cargando inventario inicial...');
  
  const materiales = [
    // TUBOS
    {
      tipo: 'Tubo',
      codigo: 'T38-5.80',
      descripcion: 'Tubo 38mm x 5.80m',
      especificaciones: { diametro: '38mm', longitud: 5.80 },
      cantidad: 50,
      unidad: 'barra',
      stockMinimo: 10,
      puntoReorden: 15,
      ubicacion: { almacen: 'Almacén General', zona: 'A', pasillo: 'P-01', estante: 'E-01' },
      costos: { precioCompra: 150.00, precioVenta: 250.00 },
      proveedor: { nombre: 'Proveedor ABC', tiempoEntrega: 7 }
    },
    {
      tipo: 'Tubo',
      codigo: 'T50-5.80',
      descripcion: 'Tubo 50mm x 5.80m',
      especificaciones: { diametro: '50mm', longitud: 5.80 },
      cantidad: 30,
      unidad: 'barra',
      stockMinimo: 8,
      puntoReorden: 12,
      ubicacion: { almacen: 'Almacén General', zona: 'A', pasillo: 'P-01', estante: 'E-02' },
      costos: { precioCompra: 180.00, precioVenta: 300.00 }
    },
    {
      tipo: 'Tubo',
      codigo: 'T65-5.80',
      descripcion: 'Tubo 65mm x 5.80m',
      especificaciones: { diametro: '65mm', longitud: 5.80 },
      cantidad: 20,
      unidad: 'barra',
      stockMinimo: 5,
      puntoReorden: 10,
      ubicacion: { almacen: 'Almacén General', zona: 'A', pasillo: 'P-01', estante: 'E-03' },
      costos: { precioCompra: 220.00, precioVenta: 380.00 }
    },
    
    // TELAS
    {
      tipo: 'Tela',
      codigo: 'BLACKOUT-3.00',
      descripcion: 'Tela Blackout 3.00m ancho',
      especificaciones: { ancho: 3.00, marca: 'Shades' },
      cantidad: 150,
      unidad: 'ml',
      stockMinimo: 30,
      puntoReorden: 50,
      ubicacion: { almacen: 'Almacén General', zona: 'B', pasillo: 'P-02', estante: 'E-01' },
      costos: { precioCompra: 45.00, precioVenta: 85.00 }
    },
    {
      tipo: 'Tela',
      codigo: 'SCREEN-3.00',
      descripcion: 'Tela Screen 3.00m ancho',
      especificaciones: { ancho: 3.00, marca: 'Shades' },
      cantidad: 120,
      unidad: 'ml',
      stockMinimo: 25,
      puntoReorden: 40,
      ubicacion: { almacen: 'Almacén General', zona: 'B', pasillo: 'P-02', estante: 'E-02' },
      costos: { precioCompra: 50.00, precioVenta: 95.00 }
    },
    
    // MECANISMOS
    {
      tipo: 'Mecanismo',
      codigo: 'SL-16',
      descripcion: 'Mecanismo SL-16',
      cantidad: 25,
      unidad: 'kit',
      stockMinimo: 5,
      puntoReorden: 10,
      ubicacion: { almacen: 'Almacén General', zona: 'C', pasillo: 'P-03', estante: 'E-01' },
      costos: { precioCompra: 120.00, precioVenta: 220.00 }
    },
    {
      tipo: 'Mecanismo',
      codigo: 'R-24',
      descripcion: 'Mecanismo R-24',
      cantidad: 15,
      unidad: 'kit',
      stockMinimo: 3,
      puntoReorden: 8,
      ubicacion: { almacen: 'Almacén General', zona: 'C', pasillo: 'P-03', estante: 'E-02' },
      costos: { precioCompra: 150.00, precioVenta: 280.00 }
    },
    
    // MOTORES
    {
      tipo: 'Motor',
      codigo: 'MOTOR-TUBULAR',
      descripcion: 'Motor tubular con control',
      cantidad: 10,
      unidad: 'pza',
      stockMinimo: 2,
      puntoReorden: 5,
      ubicacion: { almacen: 'Almacén General', zona: 'C', pasillo: 'P-03', estante: 'E-03' },
      costos: { precioCompra: 800.00, precioVenta: 1500.00 }
    },
    
    // CONTRAPESOS
    {
      tipo: 'Contrapeso',
      codigo: 'CONTRAPESO-5.80',
      descripcion: 'Contrapeso aluminio 5.80m',
      especificaciones: { longitud: 5.80 },
      cantidad: 40,
      unidad: 'barra',
      stockMinimo: 10,
      puntoReorden: 15,
      ubicacion: { almacen: 'Almacén General', zona: 'A', pasillo: 'P-01', estante: 'E-04' },
      costos: { precioCompra: 80.00, precioVenta: 150.00 }
    }
  ];
  
  for (const material of materiales) {
    const existe = await Almacen.findOne({ codigo: material.codigo });
    
    if (existe) {
      console.log(`  ⚠️  ${material.codigo} ya existe`);
    } else {
      await Almacen.create(material);
      console.log(`  ✅ ${material.codigo} agregado (${material.cantidad} ${material.unidad})`);
    }
  }
  
  console.log('✅ Inventario cargado\n');
}

async function cargarSobrantesEjemplo() {
  console.log('♻️  Cargando sobrantes de ejemplo...');
  
  const sobrantes = [
    {
      tipo: 'Tubo',
      descripcion: 'Sobrante Tubo 38mm',
      codigo: 'T38',
      longitud: 3.40,
      unidad: 'ml',
      diametro: '38mm',
      estado: 'disponible',
      ubicacionAlmacen: 'Almacén General - Zona Sobrantes',
      etiqueta: SobranteMaterial.generarEtiqueta('Tubo', 'T38'),
      condicion: 'excelente',
      observaciones: 'Sobrante de ejemplo para pruebas'
    },
    {
      tipo: 'Tubo',
      descripcion: 'Sobrante Tubo 38mm',
      codigo: 'T38',
      longitud: 1.80,
      unidad: 'ml',
      diametro: '38mm',
      estado: 'disponible',
      ubicacionAlmacen: 'Almacén General - Zona Sobrantes',
      etiqueta: SobranteMaterial.generarEtiqueta('Tubo', 'T38'),
      condicion: 'excelente',
      observaciones: 'Sobrante de ejemplo para pruebas'
    },
    {
      tipo: 'Tubo',
      descripcion: 'Sobrante Tubo 50mm',
      codigo: 'T50',
      longitud: 2.20,
      unidad: 'ml',
      diametro: '50mm',
      estado: 'disponible',
      ubicacionAlmacen: 'Almacén General - Zona Sobrantes',
      etiqueta: SobranteMaterial.generarEtiqueta('Tubo', 'T50'),
      condicion: 'buena',
      observaciones: 'Sobrante de ejemplo para pruebas'
    }
  ];
  
  for (const sobrante of sobrantes) {
    await SobranteMaterial.create(sobrante);
    console.log(`  ✅ Sobrante ${sobrante.etiqueta} (${sobrante.longitud}m)`);
  }
  
  console.log('✅ Sobrantes cargados\n');
}

async function mostrarResumen() {
  console.log('📊 RESUMEN DEL SISTEMA:\n');
  
  const totalConfiguraciones = await ConfiguracionMateriales.countDocuments({ activo: true });
  const totalMateriales = await Almacen.countDocuments({ activo: true });
  const totalSobrantes = await SobranteMaterial.countDocuments({ estado: 'disponible' });
  const valorInventario = await Almacen.valorTotalInventario();
  
  console.log(`✅ Configuraciones activas: ${totalConfiguraciones}`);
  console.log(`✅ Materiales en inventario: ${totalMateriales}`);
  console.log(`✅ Sobrantes disponibles: ${totalSobrantes}`);
  console.log(`✅ Valor total inventario: $${valorInventario.toFixed(2)} MXN\n`);
  
  // Materiales bajo stock
  const bajoStock = await Almacen.materialesBajoStock();
  if (bajoStock.length > 0) {
    console.log('⚠️  MATERIALES BAJO PUNTO DE REORDEN:');
    bajoStock.forEach(m => {
      console.log(`   - ${m.codigo}: ${m.cantidad} ${m.unidad} (reorden: ${m.puntoReorden})`);
    });
  }
}

// Ejecutar
inicializarSistema();

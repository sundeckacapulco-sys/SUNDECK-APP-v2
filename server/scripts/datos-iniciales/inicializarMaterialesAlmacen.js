/**
 * Script para inicializar materiales base en el almacén
 * Incluye: Tubos, Contrapesos (plano/redondo), Telas básicas
 * 
 * Ejecutar: node server/scripts/inicializarMaterialesAlmacen.js
 */

const mongoose = require('mongoose');
const Almacen = require('../models/Almacen');
const logger = require('../config/logger');
require('dotenv').config();

const MATERIALES_BASE = [
  // ========== TUBOS ==========
  {
    tipo: 'Tubo',
    codigo: 'TUB-38',
    descripcion: 'Tubo Aluminio 38mm',
    especificaciones: {
      diametro: '38mm',
      longitud: 5.80,
      acabado: 'Anodizado',
      marca: 'Genérico'
    },
    unidad: 'barra',
    stockMinimo: 5,
    stockMaximo: 50,
    puntoReorden: 10,
    ubicacion: { zona: 'Tubos', pasillo: 'A', estante: '1' }
  },
  {
    tipo: 'Tubo',
    codigo: 'TUB-50',
    descripcion: 'Tubo Aluminio 50mm',
    especificaciones: {
      diametro: '50mm',
      longitud: 5.80,
      acabado: 'Anodizado',
      marca: 'Genérico'
    },
    unidad: 'barra',
    stockMinimo: 5,
    stockMaximo: 50,
    puntoReorden: 10,
    ubicacion: { zona: 'Tubos', pasillo: 'A', estante: '2' }
  },
  {
    tipo: 'Tubo',
    codigo: 'TUB-70',
    descripcion: 'Tubo Aluminio 70mm',
    especificaciones: {
      diametro: '70mm',
      longitud: 5.80,
      acabado: 'Anodizado',
      marca: 'Genérico'
    },
    unidad: 'barra',
    stockMinimo: 3,
    stockMaximo: 30,
    puntoReorden: 5,
    ubicacion: { zona: 'Tubos', pasillo: 'A', estante: '3' }
  },
  {
    tipo: 'Tubo',
    codigo: 'TUB-79',
    descripcion: 'Tubo Aluminio 79mm',
    especificaciones: {
      diametro: '79mm',
      longitud: 5.80,
      acabado: 'Anodizado',
      marca: 'Genérico'
    },
    unidad: 'barra',
    stockMinimo: 2,
    stockMaximo: 20,
    puntoReorden: 3,
    ubicacion: { zona: 'Tubos', pasillo: 'A', estante: '4' }
  },
  
  // ========== CONTRAPESOS PLANOS ==========
  {
    tipo: 'Contrapeso',
    codigo: 'CP-PLANO-STD',
    descripcion: 'Contrapeso Plano Estándar',
    especificaciones: {
      longitud: 5.80,
      acabado: 'Blanco',
      modelo: 'Plano'
    },
    unidad: 'barra',
    stockMinimo: 5,
    stockMaximo: 50,
    puntoReorden: 10,
    ubicacion: { zona: 'Contrapesos', pasillo: 'B', estante: '1' }
  },
  {
    tipo: 'Contrapeso',
    codigo: 'CP-PLANO-NEG',
    descripcion: 'Contrapeso Plano Negro',
    especificaciones: {
      longitud: 5.80,
      acabado: 'Negro',
      modelo: 'Plano'
    },
    unidad: 'barra',
    stockMinimo: 3,
    stockMaximo: 30,
    puntoReorden: 5,
    ubicacion: { zona: 'Contrapesos', pasillo: 'B', estante: '2' }
  },
  
  // ========== CONTRAPESOS REDONDOS ==========
  {
    tipo: 'Contrapeso',
    codigo: 'CP-REDONDO-STD',
    descripcion: 'Contrapeso Redondo Estándar',
    especificaciones: {
      longitud: 5.80,
      acabado: 'Blanco',
      modelo: 'Redondo'
    },
    unidad: 'barra',
    stockMinimo: 5,
    stockMaximo: 50,
    puntoReorden: 10,
    ubicacion: { zona: 'Contrapesos', pasillo: 'B', estante: '3' }
  },
  {
    tipo: 'Contrapeso',
    codigo: 'CP-REDONDO-NEG',
    descripcion: 'Contrapeso Redondo Negro',
    especificaciones: {
      longitud: 5.80,
      acabado: 'Negro',
      modelo: 'Redondo'
    },
    unidad: 'barra',
    stockMinimo: 3,
    stockMaximo: 30,
    puntoReorden: 5,
    ubicacion: { zona: 'Contrapesos', pasillo: 'B', estante: '4' }
  },
  
  // ========== TELAS BÁSICAS ==========
  {
    tipo: 'Tela',
    codigo: 'TEL-SCREEN-5-BLA',
    descripcion: 'Tela Screen 5% Blanco',
    especificaciones: {
      ancho: 3.00,
      color: 'Blanco',
      marca: 'Shades',
      modelo: 'Screen 5%'
    },
    unidad: 'rollo',
    stockMinimo: 2,
    stockMaximo: 20,
    puntoReorden: 3,
    ubicacion: { zona: 'Telas', pasillo: 'C', estante: '1' }
  },
  {
    tipo: 'Tela',
    codigo: 'TEL-SCREEN-5-GRI',
    descripcion: 'Tela Screen 5% Gris',
    especificaciones: {
      ancho: 3.00,
      color: 'Gris',
      marca: 'Shades',
      modelo: 'Screen 5%'
    },
    unidad: 'rollo',
    stockMinimo: 2,
    stockMaximo: 20,
    puntoReorden: 3,
    ubicacion: { zona: 'Telas', pasillo: 'C', estante: '2' }
  },
  {
    tipo: 'Tela',
    codigo: 'TEL-SCREEN-3-BLA',
    descripcion: 'Tela Screen 3% Blanco',
    especificaciones: {
      ancho: 3.00,
      color: 'Blanco',
      marca: 'Shades',
      modelo: 'Screen 3%'
    },
    unidad: 'rollo',
    stockMinimo: 2,
    stockMaximo: 20,
    puntoReorden: 3,
    ubicacion: { zona: 'Telas', pasillo: 'C', estante: '3' }
  },
  {
    tipo: 'Tela',
    codigo: 'TEL-BLACKOUT-BLA',
    descripcion: 'Tela Blackout Blanco',
    especificaciones: {
      ancho: 2.80,
      color: 'Blanco',
      marca: 'Shades',
      modelo: 'Blackout'
    },
    unidad: 'rollo',
    stockMinimo: 2,
    stockMaximo: 20,
    puntoReorden: 3,
    ubicacion: { zona: 'Telas', pasillo: 'C', estante: '4' }
  },
  {
    tipo: 'Tela',
    codigo: 'TEL-BLACKOUT-NEG',
    descripcion: 'Tela Blackout Negro',
    especificaciones: {
      ancho: 2.80,
      color: 'Negro',
      marca: 'Shades',
      modelo: 'Blackout'
    },
    unidad: 'rollo',
    stockMinimo: 2,
    stockMaximo: 20,
    puntoReorden: 3,
    ubicacion: { zona: 'Telas', pasillo: 'C', estante: '5' }
  },
  {
    tipo: 'Tela',
    codigo: 'TEL-TRANSLUCIDO-BLA',
    descripcion: 'Tela Translúcido Blanco',
    especificaciones: {
      ancho: 3.00,
      color: 'Blanco',
      marca: 'Shades',
      modelo: 'Translúcido'
    },
    unidad: 'rollo',
    stockMinimo: 2,
    stockMaximo: 20,
    puntoReorden: 3,
    ubicacion: { zona: 'Telas', pasillo: 'C', estante: '6' }
  }
];

async function inicializarMateriales() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sundeck-crm');
    console.log('✅ Conectado a MongoDB');
    
    let creados = 0;
    let actualizados = 0;
    let errores = 0;
    
    for (const material of MATERIALES_BASE) {
      try {
        const existente = await Almacen.findOne({ codigo: material.codigo });
        
        if (existente) {
          // Actualizar especificaciones si ya existe
          await Almacen.updateOne(
            { codigo: material.codigo },
            { 
              $set: { 
                especificaciones: material.especificaciones,
                ubicacion: material.ubicacion
              }
            }
          );
          actualizados++;
          console.log(`📝 Actualizado: ${material.codigo}`);
        } else {
          // Crear nuevo
          await Almacen.create({
            ...material,
            cantidad: 0, // Iniciar en 0
            activo: true
          });
          creados++;
          console.log(`✅ Creado: ${material.codigo} - ${material.descripcion}`);
        }
      } catch (err) {
        errores++;
        console.error(`❌ Error con ${material.codigo}:`, err.message);
      }
    }
    
    console.log('\n📊 RESUMEN:');
    console.log(`   Creados: ${creados}`);
    console.log(`   Actualizados: ${actualizados}`);
    console.log(`   Errores: ${errores}`);
    console.log(`   Total procesados: ${MATERIALES_BASE.length}`);
    
    // Mostrar inventario actual
    const inventario = await Almacen.find({ activo: true })
      .select('codigo descripcion tipo cantidad unidad')
      .sort({ tipo: 1, codigo: 1 });
    
    console.log('\n📦 INVENTARIO ACTUAL:');
    console.log('─'.repeat(70));
    
    let tipoActual = '';
    for (const item of inventario) {
      if (item.tipo !== tipoActual) {
        tipoActual = item.tipo;
        console.log(`\n  ${tipoActual.toUpperCase()}:`);
      }
      console.log(`    ${item.codigo.padEnd(20)} ${item.descripcion.substring(0, 30).padEnd(32)} ${item.cantidad} ${item.unidad}`);
    }
    
    await mongoose.disconnect();
    console.log('\n👋 Desconectado');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

inicializarMateriales();

/**
 * Script para actualizar el proyecto de prueba con sistemas correctos
 * Ejecutar: node server/scripts/actualizarProyectoPrueba.js
 */

const mongoose = require('mongoose');
const Proyecto = require('../models/Proyecto');
const logger = require('../config/logger');
require('dotenv').config();

async function actualizarProyecto() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('\n🔄 ACTUALIZANDO PROYECTO DE PRUEBA\n');
    
    // Buscar el proyecto de prueba
    const proyecto = await Proyecto.findOne().sort({ createdAt: -1 });
    
    if (!proyecto) {
      console.log('❌ No hay proyectos');
      await mongoose.connection.close();
      process.exit(1);
    }
    
    console.log(`✅ Proyecto encontrado: ${proyecto.numero}`);
    console.log(`   Piezas: ${proyecto.productos?.length || 0}\n`);
    
    // Actualizar productos con sistemas correctos
    if (proyecto.productos && proyecto.productos.length > 0) {
      proyecto.productos[0].sistema = 'Roller Shade';
      proyecto.productos[1].sistema = 'Roller Shade';
      proyecto.productos[2].sistema = 'Roller Shade';
      proyecto.productos[3].sistema = 'Toldos Contempo';
      proyecto.productos[4].sistema = 'Sheer Elegance';
      
      await proyecto.save();
      
      console.log('✅ Sistemas actualizados:');
      proyecto.productos.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.ubicacion}: ${p.sistema}`);
      });
    }
    
    console.log('\n🎉 Proyecto actualizado correctamente\n');
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

actualizarProyecto();

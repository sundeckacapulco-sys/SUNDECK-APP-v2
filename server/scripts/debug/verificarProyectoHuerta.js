/**
 * Script para verificar el proyecto de Huerta
 * Ejecutar: node server/scripts/verificarProyectoHuerta.js
 */

const mongoose = require('mongoose');
const Proyecto = require('../models/Proyecto');
require('dotenv').config();

async function verificarProyecto() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('\n🔍 VERIFICANDO PROYECTO DE HUERTA\n');
    console.log('='.repeat(60));
    
    // Buscar proyecto de Huerta
    const proyecto = await Proyecto.findOne({ 
      'cliente.nombre': /Huerta/i 
    }).lean();
    
    if (!proyecto) {
      console.log('❌ No se encontró proyecto de Huerta');
      console.log('   Buscando otros proyectos...\n');
      
      const proyectos = await Proyecto.find({}).limit(5).lean();
      console.log(`Proyectos disponibles: ${proyectos.length}\n`);
      
      proyectos.forEach(p => {
        console.log(`   - ${p.numero || p._id}`);
        console.log(`     Cliente: ${p.cliente?.nombre || 'Sin nombre'}`);
        console.log(`     Productos: ${p.productos?.length || 0}`);
        console.log('');
      });
      
      await mongoose.connection.close();
      process.exit(0);
    }
    
    console.log(`✅ Proyecto encontrado: ${proyecto.numero || proyecto._id}`);
    console.log(`   Cliente: ${proyecto.cliente?.nombre}`);
    console.log(`   Teléfono: ${proyecto.cliente?.telefono}`);
    console.log(`   Estado: ${proyecto.estado}`);
    console.log(`   Total: $${proyecto.total?.toLocaleString() || 0}\n`);
    
    // Verificar productos
    if (!proyecto.productos || proyecto.productos.length === 0) {
      console.log('⚠️  El proyecto no tiene productos\n');
      
      // Verificar si tiene levantamiento
      if (proyecto.levantamiento?.partidas) {
        console.log('📋 Tiene levantamiento con partidas:');
        console.log(`   Total partidas: ${proyecto.levantamiento.partidas.length}\n`);
        
        proyecto.levantamiento.partidas.forEach((partida, i) => {
          const piezas = partida.piezas || partida.medidas || [];
          console.log(`   Partida ${i + 1}: ${partida.ubicacion || 'Sin ubicación'}`);
          console.log(`   Sistema: ${partida.sistema || 'No especificado'}`);
          console.log(`   Piezas: ${piezas.length}`);
          console.log('');
        });
      }
      
      await mongoose.connection.close();
      process.exit(0);
    }
    
    console.log(`📦 PRODUCTOS (${proyecto.productos.length}):\n`);
    console.log('='.repeat(60));
    
    let productosConSistema = 0;
    let productosSinSistema = 0;
    
    proyecto.productos.forEach((producto, index) => {
      console.log(`\n${index + 1}. ${producto.ubicacion || producto.nombre || `Producto ${index + 1}`}`);
      console.log(`   Sistema: ${producto.sistema || '❌ NO ESPECIFICADO'}`);
      console.log(`   Medidas: ${producto.ancho || '?'}m × ${producto.alto || '?'}m`);
      console.log(`   Control: ${producto.control || 'No especificado'}`);
      console.log(`   Motorizado: ${producto.motorizado ? 'Sí' : 'No'}`);
      console.log(`   Color: ${producto.color || 'No especificado'}`);
      console.log(`   Tela: ${producto.telaMarca || 'No especificado'}`);
      
      if (producto.sistema) {
        productosConSistema++;
      } else {
        productosSinSistema++;
      }
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN:');
    console.log(`   ✅ Productos con sistema: ${productosConSistema}`);
    console.log(`   ❌ Productos sin sistema: ${productosSinSistema}`);
    
    if (productosSinSistema > 0) {
      console.log('\n⚠️  ACCIÓN REQUERIDA:');
      console.log('   Los productos necesitan tener el campo "sistema" configurado.');
      console.log('   Sistemas válidos: "Roller Shade", "Sheer Elegance", "Toldos Contempo"');
      console.log('\n   ¿Quieres que actualice los sistemas automáticamente? (Y/N)');
    } else {
      console.log('\n✅ Todos los productos tienen sistema configurado');
      console.log('   El proyecto está listo para generar orden de producción');
    }
    
    console.log('\n📋 ID del proyecto para pruebas:');
    console.log(`   ${proyecto._id}\n`);
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

verificarProyecto();

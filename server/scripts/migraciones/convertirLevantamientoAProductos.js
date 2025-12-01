/**
 * Script para convertir levantamiento a productos con sistemas correctos
 * Ejecutar: node server/scripts/convertirLevantamientoAProductos.js
 */

const mongoose = require('mongoose');
const Proyecto = require('../models/Proyecto');
require('dotenv').config();

async function convertirLevantamiento() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('\n🔄 CONVIRTIENDO LEVANTAMIENTO A PRODUCTOS\n');
    console.log('='.repeat(60));
    
    // Buscar proyecto de Huerta
    const proyecto = await Proyecto.findOne({ 
      'cliente.nombre': /Huerta/i 
    });
    
    if (!proyecto) {
      console.log('❌ No se encontró proyecto de Huerta');
      await mongoose.connection.close();
      process.exit(1);
    }
    
    console.log(`✅ Proyecto: ${proyecto.numero}`);
    console.log(`   Cliente: ${proyecto.cliente?.nombre}\n`);
    
    if (!proyecto.levantamiento?.partidas) {
      console.log('❌ El proyecto no tiene levantamiento');
      await mongoose.connection.close();
      process.exit(1);
    }
    
    console.log('📋 Convirtiendo partidas a productos...\n');
    
    const productos = [];
    let numeroProducto = 1;
    
    proyecto.levantamiento.partidas.forEach((partida, indexPartida) => {
      const piezas = partida.piezas || partida.medidas || [];
      
      console.log(`Partida ${indexPartida + 1}: ${partida.ubicacion || 'Sin ubicación'}`);
      console.log(`   Piezas: ${piezas.length}`);
      
      piezas.forEach((pieza, indexPieza) => {
        // Determinar sistema basado en el producto/modelo
        let sistema = 'Roller Shade'; // Default
        const producto = (partida.producto || pieza.producto || '').toLowerCase();
        const modelo = (partida.modelo || pieza.modelo || '').toLowerCase();
        
        if (producto.includes('sheer') || modelo.includes('sheer')) {
          sistema = 'Sheer Elegance';
        } else if (producto.includes('toldo') || modelo.includes('toldo') || modelo.includes('contempo')) {
          sistema = 'Toldos Contempo';
        }
        
        const productoNuevo = {
          numero: numeroProducto++,
          ubicacion: `${partida.ubicacion || 'Sin ubicación'} - Pieza ${indexPieza + 1}`,
          sistema: sistema, // ✅ Sistema asignado
          control: pieza.control || 'Derecha',
          ancho: Number(pieza.ancho || 0),
          alto: Number(pieza.alto || 0),
          area: Number(pieza.m2 || pieza.area || 0),
          motorizado: pieza.operacion === 'motorizado' || pieza.modoOperacion === 'motorizado',
          galeria: false,
          color: pieza.color || partida.color || 'Ivory',
          telaMarca: partida.producto || pieza.producto || 'Blackout',
          cantidad: 1,
          precioUnitario: 0,
          subtotal: 0
        };
        
        productos.push(productoNuevo);
        
        console.log(`   ✅ ${productoNuevo.ubicacion}`);
        console.log(`      Sistema: ${productoNuevo.sistema}`);
        console.log(`      Medidas: ${productoNuevo.ancho}m × ${productoNuevo.alto}m`);
      });
      
      console.log('');
    });
    
    // Actualizar proyecto
    proyecto.productos = productos;
    await proyecto.save();
    
    console.log('='.repeat(60));
    console.log('✅ CONVERSIÓN COMPLETADA\n');
    console.log(`📊 Total de productos creados: ${productos.length}`);
    console.log(`   ID del proyecto: ${proyecto._id}`);
    
    // Resumen por sistema
    const porSistema = {};
    productos.forEach(p => {
      porSistema[p.sistema] = (porSistema[p.sistema] || 0) + 1;
    });
    
    console.log('\n📋 Productos por sistema:');
    Object.entries(porSistema).forEach(([sistema, cantidad]) => {
      console.log(`   - ${sistema}: ${cantidad}`);
    });
    
    console.log('\n🎉 El proyecto está listo para generar orden de producción\n');
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

convertirLevantamiento();

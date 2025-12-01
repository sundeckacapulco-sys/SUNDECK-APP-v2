const mongoose = require('mongoose');
const Proyecto = require('../models/Proyecto');
const OptimizadorCortesService = require('../services/optimizadorCortesService');

async function extraerMedidas() {
  try {
    await mongoose.connect('mongodb://localhost:27017/sundeck');
    
    const proyecto = await Proyecto.findById('690e69251346d61cfcd5178d');
    
    if (!proyecto) {
      console.log('❌ Proyecto no encontrado');
      process.exit(1);
    }
    
    console.log('\n📋 PROYECTO:', proyecto.numero);
    console.log('👤 CLIENTE:', proyecto.cliente.nombre);
    console.log('\n' + '='.repeat(80));
    console.log('PIEZAS Y CÁLCULOS ACTUALES');
    console.log('='.repeat(80) + '\n');
    
    for (let i = 0; i < proyecto.piezas.length; i++) {
      const pieza = proyecto.piezas[i];
      
      console.log(`${i + 1}. ${pieza.ubicacion}`);
      console.log(`   📏 Dimensiones: ${pieza.ancho}m × ${pieza.alto}m`);
      console.log(`   🎨 Producto: ${pieza.producto}`);
      console.log(`   🏷️  Modelo: ${pieza.modelo || 'N/A'}`);
      console.log(`   🎨 Color: ${pieza.color || 'N/A'}`);
      console.log(`   ⚡ Motorizada: ${pieza.motorizado ? 'Sí' : 'No'}`);
      
      // Calcular materiales con el servicio actual
      const materiales = await OptimizadorCortesService.calcularMaterialesPieza({
        ancho: pieza.ancho,
        alto: pieza.alto,
        motorizado: pieza.motorizado,
        sistema: pieza.sistema || 'Roller Shade',
        producto: pieza.producto,
        modelo: pieza.modelo,
        color: pieza.color
      });
      
      const tela = materiales.find(m => m.tipo === 'Tela');
      
      if (tela) {
        console.log(`\n   📐 CÁLCULO DE TELA (según calculadora):`);
        console.log(`      Cantidad: ${tela.cantidad} ${tela.unidad}`);
        console.log(`      Descripción: ${tela.descripcion}`);
        console.log(`      Fórmula aplicada: alto + 0.25 = ${pieza.alto} + 0.25 = ${tela.cantidad}`);
      }
      
      console.log('\n' + '-'.repeat(80) + '\n');
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('RESUMEN DE TELAS');
    console.log('='.repeat(80) + '\n');
    
    // Agrupar telas por modelo y color
    const telasAgrupadas = {};
    
    for (const pieza of proyecto.piezas) {
      const materiales = await OptimizadorCortesService.calcularMaterialesPieza({
        ancho: pieza.ancho,
        alto: pieza.alto,
        motorizado: pieza.motorizado,
        sistema: pieza.sistema || 'Roller Shade',
        producto: pieza.producto,
        modelo: pieza.modelo,
        color: pieza.color
      });
      
      const tela = materiales.find(m => m.tipo === 'Tela');
      
      if (tela) {
        const key = `${pieza.producto}-${pieza.modelo}-${pieza.color}`;
        
        if (!telasAgrupadas[key]) {
          telasAgrupadas[key] = {
            producto: pieza.producto,
            modelo: pieza.modelo,
            color: pieza.color,
            piezas: [],
            totalML: 0
          };
        }
        
        telasAgrupadas[key].piezas.push({
          ubicacion: pieza.ubicacion,
          ancho: pieza.ancho,
          alto: pieza.alto,
          ml: tela.cantidad
        });
        
        telasAgrupadas[key].totalML += tela.cantidad;
      }
    }
    
    Object.values(telasAgrupadas).forEach((grupo, idx) => {
      console.log(`${idx + 1}. ${grupo.producto} - ${grupo.modelo} ${grupo.color}`);
      console.log(`   Total requerido: ${grupo.totalML.toFixed(2)} ml\n`);
      
      grupo.piezas.forEach(p => {
        console.log(`   - ${p.ubicacion}: ${p.ancho}m × ${p.alto}m = ${p.ml} ml`);
      });
      
      console.log('');
    });
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

extraerMedidas();

/**
 * Script para corregir la fórmula de tela
 * La fórmula debe respetar la rotación:
 * - Si rotada: metros = ancho + 0.05
 * - Si no rotada: metros = alto + 0.05
 */

const mongoose = require('mongoose');
const ConfiguracionMateriales = require('../models/ConfiguracionMateriales');
const logger = require('../config/logger');

async function corregirFormulaTela() {
  try {
    await mongoose.connect('mongodb://localhost:27017/sundeck');
    logger.info('Conectado a MongoDB');

    // Buscar configuración de Roller Shade
    const config = await ConfiguracionMateriales.findOne({ sistema: 'Roller Shade' });
    
    if (!config) {
      console.log('❌ No se encontró configuración de Roller Shade');
      process.exit(1);
    }

    console.log('\n📋 CONFIGURACIÓN ACTUAL DE TELAS:');
    console.log('='.repeat(60));
    
    const telas = config.materiales.filter(m => m.tipo === 'Tela' || m.tipo === 'Tela Sheer');
    
    telas.forEach((tela, idx) => {
      console.log(`\n${idx + 1}. ${tela.descripcion}`);
      console.log(`   Tipo: ${tela.tipo}`);
      console.log(`   Fórmula actual: ${tela.formula}`);
      console.log(`   Condición: ${tela.condicion || 'ninguna'}`);
    });

    console.log('\n\n🔧 FÓRMULA CORRECTA:');
    console.log('='.repeat(60));
    console.log('rotada ? (ancho + 0.05) : (alto + 0.05)');
    console.log('\nEsto significa:');
    console.log('- Si la pieza está rotada: usar ANCHO como metros lineales');
    console.log('- Si NO está rotada: usar ALTO como metros lineales');
    console.log('- Siempre agregar 5cm (0.05m) para enrolle');

    console.log('\n\n¿Actualizar fórmulas? (Ctrl+C para cancelar)');
    console.log('Presiona Enter para continuar...');

    // Esperar confirmación
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });

    // Actualizar fórmulas
    let actualizados = 0;
    
    for (const tela of telas) {
      const formulaAnterior = tela.formula;
      tela.formula = 'rotada ? (ancho + 0.05) : (alto + 0.05)';
      
      if (formulaAnterior !== tela.formula) {
        actualizados++;
        console.log(`\n✅ Actualizado: ${tela.descripcion}`);
        console.log(`   Antes: ${formulaAnterior}`);
        console.log(`   Ahora: ${tela.formula}`);
      }
    }

    // Guardar cambios
    await config.save();
    
    console.log('\n\n🎉 ACTUALIZACIÓN COMPLETADA');
    console.log('='.repeat(60));
    console.log(`Total de telas actualizadas: ${actualizados}`);
    
    logger.info('Fórmulas de tela actualizadas', {
      servicio: 'corregirFormulaTela',
      totalActualizados: actualizados
    });

  } catch (error) {
    logger.error('Error corrigiendo fórmula de tela', {
      error: error.message,
      stack: error.stack
    });
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

corregirFormulaTela();

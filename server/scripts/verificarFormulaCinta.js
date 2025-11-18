/**
 * Script para verificar la fórmula de cinta doble cara
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const mongoose = require('mongoose');
const ConfiguracionMateriales = require('../models/ConfiguracionMateriales');

async function verificarFormulaCinta() {
  try {
    console.log('🔍 VERIFICANDO FÓRMULA DE CINTA DOBLE CARA\n');
    console.log('='.repeat(60));
    
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Buscar configuración de Roller Shade
    const config = await ConfiguracionMateriales.findOne({ sistema: 'Roller Shade' });
    
    if (!config) {
      console.log('❌ No se encontró configuración para Roller Shade');
      process.exit(1);
    }
    
    console.log(`✅ Configuración encontrada: ${config.sistema}\n`);
    
    // Buscar materiales relacionados con cinta
    const materialesCinta = config.materiales.filter(m => 
      m.tipo.toLowerCase().includes('cinta') || 
      m.descripcion.toLowerCase().includes('cinta')
    );
    
    if (materialesCinta.length === 0) {
      console.log('❌ No se encontraron materiales de cinta');
    } else {
      console.log('📋 MATERIALES DE CINTA:\n');
      
      materialesCinta.forEach((material, index) => {
        console.log(`${index + 1}. ${material.tipo}`);
        console.log(`   Código: ${material.codigo}`);
        console.log(`   Descripción: ${material.descripcion}`);
        console.log(`   Fórmula: ${material.formula}`);
        console.log(`   Unidad: ${material.unidad}`);
        if (material.observaciones) {
          console.log(`   Observaciones: ${material.observaciones}`);
        }
        if (material.condicion) {
          console.log(`   Condición: ${material.condicion}`);
        }
        console.log('');
      });
    }
    
    // Ejemplo de cálculo
    console.log('='.repeat(60));
    console.log('📐 EJEMPLO DE CÁLCULO:\n');
    
    const ejemploAncho = 3.28;
    console.log(`Ancho de cortina: ${ejemploAncho}m\n`);
    
    materialesCinta.forEach(material => {
      try {
        const formula = material.formula;
        const cantidad = eval(formula.replace('ancho', ejemploAncho));
        console.log(`${material.tipo}:`);
        console.log(`   Fórmula: ${formula}`);
        console.log(`   Resultado: ${cantidad.toFixed(2)}ml`);
        console.log('');
      } catch (error) {
        console.log(`❌ Error calculando ${material.tipo}: ${error.message}\n`);
      }
    });
    
    console.log('='.repeat(60));
    console.log('✅ Verificación completada');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verificarFormulaCinta();

/**
 * Script para validar que las sugerencias aparezcan en el PDF de levantamiento
 */

const mongoose = require('mongoose');
const PDFService = require('../services/pdfService');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../config/logger');

// Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/sundeck')
  .then(() => logger.info('Conectado a MongoDB'))
  .catch(err => {
    logger.error('Error conectando a MongoDB', { error: err.message });
    process.exit(1);
  });

async function validarPDFSugerencias() {
  try {
    console.log('\n🧪 VALIDANDO PDF CON SUGERENCIAS\n');
    
    // Datos de prueba con diferentes escenarios
    const etapa = {
      prospecto: {
        nombre: 'Cliente de Prueba - Validación',
        telefono: '744-123-4567',
        email: 'prueba@test.com',
        direccion: {
          calle: 'Av. Principal 123',
          colonia: 'Costa Azul',
          ciudad: 'Acapulco',
          codigoPostal: '39850',
          referencias: 'Frente al parque'
        }
      }
    };
    
    // CASO 1: Proyecto con altura > 4m (debe sugerir andamios)
    const piezasAltura = [
      {
        ubicacion: 'Sala - Ventana 1',
        producto: 'Roller Shade Blackout',
        color: 'Gris',
        medidas: [{
          ancho: 2.5,
          alto: 4.5, // ⚠️ Mayor a 4m
          precioM2: 850
        }]
      },
      {
        ubicacion: 'Comedor',
        producto: 'Roller Shade Screen',
        color: 'Blanco',
        medidas: [{
          ancho: 3.0,
          alto: 3.0,
          precioM2: 750
        }]
      }
    ];
    
    // CASO 2: Proyecto con toldos
    const piezasToldos = [
      {
        ubicacion: 'Terraza',
        producto: 'Toldo Contempo',
        color: 'Beige',
        esToldo: true,
        kitModelo: 'Kit 4.00m',
        kitPrecio: 3500,
        medidas: [{
          ancho: 3.5,
          alto: 2.5,
          precioM2: 950
        }]
      }
    ];
    
    // CASO 3: Proyecto motorizado
    const piezasMotorizadas = [
      {
        ubicacion: 'Recámara Principal',
        producto: 'Roller Shade Motorizado',
        color: 'Negro',
        motorizado: true,
        motorModelo: 'Somfy RTS',
        motorPrecio: 4500,
        controlModelo: 'Control 5 canales',
        controlPrecio: 1200,
        medidas: [{
          ancho: 2.8,
          alto: 2.2,
          precioM2: 850
        }]
      }
    ];
    
    // CASO 4: Proyecto complejo (altura + toldos + motorizado)
    const piezasComplejo = [
      ...piezasAltura,
      ...piezasToldos,
      ...piezasMotorizadas
    ];
    
    console.log('📋 Casos de prueba:');
    console.log('  1. Altura > 4m (debe sugerir andamios)');
    console.log('  2. Con toldos (debe sugerir estructura)');
    console.log('  3. Motorizado (debe sugerir toma eléctrica)');
    console.log('  4. Complejo (todas las sugerencias)\n');
    
    // Generar PDF para cada caso
    const casos = [
      { nombre: 'altura', piezas: piezasAltura },
      { nombre: 'toldos', piezas: piezasToldos },
      { nombre: 'motorizado', piezas: piezasMotorizadas },
      { nombre: 'complejo', piezas: piezasComplejo }
    ];
    
    for (const caso of casos) {
      console.log(`\n🔍 Generando PDF: ${caso.nombre.toUpperCase()}`);
      
      try {
        const totalM2 = caso.piezas.reduce((total, pieza) => {
          const m2Pieza = pieza.medidas.reduce((sum, m) => sum + (m.ancho * m.alto), 0);
          return total + m2Pieza;
        }, 0);
        
        const precioGeneral = 800;
        
        const datosAdicionales = {
          metodoPago: {
            porcentajeAnticipo: 60,
            porcentajeSaldo: 40
          }
        };
        
        const pdfBuffer = await PDFService.generarLevantamientoPDF(
          etapa,
          caso.piezas,
          totalM2,
          precioGeneral,
          datosAdicionales
        );
        
        // Guardar PDF
        const outputDir = path.join(__dirname, '../../temp');
        await fs.mkdir(outputDir, { recursive: true });
        
        const outputPath = path.join(outputDir, `validacion_${caso.nombre}.pdf`);
        await fs.writeFile(outputPath, pdfBuffer);
        
        console.log(`  ✅ PDF generado: ${outputPath}`);
        console.log(`  📊 Tamaño: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);
        console.log(`  📐 Total m²: ${totalM2.toFixed(2)}`);
        
        // Analizar sugerencias esperadas
        console.log(`  🤖 Sugerencias esperadas:`);
        
        const tieneAltura = caso.piezas.some(p => p.medidas.some(m => m.alto > 4));
        const tieneToldos = caso.piezas.some(p => p.esToldo || p.producto.toLowerCase().includes('toldo'));
        const tieneMotorizados = caso.piezas.some(p => p.motorizado);
        
        if (tieneAltura) {
          console.log(`     ⚠️ Andamios (altura > 4m)`);
        }
        if (tieneToldos) {
          console.log(`     🏠 Verificar estructura para toldos`);
        }
        if (tieneMotorizados) {
          console.log(`     ⚡ Verificar toma eléctrica`);
        }
        console.log(`     📝 Sugerencias generales (siempre)`);
        
      } catch (error) {
        console.error(`  ❌ Error generando PDF ${caso.nombre}:`, error.message);
      }
    }
    
    console.log('\n\n✅ VALIDACIÓN COMPLETADA\n');
    console.log('📁 PDFs generados en: temp/');
    console.log('📋 Archivos:');
    console.log('   - validacion_altura.pdf');
    console.log('   - validacion_toldos.pdf');
    console.log('   - validacion_motorizado.pdf');
    console.log('   - validacion_complejo.pdf');
    console.log('\n🔍 VERIFICAR EN CADA PDF:');
    console.log('   1. Sección "Sugerencias Inteligentes Detectadas"');
    console.log('   2. Sección "Análisis General de la Etapa"');
    console.log('   3. Que las sugerencias sean pertinentes al caso');
    console.log('   4. Que el tiempo estimado sea razonable\n');
    
  } catch (error) {
    logger.error('Error en validación de PDF', {
      error: error.message,
      stack: error.stack
    });
    console.error('\n❌ ERROR:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Conexión cerrada\n');
    process.exit(0);
  }
}

// Ejecutar validación
validarPDFSugerencias();

/**
 * Script para generar PDF de Orden de Fabricación de prueba
 * con los nuevos campos de contrapeso.
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const PDFOrdenFabricacionService = require('../../services/pdfOrdenFabricacionService');
const OrdenProduccionService = require('../../services/ordenProduccionService');
const Proyecto = require('../../models/Proyecto');
const logger = require('../../config/logger');
require('dotenv').config();

async function generarOrdenesPrueba() {
  try {
    await mongoose.connect('mongodb://localhost:27017/sundeck-crm');
    console.log('✅ Conectado a MongoDB');

    // 1. Buscar proyecto de Héctor Huerta
    console.log('🔍 Buscando proyecto de Héctor Huerta...');
    const proyecto = await Proyecto.findOne({ 
      _id: '690e69251346d61cfcd5178d' 
    });

    if (!proyecto) {
      throw new Error('No se encontró ningún proyecto con partidas de levantamiento.');
    }

    console.log(`✅ Proyecto encontrado: ${proyecto.numero} (${proyecto.cliente.nombre})`);

    // 2. Obtener datos de la orden (simulando la preparación)
    // Usamos el servicio para obtener la estructura base
    const datosOrden = await OrdenProduccionService.obtenerDatosOrdenProduccion(proyecto._id);

    // 3. INYECTAR DATOS DE PRUEBA (Contrapesos)
    // Modificamos las piezas en memoria para asegurar que aparezcan los nuevos campos
    // aunque no estén en la DB todavía.
    console.log('💉 Inyectando datos de prueba (tipos de contrapeso)...');
    
    if (datosOrden.piezas && datosOrden.piezas.length > 0) {
      datosOrden.piezas[0].tipoContrapeso = 'Plano'; // Prueba 1
      datosOrden.piezas[0].galeria = true; // Prueba galería
      datosOrden.piezas[0].conGaleria = true;
      
      if (datosOrden.piezas[1]) {
        datosOrden.piezas[1].tipoContrapeso = 'Ovalado'; // Prueba 2
        datosOrden.piezas[1].galeria = true; // Prueba galería
        datosOrden.piezas[1].conGaleria = true;
      }
      if (datosOrden.piezas[2]) {
        datosOrden.piezas[2].tipoContrapeso = 'Forrado'; // Prueba 3
        datosOrden.piezas[2].galeria = true; // Prueba galería grande (unión)
        datosOrden.piezas[2].conGaleria = true;
      }
    }

    // 4. Generar PDF de Orden de Fabricación (Taller)
    console.log('\n🏭 Generando PDF Orden de Fabricación (Taller)...');
    const pdfBuffer = await PDFOrdenFabricacionService.generarPDF(datosOrden, datosOrden.listaPedido);
    
    const outputPath = path.join(__dirname, '../../../test-orden-fabricacion.pdf');
    fs.writeFileSync(outputPath, pdfBuffer);
    
    console.log(`✅ PDF generado: ${outputPath}`);
    console.log(`   Tamaño: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);

    console.log('\n🎉 Prueba completada. Revisa el archivo generado.');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Desconectado');
  }
}

generarOrdenesPrueba();

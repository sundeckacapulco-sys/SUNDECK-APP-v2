/**
 * Script para limpiar totales de un proyecto específico
 * Ejecutar: node server/scripts/limpiarTotalesProyecto.js <ID_PROYECTO>
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Proyecto = require('../models/Proyecto');

async function limpiarTotalesProyecto(proyectoId) {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sundeck-crm');
    console.log('✅ Conectado a MongoDB');

    if (!proyectoId) {
      console.error('❌ Debes proporcionar el ID del proyecto');
      console.log('Uso: node server/scripts/limpiarTotalesProyecto.js <ID_PROYECTO>');
      process.exit(1);
    }

    const proyecto = await Proyecto.findById(proyectoId);

    if (!proyecto) {
      console.error('❌ Proyecto no encontrado');
      process.exit(1);
    }

    console.log(`📋 Proyecto encontrado: ${proyecto.cliente?.nombre || 'Sin nombre'}`);
    console.log(`   Estado actual: ${proyecto.estado}`);
    console.log(`   Totales actuales: Subtotal: $${proyecto.subtotal}, IVA: $${proyecto.iva}, Total: $${proyecto.total}`);

    // Limpiar totales
    proyecto.subtotal = 0;
    proyecto.iva = 0;
    proyecto.total = 0;
    proyecto.cotizacionActual = null;
    
    // Si no tiene cotizaciones, volver a levantamiento
    if (!proyecto.cotizaciones || proyecto.cotizaciones.length === 0) {
      if (proyecto.estado === 'cotizacion') {
        proyecto.estado = 'levantamiento';
        console.log('   ⚠️ Estado cambiado a "levantamiento" (no hay cotizaciones)');
      }
    }

    await proyecto.save();

    console.log('\n✅ Proyecto actualizado exitosamente');
    console.log(`   Nuevos totales: Subtotal: $${proyecto.subtotal}, IVA: $${proyecto.iva}, Total: $${proyecto.total}`);
    console.log(`   Estado: ${proyecto.estado}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada');
    process.exit(0);
  }
}

// Obtener ID del proyecto de los argumentos
const proyectoId = process.argv[2];
limpiarTotalesProyecto(proyectoId);

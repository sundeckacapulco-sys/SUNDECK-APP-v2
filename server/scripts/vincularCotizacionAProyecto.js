const mongoose = require('mongoose');
require('dotenv').config();
const Cotizacion = require('../models/Cotizacion');
const Proyecto = require('../models/Proyecto');
const logger = require('../config/logger');

/**
 * Script para vincular cotizaciones huérfanas a sus proyectos
 * 
 * Busca cotizaciones que tienen proyecto pero no están en proyecto.cotizaciones[]
 * y las vincula correctamente.
 */

async function vincularCotizacionesAProyectos() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sundeck');
    console.log('✅ Conectado a MongoDB');

    // Buscar cotizaciones con proyecto pero sin vincular
    const cotizaciones = await Cotizacion.find({ 
      proyecto: { $ne: null, $exists: true } 
    }).sort({ createdAt: -1 });

    console.log(`📋 Encontradas ${cotizaciones.length} cotizaciones con proyecto`);

    let vinculadas = 0;
    let errores = 0;

    for (const cotizacion of cotizaciones) {
      try {
        const proyectoId = cotizacion.proyecto;
        
        // Verificar si el proyecto existe
        const proyecto = await Proyecto.findById(proyectoId);
        
        if (!proyecto) {
          console.log(`⚠️ Proyecto ${proyectoId} no encontrado para cotización ${cotizacion.numero}`);
          continue;
        }

        // Verificar si la cotización ya está en el array
        const yaVinculada = proyecto.cotizaciones?.some(
          c => c.toString() === cotizacion._id.toString()
        );

        if (yaVinculada) {
          console.log(`✓ Cotización ${cotizacion.numero} ya vinculada al proyecto ${proyecto.numero}`);
          continue;
        }

        // Vincular cotización al proyecto
        await Proyecto.findByIdAndUpdate(
          proyectoId,
          { 
            $push: { cotizaciones: cotizacion._id },
            $set: { estadoComercial: 'cotizado' }
          }
        );

        console.log(`✅ Vinculada cotización ${cotizacion.numero} al proyecto ${proyecto.numero}`);
        vinculadas++;

      } catch (error) {
        console.error(`❌ Error vinculando cotización ${cotizacion.numero}:`, error.message);
        errores++;
      }
    }

    console.log('\n📊 RESUMEN:');
    console.log(`✅ Cotizaciones vinculadas: ${vinculadas}`);
    console.log(`❌ Errores: ${errores}`);
    console.log(`📋 Total procesadas: ${cotizaciones.length}`);

  } catch (error) {
    console.error('❌ Error en el script:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Conexión cerrada');
  }
}

// Ejecutar
vincularCotizacionesAProyectos();

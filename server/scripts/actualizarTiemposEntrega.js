/**
 * Script para actualizar tiempo de entrega en proyectos con anticipo registrado
 * Ejecutar: node server/scripts/actualizarTiemposEntrega.js
 */

const mongoose = require('mongoose');
const logger = require('../config/logger');
require('dotenv').config();

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sundeck', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const Proyecto = require('../models/Proyecto');

// Función para calcular fecha sumando solo días hábiles (L-V)
function calcularFechaHabil(fechaInicio, diasHabiles) {
  const fecha = new Date(fechaInicio);
  let diasAgregados = 0;
  
  while (diasAgregados < diasHabiles) {
    fecha.setDate(fecha.getDate() + 1);
    const diaSemana = fecha.getDay();
    
    // Si no es sábado (6) ni domingo (0), contar como día hábil
    if (diaSemana !== 0 && diaSemana !== 6) {
      diasAgregados++;
    }
  }
  
  return fecha;
}

async function actualizarTiemposEntrega() {
  try {
    logger.info('🔄 Iniciando actualización de tiempos de entrega...');

    // Buscar proyectos con anticipo pagado pero sin tiempo de entrega definido
    const proyectos = await Proyecto.find({
      'pagos.anticipo.pagado': true,
      $or: [
        { 'tiempo_entrega.dias_estimados': { $exists: false } },
        { 'tiempo_entrega.dias_estimados': null },
        { 'tiempo_entrega.dias_estimados': 0 }
      ]
    });

    logger.info(`📊 Proyectos encontrados: ${proyectos.length}`);

    let actualizados = 0;
    let errores = 0;

    for (const proyecto of proyectos) {
      try {
        // Determinar tipo de entrega (por defecto normal)
        const tipoEntrega = proyecto.tiempo_entrega?.tipo || 'normal';
        
        // Días hábiles según tipo
        const diasHabiles = tipoEntrega === 'expres' ? 7 : 15;
        
        // Calcular fecha estimada desde la fecha del anticipo o desde hoy
        const fechaBase = proyecto.pagos.anticipo.fechaPago || new Date();
        const fechaEstimada = calcularFechaHabil(fechaBase, diasHabiles);
        
        // Actualizar en el proyecto
        if (!proyecto.tiempo_entrega) {
          proyecto.tiempo_entrega = {};
        }
        proyecto.tiempo_entrega.tipo = tipoEntrega;
        proyecto.tiempo_entrega.dias_estimados = diasHabiles;
        proyecto.tiempo_entrega.fecha_estimada = fechaEstimada;
        
        await proyecto.save();
        
        actualizados++;
        
        logger.info(`✅ Proyecto actualizado: ${proyecto.numero || proyecto._id}`, {
          tipo: tipoEntrega,
          diasHabiles: diasHabiles,
          fechaEstimada: fechaEstimada.toISOString().split('T')[0]
        });
        
      } catch (error) {
        errores++;
        logger.error(`❌ Error actualizando proyecto ${proyecto._id}:`, {
          error: error.message
        });
      }
    }

    logger.info('✅ Actualización completada', {
      total: proyectos.length,
      actualizados: actualizados,
      errores: errores
    });

    console.log('\n📊 RESUMEN:');
    console.log(`Total de proyectos: ${proyectos.length}`);
    console.log(`Actualizados: ${actualizados}`);
    console.log(`Errores: ${errores}`);

  } catch (error) {
    logger.error('❌ Error en el script:', {
      error: error.message,
      stack: error.stack
    });
  } finally {
    await mongoose.connection.close();
    logger.info('🔌 Conexión a MongoDB cerrada');
    process.exit(0);
  }
}

// Ejecutar
actualizarTiemposEntrega();

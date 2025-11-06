/**
 * MIGRACIÓN: Prospectos → Proyectos
 * Fecha: 6 Noviembre 2025
 */

const mongoose = require('mongoose');
const Prospecto = require('../models/Prospecto');
const Proyecto = require('../models/Proyecto');
const logger = require('../config/logger');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function migrarProspectos() {
  try {
    await mongoose.connect('mongodb://localhost:27017/sundeck');
    log('\n✅ Conectado a MongoDB\n', 'green');

    // 1. Contar prospectos existentes
    const totalProspectos = await Prospecto.countDocuments();
    log(`📊 Total de prospectos en BD: ${totalProspectos}`, 'cyan');

    if (totalProspectos === 0) {
      log('\n✅ No hay prospectos para migrar. Base de datos ya está limpia.\n', 'green');
      await mongoose.connection.close();
      return {
        migrados: 0,
        errores: 0,
        mensaje: 'No hay datos para migrar'
      };
    }

    log(`\n🔄 Iniciando migración de ${totalProspectos} prospectos...\n`, 'yellow');

    // 2. Obtener todos los prospectos
    const prospectos = await Prospecto.find().lean();
    
    let migrados = 0;
    let errores = 0;
    const erroresDetalle = [];

    // 3. Migrar cada prospecto
    for (const prospecto of prospectos) {
      try {
        // Verificar si ya existe un proyecto con este prospecto
        const proyectoExistente = await Proyecto.findOne({ prospecto: prospecto._id });
        
        if (proyectoExistente) {
          log(`⚠️  Proyecto ya existe para prospecto: ${prospecto.nombre}`, 'yellow');
          continue;
        }

        // Crear proyecto desde prospecto
        const nuevoProyecto = new Proyecto({
          numero: `PROY-MIG-${Date.now()}-${migrados}`,
          cliente: {
            nombre: prospecto.nombre,
            telefono: prospecto.telefono,
            email: prospecto.email || prospecto.correo,
            direccion: prospecto.direccion || {}
          },
          prospecto: prospecto._id,
          estado: prospecto.estado === 'ganado' ? 'activo' : 
                  prospecto.estado === 'perdido' ? 'cancelado' : 
                  'prospecto',
          tipo_fuente: prospecto.origen === 'referencia' ? 'simple' : 'simple',
          asesor_asignado: prospecto.asesor,
          notas: prospecto.notas || [],
          historialEstados: [{
            estado: 'prospecto',
            fecha: prospecto.createdAt || new Date(),
            usuario: prospecto.asesor,
            observaciones: 'Migrado desde colección prospectos'
          }],
          creado_por: prospecto.asesor || new mongoose.Types.ObjectId(),
          actualizado_por: prospecto.asesor || new mongoose.Types.ObjectId(),
          // Metadata de migración
          migracion: {
            origen: 'prospectos',
            fecha: new Date(),
            prospectoId: prospecto._id
          }
        });

        await nuevoProyecto.save();
        migrados++;
        log(`✅ Migrado: ${prospecto.nombre} → ${nuevoProyecto.numero}`, 'green');

      } catch (error) {
        errores++;
        erroresDetalle.push({
          prospecto: prospecto.nombre,
          error: error.message
        });
        log(`❌ Error migrando ${prospecto.nombre}: ${error.message}`, 'red');
      }
    }

    log(`\n📊 RESUMEN DE MIGRACIÓN:`, 'cyan');
    log(`   Migrados exitosamente: ${migrados}`, 'green');
    log(`   Errores: ${errores}`, errores > 0 ? 'red' : 'green');
    log(`   Total procesados: ${prospectos.length}`, 'cyan');

    if (errores > 0) {
      log(`\n⚠️  ERRORES DETALLADOS:`, 'yellow');
      erroresDetalle.forEach(e => {
        log(`   - ${e.prospecto}: ${e.error}`, 'red');
      });
    }

    // 4. Preguntar si eliminar colección prospectos
    if (migrados > 0) {
      log(`\n⚠️  IMPORTANTE: Se migraron ${migrados} prospectos exitosamente.`, 'yellow');
      log(`   Para eliminar la colección 'prospectos', ejecuta:`, 'yellow');
      log(`   db.prospectos.drop()`, 'cyan');
      log(`\n   O ejecuta: node server/scripts/eliminar_coleccion_prospectos.js\n`, 'cyan');
    }

    await mongoose.connection.close();
    log('✅ Migración completada\n', 'green');

    return {
      migrados,
      errores,
      erroresDetalle
    };

  } catch (error) {
    log(`\n❌ Error fatal: ${error.message}\n`, 'red');
    logger.error('Error en migración de prospectos', {
      script: 'migrar_prospectos_a_proyectos',
      error: error.message,
      stack: error.stack
    });
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Ejecutar migración
migrarProspectos();

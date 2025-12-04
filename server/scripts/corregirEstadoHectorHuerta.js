/**
 * Script para corregir el estado del proyecto de Hector Huerta
 * El proyecto tiene anticipo pagado pero estado incorrecto
 */

const mongoose = require('mongoose');
const path = require('path');

// Cargar configuración
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const Proyecto = require('../models/Proyecto');
const logger = require('../config/logger');

async function corregirEstadoHectorHuerta() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sundeck');
    console.log('✅ Conectado a MongoDB');

    // Buscar proyecto de Hector Huerta
    const proyecto = await Proyecto.findOne({
      $or: [
        { 'cliente.nombre': { $regex: /hector.*huerta/i } },
        { numero: '2025-ARQ-HECTOR-003' }
      ]
    });

    if (!proyecto) {
      console.log('❌ Proyecto de Hector Huerta no encontrado');
      return;
    }

    console.log('\n📋 ESTADO ACTUAL:');
    console.log('  - ID:', proyecto._id);
    console.log('  - Número:', proyecto.numero);
    console.log('  - Cliente:', proyecto.cliente?.nombre);
    console.log('  - Tipo:', proyecto.tipo);
    console.log('  - Estado:', proyecto.estado);
    console.log('  - Estado Comercial:', proyecto.estadoComercial);
    console.log('  - Anticipo:', proyecto.pagos?.anticipo?.monto || proyecto.anticipo || 0);
    console.log('  - Anticipo Pagado:', proyecto.pagos?.anticipo?.pagado || false);

    // Verificar si tiene anticipo
    const tieneAnticipo = (proyecto.pagos?.anticipo?.monto > 0) || 
                          (proyecto.anticipo > 0) ||
                          (proyecto.pagos?.anticipo?.pagado === true);

    if (!tieneAnticipo) {
      console.log('\n⚠️ El proyecto NO tiene anticipo registrado');
      console.log('   No se puede cambiar a fabricación sin anticipo');
      return;
    }

    console.log('\n✅ El proyecto TIENE anticipo pagado');
    console.log('🔄 Actualizando estado a FABRICACIÓN...');

    // Actualizar estado
    const estadoAnterior = proyecto.estado;
    const estadoComercialAnterior = proyecto.estadoComercial;

    proyecto.estado = 'fabricacion';
    proyecto.estadoComercial = 'en_fabricacion';
    proyecto.tipo = 'proyecto';

    await proyecto.save();

    console.log('\n✅ ESTADO ACTUALIZADO:');
    console.log('  - Estado anterior:', estadoAnterior, '→', proyecto.estado);
    console.log('  - Estado comercial anterior:', estadoComercialAnterior, '→', proyecto.estadoComercial);
    console.log('  - Tipo:', proyecto.tipo);

    logger.info('🏭 Proyecto corregido manualmente a estado FABRICACIÓN', {
      script: 'corregirEstadoHectorHuerta',
      proyectoId: proyecto._id,
      numero: proyecto.numero,
      estadoAnterior,
      estadoComercialAnterior,
      estadoNuevo: 'fabricacion',
      estadoComercialNuevo: 'en_fabricacion'
    });

    console.log('\n🎉 ¡Corrección completada exitosamente!');
    console.log('   El proyecto ahora aparecerá en el módulo de Fabricación');

  } catch (error) {
    console.error('❌ Error:', error.message);
    logger.error('Error en script de corrección', {
      script: 'corregirEstadoHectorHuerta',
      error: error.message,
      stack: error.stack
    });
  } finally {
    await mongoose.disconnect();
    console.log('\n📤 Desconectado de MongoDB');
    process.exit(0);
  }
}

// Ejecutar
corregirEstadoHectorHuerta();

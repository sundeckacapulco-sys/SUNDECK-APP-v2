const mongoose = require('mongoose');
const logger = require('../config/logger');
require('dotenv').config();

// Importar modelos
const Proyecto = require('../models/Proyecto');
const Prospecto = require('../models/Prospecto');
const Cotizacion = require('../models/Cotizacion');
const Pedido = require('../models/Pedido');
const Fabricacion = require('../models/Fabricacion.legacy');
const Instalacion = require('../models/Instalacion');
const Usuario = require('../models/Usuario');

/**
 * Script para limpiar la base de datos del CRM
 * ADVERTENCIA: Este script eliminará TODOS los datos excepto usuarios
 */

const limpiarBaseDatos = async () => {
  try {
    console.log('🧹 Iniciando limpieza de base de datos...\n');

    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sundeck-crm', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Conectado a MongoDB\n');

    // Contar documentos antes de eliminar
    const conteoAntes = {
      proyectos: await Proyecto.countDocuments(),
      prospectos: await Prospecto.countDocuments(),
      cotizaciones: await Cotizacion.countDocuments(),
      pedidos: await Pedido.countDocuments(),
      fabricacion: await Fabricacion.countDocuments(),
      instalaciones: await Instalacion.countDocuments(),
      usuarios: await Usuario.countDocuments()
    };

    console.log('📊 Documentos actuales en la base de datos:');
    console.log(`   - Proyectos: ${conteoAntes.proyectos}`);
    console.log(`   - Prospectos: ${conteoAntes.prospectos}`);
    console.log(`   - Cotizaciones: ${conteoAntes.cotizaciones}`);
    console.log(`   - Pedidos: ${conteoAntes.pedidos}`);
    console.log(`   - Fabricación: ${conteoAntes.fabricacion}`);
    console.log(`   - Instalaciones: ${conteoAntes.instalaciones}`);
    console.log(`   - Usuarios: ${conteoAntes.usuarios} (NO se eliminarán)\n`);

    // Preguntar confirmación (en producción)
    if (process.env.NODE_ENV === 'production') {
      console.log('⚠️  ADVERTENCIA: Estás en modo PRODUCCIÓN');
      console.log('⚠️  Este script eliminará TODOS los datos del CRM');
      console.log('⚠️  Para continuar, ejecuta: NODE_ENV=production CONFIRMAR=SI node limpiarBaseDatos.js\n');
      
      if (process.env.CONFIRMAR !== 'SI') {
        console.log('❌ Limpieza cancelada por seguridad\n');
        process.exit(0);
      }
    }

    console.log('🗑️  Eliminando datos...\n');

    // Eliminar colecciones (excepto usuarios)
    const resultados = {
      proyectos: await Proyecto.deleteMany({}),
      prospectos: await Prospecto.deleteMany({}),
      cotizaciones: await Cotizacion.deleteMany({}),
      pedidos: await Pedido.deleteMany({}),
      fabricacion: await Fabricacion.deleteMany({}),
      instalaciones: await Instalacion.deleteMany({})
    };

    console.log('✅ Datos eliminados exitosamente:');
    console.log(`   - Proyectos: ${resultados.proyectos.deletedCount} eliminados`);
    console.log(`   - Prospectos: ${resultados.prospectos.deletedCount} eliminados`);
    console.log(`   - Cotizaciones: ${resultados.cotizaciones.deletedCount} eliminados`);
    console.log(`   - Pedidos: ${resultados.pedidos.deletedCount} eliminados`);
    console.log(`   - Fabricación: ${resultados.fabricacion.deletedCount} eliminados`);
    console.log(`   - Instalaciones: ${resultados.instalaciones.deletedCount} eliminados`);
    console.log(`   - Usuarios: ${conteoAntes.usuarios} conservados ✅\n`);

    // Logging estructurado
    logger.info('Base de datos limpiada', {
      script: 'limpiarBaseDatos',
      documentosEliminados: {
        proyectos: resultados.proyectos.deletedCount,
        prospectos: resultados.prospectos.deletedCount,
        cotizaciones: resultados.cotizaciones.deletedCount,
        pedidos: resultados.pedidos.deletedCount,
        fabricacion: resultados.fabricacion.deletedCount,
        instalaciones: resultados.instalaciones.deletedCount
      },
      usuariosConservados: conteoAntes.usuarios,
      timestamp: new Date().toISOString()
    });

    console.log('🎉 Limpieza completada exitosamente');
    console.log('💡 La base de datos está lista para comenzar desde cero\n');

  } catch (error) {
    console.error('❌ Error limpiando base de datos:', error);
    logger.error('Error en limpieza de base de datos', {
      error: error.message,
      stack: error.stack,
      script: 'limpiarBaseDatos'
    });
    process.exit(1);
  } finally {
    // Cerrar conexión
    await mongoose.connection.close();
    console.log('🔌 Conexión a MongoDB cerrada\n');
    process.exit(0);
  }
};

// Ejecutar script
limpiarBaseDatos();

/**
 * Script para limpiar proyectos - Mantener solo los 3 registros válidos
 * Ejecutar: node server/scripts/limpiarProyectos.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sundeck';

// Clientes a mantener (nombres parciales para búsqueda)
const CLIENTES_MANTENER = [
  'Sergio Cond',
  'Luis Bello',
  'Hector Huerta'
];

async function limpiarProyectos() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a:', MONGODB_URI);

    const Proyecto = require('../models/Proyecto');

    // Obtener todos los proyectos
    const todosProyectos = await Proyecto.find({}).lean();
    console.log(`\n📊 Total de proyectos en BD: ${todosProyectos.length}`);

    // Identificar proyectos a mantener
    const proyectosAMantener = [];
    const proyectosAEliminar = [];

    for (const proyecto of todosProyectos) {
      const nombreCliente = proyecto.cliente?.nombre || '';
      const debeMantenerse = CLIENTES_MANTENER.some(nombre => 
        nombreCliente.toLowerCase().includes(nombre.toLowerCase())
      );

      if (debeMantenerse) {
        proyectosAMantener.push({
          id: proyecto._id,
          cliente: nombreCliente,
          tipo: proyecto.tipo,
          estado: proyecto.estadoComercial
        });
      } else {
        proyectosAEliminar.push({
          id: proyecto._id,
          cliente: nombreCliente || 'Sin nombre',
          tipo: proyecto.tipo
        });
      }
    }

    console.log('\n✅ PROYECTOS A MANTENER:');
    proyectosAMantener.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.cliente} (${p.tipo}) - ${p.estado}`);
    });

    console.log('\n❌ PROYECTOS A ELIMINAR:');
    if (proyectosAEliminar.length === 0) {
      console.log('   Ninguno - La BD ya está limpia');
    } else {
      proyectosAEliminar.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.cliente} (${p.tipo}) - ID: ${p.id}`);
      });
    }

    // Confirmar antes de eliminar
    if (proyectosAEliminar.length > 0) {
      console.log(`\n⚠️  Se eliminarán ${proyectosAEliminar.length} proyectos`);
      console.log('   Ejecutando eliminación...\n');

      // Eliminar proyectos
      const idsAEliminar = proyectosAEliminar.map(p => p.id);
      const resultado = await Proyecto.deleteMany({ _id: { $in: idsAEliminar } });
      
      console.log(`✅ Eliminados: ${resultado.deletedCount} proyectos`);
    }

    // Verificar resultado final
    const proyectosRestantes = await Proyecto.find({}).lean();
    console.log(`\n📊 Proyectos restantes: ${proyectosRestantes.length}`);
    proyectosRestantes.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.cliente?.nombre || 'Sin nombre'} - ${p.tipo} - ${p.estadoComercial}`);
    });

    console.log('\n✅ Limpieza completada');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
    process.exit(0);
  }
}

limpiarProyectos();

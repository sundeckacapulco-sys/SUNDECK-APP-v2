/**
 * Script para actualizar proyectos existentes con números profesionales
 * Ejecutar una sola vez: node server/scripts/actualizarNumerosProyectos.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Proyecto = require('../models/Proyecto');

async function actualizarNumerosProyectos() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sundeck-crm');
    console.log('✅ Conectado a MongoDB');

    // Buscar proyectos sin número
    const proyectosSinNumero = await Proyecto.find({ 
      $or: [
        { numero: { $exists: false } },
        { numero: null },
        { numero: '' }
      ]
    }).sort({ fecha_creacion: 1 });

    console.log(`📋 Encontrados ${proyectosSinNumero.length} proyectos sin número`);

    if (proyectosSinNumero.length === 0) {
      console.log('✅ Todos los proyectos ya tienen número asignado');
      process.exit(0);
    }

    // Agrupar por año
    const proyectosPorAno = {};
    
    for (const proyecto of proyectosSinNumero) {
      const fecha = new Date(proyecto.fecha_creacion);
      const year = fecha.getFullYear();
      
      if (!proyectosPorAno[year]) {
        proyectosPorAno[year] = [];
      }
      proyectosPorAno[year].push(proyecto);
    }

    // Asignar números secuenciales por año
    let actualizados = 0;
    
    for (const [year, proyectos] of Object.entries(proyectosPorAno)) {
      console.log(`\n📅 Procesando ${proyectos.length} proyectos de ${year}`);
      
      for (let i = 0; i < proyectos.length; i++) {
        const proyecto = proyectos[i];
        const secuencial = String(i + 1).padStart(3, '0');
        
        // Limpiar nombre del cliente
        let nombreCorto = proyecto.cliente.nombre
          .split(' ')
          .slice(0, 2)
          .join(' ')
          .toUpperCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
          .replace(/[^A-Z0-9\s]/g, '') // Solo letras y números
          .replace(/\s+/g, '-') // Espacios a guiones
          .substring(0, 15); // Máximo 15 caracteres
        
        const nuevoNumero = `${year}-${nombreCorto}-${secuencial}`;
        
        proyecto.numero = nuevoNumero;
        await proyecto.save();
        
        console.log(`  ✅ ${proyecto.cliente.nombre}: ${nuevoNumero}`);
        actualizados++;
      }
    }

    console.log(`\n✅ Actualización completada: ${actualizados} proyectos actualizados`);
    
  } catch (error) {
    console.error('❌ Error actualizando números:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada');
    process.exit(0);
  }
}

// Ejecutar
actualizarNumerosProyectos();

/**
 * Script para actualizar proyectos existentes con números profesionales
 * Ejecutar una sola vez: node server/scripts/actualizarNumerosProyectos.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Proyecto = require('../models/Proyecto');
const logger = require('../config/logger');

async function actualizarNumerosProyectos() {
  try {
    // Conectar a MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sundeck-crm';
    await mongoose.connect(mongoUri);
    logger.info('Conexión a MongoDB establecida para actualizar números de proyectos', {
      script: 'actualizarNumerosProyectos',
      mongoUri: process.env.MONGODB_URI ? 'env:MONGODB_URI' : mongoUri
    });

    // Buscar proyectos sin número
    const proyectosSinNumero = await Proyecto.find({ 
      $or: [
        { numero: { $exists: false } },
        { numero: null },
        { numero: '' }
      ]
    }).sort({ fecha_creacion: 1 });

    logger.info('Proyectos sin número identificados', {
      script: 'actualizarNumerosProyectos',
      totalSinNumero: proyectosSinNumero.length
    });

    if (proyectosSinNumero.length === 0) {
      logger.info('Todos los proyectos ya tienen número asignado', {
        script: 'actualizarNumerosProyectos'
      });
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
      logger.info('Procesando proyectos para asignación de números', {
        script: 'actualizarNumerosProyectos',
        year,
        cantidad: proyectos.length
      });

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
        
        logger.info('Número profesional asignado a proyecto', {
          script: 'actualizarNumerosProyectos',
          proyectoId: proyecto._id.toString(),
          cliente: proyecto.cliente?.nombre || 'Sin nombre',
          numeroAsignado: nuevoNumero,
          year,
          secuencia: secuencial
        });
        actualizados++;
      }
    }

    logger.info('Actualización de números completada', {
      script: 'actualizarNumerosProyectos',
      proyectosActualizados: actualizados
    });

  } catch (error) {
    logger.error('Error actualizando números de proyectos', {
      script: 'actualizarNumerosProyectos',
      error: error.message,
      stack: error.stack
    });
  } finally {
    await mongoose.connection.close();
    logger.info('Conexión a MongoDB cerrada tras actualización de números', {
      script: 'actualizarNumerosProyectos'
    });
    process.exit(0);
  }
}

// Ejecutar
actualizarNumerosProyectos();

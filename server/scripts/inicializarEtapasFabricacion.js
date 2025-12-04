/**
 * Script para inicializar las 5 etapas de fabricación en proyectos existentes
 */
const mongoose = require('mongoose');
const Proyecto = require('../models/Proyecto');
const logger = require('../config/logger');

async function inicializarEtapas() {
  try {
    await mongoose.connect('mongodb://localhost:27017/sundeck-crm');
    console.log('Conectado a MongoDB');
    
    // Buscar proyectos en fabricación sin procesos definidos (o con array vacío)
    const proyectos = await Proyecto.find({
      'fabricacion.estado': { $in: ['en_proceso', 'pendiente', 'recepcion_material'] },
      $or: [
        { 'fabricacion.procesos': { $exists: false } },
        { 'fabricacion.procesos': { $size: 0 } }
      ]
    });
    
    console.log(`Proyectos a actualizar: ${proyectos.length}`);
    
    for (const proyecto of proyectos) {
      // Inicializar etapas
      proyecto.fabricacion.etapas = {
        corte: { estado: 'pendiente', fotos: [], comentarios: '', codigoPieza: '' },
        armado: { estado: 'pendiente', fotos: [], comentarios: '', codigoPieza: '' },
        ensamble: { estado: 'pendiente', fotos: [], comentarios: '', codigoPieza: '' },
        revision: { estado: 'pendiente', fotos: [], comentarios: '', codigoPieza: '', defectos: [] },
        empaque: { estado: 'pendiente', fotos: [], comentarios: '', codigoPieza: '' }
      };
      
      // Inicializar procesos para la vista
      proyecto.fabricacion.procesos = [
        { nombre: 'Corte', descripcion: 'Corte de materiales', orden: 1, estado: 'pendiente', tiempoEstimado: 2 },
        { nombre: 'Armado', descripcion: 'Armado de estructura', orden: 2, estado: 'pendiente', tiempoEstimado: 3 },
        { nombre: 'Ensamble', descripcion: 'Ensamble de componentes', orden: 3, estado: 'pendiente', tiempoEstimado: 2 },
        { nombre: 'Revisión', descripcion: 'Control de calidad', orden: 4, estado: 'pendiente', tiempoEstimado: 1 },
        { nombre: 'Empaque', descripcion: 'Empaque final', orden: 5, estado: 'pendiente', tiempoEstimado: 1 }
      ];
      
      await proyecto.save();
      console.log(`✅ Actualizado: ${proyecto.numero}`);
    }
    
    console.log('\n🎉 Inicialización completada!');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

inicializarEtapas();

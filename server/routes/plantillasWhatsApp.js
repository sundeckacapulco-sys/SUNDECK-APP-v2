const express = require('express');
const PlantillaWhatsApp = require('../models/PlantillaWhatsApp');
const WhatsAppTracking = require('../models/WhatsAppTracking');
const { auth, verificarPermiso } = require('../middleware/auth');

const router = express.Router();

// Obtener todas las plantillas
router.get('/', auth, async (req, res) => {
  try {
    const { categoria, estilo, activa, page = 1, limit = 50 } = req.query;
    const filtros = {};
    
    if (categoria) filtros.categoria = categoria;
    if (estilo) filtros.estilo = estilo;
    if (activa !== undefined) filtros.activa = activa === 'true';
    
    const plantillas = await PlantillaWhatsApp.find(filtros)
      .populate('creada_por', 'nombre apellido')
      .sort({ 'metricas.veces_usada': -1, fecha_creacion: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await PlantillaWhatsApp.countDocuments(filtros);

    res.json({
      plantillas,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error obteniendo plantillas:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener plantillas por categoría (para el generador)
router.get('/categoria/:categoria', auth, async (req, res) => {
  try {
    const { categoria } = req.params;
    const { estilo } = req.query;
    
    const filtros = { categoria, activa: true };
    if (estilo) filtros.estilo = estilo;
    
    const plantillas = await PlantillaWhatsApp.find(filtros)
      .sort({ es_predeterminada: -1, 'metricas.veces_usada': -1 })
      .select('nombre estilo mensaje variables metricas efectividad rating_promedio');

    res.json(plantillas);
  } catch (error) {
    console.error('Error obteniendo plantillas por categoría:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Crear nueva plantilla
router.post('/', auth, verificarPermiso('plantillas', 'crear'), async (req, res) => {
  try {
    const plantillaData = {
      ...req.body,
      creada_por: req.usuario._id
    };

    const nuevaPlantilla = new PlantillaWhatsApp(plantillaData);
    await nuevaPlantilla.save();
    
    await nuevaPlantilla.populate('creada_por', 'nombre apellido');

    res.status(201).json({
      message: 'Plantilla creada exitosamente',
      plantilla: nuevaPlantilla
    });
  } catch (error) {
    console.error('Error creando plantilla:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Datos inválidos', 
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener plantilla por ID
router.get('/:id', auth, async (req, res) => {
  try {
    const plantilla = await PlantillaWhatsApp.findById(req.params.id)
      .populate('creada_por', 'nombre apellido');
    
    if (!plantilla) {
      return res.status(404).json({ message: 'Plantilla no encontrada' });
    }

    res.json(plantilla);
  } catch (error) {
    console.error('Error obteniendo plantilla:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Actualizar plantilla
router.put('/:id', auth, verificarPermiso('plantillas', 'editar'), async (req, res) => {
  try {
    const plantilla = await PlantillaWhatsApp.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('creada_por', 'nombre apellido');

    if (!plantilla) {
      return res.status(404).json({ message: 'Plantilla no encontrada' });
    }

    res.json({
      message: 'Plantilla actualizada exitosamente',
      plantilla
    });
  } catch (error) {
    console.error('Error actualizando plantilla:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Datos inválidos', 
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Eliminar plantilla
router.delete('/:id', auth, verificarPermiso('plantillas', 'eliminar'), async (req, res) => {
  try {
    const plantilla = await PlantillaWhatsApp.findByIdAndDelete(req.params.id);
    
    if (!plantilla) {
      return res.status(404).json({ message: 'Plantilla no encontrada' });
    }

    // También eliminar el tracking relacionado
    await WhatsAppTracking.deleteMany({ plantilla: req.params.id });

    res.json({ message: 'Plantilla eliminada exitosamente' });
  } catch (error) {
    console.error('Error eliminando plantilla:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Generar mensaje personalizado
router.post('/:id/generar', auth, async (req, res) => {
  try {
    const { datos } = req.body;
    
    const plantilla = await PlantillaWhatsApp.findById(req.params.id);
    if (!plantilla) {
      return res.status(404).json({ message: 'Plantilla no encontrada' });
    }

    if (!plantilla.activa) {
      return res.status(400).json({ message: 'Plantilla inactiva' });
    }

    const mensajeGenerado = plantilla.generarMensaje(datos);
    
    // Registrar que se generó el mensaje
    const tracking = new WhatsAppTracking({
      plantilla: plantilla._id,
      prospecto: datos.prospecto_id,
      usuario: req.usuario._id,
      mensaje_generado: mensajeGenerado,
      evento: 'mensaje_generado',
      metadata: {
        categoria_plantilla: plantilla.categoria,
        estilo_plantilla: plantilla.estilo,
        etapa_prospecto: datos.etapa_prospecto
      }
    });
    await tracking.save();

    // Incrementar contador de uso
    await plantilla.incrementarUso();

    res.json({
      mensaje: mensajeGenerado,
      plantilla: {
        id: plantilla._id,
        nombre: plantilla.nombre,
        categoria: plantilla.categoria,
        estilo: plantilla.estilo
      },
      tracking_id: tracking._id
    });
  } catch (error) {
    console.error('Error generando mensaje:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Registrar evento de tracking
router.post('/tracking', auth, async (req, res) => {
  try {
    const { plantilla_id, prospecto_id, evento, rating, notas } = req.body;
    
    const trackingData = {
      plantilla: plantilla_id,
      prospecto: prospecto_id,
      usuario: req.usuario._id,
      evento,
      notas
    };

    if (evento === 'rating_agregado' && rating) {
      trackingData.rating = rating;
      
      // Actualizar rating en la plantilla
      const plantilla = await PlantillaWhatsApp.findById(plantilla_id);
      if (plantilla) {
        await plantilla.agregarRating(rating);
      }
    }

    // Actualizar métricas según el evento
    const plantilla = await PlantillaWhatsApp.findById(plantilla_id);
    if (plantilla) {
      switch(evento) {
        case 'respuesta_positiva':
          await plantilla.registrarRespuestaPositiva();
          break;
        case 'conversion':
          await plantilla.registrarConversion();
          break;
      }
    }

    const tracking = new WhatsAppTracking(trackingData);
    await tracking.save();

    res.json({
      message: 'Evento registrado exitosamente',
      tracking_id: tracking._id
    });
  } catch (error) {
    console.error('Error registrando tracking:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener mejores plantillas
router.get('/mejores', auth, verificarPermiso('plantillas', 'leer'), async (req, res) => {
  try {
    const plantillas = await PlantillaWhatsApp.find({ activa: true })
      .sort({ 
        createdAt: -1 // Por ahora ordenamos por fecha de creación
      })
      .limit(10)
      .populate('creada_por', 'nombre apellido')
      .lean(); // Usar lean() para mejor performance
    
    // Agregar valores por defecto para métricas
    const plantillasConMetricas = plantillas.map(plantilla => ({
      ...plantilla,
      efectividad: plantilla.efectividad || 0,
      rating_promedio: plantilla.rating_promedio || 0,
      veces_usada: plantilla.metricas?.veces_usada || 0
    }));
    
    res.json({ plantillas: plantillasConMetricas });
  } catch (error) {
    console.error('Error obteniendo mejores plantillas:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener estadísticas generales
router.get('/estadisticas/resumen', auth, verificarPermiso('plantillas', 'leer'), async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin, categoria } = req.query;
    
    const fechaInicio = fecha_inicio ? new Date(fecha_inicio) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const fechaFin = fecha_fin ? new Date(fecha_fin) : new Date();

    // Estadísticas generales
    const totalPlantillas = await PlantillaWhatsApp.countDocuments({ activa: true });
    const plantillasUsadas = await PlantillaWhatsApp.countDocuments({ 
      activa: true, 
      'metricas.veces_usada': { $gt: 0 } 
    });

    // Mejores plantillas
    const mejoresPlantillas = await WhatsAppTracking.obtenerMejoresPlantillas(categoria, 10);

    // Estadísticas por categoría
    const estadisticasPorCategoria = await PlantillaWhatsApp.aggregate([
      { $match: { activa: true } },
      {
        $group: {
          _id: '$categoria',
          total_plantillas: { $sum: 1 },
          total_usos: { $sum: '$metricas.veces_usada' },
          total_conversiones: { $sum: '$metricas.conversiones' },
          rating_promedio: { $avg: '$metricas.rating_total' }
        }
      },
      { $sort: { total_usos: -1 } }
    ]);

    res.json({
      total_plantillas: totalPlantillas,
      plantillas_activas: plantillasUsadas,
      efectividad_promedio: Math.round(efectividadPromedio),
      rating_promedio: Math.round(ratingPromedio * 10) / 10,
      por_categoria: porCategoria.map(cat => ({
        categoria: cat._id,
        total: cat.total,
        efectividad_promedio: Math.round(cat.efectividad_promedio || 0),
        rating_promedio: Math.round((cat.rating_promedio || 0) * 10) / 10
      })),
      periodo: {
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin
      }
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Duplicar plantilla
router.post('/:id/duplicar', auth, verificarPermiso('plantillas', 'crear'), async (req, res) => {
  try {
    const plantillaOriginal = await PlantillaWhatsApp.findById(req.params.id);
    if (!plantillaOriginal) {
      return res.status(404).json({ message: 'Plantilla no encontrada' });
    }

    const plantillaDuplicada = new PlantillaWhatsApp({
      nombre: `${plantillaOriginal.nombre} (Copia)`,
      categoria: plantillaOriginal.categoria,
      estilo: plantillaOriginal.estilo,
      mensaje: plantillaOriginal.mensaje,
      variables: plantillaOriginal.variables,
      tags: plantillaOriginal.tags,
      creada_por: req.usuario._id,
      activa: false // Inactiva por defecto para revisión
    });

    await plantillaDuplicada.save();
    await plantillaDuplicada.populate('creada_por', 'nombre apellido');

    res.status(201).json({
      message: 'Plantilla duplicada exitosamente',
      plantilla: plantillaDuplicada
    });
  } catch (error) {
    console.error('Error duplicando plantilla:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;

const express = require('express');
const Plantilla = require('../models/Plantilla');
const { auth } = require('../middleware/auth');

const router = express.Router();

// GET /plantillas - Obtener todas las plantillas
router.get('/', auth, async (req, res) => {
  try {
    const { categoria, activa, limit = 50, page = 1 } = req.query;
    
    const filtros = {};
    if (categoria) filtros.categoria = categoria;
    if (activa !== undefined) filtros.activa = activa === 'true';
    
    const plantillas = await Plantilla.find(filtros)
      .populate('creador', 'nombre apellido')
      .sort({ vecesUsada: -1, fechaCreacion: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Plantilla.countDocuments(filtros);
    
    res.json({
      plantillas,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching plantillas:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /plantillas/:id - Obtener una plantilla específica
router.get('/:id', auth, async (req, res) => {
  try {
    const plantilla = await Plantilla.findById(req.params.id)
      .populate('creador', 'nombre apellido');
    
    if (!plantilla) {
      return res.status(404).json({ message: 'Plantilla no encontrada' });
    }
    
    res.json(plantilla);
  } catch (error) {
    console.error('Error fetching plantilla:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// POST /plantillas - Crear nueva plantilla
router.post('/', auth, async (req, res) => {
  try {
    const { nombre, descripcion, texto, categoria, variables } = req.body;
    
    // Validaciones
    if (!nombre || !texto) {
      return res.status(400).json({ 
        message: 'Nombre y texto son requeridos' 
      });
    }
    
    // Verificar si ya existe una plantilla con el mismo nombre
    const plantillaExistente = await Plantilla.findOne({ 
      nombre: { $regex: new RegExp(`^${nombre}$`, 'i') }
    });
    
    if (plantillaExistente) {
      return res.status(400).json({ 
        message: 'Ya existe una plantilla con ese nombre' 
      });
    }
    
    // Extraer variables del texto automáticamente
    const variablesEncontradas = [];
    const regex = /\{(\w+)\}/g;
    let match;
    while ((match = regex.exec(texto)) !== null) {
      const nombreVariable = match[1];
      if (!variablesEncontradas.find(v => v.nombre === nombreVariable)) {
        variablesEncontradas.push({
          nombre: nombreVariable,
          descripcion: `Variable ${nombreVariable}`
        });
      }
    }
    
    const nuevaPlantilla = new Plantilla({
      nombre,
      descripcion,
      texto,
      categoria: categoria || 'whatsapp',
      variables: variables || variablesEncontradas,
      creador: req.usuario._id
    });
    
    await nuevaPlantilla.save();
    
    // Poblar el creador antes de enviar la respuesta
    await nuevaPlantilla.populate('creador', 'nombre apellido');
    
    res.status(201).json({
      message: 'Plantilla creada exitosamente',
      plantilla: nuevaPlantilla
    });
  } catch (error) {
    console.error('Error creating plantilla:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// PUT /plantillas/:id - Actualizar plantilla
router.put('/:id', auth, async (req, res) => {
  try {
    const { nombre, descripcion, texto, categoria, variables, activa } = req.body;
    
    const plantilla = await Plantilla.findById(req.params.id);
    
    if (!plantilla) {
      return res.status(404).json({ message: 'Plantilla no encontrada' });
    }
    
    // Solo el creador o admin puede editar
    if (plantilla.creador.toString() !== req.usuario._id.toString() && req.usuario.rol !== 'admin') {
      return res.status(403).json({ 
        message: 'No tienes permisos para editar esta plantilla' 
      });
    }
    
    // Actualizar campos
    if (nombre) plantilla.nombre = nombre;
    if (descripcion !== undefined) plantilla.descripcion = descripcion;
    if (texto) plantilla.texto = texto;
    if (categoria) plantilla.categoria = categoria;
    if (variables) plantilla.variables = variables;
    if (activa !== undefined) plantilla.activa = activa;
    
    await plantilla.save();
    await plantilla.populate('creador', 'nombre apellido');
    
    res.json({
      message: 'Plantilla actualizada exitosamente',
      plantilla
    });
  } catch (error) {
    console.error('Error updating plantilla:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// DELETE /plantillas/:id - Eliminar plantilla
router.delete('/:id', auth, async (req, res) => {
  try {
    const plantilla = await Plantilla.findById(req.params.id);
    
    if (!plantilla) {
      return res.status(404).json({ message: 'Plantilla no encontrada' });
    }
    
    // Solo el creador o admin puede eliminar
    if (plantilla.creador.toString() !== req.usuario._id.toString() && req.usuario.rol !== 'admin') {
      return res.status(403).json({ 
        message: 'No tienes permisos para eliminar esta plantilla' 
      });
    }
    
    await Plantilla.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Plantilla eliminada exitosamente' });
  } catch (error) {
    console.error('Error deleting plantilla:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// POST /plantillas/:id/usar - Incrementar contador de uso
router.post('/:id/usar', auth, async (req, res) => {
  try {
    const plantilla = await Plantilla.findById(req.params.id);
    
    if (!plantilla) {
      return res.status(404).json({ message: 'Plantilla no encontrada' });
    }
    
    await plantilla.incrementarUso();
    
    res.json({ message: 'Uso registrado exitosamente' });
  } catch (error) {
    console.error('Error registering usage:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /plantillas/populares - Obtener plantillas más usadas
router.get('/stats/populares', auth, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const plantillasPopulares = await Plantilla.find({ activa: true })
      .populate('creador', 'nombre apellido')
      .sort({ vecesUsada: -1 })
      .limit(parseInt(limit));
    
    res.json(plantillasPopulares);
  } catch (error) {
    console.error('Error fetching popular plantillas:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;

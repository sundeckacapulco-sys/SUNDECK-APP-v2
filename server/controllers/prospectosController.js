const Proyecto = require('../models/Proyecto');
const logger = require('../config/logger');

/**
 * CONTROLADOR DE PROSPECTOS UNIFICADOS
 * Gestiona la etapa comercial antes de convertir a proyecto operativo
 */

// Obtener todos los prospectos
exports.getProspectos = async (req, res) => {
  try {
    const { asesor, estadoComercial, fuente } = req.query;
    
    const filtros = { tipo: 'prospecto' };
    
    // Filtros opcionales
    if (asesor) filtros.asesorComercial = asesor;
    if (estadoComercial) filtros.estadoComercial = estadoComercial;
    if (fuente) filtros['origenComercial.fuente'] = fuente;
    
    const prospectos = await Proyecto.find(filtros)
      .populate('asesorComercial', 'nombre apellido email')
      .populate('seguimiento.autor', 'nombre apellido')
      .sort({ createdAt: -1 });
    
    logger.info('Prospectos obtenidos', {
      controlador: 'prospectosController',
      metodo: 'getProspectos',
      total: prospectos.length,
      filtros
    });
    
    res.json(prospectos);
  } catch (error) {
    logger.error('Error obteniendo prospectos', {
      controlador: 'prospectosController',
      metodo: 'getProspectos',
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      ok: false, 
      mensaje: 'Error obteniendo prospectos',
      error: error.message 
    });
  }
};

// Obtener un prospecto por ID
exports.getProspectoById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const prospecto = await Proyecto.findById(id)
      .populate('asesorComercial', 'nombre apellido email telefono')
      .populate('seguimiento.autor', 'nombre apellido')
      .populate('creado_por', 'nombre apellido');
    
    if (!prospecto) {
      return res.status(404).json({ 
        ok: false, 
        mensaje: 'Prospecto no encontrado' 
      });
    }
    
    if (prospecto.tipo !== 'prospecto') {
      return res.status(400).json({ 
        ok: false, 
        mensaje: 'Este registro no es un prospecto' 
      });
    }
    
    res.json(prospecto);
  } catch (error) {
    logger.error('Error obteniendo prospecto', {
      controlador: 'prospectosController',
      metodo: 'getProspectoById',
      prospectoId: req.params.id,
      error: error.message
    });
    res.status(500).json({ 
      ok: false, 
      mensaje: 'Error obteniendo prospecto',
      error: error.message 
    });
  }
};

// Agregar nota de seguimiento
exports.agregarNota = async (req, res) => {
  try {
    const { id } = req.params;
    const { mensaje, tipo = 'nota' } = req.body;
    const autor = req.usuario?._id || req.body.autor;
    
    if (!mensaje) {
      return res.status(400).json({ 
        ok: false, 
        mensaje: 'El mensaje es requerido' 
      });
    }
    
    const prospecto = await Proyecto.findById(id);
    
    if (!prospecto) {
      return res.status(404).json({ 
        ok: false, 
        mensaje: 'Prospecto no encontrado' 
      });
    }
    
    if (prospecto.tipo !== 'prospecto') {
      return res.status(400).json({ 
        ok: false, 
        mensaje: 'Solo se pueden agregar notas a prospectos' 
      });
    }
    
    // Agregar nota al seguimiento
    prospecto.seguimiento.push({
      autor,
      mensaje,
      tipo,
      fecha: new Date()
    });
    
    // Actualizar fecha de última nota
    prospecto.ultimaNota = new Date();
    
    await prospecto.save();
    
    // Poblar para respuesta
    await prospecto.populate('seguimiento.autor', 'nombre apellido');
    
    logger.info('Nota agregada a prospecto', {
      controlador: 'prospectosController',
      metodo: 'agregarNota',
      prospectoId: id,
      autor,
      tipo
    });
    
    res.json({ 
      ok: true, 
      mensaje: 'Nota agregada exitosamente', 
      prospecto 
    });
  } catch (error) {
    logger.error('Error agregando nota', {
      controlador: 'prospectosController',
      metodo: 'agregarNota',
      prospectoId: req.params.id,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      ok: false, 
      mensaje: 'Error agregando nota',
      error: error.message 
    });
  }
};

// Convertir prospecto a proyecto formal
exports.convertirAProyecto = async (req, res) => {
  try {
    const { id } = req.params;
    
    const prospecto = await Proyecto.findById(id);
    
    if (!prospecto) {
      return res.status(404).json({ 
        ok: false, 
        mensaje: 'Prospecto no encontrado' 
      });
    }
    
    if (prospecto.tipo !== 'prospecto') {
      return res.status(400).json({ 
        ok: false, 
        mensaje: 'Este registro ya es un proyecto' 
      });
    }
    
    // Convertir a proyecto
    prospecto.tipo = 'proyecto';
    prospecto.estadoComercial = 'convertido';
    
    // Agregar nota de conversión
    prospecto.seguimiento.push({
      autor: req.usuario?._id || req.body.autor,
      mensaje: 'Prospecto convertido a proyecto formal',
      tipo: 'nota',
      fecha: new Date()
    });
    
    await prospecto.save();
    
    logger.info('Prospecto convertido a proyecto', {
      controlador: 'prospectosController',
      metodo: 'convertirAProyecto',
      prospectoId: id,
      proyectoNumero: prospecto.numero
    });
    
    res.json({ 
      ok: true, 
      mensaje: 'Prospecto convertido a proyecto exitosamente', 
      proyecto: prospecto 
    });
  } catch (error) {
    logger.error('Error convirtiendo prospecto', {
      controlador: 'prospectosController',
      metodo: 'convertirAProyecto',
      prospectoId: req.params.id,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      ok: false, 
      mensaje: 'Error convirtiendo prospecto',
      error: error.message 
    });
  }
};

// Actualizar estado comercial
exports.actualizarEstadoComercial = async (req, res) => {
  try {
    const { id } = req.params;
    const { estadoComercial, probabilidadCierre } = req.body;
    
    const prospecto = await Proyecto.findById(id);
    
    if (!prospecto) {
      return res.status(404).json({ 
        ok: false, 
        mensaje: 'Prospecto no encontrado' 
      });
    }
    
    if (prospecto.tipo !== 'prospecto') {
      return res.status(400).json({ 
        ok: false, 
        mensaje: 'Solo se puede actualizar el estado de prospectos' 
      });
    }
    
    // Actualizar estado
    if (estadoComercial) {
      prospecto.estadoComercial = estadoComercial;
    }
    
    if (probabilidadCierre !== undefined) {
      prospecto.probabilidadCierre = Math.min(100, Math.max(0, probabilidadCierre));
    }
    
    await prospecto.save();
    
    logger.info('Estado comercial actualizado', {
      controlador: 'prospectosController',
      metodo: 'actualizarEstadoComercial',
      prospectoId: id,
      estadoComercial,
      probabilidadCierre
    });
    
    res.json({ 
      ok: true, 
      mensaje: 'Estado actualizado exitosamente', 
      prospecto 
    });
  } catch (error) {
    logger.error('Error actualizando estado comercial', {
      controlador: 'prospectosController',
      metodo: 'actualizarEstadoComercial',
      prospectoId: req.params.id,
      error: error.message
    });
    res.status(500).json({ 
      ok: false, 
      mensaje: 'Error actualizando estado',
      error: error.message 
    });
  }
};

// Obtener estadísticas de prospectos
exports.getEstadisticas = async (req, res) => {
  try {
    const { asesor } = req.query;
    
    const filtroBase = { tipo: 'prospecto' };
    if (asesor) filtroBase.asesorComercial = asesor;
    
    const [
      total,
      enSeguimiento,
      cotizados,
      sinRespuesta,
      convertidos,
      perdidos
    ] = await Promise.all([
      Proyecto.countDocuments(filtroBase),
      Proyecto.countDocuments({ ...filtroBase, estadoComercial: 'en seguimiento' }),
      Proyecto.countDocuments({ ...filtroBase, estadoComercial: 'cotizado' }),
      Proyecto.countDocuments({ ...filtroBase, estadoComercial: 'sin respuesta' }),
      Proyecto.countDocuments({ ...filtroBase, estadoComercial: 'convertido' }),
      Proyecto.countDocuments({ ...filtroBase, estadoComercial: 'perdido' })
    ]);
    
    const conversionRate = total > 0 ? ((convertidos / total) * 100).toFixed(2) : 0;
    
    // Prospectos inactivos (más de 5 días sin nota)
    const limite = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    const inactivos = await Proyecto.countDocuments({
      ...filtroBase,
      estadoComercial: { $in: ['en seguimiento', 'cotizado'] },
      $or: [
        { ultimaNota: { $lt: limite } },
        { ultimaNota: null }
      ]
    });
    
    const estadisticas = {
      total,
      porEstado: {
        enSeguimiento,
        cotizados,
        sinRespuesta,
        convertidos,
        perdidos
      },
      conversionRate: parseFloat(conversionRate),
      inactivos
    };
    
    logger.info('Estadísticas de prospectos obtenidas', {
      controlador: 'prospectosController',
      metodo: 'getEstadisticas',
      asesor: asesor || 'todos',
      total
    });
    
    res.json(estadisticas);
  } catch (error) {
    logger.error('Error obteniendo estadísticas', {
      controlador: 'prospectosController',
      metodo: 'getEstadisticas',
      error: error.message
    });
    res.status(500).json({ 
      ok: false, 
      mensaje: 'Error obteniendo estadísticas',
      error: error.message 
    });
  }
};

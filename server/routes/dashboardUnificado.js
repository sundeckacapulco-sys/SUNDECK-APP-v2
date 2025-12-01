
const express = require('express');
const { auth } = require('../middleware/auth');
const logger = require('../config/logger');

const router = express.Router();

// ===============================================================
// RUTA DESACTIVADA TEMPORALMENTE PARA DEPURACIÓN
// La consulta de agregación original está causando un crash en el servidor.
// Se restaura una vez que se corrija el pipeline.
// ===============================================================
router.get('/', auth, async (req, res) => {
  try {
    logger.warn('La ruta del dashboard unificado ha sido desactivada temporalmente para depuración.');
    res.json({
      pipeline: {},
      metricas: {},
      seguimientosPendientes: [],
      actividadReciente: [],
      citasHoy: [],
      supervisionEnVivo: [],
      cierresMensuales: []
    });
  } catch (error) {
    res.status(500).json({ message: 'Ruta del dashboard unificado desactivada por error previo.' });
  }
});

module.exports = router;

/*
// ===============================================================
//               CÓDIGO ORIGINAL QUE CAUSA EL FALLO
// ===============================================================
const Proyecto = require('../models/Proyecto');

router.get('/', auth, async (req, res) => {
  try {
    const { periodo = '30' } = req.query;
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - parseInt(periodo));

    const filtroUsuario = {};
    if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'gerente') {
      filtroUsuario.asesorComercial = req.usuario.nombre;
    }

    const resultado = await Proyecto.aggregate([
      // ... El pipeline de agregación masivo va aquí ...
    ]);

    // ... El resto del formateo de la respuesta va aquí ...

    res.json(response);

  } catch (error) {
    logger.error('Error en dashboard unificado', {
      error: error.message,
      stack: error.stack,
      usuario: req.usuario?.nombre
    });
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
*/

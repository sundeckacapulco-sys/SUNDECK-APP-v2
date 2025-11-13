const express = require('express');
const router = express.Router();
const { auth, verificarPermiso } = require('../middleware/auth');
const logger = require('../config/logger');
const alertasInteligentesService = require('../services/alertasInteligentesService');

/**
 * Rutas de alertas inteligentes
 */
router.get('/inteligentes', auth, verificarPermiso('proyectos', 'leer'), async (req, res) => {
  try {
    const limite = Number.parseInt(req.query.limite, 10);
    const limitePorCategoria = Number.isFinite(limite) && limite > 0 ? limite : 6;

    const panel = await alertasInteligentesService.generarPanel({ limitePorCategoria });

    res.json({
      ok: true,
      data: panel
    });
  } catch (error) {
    logger.error('Error obteniendo alertas inteligentes', {
      service: 'alertasInteligentes',
      endpoint: '/inteligentes',
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      ok: false,
      message: 'Error al obtener las alertas inteligentes'
    });
  }
});

module.exports = router;

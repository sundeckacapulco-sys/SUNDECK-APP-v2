const express = require('express');
const router = express.Router();
const fixCotizaciones = require('../scripts/migraciones/fixCotizaciones');
const logger = require('../config/logger');

// Endpoint temporal para corregir cotizaciones
router.post('/cotizaciones', async (req, res) => {
  try {
    logger.info('Corrección de cotizaciones iniciada vía API', {
      ruta: 'routes/fix',
      accion: 'corregirCotizaciones',
      usuarioId: req.usuario?._id
    });
    
    await fixCotizaciones();
    
    res.json({
      success: true,
      message: 'Cotizaciones corregidas exitosamente'
    });
    
  } catch (error) {
    logger.error('Error corrigiendo cotizaciones desde API', {
      ruta: 'routes/fix',
      accion: 'corregirCotizaciones',
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Error corrigiendo cotizaciones: ' + error.message
    });
  }
});

module.exports = router;

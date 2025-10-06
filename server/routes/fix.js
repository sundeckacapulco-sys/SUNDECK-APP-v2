const express = require('express');
const router = express.Router();
const fixCotizaciones = require('../scripts/fixCotizaciones');

// Endpoint temporal para corregir cotizaciones
router.post('/cotizaciones', async (req, res) => {
  try {
    console.log('🔧 Iniciando corrección de cotizaciones desde API...');
    
    await fixCotizaciones();
    
    res.json({
      success: true,
      message: 'Cotizaciones corregidas exitosamente'
    });
    
  } catch (error) {
    console.error('Error corrigiendo cotizaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error corrigiendo cotizaciones: ' + error.message
    });
  }
});

module.exports = router;

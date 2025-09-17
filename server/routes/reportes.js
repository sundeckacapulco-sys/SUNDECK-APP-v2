const express = require('express');
const { auth, verificarPermiso } = require('../middleware/auth');

const router = express.Router();

// Placeholder para reportes
router.get('/', auth, verificarPermiso('reportes', 'leer'), async (req, res) => {
  try {
    res.json({ message: 'Módulo de reportes en desarrollo' });
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;

const express = require('express');
const Instalacion = require('../models/Instalacion');
const { auth, verificarPermiso } = require('../middleware/auth');

const router = express.Router();

// Obtener instalaciones
router.get('/', auth, verificarPermiso('instalaciones', 'leer'), async (req, res) => {
  try {
    const { estado } = req.query;
    const filtros = {};
    if (estado) filtros.estado = estado;

    const instalaciones = await Instalacion.find(filtros)
      .populate('pedido')
      .populate('fabricacion')
      .populate('instaladores.usuario', 'nombre apellido')
      .sort({ fechaProgramada: 1 });

    res.json(instalaciones);
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;

const express = require('express');
const Fabricacion = require('../models/Fabricacion');
const { auth, verificarPermiso } = require('../middleware/auth');

const router = express.Router();

// Obtener fabricaciones
router.get('/', auth, verificarPermiso('fabricacion', 'leer'), async (req, res) => {
  try {
    const { estado } = req.query;
    const filtros = {};
    if (estado) filtros.estado = estado;

    const fabricaciones = await Fabricacion.find(filtros)
      .populate('pedido')
      .populate('supervisor', 'nombre apellido')
      .sort({ createdAt: -1 });

    res.json(fabricaciones);
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;

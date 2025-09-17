const express = require('express');
const Postventa = require('../models/Postventa');
const { auth, verificarPermiso } = require('../middleware/auth');

const router = express.Router();

// Obtener registros de postventa
router.get('/', auth, verificarPermiso('postventa', 'leer'), async (req, res) => {
  try {
    const { estado } = req.query;
    const filtros = {};
    if (estado) filtros.estado = estado;

    const postventa = await Postventa.find(filtros)
      .populate('cliente', 'nombre telefono email')
      .populate('pedido', 'numero')
      .sort({ createdAt: -1 });

    res.json(postventa);
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;

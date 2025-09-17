const express = require('express');
const Recordatorio = require('../models/Recordatorio');
const { auth, verificarPermiso } = require('../middleware/auth');

const router = express.Router();

// Obtener recordatorios
router.get('/', auth, async (req, res) => {
  try {
    const { estado, tipo } = req.query;
    const filtros = { usuario: req.usuario._id };
    
    if (estado) filtros.estado = estado;
    if (tipo) filtros.tipo = tipo;

    const recordatorios = await Recordatorio.find(filtros)
      .populate('prospecto', 'nombre telefono')
      .populate('pedido', 'numero')
      .sort({ fechaProgramada: 1 });

    res.json(recordatorios);
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;

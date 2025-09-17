const express = require('express');
const Pedido = require('../models/Pedido');
const { auth, verificarPermiso } = require('../middleware/auth');

const router = express.Router();

// Obtener pedidos
router.get('/', auth, verificarPermiso('pedidos', 'leer'), async (req, res) => {
  try {
    const { estado, vendedor } = req.query;
    const filtros = {};
    
    if (estado) filtros.estado = estado;
    if (vendedor) filtros.vendedor = vendedor;
    
    if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'gerente') {
      filtros.vendedor = req.usuario._id;
    }

    const pedidos = await Pedido.find(filtros)
      .populate('prospecto', 'nombre telefono')
      .populate('cotizacion', 'numero')
      .populate('vendedor', 'nombre apellido')
      .sort({ createdAt: -1 });

    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;

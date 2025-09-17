const express = require('express');
const Usuario = require('../models/Usuario');
const { auth, verificarPermiso, verificarRol } = require('../middleware/auth');

const router = express.Router();

// Obtener todos los usuarios (solo admin/gerente)
router.get('/', auth, verificarRol('admin', 'gerente'), async (req, res) => {
  try {
    const { activo = true, rol } = req.query;
    
    const filtros = {};
    if (activo !== undefined) filtros.activo = activo === 'true';
    if (rol) filtros.rol = rol;

    const usuarios = await Usuario.find(filtros)
      .select('-password')
      .populate('supervisor', 'nombre apellido')
      .sort({ nombre: 1 });

    res.json(usuarios);
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener vendedores activos (para asignaciones)
router.get('/vendedores', auth, async (req, res) => {
  try {
    const vendedores = await Usuario.find({
      rol: { $in: ['vendedor', 'gerente', 'admin'] },
      activo: true
    })
    .select('nombre apellido email rol')
    .sort({ nombre: 1 });

    res.json(vendedores);
  } catch (error) {
    console.error('Error obteniendo vendedores:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;

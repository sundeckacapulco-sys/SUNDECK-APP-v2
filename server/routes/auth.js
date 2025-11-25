const express = require('express');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Registro de usuario (solo admin)
router.post('/registro', auth, async (req, res) => {
  try {
    // Verificar que solo admin puede crear usuarios
    if (req.usuario.rol !== 'admin') {
      return res.status(403).json({ message: 'Solo administradores pueden crear usuarios' });
    }

    const { nombre, apellido, email, password, rol, telefono, permisos } = req.body;

    // Verificar si el usuario ya existe
    const usuarioExistente = await Usuario.findOne({ email });
    if (usuarioExistente) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    // Crear nuevo usuario
    const nuevoUsuario = new Usuario({
      nombre,
      apellido,
      email,
      password,
      rol,
      telefono,
      permisos: permisos || []
    });

    await nuevoUsuario.save();

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      usuario: {
        id: nuevoUsuario._id,
        nombre: nuevoUsuario.nombreCompleto(),
        email: nuevoUsuario.email,
        rol: nuevoUsuario.rol
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario
    const usuario = await Usuario.findOne({ email, activo: true });
    if (!usuario) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Verificar password
    const passwordValido = await usuario.compararPassword(password);
    if (!passwordValido) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Generar token
    const token = jwt.sign(
      { id: usuario._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Actualizar último acceso
    usuario.fechaUltimoAcceso = new Date();
    await usuario.save();

    res.json({
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombreCompleto(),
        email: usuario.email,
        rol: usuario.rol,
        permisos: usuario.permisos,
        configuracion: usuario.configuracion
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Obtener perfil del usuario actual
router.get('/perfil', auth, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario._id)
      .select('-password')
      .populate('supervisor', 'nombre apellido email');

    res.json(usuario);
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Actualizar perfil
router.put('/perfil', auth, async (req, res) => {
  try {
    const { nombre, apellido, telefono, whatsapp, configuracion } = req.body;

    const usuario = await Usuario.findById(req.usuario._id);
    
    if (nombre) usuario.nombre = nombre;
    if (apellido) usuario.apellido = apellido;
    if (telefono) usuario.telefono = telefono;
    if (whatsapp) usuario.whatsapp = whatsapp;
    if (configuracion) usuario.configuracion = { ...usuario.configuracion, ...configuracion };

    await usuario.save();

    res.json({
      message: 'Perfil actualizado exitosamente',
      usuario: {
        id: usuario._id,
        nombre: usuario.nombreCompleto(),
        email: usuario.email,
        telefono: usuario.telefono,
        configuracion: usuario.configuracion
      }
    });
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Cambiar password
router.put('/cambiar-password', auth, async (req, res) => {
  try {
    const { passwordActual, passwordNuevo } = req.body;

    const usuario = await Usuario.findById(req.usuario._id);
    
    // Verificar password actual
    const passwordValido = await usuario.compararPassword(passwordActual);
    if (!passwordValido) {
      return res.status(400).json({ message: 'Password actual incorrecto' });
    }

    // Actualizar password
    usuario.password = passwordNuevo;
    await usuario.save();

    res.json({ message: 'Password actualizado exitosamente' });
  } catch (error) {
    console.error('Error cambiando password:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Verificar token
router.get('/verificar', auth, (req, res) => {
  res.json({ 
    valido: true, 
    usuario: {
      id: req.usuario._id,
      nombre: req.usuario.nombreCompleto(),
      rol: req.usuario.rol
    }
  });
});

module.exports = router;

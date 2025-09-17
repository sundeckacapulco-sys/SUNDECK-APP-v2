const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

// Middleware de autenticación
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Token de acceso requerido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await Usuario.findById(decoded.id).select('-password');
    
    if (!usuario || !usuario.activo) {
      return res.status(401).json({ message: 'Usuario no válido o inactivo' });
    }

    // Actualizar último acceso
    usuario.fechaUltimoAcceso = new Date();
    await usuario.save();

    req.usuario = usuario;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token no válido' });
  }
};

// Middleware para verificar permisos específicos
const verificarPermiso = (modulo, accion) => {
  return (req, res, next) => {
    if (!req.usuario.tienePermiso(modulo, accion)) {
      return res.status(403).json({ 
        message: 'No tienes permisos para realizar esta acción' 
      });
    }
    next();
  };
};

// Middleware para verificar roles
const verificarRol = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.usuario.rol)) {
      return res.status(403).json({ 
        message: 'No tienes el rol necesario para esta acción' 
      });
    }
    next();
  };
};

module.exports = {
  auth,
  verificarPermiso,
  verificarRol
};

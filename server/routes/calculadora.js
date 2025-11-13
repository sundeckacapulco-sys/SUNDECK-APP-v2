const express = require('express');
const router = express.Router();
const { auth, verificarPermiso } = require('../middleware/auth');
const ConfiguracionMateriales = require('../models/ConfiguracionMateriales');
const logger = require('../config/logger');

// GET /api/calculadora/configuraciones - Listar todas las configuraciones
router.get('/configuraciones',
  auth,
  verificarPermiso('configuracion', 'leer'),
  async (req, res) => {
    try {
      const configuraciones = await ConfiguracionMateriales.find()
        .sort({ nombre: 1 })
        .lean();

      logger.info('Configuraciones obtenidas', {
        ruta: '/api/calculadora/configuraciones',
        total: configuraciones.length
      });

      res.json({
        success: true,
        data: configuraciones
      });
    } catch (error) {
      logger.error('Error obteniendo configuraciones', {
        ruta: '/api/calculadora/configuraciones',
        error: error.message
      });
      res.status(500).json({
        success: false,
        message: 'Error obteniendo configuraciones',
        error: error.message
      });
    }
  }
);

// GET /api/calculadora/configuraciones/:id - Obtener una configuración
router.get('/configuraciones/:id',
  auth,
  verificarPermiso('configuracion', 'leer'),
  async (req, res) => {
    try {
      const config = await ConfiguracionMateriales.findById(req.params.id).lean();

      if (!config) {
        return res.status(404).json({
          success: false,
          message: 'Configuración no encontrada'
        });
      }

      res.json({
        success: true,
        data: config
      });
    } catch (error) {
      logger.error('Error obteniendo configuración', {
        ruta: '/api/calculadora/configuraciones/:id',
        id: req.params.id,
        error: error.message
      });
      res.status(500).json({
        success: false,
        message: 'Error obteniendo configuración',
        error: error.message
      });
    }
  }
);

// POST /api/calculadora/configuraciones - Crear nueva configuración
router.post('/configuraciones',
  auth,
  verificarPermiso('configuracion', 'crear'),
  async (req, res) => {
    try {
      const config = new ConfiguracionMateriales({
        ...req.body,
        creado_por: req.usuario?.id
      });

      await config.save();

      logger.info('Configuración creada', {
        ruta: '/api/calculadora/configuraciones',
        configId: config._id,
        nombre: config.nombre
      });

      res.status(201).json({
        success: true,
        data: config,
        message: 'Configuración creada exitosamente'
      });
    } catch (error) {
      logger.error('Error creando configuración', {
        ruta: '/api/calculadora/configuraciones',
        error: error.message
      });
      res.status(500).json({
        success: false,
        message: 'Error creando configuración',
        error: error.message
      });
    }
  }
);

// PUT /api/calculadora/configuraciones/:id - Actualizar configuración
router.put('/configuraciones/:id',
  auth,
  verificarPermiso('configuracion', 'actualizar'),
  async (req, res) => {
    try {
      const config = await ConfiguracionMateriales.findByIdAndUpdate(
        req.params.id,
        {
          ...req.body,
          actualizado_por: req.usuario?.id
        },
        { new: true, runValidators: true }
      );

      if (!config) {
        return res.status(404).json({
          success: false,
          message: 'Configuración no encontrada'
        });
      }

      logger.info('Configuración actualizada', {
        ruta: '/api/calculadora/configuraciones/:id',
        configId: config._id,
        nombre: config.nombre
      });

      res.json({
        success: true,
        data: config,
        message: 'Configuración actualizada exitosamente'
      });
    } catch (error) {
      logger.error('Error actualizando configuración', {
        ruta: '/api/calculadora/configuraciones/:id',
        id: req.params.id,
        error: error.message
      });
      res.status(500).json({
        success: false,
        message: 'Error actualizando configuración',
        error: error.message
      });
    }
  }
);

// DELETE /api/calculadora/configuraciones/:id - Eliminar configuración
router.delete('/configuraciones/:id',
  auth,
  verificarPermiso('configuracion', 'eliminar'),
  async (req, res) => {
    try {
      const config = await ConfiguracionMateriales.findByIdAndDelete(req.params.id);

      if (!config) {
        return res.status(404).json({
          success: false,
          message: 'Configuración no encontrada'
        });
      }

      logger.info('Configuración eliminada', {
        ruta: '/api/calculadora/configuraciones/:id',
        configId: config._id,
        nombre: config.nombre
      });

      res.json({
        success: true,
        message: 'Configuración eliminada exitosamente'
      });
    } catch (error) {
      logger.error('Error eliminando configuración', {
        ruta: '/api/calculadora/configuraciones/:id',
        id: req.params.id,
        error: error.message
      });
      res.status(500).json({
        success: false,
        message: 'Error eliminando configuración',
        error: error.message
      });
    }
  }
);

// POST /api/calculadora/probar - Probar fórmula
router.post('/probar',
  auth,
  async (req, res) => {
    try {
      const { formula, condicion, pieza } = req.body;

      // Evaluar fórmula
      const { ancho, alto, area, motorizado, galeria, sistema } = pieza;
      const Math = global.Math;
      
      let resultado = null;
      let error = null;
      
      try {
        resultado = eval(formula);
      } catch (e) {
        error = e.message;
      }

      // Evaluar condición si existe
      let cumpleCondicion = true;
      if (condicion) {
        try {
          cumpleCondicion = eval(condicion);
        } catch (e) {
          error = error ? `${error}; Condición: ${e.message}` : `Condición: ${e.message}`;
        }
      }

      res.json({
        success: !error,
        resultado: Number(resultado),
        cumpleCondicion,
        error
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error probando fórmula',
        error: error.message
      });
    }
  }
);

module.exports = router;

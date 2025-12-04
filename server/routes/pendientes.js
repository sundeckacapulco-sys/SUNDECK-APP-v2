/**
 * Rutas de Pendientes del Día
 */

const express = require('express');
const { auth, verificarPermiso } = require('../middleware/auth');
const PendientesService = require('../services/pendientesService');
const logger = require('../config/logger');

const router = express.Router();

/**
 * GET /api/pendientes/hoy
 * Obtener todos los pendientes del día
 */
router.get('/hoy',
  auth,
  async (req, res) => {
    try {
      const pendientes = await PendientesService.obtenerPendientesHoy();
      
      res.json({
        success: true,
        data: pendientes
      });
      
    } catch (error) {
      logger.error('Error en GET /pendientes/hoy', {
        error: error.message
      });
      res.status(500).json({
        success: false,
        message: 'Error obteniendo pendientes del día',
        error: error.message
      });
    }
  }
);

/**
 * GET /api/pendientes/semana
 * Obtener pendientes de la semana
 */
router.get('/semana',
  auth,
  async (req, res) => {
    try {
      const pendientes = await PendientesService.obtenerPendientesSemana();
      
      res.json({
        success: true,
        data: pendientes
      });
      
    } catch (error) {
      logger.error('Error en GET /pendientes/semana', {
        error: error.message
      });
      res.status(500).json({
        success: false,
        message: 'Error obteniendo pendientes de la semana',
        error: error.message
      });
    }
  }
);

/**
 * POST /api/pendientes/:proyectoId/atender
 * Marcar un pendiente como atendido
 */
router.post('/:proyectoId/atender',
  auth,
  verificarPermiso('proyectos', 'editar'),
  async (req, res) => {
    try {
      const { proyectoId } = req.params;
      const { tipo, notas } = req.body;
      
      if (!tipo) {
        return res.status(400).json({
          success: false,
          message: 'El tipo de pendiente es requerido'
        });
      }
      
      const resultado = await PendientesService.marcarAtendido(proyectoId, tipo, notas);
      
      res.json({
        success: true,
        data: resultado
      });
      
    } catch (error) {
      logger.error('Error en POST /pendientes/:proyectoId/atender', {
        proyectoId: req.params.proyectoId,
        error: error.message
      });
      res.status(500).json({
        success: false,
        message: 'Error marcando pendiente como atendido',
        error: error.message
      });
    }
  }
);

module.exports = router;

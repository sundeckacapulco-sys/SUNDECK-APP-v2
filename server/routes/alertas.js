const express = require('express');
const router = express.Router();
const { auth, verificarPermiso } = require('../middleware/auth');
const logger = require('../config/logger');
const alertasInteligentesService = require('../services/alertasInteligentesService');
const alertasFabricacionService = require('../services/alertasFabricacionService');

/**
 * Rutas de alertas inteligentes
 */
router.get('/inteligentes', auth, verificarPermiso('proyectos', 'leer'), async (req, res) => {
  try {
    const limite = Number.parseInt(req.query.limite, 10);
    const limitePorCategoria = Number.isFinite(limite) && limite > 0 ? limite : 6;

    const panel = await alertasInteligentesService.generarPanel({ limitePorCategoria });

    res.json({
      ok: true,
      data: panel
    });
  } catch (error) {
    logger.error('Error obteniendo alertas inteligentes', {
      service: 'alertasInteligentes',
      endpoint: '/inteligentes',
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      ok: false,
      message: 'Error al obtener las alertas inteligentes'
    });
  }
});

router.get(
  '/inteligentes/fabricacion',
  auth,
  verificarPermiso('proyectos', 'leer'),
  async (req, res) => {
    try {
      const limite = Number.parseInt(req.query.limite, 10);
      const diasUmbralRetraso = Number.parseInt(req.query.umbralRetraso, 10);
      const diasUmbralCalidad = Number.parseInt(req.query.umbralCalidad, 10);

      const panel = await alertasFabricacionService.obtenerTodasLasAlertas({
        limitePorCategoria: Number.isFinite(limite) && limite > 0 ? limite : 6,
        diasUmbralRetraso,
        diasUmbralCalidad
      });

      res.json({
        ok: true,
        data: panel
      });
    } catch (error) {
      logger.error('Error obteniendo alertas inteligentes de fabricación', {
        service: 'alertasFabricacion',
        endpoint: '/inteligentes/fabricacion',
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        ok: false,
        message: 'Error al obtener las alertas de fabricación'
      });
    }
  }
);

router.get(
  '/inteligentes/fabricacion/retrasadas',
  auth,
  verificarPermiso('proyectos', 'leer'),
  async (req, res) => {
    try {
      const limite = Number.parseInt(req.query.limite, 10);
      const diasUmbral = Number.parseInt(req.query.umbral, 10);

      const alertas = await alertasFabricacionService.obtenerOrdenesRetrasadas({
        limite: Number.isFinite(limite) && limite > 0 ? limite : 50,
        diasUmbral: Number.isFinite(diasUmbral) && diasUmbral > 0 ? diasUmbral : undefined
      });

      res.json({
        ok: true,
        data: alertas
      });
    } catch (error) {
      logger.error('Error obteniendo órdenes de fabricación retrasadas', {
        service: 'alertasFabricacion',
        endpoint: '/inteligentes/fabricacion/retrasadas',
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        ok: false,
        message: 'Error al obtener las órdenes retrasadas'
      });
    }
  }
);

router.get(
  '/inteligentes/fabricacion/materiales',
  auth,
  verificarPermiso('proyectos', 'leer'),
  async (req, res) => {
    try {
      const limite = Number.parseInt(req.query.limite, 10);

      const alertas = await alertasFabricacionService.obtenerMaterialesFaltantes({
        limite: Number.isFinite(limite) && limite > 0 ? limite : 50
      });

      res.json({
        ok: true,
        data: alertas
      });
    } catch (error) {
      logger.error('Error obteniendo materiales faltantes en fabricación', {
        service: 'alertasFabricacion',
        endpoint: '/inteligentes/fabricacion/materiales',
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        ok: false,
        message: 'Error al obtener los materiales faltantes'
      });
    }
  }
);

router.get(
  '/inteligentes/fabricacion/calidad',
  auth,
  verificarPermiso('proyectos', 'leer'),
  async (req, res) => {
    try {
      const limite = Number.parseInt(req.query.limite, 10);
      const diasUmbral = Number.parseInt(req.query.umbral, 10);

      const alertas = await alertasFabricacionService.obtenerCalidadPendiente({
        limite: Number.isFinite(limite) && limite > 0 ? limite : 50,
        diasUmbral: Number.isFinite(diasUmbral) && diasUmbral > 0 ? diasUmbral : undefined
      });

      res.json({
        ok: true,
        data: alertas
      });
    } catch (error) {
      logger.error('Error obteniendo alertas de control de calidad pendiente', {
        service: 'alertasFabricacion',
        endpoint: '/inteligentes/fabricacion/calidad',
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        ok: false,
        message: 'Error al obtener el control de calidad pendiente'
      });
    }
  }
);

module.exports = router;

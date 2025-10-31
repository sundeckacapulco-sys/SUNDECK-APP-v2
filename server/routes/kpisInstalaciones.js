const express = require('express');
const KPIsInstalacionesService = require('../services/kpisInstalacionesService');
const { auth, verificarPermiso } = require('../middleware/auth');
const logger = require('../config/logger');

const router = express.Router();

// Obtener dashboard completo de KPIs de instalaciones
router.get('/dashboard', async (req, res) => {
  try {
    logger.info('Solicitando dashboard de KPIs de instalaciones', {
      ruta: 'kpisInstalaciones',
      endpoint: '/dashboard',
      usuarioId: req.usuario?._id?.toString(),
      fechaInicio: fecha_inicio,
      fechaFin: fecha_fin
    });
    
    const { fecha_inicio, fecha_fin } = req.query;
    
    let fechaInicio = null;
    let fechaFin = null;
    
    if (fecha_inicio) {
      fechaInicio = new Date(fecha_inicio);
    }
    
    if (fecha_fin) {
      fechaFin = new Date(fecha_fin);
    }

    const dashboard = await KPIsInstalacionesService.obtenerDashboardInstalaciones(fechaInicio, fechaFin);
    
    logger.info('Dashboard de instalaciones generado', {
      ruta: 'kpisInstalaciones',
      endpoint: '/dashboard',
      usuarioId: req.usuario?._id?.toString(),
      fechaInicio: fecha_inicio,
      fechaFin: fecha_fin
    });
    res.json(dashboard);
    
  } catch (error) {
    logger.error('Error obteniendo dashboard de instalaciones', {
      ruta: 'kpisInstalaciones',
      endpoint: '/dashboard',
      usuarioId: req.usuario?._id?.toString(),
      fechaInicio: fecha_inicio,
      fechaFin: fecha_fin,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// Obtener métricas específicas de tiempo
router.get('/metricas-tiempo', async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    
    let fechaInicio = null;
    let fechaFin = null;
    
    if (fecha_inicio) fechaInicio = new Date(fecha_inicio);
    if (fecha_fin) fechaFin = new Date(fecha_fin);

    const metricas = await KPIsInstalacionesService.calcularMetricasTiempo(
      fechaInicio || new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      fechaFin || new Date()
    );
    
    res.json(metricas);
    
  } catch (error) {
    logger.error('Error obteniendo métricas de tiempo de instalaciones', {
      ruta: 'kpisInstalaciones',
      endpoint: '/metricas-tiempo',
      usuarioId: req.usuario?._id?.toString(),
      fechaInicio: fecha_inicio,
      fechaFin: fecha_fin,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// Obtener métricas de calidad
router.get('/metricas-calidad', async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    
    let fechaInicio = null;
    let fechaFin = null;
    
    if (fecha_inicio) fechaInicio = new Date(fecha_inicio);
    if (fecha_fin) fechaFin = new Date(fecha_fin);

    const metricas = await KPIsInstalacionesService.calcularMetricasCalidad(
      fechaInicio || new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      fechaFin || new Date()
    );
    
    res.json(metricas);
    
  } catch (error) {
    logger.error('Error obteniendo métricas de calidad de instalaciones', {
      ruta: 'kpisInstalaciones',
      endpoint: '/metricas-calidad',
      usuarioId: req.usuario?._id?.toString(),
      fechaInicio: fecha_inicio,
      fechaFin: fecha_fin,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// Obtener métricas de productividad
router.get('/metricas-productividad', async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    
    let fechaInicio = null;
    let fechaFin = null;
    
    if (fecha_inicio) fechaInicio = new Date(fecha_inicio);
    if (fecha_fin) fechaFin = new Date(fecha_fin);

    const metricas = await KPIsInstalacionesService.calcularMetricasProductividad(
      fechaInicio || new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      fechaFin || new Date()
    );
    
    res.json(metricas);
    
  } catch (error) {
    logger.error('Error obteniendo métricas de productividad de instalaciones', {
      ruta: 'kpisInstalaciones',
      endpoint: '/metricas-productividad',
      usuarioId: req.usuario?._id?.toString(),
      fechaInicio: fecha_inicio,
      fechaFin: fecha_fin,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// Obtener métricas por cuadrilla
router.get('/metricas-cuadrillas', async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    
    let fechaInicio = null;
    let fechaFin = null;
    
    if (fecha_inicio) fechaInicio = new Date(fecha_inicio);
    if (fecha_fin) fechaFin = new Date(fecha_fin);

    const metricas = await KPIsInstalacionesService.calcularMetricasCuadrillas(
      fechaInicio || new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      fechaFin || new Date()
    );
    
    res.json(metricas);
    
  } catch (error) {
    logger.error('Error obteniendo métricas por cuadrilla', {
      ruta: 'kpisInstalaciones',
      endpoint: '/metricas-cuadrillas',
      usuarioId: req.usuario?._id?.toString(),
      fechaInicio: fecha_inicio,
      fechaFin: fecha_fin,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// Obtener alertas operativas
router.get('/alertas', async (req, res) => {
  try {
    const alertas = await KPIsInstalacionesService.generarAlertasOperativas();
    res.json(alertas);
    
  } catch (error) {
    logger.error('Error obteniendo alertas operativas de instalaciones', {
      ruta: 'kpisInstalaciones',
      endpoint: '/alertas',
      usuarioId: req.usuario?._id?.toString(),
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

module.exports = router;

const express = require('express');
const KPIsInstalacionesService = require('../services/kpisInstalacionesService');
const { auth, verificarPermiso } = require('../middleware/auth');

const router = express.Router();

// Obtener dashboard completo de KPIs de instalaciones
router.get('/dashboard', async (req, res) => {
  try {
    console.log('📊 Solicitando dashboard de KPIs de instalaciones...');
    
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
    
    console.log('✅ Dashboard de instalaciones generado exitosamente');
    res.json(dashboard);
    
  } catch (error) {
    console.error('❌ Error obteniendo dashboard de instalaciones:', error);
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
    console.error('❌ Error obteniendo métricas de tiempo:', error);
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
    console.error('❌ Error obteniendo métricas de calidad:', error);
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
    console.error('❌ Error obteniendo métricas de productividad:', error);
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
    console.error('❌ Error obteniendo métricas de cuadrillas:', error);
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
    console.error('❌ Error obteniendo alertas:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

module.exports = router;

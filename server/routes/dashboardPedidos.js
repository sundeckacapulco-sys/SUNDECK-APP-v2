const express = require('express');
const { auth, verificarPermiso } = require('../middleware/auth');
const MetricasComercialesService = require('../services/metricasComerciales');
const NotificacionesComercialesService = require('../services/notificacionesComerciales');

const router = express.Router();

// Obtener métricas del dashboard principal
router.get('/metricas', auth, verificarPermiso('pedidos', 'leer'), async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    
    console.log('📊 [DASHBOARD] Solicitando métricas comerciales', {
      usuario: req.usuario.nombre,
      periodo: fechaInicio && fechaFin ? `${fechaInicio} - ${fechaFin}` : 'mes actual'
    });

    const fechaInicioDate = fechaInicio ? new Date(fechaInicio) : null;
    const fechaFinDate = fechaFin ? new Date(fechaFin) : null;

    const metricas = await MetricasComercialesService.obtenerMetricasDashboard(
      fechaInicioDate, 
      fechaFinDate
    );

    res.json({
      success: true,
      data: metricas
    });

  } catch (error) {
    console.error('❌ [DASHBOARD] Error obteniendo métricas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener métricas del dashboard',
      error: error.message
    });
  }
});

// Obtener métricas por vendedor
router.get('/metricas/vendedores', auth, verificarPermiso('pedidos', 'leer'), async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    
    const fechaInicioDate = fechaInicio ? new Date(fechaInicio) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const fechaFinDate = fechaFin ? new Date(fechaFin) : new Date();

    const metricasVendedores = await MetricasComercialesService.obtenerMetricasPorVendedor(
      fechaInicioDate, 
      fechaFinDate
    );

    res.json({
      success: true,
      data: metricasVendedores
    });

  } catch (error) {
    console.error('❌ [DASHBOARD] Error obteniendo métricas por vendedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener métricas por vendedor',
      error: error.message
    });
  }
});

// Obtener datos para gráfico de ventas
router.get('/grafico-ventas', auth, verificarPermiso('pedidos', 'leer'), async (req, res) => {
  try {
    const { meses = 6 } = req.query;
    
    const datosGrafico = await MetricasComercialesService.obtenerDatosGraficoVentas(
      parseInt(meses)
    );

    res.json({
      success: true,
      data: datosGrafico
    });

  } catch (error) {
    console.error('❌ [DASHBOARD] Error obteniendo datos del gráfico:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener datos del gráfico de ventas',
      error: error.message
    });
  }
});

// Obtener notificaciones activas
router.get('/notificaciones', auth, verificarPermiso('pedidos', 'leer'), async (req, res) => {
  try {
    const { limite = 20 } = req.query;
    
    console.log('🔔 [DASHBOARD] Solicitando notificaciones comerciales', {
      usuario: req.usuario.nombre,
      limite
    });

    const notificaciones = await NotificacionesComercialesService.obtenerNotificacionesActivas(
      req.usuario._id,
      parseInt(limite)
    );

    res.json({
      success: true,
      data: notificaciones
    });

  } catch (error) {
    console.error('❌ [DASHBOARD] Error obteniendo notificaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener notificaciones',
      error: error.message
    });
  }
});

// Marcar notificación como leída
router.patch('/notificaciones/:id/leida', auth, verificarPermiso('pedidos', 'actualizar'), async (req, res) => {
  try {
    const { id } = req.params;
    
    await NotificacionesComercialesService.marcarComoLeida(id, req.usuario._id);

    res.json({
      success: true,
      message: 'Notificación marcada como leída'
    });

  } catch (error) {
    console.error('❌ [DASHBOARD] Error marcando notificación como leída:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar notificación como leída',
      error: error.message
    });
  }
});

// Obtener resumen rápido para header/sidebar
router.get('/resumen', auth, verificarPermiso('pedidos', 'leer'), async (req, res) => {
  try {
    const [metricas, notificaciones] = await Promise.all([
      MetricasComercialesService.obtenerMetricasDashboard(),
      NotificacionesComercialesService.obtenerNotificacionesActivas(req.usuario._id, 5)
    ]);

    const resumen = {
      ventasDelMes: metricas.ventas.actual,
      pedidosActivos: metricas.pedidos.enProceso,
      notificacionesCriticas: notificaciones.resumen.criticas,
      notificacionesTotal: notificaciones.resumen.total,
      crecimientoVentas: metricas.ventas.crecimiento,
      metaProgreso: metricas.ventas.progreso
    };

    res.json({
      success: true,
      data: resumen
    });

  } catch (error) {
    console.error('❌ [DASHBOARD] Error obteniendo resumen:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener resumen',
      error: error.message
    });
  }
});

// Obtener alertas críticas para mostrar en tiempo real
router.get('/alertas-criticas', auth, verificarPermiso('pedidos', 'leer'), async (req, res) => {
  try {
    const notificaciones = await NotificacionesComercialesService.obtenerNotificacionesActivas(
      req.usuario._id,
      50
    );

    // Filtrar solo las críticas
    const alertasCriticas = notificaciones.notificaciones.filter(
      notif => notif.prioridad === 'critica'
    );

    res.json({
      success: true,
      data: {
        alertas: alertasCriticas,
        total: alertasCriticas.length,
        fechaActualizacion: new Date()
      }
    });

  } catch (error) {
    console.error('❌ [DASHBOARD] Error obteniendo alertas críticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener alertas críticas',
      error: error.message
    });
  }
});

// Endpoint para refrescar todas las métricas del dashboard
router.post('/refrescar', auth, verificarPermiso('pedidos', 'leer'), async (req, res) => {
  try {
    console.log('🔄 [DASHBOARD] Refrescando métricas completas', {
      usuario: req.usuario.nombre
    });

    const [metricas, notificaciones, datosGrafico] = await Promise.all([
      MetricasComercialesService.obtenerMetricasDashboard(),
      NotificacionesComercialesService.obtenerNotificacionesActivas(req.usuario._id),
      MetricasComercialesService.obtenerDatosGraficoVentas(6)
    ]);

    res.json({
      success: true,
      data: {
        metricas,
        notificaciones,
        graficoVentas: datosGrafico,
        fechaActualizacion: new Date()
      }
    });

  } catch (error) {
    console.error('❌ [DASHBOARD] Error refrescando dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error al refrescar dashboard',
      error: error.message
    });
  }
});

module.exports = router;

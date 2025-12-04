/**
 * Rutas de Caja
 * Endpoints para gestión de caja, movimientos y cortes
 */

const express = require('express');
const router = express.Router();
const cajaController = require('../controllers/cajaController');
const { auth, verificarPermiso } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(auth);

// ===== APERTURA Y CIERRE =====

// Abrir caja del día
// Nota: Usamos 'proyectos' como módulo de permisos ya que 'caja' aún no está configurado
// Los admins tienen acceso completo automáticamente
router.post(
  '/abrir',
  cajaController.abrirCaja
);

// Cerrar caja del día
router.post(
  '/cerrar',
  cajaController.cerrarCaja
);

// ===== MOVIMIENTOS =====

// Registrar movimiento (ingreso o egreso)
router.post(
  '/movimiento',
  cajaController.registrarMovimiento
);

// Anular movimiento
router.put(
  '/movimiento/:movimientoId/anular',
  cajaController.anularMovimiento
);

// ===== CONSULTAS =====

// Obtener caja actual (abierta)
router.get(
  '/actual',
  cajaController.obtenerCajaActual
);

// Obtener historial de cajas
router.get(
  '/historial',
  cajaController.obtenerHistorial
);

// Obtener resumen de caja (reportes)
router.get(
  '/resumen',
  cajaController.obtenerResumen
);

// Obtener pendientes de cobro
router.get(
  '/pendientes',
  cajaController.obtenerPendientes
);

// Obtener detalle de una caja específica
router.get(
  '/:id',
  cajaController.obtenerCaja
);

module.exports = router;

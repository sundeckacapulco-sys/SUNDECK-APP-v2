/**
 * Rutas de Pagos
 * Endpoints para gestión de anticipos, saldos y comprobantes
 */

const express = require('express');
const router = express.Router();
const pagoController = require('../controllers/pagoController');
const { auth, verificarPermiso } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(auth);

// Registrar anticipo
router.post(
  '/:id/pagos/anticipo',
  verificarPermiso('proyectos', 'actualizar'),
  pagoController.registrarAnticipo
);

// Registrar saldo
router.post(
  '/:id/pagos/saldo',
  verificarPermiso('proyectos', 'actualizar'),
  pagoController.registrarSaldo
);

// Subir comprobante
router.post(
  '/:id/pagos/comprobante',
  verificarPermiso('proyectos', 'actualizar'),
  pagoController.subirComprobante
);

// Obtener historial de pagos
router.get(
  '/:id/pagos',
  verificarPermiso('proyectos', 'leer'),
  pagoController.obtenerPagos
);

module.exports = router;

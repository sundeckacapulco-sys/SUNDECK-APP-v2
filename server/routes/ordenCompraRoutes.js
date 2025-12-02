const express = require('express');
const router = express.Router();
const { auth, verificarPermiso } = require('../middleware/auth');
const {
  crearOrdenCompra,
  obtenerOrdenesCompra,
  obtenerOrdenCompraPorId,
  registrarPago,
  actualizarEstado
} = require('../controllers/ordenCompraController');

// Proteger todas las rutas de este módulo
router.use(auth);

// POST /api/ordenes-compra -> Crear una nueva orden de compra
router.post('/', verificarPermiso('compras', 'crear'), crearOrdenCompra);

// GET /api/ordenes-compra -> Obtener todas las órdenes de compra con paginación y filtros
router.get('/', verificarPermiso('compras', 'leer'), obtenerOrdenesCompra);

// GET /api/ordenes-compra/:id -> Obtener una orden de compra específica por su ID
router.get('/:id', verificarPermiso('compras', 'leer'), obtenerOrdenCompraPorId);

// POST /api/ordenes-compra/:id/pagos -> Registrar un pago para una orden de compra
router.post('/:id/pagos', verificarPermiso('compras', 'actualizar'), registrarPago);

// PUT /api/ordenes-compra/:id/estado -> Actualizar el estado de una orden de compra
router.put('/:id/estado', verificarPermiso('compras', 'actualizar'), actualizarEstado);

module.exports = router;
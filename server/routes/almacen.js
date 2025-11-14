const express = require('express');
const router = express.Router();
const almacenController = require('../controllers/almacenController');
const { auth } = require('../middleware/auth');

/**
 * Rutas para gestión de almacén
 * Base: /api/almacen
 */

// Aplicar autenticación a todas las rutas
router.use(auth);

// ============================================
// INVENTARIO
// ============================================

// GET /api/almacen/inventario - Obtener inventario completo
router.get('/inventario', almacenController.obtenerInventario);

// GET /api/almacen/material/:id - Obtener material por ID
router.get('/material/:id', almacenController.obtenerMaterialPorId);

// GET /api/almacen/material/codigo/:codigo - Obtener material por código
router.get('/material/codigo/:codigo', almacenController.obtenerMaterialPorCodigo);

// POST /api/almacen/material - Crear nuevo material
router.post('/material', almacenController.crearMaterial);

// PUT /api/almacen/material/:id - Actualizar material
router.put('/material/:id', almacenController.actualizarMaterial);

// DELETE /api/almacen/material/:id - Eliminar material (soft delete)
router.delete('/material/:id', almacenController.eliminarMaterial);

// ============================================
// MOVIMIENTOS
// ============================================

// POST /api/almacen/entrada - Registrar entrada de material
router.post('/entrada', almacenController.registrarEntrada);

// POST /api/almacen/salida - Registrar salida de material
router.post('/salida', almacenController.registrarSalida);

// POST /api/almacen/ajuste - Ajustar inventario
router.post('/ajuste', almacenController.ajustarInventario);

// POST /api/almacen/reservar - Reservar stock
router.post('/reservar', almacenController.reservarStock);

// POST /api/almacen/liberar - Liberar reserva
router.post('/liberar', almacenController.liberarReserva);

// GET /api/almacen/historial/:materialId - Obtener historial de movimientos
router.get('/historial/:materialId', almacenController.obtenerHistorial);

// GET /api/almacen/movimientos - Reporte de movimientos
router.get('/movimientos', almacenController.reporteMovimientos);

// ============================================
// REPORTES Y ALERTAS
// ============================================

// GET /api/almacen/bajo-stock - Materiales bajo punto de reorden
router.get('/bajo-stock', almacenController.materialesBajoStock);

// GET /api/almacen/valor - Valor total del inventario
router.get('/valor', almacenController.valorInventario);

module.exports = router;

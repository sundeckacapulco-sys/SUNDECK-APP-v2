const express = require('express');
const router = express.Router();
const almacenController = require('../controllers/almacenController');
const { auth, verificarRol } = require('../middleware/auth');

/**
 * Rutas para gestión de almacén
 * Base: /api/almacen
 */

// Aplicar autenticación a todas las rutas
router.use(auth);

// ============================================
// SIMULACIÓN (PRUEBA RÁPIDA)
// ============================================

// POST /api/almacen/simular-consumo - Simular consumo de materiales
router.post('/simular-consumo', almacenController.simularConsumo);

// ============================================
// INVENTARIO
// ============================================

// GET /api/almacen/inventario - Obtener inventario completo
router.get('/inventario', almacenController.obtenerInventario);

// GET /api/almacen/sobrantes - Obtener sobrantes
router.get('/sobrantes', almacenController.obtenerSobrantes);

// GET /api/almacen/material/:id - Obtener material por ID
router.get('/material/:id', almacenController.obtenerMaterialPorId);

// GET /api/almacen/material/codigo/:codigo - Obtener material por código
router.get('/material/codigo/:codigo', almacenController.obtenerMaterialPorCodigo);

// POST /api/almacen/material - Crear nuevo material (Solo Admin/Gerente)
router.post('/material', verificarRol('admin', 'gerente'), almacenController.crearMaterial);

// PUT /api/almacen/material/:id - Actualizar material (Solo Admin/Gerente)
router.put('/material/:id', verificarRol('admin', 'gerente'), almacenController.actualizarMaterial);

// DELETE /api/almacen/material/:id - Eliminar material (Solo Admin/Gerente)
router.delete('/material/:id', verificarRol('admin', 'gerente'), almacenController.eliminarMaterial);

// ============================================
// MOVIMIENTOS
// ============================================

// POST /api/almacen/entrada - Registrar entrada de material (Solo Admin/Gerente)
router.post('/entrada', verificarRol('admin', 'gerente'), almacenController.registrarEntrada);

// POST /api/almacen/salida - Registrar salida de material (Admin, Gerente, Fabricante)
router.post('/salida', verificarRol('admin', 'gerente', 'fabricante'), almacenController.registrarSalida);

// POST /api/almacen/ajuste - Ajustar inventario (Solo Admin/Gerente)
router.post('/ajuste', verificarRol('admin', 'gerente'), almacenController.ajustarInventario);

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

const express = require('express');
// const Fabricacion = require('../models/Fabricacion.legacy'); // Modelo no disponible, rutas desactivadas
const { auth, verificarPermiso } = require('../middleware/auth');
const logger = require('../config/logger');

const router = express.Router();

const disabledMessage = { message: 'Esta funcionalidad (Producción Legacy) ha sido desactivada y está pendiente de migración.' };
const notImplementedStatus = 501; // 501 Not Implemented es el código HTTP correcto para esto

// Obtener órdenes de producción - Devuelve un array vacío para no romper las UIs
router.get('/', auth, verificarPermiso('fabricacion', 'leer'), async (req, res) => {
  logger.warn('Acceso a ruta de producción legacy desactivada (GET /)', { ruta: 'routes/produccion' });
  res.json([]);
});

// Crear orden de producción desde pedido - Ruta desactivada
router.post('/desde-pedido/:pedidoId', auth, verificarPermiso('fabricacion', 'crear'), async (req, res) => {
  logger.warn('Acceso a ruta de producción legacy desactivada (POST /desde-pedido)', { ruta: 'routes/produccion', pedidoId: req.params.pedidoId });
  res.status(notImplementedStatus).json(disabledMessage);
});

// Actualizar estado de orden de producción - Ruta desactivada
router.patch('/:id/estado', auth, verificarPermiso('fabricacion', 'actualizar'), async (req, res) => {
  logger.warn('Acceso a ruta de producción legacy desactivada (PATCH /:id/estado)', { ruta: 'routes/produccion', ordenId: req.params.id });
  res.status(notImplementedStatus).json(disabledMessage);
});

module.exports = router;

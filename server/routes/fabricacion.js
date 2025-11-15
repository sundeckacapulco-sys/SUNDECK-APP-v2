const express = require('express');
const { auth, verificarPermiso } = require('../middleware/auth');
const {
  obtenerColaFabricacion,
  obtenerMetricasFabricacion,
  crearOrdenDesdePedido,
  actualizarEstadoOrden,
  generarOrdenProduccionConAlmacen,
  descargarPDFListaPedido,
  descargarPDFOrdenTaller
} = require('../controllers/fabricacionController');

const router = express.Router();

router.get('/cola',
  auth,
  verificarPermiso('fabricacion', 'leer'),
  obtenerColaFabricacion
);

router.get('/metricas',
  auth,
  verificarPermiso('fabricacion', 'leer'),
  obtenerMetricasFabricacion
);

router.post('/desde-pedido/:pedidoId',
  auth,
  verificarPermiso('fabricacion', 'crear'),
  crearOrdenDesdePedido
);

router.patch('/:id/estado',
  auth,
  verificarPermiso('fabricacion', 'actualizar'),
  actualizarEstadoOrden
);

// Nueva ruta: Generar orden de producción con integración de almacén
router.post('/orden-produccion/:proyectoId',
  auth,
  verificarPermiso('fabricacion', 'crear'),
  generarOrdenProduccionConAlmacen
);

// Descargar PDF de LISTA DE PEDIDO (para proveedores)
router.get('/lista-pedido/:proyectoId/pdf',
  auth,
  descargarPDFListaPedido
);

// Descargar PDF de ORDEN DE TALLER (con especificaciones técnicas)
router.get('/orden-taller/:proyectoId/pdf',
  auth,
  descargarPDFOrdenTaller
);

module.exports = router;

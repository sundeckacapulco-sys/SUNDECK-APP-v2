const express = require('express');
const { auth, verificarPermiso } = require('../middleware/auth');
const {
  obtenerColaFabricacion,
  obtenerMetricasFabricacion,
  crearOrdenDesdePedido,
  actualizarEstadoOrden,
  generarOrdenProduccionConAlmacen,
  descargarPDFListaPedido,
  descargarPDFOrdenTaller,
  obtenerPDFOrdenTallerBase64,
  // Nuevos endpoints de etapas
  obtenerEtapasFabricacion,
  actualizarEtapaFabricacion,
  subirFotoEtapa,
  obtenerFotosEtapa
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

// VER PDF de ORDEN DE TALLER como base64 (POST para evitar que IDM intercepte)
router.post('/orden-taller/:proyectoId/base64',
  auth,
  obtenerPDFOrdenTallerBase64
);

// ===== RUTAS DE 5 ETAPAS DE FABRICACIÓN =====

// Obtener estado de todas las etapas de un proyecto
router.get('/etapas/:id',
  auth,
  verificarPermiso('fabricacion', 'leer'),
  obtenerEtapasFabricacion
);

// Actualizar estado de una etapa específica
router.patch('/etapas/:id/:etapa',
  auth,
  verificarPermiso('fabricacion', 'actualizar'),
  actualizarEtapaFabricacion
);

// Subir foto a una etapa
router.post('/etapas/:id/:etapa/fotos',
  auth,
  verificarPermiso('fabricacion', 'actualizar'),
  subirFotoEtapa
);

// Obtener fotos de una etapa
router.get('/etapas/:id/:etapa/fotos',
  auth,
  verificarPermiso('fabricacion', 'leer'),
  obtenerFotosEtapa
);

module.exports = router;

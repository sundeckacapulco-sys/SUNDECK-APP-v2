const express = require('express');
const router = express.Router();
const etiquetasController = require('../controllers/etiquetasController');
const { auth } = require('../middleware/auth');

/**
 * Rutas para etiquetas de producción
 * Base: /api/etiquetas
 */

// Aplicar autenticación a todas las rutas
router.use(auth);

// GET /api/etiquetas/proyecto/:proyectoId - Generar PDF de etiquetas
// Query params: ?formato=multiple|individual
router.get('/proyecto/:proyectoId', etiquetasController.generarEtiquetasProyecto);

// GET /api/etiquetas/proyecto/:proyectoId/pieza/:numeroPieza - Obtener datos de etiqueta individual
router.get('/proyecto/:proyectoId/pieza/:numeroPieza', etiquetasController.obtenerDatosEtiqueta);

module.exports = router;

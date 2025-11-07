const express = require('express');
const router = express.Router();
const controller = require('../controllers/prospectosController');
const { auth } = require('../middleware/auth');

/**
 * RUTAS DEL MÓDULO DE PROSPECTOS UNIFICADOS
 * Gestiona la etapa comercial antes de convertir a proyecto
 */

// Obtener todos los prospectos (con filtros opcionales)
// Query params: ?asesor=id&estadoComercial=en seguimiento&fuente=web
router.get('/', auth, controller.getProspectos);

// Obtener estadísticas de prospectos
router.get('/estadisticas', auth, controller.getEstadisticas);

// Obtener un prospecto por ID
router.get('/:id', auth, controller.getProspectoById);

// Agregar nota de seguimiento
router.post('/:id/agregar-nota', auth, controller.agregarNota);

// Actualizar estado comercial y probabilidad de cierre
router.patch('/:id/estado', auth, controller.actualizarEstadoComercial);

// Convertir prospecto a proyecto formal
router.post('/:id/convertir', auth, controller.convertirAProyecto);

module.exports = router;

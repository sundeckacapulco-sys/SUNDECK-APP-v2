/**
 * Rutas del Agente IA Sundeck
 */

const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const asistenteController = require('../controllers/asistenteController');

// Todas las rutas requieren autenticación
router.use(auth);

// POST /api/asistente/chat - Chat principal
router.post('/chat', asistenteController.chat);

// POST /api/asistente/sugerencia - Generar sugerencia de mensaje
router.post('/sugerencia', asistenteController.sugerencia);

// GET /api/asistente/status - Estado del servicio
router.get('/status', asistenteController.status);

// GET /api/asistente/pendientes - Pendientes del día
router.get('/pendientes', asistenteController.pendientes);

// GET /api/asistente/kpis - KPIs rápidos
router.get('/kpis', asistenteController.kpis);

// POST /api/asistente/analizar-levantamiento - Análisis inteligente de levantamiento
router.post('/analizar-levantamiento', asistenteController.analizarLevantamiento);

// POST /api/asistente/validar-cotizacion - Validación de cotización
router.post('/validar-cotizacion', asistenteController.validarCotizacion);

module.exports = router;

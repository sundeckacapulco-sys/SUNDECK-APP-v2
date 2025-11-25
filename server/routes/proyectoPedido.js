const express = require('express');
const logger = require('../config/logger');
const router = express.Router();

/**
 * 🚫 RUTA OBSOLETA (LEGACY)
 * Bloqueada permanentemente el 25 Nov 2025 como parte de la Fase 4.
 * Esta ruta causaba divergencia de datos al mantener un flujo paralelo de proyectos.
 * 
 * Nueva implementación:
 * - Usar endpoints de /api/proyectos para toda la gestión de proyectos.
 * - Usar modelo unificado server/models/Proyecto.js
 */

router.use((req, res) => {
  logger.warn('Intento de acceso a ruta obsoleta: proyectoPedido', {
    method: req.method,
    url: req.originalUrl,
    usuario: req.user?.id || 'anonimo',
    ip: req.ip
  });

  return res.status(410).json({
    error: 'Ruta obsoleta (410 Gone)',
    mensaje: 'El endpoint /api/proyecto-pedido ha sido desactivado permanentemente.',
    recomendacion: 'Utilice los endpoints de /api/proyectos para gestionar proyectos unificados.',
    fecha_bloqueo: '2025-11-25'
  });
});

module.exports = router;

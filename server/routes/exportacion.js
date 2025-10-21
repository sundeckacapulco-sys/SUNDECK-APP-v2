const express = require('express');
const { auth, verificarPermiso } = require('../middleware/auth');
const {
  generarPDFUnificado,
  generarExcelUnificado,
  generarPaqueteCompleto,
  vistaPrevia,
  validarExportacion,
  formatosDisponibles
} = require('../controllers/exportacionController');

const router = express.Router();

// Rutas de exportación unificada

// GET /api/exportacion/formatos - Obtener formatos disponibles
router.get('/formatos', 
  auth, 
  verificarPermiso('proyectos', 'leer'), 
  formatosDisponibles
);

// GET /api/exportacion/:id/vista-previa - Vista previa de datos
router.get('/:id/vista-previa', 
  auth, 
  verificarPermiso('proyectos', 'leer'), 
  vistaPrevia
);

// GET /api/exportacion/:id/validar - Validar datos para exportación
router.get('/:id/validar', 
  auth, 
  verificarPermiso('proyectos', 'leer'), 
  validarExportacion
);

// POST /api/exportacion/:id/pdf - Generar PDF unificado
router.post('/:id/pdf', 
  auth, 
  verificarPermiso('proyectos', 'leer'), 
  generarPDFUnificado
);

// POST /api/exportacion/:id/excel - Generar Excel unificado
router.post('/:id/excel', 
  auth, 
  verificarPermiso('proyectos', 'leer'), 
  generarExcelUnificado
);

// POST /api/exportacion/:id/completo - Generar paquete completo (ZIP)
router.post('/:id/completo', 
  auth, 
  verificarPermiso('proyectos', 'leer'), 
  generarPaqueteCompleto
);

module.exports = router;

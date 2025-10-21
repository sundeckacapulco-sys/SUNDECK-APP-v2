const express = require('express');
const { auth, verificarPermiso } = require('../middleware/auth');
const { 
  validarTransicionEstado, 
  registrarCambioEstado,
  obtenerTransicionesValidas 
} = require('../middleware/transicionesEstado');
const {
  crearProyecto,
  obtenerProyectos,
  obtenerProyectoPorId,
  actualizarProyecto,
  cambiarEstado,
  eliminarProyecto,
  crearDesdeProspecto,
  obtenerDatosExportacion,
  sincronizarProyecto,
  obtenerEstadisticasProyecto
} = require('../controllers/proyectoController');

const router = express.Router();

// Rutas públicas (requieren autenticación básica)

// GET /api/proyectos - Obtener todos los proyectos con filtros y paginación
router.get('/', 
  auth, 
  verificarPermiso('proyectos', 'leer'), 
  obtenerProyectos
);

// GET /api/proyectos/:id - Obtener proyecto específico por ID
router.get('/:id', 
  auth, 
  verificarPermiso('proyectos', 'leer'), 
  obtenerProyectoPorId
);

// POST /api/proyectos - Crear nuevo proyecto
router.post('/', 
  auth, 
  verificarPermiso('proyectos', 'crear'), 
  crearProyecto
);

// PUT /api/proyectos/:id - Actualizar proyecto existente
router.put('/:id', 
  auth, 
  verificarPermiso('proyectos', 'editar'), 
  actualizarProyecto
);

// PATCH /api/proyectos/:id/estado - Cambiar estado del proyecto
router.patch('/:id/estado', 
  auth, 
  verificarPermiso('proyectos', 'editar'),
  validarTransicionEstado,
  registrarCambioEstado,
  cambiarEstado
);

// DELETE /api/proyectos/:id - Eliminar proyecto (soft delete)
router.delete('/:id', 
  auth, 
  verificarPermiso('proyectos', 'eliminar'), 
  eliminarProyecto
);

// Rutas especiales

// POST /api/proyectos/desde-prospecto/:prospectoId - Crear proyecto desde prospecto
router.post('/desde-prospecto/:prospectoId', 
  auth, 
  verificarPermiso('proyectos', 'crear'), 
  crearDesdeProspecto
);

// GET /api/proyectos/:id/exportacion - Obtener datos formateados para exportación
router.get('/:id/exportacion', 
  auth, 
  verificarPermiso('proyectos', 'leer'), 
  obtenerDatosExportacion
);

// POST /api/proyectos/:id/sincronizar - Sincronizar proyecto manualmente
router.post('/:id/sincronizar', 
  auth, 
  verificarPermiso('proyectos', 'editar'), 
  sincronizarProyecto
);

// GET /api/proyectos/:id/estadisticas - Obtener estadísticas del proyecto
router.get('/:id/estadisticas', 
  auth, 
  verificarPermiso('proyectos', 'leer'), 
  obtenerEstadisticasProyecto
);

// GET /api/proyectos/transiciones/:estado - Obtener transiciones válidas para un estado
router.get('/transiciones/:estado', 
  auth, 
  verificarPermiso('proyectos', 'leer'), 
  obtenerTransicionesValidas
);

// POST /api/proyectos/:id/pdf - Generar PDF del proyecto
router.post('/:id/pdf', 
  auth, 
  verificarPermiso('proyectos', 'leer'), 
  async (req, res) => {
    try {
      const { id } = req.params;
      const pdfService = require('../services/pdfService');
      
      const pdf = await pdfService.generarPDFProyecto(id);
      
      res.contentType('application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Proyecto-${id}-${Date.now()}.pdf"`);
      res.send(pdf);
      
    } catch (error) {
      console.error('Error generando PDF de proyecto:', error);
      res.status(500).json({
        success: false,
        message: 'Error al generar PDF del proyecto',
        error: error.message
      });
    }
  }
);

// POST /api/proyectos/:id/excel - Generar Excel del proyecto
router.post('/:id/excel', 
  auth, 
  verificarPermiso('proyectos', 'leer'), 
  async (req, res) => {
    try {
      const { id } = req.params;
      const { getProyectoDataForExcel } = require('../utils/exportNormalizer');
      const ExcelJS = require('exceljs');
      
      const datos = await getProyectoDataForExcel(id);
      
      // Crear workbook
      const workbook = new ExcelJS.Workbook();
      
      // Hoja de información general
      const hojaGeneral = workbook.addWorksheet('Información General');
      hojaGeneral.addRow(['PROYECTO SUNDECK']);
      hojaGeneral.addRow(['Cliente', datos.cliente.nombre]);
      hojaGeneral.addRow(['Teléfono', datos.cliente.telefono]);
      hojaGeneral.addRow(['Email', datos.cliente.correo]);
      hojaGeneral.addRow(['Dirección', datos.cliente.direccion]);
      hojaGeneral.addRow(['Zona', datos.cliente.zona]);
      hojaGeneral.addRow(['Estado', datos.estado]);
      hojaGeneral.addRow(['Tipo Fuente', datos.tipo_fuente]);
      hojaGeneral.addRow(['Fecha Creación', datos.fechas.creacion_formateada]);
      
      // Hoja de medidas
      const hojaMedidas = workbook.addWorksheet('Medidas');
      if (datos.hoja_medidas.length > 0) {
        const headers = Object.keys(datos.hoja_medidas[0]);
        hojaMedidas.addRow(headers);
        datos.hoja_medidas.forEach(medida => {
          hojaMedidas.addRow(Object.values(medida));
        });
      }
      
      // Hoja de resumen
      const hojaResumen = workbook.addWorksheet('Resumen Financiero');
      datos.hoja_resumen.forEach(item => {
        hojaResumen.addRow([item.Concepto, item.Importe]);
      });
      
      // Generar buffer
      const buffer = await workbook.xlsx.writeBuffer();
      
      res.contentType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="Proyecto-${id}-${Date.now()}.xlsx"`);
      res.send(buffer);
      
    } catch (error) {
      console.error('Error generando Excel de proyecto:', error);
      res.status(500).json({
        success: false,
        message: 'Error al generar Excel del proyecto',
        error: error.message
      });
    }
  }
);

module.exports = router;

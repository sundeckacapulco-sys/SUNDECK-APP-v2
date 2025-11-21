const express = require('express');
const { auth, verificarPermiso } = require('../middleware/auth');
const { 
  validarTransicionEstado, 
  registrarCambioEstado,
  obtenerTransicionesValidas
} = require('../middleware/transicionesEstado');
const upload = require('../middleware/uploadFotos');
const {
  crearProyecto,
  obtenerProyectos,
  obtenerProyectoPorId,
  actualizarProyecto,
  cambiarEstado,
  eliminarProyecto,
  crearDesdeProspecto,
  obtenerDatosExportacion,
  generarEtiquetasProduccion,
  calcularTiempoInstalacion,
  optimizarRutaDiaria,
  sincronizarProyecto,
  obtenerEstadisticasProyecto,
  guardarLevantamiento,
  crearCotizacionDesdeProyecto,
  generarPDFProyecto,
  generarExcelLevantamiento,
  subirFotosLevantamiento,
  convertirProspectoAProyecto,
  obtenerKPIsComerciales,
  generarListaPedidoV2
} = require('../controllers/proyectoController');

const router = express.Router();

// Rutas públicas (requieren autenticación básica)

// GET /api/proyectos - Obtener todos los proyectos con filtros y paginación
router.get('/',
  auth,
  verificarPermiso('proyectos', 'leer'),
  obtenerProyectos
);

// GET /api/proyectos/kpis/comerciales - Obtener KPIs comerciales
router.get('/kpis/comerciales',
  auth,
  verificarPermiso('proyectos', 'leer'),
  obtenerKPIsComerciales
);

router.get('/ruta-diaria/:fecha',
  auth,
  verificarPermiso('proyectos', 'leer'),
  optimizarRutaDiaria
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

router.post('/:id/etiquetas-produccion',
  auth,
  verificarPermiso('proyectos', 'leer'),
  generarEtiquetasProduccion
);

router.post('/:id/calcular-tiempo-instalacion',
  auth,
  verificarPermiso('proyectos', 'leer'),
  calcularTiempoInstalacion
);

// POST /api/proyectos/:id/convertir - Convertir prospecto a proyecto
router.post('/:id/convertir',
  auth,
  verificarPermiso('proyectos', 'editar'),
  convertirProspectoAProyecto
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

// POST /api/proyectos/:id/sincronizar-estado - Sincronizar estado basado en el progreso real
router.post('/:id/sincronizar-estado',
  auth,
  verificarPermiso('proyectos', 'editar'),
  async (req, res) => {
    try {
      const Proyecto = require('../models/Proyecto');
      const proyecto = await Proyecto.findById(req.params.id)
        .populate('cotizaciones')
        .populate('pagos');
      
      if (!proyecto) {
        return res.status(404).json({ message: 'Proyecto no encontrado' });
      }

      const estadoAnterior = proyecto.estadoComercial;
      let estadoNuevo = estadoAnterior;
      let cambios = [];

      // Flujo: Levantamiento → Cotización → Activo → Fabricación → Instalación → Completado
      
      // 1. Si tiene cotizaciones → mínimo 'cotizado'
      if (proyecto.cotizaciones && proyecto.cotizaciones.length > 0) {
        const estadosProspecto = ['nuevo', 'contactado', 'en_seguimiento', 'en seguimiento', 'cita_agendada', 'cita agendada', 'sin_respuesta', 'sin respuesta', 'en_pausa', 'en pausa'];
        if (estadosProspecto.includes(proyecto.estadoComercial)) {
          estadoNuevo = 'cotizado';
          cambios.push('Tiene cotizaciones → cotizado');
        }
      }

      // 2. Si tiene anticipo pagado → 'activo'
      if (proyecto.pagos?.anticipo?.pagado) {
        if (['cotizado', ...['nuevo', 'contactado', 'en_seguimiento', 'en seguimiento', 'cita_agendada', 'cita agendada', 'sin_respuesta', 'sin respuesta', 'en_pausa', 'en pausa']].includes(proyecto.estadoComercial)) {
          estadoNuevo = 'activo';
          cambios.push('Anticipo pagado → activo');
        }
      }

      // Aplicar cambio si es necesario
      if (estadoNuevo !== estadoAnterior) {
        proyecto.estadoComercial = estadoNuevo;
        await proyecto.save();
        
        return res.json({
          success: true,
          message: `Estado sincronizado: ${estadoAnterior} → ${estadoNuevo}`,
          estadoAnterior,
          estadoNuevo,
          cambios
        });
      }

      res.json({
        success: true,
        message: 'Estado ya está sincronizado correctamente',
        estadoActual: proyecto.estadoComercial
      });

    } catch (error) {
      console.error('Error sincronizando estado:', error);
      res.status(500).json({ message: 'Error al sincronizar estado' });
    }
  }
);

// GET /api/proyectos/:id/estadisticas - Obtener estadísticas del proyecto
router.get('/:id/estadisticas',
  auth,
  verificarPermiso('proyectos', 'leer'),
  obtenerEstadisticasProyecto
);

// FASE 5: GET /api/proyectos/:id/generar-pdf
router.get('/:id/generar-pdf',
  auth,
  verificarPermiso('proyectos', 'leer'),
  generarPDFProyecto
);

// GET /api/proyectos/:id/generar-excel - Generar Excel de levantamiento
router.get('/:id/generar-excel',
  auth,
  verificarPermiso('proyectos', 'leer'),
  generarExcelLevantamiento
);

// FASE 4: PATCH /api/proyectos/:id/levantamiento - Guardar levantamiento técnico
router.patch('/:id/levantamiento', 
  auth, 
  verificarPermiso('proyectos', 'editar'), 
  guardarLevantamiento
);

// FASE 4: POST /api/proyectos/:id/cotizaciones - Crear cotización desde proyecto
router.post('/:id/cotizaciones', 
  auth, 
  verificarPermiso('proyectos', 'editar'), 
  crearCotizacionDesdeProyecto
);

// POST /api/proyectos/:id/fabricacion/iniciar - Iniciar fabricación
router.post('/:id/fabricacion/iniciar', 
  auth, 
  verificarPermiso('proyectos', 'editar'), 
  async (req, res) => {
    try {
      const FabricacionService = require('../services/fabricacionService');
      const resultado = await FabricacionService.iniciarFabricacion(req.params.id, req.body);
      res.json(resultado);
    } catch (error) {
      console.error('Error iniciando fabricación:', error);
      res.status(500).json({ message: 'Error iniciando fabricación', error: error.message });
    }
  }
);

// PUT /api/proyectos/:id/fabricacion/proceso/:procesoId - Actualizar proceso
router.put('/:id/fabricacion/proceso/:procesoId', 
  auth, 
  verificarPermiso('proyectos', 'editar'), 
  async (req, res) => {
    try {
      const FabricacionService = require('../services/fabricacionService');
      const resultado = await FabricacionService.actualizarProgreso(req.params.id, {
        procesoId: req.params.procesoId,
        ...req.body
      });
      res.json(resultado);
    } catch (error) {
      console.error('Error actualizando proceso:', error);
      res.status(500).json({ message: 'Error actualizando proceso', error: error.message });
    }
  }
);

// POST /api/proyectos/:id/fabricacion/control-calidad - Control de calidad
router.post('/:id/fabricacion/control-calidad', 
  auth, 
  verificarPermiso('proyectos', 'editar'), 
  async (req, res) => {
    try {
      const FabricacionService = require('../services/fabricacionService');
      const resultado = await FabricacionService.realizarControlCalidad(req.params.id, req.body);
      res.json(resultado);
    } catch (error) {
      console.error('Error en control de calidad:', error);
      res.status(500).json({ message: 'Error en control de calidad', error: error.message });
    }
  }
);

// POST /api/proyectos/:id/fabricacion/empaque - Completar empaque
router.post('/:id/fabricacion/empaque', 
  auth, 
  verificarPermiso('proyectos', 'editar'), 
  async (req, res) => {
    try {
      const FabricacionService = require('../services/fabricacionService');
      const resultado = await FabricacionService.completarEmpaque(req.params.id, req.body);
      res.json(resultado);
    } catch (error) {
      console.error('Error completando empaque:', error);
      res.status(500).json({ message: 'Error completando empaque', error: error.message });
    }
  }
);

// GET /api/proyectos/:id/pdf - Generar PDF del proyecto
router.get('/:id/pdf', 
  auth, 
  verificarPermiso('proyectos', 'leer'), 
  async (req, res) => {
    try {
      const { id } = req.params;
      const { tipo } = req.query;
      const pdfService = require('../services/pdfService');
      
      let pdfBuffer;
      
      // Si se especifica tipo, usar el método específico
      if (tipo === 'orden-produccion') {
        pdfBuffer = await pdfService.generarPDFOrdenProduccion(id);
      } else {
        // Método por defecto
        const proyecto = await require('../models/Proyecto').findById(id)
          .populate('prospecto')
          .populate('cotizacion');
        
        if (!proyecto) {
          return res.status(404).json({ message: 'Proyecto no encontrado' });
        }

        pdfBuffer = await pdfService.generarPDFProyecto(proyecto);
      }
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Proyecto-${id}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generando PDF del proyecto:', error);
      res.status(500).json({ message: 'Error generando PDF', error: error.message });
    }
  }
);

// GET /api/proyectos/:id/excel - Generar Excel del proyecto
router.get('/:id/excel', 
  auth, 
  verificarPermiso('proyectos', 'leer'), 
  async (req, res) => {
    try {
      const excelService = require('../services/excelService');
      const proyecto = await require('../models/Proyecto').findById(req.params.id)
        .populate('prospecto')
        .populate('cotizacion');
      
      if (!proyecto) {
        return res.status(404).json({ message: 'Proyecto no encontrado' });
      }

      const excelBuffer = await excelService.generarExcelProyecto(proyecto);
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="Proyecto-${proyecto.numero}.xlsx"`);
      res.send(excelBuffer);
    } catch (error) {
      console.error('Error generando Excel del proyecto:', error);
      res.status(500).json({ message: 'Error generando Excel', error: error.message });
    }
  }
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

// POST /api/proyectos/levantamiento/fotos - Subir fotos del levantamiento
router.post('/levantamiento/fotos',
  auth,
  verificarPermiso('proyectos', 'crear'),
  upload.array('fotos', 10), // Máximo 10 fotos a la vez
  subirFotosLevantamiento
);

// GET /api/proyectos/:id/lista-pedido-v2 - Generar Lista de Pedido V2.0 optimizada
router.get('/:id/lista-pedido-v2',
  auth,
  verificarPermiso('proyectos', 'leer'),
  generarListaPedidoV2
);

module.exports = router;

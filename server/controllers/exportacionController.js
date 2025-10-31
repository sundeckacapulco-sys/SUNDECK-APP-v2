const { getProyectoExportData } = require('../utils/exportNormalizer');
const pdfService = require('../services/pdfService');
const excelService = require('../services/excelService');
const mongoose = require('mongoose');
const logger = require('../config/logger');

/**
 * Controlador unificado para exportación de proyectos
 * Utiliza el exportNormalizer como fuente única de verdad
 */

// Generar PDF unificado
const generarPDFUnificado = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo = 'completo' } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de proyecto inválido'
      });
    }

    logger.info('Generando PDF unificado para proyecto', {
      controlador: 'ExportacionController',
      accion: 'generarPDFUnificado',
      metodo: req.method,
      endpoint: req.originalUrl,
      usuarioId: req.usuario?._id || null,
      proyectoId: id,
      tipo
    });

    const pdf = await pdfService.generarPDFProyecto(id);
    
    res.contentType('application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Proyecto-Sundeck-${id}-${Date.now()}.pdf"`);
    res.send(pdf);

  } catch (error) {
    logger.error('Error generando PDF unificado', {
      controlador: 'ExportacionController',
      accion: 'generarPDFUnificado',
      metodo: req.method,
      endpoint: req.originalUrl,
      usuarioId: req.usuario?._id || null,
      proyectoId: req.params?.id,
      tipo: req.query?.tipo,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Error al generar PDF del proyecto',
      error: error.message
    });
  }
};

// Generar Excel unificado
const generarExcelUnificado = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo = 'completo' } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de proyecto inválido'
      });
    }

    logger.info('Generando Excel unificado para proyecto', {
      controlador: 'ExportacionController',
      accion: 'generarExcelUnificado',
      metodo: req.method,
      endpoint: req.originalUrl,
      usuarioId: req.usuario?._id || null,
      proyectoId: id,
      tipo
    });

    const excel = await excelService.generarExcelProyecto(id);
    
    res.contentType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Proyecto-Sundeck-${id}-${Date.now()}.xlsx"`);
    res.send(excel);

  } catch (error) {
    logger.error('Error generando Excel unificado', {
      controlador: 'ExportacionController',
      accion: 'generarExcelUnificado',
      metodo: req.method,
      endpoint: req.originalUrl,
      usuarioId: req.usuario?._id || null,
      proyectoId: req.params?.id,
      tipo: req.query?.tipo,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Error al generar Excel del proyecto',
      error: error.message
    });
  }
};

// Generar ambos formatos (ZIP)
const generarPaqueteCompleto = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de proyecto inválido'
      });
    }

    logger.info('Generando paquete completo de exportación para proyecto', {
      controlador: 'ExportacionController',
      accion: 'generarPaqueteCompleto',
      metodo: req.method,
      endpoint: req.originalUrl,
      usuarioId: req.usuario?._id || null,
      proyectoId: id
    });

    // Generar ambos archivos en paralelo
    const [pdf, excel] = await Promise.all([
      pdfService.generarPDFProyecto(id),
      excelService.generarExcelProyecto(id)
    ]);

    // Crear ZIP con ambos archivos
    const JSZip = require('jszip');
    const zip = new JSZip();
    
    const timestamp = Date.now();
    zip.file(`Proyecto-Sundeck-${id}-${timestamp}.pdf`, pdf);
    zip.file(`Proyecto-Sundeck-${id}-${timestamp}.xlsx`, excel);

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    
    res.contentType('application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="Proyecto-Sundeck-${id}-Completo-${timestamp}.zip"`);
    res.send(zipBuffer);

  } catch (error) {
    logger.error('Error generando paquete completo', {
      controlador: 'ExportacionController',
      accion: 'generarPaqueteCompleto',
      metodo: req.method,
      endpoint: req.originalUrl,
      usuarioId: req.usuario?._id || null,
      proyectoId: req.params?.id,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Error al generar paquete completo del proyecto',
      error: error.message
    });
  }
};

// Obtener vista previa de datos de exportación
const vistaPrevia = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de proyecto inválido'
      });
    }

    const datos = await getProyectoExportData(id);

    // Crear resumen para vista previa
    const vistaPrevia = {
      proyecto: {
        id: datos.id,
        cliente: datos.cliente.nombre,
        estado: datos.estado,
        tipo_fuente: datos.tipo_fuente
      },
      resumen: datos.resumen,
      totales: {
        subtotal: datos.totales.subtotal,
        iva: datos.totales.iva,
        total: datos.totales.total
      },
      fechas: {
        creacion: datos.fechas.creacion_formateada,
        actualizacion: datos.fechas.actualizacion_formateada
      },
      estadisticas: {
        medidas: datos.medidas.length,
        productos: datos.productos.length,
        materiales: datos.materiales.length,
        area_total: datos.resumen.total_area,
        con_fotos: datos.fotos.length,
        motorizados: datos.medidas.filter(m => m.motorizado).length,
        toldos: datos.medidas.filter(m => m.esToldo).length
      }
    };

    res.json({
      success: true,
      data: vistaPrevia
    });

  } catch (error) {
    logger.error('Error obteniendo vista previa de exportación', {
      controlador: 'ExportacionController',
      accion: 'vistaPrevia',
      metodo: req.method,
      endpoint: req.originalUrl,
      usuarioId: req.usuario?._id || null,
      proyectoId: req.params?.id,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Error al obtener vista previa',
      error: error.message
    });
  }
};

// Validar datos antes de exportación
const validarExportacion = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de proyecto inválido'
      });
    }

    const datos = await getProyectoExportData(id);
    
    const validaciones = {
      tiene_cliente: !!datos.cliente.nombre,
      tiene_medidas: datos.medidas.length > 0,
      tiene_productos: datos.productos.length > 0,
      tiene_totales: datos.totales.total > 0,
      medidas_completas: datos.medidas.every(m => m.ancho && m.alto),
      cliente_completo: !!(datos.cliente.nombre && datos.cliente.telefono)
    };

    const errores = [];
    const advertencias = [];

    // Validaciones críticas
    if (!validaciones.tiene_cliente) {
      errores.push('El proyecto no tiene información del cliente');
    }
    if (!validaciones.tiene_medidas) {
      errores.push('El proyecto no tiene medidas registradas');
    }

    // Advertencias
    if (!validaciones.cliente_completo) {
      advertencias.push('Información del cliente incompleta (falta teléfono o email)');
    }
    if (!validaciones.medidas_completas) {
      advertencias.push('Algunas medidas tienen dimensiones incompletas');
    }
    if (!validaciones.tiene_totales) {
      advertencias.push('El proyecto no tiene información financiera');
    }

    const esValido = errores.length === 0;

    res.json({
      success: true,
      data: {
        valido: esValido,
        validaciones,
        errores,
        advertencias,
        puede_exportar: esValido,
        resumen: {
          total_errores: errores.length,
          total_advertencias: advertencias.length,
          completitud: Math.round((Object.values(validaciones).filter(Boolean).length / Object.keys(validaciones).length) * 100)
        }
      }
    });

  } catch (error) {
    logger.error('Error validando exportación de proyecto', {
      controlador: 'ExportacionController',
      accion: 'validarExportacion',
      metodo: req.method,
      endpoint: req.originalUrl,
      usuarioId: req.usuario?._id || null,
      proyectoId: req.params?.id,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Error al validar datos para exportación',
      error: error.message
    });
  }
};

// Obtener formatos disponibles
const formatosDisponibles = (req, res) => {
  const formatos = {
    pdf: {
      nombre: 'PDF',
      descripcion: 'Documento PDF con formato profesional',
      extension: '.pdf',
      mime_type: 'application/pdf',
      tamaño_aproximado: '500KB - 2MB',
      caracteristicas: [
        'Formato profesional listo para imprimir',
        'Incluye progreso visual del proyecto',
        'Medidas detalladas con especificaciones',
        'Información financiera completa',
        'Branding corporativo Sundeck'
      ]
    },
    excel: {
      nombre: 'Excel',
      descripcion: 'Archivo Excel con múltiples hojas de datos',
      extension: '.xlsx',
      mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      tamaño_aproximado: '100KB - 500KB',
      caracteristicas: [
        'Múltiples hojas organizadas por categoría',
        'Datos editables y manipulables',
        'Tablas con formato profesional',
        'Cálculos automáticos',
        'Fácil importación a otros sistemas'
      ],
      hojas: [
        'Información General',
        'Medidas Detalladas',
        'Resumen Financiero',
        'Especificaciones Técnicas'
      ]
    },
    zip: {
      nombre: 'Paquete Completo',
      descripcion: 'Archivo ZIP con PDF y Excel incluidos',
      extension: '.zip',
      mime_type: 'application/zip',
      tamaño_aproximado: '600KB - 2.5MB',
      caracteristicas: [
        'Incluye ambos formatos (PDF + Excel)',
        'Archivos con nombres consistentes',
        'Ideal para envío por email',
        'Backup completo del proyecto'
      ]
    }
  };

  res.json({
    success: true,
    data: {
      formatos,
      recomendaciones: {
        cliente: 'PDF - Más profesional para presentar al cliente',
        interno: 'Excel - Mejor para análisis y manipulación de datos',
        completo: 'ZIP - Ideal para archivo y backup completo'
      }
    }
  });
};

module.exports = {
  generarPDFUnificado,
  generarExcelUnificado,
  generarPaqueteCompleto,
  vistaPrevia,
  validarExportacion,
  formatosDisponibles
};

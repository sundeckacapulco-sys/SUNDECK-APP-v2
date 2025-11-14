const Proyecto = require('../models/Proyecto');
const EtiquetasProduccionService = require('../services/etiquetasProduccionService');
const OrdenProduccionService = require('../services/ordenProduccionService');
const logger = require('../config/logger');

/**
 * Generar etiquetas de producción para un proyecto
 */
exports.generarEtiquetasProyecto = async (req, res) => {
  try {
    const { proyectoId } = req.params;
    const { formato = 'multiple' } = req.query; // 'multiple' o 'individual'
    
    // Obtener proyecto
    const proyecto = await Proyecto.findById(proyectoId).lean();
    
    if (!proyecto) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }
    
    // Obtener piezas con detalles técnicos
    const piezas = OrdenProduccionService.obtenerPiezasConDetallesTecnicos(proyecto);
    
    if (!piezas || piezas.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El proyecto no tiene piezas para generar etiquetas'
      });
    }
    
    logger.info('Generando etiquetas de producción', {
      controller: 'etiquetasController',
      proyectoId,
      formato,
      totalPiezas: piezas.length
    });
    
    // Generar PDF según formato
    let pdfBuffer;
    if (formato === 'individual') {
      pdfBuffer = await EtiquetasProduccionService.generarEtiquetasIndividuales(piezas, proyecto);
    } else {
      pdfBuffer = await EtiquetasProduccionService.generarPDFEtiquetas(piezas, proyecto);
    }
    
    // Configurar headers para descarga
    const filename = `Etiquetas_${proyecto.numero}_${Date.now()}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);
    
    logger.info('Etiquetas generadas exitosamente', {
      controller: 'etiquetasController',
      proyectoId,
      formato,
      filename
    });
    
  } catch (error) {
    logger.error('Error generando etiquetas', {
      controller: 'etiquetasController',
      proyectoId: req.params?.proyectoId,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      message: 'Error generando etiquetas',
      error: error.message
    });
  }
};

/**
 * Generar datos de etiqueta individual (para vista previa)
 */
exports.obtenerDatosEtiqueta = async (req, res) => {
  try {
    const { proyectoId, numeroPieza } = req.params;
    
    const proyecto = await Proyecto.findById(proyectoId).lean();
    
    if (!proyecto) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }
    
    const piezas = OrdenProduccionService.obtenerPiezasConDetallesTecnicos(proyecto);
    const pieza = piezas.find(p => p.numero === parseInt(numeroPieza));
    
    if (!pieza) {
      return res.status(404).json({
        success: false,
        message: 'Pieza no encontrada'
      });
    }
    
    const datosEtiqueta = EtiquetasProduccionService.generarDatosEtiqueta(pieza, proyecto);
    const qrDataURL = await EtiquetasProduccionService.generarQR(datosEtiqueta);
    
    res.json({
      success: true,
      data: {
        ...datosEtiqueta,
        qr: qrDataURL
      }
    });
    
  } catch (error) {
    logger.error('Error obteniendo datos de etiqueta', {
      controller: 'etiquetasController',
      error: error.message
    });
    
    res.status(500).json({
      success: false,
      message: 'Error obteniendo datos de etiqueta',
      error: error.message
    });
  }
};

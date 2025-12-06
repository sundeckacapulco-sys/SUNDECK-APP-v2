/**
 * Controller del Agente IA Sundeck
 */

const asistenteService = require('../services/asistenteService');
const logger = require('../config/logger');

/**
 * POST /api/asistente/chat
 * Procesa un mensaje del usuario
 */
const chat = async (req, res) => {
  try {
    const { mensaje, historial } = req.body;
    const usuario = req.user;
    
    if (!mensaje || typeof mensaje !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'El mensaje es requerido'
      });
    }
    
    if (mensaje.length > 2000) {
      return res.status(400).json({
        success: false,
        error: 'El mensaje es demasiado largo (máximo 2000 caracteres)'
      });
    }
    
    logger.info('Chat del asistente iniciado', {
      controller: 'asistenteController',
      usuario: usuario?.nombre,
      mensajeLength: mensaje.length
    });
    
    const resultado = await asistenteService.procesarMensaje(
      mensaje,
      historial || [],
      {
        usuario: usuario?.nombre,
        rol: usuario?.rol,
        userId: usuario?._id
      }
    );
    
    res.json(resultado);
    
  } catch (error) {
    logger.error('Error en chat del asistente', {
      controller: 'asistenteController',
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

/**
 * POST /api/asistente/sugerencia
 * Genera una sugerencia de mensaje
 */
const sugerencia = async (req, res) => {
  try {
    const { tipo, datos } = req.body;
    
    if (!tipo || !datos) {
      return res.status(400).json({
        success: false,
        error: 'Tipo y datos son requeridos'
      });
    }
    
    const tiposValidos = ['seguimiento', 'confirmacion', 'cobranza'];
    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({
        success: false,
        error: `Tipo inválido. Válidos: ${tiposValidos.join(', ')}`
      });
    }
    
    const resultado = await asistenteService.generarSugerencia(tipo, datos);
    res.json(resultado);
    
  } catch (error) {
    logger.error('Error generando sugerencia', {
      controller: 'asistenteController',
      error: error.message
    });
    
    res.status(500).json({
      success: false,
      error: 'Error generando sugerencia'
    });
  }
};

/**
 * GET /api/asistente/status
 * Verifica el estado del servicio
 */
const status = async (req, res) => {
  try {
    const apiKeyConfigured = !!process.env.OPENAI_API_KEY;
    
    res.json({
      success: true,
      status: 'online',
      apiKeyConfigured,
      version: '1.0.0',
      modelo: 'gpt-4o-mini'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'error',
      error: error.message
    });
  }
};

/**
 * GET /api/asistente/pendientes
 * Obtiene pendientes del día (acceso directo)
 */
const pendientes = async (req, res) => {
  try {
    const resultado = await asistenteService.consultarPendientesHoy();
    res.json({
      success: true,
      data: resultado
    });
  } catch (error) {
    logger.error('Error obteniendo pendientes', {
      controller: 'asistenteController',
      error: error.message
    });
    res.status(500).json({
      success: false,
      error: 'Error obteniendo pendientes'
    });
  }
};

/**
 * GET /api/asistente/kpis
 * Obtiene KPIs (acceso directo)
 */
const kpis = async (req, res) => {
  try {
    const { periodo } = req.query;
    const resultado = await asistenteService.consultarKPIs({ periodo });
    res.json({
      success: true,
      data: resultado
    });
  } catch (error) {
    logger.error('Error obteniendo KPIs', {
      controller: 'asistenteController',
      error: error.message
    });
    res.status(500).json({
      success: false,
      error: 'Error obteniendo KPIs'
    });
  }
};

/**
 * POST /api/asistente/analizar-levantamiento
 * Analiza un levantamiento de proyecto
 */
const analizarLevantamiento = async (req, res) => {
  try {
    const { proyectoId, numeroProyecto } = req.body;
    
    if (!proyectoId && !numeroProyecto) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere proyectoId o numeroProyecto'
      });
    }
    
    logger.info('Analizando levantamiento', {
      controller: 'asistenteController',
      proyectoId,
      numeroProyecto
    });
    
    const resultado = await asistenteService.analizarLevantamiento({ proyectoId, numeroProyecto });
    
    res.json({
      success: !resultado.error,
      data: resultado
    });
  } catch (error) {
    logger.error('Error analizando levantamiento', {
      controller: 'asistenteController',
      error: error.message
    });
    res.status(500).json({
      success: false,
      error: 'Error analizando levantamiento'
    });
  }
};

/**
 * POST /api/asistente/validar-cotizacion
 * Valida una cotización antes de enviar
 */
const validarCotizacion = async (req, res) => {
  try {
    const { proyectoId } = req.body;
    
    if (!proyectoId) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere proyectoId'
      });
    }
    
    logger.info('Validando cotización', {
      controller: 'asistenteController',
      proyectoId
    });
    
    const resultado = await asistenteService.validarCotizacion({ proyectoId });
    
    res.json({
      success: !resultado.error,
      data: resultado
    });
  } catch (error) {
    logger.error('Error validando cotización', {
      controller: 'asistenteController',
      error: error.message
    });
    res.status(500).json({
      success: false,
      error: 'Error validando cotización'
    });
  }
};

module.exports = {
  chat,
  sugerencia,
  status,
  pendientes,
  kpis,
  analizarLevantamiento,
  validarCotizacion
};

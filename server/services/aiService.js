/**
 * Servicio de IA - Placeholder
 * TODO: Implementar integración con OpenAI u otro proveedor
 */

const logger = require('../config/logger');

/**
 * Genera texto usando IA (placeholder)
 * @param {string} prompt - El prompt para generar texto
 * @returns {Promise<string>} - Texto generado
 */
const generarTexto = async (prompt) => {
  logger.info('aiService.generarTexto llamado', { 
    promptLength: prompt?.length || 0 
  });
  
  // Placeholder - retorna mensaje genérico
  // TODO: Integrar con OpenAI API
  return `Hola, gracias por tu interés en Sundeck. 
  
Somos especialistas en persianas, cortinas y toldos de alta calidad. 

¿Te gustaría agendar una visita para conocer nuestros productos? Estamos a tus órdenes.`;
};

/**
 * Genera sugerencia de mensaje WhatsApp
 * @param {Object} contexto - Contexto del prospecto
 * @returns {Promise<string>} - Mensaje sugerido
 */
const generarMensajeWhatsApp = async (contexto) => {
  const { nombre, producto, etapa } = contexto || {};
  
  logger.info('aiService.generarMensajeWhatsApp', { nombre, producto, etapa });
  
  // Mensaje personalizado básico
  const saludo = nombre ? `Hola ${nombre}` : 'Hola';
  const productoMencion = producto ? ` sobre ${producto}` : '';
  
  return `${saludo}, ¡gracias por tu interés en Sundeck!${productoMencion}

Somos especialistas en persianas, cortinas y toldos de alta calidad para tu hogar o negocio.

¿Te gustaría que agendemos una visita sin compromiso? Estamos para servirte. 🏠`;
};

module.exports = {
  generarTexto,
  generarMensajeWhatsApp
};

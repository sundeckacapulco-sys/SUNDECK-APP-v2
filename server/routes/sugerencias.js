const express = require('express');
const { auth } = require('../middleware/auth');
const logger = require('../config/logger');
const aiService = require('../services/aiService');
const Prospecto = require('../models/Prospecto');

const router = express.Router();

// POST /api/sugerencias/mensaje-whatsapp - Generar sugerencia de mensaje contextual
router.post('/mensaje-whatsapp', auth, async (req, res) => {
  const { prospectoId } = req.body;

  if (!prospectoId) {
    return res.status(400).json({ message: 'El ID del prospecto es requerido.' });
  }

  try {
    const prospecto = await Prospecto.findById(prospectoId);
    if (!prospecto) {
      return res.status(404).json({ message: 'Prospecto no encontrado.' });
    }

    // Construir un prompt detallado para la IA
    const prompt = `
      Actúa como un vendedor experto y amigable de la empresa "Sundeck".
      Tu tarea es generar un mensaje de WhatsApp corto (máximo 3 párrafos) para contactar a un prospecto.

      Aquí está la información del prospecto:
      - Nombre: ${prospecto.nombre}
      - Producto de interés: ${prospecto.producto}
      - Etapa actual en el proceso de venta: "${prospecto.etapa}"
      - Descripción de su necesidad: "${prospecto.descripcionNecesidad || 'No especificada'}"
      - Último contacto: ${prospecto.fechaUltimoContacto ? prospecto.fechaUltimoContacto.toLocaleDateString() : 'Aún no contactado'}

      Basado en esta información, redacta un mensaje que sea:
      1. Personalizado: Usa su nombre y menciona su interés.
      2. Relevante: El tono y el objetivo del mensaje deben corresponder a su etapa actual.
      3. Proactivo: Termina siempre con una pregunta clara o una llamada a la acción para fomentar una respuesta (ej. "¿Te gustaría agendar una llamada rápida mañana?", "¿Qué te pareció la cotización?", etc.).

      No incluyas placeholders como "[Tu Nombre]". El mensaje debe estar listo para ser copiado y enviado.
    `;

    logger.info('Generando sugerencia de mensaje para prospecto', { prospectoId });
    const mensajeSugerido = await aiService.generarTexto(prompt);

    res.json({
      sugerencia: mensajeSugerido,
    });

  } catch (error) {
    logger.error('Error generando sugerencia de mensaje con IA', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Error interno del servidor al generar la sugerencia.' });
  }
});

// POST /api/sugerencias/optimizar-plantilla - Optimizar una plantilla de texto
router.post('/optimizar-plantilla', auth, async (req, res) => {
  const { texto, objetivo } = req.body;

  if (!texto) {
    return res.status(400).json({ message: 'El texto a optimizar es requerido.' });
  }

  try {
    const prompt = `
      Actúa como un experto en copywriting y marketing digital.
      Tu tarea es reescribir y optimizar el siguiente texto para que sea más efectivo.

      Texto original:
      "${texto}"

      El objetivo principal de esta comunicación es: "${objetivo || 'ser claro y persuasivo'}".

      Por favor, mejora el texto aplicando estos principios:
      1. Claridad y Concisión: Hazlo más fácil de leer y entender.
      2. Tono Profesional pero Cercano: Usa un lenguaje amigable que genere confianza.
      3. Llamada a la Acción (CTA): Asegúrate de que termine con una instrucción o pregunta clara que motive al cliente a dar el siguiente paso.
      4. (Opcional) Emojis: Usa 1 o 2 emojis sutiles si ayudan a mejorar el tono y la legibilidad.

      Devuelve únicamente el texto optimizado, sin explicaciones adicionales.
    `;
    
    logger.info('Optimizando plantilla de texto con IA', { objetivo });
    const textoOptimizado = await aiService.generarTexto(prompt);

    res.json({
      texto_original: texto,
      texto_optimizado: textoOptimizado,
    });

  } catch (error) {
    logger.error('Error optimizando plantilla con IA', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Error interno del servidor al optimizar la plantilla.' });
  }
});

module.exports = router;

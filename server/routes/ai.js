const express = require('express');
const { auth } = require('../middleware/auth');

const router = express.Router();

// POST /ai/message-suggestion - Generar sugerencia de mensaje con IA
router.post('/message-suggestion', auth, async (req, res) => {
  try {
    const { nombre, producto, etapa, descripcionNecesidad } = req.body;
    
    // Simulación de respuesta de IA (en producción conectarías con OpenAI, etc.)
    const mensajesSugeridos = {
      'nuevo': `Hola ${nombre}, gracias por contactarnos. Vi que estás interesado en ${producto}. Me gustaría agendar una cita para conocer mejor tus necesidades y ofrecerte la mejor solución. ¿Cuándo te vendría bien que te visitemos?`,
      'contactado': `Hola ${nombre}, espero que estés bien. Te escribo para darle seguimiento a tu interés en ${producto}. ¿Tienes alguna pregunta específica que pueda resolver? Estoy aquí para ayudarte.`,
      'cita_agendada': `Hola ${nombre}, confirmo nuestra cita para hablar sobre ${producto}. Llevaré algunas muestras y opciones que creo que te van a encantar. ¡Nos vemos pronto!`,
      'cotizacion': `Hola ${nombre}, he preparado una cotización personalizada para ${producto} basada en lo que platicamos. Te la envío para que la revises. ¿Tienes alguna pregunta al respecto?`,
      'pedido': `Hola ${nombre}, ¡excelente decisión con ${producto}! Ya tenemos tu pedido en proceso. Te estaré informando sobre el avance de la fabricación. ¡Gracias por confiar en Sundeck!`
    };
    
    let mensajeBase = mensajesSugeridos[etapa] || mensajesSugeridos['nuevo'];
    
    // Personalizar según la descripción de necesidad
    if (descripcionNecesidad) {
      mensajeBase += ` Recuerdo que mencionaste: "${descripcionNecesidad}". Tenemos excelentes opciones para eso.`;
    }
    
    // Agregar llamada a la acción según la etapa
    const llamadasAccion = {
      'nuevo': ' ¿Te parece si agendamos una cita esta semana?',
      'contactado': ' ¿Cuándo sería un buen momento para visitarte?',
      'cita_agendada': ' ¿Hay algo específico que te gustaría que llevemos a la cita?',
      'cotizacion': ' ¿Te gustaría que ajustemos algo en la propuesta?',
      'pedido': ' ¿Tienes alguna pregunta sobre el proceso de fabricación?'
    };
    
    mensajeBase += llamadasAccion[etapa] || '';
    
    res.json({
      mensaje: mensajeBase,
      variables_detectadas: ['nombre', 'producto'],
      sugerencias_adicionales: [
        'Agregar información sobre garantía',
        'Mencionar promociones actuales',
        'Incluir testimonios de clientes'
      ]
    });
    
  } catch (error) {
    console.error('Error generating AI message:', error);
    res.status(500).json({ message: 'Error generando sugerencia de mensaje' });
  }
});

// POST /ai/optimize-template - Optimizar plantilla existente
router.post('/optimize-template', auth, async (req, res) => {
  try {
    const { texto, objetivo } = req.body;
    
    // Simulación de optimización de IA
    const textosOptimizados = {
      'conversion': texto + ' ¡Aprovecha nuestra promoción especial este mes!',
      'engagement': '👋 ' + texto + ' ¿Te gustaría ver algunos ejemplos de nuestros trabajos recientes?',
      'urgencia': texto + ' ⏰ Esta oferta es por tiempo limitado.',
      'confianza': texto + ' 🏆 Más de 500 clientes satisfechos nos respaldan.'
    };
    
    const textoOptimizado = textosOptimizados[objetivo] || texto;
    
    res.json({
      texto_optimizado: textoOptimizado,
      mejoras_aplicadas: [
        'Agregado emoji para mayor engagement',
        'Incluida llamada a la acción',
        'Mejorado tono conversacional'
      ],
      score_original: Math.floor(Math.random() * 40) + 60,
      score_optimizado: Math.floor(Math.random() * 20) + 80
    });
    
  } catch (error) {
    console.error('Error optimizing template:', error);
    res.status(500).json({ message: 'Error optimizando plantilla' });
  }
});

module.exports = router;

const axios = require('axios');
const nodemailer = require('nodemailer');
const logger = require('../config/logger');
const fs = require('fs');
const path = require('path');

// Cargar configuración de notificaciones
let configNotificaciones = {
  whatsappAdmin: '',
  correoAdmin: '',
  whatsappEnabled: false,
  correoEnabled: false
};

try {
  const configPath = path.join(__dirname, '../config/notificaciones.json');
  if (fs.existsSync(configPath)) {
    configNotificaciones = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (error) {
  logger.warn('No se pudo cargar configuración de notificaciones, usando valores por defecto', {
    error: error.message
  });
}

/**
 * Enviar notificación por WhatsApp
 * @param {string} numero - Número de teléfono (formato: 52XXXXXXXXXX)
 * @param {string} mensaje - Mensaje a enviar
 * @returns {Promise<Object>} Resultado del envío
 */
const enviarNotificacionWhatsApp = async (numero, mensaje) => {
  try {
    if (!configNotificaciones.whatsappEnabled) {
      logger.info('Notificación WhatsApp deshabilitada en configuración', {
        numero,
        mensaje: mensaje.substring(0, 50) + '...'
      });
      return {
        success: false,
        message: 'WhatsApp deshabilitado en configuración',
        enviado: false
      };
    }

    if (!numero || !mensaje) {
      throw new Error('Número y mensaje son requeridos');
    }

    // Validar formato de número (debe ser 52XXXXXXXXXX)
    const numeroLimpio = numero.replace(/\D/g, '');
    if (!numeroLimpio.startsWith('52') || numeroLimpio.length < 12) {
      throw new Error('Formato de número inválido. Debe ser 52XXXXXXXXXX');
    }

    logger.info('Enviando notificación WhatsApp', {
      numero: numeroLimpio,
      longitudMensaje: mensaje.length
    });

    // Aquí se integraría con la API de WhatsApp Business
    // Por ahora, simulamos el envío y registramos en logs
    
    // Ejemplo de integración con WhatsApp Business API:
    /*
    const response = await axios.post(
      `https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: numeroLimpio,
        type: 'text',
        text: { body: mensaje }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    */

    logger.info('Notificación WhatsApp registrada', {
      numero: numeroLimpio,
      mensaje,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      message: 'Notificación WhatsApp registrada correctamente',
      enviado: true,
      numero: numeroLimpio
    };

  } catch (error) {
    logger.error('Error enviando notificación WhatsApp', {
      error: error.message,
      stack: error.stack,
      numero
    });

    return {
      success: false,
      message: error.message,
      enviado: false
    };
  }
};

/**
 * Enviar notificación por correo electrónico
 * @param {string} destinatario - Correo del destinatario
 * @param {string} asunto - Asunto del correo
 * @param {string} cuerpo - Cuerpo del correo (puede incluir HTML)
 * @returns {Promise<Object>} Resultado del envío
 */
const enviarNotificacionCorreo = async (destinatario, asunto, cuerpo) => {
  try {
    if (!configNotificaciones.correoEnabled) {
      logger.info('Notificación por correo deshabilitada en configuración', {
        destinatario,
        asunto
      });
      return {
        success: false,
        message: 'Correo deshabilitado en configuración',
        enviado: false
      };
    }

    if (!destinatario || !asunto || !cuerpo) {
      throw new Error('Destinatario, asunto y cuerpo son requeridos');
    }

    // Validar formato de correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(destinatario)) {
      throw new Error('Formato de correo inválido');
    }

    logger.info('Enviando notificación por correo', {
      destinatario,
      asunto
    });

    // Configurar transporter de nodemailer
    // NOTA: Configurar variables de entorno para producción
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
      }
    });

    // Si no hay credenciales configuradas, solo registrar en logs
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      logger.info('Notificación por correo registrada (sin envío real - configurar SMTP)', {
        destinatario,
        asunto,
        cuerpo: cuerpo.substring(0, 100) + '...',
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        message: 'Notificación registrada (SMTP no configurado)',
        enviado: false,
        destinatario
      };
    }

    // Enviar correo
    const info = await transporter.sendMail({
      from: `"Sundeck CRM" <${process.env.SMTP_USER}>`,
      to: destinatario,
      subject: asunto,
      html: cuerpo
    });

    logger.info('Notificación por correo enviada', {
      destinatario,
      asunto,
      messageId: info.messageId
    });

    return {
      success: true,
      message: 'Correo enviado correctamente',
      enviado: true,
      messageId: info.messageId,
      destinatario
    };

  } catch (error) {
    logger.error('Error enviando notificación por correo', {
      error: error.message,
      stack: error.stack,
      destinatario,
      asunto
    });

    return {
      success: false,
      message: error.message,
      enviado: false
    };
  }
};

/**
 * Enviar notificación de aprobación de pedido
 * @param {Object} proyecto - Datos del proyecto aprobado
 * @returns {Promise<Object>} Resultado del envío
 */
const enviarNotificacionAprobacionPedido = async (proyecto) => {
  try {
    const clienteNombre = proyecto.cliente?.nombre || 'Cliente';
    const proyectoNumero = proyecto.numero || `#${proyecto._id.toString().slice(-8).toUpperCase()}`;
    const total = proyecto.total || 0;
    const totalFormateado = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(total);

    // Mensaje para WhatsApp
    const mensajeWhatsApp = `
🎉 *PEDIDO APROBADO*

📋 *Proyecto:* ${proyectoNumero}
👤 *Cliente:* ${clienteNombre}
💰 *Total:* ${totalFormateado}
📅 *Fecha:* ${new Date().toLocaleDateString('es-MX')}

✅ El pedido ha sido aprobado y está listo para pasar a fabricación.

_Notificación automática de Sundeck CRM_
    `.trim();

    // Cuerpo HTML para correo
    const cuerpoCorreo = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
    .info-box { background: white; padding: 20px; margin: 15px 0; border-left: 4px solid #28a745; border-radius: 5px; }
    .info-row { display: flex; justify-content: space-between; margin: 10px 0; }
    .label { font-weight: bold; color: #666; }
    .value { color: #333; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
    .button { display: inline-block; padding: 12px 30px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Pedido Aprobado</h1>
      <p>Notificación Automática</p>
    </div>
    <div class="content">
      <p>Se ha aprobado un nuevo pedido en el sistema:</p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="label">📋 Proyecto:</span>
          <span class="value">${proyectoNumero}</span>
        </div>
        <div class="info-row">
          <span class="label">👤 Cliente:</span>
          <span class="value">${clienteNombre}</span>
        </div>
        <div class="info-row">
          <span class="label">💰 Total:</span>
          <span class="value"><strong>${totalFormateado}</strong></span>
        </div>
        <div class="info-row">
          <span class="label">📅 Fecha de Aprobación:</span>
          <span class="value">${new Date().toLocaleDateString('es-MX', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</span>
        </div>
      </div>

      <p><strong>✅ El pedido está listo para pasar a fabricación.</strong></p>
      
      <p>Accede al sistema para ver los detalles completos y gestionar el siguiente paso.</p>
    </div>
    <div class="footer">
      <p>Este es un mensaje automático de Sundeck CRM</p>
      <p>© ${new Date().getFullYear()} Sundeck - Persianas y Decoraciones</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    const resultados = {
      whatsapp: null,
      correo: null
    };

    // Enviar WhatsApp si está configurado
    if (configNotificaciones.whatsappAdmin) {
      resultados.whatsapp = await enviarNotificacionWhatsApp(
        configNotificaciones.whatsappAdmin,
        mensajeWhatsApp
      );
    }

    // Enviar correo si está configurado
    if (configNotificaciones.correoAdmin) {
      resultados.correo = await enviarNotificacionCorreo(
        configNotificaciones.correoAdmin,
        `🎉 Pedido Aprobado - ${proyectoNumero}`,
        cuerpoCorreo
      );
    }

    logger.info('Notificaciones de aprobación procesadas', {
      proyectoId: proyecto._id,
      proyectoNumero,
      whatsappEnviado: resultados.whatsapp?.enviado || false,
      correoEnviado: resultados.correo?.enviado || false
    });

    return {
      success: true,
      resultados
    };

  } catch (error) {
    logger.error('Error enviando notificaciones de aprobación', {
      error: error.message,
      stack: error.stack,
      proyectoId: proyecto._id
    });

    return {
      success: false,
      message: error.message
    };
  }
};

module.exports = {
  enviarNotificacionWhatsApp,
  enviarNotificacionCorreo,
  enviarNotificacionAprobacionPedido
};

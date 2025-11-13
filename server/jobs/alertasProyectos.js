const logger = require('../config/logger');
const alertasInteligentesService = require('../services/alertasInteligentesService');

/**
 * JOB: ALERTAS DE PROYECTOS SIN MOVIMIENTO
 * Detecta proyectos sin actividad y genera alertas
 */

async function alertasProyectos(notificar) {
  try {
    logger.info('Iniciando job de alertas de proyectos', {
      job: 'alertasProyectos',
      fecha: new Date()
    });

    const sinMovimiento = await alertasInteligentesService.obtenerProyectosSinMovimiento();

    logger.info('Proyectos sin movimiento encontrados', {
      job: 'alertasProyectos',
      total: sinMovimiento.length
    });

    // Agrupar por coordinador/asesor
    const porResponsable = {};
    sinMovimiento.forEach(proyecto => {
      const responsableId = proyecto.responsable?.id || 'sin_asignar';
      if (!porResponsable[responsableId]) {
        porResponsable[responsableId] = {
          responsable: proyecto.responsable,
          proyectos: []
        };
      }
      porResponsable[responsableId].proyectos.push(proyecto);
    });

    // Enviar alertas
    let alertasEnviadas = 0;
    for (const [responsableId, data] of Object.entries(porResponsable)) {
      if (responsableId === 'sin_asignar') continue;

      const { responsable, proyectos } = data;
      
      const proyectosConDias = proyectos.map(p => ({
        numero: p.numero,
        cliente: p.cliente?.nombre || 'Sin nombre',
        estado: p.estado,
        diasSinMovimiento: p.diasInactividad
      }));

      const mensaje = `
🔔 ALERTA DE PROYECTOS SIN MOVIMIENTO

Hola ${responsable?.nombre || 'Coordinador'},

Tienes ${proyectos.length} proyecto(s) sin actividad por más de 10 días:

${proyectosConDias.map((p, i) => 
  `${i + 1}. ${p.numero} - ${p.cliente}
   Estado: ${p.estado}
   Días sin movimiento: ${p.diasSinMovimiento}`
).join('\n\n')}

Por favor, actualiza el estado de estos proyectos lo antes posible.

---
Sistema de Alertas Automáticas
Sundeck CRM
      `.trim();

      if (typeof notificar === 'function') {
        try {
          await notificar({
            to: [responsable?.email, 'coordinacion@sundeck.com'].filter(Boolean),
            asunto: `⚠️ ${proyectos.length} proyecto(s) requieren actualización`,
            cuerpo: mensaje,
            tipo: 'alerta_proyectos'
          });
          alertasEnviadas++;
          
          logger.info('Alerta enviada a responsable', {
            job: 'alertasProyectos',
            responsable: responsable?.nombre,
            proyectos: proyectos.length
          });
        } catch (error) {
          logger.error('Error enviando alerta', {
            job: 'alertasProyectos',
            responsable: responsable?.nombre,
            error: error.message
          });
        }
      } else {
        logger.warn('Alerta generada (sin función de notificación)', {
          job: 'alertasProyectos',
          responsable: responsable?.nombre,
          proyectos: proyectos.length
        });
        alertasEnviadas++;
      }
    }

    logger.info('Job de alertas de proyectos completado', {
      job: 'alertasProyectos',
      proyectosSinMovimiento: sinMovimiento.length,
      alertasEnviadas
    });

    await alertasInteligentesService.actualizarEstadosAutomaticos({ proyectosSinMovimiento: sinMovimiento });

    return {
      ok: true,
      proyectosSinMovimiento: sinMovimiento.length,
      alertasEnviadas,
      fecha: new Date(),
      detalle: sinMovimiento
    };

  } catch (error) {
    logger.error('Error en job de alertas de proyectos', {
      job: 'alertasProyectos',
      error: error.message,
      stack: error.stack
    });
    
    throw error;
  }
}

module.exports = alertasProyectos;

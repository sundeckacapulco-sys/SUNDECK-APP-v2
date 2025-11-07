const Proyecto = require('../models/Proyecto');
const logger = require('../config/logger');

/**
 * JOB: ALERTAS DE INSTALACIONES RETRASADAS
 * Detecta instalaciones programadas que están retrasadas
 */

async function alertasInstalaciones(notificar) {
  try {
    logger.info('Iniciando job de alertas de instalaciones', {
      job: 'alertasInstalaciones',
      fecha: new Date()
    });

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // Buscar instalaciones retrasadas
    const retrasadas = await Proyecto.find({
      'instalacion.programacion.fechaProgramada': { $lt: hoy },
      'instalacion.estado': { $in: ['programada', 'reprogramada'] }
    })
    .populate('instalacion.programacion.cuadrilla', 'nombre')
    .populate('cliente');

    logger.info('Instalaciones retrasadas encontradas', {
      job: 'alertasInstalaciones',
      total: retrasadas.length
    });

    if (retrasadas.length === 0) {
      return {
        ok: true,
        instalacionesRetrasadas: 0,
        alertasEnviadas: 0,
        fecha: new Date()
      };
    }

    // Agrupar por días de retraso
    const instalacionesConRetraso = retrasadas.map(proyecto => {
      const fechaProgramada = proyecto.instalacion.programacion.fechaProgramada;
      const diasRetraso = Math.floor((hoy - fechaProgramada) / (24 * 60 * 60 * 1000));
      
      return {
        proyecto,
        diasRetraso,
        prioridad: diasRetraso > 7 ? 'alta' : diasRetraso > 3 ? 'media' : 'baja'
      };
    });

    // Ordenar por días de retraso (mayor a menor)
    instalacionesConRetraso.sort((a, b) => b.diasRetraso - a.diasRetraso);

    const mensaje = `
🔴 ALERTA DE INSTALACIONES RETRASADAS

Se detectaron ${retrasadas.length} instalación(es) con retraso:

${instalacionesConRetraso.map((item, i) => {
  const p = item.proyecto;
  const prioridadIcon = item.prioridad === 'alta' ? '🔴' : item.prioridad === 'media' ? '🟡' : '🟢';
  
  return `${i + 1}. ${prioridadIcon} ${p.numero} - ${p.cliente?.nombre}
   Programada: ${p.instalacion.programacion.fechaProgramada.toLocaleDateString()}
   Días de retraso: ${item.diasRetraso}
   Cuadrilla: ${p.instalacion.programacion.cuadrilla?.nombre || 'Sin asignar'}
   Estado: ${p.instalacion.estado}`;
}).join('\n\n')}

Por favor, reprogramar o actualizar el estado de estas instalaciones.

---
Sistema de Alertas Automáticas
Sundeck CRM
    `.trim();

    let alertasEnviadas = 0;

    if (typeof notificar === 'function') {
      try {
        await notificar({
          to: ['operaciones@sundeck.com', 'coordinacion@sundeck.com'],
          asunto: `🔴 ${retrasadas.length} instalación(es) retrasadas`,
          cuerpo: mensaje,
          tipo: 'alerta_instalaciones',
          prioridad: 'alta'
        });
        alertasEnviadas++;
        
        logger.info('Alerta de instalaciones enviada', {
          job: 'alertasInstalaciones',
          instalaciones: retrasadas.length
        });
      } catch (error) {
        logger.error('Error enviando alerta de instalaciones', {
          job: 'alertasInstalaciones',
          error: error.message
        });
      }
    } else {
      logger.warn('Alerta generada (sin función de notificación)', {
        job: 'alertasInstalaciones',
        instalaciones: retrasadas.length
      });
      alertasEnviadas++;
    }

    logger.info('Job de alertas de instalaciones completado', {
      job: 'alertasInstalaciones',
      instalacionesRetrasadas: retrasadas.length,
      alertasEnviadas
    });

    return {
      ok: true,
      instalacionesRetrasadas: retrasadas.length,
      alertasEnviadas,
      fecha: new Date()
    };

  } catch (error) {
    logger.error('Error en job de alertas de instalaciones', {
      job: 'alertasInstalaciones',
      error: error.message,
      stack: error.stack
    });
    
    throw error;
  }
}

module.exports = alertasInstalaciones;

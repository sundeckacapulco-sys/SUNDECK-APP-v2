const Proyecto = require('../models/Proyecto');
const logger = require('../config/logger');

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

    // Fecha límite: 10 días sin movimiento
    const limite = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);

    // Buscar proyectos sin movimiento
    const sinMovimiento = await Proyecto.find({
      tipo: 'proyecto',
      estado: { $nin: ['completado', 'cancelado'] },
      fecha_actualizacion: { $lt: limite }
    })
    .populate('asesor_asignado', 'nombre email')
    .populate('tecnico_asignado', 'nombre email')
    .populate('cliente');

    logger.info('Proyectos sin movimiento encontrados', {
      job: 'alertasProyectos',
      total: sinMovimiento.length
    });

    // Agrupar por coordinador/asesor
    const porResponsable = {};
    sinMovimiento.forEach(proyecto => {
      const responsableId = proyecto.asesor_asignado?._id?.toString() || 'sin_asignar';
      if (!porResponsable[responsableId]) {
        porResponsable[responsableId] = {
          responsable: proyecto.asesor_asignado,
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
      
      const proyectosConDias = proyectos.map(p => {
        const dias = Math.floor((Date.now() - p.fecha_actualizacion.getTime()) / (24 * 60 * 60 * 1000));
        return {
          numero: p.numero,
          cliente: p.cliente?.nombre || 'Sin nombre',
          estado: p.estado,
          diasSinMovimiento: dias
        };
      });

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
            to: [responsable?.email, 'coordinacion@sundeck.com'],
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

    return {
      ok: true,
      proyectosSinMovimiento: sinMovimiento.length,
      alertasEnviadas,
      fecha: new Date()
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

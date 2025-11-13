const Proyecto = require('../models/Proyecto');
const logger = require('../config/logger');
const alertasInteligentesService = require('../services/alertasInteligentesService');

/**
 * JOB: ALERTAS AUTOMÁTICAS DE PROSPECTOS
 * Detecta prospectos inactivos y genera alertas para asesores
 * Ejecutar diariamente vía cron job
 */

async function alertasProspectos(notificar) {
  try {
    logger.info('Iniciando job de alertas de prospectos', {
      job: 'alertasProspectos',
      fecha: new Date()
    });

    const inactivos = await alertasInteligentesService.obtenerProspectosInactivos();

    logger.info('Prospectos inactivos encontrados', {
      job: 'alertasProspectos',
      total: inactivos.length
    });

    // Agrupar por asesor
    const porAsesor = {};
    inactivos.forEach(prospecto => {
      const asesorId = prospecto.responsable?.id || 'sin_asignar';
      if (!porAsesor[asesorId]) {
        porAsesor[asesorId] = {
          asesor: prospecto.responsable,
          prospectos: []
        };
      }
      porAsesor[asesorId].prospectos.push(prospecto);
    });

    // Enviar alertas por asesor
    let alertasEnviadas = 0;
    for (const [asesorId, data] of Object.entries(porAsesor)) {
      if (asesorId === 'sin_asignar') continue;

      const { asesor, prospectos } = data;

      const prospectosConDias = prospectos.map(p => ({
        cliente: p.cliente?.nombre || 'Sin nombre',
        telefono: p.cliente?.telefono || 'Sin teléfono',
        estado: p.estadoComercial,
        diasInactivo: p.diasInactividad,
        numero: p.numero
      }));

      // Generar mensaje de alerta
      const mensaje = `
🔔 ALERTA DE PROSPECTOS INACTIVOS

Hola ${asesor?.nombre || 'Asesor'},

Tienes ${prospectos.length} prospecto(s) sin seguimiento por más de 5 días:

${prospectosConDias.map((p, i) =>
  `${i + 1}. ${p.cliente} (${p.telefono})
   Estado: ${p.estado}
   Días sin contacto: ${p.diasInactivo ?? 'Sin registro'}`
).join('\n\n')}

Por favor, realiza seguimiento lo antes posible para no perder estas oportunidades.

---
Sistema de Alertas Automáticas
Sundeck CRM
      `.trim();

      // Enviar notificación
      if (typeof notificar === 'function') {
        try {
          await notificar({
            to: [asesor?.email, 'coordinacion@sundeck.com'].filter(Boolean),
            asunto: `⚠️ ${prospectos.length} prospecto(s) requieren seguimiento`,
            cuerpo: mensaje,
            tipo: 'alerta_prospectos'
          });
          alertasEnviadas++;
          
          logger.info('Alerta enviada a asesor', {
            job: 'alertasProspectos',
          asesor: asesor?.nombre,
          email: asesor?.email,
          prospectos: prospectos.length
        });
      } catch (error) {
          logger.error('Error enviando alerta', {
            job: 'alertasProspectos',
            asesor: asesor?.nombre,
            error: error.message
          });
        }
      } else {
        // Si no hay función de notificación, solo registrar en logs
        logger.warn('Alerta generada (sin función de notificación)', {
          job: 'alertasProspectos',
          asesor: asesor?.nombre,
          prospectos: prospectos.length,
          mensaje
        });
        alertasEnviadas++;
      }
    }

    logger.info('Job de alertas completado', {
      job: 'alertasProspectos',
      prospectosInactivos: inactivos.length,
      alertasEnviadas
    });

    await alertasInteligentesService.actualizarEstadosAutomaticos({ prospectosInactivos: inactivos });

    return {
      ok: true,
      prospectosInactivos: inactivos.length,
      alertasEnviadas,
      fecha: new Date(),
      detalle: inactivos
    };

  } catch (error) {
    logger.error('Error en job de alertas de prospectos', {
      job: 'alertasProspectos',
      error: error.message,
      stack: error.stack
    });
    
    throw error;
  }
}

/**
 * Función auxiliar para obtener estadísticas de alertas
 */
async function obtenerEstadisticasAlertas() {
  try {
    const limite = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    
    const [
      totalInactivos,
      porAsesor
    ] = await Promise.all([
      Proyecto.countDocuments({
        tipo: 'prospecto',
        estadoComercial: { $in: ['en seguimiento', 'cotizado'] },
        $or: [
          { ultimaNota: { $lt: limite } },
          { ultimaNota: null }
        ]
      }),
      Proyecto.aggregate([
        {
          $match: {
            tipo: 'prospecto',
            estadoComercial: { $in: ['en seguimiento', 'cotizado'] },
            $or: [
              { ultimaNota: { $lt: limite } },
              { ultimaNota: null }
            ]
          }
        },
        {
          $group: {
            _id: '$asesorComercial',
            count: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'usuarios',
            localField: '_id',
            foreignField: '_id',
            as: 'asesor'
          }
        },
        { $unwind: { path: '$asesor', preserveNullAndEmptyArrays: true } },
        { $sort: { count: -1 } }
      ])
    ]);

    return {
      totalInactivos,
      porAsesor: porAsesor.map(a => ({
        asesor: a.asesor?.nombre || 'Sin asignar',
        email: a.asesor?.email,
        prospectos: a.count
      }))
    };
  } catch (error) {
    logger.error('Error obteniendo estadísticas de alertas', {
      error: error.message
    });
    throw error;
  }
}

module.exports = alertasProspectos;
module.exports.obtenerEstadisticasAlertas = obtenerEstadisticasAlertas;

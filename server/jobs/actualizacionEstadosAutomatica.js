const Proyecto = require('../models/Proyecto');
const logger = require('../config/logger');

/**
 * JOB: ACTUALIZACIÓN AUTOMÁTICA DE ESTADOS
 * Actualiza estados comerciales basándose en reglas de negocio
 */

async function actualizacionEstadosAutomatica() {
  try {
    logger.info('Iniciando job de actualización automática de estados', {
      job: 'actualizacionEstados',
      fecha: new Date()
    });

    let actualizaciones = {
      cotizados: 0,
      convertidos: 0,
      perdidos: 0
    };

    // REGLA 1: Si se genera cotización → estadoComercial = "cotizado"
    const prospectosConCotizacion = await Proyecto.find({
      tipo: 'prospecto',
      estadoComercial: 'en seguimiento',
      cotizaciones: { $exists: true, $ne: [] }
    });

    for (const prospecto of prospectosConCotizacion) {
      prospecto.estadoComercial = 'cotizado';
      prospecto.actualizado_por = null; // Sistema
      await prospecto.save();
      actualizaciones.cotizados++;
      
      logger.info('Prospecto actualizado a cotizado automáticamente', {
        job: 'actualizacionEstados',
        proyectoId: prospecto._id,
        numero: prospecto.numero
      });
    }

    // REGLA 2: Si se crea pedido → estadoComercial = "convertido"
    const prospectosConPedido = await Proyecto.find({
      tipo: 'prospecto',
      estadoComercial: { $in: ['en seguimiento', 'cotizado'] },
      pedidos: { $exists: true, $ne: [] }
    });

    for (const prospecto of prospectosConPedido) {
      prospecto.tipo = 'proyecto';
      prospecto.estadoComercial = 'convertido';
      prospecto.actualizado_por = null; // Sistema
      await prospecto.save();
      actualizaciones.convertidos++;
      
      logger.info('Prospecto convertido a proyecto automáticamente', {
        job: 'actualizacionEstados',
        proyectoId: prospecto._id,
        numero: prospecto.numero
      });
    }

    // REGLA 3: Si pasan 30 días sin pedido → estadoComercial = "perdido"
    const hace30Dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const prospectosPerdidos = await Proyecto.find({
      tipo: 'prospecto',
      estadoComercial: { $in: ['en seguimiento', 'cotizado'] },
      fecha_creacion: { $lt: hace30Dias },
      pedidos: { $exists: true, $eq: [] }
    });

    for (const prospecto of prospectosPerdidos) {
      // Verificar si tiene actividad reciente
      const ultimaActividad = prospecto.ultimaNota || prospecto.fecha_actualizacion;
      
      if (ultimaActividad < hace30Dias) {
        prospecto.estadoComercial = 'perdido';
        prospecto.actualizado_por = null; // Sistema
        await prospecto.save();
        actualizaciones.perdidos++;
        
        logger.info('Prospecto marcado como perdido automáticamente', {
          job: 'actualizacionEstados',
          proyectoId: prospecto._id,
          numero: prospecto.numero,
          diasInactivo: Math.floor((Date.now() - ultimaActividad) / (24 * 60 * 60 * 1000))
        });
      }
    }

    logger.info('Job de actualización de estados completado', {
      job: 'actualizacionEstados',
      actualizaciones
    });

    return {
      ok: true,
      actualizaciones,
      fecha: new Date()
    };

  } catch (error) {
    logger.error('Error en job de actualización de estados', {
      job: 'actualizacionEstados',
      error: error.message,
      stack: error.stack
    });
    
    throw error;
  }
}

module.exports = actualizacionEstadosAutomatica;

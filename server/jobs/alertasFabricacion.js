const logger = require('../config/logger');
const alertasFabricacionService = require('../services/alertasFabricacionService');
const notificacionesService = require('../services/notificacionesService');

/**
 * JOB: ALERTAS DE FABRICACIÓN
 * Detecta retrasos, materiales faltantes y controles de calidad pendientes.
 * Genera notificaciones automáticas para los responsables clave.
 */
async function alertasFabricacion() {
  logger.info('Iniciando job de alertas de fabricación', {
    job: 'alertasFabricacion',
    fecha: new Date().toISOString()
  });

  try {
    const [ordenesRetrasadas, materialesFaltantes, controlCalidadPendiente] = await Promise.all([
      alertasFabricacionService.obtenerOrdenesRetrasadas(),
      alertasFabricacionService.obtenerMaterialesFaltantes(),
      alertasFabricacionService.obtenerCalidadPendiente()
    ]);

    const totalAlertas =
      ordenesRetrasadas.length + materialesFaltantes.length + controlCalidadPendiente.length;

    logger.info('Alertas de fabricación detectadas', {
      job: 'alertasFabricacion',
      totales: {
        ordenesRetrasadas: ordenesRetrasadas.length,
        materialesFaltantes: materialesFaltantes.length,
        controlCalidadPendiente: controlCalidadPendiente.length,
        totalAlertas
      }
    });

    if (totalAlertas === 0) {
      logger.info('Sin alertas de fabricación activas en esta ejecución', {
        job: 'alertasFabricacion'
      });

      return {
        ok: true,
        totalAlertas: 0,
        notificaciones: 0,
        fecha: new Date().toISOString()
      };
    }

    const [coordinadorFabricacion, gerenteFabricacion] = await Promise.all([
      notificacionesService.obtenerCoordinadorFabricacion(),
      notificacionesService.obtenerGerenteFabricacion()
    ]);

    let notificacionesCreadas = 0;

    const crearNotificaciones = async (alerta, categoria) => {
      const destinatarios = new Set();

      if (alerta?.responsable?.id) {
        destinatarios.add(alerta.responsable.id);
      }
      if (alerta?.asesor?.id) {
        destinatarios.add(alerta.asesor.id);
      }

      if (coordinadorFabricacion) {
        destinatarios.add(coordinadorFabricacion.toString());
      }

      if (categoria === 'ordenes_retrasadas' && gerenteFabricacion) {
        destinatarios.add(gerenteFabricacion.toString());
      }

      const tituloBase = {
        ordenes_retrasadas: 'Orden de fabricación retrasada',
        materiales_faltantes: 'Materiales faltantes en fabricación',
        control_calidad_pendiente: 'Control de calidad pendiente'
      }[categoria];

      const mensajeBase = {
        ordenes_retrasadas: `La orden ${alerta.numero || alerta.id} presenta ${alerta.diasRetraso} día(s) de retraso respecto a la fecha estimada.`,
        materiales_faltantes: `La orden ${alerta.numero || alerta.id} requiere ${alerta.materialesPendientes?.length || 0} material(es) por confirmar disponibilidad.`,
        control_calidad_pendiente: `La orden ${alerta.numero || alerta.id} lleva ${alerta.diasPendientes} día(s) sin control de calidad.`
      }[categoria];

      const prioridad = alerta.prioridad || 'importante';
      const fechaVencimiento = notificacionesService.calcularFechaVencimiento(
        categoria === 'materiales_faltantes' ? 2 : 1
      );

      for (const destinatario of destinatarios) {
        if (!destinatario) {
          continue;
        }

        try {
          await notificacionesService.crearNotificacion({
            tipo: `alerta_fabricacion_${categoria}`,
            titulo: tituloBase || 'Alerta de fabricación',
            mensaje: `${mensajeBase || 'Se detectó una alerta automática en fabricación.'}\nCliente: ${alerta?.cliente?.nombre || 'Sin nombre'}\nPrioridad: ${prioridad.toUpperCase()}`,
            proyectoId: alerta.id,
            prioridad,
            fechaVencimiento,
            usuarioAsignado: destinatario,
            estadoProyecto: 'fabricacion'
          });

          notificacionesCreadas += 1;
        } catch (error) {
          logger.error('Error creando notificación de alerta de fabricación', {
            job: 'alertasFabricacion',
            categoria,
            proyectoId: alerta?.id,
            destinatario,
            error: error.message
          });
        }
      }
    };

    for (const alerta of ordenesRetrasadas) {
      await crearNotificaciones(alerta, 'ordenes_retrasadas');
    }

    for (const alerta of materialesFaltantes) {
      await crearNotificaciones(alerta, 'materiales_faltantes');
    }

    for (const alerta of controlCalidadPendiente) {
      await crearNotificaciones(alerta, 'control_calidad_pendiente');
    }

    logger.info('Job de alertas de fabricación completado', {
      job: 'alertasFabricacion',
      totalAlertas,
      notificacionesCreadas
    });

    return {
      ok: true,
      totalAlertas,
      notificaciones: notificacionesCreadas,
      fecha: new Date().toISOString(),
      detalle: {
        ordenesRetrasadas,
        materialesFaltantes,
        controlCalidadPendiente
      }
    };
  } catch (error) {
    logger.error('Error en job de alertas de fabricación', {
      job: 'alertasFabricacion',
      error: error.message,
      stack: error.stack
    });

    throw error;
  }
}

module.exports = alertasFabricacion;

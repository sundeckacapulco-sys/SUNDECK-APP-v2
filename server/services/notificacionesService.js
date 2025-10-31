const Recordatorio = require('../models/Recordatorio');
const Usuario = require('../models/Usuario');
const logger = require('../config/logger');

class NotificacionesService {

  /**
   * Crear notificaciones automáticas basadas en cambios de estado
   */
  async crearNotificacionesEstado(proyecto, estadoAnterior, nuevoEstado, usuarioId) {
    try {
      logger.info('Creando notificaciones automáticas por cambio de estado', {
        servicio: 'notificacionesService',
        accion: 'crearNotificacionesEstado',
        proyectoId: proyecto?._id?.toString(),
        estadoAnterior,
        nuevoEstado,
        usuarioId: usuarioId?.toString()
      });

      const notificaciones = [];

      // Notificaciones según el nuevo estado
      switch (nuevoEstado) {
        case 'cotizacion':
          notificaciones.push(
            await this.crearNotificacion({
              tipo: 'cotizacion_pendiente',
              titulo: 'Cotización pendiente de envío',
              mensaje: `El proyecto ${proyecto._id} requiere envío de cotización al cliente ${proyecto.cliente.nombre}`,
              proyectoId: proyecto._id,
              prioridad: 'media',
              fechaVencimiento: this.calcularFechaVencimiento(2), // 2 días
              usuarioAsignado: proyecto.asesor_asignado || usuarioId
            })
          );
          break;

        case 'aprobado':
          notificaciones.push(
            await this.crearNotificacion({
              tipo: 'pedido_confirmado',
              titulo: 'Pedido confirmado - Iniciar fabricación',
              mensaje: `El proyecto ${proyecto._id} ha sido aprobado. Proceder con orden de fabricación`,
              proyectoId: proyecto._id,
              prioridad: 'alta',
              fechaVencimiento: this.calcularFechaVencimiento(1), // 1 día
              usuarioAsignado: await this.obtenerCoordinadorFabricacion()
            })
          );
          break;

        case 'fabricacion':
          notificaciones.push(
            await this.crearNotificacion({
              tipo: 'fabricacion_iniciada',
              titulo: 'Fabricación en proceso',
              mensaje: `Fabricación iniciada para proyecto ${proyecto._id}. Seguimiento requerido`,
              proyectoId: proyecto._id,
              prioridad: 'media',
              fechaVencimiento: this.calcularFechaVencimiento(7), // 7 días
              usuarioAsignado: await this.obtenerCoordinadorFabricacion()
            })
          );
          break;

        case 'instalacion':
          notificaciones.push(
            await this.crearNotificacion({
              tipo: 'instalacion_programar',
              titulo: 'Programar instalación',
              mensaje: `Proyecto ${proyecto._id} listo para instalación. Contactar cliente para programar`,
              proyectoId: proyecto._id,
              prioridad: 'alta',
              fechaVencimiento: this.calcularFechaVencimiento(2), // 2 días
              usuarioAsignado: await this.obtenerCoordinadorInstalacion()
            })
          );
          break;

        case 'completado':
          notificaciones.push(
            await this.crearNotificacion({
              tipo: 'proyecto_completado',
              titulo: 'Proyecto completado - Seguimiento postventa',
              mensaje: `Proyecto ${proyecto._id} completado exitosamente. Programar seguimiento postventa`,
              proyectoId: proyecto._id,
              prioridad: 'baja',
              fechaVencimiento: this.calcularFechaVencimiento(30), // 30 días
              usuarioAsignado: proyecto.asesor_asignado || usuarioId
            })
          );
          break;
      }

      // Notificaciones especiales basadas en tiempo
      await this.crearNotificacionesTiempo(proyecto, nuevoEstado);

      logger.info('Notificaciones por cambio de estado generadas', {
        servicio: 'notificacionesService',
        accion: 'crearNotificacionesEstado',
        proyectoId: proyecto?._id?.toString(),
        totalNotificaciones: notificaciones.length,
        nuevoEstado
      });
      return notificaciones;

    } catch (error) {
      logger.error('Error creando notificaciones automáticas', {
        servicio: 'notificacionesService',
        accion: 'crearNotificacionesEstado',
        proyectoId: proyecto?._id?.toString(),
        estadoAnterior,
        nuevoEstado,
        usuarioId: usuarioId?.toString(),
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Crear notificaciones basadas en tiempo transcurrido
   */
  async crearNotificacionesTiempo(proyecto, estado) {
    try {
      const ahora = new Date();
      const diasTranscurridos = Math.floor((ahora - proyecto.fecha_creacion) / (1000 * 60 * 60 * 24));

      // Notificaciones de escalamiento por tiempo
      if (estado === 'cotizacion' && diasTranscurridos >= 3) {
        await this.crearNotificacion({
          tipo: 'cotizacion_vencida',
          titulo: 'Cotización sin respuesta - Escalamiento',
          mensaje: `La cotización del proyecto ${proyecto._id} lleva ${diasTranscurridos} días sin respuesta`,
          proyectoId: proyecto._id,
          prioridad: 'alta',
          fechaVencimiento: this.calcularFechaVencimiento(1),
          usuarioAsignado: await this.obtenerSupervisorVentas()
        });
      }

      if (estado === 'fabricacion' && diasTranscurridos >= 15) {
        await this.crearNotificacion({
          tipo: 'fabricacion_retrasada',
          titulo: 'Fabricación retrasada - Revisión requerida',
          mensaje: `La fabricación del proyecto ${proyecto._id} lleva ${diasTranscurridos} días. Revisar estado`,
          proyectoId: proyecto._id,
          prioridad: 'alta',
          fechaVencimiento: this.calcularFechaVencimiento(1),
          usuarioAsignado: await this.obtenerGerenteFabricacion()
        });
      }

    } catch (error) {
      logger.error('Error creando notificaciones basadas en tiempo', {
        servicio: 'notificacionesService',
        accion: 'crearNotificacionesTiempo',
        proyectoId: proyecto?._id?.toString(),
        estado,
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Crear recordatorio/notificación individual
   */
  async crearNotificacion(datos) {
    try {
      const nuevoRecordatorio = new Recordatorio({
        tipo: datos.tipo,
        titulo: datos.titulo,
        mensaje: datos.mensaje,
        proyectoId: datos.proyectoId,
        usuarioAsignado: datos.usuarioAsignado,
        prioridad: datos.prioridad || 'media',
        fechaVencimiento: datos.fechaVencimiento,
        estado: 'pendiente',
        categoria: 'proyecto_automatico',
        metadatos: {
          estadoProyecto: datos.estadoProyecto,
          tipoNotificacion: datos.tipo,
          generadoAutomaticamente: true
        }
      });

      await nuevoRecordatorio.save();
      logger.info('Notificación individual creada', {
        servicio: 'notificacionesService',
        accion: 'crearNotificacion',
        recordatorioId: nuevoRecordatorio?._id?.toString(),
        proyectoId: datos.proyectoId?.toString?.() || datos.proyectoId,
        tipo: datos.tipo,
        titulo: datos.titulo
      });

      return nuevoRecordatorio;

    } catch (error) {
      logger.error('Error creando notificación individual', {
        servicio: 'notificacionesService',
        accion: 'crearNotificacion',
        proyectoId: datos.proyectoId?.toString?.() || datos.proyectoId,
        tipo: datos.tipo,
        titulo: datos.titulo,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Enviar notificaciones por email (implementación básica)
   */
  async enviarNotificacionEmail(notificacion) {
    try {
      // Aquí se integraría con el servicio de email existente
      logger.info('Notificación por email enviada', {
        servicio: 'notificacionesService',
        accion: 'enviarNotificacionEmail',
        recordatorioId: notificacion?._id?.toString(),
        titulo: notificacion?.titulo,
        destinatario: notificacion?.usuarioAsignado?.toString?.()
      });
      
      // Ejemplo de integración:
      // const emailService = require('./emailService');
      // await emailService.enviarEmail({
      //   to: usuario.email,
      //   subject: notificacion.titulo,
      //   body: notificacion.mensaje
      // });

    } catch (error) {
      logger.error('Error enviando notificación por email', {
        servicio: 'notificacionesService',
        accion: 'enviarNotificacionEmail',
        recordatorioId: notificacion?._id?.toString(),
        titulo: notificacion?.titulo,
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Crear notificaciones de seguimiento automático
   */
  async crearSeguimientoAutomatico(proyecto) {
    try {
      const seguimientos = [];

      // Seguimiento a los 7 días si no hay progreso
      seguimientos.push(
        await this.programarSeguimiento({
          proyectoId: proyecto._id,
          titulo: 'Seguimiento semanal de proyecto',
          mensaje: `Revisar progreso del proyecto ${proyecto._id} - ${proyecto.cliente.nombre}`,
          diasEspera: 7,
          tipo: 'seguimiento_semanal'
        })
      );

      // Seguimiento a los 15 días para proyectos en fabricación
      if (proyecto.estado === 'fabricacion') {
        seguimientos.push(
          await this.programarSeguimiento({
            proyectoId: proyecto._id,
            titulo: 'Revisión de fabricación',
            mensaje: `Verificar estado de fabricación del proyecto ${proyecto._id}`,
            diasEspera: 15,
            tipo: 'revision_fabricacion'
          })
        );
      }

      return seguimientos;

    } catch (error) {
      logger.error('Error creando seguimiento automático', {
        servicio: 'notificacionesService',
        accion: 'crearSeguimientoAutomatico',
        proyectoId: proyecto?._id?.toString(),
        estadoProyecto: proyecto?.estado,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Programar seguimiento futuro
   */
  async programarSeguimiento(datos) {
    const fechaVencimiento = new Date();
    fechaVencimiento.setDate(fechaVencimiento.getDate() + datos.diasEspera);

    return await this.crearNotificacion({
      tipo: datos.tipo,
      titulo: datos.titulo,
      mensaje: datos.mensaje,
      proyectoId: datos.proyectoId,
      prioridad: 'media',
      fechaVencimiento,
      usuarioAsignado: await this.obtenerResponsableProyecto(datos.proyectoId)
    });
  }

  /**
   * Obtener notificaciones pendientes para un usuario
   */
  async obtenerNotificacionesPendientes(usuarioId) {
    try {
      const notificaciones = await Recordatorio.find({
        usuarioAsignado: usuarioId,
        estado: 'pendiente',
        fechaVencimiento: { $lte: new Date() }
      })
      .populate('proyectoId', 'cliente estado')
      .sort({ prioridad: -1, fechaVencimiento: 1 })
      .limit(50);

      return notificaciones;

    } catch (error) {
      logger.error('Error obteniendo notificaciones pendientes', {
        servicio: 'notificacionesService',
        accion: 'obtenerNotificacionesPendientes',
        usuarioId: usuarioId?.toString(),
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  // Funciones auxiliares

  calcularFechaVencimiento(dias) {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + dias);
    return fecha;
  }

  async obtenerCoordinadorFabricacion() {
    try {
      const coordinador = await Usuario.findOne({ 
        rol: 'coordinador_fabricacion',
        activo: true 
      });
      return coordinador?._id || null;
    } catch (error) {
      return null;
    }
  }

  async obtenerCoordinadorInstalacion() {
    try {
      const coordinador = await Usuario.findOne({ 
        rol: 'coordinador_instalacion',
        activo: true 
      });
      return coordinador?._id || null;
    } catch (error) {
      return null;
    }
  }

  async obtenerSupervisorVentas() {
    try {
      const supervisor = await Usuario.findOne({ 
        rol: 'supervisor_ventas',
        activo: true 
      });
      return supervisor?._id || null;
    } catch (error) {
      return null;
    }
  }

  async obtenerGerenteFabricacion() {
    try {
      const gerente = await Usuario.findOne({ 
        rol: 'gerente_fabricacion',
        activo: true 
      });
      return gerente?._id || null;
    } catch (error) {
      return null;
    }
  }

  async obtenerResponsableProyecto(proyectoId) {
    try {
      const Proyecto = require('../models/Proyecto');
      const proyecto = await Proyecto.findById(proyectoId)
        .select('asesor_asignado creado_por');
      
      return proyecto?.asesor_asignado || proyecto?.creado_por || null;
    } catch (error) {
      return null;
    }
  }
}

module.exports = new NotificacionesService();

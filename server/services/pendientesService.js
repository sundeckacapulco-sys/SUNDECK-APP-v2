/**
 * Servicio de Pendientes del Día
 * Detecta llamadas, citas, instalaciones y seguimientos programados
 */

const Proyecto = require('../models/Proyecto');
const logger = require('../config/logger');

class PendientesService {
  
  /**
   * Obtener todos los pendientes del día
   */
  static async obtenerPendientesHoy() {
    try {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const manana = new Date(hoy);
      manana.setDate(manana.getDate() + 1);
      
      logger.info('Buscando pendientes del día', {
        servicio: 'pendientesService',
        fecha: hoy.toISOString()
      });
      
      // Buscar todos los proyectos activos
      const proyectos = await Proyecto.find({
        $or: [
          { estadoComercial: { $nin: ['completado', 'cancelado', 'perdido'] } },
          { estado: { $nin: ['completado', 'cancelado'] } }
        ]
      }).lean();
      
      const pendientes = {
        llamadas: [],
        citas: [],
        instalaciones: [],
        seguimientos: [],
        fabricacion: [],
        resumen: {
          total: 0,
          urgentes: 0,
          vencidos: 0
        }
      };
      
      for (const proyecto of proyectos) {
        // 1. Llamadas programadas
        if (proyecto.proximaLlamada) {
          const fechaLlamada = new Date(proyecto.proximaLlamada);
          if (fechaLlamada >= hoy && fechaLlamada < manana) {
            pendientes.llamadas.push({
              id: proyecto._id,
              tipo: 'llamada',
              cliente: proyecto.cliente?.nombre || 'Sin nombre',
              telefono: proyecto.cliente?.telefono || '',
              hora: fechaLlamada.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
              fechaCompleta: fechaLlamada,
              motivo: proyecto.motivoLlamada || 'Seguimiento comercial',
              numero: proyecto.numero,
              prioridad: this.calcularPrioridad(fechaLlamada),
              estadoComercial: proyecto.estadoComercial
            });
          }
        }
        
        // 2. Citas programadas
        const fechaCita = proyecto.proximaCita || proyecto.fechaCita || proyecto.cita?.fecha;
        if (fechaCita) {
          const fecha = new Date(fechaCita);
          if (fecha >= hoy && fecha < manana) {
            pendientes.citas.push({
              id: proyecto._id,
              tipo: 'cita',
              cliente: proyecto.cliente?.nombre || 'Sin nombre',
              telefono: proyecto.cliente?.telefono || '',
              direccion: this.formatearDireccion(proyecto.cliente?.direccion),
              hora: fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
              fechaCompleta: fecha,
              tipoCita: proyecto.tipoCita || proyecto.cita?.tipo || 'Visita',
              numero: proyecto.numero,
              prioridad: this.calcularPrioridad(fecha),
              estadoComercial: proyecto.estadoComercial
            });
          }
        }
        
        // 3. Instalaciones programadas
        if (proyecto.instalacion?.programacion?.fechaProgramada) {
          const fechaInstalacion = new Date(proyecto.instalacion.programacion.fechaProgramada);
          if (fechaInstalacion >= hoy && fechaInstalacion < manana) {
            pendientes.instalaciones.push({
              id: proyecto._id,
              tipo: 'instalacion',
              cliente: proyecto.cliente?.nombre || 'Sin nombre',
              telefono: proyecto.cliente?.telefono || '',
              direccion: this.formatearDireccion(proyecto.cliente?.direccion),
              hora: proyecto.instalacion.programacion.horaInicio || '09:00',
              horaFin: proyecto.instalacion.programacion.horaFinEstimada || '',
              fechaCompleta: fechaInstalacion,
              cuadrilla: proyecto.instalacion.programacion.cuadrilla?.map(c => c.nombre).join(', ') || 'Sin asignar',
              numero: proyecto.numero,
              prioridad: 'alta',
              estadoComercial: proyecto.estadoComercial,
              productos: proyecto.levantamiento?.partidas?.length || 0
            });
          }
        }
        
        // 4. Seguimientos programados
        const fechaSeguimiento = proyecto.fechaSeguimiento || proyecto.proximoSeguimiento || proyecto.seguimiento?.fecha;
        if (fechaSeguimiento) {
          const fecha = new Date(fechaSeguimiento);
          if (fecha >= hoy && fecha < manana) {
            pendientes.seguimientos.push({
              id: proyecto._id,
              tipo: 'seguimiento',
              cliente: proyecto.cliente?.nombre || 'Sin nombre',
              telefono: proyecto.cliente?.telefono || '',
              fechaCompleta: fecha,
              accion: proyecto.accionSeguimiento || proyecto.seguimiento?.accion || 'Dar seguimiento',
              notas: proyecto.notasSeguimiento || proyecto.seguimiento?.notas || '',
              numero: proyecto.numero,
              prioridad: this.calcularPrioridad(fecha),
              estadoComercial: proyecto.estadoComercial,
              diasSinContacto: this.calcularDiasSinContacto(proyecto)
            });
          }
        }
        
        // 5. Fabricación en situación crítica o retrasada
        if (proyecto.fabricacion?.estado === 'situacion_critica' || 
            proyecto.fabricacion?.alertaCritica) {
          pendientes.fabricacion.push({
            id: proyecto._id,
            tipo: 'fabricacion_critica',
            cliente: proyecto.cliente?.nombre || 'Sin nombre',
            numero: proyecto.numero,
            estado: proyecto.fabricacion.estado,
            prioridad: 'urgente',
            mensaje: 'Situación crítica en fabricación',
            fechaAlerta: proyecto.fabricacion.fechaAlertaCritica
          });
        }
      }
      
      // Calcular resumen
      const todosPendientes = [
        ...pendientes.llamadas,
        ...pendientes.citas,
        ...pendientes.instalaciones,
        ...pendientes.seguimientos,
        ...pendientes.fabricacion
      ];
      
      pendientes.resumen.total = todosPendientes.length;
      pendientes.resumen.urgentes = todosPendientes.filter(p => p.prioridad === 'urgente' || p.prioridad === 'alta').length;
      pendientes.resumen.vencidos = todosPendientes.filter(p => {
        if (!p.fechaCompleta) return false;
        return new Date(p.fechaCompleta) < new Date();
      }).length;
      
      // Ordenar por hora
      pendientes.llamadas.sort((a, b) => new Date(a.fechaCompleta) - new Date(b.fechaCompleta));
      pendientes.citas.sort((a, b) => new Date(a.fechaCompleta) - new Date(b.fechaCompleta));
      pendientes.instalaciones.sort((a, b) => a.hora.localeCompare(b.hora));
      pendientes.seguimientos.sort((a, b) => new Date(a.fechaCompleta) - new Date(b.fechaCompleta));
      
      logger.info('Pendientes del día obtenidos', {
        servicio: 'pendientesService',
        llamadas: pendientes.llamadas.length,
        citas: pendientes.citas.length,
        instalaciones: pendientes.instalaciones.length,
        seguimientos: pendientes.seguimientos.length,
        fabricacion: pendientes.fabricacion.length,
        total: pendientes.resumen.total
      });
      
      return pendientes;
      
    } catch (error) {
      logger.error('Error obteniendo pendientes del día', {
        servicio: 'pendientesService',
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
  
  /**
   * Obtener pendientes de la semana
   */
  static async obtenerPendientesSemana() {
    try {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const finSemana = new Date(hoy);
      finSemana.setDate(finSemana.getDate() + 7);
      
      const proyectos = await Proyecto.find({
        $or: [
          { proximaLlamada: { $gte: hoy, $lt: finSemana } },
          { proximaCita: { $gte: hoy, $lt: finSemana } },
          { fechaCita: { $gte: hoy, $lt: finSemana } },
          { 'instalacion.programacion.fechaProgramada': { $gte: hoy, $lt: finSemana } },
          { fechaSeguimiento: { $gte: hoy, $lt: finSemana } },
          { proximoSeguimiento: { $gte: hoy, $lt: finSemana } }
        ]
      }).lean();
      
      // Agrupar por día
      const pendientesPorDia = {};
      
      for (let i = 0; i < 7; i++) {
        const dia = new Date(hoy);
        dia.setDate(dia.getDate() + i);
        const key = dia.toISOString().split('T')[0];
        pendientesPorDia[key] = {
          fecha: dia,
          diaSemana: dia.toLocaleDateString('es-MX', { weekday: 'long' }),
          pendientes: []
        };
      }
      
      // Procesar proyectos y asignar a días
      for (const proyecto of proyectos) {
        const fechas = [
          { fecha: proyecto.proximaLlamada, tipo: 'llamada' },
          { fecha: proyecto.proximaCita || proyecto.fechaCita, tipo: 'cita' },
          { fecha: proyecto.instalacion?.programacion?.fechaProgramada, tipo: 'instalacion' },
          { fecha: proyecto.fechaSeguimiento || proyecto.proximoSeguimiento, tipo: 'seguimiento' }
        ];
        
        for (const { fecha, tipo } of fechas) {
          if (fecha) {
            const key = new Date(fecha).toISOString().split('T')[0];
            if (pendientesPorDia[key]) {
              pendientesPorDia[key].pendientes.push({
                id: proyecto._id,
                tipo,
                cliente: proyecto.cliente?.nombre || 'Sin nombre',
                numero: proyecto.numero,
                hora: new Date(fecha).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
              });
            }
          }
        }
      }
      
      return pendientesPorDia;
      
    } catch (error) {
      logger.error('Error obteniendo pendientes de la semana', {
        servicio: 'pendientesService',
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Marcar pendiente como atendido
   */
  static async marcarAtendido(proyectoId, tipoPendiente, notas = '') {
    try {
      const proyecto = await Proyecto.findById(proyectoId);
      
      if (!proyecto) {
        throw new Error('Proyecto no encontrado');
      }
      
      const ahora = new Date();
      
      switch (tipoPendiente) {
        case 'llamada':
          proyecto.ultimaLlamada = ahora;
          proyecto.proximaLlamada = null;
          proyecto.historialLlamadas = proyecto.historialLlamadas || [];
          proyecto.historialLlamadas.push({
            fecha: ahora,
            notas: notas,
            resultado: 'completada'
          });
          break;
          
        case 'cita':
          proyecto.ultimaCita = ahora;
          proyecto.proximaCita = null;
          proyecto.fechaCita = null;
          break;
          
        case 'seguimiento':
          proyecto.ultimoSeguimiento = ahora;
          proyecto.fechaSeguimiento = null;
          proyecto.proximoSeguimiento = null;
          break;
          
        case 'instalacion':
          if (proyecto.instalacion) {
            proyecto.instalacion.estado = 'completada';
            proyecto.instalacion.fechaReal = ahora;
          }
          break;
      }
      
      // Registrar en historial
      if (!proyecto.historialActividades) {
        proyecto.historialActividades = [];
      }
      proyecto.historialActividades.push({
        tipo: tipoPendiente,
        fecha: ahora,
        accion: 'atendido',
        notas: notas
      });
      
      await proyecto.save();
      
      logger.info('Pendiente marcado como atendido', {
        servicio: 'pendientesService',
        proyectoId,
        tipoPendiente
      });
      
      return { success: true, mensaje: 'Pendiente marcado como atendido' };
      
    } catch (error) {
      logger.error('Error marcando pendiente como atendido', {
        servicio: 'pendientesService',
        proyectoId,
        tipoPendiente,
        error: error.message
      });
      throw error;
    }
  }
  
  // Helpers
  
  static formatearDireccion(direccion) {
    if (!direccion) return '';
    if (typeof direccion === 'string') return direccion;
    return [
      direccion.calle,
      direccion.colonia,
      direccion.ciudad
    ].filter(Boolean).join(', ');
  }
  
  static calcularPrioridad(fecha) {
    const ahora = new Date();
    const diff = new Date(fecha) - ahora;
    const horas = diff / (1000 * 60 * 60);
    
    if (horas < 0) return 'urgente'; // Vencido
    if (horas < 1) return 'alta';     // Menos de 1 hora
    if (horas < 3) return 'media';    // Menos de 3 horas
    return 'normal';
  }
  
  static calcularDiasSinContacto(proyecto) {
    const ultimoContacto = proyecto.ultimaLlamada || proyecto.ultimaCita || proyecto.ultimoSeguimiento || proyecto.updatedAt;
    if (!ultimoContacto) return 0;
    
    const diff = new Date() - new Date(ultimoContacto);
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }
}

module.exports = PendientesService;

const Proyecto = require('../models/Proyecto');
const logger = require('../config/logger');

const MS_POR_DIA = 24 * 60 * 60 * 1000;

const normalizarString = (valor = '') => (typeof valor === 'string' ? valor.toLowerCase() : '');

class AlertasInteligentesService {
  constructor() {
    this.umbralProspectos = 5; // días
    this.umbralProyectos = 10; // días
  }

  async obtenerProspectosInactivos({ diasInactividad = this.umbralProspectos, limite = 100 } = {}) {
    const limiteFecha = new Date(Date.now() - diasInactividad * MS_POR_DIA);

    const prospectos = await Proyecto.find({
      tipo: 'prospecto',
      estadoComercial: { $in: ['en seguimiento', 'cotizado', 'sin respuesta'] },
      $or: [
        { ultimaNota: { $lt: limiteFecha } },
        { ultimaNota: null }
      ]
    })
      .populate('asesorComercial', 'nombre email telefono')
      .lean();

    return prospectos.slice(0, limite).map((prospecto) => this.formatearProspectoInactivo(prospecto, diasInactividad));
  }

  async obtenerProyectosSinMovimiento({ diasInactividad = this.umbralProyectos, limite = 100 } = {}) {
    const limiteFecha = new Date(Date.now() - diasInactividad * MS_POR_DIA);

    const proyectos = await Proyecto.find({
      tipo: 'proyecto',
      estado: { $nin: ['completado', 'cancelado'] },
      fecha_actualizacion: { $lt: limiteFecha }
    })
      .populate('asesor_asignado', 'nombre email telefono')
      .populate('cliente')
      .lean();

    return proyectos.slice(0, limite).map((proyecto) => this.formatearProyectoSinMovimiento(proyecto, diasInactividad));
  }

  formatearProspectoInactivo(prospecto, diasInactividad) {
    const ultimaNota = prospecto.ultimaNota ? new Date(prospecto.ultimaNota) : null;
    const fechaReferencia = ultimaNota || prospecto.fecha_actualizacion || prospecto.createdAt || new Date();
    const diasSinNota = Math.floor((Date.now() - new Date(fechaReferencia).getTime()) / MS_POR_DIA);

    const prioridad = diasSinNota >= diasInactividad * 2 ? 'critica' : 'importante';

    return {
      id: prospecto._id?.toString(),
      numero: prospecto.numero,
      tipo: 'prospecto_inactivo',
      prioridad,
      diasInactividad: diasSinNota,
      umbral: diasInactividad,
      ultimaNota: ultimaNota ? ultimaNota.toISOString() : null,
      cliente: {
        nombre: prospecto.cliente?.nombre || 'Cliente sin nombre',
        telefono: prospecto.cliente?.telefono || 'Sin teléfono',
        email: prospecto.cliente?.correo || null
      },
      responsable: this.obtenerDatosResponsable(prospecto.asesorComercial),
      estadoComercial: prospecto.estadoComercial,
      createdAt: prospecto.createdAt,
      actualizadoEn: prospecto.fecha_actualizacion,
      resumen: `${diasSinNota >= 0 ? diasSinNota : 0} día(s) sin nota registrada`,
      acciones: [
        { tipo: 'agendar_llamada', etiqueta: 'Agendar llamada' },
        { tipo: 'registrar_nota', etiqueta: 'Registrar nota' },
        { tipo: 'abrir_prospecto', etiqueta: 'Ver prospecto' }
      ]
    };
  }

  formatearProyectoSinMovimiento(proyecto, diasInactividad) {
    const fechaActualizacion = proyecto.fecha_actualizacion ? new Date(proyecto.fecha_actualizacion) : new Date();
    const diasSinMovimiento = Math.floor((Date.now() - fechaActualizacion.getTime()) / MS_POR_DIA);
    const prioridad = diasSinMovimiento >= diasInactividad * 2 ? 'critica' : 'importante';

    return {
      id: proyecto._id?.toString(),
      numero: proyecto.numero,
      tipo: 'proyecto_sin_movimiento',
      prioridad,
      diasInactividad: diasSinMovimiento,
      umbral: diasInactividad,
      ultimaActualizacion: fechaActualizacion.toISOString(),
      cliente: {
        nombre: proyecto.cliente?.nombre || 'Cliente sin nombre',
        telefono: proyecto.cliente?.telefono || 'Sin teléfono'
      },
      responsable: this.obtenerDatosResponsable(proyecto.asesor_asignado),
      estado: proyecto.estado,
      estadoComercial: proyecto.estadoComercial,
      etapa: proyecto.estado,
      resumen: `${diasSinMovimiento >= 0 ? diasSinMovimiento : 0} día(s) sin actualización de estado`,
      acciones: [
        { tipo: 'actualizar_estado', etiqueta: 'Actualizar estado' },
        { tipo: 'registrar_avance', etiqueta: 'Registrar avance' },
        { tipo: 'abrir_proyecto', etiqueta: 'Ver proyecto' }
      ]
    };
  }

  obtenerDatosResponsable(responsable) {
    if (!responsable) {
      return {
        id: null,
        nombre: 'Sin asignar',
        email: null,
        telefono: null
      };
    }

    return {
      id: responsable._id?.toString?.() || responsable.id || null,
      nombre: responsable.nombre || responsable,
      email: responsable.email || null,
      telefono: responsable.telefono || null
    };
  }

  async generarPanel({ limitePorCategoria = 6 } = {}) {
    const [prospectos, proyectos] = await Promise.all([
      this.obtenerProspectosInactivos({ limite: limitePorCategoria * 2 }),
      this.obtenerProyectosSinMovimiento({ limite: limitePorCategoria * 2 })
    ]);

    await this.actualizarEstadosAutomaticos({ prospectosInactivos: prospectos, proyectosSinMovimiento: proyectos });

    const categorias = [];

    categorias.push({
      tipo: 'prospectos_inactivos',
      titulo: 'Prospectos sin seguimiento',
      descripcion: `Sin nota en los últimos ${this.umbralProspectos} días`,
      prioridad: 'alta',
      total: prospectos.length,
      items: prospectos.slice(0, limitePorCategoria)
    });

    categorias.push({
      tipo: 'proyectos_sin_movimiento',
      titulo: 'Proyectos sin movimiento',
      descripcion: `Sin actualización en ${this.umbralProyectos} días`,
      prioridad: 'alta',
      total: proyectos.length,
      items: proyectos.slice(0, limitePorCategoria)
    });

    const resumen = {
      total: prospectos.length + proyectos.length,
      prospectosInactivos: prospectos.length,
      proyectosSinMovimiento: proyectos.length
    };

    logger.info('Panel de alertas inteligentes generado', {
      servicio: 'alertasInteligentes',
      resumen,
      limite: limitePorCategoria
    });

    return {
      generadoEn: new Date().toISOString(),
      resumen,
      categorias
    };
  }

  async actualizarEstadosAutomaticos({ prospectosInactivos = [], proyectosSinMovimiento = [] } = {}) {
    const prospectoIds = prospectosInactivos
      .filter((prospecto) => ['en seguimiento', 'cotizado', 'contactado'].includes(prospecto.estadoComercial))
      .map((prospecto) => prospecto.id)
      .filter(Boolean);

    if (prospectoIds.length > 0) {
      const resultado = await Proyecto.updateMany(
        {
          _id: { $in: prospectoIds },
          estadoComercial: { $in: ['en seguimiento', 'cotizado', 'contactado'] }
        },
        {
          $set: { estadoComercial: 'sin respuesta' }
        }
      );

      if (resultado.modifiedCount > 0) {
        logger.info('Estados comerciales actualizados automáticamente por inactividad', {
          servicio: 'alertasInteligentes',
          tipo: 'prospectos',
          modificados: resultado.modifiedCount
        });
      }
    }

    const proyectoIds = proyectosSinMovimiento
      .filter((proyecto) => !['completado', 'cancelado'].includes(normalizarString(proyecto.estado)))
      .map((proyecto) => proyecto.id)
      .filter(Boolean);

    if (proyectoIds.length > 0) {
      const resultado = await Proyecto.updateMany(
        {
          _id: { $in: proyectoIds },
          estado: { $nin: ['completado', 'cancelado'] }
        },
        {
          $set: { estadoComercial: 'pausado' }
        }
      );

      if (resultado.modifiedCount > 0) {
        logger.info('Estados comerciales de proyectos actualizados por falta de movimiento', {
          servicio: 'alertasInteligentes',
          tipo: 'proyectos',
          modificados: resultado.modifiedCount
        });
      }
    }
  }
}

module.exports = new AlertasInteligentesService();

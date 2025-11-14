const Proyecto = require('../models/Proyecto');
const logger = require('../config/logger');

const MS_POR_DIA = 24 * 60 * 60 * 1000;

const prioridadAColor = {
  critica: '#DC2626',
  alta: '#F59E0B',
  importante: '#EA580C'
};

const normalizarString = (valor = '') => (typeof valor === 'string' ? valor.trim() : '');

class AlertasFabricacionService {
  constructor() {
    const umbralRetraso = Number.parseInt(process.env.ALERTAS_FABRICACION_UMBRAL_RETRASO, 10);
    const umbralCalidad = Number.parseInt(process.env.ALERTAS_FABRICACION_UMBRAL_CALIDAD, 10);

    this.umbralRetrasoDias = Number.isFinite(umbralRetraso) && umbralRetraso > 0 ? umbralRetraso : 3;
    this.umbralControlCalidadDias = Number.isFinite(umbralCalidad) && umbralCalidad > 0 ? umbralCalidad : 1;
  }

  async obtenerOrdenesRetrasadas({ diasUmbral = this.umbralRetrasoDias, limite = 50 } = {}) {
    const fechaLimite = new Date(Date.now() - diasUmbral * MS_POR_DIA);

    logger.info('Buscando órdenes de fabricación retrasadas', {
      servicio: 'alertasFabricacion',
      metodo: 'obtenerOrdenesRetrasadas',
      diasUmbral,
      fechaLimite
    });

    const proyectos = await Proyecto.find({
      estado: 'fabricacion',
      'cronograma.fechaFinFabricacionEstimada': { $lt: fechaLimite },
      $or: [
        { 'cronograma.fechaFinFabricacionReal': { $exists: false } },
        { 'cronograma.fechaFinFabricacionReal': null }
      ]
    })
      .populate('fabricacion.asignadoA', 'nombre email telefono')
      .populate('asesor_asignado', 'nombre email telefono')
      .populate('cliente', 'nombre telefono correo')
      .lean();

    const retrasadas = proyectos
      .map((proyecto) => this.formatearOrdenRetrasada(proyecto, diasUmbral))
      .filter(Boolean)
      .slice(0, limite);

    logger.info('Órdenes de fabricación retrasadas detectadas', {
      servicio: 'alertasFabricacion',
      metodo: 'obtenerOrdenesRetrasadas',
      total: retrasadas.length
    });

    return retrasadas;
  }

  async obtenerMaterialesFaltantes({ limite = 50 } = {}) {
    logger.info('Buscando materiales faltantes en fabricación', {
      servicio: 'alertasFabricacion',
      metodo: 'obtenerMaterialesFaltantes'
    });

    const proyectos = await Proyecto.find({
      estado: { $in: ['aprobado', 'fabricacion'] },
      'fabricacion.materiales': {
        $elemMatch: {
          $or: [
            { disponible: { $exists: false } },
            { disponible: false }
          ]
        }
      }
    })
      .populate('fabricacion.asignadoA', 'nombre email telefono')
      .populate('asesor_asignado', 'nombre email telefono')
      .populate('cliente', 'nombre telefono correo')
      .lean();

    const materiales = proyectos
      .map((proyecto) => this.formatearMaterialFaltante(proyecto))
      .filter((alerta) => alerta?.materialesPendientes?.length > 0)
      .slice(0, limite);

    logger.info('Materiales faltantes detectados', {
      servicio: 'alertasFabricacion',
      metodo: 'obtenerMaterialesFaltantes',
      total: materiales.length
    });

    return materiales;
  }

  async obtenerCalidadPendiente({ diasUmbral = this.umbralControlCalidadDias, limite = 50 } = {}) {
    logger.info('Verificando control de calidad pendiente', {
      servicio: 'alertasFabricacion',
      metodo: 'obtenerCalidadPendiente',
      diasUmbral
    });

    const proyectos = await Proyecto.find({
      'fabricacion.estado': 'terminado',
      $or: [
        { 'fabricacion.controlCalidad.realizado': { $exists: false } },
        { 'fabricacion.controlCalidad.realizado': false }
      ]
    })
      .populate('fabricacion.asignadoA', 'nombre email telefono')
      .populate('asesor_asignado', 'nombre email telefono')
      .populate('cliente', 'nombre telefono correo')
      .lean();

    const pendientes = proyectos
      .map((proyecto) => this.formatearCalidadPendiente(proyecto, diasUmbral))
      .filter(Boolean)
      .slice(0, limite);

    logger.info('Controles de calidad pendientes detectados', {
      servicio: 'alertasFabricacion',
      metodo: 'obtenerCalidadPendiente',
      total: pendientes.length
    });

    return pendientes;
  }

  async obtenerTodasLasAlertas({
    limitePorCategoria = 50,
    diasUmbralRetraso,
    diasUmbralCalidad
  } = {}) {
    const umbralRetraso = Number.isFinite(diasUmbralRetraso) && diasUmbralRetraso > 0
      ? diasUmbralRetraso
      : this.umbralRetrasoDias;
    const umbralCalidad = Number.isFinite(diasUmbralCalidad) && diasUmbralCalidad > 0
      ? diasUmbralCalidad
      : this.umbralControlCalidadDias;

    logger.info('Obteniendo alertas completas de fabricación', {
      servicio: 'alertasFabricacion',
      metodo: 'obtenerTodasLasAlertas',
      limitePorCategoria,
      umbralRetraso,
      umbralCalidad
    });

    const [ordenesRetrasadas, materialesFaltantes, controlCalidadPendiente] = await Promise.all([
      this.obtenerOrdenesRetrasadas({ diasUmbral: umbralRetraso, limite: limitePorCategoria }),
      this.obtenerMaterialesFaltantes({ limite: limitePorCategoria }),
      this.obtenerCalidadPendiente({ diasUmbral: umbralCalidad, limite: limitePorCategoria })
    ]);

    const categorias = [
      {
        tipo: 'fabricacion_retrasada',
        titulo: 'Órdenes de fabricación retrasadas',
        descripcion: `Retraso superior a ${umbralRetraso} día(s) en la fecha estimada de finalización`,
        prioridad: 'critica',
        color: prioridadAColor.critica,
        total: ordenesRetrasadas.length,
        items: ordenesRetrasadas
      },
      {
        tipo: 'materiales_faltantes',
        titulo: 'Materiales faltantes',
        descripcion: 'Órdenes con materiales pendientes por recibir o confirmar',
        prioridad: 'alta',
        color: prioridadAColor.alta,
        total: materialesFaltantes.length,
        items: materialesFaltantes
      },
      {
        tipo: 'calidad_pendiente',
        titulo: 'Control de calidad pendiente',
        descripcion: `Órdenes terminadas sin revisión en ${umbralCalidad}+ día(s)`,
        prioridad: 'importante',
        color: prioridadAColor.importante,
        total: controlCalidadPendiente.length,
        items: controlCalidadPendiente
      }
    ];

    const resumen = {
      total: ordenesRetrasadas.length + materialesFaltantes.length + controlCalidadPendiente.length,
      ordenesRetrasadas: ordenesRetrasadas.length,
      materialesFaltantes: materialesFaltantes.length,
      controlCalidadPendiente: controlCalidadPendiente.length
    };

    const alertas = categorias.flatMap((categoria) =>
      categoria.items.map((item) => ({ ...item, categoria: categoria.tipo }))
    );

    logger.info('Alertas completas de fabricación generadas', {
      servicio: 'alertasFabricacion',
      metodo: 'obtenerTodasLasAlertas',
      resumen
    });

    return {
      generadoEn: new Date().toISOString(),
      resumen,
      categorias,
      alertas
    };
  }

  async generarPanelFabricacion({ limitePorCategoria = 6 } = {}) {
    logger.info('Generando panel de alertas de fabricación', {
      servicio: 'alertasFabricacion',
      metodo: 'generarPanelFabricacion',
      limitePorCategoria
    });

    const panel = await this.obtenerTodasLasAlertas({ limitePorCategoria: limitePorCategoria * 2 });

    const categorias = panel.categorias.map((categoria) => ({
      ...categoria,
      items: categoria.items.slice(0, limitePorCategoria)
    }));

    const resumen = {
      total: categorias.reduce((acc, categoria) => acc + categoria.total, 0),
      ordenesRetrasadas: categorias.find((c) => c.tipo === 'fabricacion_retrasada')?.total || 0,
      materialesFaltantes: categorias.find((c) => c.tipo === 'materiales_faltantes')?.total || 0,
      controlCalidadPendiente: categorias.find((c) => c.tipo === 'calidad_pendiente')?.total || 0
    };

    logger.info('Panel de alertas de fabricación generado', {
      servicio: 'alertasFabricacion',
      metodo: 'generarPanelFabricacion',
      resumen
    });

    return {
      generadoEn: panel.generadoEn,
      resumen,
      categorias
    };
  }

  formatearOrdenRetrasada(proyecto, diasUmbral) {
    const fechaEstimada = this.obtenerFecha(proyecto?.cronograma?.fechaFinFabricacionEstimada);
    if (!fechaEstimada) {
      return null;
    }

    const diasRetraso = this.calcularDiasDiferencia(fechaEstimada, new Date());
    if (diasRetraso < diasUmbral) {
      return null;
    }

    return {
      id: proyecto?._id?.toString(),
      numero: proyecto?.numero,
      prioridad: 'critica',
      tipo: 'fabricacion_retrasada',
      diasRetraso,
      umbral: diasUmbral,
      fechaEstimada: fechaEstimada.toISOString(),
      cliente: this.obtenerDatosCliente(proyecto?.cliente),
      responsable: this.obtenerDatosResponsable(proyecto?.fabricacion?.asignadoA),
      asesor: this.obtenerDatosResponsable(proyecto?.asesor_asignado),
      estadoFabricacion: normalizarString(proyecto?.fabricacion?.estado) || 'sin_estado',
      resumen: `Retraso de ${diasRetraso} día(s) respecto a la fecha estimada (${this.formatearFechaLegible(fechaEstimada)})`,
      acciones: [
        { tipo: 'actualizar_cronograma', etiqueta: 'Reprogramar fabricación' },
        { tipo: 'notificar_equipo', etiqueta: 'Notificar equipo' },
        { tipo: 'ver_proyecto', etiqueta: 'Ver proyecto' }
      ]
    };
  }

  formatearMaterialFaltante(proyecto) {
    const materialesPendientes = (proyecto?.fabricacion?.materiales || [])
      .filter((material) => material && material.disponible !== true)
      .map((material) => ({
        nombre: material.nombre,
        cantidad: material.cantidad,
        unidad: material.unidad,
        proveedor: material.proveedor,
        fechaPedido: this.obtenerFecha(material.fechaPedido)?.toISOString() || null
      }));

    if (materialesPendientes.length === 0) {
      return null;
    }

    return {
      id: proyecto?._id?.toString(),
      numero: proyecto?.numero,
      prioridad: 'alta',
      tipo: 'materiales_faltantes',
      materialesPendientes,
      cliente: this.obtenerDatosCliente(proyecto?.cliente),
      responsable: this.obtenerDatosResponsable(proyecto?.fabricacion?.asignadoA),
      asesor: this.obtenerDatosResponsable(proyecto?.asesor_asignado),
      estadoFabricacion: normalizarString(proyecto?.fabricacion?.estado) || 'sin_estado',
      resumen: `${materialesPendientes.length} material(es) pendiente(s) por confirmar disponibilidad`,
      acciones: [
        { tipo: 'solicitar_materiales', etiqueta: 'Solicitar materiales' },
        { tipo: 'actualizar_inventario', etiqueta: 'Actualizar inventario' },
        { tipo: 'ver_proyecto', etiqueta: 'Ver proyecto' }
      ]
    };
  }

  formatearCalidadPendiente(proyecto, diasUmbral) {
    const fechaTerminado = this.obtenerFecha(
      proyecto?.cronograma?.fechaFinFabricacionReal ||
        this.obtenerUltimaFechaProceso(proyecto?.fabricacion?.procesos)
    );

    if (!fechaTerminado) {
      return null;
    }

    const diasPendientes = this.calcularDiasDiferencia(fechaTerminado, new Date());
    if (diasPendientes < diasUmbral) {
      return null;
    }

    return {
      id: proyecto?._id?.toString(),
      numero: proyecto?.numero,
      prioridad: 'importante',
      tipo: 'calidad_pendiente',
      diasPendientes,
      umbral: diasUmbral,
      fechaTerminado: fechaTerminado.toISOString(),
      cliente: this.obtenerDatosCliente(proyecto?.cliente),
      responsable: this.obtenerDatosResponsable(proyecto?.fabricacion?.asignadoA),
      asesor: this.obtenerDatosResponsable(proyecto?.asesor_asignado),
      estadoFabricacion: normalizarString(proyecto?.fabricacion?.estado) || 'sin_estado',
      resumen: `Control de calidad pendiente desde hace ${diasPendientes} día(s)`,
      acciones: [
        { tipo: 'agendar_control_calidad', etiqueta: 'Agendar control de calidad' },
        { tipo: 'registrar_resultado', etiqueta: 'Registrar resultado' },
        { tipo: 'ver_proyecto', etiqueta: 'Ver proyecto' }
      ]
    };
  }

  obtenerDatosCliente(cliente) {
    if (!cliente) {
      return {
        nombre: 'Cliente sin nombre',
        telefono: 'Sin teléfono'
      };
    }

    return {
      nombre: cliente.nombre || 'Cliente sin nombre',
      telefono: cliente.telefono || 'Sin teléfono',
      email: cliente.correo || cliente.email || null
    };
  }

  obtenerDatosResponsable(usuario) {
    if (!usuario) {
      return {
        id: null,
        nombre: 'Sin asignar',
        email: null,
        telefono: null
      };
    }

    const id = usuario._id?.toString?.() || usuario.id || null;

    return {
      id,
      nombre: usuario.nombre || 'Sin asignar',
      email: usuario.email || null,
      telefono: usuario.telefono || null
    };
  }

  calcularDiasDiferencia(desde, hasta) {
    const desdeFecha = this.obtenerFecha(desde);
    const hastaFecha = this.obtenerFecha(hasta);

    if (!desdeFecha || !hastaFecha) {
      return 0;
    }

    const diferencia = hastaFecha.getTime() - desdeFecha.getTime();
    return Math.max(0, Math.floor(diferencia / MS_POR_DIA));
  }

  obtenerFecha(valor) {
    if (!valor) {
      return null;
    }

    const fecha = valor instanceof Date ? valor : new Date(valor);
    return Number.isNaN(fecha.getTime()) ? null : fecha;
  }

  obtenerUltimaFechaProceso(procesos = []) {
    if (!Array.isArray(procesos) || procesos.length === 0) {
      return null;
    }

    const fechas = procesos
      .map((proceso) => this.obtenerFecha(proceso?.fechaFin) || this.obtenerFecha(proceso?.fechaInicio))
      .filter(Boolean)
      .sort((a, b) => b.getTime() - a.getTime());

    return fechas[0] || null;
  }

  formatearFechaLegible(fecha) {
    const valida = this.obtenerFecha(fecha);
    if (!valida) {
      return 'Sin fecha';
    }

    return valida.toISOString().split('T')[0];
  }
}

module.exports = new AlertasFabricacionService();

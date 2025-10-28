const Proyecto = require('../models/Proyecto');
const Prospecto = require('../models/Prospecto');
const Cotizacion = require('../models/Cotizacion');
const mongoose = require('mongoose');

// Crear nuevo proyecto
const crearProyecto = async (req, res) => {
  try {
    const {
      cliente,
      tipo_fuente,
      observaciones,
      medidas,
      materiales,
      productos,
      fotos,
      responsable,
      monto_estimado,
      prospecto_original
    } = req.body;

    // Validar datos requeridos
    if (!cliente || !cliente.nombre || !cliente.telefono) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y teléfono del cliente son requeridos'
      });
    }

    // Crear el proyecto
    const nuevoProyecto = new Proyecto({
      cliente,
      tipo_fuente: tipo_fuente || 'simple',
      observaciones,
      medidas: medidas || [],
      materiales: materiales || [],
      productos: productos || [],
      fotos: fotos || [],
      responsable,
      monto_estimado: monto_estimado || 0,
      prospecto_original,
      creado_por: req.usuario.id,
      actualizado_por: req.usuario.id
    });

    // Calcular totales automáticamente
    nuevoProyecto.subtotal = calcularSubtotal(nuevoProyecto);
    nuevoProyecto.iva = nuevoProyecto.subtotal * 0.16;
    nuevoProyecto.total = nuevoProyecto.subtotal + nuevoProyecto.iva;

    await nuevoProyecto.save();

    // Poblar referencias para la respuesta
    await nuevoProyecto.populate([
      { path: 'creado_por', select: 'nombre email' },
      { path: 'asesor_asignado', select: 'nombre email' },
      { path: 'prospecto_original', select: 'nombre telefono' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Proyecto creado exitosamente',
      data: nuevoProyecto
    });

  } catch (error) {
    console.error('Error al crear proyecto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener todos los proyectos con filtros y paginación
const obtenerProyectos = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      estado,
      tipo_fuente,
      asesor_asignado,
      busqueda,
      fechaDesde,
      fechaHasta
    } = req.query;

    // Construir filtros
    const filtros = {};
    
    if (estado) filtros.estado = estado;
    if (tipo_fuente) filtros.tipo_fuente = tipo_fuente;
    if (asesor_asignado) filtros.asesor_asignado = asesor_asignado;
    
    if (fechaDesde || fechaHasta) {
      filtros.fecha_creacion = {};
      if (fechaDesde) filtros.fecha_creacion.$gte = new Date(fechaDesde);
      if (fechaHasta) filtros.fecha_creacion.$lte = new Date(fechaHasta);
    }

    // Búsqueda por texto
    if (busqueda) {
      filtros.$or = [
        { 'cliente.nombre': { $regex: busqueda, $options: 'i' } },
        { 'cliente.telefono': { $regex: busqueda, $options: 'i' } },
        { 'cliente.correo': { $regex: busqueda, $options: 'i' } },
        { observaciones: { $regex: busqueda, $options: 'i' } }
      ];
    }

    // Si no es admin, solo ver sus proyectos asignados
    if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'gerente') {
      filtros.$or = [
        { creado_por: req.usuario.id },
        { asesor_asignado: req.usuario.id },
        { tecnico_asignado: req.usuario.id }
      ];
    }

    const opciones = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { fecha_creacion: -1 },
      populate: [
        { path: 'creado_por', select: 'nombre email' },
        { path: 'asesor_asignado', select: 'nombre email telefono' },
        { path: 'tecnico_asignado', select: 'nombre email telefono' },
        { path: 'prospecto_original', select: 'nombre telefono email etapa' }
      ]
    };

    const proyectos = await Proyecto.paginate(filtros, opciones);

    // Calcular estadísticas adicionales para cada proyecto
    const proyectosConEstadisticas = proyectos.docs.map(proyecto => {
      const proyectoObj = proyecto.toObject();
      
      // Calcular progreso
      const estados = ['levantamiento', 'cotizacion', 'aprobado', 'fabricacion', 'instalacion', 'completado'];
      const indiceEstado = estados.indexOf(proyecto.estado);
      const progreso = indiceEstado >= 0 ? Math.round((indiceEstado / (estados.length - 1)) * 100) : 0;
      
      // Calcular totales
      const totalArea = proyecto.medidas.reduce((sum, medida) => sum + ((medida.ancho || 0) * (medida.alto || 0) * (medida.cantidad || 1)), 0);
      const totalMedidas = proyecto.medidas.length;
      
      return {
        ...proyectoObj,
        estadisticas: {
          progreso,
          totalArea: parseFloat(totalArea.toFixed(2)),
          totalMedidas,
          diasTranscurridos: Math.ceil((new Date() - new Date(proyecto.fecha_creacion)) / (1000 * 60 * 60 * 24))
        }
      };
    });

    res.json({
      success: true,
      data: {
        ...proyectos,
        docs: proyectosConEstadisticas
      }
    });

  } catch (error) {
    console.error('Error al obtener proyectos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener proyecto por ID
const obtenerProyectoPorId = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de proyecto inválido'
      });
    }

    const proyecto = await Proyecto.findById(id)
      .populate([
        { path: 'creado_por', select: 'nombre email' },
        { path: 'actualizado_por', select: 'nombre email' },
        { path: 'asesor_asignado', select: 'nombre email telefono' },
        { path: 'tecnico_asignado', select: 'nombre email telefono' },
        { path: 'prospecto_original', select: 'nombre telefono email direccion' },
        { path: 'cotizaciones', select: 'numero fecha_creacion subtotal total estado' },
        { path: 'pedidos', select: 'numero fecha_creacion total estado' },
        { path: 'ordenes_fabricacion', select: 'numero fecha_creacion estado' },
        { path: 'instalaciones', select: 'numero fecha_programada estado' }
      ]);

    if (!proyecto) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    res.json({
      success: true,
      data: proyecto
    });

  } catch (error) {
    console.error('Error al obtener proyecto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Actualizar proyecto
const actualizarProyecto = async (req, res) => {
  try {
    const { id } = req.params;
    const actualizaciones = req.body;

    console.log('🔍 [BACKEND] Actualizando proyecto:', id);
    console.log('📦 [BACKEND] Actualizaciones recibidas:', JSON.stringify(actualizaciones, null, 2));
    
    if (actualizaciones.medidas) {
      console.log('📏 [BACKEND] Medidas recibidas:', actualizaciones.medidas.length);
      if (actualizaciones.medidas.length > 0) {
        console.log('📊 [BACKEND] Primera medida:', JSON.stringify(actualizaciones.medidas[0], null, 2));
      }
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de proyecto inválido'
      });
    }

    // Agregar información de auditoría
    actualizaciones.actualizado_por = req.usuario.id;
    actualizaciones.fecha_actualizacion = new Date();

    const proyecto = await Proyecto.findByIdAndUpdate(
      id,
      actualizaciones,
      { new: true, runValidators: true }
    ).populate([
      { path: 'creado_por', select: 'nombre email' },
      { path: 'actualizado_por', select: 'nombre email' },
      { path: 'asesor_asignado', select: 'nombre email' },
      { path: 'prospecto_original', select: 'nombre telefono' }
    ]);

    if (!proyecto) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    // Recalcular totales si se actualizaron productos o materiales
    if (actualizaciones.productos || actualizaciones.materiales || actualizaciones.medidas) {
      proyecto.subtotal = calcularSubtotal(proyecto);
      proyecto.iva = proyecto.subtotal * 0.16;
      proyecto.total = proyecto.subtotal + proyecto.iva;
      await proyecto.save();
    }

    console.log('✅ [BACKEND] Proyecto guardado exitosamente');
    console.log('📏 [BACKEND] Medidas guardadas:', proyecto.medidas?.length || 0);
    if (proyecto.medidas && proyecto.medidas.length > 0) {
      console.log('📊 [BACKEND] Primera medida guardada:', JSON.stringify(proyecto.medidas[0], null, 2));
    }

    res.json({
      success: true,
      message: 'Proyecto actualizado exitosamente',
      data: proyecto
    });

  } catch (error) {
    console.error('Error al actualizar proyecto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Cambiar estado del proyecto
const cambiarEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { nuevo_estado, observaciones } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de proyecto inválido'
      });
    }

    const estadosValidos = ['levantamiento', 'cotizacion', 'aprobado', 'fabricacion', 'instalacion', 'completado', 'cancelado'];
    
    if (!estadosValidos.includes(nuevo_estado)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido'
      });
    }

    const proyecto = await Proyecto.findById(id);
    
    if (!proyecto) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    const estadoAnterior = proyecto.estado;
    proyecto.estado = nuevo_estado;
    proyecto.actualizado_por = req.usuario.id;

    if (observaciones) {
      proyecto.observaciones = proyecto.observaciones 
        ? `${proyecto.observaciones}\n\n[${new Date().toLocaleString()}] Cambio de estado de ${estadoAnterior} a ${nuevo_estado}: ${observaciones}`
        : `[${new Date().toLocaleString()}] Cambio de estado de ${estadoAnterior} a ${nuevo_estado}: ${observaciones}`;
    }

    await proyecto.save();

    // Aquí se pueden agregar triggers automáticos según el nuevo estado
    await ejecutarTriggersEstado(proyecto, estadoAnterior, nuevo_estado, req.usuario.id);

    res.json({
      success: true,
      message: `Estado del proyecto cambiado de ${estadoAnterior} a ${nuevo_estado}`,
      data: {
        id: proyecto._id,
        estado_anterior: estadoAnterior,
        estado_nuevo: nuevo_estado,
        fecha_cambio: new Date()
      }
    });

  } catch (error) {
    console.error('Error al cambiar estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Eliminar proyecto (soft delete)
const eliminarProyecto = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de proyecto inválido'
      });
    }

    const proyecto = await Proyecto.findByIdAndUpdate(
      id,
      { 
        activo: false,
        actualizado_por: req.usuario.id,
        fecha_actualizacion: new Date()
      },
      { new: true }
    );

    if (!proyecto) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Proyecto eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar proyecto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Crear proyecto desde prospecto existente
const crearDesdeProspecto = async (req, res) => {
  try {
    const { prospectoId } = req.params;
    const { tipo_fuente = 'formal' } = req.body;

    if (!mongoose.Types.ObjectId.isValid(prospectoId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de prospecto inválido'
      });
    }

    const prospecto = await Prospecto.findById(prospectoId);
    
    if (!prospecto) {
      return res.status(404).json({
        success: false,
        message: 'Prospecto no encontrado'
      });
    }

    // Crear proyecto basado en el prospecto
    const nuevoProyecto = new Proyecto({
      cliente: {
        nombre: prospecto.nombre,
        telefono: prospecto.telefono,
        correo: prospecto.email,
        direccion: prospecto.direccion,
        zona: prospecto.zona
      },
      tipo_fuente,
      observaciones: prospecto.observaciones,
      responsable: prospecto.asesorAsignado,
      prospecto_original: prospectoId,
      creado_por: req.usuario.id,
      actualizado_por: req.usuario.id
    });

    await nuevoProyecto.save();

    res.status(201).json({
      success: true,
      message: 'Proyecto creado desde prospecto exitosamente',
      data: nuevoProyecto
    });

  } catch (error) {
    console.error('Error al crear proyecto desde prospecto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener datos para exportación
const obtenerDatosExportacion = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de proyecto inválido'
      });
    }

    const proyecto = await Proyecto.findById(id)
      .populate([
        { path: 'cotizaciones' },
        { path: 'pedidos' },
        { path: 'ordenes_fabricacion' },
        { path: 'instalaciones' }
      ]);

    if (!proyecto) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    const datosExportacion = proyecto.toExportData();

    res.json({
      success: true,
      data: datosExportacion
    });

  } catch (error) {
    console.error('Error al obtener datos de exportación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Funciones auxiliares

function calcularSubtotal(proyecto) {
  let subtotal = 0;

  // Sumar productos
  if (proyecto.productos && proyecto.productos.length > 0) {
    subtotal += proyecto.productos.reduce((sum, producto) => {
      return sum + (producto.subtotal || (producto.cantidad * producto.precio_unitario) || 0);
    }, 0);
  }

  // Sumar materiales
  if (proyecto.materiales && proyecto.materiales.length > 0) {
    subtotal += proyecto.materiales.reduce((sum, material) => {
      return sum + (material.subtotal || (material.cantidad * material.precio_unitario) || 0);
    }, 0);
  }

  // Sumar medidas con precios
  if (proyecto.medidas && proyecto.medidas.length > 0) {
    subtotal += proyecto.medidas.reduce((sum, medida) => {
      const area = (medida.ancho || 0) * (medida.alto || 0) * (medida.cantidad || 1);
      const precioKit = medida.kitPrecio || 0;
      const precioMotor = medida.motorPrecio || 0;
      const precioControl = medida.controlPrecio || 0;
      return sum + area + precioKit + precioMotor + precioControl;
    }, 0);
  }

  return subtotal;
}

async function ejecutarTriggersEstado(proyecto, estadoAnterior, nuevoEstado, usuarioId) {
  try {
    const sincronizacionService = require('../services/sincronizacionService');
    await sincronizacionService.ejecutarTriggersEstado(proyecto, estadoAnterior, nuevoEstado, usuarioId);
  } catch (error) {
    console.error('Error en triggers de estado:', error);
    // No lanzar el error para no interrumpir el cambio de estado
    // Solo registrar el error para debugging
  }
}

// Sincronizar proyecto manualmente
const sincronizarProyecto = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de proyecto inválido'
      });
    }

    const sincronizacionService = require('../services/sincronizacionService');
    const nuevoEstado = await sincronizacionService.sincronizarProyecto(id);

    res.json({
      success: true,
      message: 'Proyecto sincronizado exitosamente',
      data: {
        proyectoId: id,
        nuevoEstado,
        fechaSincronizacion: new Date()
      }
    });

  } catch (error) {
    console.error('Error sincronizando proyecto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener estadísticas del proyecto
const obtenerEstadisticasProyecto = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de proyecto inválido'
      });
    }

    const proyecto = await Proyecto.findById(id)
      .populate([
        { path: 'cotizaciones', select: 'numero estado fechaCreacion total' },
        { path: 'pedidos', select: 'numero estado fechaCreacion total anticipo saldo' },
        { path: 'ordenes_fabricacion', select: 'numero estado fechaCreacion fechaRequerida' },
        { path: 'instalaciones', select: 'numero estado fechaProgramada fechaCompletada' }
      ]);

    if (!proyecto) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    // Calcular estadísticas
    const estadisticas = {
      resumen: {
        estado_actual: proyecto.estado,
        progreso_porcentaje: proyecto.progreso_porcentaje,
        area_total: proyecto.area_total,
        total_medidas: proyecto.medidas.length,
        fecha_creacion: proyecto.fecha_creacion,
        dias_transcurridos: Math.floor((new Date() - proyecto.fecha_creacion) / (1000 * 60 * 60 * 24))
      },
      financiero: {
        subtotal: proyecto.subtotal,
        iva: proyecto.iva,
        total: proyecto.total,
        anticipo: proyecto.anticipo,
        saldo_pendiente: proyecto.saldo_pendiente
      },
      flujo: {
        cotizaciones: {
          total: proyecto.cotizaciones.length,
          estados: proyecto.cotizaciones.reduce((acc, cot) => {
            acc[cot.estado] = (acc[cot.estado] || 0) + 1;
            return acc;
          }, {})
        },
        pedidos: {
          total: proyecto.pedidos.length,
          estados: proyecto.pedidos.reduce((acc, ped) => {
            acc[ped.estado] = (acc[ped.estado] || 0) + 1;
            return acc;
          }, {})
        },
        fabricacion: {
          total: proyecto.ordenes_fabricacion.length,
          estados: proyecto.ordenes_fabricacion.reduce((acc, ord) => {
            acc[ord.estado] = (acc[ord.estado] || 0) + 1;
            return acc;
          }, {})
        },
        instalaciones: {
          total: proyecto.instalaciones.length,
          estados: proyecto.instalaciones.reduce((acc, ins) => {
            acc[ins.estado] = (acc[ins.estado] || 0) + 1;
            return acc;
          }, {})
        }
      },
      timeline: [
        ...proyecto.cotizaciones.map(c => ({
          tipo: 'cotizacion',
          numero: c.numero,
          estado: c.estado,
          fecha: c.fechaCreacion
        })),
        ...proyecto.pedidos.map(p => ({
          tipo: 'pedido',
          numero: p.numero,
          estado: p.estado,
          fecha: p.fechaCreacion
        })),
        ...proyecto.ordenes_fabricacion.map(o => ({
          tipo: 'fabricacion',
          numero: o.numero,
          estado: o.estado,
          fecha: o.fechaCreacion
        })),
        ...proyecto.instalaciones.map(i => ({
          tipo: 'instalacion',
          numero: i.numero,
          estado: i.estado,
          fecha: i.fechaProgramada
        }))
      ].sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
    };

    res.json({
      success: true,
      data: estadisticas
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

module.exports = {
  crearProyecto,
  obtenerProyectos,
  obtenerProyectoPorId,
  actualizarProyecto,
  cambiarEstado,
  eliminarProyecto,
  crearDesdeProspecto,
  obtenerDatosExportacion,
  sincronizarProyecto,
  obtenerEstadisticasProyecto
};

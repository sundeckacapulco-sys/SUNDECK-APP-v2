const ProyectoPedido = require('../models/ProyectoPedido');
const Prospecto = require('../models/Prospecto');
const Cotizacion = require('../models/Cotizacion');
const mongoose = require('mongoose');

// ===== CREAR PROYECTO-PEDIDO DESDE COTIZACIÓN =====
exports.crearDesdeCotzacion = async (req, res) => {
  try {
    const { cotizacionId } = req.params;
    const { 
      metodoPagoAnticipo,
      referenciaAnticipo,
      comprobanteAnticipo,
      fechaInstalacionDeseada,
      instruccionesEspeciales,
      contactoEntrega
    } = req.body;

    // Verificar que la cotización existe y está aprobada
    const cotizacion = await Cotizacion.findById(cotizacionId).populate('prospecto');
    if (!cotizacion) {
      return res.status(404).json({
        success: false,
        message: 'Cotización no encontrada'
      });
    }

    if (cotizacion.estado !== 'aprobada') {
      return res.status(400).json({
        success: false,
        message: 'La cotización debe estar aprobada para crear un proyecto'
      });
    }

    // Verificar que no existe ya un proyecto para esta cotización
    const proyectoExistente = await ProyectoPedido.findOne({ cotizacion: cotizacionId });
    if (proyectoExistente) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un proyecto para esta cotización',
        proyecto: proyectoExistente
      });
    }

    // Crear el proyecto-pedido
    const nuevoProyecto = new ProyectoPedido({
      prospecto: cotizacion.prospecto._id,
      cotizacion: cotizacionId,
      
      // Información del cliente desde el prospecto
      cliente: {
        nombre: cotizacion.prospecto.nombre,
        telefono: cotizacion.prospecto.telefono,
        email: cotizacion.prospecto.email,
        direccion: cotizacion.prospecto.direccion
      },
      
      // Productos desde la cotización
      productos: cotizacion.productos.map(producto => ({
        nombre: producto.nombre || producto.nombreProducto,
        descripcion: producto.descripcion,
        categoria: producto.categoria,
        material: producto.material,
        color: producto.color,
        ubicacion: producto.ubicacion,
        medidas: {
          ancho: producto.ancho,
          alto: producto.alto,
          area: producto.area || (producto.ancho * producto.alto)
        },
        cantidad: producto.cantidad || 1,
        precioUnitario: producto.precioUnitario,
        subtotal: producto.subtotal,
        requiereR24: (producto.ancho > 2.5 || producto.alto > 2.5),
        tiempoFabricacion: producto.tiempoFabricacion || 15
      })),
      
      // Pagos desde la cotización
      pagos: {
        montoTotal: cotizacion.total,
        subtotal: cotizacion.subtotal,
        iva: cotizacion.iva,
        descuentos: cotizacion.descuento || 0,
        anticipo: {
          porcentaje: 60,
          metodoPago: metodoPagoAnticipo,
          referencia: referenciaAnticipo,
          comprobante: comprobanteAnticipo,
          pagado: !!comprobanteAnticipo
        },
        saldo: {
          porcentaje: 40
        }
      },
      
      // Responsables
      responsables: {
        vendedor: req.usuario.id
      },
      
      // Información de entrega
      entrega: {
        direccion: cotizacion.prospecto.direccion,
        contacto: {
          nombre: contactoEntrega?.nombre || cotizacion.prospecto.nombre,
          telefono: contactoEntrega?.telefono || cotizacion.prospecto.telefono,
          horarioPreferido: contactoEntrega?.horarioPreferido || 'Mañana'
        },
        instrucciones: instruccionesEspeciales
      },
      
      // Cronograma inicial
      cronograma: {
        fechaInstalacionProgramada: fechaInstalacionDeseada
      },
      
      creado_por: req.usuario.id,
      actualizado_por: req.usuario.id
    });

    await nuevoProyecto.save();

    // Actualizar estado de la cotización
    cotizacion.estado = 'convertida';
    await cotizacion.save();

    // Agregar nota inicial
    await nuevoProyecto.agregarNota(
      'Proyecto creado desde cotización aprobada',
      req.usuario.id,
      'confirmacion',
      'info'
    );

    // Poblar datos para la respuesta
    const proyectoCompleto = await ProyectoPedido.findById(nuevoProyecto._id)
      .populate('prospecto', 'nombre telefono email')
      .populate('cotizacion', 'numero fecha')
      .populate('responsables.vendedor', 'nombre email')
      .populate('creado_por', 'nombre email');

    res.status(201).json({
      success: true,
      message: 'Proyecto creado exitosamente',
      data: proyectoCompleto
    });

  } catch (error) {
    console.error('Error creando proyecto desde cotización:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// ===== OBTENER TODOS LOS PROYECTOS CON FILTROS =====
exports.obtenerProyectos = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      estado,
      vendedor,
      fabricante,
      instalador,
      usuario,
      busqueda,
      fechaDesde,
      fechaHasta,
      soloRetrasados,
      soloSinPagar
    } = req.query;

    // Construir filtros
    const filtros = {};
    
    if (estado) filtros.estado = estado;
    if (vendedor) filtros['responsables.vendedor'] = vendedor;
    if (fabricante) filtros['responsables.fabricante'] = fabricante;
    if (instalador) filtros['responsables.instalador'] = instalador;
    
    if (fechaDesde || fechaHasta) {
      filtros.createdAt = {};
      if (fechaDesde) filtros.createdAt.$gte = new Date(fechaDesde);
      if (fechaHasta) filtros.createdAt.$lte = new Date(fechaHasta);
    }

    // Búsqueda por texto
    if (busqueda) {
      filtros.$or = [
        { numero: { $regex: busqueda, $options: 'i' } },
        { 'cliente.nombre': { $regex: busqueda, $options: 'i' } },
        { 'cliente.telefono': { $regex: busqueda, $options: 'i' } },
        { 'cliente.email': { $regex: busqueda, $options: 'i' } }
      ];
    }

    // Filtros especiales
    if (soloRetrasados === 'true') {
      const hoy = new Date();
      filtros.$or = [
        { 
          estado: 'confirmado',
          'cronograma.fechaInicioFabricacion': { $lt: hoy }
        },
        { 
          estado: 'en_fabricacion',
          'cronograma.fechaFinFabricacionEstimada': { $lt: hoy }
        },
        { 
          estado: 'fabricado',
          'cronograma.fechaInstalacionProgramada': { $lt: hoy }
        }
      ];
    }

    if (soloSinPagar === 'true') {
      filtros.$or = [
        { 'pagos.anticipo.pagado': false },
        { 'pagos.saldo.pagado': false }
      ];
    }

    // Filtros por rol (aplicados por middleware)
    if (vendedor && vendedor !== 'current_user') {
      filtros['responsables.vendedor'] = vendedor;
    } else if (vendedor === 'current_user') {
      filtros['responsables.vendedor'] = req.usuario.id;
    }
    
    if (fabricante && fabricante !== 'current_user') {
      filtros['responsables.fabricante'] = fabricante;
    } else if (fabricante === 'current_user') {
      filtros['responsables.fabricante'] = req.usuario.id;
    }
    
    if (instalador && instalador !== 'current_user') {
      filtros['responsables.instalador'] = instalador;
    } else if (instalador === 'current_user') {
      filtros['responsables.instalador'] = req.usuario.id;
    }
    
    if (usuario) {
      filtros.$or = [
        { creado_por: usuario },
        { 'responsables.vendedor': usuario },
        { 'responsables.fabricante': usuario },
        { 'responsables.instalador': usuario }
      ];
    }

    const opciones = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: [
        { path: 'prospecto', select: 'nombre telefono email etapa' },
        { path: 'cotizacion', select: 'numero fecha' },
        { path: 'responsables.vendedor', select: 'nombre email telefono' },
        { path: 'responsables.fabricante', select: 'nombre email telefono' },
        { path: 'responsables.instalador', select: 'nombre email telefono' },
        { path: 'creado_por', select: 'nombre email' }
      ]
    };

    const proyectos = await ProyectoPedido.paginate(filtros, opciones);

    // Agregar estadísticas adicionales
    const proyectosConEstadisticas = proyectos.docs.map(proyecto => {
      const proyectoObj = proyecto.toObject();
      
      return {
        ...proyectoObj,
        estadisticas: {
          progreso: proyecto.calcularProgreso(),
          diasRetraso: proyecto.diasRetraso(),
          estaPagado: proyecto.estaPagado(),
          areaTotal: proyecto.productos.reduce((sum, p) => sum + (p.medidas.area * p.cantidad), 0),
          cantidadProductos: proyecto.productos.length,
          diasTranscurridos: Math.ceil((new Date() - new Date(proyecto.createdAt)) / (1000 * 60 * 60 * 24))
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
    console.error('Error obteniendo proyectos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// ===== OBTENER PROYECTO POR ID =====
exports.obtenerProyectoPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const proyecto = await ProyectoPedido.findById(id)
      .populate('prospecto')
      .populate('cotizacion')
      .populate('responsables.vendedor', 'nombre email telefono')
      .populate('responsables.fabricante', 'nombre email telefono')
      .populate('responsables.instalador', 'nombre email telefono')
      .populate('responsables.coordinador', 'nombre email telefono')
      .populate('notas.usuario', 'nombre email')
      .populate('archivos.subidoPor', 'nombre email')
      .populate('creado_por', 'nombre email')
      .populate('actualizado_por', 'nombre email');

    if (!proyecto) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    // Verificar permisos
    if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'gerente') {
      const tieneAcceso = [
        proyecto.creado_por?._id?.toString(),
        proyecto.responsables.vendedor?._id?.toString(),
        proyecto.responsables.fabricante?._id?.toString(),
        proyecto.responsables.instalador?._id?.toString(),
        proyecto.responsables.coordinador?._id?.toString()
      ].includes(req.usuario.id);

      if (!tieneAcceso) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para ver este proyecto'
        });
      }
    }

    const proyectoObj = proyecto.toObject();
    
    res.json({
      success: true,
      data: {
        ...proyectoObj,
        estadisticas: {
          progreso: proyecto.calcularProgreso(),
          diasRetraso: proyecto.diasRetraso(),
          estaPagado: proyecto.estaPagado(),
          areaTotal: proyecto.productos.reduce((sum, p) => sum + (p.medidas.area * p.cantidad), 0),
          cantidadProductos: proyecto.productos.length,
          diasTranscurridos: Math.ceil((new Date() - new Date(proyecto.createdAt)) / (1000 * 60 * 60 * 24))
        }
      }
    });

  } catch (error) {
    console.error('Error obteniendo proyecto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// ===== CAMBIAR ESTADO DEL PROYECTO =====
exports.cambiarEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { nuevoEstado, nota, fechasProgramadas } = req.body;

    const proyecto = await ProyectoPedido.findById(id);
    if (!proyecto) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    // Validar transición de estado
    const transicionesValidas = {
      'cotizado': ['confirmado', 'cancelado'],
      'confirmado': ['en_fabricacion', 'cancelado'],
      'en_fabricacion': ['fabricado', 'cancelado'],
      'fabricado': ['en_instalacion', 'cancelado'],
      'en_instalacion': ['completado', 'cancelado'],
      'completado': [],
      'cancelado': []
    };

    if (!transicionesValidas[proyecto.estado].includes(nuevoEstado)) {
      return res.status(400).json({
        success: false,
        message: `No se puede cambiar de "${proyecto.estado}" a "${nuevoEstado}"`
      });
    }

    // Actualizar fechas programadas si se proporcionan
    if (fechasProgramadas) {
      if (fechasProgramadas.fechaInicioFabricacion) {
        proyecto.cronograma.fechaInicioFabricacion = new Date(fechasProgramadas.fechaInicioFabricacion);
      }
      if (fechasProgramadas.fechaInstalacionProgramada) {
        proyecto.cronograma.fechaInstalacionProgramada = new Date(fechasProgramadas.fechaInstalacionProgramada);
      }
    }

    // Cambiar estado
    await proyecto.cambiarEstado(nuevoEstado, req.usuario.id, nota);

    const proyectoActualizado = await ProyectoPedido.findById(id)
      .populate('responsables.vendedor', 'nombre email')
      .populate('responsables.fabricante', 'nombre email')
      .populate('responsables.instalador', 'nombre email');

    res.json({
      success: true,
      message: `Estado cambiado a "${nuevoEstado}" exitosamente`,
      data: proyectoActualizado
    });

  } catch (error) {
    console.error('Error cambiando estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// ===== AGREGAR NOTA =====
exports.agregarNota = async (req, res) => {
  try {
    const { id } = req.params;
    const { contenido, etapa, tipo, privada } = req.body;

    const proyecto = await ProyectoPedido.findById(id);
    if (!proyecto) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    proyecto.notas.push({
      contenido,
      usuario: req.usuario.id,
      etapa: etapa || 'general',
      tipo: tipo || 'info',
      privada: privada || false
    });

    proyecto.actualizado_por = req.usuario.id;
    await proyecto.save();

    const proyectoActualizado = await ProyectoPedido.findById(id)
      .populate('notas.usuario', 'nombre email');

    res.json({
      success: true,
      message: 'Nota agregada exitosamente',
      data: proyectoActualizado.notas[proyectoActualizado.notas.length - 1]
    });

  } catch (error) {
    console.error('Error agregando nota:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// ===== REGISTRAR PAGO =====
exports.registrarPago = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      tipoPago, // 'anticipo' o 'saldo'
      monto,
      metodoPago,
      referencia,
      comprobante,
      fechaPago
    } = req.body;

    const proyecto = await ProyectoPedido.findById(id);
    if (!proyecto) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    if (tipoPago === 'anticipo') {
      proyecto.pagos.anticipo.monto = monto;
      proyecto.pagos.anticipo.metodoPago = metodoPago;
      proyecto.pagos.anticipo.referencia = referencia;
      proyecto.pagos.anticipo.comprobante = comprobante;
      proyecto.pagos.anticipo.fechaPago = fechaPago || new Date();
      proyecto.pagos.anticipo.pagado = true;
    } else if (tipoPago === 'saldo') {
      proyecto.pagos.saldo.monto = monto;
      proyecto.pagos.saldo.metodoPago = metodoPago;
      proyecto.pagos.saldo.referencia = referencia;
      proyecto.pagos.saldo.comprobante = comprobante;
      proyecto.pagos.saldo.fechaPago = fechaPago || new Date();
      proyecto.pagos.saldo.pagado = true;
    }

    proyecto.actualizado_por = req.usuario.id;
    await proyecto.save();

    // Agregar nota del pago
    await proyecto.agregarNota(
      `Pago de ${tipoPago} registrado: $${monto.toLocaleString()} - ${metodoPago} - Ref: ${referencia}`,
      req.usuario.id,
      'confirmacion',
      'info'
    );

    res.json({
      success: true,
      message: 'Pago registrado exitosamente',
      data: proyecto.pagos
    });

  } catch (error) {
    console.error('Error registrando pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// ===== ASIGNAR RESPONSABLE =====
exports.asignarResponsable = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo, usuarioId } = req.body; // tipo: 'fabricante', 'instalador', 'coordinador'

    const proyecto = await ProyectoPedido.findById(id);
    if (!proyecto) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    proyecto.responsables[tipo] = usuarioId;
    proyecto.actualizado_por = req.usuario.id;
    await proyecto.save();

    // Agregar nota de asignación
    await proyecto.agregarNota(
      `${tipo.charAt(0).toUpperCase() + tipo.slice(1)} asignado`,
      req.usuario.id,
      'general',
      'cambio'
    );

    const proyectoActualizado = await ProyectoPedido.findById(id)
      .populate(`responsables.${tipo}`, 'nombre email telefono');

    res.json({
      success: true,
      message: 'Responsable asignado exitosamente',
      data: proyectoActualizado.responsables
    });

  } catch (error) {
    console.error('Error asignando responsable:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// ===== OBTENER ESTADÍSTICAS GENERALES =====
exports.obtenerEstadisticas = async (req, res) => {
  try {
    const estadisticas = await ProyectoPedido.aggregate([
      {
        $group: {
          _id: '$estado',
          count: { $sum: 1 },
          montoTotal: { $sum: '$pagos.montoTotal' }
        }
      }
    ]);

    const proyectosRetrasados = await ProyectoPedido.countDocuments({
      $or: [
        { 
          estado: 'confirmado',
          'cronograma.fechaInicioFabricacion': { $lt: new Date() }
        },
        { 
          estado: 'en_fabricacion',
          'cronograma.fechaFinFabricacionEstimada': { $lt: new Date() }
        },
        { 
          estado: 'fabricado',
          'cronograma.fechaInstalacionProgramada': { $lt: new Date() }
        }
      ]
    });

    const proyectosSinPagar = await ProyectoPedido.countDocuments({
      $or: [
        { 'pagos.anticipo.pagado': false },
        { 'pagos.saldo.pagado': false }
      ]
    });

    res.json({
      success: true,
      data: {
        porEstado: estadisticas,
        retrasados: proyectosRetrasados,
        sinPagar: proyectosSinPagar
      }
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

// ===== ACTUALIZAR ESTADO DE PRODUCTO INDIVIDUAL =====
exports.actualizarProducto = async (req, res) => {
  try {
    const { id, productoIndex } = req.params;
    const { estadoFabricacion, fechaFinFabricacion } = req.body;

    const proyecto = await ProyectoPedido.findById(id);
    if (!proyecto) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    if (!proyecto.productos[productoIndex]) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Actualizar el producto específico
    proyecto.productos[productoIndex].estadoFabricacion = estadoFabricacion;
    if (fechaFinFabricacion) {
      proyecto.productos[productoIndex].fechaFinFabricacion = fechaFinFabricacion;
    }

    // Verificar si todos los productos están terminados
    const todosTerminados = proyecto.productos.every(p => p.estadoFabricacion === 'terminado');
    
    if (todosTerminados && proyecto.estado === 'en_fabricacion') {
      // Cambiar automáticamente a 'fabricado' si todos los productos están listos
      await proyecto.cambiarEstado('fabricado', req.usuario.id, 'Todos los productos completados');
    }

    proyecto.actualizado_por = req.usuario.id;
    await proyecto.save();

    res.json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: proyecto.productos[productoIndex]
    });

  } catch (error) {
    console.error('Error actualizando producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

module.exports = {
  crearDesdeCotzacion: exports.crearDesdeCotzacion,
  obtenerProyectos: exports.obtenerProyectos,
  obtenerProyectoPorId: exports.obtenerProyectoPorId,
  cambiarEstado: exports.cambiarEstado,
  agregarNota: exports.agregarNota,
  registrarPago: exports.registrarPago,
  asignarResponsable: exports.asignarResponsable,
  obtenerEstadisticas: exports.obtenerEstadisticas,
  actualizarProducto: exports.actualizarProducto
};

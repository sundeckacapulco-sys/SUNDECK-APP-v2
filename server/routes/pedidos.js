const express = require('express');
const Pedido = require('../models/Pedido');
const Cotizacion = require('../models/Cotizacion');
const Prospecto = require('../models/Prospecto');
const { auth, verificarPermiso } = require('../middleware/auth');
const CotizacionMappingService = require('../services/cotizacionMappingService');
const ValidacionTecnicaService = require('../services/validacionTecnicaService');
const logger = require('../config/logger');
const pedidoController = require('../controllers/pedidoController');
const eventBus = require('../services/eventBusService');

const router = express.Router();

// Obtener pedidos
router.get('/', auth, verificarPermiso('pedidos', 'leer'), async (req, res) => {
  try {
    const { estado, vendedor } = req.query;
    const filtros = {};
    
    if (estado) filtros.estado = estado;
    if (vendedor) filtros.vendedor = vendedor;
    
    if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'gerente') {
      filtros.vendedor = req.usuario._id;
    }

    const pedidos = await Pedido.find(filtros)
      .populate('prospecto', 'nombre telefono')
      .populate('cotizacion', 'numero')
      .populate('vendedor', 'nombre apellido')
      .sort({ createdAt: -1 });

    res.json(pedidos);
  } catch (error) {
    logger.error('Error obteniendo pedidos', {
      ruta: 'pedidosRoutes',
      accion: 'listarPedidos',
      filtros: req.query,
      usuarioId: req.usuario?._id || null,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Convertir cotización en pedido
router.post('/desde-cotizacion/:cotizacionId', auth, verificarPermiso('pedidos', 'crear'), async (req, res) => {
  try {
    const { cotizacionId } = req.params;
    const { 
      direccionEntrega, 
      contactoEntrega, 
      anticipo = { porcentaje: 50 },
      fechaEntregaDeseada 
    } = req.body;

    // Verificar que la cotización existe y está aprobada
    const cotizacion = await Cotizacion.findById(cotizacionId).populate('prospecto');
    if (!cotizacion) {
      return res.status(404).json({ message: 'Cotización no encontrada' });
    }

    if (cotizacion.estado !== 'aprobada') {
      return res.status(400).json({ message: 'La cotización debe estar aprobada para generar un pedido' });
    }

    // Verificar si ya existe un pedido para esta cotización
    const pedidoExistente = await Pedido.findOne({ cotizacion: cotizacionId });
    if (pedidoExistente) {
      return res.status(400).json({ message: 'Ya existe un pedido para esta cotización' });
    }

    // Calcular fechas estimadas
    const fechaInicio = new Date();
    const fechaFinFabricacion = new Date(fechaInicio);
    fechaFinFabricacion.setDate(fechaFinFabricacion.getDate() + (cotizacion.tiempoFabricacion || 15));
    
    const fechaInstalacion = new Date(fechaFinFabricacion);
    fechaInstalacion.setDate(fechaInstalacion.getDate() + (cotizacion.tiempoInstalacion || 1));

    // Crear el pedido
    const nuevoPedido = new Pedido({
      cotizacion: cotizacionId,
      prospecto: cotizacion.prospecto._id,
      montoTotal: cotizacion.total,
      anticipo: {
        monto: cotizacion.total * (anticipo.porcentaje / 100),
        porcentaje: anticipo.porcentaje,
        pagado: false
      },
      saldo: {
        monto: cotizacion.total * ((100 - anticipo.porcentaje) / 100),
        porcentaje: 100 - anticipo.porcentaje,
        pagado: false
      },
      productos: cotizacion.productos.map(producto => ({
        // === DATOS BÁSICOS ===
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        categoria: producto.categoria,
        material: producto.material,
        color: producto.color,
        cristal: producto.cristal,
        herrajes: producto.herrajes,
        medidas: producto.medidas,
        cantidad: producto.cantidad,
        precioUnitario: producto.precioUnitario,
        subtotal: producto.subtotal,
        requiereR24: producto.requiereR24,
        tiempoFabricacion: producto.tiempoFabricacion,
        
        // === ESPECIFICACIONES COMPLEJAS PARA PEDIDO ===
        // Motorización
        motorizado: producto.motorizado,
        motorModelo: producto.motorModelo,
        motorModeloManual: producto.motorModeloManual,
        motorPrecio: producto.motorPrecio,
        
        // Controles
        controlModelo: producto.controlModelo,
        controlModeloManual: producto.controlModeloManual,
        controlPrecio: producto.controlPrecio,
        esControlMulticanal: producto.esControlMulticanal,
        numMotores: producto.numMotores,
        
        // Toldos
        esToldo: producto.esToldo,
        tipoToldo: producto.tipoToldo,
        kitModelo: producto.kitModelo,
        kitModeloManual: producto.kitModeloManual,
        kitPrecio: producto.kitPrecio,
        
        // Instalación especial
        requiereAndamios: producto.requiereAndamios,
        requiereObraElectrica: producto.requiereObraElectrica,
        nivelAndamio: producto.nivelAndamio,
        costoAndamios: producto.costoAndamios,
        costoObraElectrica: producto.costoObraElectrica,
        
        // Medidas individuales (para levantamientos)
        medidasIndividuales: producto.medidasIndividuales,
        
        // Observaciones y especificaciones técnicas
        observaciones: producto.observaciones,
        fotoUrls: producto.fotoUrls,
        videoUrl: producto.videoUrl,
        
        // Garantías específicas
        garantiaMotor: producto.garantiaMotor,
        garantiaTela: producto.garantiaTela,
        
        // Accesorios adicionales
        accionamiento: producto.accionamiento,
        montaje: producto.montaje,
        tipoTela: producto.tipoTela,
        forroBlackout: producto.forroBlackout,
        rielDecorativo: producto.rielDecorativo,
        
        // Estado de fabricación
        estadoFabricacion: 'pendiente'
      })),
      direccionEntrega: direccionEntrega || {
        calle: cotizacion.prospecto.direccion || '',
        ciudad: 'Acapulco, Guerrero'
      },
      contactoEntrega: contactoEntrega || {
        nombre: cotizacion.prospecto.nombre,
        telefono: cotizacion.prospecto.telefono
      },
      fechaInicioFabricacion: fechaInicio,
      fechaFinFabricacion: fechaFinFabricacion,
      fechaInstalacion: fechaInstalacion,
      fechaEntrega: fechaEntregaDeseada ? new Date(fechaEntregaDeseada) : fechaInstalacion,
      vendedor: req.usuario._id,
      estado: 'confirmado'
    });

    await nuevoPedido.save();
    await nuevoPedido.populate([
      { path: 'prospecto', select: 'nombre telefono email' },
      { path: 'cotizacion', select: 'numero' },
      { path: 'vendedor', select: 'nombre apellido' }
    ]);

    // Actualizar estado de la cotización
    cotizacion.estado = 'convertida';
    await cotizacion.save();

    // Actualizar etapa del prospecto
    await Prospecto.findByIdAndUpdate(cotizacion.prospecto._id, {
      etapa: 'pedido'
    });

    // Agregar nota al pedido
    nuevoPedido.notas.push({
      usuario: req.usuario._id,
      contenido: `Pedido generado desde cotización ${cotizacion.numero}`,
      tipo: 'general'
    });
    await nuevoPedido.save();

    await eventBus.emit('pedido.creado', {
      pedidoId: nuevoPedido._id,
      cotizacionId,
      numero: nuevoPedido.numero,
      monto: nuevoPedido.montoTotal,
      anticipo: {
        ...nuevoPedido.anticipo,
        pagado: nuevoPedido.anticipo?.pagado || false
      },
      productos: nuevoPedido.productos.map(producto => ({
        nombre: producto.nombre,
        cantidad: producto.cantidad,
        subtotal: producto.subtotal,
        requiereR24: producto.requiereR24,
        tiempoFabricacion: producto.tiempoFabricacion
      })),
      prospectoId: nuevoPedido.prospecto?._id,
      prioridad: 'normal',
      fechaInicio
    }, 'pedidosRoutes', req.usuario?._id || null);

    res.status(201).json({
      message: 'Pedido creado exitosamente desde cotización',
      pedido: nuevoPedido
    });
  } catch (error) {
    logger.error('Error convirtiendo cotización en pedido', {
      ruta: 'pedidosRoutes',
      accion: 'crearPedidoDesdeCotizacion',
      cotizacionId: req.params.cotizacionId,
      usuarioId: req.usuario?._id || null,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Aplicar anticipo y convertir cotización a pedido automáticamente
router.post('/aplicar-anticipo/:cotizacionId', auth, verificarPermiso('pedidos', 'crear'), pedidoController.aplicarAnticipo);

// Actualizar estado de fabricación
router.put('/:id/fabricacion', auth, verificarPermiso('pedidos', 'editar'), async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, observaciones, productoId } = req.body;

    const pedido = await Pedido.findById(id).populate('prospecto');
    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    // Actualizar estado específico del producto o general
    if (productoId) {
      const producto = pedido.productos.id(productoId);
      if (producto) {
        producto.estadoFabricacion = estado;
      }
    }

    // Actualizar fechas según el estado
    const ahora = new Date();
    let etapaNombre = '';
    let etapaObservaciones = '';
    let nuevoEstadoPedido = pedido.estado;

    switch (estado) {
      case 'en_proceso':
        if (!pedido.fechaInicioFabricacion || pedido.fechaInicioFabricacion > ahora) {
          pedido.fechaInicioFabricacion = ahora;
        }
        nuevoEstadoPedido = 'en_fabricacion';
        etapaNombre = 'Fabricación Iniciada';
        etapaObservaciones = `🔨 Fabricación iniciada. ${observaciones || 'Productos en proceso de fabricación.'}`;
        break;
      case 'terminado':
        pedido.fechaFinFabricacion = ahora;
        nuevoEstadoPedido = 'fabricado';
        etapaNombre = 'Fabricación Completada';
        etapaObservaciones = `✅ Fabricación completada. Productos listos para instalación. ${observaciones || ''}`;
        break;
      case 'instalado':
        pedido.fechaInstalacion = ahora;
        pedido.fechaEntrega = ahora;
        nuevoEstadoPedido = 'instalado';
        etapaNombre = 'Instalación Completada';
        etapaObservaciones = `🏠 Instalación completada exitosamente. ${observaciones || 'Cliente satisfecho con el resultado.'}`;
        break;
    }

    pedido.estado = nuevoEstadoPedido;
    
    // Agregar nota al pedido
    pedido.notas.push({
      usuario: req.usuario._id,
      contenido: `Estado actualizado a: ${estado}. ${observaciones || ''}`,
      tipo: 'fabricacion'
    });

    await pedido.save();

    // Actualizar timeline del prospecto
    if (etapaNombre) {
      let nuevaEtapaProspecto = pedido.prospecto.etapa;
      if (estado === 'terminado') nuevaEtapaProspecto = 'fabricacion';
      if (estado === 'instalado') nuevaEtapaProspecto = 'entregado';

      await Prospecto.findByIdAndUpdate(pedido.prospecto._id, {
        etapa: nuevaEtapaProspecto,
        fechaUltimoContacto: ahora,
        $push: {
          etapas: {
            nombre: etapaNombre,
            fechaHora: ahora,
            observaciones: etapaObservaciones,
            usuario: req.usuario._id
          },
          notas: {
            fecha: ahora,
            usuario: req.usuario._id,
            contenido: etapaObservaciones,
            tipo: 'nota',
            categoria: 'General'
          }
        }
      });
    }

    res.json({
      message: 'Estado de fabricación actualizado',
      pedido: await pedido.populate([
        { path: 'prospecto', select: 'nombre telefono' },
        { path: 'cotizacion', select: 'numero' }
      ])
    });
  } catch (error) {
    logger.error('Error actualizando estado de fabricación del pedido', {
      ruta: 'pedidosRoutes',
      accion: 'actualizarFabricacion',
      pedidoId: req.params.id,
      usuarioId: req.usuario?._id || null,
      bodyKeys: Object.keys(req.body || {}),
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Registrar pago de saldo
router.put('/:id/pagar-saldo', auth, verificarPermiso('pedidos', 'editar'), async (req, res) => {
  try {
    const { id } = req.params;
    const { metodoPago, referencia, comprobante, fechaPago = new Date() } = req.body;

    const pedido = await Pedido.findById(id).populate('prospecto');
    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    if (pedido.saldo.pagado) {
      return res.status(400).json({ message: 'El saldo ya está pagado' });
    }

    // Actualizar información del saldo
    pedido.saldo.fechaPago = new Date(fechaPago);
    pedido.saldo.metodoPago = metodoPago;
    pedido.saldo.referencia = referencia || '';
    pedido.saldo.comprobante = comprobante || '';
    pedido.saldo.pagado = true;

    // Agregar nota
    pedido.notas.push({
      usuario: req.usuario._id,
      contenido: `💰 Saldo pagado: $${pedido.saldo.monto.toLocaleString()} vía ${metodoPago}. Pedido completamente pagado.`,
      tipo: 'pago'
    });

    await pedido.save();

    // Actualizar timeline del prospecto
    await Prospecto.findByIdAndUpdate(pedido.prospecto._id, {
      fechaUltimoContacto: new Date(),
      $push: {
        etapas: {
          nombre: 'Saldo Liquidado',
          fechaHora: new Date(),
          observaciones: `💰 Saldo de $${pedido.saldo.monto.toLocaleString()} pagado vía ${metodoPago}. Pedido completamente liquidado.`,
          usuario: req.usuario._id
        },
        notas: {
          fecha: new Date(),
          usuario: req.usuario._id,
          contenido: `✅ PEDIDO LIQUIDADO COMPLETAMENTE. Total pagado: $${pedido.montoTotal.toLocaleString()}`,
          tipo: 'nota',
          categoria: 'General'
        }
      }
    });

    res.json({
      message: 'Saldo pagado exitosamente',
      pedido: await pedido.populate([
        { path: 'prospecto', select: 'nombre telefono' },
        { path: 'cotizacion', select: 'numero' }
      ])
    });
  } catch (error) {
    logger.error('Error registrando pago de saldo de pedido', {
      ruta: 'pedidosRoutes',
      accion: 'registrarPagoSaldo',
      pedidoId: req.params.id,
      usuarioId: req.usuario?._id || null,
      bodyKeys: Object.keys(req.body || {}),
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener pedido por ID
router.get('/:id', auth, verificarPermiso('pedidos', 'leer'), async (req, res) => {
  try {
    const pedido = await Pedido.findById(req.params.id)
      .populate('prospecto')
      .populate('cotizacion')
      .populate('vendedor', 'nombre apellido email')
      .populate('notas.usuario', 'nombre apellido');

    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    res.json(pedido);
  } catch (error) {
    logger.error('Error obteniendo pedido por ID', {
      ruta: 'pedidosRoutes',
      accion: 'obtenerPedido',
      pedidoId: req.params.id,
      usuarioId: req.usuario?._id || null,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Crear pedido directamente desde etapa/levantamiento
router.post('/desde-etapa', auth, verificarPermiso('pedidos', 'crear'), async (req, res) => {
  try {
    logger.info('Creando pedido directamente desde etapa', {
      ruta: 'pedidosRoutes',
      accion: 'crearPedidoDesdeEtapa',
      usuarioId: req.usuario?._id || null
    });

    logger.debug('Payload recibido para crear pedido desde etapa', {
      ruta: 'pedidosRoutes',
      accion: 'crearPedidoDesdeEtapa',
      body: req.body,
      usuarioId: req.usuario?._id || null
    });

    const {
      prospectoId,
      piezas = [],
      facturacion = {},
      entrega = {},
      terminos = {},
      totalFinal = 0,
      instalacion = {},
      descuento = {},
      comentarios = ''
    } = req.body;

    // Validaciones básicas
    if (!prospectoId) {
      return res.status(400).json({ message: 'ProspectoId es requerido' });
    }

    if (!piezas || piezas.length === 0) {
      return res.status(400).json({ message: 'Debe incluir al menos una pieza/producto' });
    }

    // 🔒 VALIDACIÓN TÉCNICA OBLIGATORIA: Verificar si se puede crear pedido
    logger.info('Validando información técnica para crear pedido desde etapa', {
      ruta: 'pedidosRoutes',
      accion: 'crearPedidoDesdeEtapa',
      usuarioId: req.usuario?._id || null,
      prospectoId,
      piezasCount: piezas.length
    });
    const validacionTecnica = ValidacionTecnicaService.validarAvanceEtapa(piezas, 'pedido');

    if (!validacionTecnica.puedeAvanzar) {
      logger.warn('Pedido bloqueado por información técnica incompleta', {
        ruta: 'pedidosRoutes',
        accion: 'crearPedidoDesdeEtapa',
        usuarioId: req.usuario?._id || null,
        prospectoId,
        requisitosFaltantes: validacionTecnica.detalleProductos.filter(p => !p.valido)
      });
      return res.status(400).json({
        message: 'No se puede crear el pedido',
        error: validacionTecnica.mensajeCandado,
        validacion: validacionTecnica,
        requisitosFaltantes: validacionTecnica.detalleProductos.filter(p => !p.valido)
      });
    }

    logger.info('Validación técnica aprobada para crear pedido', {
      ruta: 'pedidosRoutes',
      accion: 'crearPedidoDesdeEtapa',
      usuarioId: req.usuario?._id || null,
      prospectoId
    });

    // Verificar que el prospecto existe
    const prospecto = await Prospecto.findById(prospectoId);
    if (!prospecto) {
      return res.status(404).json({ message: 'Prospecto no encontrado' });
    }

    // Generar payload unificado para pedido
    const payloadUnificado = CotizacionMappingService.generarPayloadUnificado({
      prospectoId,
      productos: piezas,
      origen: 'etapa_directa',
      instalacion,
      descuento,
      facturacion,
      entrega,
      terminos,
      comentarios
    }, 'pedido');

    // Calcular totales unificados
    const totales = CotizacionMappingService.calcularTotalesUnificados(piezas, {
      incluyeInstalacion: instalacion?.cobra || false,
      costoInstalacion: instalacion?.precio || 0,
      descuento: descuento?.aplica ? descuento : null,
      requiereFactura: facturacion?.requiereFactura || false
    });

    // Crear cotización temporal para el pedido (requerida por el modelo)
    const cotizacionTemporal = new Cotizacion({
      numero: `COT-TEMP-${Date.now()}`,
      prospecto: prospecto._id,
      nombre: `Cotización temporal para pedido desde etapa`,
      origen: 'etapa_directa',
      productos: payloadUnificado.productos,
      subtotal: totales.subtotalProductos,
      iva: totales.ivaCalculado,
      total: totales.totalFinal,
      elaboradaPor: req.usuario._id,
      estado: 'convertida' // Marcar como convertida inmediatamente
    });
    
    const cotizacionGuardada = await cotizacionTemporal.save();

    // Crear pedido
    const nuevoPedido = new Pedido({
      numero: await generarNumeroPedido(),
      cotizacion: cotizacionGuardada._id, // Referenciar cotización temporal
      prospecto: prospecto._id,
      montoTotal: totales.totalFinal, // Campo requerido
      vendedor: req.usuario._id,
      estado: 'confirmado',
      origen: 'etapa_directa',
      
      // Productos normalizados
      productos: payloadUnificado.productos,
      
      // Totales calculados
      subtotal: totales.subtotalProductos,
      instalacion: instalacion?.cobra ? {
        incluye: true,
        tipo: instalacion.tipo || 'Estándar',
        costo: instalacion.precio || 0
      } : { incluye: false, costo: 0 },
      
      descuento: descuento?.aplica ? {
        tipo: descuento.tipo || 'porcentaje',
        valor: descuento.valor || 0,
        monto: totales.montoDescuento
      } : { tipo: 'porcentaje', valor: 0, monto: 0 },
      
      iva: totales.ivaCalculado,
      total: totales.totalFinal,
      
      // Información de facturación
      facturacion: {
        requiere: facturacion?.requiereFactura || false,
        razonSocial: facturacion?.razonSocial || '',
        rfc: facturacion?.rfc || '',
        direccionFiscal: facturacion?.direccionFiscal || ''
      },
      
      // Información de entrega
      entrega: {
        tipo: entrega?.tipo || 'normal',
        diasExpres: entrega?.diasExpres || null,
        fechaEstimada: entrega?.fechaEstimada || null,
        direccion: prospecto.direccion || '',
        contacto: prospecto.telefono || ''
      },
      
      // Términos
      terminos: {
        incluir: terminos?.incluir !== false // Por defecto true
      },
      
      // Pagos (estructura base)
      pagos: {
        anticipo: {
          porcentaje: 60,
          monto: Math.round(totales.totalFinal * 0.6),
          pagado: false,
          fechaPago: null
        },
        saldo: {
          porcentaje: 40,
          monto: Math.round(totales.totalFinal * 0.4),
          pagado: false,
          fechaPago: null
        }
      },
      
      notas: comentarios ? [{
        contenido: comentarios,
        usuario: req.usuario._id,
        fecha: new Date()
      }] : []
    });

    const pedidoGuardado = await nuevoPedido.save();
    
    // Actualizar prospecto
    prospecto.etapa = 'pedido';
    prospecto.fechaUltimoContacto = new Date();
    await prospecto.save();

    // Poblar datos para respuesta
    const pedidoCompleto = await Pedido.findById(pedidoGuardado._id)
      .populate('prospecto', 'nombre telefono email')
      .populate('vendedor', 'nombre apellido');

    logger.info('Pedido creado exitosamente desde etapa', {
      ruta: 'pedidosRoutes',
      accion: 'crearPedidoDesdeEtapa',
      usuarioId: req.usuario?._id || null,
      pedidoId: pedidoCompleto._id,
      numeroPedido: pedidoCompleto.numero,
      prospectoId: prospecto._id
    });

    res.status(201).json({
      message: 'Pedido creado exitosamente desde etapa',
      pedido: pedidoCompleto,
      totales: {
        subtotal: totales.subtotalProductos,
        instalacion: instalacion?.cobra ? instalacion.precio : 0,
        descuento: totales.montoDescuento,
        iva: totales.ivaCalculado,
        total: totales.totalFinal,
        anticipo: Math.round(totales.totalFinal * 0.6),
        saldo: Math.round(totales.totalFinal * 0.4)
      }
    });

  } catch (error) {
    logger.error('Error creando pedido directamente desde etapa', {
      ruta: 'pedidosRoutes',
      accion: 'crearPedidoDesdeEtapa',
      usuarioId: req.usuario?._id || null,
      bodyKeys: Object.keys(req.body || {}),
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      message: 'Error interno del servidor al crear pedido',
      error: error.message
    });
  }
});

// Función auxiliar para generar número de pedido
async function generarNumeroPedido() {
  try {
    const year = new Date().getFullYear();
    const count = await Pedido.countDocuments({
      createdAt: {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1)
      }
    });
    return `PED-${year}-${String(count + 1).padStart(4, '0')}`;
  } catch (error) {
    logger.error('Error generando número de pedido', {
      ruta: 'pedidosRoutes',
      accion: 'generarNumeroPedido',
      error: error.message,
      stack: error.stack
    });
    return `PED-${new Date().getFullYear()}-${Date.now()}`;
  }
}

module.exports = router;

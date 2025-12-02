const OrdenCompra = require('../models/OrdenCompra');
const logger = require('../config/logger');

// Crear una nueva orden de compra
exports.crearOrdenCompra = async (req, res) => {
  try {
    const { proveedor, pedido, fechaEntregaEsperada, productos, notas } = req.body;

    let subtotal = 0;
    const productosCalculados = productos.map(p => {
      const costoTotal = p.cantidad * p.costoUnitario;
      subtotal += costoTotal;
      return { ...p, costoTotal };
    });
    
    // Asumimos un IVA del 16% por ahora, esto podría ser configurable
    const impuestos = subtotal * 0.16;
    const total = subtotal + impuestos;

    const nuevaOrden = new OrdenCompra({
      proveedor,
      pedido,
      fechaEntregaEsperada,
      productos: productosCalculados,
      subtotal,
      impuestos,
      total,
      saldoPendiente: total,
      notas,
      creadaPor: req.usuario._id,
    });

    const ordenGuardada = await nuevaOrden.save();

    logger.info('Nueva orden de compra creada', {
      controlador: 'ordenCompraController',
      accion: 'crearOrdenCompra',
      ordenId: ordenGuardada._id,
      usuarioId: req.usuario._id
    });

    res.status(201).json(ordenGuardada);
  } catch (error) {
    logger.error('Error creando orden de compra', {
      controlador: 'ordenCompraController',
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Obtener todas las órdenes de compra
exports.obtenerOrdenesCompra = async (req, res) => {
  try {
    const { page = 1, limit = 10, estado, proveedor } = req.query;
    const filtros = {};
    if (estado) filtros.estado = estado;
    if (proveedor) 'proveedor.nombre': { $regex: proveedor, $options: 'i' } });

    const opciones = { 
      page: parseInt(page), 
      limit: parseInt(limit), 
      sort: { fechaEmision: -1 },
      populate: 'creadaPor pedido' 
    };
    
    const ordenes = await OrdenCompra.paginate(filtros, opciones);
    res.status(200).json(ordenes);
  } catch (error) {
    logger.error('Error obteniendo órdenes de compra', {
      controlador: 'ordenCompraController',
      error: error.message,
    });
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Obtener una orden de compra por ID
exports.obtenerOrdenCompraPorId = async (req, res) => {
  try {
    const orden = await OrdenCompra.findById(req.params.id).populate('creadaPor pedido productos.producto');
    if (!orden) {
      return res.status(404).json({ message: 'Orden de compra no encontrada' });
    }
    res.status(200).json(orden);
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Registrar un pago a una orden de compra
exports.registrarPago = async (req, res) => {
  try {
    const { monto, metodo, referencia, comprobanteUrl } = req.body;
    const orden = await OrdenCompra.findById(req.params.id);

    if (!orden) {
      return res.status(404).json({ message: 'Orden de compra no encontrada' });
    }

    orden.pagos.push({
      monto,
      metodo,
      referencia,
      comprobanteUrl,
      registradoPor: req.usuario._id
    });

    // El middleware pre-save se encargará de recalcular el saldo
    const ordenActualizada = await orden.save();

    logger.info('Pago registrado en orden de compra', {
      controlador: 'ordenCompraController',
      accion: 'registrarPago',
      ordenId: ordenActualizada._id,
      montoPagado: monto,
      usuarioId: req.usuario._id
    });

    res.status(200).json(ordenActualizada);
  } catch (error) {
    logger.error('Error registrando pago en orden de compra', {
      controlador: 'ordenCompraController',
      error: error.message
    });
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Actualizar el estado de una orden de compra
exports.actualizarEstado = async (req, res) => {
  try {
    const { estado } = req.body;
    const orden = await OrdenCompra.findByIdAndUpdate(
      req.params.id, 
      { estado }, 
      { new: true }
    );

    if (!orden) {
      return res.status(404).json({ message: 'Orden de compra no encontrada' });
    }

    logger.info('Estado de orden de compra actualizado', {
      controlador: 'ordenCompraController',
      accion: 'actualizarEstado',
      ordenId: orden._id,
      nuevoEstado: estado,
      usuarioId: req.usuario._id
    });

    res.status(200).json(orden);
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};
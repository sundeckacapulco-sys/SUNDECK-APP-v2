const express = require('express');
const Pedido = require('../models/Pedido');
const Cotizacion = require('../models/Cotizacion');
const Prospecto = require('../models/Prospecto');
const { auth, verificarPermiso } = require('../middleware/auth');

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

    res.status(201).json({
      message: 'Pedido creado exitosamente desde cotización',
      pedido: nuevoPedido
    });
  } catch (error) {
    console.error('Error convirtiendo cotización en pedido:', error);
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
    console.error('Error obteniendo pedido:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;

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

// Aplicar anticipo y convertir cotización a pedido automáticamente
router.post('/aplicar-anticipo/:cotizacionId', auth, verificarPermiso('pedidos', 'crear'), async (req, res) => {
  try {
    const { cotizacionId } = req.params;
    const { 
      metodoPago,
      referencia,
      comprobante,
      fechaPago = new Date(),
      direccionEntrega,
      contactoEntrega,
      observaciones
    } = req.body;

    // Verificar que la cotización existe
    const cotizacion = await Cotizacion.findById(cotizacionId).populate('prospecto');
    if (!cotizacion) {
      return res.status(404).json({ message: 'Cotización no encontrada' });
    }

    // Verificar si ya existe un pedido para esta cotización
    const pedidoExistente = await Pedido.findOne({ cotizacion: cotizacionId });
    if (pedidoExistente) {
      return res.status(400).json({ message: 'Ya existe un pedido para esta cotización' });
    }

    // Calcular fechas estimadas basadas en productos
    const fechaInicio = new Date();
    const tiempoMaxFabricacion = Math.max(...cotizacion.productos.map(p => p.tiempoFabricacion || 15));
    const fechaFinFabricacion = new Date(fechaInicio);
    fechaFinFabricacion.setDate(fechaFinFabricacion.getDate() + tiempoMaxFabricacion);
    
    const fechaInstalacion = new Date(fechaFinFabricacion);
    fechaInstalacion.setDate(fechaInstalacion.getDate() + (cotizacion.tiempoInstalacion || 1));

    // Crear el pedido automáticamente
    const nuevoPedido = new Pedido({
      cotizacion: cotizacionId,
      prospecto: cotizacion.prospecto._id,
      montoTotal: cotizacion.total,
      anticipo: {
        monto: cotizacion.formaPago?.anticipo?.monto || (cotizacion.total * 0.6),
        porcentaje: cotizacion.formaPago?.anticipo?.porcentaje || 60,
        fechaPago: new Date(fechaPago),
        metodoPago: metodoPago || 'transferencia',
        referencia: referencia || '',
        comprobante: comprobante || '',
        pagado: true // Se marca como pagado al aplicar
      },
      saldo: {
        monto: cotizacion.formaPago?.saldo?.monto || (cotizacion.total * 0.4),
        porcentaje: cotizacion.formaPago?.saldo?.porcentaje || 40,
        fechaVencimiento: fechaInstalacion, // Vence el día de instalación
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
        calle: cotizacion.prospecto.direccion?.calle || '',
        colonia: cotizacion.prospecto.direccion?.colonia || '',
        ciudad: cotizacion.prospecto.direccion?.ciudad || 'Acapulco, Guerrero',
        codigoPostal: cotizacion.prospecto.direccion?.codigoPostal || '',
        referencias: cotizacion.prospecto.direccion?.referencias || ''
      },
      contactoEntrega: contactoEntrega || {
        nombre: cotizacion.prospecto.nombre,
        telefono: cotizacion.prospecto.telefono,
        horarioPreferido: '9:00 AM - 6:00 PM'
      },
      fechaInicioFabricacion: fechaInicio,
      fechaFinFabricacion: fechaFinFabricacion,
      fechaInstalacion: fechaInstalacion,
      fechaEntrega: fechaInstalacion,
      vendedor: cotizacion.elaboradaPor,
      estado: 'confirmado',
      notas: [{
        usuario: req.usuario._id,
        contenido: `🎉 Pedido creado automáticamente al recibir anticipo de $${(cotizacion.formaPago?.anticipo?.monto || (cotizacion.total * 0.6)).toLocaleString()}. Método: ${metodoPago}. ${observaciones ? 'Obs: ' + observaciones : ''}`,
        tipo: 'pago'
      }]
    });

    await nuevoPedido.save();
    await nuevoPedido.populate([
      { path: 'prospecto', select: 'nombre telefono email direccion' },
      { path: 'cotizacion', select: 'numero' },
      { path: 'vendedor', select: 'nombre apellido' }
    ]);

    // Actualizar estado de la cotización
    cotizacion.estado = 'convertida';
    cotizacion.fechaRespuesta = new Date();
    await cotizacion.save();

    // Actualizar prospecto con timeline completo
    await Prospecto.findByIdAndUpdate(cotizacion.prospecto._id, {
      etapa: 'pedido',
      fechaUltimoContacto: new Date(),
      $push: {
        etapas: {
          nombre: 'Anticipo Recibido - Pedido Confirmado',
          fechaHora: new Date(),
          observaciones: `💰 Anticipo de $${nuevoPedido.anticipo.monto.toLocaleString()} recibido vía ${metodoPago}. Pedido ${nuevoPedido.numero} confirmado. Fabricación inicia: ${fechaInicio.toLocaleDateString('es-MX')}. Entrega estimada: ${fechaInstalacion.toLocaleDateString('es-MX')}`,
          usuario: req.usuario._id
        },
        notas: {
          fecha: new Date(),
          usuario: req.usuario._id,
          contenido: `🚀 ¡PEDIDO CONFIRMADO! Anticipo recibido: $${nuevoPedido.anticipo.monto.toLocaleString()}. Saldo pendiente: $${nuevoPedido.saldo.monto.toLocaleString()}. Tiempo de fabricación: ${tiempoMaxFabricacion} días.`,
          tipo: 'nota',
          categoria: 'General'
        }
      }
    });

    res.status(201).json({
      message: '¡Anticipo aplicado y pedido creado exitosamente!',
      pedido: nuevoPedido,
      timeline: {
        fechaInicio: fechaInicio,
        fechaFinFabricacion: fechaFinFabricacion,
        fechaInstalacion: fechaInstalacion,
        tiempoFabricacion: tiempoMaxFabricacion
      }
    });
  } catch (error) {
    console.error('Error aplicando anticipo:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

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
    console.error('Error actualizando fabricación:', error);
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
    console.error('Error registrando pago de saldo:', error);
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

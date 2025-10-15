const express = require('express');
const Fabricacion = require('../models/Fabricacion');
const Pedido = require('../models/Pedido');
const { auth, verificarPermiso } = require('../middleware/auth');
const CotizacionMappingService = require('../services/cotizacionMappingService');

const router = express.Router();

// Obtener órdenes de producción
router.get('/', auth, verificarPermiso('fabricacion', 'leer'), async (req, res) => {
  try {
    const { estado, prioridad, fechaDesde, fechaHasta } = req.query;
    const filtros = {};
    
    if (estado) filtros.estado = estado;
    if (prioridad) filtros.prioridad = prioridad;
    
    if (fechaDesde && fechaHasta) {
      filtros.fechaInicio = {
        $gte: new Date(fechaDesde),
        $lte: new Date(fechaHasta)
      };
    }

    const ordenes = await Fabricacion.find(filtros)
      .populate('pedido', 'numero total')
      .populate('prospecto', 'nombre telefono')
      .populate('asignadoA', 'nombre apellido')
      .sort({ prioridad: -1, fechaInicio: 1 });

    res.json(ordenes);
  } catch (error) {
    console.error('Error obteniendo órdenes de producción:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Crear orden de producción desde pedido
router.post('/desde-pedido/:pedidoId', auth, verificarPermiso('fabricacion', 'crear'), async (req, res) => {
  try {
    const { pedidoId } = req.params;
    const {
      fechaInicioDeseada,
      prioridad = 'media',
      observacionesProduccion = '',
      asignadoA = null
    } = req.body;

    // Verificar que el pedido existe
    const pedido = await Pedido.findById(pedidoId)
      .populate('prospecto', 'nombre telefono direccion');
    
    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    if (pedido.estado !== 'confirmado') {
      return res.status(400).json({ 
        message: 'Solo se pueden enviar a producción pedidos confirmados' 
      });
    }

    // Verificar si ya existe una orden de producción para este pedido
    const ordenExistente = await Fabricacion.findOne({ pedido: pedidoId });
    if (ordenExistente) {
      return res.status(400).json({ 
        message: 'Ya existe una orden de producción para este pedido' 
      });
    }

    // Generar payload unificado para producción
    const payloadProduccion = CotizacionMappingService.generarPayloadUnificado({
      prospectoId: pedido.prospecto._id,
      productos: pedido.productos,
      origen: 'pedido_confirmado'
    }, 'produccion');

    // Calcular tiempos de fabricación
    const tiemposFabricacion = calcularTiemposFabricacion(pedido.productos);

    // Crear orden de producción
    const nuevaOrden = new Fabricacion({
      numero: await generarNumeroProduccion(),
      pedido: pedido._id,
      prospecto: pedido.prospecto._id,
      estado: 'pendiente',
      prioridad,
      
      // Información del cliente
      cliente: {
        nombre: pedido.prospecto.nombre,
        telefono: pedido.prospecto.telefono,
        direccion: pedido.prospecto.direccion || ''
      },
      
      // Detalles técnicos para fabricación
      detallesTecnicos: payloadProduccion.detallesTecnicos,
      
      // Productos con información técnica completa
      productos: pedido.productos.map(producto => ({
        ...producto.toObject(),
        // Información técnica adicional para fabricación
        especificacionesTecnicas: {
          requiereR24: producto.requiereR24 || (producto.ancho > 2.5 || producto.alto > 2.5),
          tiempoFabricacionEstimado: producto.tiempoFabricacion || calcularTiempoProducto(producto),
          materialEspecial: producto.esToldo || producto.motorizado,
          observacionesFabricacion: generarObservacionesFabricacion(producto)
        }
      })),
      
      // Tiempos calculados
      tiempos: {
        fabricacionEstimada: tiemposFabricacion.total,
        inicioDeseado: fechaInicioDeseada ? new Date(fechaInicioDeseada) : new Date(),
        finEstimado: calcularFechaFinEstimada(
          fechaInicioDeseada || new Date(), 
          tiemposFabricacion.total
        )
      },
      
      // Asignación
      asignadoA: asignadoA || null,
      fechaAsignacion: asignadoA ? new Date() : null,
      
      // Observaciones
      observaciones: observacionesProduccion,
      
      // Historial inicial
      historial: [{
        fecha: new Date(),
        estado: 'pendiente',
        usuario: req.usuario._id,
        observaciones: 'Orden de producción creada desde pedido'
      }]
    });

    const ordenGuardada = await nuevaOrden.save();
    
    // Actualizar estado del pedido
    pedido.estado = 'en_produccion';
    pedido.fechaInicioProduccion = new Date();
    await pedido.save();

    // Poblar datos para respuesta
    const ordenCompleta = await Fabricacion.findById(ordenGuardada._id)
      .populate('pedido', 'numero total')
      .populate('prospecto', 'nombre telefono')
      .populate('asignadoA', 'nombre apellido');

    console.log('✅ Orden de producción creada:', ordenCompleta.numero);

    res.status(201).json({
      message: 'Orden de producción creada exitosamente',
      orden: ordenCompleta,
      tiempos: tiemposFabricacion
    });

  } catch (error) {
    console.error('❌ Error creando orden de producción:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor al crear orden de producción',
      error: error.message 
    });
  }
});

// Actualizar estado de orden de producción
router.patch('/:id/estado', auth, verificarPermiso('fabricacion', 'actualizar'), async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, observaciones = '', fechaCompletado = null } = req.body;

    const estadosValidos = ['pendiente', 'en_proceso', 'pausada', 'completada', 'cancelada'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ 
        message: 'Estado no válido. Estados permitidos: ' + estadosValidos.join(', ')
      });
    }

    const orden = await Fabricacion.findById(id);
    if (!orden) {
      return res.status(404).json({ message: 'Orden de producción no encontrada' });
    }

    // Actualizar estado
    const estadoAnterior = orden.estado;
    orden.estado = estado;
    
    // Manejar fechas según el estado
    if (estado === 'en_proceso' && estadoAnterior === 'pendiente') {
      orden.fechaInicio = new Date();
    }
    
    if (estado === 'completada') {
      orden.fechaCompletado = fechaCompletado ? new Date(fechaCompletado) : new Date();
      
      // Actualizar pedido relacionado
      await Pedido.findByIdAndUpdate(orden.pedido, {
        estado: 'fabricado',
        fechaFabricacion: orden.fechaCompletado
      });
    }

    // Agregar entrada al historial
    orden.historial.push({
      fecha: new Date(),
      estado: estado,
      usuario: req.usuario._id,
      observaciones: observaciones || `Cambio de estado: ${estadoAnterior} → ${estado}`
    });

    await orden.save();

    const ordenActualizada = await Fabricacion.findById(id)
      .populate('pedido', 'numero')
      .populate('prospecto', 'nombre')
      .populate('asignadoA', 'nombre apellido');

    res.json({
      message: 'Estado actualizado exitosamente',
      orden: ordenActualizada
    });

  } catch (error) {
    console.error('Error actualizando estado de producción:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Funciones auxiliares
function calcularTiemposFabricacion(productos) {
  let tiempoTotal = 0;
  const detalles = [];

  for (const producto of productos) {
    let tiempoProducto = 0;
    
    // Tiempo base según tipo de producto
    if (producto.esToldo) {
      tiempoProducto = 3; // 3 días para toldos
    } else if (producto.motorizado) {
      tiempoProducto = 2; // 2 días para motorizados
    } else {
      tiempoProducto = 1; // 1 día para productos estándar
    }
    
    // Tiempo adicional por R24
    if (producto.requiereR24 || producto.ancho > 2.5 || producto.alto > 2.5) {
      tiempoProducto += 1;
    }
    
    // Multiplicar por cantidad
    const tiempoTotalProducto = tiempoProducto * (producto.cantidad || 1);
    tiempoTotal += tiempoTotalProducto;
    
    detalles.push({
      ubicacion: producto.ubicacion,
      tiempoUnitario: tiempoProducto,
      cantidad: producto.cantidad || 1,
      tiempoTotal: tiempoTotalProducto
    });
  }

  return {
    total: Math.max(tiempoTotal, 1), // Mínimo 1 día
    detalles
  };
}

function calcularTiempoProducto(producto) {
  let tiempo = 1; // Base
  
  if (producto.esToldo) tiempo += 2;
  if (producto.motorizado) tiempo += 1;
  if (producto.requiereR24) tiempo += 1;
  
  return tiempo;
}

function calcularFechaFinEstimada(fechaInicio, diasFabricacion) {
  const fecha = new Date(fechaInicio);
  fecha.setDate(fecha.getDate() + diasFabricacion);
  return fecha;
}

function generarObservacionesFabricacion(producto) {
  const observaciones = [];
  
  if (producto.requiereR24) {
    observaciones.push('Requiere R24 - Medidas especiales');
  }
  
  if (producto.esToldo) {
    observaciones.push(`Toldo ${producto.tipoToldo} - Kit: ${producto.kitModelo}`);
  }
  
  if (producto.motorizado) {
    observaciones.push(`Motorizado - Motor: ${producto.motorModelo}, Control: ${producto.controlModelo}`);
  }
  
  if (producto.observaciones) {
    observaciones.push(`Observaciones cliente: ${producto.observaciones}`);
  }
  
  return observaciones.join(' | ');
}

async function generarNumeroProduccion() {
  try {
    const year = new Date().getFullYear();
    const count = await Fabricacion.countDocuments({
      createdAt: {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1)
      }
    });
    return `PROD-${year}-${String(count + 1).padStart(4, '0')}`;
  } catch (error) {
    console.error('Error generando número de producción:', error);
    return `PROD-${new Date().getFullYear()}-${Date.now()}`;
  }
}

module.exports = router;

const Cotizacion = require('../models/Cotizacion');
const Prospecto = require('../models/Prospecto');

exports.crearCotizacion = async (req, res) => {
  try {
    console.log('Backend: Recibiendo solicitud para crear cotización...');
    console.log('Backend: req.body recibido:', JSON.stringify(req.body, null, 2));

    const {
      prospecto: prospectoId,
      nombre,
      productos,
      comentarios,
      precioGeneralM2,
      fechaCreacion,
      unidadMedida,
      incluyeInstalacion,
      costoInstalacion,
      tipoInstalacion,
      descuento,
      requiereFactura,
      metodoPagoAnticipo,
      tiempoEntrega,
      diasEntregaExpres,
      incluirTerminos
    } = req.body;

    if (!prospectoId) {
      console.error('Error: prospectoId no proporcionado.');
      return res.status(400).json({ message: 'Debes proporcionar el prospecto asociado a la cotización.' });
    }
    if (!Array.isArray(productos) || productos.length === 0) {
      console.error('Error: No se proporcionaron productos o el formato es incorrecto.');
      return res.status(400).json({ message: 'Debes proporcionar al menos un producto para la cotización.' });
    }

    const prospecto = await Prospecto.findById(prospectoId);
    if (!prospecto) {
      console.error(`Error: Prospecto con ID ${prospectoId} no encontrado.`);
      return res.status(404).json({ message: 'Prospecto no encontrado' });
    }

    // Calcular totales utilizando la función auxiliar
    const { subtotal, montoDescuento, ivaCalculado, totalFinal, baseParaDescuento, debeIncluirIVA } = calcularTotalesCotizacion({
      productos,
      precioGeneralM2,
      incluyeInstalacion,
      costoInstalacion,
      descuento,
      requiereFactura
    });
    
    const numeroCotizacion = await generarNumeroCotizacion();

    const nuevaCotizacion = new Cotizacion({
      numero: numeroCotizacion,
      prospecto: prospecto._id,
      nombre: nombre || `Cotización para ${prospecto.nombre}`,
      fecha: fechaCreacion ? new Date(fechaCreacion) : new Date(),
      estado: 'Activa',
      productos: productos.map(p => ({
        ubicacion: p.ubicacion,
        cantidad: p.cantidad || 1,
        ancho: p.ancho,
        alto: p.alto,
        area: p.area,
        productoId: p.productoId, // Asegúrate de que p.productoId sea un ObjectId válido o String que mongoose pueda castear
        nombreProducto: p.nombreProducto,
        color: p.color,
        precioM2: p.precioM2,
        observaciones: p.observaciones,
        fotoUrls: p.fotoUrls || [],
        videoUrl: p.videoUrl || '',
        esToldo: p.esToldo,
        tipoToldo: p.tipoToldo,
        kitModelo: p.kitModelo,
        kitModeloManual: p.kitModeloManual,
        kitPrecio: p.kitPrecio,
        motorizado: p.motorizado,
        motorModelo: p.motorModelo,
        motorModeloManual: p.motorModeloManual,
        motorPrecio: p.motorPrecio,
        controlModelo: p.controlModelo,
        controlModeloManual: p.controlModeloManual,
        controlPrecio: p.controlPrecio,
      })),
      comentarios,
      precioGeneralM2,
      unidadMedida,
      instalacion: {
        incluye: incluyeInstalacion,
        costo: costoInstalacion,
        tipo: tipoInstalacion
      },
      descuento: descuento ? {
        tipo: descuento.tipo,
        valor: descuento.valor,
        monto: montoDescuento,
      } : undefined,
      facturacion: {
        requiere: requiereFactura,
        iva: ivaCalculado,
      },
      pago: {
        metodoAnticipo: metodoPagoAnticipo,
      },
      entrega: {
        tipo: tiempoEntrega,
        diasExpres: diasEntregaExpres,
      },
      terminos: {
        incluir: incluirTerminos
      },
      subtotal: subtotal,
      iva: ivaCalculado,
      total: totalFinal,
      elaboradaPor: req.usuario?._id || null, // req.usuario?._id podría ser null/undefined si no hay autenticación
      validoHasta: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    const cotizacionGuardada = await nuevaCotizacion.save();
    console.log('Backend: Cotización guardada exitosamente:', cotizacionGuardada._id);

    prospecto.etapa = 'cotizacion';
    prospecto.fechaUltimoContacto = new Date();
    await prospecto.save();
    console.log(`Backend: Prospecto ${prospectoId} actualizado a etapa 'cotizacion'.`);

    res.status(201).json({
      message: 'Cotización creada exitosamente',
      cotizacion: cotizacionGuardada
    });

  } catch (error) {
    console.error('Backend: Error creando cotización:', error);

    if (error.name === 'ValidationError') {
      console.error('Backend: Errores de validación detallados:', error.errors);
      return res.status(400).json({
        message: 'Datos inválidos para crear la cotización',
        errors: extraerErroresValidacion(error)
      });
    }

    res.status(500).json({
      message: 'Error interno del servidor al crear la cotización',
      error: error.message
    });
  }
};

async function generarNumeroCotizacion() {
  try {
    const year = new Date().getFullYear();
    const count = await Cotizacion.countDocuments({
      createdAt: {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1)
      }
    });
    return `COT-${year}-${String(count + 1).padStart(4, '0')}`;
  } catch (error) {
    console.error('Error generando número de cotización:', error);
    return `COT-${new Date().getFullYear()}-${Date.now()}`;
  }
}

// Función auxiliar para calcular todos los totales
function calcularTotalesCotizacion({ productos = [], precioGeneralM2, incluyeInstalacion, costoInstalacion, descuento, requiereFactura }) {
  let subtotalProductos = 0;

  for (const pieza of productos) {
    const area = pieza.area || ((parseFloat(pieza.ancho) || 0) * (parseFloat(pieza.alto) || 0));
    const precio = parseFloat(pieza.precioM2) || parseFloat(precioGeneralM2) || 0;
    const cantidad = pieza.cantidad || 1;
    
    subtotalProductos += (area * precio * cantidad);
    
    if (pieza.esToldo && pieza.kitPrecio) {
      subtotalProductos += (parseFloat(pieza.kitPrecio) || 0) * cantidad;
    }
    if (pieza.motorizado && pieza.motorPrecio) {
      subtotalProductos += (parseFloat(pieza.motorPrecio) || 0) * cantidad;
    }
    if (pieza.motorizado && pieza.controlPrecio) {
      subtotalProductos += (parseFloat(pieza.controlPrecio) || 0);
    }
  }

  let baseParaDescuento = subtotalProductos;
  if (incluyeInstalacion && costoInstalacion) {
    baseParaDescuento += parseFloat(costoInstalacion);
  }

  let montoDescuento = 0;
  if (descuento && descuento.tipo && descuento.valor) {
    const valorDescuento = parseFloat(descuento.valor);
    if (descuento.tipo === 'porcentaje') {
      montoDescuento = (baseParaDescuento * valorDescuento) / 100;
    } else if (descuento.tipo === 'monto') {
      montoDescuento = valorDescuento;
    }
  }

  const subtotalTrasDescuento = Math.max(baseParaDescuento - montoDescuento, 0);

  let debeIncluirIVA = Boolean(requiereFactura);

  let ivaCalculado = 0;
  if (debeIncluirIVA) {
    ivaCalculado = Number((subtotalTrasDescuento * 0.16).toFixed(2));
  }

  const totalFinal = Number((subtotalTrasDescuento + ivaCalculado).toFixed(2));

  return {
    subtotal: Number(subtotalProductos.toFixed(2)),
    montoDescuento: Number(montoDescuento.toFixed(2)),
    ivaCalculado: ivaCalculado,
    totalFinal: totalFinal,
    baseParaDescuento: Number(baseParaDescuento.toFixed(2)),
    debeIncluirIVA: debeIncluirIVA
  };
}

function extraerErroresValidacion(error) {
  const errores = {};
  // Aquí se extraen los mensajes de error de validación de Mongoose
  if (error.errors) {
    Object.keys(error.errors).forEach((campo) => {
      errores[campo] = error.errors[campo].message;
    });
  }
  return errores;
}

function prepararNotas({ comentarios, usuarioId }) {
  if (!comentarios) {
    return [];
  }
  return [{
    contenido: comentarios,
    usuario: usuarioId,
    fecha: new Date()
  }];
}
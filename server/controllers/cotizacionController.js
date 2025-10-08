const Cotizacion = require('../models/Cotizacion');
const Prospecto = require('../models/Prospecto');

exports.crearCotizacion = async (req, res) => {
  try {
    console.log('Backend: Recibiendo solicitud para crear cotización...');
    console.log('Backend: req.body recibido:', JSON.stringify(req.body, null, 2));

    const {
      prospecto: prospectoId, // frontend envía 'prospecto'
      nombre, // nombre de la cotización
      productos, // array de productos con detalles anidados
      comentarios,
      precioGeneralM2,
      fechaCreacion,
      unidadMedida,
      incluyeInstalacion,
      costoInstalacion,
      tipoInstalacion,
      descuento, // objeto {tipo: 'porcentaje'/'monto', valor: Number}
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
      unidadMedida,
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
        // Asegúrate de que el esquema de Cotizacion.productos sea flexible o coincida con esta estructura
        ubicacion: p.ubicacion,
        cantidad: p.cantidad, // `cantidad` se gestiona a nivel de pieza en el frontend
        medidas: p.medidas.map(m => ({
          ancho: m.ancho,
          alto: m.alto,
          area: m.area,
          productoId: m.productoId,
          nombreProducto: m.nombreProducto,
          color: m.color,
          precioM2: m.precioM2,
        })),
        observaciones: p.observaciones,
        fotoUrls: p.fotoUrls,
        videoUrl: p.videoUrl,
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
      descuento: descuento ? { // Mapear el objeto de descuento
        tipo: descuento.tipo,
        valor: descuento.valor,
        monto: montoDescuento, // Guardar el monto calculado del descuento
      } : undefined,
      facturacion: {
        requiere: requiereFactura,
        iva: ivaCalculado,
      },
      pago: {
        metodoAnticipo: metodoPagoAnticipo,
        // Aquí puedes calcular y guardar anticipo y saldo si tu modelo lo tiene
      },
      entrega: {
        tipo: tiempoEntrega,
        diasExpres: diasEntregaExpres,
        // Puedes añadir la fecha estimada de entrega aquí si la calculas en el backend
      },
      terminos: {
        incluir: incluirTerminos
      },
      subtotal: subtotal,
      iva: ivaCalculado,
      total: totalFinal,
      elaboradaPor: req.usuario?._id || null, // Asegúrate de tener req.usuario
      validoHasta: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días por defecto
    });

    const cotizacionGuardada = await nuevaCotizacion.save();
    console.log('Backend: Cotización guardada exitosamente:', cotizacionGuardada._id);

    // Actualizar el estado del prospecto
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
      console.error('Backend: Errores de validación:', error.errors);
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
function calcularTotalesCotizacion({ productos = [], precioGeneralM2, unidadMedida, incluyeInstalacion, costoInstalacion, descuento, requiereFactura }) {
  let subtotalProductos = 0;

  for (const pieza of productos) {
    // AHORA PIEZA.MEDIDAS ES UN ARRAY, PERO ASEGURAMOS QUE NO SEA UNDEFINED O NULL
    for (const medida of (pieza.medidas || [])) { // <-- CAMBIO AQUÍ
      const area = medida.area || ((parseFloat(medida.ancho) || 0) * (parseFloat(medida.alto) || 0));
      const precio = parseFloat(medida.precioM2) || parseFloat(precioGeneralM2) || 0;
      subtotalProductos += area * precio;
    }
    // Añadir precios de kit, motor y control si aplican por pieza
    if (pieza.esToldo && pieza.kitPrecio) {
      subtotalProductos += parseFloat(pieza.kitPrecio) * (pieza.medidas?.length || 1);
    }
    if (pieza.motorizado && pieza.motorPrecio) {
      subtotalProductos += parseFloat(pieza.motorPrecio) * (pieza.medidas?.length || 1);
    }
    if (pieza.motorizado && pieza.controlPrecio) {
      subtotalProductos += parseFloat(pieza.controlPrecio); // Control es por partida, no por medida individual
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

  let debeIncluirIVA = Boolean(requiereFactura); // Si requiere factura, siempre incluye IVA

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
  Object.keys(error.errors || {}).forEach((campo) => {
    errores[campo] = error.errors[campo].message;
  });
  return errores;
}

// Helper para convertir el campo 'comentarios' a un formato de 'notas' si es necesario
// Adaptado para el nuevo payload de frontend
function prepararNotas({ comentarios, usuarioId }) {
  if (!comentarios) {
    return [];
  }
  return [{
    contenido: comentarios,
    usuario: usuarioId, // Si el usuario está disponible en req.usuario
    fecha: new Date()
  }];
}
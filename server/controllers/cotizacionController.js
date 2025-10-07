const Cotizacion = require('../models/Cotizacion');
const Prospecto = require('../models/Prospecto');

exports.crearCotizacion = async (req, res) => {
  try {
    console.log('Backend: Recibiendo solicitud para crear cotización...');
    console.log('Backend: req.body recibido:', JSON.stringify(req.body, null, 2));

    const {
      prospecto: prospectoBody,
      prospectoId: prospectoIdBody,
      nombre,
      productos: productosBody = [],
      comentarios,
      precioGeneralM2,
      fechaCreacion,
      unidadMedida,
      incluyeInstalacion,
      costoInstalacion: costoInstalacionBody,
      tipoInstalacion,
      descuento,
      requiereFactura,
      metodoPagoAnticipo,
      tiempoEntrega,
      diasEntregaExpres,
      incluirTerminos,
      mediciones = [],
      validoHasta,
      formaPago,
      tiempoFabricacion,
      tiempoInstalacion,
      requiereInstalacion,
      garantia,
      notas,
      incluirIVA,
      subtotal,
      iva,
      total,
      numero
    } = req.body;

    const prospectoId = prospectoBody || prospectoIdBody;

    if (!prospectoId) {
      console.error('Error: prospectoId no proporcionado.');
      return res.status(400).json({ message: 'Debes proporcionar el prospecto asociado a la cotización.' });
    }

    if (!Array.isArray(productosBody) || productosBody.length === 0) {
      console.error('Error: No se proporcionaron productos o el formato es incorrecto.');
      return res.status(400).json({ message: 'Debes proporcionar al menos un producto para la cotización.' });
    }

    const prospecto = await Prospecto.findById(prospectoId);
    if (!prospecto) {
      console.error(`Error: Prospecto con ID ${prospectoId} no encontrado.`);
      return res.status(404).json({ message: 'Prospecto no encontrado' });
    }

    const totales = calcularTotalesCotizacion({
      productos: productosBody,
      precioGeneralM2,
      incluyeInstalacion,
      requiereInstalacion,
      costoInstalacion: costoInstalacionBody,
      descuento,
      requiereFactura,
      incluirIVA,
      subtotal,
      iva,
      total
    });

    const numeroCotizacion = numero || await generarNumeroCotizacion();

    const productosNormalizados = productosBody.map((producto) => normalizarProducto(producto));
    const requiereInstalacionFinal = obtenerBanderaInstalacion(incluyeInstalacion, requiereInstalacion);
    const costoInstalacionNormalizado = requiereInstalacionFinal ? totales.costoInstalacion : 0;

    const nuevaCotizacion = new Cotizacion({
      numero: numeroCotizacion,
      prospecto: prospecto._id,
      nombre: nombre || `Cotización para ${prospecto.nombre}`,
      fecha: fechaCreacion ? new Date(fechaCreacion) : new Date(),
      validoHasta: validarFecha(validoHasta),
      estado: req.body.estado || 'borrador',
      productos: productosNormalizados,
      mediciones,
      comentarios,
      precioGeneralM2,
      unidadMedida,
      subtotal: totales.subtotalBase,
      descuento: totales.descuentoNormalizado ? {
        porcentaje: totales.descuentoNormalizado.porcentaje,
        monto: totales.descuentoNormalizado.monto,
        motivo: totales.descuentoNormalizado.motivo
      } : undefined,
      iva: totales.ivaCalculado,
      total: totales.totalFinal,
      incluirIVA: totales.debeIncluirIVA,
      formaPago,
      tiempoFabricacion,
      tiempoInstalacion,
      requiereInstalacion: requiereInstalacionFinal,
      costoInstalacion: costoInstalacionNormalizado,
      garantia,
      notas: prepararNotas({ notas, comentarios, usuarioId: req.usuario?._id }),
      elaboradaPor: req.usuario?._id || req.body.elaboradaPor || prospecto.asignadoA || prospecto.usuarioAsignado,
      instalacion: {
        incluye: requiereInstalacionFinal,
        costo: costoInstalacionBody,
        tipo: tipoInstalacion
      },
      descuentoDetalle: descuento && typeof descuento === 'object' ? {
        tipo: descuento.tipo,
        valor: parseNumber(descuento.valor),
        monto: totales.montoDescuento
      } : undefined,
      facturacion: {
        requiere: requiereFactura,
        iva: totales.ivaCalculado
      },
      pago: {
        metodoAnticipo: metodoPagoAnticipo
      },
      entrega: {
        tipo: tiempoEntrega,
        diasExpres: diasEntregaExpres
      },
      terminos: {
        incluir: incluirTerminos
      }
    });

    const cotizacionGuardada = await nuevaCotizacion.save();
    await cotizacionGuardada.populate([
      { path: 'prospecto', select: 'nombre telefono email' },
      { path: 'elaboradaPor', select: 'nombre apellido' }
    ]);
    console.log('Backend: Cotización guardada exitosamente:', cotizacionGuardada._id);

    prospecto.etapa = 'cotizacion';
    prospecto.fechaUltimoContacto = new Date();

    if (!prospecto.producto || prospecto.producto.trim() === '') {
      const primerProducto = productosBody[0] || {};
      prospecto.producto = primerProducto.nombre || primerProducto.descripcion || 'Producto cotizado';
    }

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

function parseNumber(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

function esVerdadero(valor) {
  if (typeof valor === 'string') {
    return valor.toLowerCase() === 'true' || valor === '1';
  }
  return Boolean(valor);
}

function validarFecha(fecha) {
  if (!fecha) {
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }

  const parsed = new Date(fecha);
  return Number.isNaN(parsed.getTime())
    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    : parsed;
}

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

function calcularTotalesCotizacion({
  productos = [],
  precioGeneralM2,
  incluyeInstalacion,
  requiereInstalacion,
  costoInstalacion,
  descuento,
  requiereFactura,
  incluirIVA,
  subtotal,
  iva,
  total
}) {
  const precioGeneral = parseNumber(precioGeneralM2);
  let subtotalProductos = 0;

  for (const pieza of productos) {
    const medidas = Array.isArray(pieza?.medidas)
      ? pieza.medidas
      : pieza?.medidas && typeof pieza.medidas === 'object'
        ? [pieza.medidas]
        : [];

    if (medidas.length > 0) {
      for (const medida of medidas) {
        const area = parseNumber(medida?.area) ?? calcularAreaMedida(medida);
        const precio = parseNumber(medida?.precioM2)
          ?? parseNumber(pieza?.precioM2)
          ?? precioGeneral;
        subtotalProductos += (area ?? 0) * (precio ?? 0);
      }
    } else {
      const subtotalProducto = parseNumber(pieza?.subtotal);
      if (subtotalProducto !== undefined) {
        subtotalProductos += subtotalProducto;
      } else {
        const cantidad = parseNumber(pieza?.cantidad) ?? 1;
        const precioUnitario = parseNumber(pieza?.precioUnitario ?? pieza?.precio ?? pieza?.precioM2 ?? precioGeneral);
        subtotalProductos += cantidad * (precioUnitario ?? 0);
      }
    }

    const medidasLength = medidas.length > 0 ? medidas.length : undefined;

    if (esVerdadero(pieza?.esToldo) && parseNumber(pieza?.kitPrecio) !== undefined) {
      const multiplicador = medidasLength ?? (parseNumber(pieza?.cantidad) ?? 1);
      subtotalProductos += (parseNumber(pieza?.kitPrecio) ?? 0) * multiplicador;
    }
    if (esVerdadero(pieza?.motorizado) && parseNumber(pieza?.motorPrecio) !== undefined) {
      const multiplicador = medidasLength ?? (parseNumber(pieza?.cantidad) ?? 1);
      subtotalProductos += (parseNumber(pieza?.motorPrecio) ?? 0) * multiplicador;
    }
    if (esVerdadero(pieza?.motorizado) && parseNumber(pieza?.controlPrecio) !== undefined) {
      subtotalProductos += parseNumber(pieza?.controlPrecio) ?? 0;
    }
  }

  const subtotalBase = parseNumber(subtotal) ?? subtotalProductos;
  const incluyeInstalacionEfectiva = esVerdadero(incluyeInstalacion) || esVerdadero(requiereInstalacion);
  const costoInstalacionNormalizado = incluyeInstalacionEfectiva ? (parseNumber(costoInstalacion) ?? 0) : 0;

  const baseParaDescuento = subtotalBase + costoInstalacionNormalizado;

  const descuentoNormalizado = normalizarDescuento(descuento, baseParaDescuento);
  const montoDescuento = descuentoNormalizado?.monto ?? 0;

  const subtotalTrasDescuento = Math.max(baseParaDescuento - montoDescuento, 0);

  let debeIncluirIVA = true;
  if (incluirIVA !== undefined) {
    debeIncluirIVA = Boolean(incluirIVA);
  }
  if (requiereFactura) {
    debeIncluirIVA = true;
  }

  const ivaCalculado = debeIncluirIVA
    ? (parseNumber(iva) ?? Number((subtotalTrasDescuento * 0.16).toFixed(2)))
    : 0;

  const totalFinal = parseNumber(total) ?? Number((subtotalTrasDescuento + ivaCalculado).toFixed(2));

  return {
    subtotalProductos: Number(subtotalProductos.toFixed(2)),
    subtotalBase: Number(subtotalBase.toFixed(2)),
    baseParaDescuento: Number(baseParaDescuento.toFixed(2)),
    montoDescuento: Number(montoDescuento.toFixed(2)),
    subtotalTrasDescuento: Number(subtotalTrasDescuento.toFixed(2)),
    ivaCalculado: Number(ivaCalculado.toFixed(2)),
    totalFinal: Number(totalFinal.toFixed(2)),
    debeIncluirIVA,
    descuentoNormalizado,
    costoInstalacion: costoInstalacionNormalizado
  };
}

function calcularAreaMedida(medida) {
  const ancho = parseNumber(medida?.ancho);
  const alto = parseNumber(medida?.alto);

  if (ancho !== undefined && alto !== undefined) {
    return Number((ancho * alto).toFixed(4));
  }

  return undefined;
}

function normalizarDescuento(descuento, base) {
  if (!descuento) {
    return undefined;
  }

  if (typeof descuento === 'object' && descuento.aplica === false) {
    return undefined;
  }

  const baseMonto = parseNumber(base) ?? 0;
  let monto;
  let porcentaje;
  let motivo;

  if (typeof descuento === 'number' || typeof descuento === 'string') {
    monto = parseNumber(descuento);
  } else if (typeof descuento === 'object') {
    motivo = descuento.motivo || descuento.motivoDescuento || descuento.descripcion || descuento.razon;

    if (descuento.monto !== undefined) {
      monto = parseNumber(descuento.monto);
    }

    if (descuento.porcentaje !== undefined) {
      porcentaje = parseNumber(descuento.porcentaje);
    }

    if (descuento.valor !== undefined) {
      const valor = parseNumber(descuento.valor);
      if (descuento.tipo === 'porcentaje') {
        porcentaje = porcentaje ?? valor;
      } else if (descuento.tipo === 'monto') {
        monto = monto ?? valor;
      } else if (porcentaje === undefined && monto === undefined) {
        monto = valor;
      }
    }
  }

  if (porcentaje !== undefined && monto === undefined) {
    monto = baseMonto * (porcentaje / 100);
  }

  if (monto === undefined && porcentaje === undefined && !motivo) {
    return undefined;
  }

  const montoNormalizado = monto !== undefined ? Number((monto).toFixed(2)) : undefined;

  return {
    porcentaje: porcentaje !== undefined ? Number(porcentaje) : undefined,
    monto: montoNormalizado,
    motivo
  };
}

function normalizarProducto(producto) {
  const medidas = Array.isArray(producto?.medidas)
    ? producto.medidas.map((medida) => normalizarMedida(medida))
    : producto?.medidas && typeof producto.medidas === 'object'
      ? [normalizarMedida(producto.medidas)]
      : [];

  return {
    ubicacion: producto?.ubicacion,
    cantidad: parseNumber(producto?.cantidad),
    medidas,
    observaciones: producto?.observaciones,
    fotoUrls: producto?.fotoUrls,
    videoUrl: producto?.videoUrl,
    esToldo: esVerdadero(producto?.esToldo),
    tipoToldo: producto?.tipoToldo,
    kitModelo: producto?.kitModelo,
    kitModeloManual: producto?.kitModeloManual,
    kitPrecio: parseNumber(producto?.kitPrecio),
    motorizado: esVerdadero(producto?.motorizado),
    motorModelo: producto?.motorModelo,
    motorModeloManual: producto?.motorModeloManual,
    motorPrecio: parseNumber(producto?.motorPrecio),
    controlModelo: producto?.controlModelo,
    controlModeloManual: producto?.controlModeloManual,
    controlPrecio: parseNumber(producto?.controlPrecio),
    nombre: producto?.nombre,
    descripcion: producto?.descripcion,
    categoria: producto?.categoria,
    material: producto?.material,
    color: producto?.color,
    cristal: producto?.cristal,
    herrajes: producto?.herrajes,
    medidasResumen: producto?.medidasResumen,
    subtotal: parseNumber(producto?.subtotal),
    precioUnitario: parseNumber(producto?.precioUnitario)
  };
}

function normalizarMedida(medida) {
  if (!medida) {
    return {};
  }

  const ancho = parseNumber(medida?.ancho);
  const alto = parseNumber(medida?.alto);
  const area = parseNumber(medida?.area) ?? (ancho !== undefined && alto !== undefined ? Number((ancho * alto).toFixed(4)) : undefined);

  return {
    ancho,
    alto,
    area,
    productoId: medida?.productoId,
    nombreProducto: medida?.nombreProducto || medida?.nombre,
    color: medida?.color,
    precioM2: parseNumber(medida?.precioM2)
  };
}

function obtenerBanderaInstalacion(incluyeInstalacion, requiereInstalacion) {
  if (incluyeInstalacion !== undefined) {
    return esVerdadero(incluyeInstalacion);
  }
  if (requiereInstalacion !== undefined) {
    return esVerdadero(requiereInstalacion);
  }
  return false;
}

function prepararNotas({ notas, comentarios, usuarioId }) {
  if (Array.isArray(notas) && notas.length > 0) {
    return notas;
  }

  if (!comentarios) {
    return undefined;
  }

  return [{
    contenido: comentarios,
    usuario: usuarioId,
    fecha: new Date()
  }];
}

function extraerErroresValidacion(error) {
  const errores = {};
  Object.keys(error.errors || {}).forEach((campo) => {
    errores[campo] = error.errors[campo].message;
  });
  return errores;
}

const Cotizacion = require('../models/Cotizacion');
const Prospecto = require('../models/Prospecto');

exports.crearCotizacion = async (req, res) => {
  try {
    const {
      prospecto: prospectoBody,
      prospectoId: prospectoIdBody,
      productos = [],
      mediciones = [],
      validoHasta,
      descuento,
      formaPago,
      tiempoFabricacion,
      tiempoInstalacion,
      requiereInstalacion,
      costoInstalacion,
      garantia,
      comentarios,
      notas,
      incluirIVA,
      subtotal,
      iva,
      total,
      numero
    } = req.body;

    const prospectoId = prospectoBody || prospectoIdBody;

    if (!prospectoId) {
      return res.status(400).json({ message: 'Debes proporcionar el prospecto asociado a la cotización.' });
    }

    if (!Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({ message: 'Debes proporcionar al menos un producto para la cotización.' });
    }

    const prospecto = await Prospecto.findById(prospectoId);
    if (!prospecto) {
      return res.status(404).json({ message: 'Prospecto no encontrado' });
    }

    const totales = calcularTotalesCotizacion({
      productos,
      descuento,
      costoInstalacion,
      incluirIVA,
      subtotal,
      iva,
      total,
      requiereFactura: req.body?.facturacion?.requiere || req.body.requiereFactura
    });

    const numeroCotizacion = numero || await generarNumeroCotizacion();

    const nuevaCotizacion = new Cotizacion({
      numero: numeroCotizacion,
      prospecto: prospecto._id,
      validoHasta: validarFecha(validoHasta),
      mediciones,
      productos,
      subtotal: totales.subtotal,
      descuento: totales.descuento || normalizarDescuento(descuento, totales.base),
      iva: totales.iva,
      total: totales.total,
      incluirIVA: totales.incluirIVA,
      formaPago,
      tiempoFabricacion,
      tiempoInstalacion,
      requiereInstalacion,
      costoInstalacion: parseNumber(costoInstalacion) ?? 0,
      garantia,
      notas: prepararNotas({ notas, comentarios, usuarioId: req.usuario?._id }),
      elaboradaPor: req.usuario?._id || req.body.elaboradaPor
    });

    await nuevaCotizacion.save();

    await nuevaCotizacion.populate([
      { path: 'prospecto', select: 'nombre telefono email' },
      { path: 'elaboradaPor', select: 'nombre apellido' }
    ]);

    prospecto.etapa = 'cotizacion';
    prospecto.fechaUltimoContacto = new Date();

    if (!prospecto.producto || prospecto.producto.trim() === '') {
      const primerProducto = productos[0] || {};
      prospecto.producto = primerProducto.nombre || primerProducto.descripcion || 'Producto cotizado';
    }

    await prospecto.save();

    res.status(201).json({
      message: 'Cotización creada exitosamente',
      cotizacion: nuevaCotizacion
    });
  } catch (error) {
    console.error('Error creando cotización:', error);

    if (error.name === 'ValidationError') {
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
  if (value === undefined || value === null) return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
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

function calcularTotalesCotizacion({ productos = [], descuento, costoInstalacion, incluirIVA, subtotal, iva, total, requiereFactura }) {
  const subtotalProductos = productos.reduce((acumulado, producto) => {
    const subtotalProducto = parseNumber(producto?.subtotal);
    if (subtotalProducto !== undefined) {
      return acumulado + subtotalProducto;
    }

    const cantidad = parseNumber(producto?.cantidad) ?? 1;
    const precioUnitario = parseNumber(producto?.precioUnitario ?? producto?.precioM2 ?? producto?.precio);
    return acumulado + cantidad * (precioUnitario ?? 0);
  }, 0);

  const subtotalBase = parseNumber(subtotal) ?? subtotalProductos;
  const instalacion = parseNumber(costoInstalacion) ?? 0;
  const subtotalConInstalacion = subtotalBase + instalacion;

  const descuentoNormalizado = normalizarDescuento(descuento, subtotalConInstalacion);
  const montoDescuento = descuentoNormalizado?.monto ?? 0;
  const subtotalTrasDescuento = Math.max(subtotalConInstalacion - montoDescuento, 0);

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

  const totalCalculado = parseNumber(total) ?? Number((subtotalTrasDescuento + ivaCalculado).toFixed(2));

  return {
    subtotal: Number(subtotalBase.toFixed(2)),
    descuento: descuentoNormalizado,
    iva: Number(ivaCalculado.toFixed(2)),
    total: Number(totalCalculado.toFixed(2)),
    incluirIVA: debeIncluirIVA,
    base: subtotalConInstalacion
  };
}

function normalizarDescuento(descuento, base) {
  if (!descuento) return undefined;
  if (typeof descuento === 'object' && descuento.aplica === false) {
    return undefined;
  }

  const baseMonto = parseNumber(base) ?? 0;
  let porcentaje;
  let monto;
  let motivo;

  if (typeof descuento === 'number' || typeof descuento === 'string') {
    monto = parseNumber(descuento);
  } else if (typeof descuento === 'object') {
    motivo = descuento.motivo || descuento.motivoDescuento || descuento.descripcion;

    if (descuento.monto !== undefined) {
      monto = parseNumber(descuento.monto);
    }

    if (descuento.porcentaje !== undefined) {
      porcentaje = parseNumber(descuento.porcentaje);
    }

    if (descuento.valor !== undefined) {
      const valor = parseNumber(descuento.valor);
      if (descuento.tipo === 'porcentaje') {
        porcentaje = valor;
      } else if (descuento.tipo === 'monto') {
        monto = valor;
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

  const montoRedondeado = monto !== undefined ? Number(monto.toFixed(2)) : undefined;

  return {
    porcentaje: porcentaje !== undefined ? Number(porcentaje) : undefined,
    monto: montoRedondeado,
    motivo
  };
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

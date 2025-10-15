const Cotizacion = require('../models/Cotizacion');
const Prospecto = require('../models/Prospecto');
const CotizacionMappingService = require('../services/cotizacionMappingService');
const ValidacionTecnicaService = require('../services/validacionTecnicaService');

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
      incluirTerminos,
      origen
    } = req.body;

    if (!prospectoId) {
      console.error('Error: prospectoId no proporcionado.');
      return res.status(400).json({ message: 'Debes proporcionar el prospecto asociado a la cotización.' });
    }
    if (!Array.isArray(productos) || productos.length === 0) {
      console.error('Error: No se proporcionaron productos o el formato es incorrecto.');
      return res.status(400).json({ message: 'Debes proporcionar al menos un producto para la cotización.' });
    }

    // 🔒 VALIDACIÓN TÉCNICA: Verificar si se puede crear cotización
    const validacionTecnica = ValidacionTecnicaService.validarAvanceEtapa(productos, 'cotizacion');
    if (!validacionTecnica.puedeAvanzar) {
      console.warn('⚠️ Cotización con información técnica incompleta:', validacionTecnica.mensajeCandado);
      // Permitir crear cotización pero con advertencia
      console.log('📝 Creando cotización con advertencias técnicas...');
    }

    const prospecto = await Prospecto.findById(prospectoId);
    if (!prospecto) {
      console.error(`Error: Prospecto con ID ${prospectoId} no encontrado.`);
      return res.status(404).json({ message: 'Prospecto no encontrado' });
    }

    // Usar servicio unificado para cálculos consistentes
    const totalesUnificados = CotizacionMappingService.calcularTotalesUnificados(productos, {
      precioGeneralM2,
      incluyeInstalacion,
      costoInstalacion,
      descuento,
      requiereFactura
    });
    
    const { 
      subtotalProductos: subtotal, 
      montoDescuento, 
      ivaCalculado, 
      totalFinal, 
      baseParaDescuento,
      totalPiezas,
      totalArea
    } = totalesUnificados;
    
    const numeroCotizacion = await generarNumeroCotizacion();

    const nuevaCotizacion = new Cotizacion({
      numero: numeroCotizacion,
      prospecto: prospecto._id,
      nombre: nombre || `Cotización para ${prospecto.nombre}`,
      fecha: fechaCreacion ? new Date(fechaCreacion) : new Date(),
      estado: 'Activa',
      origen: origen || 'normal', // Usar el origen enviado o 'normal' por defecto
      productos: productos.map((p) => CotizacionMappingService.normalizarProducto(p, origen)),
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
      cotizacion: cotizacionGuardada,
      validacionTecnica: validacionTecnica // Incluir información de validación
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
    
    // Calcular cantidad de piezas reales para esta partida
    let cantidadPiezasReales = cantidad;
    if (pieza.medidas && Array.isArray(pieza.medidas)) {
      cantidadPiezasReales = pieza.medidas.length; // Usar medidas individuales si existen
    }
    
    if (pieza.esToldo && pieza.kitPrecio) {
      subtotalProductos += (parseFloat(pieza.kitPrecio) || 0) * cantidadPiezasReales; // Kit por pieza
    }
    if (pieza.motorizado && pieza.motorPrecio) {
      subtotalProductos += (parseFloat(pieza.motorPrecio) || 0) * cantidadPiezasReales; // Motor por pieza
    }
    if (pieza.motorizado && pieza.controlPrecio) {
      subtotalProductos += (parseFloat(pieza.controlPrecio) || 0); // 1 control por partida (correcto)
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
    // IVA se calcula sobre el subtotal DESPUÉS del descuento (correcto fiscalmente)
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
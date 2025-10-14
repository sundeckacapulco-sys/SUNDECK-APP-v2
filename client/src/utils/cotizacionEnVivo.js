const toNumber = (value, { allowUndefined = false, defaultValue = 0 } = {}) => {
  if (value === '' || value === null || value === undefined || Number.isNaN(Number(value))) {
    return allowUndefined ? undefined : defaultValue;
  }

  return Number(value);
};

const normalizarMedidas = (pieza) => {
  const medidasDesdeFormulario = Array.isArray(pieza.medidas) ? pieza.medidas : [];

  if (medidasDesdeFormulario.length > 0) {
    return medidasDesdeFormulario.map((medida) => {
      const ancho = toNumber(medida.ancho);
      const alto = toNumber(medida.alto);

      return {
        ...medida,
        ancho,
        alto,
        area: medida.area ? toNumber(medida.area) : ancho * alto
      };
    });
  }

  const ancho = toNumber(pieza.ancho);
  const alto = toNumber(pieza.alto);

  return [
    {
      ancho,
      alto,
      area: ancho * alto,
      producto: pieza.producto,
      productoLabel: pieza.productoLabel,
      color: pieza.color,
      precioM2: pieza.precioM2
    }
  ];
};

export const mapearPiezaParaDocumento = (
  pieza,
  { incluirExtras = false, precioComoNumero = false } = {}
) => {
  const medidasNormalizadas = normalizarMedidas(pieza);
  const primeraMedida = medidasNormalizadas[0] || { ancho: 0, alto: 0 };

  const piezaBase = {
    ubicacion: pieza.ubicacion,
    cantidad: pieza.cantidad || 1,
    ancho: primeraMedida.ancho,
    alto: primeraMedida.alto,
    producto: pieza.producto,
    productoLabel: pieza.productoLabel,
    color: pieza.color,
    precioM2: precioComoNumero
      ? toNumber(pieza.precioM2, { allowUndefined: true })
      : pieza.precioM2,
    observaciones: pieza.observaciones,
    fotoUrls: pieza.fotoUrls || [],
    videoUrl: pieza.videoUrl || '',
    medidas: medidasNormalizadas
  };

  if (!incluirExtras) {
    return piezaBase;
  }

  const totalMedidas = medidasNormalizadas.length || 1;
  const fallbackCantidad = pieza.cantidad || totalMedidas || 1;

  const numMotoresIngresados = toNumber(pieza.numMotores, { allowUndefined: true });
  const numMotoresNormalizados = Math.max(
    1,
    numMotoresIngresados ?? (pieza.motorizado ? fallbackCantidad : 1)
  );

  const piezasPorMotorIngresadas = toNumber(pieza.piezasPorMotor, { allowUndefined: true });
  const piezasPorMotorNormalizadas = Math.max(
    1,
    piezasPorMotorIngresadas ?? Math.ceil(fallbackCantidad / numMotoresNormalizados)
  );

  const piezasPorControlIngresadas = toNumber(pieza.piezasPorControl, { allowUndefined: true });
  const piezasPorControlNormalizadas = Math.max(
    1,
    piezasPorControlIngresadas ?? (
      pieza.esControlMulticanal
        ? fallbackCantidad
        : numMotoresNormalizados
    )
  );

  return {
    ...piezaBase,
    esToldo: pieza.esToldo || false,
    tipoToldo: pieza.tipoToldo || '',
    kitModelo: pieza.kitModelo || '',
    kitModeloManual: pieza.kitModeloManual || '',
    kitPrecio: toNumber(pieza.kitPrecio, { defaultValue: 0 }),
    motorizado: pieza.motorizado || false,
    motorModelo: pieza.motorModelo || '',
    motorModeloManual: pieza.motorModeloManual || '',
    motorPrecio: toNumber(pieza.motorPrecio, { defaultValue: 0 }),
    controlModelo: pieza.controlModelo || '',
    controlModeloManual: pieza.controlModeloManual || '',
    controlPrecio: toNumber(pieza.controlPrecio, { defaultValue: 0 }),
    numMotores: numMotoresNormalizados,
    piezasPorMotor: piezasPorMotorNormalizadas,
    esControlMulticanal: Boolean(pieza.esControlMulticanal),
    piezasPorControl: piezasPorControlNormalizadas
  };
};

export const crearResumenEconomico = ({
  precioGeneral,
  totalM2,
  subtotalProductos,
  unidadMedida,
  cobraInstalacion,
  tipoInstalacion,
  precioInstalacion,
  precioInstalacionPorPieza,
  totalPiezas,
  aplicaDescuento,
  tipoDescuento,
  valorDescuento,
  montoDescuento
}) => {
  // Calcular precio de instalación según el modelo
  let precioInstalacionCalculado = 0;
  
  if (cobraInstalacion && precioInstalacion) {
    if (tipoInstalacion === 'fijo') {
      precioInstalacionCalculado = toNumber(precioInstalacion);
    } else if (tipoInstalacion === 'por_pieza') {
      precioInstalacionCalculado = toNumber(precioInstalacion) * (totalPiezas || 1);
    } else if (tipoInstalacion === 'base_mas_pieza') {
      const precioBase = toNumber(precioInstalacion);
      const precioPorPieza = toNumber(precioInstalacionPorPieza);
      const piezasAdicionales = Math.max(0, (totalPiezas || 1) - 1);
      precioInstalacionCalculado = precioBase + (precioPorPieza * piezasAdicionales);
    }
  }

  return {
    precioGeneral: toNumber(precioGeneral),
    totalM2,
    subtotalProductos,
    unidadMedida,
    instalacion: {
      cobra: cobraInstalacion,
      tipo: tipoInstalacion,
      precio: precioInstalacionCalculado
    },
    descuento: {
      aplica: aplicaDescuento,
      tipo: tipoDescuento,
      valor: aplicaDescuento ? toNumber(valorDescuento) : 0,
      monto: montoDescuento
    }
  };
};

export const crearMetodoPago = ({ anticipo, saldo, metodoPagoAnticipo }) => ({
  anticipo,
  saldo,
  porcentajeAnticipo: 60,
  porcentajeSaldo: 40,
  metodoPagoAnticipo
});

export const crearInfoFacturacion = ({
  requiereFactura,
  iva,
  totalConIVA,
  totalSinIVA
}) => ({
  requiereFactura,
  iva,
  totalConIVA: requiereFactura ? totalConIVA : totalSinIVA
});


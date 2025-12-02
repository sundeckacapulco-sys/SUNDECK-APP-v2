import { calcularAreaCobrableSimple } from '../utils/calculoAreaMinima';

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const obtenerDetallesMedidas = (producto) => {
  if (Array.isArray(producto?.medidas?.detalles) && producto.medidas.detalles.length > 0) {
    return producto.medidas.detalles;
  }
  return [];
};

/**
 * Calcula el área de un producto aplicando la regla de mínimo 1m por dimensión
 * REGLA DE NEGOCIO: Si ancho o alto < 1m, se cobra como 1m
 */
const calcularAreaProducto = (producto) => {
  const detalles = obtenerDetallesMedidas(producto);
  if (detalles.length > 0) {
    // Usar areaCobrable si existe, sino calcular con mínimo
    return detalles.reduce((total, detalle) => {
      if (detalle.areaCobrable) {
        return total + toNumber(detalle.areaCobrable);
      }
      const ancho = toNumber(detalle.ancho);
      const alto = toNumber(detalle.alto);
      return total + calcularAreaCobrableSimple(ancho, alto);
    }, 0);
  }

  const ancho = toNumber(producto?.medidas?.ancho);
  const alto = toNumber(producto?.medidas?.alto);
  
  // Usar areaCobrable si ya está calculada
  if (producto?.medidas?.areaCobrable) {
    return toNumber(producto.medidas.areaCobrable);
  }
  
  // Aplicar regla de mínimo 1m por dimensión
  const areaCobrable = calcularAreaCobrableSimple(ancho, alto);

  const cantidad = toNumber(producto?.medidas?.cantidad, 1);
  return areaCobrable > 0 ? areaCobrable : calcularAreaCobrableSimple(ancho, alto) * Math.max(cantidad, 1);
};

const calcularExtrasProducto = (producto) => {
  let totalExtras = 0;

  const kits = Array.isArray(producto?.extras?.kits) ? producto.extras.kits : [];
  totalExtras += kits.reduce((total, kit) => {
    const cantidad = toNumber(kit?.cantidad, 1);
    const precio = toNumber(kit?.precio);
    return total + precio * cantidad;
  }, 0);

  if (producto?.extras?.otros && typeof producto.extras.otros === 'object') {
    totalExtras += Object.values(producto.extras.otros).reduce((total, valor) => {
      if (typeof valor === 'number') {
        return total + valor;
      }

      if (valor && typeof valor === 'object') {
        const monto = toNumber(valor.precio ?? valor.valor ?? valor.monto);
        const cantidad = toNumber(valor.cantidad, 1);
        return total + monto * cantidad;
      }

      const monto = Number(valor);
      return Number.isFinite(monto) ? total + monto : total;
    }, 0);
  }

  return totalExtras;
};

export const calcularTotales = (productos = [], comercial = {}) => {
  const productosNormalizados = Array.isArray(productos) ? productos : [];

  const subtotalProductos = productosNormalizados.reduce((total, producto) => {
    const subtotalRegistrado = toNumber(producto?.precios?.subtotal);
    const unitario = toNumber(producto?.precios?.unitario);
    const area = calcularAreaProducto(producto);
    const subtotalCalculado = subtotalRegistrado > 0 ? subtotalRegistrado : unitario * area;
    const extras = calcularExtrasProducto(producto);

    return total + subtotalCalculado + extras;
  }, 0);

  // Área cobrable (con mínimo 1m por dimensión) - para cotización
  const totalArea = productosNormalizados.reduce((total, producto) => {
    return total + calcularAreaProducto(producto);
  }, 0);

  // Área real (sin ajuste) - para referencia
  const totalAreaReal = productosNormalizados.reduce((total, producto) => {
    const detalles = obtenerDetallesMedidas(producto);
    if (detalles.length > 0) {
      return detalles.reduce((sum, detalle) => {
        const area = toNumber(detalle.area) || (toNumber(detalle.ancho) * toNumber(detalle.alto));
        return sum + area;
      }, total);
    }
    const ancho = toNumber(producto?.medidas?.ancho);
    const alto = toNumber(producto?.medidas?.alto);
    const area = toNumber(producto?.medidas?.area) || (ancho * alto);
    const cantidad = toNumber(producto?.medidas?.cantidad, 1);
    return total + (area * Math.max(cantidad, 1));
  }, 0);

  const totalPiezas = productosNormalizados.reduce((total, producto) => {
    const detalles = obtenerDetallesMedidas(producto);
    if (detalles.length > 0) {
      return total + detalles.length;
    }
    const cantidad = toNumber(producto?.medidas?.cantidad, 1);
    return total + Math.max(cantidad, 1);
  }, 0);

  const instalacionConfig = comercial?.instalacionEspecial || {};
  const instalacionActiva = Boolean(instalacionConfig.activa);
  const instalacionPrecio = instalacionActiva ? toNumber(instalacionConfig.precio) : 0;
  const instalacionTipo = instalacionConfig.tipo ?? '';

  const subtotalConInstalacion = subtotalProductos + instalacionPrecio;

  const descuentoConfig = comercial?.descuentos || {};
  const descuentoActivo = Boolean(descuentoConfig.activo);
  const descuentoTipo = descuentoConfig.tipo ?? 'porcentaje';
  const descuentoValor = toNumber(descuentoConfig.valor);

  let montoDescuento = 0;
  if (descuentoActivo && descuentoValor > 0) {
    if (descuentoTipo === 'porcentaje') {
      montoDescuento = (subtotalConInstalacion * descuentoValor) / 100;
    } else {
      montoDescuento = descuentoValor;
    }
  }
  montoDescuento = Math.min(montoDescuento, subtotalConInstalacion);

  const subtotalConDescuento = subtotalConInstalacion - montoDescuento;

  const facturacionConfig = comercial?.facturacion || {};
  const requiereFactura = Boolean(facturacionConfig.requiereFactura);
  const ivaEntrada = toNumber(facturacionConfig.iva);
  const ivaPorcentaje = requiereFactura
    ? ivaEntrada > 1
      ? ivaEntrada
      : ivaEntrada * 100
    : 0;
  const ivaDecimal = requiereFactura
    ? ivaEntrada > 1
      ? ivaEntrada / 100
      : ivaEntrada || 0.16
    : 0;

  const montoIVA = requiereFactura ? subtotalConDescuento * ivaDecimal : 0;
  const totalConIVA = subtotalConDescuento + montoIVA;
  const totalFinal = requiereFactura ? totalConIVA : subtotalConDescuento;

  return {
    subtotalProductos,
    subtotalConInstalacion,
    descuento: {
      activo: descuentoActivo,
      tipo: descuentoTipo,
      valor: descuentoValor,
      monto: montoDescuento,
    },
    subtotalConDescuento,
    instalacionEspecial: {
      activa: instalacionActiva,
      tipo: instalacionTipo,
      precio: instalacionPrecio,
    },
    iva: {
      porcentaje: ivaPorcentaje,
      monto: montoIVA,
      totalConIVA,
    },
    total: totalFinal,
    totalArea,        // Área cobrable (con mínimo 1m)
    totalAreaReal,    // Área real (sin ajuste)
    totalPiezas,
  };
};

export default calcularTotales;

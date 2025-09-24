
/**
 * Lógica de cálculo para cotizaciones.
 * Este módulo centraliza todos los cálculos relacionados con los productos,
 * descuentos, impuestos y totales de una cotización para asegurar consistencia
 * y facilitar el mantenimiento.
 */

/**
 * Calcula el subtotal de un único producto basado en su tipo, precio, cantidad y medidas.
 * @param {object} producto - El objeto del producto a calcular.
 * @returns {number} - El subtotal calculado para el producto.
 */
export const calcularSubtotalProducto = (producto) => {
  if (!producto) return 0;

  const precio = producto.precioUnitario || 0;
  const cantidad = producto.cantidad || 1;
  const unidadMedida = producto.unidadMedida;

  let subtotal = 0;
  if (['pieza', 'par', 'juego', 'kit'].includes(unidadMedida)) {
    // Productos por pieza: precio × cantidad
    subtotal = precio * cantidad;
  } else {
    // Productos por área o lineales: área × precio × cantidad
    const area = producto.medidas?.area || 0;
    subtotal = area * precio * cantidad;
  }
  return subtotal;
};

/**
 * Calcula los totales de la cotización (subtotal, descuento, IVA y total).
 * @param {Array} productos - La lista de productos en la cotización.
 * @param {object} descuento - El objeto de descuento con porcentaje/monto.
 * @param {boolean} incluirIVA - Si se debe incluir el 16% de IVA.
 * @param {string} tipoDescuento - 'porcentaje' o 'monto'.
 * @returns {object} - Un objeto con todos los totales calculados.
 */
export const calcularTotalesCotizacion = ({ 
  productos, 
  descuento, 
  incluirIVA, 
  tipoDescuento 
}) => {
  // 1. Calcular el subtotal sumando los subtotales de cada producto.
  const subtotal = productos.reduce((sum, producto) => {
    // Si el producto ya tiene un subtotal pre-calculado, lo usamos.
    // De lo contrario, lo calculamos sobre la marcha.
    const subtotalProducto = producto.subtotal || calcularSubtotalProducto(producto);
    return sum + subtotalProducto;
  }, 0);

  // 2. Calcular el monto del descuento.
  let descuentoMonto = 0;
  if (tipoDescuento === 'porcentaje') {
    const descuentoPorcentaje = descuento?.porcentaje || 0;
    descuentoMonto = subtotal * (descuentoPorcentaje / 100);
  } else {
    descuentoMonto = descuento?.monto || 0;
  }

  // 3. Calcular el subtotal después de aplicar el descuento.
  const subtotalConDescuento = subtotal - descuentoMonto;

  // 4. Calcular el IVA (si aplica).
  const iva = incluirIVA ? subtotalConDescuento * 0.16 : 0;

  // 5. Calcular el total final.
  const total = subtotalConDescuento + iva;

  return {
    subtotal,
    descuentoMonto,
    subtotalConDescuento,
    iva,
    total,
  };
};

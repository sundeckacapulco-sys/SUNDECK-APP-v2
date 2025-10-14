const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const validarCompletitud = (storeState) => {
  const errores = [];

  if (!storeState) {
    errores.push('No se recibió el estado de la cotización.');
    return { esValido: false, errores };
  }

  const { productos = [], comercial = {}, flujo = {} } = storeState;

  if (!Array.isArray(productos) || productos.length === 0) {
    errores.push('Agrega al menos un producto a la cotización en vivo.');
  }

  productos.forEach((producto, index) => {
    const nombre = producto?.nombre || `Producto ${index + 1}`;
    const subtotal = toNumber(producto?.precios?.subtotal);
    const unitario = toNumber(producto?.precios?.unitario);
    const cantidad = toNumber(producto?.medidas?.cantidad) || 1;

    if (subtotal <= 0 && unitario <= 0) {
      errores.push(`Define un precio para "${nombre}".`);
    }

    if (!cantidad || cantidad <= 0) {
      errores.push(`La cantidad para "${nombre}" debe ser mayor a 0.`);
    }
  });

  const instalacion = comercial?.instalacionEspecial;
  if (instalacion?.activa) {
    const precio = toNumber(instalacion?.precio);
    if (precio <= 0) {
      errores.push('El costo de la instalación especial debe ser mayor a 0.');
    }
  }

  if (!flujo?.tipo) {
    errores.push('El flujo de cotización no está definido.');
  }

  return {
    esValido: errores.length === 0,
    errores,
  };
};

export default validarCompletitud;

import { calcularTotales } from './calculosService';
import { mapearPiezaParaDocumento } from '../utils/cotizacionEnVivo';

const construirPiezaDesdeProducto = (producto = {}) => {
  const detalles = Array.isArray(producto?.medidas?.detalles) ? producto.medidas.detalles : [];
  return {
    ubicacion: producto.ubicacion ?? '',
    cantidad: producto.medidas?.cantidad ?? (detalles.length > 0 ? detalles.length : 1),
    ancho: producto.medidas?.ancho ?? 0,
    alto: producto.medidas?.alto ?? 0,
    producto: producto.nombre,
    productoLabel: producto.nombre,
    color: producto.tecnico?.color ?? '',
    precioM2: producto.precios?.unitario ?? 0,
    observaciones: producto.tecnico?.observaciones ?? '',
    medidas: detalles.length
      ? detalles.map((detalle) => ({
          ...detalle,
          producto: detalle.producto ?? producto.nombre,
          productoLabel: detalle.productoLabel ?? producto.nombre,
          color: detalle.color ?? producto.tecnico?.color ?? '',
          precioM2: detalle.precioM2 ?? producto.precios?.unitario ?? 0,
        }))
      : [
          {
            ancho: producto.medidas?.ancho ?? 0,
            alto: producto.medidas?.alto ?? 0,
            area: producto.medidas?.area ?? 0,
            producto: producto.nombre,
            productoLabel: producto.nombre,
            color: producto.tecnico?.color ?? '',
            precioM2: producto.precios?.unitario ?? 0,
          },
        ],
  };
};

const obtenerPiezasNormalizadas = (productos = [], piezas = []) => {
  const piezasDesdeMetadata = productos
    .map((producto) => producto?.metadata?.piezaOriginal)
    .filter(Boolean);

  if (piezasDesdeMetadata.length > 0) {
    return piezasDesdeMetadata.map((pieza) =>
      mapearPiezaParaDocumento(pieza, { incluirExtras: true })
    );
  }

  if (Array.isArray(piezas) && piezas.length > 0) {
    return piezas.map((pieza) => mapearPiezaParaDocumento(pieza, { incluirExtras: true }));
  }

  return productos.map((producto) => construirPiezaDesdeProducto(producto));
};

export const normalizarParaBackend = (
  storeState,
  tipoFlujo,
  {
    prospectoId,
    piezas = [],
    comentarios = '',
    unidadMedida = 'm',
    precioGeneral = 0,
    tipoVisitaInicial = 'cotizacion',
    facturacion,
    metodoPago,
    totalFinal,
    totalM2,
    fechaEtapa,
    horaEtapa,
  } = {}
) => {
  if (!storeState) {
    throw new Error('El estado de la cotización es inválido.');
  }

  const { cliente, productos = [], comercial = {}, flujo = {} } = storeState;
  const totales = calcularTotales(productos, comercial);

  if (tipoFlujo === 'cotizacion_vivo') {
    const piezasNormalizadas = obtenerPiezasNormalizadas(productos, piezas);

    return {
      prospectoId,
      piezas: piezasNormalizadas,
      precioGeneral,
      totalM2: totalM2 ?? totales.totalArea,
      unidadMedida,
      comentarios,
      instalacionEspecial: {
        activa: totales.instalacionEspecial.activa,
        tipo: totales.instalacionEspecial.tipo,
        precio: totales.instalacionEspecial.precio,
      },
      origen: flujo.origen ?? 'cotizacion_vivo',
      tipoVisitaInicial,
      cliente,
      descuentos: totales.descuento,
      facturacion:
        facturacion ?? {
          requiereFactura: comercial?.facturacion?.requiereFactura ?? false,
          iva: totales.iva.monto,
          porcentajeIVA: totales.iva.porcentaje,
          totalConIVA: totales.iva.totalConIVA,
        },
      metodoPago: metodoPago ?? null,
      totalFinal:
        totalFinal ?? (comercial?.facturacion?.requiereFactura ? totales.iva.totalConIVA : totales.subtotalConDescuento),
      totales,
      flujo: {
        tipo: 'cotizacion_vivo',
        origen: flujo.origen ?? 'cotizacion_vivo',
      },
      metadatos: {
        tiempos: comercial?.tiempos ?? {},
        fechaEtapa,
        horaEtapa,
      },
    };
  }

  return {
    cliente,
    productos,
    comercial,
    flujo: { ...flujo, tipo: tipoFlujo },
  };
};

export default normalizarParaBackend;

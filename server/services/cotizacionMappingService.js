/**
 * Servicio Unificado de Mapeo de Cotizaciones
 * 
 * Resuelve inconsistencias entre diferentes formatos de entrada
 * y normaliza datos para el backend
 */

class CotizacionMappingService {
  
  /**
   * Normaliza un producto desde cualquier formato a la estructura del backend
   */
  static normalizarProducto(producto, origen = 'normal') {
    const productoNormalizado = {
      ubicacion: producto.ubicacion || '',
      cantidad: parseInt(producto.cantidad) || 1,
      nombre: producto.nombre || producto.nombreProducto || producto.productoLabel || '',
      descripcion: producto.descripcion || producto.observaciones || '',
      categoria: producto.categoria || 'ventana',
      material: producto.material || '',
      color: producto.color || '',
      observaciones: producto.observaciones || '',
      fotoUrls: producto.fotoUrls || [],
      videoUrl: producto.videoUrl || '',
      
      // Campos de toldos
      esToldo: Boolean(producto.esToldo),
      tipoToldo: producto.tipoToldo || '',
      kitModelo: producto.kitModelo || '',
      kitModeloManual: producto.kitModeloManual || '',
      kitPrecio: parseFloat(producto.kitPrecio) || 0,
      
      // Campos de motorización
      motorizado: Boolean(producto.motorizado),
      motorModelo: producto.motorModelo || '',
      motorModeloManual: producto.motorModeloManual || '',
      motorPrecio: parseFloat(producto.motorPrecio) || 0,
      controlModelo: producto.controlModelo || '',
      controlModeloManual: producto.controlModeloManual || '',
      controlPrecio: parseFloat(producto.controlPrecio) || 0,
      
      // Campos técnicos (para levantamientos)
      requiereR24: Boolean(producto.requiereR24),
      tiempoFabricacion: producto.tiempoFabricacion || null
    };

    // Normalizar medidas según el origen
    const medidasNormalizadas = this.normalizarMedidas(producto, origen);
    
    return {
      ...productoNormalizado,
      ...medidasNormalizadas
    };
  }

  /**
   * Normaliza medidas desde diferentes formatos
   */
  static normalizarMedidas(producto, origen) {
    let ancho = 0, alto = 0, area = 0, precioM2 = 0, precioUnitario = 0, subtotal = 0;

    // FORMATO 1: Levantamiento técnico (medidas individuales)
    if (producto.medidas && Array.isArray(producto.medidas) && producto.medidas.length > 0) {
      // Usar primera medida como representativa para campos planos
      const primeramedida = producto.medidas[0];
      ancho = parseFloat(primeramedida.ancho) || 0;
      alto = parseFloat(primeramedida.alto) || 0;
      area = parseFloat(primeramedida.area) || (ancho * alto);
      precioM2 = parseFloat(primeramedida.precioM2) || 0;
      
      // Calcular área total sumando todas las medidas individuales
      const areaTotal = producto.medidas.reduce((total, medida) => {
        const areaIndividual = parseFloat(medida.area) || 
          (parseFloat(medida.ancho) * parseFloat(medida.alto));
        return total + areaIndividual;
      }, 0);
      
      subtotal = areaTotal * precioM2;
      
      return {
        ancho,
        alto,
        area: areaTotal, // Área total de todas las medidas
        precioM2,
        precioUnitario: precioM2,
        subtotal,
        medidas: {
          ancho,
          alto,
          area: areaTotal
        },
        // Preservar medidas individuales para exportaciones
        medidasIndividuales: producto.medidas
      };
    }

    // FORMATO 2: Cotización directa/tradicional (medidas como objeto)
    if (producto.medidas && typeof producto.medidas === 'object' && !Array.isArray(producto.medidas)) {
      ancho = parseFloat(producto.medidas.ancho) || 0;
      alto = parseFloat(producto.medidas.alto) || 0;
      area = parseFloat(producto.medidas.area) || (ancho * alto);
      precioUnitario = parseFloat(producto.precioUnitario) || parseFloat(producto.precioM2) || 0;
      subtotal = parseFloat(producto.subtotal) || (area * precioUnitario * (producto.cantidad || 1));
      
      return {
        ancho,
        alto,
        area,
        precioM2: precioUnitario,
        precioUnitario,
        subtotal,
        medidas: {
          ancho,
          alto,
          area
        }
      };
    }

    // FORMATO 3: Campos planos (formato legacy)
    ancho = parseFloat(producto.ancho) || 0;
    alto = parseFloat(producto.alto) || 0;
    area = parseFloat(producto.area) || (ancho * alto);
    precioM2 = parseFloat(producto.precioM2) || parseFloat(producto.precioUnitario) || 0;
    subtotal = parseFloat(producto.subtotal) || (area * precioM2 * (producto.cantidad || 1));

    return {
      ancho,
      alto,
      area,
      precioM2,
      precioUnitario: precioM2,
      subtotal,
      medidas: {
        ancho,
        alto,
        area
      }
    };
  }

  /**
   * Calcula totales unificados considerando todos los extras
   */
  static calcularTotalesUnificados(productos, configuracion = {}) {
    const {
      precioGeneralM2 = 0,
      incluyeInstalacion = false,
      costoInstalacion = 0,
      descuento = null,
      requiereFactura = false
    } = configuracion;

    let subtotalProductos = 0;
    let totalPiezas = 0;
    let totalArea = 0;

    for (const producto of productos) {
      const productoNormalizado = this.normalizarProducto(producto);
      
      // Calcular cantidad real de piezas
      let cantidadPiezas = productoNormalizado.cantidad;
      if (productoNormalizado.medidasIndividuales) {
        cantidadPiezas = productoNormalizado.medidasIndividuales.length;
      }
      
      totalPiezas += cantidadPiezas;
      totalArea += productoNormalizado.area;
      
      // Subtotal base (área × precio)
      const precioAUsar = productoNormalizado.precioM2 || precioGeneralM2;
      subtotalProductos += productoNormalizado.area * precioAUsar;
      
      // Extras: Kits de toldo
      if (productoNormalizado.esToldo && productoNormalizado.kitPrecio) {
        subtotalProductos += productoNormalizado.kitPrecio * cantidadPiezas;
      }
      
      // Extras: Motorización
      if (productoNormalizado.motorizado) {
        if (productoNormalizado.motorPrecio) {
          subtotalProductos += productoNormalizado.motorPrecio * cantidadPiezas; // Motor por pieza
        }
        if (productoNormalizado.controlPrecio) {
          subtotalProductos += productoNormalizado.controlPrecio; // Control por partida
        }
      }
    }

    // Aplicar instalación
    let baseParaDescuento = subtotalProductos;
    if (incluyeInstalacion && costoInstalacion) {
      baseParaDescuento += parseFloat(costoInstalacion);
    }

    // Aplicar descuento
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

    // Calcular IVA
    let ivaCalculado = 0;
    if (requiereFactura) {
      ivaCalculado = Number((subtotalTrasDescuento * 0.16).toFixed(2));
    }

    const totalFinal = Number((subtotalTrasDescuento + ivaCalculado).toFixed(2));

    return {
      subtotalProductos: Number(subtotalProductos.toFixed(2)),
      totalPiezas,
      totalArea: Number(totalArea.toFixed(2)),
      baseParaDescuento: Number(baseParaDescuento.toFixed(2)),
      montoDescuento: Number(montoDescuento.toFixed(2)),
      subtotalTrasDescuento: Number(subtotalTrasDescuento.toFixed(2)),
      ivaCalculado,
      totalFinal,
      detalleCalculos: {
        subtotalBase: subtotalProductos,
        instalacion: incluyeInstalacion ? costoInstalacion : 0,
        descuento: montoDescuento,
        iva: ivaCalculado
      }
    };
  }

  /**
   * Genera payload unificado para diferentes destinos
   */
  static generarPayloadUnificado(datos, destino = 'cotizacion') {
    const productosNormalizados = datos.productos.map(producto => 
      this.normalizarProducto(producto, datos.origen)
    );

    const totales = this.calcularTotalesUnificados(productosNormalizados, {
      precioGeneralM2: datos.precioGeneralM2,
      incluyeInstalacion: datos.instalacion?.incluye,
      costoInstalacion: datos.instalacion?.costo,
      descuento: datos.descuento,
      requiereFactura: datos.facturacion?.requiere
    });

    const payloadBase = {
      prospecto: datos.prospectoId,
      origen: datos.origen || 'normal',
      productos: productosNormalizados,
      ...totales,
      comentarios: datos.comentarios,
      precioGeneralM2: datos.precioGeneralM2,
      instalacion: datos.instalacion,
      descuento: datos.descuento,
      facturacion: datos.facturacion,
      pago: datos.pago,
      entrega: datos.entrega,
      terminos: datos.terminos
    };

    // Adaptaciones según destino
    switch (destino) {
      case 'pedido':
        return {
          ...payloadBase,
          estado: 'confirmado',
          fechaConfirmacion: new Date()
        };
        
      case 'produccion':
        return {
          ...payloadBase,
          estado: 'en_produccion',
          fechaInicioProduccion: new Date(),
          // Información técnica para fabricación
          detallesTecnicos: productosNormalizados.map(p => ({
            ubicacion: p.ubicacion,
            medidas: p.medidasIndividuales || [{ ancho: p.ancho, alto: p.alto }],
            requiereR24: p.requiereR24,
            tiempoFabricacion: p.tiempoFabricacion,
            motorizado: p.motorizado,
            esToldo: p.esToldo
          }))
        };
        
      default:
        return payloadBase;
    }
  }
}

module.exports = CotizacionMappingService;

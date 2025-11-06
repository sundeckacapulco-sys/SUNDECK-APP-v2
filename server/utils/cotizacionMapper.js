/**
 * MAPPER UNIFICADO DE COTIZACIÓN A PEDIDO
 * 
 * Propósito: Transferir información técnica completa desde el levantamiento
 * hasta el pedido, garantizando trazabilidad de los 13 campos técnicos.
 * 
 * Flujo: Proyecto.levantamiento → Cotización → Pedido → Fabricación
 * 
 * Fecha: 6 Noviembre 2025
 * Autor: Equipo Técnico Sundeck CRM
 */

const logger = require('../config/logger');

/**
 * Construye el array de productos para el pedido desde las partidas del levantamiento
 * 
 * @param {Array} partidas - Array de partidas desde proyecto.levantamiento.partidas
 * @param {Object} cotizacion - Objeto de cotización (opcional, para datos adicionales)
 * @returns {Array} Array de productos con estructura completa para Pedido
 */
const construirProductosDesdePartidas = (partidas = [], cotizacion = null) => {
  try {
    if (!Array.isArray(partidas) || partidas.length === 0) {
      logger.warn('construirProductosDesdePartidas: No hay partidas para mapear', {
        archivo: 'cotizacionMapper.js',
        funcion: 'construirProductosDesdePartidas'
      });
      return [];
    }

    const productos = [];

    partidas.forEach((partida, partidaIndex) => {
      const { 
        ubicacion, 
        producto, 
        color, 
        modelo, 
        cantidad = 1,
        piezas = [],
        motorizacion = {},
        instalacionEspecial = {},
        totales = {},
        fotos = []
      } = partida;

      // Procesar cada pieza individual de la partida
      piezas.forEach((pieza, piezaIndex) => {
        const {
          ancho = 0,
          alto = 0,
          m2 = 0,
          sistema = '',
          control = '',
          instalacion = '',
          fijacion = '',
          caida = '',
          galeria = '',
          telaMarca = '',
          baseTabla = '',
          operacion = '',
          detalle = '',
          traslape = '',
          modeloCodigo = '',
          observacionesTecnicas = '',
          precioM2 = 0
        } = pieza;

        // Calcular área si no está definida
        const area = m2 || (ancho * alto);

        // Construir objeto de especificaciones técnicas (13 campos)
        const especificacionesTecnicas = {
          sistema: Array.isArray(sistema) ? sistema : (sistema ? [sistema] : []),
          control: control || '',
          tipoInstalacion: instalacion || '',
          tipoFijacion: fijacion || '',
          caida: caida || '',
          galeria: galeria || '',
          telaMarca: telaMarca || '',
          baseTabla: baseTabla || '',
          modoOperacion: operacion || '',
          detalleTecnico: detalle || '',
          traslape: traslape || '',
          modeloCodigo: modeloCodigo || '',
          observacionesTecnicas: observacionesTecnicas || ''
        };

        // Construir objeto de producto completo
        const productoCompleto = {
          // Información básica
          nombre: producto || 'Producto sin nombre',
          descripcion: `${ubicacion || 'Sin ubicación'} - Pieza ${piezaIndex + 1} de ${piezas.length}`,
          categoria: producto || '',
          
          // Medidas
          medidas: {
            ancho: ancho,
            alto: alto,
            area: area
          },
          
          // Comercial
          cantidad: 1, // Cada pieza es una unidad
          precioUnitario: precioM2 * area,
          subtotal: precioM2 * area,
          
          // Información técnica (color y modelo a nivel de pieza)
          color: pieza.color || color || '',
          material: telaMarca || '',
          
          // ⭐ ESPECIFICACIONES TÉCNICAS COMPLETAS (13 campos)
          especificacionesTecnicas: especificacionesTecnicas,
          
          // Motorización (si aplica)
          motorizado: motorizacion?.activa || false,
          motorModelo: motorizacion?.modeloMotor || '',
          motorPrecio: motorizacion?.precioMotor || 0,
          numMotores: motorizacion?.cantidadMotores || 0,
          controlModelo: motorizacion?.modeloControl || '',
          controlPrecio: motorizacion?.precioControl || 0,
          esControlMulticanal: motorizacion?.tipoControl === 'multicanal',
          
          // Instalación especial (si aplica)
          requiereInstalacionEspecial: instalacionEspecial?.activa || false,
          tipoCobroInstalacion: instalacionEspecial?.tipoCobro || '',
          costoInstalacionBase: instalacionEspecial?.precioBase || 0,
          costoInstalacionPorPieza: instalacionEspecial?.precioPorPieza || 0,
          
          // Fotos asociadas
          fotoUrls: fotos.map(f => f.url) || [],
          
          // Fabricación
          requiereR24: area > 6.25, // R24 si área > 2.5m × 2.5m
          tiempoFabricacion: 15, // Días hábiles por defecto
          estadoFabricacion: 'pendiente',
          
          // Observaciones
          observaciones: observacionesTecnicas || '',
          
          // Metadata para trazabilidad
          partidaOriginal: {
            index: partidaIndex,
            ubicacion: ubicacion,
            producto: producto
          },
          piezaOriginal: {
            index: piezaIndex,
            total: piezas.length
          }
        };

        productos.push(productoCompleto);
      });
    });

    logger.info('Productos construidos desde partidas', {
      archivo: 'cotizacionMapper.js',
      funcion: 'construirProductosDesdePartidas',
      totalPartidas: partidas.length,
      totalProductos: productos.length,
      conEspecificacionesTecnicas: productos.every(p => p.especificacionesTecnicas)
    });

    return productos;

  } catch (error) {
    logger.error('Error construyendo productos desde partidas', {
      archivo: 'cotizacionMapper.js',
      funcion: 'construirProductosDesdePartidas',
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

/**
 * Extrae especificaciones técnicas desde un producto de cotización
 * (Para compatibilidad con cotizaciones que ya tienen estructura técnica)
 * 
 * @param {Object} producto - Producto de cotización
 * @returns {Object} Especificaciones técnicas normalizadas
 */
const extraerEspecificacionesTecnicas = (producto) => {
  try {
    // Si ya tiene especificacionesTecnicas, retornarlas
    if (producto.especificacionesTecnicas) {
      return producto.especificacionesTecnicas;
    }

    // Si no, intentar construirlas desde campos individuales
    return {
      sistema: producto.sistema || [],
      control: producto.control || '',
      tipoInstalacion: producto.tipoInstalacion || '',
      tipoFijacion: producto.tipoFijacion || '',
      caida: producto.caida || '',
      galeria: producto.galeria || '',
      telaMarca: producto.telaMarca || producto.material || '',
      baseTabla: producto.baseTabla || '',
      modoOperacion: producto.modoOperacion || '',
      detalleTecnico: producto.detalleTecnico || '',
      traslape: producto.traslape || '',
      modeloCodigo: producto.modeloCodigo || '',
      observacionesTecnicas: producto.observacionesTecnicas || producto.observaciones || ''
    };
  } catch (error) {
    logger.error('Error extrayendo especificaciones técnicas', {
      archivo: 'cotizacionMapper.js',
      funcion: 'extraerEspecificacionesTecnicas',
      error: error.message
    });
    return {};
  }
};

/**
 * Normaliza un producto de cotización para pedido
 * (Para cotizaciones que no vienen desde levantamiento)
 * 
 * @param {Object} producto - Producto de cotización
 * @returns {Object} Producto normalizado para pedido
 */
const normalizarProductoParaPedido = (producto) => {
  try {
    return {
      // Información básica
      nombre: producto.nombre || 'Producto sin nombre',
      descripcion: producto.descripcion || '',
      categoria: producto.categoria || '',
      
      // Medidas
      medidas: producto.medidas || { ancho: 0, alto: 0, area: 0 },
      
      // Comercial
      cantidad: producto.cantidad || 1,
      precioUnitario: producto.precioUnitario || 0,
      subtotal: producto.subtotal || 0,
      
      // Información técnica
      color: producto.color || '',
      material: producto.material || '',
      
      // ⭐ ESPECIFICACIONES TÉCNICAS
      especificacionesTecnicas: extraerEspecificacionesTecnicas(producto),
      
      // Motorización
      motorizado: producto.motorizado || false,
      motorModelo: producto.motorModelo || '',
      motorPrecio: producto.motorPrecio || 0,
      numMotores: producto.numMotores || 0,
      controlModelo: producto.controlModelo || '',
      controlPrecio: producto.controlPrecio || 0,
      esControlMulticanal: producto.esControlMulticanal || false,
      
      // Fotos
      fotoUrls: producto.fotoUrls || [],
      
      // Fabricación
      requiereR24: producto.requiereR24 || false,
      tiempoFabricacion: producto.tiempoFabricacion || 15,
      estadoFabricacion: 'pendiente',
      
      // Observaciones
      observaciones: producto.observaciones || ''
    };
  } catch (error) {
    logger.error('Error normalizando producto para pedido', {
      archivo: 'cotizacionMapper.js',
      funcion: 'normalizarProductoParaPedido',
      error: error.message
    });
    throw error;
  }
};

/**
 * Valida que un producto tenga las especificaciones técnicas completas
 * 
 * @param {Object} producto - Producto a validar
 * @returns {Object} { valido: boolean, camposFaltantes: Array }
 */
const validarEspecificacionesTecnicas = (producto) => {
  const camposRequeridos = [
    'sistema',
    'control',
    'tipoInstalacion',
    'tipoFijacion',
    'caida',
    'galeria',
    'telaMarca',
    'baseTabla',
    'modoOperacion',
    'detalleTecnico',
    'traslape',
    'modeloCodigo',
    'observacionesTecnicas'
  ];

  const especificaciones = producto.especificacionesTecnicas || {};
  const camposFaltantes = camposRequeridos.filter(campo => !especificaciones.hasOwnProperty(campo));

  return {
    valido: camposFaltantes.length === 0,
    camposFaltantes: camposFaltantes,
    totalCampos: camposRequeridos.length,
    camposPresentes: camposRequeridos.length - camposFaltantes.length
  };
};

// Exportaciones
module.exports = {
  construirProductosDesdePartidas,
  extraerEspecificacionesTecnicas,
  normalizarProductoParaPedido,
  validarEspecificacionesTecnicas
};

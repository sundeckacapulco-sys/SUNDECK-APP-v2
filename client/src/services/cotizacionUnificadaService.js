/**
 * Servicio Unificado de Cotizaciones
 * 
 * Este servicio centraliza toda la lógica de los 4 flujos de cotización:
 * 1. Levantamiento técnico
 * 2. Cotización en vivo  
 * 3. Cotización tradicional
 * 4. Cotización directa
 * 
 * Basado en el análisis de flujos de cotización para eliminar inconsistencias
 * y unificar la lógica de cálculos, normalización y transformaciones.
 */

import { calcularTotales } from './calculosService';
import { normalizarParaBackend } from './normalizacionService';
import { useCotizacionStore } from '../stores/cotizacionStore';

// ============================================================================
// CONSTANTES Y CONFIGURACIONES
// ============================================================================

export const TIPOS_FLUJO = {
  LEVANTAMIENTO: 'levantamiento',
  COTIZACION_VIVO: 'cotizacion_vivo', 
  TRADICIONAL: 'tradicional',
  DIRECTA: 'directa'
};

export const ORIGENES = {
  LEVANTAMIENTO: 'levantamiento',
  COTIZACION_VIVO: 'cotizacion_vivo',
  TRADICIONAL: 'tradicional', 
  DIRECTA: 'directa',
  IMPORTADO: 'importado'
};

const CONFIGURACIONES_FLUJO = {
  [TIPOS_FLUJO.LEVANTAMIENTO]: {
    mostrarPrecios: false,
    capturaTecnica: true,
    requiereProspecto: true,
    generaDocumentos: true,
    campos: ['tecnico', 'medidas', 'fotos']
  },
  [TIPOS_FLUJO.COTIZACION_VIVO]: {
    mostrarPrecios: true,
    capturaTecnica: true,
    requiereProspecto: true,
    generaDocumentos: true,
    campos: ['tecnico', 'medidas', 'precios', 'comercial']
  },
  [TIPOS_FLUJO.TRADICIONAL]: {
    mostrarPrecios: true,
    capturaTecnica: false,
    requiereProspecto: false,
    generaDocumentos: true,
    campos: ['medidas', 'precios', 'comercial']
  },
  [TIPOS_FLUJO.DIRECTA]: {
    mostrarPrecios: true,
    capturaTecnica: false,
    requiereProspecto: false,
    generaDocumentos: true,
    campos: ['cliente', 'medidas', 'precios', 'comercial']
  }
};

// ============================================================================
// UTILIDADES DE TRANSFORMACIÓN
// ============================================================================

/**
 * Normaliza medidas desde diferentes formatos a estructura unificada
 */
const normalizarMedidas = (medidas, formato = 'auto') => {
  if (!medidas) return { ancho: 0, alto: 0, area: 0, cantidad: 1 };

  // Formato array de medidas individuales (levantamiento técnico)
  if (Array.isArray(medidas)) {
    const totalArea = medidas.reduce((sum, m) => sum + (m.ancho * m.alto || 0), 0);
    const primeraMedida = medidas[0] || {};
    return {
      ancho: primeraMedida.ancho || 0,
      alto: primeraMedida.alto || 0,
      area: totalArea,
      cantidad: medidas.length,
      detalles: medidas
    };
  }

  // Formato objeto (cotización tradicional/directa)
  if (typeof medidas === 'object') {
    const ancho = Number(medidas.ancho) || 0;
    const alto = Number(medidas.alto) || 0;
    const area = Number(medidas.area) || (ancho * alto);
    const cantidad = Number(medidas.cantidad) || 1;
    
    return {
      ancho,
      alto, 
      area: area > 0 ? area : ancho * alto,
      cantidad
    };
  }

  return { ancho: 0, alto: 0, area: 0, cantidad: 1 };
};

/**
 * Normaliza información técnica desde diferentes fuentes
 */
const normalizarTecnico = (tecnico = {}, extras = {}) => {
  return {
    // Campos técnicos básicos
    tipoControl: tecnico.tipoControl || '',
    orientacion: tecnico.orientacion || '',
    instalacion: tecnico.instalacion || tecnico.tipoInstalacion || '',
    eliminacion: tecnico.eliminacion || '',
    risoAlto: tecnico.risoAlto || '',
    risoBajo: tecnico.risoBajo || '',
    sistema: tecnico.sistema || '',
    telaMarca: tecnico.telaMarca || '',
    baseTabla: tecnico.baseTabla || '',
    observaciones: tecnico.observaciones || '',
    color: tecnico.color || '',
    
    // Información de motorización
    motorizado: Boolean(extras.motorizado || tecnico.motorizado),
    motorModelo: extras.motorModelo || tecnico.motorModelo || '',
    motorPrecio: Number(extras.motorPrecio || tecnico.motorPrecio) || 0,
    controlModelo: extras.controlModelo || tecnico.controlModelo || '',
    controlPrecio: Number(extras.controlPrecio || tecnico.controlPrecio) || 0,
    
    // Información de toldos
    esToldo: Boolean(extras.esToldo || tecnico.esToldo),
    tipoToldo: extras.tipoToldo || tecnico.tipoToldo || '',
    kitModelo: extras.kitModelo || tecnico.kitModelo || '',
    kitPrecio: Number(extras.kitPrecio || tecnico.kitPrecio) || 0
  };
};

/**
 * Convierte producto del store a formato de pieza para backend
 */
const productoAPieza = (producto) => {
  const medidas = normalizarMedidas(producto.medidas);
  const tecnico = normalizarTecnico(producto.tecnico, producto.extras);
  
  return {
    ubicacion: producto.ubicacion || '',
    producto: producto.nombre || '',
    productoLabel: producto.nombre || '',
    cantidad: medidas.cantidad,
    ancho: medidas.ancho,
    alto: medidas.alto,
    precioM2: Number(producto.precios?.unitario) || 0,
    color: tecnico.color,
    observaciones: tecnico.observaciones,
    
    // Medidas detalladas si existen
    medidas: medidas.detalles || [{
      ancho: medidas.ancho,
      alto: medidas.alto,
      area: medidas.area,
      producto: producto.nombre,
      productoLabel: producto.nombre,
      color: tecnico.color,
      precioM2: Number(producto.precios?.unitario) || 0
    }],
    
    // Información técnica completa
    ...tecnico
  };
};

/**
 * Convierte pieza del formato anterior a producto del store
 */
const piezaAProducto = (pieza, index = 0) => {
  const medidas = normalizarMedidas(pieza.medidas || pieza);
  
  return {
    id: `producto_${index}_${Date.now()}`,
    nombre: pieza.productoLabel || pieza.producto || '',
    ubicacion: pieza.ubicacion || '',
    medidas: {
      ancho: medidas.ancho,
      alto: medidas.alto,
      area: medidas.area,
      cantidad: medidas.cantidad,
      detalles: medidas.detalles
    },
    precios: {
      unitario: Number(pieza.precioM2) || 0,
      subtotal: Number(pieza.subtotal) || (medidas.area * Number(pieza.precioM2 || 0))
    },
    tecnico: {
      tipoControl: pieza.tipoControl || '',
      orientacion: pieza.orientacion || '',
      instalacion: pieza.instalacion || pieza.tipoInstalacion || '',
      eliminacion: pieza.eliminacion || '',
      risoAlto: pieza.risoAlto || '',
      risoBajo: pieza.risoBajo || '',
      sistema: pieza.sistema || '',
      telaMarca: pieza.telaMarca || '',
      baseTabla: pieza.baseTabla || '',
      observaciones: pieza.observaciones || '',
      color: pieza.color || ''
    },
    extras: {
      motorizado: Boolean(pieza.motorizado),
      esToldo: Boolean(pieza.esToldo),
      motorModelo: pieza.motorModelo || '',
      motorPrecio: Number(pieza.motorPrecio) || 0,
      controlModelo: pieza.controlModelo || '',
      controlPrecio: Number(pieza.controlPrecio) || 0,
      tipoToldo: pieza.tipoToldo || '',
      kitModelo: pieza.kitModelo || '',
      kitPrecio: Number(pieza.kitPrecio) || 0,
      kits: [],
      otros: {}
    }
  };
};

// ============================================================================
// CLASE PRINCIPAL DEL SERVICIO
// ============================================================================

export class CotizacionUnificadaService {
  constructor() {
    this.store = null;
  }

  /**
   * Inicializa el servicio con el store de Zustand
   */
  init(store = null) {
    this.store = store || useCotizacionStore.getState();
    return this;
  }

  /**
   * Configura el flujo de cotización
   */
  configurarFlujo(tipo, opciones = {}) {
    if (!Object.values(TIPOS_FLUJO).includes(tipo)) {
      throw new Error(`Tipo de flujo inválido: ${tipo}`);
    }

    const configuracion = CONFIGURACIONES_FLUJO[tipo];
    const flujo = {
      tipo,
      origen: opciones.origen || tipo,
      tipoVisitaInicial: opciones.tipoVisitaInicial || (tipo === TIPOS_FLUJO.LEVANTAMIENTO ? 'levantamiento' : 'cotizacion'),
      configuracion
    };

    if (this.store?.updateFlujo) {
      this.store.updateFlujo(flujo);
    }

    return flujo;
  }

  /**
   * Importa datos desde levantamiento técnico
   */
  importarLevantamiento(piezas = [], prospectoId = null) {
    if (!Array.isArray(piezas) || piezas.length === 0) {
      throw new Error('No hay piezas para importar');
    }

    // Convertir piezas a productos del store
    const productos = piezas.map((pieza, index) => piezaAProducto(pieza, index));
    
    // Extraer información del cliente si existe
    const primeraPieza = piezas[0];
    const cliente = {
      nombre: primeraPieza.cliente?.nombre || '',
      telefono: primeraPieza.cliente?.telefono || '',
      email: primeraPieza.cliente?.email || '',
      direccion: primeraPieza.cliente?.direccion || ''
    };

    // Configurar el store
    if (this.store?.setProductos) {
      this.store.setProductos(productos);
    }
    if (this.store?.setCliente && (cliente.nombre || cliente.telefono)) {
      this.store.setCliente(cliente);
    }
    if (this.store?.setConfiguracion && prospectoId) {
      this.store.setConfiguracion({ prospectoId });
    }

    return {
      productos,
      cliente,
      totalImportado: productos.length
    };
  }

  /**
   * Calcula totales usando el servicio unificado
   */
  calcularTotales(productos = null, comercial = null) {
    const state = this.store || useCotizacionStore.getState();
    const productosCalculo = productos || state.productos || [];
    const comercialCalculo = comercial || state.comercial || {};
    
    return calcularTotales(productosCalculo, comercialCalculo);
  }

  /**
   * Genera payload para backend según el tipo de flujo
   */
  generarPayload(tipoFlujo, opciones = {}) {
    const state = this.store || useCotizacionStore.getState();
    const configuracion = state.configuracion || {};
    
    // Configurar flujo si no está configurado
    if (!state.flujo?.tipo) {
      this.configurarFlujo(tipoFlujo, opciones);
    }

    const payloadBase = {
      prospectoId: opciones.prospectoId || configuracion.prospectoId,
      comentarios: opciones.comentarios || configuracion.comentarios || '',
      unidadMedida: opciones.unidadMedida || configuracion.unidadMedida || 'm',
      precioGeneral: opciones.precioGeneral || configuracion.precioGeneral || 0,
      tipoVisitaInicial: state.flujo?.tipoVisitaInicial || 'cotizacion',
      fechaEtapa: opciones.fechaEtapa || configuracion.fechaEtapa,
      horaEtapa: opciones.horaEtapa || configuracion.horaEtapa
    };

    switch (tipoFlujo) {
      case TIPOS_FLUJO.LEVANTAMIENTO:
        return this.generarPayloadLevantamiento(payloadBase, opciones);
        
      case TIPOS_FLUJO.COTIZACION_VIVO:
        return this.generarPayloadCotizacionVivo(payloadBase, opciones);
        
      case TIPOS_FLUJO.TRADICIONAL:
        return this.generarPayloadTradicional(payloadBase, opciones);
        
      case TIPOS_FLUJO.DIRECTA:
        return this.generarPayloadDirecta(payloadBase, opciones);
        
      default:
        throw new Error(`Tipo de flujo no soportado: ${tipoFlujo}`);
    }
  }

  /**
   * Payload específico para levantamiento técnico
   */
  generarPayloadLevantamiento(base, opciones) {
    const state = this.store || useCotizacionStore.getState();
    const piezas = state.productos.map(producto => productoAPieza(producto));
    
    return {
      ...base,
      piezas,
      tipoVisita: 'levantamiento',
      datosLevantamiento: {
        totalPiezas: piezas.length,
        totalM2: this.calcularTotales().totalArea,
        capturaTecnica: true
      },
      origen: ORIGENES.LEVANTAMIENTO
    };
  }

  /**
   * Payload específico para cotización en vivo
   */
  generarPayloadCotizacionVivo(base, opciones) {
    const state = this.store || useCotizacionStore.getState();
    const totales = this.calcularTotales();
    const piezas = state.productos.map(producto => productoAPieza(producto));
    
    return normalizarParaBackend(state, TIPOS_FLUJO.COTIZACION_VIVO, {
      ...base,
      piezas,
      totalM2: totales.totalArea,
      totalFinal: totales.total,
      ...opciones
    });
  }

  /**
   * Payload específico para cotización tradicional
   */
  generarPayloadTradicional(base, opciones) {
    const state = this.store || useCotizacionStore.getState();
    const totales = this.calcularTotales();
    
    return {
      ...base,
      cliente: state.cliente,
      productos: state.productos.map(producto => ({
        nombre: producto.nombre,
        descripcion: `${producto.ubicacion} - ${producto.tecnico?.color || ''}`.trim(),
        medidas: producto.medidas,
        cantidad: producto.medidas?.cantidad || 1,
        precioUnitario: producto.precios?.unitario || 0,
        subtotal: producto.precios?.subtotal || 0
      })),
      subtotal: totales.subtotalProductos,
      descuento: totales.descuento.monto,
      iva: totales.iva.monto,
      total: totales.total,
      origen: ORIGENES.TRADICIONAL
    };
  }

  /**
   * Payload específico para cotización directa
   */
  generarPayloadDirecta(base, opciones) {
    const state = this.store || useCotizacionStore.getState();
    const totales = this.calcularTotales();
    
    return {
      // Datos del cliente (se crea prospecto automáticamente)
      cliente: state.cliente,
      
      // Productos simplificados
      productos: state.productos.map(producto => ({
        nombre: producto.nombre,
        ubicacion: producto.ubicacion,
        medidas: {
          ancho: producto.medidas?.ancho || 0,
          alto: producto.medidas?.alto || 0,
          area: producto.medidas?.area || 0
        },
        cantidad: producto.medidas?.cantidad || 1,
        precioUnitario: producto.precios?.unitario || 0,
        subtotal: (producto.medidas?.area || 0) * (producto.precios?.unitario || 0) * (producto.medidas?.cantidad || 1)
      })),
      
      // Totales y condiciones comerciales
      subtotal: totales.subtotalProductos,
      descuento: totales.descuento,
      instalacion: totales.instalacionEspecial,
      iva: totales.iva,
      total: totales.total,
      
      // Metadatos
      origen: ORIGENES.DIRECTA,
      fechaValidez: opciones.fechaValidez,
      condiciones: opciones.condiciones || {}
    };
  }

  /**
   * Valida que los datos estén completos según el tipo de flujo
   */
  validar(tipoFlujo) {
    const state = this.store || useCotizacionStore.getState();
    const configuracion = CONFIGURACIONES_FLUJO[tipoFlujo];
    const errores = [];

    // Validaciones comunes
    if (!state.productos || state.productos.length === 0) {
      errores.push('Debe agregar al menos un producto');
    }

    // Validaciones específicas por flujo
    if (configuracion.requiereProspecto && !state.configuracion?.prospectoId) {
      errores.push('Debe seleccionar un prospecto');
    }

    if (tipoFlujo === TIPOS_FLUJO.DIRECTA && (!state.cliente?.nombre || !state.cliente?.telefono)) {
      errores.push('Debe completar los datos del cliente (nombre y teléfono)');
    }

    // Validar productos
    state.productos.forEach((producto, index) => {
      if (!producto.nombre) {
        errores.push(`Producto ${index + 1}: Debe especificar el nombre`);
      }
      if (!producto.medidas?.area || producto.medidas.area <= 0) {
        errores.push(`Producto ${index + 1}: Debe especificar medidas válidas`);
      }
      if (configuracion.mostrarPrecios && (!producto.precios?.unitario || producto.precios.unitario <= 0)) {
        errores.push(`Producto ${index + 1}: Debe especificar precio unitario`);
      }
    });

    return {
      valido: errores.length === 0,
      errores
    };
  }

  /**
   * Resetea el store a estado inicial
   */
  reset() {
    if (this.store?.reset) {
      this.store.reset();
    }
  }

  /**
   * Obtiene configuración del flujo actual
   */
  getConfiguracionFlujo() {
    const state = this.store || useCotizacionStore.getState();
    const tipo = state.flujo?.tipo;
    return tipo ? CONFIGURACIONES_FLUJO[tipo] : null;
  }
}

// ============================================================================
// INSTANCIA SINGLETON Y EXPORTS
// ============================================================================

export const cotizacionService = new CotizacionUnificadaService();

// Funciones de conveniencia
export const configurarFlujo = (tipo, opciones) => cotizacionService.configurarFlujo(tipo, opciones);
export const importarLevantamiento = (piezas, prospectoId) => cotizacionService.importarLevantamiento(piezas, prospectoId);
export const calcularTotalesUnificados = (productos, comercial) => cotizacionService.calcularTotales(productos, comercial);
export const generarPayloadUnificado = (tipoFlujo, opciones) => cotizacionService.generarPayload(tipoFlujo, opciones);
export const validarCotizacion = (tipoFlujo) => cotizacionService.validar(tipoFlujo);

export default cotizacionService;

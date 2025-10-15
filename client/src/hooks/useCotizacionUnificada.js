/**
 * Hook personalizado para usar el servicio unificado de cotizaciones
 * 
 * Este hook facilita el uso del CotizacionUnificadaService en componentes React,
 * proporcionando una interfaz reactiva que se sincroniza automáticamente con
 * el store de Zustand.
 */

import { useCallback, useEffect, useMemo } from 'react';
import { useCotizacionStore } from '../stores/cotizacionStore';
import { 
  cotizacionService, 
  TIPOS_FLUJO, 
  ORIGENES,
  configurarFlujo,
  importarLevantamiento,
  calcularTotalesUnificados,
  generarPayloadUnificado,
  validarCotizacion
} from '../services/cotizacionUnificadaService';

/**
 * Hook principal para manejar cotizaciones unificadas
 */
export const useCotizacionUnificada = (tipoFlujo = null, opciones = {}) => {
  // Estado del store
  const store = useCotizacionStore();
  
  // Inicializar servicio con el store actual
  useEffect(() => {
    cotizacionService.init(store);
  }, [store]);

  // Configurar flujo automáticamente si se especifica
  useEffect(() => {
    if (tipoFlujo && (!store.flujo?.tipo || store.flujo.tipo !== tipoFlujo)) {
      configurarFlujo(tipoFlujo, opciones);
    }
  }, [tipoFlujo, opciones, store.flujo?.tipo]);

  // ============================================================================
  // CÁLCULOS REACTIVOS
  // ============================================================================

  const totales = useMemo(() => {
    return calcularTotalesUnificados(store.productos, store.comercial);
  }, [store.productos, store.comercial]);

  const configuracionFlujo = useMemo(() => {
    return cotizacionService.getConfiguracionFlujo();
  }, [store.flujo?.tipo]);

  const validacion = useMemo(() => {
    if (!store.flujo?.tipo) return { valido: false, errores: ['Flujo no configurado'] };
    return validarCotizacion(store.flujo.tipo);
  }, [store.flujo?.tipo, store.productos, store.cliente, store.configuracion]);

  // ============================================================================
  // ACCIONES DEL CLIENTE
  // ============================================================================

  const setCliente = useCallback((cliente) => {
    store.setCliente(cliente);
  }, [store]);

  const updateCliente = useCallback((updates) => {
    store.updateCliente(updates);
  }, [store]);

  // ============================================================================
  // ACCIONES DE PRODUCTOS
  // ============================================================================

  const addProducto = useCallback((producto) => {
    const productoConId = {
      ...producto,
      id: producto.id || `producto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    store.addProducto(productoConId);
    return productoConId.id;
  }, [store]);

  const updateProducto = useCallback((id, updates) => {
    store.updateProducto(id, updates);
  }, [store]);

  const removeProducto = useCallback((id) => {
    store.removeProducto(id);
  }, [store]);

  const setProductos = useCallback((productos) => {
    store.setProductos(productos);
  }, [store]);

  const resetProductos = useCallback(() => {
    store.resetProductos();
  }, [store]);

  // ============================================================================
  // ACCIONES COMERCIALES
  // ============================================================================

  const updateInstalacionEspecial = useCallback((instalacion) => {
    store.updateComercialSection('instalacionEspecial', instalacion);
  }, [store]);

  const updateDescuentos = useCallback((descuentos) => {
    store.updateComercialSection('descuentos', descuentos);
  }, [store]);

  const updateFacturacion = useCallback((facturacion) => {
    store.updateComercialSection('facturacion', facturacion);
  }, [store]);

  const updateTiempos = useCallback((tiempos) => {
    store.updateComercialSection('tiempos', tiempos);
  }, [store]);

  // ============================================================================
  // ACCIONES DE FLUJO
  // ============================================================================

  const cambiarFlujo = useCallback((nuevoTipo, nuevasOpciones = {}) => {
    configurarFlujo(nuevoTipo, nuevasOpciones);
  }, []);

  const updateFlujo = useCallback((updates) => {
    store.updateFlujo(updates);
  }, [store]);

  // ============================================================================
  // ACCIONES DE CONFIGURACIÓN
  // ============================================================================

  const setProspectoId = useCallback((prospectoId) => {
    store.updateConfiguracion({ prospectoId });
  }, [store]);

  const updateConfiguracion = useCallback((updates) => {
    store.updateConfiguracion(updates);
  }, [store]);

  // ============================================================================
  // IMPORTACIÓN Y EXPORTACIÓN
  // ============================================================================

  const importarDesdelevantamiento = useCallback(async (piezas, prospectoId = null) => {
    try {
      const resultado = importarLevantamiento(piezas, prospectoId);
      
      // Actualizar configuración si se proporcionó prospectoId
      if (prospectoId) {
        setProspectoId(prospectoId);
      }
      
      return {
        exito: true,
        data: resultado,
        mensaje: `Se importaron ${resultado.totalImportado} productos correctamente`
      };
    } catch (error) {
      return {
        exito: false,
        error: error.message,
        mensaje: 'Error al importar levantamiento'
      };
    }
  }, [setProspectoId]);

  const generarPayload = useCallback((opciones = {}) => {
    if (!store.flujo?.tipo) {
      throw new Error('Debe configurar el tipo de flujo antes de generar payload');
    }
    
    return generarPayloadUnificado(store.flujo.tipo, {
      ...opciones,
      prospectoId: opciones.prospectoId || store.configuracion?.prospectoId
    });
  }, [store.flujo?.tipo, store.configuracion?.prospectoId]);

  // ============================================================================
  // UTILIDADES
  // ============================================================================

  const reset = useCallback(() => {
    store.reset();
  }, [store]);

  const getSnapshot = useCallback(() => {
    return store.getSnapshot();
  }, [store]);

  const loadSnapshot = useCallback((snapshot) => {
    store.loadSnapshot(snapshot);
  }, [store]);

  // ============================================================================
  // VALIDACIONES ESPECÍFICAS
  // ============================================================================

  const validarProducto = useCallback((producto) => {
    const errores = [];
    
    if (!producto.nombre?.trim()) {
      errores.push('El nombre del producto es requerido');
    }
    
    if (!producto.ubicacion?.trim()) {
      errores.push('La ubicación es requerida');
    }
    
    if (!producto.medidas?.area || producto.medidas.area <= 0) {
      errores.push('Las medidas son requeridas y deben ser mayores a 0');
    }
    
    if (configuracionFlujo?.mostrarPrecios && (!producto.precios?.unitario || producto.precios.unitario <= 0)) {
      errores.push('El precio unitario es requerido y debe ser mayor a 0');
    }
    
    return {
      valido: errores.length === 0,
      errores
    };
  }, [configuracionFlujo]);

  const validarCliente = useCallback((cliente = store.cliente) => {
    const errores = [];
    
    if (!cliente.nombre?.trim()) {
      errores.push('El nombre del cliente es requerido');
    }
    
    if (!cliente.telefono?.trim()) {
      errores.push('El teléfono del cliente es requerido');
    }
    
    return {
      valido: errores.length === 0,
      errores
    };
  }, [store.cliente]);

  // ============================================================================
  // HELPERS PARA COMPONENTES
  // ============================================================================

  const puedeAgregarProductos = useMemo(() => {
    return configuracionFlujo && configuracionFlujo.campos.includes('medidas');
  }, [configuracionFlujo]);

  const puedeEditarPrecios = useMemo(() => {
    return configuracionFlujo && configuracionFlujo.mostrarPrecios;
  }, [configuracionFlujo]);

  const puedeCapturarTecnico = useMemo(() => {
    return configuracionFlujo && configuracionFlujo.capturaTecnica;
  }, [configuracionFlujo]);

  const requiereProspecto = useMemo(() => {
    return configuracionFlujo && configuracionFlujo.requiereProspecto;
  }, [configuracionFlujo]);

  const puedeGenerarDocumentos = useMemo(() => {
    return configuracionFlujo && configuracionFlujo.generaDocumentos && validacion.valido;
  }, [configuracionFlujo, validacion.valido]);

  // ============================================================================
  // RETURN DEL HOOK
  // ============================================================================

  return {
    // Estado
    cliente: store.cliente,
    productos: store.productos,
    comercial: store.comercial,
    flujo: store.flujo,
    configuracion: store.configuracion,
    
    // Cálculos
    totales,
    configuracionFlujo,
    validacion,
    
    // Acciones de cliente
    setCliente,
    updateCliente,
    validarCliente,
    
    // Acciones de productos
    addProducto,
    updateProducto,
    removeProducto,
    setProductos,
    resetProductos,
    validarProducto,
    
    // Acciones comerciales
    updateInstalacionEspecial,
    updateDescuentos,
    updateFacturacion,
    updateTiempos,
    
    // Acciones de flujo
    cambiarFlujo,
    updateFlujo,
    
    // Configuración
    setProspectoId,
    updateConfiguracion,
    
    // Importación/Exportación
    importarDesdelevantamiento,
    generarPayload,
    
    // Utilidades
    reset,
    getSnapshot,
    loadSnapshot,
    
    // Helpers para componentes
    puedeAgregarProductos,
    puedeEditarPrecios,
    puedeCapturarTecnico,
    requiereProspecto,
    puedeGenerarDocumentos,
    
    // Constantes
    TIPOS_FLUJO,
    ORIGENES
  };
};

/**
 * Hook específico para levantamiento técnico
 */
export const useLevantamientoTecnico = (prospectoId = null) => {
  const cotizacion = useCotizacionUnificada(TIPOS_FLUJO.LEVANTAMIENTO, {
    origen: ORIGENES.LEVANTAMIENTO,
    tipoVisitaInicial: 'levantamiento'
  });

  useEffect(() => {
    if (prospectoId) {
      cotizacion.setProspectoId(prospectoId);
    }
  }, [prospectoId, cotizacion]);

  return {
    ...cotizacion,
    // Acciones específicas para levantamiento
    agregarPiezaTecnica: (pieza) => {
      return cotizacion.addProducto({
        ...pieza,
        tecnico: {
          ...pieza.tecnico,
          // Campos técnicos específicos del levantamiento
          tipoControl: pieza.tecnico?.tipoControl || '',
          orientacion: pieza.tecnico?.orientacion || '',
          instalacion: pieza.tecnico?.instalacion || '',
          eliminacion: pieza.tecnico?.eliminacion || '',
          risoAlto: pieza.tecnico?.risoAlto || '',
          risoBajo: pieza.tecnico?.risoBajo || '',
          sistema: pieza.tecnico?.sistema || '',
          telaMarca: pieza.tecnico?.telaMarca || '',
          baseTabla: pieza.tecnico?.baseTabla || ''
        }
      });
    }
  };
};

/**
 * Hook específico para cotización en vivo
 */
export const useCotizacionEnVivo = (prospectoId = null) => {
  const cotizacion = useCotizacionUnificada(TIPOS_FLUJO.COTIZACION_VIVO, {
    origen: ORIGENES.COTIZACION_VIVO,
    tipoVisitaInicial: 'cotizacion'
  });

  useEffect(() => {
    if (prospectoId) {
      cotizacion.setProspectoId(prospectoId);
    }
  }, [prospectoId, cotizacion]);

  return cotizacion;
};

/**
 * Hook específico para cotización tradicional
 */
export const useCotizacionTradicional = () => {
  return useCotizacionUnificada(TIPOS_FLUJO.TRADICIONAL, {
    origen: ORIGENES.TRADICIONAL
  });
};

/**
 * Hook específico para cotización directa
 */
export const useCotizacionDirecta = () => {
  const cotizacion = useCotizacionUnificada(TIPOS_FLUJO.DIRECTA, {
    origen: ORIGENES.DIRECTA
  });

  return {
    ...cotizacion,
    // Validación específica para cotización directa
    validarParaCreacion: () => {
      const validacionCliente = cotizacion.validarCliente();
      const validacionGeneral = cotizacion.validacion;
      
      return {
        valido: validacionCliente.valido && validacionGeneral.valido,
        errores: [...validacionCliente.errores, ...validacionGeneral.errores]
      };
    }
  };
};

export default useCotizacionUnificada;

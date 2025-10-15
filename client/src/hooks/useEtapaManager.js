import { useMemo } from 'react';
import { useCotizacionStore } from '../stores/cotizacionStore';
import { calcularTotales } from '../services/calculosService';

/**
 * Hook unificado para manejar etapas (reemplaza usePiezasManager)
 * Usa el store central para todos los tipos de flujo
 */
export const useEtapaManager = () => {
  // Store central con validaciones
  const productos = useCotizacionStore((state) => state.productos || []);
  const comercial = useCotizacionStore((state) => state.comercial || {});
  const configuracion = useCotizacionStore((state) => state.configuracion || {});
  const flujo = useCotizacionStore((state) => state.flujo || {});
  
  // Acciones del store
  const addProducto = useCotizacionStore((state) => state.addProducto);
  const updateProducto = useCotizacionStore((state) => state.updateProducto);
  const removeProducto = useCotizacionStore((state) => state.removeProducto);
  const setProductos = useCotizacionStore((state) => state.setProductos);
  const updateComercialSection = useCotizacionStore((state) => state.updateComercialSection);
  const updateConfiguracion = useCotizacionStore((state) => state.updateConfiguracion);
  const updateFlujo = useCotizacionStore((state) => state.updateFlujo);
  const reset = useCotizacionStore((state) => state.reset);

  // Cálculos unificados
  const totales = useMemo(() => {
    return calcularTotales(productos, comercial);
  }, [productos, comercial]);

  // Funciones de utilidad
  const agregarProducto = (producto) => {
    const nuevoProducto = {
      id: Date.now().toString(), // ID temporal
      nombre: producto.nombre || producto.producto || '',
      ubicacion: producto.ubicacion || '',
      medidas: {
        ancho: Number(producto.ancho || 0),
        alto: Number(producto.alto || 0),
        area: Number(producto.area || 0),
        cantidad: Number(producto.cantidad || 1),
        detalles: producto.medidas || [],
      },
      precios: {
        unitario: Number(producto.precioM2 || configuracion.precioGeneral || 0),
        subtotal: Number(producto.subtotal || 0),
      },
      tecnico: {
        tipoControl: producto.controlModelo || '',
        orientacion: producto.orientacion || '',
        instalacion: producto.tipoInstalacion || '',
        eliminacion: producto.eliminacion || '',
        risoAlto: producto.risoAlto || '',
        risoBajo: producto.risoBajo || '',
        sistema: producto.sistema || '',
        telaMarca: producto.telaMarca || '',
        baseTabla: producto.baseTabla || '',
        observaciones: producto.observaciones || '',
      },
      extras: {
        motorizado: Boolean(producto.motorizado),
        esToldo: Boolean(producto.esToldo),
        kits: producto.kits || [],
        otros: producto.otros || {},
      },
      metadata: {
        piezaOriginal: producto, // Preservar datos originales
      },
    };
    
    addProducto(nuevoProducto);
    return nuevoProducto;
  };

  const eliminarProducto = (id) => {
    removeProducto(id);
  };

  const editarProducto = (id, updates) => {
    updateProducto(id, updates);
  };

  const configurarFlujo = (tipoVisitaInicial) => {
    const tipoFlujo = tipoVisitaInicial === 'levantamiento' ? 'levantamiento' : 'cotizacion_vivo';
    const origen = tipoVisitaInicial === 'levantamiento' ? 'levantamiento' : 'cotizacion_vivo';
    
    updateFlujo({
      tipo: tipoFlujo,
      origen: origen,
      tipoVisitaInicial: tipoVisitaInicial,
    });
  };

  const configurarInstalacion = (instalacionData) => {
    updateComercialSection('instalacionEspecial', {
      activa: Boolean(instalacionData.activa),
      tipo: instalacionData.tipo || 'fijo',
      precio: Number(instalacionData.precio || 0),
    });
  };

  const configurarDescuentos = (descuentoData) => {
    updateComercialSection('descuentos', {
      activo: Boolean(descuentoData.activo),
      tipo: descuentoData.tipo || 'porcentaje',
      valor: Number(descuentoData.valor || 0),
    });
  };

  const configurarFacturacion = (facturacionData) => {
    updateComercialSection('facturacion', {
      requiereFactura: Boolean(facturacionData.requiereFactura),
      iva: Number(facturacionData.iva || 0.16),
    });
  };

  return {
    // Estado
    productos,
    comercial,
    configuracion,
    flujo,
    totales,
    
    // Acciones de productos
    agregarProducto,
    eliminarProducto,
    editarProducto,
    setProductos,
    
    // Configuración
    updateConfiguracion,
    configurarFlujo,
    configurarInstalacion,
    configurarDescuentos,
    configurarFacturacion,
    
    // Utilidades
    reset,
    
    // Compatibilidad con sistema antiguo
    piezas: productos, // Alias para compatibilidad
    calcularTotalM2: totales.totalArea,
    calcularSubtotalProductos: totales.subtotalProductos,
    totalFinal: totales.total,
  };
};

export default useEtapaManager;

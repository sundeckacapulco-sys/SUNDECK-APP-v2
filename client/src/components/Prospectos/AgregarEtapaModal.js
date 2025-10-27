import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Chip
} from '@mui/material';
import {
  Add,
  CloudUpload,
  Delete,
  Close,
  ContentCopy,
  CheckCircle,
  Warning,
  Info,
  Error,
  BugReport,
  Search
} from '@mui/icons-material';
import TextFieldConDictado from '../Common/TextFieldConDictado';
import CapturaModal from '../Common/CapturaModal';
import InspectorElementos from '../Common/InspectorElementos';
import axiosConfig from '../../config/axios';
import {
  mapearPiezaParaDocumento,
  crearResumenEconomico,
  crearInfoFacturacion,
  crearMetodoPago
} from '../../utils/cotizacionEnVivo';
import { useCotizacionStore } from '../../stores/cotizacionStore';
import { calcularTotales as calcularTotalesUnificado } from '../../services/calculosService';
import { normalizarParaBackend } from '../../services/normalizacionService';
import { validarCompletitud } from '../../services/validacionService';
// import { useEtapaManager } from '../../hooks/useEtapaManager'; // TEMPORALMENTE DESACTIVADO
import {
  etapaOptions,
  productosOptions,
  modelosToldos,
  modelosMotores,
  modelosControles
} from './AgregarEtapaModal.constants';
import usePiezasManager from './hooks/usePiezasManager';
import { esProductoMotorizable, esProductoToldo } from './utils/piezaUtils';

const AgregarEtapaModal = ({ 
  open, 
  onClose, 
  prospectoId, 
  prospecto, 
  onSaved, 
  onError, 
  modoProyecto = false, 
  datosProyecto = null 
}) => {
  const [nombreEtapa, setNombreEtapa] = useState(etapaOptions[0]);
  const [unidad, setUnidad] = useState('m');
  const [comentarios, setComentarios] = useState('');
  const [precioGeneral, setPrecioGeneral] = useState(750);
  const [guardando, setGuardando] = useState(false);
  const [generandoCotizacion, setGenerandoCotizacion] = useState(false);
  const [descargandoLevantamiento, setDescargandoLevantamiento] = useState(false);
  const [descargandoExcel, setDescargandoExcel] = useState(false);
  const [mostrarAdvertenciaExcel, setMostrarAdvertenciaExcel] = useState(false);
  const [validacionExcel, setValidacionExcel] = useState({});
  const [errorLocal, setErrorLocal] = useState('');
  
  // Estados para productos
  const [mostrarNuevoProducto, setMostrarNuevoProducto] = useState(false);
  const [nuevoProductoNombre, setNuevoProductoNombre] = useState('');
  const [productosFromAPI, setProductosFromAPI] = useState([]);
  const [cargandoProductos, setCargandoProductos] = useState(false);
  const [productosPersonalizados, setProductosPersonalizados] = useState([]);
  
  // Estado para prevenir doble clic en PDF
  const [ultimoClickPDF, setUltimoClickPDF] = useState(0);
  
  // Estados para subida de archivos
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  
  // Estados para instalación manual
  const [cobraInstalacion, setCobraInstalacion] = useState(false);
  const [precioInstalacion, setPrecioInstalacion] = useState('');
  const [precioInstalacionPorPieza, setPrecioInstalacionPorPieza] = useState('');
  const [tipoInstalacion, setTipoInstalacion] = useState('fijo');
  
  // Estados para copiar medidas
  const [copiandoMedidas, setCopiandoMedidas] = useState({});
  const [medidaCopiada, setMedidaCopiada] = useState({});
  
  // Estados para sugerencias automáticas
  const [sugerenciasPorPieza, setSugerenciasPorPieza] = useState({});
  const [sugerenciasEtapa, setSugerenciasEtapa] = useState([]);
  
  // Estados para descuentos
  const [aplicaDescuento, setAplicaDescuento] = useState(false);
  const [tipoDescuento, setTipoDescuento] = useState('porcentaje'); // 'porcentaje' o 'monto'
  const [valorDescuento, setValorDescuento] = useState('');
  
  // Nuevos estados para pedidos y facturación
  const [requiereFactura, setRequiereFactura] = useState(false);
  const [incluirTerminos, setIncluirTerminos] = useState(true);
  const [tiempoEntrega, setTiempoEntrega] = useState('normal'); // 'normal' o 'expres'
  const [diasExpres, setDiasExpres] = useState('');
  const [guardandoPedido, setGuardandoPedido] = useState(false);
  const [metodoPagoAnticipo, setMetodoPagoAnticipo] = useState(''); // efectivo, transferencia, etc.
  const [guardandoPDF, setGuardandoPDF] = useState(false);
  
  // Estado para tipo de visita inicial
  const [tipoVisitaInicial, setTipoVisitaInicial] = useState('levantamiento'); // 'levantamiento' o 'cotizacion'
  
  // Estado para persona que realizó visita (global para levantamiento)
  const [personaVisita, setPersonaVisita] = useState('');
  
  // Estados para fecha y hora
  const [fechaEtapa, setFechaEtapa] = useState('');
  const [horaEtapa, setHoraEtapa] = useState('');
  
  // Estado para captura de pantalla e inspector
  const [capturaModalOpen, setCapturaModalOpen] = useState(false);
  const [inspectorModalOpen, setInspectorModalOpen] = useState(false);

  // Obtener el ID del prospecto (de la nueva prop prospecto o la antigua prospectoId)
  const getProspectoId = () => {
    return prospecto?._id || prospectoId;
  };

  // Store central de cotización (legacy - se eliminará)
  const comercialStore = useCotizacionStore((state) => state.comercial);
  const setProductosStore = useCotizacionStore((state) => state.setProductos);
  const updateComercialSection = useCotizacionStore((state) => state.updateComercialSection);
  const resetCotizacionStore = useCotizacionStore((state) => state.reset);
  const setFlujoStore = useCotizacionStore((state) => state.setFlujo);

  // Función para establecer fecha y hora actual
  const establecerFechaHoraActual = () => {
    const ahora = new Date();
    const fecha = ahora.toISOString().split('T')[0]; // YYYY-MM-DD
    const hora = ahora.toTimeString().slice(0, 5); // HH:MM
    setFechaEtapa(fecha);
    setHoraEtapa(hora);
  };

  // Función para manejar cambio de etapa
  const handleCambioEtapa = (nuevaEtapa) => {
    setNombreEtapa(nuevaEtapa);
    // Si es Seguimiento, establecer fecha y hora automáticamente
    if (nuevaEtapa === 'Seguimiento') {
      establecerFechaHoraActual();
    }
  };

  const resetFormulario = () => {
    setNombreEtapa(etapaOptions[0]);
    setUnidad('m');
    resetPiezas();
    setComentarios('');
    setPrecioGeneral(750);
    setErrorLocal('');
    setCobraInstalacion(false);
    setPrecioInstalacion('');
    setTipoInstalacion('estandar');
    setAplicaDescuento(false);
    setTipoDescuento('porcentaje');
    setValorDescuento('');
    // Reset nuevos campos
    setRequiereFactura(false);
    setIncluirTerminos(true);
    setTiempoEntrega('normal');
    setDiasExpres('');
    setGuardandoPedido(false);
    setMetodoPagoAnticipo('');
    setGuardandoPDF(false);
    setTipoVisitaInicial('levantamiento');
    setPersonaVisita('');
    // Reset fecha y hora
    setFechaEtapa('');
    setHoraEtapa('');
    // Reset productos personalizados
    setProductosPersonalizados([]);
    resetCotizacionStore();
  };

  useEffect(() => {
    if (open) {
      establecerFechaHoraActual();
      // Cargar productos desde la API cuando se abre el modal
      cargarProductosDesdeAPI();
      
      // Si estamos en modo proyecto y hay datos, importar partidas
      if (modoProyecto && datosProyecto && datosProyecto.medidas && datosProyecto.medidas.length > 0) {
        console.log('🔄 Importando datos del proyecto:', datosProyecto);
        
        // Buscar el primer levantamiento con partidas
        const levantamientoConPartidas = datosProyecto.medidas.find(medida => 
          medida.piezas && medida.piezas.length > 0
        );
        
        if (levantamientoConPartidas) {
          console.log('📦 Importando partidas del levantamiento:', levantamientoConPartidas.piezas);
          
          // Importar las partidas al piezasManager
          piezasManager.setPiezas(levantamientoConPartidas.piezas);
          
          // Establecer tipo de visita como cotización
          setTipoVisitaInicial('cotizacion');
          
          // Importar información técnica si existe
          if (levantamientoConPartidas.personaVisita) {
            setPersonaVisita(levantamientoConPartidas.personaVisita);
          }
          if (levantamientoConPartidas.fechaCompromiso) {
            setFechaEtapa(levantamientoConPartidas.fechaCompromiso);
          }
          if (levantamientoConPartidas.codigoReferencia) {
            // Podríamos agregar un campo para esto si es necesario
          }
          if (levantamientoConPartidas.quienRecibe) {
            // Podríamos agregar un campo para esto si es necesario
          }
          if (levantamientoConPartidas.observacionesGenerales) {
            setComentarios(levantamientoConPartidas.observacionesGenerales);
          }
        }
      }
    }
  }, [open, modoProyecto, datosProyecto]);

  // Función para cargar productos desde la API
  const cargarProductosDesdeAPI = async () => {
    try {
      setCargandoProductos(true);
      const response = await axiosConfig.get('/productos');
      
      if (response.data && Array.isArray(response.data)) {
        // Convertir productos de la API al formato esperado
        const productosAPI = response.data.map(producto => ({
          label: producto.nombre,
          value: producto._id,
          precio: producto.precio,
          categoria: producto.categoria
        }));
        
        setProductosFromAPI(productosAPI);
        console.log('✅ Productos cargados desde API:', productosAPI.length);
      }
    } catch (error) {
      console.warn('⚠️ No se pudieron cargar productos desde API, usando productos estáticos:', error.message);
      setProductosFromAPI([]);
    } finally {
      setCargandoProductos(false);
    }
  };

  // Combinar productos estáticos con productos de la API y personalizados
  const todosLosProductos = useMemo(() => {
    const productosEstaticos = [...productosOptions];

    // Remover la opción de producto personalizado temporalmente
    const sinPersonalizado = productosEstaticos.filter(p => p.value !== 'nuevo');

    // Combinar todos los tipos de productos
    return [
      ...sinPersonalizado,
      ...productosFromAPI,
      ...productosPersonalizados,
      { label: "🆕 PRODUCTO PERSONALIZADO", value: "nuevo" }
    ];
  }, [productosFromAPI, productosPersonalizados]);

  // TEMPORALMENTE DESACTIVADO: Hook unificado para debug
  // const etapaManager = useEtapaManager();
  
  // VOLVER AL SISTEMA ANTIGUO TEMPORALMENTE PARA IDENTIFICAR EL PROBLEMA
  const {
    piezas,
    piezaForm,
    agregandoPieza,
    editandoPieza,
    indiceEditando,
    setAgregandoPieza,
    setPiezaForm,
    resetPiezas,
    sincronizarColores,
    actualizarMedidas,
    handleAgregarPieza,
    handleEliminarPieza,
    handleEditarPieza,
    handleCancelarEdicion
  } = usePiezasManager({
    unidad,
    todosLosProductos,
    precioGeneral,
    setErrorLocal
  });
  
  // Funciones placeholder para compatibilidad
  const configurarFlujo = () => {};
  const configurarInstalacion = () => {};
  const configurarDescuentos = () => {};
  const configurarFacturacion = () => {};
  const updateConfiguracion = () => {};

  // Inicializar store cuando se abre el modal (UNA SOLA VEZ)
  useEffect(() => {
    if (open) {
      console.log('🚀 Modal abierto - Inicializando store...');
      
      // Configurar flujo inicial
      if (configurarFlujo) {
        configurarFlujo(tipoVisitaInicial);
      }
      
      // Inicializar configuración
      if (updateConfiguracion) {
        updateConfiguracion({
          prospectoId: getProspectoId(),
          nombreEtapa: etapaOptions[0],
          unidadMedida: unidad,
          precioGeneral,
          comentarios,
        });
      }
      
      console.log('✅ Store inicializado');
    }
  }, [open]); // SOLO depende de 'open' para evitar loops

  const productosCotizacion = useMemo(() => {
    if (tipoVisitaInicial !== 'cotizacion') {
      return [];
    }

    console.log('🔄 DEBUG PRODUCTOS - Mapeando piezas a productos:', piezas);
    console.log('🔄 DEBUG PRODUCTOS - Cantidad de piezas:', Array.isArray(piezas) ? piezas.length : 0);
    console.log('🔍 DEBUG PRODUCTOS - Tipo de piezas:', typeof piezas, Array.isArray(piezas));

    if (!Array.isArray(piezas)) {
      console.error('❌ piezas no es un array:', piezas);
      return [];
    }

    return piezas.map((pieza, index) => {
      const medidas = Array.isArray(pieza.medidas) ? pieza.medidas : [];
      const detalles = medidas.map((medida) => {
        const ancho = Number(medida?.ancho) || 0;
        const alto = Number(medida?.alto) || 0;
        const area =
          Number(medida?.area) ||
          (unidad === 'cm' ? (ancho * alto) / 10000 : ancho * alto);

        return {
          ...medida,
          ancho,
          alto,
          area: Number.isFinite(area) ? area : 0,
        };
      });

      const cantidad = detalles.length > 0 ? detalles.length : parseInt(pieza.cantidad, 10) || 1;
      let areaTotal = detalles.reduce((total, detalle) => total + (detalle.area || 0), 0);

      if (areaTotal <= 0) {
        const ancho = Number(pieza.ancho) || 0;
        const alto = Number(pieza.alto) || 0;
        const areaBase = unidad === 'cm' ? (ancho * alto) / 10000 : ancho * alto;
        areaTotal = areaBase * Math.max(cantidad, 1);
      }

      const precioUnitario = parseFloat(pieza.precioM2) || precioGeneral || 0;
      const subtotalM2 = areaTotal * precioUnitario;

      const esToldoProducto = esProductoToldo(pieza.producto) || Boolean(pieza.esToldo);
      const kitPrecioUnitario = esToldoProducto ? parseFloat(pieza.kitPrecio) || 0 : 0;
      const subtotalKit = kitPrecioUnitario * Math.max(cantidad, 1);

      const motorizado = Boolean(pieza.motorizado);
      const numMotores = motorizado ? parseInt(pieza.numMotores, 10) || 1 : 0;
      const motorPrecioUnitario = motorizado ? parseFloat(pieza.motorPrecio) || 0 : 0;
      const subtotalMotores = motorizado ? motorPrecioUnitario * Math.max(numMotores, 1) : 0;

      const controlPrecioUnitario = motorizado ? parseFloat(pieza.controlPrecio) || 0 : 0;
      const subtotalControles = motorizado
        ? pieza.esControlMulticanal
          ? controlPrecioUnitario
          : controlPrecioUnitario * Math.max(numMotores, 1)
        : 0;

      const subtotal = Number(
        (subtotalM2 + subtotalKit + subtotalMotores + subtotalControles).toFixed(2)
      );

      return {
        id: pieza._id || index,
        nombre: pieza.productoLabel || pieza.producto || `Partida ${index + 1}`,
        ubicacion: pieza.ubicacion || '',
        medidas: {
          ancho: detalles[0]?.ancho ?? (Number(pieza.ancho) || 0),
          alto: detalles[0]?.alto ?? (Number(pieza.alto) || 0),
          area: Number(areaTotal.toFixed(4)),
          cantidad: Math.max(cantidad, 1),
          detalles,
        },
        precios: {
          unitario: precioUnitario,
          subtotal,
        },
        tecnico: {
          tipoControl: pieza.controlModelo || '',
          orientacion: pieza.orientacion || pieza.orientacionLamellas || '',
          instalacion: pieza.tipoInstalacion || '',
          eliminacion: pieza.eliminacion || '',
          risoAlto: pieza.risoAlto || '',
          risoBajo: pieza.risoBajo || '',
          sistema: pieza.sistema || '',
          telaMarca: pieza.telaMarca || '',
          baseTabla: pieza.baseTabla || '',
          observaciones: pieza.observaciones || '',
        },
        extras: {
          motorizado,
          esToldo: esToldoProducto,
          kits:
            kitPrecioUnitario > 0
              ? [
                  {
                    id: pieza.kitModelo || 'kit',
                    descripcion: pieza.kitModeloManual || '',
                    precio: kitPrecioUnitario,
                    cantidad: Math.max(cantidad, 1),
                  },
                ]
              : [],
          otros: {
            kit: subtotalKit,
            motor: subtotalMotores,
            control: subtotalControles,
          },
        },
        metadata: {
          piezaOriginal: pieza,
        },
      };
    });
  }, [tipoVisitaInicial, piezas, unidad, precioGeneral]);

  // ELIMINADOS: useEffect problemáticos que causaban loop infinito
  // La sincronización ahora se hace en el momento de guardar

  const totalPiezasCotizacion = useMemo(() => {
    if (tipoVisitaInicial !== 'cotizacion') {
      return 0;
    }

    return piezas.reduce((total, pieza) => {
      if (pieza.medidas && Array.isArray(pieza.medidas)) {
        return total + pieza.medidas.length;
      }
      return total + (parseInt(pieza.cantidad, 10) || 1);
    }, 0);
  }, [tipoVisitaInicial, piezas]);

  const precioInstalacionCalculado = useMemo(() => {
    if (tipoVisitaInicial !== 'cotizacion' || !cobraInstalacion) {
      return 0;
    }

    const base = parseFloat(precioInstalacion) || 0;

    if (tipoInstalacion === 'por_pieza') {
      return base * Math.max(totalPiezasCotizacion, 1);
    }

    if (tipoInstalacion === 'base_mas_pieza') {
      const adicional = parseFloat(precioInstalacionPorPieza) || 0;
      const piezasAdicionales = Math.max(0, Math.max(totalPiezasCotizacion, 1) - 1);
      return base + adicional * piezasAdicionales;
    }

    return base;
  }, [
    tipoVisitaInicial,
    cobraInstalacion,
    precioInstalacion,
    tipoInstalacion,
    precioInstalacionPorPieza,
    totalPiezasCotizacion,
  ]);

  // ELIMINADOS: Más useEffect que causaban loops infinitos
  // La sincronización se hará manualmente al guardar

  // FIX TEMPORAL: Desactivar totalesCotizacion para evitar dependencias circulares
  const totalesCotizacion = null;

  const calcularTotalM2 = useMemo(() => {
    if (tipoVisitaInicial === 'cotizacion' && totalesCotizacion) {
      return totalesCotizacion.totalArea || 0;
    }

    return piezas.reduce((total, pieza) => {
      // Si tiene medidas individuales, usar esas
      if (pieza.medidas && Array.isArray(pieza.medidas)) {
        const areaPieza = pieza.medidas.reduce((subtotal, medida) => {
          return subtotal + (medida.area || 0);
        }, 0);
        return total + areaPieza;
      } else {
        // Fallback para compatibilidad con formato anterior
        const ancho = parseFloat(pieza.ancho) || 0;
        const alto = parseFloat(pieza.alto) || 0;
        const cantidad = parseInt(pieza.cantidad) || 1;
        const area = unidad === 'cm' ? (ancho * alto) / 10000 : ancho * alto;
        return total + (area * cantidad);
      }
    }, 0);
  }, [tipoVisitaInicial, totalesCotizacion, piezas, unidad]);

  // Calcular subtotal de productos con precios específicos
  const calcularSubtotalProductos = useMemo(() => {
    if (tipoVisitaInicial === 'cotizacion' && totalesCotizacion) {
      return totalesCotizacion.subtotalProductos || 0;
    }

    return piezas.reduce((total, pieza) => {
      let areaPieza = 0;

      if (pieza.medidas && Array.isArray(pieza.medidas)) {
        areaPieza = pieza.medidas.reduce((subtotal, medida) => {
          return subtotal + (medida.area || 0);
        }, 0);
      } else {
        const ancho = parseFloat(pieza.ancho) || 0;
        const alto = parseFloat(pieza.alto) || 0;
        const cantidad = parseInt(pieza.cantidad) || 1;
        const area = unidad === 'cm' ? (ancho * alto) / 10000 : ancho * alto;
        areaPieza = area * cantidad;
      }
      
      const precio = parseFloat(pieza.precioM2) || precioGeneral;
      let subtotalPieza = areaPieza * precio;
      
      // Calcular cantidad de piezas para esta partida
      let cantidadPiezasPartida = 1;
      if (pieza.medidas && Array.isArray(pieza.medidas)) {
        cantidadPiezasPartida = pieza.medidas.length;
      } else {
        cantidadPiezasPartida = parseInt(pieza.cantidad) || 1;
      }
      
      // Agregar kit de toldo si aplica (multiplicado por cantidad de piezas)
      if (pieza.esToldo && pieza.kitPrecio) {
        subtotalPieza += (parseFloat(pieza.kitPrecio) || 0) * cantidadPiezasPartida;
      }
      
      // Agregar motorización si aplica
      if (pieza.motorizado) {
        // Motores: usar el número especificado, o por defecto 1 motor
        const numMotores = pieza.numMotores || 1;
        subtotalPieza += (parseFloat(pieza.motorPrecio) || 0) * numMotores;
        
        // Control: usar la lógica simplificada
        if (pieza.controlPrecio) {
          if (pieza.esControlMulticanal) {
            // Control multicanal: solo cobrar una vez
            subtotalPieza += parseFloat(pieza.controlPrecio) || 0;
          } else {
            // Control individual: cobrar por cada motor/pieza
            subtotalPieza += (parseFloat(pieza.controlPrecio) || 0) * numMotores;
          }
        }
      }

      return total + subtotalPieza;
    }, 0);
  }, [tipoVisitaInicial, totalesCotizacion, piezas, unidad, precioGeneral]);

  // Calcular descuento
  const calcularDescuento = useMemo(() => {
    if (tipoVisitaInicial === 'cotizacion' && totalesCotizacion) {
      return totalesCotizacion.descuento?.monto || 0;
    }

    if (!aplicaDescuento || !valorDescuento) return 0;

    const subtotalConInstalacion = calcularSubtotalProductos + (cobraInstalacion ? parseFloat(precioInstalacion) || 0 : 0);

    if (tipoDescuento === 'porcentaje') {
      const porcentaje = parseFloat(valorDescuento) || 0;
      return (subtotalConInstalacion * porcentaje) / 100;
    } else {
      return parseFloat(valorDescuento) || 0;
    }
  }, [
    tipoVisitaInicial,
    totalesCotizacion,
    aplicaDescuento,
    valorDescuento,
    tipoDescuento,
    calcularSubtotalProductos,
    cobraInstalacion,
    precioInstalacion,
  ]);

  // Calcular IVA y total con factura
  const calcularIVA = useMemo(() => {
    if (tipoVisitaInicial === 'cotizacion' && totalesCotizacion) {
      return Math.round((totalesCotizacion.iva?.monto || 0) * 100) / 100;
    }

    if (!requiereFactura) return 0;

    // Calcular instalación según el tipo
    let costoInstalacion = 0;
    if (cobraInstalacion && precioInstalacion) {
      if (tipoInstalacion === 'fijo' || tipoInstalacion === 'personalizada') {
        costoInstalacion = parseFloat(precioInstalacion) || 0;
      } else if (tipoInstalacion === 'por_pieza') {
        const totalPiezasCompleto = (() => {
          const piezasExistentes = piezas.reduce((total, pieza) => {
            if (pieza.medidas && Array.isArray(pieza.medidas)) {
              return total + pieza.medidas.length;
            } else {
              return total + (parseInt(pieza.cantidad) || 1);
            }
          }, 0);
          const piezasFormulario = (piezaForm.medidas && Array.isArray(piezaForm.medidas)) ? piezaForm.medidas.length : 0;
          return piezasExistentes + piezasFormulario;
        })();
        costoInstalacion = (parseFloat(precioInstalacion) || 0) * totalPiezasCompleto;
      } else if (tipoInstalacion === 'base_mas_pieza') {
        const totalPiezasCompleto = (() => {
          const piezasExistentes = piezas.reduce((total, pieza) => {
            if (pieza.medidas && Array.isArray(pieza.medidas)) {
              return total + pieza.medidas.length;
            } else {
              return total + (parseInt(pieza.cantidad) || 1);
            }
          }, 0);
          const piezasFormulario = (piezaForm.medidas && Array.isArray(piezaForm.medidas)) ? piezaForm.medidas.length : 0;
          return piezasExistentes + piezasFormulario;
        })();
        const precioBase = parseFloat(precioInstalacion) || 0;
        const precioPorPieza = parseFloat(precioInstalacionPorPieza) || 0;
        const piezasAdicionales = Math.max(0, totalPiezasCompleto - 1);
        costoInstalacion = precioBase + (precioPorPieza * piezasAdicionales);
      }
    }
    
    // IVA se calcula sobre el subtotal con instalación, DESPUÉS del descuento
    const subtotalConInstalacion = calcularSubtotalProductos + costoInstalacion;
    const subtotalConDescuento = subtotalConInstalacion - calcularDescuento;
    const iva = Math.round(subtotalConDescuento * 0.16 * 100) / 100; // Redondear a 2 decimales
    return iva;
  }, [
    tipoVisitaInicial,
    totalesCotizacion,
    requiereFactura,
    calcularSubtotalProductos,
    cobraInstalacion,
    precioInstalacion,
    tipoInstalacion,
    precioInstalacionPorPieza,
    piezas,
    piezaForm.medidas,
    calcularDescuento,
  ]);

  const totalConIVA = useMemo(() => {
    if (tipoVisitaInicial === 'cotizacion' && totalesCotizacion) {
      return Math.round((totalesCotizacion.iva?.totalConIVA || totalesCotizacion.total || 0) * 100) / 100;
    }

    // Calcular instalación según el tipo
    let costoInstalacion = 0;
    if (cobraInstalacion && precioInstalacion) {
      if (tipoInstalacion === 'fijo' || tipoInstalacion === 'personalizada') {
        costoInstalacion = parseFloat(precioInstalacion) || 0;
      } else if (tipoInstalacion === 'por_pieza') {
        const totalPiezasCompleto = (() => {
          const piezasExistentes = piezas.reduce((total, pieza) => {
            if (pieza.medidas && Array.isArray(pieza.medidas)) {
              return total + pieza.medidas.length;
            } else {
              return total + (parseInt(pieza.cantidad) || 1);
            }
          }, 0);
          const piezasFormulario = (piezaForm.medidas && Array.isArray(piezaForm.medidas)) ? piezaForm.medidas.length : 0;
          return piezasExistentes + piezasFormulario;
        })();
        costoInstalacion = (parseFloat(precioInstalacion) || 0) * totalPiezasCompleto;
      } else if (tipoInstalacion === 'base_mas_pieza') {
        const totalPiezasCompleto = (() => {
          const piezasExistentes = piezas.reduce((total, pieza) => {
            if (pieza.medidas && Array.isArray(pieza.medidas)) {
              return total + pieza.medidas.length;
            } else {
              return total + (parseInt(pieza.cantidad) || 1);
            }
          }, 0);
          const piezasFormulario = (piezaForm.medidas && Array.isArray(piezaForm.medidas)) ? piezaForm.medidas.length : 0;
          return piezasExistentes + piezasFormulario;
        })();
        const precioBase = parseFloat(precioInstalacion) || 0;
        const precioPorPieza = parseFloat(precioInstalacionPorPieza) || 0;
        const piezasAdicionales = Math.max(0, totalPiezasCompleto - 1);
        costoInstalacion = precioBase + (precioPorPieza * piezasAdicionales);
      }
    }
    
    const subtotalConInstalacion = calcularSubtotalProductos + costoInstalacion;
    const subtotalConDescuento = subtotalConInstalacion - calcularDescuento;
    const total = Math.round((subtotalConDescuento + calcularIVA) * 100) / 100; // Redondear a 2 decimales
    return total;
  }, [
    tipoVisitaInicial,
    totalesCotizacion,
    calcularSubtotalProductos,
    cobraInstalacion,
    precioInstalacion,
    tipoInstalacion,
    precioInstalacionPorPieza,
    piezas,
    piezaForm.medidas,
    calcularDescuento,
    calcularIVA,
  ]);

  // Calcular total final (con o sin IVA)
  const totalFinal = useMemo(() => {
    if (tipoVisitaInicial === 'cotizacion' && totalesCotizacion) {
      return Math.round((totalesCotizacion.total || 0) * 100) / 100;
    }

    if (requiereFactura) {
      return totalConIVA;
    } else {
      // Calcular instalación según el tipo
      let costoInstalacion = 0;
      if (cobraInstalacion && precioInstalacion) {
        if (tipoInstalacion === 'fijo' || tipoInstalacion === 'personalizada') {
          costoInstalacion = parseFloat(precioInstalacion) || 0;
        } else if (tipoInstalacion === 'por_pieza') {
          const totalPiezasCompleto = (() => {
            const piezasExistentes = piezas.reduce((total, pieza) => {
              if (pieza.medidas && Array.isArray(pieza.medidas)) {
                return total + pieza.medidas.length;
              } else {
                return total + (parseInt(pieza.cantidad) || 1);
              }
            }, 0);
            const piezasFormulario = (piezaForm.medidas && Array.isArray(piezaForm.medidas)) ? piezaForm.medidas.length : 0;
            return piezasExistentes + piezasFormulario;
          })();
          costoInstalacion = (parseFloat(precioInstalacion) || 0) * totalPiezasCompleto;
        } else if (tipoInstalacion === 'base_mas_pieza') {
          const totalPiezasCompleto = (() => {
            const piezasExistentes = piezas.reduce((total, pieza) => {
              if (pieza.medidas && Array.isArray(pieza.medidas)) {
                return total + pieza.medidas.length;
              } else {
                return total + (parseInt(pieza.cantidad) || 1);
              }
            }, 0);
            const piezasFormulario = (piezaForm.medidas && Array.isArray(piezaForm.medidas)) ? piezaForm.medidas.length : 0;
            return piezasExistentes + piezasFormulario;
          })();
          const precioBase = parseFloat(precioInstalacion) || 0;
          const precioPorPieza = parseFloat(precioInstalacionPorPieza) || 0;
          const piezasAdicionales = Math.max(0, totalPiezasCompleto - 1);
          costoInstalacion = precioBase + (precioPorPieza * piezasAdicionales);
        }
      }
      
      return calcularSubtotalProductos + costoInstalacion - calcularDescuento;
    }
  }, [
    tipoVisitaInicial,
    totalesCotizacion,
    requiereFactura,
    totalConIVA,
    calcularSubtotalProductos,
    cobraInstalacion,
    precioInstalacion,
    tipoInstalacion,
    precioInstalacionPorPieza,
    piezas,
    piezaForm.medidas,
    calcularDescuento,
  ]);

  // Calcular anticipo (60%) y saldo (40%)
  const anticipo = useMemo(() => {
    return Math.round(totalFinal * 0.6 * 100) / 100; // Redondear a 2 decimales
  }, [totalFinal]);

  const saldo = useMemo(() => {
    return Math.round(totalFinal * 0.4 * 100) / 100; // Redondear a 2 decimales
  }, [totalFinal]);

  const resumenEconomico = useMemo(() => {
    if (tipoVisitaInicial === 'cotizacion' && totalesCotizacion) {
      return {
        precioGeneral,
        totalM2: totalesCotizacion.totalArea,
        subtotalProductos: totalesCotizacion.subtotalProductos,
        unidadMedida: unidad,
        instalacion: {
          cobra: totalesCotizacion.instalacionEspecial?.activa || false,
          tipo: totalesCotizacion.instalacionEspecial?.tipo || '',
          precio: totalesCotizacion.instalacionEspecial?.precio || 0,
        },
        descuento: {
          aplica: totalesCotizacion.descuento?.activo || false,
          tipo: totalesCotizacion.descuento?.tipo || 'porcentaje',
          valor: totalesCotizacion.descuento?.valor || 0,
          monto: totalesCotizacion.descuento?.monto || 0,
        },
      };
    }

    return crearResumenEconomico({
      precioGeneral,
      totalM2: calcularTotalM2,
      subtotalProductos: calcularSubtotalProductos,
      unidadMedida: unidad,
      cobraInstalacion,
      tipoInstalacion,
      precioInstalacion,
      precioInstalacionPorPieza,
      totalPiezas: (() => {
        const piezasExistentes = piezas.reduce((total, pieza) => {
          if (pieza.medidas && Array.isArray(pieza.medidas)) {
            return total + pieza.medidas.length;
          } else {
            return total + (parseInt(pieza.cantidad) || 1);
          }
        }, 0);
        const piezasFormulario = (piezaForm.medidas && Array.isArray(piezaForm.medidas)) 
          ? piezaForm.medidas.length 
          : 0;
        return piezasExistentes + piezasFormulario;
      })(),
      aplicaDescuento,
      tipoDescuento,
      valorDescuento,
      montoDescuento: calcularDescuento
    });
  }, [
    tipoVisitaInicial,
    totalesCotizacion,
    precioGeneral,
    calcularTotalM2,
    calcularSubtotalProductos,
    unidad,
    cobraInstalacion,
    tipoInstalacion,
    precioInstalacion,
    precioInstalacionPorPieza,
    piezas,
    piezaForm.medidas,
    aplicaDescuento,
    tipoDescuento,
    valorDescuento,
    calcularDescuento
  ]);

  const infoFacturacion = useMemo(() => {
    if (tipoVisitaInicial === 'cotizacion' && totalesCotizacion) {
      const ivaMonto = Math.round((totalesCotizacion.iva?.monto || 0) * 100) / 100;
      const totalIvaIncluido = Math.round(
        (totalesCotizacion.iva?.totalConIVA || totalesCotizacion.total || 0) * 100
      ) / 100;
      const totalSinIVA = Math.round((totalesCotizacion.subtotalConDescuento || 0) * 100) / 100;

      return crearInfoFacturacion({
        requiereFactura,
        iva: ivaMonto,
        totalConIVA: totalIvaIncluido,
        totalSinIVA,
      });
    }

    return crearInfoFacturacion({
      requiereFactura,
      iva: calcularIVA,
      totalConIVA,
      totalSinIVA: totalFinal
    });
  }, [
    tipoVisitaInicial,
    totalesCotizacion,
    requiereFactura,
    calcularIVA,
    totalConIVA,
    totalFinal,
  ]);

  const metodoPagoInfo = useMemo(() => {
    return crearMetodoPago({
      anticipo,
      saldo,
      metodoPagoAnticipo
    });
  }, [anticipo, saldo, metodoPagoAnticipo]);

  // Calcular fecha de entrega
  const calcularFechaEntrega = useMemo(() => {
    const hoy = new Date();
    let diasHabiles = 15; // Default para toldos/persianas
    
    if (tiempoEntrega === 'expres' && diasExpres) {
      diasHabiles = parseInt(diasExpres);
    } else if (tiempoEntrega === 'normal') {
      // Determinar días según productos
      const tieneCortinasTrad = piezas.some(p => p.producto === 'cortina_tradicional');
      const tieneSistemasProteccion = piezas.some(p => p.producto === 'antihuracan');
      
      if (tieneSistemasProteccion) {
        diasHabiles = 42; // 6 semanas = 42 días hábiles
      } else if (tieneCortinasTrad) {
        diasHabiles = 28; // 4 semanas = 28 días hábiles
      }
    }
    
    // Calcular fecha agregando días hábiles (excluyendo fines de semana)
    let fechaEntrega = new Date(hoy);
    let diasAgregados = 0;
    
    while (diasAgregados < diasHabiles) {
      fechaEntrega.setDate(fechaEntrega.getDate() + 1);
      // Si no es sábado (6) ni domingo (0)
      if (fechaEntrega.getDay() !== 0 && fechaEntrega.getDay() !== 6) {
        diasAgregados++;
      }
    }
    
    return fechaEntrega;
  }, [tiempoEntrega, diasExpres, piezas]);

  const cerrarModal = () => {
    resetFormulario();
    onClose();
  };

  const handleCrearNuevoProducto = () => {
    const nombreLimpio = nuevoProductoNombre.trim();
    
    if (!nombreLimpio) {
      setErrorLocal('El nombre del producto es requerido');
      return;
    }

    if (nombreLimpio.length < 3) {
      setErrorLocal('El nombre debe tener al menos 3 caracteres');
      return;
    }

    // Crear un value único para el producto personalizado
    const customValue = `custom_${Date.now()}`;
    
    // Crear objeto del producto personalizado
    const nuevoProductoPersonalizado = {
      label: nombreLimpio,
      value: customValue,
      esPersonalizado: true
    };
    
    // Agregar a la lista de productos personalizados
    setProductosPersonalizados(prev => [...prev, nuevoProductoPersonalizado]);
    
    // Seleccionar el nuevo producto en el formulario
    setPiezaForm(prev => ({ 
      ...prev, 
      producto: customValue,
      productoLabel: nombreLimpio
    }));
    
    // Cerrar el formulario de nuevo producto y limpiar
    setMostrarNuevoProducto(false);
    setNuevoProductoNombre('');
    
    // Mostrar mensaje de éxito
    setErrorLocal(`✅ Producto personalizado "${nombreLimpio}" creado exitosamente`);
    setTimeout(() => setErrorLocal(''), 3000);
    
    console.log('✅ Producto personalizado creado:', nuevoProductoPersonalizado);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setErrorLocal('Por favor selecciona solo archivos de imagen');
      return;
    }

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorLocal('La imagen no debe superar 5MB');
      return;
    }

    try {
      setSubiendoFoto(true);
      setErrorLocal('');

      const formData = new FormData();
      formData.append('foto', file);
      formData.append('tipo', 'pieza');
      formData.append('prospectoId', getProspectoId());

      const { data } = await axiosConfig.post('/storage/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Agregar la URL de la foto al array de fotos
      setPiezaForm(prev => ({ 
        ...prev, 
        fotoUrls: [...prev.fotoUrls, data.url] 
      }));
      
    } catch (error) {
      console.error('Error subiendo foto:', error);
      setErrorLocal(error.response?.data?.message || 'Error subiendo la foto');
    } finally {
      setSubiendoFoto(false);
      // Limpiar el input file
      event.target.value = '';
    }
  };

  const handleDescargarLevantamiento = async () => {
    if (!getProspectoId()) {
      setErrorLocal('No se encontró el identificador del prospecto.');
      return;
    }

    if (piezas.length === 0) {
      setErrorLocal('Debes agregar al menos una partida para descargar el levantamiento.');
      return;
    }

    setDescargandoLevantamiento(true);
    setErrorLocal('');

    try {
      const piezasNormalizadas = piezas.map((pieza) =>
        mapearPiezaParaDocumento(pieza, { incluirExtras: true })
      );

      const payload = {
        prospectoId: getProspectoId(),
        piezas: piezasNormalizadas,
        ...resumenEconomico,
        facturacion: infoFacturacion,
        metodoPago: metodoPagoInfo,
        totalFinal
      };

      const response = await axiosConfig.post('/etapas/levantamiento-pdf', payload, {
        responseType: 'blob'
      });

      // Crear enlace de descarga
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Levantamiento-Medidas-${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      console.log('✅ Levantamiento descargado exitosamente');
    } catch (error) {
      console.error('Error descargando levantamiento:', error);
      const mensaje = error.response?.data?.message || 'No se pudo descargar el levantamiento.';
      setErrorLocal(mensaje);
    } finally {
      setDescargandoLevantamiento(false);
    }
  };

  // Función para validar completitud de datos antes de Excel
  const validarCompletitudDatos = () => {
    const errores = [];
    const advertencias = [];
    const datosCompletos = [];
    
    // Validar piezas básicas
    if (piezas.length === 0) {
      errores.push('❌ No hay partidas agregadas');
    } else {
      datosCompletos.push(`✅ ${piezas.length} partida(s) agregada(s)`);
    }
    
    // Validar medidas de cada pieza
    piezas.forEach((pieza, index) => {
      if (!pieza.medidas || pieza.medidas.length === 0) {
        errores.push(`❌ Partida ${index + 1}: Sin medidas`);
      } else {
        const medidasIncompletas = pieza.medidas.filter(m => !m.ancho || !m.alto);
        if (medidasIncompletas.length > 0) {
          errores.push(`❌ Partida ${index + 1}: ${medidasIncompletas.length} medida(s) incompleta(s)`);
        } else {
          datosCompletos.push(`✅ Partida ${index + 1}: ${pieza.medidas.length} medida(s) completa(s)`);
        }
      }
      
      // Validar información técnica para levantamientos
      if (tipoVisitaInicial === 'levantamiento') {
        const camposTecnicos = ['tipoControl', 'orientacion', 'tipoInstalacion', 'eliminacion', 'risoAlto', 'risoBajo', 'sistema'];
        const camposFaltantes = [];
        
        pieza.medidas?.forEach((medida, mIndex) => {
          camposTecnicos.forEach(campo => {
            if (!medida[campo]) {
              camposFaltantes.push(`${campo}`);
            }
          });
        });
        
        if (camposFaltantes.length > 0) {
          advertencias.push(`⚠️ Partida ${index + 1}: Campos técnicos opcionales sin llenar`);
        } else {
          datosCompletos.push(`✅ Partida ${index + 1}: Información técnica completa`);
        }
      }
    });
    
    // Validar instalación especial
    if (cobraInstalacion) {
      if (!precioInstalacion || precioInstalacion === '0') {
        advertencias.push('⚠️ Instalación especial activada pero sin precio');
      } else {
        datosCompletos.push(`✅ Instalación especial: $${precioInstalacion}`);
      }
    }
    
    // Validar descuentos
    if (aplicaDescuento) {
      if (!valorDescuento) {
        advertencias.push('⚠️ Descuento activado pero sin valor');
      } else {
        datosCompletos.push(`✅ Descuento: ${tipoDescuento === 'porcentaje' ? valorDescuento + '%' : '$' + valorDescuento}`);
      }
    }
    
    // Validar comentarios
    if (!comentarios || comentarios.trim() === '') {
      advertencias.push('⚠️ Sin observaciones generales');
    } else {
      datosCompletos.push('✅ Observaciones generales incluidas');
    }
    
    return { errores, advertencias, datosCompletos };
  };
  
  // Función para mostrar modal de advertencia antes de Excel
  const handleSolicitarExcel = () => {
    console.log('🔍 handleSolicitarExcel ejecutado');
    console.log('📊 Piezas actuales:', piezas);
    console.log('🔧 Estados actuales:', { cobraInstalacion, precioInstalacion, aplicaDescuento, valorDescuento });
    
    try {
      const validacion = validarCompletitudDatos();
      console.log('✅ Validación completada:', validacion);
      setValidacionExcel(validacion);
      setMostrarAdvertenciaExcel(true);
      console.log('🚀 Modal de advertencia debería abrirse');
    } catch (error) {
      console.error('❌ Error en handleSolicitarExcel:', error);
      setErrorLocal('Error al validar datos: ' + error.message);
    }
  };
  
  // Función para proceder con descarga de Excel después de confirmación
  const handleDescargarExcel = async () => {
    if (!getProspectoId()) {
      setErrorLocal('No se encontró el identificador del prospecto.');
      return;
    }

    if (piezas.length === 0) {
      setErrorLocal('Debes agregar al menos una partida para descargar el Excel.');
      return;
    }

    setDescargandoExcel(true);
    setErrorLocal('');
    setMostrarAdvertenciaExcel(false);

    try {
      const piezasNormalizadas = piezas.map((pieza) =>
        mapearPiezaParaDocumento(pieza, { incluirExtras: true, precioComoNumero: true })
      );

      // Incluir TODA la información del modal
      const payload = {
        prospectoId: getProspectoId(),
        piezas: piezasNormalizadas,
        ...resumenEconomico,
        facturacion: infoFacturacion,
        metodoPago: metodoPagoInfo,
        totalFinal,
        // Información adicional que se estaba perdiendo
        instalacionEspecial: cobraInstalacion ? {
          activa: true,
          tipo: tipoInstalacion,
          precio: Number(precioInstalacion) || 0,
          precioPorPieza: Number(precioInstalacionPorPieza) || 0
        } : { activa: false },
        descuentos: aplicaDescuento ? {
          activo: true,
          tipo: tipoDescuento,
          valor: Number(valorDescuento) || 0
        } : { activo: false },
        sugerenciasInteligentes: {
          porPieza: sugerenciasPorPieza,
          etapa: sugerenciasEtapa
        },
        tipoVisita: tipoVisitaInicial,
        observacionesGenerales: comentarios
      };

      console.log('📊 Payload completo para Excel:', payload);

      const response = await axiosConfig.post('/etapas/levantamiento-excel', payload, {
        responseType: 'blob'
      });

      // Crear enlace de descarga
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Levantamiento-Completo-${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      console.log('✅ Excel completo descargado exitosamente');
    } catch (error) {
      console.error('Error descargando Excel:', error);
      const mensaje = error.response?.data?.message || 'No se pudo descargar el Excel.';
      setErrorLocal(mensaje);
    } finally {
      setDescargandoExcel(false);
    }
  };

  // Función para copiar medidas de la pieza anterior
  const copiarMedidasPiezaAnterior = (medidaIndex) => {
    if (medidaIndex === 0) return; // No hay pieza anterior
    
    const nuevasMedidas = [...(piezaForm.medidas || [])];
    const medidaAnterior = nuevasMedidas[medidaIndex - 1];
    
    if (medidaAnterior) {
      // Copiar los valores de la medida anterior
      nuevasMedidas[medidaIndex] = {
        ...nuevasMedidas[medidaIndex],
        ancho: medidaAnterior.ancho,
        alto: medidaAnterior.alto,
        producto: medidaAnterior.producto,
        productoLabel: medidaAnterior.productoLabel,
        color: medidaAnterior.color,
        precioM2: medidaAnterior.precioM2
      };
      
      setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
      
      // Mostrar confirmación visual
      setMedidaCopiada({ [`pieza-${medidaIndex}`]: true });
      setTimeout(() => {
        setMedidaCopiada(prev => ({ ...prev, [`pieza-${medidaIndex}`]: false }));
      }, 2000);
    }
  };

  // Función para copiar de pieza 1 a todas las demás
  const copiarDePieza1ATodas = () => {
    if (!piezaForm.medidas || piezaForm.medidas.length < 2) return;
    
    const nuevasMedidas = [...piezaForm.medidas];
    const primeraMedida = nuevasMedidas[0];
    
    // Copiar valores de la primera medida a todas las demás
    for (let i = 1; i < nuevasMedidas.length; i++) {
      nuevasMedidas[i] = {
        ...nuevasMedidas[i],
        ancho: primeraMedida.ancho,
        alto: primeraMedida.alto,
        producto: primeraMedida.producto,
        productoLabel: primeraMedida.productoLabel,
        color: primeraMedida.color,
        precioM2: primeraMedida.precioM2
      };
    }
    
    setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
    
    // Mostrar confirmación visual para todas
    const confirmaciones = {};
    for (let i = 1; i < nuevasMedidas.length; i++) {
      confirmaciones[`global-${i}`] = true;
    }
    setMedidaCopiada(confirmaciones);
    
    setTimeout(() => {
      setMedidaCopiada({});
    }, 2000);
  };

  // Sistema de Detección de Condiciones Especiales
  const reglasDeteccion = [
    {
      id: 'ancho_minimo',
      tipo: 'pieza',
      condicion: (medida, producto) => {
        const ancho = parseFloat(medida.ancho) || 0;
        return ancho > 0 && ancho < 0.5; // Menor a 50 cm
      },
      mensaje: '⚠️ Cortinas menores a 50 cm no suben bien. Coméntalo al cliente y considera posible ajuste o cargo adicional por adaptación.',
      severidad: 'warning'
    },
    {
      id: 'altura_maxima',
      tipo: 'pieza',
      condicion: (medida, producto) => {
        const alto = parseFloat(medida.alto) || 0;
        return alto > 3.0; // Mayor a 3 metros
      },
      mensaje: '⚠️ Altura mayor a 3 m. Revisar si se requiere instalación en doble altura o con andamios.',
      severidad: 'warning'
    },
    {
      id: 'toldo_detectado',
      tipo: 'pieza',
      condicion: (medida, producto) => {
        const productoLabel = producto?.productoLabel || producto?.label || '';
        return productoLabel.toLowerCase().includes('toldo');
      },
      mensaje: '⚠️ Toldo detectado. ¿Requiere volado estructural o soporte especial? Verifica detalles técnicos y cobros adicionales.',
      severidad: 'info'
    },
    {
      id: 'motorizado_detectado',
      tipo: 'pieza',
      condicion: (medida, producto, piezaCompleta) => {
        return piezaCompleta?.motorizado === true;
      },
      mensaje: '⚠️ Motorizado. Verifica si se requiere instalación eléctrica o canalización. Asegúrate de que esté contemplado en el costo.',
      severidad: 'info'
    },
    {
      id: 'muchas_piezas',
      tipo: 'etapa',
      condicion: (medidas) => {
        return medidas && medidas.length > 5;
      },
      mensaje: '⚠️ Múltiples piezas. Considera si esta instalación requiere tiempo extendido, más personal o un cobro adicional.',
      severidad: 'warning'
    },
    {
      id: 'productos_mixtos',
      tipo: 'etapa',
      condicion: (medidas) => {
        if (!medidas || medidas.length < 2) return false;
        const productos = medidas.map(m => m.producto).filter(Boolean);
        const productosUnicos = [...new Set(productos)];
        return productosUnicos.length > 1;
      },
      mensaje: '⚠️ Combinación de sistemas. ¿Se requiere instalación especial o alineación visual? Verifica detalles.',
      severidad: 'info'
    },
    {
      id: 'control_multicanal',
      tipo: 'etapa',
      condicion: (medidas, piezaForm) => {
        if (!piezaForm?.motorizado || !piezaForm?.esControlMulticanal) return false;
        
        // Si está marcado como control multicanal y hay múltiples piezas
        if (piezaForm.esControlMulticanal && medidas && medidas.length > 1) {
          const piezasControladas = piezaForm.piezasPorControl || medidas.length;
          return piezasControladas > 1;
        }
        
        return false;
      },
      mensaje: (medidas, piezaForm) => {
        const controlSeleccionado = modelosControles.find(c => c.value === piezaForm.controlModelo);
        const piezasControladas = piezaForm.piezasPorControl || (medidas ? medidas.length : 1);
        const canales = controlSeleccionado?.canales || 4;
        
        return `✅ Control multicanal configurado correctamente. Se cobrará 1 control ${controlSeleccionado?.label || 'multicanal'} para ${piezasControladas} piezas (capacidad: ${canales} canales).`;
      },
      severidad: 'success'
    }
  ];

  // Función para evaluar condiciones especiales
  const evaluarCondicionesEspeciales = (medidas, piezaForm) => {
    const sugerenciasPorPieza = {};
    const sugerenciasEtapa = [];

    // Evaluar reglas por pieza
    medidas?.forEach((medida, index) => {
      const sugerenciasPieza = [];
      
      reglasDeteccion.forEach(regla => {
        if (regla.tipo === 'pieza') {
          try {
            const producto = todosLosProductos.find(p => p.value === medida.producto);
            const cumpleCondicion = regla.condicion(medida, producto, piezaForm);
            
            if (cumpleCondicion) {
              sugerenciasPieza.push({
                id: regla.id,
                mensaje: regla.mensaje,
                severidad: regla.severidad
              });
            }
          } catch (error) {
            console.warn(`Error evaluando regla ${regla.id}:`, error);
          }
        }
      });
      
      if (sugerenciasPieza.length > 0) {
        sugerenciasPorPieza[index] = sugerenciasPieza;
      }
    });

    // Evaluar reglas por etapa
    reglasDeteccion.forEach(regla => {
      if (regla.tipo === 'etapa') {
        try {
          const cumpleCondicion = regla.condicion(medidas, piezaForm);
          
          if (cumpleCondicion) {
            sugerenciasEtapa.push({
              id: regla.id,
              mensaje: regla.mensaje,
              severidad: regla.severidad
            });
          }
        } catch (error) {
          console.warn(`Error evaluando regla de etapa ${regla.id}:`, error);
        }
      }
    });

    return { sugerenciasPorPieza, sugerenciasEtapa };
  };

  // Efecto para evaluar condiciones cuando cambian las medidas
  useEffect(() => {
    if (piezaForm.medidas && piezaForm.medidas.length > 0) {
      const { sugerenciasPorPieza, sugerenciasEtapa } = evaluarCondicionesEspeciales(piezaForm.medidas, piezaForm);
      setSugerenciasPorPieza(sugerenciasPorPieza);
      setSugerenciasEtapa(sugerenciasEtapa);
    } else {
      setSugerenciasPorPieza({});
      setSugerenciasEtapa([]);
    }
  }, [piezaForm.medidas, piezaForm.motorizado, piezaForm.controlModelo, piezaForm.esControlMulticanal, piezaForm.piezasPorControl, todosLosProductos]);

  const handleGenerarCotizacion = async () => {
    setErrorLocal('');
    setGenerandoCotizacion(true);
    try {
      if (!getProspectoId()) {
        throw new Error('No se ha proporcionado un ID de prospecto.');
      }

      // Determinar el origen según el tipo de visita inicial
      const origenCotizacion = tipoVisitaInicial === 'levantamiento' ? 'levantamiento' : 'cotizacion_vivo';
      
      console.log('🎯 Generando cotización desde visita inicial:');
      console.log('- Tipo de visita:', tipoVisitaInicial);
      console.log('- Origen asignado:', origenCotizacion);
      console.log('🔍 VERIFICACIÓN CRÍTICA - tipoVisitaInicial === "cotizacion"?', tipoVisitaInicial === 'cotizacion');
      console.log('🔍 VERIFICACIÓN CRÍTICA - Valor exacto:', JSON.stringify(tipoVisitaInicial));

      // TEMPORALMENTE DESACTIVADO: Flujo refactorizado
      // Usar solo el sistema antiguo por ahora

      const piezasNormalizadas = piezas.map((pieza) =>
        mapearPiezaParaDocumento(pieza, { incluirExtras: true })
      );

      const {
        precioGeneral: precioGeneralNormalizado,
        totalM2,
        unidadMedida,
        subtotalProductos,
        instalacion,
        descuento
      } = resumenEconomico;

      const instalacionEspecial = instalacion.cobra
        ? {
            activa: true,
            tipo: instalacion.tipo,
            precio: instalacion.precio
          }
        : { activa: false };

      const payload = {
        prospectoId: getProspectoId(),
        piezas: piezasNormalizadas,
        precioGeneral: precioGeneralNormalizado,
        totalM2,
        unidadMedida,
        subtotalProductos,
        comentarios,
        instalacionEspecial,
        descuento,
        origen: origenCotizacion,
        tipoVisitaInicial,
        requiereFactura,
        facturacion: infoFacturacion,
        metodoPago: metodoPagoInfo,
        totalFinal
      };

      console.log('📋 Payload para desde-visita:', payload);

      // Usar el endpoint específico para cotizaciones desde visita inicial
      const response = await axiosConfig.post('/cotizaciones/desde-visita', payload);
      onSaved(`Cotización ${origenCotizacion === 'levantamiento' ? 'desde levantamiento técnico' : 'en vivo'} generada exitosamente: ${response.data.cotizacion.numero}`);
      onClose();
    } catch (error) {
      console.error('Error al generar cotización:', error);
      const mensajeError =
        error.response?.data?.message || error.message || 'Error al generar la cotización. Revise los datos.';
      setErrorLocal(mensajeError);
      onError(mensajeError);
    } finally {
      setGenerandoCotizacion(false);
    }
  };

  const handleGuardarEtapa = async () => {
    if (!getProspectoId()) {
      setErrorLocal('No se encontró el identificador del prospecto.');
      return;
    }

    if (!nombreEtapa) {
      setErrorLocal('Selecciona el nombre de la etapa.');
      return;
    }

    setGuardando(true);
    setErrorLocal('');

    try {
      console.log('🔍 DEBUG GUARDADO - Estado completo:');
      console.log('❌ FLUJO ANTIGUO EJECUTÁNDOSE - tipoVisitaInicial:', tipoVisitaInicial);
      console.log('- Partidas array:', piezas);
      console.log('- Cantidad de partidas:', piezas.length);
      console.log('- Piezas totales:', piezas.reduce((total, partida) => total + (partida.cantidad || 1), 0));
      console.log('- Tipo de visita:', tipoVisitaInicial);
      console.log('- Nombre etapa:', nombreEtapa);
      
      // Debug detallado de cada partida
      piezas.forEach((partida, index) => {
        console.log(`📦 Partida ${index + 1}: ${partida.ubicacion} - ${partida.cantidad || 1} piezas`);
      });
      const piezasNormalizadas = piezas.map((pieza) => {
        console.log(`🔍 Procesando pieza: ${pieza.ubicacion}, cantidad original: ${pieza.cantidad}`);
        console.log(`🔧 CAMPOS TÉCNICOS DE LA PIEZA:`, {
          sistema: pieza.sistema,
          sistemaEspecial: pieza.sistemaEspecial,
          tipoControl: pieza.tipoControl,
          galeria: pieza.galeria,
          baseTabla: pieza.baseTabla
        });
        if (pieza.medidas && Array.isArray(pieza.medidas)) {
          pieza.medidas.forEach((medida, index) => {
            console.log(`🔧 MEDIDA ${index + 1} - CAMPOS TÉCNICOS:`, {
              sistema: medida.sistema,
              sistemaEspecial: medida.sistemaEspecial,
              tipoControl: medida.tipoControl,
              galeria: medida.galeria,
              baseTabla: medida.baseTabla
            });
          });
        }
        const piezaNormalizada = mapearPiezaParaDocumento(pieza, { precioComoNumero: true });
        console.log(`🔍 PIEZA NORMALIZADA:`, piezaNormalizada);
        return piezaNormalizada;
      });

      const instalacionEspecial = resumenEconomico.instalacion.cobra
        ? {
            activa: true,
            tipo: resumenEconomico.instalacion.tipo,
            precio: resumenEconomico.instalacion.precio
          }
        : { activa: false };

      let payload = {
        prospectoId: getProspectoId(),
        nombreEtapa,
        comentarios,
        unidadMedida: resumenEconomico.unidadMedida,
        precioGeneral: resumenEconomico.precioGeneral,
        totalM2: resumenEconomico.totalM2,
        // Incluir fecha y hora si están definidas
        fechaEtapa: fechaEtapa || undefined,
        horaEtapa: horaEtapa || undefined,
        piezas: piezasNormalizadas,
        // Información de instalación especial
        instalacionEspecial
      };

      // Si es levantamiento técnico, agregar información específica
      if (tipoVisitaInicial === 'levantamiento') {
        payload = {
          ...payload,
          tipoVisita: 'levantamiento',
          datosLevantamiento: {
            personaVisita: personaVisita || '',
            piezas: piezasNormalizadas
          }
        };
      }

      const { data } = await axiosConfig.post('/etapas', payload);
      onSaved?.(data.message || 'Etapa agregada exitosamente', data.etapa);
      cerrarModal();
    } catch (error) {
      console.error('Error guardando etapa:', error);
      const mensaje = error.response?.data?.message || 'No se pudo guardar la etapa.';
      setErrorLocal(mensaje);
      onError?.(mensaje);
    } finally {
      setGuardando(false);
    }
  };

const handleAgregarPedido = async () => {
  if (piezas.length === 0) {
    setErrorLocal('Debes agregar al menos una partida para crear un pedido');
    return;
  }

  setGuardandoPedido(true);
  setErrorLocal('');

  try {
    // 1. Primero crear una cotización temporal si no existe
    const piezasNormalizadas = piezas.map((pieza) =>
      mapearPiezaParaDocumento(pieza, { incluirExtras: true })
    );

    const cotizacionPayload = {
      prospectoId: getProspectoId(),
      piezas: piezasNormalizadas,
      ...resumenEconomico,
      comentarios,
      origen: 'etapa_directa'
    };

    console.log('📋 Creando cotización temporal para el pedido...');
    const cotizacionResponse = await axiosConfig.post('/cotizaciones/desde-visita', cotizacionPayload);
    
    if (!cotizacionResponse.data?.success) {
      throw new Error('Error creando cotización temporal');
    }

    const cotizacionId = cotizacionResponse.data.cotizacion._id;
    console.log('✅ Cotización temporal creada:', cotizacionId);

    // 2. Aprobar la cotización automáticamente
    await axiosConfig.patch(`/cotizaciones/${cotizacionId}`, {
      estado: 'aprobada'
    });

    // 3. Crear el proyecto-pedido unificado
    const proyectoPayload = {
      metodoPagoAnticipo: metodoPagoInfo.metodoPago || 'transferencia',
      referenciaAnticipo: metodoPagoInfo.referencia || '',
      comprobanteAnticipo: metodoPagoInfo.comprobante || '',
      fechaInstalacionDeseada: calcularFechaEntrega,
      instruccionesEspeciales: comentarios,
      contactoEntrega: {
        nombre: '', // Se llenará desde el prospecto en el backend
        telefono: '', // Se llenará desde el prospecto en el backend
        horarioPreferido: 'Mañana'
      }
    };

    console.log('🚀 Creando proyecto-pedido unificado...');
    const proyectoResponse = await axiosConfig.post(
      `/proyecto-pedido/desde-cotizacion/${cotizacionId}`, 
      proyectoPayload
    );
    
    if (proyectoResponse.data?.success) {
      const proyecto = proyectoResponse.data.data;
      console.log('✅ Proyecto-pedido creado:', proyecto.numero);
      
      onSaved?.(`Proyecto ${proyecto.numero} creado exitosamente`);
      cerrarModal();
    } else {
      throw new Error('Error creando proyecto-pedido');
    }

  } catch (error) {
    console.error('Error al crear pedido:', error);
    const mensaje = error.response?.data?.message || 'Error al crear el pedido';
    setErrorLocal(mensaje);
    onError?.(mensaje);
  } finally {
    setGuardandoPedido(false);
  }
};


  const handleVerPDF = async () => {
    console.log('🎯 Iniciando generación de PDF...');
    
    // Prevenir múltiples ejecuciones simultáneas
    if (guardandoPDF) {
      console.log('⚠️ PDF ya se está generando, ignorando...');
      return;
    }
    
    // Prevenir doble clic (debounce de 2 segundos)
    const ahora = Date.now();
    if (ahora - ultimoClickPDF < 2000) {
      console.log('⚠️ Clic muy rápido, ignorando...');
      return;
    }
    setUltimoClickPDF(ahora);
    
    if (piezas.length === 0) {
      setErrorLocal('Debes agregar al menos una partida para generar el PDF');
      return;
    }

    console.log('📋 Datos disponibles:', {
      prospectoId: getProspectoId(),
      piezasCount: piezas.length,
      precioGeneral,
      totalM2: calcularTotalM2
    });

    setGuardandoPDF(true);
    setErrorLocal('');

    try {
      console.log('📤 Usando formulario HTML para evitar interceptación IDM...');

      // Crear formulario HTML que se envíe en nueva pestaña (evita IDM completamente)
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = `${axiosConfig.defaults.baseURL}/etapas/levantamiento-pdf`;
      form.target = '_blank';
      form.style.display = 'none';

      // Agregar token de autorización
      const token = localStorage.getItem('token');
      if (token) {
        const tokenInput = document.createElement('input');
        tokenInput.type = 'hidden';
        tokenInput.name = 'authorization';
        tokenInput.value = `Bearer ${token}`;
        form.appendChild(tokenInput);
      }

      const piezasNormalizadas = piezas.map((pieza) =>
        mapearPiezaParaDocumento(pieza, { incluirExtras: true })
      );

      // Solo agregar los datos necesarios para el PDF (no guardar la etapa)
      const pdfData = {
        prospectoId: getProspectoId(),
        piezas: piezasNormalizadas,
        ...resumenEconomico,
        facturacion: infoFacturacion,
        metodoPago: metodoPagoInfo,
        totalFinal,
        // NO incluir guardarPDF: true para evitar que se guarde la etapa
        soloGenerarPDF: true // Flag para indicar que solo queremos el PDF
      };

      Object.keys(pdfData).forEach(key => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = typeof pdfData[key] === 'object' ? JSON.stringify(pdfData[key]) : pdfData[key];
        form.appendChild(input);
      });

      // Agregar al DOM, enviar y remover
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);

      console.log('✅ Formulario enviado en nueva pestaña');
      // NO llamar onSaved para PDF - solo es para mostrar el PDF, no para guardar datos
      // onSaved?.('PDF generado y abierto en nueva pestaña');
    } catch (error) {
      console.error('❌ Error al generar PDF:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method
        }
      });
      
      const mensaje = error.response?.data?.message || error.message || 'Error al generar el PDF';
      setErrorLocal(`Error: ${mensaje}`);
      onError?.(mensaje);
    } finally {
      setGuardandoPDF(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={() => {}} // Deshabilitamos el cierre automático
      maxWidth="lg" 
      fullWidth
      disableEscapeKeyDown // También deshabilitamos ESC para cerrar
      PaperProps={{
        sx: { maxHeight: '90vh' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box>
          <Typography variant="h6">Agregar Nueva Etapa</Typography>
          {nombreEtapa === 'Visita Inicial / Medición' && piezas.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Captación del prospecto y levantamiento de medidas. Documentar medidas, necesidades y especificaciones.
            </Typography>
          )}
          {nombreEtapa === 'Visita Inicial / Medición' && piezas.length > 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              📋 Resumen: {piezas.length} partida{piezas.length > 1 ? 's' : ''} medida{piezas.length > 1 ? 's' : ''}
              {tipoVisitaInicial === 'cotizacion' && ` • Precio por m² de tela: $${precioGeneral.toLocaleString()}`}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton 
            onClick={() => setCapturaModalOpen(true)} 
            size="small"
            color="secondary"
            title="Capturar pantalla para soporte"
          >
            <BugReport />
          </IconButton>
          <IconButton 
            onClick={() => setInspectorModalOpen(true)} 
            size="small"
            color="info"
            title="Inspector de elementos"
          >
            <Search />
          </IconButton>
          <IconButton onClick={cerrarModal} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ p: 3 }}>
        {/* Selector de Etapa */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Etapa</InputLabel>
          <Select
            value={nombreEtapa}
            label="Etapa"
            onChange={(e) => handleCambioEtapa(e.target.value)}
          >
            {etapaOptions.map((etapa) => (
              <MenuItem key={etapa} value={etapa}>
                {etapa}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Selector de Tipo de Visita Inicial */}
        {nombreEtapa === 'Visita Inicial / Medición' && (
          <Card sx={{ mb: 3, backgroundColor: '#f8f9fa', border: '2px solid #e9ecef' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#495057', fontWeight: 600 }}>
                🎯 Tipo de Visita Inicial
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Selecciona el tipo de visita según el escenario:
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      border: tipoVisitaInicial === 'levantamiento' ? '2px solid #2196f3' : '1px solid #e0e0e0',
                      backgroundColor: tipoVisitaInicial === 'levantamiento' ? '#e3f2fd' : 'white',
                      '&:hover': { backgroundColor: '#f5f5f5' }
                    }}
                    onClick={() => setTipoVisitaInicial('levantamiento')}
                  >
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h6" sx={{ color: '#1976d2', mb: 1 }}>
                        📋 Levantamiento Simple
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Solo medidas, fotos y notas
                      </Typography>
                      <Typography variant="caption" display="block" sx={{ mt: 1, fontStyle: 'italic' }}>
                        Sin precios • Para levantamiento técnico
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      border: tipoVisitaInicial === 'cotizacion' ? '2px solid #4caf50' : '1px solid #e0e0e0',
                      backgroundColor: tipoVisitaInicial === 'cotizacion' ? '#e8f5e9' : 'white',
                      '&:hover': { backgroundColor: '#f5f5f5' }
                    }}
                    onClick={() => setTipoVisitaInicial('cotizacion')}
                  >
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h6" sx={{ color: '#388e3c', mb: 1 }}>
                        💰 Cotización en Vivo
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Con precios y cotización completa
                      </Typography>
                      <Typography variant="caption" display="block" sx={{ mt: 1, fontStyle: 'italic' }}>
                        Con precios • Cliente presente
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}


        {/* Fecha y Hora - Solo para etapas que NO sean Visita Inicial */}
        {nombreEtapa !== 'Visita Inicial / Medición' && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Fecha"
                type="date"
                value={fechaEtapa}
                onChange={(e) => setFechaEtapa(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Hora"
                type="time"
                value={horaEtapa}
                onChange={(e) => setHoraEtapa(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        )}

        {/* LEVANTAMIENTO DE MEDIDAS - SOLO PARA VISITA INICIAL */}
        {nombreEtapa === 'Visita Inicial / Medición' && (
          <Card sx={{ mb: 3, bgcolor: 'success.50', border: 2, borderColor: 'success.200' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  📏 Levantamiento de Medidas
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => setAgregandoPieza(true)}
                    startIcon={<Add />}
                  >
                    Agregar Partida
                  </Button>
                  {/* Botón Excel mejorado con validación */}
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => {
                      console.log('🖱️ Click en botón Excel detectado');
                      console.log('📊 Estado del botón:', { 
                        descargandoExcel, 
                        piezasLength: piezas?.length,
                        disabled: descargandoExcel || (piezas && piezas.length === 0)
                      });
                      handleSolicitarExcel();
                    }}
                    disabled={descargandoExcel}
                    sx={{ 
                      bgcolor: '#16A34A', 
                      '&:hover': { bgcolor: '#15803D' },
                      fontWeight: 'bold'
                    }}
                  >
                    {descargandoExcel ? 'Generando...' : '📊 Excel Completo'}
                  </Button>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    🔒 Fuente única de verdad para fabricación
                  </Typography>
                </Box>
              </Box>

              {/* Precio General - Solo para Cotización en Vivo */}
              {tipoVisitaInicial === 'cotizacion' && (
                <Card sx={{ mb: 2, bgcolor: 'warning.50' }}>
                  <CardContent>
                    <TextField
                      label="💰 Precio General por m² (MXN)"
                      type="number"
                      fullWidth
                      value={precioGeneral}
                      onChange={(e) => setPrecioGeneral(e.target.value)}
                      placeholder="750"
                    />
                  </CardContent>
                </Card>
              )}

              {/* Información Global del Levantamiento - Solo para Levantamiento Simple */}
              {tipoVisitaInicial === 'levantamiento' && (
                <Card sx={{ mb: 2, bgcolor: 'info.50' }}>
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ mb: 2, color: 'info.main', fontWeight: 'bold' }}>
                      👤 Información General del Levantamiento
                    </Typography>
                    <TextField
                      label="Persona que realizó visita"
                      fullWidth
                      value={personaVisita}
                      onChange={(e) => setPersonaVisita(e.target.value)}
                      placeholder="Nombre del asesor/técnico"
                      helperText="Se aplicará a todo el levantamiento"
                    />
                  </CardContent>
                </Card>
              )}


              {/* Unidad */}
              <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
                <Typography variant="body2">Unidad:</Typography>
                <Button
                  variant={unidad === 'm' ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setUnidad('m')}
                >
                  m
                </Button>
                <Button
                  variant={unidad === 'cm' ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setUnidad('cm')}
                >
                  cm
                </Button>
              </Box>


              {/* Agregar Partida */}
              {agregandoPieza && (
                <Card sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        {editandoPieza ? 
                          `✏️ Editar Partida #${indiceEditando + 1}` : 
                          `🔧 Agregar Partida #${piezas.length + 1}`
                        }
                      </Typography>
                      {piezaForm.cantidad > 1 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, bgcolor: 'success.50', borderRadius: 1, border: '1px solid', borderColor: 'success.200' }}>
                          <Typography variant="body2" color="success.dark" fontWeight="bold">
                            📦 Partida con {parseInt(piezaForm.cantidad) || 1} pieza{(parseInt(piezaForm.cantidad) || 1) > 1 ? 's' : ''}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          label="Ubicación"
                          fullWidth
                          value={piezaForm.ubicacion}
                          onChange={(e) => setPiezaForm(prev => ({ ...prev, ubicacion: e.target.value }))}
                          placeholder="Ej. Sala, Recámara, Terraza"
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <TextField
                          label="🔢 Piezas"
                          type="number"
                          fullWidth
                          value={piezaForm.cantidad}
                          onChange={(e) => actualizarMedidas(e.target.value)}
                          inputProps={{ min: 1, max: 20, step: 1 }}
                          helperText="Piezas en partida"
                          sx={{ 
                            '& .MuiInputBase-input': { 
                              textAlign: 'center',
                              fontSize: '1.1rem',
                              fontWeight: 'bold'
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          select
                          label="Producto"
                          fullWidth
                          value={piezaForm.producto}
                          SelectProps={{
                            displayEmpty: true,
                            renderValue: (selected) => {
                              if (!selected) return '';
                              
                              // Si es un producto personalizado, mostrar su label
                              if (selected && selected.startsWith('custom_')) {
                                return piezaForm.productoLabel || 'Producto personalizado';
                              }
                              
                              // Si es un producto normal, buscar su label
                              const option = todosLosProductos.find(opt => opt.value === selected);
                              return option ? option.label : selected;
                            }
                          }}
                          onChange={(e) => {
                            const selectedOption = todosLosProductos.find(opt => opt.value === e.target.value);
                            const nuevoProducto = e.target.value;
                            
                            // Si selecciona "nuevo", mostrar formulario de producto personalizado
                            if (nuevoProducto === 'nuevo') {
                              setMostrarNuevoProducto(true);
                              return;
                            }
                            
                            setPiezaForm(prev => {
                              // Actualizar todas las medidas individuales con el nuevo producto
                              const medidasActualizadas = (prev.medidas || []).map(medida => ({
                                ...medida,
                                producto: nuevoProducto,
                                productoLabel: selectedOption ? selectedOption.label : nuevoProducto
                              }));

                              return { 
                                ...prev, 
                                producto: nuevoProducto,
                                productoLabel: selectedOption ? selectedOption.label : nuevoProducto,
                                // Propagar a todas las medidas individuales
                                medidas: medidasActualizadas,
                                // Detectar automáticamente si es toldo
                                esToldo: esProductoToldo(nuevoProducto),
                                // Reset campos específicos al cambiar producto
                                kitModelo: '',
                                kitModeloManual: '',
                                kitPrecio: '',
                                motorizado: false,
                                motorModelo: '',
                                motorModeloManual: '',
                                motorPrecio: '',
                                controlModelo: '',
                                controlModeloManual: '',
                                controlPrecio: ''
                              };
                            });
                          }}
                        >
                          {todosLosProductos.map((producto) => (
                            <MenuItem 
                              key={producto.value} 
                              value={producto.value}
                              sx={producto.value === 'nuevo' ? { color: 'primary.main', fontWeight: 'bold' } : {}}
                            >
                              {producto.label}
                            </MenuItem>
                          ))}
                        </TextField>
                        {piezaForm.producto && piezaForm.producto.startsWith('custom_') && (
                          <Box sx={{ mt: 1, p: 1, bgcolor: 'success.50', borderRadius: 1, border: '1px solid', borderColor: 'success.200' }}>
                            <Typography variant="caption" color="success.dark" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              ✨ <strong>Producto personalizado:</strong> {piezaForm.productoLabel}
                            </Typography>
                          </Box>
                        )}
                      </Grid>
                      {/* Campos dinámicos de medidas para cada pieza */}
                      {(piezaForm.medidas || []).map((medida, index) => (
                        <React.Fragment key={index}>
                          {/* Divisor entre piezas (excepto la primera) */}
                          {index > 0 && (
                            <Grid item xs={12}>
                              <Box sx={{ 
                                my: 2, 
                                borderTop: '2px solid', 
                                borderColor: 'divider',
                                position: 'relative'
                              }}>
                                <Box sx={{
                                  position: 'absolute',
                                  top: -12,
                                  left: '50%',
                                  transform: 'translateX(-50%)',
                                  bgcolor: 'background.paper',
                                  px: 2,
                                  color: 'text.secondary',
                                  fontSize: '0.75rem'
                                }}>
                                  ✂️ ─ ─ ─
                                </Box>
                              </Box>
                            </Grid>
                          )}
                          
                          <Grid item xs={12}>
                            <Box sx={{ 
                              p: 2, 
                              bgcolor: index === 0 ? 'primary.50' : 'grey.50', 
                              borderRadius: 2,
                              border: '1px solid',
                              borderColor: index === 0 ? 'primary.200' : 'grey.200'
                            }}>
                              <Typography variant="subtitle2" color={index === 0 ? 'primary.main' : 'text.primary'} sx={{ fontWeight: 'bold', mb: 2 }}>
                                📏 Especificaciones pieza {index + 1} de {piezaForm.cantidad}
                                {index === 0 && (
                                  <Typography component="span" variant="caption" sx={{ ml: 1, color: 'primary.main', fontWeight: 'normal' }}>
                                    (Pieza principal - se propaga a las demás)
                                  </Typography>
                                )}
                              </Typography>
                            </Box>
                          </Grid>
                          
                          {/* Producto específico para esta pieza */}
                          <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                              <InputLabel>Producto pieza {index + 1}</InputLabel>
                              <Select
                                value={medida.producto || piezaForm.producto}
                                label={`Producto pieza ${index + 1}`}
                                onChange={(e) => {
                                  const nuevasMedidas = [...(piezaForm.medidas || [])];
                                  const productoSeleccionado = todosLosProductos.find(p => p.value === e.target.value);
                                  
                                  // Si es la primera pieza (index 0), propagar a todas las demás
                                  if (index === 0) {
                                    for (let i = 0; i < nuevasMedidas.length; i++) {
                                      nuevasMedidas[i] = { 
                                        ...nuevasMedidas[i], 
                                        producto: e.target.value,
                                        productoLabel: productoSeleccionado ? productoSeleccionado.label : e.target.value
                                      };
                                    }
                                    // También actualizar el producto general
                                    setPiezaForm(prev => ({ 
                                      ...prev, 
                                      producto: e.target.value,
                                      productoLabel: productoSeleccionado ? productoSeleccionado.label : e.target.value,
                                      medidas: nuevasMedidas 
                                    }));
                                  } else {
                                    // Solo actualizar la pieza específica
                                    nuevasMedidas[index] = { 
                                      ...nuevasMedidas[index], 
                                      producto: e.target.value,
                                      productoLabel: productoSeleccionado ? productoSeleccionado.label : e.target.value
                                    };
                                    setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
                                  }
                                }}
                              >
                                {todosLosProductos.filter(p => p.value !== 'nuevo').map((producto) => (
                                  <MenuItem key={producto.value} value={producto.value}>
                                    {producto.label}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                            {index === 0 ? (
                              <Typography variant="caption" color="primary" sx={{ mt: 0.5, display: 'block' }}>
                                💡 Se aplicará a todas las piezas (puedes cambiar individualmente después)
                              </Typography>
                            ) : (
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                📋 Propagado desde pieza 1 (puedes cambiar si es necesario)
                              </Typography>
                            )}
                          </Grid>
                          
                          {/* Color específico para esta pieza */}
                          <Grid item xs={12} sm={6}>
                            <TextField
                              label={`Color pieza ${index + 1}`}
                              fullWidth
                              value={medida.color || piezaForm.color}
                              onChange={(e) => {
                                const nuevasMedidas = [...(piezaForm.medidas || [])];
                                
                                // Si es la primera pieza (index 0), propagar a todas las demás
                                if (index === 0) {
                                  for (let i = 0; i < nuevasMedidas.length; i++) {
                                    nuevasMedidas[i] = { ...nuevasMedidas[i], color: e.target.value };
                                  }
                                  // También actualizar el color general
                                  setPiezaForm(prev => ({ 
                                    ...prev, 
                                    color: e.target.value,
                                    medidas: nuevasMedidas 
                                  }));
                                } else {
                                  // Solo actualizar la pieza específica
                                  nuevasMedidas[index] = { ...nuevasMedidas[index], color: e.target.value };
                                  setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
                                  // Sincronizar con el campo general después de un pequeño delay
                                  setTimeout(sincronizarColores, 100);
                                }
                              }}
                              placeholder="Ej. Blanco, Negro, Gris"
                            />
                            {index === 0 ? (
                              <Typography variant="caption" color="primary" sx={{ mt: 0.5, display: 'block' }}>
                                💡 Se aplicará a todas las piezas (puedes cambiar individualmente después)
                              </Typography>
                            ) : (
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                📋 Propagado desde pieza 1 (puedes cambiar si es necesario)
                              </Typography>
                            )}
                          </Grid>

                          {/* Campos técnicos según formato Excel */}
                          {tipoVisitaInicial === 'levantamiento' && (
                            <>
                              {/* Control */}
                              <Grid item xs={12} sm={4}>
                                <FormControl fullWidth>
                                  <InputLabel>{`Control pieza ${index + 1}`}</InputLabel>
                                  <Select
                                    value={medida.control || ''}
                                    label={`Control pieza ${index + 1}`}
                                    onChange={(e) => {
                                      const nuevasMedidas = [...(piezaForm.medidas || [])];
                                      nuevasMedidas[index] = { ...nuevasMedidas[index], control: e.target.value };
                                      setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
                                    }}
                                  >
                                    <MenuItem value="">Seleccionar</MenuItem>
                                    <MenuItem value="IZQ">IZQ</MenuItem>
                                    <MenuItem value="DER">DER</MenuItem>
                                  </Select>
                                </FormControl>
                              </Grid>

                              {/* Galería */}
                              <Grid item xs={12} sm={4}>
                                <FormControl fullWidth>
                                  <InputLabel>{`Galería pieza ${index + 1}`}</InputLabel>
                                  <Select
                                    value={medida.galeria || ''}
                                    label={`Galería pieza ${index + 1}`}
                                    onChange={(e) => {
                                      const nuevasMedidas = [...(piezaForm.medidas || [])];
                                      nuevasMedidas[index] = { 
                                        ...nuevasMedidas[index], 
                                        galeria: e.target.value,
                                        // Limpiar Base Tabla si Galería es "No"
                                        baseTabla: e.target.value === 'no' ? '' : nuevasMedidas[index].baseTabla
                                      };
                                      setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
                                    }}
                                  >
                                    <MenuItem value="">Seleccionar</MenuItem>
                                    <MenuItem value="si">Sí</MenuItem>
                                    <MenuItem value="no">No</MenuItem>
                                  </Select>
                                </FormControl>
                              </Grid>

                              {/* Base de Tabla - Solo si Galería es "Sí" */}
                              {medida.galeria === 'si' ? (
                                <Grid item xs={12} sm={4}>
                                  <FormControl fullWidth>
                                    <InputLabel>{`Base Tabla pieza ${index + 1}`}</InputLabel>
                                    <Select
                                      value={medida.baseTabla || ''}
                                      label={`Base Tabla pieza ${index + 1}`}
                                      onChange={(e) => {
                                        const nuevasMedidas = [...(piezaForm.medidas || [])];
                                        nuevasMedidas[index] = { ...nuevasMedidas[index], baseTabla: e.target.value };
                                        setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
                                      }}
                                    >
                                      <MenuItem value="">Seleccionar</MenuItem>
                                      <MenuItem value="7">7</MenuItem>
                                      <MenuItem value="15">15</MenuItem>
                                      <MenuItem value="18">18</MenuItem>
                                    </Select>
                                  </FormControl>
                                </Grid>
                              ) : (
                                <Grid item xs={12} sm={4}>
                                  <Box sx={{ 
                                    p: 2, 
                                    bgcolor: 'grey.100', 
                                    borderRadius: 1, 
                                    textAlign: 'center',
                                    color: 'text.secondary'
                                  }}>
                                    <Typography variant="body2">
                                      Base Tabla: N/A
                                    </Typography>
                                    <Typography variant="caption">
                                      (Galería: No)
                                    </Typography>
                                  </Box>
                                </Grid>
                              )}

                              {/* Fotos específicas por pieza */}
                              <Grid item xs={12}>
                                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, border: '1px dashed', borderColor: 'grey.300' }}>
                                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                                    📷 Fotos pieza {index + 1}:
                                  </Typography>
                                  
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                    <Button
                                      variant="outlined"
                                      size="small"
                                      startIcon={<CloudUpload />}
                                      onClick={() => {
                                        const input = document.createElement('input');
                                        input.type = 'file';
                                        input.accept = 'image/*';
                                        input.multiple = true;
                                        input.onchange = async (e) => {
                                          const files = Array.from(e.target.files);
                                          if (files.length === 0) return;
                                          
                                          setSubiendoFoto(true);
                                          try {
                                            const uploadPromises = files.map(async (file) => {
                                              const formData = new FormData();
                                              formData.append('foto', file);
                                              const response = await axiosConfig.post('/upload/foto', formData);
                                              return response.data.url;
                                            });
                                            
                                            const urls = await Promise.all(uploadPromises);
                                            const nuevasMedidas = [...(piezaForm.medidas || [])];
                                            const fotosActuales = nuevasMedidas[index].fotoUrls || [];
                                            nuevasMedidas[index] = { 
                                              ...nuevasMedidas[index], 
                                              fotoUrls: [...fotosActuales, ...urls] 
                                            };
                                            setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
                                          } catch (error) {
                                            console.error('Error al subir fotos:', error);
                                            setErrorLocal('Error al subir las fotos');
                                          } finally {
                                            setSubiendoFoto(false);
                                          }
                                        };
                                        input.click();
                                      }}
                                      disabled={subiendoFoto}
                                      sx={{ minWidth: 'auto' }}
                                    >
                                      {subiendoFoto ? 'Subiendo...' : 'Subir Fotos'}
                                    </Button>
                                    
                                    {medida.fotoUrls && medida.fotoUrls.length > 0 && (
                                      <Typography variant="caption" color="success.main">
                                        ✅ {medida.fotoUrls.length} foto{medida.fotoUrls.length > 1 ? 's' : ''} subida{medida.fotoUrls.length > 1 ? 's' : ''}
                                      </Typography>
                                    )}
                                  </Box>
                                  
                                  {/* Mostrar fotos subidas */}
                                  {medida.fotoUrls && medida.fotoUrls.length > 0 && (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                                      {medida.fotoUrls.map((url, fotoIndex) => (
                                        <Box key={fotoIndex} sx={{ position: 'relative' }}>
                                          <img 
                                            src={url} 
                                            alt={`Foto ${fotoIndex + 1} pieza ${index + 1}`}
                                            style={{ 
                                              width: 60, 
                                              height: 60, 
                                              objectFit: 'cover', 
                                              borderRadius: 4,
                                              cursor: 'pointer'
                                            }}
                                            onClick={() => window.open(url, '_blank')}
                                          />
                                          <IconButton
                                            size="small"
                                            onClick={() => {
                                              const nuevasMedidas = [...(piezaForm.medidas || [])];
                                              const nuevasFotos = [...(nuevasMedidas[index].fotoUrls || [])];
                                              nuevasFotos.splice(fotoIndex, 1);
                                              nuevasMedidas[index] = { 
                                                ...nuevasMedidas[index], 
                                                fotoUrls: nuevasFotos 
                                              };
                                              setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
                                            }}
                                            sx={{
                                              position: 'absolute',
                                              top: -8,
                                              right: -8,
                                              bgcolor: 'error.main',
                                              color: 'white',
                                              width: 20,
                                              height: 20,
                                              '&:hover': { bgcolor: 'error.dark' }
                                            }}
                                          >
                                            <Delete sx={{ fontSize: 12 }} />
                                          </IconButton>
                                        </Box>
                                      ))}
                                    </Box>
                                  )}
                                  
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                    Sube fotos específicas de esta pieza (medidas, ubicación, detalles)
                                  </Typography>
                                </Box>
                              </Grid>

                              {/* Sistema (Checkboxes múltiples) */}
                              <Grid item xs={12}>
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                                  Sistema pieza {index + 1}:
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                  {[
                                    'Manual', 'Motorizado', 'Galera', 'Muro', 'Techo', 
                                    'Traslape', 'Cofre', 'Empotrada', 'Piso/techo', 
                                    'Concreto', 'Tablaroca'
                                  ].map((sistema) => (
                                    <Button
                                      key={sistema}
                                      size="small"
                                      variant={medida.sistema?.includes(sistema) ? 'contained' : 'outlined'}
                                      onClick={() => {
                                        console.log(`🔧 SISTEMA: Click en "${sistema}" para medida ${index + 1}`);
                                        const nuevasMedidas = [...(piezaForm.medidas || [])];
                                        const sistemasActuales = nuevasMedidas[index].sistema || [];
                                        const nuevosSistemas = sistemasActuales.includes(sistema)
                                          ? sistemasActuales.filter(s => s !== sistema)
                                          : [...sistemasActuales, sistema];
                                        nuevasMedidas[index] = { ...nuevasMedidas[index], sistema: nuevosSistemas };
                                        console.log(`🔧 SISTEMA: Nuevos sistemas para medida ${index + 1}:`, nuevosSistemas);
                                        setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
                                      }}
                                      sx={{ 
                                        fontSize: '0.75rem',
                                        minWidth: 'auto',
                                        px: 1,
                                        py: 0.5
                                      }}
                                    >
                                      {sistema}
                                    </Button>
                                  ))}
                                </Box>
                              </Grid>

                              {/* Sistema Especial (Checkboxes múltiples) */}
                              <Grid item xs={12}>
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                                  Sistema Especial pieza {index + 1}:
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                  {[
                                    'Estándar', 'Skyline', 'Día & Noche', 'Otros modelos de persianas'
                                  ].map((sistemaEsp) => (
                                    <Button
                                      key={sistemaEsp}
                                      size="small"
                                      variant={medida.sistemaEspecial?.includes(sistemaEsp) ? 'contained' : 'outlined'}
                                      onClick={() => {
                                        console.log(`🎨 SISTEMA ESPECIAL: Click en "${sistemaEsp}" para medida ${index + 1}`);
                                        const nuevasMedidas = [...(piezaForm.medidas || [])];
                                        const sistemasActuales = nuevasMedidas[index].sistemaEspecial || [];
                                        const nuevosSistemas = sistemasActuales.includes(sistemaEsp)
                                          ? sistemasActuales.filter(s => s !== sistemaEsp)
                                          : [...sistemasActuales, sistemaEsp];
                                        nuevasMedidas[index] = { ...nuevasMedidas[index], sistemaEspecial: nuevosSistemas };
                                        console.log(`🎨 SISTEMA ESPECIAL: Nuevos sistemas especiales para medida ${index + 1}:`, nuevosSistemas);
                                        setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
                                      }}
                                      sx={{ 
                                        fontSize: '0.75rem',
                                        minWidth: 'auto',
                                        px: 1,
                                        py: 0.5,
                                        bgcolor: medida.sistemaEspecial?.includes(sistemaEsp) ? '#9c27b0' : 'transparent',
                                        color: medida.sistemaEspecial?.includes(sistemaEsp) ? 'white' : '#9c27b0',
                                        borderColor: '#9c27b0',
                                        '&:hover': {
                                          bgcolor: medida.sistemaEspecial?.includes(sistemaEsp) ? '#7b1fa2' : '#f3e5f5'
                                        }
                                      }}
                                    >
                                      {sistemaEsp}
                                    </Button>
                                  ))}
                                </Box>
                              </Grid>
                            </>
                          )}
                          
                          {/* Botón para copiar medidas de pieza anterior */}
                          {index > 0 && (
                            <Grid item xs={12}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  startIcon={medidaCopiada[`pieza-${index}`] ? <CheckCircle /> : <ContentCopy />}
                                  onClick={() => copiarMedidasPiezaAnterior(index)}
                                  sx={{
                                    borderColor: medidaCopiada[`pieza-${index}`] ? 'success.main' : 'primary.main',
                                    color: medidaCopiada[`pieza-${index}`] ? 'success.main' : 'primary.main',
                                    '&:hover': {
                                      borderColor: medidaCopiada[`pieza-${index}`] ? 'success.dark' : 'primary.dark',
                                      backgroundColor: medidaCopiada[`pieza-${index}`] ? 'success.50' : 'primary.50'
                                    }
                                  }}
                                >
                                  {medidaCopiada[`pieza-${index}`] ? 'Copiado ✓' : 'Copiar medidas de pieza anterior'}
                                </Button>
                                
                                {/* Botón global para copiar de pieza 1 a todas (solo mostrar en pieza 2) */}
                                {index === 1 && piezaForm.medidas && piezaForm.medidas.length > 2 && (
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={medidaCopiada[`global-${index}`] ? <CheckCircle /> : <ContentCopy />}
                                    onClick={copiarDePieza1ATodas}
                                    sx={{
                                      borderColor: 'secondary.main',
                                      color: 'secondary.main',
                                      '&:hover': {
                                        borderColor: 'secondary.dark',
                                        backgroundColor: 'secondary.50'
                                      }
                                    }}
                                  >
                                    Copiar pieza 1 a todas
                                  </Button>
                                )}
                              </Box>
                            </Grid>
                          )}
                          
                          <Grid item xs={12} sm={4}>
                            <TextField
                              label={`Ancho pieza ${index + 1} (${unidad})`}
                              type="number"
                              fullWidth
                              value={medida.ancho}
                              onChange={(e) => {
                                const nuevasMedidas = [...(piezaForm.medidas || [])];
                                nuevasMedidas[index] = { ...nuevasMedidas[index], ancho: e.target.value };
                                setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
                              }}
                              inputProps={{ step: 0.01 }}
                              placeholder="Ej. 2.50"
                            />
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <TextField
                              label={`Alto pieza ${index + 1} (${unidad})`}
                              type="number"
                              fullWidth
                              value={medida.alto}
                              onChange={(e) => {
                                const nuevasMedidas = [...(piezaForm.medidas || [])];
                                nuevasMedidas[index] = { ...nuevasMedidas[index], alto: e.target.value };
                                setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
                              }}
                              inputProps={{ step: 0.01 }}
                              placeholder="Ej. 3.00"
                            />
                          </Grid>
                          {/* Campo de precio solo para Cotización en Vivo */}
                          {tipoVisitaInicial === 'cotizacion' && (
                            <Grid item xs={12} sm={6}>
                              <TextField
                                label={`Precio pieza ${index + 1} ($/m²)`}
                                type="number"
                                fullWidth
                                value={medida.precioM2 || ''}
                                onChange={(e) => {
                                  const nuevasMedidas = [...(piezaForm.medidas || [])];
                                  nuevasMedidas[index] = { ...nuevasMedidas[index], precioM2: e.target.value };
                                  setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
                                }}
                                placeholder={`Precio base: $${precioGeneral}`}
                                helperText="Opcional, usa precio base si vacío"
                              />
                            </Grid>
                          )}
                        </React.Fragment>
                      ))}
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Color / Acabado"
                          fullWidth
                          value={piezaForm.color}
                          onChange={(e) => {
                            const nuevoColor = e.target.value;
                            setPiezaForm(prev => {
                              // Actualizar color general y propagarlo a todas las piezas
                              const nuevasMedidas = (prev.medidas || []).map(medida => ({
                                ...medida,
                                color: nuevoColor
                              }));
                              return { 
                                ...prev, 
                                color: nuevoColor,
                                medidas: nuevasMedidas
                              };
                            });
                          }}
                          placeholder="Ej. Blanco, Negro, Gris, etc."
                          helperText="Se aplicará a todas las piezas. Puedes personalizar individualmente arriba."
                        />
                      </Grid>
                      {/* Campo de precio solo para Cotización en Vivo */}
                      {tipoVisitaInicial === 'cotizacion' && (
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Precio por m² (opcional)"
                            type="number"
                            fullWidth
                            value={piezaForm.precioM2}
                            onChange={(e) => setPiezaForm(prev => ({ ...prev, precioM2: e.target.value }))}
                            placeholder={`Usar precio general: $${precioGeneral}`}
                            inputProps={{ step: 0.01 }}
                          />
                        </Grid>
                      )}


                      {/* Sección de Kit de Toldo - Solo para toldos */}
                      {esProductoToldo(piezaForm.producto) && (
                        <>
                          <Grid item xs={12}>
                            <Typography variant="h6" sx={{ mt: 2, mb: 1, color: 'primary.main' }}>
                              🏗️ Kit de Toldo
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <TextField
                              select
                              label="Tipo de Toldo"
                              fullWidth
                              value={piezaForm.tipoToldo}
                              onChange={(e) => {
                                setPiezaForm(prev => ({ 
                                  ...prev, 
                                  tipoToldo: e.target.value,
                                  kitModelo: '', // Reset modelo al cambiar tipo
                                  kitModeloManual: ''
                                }));
                              }}
                            >
                              <MenuItem value="caida_vertical">Caída Vertical</MenuItem>
                              <MenuItem value="proyeccion">Proyección</MenuItem>
                            </TextField>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <TextField
                              select
                              label="Modelo de Kit"
                              fullWidth
                              value={piezaForm.kitModelo}
                              onChange={(e) => {
                                setPiezaForm(prev => ({ 
                                  ...prev, 
                                  kitModelo: e.target.value,
                                  kitModeloManual: e.target.value === 'otro_manual' ? '' : prev.kitModeloManual
                                }));
                              }}
                            >
                              {modelosToldos[piezaForm.tipoToldo]?.map(modelo => (
                                <MenuItem key={modelo.value} value={modelo.value}>
                                  {modelo.label}
                                </MenuItem>
                              ))}
                            </TextField>
                          </Grid>
                          {piezaForm.kitModelo === 'otro_manual' && (
                            <Grid item xs={12} sm={4}>
                              <TextField
                                label="Especificar modelo"
                                fullWidth
                                value={piezaForm.kitModeloManual}
                                onChange={(e) => setPiezaForm(prev => ({ ...prev, kitModeloManual: e.target.value }))}
                                placeholder="Ej. Modelo personalizado"
                              />
                            </Grid>
                          )}
                          {/* Campo de precio solo para Cotización en Vivo */}
                          {tipoVisitaInicial === 'cotizacion' && (
                            <Grid item xs={12} sm={4}>
                              <TextField
                                label="Precio del Kit (MXN)"
                                type="number"
                                fullWidth
                                value={piezaForm.kitPrecio}
                                onChange={(e) => setPiezaForm(prev => ({ ...prev, kitPrecio: e.target.value }))}
                                placeholder="Ej. 3500, 4200, 5000"
                                inputProps={{ step: 0.01 }}
                              />
                            </Grid>
                          )}
                        </>
                      )}

                      {/* Sección de Motorización Simplificada */}
                      {esProductoMotorizable(piezaForm.producto) && (
                        <>
                          <Grid item xs={12}>
                            <Typography variant="h6" sx={{ mt: 2, mb: 1, color: 'secondary.main' }}>
                              ⚡ Motorización (Opcional)
                            </Typography>
                          </Grid>
                          
                          <Grid item xs={12} sm={3}>
                            <TextField
                              select
                              label="¿Motorizado?"
                              fullWidth
                              value={piezaForm.motorizado ? 'si' : 'no'}
                              onChange={(e) => {
                                const esMotorizado = e.target.value === 'si';
                                setPiezaForm(prev => ({ 
                                  ...prev, 
                                  motorizado: esMotorizado,
                                  // Reset campos si se desmarca
                                  motorModelo: esMotorizado ? prev.motorModelo : '',
                                  motorModeloManual: esMotorizado ? prev.motorModeloManual : '',
                                  motorPrecio: esMotorizado ? prev.motorPrecio : '',
                                  controlModelo: esMotorizado ? prev.controlModelo : '',
                                  controlModeloManual: esMotorizado ? prev.controlModeloManual : '',
                                  controlPrecio: esMotorizado ? prev.controlPrecio : '',
                                  // Nuevos campos
                                  numMotores: esMotorizado ? prev.numMotores || 1 : 1,
                                  piezasPorMotor: esMotorizado ? prev.piezasPorMotor || 1 : 1,
                                  esControlMulticanal: esMotorizado ? prev.esControlMulticanal || false : false,
                                  piezasPorControl: esMotorizado ? prev.piezasPorControl || 1 : 1
                                }));
                              }}
                            >
                              <MenuItem value="no">No</MenuItem>
                              <MenuItem value="si">Sí</MenuItem>
                            </TextField>
                          </Grid>
                          
                          {piezaForm.motorizado && (
                            <>
                              {/* Configuración de Motores */}
                              <Grid item xs={12}>
                                <Box sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 1, border: '1px solid', borderColor: 'primary.200' }}>
                                  <Typography variant="subtitle2" sx={{ mb: 2, color: 'primary.dark', fontWeight: 'bold' }}>
                                    🔧 Configuración de Motores
                                  </Typography>
                                  
                                  <Grid container spacing={2}>
                                    <Grid item xs={12} sm={4}>
                                      <TextField
                                        select
                                        label="Modelo de Motor"
                                        fullWidth
                                        value={piezaForm.motorModelo}
                                        onChange={(e) => {
                                          setPiezaForm(prev => ({ 
                                            ...prev, 
                                            motorModelo: e.target.value,
                                            motorModeloManual: e.target.value === 'otro_manual' ? '' : prev.motorModeloManual
                                          }));
                                        }}
                                      >
                                        {modelosMotores.map(motor => (
                                          <MenuItem key={motor.value} value={motor.value}>
                                            {motor.label}
                                          </MenuItem>
                                        ))}
                                      </TextField>
                                    </Grid>
                                    
                                    {piezaForm.motorModelo === 'otro_manual' && (
                                      <Grid item xs={12} sm={4}>
                                        <TextField
                                          label="Especificar motor"
                                          fullWidth
                                          value={piezaForm.motorModeloManual}
                                          onChange={(e) => setPiezaForm(prev => ({ ...prev, motorModeloManual: e.target.value }))}
                                          placeholder="Ej. Motor Nacional 28Nm"
                                        />
                                      </Grid>
                                    )}
                                    
                                    {/* Campo de precio solo para Cotización en Vivo */}
                                    {tipoVisitaInicial === 'cotizacion' && (
                                      <Grid item xs={12} sm={4}>
                                        <TextField
                                          label="Precio por Motor (MXN)"
                                          type="number"
                                          fullWidth
                                          value={piezaForm.motorPrecio}
                                          onChange={(e) => setPiezaForm(prev => ({ ...prev, motorPrecio: e.target.value }))}
                                          placeholder="Ej. 9500"
                                          inputProps={{ step: 0.01 }}
                                        />
                                      </Grid>
                                    )}
                                    
                                    <Grid item xs={12} sm={4}>
                                      <TextField
                                        label="Número de Motores"
                                        type="number"
                                        fullWidth
                                        value={piezaForm.numMotores || 1}
                                        onChange={(e) => setPiezaForm(prev => ({ ...prev, numMotores: parseInt(e.target.value) || 1 }))}
                                        inputProps={{ min: 1, max: 20 }}
                                        helperText="Cantidad total de motores"
                                      />
                                    </Grid>
                                    
                                    <Grid item xs={12} sm={4}>
                                      <TextField
                                        label="Piezas por Motor"
                                        type="number"
                                        fullWidth
                                        value={piezaForm.piezasPorMotor || Math.ceil((piezaForm.medidas ? piezaForm.medidas.length : 1) / (piezaForm.numMotores || 1))}
                                        onChange={(e) => setPiezaForm(prev => ({ ...prev, piezasPorMotor: parseInt(e.target.value) || 1 }))}
                                        inputProps={{ min: 1, max: 10 }}
                                        helperText="Cuántas piezas controla cada motor"
                                      />
                                    </Grid>
                                  </Grid>
                                </Box>
                              </Grid>

                              {/* Configuración de Control */}
                              <Grid item xs={12}>
                                <Box sx={{ p: 2, bgcolor: 'secondary.50', borderRadius: 1, border: '1px solid', borderColor: 'secondary.200' }}>
                                  <Typography variant="subtitle2" sx={{ mb: 2, color: 'secondary.dark', fontWeight: 'bold' }}>
                                    🎛️ Configuración de Control
                                  </Typography>
                                  
                                  <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                      <TextField
                                        select
                                        label="Tipo de Control"
                                        fullWidth
                                        value={(() => {
                                          // Determinar automáticamente si es multicanal basado en controlModelo
                                          const controlSeleccionado = modelosControles.find(c => c.value === piezaForm.controlModelo);
                                          const esMulticanalReal = controlSeleccionado?.esMulticanal || piezaForm.esControlMulticanal;
                                          return esMulticanalReal ? 'multicanal' : 'individual';
                                        })()}
                                        onChange={(e) => {
                                          const esMulticanal = e.target.value === 'multicanal';
                                          setPiezaForm(prev => ({ 
                                            ...prev, 
                                            esControlMulticanal: esMulticanal,
                                            controlModelo: esMulticanal ? 'multicanal' : 'monocanal',
                                            piezasPorControl: esMulticanal ? (piezaForm.medidas ? piezaForm.medidas.length : 1) : 1
                                          }));
                                        }}
                                      >
                                        <MenuItem value="individual">Control Individual (1 por pieza)</MenuItem>
                                        <MenuItem value="multicanal">Control Multicanal (1 para varias piezas)</MenuItem>
                                      </TextField>
                                    </Grid>
                                    
                                    <Grid item xs={12} sm={6}>
                                      <TextField
                                        select
                                        label="Modelo de Control"
                                        fullWidth
                                        value={piezaForm.controlModelo}
                                        onChange={(e) => {
                                          setPiezaForm(prev => ({ 
                                            ...prev, 
                                            controlModelo: e.target.value,
                                            controlModeloManual: e.target.value === 'otro_manual' ? '' : prev.controlModeloManual
                                          }));
                                        }}
                                      >
                                        {(() => {
                                          // Determinar automáticamente si es multicanal basado en controlModelo
                                          const controlSeleccionado = modelosControles.find(c => c.value === piezaForm.controlModelo);
                                          const esMulticanalReal = controlSeleccionado?.esMulticanal || piezaForm.esControlMulticanal;
                                          
                                          return esMulticanalReal ? (
                                            // Solo controles multicanal
                                            modelosControles.filter(c => c.esMulticanal).map(control => (
                                              <MenuItem key={control.value} value={control.value}>
                                                {control.label}
                                              </MenuItem>
                                            ))
                                          ) : (
                                            // Solo controles individuales
                                            modelosControles.filter(c => !c.esMulticanal).map(control => (
                                              <MenuItem key={control.value} value={control.value}>
                                                {control.label}
                                              </MenuItem>
                                            ))
                                          );
                                        })()}
                                      </TextField>
                                    </Grid>
                                    
                                    {piezaForm.controlModelo === 'otro_manual' && (
                                      <Grid item xs={12} sm={6}>
                                        <TextField
                                          label="Especificar control"
                                          fullWidth
                                          value={piezaForm.controlModeloManual}
                                          onChange={(e) => setPiezaForm(prev => ({ ...prev, controlModeloManual: e.target.value }))}
                                          placeholder="Ej. Control personalizado"
                                        />
                                      </Grid>
                                    )}
                                    
                                    {/* Campo de precio solo para Cotización en Vivo */}
                                    {tipoVisitaInicial === 'cotizacion' && (
                                      <Grid item xs={12} sm={6}>
                                        <TextField
                                          label="Precio Control (MXN)"
                                          type="number"
                                          fullWidth
                                          value={piezaForm.controlPrecio}
                                          onChange={(e) => setPiezaForm(prev => ({ ...prev, controlPrecio: e.target.value }))}
                                          placeholder={piezaForm.esControlMulticanal ? "Ej. 1800 (solo 1)" : "Ej. 950 (por pieza)"}
                                          inputProps={{ step: 0.01 }}
                                          helperText={piezaForm.esControlMulticanal ? "Solo se cobrará 1 control multicanal" : "Se cobrará 1 control por pieza"}
                                        />
                                      </Grid>
                                    )}
                                    
                                    {piezaForm.esControlMulticanal && (
                                      <Grid item xs={12} sm={6}>
                                        <TextField
                                          label="Piezas controladas"
                                          type="number"
                                          fullWidth
                                          value={piezaForm.piezasPorControl || (piezaForm.medidas ? piezaForm.medidas.length : 1)}
                                          onChange={(e) => setPiezaForm(prev => ({ ...prev, piezasPorControl: parseInt(e.target.value) || 1 }))}
                                          inputProps={{ min: 1, max: 15 }}
                                          helperText="Cuántas piezas controla este control multicanal"
                                        />
                                      </Grid>
                                    )}
                                  </Grid>
                                  
                                  {/* Resumen de costos - Solo para Cotización en Vivo */}
                                  {tipoVisitaInicial === 'cotizacion' && (piezaForm.motorPrecio || piezaForm.controlPrecio) && (
                                    <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                                        💰 Resumen de Costos de Motorización:
                                      </Typography>
                                      {piezaForm.motorPrecio && (
                                        <Typography variant="body2">
                                          • Motores: {piezaForm.numMotores || 1} × ${piezaForm.motorPrecio} = ${((piezaForm.numMotores || 1) * parseFloat(piezaForm.motorPrecio || 0)).toLocaleString()}
                                          <br />
                                          &nbsp;&nbsp;({piezaForm.piezasPorMotor || Math.ceil((piezaForm.medidas ? piezaForm.medidas.length : 1) / (piezaForm.numMotores || 1))} piezas por motor)
                                        </Typography>
                                      )}
                                      {piezaForm.controlPrecio && (
                                        <Typography variant="body2">
                                          • Control: {piezaForm.esControlMulticanal ? '1' : (piezaForm.numMotores || 1)} × ${piezaForm.controlPrecio} = ${(piezaForm.esControlMulticanal ? parseFloat(piezaForm.controlPrecio || 0) : ((piezaForm.numMotores || 1) * parseFloat(piezaForm.controlPrecio || 0))).toLocaleString()}
                                        </Typography>
                                      )}
                                      <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 1 }}>
                                        Total Motorización: ${(
                                          ((piezaForm.numMotores || 1) * parseFloat(piezaForm.motorPrecio || 0)) +
                                          (piezaForm.esControlMulticanal ? parseFloat(piezaForm.controlPrecio || 0) : ((piezaForm.numMotores || 1) * parseFloat(piezaForm.controlPrecio || 0)))
                                        ).toLocaleString()}
                                      </Typography>
                                    </Box>
                                  )}
                                  
                                  {/* Resumen técnico - Para Levantamiento Simple */}
                                  {tipoVisitaInicial === 'levantamiento' && piezaForm.motorizado && (
                                    <Box sx={{ mt: 2, p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
                                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: 'info.main' }}>
                                        🔧 Especificaciones Técnicas de Motorización:
                                      </Typography>
                                      <Typography variant="body2">
                                        • Motores: {piezaForm.numMotores || 1} unidad{(piezaForm.numMotores || 1) > 1 ? 'es' : ''}
                                        <br />
                                        • Modelo: {piezaForm.motorModeloManual || piezaForm.motorModelo || 'Por especificar'}
                                        <br />
                                        • Control: {piezaForm.controlModeloManual || piezaForm.controlModelo || 'Por especificar'}
                                        {piezaForm.esControlMulticanal && ' (Multicanal)'}
                                        <br />
                                        • Distribución: {piezaForm.piezasPorMotor || Math.ceil((piezaForm.medidas ? piezaForm.medidas.length : 1) / (piezaForm.numMotores || 1))} piezas por motor
                                      </Typography>
                                    </Box>
                                  )}
                                </Box>
                              </Grid>
                            </>
                          )}
                        </>
                      )}

                      <Grid item xs={12}>
                        <TextFieldConDictado
                          label="Observaciones"
                          rows={3}
                          fullWidth
                          value={piezaForm.observaciones}
                          onChange={(e) => setPiezaForm(prev => ({ ...prev, observaciones: e.target.value }))}
                          placeholder="Notas adicionales sobre esta pieza..."
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <TextField
                          label="Video URL (opcional)"
                          fullWidth
                          value={piezaForm.videoUrl}
                          onChange={(e) => setPiezaForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                          placeholder="https://drive.google.com/... o https://youtube.com/..."
                        />
                      </Grid>
                    </Grid>

                    {/* Sección de Fotos */}
                    <Box sx={{ mt: 2, p: 2, border: 1, borderColor: 'grey.300', borderRadius: 1 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        📷 Fotos de la pieza (opcional)
                      </Typography>
                      
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                        id="foto-input"
                        disabled={subiendoFoto}
                      />
                      
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', mb: 1 }}>
                        <Button
                          variant="outlined"
                          component="label"
                          htmlFor="foto-input"
                          disabled={subiendoFoto}
                          startIcon={subiendoFoto ? null : <span>📷</span>}
                          sx={{ color: '#2563EB', borderColor: '#2563EB' }}
                        >
                          {subiendoFoto ? 'Subiendo...' : 'Subir Archivo / Tomar Foto'}
                        </Button>
                        
                        {piezaForm.fotoUrls.length > 0 && (
                          <Chip 
                            label={`✅ ${piezaForm.fotoUrls.length} foto${piezaForm.fotoUrls.length > 1 ? 's' : ''} cargada${piezaForm.fotoUrls.length > 1 ? 's' : ''}`} 
                            color="success" 
                            size="small"
                          />
                        )}
                      </Box>
                      
                      {/* Preview de fotos */}
                      {piezaForm.fotoUrls.length > 0 && (
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                          {piezaForm.fotoUrls.map((url, index) => (
                            <Box key={index} sx={{ position: 'relative' }}>
                              <img 
                                src={url} 
                                alt={`Preview ${index + 1}`} 
                                style={{ 
                                  width: '100px', 
                                  height: '80px', 
                                  objectFit: 'cover',
                                  borderRadius: '4px',
                                  cursor: 'pointer'
                                }}
                                onClick={() => window.open(url, '_blank')}
                              />
                              <IconButton
                                size="small"
                                sx={{ 
                                  position: 'absolute', 
                                  top: -8, 
                                  right: -8, 
                                  bgcolor: 'error.main', 
                                  color: 'white',
                                  '&:hover': { bgcolor: 'error.dark' }
                                }}
                                onClick={() => {
                                  setPiezaForm(prev => ({
                                    ...prev,
                                    fotoUrls: prev.fotoUrls.filter((_, i) => i !== index)
                                  }));
                                }}
                              >
                                <Close sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                      <Button
                        variant="contained"
                        onClick={handleAgregarPieza}
                        sx={{ bgcolor: '#16A34A', '&:hover': { bgcolor: '#15803D' } }}
                      >
                        {editandoPieza ? '✅ Actualizar Partida' : '➕ Agregar Partida'}
                      </Button>
                      {!editandoPieza && piezas.length > 0 && (
                        <Button
                          variant="contained"
                          onClick={() => setAgregandoPieza(false)}
                          sx={{ bgcolor: '#2563EB', '&:hover': { bgcolor: '#1D4ED8' } }}
                        >
                          ✅ Terminar de Agregar
                        </Button>
                      )}
                      <Button
                        variant="outlined"
                        onClick={editandoPieza ? handleCancelarEdicion : () => setAgregandoPieza(false)}
                        sx={{ color: '#6B7280', borderColor: '#6B7280' }}
                      >
                        Cancelar
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* Formulario Nuevo Producto */}
              {mostrarNuevoProducto && (
                <Card sx={{ mb: 2, bgcolor: 'warning.50', border: 2, borderColor: 'warning.200' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      ➕ Agregar Producto Personalizado
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Útil para casos especiales como: dos cortinas en una ventana, combinaciones únicas, productos especiales, etc.
                    </Typography>
                    
                    <TextField
                      label="Nombre del producto personalizado"
                      fullWidth
                      value={nuevoProductoNombre}
                      onChange={(e) => setNuevoProductoNombre(e.target.value)}
                      placeholder="Ej. Doble Screen 3% + Blackout, Cortina Triple, Sistema Especial..."
                      sx={{ mb: 2 }}
                      helperText="Sé específico para identificar fácilmente el producto"
                    />
                    
                    {/* Sugerencias rápidas */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                        💡 Sugerencias rápidas:
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {[
                          'Doble Screen + Blackout',
                          'Cortina Día/Noche Especial',
                          'Sistema Triple',
                          'Cortina con Cenefa Decorativa'
                        ].map((sugerencia) => (
                          <Button
                            key={sugerencia}
                            size="small"
                            variant="outlined"
                            onClick={() => setNuevoProductoNombre(sugerencia)}
                            sx={{ fontSize: '0.75rem' }}
                          >
                            {sugerencia}
                          </Button>
                        ))}
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        color="warning"
                        onClick={handleCrearNuevoProducto}
                        disabled={!nuevoProductoNombre.trim()}
                      >
                        ✅ Crear Producto
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          setMostrarNuevoProducto(false);
                          setNuevoProductoNombre('');
                          setErrorLocal('');
                          // Resetear el selector de producto al primer valor
                          setPiezaForm(prev => ({ 
                            ...prev, 
                            producto: todosLosProductos[0].value,
                            productoLabel: todosLosProductos[0].label
                          }));
                        }}
                      >
                        Cancelar
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* Módulo de Instalación Especial con Sugerencias Inteligentes */}
              {tipoVisitaInicial === 'cotizacion' && (
                <Card sx={{ mb: 3, bgcolor: 'info.50', border: 2, borderColor: 'info.200' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        🔧 Instalación Especial & Sugerencias Inteligentes
                      </Typography>
                      <Button
                        variant={cobraInstalacion ? 'contained' : 'outlined'}
                        size="small"
                        onClick={() => setCobraInstalacion(!cobraInstalacion)}
                        sx={{ 
                          bgcolor: cobraInstalacion ? '#0ea5e9' : 'transparent',
                          color: cobraInstalacion ? 'white' : '#0ea5e9',
                          borderColor: '#0ea5e9',
                          '&:hover': { 
                            bgcolor: cobraInstalacion ? '#0284c7' : '#f0f9ff',
                            borderColor: '#0284c7'
                          }
                        }}
                      >
                        {cobraInstalacion ? '✅ Activado' : '➕ Activar'}
                      </Button>
                    </Box>

                    {/* Sugerencias Inteligentes del Sistema */}
                    {true && (
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                          🤖 Sugerencias Inteligentes Detectadas
                        </Typography>
                        
                        {/* Sugerencias por Etapa */}
                        {sugerenciasEtapa.length > 0 && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: 'secondary.main' }}>
                              📊 Análisis General de la Etapa:
                            </Typography>
                            {sugerenciasEtapa.map((sugerencia, index) => (
                              <Alert 
                                key={`etapa-${sugerencia.id}-${index}`}
                                severity={sugerencia.severidad}
                                icon={
                                  sugerencia.severidad === 'warning' ? <Warning /> :
                                  sugerencia.severidad === 'error' ? <Error /> : <Info />
                                }
                                sx={{ 
                                  mb: 1.5,
                                  fontSize: '0.875rem',
                                  '& .MuiAlert-message': {
                                    padding: '6px 0'
                                  }
                                }}
                              >
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {sugerencia.mensaje}
                                </Typography>
                              </Alert>
                            ))}
                          </Box>
                        )}

                        {/* Análisis General - Siempre visible */}
                        {sugerenciasEtapa.length === 0 && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: 'secondary.main' }}>
                              📊 Análisis General de la Etapa:
                            </Typography>
                            <Alert 
                              severity="info"
                              icon={<Info />}
                              sx={{ 
                                mb: 1.5,
                                fontSize: '0.875rem',
                                bgcolor: 'info.50',
                                '& .MuiAlert-message': {
                                  padding: '6px 0'
                                }
                              }}
                            >
                              <Typography variant="body2" sx={{ fontWeight: 500, color: 'info.dark', mb: 1 }}>
                                ⏱️ Estimación de Tiempos de Instalación:
                              </Typography>
                              <Box sx={{ ml: 2 }}>
                                {(() => {
                                  // Calcular tiempos basado en productos y características
                                  const todasLasPiezas = [...piezas];
                                  if (piezaForm.medidas && piezaForm.medidas.length > 0) {
                                    todasLasPiezas.push({
                                      ...piezaForm,
                                      medidas: piezaForm.medidas
                                    });
                                  }
                                  
                                  let tiempoTotal = 0;
                                  let desglose = [];
                                  let requiereAndamios = false;
                                  
                                  todasLasPiezas.forEach(pieza => {
                                    const medidas = pieza.medidas || [pieza];
                                    const producto = (pieza.producto || '').toLowerCase();
                                    const esMotorizado = pieza.motorizado;
                                    
                                    medidas.forEach(medida => {
                                      const ancho = parseFloat(medida.ancho) || 0;
                                      const alto = parseFloat(medida.alto) || 0;
                                      
                                      // Detectar si requiere andamios (altura > 4m)
                                      if (alto > 4) {
                                        requiereAndamios = true;
                                      }
                                      
                                      // Calcular tiempo según tipo de producto
                                      if (producto.includes('toldo')) {
                                        // Toldos: 1-2 horas por toldo
                                        tiempoTotal += 90; // 1.5 horas promedio
                                        desglose.push('Toldo: 1.5h');
                                      } else if (esMotorizado) {
                                        // Cortinas motorizadas: 30 min por cortina
                                        tiempoTotal += 30;
                                        desglose.push('Cortina motorizada: 30min');
                                      } else {
                                        // Persianas manuales: 15-20 min (hasta 3m ancho, altura estándar)
                                        let tiempoPieza = 17.5; // 17.5 min promedio
                                        
                                        // Ajustar por ancho (si > 3m, más tiempo)
                                        if (ancho > 3) {
                                          tiempoPieza += 10; // +10 min por ancho extra
                                        }
                                        
                                        // Ajustar por altura (si > 2.5m, más tiempo)
                                        if (alto > 2.5) {
                                          tiempoPieza += 5; // +5 min por altura extra
                                        }
                                        
                                        tiempoTotal += tiempoPieza;
                                        desglose.push(`Persiana manual: ${Math.round(tiempoPieza)}min`);
                                      }
                                    });
                                  });
                                  
                                  // Agregar tiempo de andamios si es necesario
                                  if (requiereAndamios) {
                                    tiempoTotal += 50; // 40-60 min promedio para armar andamios
                                    desglose.unshift('⚠️ Armado de andamios: 50min');
                                  }
                                  
                                  // Convertir a horas y minutos
                                  const horas = Math.floor(tiempoTotal / 60);
                                  const minutos = Math.round(tiempoTotal % 60);
                                  
                                  const tiempoFormateado = horas > 0 
                                    ? `${horas}h ${minutos > 0 ? minutos + 'min' : ''}`
                                    : `${minutos}min`;
                                  
                                  return (
                                    <>
                                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'info.dark' }}>
                                        Tiempo total estimado: {tiempoFormateado}
                                      </Typography>
                                      {desglose.length > 0 && (
                                        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.secondary' }}>
                                          Desglose: {desglose.join(' • ')}
                                        </Typography>
                                      )}
                                      {requiereAndamios && (
                                        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'warning.dark', fontWeight: 'bold' }}>
                                          ⚠️ Instalación requiere andamios por altura superior a 4m
                                        </Typography>
                                      )}
                                    </>
                                  );
                                })()}
                              </Box>
                            </Alert>
                          </Box>
                        )}

                        {/* Sugerencias por Pieza */}
                        {Object.keys(sugerenciasPorPieza).length > 0 && (
                          <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: 'secondary.main' }}>
                              🔍 Análisis por Pieza Individual:
                            </Typography>
                            {Object.entries(sugerenciasPorPieza).map(([piezaIndex, sugerencias]) => (
                              <Box key={piezaIndex} sx={{ mb: 2 }}>
                                <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary', mb: 1, display: 'block' }}>
                                  📏 Pieza {parseInt(piezaIndex) + 1}:
                                </Typography>
                                {sugerencias.map((sugerencia, sugIndex) => (
                                  <Alert 
                                    key={`${sugerencia.id}-${sugIndex}`}
                                    severity={sugerencia.severidad}
                                    icon={
                                      sugerencia.severidad === 'warning' ? <Warning /> :
                                      sugerencia.severidad === 'error' ? <Error /> : <Info />
                                    }
                                    sx={{ 
                                      mb: 1,
                                      fontSize: '0.875rem',
                                      '& .MuiAlert-message': {
                                        padding: '4px 0'
                                      }
                                    }}
                                  >
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                      {sugerencia.mensaje}
                                    </Typography>
                                  </Alert>
                                ))}
                              </Box>
                            ))}
                          </Box>
                        )}
                      </Box>
                    )}

                    {/* Configuración de Instalación Especial */}
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Para casos especiales como instalación eléctrica, estructural, o trabajos adicionales
                      </Typography>
                      
                      {cobraInstalacion && (
                        <>
                        {/* Calculadora de instalación */}
                        <Box sx={{ mb: 3, p: 2, bgcolor: 'warning.50', borderRadius: 2, border: '1px solid', borderColor: 'warning.200' }}>
                          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold', color: 'warning.dark' }}>
                            🧮 Calculadora de Instalación
                          </Typography>
                          
                          {/* Mostrar total de piezas detectadas */}
                          <Box sx={{ mb: 2, p: 1.5, bgcolor: 'info.50', borderRadius: 1, border: '1px solid', borderColor: 'info.200' }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'info.dark' }}>
                              📊 Piezas detectadas: {(() => {
                                // Contar piezas ya agregadas
                                const piezasExistentes = piezas.reduce((total, pieza) => {
                                  if (pieza.medidas && Array.isArray(pieza.medidas)) {
                                    return total + pieza.medidas.length;
                                  } else {
                                    return total + (parseInt(pieza.cantidad) || 1);
                                  }
                                }, 0);
                                
                                // Contar piezas del formulario actual (si hay medidas)
                                const piezasFormulario = (piezaForm.medidas && Array.isArray(piezaForm.medidas)) 
                                  ? piezaForm.medidas.length 
                                  : 0;
                                
                                return piezasExistentes + piezasFormulario;
                              })()}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Incluye piezas agregadas + piezas del formulario actual
                            </Typography>
                          </Box>

                          {/* Opciones de cálculo */}
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={4}>
                              <TextField
                                select
                                label="Modelo de precio"
                                fullWidth
                                value={tipoInstalacion}
                                onChange={(e) => setTipoInstalacion(e.target.value)}
                                SelectProps={{ native: true }}
                              >
                                <option value="fijo">Precio fijo total</option>
                                <option value="por_pieza">Precio por pieza</option>
                                <option value="base_mas_pieza">Base + precio por pieza</option>
                                <option value="personalizada">Personalizada</option>
                              </TextField>
                            </Grid>
                            
                            {tipoInstalacion === 'fijo' && (
                              <Grid item xs={12} sm={8}>
                                <TextField
                                  label="💰 Precio fijo total (MXN)"
                                  type="number"
                                  fullWidth
                                  value={precioInstalacion}
                                  onChange={(e) => setPrecioInstalacion(e.target.value)}
                                  placeholder="Ej. 2500, 5000, 8000..."
                                  helperText="Precio fijo independiente del número de piezas"
                                />
                              </Grid>
                            )}
                            
                            {tipoInstalacion === 'por_pieza' && (
                              <Grid item xs={12} sm={8}>
                                <TextField
                                  label="💰 Precio por pieza (MXN)"
                                  type="number"
                                  fullWidth
                                  value={precioInstalacion}
                                  onChange={(e) => setPrecioInstalacion(e.target.value)}
                                  placeholder="Ej. 500, 800, 1200..."
                                  helperText={`Total estimado: $${(parseFloat(precioInstalacion || 0) * (() => {
                                    const piezasExistentes = piezas.reduce((total, pieza) => {
                                      if (pieza.medidas && Array.isArray(pieza.medidas)) {
                                        return total + pieza.medidas.length;
                                      } else {
                                        return total + (parseInt(pieza.cantidad) || 1);
                                      }
                                    }, 0);
                                    const piezasFormulario = (piezaForm.medidas && Array.isArray(piezaForm.medidas)) ? piezaForm.medidas.length : 0;
                                    return piezasExistentes + piezasFormulario;
                                  })()).toLocaleString()}`}
                                />
                              </Grid>
                            )}
                            
                            {tipoInstalacion === 'base_mas_pieza' && (
                              <>
                                <Grid item xs={12} sm={4}>
                                  <TextField
                                    label="💰 Precio base (MXN)"
                                    type="number"
                                    fullWidth
                                    value={precioInstalacion}
                                    onChange={(e) => setPrecioInstalacion(e.target.value)}
                                    placeholder="Ej. 1500, 2000..."
                                    helperText="Precio base fijo"
                                  />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                  <TextField
                                    label="💰 Precio por pieza adicional"
                                    type="number"
                                    fullWidth
                                    value={precioInstalacionPorPieza}
                                    onChange={(e) => setPrecioInstalacionPorPieza(e.target.value)}
                                    placeholder="Ej. 300, 500..."
                                    helperText={`Total: $${(parseFloat(precioInstalacion || 0) + (parseFloat(precioInstalacionPorPieza || 0) * Math.max(0, (() => {
                                      const piezasExistentes = piezas.reduce((total, pieza) => {
                                        if (pieza.medidas && Array.isArray(pieza.medidas)) {
                                          return total + pieza.medidas.length;
                                        } else {
                                          return total + (parseInt(pieza.cantidad) || 1);
                                        }
                                      }, 0);
                                      const piezasFormulario = (piezaForm.medidas && Array.isArray(piezaForm.medidas)) ? piezaForm.medidas.length : 0;
                                      return piezasExistentes + piezasFormulario - 1;
                                    })()))).toLocaleString()}`}
                                  />
                                </Grid>
                              </>
                            )}
                            
                            {tipoInstalacion === 'personalizada' && (
                              <Grid item xs={12}>
                                <TextField
                                  label="💰 Precio personalizado (MXN)"
                                  type="number"
                                  fullWidth
                                  value={precioInstalacion}
                                  onChange={(e) => setPrecioInstalacion(e.target.value)}
                                  placeholder="Ingresa el precio personalizado..."
                                  helperText="Precio total personalizado para este proyecto específico"
                                />
                              </Grid>
                            )}
                          </Grid>
                          
                          {/* Campo de comentarios para instalación */}
                          <Box sx={{ mt: 2 }}>
                            <TextFieldConDictado
                              label="📝 Comentarios de instalación"
                              fullWidth
                              rows={3}
                              value={comentarios}
                              onChange={(e) => setComentarios(e.target.value)}
                              placeholder="Ej. Instalación requiere andamios, acceso vehicular limitado, horario especial..."
                              helperText="Notas especiales para el equipo de instalación"
                            />
                          </Box>
                        </Box>
                        </>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* Lista de Piezas */}
              {piezas.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    📋 Partidas Agregadas ({piezas.length})
                  </Typography>
                  {piezas.map((pieza, index) => {
                    // Calcular área total de la partida
                    let areaTotal = 0;
                    let cantidadPiezas = 0;
                    
                    if (pieza.medidas && Array.isArray(pieza.medidas)) {
                      // Formato nuevo con medidas individuales
                      areaTotal = pieza.medidas.reduce((total, medida) => total + (medida.area || 0), 0);
                      cantidadPiezas = pieza.medidas.length;
                    } else {
                      // Formato anterior para compatibilidad
                      const area = unidad === 'cm' ? (pieza.ancho * pieza.alto) / 10000 : pieza.ancho * pieza.alto;
                      areaTotal = area * (pieza.cantidad || 1);
                      cantidadPiezas = pieza.cantidad || 1;
                    }
                    
                    const precio = pieza.precioM2 || precioGeneral;
                    const subtotalM2 = areaTotal * precio;
                    
                    // Calcular costos adicionales
                    const productoEsToldo = esProductoToldo(pieza.producto) || pieza.esToldo;
                    const kitPrecio = productoEsToldo && pieza.kitPrecio ? parseFloat(pieza.kitPrecio) : 0;
                    
                    // Motorización: usar la nueva lógica corregida
                    const numMotores = pieza.numMotores || 1;
                    const motorPrecio = pieza.motorizado && pieza.motorPrecio ? parseFloat(pieza.motorPrecio) * numMotores : 0;
                    const controlPrecio = pieza.motorizado && pieza.controlPrecio ? 
                      (pieza.esControlMulticanal ? parseFloat(pieza.controlPrecio) : parseFloat(pieza.controlPrecio) * numMotores) : 0;
                    
                    const totalPartida = subtotalM2 + (kitPrecio * cantidadPiezas) + motorPrecio + controlPrecio;
                    
                    return (
                      <Card key={index} sx={{ mb: 2, border: 1, borderColor: 'grey.200' }}>
                        <CardContent sx={{ p: 2 }}>
                          {/* Encabezado de la partida */}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box>
                              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                📍 Partida {index + 1} – {pieza.ubicacion}
                              </Typography>
                              <Typography variant="body1" fontWeight="bold" color="primary.main">
                                {pieza.productoLabel || pieza.producto} ({cantidadPiezas} pieza{cantidadPiezas > 1 ? 's' : ''})
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <IconButton
                                onClick={() => handleEditarPieza(index)}
                                color="primary"
                                size="small"
                                title="Editar partida"
                              >
                                <span style={{ fontSize: '16px' }}>✏️</span>
                              </IconButton>
                              <IconButton
                                onClick={() => handleEliminarPieza(index)}
                                color="error"
                                size="small"
                                title="Eliminar partida"
                              >
                                <Delete />
                              </IconButton>
                            </Box>
                          </Box>

                          {/* Información básica */}
                          <Box sx={{ mb: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Grid container spacing={2}>
                              <Grid item xs={6} sm={3}>
                                <Typography variant="body2" color="text.secondary">Superficie:</Typography>
                                <Typography variant="body1" fontWeight="bold">📐 {areaTotal.toFixed(2)} m²</Typography>
                              </Grid>
                              {/* Campos de precio solo para Cotización en Vivo */}
                              {tipoVisitaInicial === 'cotizacion' && (
                                <>
                                  <Grid item xs={6} sm={3}>
                                    <Typography variant="body2" color="text.secondary">Precio m²:</Typography>
                                    <Typography variant="body1" fontWeight="bold">💲 ${precio.toLocaleString()}/m²</Typography>
                                  </Grid>
                                  <Grid item xs={6} sm={3}>
                                    <Typography variant="body2" color="text.secondary">Subtotal m²:</Typography>
                                    <Typography variant="body1" fontWeight="bold">💰 ${subtotalM2.toLocaleString()}</Typography>
                                  </Grid>
                                </>
                              )}
                              <Grid item xs={6} sm={3}>
                                <Typography variant="body2" color="text.secondary">Color:</Typography>
                                <Typography variant="body1" fontWeight="bold">🎨 {pieza.color || 'No especificado'}</Typography>
                              </Grid>
                            </Grid>
                          </Box>

                          {/* Detalle de medidas individuales */}
                          {pieza.medidas && Array.isArray(pieza.medidas) && pieza.medidas.length > 0 && (
                            <Box sx={{ mb: 2, p: 1.5, bgcolor: 'info.50', borderRadius: 1, border: '1px solid', borderColor: 'info.200' }}>
                              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: 'info.main' }}>
                                📏 Medidas individuales:
                              </Typography>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                {pieza.medidas.map((medida, medidaIndex) => (
                                  <Box key={medidaIndex} sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 1 }}>
                                    <Typography variant="body2" sx={{ minWidth: 20, color: 'info.main', fontWeight: 'bold' }}>
                                      {medidaIndex + 1}.
                                    </Typography>
                                    <Typography variant="body2">
                                      {medida.ancho}m × {medida.alto}m = {medida.area?.toFixed(2) || (medida.ancho * medida.alto).toFixed(2)} m²
                                    </Typography>
                                    {medida.producto && medida.producto !== pieza.producto && (
                                      <Typography variant="caption" color="text.secondary">
                                        ({medida.productoLabel || medida.producto})
                                      </Typography>
                                    )}
                                    {medida.color && medida.color !== pieza.color && (
                                      <Typography variant="caption" color="text.secondary">
                                        - {medida.color}
                                      </Typography>
                                    )}
                                    {/* Especificaciones técnicas */}
                                    {(medida.sistema || medida.sistemaEspecial || medida.galeria || medida.baseTabla) && (
                                      <Typography variant="caption" color="primary.main" sx={{ ml: 1 }}>
                                        {[
                                          medida.sistema && medida.sistema.length > 0 && `Sistema: ${medida.sistema.join(', ')}`,
                                          medida.sistemaEspecial && medida.sistemaEspecial.length > 0 && `Especial: ${medida.sistemaEspecial.join(', ')}`,
                                          medida.galeria && `Galería: ${medida.galeria}`,
                                          medida.baseTabla && `Base: ${medida.baseTabla}`
                                        ].filter(Boolean).join(' | ')}
                                      </Typography>
                                    )}
                                  </Box>
                                ))}
                              </Box>
                            </Box>
                          )}

                          {/* Desglose de incluidos */}
                          {(esProductoToldo || pieza.motorizado) && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: 'info.main' }}>
                                📦 Incluye:
                              </Typography>
                              <Box sx={{ pl: 2 }}>
                                {/* Kit de toldo */}
                                {esProductoToldo && kitPrecio > 0 && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                    <Typography variant="body2" sx={{ minWidth: 20 }}>•</Typography>
                                    <Typography variant="body2">
                                      {cantidadPiezas} Kit{cantidadPiezas > 1 ? 's' : ''} de Toldo ({pieza.kitModeloManual || pieza.kitModelo || 'Modelo estándar'}) 
                                      → ${kitPrecio.toLocaleString()} c/u → 
                                      <span style={{ fontWeight: 'bold', color: '#1976d2' }}> ${(kitPrecio * cantidadPiezas).toLocaleString()}</span>
                                    </Typography>
                                  </Box>
                                )}
                                
                                {/* Motores */}
                                {pieza.motorizado && motorPrecio > 0 && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                    <Typography variant="body2" sx={{ minWidth: 20 }}>•</Typography>
                                    <Typography variant="body2">
                                      {numMotores} Motor{numMotores > 1 ? 'es' : ''} ({pieza.motorModeloManual || pieza.motorModelo || 'Modelo estándar'}) 
                                      → ${(parseFloat(pieza.motorPrecio) || 0).toLocaleString()} c/u → 
                                      <span style={{ fontWeight: 'bold', color: '#1976d2' }}> ${motorPrecio.toLocaleString()}</span>
                                    </Typography>
                                  </Box>
                                )}
                                
                                {/* Controles */}
                                {pieza.motorizado && controlPrecio > 0 && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                    <Typography variant="body2" sx={{ minWidth: 20 }}>•</Typography>
                                    <Typography variant="body2">
                                      1 Control ({pieza.controlModeloManual || pieza.controlModelo || 'Modelo estándar'}) 
                                      → <span style={{ fontWeight: 'bold', color: '#1976d2' }}>${controlPrecio.toLocaleString()}</span>
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            </Box>
                          )}

                          {/* Total de la partida - Solo para Cotización en Vivo */}
                          {tipoVisitaInicial === 'cotizacion' && (
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1, borderTop: 1, borderColor: 'grey.200' }}>
                              <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                                Total Partida: ${totalPartida.toLocaleString()}
                              </Typography>
                            </Box>
                          )}

                          {/* Observaciones */}
                          {pieza.observaciones && (
                            <Box sx={{ mt: 2, p: 1, bgcolor: 'warning.50', borderRadius: 1, borderLeft: 3, borderColor: 'warning.main' }}>
                              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                💬 {pieza.observaciones}
                              </Typography>
                            </Box>
                          )}

                          {/* Fotos y videos */}
                          {((pieza.fotoUrls && pieza.fotoUrls.length > 0) || pieza.videoUrl) && (
                            <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              {pieza.fotoUrls && pieza.fotoUrls.length > 0 && (
                                <Chip 
                                  label={`📷 ${pieza.fotoUrls.length} foto${pieza.fotoUrls.length > 1 ? 's' : ''}`} 
                                  color="info" 
                                  size="small"
                                  onClick={() => pieza.fotoUrls.forEach(url => window.open(url, '_blank'))}
                                  sx={{ cursor: 'pointer' }}
                                />
                              )}
                              {pieza.videoUrl && (
                                <Chip 
                                  label="🎥 Video" 
                                  color="secondary" 
                                  size="small"
                                  onClick={() => window.open(pieza.videoUrl, '_blank')}
                                  sx={{ cursor: 'pointer' }}
                                />
                              )}
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>
              )}

              {/* Resumen */}
              {piezas.length > 0 && (
                <Card sx={{ bgcolor: 'info.50' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 1 }}>📊 Resumen de Medición</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="text.secondary">Total partidas:</Typography>
                        <Typography variant="body1" fontWeight="bold">🔢 {piezas.length}</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="text.secondary">Área total:</Typography>
                        <Typography variant="body1" fontWeight="bold" color="primary">📐 {calcularTotalM2.toFixed(2)} m²</Typography>
                      </Grid>
                      {/* Campos de precio solo para Cotización en Vivo */}
                      {tipoVisitaInicial === 'cotizacion' && (
                        <>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="body2" color="text.secondary">Subtotal productos:</Typography>
                            <Typography variant="body1" fontWeight="bold">💰 ${calcularSubtotalProductos.toLocaleString()}</Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="body2" color="text.secondary">
                              {aplicaDescuento ? 'Total final:' : (cobraInstalacion ? 'Total con instalación:' : 'Total estimado:')}
                            </Typography>
                            <Typography variant="body1" fontWeight="bold" color="success.main">
                              💵 ${(requiereFactura ? totalConIVA : totalFinal).toLocaleString()}
                            </Typography>
                          </Grid>
                        </>
                      )}
                    </Grid>
                    
                    {/* Desglose de instalación si está activada - SIEMPRE MOSTRAR SI ESTÁ ACTIVADA */}
                    {cobraInstalacion && (
                      <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.50', borderRadius: 1, border: '1px solid', borderColor: 'warning.200' }}>
                        <Typography variant="body2" fontWeight="medium" color="warning.dark">
                          🔧 Instalación {(() => {
                            const totalPiezas = piezas.reduce((total, pieza) => {
                              if (pieza.medidas && Array.isArray(pieza.medidas)) {
                                return total + pieza.medidas.length;
                              } else {
                                return total + (parseInt(pieza.cantidad) || 1);
                              }
                            }, 0);
                            
                            const piezasFormulario = (piezaForm.medidas && Array.isArray(piezaForm.medidas)) 
                              ? piezaForm.medidas.length 
                              : 0;
                            
                            const totalPiezasCompleto = totalPiezas + piezasFormulario;
                            
                            let precioTotal = 0;
                            let descripcion = '';
                            
                            if (tipoInstalacion === 'fijo') {
                              precioTotal = parseFloat(precioInstalacion || 0);
                              descripcion = 'fijo total';
                            } else if (tipoInstalacion === 'por_pieza') {
                              precioTotal = parseFloat(precioInstalacion || 0) * totalPiezasCompleto;
                              descripcion = `por pieza (${totalPiezasCompleto} pzs)`;
                            } else if (tipoInstalacion === 'base_mas_pieza') {
                              const precioBase = parseFloat(precioInstalacion || 0);
                              const precioPorPieza = parseFloat(precioInstalacionPorPieza || 0);
                              const piezasAdicionales = Math.max(0, totalPiezasCompleto - 1);
                              precioTotal = precioBase + (precioPorPieza * piezasAdicionales);
                              descripcion = `base + ${piezasAdicionales} pzs adicionales`;
                            }
                            
                            return `${descripcion}: +$${precioTotal.toLocaleString()}`;
                          })()}
                        </Typography>
                      </Box>
                    )}
                    
                    {/* Desglose de descuento si está activado */}
                    {aplicaDescuento && valorDescuento && (
                      <Box sx={{ mt: 2, p: 2, bgcolor: 'success.50', borderRadius: 1, border: '1px solid', borderColor: 'success.200' }}>
                        <Typography variant="body2" fontWeight="medium" color="success.dark">
                          💸 Descuento {tipoDescuento === 'porcentaje' ? `(${valorDescuento}%)` : 'fijo'}: -${calcularDescuento.toLocaleString()}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        )}

        {/* Descuentos - Solo aparece cuando hay partidas y es Cotización en Vivo */}
        {piezas.length > 0 && tipoVisitaInicial === 'cotizacion' && (
          <Card sx={{ mb: 2, bgcolor: 'success.50', border: 2, borderColor: 'success.200' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  💰 Descuentos para Cerrar Venta
                </Typography>
                <Button
                  variant={aplicaDescuento ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setAplicaDescuento(!aplicaDescuento)}
                  sx={{ 
                    bgcolor: aplicaDescuento ? '#16a34a' : 'transparent',
                    color: aplicaDescuento ? 'white' : '#16a34a',
                    borderColor: '#16a34a',
                    '&:hover': { 
                      bgcolor: aplicaDescuento ? '#15803d' : '#f0fdf4',
                      borderColor: '#15803d'
                    }
                  }}
                >
                  {aplicaDescuento ? '✅ Activado' : '➕ Activar'}
                </Button>
              </Box>
              
              {aplicaDescuento && (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Aplica descuentos por porcentaje o monto fijo para cerrar la venta
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        select
                        label="Tipo de descuento"
                        fullWidth
                        value={tipoDescuento}
                        onChange={(e) => setTipoDescuento(e.target.value)}
                        SelectProps={{ native: true }}
                      >
                        <option value="porcentaje">Porcentaje (%)</option>
                        <option value="monto">Monto fijo ($)</option>
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label={tipoDescuento === 'porcentaje' ? '📊 Porcentaje (%)' : '💵 Monto (MXN)'}
                        type="number"
                        fullWidth
                        value={valorDescuento}
                        onChange={(e) => setValorDescuento(e.target.value)}
                        placeholder={tipoDescuento === 'porcentaje' ? 'Ej. 5, 10, 15...' : 'Ej. 1000, 2500, 5000...'}
                        helperText={tipoDescuento === 'porcentaje' ? 'Porcentaje de descuento' : 'Monto fijo a descontar'}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      {valorDescuento && (
                        <Box sx={{ p: 2, bgcolor: 'success.100', borderRadius: 1, border: '1px solid', borderColor: 'success.300' }}>
                          <Typography variant="body2" color="success.dark" fontWeight="bold">
                            💸 Descuento: ${calcularDescuento.toLocaleString()}
                          </Typography>
                          <Typography variant="caption" color="success.dark">
                            {tipoDescuento === 'porcentaje' ? `${valorDescuento}% de descuento` : 'Descuento fijo'}
                          </Typography>
                        </Box>
                      )}
                    </Grid>
                  </Grid>
                </Box>
              )}
            </CardContent>
          </Card>
        )}

        {/* Sección de Facturación y Términos - Solo aparece cuando hay partidas y es Cotización en Vivo */}
        {piezas.length > 0 && tipoVisitaInicial === 'cotizacion' && (
          <Card sx={{ mb: 2, bgcolor: 'warning.50', border: 2, borderColor: 'warning.200' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                📋 Facturación y Método de Pago
              </Typography>
              
              <Grid container spacing={2}>
                {/* Casilla de Factura */}
                <Grid item xs={12} sm={4}>
                  <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 1, border: '1px solid', borderColor: 'grey.300' }}>
                    <Typography variant="body1" fontWeight="medium" sx={{ mb: 1 }}>¿Requiere Factura?</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant={!requiereFactura ? 'contained' : 'outlined'}
                        size="small"
                        onClick={() => setRequiereFactura(false)}
                        sx={{ 
                          bgcolor: !requiereFactura ? '#f57c00' : 'transparent',
                          color: !requiereFactura ? 'white' : '#f57c00',
                          borderColor: '#f57c00',
                          '&:hover': { 
                            bgcolor: !requiereFactura ? '#ef6c00' : '#fff3e0',
                            borderColor: '#ef6c00'
                          }
                        }}
                      >
                        ❌ No
                      </Button>
                      <Button
                        variant={requiereFactura ? 'contained' : 'outlined'}
                        size="small"
                        onClick={() => setRequiereFactura(true)}
                        sx={{ 
                          bgcolor: requiereFactura ? '#f57c00' : 'transparent',
                          color: requiereFactura ? 'white' : '#f57c00',
                          borderColor: '#f57c00',
                          '&:hover': { 
                            bgcolor: requiereFactura ? '#ef6c00' : '#fff3e0',
                            borderColor: '#ef6c00'
                          }
                        }}
                      >
                        ✅ Sí
                      </Button>
                    </Box>
                  </Box>
                </Grid>

                {/* Desglose de Totales */}
                <Grid item xs={12} sm={8}>
                  <Box sx={{ p: 2, bgcolor: 'info.50', borderRadius: 1, border: '1px solid', borderColor: 'info.200' }}>
                    <Typography variant="subtitle2" fontWeight="bold" color="info.dark" sx={{ mb: 1 }}>
                      💰 Desglose de Totales:
                    </Typography>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">Subtotal productos:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        ${calcularSubtotalProductos.toLocaleString()}
                      </Typography>
                    </Box>
                    
                    {cobraInstalacion && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">Instalación:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          ${(() => {
                            if (tipoInstalacion === 'fijo') {
                              return parseFloat(precioInstalacion || 0).toLocaleString();
                            } else if (tipoInstalacion === 'por_pieza') {
                              const totalPiezasCompleto = (() => {
                                const piezasExistentes = piezas.reduce((total, pieza) => {
                                  if (pieza.medidas && Array.isArray(pieza.medidas)) {
                                    return total + pieza.medidas.length;
                                  } else {
                                    return total + (parseInt(pieza.cantidad) || 1);
                                  }
                                }, 0);
                                const piezasFormulario = (piezaForm.medidas && Array.isArray(piezaForm.medidas)) ? piezaForm.medidas.length : 0;
                                return piezasExistentes + piezasFormulario;
                              })();
                              return (parseFloat(precioInstalacion || 0) * totalPiezasCompleto).toLocaleString();
                            } else if (tipoInstalacion === 'base_mas_pieza') {
                              const totalPiezasCompleto = (() => {
                                const piezasExistentes = piezas.reduce((total, pieza) => {
                                  if (pieza.medidas && Array.isArray(pieza.medidas)) {
                                    return total + pieza.medidas.length;
                                  } else {
                                    return total + (parseInt(pieza.cantidad) || 1);
                                  }
                                }, 0);
                                const piezasFormulario = (piezaForm.medidas && Array.isArray(piezaForm.medidas)) ? piezaForm.medidas.length : 0;
                                return piezasExistentes + piezasFormulario;
                              })();
                              const precioBase = parseFloat(precioInstalacion || 0);
                              const precioPorPieza = parseFloat(precioInstalacionPorPieza || 0);
                              const piezasAdicionales = Math.max(0, totalPiezasCompleto - 1);
                              return (precioBase + (precioPorPieza * piezasAdicionales)).toLocaleString();
                            } else {
                              return parseFloat(precioInstalacion || 0).toLocaleString();
                            }
                          })()}
                        </Typography>
                      </Box>
                    )}
                    
                    {aplicaDescuento && valorDescuento && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">Descuento:</Typography>
                        <Typography variant="body2" fontWeight="bold" color="success.dark">
                          -${calcularDescuento.toLocaleString()}
                        </Typography>
                      </Box>
                    )}
                    
                    {requiereFactura && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">IVA (16%):</Typography>
                        <Typography variant="body2" fontWeight="bold" color="warning.dark">
                          ${calcularIVA.toLocaleString()}
                        </Typography>
                      </Box>
                    )}
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: 1, borderColor: 'grey.300' }}>
                      <Typography variant="body1" fontWeight="bold">Total Final:</Typography>
                      <Typography variant="body1" fontWeight="bold" color="success.main">
                        ${(requiereFactura ? totalConIVA : totalFinal).toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                {/* Método de Pago */}
                <Grid item xs={12}>
                  <Box sx={{ p: 2, bgcolor: 'success.50', borderRadius: 1, border: '1px solid', borderColor: 'success.200' }}>
                    <Typography variant="subtitle2" fontWeight="bold" color="success.dark" sx={{ mb: 2 }}>
                      💳 Método de Pago (60% Anticipo - 40% Saldo):
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 1, border: '1px solid', borderColor: 'success.300' }}>
                          <Typography variant="body2" color="text.secondary">Anticipo (60%):</Typography>
                          <Typography variant="h6" fontWeight="bold" color="success.dark">
                            ${anticipo.toLocaleString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Al confirmar pedido
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 1, border: '1px solid', borderColor: 'info.300' }}>
                          <Typography variant="body2" color="text.secondary">Saldo (40%):</Typography>
                          <Typography variant="h6" fontWeight="bold" color="info.dark">
                            ${saldo.toLocaleString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Contra entrega/instalación
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          select
                          label="Método de Pago del Anticipo"
                          fullWidth
                          value={metodoPagoAnticipo}
                          onChange={(e) => setMetodoPagoAnticipo(e.target.value)}
                          helperText="¿Cómo pagará el anticipo?"
                          size="small"
                        >
                          <MenuItem value="">Seleccionar...</MenuItem>
                          <MenuItem value="efectivo">💵 Efectivo</MenuItem>
                          <MenuItem value="transferencia">🏦 Transferencia</MenuItem>
                          <MenuItem value="tarjeta_credito">💳 Tarjeta de Crédito</MenuItem>
                          <MenuItem value="tarjeta_debito">💳 Tarjeta de Débito</MenuItem>
                          <MenuItem value="cheque">📄 Cheque</MenuItem>
                          <MenuItem value="deposito">🏧 Depósito Bancario</MenuItem>
                          <MenuItem value="otro">🔄 Otro</MenuItem>
                        </TextField>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>

                {/* Términos Comerciales */}
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'white', borderRadius: 1, border: '1px solid', borderColor: 'grey.300' }}>
                    <Typography variant="body1" fontWeight="medium">Incluir términos comerciales:</Typography>
                    <Button
                      variant={incluirTerminos ? 'contained' : 'outlined'}
                      size="small"
                      onClick={() => setIncluirTerminos(!incluirTerminos)}
                      sx={{ 
                        bgcolor: incluirTerminos ? '#1976d2' : 'transparent',
                        color: incluirTerminos ? 'white' : '#1976d2',
                        borderColor: '#1976d2',
                        '&:hover': { 
                          bgcolor: incluirTerminos ? '#1565c0' : '#e3f2fd',
                          borderColor: '#1565c0'
                        }
                      }}
                    >
                      {incluirTerminos ? '✅ Sí' : '❌ No'}
                    </Button>
                  </Box>
                  
                  {/* Términos comerciales */}
                  {incluirTerminos && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'grey.300' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', lineHeight: 1.3 }}>
                        <strong>CONDICIONES DE CRÉDITO:</strong> 60% DE ANTICIPO, RESTO CONTRA ORDEN DE EMBARQUE O INSTALACIÓN, CON 3 AÑOS DE GARANTÍA.<br/>
                        <strong>POR SER NUESTROS PRODUCTOS HECHOS A LA MEDIDA,</strong> NO SE ACEPTAN CAMBIOS NI CANCELACIONES UNA VEZ GENERADO EL PAGO DEL ANTICIPO.<br/>
                        {requiereFactura ? 
                          <strong>PRECIO CON IVA INCLUIDO.</strong> :
                          <strong>PRECIOS SUJETOS A CAMBIO SIN PREVIO AVISO.</strong>
                        }
                      </Typography>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Sección de Tiempo de Entrega - Solo aparece cuando hay partidas */}
        {piezas.length > 0 && (
          <Card sx={{ mb: 2, bgcolor: 'info.50', border: 2, borderColor: 'info.200' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                🚚 Tiempo de Entrega
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    select
                    label="Tipo de entrega"
                    fullWidth
                    value={tiempoEntrega}
                    onChange={(e) => setTiempoEntrega(e.target.value)}
                  >
                    <MenuItem value="normal">Normal</MenuItem>
                    <MenuItem value="expres">Exprés</MenuItem>
                  </TextField>
                </Grid>
                
                {tiempoEntrega === 'expres' && (
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Días exprés"
                      type="number"
                      fullWidth
                      value={diasExpres}
                      onChange={(e) => setDiasExpres(e.target.value)}
                      placeholder="Ej. 5, 7, 10"
                      helperText="Días hábiles para entrega"
                      inputProps={{ min: 1, max: 30 }}
                    />
                  </Grid>
                )}
                
                <Grid item xs={12} sm={4}>
                  <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 1, border: '1px solid', borderColor: 'info.300' }}>
                    <Typography variant="body2" color="text.secondary">Fecha estimada de entrega:</Typography>
                    <Typography variant="body1" fontWeight="bold" color="info.dark">
                      📅 {calcularFechaEntrega.toLocaleDateString('es-MX', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {tiempoEntrega === 'expres' && diasExpres ? 
                        `${diasExpres} días hábiles` : 
                        `${piezas.some(p => p.producto === 'antihuracan') ? '6-8 semanas' : 
                          piezas.some(p => p.producto === 'cortina_tradicional') ? '4 semanas' : 
                          '15 días hábiles'}`
                      }
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Comentarios */}
        <TextFieldConDictado
          label="Observaciones"
          rows={4}
          fullWidth
          value={comentarios}
          onChange={(e) => setComentarios(e.target.value)}
          placeholder="Comentarios adicionales sobre esta etapa..."
          sx={{ mb: 2 }}
        />

        {errorLocal && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorLocal}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
        <Button 
          onClick={cerrarModal} 
          variant="outlined"
          sx={{ color: '#6B7280', borderColor: '#6B7280' }}
        >
          Cancelar
        </Button>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {/* Botón Generar Cotización - Solo para Visita Inicial con piezas */}
          {nombreEtapa === 'Visita Inicial / Medición' && piezas.length > 0 && (
            <Button
              onClick={handleGenerarCotizacion}
              disabled={generandoCotizacion || guardando || guardandoPedido || guardandoPDF}
              variant="contained"
              startIcon={<span>💰</span>}
              sx={{ bgcolor: '#16A34A', '&:hover': { bgcolor: '#15803D' } }}
            >
              {generandoCotizacion ? 'Generando...' : 'Generar Cotización'}
            </Button>
          )}
          
          {/* Botón Ver PDF - Solo cuando hay piezas */}
          {piezas.length > 0 && (
            <Button
              onClick={handleVerPDF}
              disabled={guardandoPDF || guardando || generandoCotizacion || guardandoPedido}
              variant="contained"
              startIcon={guardandoPDF ? <span>⏳</span> : <span>📄</span>}
              sx={{ 
                bgcolor: guardandoPDF ? '#9CA3AF' : '#DC2626', 
                '&:hover': { bgcolor: guardandoPDF ? '#9CA3AF' : '#B91C1C' },
                '&:disabled': { bgcolor: '#9CA3AF', color: '#6B7280' }
              }}
            >
              {guardandoPDF ? 'Generando PDF...' : 'Ver PDF'}
            </Button>
          )}
          
          {/* Botón Crear Proyecto - Solo cuando hay piezas */}
          {piezas.length > 0 && (
            <Button
              onClick={handleAgregarPedido}
              disabled={guardandoPedido || guardando || generandoCotizacion || guardandoPDF}
              variant="contained"
              startIcon={<span>📦</span>}
              sx={{ bgcolor: '#1976D2', '&:hover': { bgcolor: '#1565C0' } }}
            >
              {guardandoPedido ? 'Creando Proyecto...' : 'Crear Proyecto'}
            </Button>
          )}
          
          {/* Botón específico para Levantamiento Técnico */}
          {tipoVisitaInicial === 'levantamiento' && (
            <Button
              onClick={handleGuardarEtapa}
              disabled={guardando || generandoCotizacion || guardandoPedido || guardandoPDF}
              variant="contained"
              sx={{ bgcolor: '#16A34A', '&:hover': { bgcolor: '#15803D' } }}
            >
              {guardando ? 'Guardando...' : '💾 Guardar Etapa'}
            </Button>
          )}
          
          {/* Botón general para otros tipos */}
          {tipoVisitaInicial !== 'levantamiento' && (
            <Button
              onClick={handleGuardarEtapa}
              disabled={guardando || generandoCotizacion || guardandoPedido || guardandoPDF}
              variant="contained"
              sx={{ bgcolor: '#D4AF37', '&:hover': { bgcolor: '#B8860B' } }}
            >
              {guardando ? 'Guardando...' : 'Agregar Etapa'}
            </Button>
          )}
        </Box>
      </DialogActions>

      {/* Modal de Captura de Pantalla */}
      <CapturaModal
        open={capturaModalOpen}
        onClose={() => setCapturaModalOpen(false)}
        titulo="Captura para Soporte - Agregar Etapa"
      />
      
      {/* Modal de Inspector de Elementos */}
      <InspectorElementos
        open={inspectorModalOpen}
        onClose={() => setInspectorModalOpen(false)}
      />

      {/* Modal de Advertencia para Excel */}
      <Dialog 
        open={mostrarAdvertenciaExcel} 
        onClose={() => setMostrarAdvertenciaExcel(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ 
          bgcolor: '#16A34A', 
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          📊 Exportar Excel Completo - Verificación de Datos
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              🔒 <strong>IMPORTANTE:</strong> Este Excel será la fuente única de verdad para fabricación.
            </Typography>
            <Typography variant="body2">
              Verifica que toda la información esté completa antes de exportar.
            </Typography>
          </Alert>

          {/* Errores críticos */}
          {validacionExcel.errores && validacionExcel.errores.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                ❌ Errores que deben corregirse:
              </Typography>
              {validacionExcel.errores.map((error, index) => (
                <Typography key={index} variant="body2" sx={{ ml: 2 }}>
                  • {error}
                </Typography>
              ))}
            </Alert>
          )}

          {/* Advertencias */}
          {validacionExcel.advertencias && validacionExcel.advertencias.length > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                ⚠️ Advertencias (opcional pero recomendado):
              </Typography>
              {validacionExcel.advertencias.map((advertencia, index) => (
                <Typography key={index} variant="body2" sx={{ ml: 2 }}>
                  • {advertencia}
                </Typography>
              ))}
            </Alert>
          )}

          {/* Datos completos */}
          {validacionExcel.datosCompletos && validacionExcel.datosCompletos.length > 0 && (
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                ✅ Información completa detectada:
              </Typography>
              {validacionExcel.datosCompletos.map((dato, index) => (
                <Typography key={index} variant="body2" sx={{ ml: 2 }}>
                  • {dato}
                </Typography>
              ))}
            </Alert>
          )}

          <Box sx={{ 
            bgcolor: '#f5f5f5', 
            p: 2, 
            borderRadius: 1, 
            border: '1px solid #ddd',
            mt: 2
          }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              📋 El Excel incluirá:
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="body2">• Medidas exactas por pieza</Typography>
                <Typography variant="body2">• Información técnica completa</Typography>
                <Typography variant="body2">• Precios y cálculos</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">• Instalación especial</Typography>
                <Typography variant="body2">• Descuentos aplicados</Typography>
                <Typography variant="body2">• Observaciones generales</Typography>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setMostrarAdvertenciaExcel(false)}
            color="inherit"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDescargarExcel}
            variant="contained"
            disabled={validacionExcel.errores && validacionExcel.errores.length > 0}
            sx={{ 
              bgcolor: '#16A34A', 
              '&:hover': { bgcolor: '#15803D' },
              fontWeight: 'bold'
            }}
            startIcon={descargandoExcel ? null : <CloudUpload />}
          >
            {descargandoExcel ? 'Generando Excel...' : 'Confirmar y Exportar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default AgregarEtapaModal;

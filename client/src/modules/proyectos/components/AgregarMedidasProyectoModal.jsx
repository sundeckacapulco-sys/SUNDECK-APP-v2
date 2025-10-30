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
  IconButton,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  Add,
  Delete,
  Close,
  ContentCopy,
  BugReport,
  Search,
  Edit,
  ExpandMore,
  ExpandLess,
  PictureAsPdf
} from '@mui/icons-material';

// Importar hooks y utilidades
import usePiezasManager from '../../../components/Prospectos/hooks/usePiezasManager';
import { 
  mapearPiezaParaDocumento,
  crearResumenEconomico,
  crearInfoFacturacion,
  crearMetodoPago
} from '../../../utils/cotizacionEnVivo';
import { 
  productosOptions as productosOptionsBase,
  modelosControles,
  modelosMotores
} from '../../../components/Prospectos/AgregarEtapaModal.constants';
import axiosConfig from '../../../config/axios';

// Importar modales de soporte
import CapturaModal from '../../../components/Common/CapturaModal';
import InspectorElementos from '../../../components/Common/InspectorElementos';

/**
 * Modal para agregar medidas en el módulo de Proyectos
 * Reemplaza AgregarEtapaModal en el contexto de proyectos unificados
 * 
 * @param {boolean} open - Estado de apertura del modal
 * @param {function} onClose - Función para cerrar el modal
 * @param {object} proyecto - Objeto del proyecto actual
 * @param {function} onActualizar - Callback para actualizar la vista
 * @param {boolean} conPrecios - Si true, muestra campos de cotización (viene del modal selector)
 */
const AgregarMedidasProyectoModal = ({ 
  open, 
  onClose, 
  proyecto, 
  onActualizar,
  conPrecios = false 
}) => {
  // ==================== ESTADOS BÁSICOS ====================
  const [unidad, setUnidad] = useState('m');
  const [comentarios, setComentarios] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [guardandoPDF, setGuardandoPDF] = useState(false);
  const [ultimoClickPDF, setUltimoClickPDF] = useState(0);
  const [errorLocal, setErrorLocal] = useState('');
  
  // Estados para modales de soporte
  const [capturaModalOpen, setCapturaModalOpen] = useState(false);
  const [inspectorModalOpen, setInspectorModalOpen] = useState(false);
  
  // ==================== ESTADOS DE COTIZACIÓN (Solo si conPrecios=true) ====================
  const [precioGeneral, setPrecioGeneral] = useState(750);
  const [aplicaDescuento, setAplicaDescuento] = useState(false);
  const [tipoDescuento, setTipoDescuento] = useState('porcentaje');
  const [valorDescuento, setValorDescuento] = useState('');
  const [requiereFactura, setRequiereFactura] = useState(false);
  const [razonSocial, setRazonSocial] = useState('');
  const [rfc, setRfc] = useState('');
  const [cobraInstalacion, setCobraInstalacion] = useState(false);
  const [precioInstalacion, setPrecioInstalacion] = useState('');
  const [precioInstalacionPorPieza, setPrecioInstalacionPorPieza] = useState('');
  const [tipoInstalacion, setTipoInstalacion] = useState('fijo');
  const [incluirTerminos, setIncluirTerminos] = useState(true);
  
  // Estados para levantamiento técnico
  const [personaVisita, setPersonaVisita] = useState('');
  const [fechaCotizacion, setFechaCotizacion] = useState('');
  
  // Estado para panel desplegable de detalles
  const [partidaExpandida, setPartidaExpandida] = useState(null);
  
  // Estados para acordeones internos (Nivel 2 y 3)
  const [medidasExpandidas, setMedidasExpandidas] = useState({});
  const [piezaExpandida, setPiezaExpandida] = useState({});
  const [motorizacionExpandida, setMotorizacionExpandida] = useState({});
  const [instalacionExpandida, setInstalacionExpandida] = useState({});
  const [observacionesExpandida, setObservacionesExpandida] = useState({});
  
  // ==================== ESTADOS PARA PRODUCTOS PERSONALIZADOS ====================
  const [productosPersonalizados, setProductosPersonalizados] = useState([]);
  const [mostrarNuevoProducto, setMostrarNuevoProducto] = useState(false);
  const [nuevoProductoNombre, setNuevoProductoNombre] = useState('');
  
  // Combinar productos base con personalizados
  const productosOptions = useMemo(() => {
    return [...productosOptionsBase, ...productosPersonalizados];
  }, [productosPersonalizados]);
  
  // ==================== HOOK DE GESTIÓN DE PIEZAS ====================
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
    todosLosProductos: productosOptions,
    precioGeneral,
    setErrorLocal
  });
  
  // ==================== FUNCIONES DE UTILIDAD ====================
  
  /**
   * Función para cerrar el modal y resetear estados
   */
  const cerrarModal = () => {
    resetPiezas();
    setComentarios('');
    setErrorLocal('');
    setPrecioGeneral(750);
    setAplicaDescuento(false);
    setValorDescuento('');
    setRequiereFactura(false);
    setCobraInstalacion(false);
    setPrecioInstalacion('');
    setPersonaVisita('');
    setFechaCotizacion('');
    onClose();
  };
  
  /**
   * Obtener ID del proyecto
   */
  const getProyectoId = () => {
    return proyecto?._id || null;
  };
  
  /**
   * Crear producto personalizado
   */
  const handleCrearNuevoProducto = () => {
    if (!nuevoProductoNombre.trim()) {
      setErrorLocal('Debes ingresar un nombre para el producto personalizado');
      return;
    }
    
    const nuevoProducto = {
      label: nuevoProductoNombre.trim(),
      value: `custom_${Date.now()}`,
      esPersonalizado: true
    };
    
    setProductosPersonalizados(prev => [...prev, nuevoProducto]);
    setPiezaForm(prev => ({
      ...prev,
      producto: nuevoProducto.value,
      productoLabel: nuevoProducto.label
    }));
    
    setMostrarNuevoProducto(false);
    setNuevoProductoNombre('');
    setErrorLocal('');
  };
  
  // ==================== EFECTOS ====================
  
  /**
   * Resetear estados al abrir/cerrar el modal
   */
  useEffect(() => {
    if (!open) {
      resetPiezas();
      setErrorLocal('');
    }
  }, [open, resetPiezas]);
  
  // ==================== CÁLCULOS AUTOMÁTICOS (FASE 3) ====================
  
  // Calcular total de m² de todas las partidas
  const calcularTotalM2 = useMemo(() => {
    return piezas.reduce((total, pieza) => {
      const areaTotal = pieza.medidas?.reduce((sum, m) => {
        const ancho = parseFloat(m.ancho) || 0;
        const alto = parseFloat(m.alto) || 0;
        return sum + (ancho * alto);
      }, 0) || 0;
      return total + areaTotal;
    }, 0);
  }, [piezas]);
  
  // Calcular subtotal de productos (m² × precio)
  const calcularSubtotalProductos = useMemo(() => {
    return piezas.reduce((total, pieza) => {
      const areaTotal = pieza.medidas?.reduce((sum, m) => {
        const ancho = parseFloat(m.ancho) || 0;
        const alto = parseFloat(m.alto) || 0;
        return sum + (ancho * alto);
      }, 0) || 0;
      const precioM2 = parseFloat(pieza.precioM2) || precioGeneral;
      return total + (areaTotal * precioM2);
    }, 0);
  }, [piezas, precioGeneral]);
  
  // Calcular total de motorización
  const calcularTotalMotorizacion = useMemo(() => {
    return piezas.reduce((total, pieza) => {
      if (!pieza.motorizado) return total;
      const costoMotor = parseFloat(pieza.motorPrecio || 0) * (pieza.numMotores || 1);
      const costoControl = parseFloat(pieza.controlPrecio || 0);
      return total + costoMotor + costoControl;
    }, 0);
  }, [piezas]);
  
  // Calcular total de instalación
  const calcularTotalInstalacion = useMemo(() => {
    return piezas.reduce((total, pieza) => {
      if (!pieza.cobraInstalacion) return total;
      
      const cantidad = pieza.cantidad || 1;
      const precioBase = parseFloat(pieza.precioInstalacion || 0);
      const precioPorPieza = parseFloat(pieza.precioInstalacionPorPieza || 0);
      
      let costoInstalacion = 0;
      if (pieza.tipoInstalacion === 'fijo') {
        costoInstalacion = precioBase;
      } else if (pieza.tipoInstalacion === 'por_pieza') {
        costoInstalacion = cantidad * precioBase;
      } else if (pieza.tipoInstalacion === 'base_mas_pieza') {
        costoInstalacion = precioBase + (Math.max(0, cantidad - 1) * precioPorPieza);
      }
      
      return total + costoInstalacion;
    }, 0);
  }, [piezas]);
  
  // Calcular subtotal (productos + motorización + instalación)
  const calcularSubtotal = useMemo(() => {
    return calcularSubtotalProductos + calcularTotalMotorizacion + calcularTotalInstalacion;
  }, [calcularSubtotalProductos, calcularTotalMotorizacion, calcularTotalInstalacion]);
  
  // Calcular descuento
  const calcularDescuento = useMemo(() => {
    if (!aplicaDescuento || !valorDescuento) return 0;
    
    const subtotal = calcularSubtotal;
    if (tipoDescuento === 'porcentaje') {
      return subtotal * (parseFloat(valorDescuento) / 100);
    } else {
      return parseFloat(valorDescuento);
    }
  }, [aplicaDescuento, valorDescuento, tipoDescuento, calcularSubtotal]);
  
  // Calcular subtotal con descuento
  const calcularSubtotalConDescuento = useMemo(() => {
    return calcularSubtotal - calcularDescuento;
  }, [calcularSubtotal, calcularDescuento]);
  
  // Calcular IVA (16%)
  const calcularIVA = useMemo(() => {
    if (!requiereFactura) return 0;
    return calcularSubtotalConDescuento * 0.16;
  }, [requiereFactura, calcularSubtotalConDescuento]);
  
  // Calcular GRAN TOTAL
  const calcularGranTotal = useMemo(() => {
    return calcularSubtotalConDescuento + calcularIVA;
  }, [calcularSubtotalConDescuento, calcularIVA]);
  
  // ==================== FUNCIONES DE GUARDADO (Implementaremos en FASE 4) ====================
  
  /**
   * FASE 4: Validar 13 campos técnicos obligatorios por pieza
   */
  const validarCamposTecnicos = (pieza) => {
    const errores = [];
    
    // Validar medidas
    pieza.medidas.forEach((medida, index) => {
      if (!medida.ancho || medida.ancho <= 0) {
        errores.push(`Pieza ${index + 1}: Ancho debe ser mayor a 0`);
      }
      if (!medida.alto || medida.alto <= 0) {
        errores.push(`Pieza ${index + 1}: Alto debe ser mayor a 0`);
      }
      
      // Campos técnicos obligatorios
      if (!medida.sistema || medida.sistema.length === 0) {
        errores.push(`Pieza ${index + 1}: Sistema es obligatorio`);
      }
      if (!medida.tipoControl) {
        errores.push(`Pieza ${index + 1}: Control es obligatorio`);
      }
      if (!medida.tipoInstalacion) {
        errores.push(`Pieza ${index + 1}: Tipo de instalación es obligatorio`);
      }
      if (!medida.tipoFijacion) {
        errores.push(`Pieza ${index + 1}: Tipo de fijación es obligatorio`);
      }
      if (!medida.caida && !medida.orientacion) {
        errores.push(`Pieza ${index + 1}: Caída/Orientación es obligatoria`);
      }
      if (!medida.galeria) {
        errores.push(`Pieza ${index + 1}: Galería es obligatoria`);
      }
      if (!medida.modoOperacion) {
        errores.push(`Pieza ${index + 1}: Modo de operación es obligatorio`);
      }
      
      // Si es motorizado, validar motorización
      if (medida.modoOperacion === 'motorizado' && pieza.motorizado) {
        if (!pieza.motorModelo) {
          errores.push(`Partida ${pieza.ubicacion}: Modelo de motor es obligatorio`);
        }
      }
    });
    
    return errores;
  };
  
  /**
   * FASE 4: Calcular totales de partida
   */
  const calcularTotalesPartida = (pieza, conPrecios = false) => {
    let totalM2 = 0;
    let subtotal = 0;
    
    // Calcular m² totales
    pieza.medidas.forEach(medida => {
      const ancho = parseFloat(medida.ancho) || 0;
      const alto = parseFloat(medida.alto) || 0;
      const m2 = ancho * alto;
      totalM2 += m2;
      
      if (conPrecios) {
        const precio = parseFloat(medida.precioM2) || parseFloat(precioGeneral) || 0;
        subtotal += m2 * precio;
      }
    });
    
    // Agregar motorización si aplica
    let costoMotorizacion = 0;
    if (pieza.motorizado && conPrecios) {
      const precioMotor = parseFloat(pieza.motorPrecio) || 0;
      const numMotores = parseInt(pieza.numMotores) || 0;
      const precioControl = parseFloat(pieza.controlPrecio) || 0;
      
      costoMotorizacion = (numMotores * precioMotor) + precioControl;
      subtotal += costoMotorizacion;
    }
    
    // Agregar instalación especial si aplica
    let costoInstalacion = 0;
    if (pieza.cobraInstalacion && conPrecios) {
      const precioBase = parseFloat(pieza.precioInstalacion) || 0;
      const precioPorPieza = parseFloat(pieza.precioInstalacionPorPieza) || 0;
      const cantidad = parseInt(pieza.cantidad) || 1;
      
      if (pieza.tipoInstalacion === 'fijo') {
        costoInstalacion = precioBase;
      } else if (pieza.tipoInstalacion === 'por_pieza') {
        costoInstalacion = cantidad * precioBase;
      } else if (pieza.tipoInstalacion === 'base_mas_pieza') {
        costoInstalacion = precioBase + ((cantidad - 1) * precioPorPieza);
      }
      
      subtotal += costoInstalacion;
    }
    
    return {
      m2: parseFloat(totalM2.toFixed(2)),
      subtotal: parseFloat(subtotal.toFixed(2)),
      costoMotorizacion: parseFloat(costoMotorizacion.toFixed(2)),
      costoInstalacion: parseFloat(costoInstalacion.toFixed(2))
    };
  };
  
  /**
   * FASE 4: Guardar medidas técnicas (sin precios)
   */
  const handleGuardarMedidasTecnicas = async () => {
    console.log('🔧 Guardando medidas técnicas...');
    setGuardando(true);
    setErrorLocal('');
    
    try {
      // Validar que hay partidas
      if (piezas.length === 0) {
        setErrorLocal('Debes agregar al menos una partida.');
        setGuardando(false);
        return;
      }
      
      // Validar campos técnicos de todas las partidas
      const erroresValidacion = [];
      piezas.forEach((pieza, index) => {
        const errores = validarCamposTecnicos(pieza);
        if (errores.length > 0) {
          erroresValidacion.push(`Partida ${index + 1} (${pieza.ubicacion}):`);
          erroresValidacion.push(...errores);
        }
      });
      
      if (erroresValidacion.length > 0) {
        setErrorLocal(
          'Completa los campos obligatorios:\n' + erroresValidacion.join('\n')
        );
        setGuardando(false);
        return;
      }
      
      // Preparar partidas con totales
      const partidasConTotales = piezas.map(pieza => {
        const totales = calcularTotalesPartida(pieza, false);
        
        return {
          ubicacion: pieza.ubicacion,
          producto: pieza.productoLabel || pieza.producto,
          color: pieza.color,
          modelo: pieza.modeloCodigo,
          cantidad: pieza.cantidad,
          piezas: pieza.medidas.map(medida => ({
            ancho: parseFloat(medida.ancho),
            alto: parseFloat(medida.alto),
            m2: parseFloat(medida.ancho) * parseFloat(medida.alto),
            sistema: Array.isArray(medida.sistema) ? medida.sistema : [medida.sistema],
            control: medida.tipoControl,
            instalacion: medida.tipoInstalacion,
            fijacion: medida.tipoFijacion,
            caida: medida.caida || medida.orientacion,
            galeria: medida.galeria,
            telaMarca: medida.telaMarca,
            baseTabla: medida.baseTabla,
            operacion: medida.modoOperacion,
            detalle: medida.detalleTecnico === 'otro' ? medida.detalleTecnicoManual : medida.detalleTecnico,
            traslape: medida.traslape === 'otro' ? medida.traslapeManual : medida.traslape,
            modeloCodigo: medida.modeloCodigo,
            color: medida.color,
            observacionesTecnicas: medida.observacionesTecnicas || ''
          })),
          totales
        };
      });
      
      // Calcular totales del proyecto
      const totalesProyecto = partidasConTotales.reduce((acc, partida) => ({
        m2: acc.m2 + partida.totales.m2
      }), { m2: 0 });
      
      // Preparar payload
      const payload = {
        tipo: 'levantamiento',
        partidas: partidasConTotales,
        totales: totalesProyecto,
        observaciones: comentarios,
        personaVisita: personaVisita
      };
      
      console.log('📤 Enviando payload:', payload);
      
      // Enviar al backend
      const response = await axiosConfig.patch(
        `/proyectos/${proyecto._id}/levantamiento`,
        payload
      );
      
      console.log('✅ Levantamiento guardado:', response.data);
      
      // Cerrar modal y actualizar
      if (onActualizar) {
        await onActualizar();
      }
      
      cerrarModal();
      
    } catch (error) {
      console.error('❌ Error al guardar levantamiento:', error);
      setErrorLocal(
        error.response?.data?.message || 
        'Error al guardar el levantamiento. Intenta nuevamente.'
      );
    } finally {
      setGuardando(false);
    }
  };
  
  /**
   * FASE 4: Guardar cotización en vivo (con precios)
   */
  const handleGuardarCotizacionEnVivo = async () => {
    console.log('💰 Guardando cotización en vivo...');
    setGuardando(true);
    setErrorLocal('');
    
    try {
      // Validar que hay partidas
      if (piezas.length === 0) {
        setErrorLocal('Debes agregar al menos una partida.');
        setGuardando(false);
        return;
      }
      
      // Validar campos técnicos
      const erroresValidacion = [];
      piezas.forEach((pieza, index) => {
        const errores = validarCamposTecnicos(pieza);
        if (errores.length > 0) {
          erroresValidacion.push(`Partida ${index + 1} (${pieza.ubicacion}):`);
          erroresValidacion.push(...errores);
        }
      });
      
      if (erroresValidacion.length > 0) {
        setErrorLocal(
          'Completa los campos obligatorios:\n' + erroresValidacion.join('\n')
        );
        setGuardando(false);
        return;
      }
      
      // Validar precio general
      if (!precioGeneral || precioGeneral <= 0) {
        setErrorLocal('El precio general debe ser mayor a 0.');
        setGuardando(false);
        return;
      }
      
      // Preparar partidas con totales y precios
      const partidasConTotales = piezas.map(pieza => {
        const totales = calcularTotalesPartida(pieza, true);
        
        return {
          ubicacion: pieza.ubicacion,
          producto: pieza.productoLabel || pieza.producto,
          color: pieza.color,
          modelo: pieza.modeloCodigo,
          cantidad: pieza.cantidad,
          piezas: pieza.medidas.map(medida => ({
            ancho: parseFloat(medida.ancho),
            alto: parseFloat(medida.alto),
            m2: parseFloat(medida.ancho) * parseFloat(medida.alto),
            sistema: Array.isArray(medida.sistema) ? medida.sistema : [medida.sistema],
            control: medida.tipoControl,
            instalacion: medida.tipoInstalacion,
            fijacion: medida.tipoFijacion,
            caida: medida.caida || medida.orientacion,
            galeria: medida.galeria,
            telaMarca: medida.telaMarca,
            baseTabla: medida.baseTabla,
            operacion: medida.modoOperacion,
            detalle: medida.detalleTecnico === 'otro' ? medida.detalleTecnicoManual : medida.detalleTecnico,
            traslape: medida.traslape === 'otro' ? medida.traslapeManual : medida.traslape,
            modeloCodigo: medida.modeloCodigo,
            color: medida.color,
            precioM2: parseFloat(medida.precioM2) || parseFloat(precioGeneral),
            observacionesTecnicas: medida.observacionesTecnicas || ''
          })),
          // Motorización
          motorizacion: pieza.motorizado ? {
            activa: true,
            modeloMotor: pieza.motorModelo === 'otro' ? pieza.motorModeloEspecificar : pieza.motorModelo,
            precioMotor: parseFloat(pieza.motorPrecio) || 0,
            cantidadMotores: parseInt(pieza.numMotores) || 1,
            modeloControl: pieza.controlModelo,
            precioControl: parseFloat(pieza.controlPrecio) || 0,
            tipoControl: pieza.esControlMulticanal ? 'Multicanal' : 'Individual',
            piezasPorControl: parseInt(pieza.piezasPorControl) || 1
          } : { activa: false },
          // Instalación Especial
          instalacionEspecial: pieza.cobraInstalacion ? {
            activa: true,
            tipoCobro: pieza.tipoInstalacion === 'fijo' ? 'Fijo' : 
                       pieza.tipoInstalacion === 'por_pieza' ? 'Por pieza' : 'Base + Por pieza',
            precioBase: parseFloat(pieza.precioInstalacion) || 0,
            precioPorPieza: parseFloat(pieza.precioInstalacionPorPieza) || 0,
            observaciones: ''
          } : { activa: false },
          totales
        };
      });
      
      // Calcular totales del proyecto
      let subtotalProyecto = 0;
      let m2Proyecto = 0;
      
      partidasConTotales.forEach(partida => {
        subtotalProyecto += partida.totales.subtotal;
        m2Proyecto += partida.totales.m2;
      });
      
      // Aplicar descuento
      let descuento = 0;
      if (aplicaDescuento && valorDescuento) {
        if (tipoDescuento === 'porcentaje') {
          descuento = subtotalProyecto * (parseFloat(valorDescuento) / 100);
        } else {
          descuento = parseFloat(valorDescuento);
        }
      }
      
      const subtotalConDescuento = subtotalProyecto - descuento;
      
      // Calcular IVA
      const iva = requiereFactura ? subtotalConDescuento * 0.16 : 0;
      
      // Total final
      const total = subtotalConDescuento + iva;
      
      // Preparar payload de cotización
      const payload = {
        tipo: 'cotizacion',
        partidas: partidasConTotales,
        precioReglas: {
          precio_m2: parseFloat(precioGeneral),
          aplicaDescuento,
          tipoDescuento,
          valorDescuento: parseFloat(valorDescuento) || 0
        },
        facturacion: {
          requiereFactura,
          razonSocial: razonSocial || '',
          rfc: rfc || ''
        },
        totales: {
          m2: parseFloat(m2Proyecto.toFixed(2)),
          subtotal: parseFloat(subtotalProyecto.toFixed(2)),
          descuento: parseFloat(descuento.toFixed(2)),
          iva: parseFloat(iva.toFixed(2)),
          total: parseFloat(total.toFixed(2))
        },
        observaciones: comentarios,
        personaVisita: personaVisita
      };
      
      console.log('📤 Enviando payload de cotización:', payload);
      
      // Enviar al backend
      const response = await axiosConfig.post(
        `/proyectos/${proyecto._id}/cotizaciones`,
        payload
      );
      
      console.log('✅ Cotización guardada:', response.data);
      
      // Cerrar modal y actualizar
      if (onActualizar) {
        await onActualizar();
      }
      
      cerrarModal();
      
    } catch (error) {
      console.error('❌ Error al guardar cotización:', error);
      setErrorLocal(
        error.response?.data?.message || 
        'Error al guardar la cotización. Intenta nuevamente.'
      );
    } finally {
      setGuardando(false);
    }
  };
  
  /**
   * Generar PDF
   */
  const handleVerPDF = async () => {
    console.log('📄 Generando PDF...');
    setGuardandoPDF(true);
    setErrorLocal('');

    try {
      if (!proyecto?.cotizacion_id && conPrecios) {
        setErrorLocal('Debes guardar la cotización antes de generar el PDF.');
        setGuardandoPDF(false);
        return;
      }

      const ahora = Date.now();
      if (ahora - ultimoClickPDF < 3000) {
        console.log('⏳ Esperando generación anterior...');
        return;
      }
      setUltimoClickPDF(ahora);

      const tipo = conPrecios ? 'cotizacion' : 'levantamiento';
      const documentoId = conPrecios ? proyecto?.cotizacion_id : proyecto?._id;

      const response = await axiosConfig.get(
        `/proyectos/${proyecto?._id}/generar-pdf`,
        {
          params: { tipo, documentoId },
          responseType: 'blob'
        }
      );

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const fecha = new Date().toISOString().split('T')[0];
      const nombreCliente = proyecto?.cliente?.nombre?.replace(/\s+/g, '_') || 'Cliente';
      link.download = `${tipo.toUpperCase()}-${nombreCliente}-${fecha}.pdf`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('✅ PDF generado y descargado');
    } catch (error) {
      console.error('❌ Error al generar PDF:', error);
      setErrorLocal(
        error?.response?.data?.message ||
          'Error al generar el PDF. Intenta nuevamente.'
      );
    } finally {
      setGuardandoPDF(false);
    }
  };
  
  // ==================== RENDER ====================
  
  return (
    <>
      <Dialog 
        open={open} 
        onClose={() => {}} // Deshabilitamos cierre automático
        maxWidth="lg" 
        fullWidth
        disableEscapeKeyDown
        PaperProps={{
          sx: { maxHeight: '90vh' }
        }}
      >
        {/* ==================== HEADER ==================== */}
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start', 
          pt: 3, 
          pb: 2, 
          mb: 2,
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          <Box sx={{ flex: 1 }}>
            {/* Título Principal */}
            <Typography 
              sx={{ 
                fontSize: '1.125rem', 
                fontWeight: 600, 
                color: 'rgb(30, 41, 59)',
                mb: 0.5
              }}
            >
              {conPrecios ? '💰 Agregar Medidas con Precios' : '📏 Agregar Medidas Técnicas'}
            </Typography>
            
            {/* Subtítulo: Proyecto */}
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'text.secondary',
                fontSize: '0.875rem',
                mb: 1
              }}
            >
              Proyecto: {proyecto?.numero || 'N/A'} - {proyecto?.cliente?.nombre || proyecto?.nombre || 'Sin nombre'}
            </Typography>
            
            {/* Chips Contextuales */}
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 1 }}>
              <Chip 
                label={conPrecios ? "CON PRECIOS" : "SIN PRECIOS"} 
                color={conPrecios ? "success" : "primary"}
                size="small"
                sx={{ 
                  fontSize: '0.75rem',
                  height: '24px',
                  fontWeight: 600
                }}
              />
              <Chip 
                label={`${proyecto?.estado || 'N/A'}`} 
                variant="outlined"
                size="small"
                sx={{ 
                  fontSize: '0.75rem',
                  height: '24px'
                }}
              />
              {piezas.length > 0 && (
                <Chip 
                  label={`📋 ${piezas.length} partida${piezas.length > 1 ? 's' : ''}`}
                  color="primary"
                  variant="outlined"
                  size="small"
                  sx={{ 
                    fontSize: '0.75rem',
                    height: '24px'
                  }}
                />
              )}
              {conPrecios && piezas.length > 0 && (
                <Chip 
                  label={`$${precioGeneral.toLocaleString()}/m²`}
                  color="success"
                  variant="outlined"
                  size="small"
                  sx={{ 
                    fontSize: '0.75rem',
                    height: '24px'
                  }}
                />
              )}
            </Box>
          </Box>
          
          {/* Íconos de Acción */}
          <Box sx={{ display: 'flex', gap: 0.5, ml: 2 }}>
            <IconButton 
              onClick={() => setCapturaModalOpen(true)} 
              size="small"
              title="Capturar pantalla para soporte"
              sx={{ color: 'text.secondary' }}
            >
              <BugReport fontSize="small" />
            </IconButton>
            <IconButton 
              onClick={() => setInspectorModalOpen(true)} 
              size="small"
              title="Inspector de elementos"
              sx={{ color: 'text.secondary' }}
            >
              <Search fontSize="small" />
            </IconButton>
            <IconButton 
              onClick={cerrarModal} 
              size="small"
              sx={{ color: 'text.secondary' }}
            >
              <Close fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>
        
        {/* ==================== CONTENT ==================== */}
        <DialogContent sx={{ p: 3 }}>
          {/* Mensaje de error */}
          {errorLocal && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorLocal('')}>
              {errorLocal}
            </Alert>
          )}
          
          {/* ==================== SECCIÓN DE PARTIDAS ==================== */}
          <Card sx={{ mb: 3, bgcolor: 'success.50', border: 2, borderColor: 'success.200' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  📏 Partidas y Medidas
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* Fecha de Cotización (solo si conPrecios) */}
                  {conPrecios && (
                    <TextField
                      size="small"
                      type="date"
                      label="Fecha Cotización"
                      value={fechaCotizacion}
                      onChange={(e) => setFechaCotizacion(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      sx={{ width: '180px' }}
                    />
                  )}
                  {!agregandoPieza && (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => setAgregandoPieza(true)}
                      startIcon={<Add />}
                    >
                      Agregar Partida
                    </Button>
                  )}
                </Box>
              </Box>
              
              {/* Mensaje cuando no hay partidas */}
              {piezas.length === 0 && !agregandoPieza && (
                <Alert severity="info">
                  No hay partidas agregadas. Haz clic en "Agregar Partida" para comenzar.
                </Alert>
              )}
              
              {/* ==================== FORMULARIO DE AGREGAR PARTIDA ==================== */}
              <Collapse in={agregandoPieza}>
                <Card sx={{ mb: 2, bgcolor: 'white', border: 1, borderColor: 'primary.main' }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Typography variant="subtitle1" sx={{ mb: 1.5, color: 'primary.main', fontWeight: 'bold', fontSize: '0.95rem' }}>
                      {editandoPieza ? '✏️ Editar Partida' : '➕ Nueva Partida'}
                    </Typography>
                    
                    <Grid container spacing={1}>
                      {/* Ubicación */}
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Ubicación"
                          fullWidth
                          size="small"
                          value={piezaForm.ubicacion}
                          onChange={(e) => setPiezaForm(prev => ({ ...prev, ubicacion: e.target.value }))}
                          placeholder="Sala, Recámara..."
                          required
                        />
                      </Grid>
                      
                      {/* Cantidad de piezas */}
                      <Grid item xs={6} sm={3}>
                        <TextField
                          label="Cantidad"
                          type="number"
                          fullWidth
                          size="small"
                          value={piezaForm.cantidad}
                          onChange={(e) => {
                            const nuevaCantidad = parseInt(e.target.value) || 1;
                            setPiezaForm(prev => ({ ...prev, cantidad: nuevaCantidad }));
                            actualizarMedidas(nuevaCantidad);
                          }}
                          inputProps={{ min: 1, max: 20 }}
                        />
                      </Grid>
                      
                      {/* Producto */}
                      <Grid item xs={6} sm={3}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Producto</InputLabel>
                          <Select
                            value={piezaForm.producto}
                            label="Producto"
                            onChange={(e) => {
                              if (e.target.value === 'nuevo') {
                                setMostrarNuevoProducto(true);
                                return;
                              }
                              const productoSeleccionado = productosOptions.find(p => p.value === e.target.value);
                              setPiezaForm(prev => ({
                                ...prev,
                                producto: e.target.value,
                                productoLabel: productoSeleccionado?.label || ''
                              }));
                            }}
                          >
                            {productosOptions.map((producto) => (
                              <MenuItem key={producto.value} value={producto.value}>
                                {producto.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      
                      {/* Formulario Nuevo Producto Personalizado */}
                      {mostrarNuevoProducto && (
                        <Grid item xs={12}>
                          <Card sx={{ bgcolor: 'warning.50', border: 2, borderColor: 'warning.200' }}>
                            <CardContent>
                              <Typography variant="h6" sx={{ mb: 1, color: 'warning.dark' }}>
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
                                  }}
                                >
                                  Cancelar
                                </Button>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      )}
                      
                      {/* Modelo/Código */}
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Modelo / Código"
                          fullWidth
                          size="small"
                          value={piezaForm.modeloCodigo || ''}
                          onChange={(e) => {
                            const nuevoModelo = e.target.value;
                            setPiezaForm(prev => {
                              // Actualizar modelo general y propagarlo a todas las piezas
                              const nuevasMedidas = (prev.medidas || []).map(medida => ({
                                ...medida,
                                modeloCodigo: nuevoModelo
                              }));
                              return { 
                                ...prev, 
                                modeloCodigo: nuevoModelo,
                                medidas: nuevasMedidas
                              };
                            });
                          }}
                          placeholder="SC-3%, BK-100..."
                        />
                      </Grid>
                      
                      {/* Color */}
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Color / Acabado"
                          fullWidth
                          size="small"
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
                          placeholder="Blanco, Beige..."
                        />
                      </Grid>
                      
                      {/* Precio por m² (solo si conPrecios) */}
                      {conPrecios && (
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Precio por m²"
                            type="number"
                            fullWidth
                            size="small"
                            value={piezaForm.precioM2 || ''}
                            onChange={(e) => {
                              const nuevoPrecio = e.target.value;
                              setPiezaForm(prev => {
                                // Actualizar precio general y propagarlo a todas las piezas
                                const nuevasMedidas = (prev.medidas || []).map(medida => ({
                                  ...medida,
                                  precioM2: nuevoPrecio
                                }));
                                return { 
                                  ...prev, 
                                  precioM2: nuevoPrecio,
                                  medidas: nuevasMedidas
                                };
                              });
                            }}
                            placeholder={`${precioGeneral}`}
                            inputProps={{ step: 0.01 }}
                          />
                        </Grid>
                      )}
                    </Grid>
                    
                    <Divider sx={{ my: 1.5 }} />
                    
                    {/* ==================== MEDIDAS INDIVIDUALES ==================== */}
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                      📐 Medidas de cada pieza:
                    </Typography>
                    
                    {piezaForm.medidas && piezaForm.medidas.map((medida, index) => (
                      <Card key={index} sx={{ mb: 1.5, bgcolor: 'grey.50', boxShadow: 1 }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'primary.main', fontWeight: 'bold', fontSize: '0.9rem' }}>
                            Pieza #{index + 1}
                          </Typography>
                          
                          {/* NIVEL 1: Campos Críticos */}
                          <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600, color: 'text.secondary' }}>
                            📐 Medidas y Configuración Principal
                          </Typography>
                          <Grid container spacing={1} sx={{ mb: 1.5 }}>
                            {/* Ancho */}
                            <Grid item xs={6} sm={4}>
                              <TextField
                                label="Ancho (m)"
                                type="number"
                                fullWidth
                                size="small"
                                value={medida.ancho}
                                onChange={(e) => {
                                  const nuevasMedidas = [...piezaForm.medidas];
                                  nuevasMedidas[index] = { ...nuevasMedidas[index], ancho: e.target.value };
                                  setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
                                }}
                                inputProps={{ step: '0.01', min: '0' }}
                                placeholder="1.50"
                              />
                            </Grid>
                            
                            {/* Alto */}
                            <Grid item xs={6} sm={4}>
                              <TextField
                                label="Alto (m)"
                                type="number"
                                fullWidth
                                size="small"
                                value={medida.alto}
                                onChange={(e) => {
                                  const nuevasMedidas = [...piezaForm.medidas];
                                  nuevasMedidas[index] = { ...nuevasMedidas[index], alto: e.target.value };
                                  setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
                                }}
                                inputProps={{ step: '0.01', min: '0' }}
                                placeholder="2.00"
                              />
                            </Grid>
                            
                            {/* Tipo de Instalación */}
                            <Grid item xs={6} sm={4}>
                              <FormControl fullWidth size="small">
                                <InputLabel>Tipo Instalación</InputLabel>
                                <Select
                                  value={medida.tipoInstalacion || ''}
                                  label="Tipo Instalación"
                                  onChange={(e) => {
                                    const nuevasMedidas = [...piezaForm.medidas];
                                    nuevasMedidas[index] = { ...nuevasMedidas[index], tipoInstalacion: e.target.value };
                                    setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
                                  }}
                                >
                                  <MenuItem value="muro">Muro</MenuItem>
                                  <MenuItem value="techo">Techo</MenuItem>
                                  <MenuItem value="empotrado">Empotrado</MenuItem>
                                  <MenuItem value="piso_techo">Piso a Techo</MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>
                            
                            {/* Tipo de Operación */}
                            <Grid item xs={6} sm={4}>
                              <FormControl fullWidth size="small">
                                <InputLabel>Tipo Operación</InputLabel>
                                <Select
                                  value={medida.tipoOperacion || ''}
                                  label="Tipo Operación"
                                  onChange={(e) => {
                                    const nuevasMedidas = [...piezaForm.medidas];
                                    nuevasMedidas[index] = { ...nuevasMedidas[index], tipoOperacion: e.target.value };
                                    setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
                                  }}
                                >
                                  <MenuItem value="manual">Manual</MenuItem>
                                  <MenuItem value="motorizado">Motorizado</MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>
                            
                            {/* Tipo de Fijación */}
                            <Grid item xs={6} sm={4}>
                              <FormControl fullWidth size="small">
                                <InputLabel>Tipo Fijación</InputLabel>
                                <Select
                                  value={medida.tipoFijacion || ''}
                                  label="Tipo Fijación"
                                  onChange={(e) => {
                                    const nuevasMedidas = [...piezaForm.medidas];
                                    nuevasMedidas[index] = { ...nuevasMedidas[index], tipoFijacion: e.target.value };
                                    setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
                                  }}
                                >
                                  <MenuItem value="concreto">Concreto</MenuItem>
                                  <MenuItem value="tablaroca">Tablaroca</MenuItem>
                                  <MenuItem value="aluminio">Aluminio</MenuItem>
                                  <MenuItem value="madera">Madera</MenuItem>
                                  <MenuItem value="otro">Otro</MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>
                            
                            {/* Tipo de Control */}
                            <Grid item xs={6} sm={4}>
                              <FormControl fullWidth size="small">
                                <InputLabel>Control</InputLabel>
                                <Select
                                  value={medida.tipoControl || ''}
                                  label="Control"
                                  onChange={(e) => {
                                    const nuevasMedidas = [...piezaForm.medidas];
                                    nuevasMedidas[index] = { ...nuevasMedidas[index], tipoControl: e.target.value };
                                    setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
                                  }}
                                >
                                  <MenuItem value="izquierdo">Izquierdo</MenuItem>
                                  <MenuItem value="derecho">Derecho</MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>
                            
                            {/* Orientación (Caída) */}
                            <Grid item xs={12} sm={4}>
                              <FormControl fullWidth size="small">
                                <InputLabel>Orientación</InputLabel>
                                <Select
                                  value={medida.orientacion || ''}
                                  label="Orientación"
                                  onChange={(e) => {
                                    const nuevasMedidas = [...piezaForm.medidas];
                                    nuevasMedidas[index] = { ...nuevasMedidas[index], orientacion: e.target.value };
                                    setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
                                  }}
                                >
                                  <MenuItem value="hacia_frente">Hacia el frente</MenuItem>
                                  <MenuItem value="caida_normal">Caída normal</MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>
                          </Grid>
                          
                          {/* NIVEL 2: Sistema y Configuración Técnica */}
                          <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600, color: 'text.secondary' }}>
                            🔧 Sistema
                          </Typography>
                          <Box sx={{ mb: 1.5 }}>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                              {['Roller', 'Zebra', 'Panel', 'Romana', 'Vertical', 'Madera'].map((sistema) => (
                                <Button
                                  key={sistema}
                                  size="small"
                                  variant={medida.sistema?.includes(sistema) ? 'contained' : 'outlined'}
                                  onClick={() => {
                                    const nuevasMedidas = [...piezaForm.medidas];
                                    const sistemasActuales = nuevasMedidas[index].sistema || [];
                                    const nuevosSistemas = sistemasActuales.includes(sistema)
                                      ? sistemasActuales.filter(s => s !== sistema)
                                      : [...sistemasActuales, sistema];
                                    nuevasMedidas[index] = { ...nuevasMedidas[index], sistema: nuevosSistemas };
                                    setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
                                  }}
                                  sx={{ 
                                    fontSize: '0.7rem',
                                    minWidth: 'auto',
                                    px: 1,
                                    py: 0.25,
                                    height: '24px'
                                  }}
                                >
                                  {sistema}
                                </Button>
                              ))}
                            </Box>
                            
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {['Éstandar', 'Skyline', 'Día & Noche', 'Otros modelos'].map((sistemaEsp) => (
                                <Button
                                  key={sistemaEsp}
                                  size="small"
                                  variant={medida.sistemaEspecial?.includes(sistemaEsp) ? 'contained' : 'outlined'}
                                  onClick={() => {
                                    const nuevasMedidas = [...piezaForm.medidas];
                                    const sistemasActuales = nuevasMedidas[index].sistemaEspecial || [];
                                    const nuevosSistemas = sistemasActuales.includes(sistemaEsp)
                                      ? sistemasActuales.filter(s => s !== sistemaEsp)
                                      : [...sistemasActuales, sistemaEsp];
                                    nuevasMedidas[index] = { ...nuevasMedidas[index], sistemaEspecial: nuevosSistemas };
                                    setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
                                  }}
                                  sx={{ 
                                    fontSize: '0.7rem',
                                    minWidth: 'auto',
                                    px: 1,
                                    py: 0.25,
                                    height: '24px',
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
                          </Box>
                          
                          {/* NIVEL 3: Galería, Base/Tabla y Personalización */}
                          <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600, color: 'text.secondary' }}>
                            🎨 Personalización y Detalles
                          </Typography>
                          <Grid container spacing={1} sx={{ mb: 1.5 }}>
                            
                            {/* Galería */}
                            <Grid item xs={6} sm={4}>
                              <FormControl fullWidth size="small">
                                <InputLabel>Galería</InputLabel>
                                <Select
                                  value={medida.galeria || ''}
                                  label={`Galería pieza ${index + 1}`}
                                  onChange={(e) => {
                                    const nuevasMedidas = [...piezaForm.medidas];
                                    nuevasMedidas[index] = { 
                                      ...nuevasMedidas[index], 
                                      galeria: e.target.value,
                                      // Limpiar Base Tabla si Galería es "No"
                                      baseTabla: e.target.value === 'no' ? '' : nuevasMedidas[index].baseTabla
                                    };
                                    setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
                                  }}
                                >
                                  <MenuItem value="si">Sí</MenuItem>
                                  <MenuItem value="no">No</MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>
                            
                            {/* Base/Tabla - Solo si Galería es "Sí" */}
                            <Grid item xs={6} sm={4}>
                              {(medida.galeria === 'si' || medida.galeria === 'Sí') ? (
                                <FormControl fullWidth size="small">
                                  <InputLabel>Base/Tabla</InputLabel>
                                  <Select
                                    value={medida.baseTabla || ''}
                                    label="Base/Tabla"
                                    onChange={(e) => {
                                      const nuevasMedidas = [...piezaForm.medidas];
                                      nuevasMedidas[index] = { ...nuevasMedidas[index], baseTabla: e.target.value };
                                      setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
                                    }}
                                  >
                                    <MenuItem value="">Seleccionar</MenuItem>
                                    <MenuItem value="7cm">7 cm</MenuItem>
                                    <MenuItem value="15cm">15 cm</MenuItem>
                                    <MenuItem value="18cm">18 cm</MenuItem>
                                  </Select>
                                </FormControl>
                              ) : (
                                <Box sx={{ p: 0.75, bgcolor: 'grey.100', borderRadius: 1, display: 'flex', alignItems: 'center', height: '40px' }}>
                                  <Typography variant="caption" color="text.secondary">
                                    N/A (Galería: No)
                                  </Typography>
                                </Box>
                              )}
                            </Grid>
                            
                            {/* Marca de Tela */}
                            <Grid item xs={6} sm={4}>
                              <TextField
                                label="Marca Tela"
                                fullWidth
                                size="small"
                                value={medida.telaMarca || ''}
                                onChange={(e) => {
                                  const nuevasMedidas = [...piezaForm.medidas];
                                  nuevasMedidas[index] = { ...nuevasMedidas[index], telaMarca: e.target.value };
                                  setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
                                }}
                                placeholder="Sunscreen, Blackout..."
                              />
                            </Grid>

                            {/* Detalle Técnico */}
                            <Grid item xs={6} sm={4}>
                              <FormControl fullWidth size="small">
                                <InputLabel>Detalle Técnico</InputLabel>
                                <Select
                                  value={medida.detalleTecnico || ''}
                                  label="Detalle Técnico"
                                  onChange={(e) => {
                                    const nuevasMedidas = [...piezaForm.medidas];
                                    nuevasMedidas[index] = { 
                                      ...nuevasMedidas[index], 
                                      detalleTecnico: e.target.value,
                                      detalleTecnicoManual: e.target.value === 'otro' ? nuevasMedidas[index]?.detalleTecnicoManual : ''
                                    };
                                    setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
                                  }}
                                >
                                  <MenuItem value="">No aplica</MenuItem>
                                  <MenuItem value="traslape">Traslape</MenuItem>
                                  <MenuItem value="corte">Corte</MenuItem>
                                  <MenuItem value="sin_traslape">Sin traslape</MenuItem>
                                  <MenuItem value="empalme">Empalme</MenuItem>
                                  <MenuItem value="doble_sistema">Doble Sistema</MenuItem>
                                  <MenuItem value="otro">Otro (especificar)</MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>

                            {/* Campo manual para Detalle (cuando selecciona "Otro") */}
                            {medida.detalleTecnico === 'otro' && (
                              <Grid item xs={12}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  label="Especificar Detalle Técnico"
                                  value={medida.detalleTecnicoManual || ''}
                                  onChange={(e) => {
                                    const nuevasMedidas = [...piezaForm.medidas];
                                    nuevasMedidas[index] = { ...nuevasMedidas[index], detalleTecnicoManual: e.target.value };
                                    setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
                                  }}
                                  placeholder="Ej: Sistema triple con guías laterales"
                                />
                              </Grid>
                            )}

                            {/* Traslape */}
                            <Grid item xs={6} sm={4}>
                              <FormControl fullWidth size="small">
                                <InputLabel>Traslape</InputLabel>
                                <Select
                                  value={medida.traslape || ''}
                                  label="Traslape"
                                  onChange={(e) => {
                                    const nuevasMedidas = [...piezaForm.medidas];
                                    nuevasMedidas[index] = { 
                                      ...nuevasMedidas[index], 
                                      traslape: e.target.value,
                                      traslapeManual: e.target.value === 'otro' ? nuevasMedidas[index]?.traslapeManual : ''
                                    };
                                    setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
                                  }}
                                >
                                  <MenuItem value="">No aplica</MenuItem>
                                  <MenuItem value="5cm">5 cm</MenuItem>
                                  <MenuItem value="10cm">10 cm</MenuItem>
                                  <MenuItem value="15cm">15 cm</MenuItem>
                                  <MenuItem value="20cm">20 cm</MenuItem>
                                  <MenuItem value="otro">Otro (especificar)</MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>

                            {/* Campo manual para Traslape (cuando selecciona "Otro") */}
                            {medida.traslape === 'otro' && (
                              <Grid item xs={12}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  label="Especificar Traslape"
                                  value={medida.traslapeManual || ''}
                                  onChange={(e) => {
                                    const nuevasMedidas = [...piezaForm.medidas];
                                    nuevasMedidas[index] = { ...nuevasMedidas[index], traslapeManual: e.target.value };
                                    setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
                                  }}
                                  placeholder="Ej: 25 cm o traslape personalizado"
                                />
                              </Grid>
                            )}
                            
                            {/* Modelo/Código Individual (personalizable) */}
                            <Grid item xs={6} sm={3}>
                              <TextField
                                label="Modelo/Código"
                                fullWidth
                                size="small"
                                value={medida.modeloCodigo || piezaForm.modeloCodigo || ''}
                                onChange={(e) => {
                                  const nuevasMedidas = [...piezaForm.medidas];
                                  nuevasMedidas[index] = { ...nuevasMedidas[index], modeloCodigo: e.target.value };
                                  setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
                                }}
                                placeholder="Malla, SC-5%..."
                              />
                            </Grid>
                            
                            {/* Color Individual (personalizable) */}
                            <Grid item xs={6} sm={3}>
                              <TextField
                                label="Color"
                                fullWidth
                                size="small"
                                value={medida.color || piezaForm.color || ''}
                                onChange={(e) => {
                                  const nuevasMedidas = [...piezaForm.medidas];
                                  nuevasMedidas[index] = { ...nuevasMedidas[index], color: e.target.value };
                                  setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
                                }}
                                placeholder="Blanco, Beige..."
                              />
                            </Grid>
                            
                            {/* Precio Individual (solo si conPrecios) */}
                            {conPrecios && (
                              <Grid item xs={12} sm={3}>
                                <TextField
                                  label="Precio $/m²"
                                  type="number"
                                  fullWidth
                                  size="small"
                                  value={medida.precioM2 || piezaForm.precioM2 || ''}
                                  onChange={(e) => {
                                    const nuevasMedidas = [...piezaForm.medidas];
                                    nuevasMedidas[index] = { ...nuevasMedidas[index], precioM2: e.target.value };
                                    setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
                                  }}
                                  placeholder={`${piezaForm.precioM2 || precioGeneral}`}
                                  inputProps={{ step: 0.01 }}
                                />
                              </Grid>
                            )}
                          </Grid>
                          
                          {/* NIVEL 4: Observaciones Técnicas (ancho completo) */}
                          <Grid container spacing={1}>
                            <Grid item xs={12}>
                              <TextField
                                label="Observaciones Técnicas"
                                fullWidth
                                size="small"
                                multiline
                                rows={2}
                                value={medida.observacionesTecnicas || ''}
                                onChange={(e) => {
                                  const nuevasMedidas = [...piezaForm.medidas];
                                  nuevasMedidas[index] = { ...nuevasMedidas[index], observacionesTecnicas: e.target.value };
                                  setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
                                }}
                                placeholder="Obstáculos, accesos, cableado, nivel..."
                              />
                            </Grid>
                          </Grid>
                          
                          {/* Botón copiar de pieza anterior */}
                          {index > 0 && (
                            <Box sx={{ mt: 1 }}>
                              <Button
                                size="small"
                                startIcon={<ContentCopy />}
                                onClick={() => {
                                  const nuevasMedidas = [...piezaForm.medidas];
                                  nuevasMedidas[index] = { ...nuevasMedidas[index - 1] };
                                  setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
                                }}
                                sx={{ fontSize: '0.75rem', py: 0.5 }}
                              >
                                Copiar medidas de pieza anterior
                              </Button>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                    
                    {/* ==================== INSTALACIÓN ESPECIAL (DENTRO DE PARTIDA) ==================== */}
                    {conPrecios && (
                      <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Box sx={{ p: 2, bgcolor: 'rgb(248, 250, 252)', borderRadius: 1, border: '1px solid #e2e8f0' }}>
                          <Typography variant="subtitle2" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600, fontSize: '0.875rem', color: 'rgb(51, 65, 85)' }}>
                            🔧 Instalación Especial (Opcional)
                          </Typography>
                          
                          <Grid container spacing={1}>
                            {/* ¿Cobra Instalación Especial? */}
                            <Grid item xs={6} sm={3}>
                              <FormControl fullWidth size="small">
                                <InputLabel>¿Instalación Especial?</InputLabel>
                                <Select
                                  value={piezaForm.cobraInstalacion ? 'si' : 'no'}
                                  label="¿Instalación Especial?"
                                  onChange={(e) => setPiezaForm(prev => ({ ...prev, cobraInstalacion: e.target.value === 'si' }))}
                                >
                                  <MenuItem value="no">No</MenuItem>
                                  <MenuItem value="si">Sí</MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>
                            
                            {piezaForm.cobraInstalacion && (
                              <>
                                {/* Tipo de Instalación */}
                                <Grid item xs={6} sm={3}>
                                  <FormControl fullWidth size="small">
                                    <InputLabel>Tipo Cobro</InputLabel>
                                    <Select
                                      value={piezaForm.tipoInstalacion || 'fijo'}
                                      label="Tipo Cobro"
                                      onChange={(e) => setPiezaForm(prev => ({ ...prev, tipoInstalacion: e.target.value }))}
                                    >
                                      <MenuItem value="fijo">Fijo</MenuItem>
                                      <MenuItem value="por_pieza">Por Pieza</MenuItem>
                                      <MenuItem value="base_mas_pieza">Base + Pieza</MenuItem>
                                    </Select>
                                  </FormControl>
                                </Grid>
                                
                                {/* Precio Base */}
                                <Grid item xs={6} sm={3}>
                                  <TextField
                                    label={piezaForm.tipoInstalacion === 'por_pieza' ? 'Precio/Pieza' : 'Precio Base'}
                                    type="number"
                                    fullWidth
                                    size="small"
                                    value={piezaForm.precioInstalacion || ''}
                                    onChange={(e) => setPiezaForm(prev => ({ ...prev, precioInstalacion: e.target.value }))}
                                    placeholder="5000"
                                    inputProps={{ step: 0.01 }}
                                  />
                                </Grid>
                                
                                {/* Precio Adicional por Pieza (solo si es base_mas_pieza) */}
                                {piezaForm.tipoInstalacion === 'base_mas_pieza' && (
                                  <Grid item xs={6} sm={3}>
                                    <TextField
                                      label="Adicional/Pieza"
                                      type="number"
                                      fullWidth
                                      size="small"
                                      value={piezaForm.precioInstalacionPorPieza || ''}
                                      onChange={(e) => setPiezaForm(prev => ({ ...prev, precioInstalacionPorPieza: e.target.value }))}
                                      placeholder="500"
                                      inputProps={{ step: 0.01 }}
                                    />
                                  </Grid>
                                )}
                                
                                {/* Observaciones de Instalación */}
                                <Grid item xs={12}>
                                  <TextField
                                    fullWidth
                                    size="small"
                                    multiline
                                    rows={2}
                                    label="Observaciones de Instalación"
                                    value={piezaForm.observacionesInstalacion || ''}
                                    onChange={(e) => setPiezaForm(prev => ({ ...prev, observacionesInstalacion: e.target.value }))}
                                    placeholder="Ej: Incluye traslado, andamios, instalación en altura, perforaciones especiales..."
                                  />
                                </Grid>
                                
                                {/* Resumen de Instalación */}
                                <Grid item xs={12}>
                                  <Alert severity="info" sx={{ py: 0.5 }}>
                                    <Typography variant="body2">
                                      {piezaForm.tipoInstalacion === 'fijo' && `💰 Instalación: $${parseFloat(piezaForm.precioInstalacion || 0).toFixed(2)} MXN (Precio fijo)`}
                                      {piezaForm.tipoInstalacion === 'por_pieza' && `💰 Instalación: ${piezaForm.cantidad || 1} piezas × $${parseFloat(piezaForm.precioInstalacion || 0).toFixed(2)} = $${((piezaForm.cantidad || 1) * parseFloat(piezaForm.precioInstalacion || 0)).toFixed(2)} MXN`}
                                      {piezaForm.tipoInstalacion === 'base_mas_pieza' && `💰 Instalación: $${parseFloat(piezaForm.precioInstalacion || 0).toFixed(2)} (base) + ${Math.max(0, (piezaForm.cantidad || 1) - 1)} piezas × $${parseFloat(piezaForm.precioInstalacionPorPieza || 0).toFixed(2)} = $${(parseFloat(piezaForm.precioInstalacion || 0) + (Math.max(0, (piezaForm.cantidad || 1) - 1) * parseFloat(piezaForm.precioInstalacionPorPieza || 0))).toFixed(2)} MXN`}
                                    </Typography>
                                  </Alert>
                                </Grid>
                              </>
                            )}
                          </Grid>
                        </Box>
                      </Box>
                    )}
                    
                    {/* ==================== MOTORIZACIÓN (DENTRO DE PARTIDA) ==================== */}
                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                      <Box sx={{ p: 2, bgcolor: 'rgb(248, 250, 252)', borderRadius: 1, border: '1px solid #e2e8f0' }}>
                        <Typography variant="subtitle2" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600, fontSize: '0.875rem', color: 'rgb(51, 65, 85)' }}>
                          ⚡ Motorización (Opcional)
                        </Typography>
                        
                        <Grid container spacing={1}>
                          {/* Toggle ¿Motorizado? */}
                          <Grid item xs={6} sm={3}>
                            <FormControl fullWidth size="small">
                              <InputLabel>¿Motorizado?</InputLabel>
                              <Select
                                value={piezaForm.motorizado ? 'si' : 'no'}
                                label="¿Motorizado?"
                                onChange={(e) => {
                                  const esMotorizado = e.target.value === 'si';
                                  setPiezaForm(prev => ({ 
                                    ...prev, 
                                    motorizado: esMotorizado,
                                    motorModelo: esMotorizado ? prev.motorModelo : '',
                                    motorPrecio: esMotorizado ? prev.motorPrecio : '',
                                    numMotores: esMotorizado ? prev.numMotores || 1 : 1,
                                    piezasPorMotor: esMotorizado ? prev.piezasPorMotor || 1 : 1,
                                    controlModelo: esMotorizado ? prev.controlModelo : '',
                                    controlPrecio: esMotorizado ? prev.controlPrecio : '',
                                    esControlMulticanal: esMotorizado ? prev.esControlMulticanal || false : false,
                                    piezasPorControl: esMotorizado ? prev.piezasPorControl || 1 : 1
                                  }));
                                }}
                              >
                                <MenuItem value="no">No</MenuItem>
                                <MenuItem value="si">Sí</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          
                          {piezaForm.motorizado && (
                            <>
                              {/* Configuración de Motores */}
                              <Grid item xs={12}>
                                <Box sx={{ p: 1.5, bgcolor: 'white', borderRadius: 1, border: '1px solid #e2e8f0' }}>
                                  <Typography variant="caption" sx={{ mb: 1, color: 'primary.dark', fontWeight: 'bold', display: 'block' }}>
                                    🔧 Configuración de Motores
                                  </Typography>
                                  
                                  <Grid container spacing={1}>
                                    {/* Modelo de Motor */}
                                    <Grid item xs={12} sm={4}>
                                      <FormControl fullWidth size="small">
                                        <InputLabel>Modelo Motor</InputLabel>
                                        <Select
                                          value={piezaForm.motorModelo || ''}
                                          label="Modelo de Motor"
                                          onChange={(e) => setPiezaForm(prev => ({ 
                                            ...prev, 
                                            motorModelo: e.target.value,
                                            motorModeloEspecificar: e.target.value === 'otro_manual' ? prev.motorModeloEspecificar : ''
                                          }))}
                                        >
                                          {modelosMotores.map(motor => (
                                            <MenuItem key={motor.value} value={motor.value}>
                                              {motor.label}
                                            </MenuItem>
                                          ))}
                                        </Select>
                                      </FormControl>
                                    </Grid>
                                    
                                    {/* Campo para especificar motor (solo si selecciona "Otro") */}
                                    {piezaForm.motorModelo === 'otro_manual' && (
                                      <Grid item xs={12} sm={8}>
                                        <TextField
                                          label="Especificar Modelo de Motor"
                                          fullWidth
                                          size="small"
                                          value={piezaForm.motorModeloEspecificar || ''}
                                          onChange={(e) => setPiezaForm(prev => ({ ...prev, motorModeloEspecificar: e.target.value }))}
                                          placeholder="Ej: Kit de motor de baterías 35 mm"
                                        />
                                      </Grid>
                                    )}
                                    
                                    {/* Precio por Motor (solo si conPrecios) */}
                                    {conPrecios && (
                                      <Grid item xs={6} sm={4}>
                                        <TextField
                                          label="Precio/Motor"
                                          type="number"
                                          fullWidth
                                          size="small"
                                          value={piezaForm.motorPrecio || ''}
                                          onChange={(e) => setPiezaForm(prev => ({ ...prev, motorPrecio: e.target.value }))}
                                          placeholder="9500"
                                          inputProps={{ step: 0.01 }}
                                        />
                                      </Grid>
                                    )}
                                    
                                    {/* Número de Motores */}
                                    <Grid item xs={6} sm={4}>
                                      <TextField
                                        label="Núm. Motores"
                                        type="number"
                                        fullWidth
                                        size="small"
                                        value={piezaForm.numMotores || 1}
                                        onChange={(e) => setPiezaForm(prev => ({ ...prev, numMotores: parseInt(e.target.value) || 1 }))}
                                        inputProps={{ min: 1, max: 20 }}
                                      />
                                    </Grid>
                                  </Grid>
                                </Box>
                              </Grid>

                              {/* Configuración de Control */}
                              <Grid item xs={12}>
                                <Box sx={{ p: 1.5, bgcolor: 'white', borderRadius: 1, border: '1px solid #e2e8f0' }}>
                                  <Typography variant="caption" sx={{ mb: 1, color: 'info.dark', fontWeight: 'bold', display: 'block' }}>
                                    🎛️ Configuración de Control
                                  </Typography>
                                  
                                  <Grid container spacing={1}>
                                    {/* Tipo de Control */}
                                    <Grid item xs={12} sm={6}>
                                      <FormControl fullWidth size="small">
                                        <InputLabel>Tipo Control</InputLabel>
                                        <Select
                                          value={piezaForm.esControlMulticanal ? 'multicanal' : 'individual'}
                                          label="Tipo de Control"
                                          onChange={(e) => {
                                            const esMulticanal = e.target.value === 'multicanal';
                                            setPiezaForm(prev => ({ 
                                              ...prev, 
                                              esControlMulticanal: esMulticanal,
                                              piezasPorControl: esMulticanal ? (piezaForm.medidas ? piezaForm.medidas.length : 1) : 1
                                            }));
                                          }}
                                        >
                                          <MenuItem value="individual">Control Individual (1 por pieza)</MenuItem>
                                          <MenuItem value="multicanal">Control Multicanal (1 para varias piezas)</MenuItem>
                                        </Select>
                                      </FormControl>
                                    </Grid>
                                    
                                    {/* Modelo de Control */}
                                    <Grid item xs={12} sm={6}>
                                      <FormControl fullWidth size="small">
                                        <InputLabel>Modelo Control</InputLabel>
                                        <Select
                                          value={piezaForm.controlModelo || ''}
                                          label="Modelo Control"
                                          onChange={(e) => setPiezaForm(prev => ({ ...prev, controlModelo: e.target.value }))}
                                        >
                                          {modelosControles.map(control => (
                                            <MenuItem key={control.value} value={control.value}>
                                              {control.label}
                                            </MenuItem>
                                          ))}
                                        </Select>
                                      </FormControl>
                                    </Grid>
                                    
                                    {/* Precio Control (solo si conPrecios) */}
                                    {conPrecios && (
                                      <Grid item xs={6} sm={6}>
                                        <TextField
                                          label="Precio Control"
                                          type="number"
                                          fullWidth
                                          size="small"
                                          value={piezaForm.controlPrecio || ''}
                                          onChange={(e) => setPiezaForm(prev => ({ ...prev, controlPrecio: e.target.value }))}
                                          placeholder="2500"
                                          inputProps={{ step: 0.01 }}
                                        />
                                      </Grid>
                                    )}
                                  </Grid>
                                </Box>
                              </Grid>
                              
                              {/* Resumen de Costos de Motorización */}
                              {conPrecios && (
                                <Grid item xs={12}>
                                  <Alert severity="success" sx={{ py: 0.5, bgcolor: '#D4AF37', '& .MuiAlert-icon': { color: 'white' } }}>
                                    <Typography variant="body2" fontWeight="bold" color="white">
                                      💰 Resumen de Costos de Motorización
                                    </Typography>
                                    <Typography variant="caption" display="block" color="white">
                                      • Motores: {piezaForm.numMotores || 1} × ${parseFloat(piezaForm.motorPrecio || 0).toLocaleString()} = ${((piezaForm.numMotores || 1) * parseFloat(piezaForm.motorPrecio || 0)).toLocaleString()} MXN
                                    </Typography>
                                    <Typography variant="caption" display="block" color="white">
                                      • Controles: 1 × ${parseFloat(piezaForm.controlPrecio || 0).toLocaleString()} = ${parseFloat(piezaForm.controlPrecio || 0).toLocaleString()} MXN
                                    </Typography>
                                    <Typography variant="caption" display="block" fontWeight="bold" color="white" sx={{ mt: 0.5 }}>
                                      Total Motorización: ${((piezaForm.numMotores || 1) * parseFloat(piezaForm.motorPrecio || 0) + parseFloat(piezaForm.controlPrecio || 0)).toLocaleString()} MXN
                                    </Typography>
                                  </Alert>
                                </Grid>
                              )}
                            </>
                          )}
                        </Grid>
                      </Box>
                    </Box>
                    
                    {/* Botones de acción del formulario */}
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          setAgregandoPieza(false);
                          handleCancelarEdicion();
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="contained"
                        onClick={handleAgregarPieza}
                        sx={{ bgcolor: '#16A34A', '&:hover': { bgcolor: '#15803D' } }}
                      >
                        {editandoPieza ? 'Actualizar Partida' : 'Agregar Partida'}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Collapse>
              
              {/* ==================== LISTA DE PARTIDAS AGREGADAS ==================== */}
              {piezas.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                    📋 Partidas agregadas: {piezas.length}
                  </Typography>
                  
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'primary.main' }}>
                          <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>#</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Ubicación</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Producto</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Piezas</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Medidas</TableCell>
                          {conPrecios && <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Total</TableCell>}
                          {conPrecios && <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Motor.</TableCell>}
                          {conPrecios && <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Instalación</TableCell>}
                          <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Acciones</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {piezas.map((pieza, index) => {
                          const totalPiezas = pieza.medidas?.length || pieza.cantidad || 1;
                          const areaTotal = pieza.medidas?.reduce((sum, m) => {
                            const ancho = parseFloat(m.ancho) || 0;
                            const alto = parseFloat(m.alto) || 0;
                            return sum + (ancho * alto);
                          }, 0) || 0;
                          const precioM2 = parseFloat(pieza.precioM2) || precioGeneral;
                          const subtotal = areaTotal * precioM2;
                          const isExpanded = partidaExpandida === index;
                          
                          return (
                            <React.Fragment key={index}>
                            <TableRow 
                              sx={{ 
                                '&:hover': { bgcolor: 'grey.50' },
                                cursor: 'pointer',
                                bgcolor: isExpanded ? 'rgb(248, 250, 252)' : 'inherit'
                              }}
                              onClick={() => setPartidaExpandida(isExpanded ? null : index)}
                            >
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>
                                <Typography variant="body2" fontWeight="bold">
                                  {pieza.ubicacion}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" fontWeight="bold">
                                  {pieza.productoLabel || pieza.producto}
                                </Typography>
                                {(() => {
                                  // Obtener sistemas de todas las medidas
                                  const todosSistemas = pieza.medidas?.flatMap(m => m.sistema || []) || [];
                                  const sistemasUnicos = [...new Set(todosSistemas)];
                                  return sistemasUnicos.length > 0 && (
                                    <Typography variant="caption" display="block" color="primary.main" sx={{ fontWeight: 600 }}>
                                      {sistemasUnicos.join(', ')}
                                    </Typography>
                                  );
                                })()}
                                {pieza.modeloCodigo && (
                                  <Typography variant="caption" display="block" color="text.secondary">
                                    Modelo: {pieza.modeloCodigo}
                                  </Typography>
                                )}
                                {pieza.color && (
                                  <Typography variant="caption" display="block" color="text.secondary">
                                    Color: {pieza.color}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <Chip label={`${totalPiezas} pza${totalPiezas > 1 ? 's' : ''}`} size="small" color="primary" />
                              </TableCell>
                              <TableCell>
                                <Typography variant="caption" display="block">
                                  {areaTotal.toFixed(2)} m²
                                </Typography>
                                {pieza.medidas && pieza.medidas.map((m, i) => (
                                  <Typography key={i} variant="caption" color="text.secondary" display="block">
                                    {i + 1}: {m.ancho}×{m.alto}m
                                  </Typography>
                                ))}
                              </TableCell>
                              {conPrecios && (
                                <TableCell>
                                  <Typography variant="body2" fontWeight="bold" color="success.dark">
                                    ${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    ${precioM2}/m²
                                  </Typography>
                                </TableCell>
                              )}
                              {conPrecios && (
                                <TableCell>
                                  {pieza.motorizado ? (
                                    <Box>
                                      <Chip 
                                        label="⚡ Sí" 
                                        size="small" 
                                        color="secondary"
                                        sx={{ fontSize: '0.7rem', height: '20px', mb: 0.5 }}
                                      />
                                      <Typography variant="caption" display="block" color="text.secondary">
                                        Motor: ${parseFloat(pieza.motorPrecio || 0).toLocaleString()}
                                      </Typography>
                                      <Typography variant="caption" display="block" color="text.secondary">
                                        Control: ${parseFloat(pieza.controlPrecio || 0).toLocaleString()}
                                      </Typography>
                                      <Typography variant="caption" display="block" fontWeight="bold" color="secondary.dark">
                                        Total: ${(parseFloat(pieza.motorPrecio || 0) * (pieza.numMotores || 1) + parseFloat(pieza.controlPrecio || 0)).toLocaleString()}
                                      </Typography>
                                    </Box>
                                  ) : (
                                    <Chip 
                                      label="Manual" 
                                      size="small" 
                                      variant="outlined"
                                      sx={{ fontSize: '0.7rem', height: '20px' }}
                                    />
                                  )}
                                </TableCell>
                              )}
                              {conPrecios && (
                                <TableCell>
                                  {pieza.cobraInstalacion ? (
                                    <Box>
                                      <Chip 
                                        label="🔧 Sí" 
                                        size="small" 
                                        color="warning"
                                        sx={{ fontSize: '0.7rem', height: '20px', mb: 0.5 }}
                                      />
                                      <Typography variant="caption" display="block" color="text.secondary">
                                        {pieza.tipoInstalacion === 'fijo' && 'Precio fijo'}
                                        {pieza.tipoInstalacion === 'por_pieza' && 'Por pieza'}
                                        {pieza.tipoInstalacion === 'base_mas_pieza' && 'Base + pieza'}
                                      </Typography>
                                      <Typography variant="caption" display="block" fontWeight="bold" color="warning.dark">
                                        Total: ${(() => {
                                          const cantidad = pieza.cantidad || 1;
                                          const precioBase = parseFloat(pieza.precioInstalacion || 0);
                                          const precioPorPieza = parseFloat(pieza.precioInstalacionPorPieza || 0);
                                          
                                          if (pieza.tipoInstalacion === 'fijo') {
                                            return precioBase.toLocaleString();
                                          } else if (pieza.tipoInstalacion === 'por_pieza') {
                                            return (cantidad * precioBase).toLocaleString();
                                          } else if (pieza.tipoInstalacion === 'base_mas_pieza') {
                                            return (precioBase + (Math.max(0, cantidad - 1) * precioPorPieza)).toLocaleString();
                                          }
                                          return '0';
                                        })()}
                                      </Typography>
                                    </Box>
                                  ) : (
                                    <Chip 
                                      label="No" 
                                      size="small" 
                                      variant="outlined"
                                      sx={{ fontSize: '0.7rem', height: '20px' }}
                                    />
                                  )}
                                </TableCell>
                              )}
                              <TableCell>
                                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPartidaExpandida(isExpanded ? null : index);
                                    }}
                                    title={isExpanded ? "Ocultar detalles" : "Ver detalles"}
                                  >
                                    {isExpanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditarPieza(index);
                                      setAgregandoPieza(true);
                                    }}
                                    title="Editar"
                                  >
                                    <Edit fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (window.confirm('¿Eliminar esta partida?')) {
                                        handleEliminarPieza(index);
                                      }
                                    }}
                                    title="Eliminar"
                                  >
                                    <Delete fontSize="small" />
                                  </IconButton>
                                </Box>
                              </TableCell>
                            </TableRow>
                            
                            {/* Panel Desplegable de Detalles */}
                            {isExpanded && (
                              <TableRow>
                                <TableCell colSpan={conPrecios ? 9 : 6} sx={{ p: 0, bgcolor: 'rgb(248, 250, 252)', borderTop: '2px solid #D4AF37' }}>
                                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                    <Box sx={{ p: 3 }}>
                                      {/* NIVEL 1: Especificaciones Generales (Siempre Visible) */}
                                      <Box sx={{ mb: 3, p: 2, bgcolor: 'rgb(248, 250, 252)', borderRadius: 1, border: '1px solid #e2e8f0' }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'rgb(51, 65, 85)', mb: 1.5 }}>
                                          📋 ESPECIFICACIONES GENERALES
                                        </Typography>
                                        <Grid container spacing={2}>
                                          <Grid item xs={6} sm={3}>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                              <strong>Cantidad:</strong> {pieza.cantidad || pieza.medidas?.length || 1} pieza{((pieza.cantidad || pieza.medidas?.length || 1) > 1) ? 's' : ''}
                                            </Typography>
                                          </Grid>
                                          <Grid item xs={6} sm={3}>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                              <strong>Área Total:</strong> {(() => {
                                                const areaTotal = pieza.medidas?.reduce((sum, m) => {
                                                  const ancho = parseFloat(m.ancho) || 0;
                                                  const alto = parseFloat(m.alto) || 0;
                                                  return sum + (ancho * alto);
                                                }, 0) || 0;
                                                return areaTotal.toFixed(2);
                                              })()} m²
                                            </Typography>
                                          </Grid>
                                          <Grid item xs={6} sm={3}>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                              <strong>Color:</strong> {pieza.color || 'No especificado'}
                                            </Typography>
                                          </Grid>
                                          <Grid item xs={6} sm={3}>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                              <strong>Modelo/Código:</strong> {pieza.modeloCodigo || 'No especificado'}
                                            </Typography>
                                          </Grid>
                                        </Grid>
                                      </Box>

                                      {/* NIVEL 2: Medidas Individuales y Especificaciones Técnicas (Acordeón) */}
                                      <Box sx={{ mb: 2 }}>
                                        <Box 
                                          onClick={() => setMedidasExpandidas(prev => ({ ...prev, [index]: !prev[index] }))}
                                          sx={{ 
                                            p: 1.5, 
                                            bgcolor: 'white', 
                                            borderRadius: 1, 
                                            border: '1px solid #e2e8f0',
                                            cursor: 'pointer',
                                            '&:hover': { bgcolor: 'rgb(248, 250, 252)' },
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between'
                                          }}
                                        >
                                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'rgb(51, 65, 85)' }}>
                                            📏 Medidas Individuales y Especificaciones Técnicas
                                          </Typography>
                                          <IconButton size="small">
                                            {medidasExpandidas[index] ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                                          </IconButton>
                                        </Box>
                                        <Collapse in={medidasExpandidas[index]} timeout="auto">
                                          <Box sx={{ p: 2, bgcolor: 'white', border: '1px solid #e2e8f0', borderTop: 'none' }}>
                                            {pieza.medidas && pieza.medidas.length > 0 && (
                                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                {pieza.medidas.map((medida, i) => (
                                                  <Box key={i}>
                                                    <Box 
                                                      onClick={() => setPiezaExpandida(prev => ({ ...prev, [`${index}-${i}`]: !prev[`${index}-${i}`] }))}
                                                      sx={{ 
                                                        p: 1, 
                                                        bgcolor: 'rgb(248, 250, 252)', 
                                                        borderRadius: 1,
                                                        cursor: 'pointer',
                                                        '&:hover': { bgcolor: 'rgb(241, 245, 249)' },
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between'
                                                      }}
                                                    >
                                                      <Typography variant="caption" fontWeight="bold" color="primary">
                                                        ▸ Pieza {i + 1}: {medida.ancho}m × {medida.alto}m ({(parseFloat(medida.ancho || 0) * parseFloat(medida.alto || 0)).toFixed(2)} m²)
                                                      </Typography>
                                                      <IconButton size="small">
                                                        {piezaExpandida[`${index}-${i}`] ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                                                      </IconButton>
                                                    </Box>
                                                    <Collapse in={piezaExpandida[`${index}-${i}`]} timeout="auto">
                                                      <Box sx={{ p: 1.5, bgcolor: 'white', ml: 2, mt: 0.5, border: '1px solid #e2e8f0', borderRadius: 1 }}>
                                                        <Grid container spacing={1}>
                                                          {medida.galeria && (
                                                            <Grid item xs={6} sm={4}>
                                                              <Typography variant="caption" display="block" color="text.secondary">
                                                                <strong>Galería/Cabezal:</strong> {medida.galeria}
                                                              </Typography>
                                                            </Grid>
                                                          )}
                                                          {medida.tipoInstalacion && (
                                                            <Grid item xs={6} sm={4}>
                                                              <Typography variant="caption" display="block" color="text.secondary">
                                                                <strong>Instalación:</strong> {medida.tipoInstalacion}
                                                              </Typography>
                                                            </Grid>
                                                          )}
                                                          {medida.tipoFijacion && (
                                                            <Grid item xs={6} sm={4}>
                                                              <Typography variant="caption" display="block" color="text.secondary">
                                                                <strong>Fijación:</strong> {medida.tipoFijacion}
                                                              </Typography>
                                                            </Grid>
                                                          )}
                                                          {medida.tipoControl && (
                                                            <Grid item xs={6} sm={4}>
                                                              <Typography variant="caption" display="block" color="text.secondary">
                                                                <strong>Control:</strong> {medida.tipoControl}
                                                              </Typography>
                                                            </Grid>
                                                          )}
                                                          {(medida.caida || medida.orientacion) && (
                                                            <Grid item xs={6} sm={4}>
                                                              <Typography variant="caption" display="block" color="text.secondary">
                                                                <strong>Caída:</strong> {
                                                                  (() => {
                                                                    const valor = medida.caida || medida.orientacion;
                                                                    if (valor === 'hacia_frente') return 'Hacia el frente';
                                                                    if (valor === 'caida_normal') return 'Normal';
                                                                    if (valor === 'Caída normal') return 'Normal';
                                                                    return valor;
                                                                  })()
                                                                }
                                                              </Typography>
                                                            </Grid>
                                                          )}
                                                          {medida.telaMarca && (
                                                            <Grid item xs={6} sm={4}>
                                                              <Typography variant="caption" display="block" color="text.secondary">
                                                                <strong>Tela/Marca:</strong> {medida.telaMarca}
                                                              </Typography>
                                                            </Grid>
                                                          )}
                                                          {medida.baseTabla && (
                                                            <Grid item xs={6} sm={4}>
                                                              <Typography variant="caption" display="block" color="text.secondary">
                                                                <strong>Base/Tabla:</strong> {medida.baseTabla}
                                                              </Typography>
                                                            </Grid>
                                                          )}
                                                          {medida.modoOperacion && (
                                                            <Grid item xs={6} sm={4}>
                                                              <Typography variant="caption" display="block" color="text.secondary">
                                                                <strong>Operación:</strong> {medida.modoOperacion}
                                                              </Typography>
                                                            </Grid>
                                                          )}
                                                          {medida.detalleTecnico && (
                                                            <Grid item xs={12} sm={medida.detalleTecnico === 'otro' && medida.detalleTecnicoManual ? 12 : 4}>
                                                              <Typography variant="caption" display="block" color="text.secondary">
                                                                <strong>Detalle:</strong> {
                                                                  medida.detalleTecnico === 'otro' && medida.detalleTecnicoManual 
                                                                    ? medida.detalleTecnicoManual 
                                                                    : medida.detalleTecnico === 'traslape' ? 'Traslape'
                                                                    : medida.detalleTecnico === 'corte' ? 'Corte'
                                                                    : medida.detalleTecnico === 'sin_traslape' ? 'Sin traslape'
                                                                    : medida.detalleTecnico === 'empalme' ? 'Empalme'
                                                                    : medida.detalleTecnico === 'doble_sistema' ? 'Doble Sistema'
                                                                    : medida.detalleTecnico
                                                                }
                                                              </Typography>
                                                              {medida.detalleTecnico === 'otro' && medida.detalleTecnicoManual && (
                                                                <Typography variant="caption" display="block" sx={{ fontStyle: 'italic', color: 'primary.main', mt: 0.5 }}>
                                                                  (Personalizado)
                                                                </Typography>
                                                              )}
                                                            </Grid>
                                                          )}
                                                          {medida.traslape && (
                                                            <Grid item xs={12} sm={medida.traslape === 'otro' && medida.traslapeManual ? 12 : 4}>
                                                              <Typography variant="caption" display="block" color="text.secondary">
                                                                <strong>Traslape:</strong> {
                                                                  (() => {
                                                                    if (medida.traslape === 'otro' && medida.traslapeManual) {
                                                                      return medida.traslapeManual;
                                                                    }
                                                                    // Formatear valores predefinidos
                                                                    const valor = medida.traslape;
                                                                    if (valor === '5cm') return '5 cm';
                                                                    if (valor === '10cm') return '10 cm';
                                                                    if (valor === '15cm') return '15 cm';
                                                                    if (valor === '20cm') return '20 cm';
                                                                    return valor;
                                                                  })()
                                                                }
                                                              </Typography>
                                                              {medida.traslape === 'otro' && medida.traslapeManual && (
                                                                <Typography variant="caption" display="block" sx={{ fontStyle: 'italic', color: 'primary.main', mt: 0.5 }}>
                                                                  (Personalizado)
                                                                </Typography>
                                                              )}
                                                            </Grid>
                                                          )}
                                                          {medida.sistema && medida.sistema.length > 0 && (
                                                            <Grid item xs={12}>
                                                              <Typography variant="caption" display="block" color="primary.main" sx={{ fontWeight: 600 }}>
                                                                <strong>Sistema:</strong> {medida.sistema.join(', ')}
                                                              </Typography>
                                                            </Grid>
                                                          )}
                                                          {medida.sistemaEspecial && medida.sistemaEspecial.length > 0 && (
                                                            <Grid item xs={12}>
                                                              <Typography variant="caption" display="block" color="secondary.main" sx={{ fontWeight: 600 }}>
                                                                {medida.sistemaEspecial.join(', ')}
                                                              </Typography>
                                                            </Grid>
                                                          )}
                                                          {medida.observacionesTecnicas && (
                                                            <Grid item xs={12}>
                                                              <Typography variant="caption" display="block" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                                <strong>Obs:</strong> {medida.observacionesTecnicas}
                                                              </Typography>
                                                            </Grid>
                                                          )}
                                                        </Grid>
                                                      </Box>
                                                    </Collapse>
                                                  </Box>
                                                ))}
                                              </Box>
                                            )}
                                          </Box>
                                        </Collapse>
                                      </Box>

                                      {/* NIVEL 3: Motorización (Acordeón) */}
                                      <Box sx={{ mb: 2 }}>
                                        <Box 
                                          onClick={() => setMotorizacionExpandida(prev => ({ ...prev, [index]: !prev[index] }))}
                                          sx={{ 
                                            p: 1.5, 
                                            bgcolor: 'white', 
                                            borderRadius: 1, 
                                            border: '1px solid #e2e8f0',
                                            cursor: 'pointer',
                                            '&:hover': { bgcolor: 'rgb(248, 250, 252)' },
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between'
                                          }}
                                        >
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'rgb(51, 65, 85)' }}>
                                              ⚡ Motorización
                                            </Typography>
                                            {pieza.motorizado && conPrecios && (
                                              <Chip 
                                                label={`💰 $${(parseFloat(pieza.motorPrecio || 0) * (pieza.numMotores || 1) + parseFloat(pieza.controlPrecio || 0)).toLocaleString()}`}
                                                size="small"
                                                color="secondary"
                                                sx={{ fontSize: '0.7rem', height: '20px' }}
                                              />
                                            )}
                                          </Box>
                                          <IconButton size="small">
                                            {motorizacionExpandida[index] ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                                          </IconButton>
                                        </Box>
                                        <Collapse in={motorizacionExpandida[index]} timeout="auto">
                                          <Box sx={{ p: 2, bgcolor: 'white', border: '1px solid #e2e8f0', borderTop: 'none' }}>
                                            {pieza.motorizado ? (
                                              <Grid container spacing={2}>
                                                <Grid item xs={12} sm={6}>
                                                  <Typography variant="caption" display="block" fontWeight="bold" color="secondary.main" sx={{ mb: 0.5 }}>
                                                    🔧 Motor
                                                  </Typography>
                                                  <Typography variant="caption" display="block">
                                                    <strong>Modelo:</strong> {pieza.motorModelo === 'otro_manual' ? 'Otro (especificar)' : (pieza.motorModelo || 'No especificado')}
                                                  </Typography>
                                                  {pieza.motorModelo === 'otro_manual' && pieza.motorModeloEspecificar && (
                                                    <Typography variant="caption" display="block" sx={{ mt: 0.5, fontStyle: 'italic', bgcolor: 'rgb(248, 250, 252)', p: 0.5, borderRadius: 0.5 }}>
                                                      {pieza.motorModeloEspecificar}
                                                    </Typography>
                                                  )}
                                                  {conPrecios && (
                                                    <>
                                                      <Typography variant="caption" display="block">
                                                        <strong>Precio:</strong> ${parseFloat(pieza.motorPrecio || 0).toLocaleString()}
                                                      </Typography>
                                                      <Typography variant="caption" display="block">
                                                        <strong>Cantidad:</strong> {pieza.numMotores || 1}
                                                      </Typography>
                                                    </>
                                                  )}
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                  <Typography variant="caption" display="block" fontWeight="bold" color="info.main" sx={{ mb: 0.5 }}>
                                                    🎛️ Control
                                                  </Typography>
                                                  <Typography variant="caption" display="block">
                                                    <strong>Modelo:</strong> {pieza.controlModelo || 'No especificado'}
                                                  </Typography>
                                                  {conPrecios && (
                                                    <Typography variant="caption" display="block">
                                                      <strong>Precio:</strong> ${parseFloat(pieza.controlPrecio || 0).toLocaleString()}
                                                    </Typography>
                                                  )}
                                                  <Typography variant="caption" display="block">
                                                    <strong>Tipo:</strong> {pieza.esControlMulticanal ? 'Multicanal' : 'Individual'}
                                                  </Typography>
                                                </Grid>
                                              </Grid>
                                            ) : (
                                              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', display: 'block' }}>
                                                No motorizado (operación manual)
                                              </Typography>
                                            )}
                                          </Box>
                                        </Collapse>
                                      </Box>

                                      {/* NIVEL 3: Instalación Especial (Acordeón) */}
                                      <Box sx={{ mb: 2 }}>
                                        <Box 
                                          onClick={() => setInstalacionExpandida(prev => ({ ...prev, [index]: !prev[index] }))}
                                          sx={{ 
                                            p: 1.5, 
                                            bgcolor: 'white', 
                                            borderRadius: 1, 
                                            border: '1px solid #e2e8f0',
                                            cursor: 'pointer',
                                            '&:hover': { bgcolor: 'rgb(248, 250, 252)' },
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between'
                                          }}
                                        >
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'rgb(51, 65, 85)' }}>
                                              🔧 Instalación Especial
                                            </Typography>
                                            {pieza.cobraInstalacion && conPrecios && (
                                              <Chip 
                                                label={`💰 $${(() => {
                                                  const cantidad = pieza.cantidad || 1;
                                                  const precioBase = parseFloat(pieza.precioInstalacion || 0);
                                                  const precioPorPieza = parseFloat(pieza.precioInstalacionPorPieza || 0);
                                                  
                                                  if (pieza.tipoInstalacion === 'fijo') {
                                                    return precioBase.toLocaleString();
                                                  } else if (pieza.tipoInstalacion === 'por_pieza') {
                                                    return (cantidad * precioBase).toLocaleString();
                                                  } else if (pieza.tipoInstalacion === 'base_mas_pieza') {
                                                    return (precioBase + (Math.max(0, cantidad - 1) * precioPorPieza)).toLocaleString();
                                                  }
                                                  return '0';
                                                })()}`}
                                                size="small"
                                                color="warning"
                                                sx={{ fontSize: '0.7rem', height: '20px' }}
                                              />
                                            )}
                                          </Box>
                                          <IconButton size="small">
                                            {instalacionExpandida[index] ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                                          </IconButton>
                                        </Box>
                                        <Collapse in={instalacionExpandida[index]} timeout="auto">
                                          <Box sx={{ p: 2, bgcolor: 'white', border: '1px solid #e2e8f0', borderTop: 'none' }}>
                                            {pieza.cobraInstalacion ? (
                                              <Grid container spacing={2}>
                                                <Grid item xs={12} sm={6}>
                                                  <Typography variant="caption" display="block">
                                                    <strong>Tipo:</strong> {
                                                      pieza.tipoInstalacion === 'fijo' ? 'Precio Fijo' :
                                                      pieza.tipoInstalacion === 'por_pieza' ? 'Por Pieza' :
                                                      pieza.tipoInstalacion === 'base_mas_pieza' ? 'Base + Pieza' : 'No especificado'
                                                    }
                                                  </Typography>
                                                  {conPrecios && (
                                                    <>
                                                      {pieza.tipoInstalacion === 'fijo' && (
                                                        <Typography variant="caption" display="block">
                                                          <strong>Precio:</strong> ${parseFloat(pieza.precioInstalacion || 0).toLocaleString()}
                                                        </Typography>
                                                      )}
                                                      {pieza.tipoInstalacion === 'por_pieza' && (
                                                        <Typography variant="caption" display="block">
                                                          <strong>Por pieza:</strong> ${parseFloat(pieza.precioInstalacion || 0).toLocaleString()}
                                                        </Typography>
                                                      )}
                                                      {pieza.tipoInstalacion === 'base_mas_pieza' && (
                                                        <>
                                                          <Typography variant="caption" display="block">
                                                            <strong>Base:</strong> ${parseFloat(pieza.precioInstalacion || 0).toLocaleString()}
                                                          </Typography>
                                                          <Typography variant="caption" display="block">
                                                            <strong>Por pieza:</strong> ${parseFloat(pieza.precioInstalacionPorPieza || 0).toLocaleString()}
                                                          </Typography>
                                                        </>
                                                      )}
                                                    </>
                                                  )}
                                                </Grid>
                                                {pieza.observacionesInstalacion && (
                                                  <Grid item xs={12}>
                                                    <Typography variant="caption" display="block" sx={{ fontStyle: 'italic' }} color="text.secondary">
                                                      <strong>Observaciones:</strong> {pieza.observacionesInstalacion}
                                                    </Typography>
                                                  </Grid>
                                                )}
                                              </Grid>
                                            ) : (
                                              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', display: 'block' }}>
                                                Sin instalación especial
                                              </Typography>
                                            )}
                                          </Box>
                                        </Collapse>
                                      </Box>

                                      {/* NIVEL 3: Observaciones (Acordeón) */}
                                      <Box sx={{ mb: 2 }}>
                                        <Box 
                                          onClick={() => setObservacionesExpandida(prev => ({ ...prev, [index]: !prev[index] }))}
                                          sx={{ 
                                            p: 1.5, 
                                            bgcolor: 'white', 
                                            borderRadius: 1, 
                                            border: '1px solid #e2e8f0',
                                            cursor: 'pointer',
                                            '&:hover': { bgcolor: 'rgb(248, 250, 252)' },
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between'
                                          }}
                                        >
                                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'rgb(51, 65, 85)' }}>
                                            📝 Observaciones
                                          </Typography>
                                          <IconButton size="small">
                                            {observacionesExpandida[index] ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                                          </IconButton>
                                        </Box>
                                        <Collapse in={observacionesExpandida[index]} timeout="auto">
                                          <Box sx={{ p: 2, bgcolor: 'white', border: '1px solid #e2e8f0', borderTop: 'none' }}>
                                            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                                              {pieza.observaciones || 'Sin observaciones generales'}
                                            </Typography>
                                          </Box>
                                        </Collapse>
                                      </Box>
                                    </Box>
                                  </Collapse>
                                </TableCell>
                              </TableRow>
                            )}
                            </React.Fragment>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </CardContent>
          </Card>
          
          {/* Secciones de Instalación y Motorización ahora están DENTRO del formulario de partida */}
          
          {/* ==================== MÓDULOS DE COTIZACIÓN (FASE 3) ==================== */}
          {conPrecios && piezas.length > 0 && (
            <>
              {/* DESCUENTOS Y FACTURACIÓN - LAYOUT HORIZONTAL */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                {/* DESCUENTOS */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ height: '100%', bgcolor: 'info.50', border: 1, borderColor: 'info.200' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600, fontSize: '0.9rem' }}>
                        💸 Descuentos (Opcional)
                      </Typography>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <FormControl fullWidth size="small">
                            <InputLabel>¿Aplica Descuento?</InputLabel>
                            <Select
                              value={aplicaDescuento ? 'si' : 'no'}
                              label="¿Aplica Descuento?"
                              onChange={(e) => setAplicaDescuento(e.target.value === 'si')}
                            >
                              <MenuItem value="no">No</MenuItem>
                              <MenuItem value="si">Sí</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        
                        {aplicaDescuento && (
                          <>
                            <Grid item xs={12} sm={6}>
                              <FormControl fullWidth size="small">
                                <InputLabel>Tipo de Descuento</InputLabel>
                                <Select
                                  value={tipoDescuento}
                                  label="Tipo de Descuento"
                                  onChange={(e) => setTipoDescuento(e.target.value)}
                                >
                                  <MenuItem value="porcentaje">Porcentaje (%)</MenuItem>
                                  <MenuItem value="fijo">Monto Fijo ($)</MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>
                            
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                size="small"
                                type="number"
                                label={tipoDescuento === 'porcentaje' ? 'Porcentaje (%)' : 'Monto Fijo ($)'}
                                value={valorDescuento}
                                onChange={(e) => setValorDescuento(e.target.value)}
                                placeholder={tipoDescuento === 'porcentaje' ? '10' : '5000'}
                                inputProps={{ step: 0.01, min: 0 }}
                              />
                            </Grid>
                            
                            {valorDescuento && (
                              <Grid item xs={12}>
                                <Alert severity="success" sx={{ py: 0.5 }}>
                                  <Typography variant="body2">
                                    💰 Descuento: ${calcularDescuento.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                                  </Typography>
                                </Alert>
                              </Grid>
                            )}
                          </>
                        )}
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
                
                {/* FACTURACIÓN */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ height: '100%', bgcolor: 'success.50', border: 1, borderColor: 'success.200' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600, fontSize: '0.9rem' }}>
                        🧾 Facturación
                      </Typography>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <FormControl fullWidth size="small">
                            <InputLabel>¿Requiere Factura?</InputLabel>
                            <Select
                              value={requiereFactura ? 'si' : 'no'}
                              label="¿Requiere Factura?"
                              onChange={(e) => setRequiereFactura(e.target.value === 'si')}
                            >
                              <MenuItem value="no">No</MenuItem>
                              <MenuItem value="si">Sí (+ 16% IVA)</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        
                        {requiereFactura && (
                          <Grid item xs={12}>
                            <Alert severity="info" sx={{ py: 0.5 }}>
                              <Typography variant="body2">
                                IVA (16%): ${calcularIVA.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                              </Typography>
                            </Alert>
                          </Grid>
                        )}
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              {/* RESUMEN ECONÓMICO */}
              <Card sx={{ mb: 2, bgcolor: '#D4AF37', border: 2, borderColor: '#B8941F' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700, color: 'white' }}>
                    💰 Resumen Económico
                  </Typography>
                  
                  <Box sx={{ bgcolor: 'white', borderRadius: 1, p: 2 }}>
                    <Grid container spacing={1.5}>
                      {/* Subtotales por concepto */}
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                          <Typography variant="body2" color="text.secondary">
                            Productos ({calcularTotalM2.toFixed(2)} m²):
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            ${calcularSubtotalProductos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </Typography>
                        </Box>
                      </Grid>
                      
                      {calcularTotalMotorizacion > 0 && (
                        <Grid item xs={12}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">
                              Motorización:
                            </Typography>
                            <Typography variant="body2" fontWeight="bold">
                              ${calcularTotalMotorizacion.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </Typography>
                          </Box>
                        </Grid>
                      )}
                      
                      {calcularTotalInstalacion > 0 && (
                        <Grid item xs={12}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">
                              Instalación Especial:
                            </Typography>
                            <Typography variant="body2" fontWeight="bold">
                              ${calcularTotalInstalacion.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </Typography>
                          </Box>
                        </Grid>
                      )}
                      
                      <Grid item xs={12}>
                        <Divider sx={{ my: 1 }} />
                      </Grid>
                      
                      {/* Subtotal */}
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                          <Typography variant="body1" fontWeight="600">
                            Subtotal:
                          </Typography>
                          <Typography variant="body1" fontWeight="600">
                            ${calcularSubtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </Typography>
                        </Box>
                      </Grid>
                      
                      {/* Descuento */}
                      {calcularDescuento > 0 && (
                        <Grid item xs={12}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                            <Typography variant="body2" color="error.main">
                              Descuento:
                            </Typography>
                            <Typography variant="body2" color="error.main" fontWeight="bold">
                              -${calcularDescuento.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </Typography>
                          </Box>
                        </Grid>
                      )}
                      
                      {/* IVA */}
                      {calcularIVA > 0 && (
                        <Grid item xs={12}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">
                              IVA (16%):
                            </Typography>
                            <Typography variant="body2" fontWeight="bold">
                              ${calcularIVA.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </Typography>
                          </Box>
                        </Grid>
                      )}
                      
                      <Grid item xs={12}>
                        <Divider sx={{ my: 1 }} />
                      </Grid>
                      
                      {/* GRAN TOTAL */}
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, bgcolor: '#D4AF37', borderRadius: 1, px: 2 }}>
                          <Typography variant="h6" fontWeight="700" color="white">
                            TOTAL:
                          </Typography>
                          <Typography variant="h6" fontWeight="700" color="white">
                            ${calcularGranTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                </CardContent>
              </Card>
            </>
          )}
          
          {/* ==================== OBSERVACIONES ==================== */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <TextField
                label="Observaciones Generales"
                multiline
                rows={3}
                fullWidth
                value={comentarios}
                onChange={(e) => setComentarios(e.target.value)}
                placeholder="Notas adicionales sobre el levantamiento..."
              />
            </CardContent>
          </Card>
        </DialogContent>
        
        {/* ==================== FOOTER / ACTIONS ==================== */}
        <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
          <Button 
            onClick={cerrarModal} 
            variant="outlined"
            sx={{ color: '#6B7280', borderColor: '#6B7280' }}
          >
            Cancelar
          </Button>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            {/* Botón Ver PDF - Solo cuando hay piezas */}
            {piezas.length > 0 && (
              <Button
                onClick={handleVerPDF}
                disabled={guardando || guardandoPDF || piezas.length === 0}
                variant="outlined"
                startIcon={<PictureAsPdf />}
                sx={{
                  borderColor: '#DC2626',
                  color: '#DC2626',
                  '&:hover': {
                    borderColor: '#B91C1C',
                    bgcolor: 'rgba(220, 38, 38, 0.04)'
                  }
                }}
              >
                {guardandoPDF ? 'Generando PDF...' : 'Ver PDF'}
              </Button>
            )}
            
            {/* Botón Guardar */}
            <Button
              onClick={conPrecios ? handleGuardarCotizacionEnVivo : handleGuardarMedidasTecnicas}
              disabled={guardando || guardandoPDF || piezas.length === 0}
              variant="contained"
              sx={{ bgcolor: '#16A34A', '&:hover': { bgcolor: '#15803D' } }}
            >
              {guardando ? 'Guardando...' : conPrecios ? '💰 Guardar Cotización' : '💾 Guardar Medidas'}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
      
      {/* ==================== MODALES DE SOPORTE ==================== */}
      <CapturaModal
        open={capturaModalOpen}
        onClose={() => setCapturaModalOpen(false)}
      />
      
      <InspectorElementos
        open={inspectorModalOpen}
        onClose={() => setInspectorModalOpen(false)}
      />
    </>
  );
};

export default AgregarMedidasProyectoModal; 

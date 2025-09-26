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
  Close
} from '@mui/icons-material';
import TextFieldConDictado from '../Common/TextFieldConDictado';
import axiosConfig from '../../config/axios';

const etapaOptions = [
  'Visita Inicial / Medición',
  'Seguimiento',
  'Presentación de Propuesta',
  'Negociación',
  'Cierre',
  'Entrega',
  'Postventa'
];

const productosOptions = [
  { label: "Persianas Screen 3%", value: "screen_3" },
  { label: "Persianas Screen 5%", value: "screen_5" },
  { label: "Persianas Screen 10%", value: "screen_10" },
  { label: "Persianas Blackout", value: "blackout" },
  { label: "Persianas Duo / Sheer Elegance", value: "duo" },
  { label: "Toldos Verticales (Screen, Soltis, etc.)", value: "toldo_vertical" },
  { label: "Toldos Retráctiles", value: "toldo_retractil" },
  { label: "Cortinas Motorizadas", value: "motorizadas" },
  { label: "Cortinas Manuales", value: "manuales" },
  { label: "Sistemas Antihuracán (paneles, rollos, reforzados)", value: "antihuracan" },
  { label: "Pérgolas y Sombras", value: "pergolas" },
  // Opciones comunes para casos especiales
  { label: "Doble Cortina (2 en 1 ventana)", value: "doble_cortina" },
  { label: "Cortina + Screen (combinado)", value: "cortina_screen" },
  { label: "Sistema Día/Noche", value: "dia_noche" },
  { label: "Cortinas Tradicionales", value: "cortina_tradicional" },
  { label: "+ Agregar producto personalizado", value: "nuevo" }
];

// Modelos de toldos predefinidos
const modelosToldos = {
  caida_vertical: [
    { label: "Padova", value: "padova" },
    { label: "Contempo", value: "contempo" },
    { label: "Otro (especificar)", value: "otro_manual" }
  ],
  proyeccion: [
    { label: "Europa", value: "europa" },
    { label: "Cofre", value: "cofre" },
    { label: "Sunset", value: "sunset" },
    { label: "Otro (especificar)", value: "otro_manual" }
  ]
};

// Modelos de motores predefinidos
const modelosMotores = [
  { label: "Somfy 25 Nm", value: "somfy_25nm" },
  { label: "Somfy 35 Nm", value: "somfy_35nm" },
  { label: "Somfy RTS", value: "somfy_rts" },
  { label: "Otro (especificar)", value: "otro_manual" }
];

// Modelos de controles predefinidos
const modelosControles = [
  { label: "Monocanal", value: "monocanal" },
  { label: "Multicanal", value: "multicanal" },
  { label: "Otro (especificar)", value: "otro_manual" }
];

const emptyPieza = {
  ubicacion: '',
  cantidad: 1, // Nueva propiedad para cantidad de piezas
  medidas: [{ 
    ancho: '', 
    alto: '',
    producto: productosOptions[0].value, // Producto específico por pieza
    productoLabel: productosOptions[0].label, // Label específico por pieza
    color: 'Blanco', // Color específico por pieza
    precioM2: '' // Precio específico por pieza
  }], // Array de medidas individuales con productos específicos
  producto: productosOptions[0].value, // Producto base (para compatibilidad)
  productoLabel: productosOptions[0].label, // Label base (para compatibilidad)
  color: 'Blanco', // Color base (para compatibilidad)
  precioM2: '', // Precio base (para compatibilidad)
  observaciones: '',
  fotoUrls: [], // Cambio a array para múltiples fotos
  videoUrl: '',
  // Nuevos campos para toldos
  esToldo: false,
  tipoToldo: 'caida_vertical', // 'caida_vertical' o 'proyeccion'
  kitModelo: '',
  kitModeloManual: '',
  kitPrecio: '',
  // Nuevos campos para motorización
  motorizado: false,
  motorModelo: '',
  motorModeloManual: '',
  motorPrecio: '',
  controlModelo: '',
  controlModeloManual: '',
  controlPrecio: ''
};

const AgregarEtapaModal = ({ open, onClose, prospectoId, onSaved, onError }) => {
  const [nombreEtapa, setNombreEtapa] = useState(etapaOptions[0]);
  const [unidad, setUnidad] = useState('m');
  const [piezas, setPiezas] = useState([]);
  const [agregandoPieza, setAgregandoPieza] = useState(false);
  const [piezaForm, setPiezaForm] = useState(emptyPieza);
  const [comentarios, setComentarios] = useState('');
  const [precioGeneral, setPrecioGeneral] = useState(750);
  const [guardando, setGuardando] = useState(false);
  const [generandoCotizacion, setGenerandoCotizacion] = useState(false);
  const [descargandoLevantamiento, setDescargandoLevantamiento] = useState(false);
  const [descargandoExcel, setDescargandoExcel] = useState(false);
  const [errorLocal, setErrorLocal] = useState('');
  
  // Estados para productos
  const [mostrarNuevoProducto, setMostrarNuevoProducto] = useState(false);
  const [nuevoProductoNombre, setNuevoProductoNombre] = useState('');
  
  // Estados para subida de archivos
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  
  // Estados para instalación manual
  const [cobraInstalacion, setCobraInstalacion] = useState(false);
  const [precioInstalacion, setPrecioInstalacion] = useState('');
  const [tipoInstalacion, setTipoInstalacion] = useState('estandar');
  
  // Estados para edición de partidas
  const [editandoPieza, setEditandoPieza] = useState(false);
  const [indiceEditando, setIndiceEditando] = useState(-1);
  
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
  
  // Estados para fecha y hora
  const [fechaEtapa, setFechaEtapa] = useState('');
  const [horaEtapa, setHoraEtapa] = useState('');

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
    setPiezas([]);
    setComentarios('');
    setPrecioGeneral(750);
    setErrorLocal('');
    setAgregandoPieza(false);
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
    // Reset fecha y hora
    setFechaEtapa('');
    setHoraEtapa('');
  };

  useEffect(() => {
    if (!open) {
      resetFormulario();
    }
  }, [open]);

  const calcularTotalM2 = useMemo(() => {
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
  }, [piezas, unidad]);

  // Calcular subtotal de productos con precios específicos
  const calcularSubtotalProductos = useMemo(() => {
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
        // Motores: uno por pieza
        subtotalPieza += (parseFloat(pieza.motorPrecio) || 0) * cantidadPiezasPartida;
        // Control: uno por partida (no por pieza)
        subtotalPieza += parseFloat(pieza.controlPrecio) || 0;
      }
      
      return total + subtotalPieza;
    }, 0);
  }, [piezas, unidad, precioGeneral]);

  // Calcular descuento
  const calcularDescuento = useMemo(() => {
    if (!aplicaDescuento || !valorDescuento) return 0;
    
    const subtotalConInstalacion = calcularSubtotalProductos + (cobraInstalacion ? parseFloat(precioInstalacion) || 0 : 0);
    
    if (tipoDescuento === 'porcentaje') {
      const porcentaje = parseFloat(valorDescuento) || 0;
      return (subtotalConInstalacion * porcentaje) / 100;
    } else {
      return parseFloat(valorDescuento) || 0;
    }
  }, [aplicaDescuento, valorDescuento, tipoDescuento, calcularSubtotalProductos, cobraInstalacion, precioInstalacion]);

  // Calcular IVA y total con factura
  const calcularIVA = useMemo(() => {
    if (!requiereFactura) return 0;
    const subtotalConInstalacion = calcularSubtotalProductos + (cobraInstalacion ? parseFloat(precioInstalacion) || 0 : 0);
    const subtotalConDescuento = subtotalConInstalacion - calcularDescuento;
    return subtotalConDescuento * 0.16; // 16% IVA
  }, [requiereFactura, calcularSubtotalProductos, cobraInstalacion, precioInstalacion, calcularDescuento]);

  const totalConIVA = useMemo(() => {
    const subtotalConInstalacion = calcularSubtotalProductos + (cobraInstalacion ? parseFloat(precioInstalacion) || 0 : 0);
    const subtotalConDescuento = subtotalConInstalacion - calcularDescuento;
    return subtotalConDescuento + calcularIVA;
  }, [calcularSubtotalProductos, cobraInstalacion, precioInstalacion, calcularDescuento, calcularIVA]);

  // Calcular total final (con o sin IVA)
  const totalFinal = useMemo(() => {
    return requiereFactura ? totalConIVA : (calcularSubtotalProductos + (cobraInstalacion ? parseFloat(precioInstalacion) || 0 : 0) - calcularDescuento);
  }, [requiereFactura, totalConIVA, calcularSubtotalProductos, cobraInstalacion, precioInstalacion, calcularDescuento]);

  // Calcular anticipo (60%) y saldo (40%)
  const anticipo = useMemo(() => {
    return totalFinal * 0.6;
  }, [totalFinal]);

  const saldo = useMemo(() => {
    return totalFinal * 0.4;
  }, [totalFinal]);

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

  // Función para sincronizar colores individuales con el campo general
  const sincronizarColores = () => {
    if (piezaForm.medidas && piezaForm.medidas.length > 0) {
      // Obtener colores únicos de las piezas
      const coloresUnicos = [...new Set(piezaForm.medidas.map(m => m.color).filter(c => c))];
      
      if (coloresUnicos.length === 1) {
        // Si todas las piezas tienen el mismo color, usar ese
        setPiezaForm(prev => ({ ...prev, color: coloresUnicos[0] }));
      } else if (coloresUnicos.length > 1) {
        // Si hay colores diferentes, mostrar "Mixto"
        setPiezaForm(prev => ({ ...prev, color: `Mixto (${coloresUnicos.join(', ')})` }));
      }
    }
  };

  // Función para detectar si un producto es toldo
  const esToldo = (producto) => {
    return producto && (producto.includes('toldo') || producto === 'toldo_vertical' || producto === 'toldo_retractil');
  };

  // Función para detectar si un producto puede ser motorizado
  const puedeSerMotorizado = (producto) => {
    const productosMotorizables = [
      'toldo_vertical', 'toldo_retractil', 'screen_3', 'screen_5', 'screen_10', 
      'blackout', 'duo', 'motorizadas', 'cortina_tradicional'
    ];
    return productosMotorizables.includes(producto);
  };

  // Función para actualizar las medidas cuando cambie la cantidad
  const actualizarMedidas = (nuevaCantidad) => {
    const cantidad = parseInt(nuevaCantidad) || 1;
    const medidasActuales = piezaForm.medidas || [];
    
    // Crear array de medidas según la nueva cantidad
    const nuevasMedidas = [];
    for (let i = 0; i < cantidad; i++) {
      // Mantener medidas existentes o crear nuevas con valores base
      nuevasMedidas.push(medidasActuales[i] || { 
        ancho: '', 
        alto: '',
        producto: piezaForm.producto || productosOptions[0].value,
        productoLabel: piezaForm.productoLabel || productosOptions[0].label,
        color: piezaForm.color || 'Blanco',
        precioM2: piezaForm.precioM2 || ''
      });
    }
    
    setPiezaForm(prev => ({
      ...prev,
      cantidad: cantidad,
      medidas: nuevasMedidas
    }));
  };

  const handleAgregarPieza = () => {
    if (!piezaForm.ubicacion) {
      setErrorLocal('Completa la ubicación para agregar la partida.');
      return;
    }

    const cantidad = parseInt(piezaForm.cantidad) || 1;
    if (cantidad < 1 || cantidad > 20) {
      setErrorLocal('La cantidad de piezas debe ser entre 1 y 20.');
      return;
    }

    // Validar que todas las medidas estén completas
    const medidas = piezaForm.medidas || [];
    for (let i = 0; i < cantidad; i++) {
      const medida = medidas[i];
      if (!medida || !medida.ancho || !medida.alto) {
        setErrorLocal(`Completa las medidas de la pieza ${i + 1}.`);
        return;
      }
    }

    // Encontrar el label del producto seleccionado
    const productoSeleccionado = productosOptions.find(p => p.value === piezaForm.producto);
    const productoLabel = productoSeleccionado ? productoSeleccionado.label : piezaForm.productoLabel || piezaForm.producto;
    
    // Procesar medidas individuales con productos específicos
    const medidasProcesadas = medidas.slice(0, cantidad).map((medida, index) => ({
      ancho: parseFloat(medida.ancho) || 0,
      alto: parseFloat(medida.alto) || 0,
      area: unidad === 'cm' ? 
        (parseFloat(medida.ancho) * parseFloat(medida.alto)) / 10000 : 
        parseFloat(medida.ancho) * parseFloat(medida.alto),
      producto: medida.producto || piezaForm.producto,
      productoLabel: medida.productoLabel || piezaForm.productoLabel,
      color: medida.color || piezaForm.color,
      precioM2: medida.precioM2 || piezaForm.precioM2 || ''
    }));

    // Crear la partida (una sola entrada que representa múltiples piezas)
    const nuevaPartida = {
      ...piezaForm,
      cantidad: cantidad,
      medidas: medidasProcesadas, // Array de medidas individuales
      precioM2: parseFloat(piezaForm.precioM2) || precioGeneral,
      productoLabel: productoLabel,
      // Preservar información de toldos
      esToldo: piezaForm.esToldo || false,
      tipoToldo: piezaForm.tipoToldo || 'caida_vertical',
      kitModelo: piezaForm.kitModelo || '',
      kitModeloManual: piezaForm.kitModeloManual || '',
      kitPrecio: piezaForm.kitPrecio || '',
      // Preservar información de motorización
      motorizado: piezaForm.motorizado || false,
      motorModelo: piezaForm.motorModelo || '',
      motorModeloManual: piezaForm.motorModeloManual || '',
      motorPrecio: piezaForm.motorPrecio || '',
      controlModelo: piezaForm.controlModelo || '',
      controlModeloManual: piezaForm.controlModeloManual || '',
      controlPrecio: piezaForm.controlPrecio || '',
      // Agregar descripción de la partida
      observaciones: `${piezaForm.observaciones ? piezaForm.observaciones + ' - ' : ''}Partida de ${cantidad} pieza${cantidad > 1 ? 's' : ''}`
    };

    if (editandoPieza && indiceEditando >= 0) {
      // Actualizar partida existente
      setPiezas((prev) => {
        const nuevasPiezas = [...prev];
        nuevasPiezas[indiceEditando] = nuevaPartida;
        return nuevasPiezas;
      });
      
      const mensaje = `✅ Se actualizó partida con ${cantidad} pieza${cantidad > 1 ? 's' : ''} en ${piezaForm.ubicacion}`;
      setErrorLocal('');
      setTimeout(() => {
        setErrorLocal(mensaje);
        setTimeout(() => setErrorLocal(''), 4000);
      }, 100);
      
      // Limpiar estado de edición
      setEditandoPieza(false);
      setIndiceEditando(-1);
    } else {
      // Agregar nueva partida
      setPiezas((prev) => [...prev, nuevaPartida]);
      
      const mensaje = `✅ Se agregó partida con ${cantidad} pieza${cantidad > 1 ? 's' : ''} en ${piezaForm.ubicacion}`;
      setErrorLocal('');
      setTimeout(() => {
        setErrorLocal(mensaje);
        setTimeout(() => setErrorLocal(''), 4000);
      }, 100);
    }
    
    setPiezaForm(emptyPieza);
    setAgregandoPieza(false);
  };

  const handleEliminarPieza = (index) => {
    setPiezas((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEditarPieza = (index) => {
    const piezaAEditar = piezas[index];
    
    // Cargar datos de la pieza en el formulario
    setPiezaForm({
      ubicacion: piezaAEditar.ubicacion,
      cantidad: piezaAEditar.cantidad || (piezaAEditar.medidas ? piezaAEditar.medidas.length : 1),
      medidas: piezaAEditar.medidas || [{ 
        ancho: piezaAEditar.ancho || '', 
        alto: piezaAEditar.alto || '',
        producto: piezaAEditar.producto,
        productoLabel: piezaAEditar.productoLabel,
        color: piezaAEditar.color,
        precioM2: piezaAEditar.precioM2
      }],
      producto: piezaAEditar.producto,
      productoLabel: piezaAEditar.productoLabel,
      color: piezaAEditar.color,
      precioM2: piezaAEditar.precioM2 || '',
      observaciones: piezaAEditar.observaciones || '',
      fotoUrls: piezaAEditar.fotoUrls || [],
      videoUrl: piezaAEditar.videoUrl || '',
      // Cargar información de toldos
      esToldo: piezaAEditar.esToldo || false,
      tipoToldo: piezaAEditar.tipoToldo || 'caida_vertical',
      kitModelo: piezaAEditar.kitModelo || '',
      kitModeloManual: piezaAEditar.kitModeloManual || '',
      kitPrecio: piezaAEditar.kitPrecio || '',
      // Cargar información de motorización
      motorizado: piezaAEditar.motorizado || false,
      motorModelo: piezaAEditar.motorModelo || '',
      motorModeloManual: piezaAEditar.motorModeloManual || '',
      motorPrecio: piezaAEditar.motorPrecio || '',
      controlModelo: piezaAEditar.controlModelo || '',
      controlModeloManual: piezaAEditar.controlModeloManual || '',
      controlPrecio: piezaAEditar.controlPrecio || ''
    });
    
    setIndiceEditando(index);
    setEditandoPieza(true);
    setAgregandoPieza(true);
  };

  const handleCancelarEdicion = () => {
    setEditandoPieza(false);
    setIndiceEditando(-1);
    setPiezaForm(emptyPieza);
    setAgregandoPieza(false);
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
    
    // Seleccionar el nuevo producto en el formulario
    setPiezaForm(prev => ({ 
      ...prev, 
      producto: customValue,
      productoLabel: nombreLimpio
    }));
    
    // Cerrar el formulario de nuevo producto y limpiar
    setMostrarNuevoProducto(false);
    setNuevoProductoNombre('');
    setErrorLocal('');
    
    console.log('✅ Producto personalizado creado:', {
      value: customValue,
      label: nombreLimpio
    });
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
      formData.append('prospectoId', prospectoId);

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
    if (!prospectoId) {
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
      const payload = {
        prospectoId,
        piezas: piezas.map((pieza) => ({
          ubicacion: pieza.ubicacion,
          cantidad: pieza.cantidad || 1,
          medidas: pieza.medidas || [{ 
            ancho: (pieza.medidas && pieza.medidas.length > 0) ? Number(pieza.medidas[0].ancho) || 0 : (pieza.ancho !== '' ? Number(pieza.ancho) : 0),
            alto: (pieza.medidas && pieza.medidas.length > 0) ? Number(pieza.medidas[0].alto) || 0 : (pieza.alto !== '' ? Number(pieza.alto) : 0),
            area: pieza.ancho && pieza.alto ? Number(pieza.ancho) * Number(pieza.alto) : 0,
            producto: pieza.producto,
            productoLabel: pieza.productoLabel,
            color: pieza.color,
            precioM2: pieza.precioM2
          }],
          producto: pieza.producto,
          productoLabel: pieza.productoLabel,
          color: pieza.color,
          precioM2: pieza.precioM2,
          observaciones: pieza.observaciones,
          // Información de toldos
          esToldo: pieza.esToldo || false,
          tipoToldo: pieza.tipoToldo || '',
          kitModelo: pieza.kitModelo || '',
          kitModeloManual: pieza.kitModeloManual || '',
          kitPrecio: pieza.kitPrecio ? Number(pieza.kitPrecio) : 0,
          // Información de motorización
          motorizado: pieza.motorizado || false,
          motorModelo: pieza.motorModelo || '',
          motorModeloManual: pieza.motorModeloManual || '',
          motorPrecio: pieza.motorPrecio ? Number(pieza.motorPrecio) : 0,
          controlModelo: pieza.controlModelo || '',
          controlModeloManual: pieza.controlModeloManual || '',
          controlPrecio: pieza.controlPrecio ? Number(pieza.controlPrecio) : 0,
          // Compatibilidad con formato anterior
          ancho: (pieza.medidas && pieza.medidas.length > 0) ? Number(pieza.medidas[0].ancho) || 0 : (pieza.ancho !== '' ? Number(pieza.ancho) : 0),
          alto: pieza.alto !== '' ? Number(pieza.alto) : 0
        })),
        precioGeneral: Number(precioGeneral),
        totalM2: calcularTotalM2,
        subtotalProductos: calcularSubtotalProductos,
        unidadMedida: unidad,
        // Información de instalación
        instalacion: {
          cobra: cobraInstalacion,
          tipo: tipoInstalacion,
          precio: cobraInstalacion ? Number(precioInstalacion) || 0 : 0
        },
        // Información de descuentos
        descuento: {
          aplica: aplicaDescuento,
          tipo: tipoDescuento,
          valor: aplicaDescuento ? Number(valorDescuento) || 0 : 0,
          monto: calcularDescuento
        },
        // Totales finales
        totalFinal: calcularSubtotalProductos + (cobraInstalacion ? parseFloat(precioInstalacion) || 0 : 0) - calcularDescuento
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

  const handleDescargarExcel = async () => {
    if (!prospectoId) {
      setErrorLocal('No se encontró el identificador del prospecto.');
      return;
    }

    if (piezas.length === 0) {
      setErrorLocal('Debes agregar al menos una partida para descargar el Excel.');
      return;
    }

    setDescargandoExcel(true);
    setErrorLocal('');

    try {
      const payload = {
        prospectoId,
        piezas: piezas.map((pieza) => ({
          ubicacion: pieza.ubicacion,
          cantidad: pieza.cantidad || 1,
          medidas: pieza.medidas || [{ 
            ancho: (pieza.medidas && pieza.medidas.length > 0) ? Number(pieza.medidas[0].ancho) || 0 : (pieza.ancho !== '' ? Number(pieza.ancho) : 0),
            alto: (pieza.medidas && pieza.medidas.length > 0) ? Number(pieza.medidas[0].alto) || 0 : (pieza.alto !== '' ? Number(pieza.alto) : 0),
            area: pieza.ancho && pieza.alto ? Number(pieza.ancho) * Number(pieza.alto) : 0,
            producto: pieza.producto,
            productoLabel: pieza.productoLabel,
            color: pieza.color,
            precioM2: pieza.precioM2
          }],
          producto: pieza.producto,
          productoLabel: pieza.productoLabel,
          color: pieza.color,
          precioM2: pieza.precioM2 !== '' ? Number(pieza.precioM2) : undefined,
          observaciones: pieza.observaciones,
          fotoUrls: pieza.fotoUrls || [],
          videoUrl: pieza.videoUrl || '',
          // Información de toldos
          esToldo: pieza.esToldo || false,
          tipoToldo: pieza.tipoToldo || '',
          kitModelo: pieza.kitModelo || '',
          kitModeloManual: pieza.kitModeloManual || '',
          kitPrecio: pieza.kitPrecio ? Number(pieza.kitPrecio) : 0,
          // Información de motorización
          motorizado: pieza.motorizado || false,
          motorModelo: pieza.motorModelo || '',
          motorModeloManual: pieza.motorModeloManual || '',
          motorPrecio: pieza.motorPrecio ? Number(pieza.motorPrecio) : 0,
          controlModelo: pieza.controlModelo || '',
          controlModeloManual: pieza.controlModeloManual || '',
          controlPrecio: pieza.controlPrecio ? Number(pieza.controlPrecio) : 0,
          // Compatibilidad con formato anterior
          ancho: (pieza.medidas && pieza.medidas.length > 0) ? Number(pieza.medidas[0].ancho) || 0 : (pieza.ancho !== '' ? Number(pieza.ancho) : 0),
          alto: pieza.alto !== '' ? Number(pieza.alto) : 0
        })),
        precioGeneral: Number(precioGeneral),
        totalM2: calcularTotalM2,
        subtotalProductos: calcularSubtotalProductos,
        unidadMedida: unidad,
        // Información de instalación
        instalacion: {
          cobra: cobraInstalacion,
          tipo: tipoInstalacion,
          precio: cobraInstalacion ? Number(precioInstalacion) || 0 : 0
        },
        // Información de descuentos
        descuento: {
          aplica: aplicaDescuento,
          tipo: tipoDescuento,
          valor: aplicaDescuento ? Number(valorDescuento) || 0 : 0,
          monto: calcularDescuento
        },
        // Totales finales
        totalFinal: calcularSubtotalProductos + (cobraInstalacion ? parseFloat(precioInstalacion) || 0 : 0) - calcularDescuento
      };

      const response = await axiosConfig.post('/etapas/levantamiento-excel', payload, {
        responseType: 'blob'
      });

      // Crear enlace de descarga
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Levantamiento-Medidas-${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      console.log('✅ Excel descargado exitosamente');
    } catch (error) {
      console.error('Error descargando Excel:', error);
      const mensaje = error.response?.data?.message || 'No se pudo descargar el Excel.';
      setErrorLocal(mensaje);
    } finally {
      setDescargandoExcel(false);
    }
  };

  const handleGenerarCotizacion = async () => {
    if (!prospectoId) {
      setErrorLocal('No se encontró el identificador del prospecto.');
      return;
    }

    if (piezas.length === 0) {
      setErrorLocal('Debes agregar al menos una partida para generar la cotización.');
      return;
    }

    setGenerandoCotizacion(true);
    setErrorLocal('');

    try {
      const payload = {
        prospectoId,
        piezas: piezas.map((pieza) => {
          // Obtener medidas del formato nuevo o del formato anterior
          let ancho = 0, alto = 0;
          
          if (pieza.medidas && pieza.medidas.length > 0) {
            // Formato nuevo: usar la primera medida como representativa
            ancho = Number(pieza.medidas[0].ancho) || 0;
            alto = Number(pieza.medidas[0].alto) || 0;
          } else if (pieza.ancho !== undefined && pieza.alto !== undefined) {
            // Formato anterior: usar campos directos
            ancho = pieza.ancho !== '' ? Number(pieza.ancho) : 0;
            alto = pieza.alto !== '' ? Number(pieza.alto) : 0;
          }
          
          return {
            ubicacion: pieza.ubicacion,
            cantidad: pieza.cantidad || 1,
            ancho: ancho,
            alto: alto,
            // Incluir también el array de medidas para compatibilidad completa
            medidas: pieza.medidas || [{ ancho, alto }],
            producto: pieza.producto,
            productoLabel: pieza.productoLabel,
            color: pieza.color,
            precioM2: pieza.precioM2 !== '' ? Number(pieza.precioM2) : precioGeneral,
            observaciones: pieza.observaciones,
            fotoUrls: pieza.fotoUrls || [],
            videoUrl: pieza.videoUrl || '',
            // Información de toldos
            esToldo: pieza.esToldo || false,
            tipoToldo: pieza.tipoToldo || '',
            kitModelo: pieza.kitModelo || '',
            kitModeloManual: pieza.kitModeloManual || '',
            kitPrecio: pieza.kitPrecio ? Number(pieza.kitPrecio) : 0,
            // Información de motorización
            motorizado: pieza.motorizado || false,
            motorModelo: pieza.motorModelo || '',
            motorModeloManual: pieza.motorModeloManual || '',
            motorPrecio: pieza.motorPrecio ? Number(pieza.motorPrecio) : 0,
            controlModelo: pieza.controlModelo || '',
            controlModeloManual: pieza.controlModeloManual || '',
            controlPrecio: pieza.controlPrecio ? Number(pieza.controlPrecio) : 0
          };
        }),
        precioGeneral: Number(precioGeneral),
        totalM2: calcularTotalM2,
        unidadMedida: unidad,
        comentarios,
        // Información de instalación especial
        instalacionEspecial: cobraInstalacion ? {
          activa: true,
          tipo: tipoInstalacion,
          precio: Number(precioInstalacion) || 0
        } : { activa: false }
      };

      const { data } = await axiosConfig.post('/cotizaciones/desde-visita', payload);
      
      onSaved?.(
        `¡Cotización ${data.cotizacion.numero} generada exitosamente! El prospecto se movió a "Cotizaciones Activas".`,
        data.cotizacion
      );
      cerrarModal();
    } catch (error) {
      console.error('Error generando cotización:', error);
      const mensaje = error.response?.data?.message || 'No se pudo generar la cotización.';
      setErrorLocal(mensaje);
      onError?.(mensaje);
    } finally {
      setGenerandoCotizacion(false);
    }
  };

  const handleGuardarEtapa = async () => {
    if (!prospectoId) {
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
      console.log('- Partidas array:', piezas);
      console.log('- Cantidad de partidas:', piezas.length);
      console.log('- Piezas totales:', piezas.reduce((total, partida) => total + (partida.cantidad || 1), 0));
      console.log('- Tipo de visita:', tipoVisitaInicial);
      console.log('- Nombre etapa:', nombreEtapa);
      
      // Debug detallado de cada partida
      piezas.forEach((partida, index) => {
        console.log(`📦 Partida ${index + 1}: ${partida.ubicacion} - ${partida.cantidad || 1} piezas`);
      });
      let payload = {
        prospectoId,
        nombreEtapa,
        comentarios,
        unidadMedida: unidad,
        precioGeneral: Number(precioGeneral),
        totalM2: calcularTotalM2,
        // Incluir fecha y hora si están definidas
        fechaEtapa: fechaEtapa || undefined,
        horaEtapa: horaEtapa || undefined,
        piezas: piezas.map((pieza) => {
          console.log(`🔍 Procesando pieza: ${pieza.ubicacion}, cantidad original: ${pieza.cantidad}`);
          return {
            ubicacion: pieza.ubicacion,
            cantidad: pieza.cantidad || 1,
            ancho: (pieza.medidas && pieza.medidas.length > 0) ? Number(pieza.medidas[0].ancho) || 0 : (pieza.ancho !== '' ? Number(pieza.ancho) : 0),
            alto: (pieza.medidas && pieza.medidas.length > 0) ? Number(pieza.medidas[0].alto) || 0 : (pieza.alto !== '' ? Number(pieza.alto) : 0),
            producto: pieza.producto,
            productoLabel: pieza.productoLabel,
            color: pieza.color,
            precioM2: pieza.precioM2 !== '' ? Number(pieza.precioM2) : undefined,
            observaciones: pieza.observaciones,
            fotoUrls: pieza.fotoUrls || [],
            videoUrl: pieza.videoUrl || '',
            // Incluir medidas individuales para levantamiento técnico
            medidas: pieza.medidas || []
          };
        }),
        // Información de instalación especial
        instalacionEspecial: cobraInstalacion ? {
          activa: true,
          tipo: tipoInstalacion,
          precio: Number(precioInstalacion) || 0
        } : { activa: false }
      };

      // Si es levantamiento técnico, agregar información específica
      if (tipoVisitaInicial === 'levantamiento') {
        payload = {
          ...payload,
          tipoVisita: 'levantamiento',
          datosLevantamiento: {
            personaVisita: piezaForm.personaVisita || '',
            piezas: piezas.map((pieza) => ({
              ...pieza,
              medidas: pieza.medidas || []
            }))
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
      const payload = {
        prospectoId,
        piezas: piezas.map((pieza) => ({
          ubicacion: pieza.ubicacion,
          cantidad: pieza.cantidad || 1,
          medidas: pieza.medidas || [{ 
            ancho: (pieza.medidas && pieza.medidas.length > 0) ? Number(pieza.medidas[0].ancho) || 0 : (pieza.ancho !== '' ? Number(pieza.ancho) : 0),
            alto: (pieza.medidas && pieza.medidas.length > 0) ? Number(pieza.medidas[0].alto) || 0 : (pieza.alto !== '' ? Number(pieza.alto) : 0),
            area: pieza.ancho && pieza.alto ? Number(pieza.ancho) * Number(pieza.alto) : 0,
            producto: pieza.producto,
            productoLabel: pieza.productoLabel,
            color: pieza.color,
            precioM2: pieza.precioM2
          }],
          producto: pieza.producto,
          productoLabel: pieza.productoLabel,
          color: pieza.color,
          precioM2: pieza.precioM2,
          observaciones: pieza.observaciones,
          // Información de toldos
          esToldo: pieza.esToldo || false,
          tipoToldo: pieza.tipoToldo || '',
          kitModelo: pieza.kitModelo || '',
          kitModeloManual: pieza.kitModeloManual || '',
          kitPrecio: pieza.kitPrecio ? Number(pieza.kitPrecio) : 0,
          // Información de motorización
          motorizado: pieza.motorizado || false,
          motorModelo: pieza.motorModelo || '',
          motorModeloManual: pieza.motorModeloManual || '',
          motorPrecio: pieza.motorPrecio ? Number(pieza.motorPrecio) : 0,
          controlModelo: pieza.controlModelo || '',
          controlModeloManual: pieza.controlModeloManual || '',
          controlPrecio: pieza.controlPrecio ? Number(pieza.controlPrecio) : 0,
          // Compatibilidad con formato anterior
          ancho: (pieza.medidas && pieza.medidas.length > 0) ? Number(pieza.medidas[0].ancho) || 0 : (pieza.ancho !== '' ? Number(pieza.ancho) : 0),
          alto: pieza.alto !== '' ? Number(pieza.alto) : 0
        })),
        precioGeneral: Number(precioGeneral),
        totalM2: calcularTotalM2,
        subtotalProductos: calcularSubtotalProductos,
        unidadMedida: unidad,
        // Información de instalación
        instalacion: {
          cobra: cobraInstalacion,
          tipo: tipoInstalacion,
          precio: cobraInstalacion ? Number(precioInstalacion) || 0 : 0
        },
        // Información de descuentos
        descuento: {
          aplica: aplicaDescuento,
          tipo: tipoDescuento,
          valor: aplicaDescuento ? Number(valorDescuento) || 0 : 0,
          monto: calcularDescuento
        },
        // Nueva información para pedidos
        facturacion: {
          requiereFactura,
          iva: calcularIVA,
          totalConIVA: requiereFactura ? totalConIVA : totalFinal
        },
        // Método de pago
        metodoPago: {
          anticipo: anticipo,
          saldo: saldo,
          porcentajeAnticipo: 60,
          porcentajeSaldo: 40,
          metodoPagoAnticipo: metodoPagoAnticipo
        },
        entrega: {
          tipo: tiempoEntrega,
          diasExpres: tiempoEntrega === 'expres' ? Number(diasExpres) : null,
          fechaEstimada: calcularFechaEntrega.toISOString().split('T')[0]
        },
        terminos: {
          incluir: incluirTerminos
        },
        totalFinal: totalFinal,
        comentarios,
        fotoUrls: [],
        videoUrl: ''
      };

      const response = await axiosConfig.post(`/prospectos/${prospectoId}/pedidos`, payload);
      
      if (response.data) {
        onSaved?.('Pedido creado exitosamente');
        cerrarModal();
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

  const handleGenerarYGuardarPDF = async () => {
    if (piezas.length === 0) {
      setErrorLocal('Debes agregar al menos una partida para generar el PDF');
      return;
    }

    setGuardandoPDF(true);
    setErrorLocal('');

    try {
      const payload = {
        prospectoId,
        piezas: piezas.map((pieza) => ({
          ubicacion: pieza.ubicacion,
          cantidad: pieza.cantidad || 1,
          medidas: pieza.medidas || [{ 
            ancho: (pieza.medidas && pieza.medidas.length > 0) ? Number(pieza.medidas[0].ancho) || 0 : (pieza.ancho !== '' ? Number(pieza.ancho) : 0),
            alto: (pieza.medidas && pieza.medidas.length > 0) ? Number(pieza.medidas[0].alto) || 0 : (pieza.alto !== '' ? Number(pieza.alto) : 0),
            area: pieza.ancho && pieza.alto ? Number(pieza.ancho) * Number(pieza.alto) : 0,
            producto: pieza.producto,
            productoLabel: pieza.productoLabel,
            color: pieza.color,
            precioM2: pieza.precioM2
          }],
          producto: pieza.producto,
          productoLabel: pieza.productoLabel,
          color: pieza.color,
          precioM2: pieza.precioM2,
          observaciones: pieza.observaciones,
          // Información de toldos
          esToldo: pieza.esToldo || false,
          tipoToldo: pieza.tipoToldo || '',
          kitModelo: pieza.kitModelo || '',
          kitModeloManual: pieza.kitModeloManual || '',
          kitPrecio: pieza.kitPrecio ? Number(pieza.kitPrecio) : 0,
          // Información de motorización
          motorizado: pieza.motorizado || false,
          motorModelo: pieza.motorModelo || '',
          motorModeloManual: pieza.motorModeloManual || '',
          motorPrecio: pieza.motorPrecio ? Number(pieza.motorPrecio) : 0,
          controlModelo: pieza.controlModelo || '',
          controlModeloManual: pieza.controlModeloManual || '',
          controlPrecio: pieza.controlPrecio ? Number(pieza.controlPrecio) : 0,
          // Compatibilidad con formato anterior
          ancho: (pieza.medidas && pieza.medidas.length > 0) ? Number(pieza.medidas[0].ancho) || 0 : (pieza.ancho !== '' ? Number(pieza.ancho) : 0),
          alto: pieza.alto !== '' ? Number(pieza.alto) : 0
        })),
        precioGeneral: Number(precioGeneral),
        totalM2: calcularTotalM2,
        subtotalProductos: calcularSubtotalProductos,
        unidadMedida: unidad,
        // Información de instalación
        instalacion: {
          cobra: cobraInstalacion,
          tipo: tipoInstalacion,
          precio: cobraInstalacion ? Number(precioInstalacion) || 0 : 0
        },
        // Información de descuentos
        descuento: {
          aplica: aplicaDescuento,
          tipo: tipoDescuento,
          valor: aplicaDescuento ? Number(valorDescuento) || 0 : 0,
          monto: calcularDescuento
        },
        // Información de facturación
        facturacion: {
          requiereFactura,
          iva: calcularIVA,
          totalConIVA: requiereFactura ? totalConIVA : totalFinal
        },
        // Método de pago
        metodoPago: {
          anticipo: anticipo,
          saldo: saldo,
          porcentajeAnticipo: 60,
          porcentajeSaldo: 40,
          metodoPagoAnticipo: metodoPagoAnticipo
        },
        // Información de entrega
        entrega: {
          tipo: tiempoEntrega,
          diasExpres: tiempoEntrega === 'expres' ? Number(diasExpres) : null,
          fechaEstimada: calcularFechaEntrega.toISOString().split('T')[0]
        },
        // Términos comerciales
        terminos: {
          incluir: incluirTerminos
        },
        totalFinal: totalFinal,
        comentarios,
        fotoUrls: [],
        videoUrl: '',
        // Indicar que es para guardar PDF
        guardarPDF: true
      };

      const response = await axiosConfig.post('/etapas/levantamiento-pdf', payload, {
        responseType: 'blob'
      });
      
      if (response.data) {
        // Crear URL del blob y descargar
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Cotizacion-${prospectoId}-${Date.now()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        onSaved?.('PDF generado y guardado exitosamente');
      }
    } catch (error) {
      console.error('Error al generar PDF:', error);
      const mensaje = error.response?.data?.message || 'Error al generar el PDF';
      setErrorLocal(mensaje);
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
          {nombreEtapa === 'Visita Inicial / Medición' && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Captación del prospecto y levantamiento de medidas. Documentar medidas, necesidades y especificaciones.
            </Typography>
          )}
        </Box>
        <IconButton onClick={cerrarModal} size="small">
          <Close />
        </IconButton>
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
                  {/* Solo mostrar Excel para levantamiento técnico */}
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleDescargarExcel}
                    disabled={descargandoExcel || piezas.length === 0}
                    sx={{ bgcolor: '#16A34A', '&:hover': { bgcolor: '#15803D' } }}
                  >
                    {descargandoExcel ? 'Generando...' : '📊 Descargar Excel'}
                  </Button>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    📋 Excel necesario para realizar cotización
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

              {/* Instalación Manual - Solo para Cotización en Vivo */}
              {tipoVisitaInicial === 'cotizacion' && (
                <Card sx={{ mb: 2, bgcolor: 'info.50', border: 2, borderColor: 'info.200' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        🔧 Instalación Especial
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
                  
                  {cobraInstalacion && (
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Para casos especiales como instalación eléctrica, estructural, o trabajos adicionales
                      </Typography>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            select
                            label="Tipo de instalación"
                            fullWidth
                            value={tipoInstalacion}
                            onChange={(e) => setTipoInstalacion(e.target.value)}
                            SelectProps={{ native: true }}
                          >
                            <option value="estandar">Estándar</option>
                            <option value="electrica">Eléctrica (motorizada)</option>
                            <option value="estructural">Estructural (refuerzos)</option>
                            <option value="altura">Altura especial</option>
                            <option value="acceso">Acceso difícil</option>
                            <option value="personalizada">Personalizada</option>
                          </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="💰 Precio instalación (MXN)"
                            type="number"
                            fullWidth
                            value={precioInstalacion}
                            onChange={(e) => setPrecioInstalacion(e.target.value)}
                            placeholder="Ej. 2500, 5000, 8000..."
                            helperText="Precio fijo total por instalación"
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  )}
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

              {/* Formulario Agregar Pieza */}
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
                          onChange={(e) => {
                            const selectedOption = productosOptions.find(opt => opt.value === e.target.value);
                            const nuevoProducto = e.target.value;
                            setPiezaForm(prev => ({ 
                              ...prev, 
                              producto: nuevoProducto,
                              productoLabel: selectedOption ? selectedOption.label : nuevoProducto,
                              // Detectar automáticamente si es toldo
                              esToldo: esToldo(nuevoProducto),
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
                            }));
                          }}
                        >
                          {productosOptions.map((producto) => (
                            <MenuItem 
                              key={producto.value} 
                              value={producto.value}
                              sx={producto.value === 'nuevo' ? { color: 'primary.main', fontWeight: 'bold' } : {}}
                            >
                              {producto.label}
                            </MenuItem>
                          ))}
                        </TextField>
                        {piezaForm.producto.startsWith('custom_') && (
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
                                  const productoSeleccionado = productosOptions.find(p => p.value === e.target.value);
                                  
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
                                {productosOptions.filter(p => p.value !== 'nuevo').map((producto) => (
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
                                        const nuevasMedidas = [...(piezaForm.medidas || [])];
                                        const sistemasActuales = nuevasMedidas[index].sistema || [];
                                        const nuevosSistemas = sistemasActuales.includes(sistema)
                                          ? sistemasActuales.filter(s => s !== sistema)
                                          : [...sistemasActuales, sistema];
                                        nuevasMedidas[index] = { ...nuevasMedidas[index], sistema: nuevosSistemas };
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
                                        const nuevasMedidas = [...(piezaForm.medidas || [])];
                                        const sistemasActuales = nuevasMedidas[index].sistemaEspecial || [];
                                        const nuevosSistemas = sistemasActuales.includes(sistemaEsp)
                                          ? sistemasActuales.filter(s => s !== sistemaEsp)
                                          : [...sistemasActuales, sistemaEsp];
                                        nuevasMedidas[index] = { ...nuevasMedidas[index], sistemaEspecial: nuevosSistemas };
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

                      {/* Información técnica general para Levantamiento Simple */}
                      {tipoVisitaInicial === 'levantamiento' && (
                        <>
                          <Grid item xs={12}>
                            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, color: 'info.main', fontWeight: 'bold' }}>
                              📋 Datos Generales del Levantamiento
                            </Typography>
                          </Grid>
                          
                          <Grid item xs={12} sm={6}>
                            <TextField
                              label="Persona que realizó visita"
                              fullWidth
                              value={piezaForm.personaVisita || ''}
                              onChange={(e) => setPiezaForm(prev => ({ ...prev, personaVisita: e.target.value }))}
                              placeholder="Nombre del asesor/técnico"
                            />
                          </Grid>

                          <Grid item xs={12} sm={6}>
                            <Box sx={{ 
                              p: 2, 
                              bgcolor: 'warning.50', 
                              borderRadius: 1, 
                              border: '1px solid', 
                              borderColor: 'warning.200',
                              height: '56px',
                              display: 'flex',
                              alignItems: 'center'
                            }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                <Box sx={{ 
                                  bgcolor: 'warning.main', 
                                  color: 'white', 
                                  borderRadius: '50%', 
                                  width: 24, 
                                  height: 24, 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center',
                                  fontSize: '12px',
                                  fontWeight: 'bold'
                                }}>
                                  ⏰
                                </Box>
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'warning.dark' }}>
                                    Recordatorio automático
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Cotización en menos de 24 horas
                                  </Typography>
                                </Box>
                              </Box>
                            </Box>
                          </Grid>

                          <Grid item xs={12}>
                            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, border: '1px dashed', borderColor: 'grey.300' }}>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                📝 Firma digital (opcional):
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                La firma digital se capturará al finalizar el levantamiento
                              </Typography>
                            </Box>
                          </Grid>
                        </>
                      )}

                      {/* Sección de Kit de Toldo - Solo para toldos */}
                      {esToldo(piezaForm.producto) && (
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
                        </>
                      )}

                      {/* Sección de Motorización - Para toldos, persianas y cortinas */}
                      {puedeSerMotorizado(piezaForm.producto) && (
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
                                  controlPrecio: esMotorizado ? prev.controlPrecio : ''
                                }));
                              }}
                            >
                              <MenuItem value="no">No</MenuItem>
                              <MenuItem value="si">Sí</MenuItem>
                            </TextField>
                          </Grid>
                          
                          {piezaForm.motorizado && (
                            <>
                              <Grid item xs={12} sm={3}>
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
                                <Grid item xs={12} sm={3}>
                                  <TextField
                                    label="Especificar motor"
                                    fullWidth
                                    value={piezaForm.motorModeloManual}
                                    onChange={(e) => setPiezaForm(prev => ({ ...prev, motorModeloManual: e.target.value }))}
                                    placeholder="Ej. Motor Nacional 28Nm"
                                  />
                                </Grid>
                              )}
                              <Grid item xs={12} sm={3}>
                                <TextField
                                  label="Precio Motor (MXN)"
                                  type="number"
                                  fullWidth
                                  value={piezaForm.motorPrecio}
                                  onChange={(e) => setPiezaForm(prev => ({ ...prev, motorPrecio: e.target.value }))}
                                  placeholder="Ej. 3800, 4500"
                                  inputProps={{ step: 0.01 }}
                                />
                              </Grid>
                              
                              <Grid item xs={12} sm={3}>
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
                                  {modelosControles.map(control => (
                                    <MenuItem key={control.value} value={control.value}>
                                      {control.label}
                                    </MenuItem>
                                  ))}
                                </TextField>
                              </Grid>
                              {piezaForm.controlModelo === 'otro_manual' && (
                                <Grid item xs={12} sm={3}>
                                  <TextField
                                    label="Especificar control"
                                    fullWidth
                                    value={piezaForm.controlModeloManual}
                                    onChange={(e) => setPiezaForm(prev => ({ ...prev, controlModeloManual: e.target.value }))}
                                    placeholder="Ej. Control personalizado"
                                  />
                                </Grid>
                              )}
                              <Grid item xs={12} sm={3}>
                                <TextField
                                  label="Precio Control (MXN)"
                                  type="number"
                                  fullWidth
                                  value={piezaForm.controlPrecio}
                                  onChange={(e) => setPiezaForm(prev => ({ ...prev, controlPrecio: e.target.value }))}
                                  placeholder="Ej. 950, 1200"
                                  inputProps={{ step: 0.01 }}
                                />
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
                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      <Button
                        variant="contained"
                        onClick={handleAgregarPieza}
                        sx={{ bgcolor: '#16A34A', '&:hover': { bgcolor: '#15803D' } }}
                      >
                        {editandoPieza ? '✅ Actualizar Partida' : '✅ Guardar Partida'}
                      </Button>
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
                            sx={{ 
                              fontSize: '0.75rem', 
                              py: 0.25, 
                              px: 1,
                              color: '#f59e0b',
                              borderColor: '#f59e0b',
                              '&:hover': {
                                bgcolor: '#fef3c7',
                                borderColor: '#f59e0b'
                              }
                            }}
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
                        }}
                      >
                        Cancelar
                      </Button>
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
                    const esProductoToldo = esToldo(pieza.producto) || pieza.esToldo;
                    const kitPrecio = esProductoToldo && pieza.kitPrecio ? parseFloat(pieza.kitPrecio) : 0;
                    const motorPrecio = pieza.motorizado && pieza.motorPrecio ? parseFloat(pieza.motorPrecio) : 0;
                    const controlPrecio = pieza.motorizado && pieza.controlPrecio ? parseFloat(pieza.controlPrecio) : 0;
                    
                    const totalPartida = subtotalM2 + (kitPrecio * cantidadPiezas) + (motorPrecio * cantidadPiezas) + controlPrecio;
                    
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
                              <Grid item xs={6} sm={3}>
                                <Typography variant="body2" color="text.secondary">Precio m²:</Typography>
                                <Typography variant="body1" fontWeight="bold">💲 ${precio.toLocaleString()}/m²</Typography>
                              </Grid>
                              <Grid item xs={6} sm={3}>
                                <Typography variant="body2" color="text.secondary">Subtotal m²:</Typography>
                                <Typography variant="body1" fontWeight="bold">💰 ${subtotalM2.toLocaleString()}</Typography>
                              </Grid>
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
                                      {cantidadPiezas} Motor{cantidadPiezas > 1 ? 'es' : ''} ({pieza.motorModeloManual || pieza.motorModelo || 'Modelo estándar'}) 
                                      → ${motorPrecio.toLocaleString()} c/u → 
                                      <span style={{ fontWeight: 'bold', color: '#1976d2' }}> ${(motorPrecio * cantidadPiezas).toLocaleString()}</span>
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

                          {/* Total de la partida */}
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1, borderTop: 1, borderColor: 'grey.200' }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                              Total Partida: ${totalPartida.toLocaleString()}
                            </Typography>
                          </Box>

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
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="text.secondary">Subtotal productos:</Typography>
                        <Typography variant="body1" fontWeight="bold">💰 ${calcularSubtotalProductos.toLocaleString()}</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="text.secondary">
                          {aplicaDescuento ? 'Total final:' : (cobraInstalacion ? 'Total con instalación:' : 'Total estimado:')}
                        </Typography>
                        <Typography variant="body1" fontWeight="bold" color="success.main">
                          💵 ${totalFinal.toLocaleString()}
                        </Typography>
                      </Grid>
                    </Grid>
                    
                    {/* Desglose de instalación si está activada */}
                    {cobraInstalacion && precioInstalacion && (
                      <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.50', borderRadius: 1, border: '1px solid', borderColor: 'warning.200' }}>
                        <Typography variant="body2" fontWeight="medium" color="warning.dark">
                          🔧 Instalación {tipoInstalacion}: +${parseFloat(precioInstalacion).toLocaleString()}
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
                    
                    {cobraInstalacion && precioInstalacion && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">Instalación:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          ${parseFloat(precioInstalacion).toLocaleString()}
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
                        ${totalFinal.toLocaleString()}
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
          
          {/* Botón Generar y Guardar PDF - Solo cuando hay piezas */}
          {piezas.length > 0 && (
            <Button
              onClick={handleGenerarYGuardarPDF}
              disabled={guardandoPDF || guardando || generandoCotizacion || guardandoPedido}
              variant="contained"
              startIcon={<span>📄</span>}
              sx={{ bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' } }}
            >
              {guardandoPDF ? 'Generando PDF...' : 'Guardar PDF'}
            </Button>
          )}
          
          {/* Botón Agregar Pedido - Solo cuando hay piezas */}
          {piezas.length > 0 && (
            <Button
              onClick={handleAgregarPedido}
              disabled={guardandoPedido || guardando || generandoCotizacion || guardandoPDF}
              variant="contained"
              startIcon={<span>📦</span>}
              sx={{ bgcolor: '#1976D2', '&:hover': { bgcolor: '#1565C0' } }}
            >
              {guardandoPedido ? 'Creando...' : 'Agregar Pedido'}
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
    </Dialog>
  );
};

export default AgregarEtapaModal;

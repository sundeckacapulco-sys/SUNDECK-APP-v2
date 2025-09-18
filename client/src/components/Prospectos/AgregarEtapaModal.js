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
  Delete
} from '@mui/icons-material';
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
  { label: "Cortina con Cenefa", value: "cortina_cenefa" },
  { label: "+ Agregar producto personalizado", value: "nuevo" }
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
  videoUrl: ''
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

  const resetFormulario = () => {
    setNombreEtapa(etapaOptions[0]);
    setUnidad('m');
    setPiezas([]);
    setComentarios('');
    setPrecioGeneral(750);
    setErrorLocal('');
    setGuardando(false);
    setGenerandoCotizacion(false);
    setDescargandoLevantamiento(false);
    setDescargandoExcel(false);
    setAgregandoPieza(false);
    setPiezaForm(emptyPieza);
    setMostrarNuevoProducto(false);
    setNuevoProductoNombre('');
    setSubiendoFoto(false);
    setCobraInstalacion(false);
    setPrecioInstalacion('');
    setTipoInstalacion('estandar');
    setAplicaDescuento(false);
    setTipoDescuento('porcentaje');
    setValorDescuento('');
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
      if (pieza.medidas && Array.isArray(pieza.medidas)) {
        // Formato nuevo: cada pieza puede tener su propio producto y precio
        const subtotalPieza = pieza.medidas.reduce((subtotal, medida) => {
          const area = medida.area || 0;
          const precioEspecifico = parseFloat(medida.precioM2) || parseFloat(pieza.precioM2) || precioGeneral;
          return subtotal + (area * precioEspecifico);
        }, 0);
        return total + subtotalPieza;
      } else {
        // Formato anterior para compatibilidad
        const ancho = parseFloat(pieza.ancho) || 0;
        const alto = parseFloat(pieza.alto) || 0;
        const cantidad = parseInt(pieza.cantidad) || 1;
        const area = unidad === 'cm' ? (ancho * alto) / 10000 : ancho * alto;
        const areaPieza = area * cantidad;
        const precio = parseFloat(pieza.precioM2) || precioGeneral;
        return total + (areaPieza * precio);
      }
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

  const cerrarModal = () => {
    resetFormulario();
    onClose();
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
      medidas: piezaAEditar.medidas || [{ ancho: piezaAEditar.ancho || '', alto: piezaAEditar.alto || '' }],
      producto: piezaAEditar.producto,
      productoLabel: piezaAEditar.productoLabel,
      color: piezaAEditar.color,
      precioM2: piezaAEditar.precioM2 || '',
      observaciones: piezaAEditar.observaciones || '',
      fotoUrls: piezaAEditar.fotoUrls || [],
      videoUrl: piezaAEditar.videoUrl || ''
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
          ancho: pieza.ancho !== '' ? Number(pieza.ancho) : 0,
          alto: pieza.alto !== '' ? Number(pieza.alto) : 0,
          producto: pieza.producto,
          color: pieza.color,
          observaciones: pieza.observaciones
        })),
        precioGeneral: Number(precioGeneral),
        totalM2: calcularTotalM2,
        unidadMedida: unidad
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
          ancho: pieza.ancho !== '' ? Number(pieza.ancho) : 0,
          alto: pieza.alto !== '' ? Number(pieza.alto) : 0,
          producto: pieza.producto,
          productoLabel: pieza.productoLabel,
          color: pieza.color,
          precioM2: pieza.precioM2 !== '' ? Number(pieza.precioM2) : undefined,
          observaciones: pieza.observaciones,
          fotoUrls: pieza.fotoUrls || [],
          videoUrl: pieza.videoUrl || ''
        })),
        precioGeneral: Number(precioGeneral),
        totalM2: calcularTotalM2,
        unidadMedida: unidad
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
        piezas: piezas.map((pieza) => ({
          ubicacion: pieza.ubicacion,
          ancho: pieza.ancho !== '' ? Number(pieza.ancho) : 0,
          alto: pieza.alto !== '' ? Number(pieza.alto) : 0,
          producto: pieza.producto,
          productoLabel: pieza.productoLabel,
          color: pieza.color,
          precioM2: pieza.precioM2 !== '' ? Number(pieza.precioM2) : precioGeneral,
          observaciones: pieza.observaciones,
          fotoUrls: pieza.fotoUrls || [],
          videoUrl: pieza.videoUrl || ''
        })),
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
      const payload = {
        prospectoId,
        nombreEtapa,
        comentarios,
        unidadMedida: unidad,
        precioGeneral: Number(precioGeneral),
        totalM2: calcularTotalM2,
        piezas: piezas.map((pieza) => ({
          ubicacion: pieza.ubicacion,
          ancho: pieza.ancho !== '' ? Number(pieza.ancho) : 0,
          alto: pieza.alto !== '' ? Number(pieza.alto) : 0,
          producto: pieza.producto,
          productoLabel: pieza.productoLabel,
          color: pieza.color,
          precioM2: pieza.precioM2 !== '' ? Number(pieza.precioM2) : undefined,
          observaciones: pieza.observaciones,
          fotoUrls: pieza.fotoUrls || [],
          videoUrl: pieza.videoUrl || ''
        })),
        // Información de instalación especial
        instalacionEspecial: cobraInstalacion ? {
          activa: true,
          tipo: tipoInstalacion,
          precio: Number(precioInstalacion) || 0
        } : { activa: false }
      };

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

  return (
    <Dialog 
      open={open} 
      onClose={cerrarModal} 
      maxWidth="lg" 
      fullWidth
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
            onChange={(e) => setNombreEtapa(e.target.value)}
          >
            {etapaOptions.map((etapa) => (
              <MenuItem key={etapa} value={etapa}>
                {etapa}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Debug Info */}
        <Alert severity="info" sx={{ mb: 2 }}>
          DEBUG: Etapa actual = "{nombreEtapa}" | Es Visita Inicial = {nombreEtapa === 'Visita Inicial / Medición' ? 'SÍ' : 'NO'}
        </Alert>

        {/* Fecha y Hora - Solo para etapas que NO sean Visita Inicial */}
        {nombreEtapa !== 'Visita Inicial / Medición' && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Fecha"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Hora"
                type="time"
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
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleDescargarLevantamiento}
                    disabled={descargandoLevantamiento || piezas.length === 0}
                    sx={{ bgcolor: '#2563EB', '&:hover': { bgcolor: '#1D4ED8' } }}
                  >
                    {descargandoLevantamiento ? 'Generando...' : '📄 Descargar PDF'}
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleDescargarExcel}
                    disabled={descargandoExcel || piezas.length === 0}
                    sx={{ bgcolor: '#16A34A', '&:hover': { bgcolor: '#15803D' } }}
                  >
                    {descargandoExcel ? 'Generando...' : '📊 Descargar Excel'}
                  </Button>
                </Box>
              </Box>

              {/* Precio General */}
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

              {/* Instalación Manual */}
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

              {/* Descuentos */}
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
                        <FormControl fullWidth>
                          <InputLabel>Producto</InputLabel>
                          <Select
                            value={piezaForm.producto}
                            label="Producto"
                            onChange={(e) => {
                              if (e.target.value === 'nuevo') {
                                setMostrarNuevoProducto(true);
                              } else {
                                const productoSeleccionado = productosOptions.find(p => p.value === e.target.value);
                                setPiezaForm(prev => ({ 
                                  ...prev, 
                                  producto: e.target.value,
                                  productoLabel: productoSeleccionado ? productoSeleccionado.label : e.target.value
                                }));
                              }
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
                          </Select>
                        </FormControl>
                        
                        {/* Indicador de producto personalizado */}
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
                          <Grid item xs={12}>
                            <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>
                              📏 Pieza {index + 1} de {piezaForm.cantidad}
                            </Typography>
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
                                  nuevasMedidas[index] = { 
                                    ...nuevasMedidas[index], 
                                    producto: e.target.value,
                                    productoLabel: productoSeleccionado ? productoSeleccionado.label : e.target.value
                                  };
                                  setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
                                }}
                              >
                                {productosOptions.filter(p => p.value !== 'nuevo').map((producto) => (
                                  <MenuItem key={producto.value} value={producto.value}>
                                    {producto.label}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                          
                          {/* Color específico para esta pieza */}
                          <Grid item xs={12} sm={6}>
                            <TextField
                              label={`Color pieza ${index + 1}`}
                              fullWidth
                              value={medida.color || piezaForm.color}
                              onChange={(e) => {
                                const nuevasMedidas = [...(piezaForm.medidas || [])];
                                nuevasMedidas[index] = { ...nuevasMedidas[index], color: e.target.value };
                                setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
                              }}
                              placeholder="Ej. Blanco, Negro, Gris"
                            />
                          </Grid>
                          
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
                          <Grid item xs={12} sm={4}>
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
                        </React.Fragment>
                      ))}
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Color / Acabado"
                          fullWidth
                          value={piezaForm.color}
                          onChange={(e) => setPiezaForm(prev => ({ ...prev, color: e.target.value }))}
                          placeholder="Ej. Blanco, Negro, Gris, etc."
                        />
                      </Grid>
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
                      <Grid item xs={12}>
                        <TextField
                          label="Observaciones"
                          multiline
                          rows={2}
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
                    const subtotal = areaTotal * precio;
                    
                    return (
                      <Card key={index} sx={{ mb: 2, border: 1, borderColor: 'grey.200' }}>
                        <CardContent sx={{ p: 2 }}>
                          {/* Fila principal con información básica */}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                              <Chip label={`📍 ${pieza.ubicacion}`} color="primary" variant="outlined" />
                              <Typography variant="body2" fontWeight="bold">
                                {pieza.productoLabel || pieza.producto}
                              </Typography>
                              <Chip label={`${cantidadPiezas} pieza${cantidadPiezas > 1 ? 's' : ''}`} size="small" />
                              <Chip label={`📐 ${areaTotal.toFixed(2)} m²`} color="info" size="small" />
                              <Chip label={`💰 $${subtotal.toLocaleString()}`} color="success" size="small" />
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

                          {/* Fila secundaria con detalles */}
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', mb: 1 }}>
                            {pieza.color && (
                              <Chip label={`🎨 ${pieza.color}`} size="small" variant="outlined" />
                            )}
                            {pieza.precioM2 && (
                              <Chip label={`💲 $${pieza.precioM2}/m²`} size="small" color="warning" />
                            )}
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

                          {/* Observaciones */}
                          {pieza.observaciones && (
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                              💬 {pieza.observaciones}
                            </Typography>
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
                          💵 ${(calcularSubtotalProductos + (cobraInstalacion ? parseFloat(precioInstalacion) || 0 : 0) - calcularDescuento).toLocaleString()}
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

        {/* Comentarios */}
        <TextField
          label="Observaciones"
          multiline
          rows={3}
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
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {/* Botón Generar Cotización - Solo para Visita Inicial con piezas */}
          {nombreEtapa === 'Visita Inicial / Medición' && piezas.length > 0 && (
            <Button
              onClick={handleGenerarCotizacion}
              disabled={generandoCotizacion || guardando}
              variant="contained"
              startIcon={<span>💰</span>}
              sx={{ bgcolor: '#16A34A', '&:hover': { bgcolor: '#15803D' } }}
            >
              {generandoCotizacion ? 'Generando...' : 'Generar Cotización'}
            </Button>
          )}
          
          <Button
            onClick={handleGuardarEtapa}
            disabled={guardando || generandoCotizacion}
            variant="contained"
            sx={{ bgcolor: '#D4AF37', '&:hover': { bgcolor: '#B8860B' } }}
          >
            {guardando ? 'Guardando...' : 'Agregar Etapa'}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default AgregarEtapaModal;

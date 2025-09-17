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
import { Close, Add, Delete } from '@mui/icons-material';
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
  { label: "+ Agregar nuevo producto", value: "nuevo" }
];

const emptyPieza = {
  ubicacion: '',
  ancho: '',
  alto: '',
  producto: productosOptions[0].value, // screen_3
  productoLabel: productosOptions[0].label, // Persianas Screen 3%
  color: 'Blanco',
  precioM2: '',
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
  const [errorLocal, setErrorLocal] = useState('');
  
  // Estados para productos
  const [mostrarNuevoProducto, setMostrarNuevoProducto] = useState(false);
  const [nuevoProductoNombre, setNuevoProductoNombre] = useState('');
  
  // Estados para subida de archivos
  const [subiendoFoto, setSubiendoFoto] = useState(false);

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
    setAgregandoPieza(false);
    setPiezaForm(emptyPieza);
    setMostrarNuevoProducto(false);
    setNuevoProductoNombre('');
    setSubiendoFoto(false);
  };

  useEffect(() => {
    if (!open) {
      resetFormulario();
    }
  }, [open]);

  const calcularTotalM2 = useMemo(() => {
    return piezas.reduce((total, pieza) => {
      const ancho = parseFloat(pieza.ancho) || 0;
      const alto = parseFloat(pieza.alto) || 0;
      const area = unidad === 'cm' ? (ancho * alto) / 10000 : ancho * alto;
      return total + area;
    }, 0);
  }, [piezas, unidad]);

  const cerrarModal = () => {
    resetFormulario();
    onClose();
  };

  const handleAgregarPieza = () => {
    if (!piezaForm.ubicacion || !piezaForm.ancho || !piezaForm.alto) {
      setErrorLocal('Completa ubicación, ancho y alto para agregar la pieza.');
      return;
    }

    // Encontrar el label del producto seleccionado
    const productoSeleccionado = productosOptions.find(p => p.value === piezaForm.producto);
    
    setPiezas((prev) => [
      ...prev,
      {
        ...piezaForm,
        ancho: parseFloat(piezaForm.ancho) || 0,
        alto: parseFloat(piezaForm.alto) || 0,
        precioM2: parseFloat(piezaForm.precioM2) || precioGeneral,
        productoLabel: productoSeleccionado ? productoSeleccionado.label : piezaForm.producto
      }
    ]);
    setPiezaForm(emptyPieza);
    setAgregandoPieza(false);
    setErrorLocal('');
  };

  const handleEliminarPieza = (index) => {
    setPiezas((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCrearNuevoProducto = () => {
    if (!nuevoProductoNombre.trim()) {
      setErrorLocal('El nombre del producto es requerido');
      return;
    }

    // Crear un value único para el producto personalizado
    const customValue = `custom_${Date.now()}`;
    
    // Seleccionar el nuevo producto en el formulario
    setPiezaForm(prev => ({ 
      ...prev, 
      producto: customValue,
      productoLabel: nuevoProductoNombre.trim()
    }));
    
    // Cerrar el formulario de nuevo producto
    setMostrarNuevoProducto(false);
    setNuevoProductoNombre('');
    setErrorLocal('');
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
      setErrorLocal('Debes agregar al menos una pieza para descargar el levantamiento.');
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

  const handleGenerarCotizacion = async () => {
    if (!prospectoId) {
      setErrorLocal('No se encontró el identificador del prospecto.');
      return;
    }

    if (piezas.length === 0) {
      setErrorLocal('Debes agregar al menos una pieza para generar la cotización.');
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
        comentarios
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
        }))
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
                    Agregar Pieza
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
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      🔧 Agregar Pieza #{piezas.length + 1}
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Ubicación"
                          fullWidth
                          value={piezaForm.ubicacion}
                          onChange={(e) => setPiezaForm(prev => ({ ...prev, ubicacion: e.target.value }))}
                          placeholder="Ej. Sala, Recámara, Terraza"
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
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label={`Ancho (${unidad})`}
                          type="number"
                          fullWidth
                          value={piezaForm.ancho}
                          onChange={(e) => setPiezaForm(prev => ({ ...prev, ancho: e.target.value }))}
                          inputProps={{ step: 0.01 }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label={`Alto (${unidad})`}
                          type="number"
                          fullWidth
                          value={piezaForm.alto}
                          onChange={(e) => setPiezaForm(prev => ({ ...prev, alto: e.target.value }))}
                          inputProps={{ step: 0.01 }}
                        />
                      </Grid>
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
                        ✅ Guardar Pieza
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => setAgregandoPieza(false)}
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
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      ➕ Agregar Producto Personalizado
                    </Typography>
                    <TextField
                      label="Nombre del producto personalizado"
                      fullWidth
                      value={nuevoProductoNombre}
                      onChange={(e) => setNuevoProductoNombre(e.target.value)}
                      placeholder="Ej. Persiana Screen Especial, Toldo Personalizado, etc."
                      sx={{ mb: 2 }}
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        color="warning"
                        onClick={handleCrearNuevoProducto}
                      >
                        ✅ Agregar Producto
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => setMostrarNuevoProducto(false)}
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
                    📋 Piezas Agregadas ({piezas.length})
                  </Typography>
                  {piezas.map((pieza, index) => {
                    const area = unidad === 'cm' ? (pieza.ancho * pieza.alto) / 10000 : pieza.ancho * pieza.alto;
                    const precio = pieza.precioM2 || precioGeneral;
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
                              <Chip label={`${pieza.ancho} × ${pieza.alto} ${unidad}`} size="small" />
                              <Chip label={`📐 ${area.toFixed(2)} m²`} color="info" size="small" />
                              <Chip label={`💰 $${(area * precio).toFixed(2)}`} color="success" size="small" />
                            </Box>
                            <IconButton
                              onClick={() => handleEliminarPieza(index)}
                              color="error"
                              size="small"
                            >
                              <Delete />
                            </IconButton>
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
                        <Typography variant="body2" color="text.secondary">Total piezas:</Typography>
                        <Typography variant="body1" fontWeight="bold">🔢 {piezas.length}</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="text.secondary">Área total:</Typography>
                        <Typography variant="body1" fontWeight="bold" color="primary">📐 {calcularTotalM2.toFixed(2)} m²</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="text.secondary">Precio promedio:</Typography>
                        <Typography variant="body1" fontWeight="bold">💰 ${precioGeneral}/m²</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="text.secondary">Estimado:</Typography>
                        <Typography variant="body1" fontWeight="bold" color="success.main">💵 ${(calcularTotalM2 * precioGeneral).toFixed(2)}</Typography>
                      </Grid>
                    </Grid>
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

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

const emptyPieza = {
  ubicacion: '',
  ancho: '',
  alto: '',
  producto: 'Ventana',
  color: 'Natural',
  precioM2: '',
  observaciones: '',
  fotoUrl: ''
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

    setPiezas((prev) => [
      ...prev,
      {
        ...piezaForm,
        ancho: parseFloat(piezaForm.ancho) || 0,
        alto: parseFloat(piezaForm.alto) || 0,
        precioM2: parseFloat(piezaForm.precioM2) || precioGeneral
      }
    ]);
    setPiezaForm(emptyPieza);
    setAgregandoPieza(false);
    setErrorLocal('');
  };

  const handleEliminarPieza = (index) => {
    setPiezas((prev) => prev.filter((_, i) => i !== index));
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
          color: pieza.color,
          precioM2: pieza.precioM2 !== '' ? Number(pieza.precioM2) : precioGeneral,
          observaciones: pieza.observaciones,
          fotoUrl: pieza.fotoUrl
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
          color: pieza.color,
          precioM2: pieza.precioM2 !== '' ? Number(pieza.precioM2) : undefined,
          observaciones: pieza.observaciones,
          fotoUrl: pieza.fotoUrl
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
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Agregar Nueva Etapa</Typography>
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
                    color="info"
                    onClick={handleDescargarLevantamiento}
                    disabled={descargandoLevantamiento || piezas.length === 0}
                  >
                    {descargandoLevantamiento ? 'Generando...' : 'Descargar PDF'}
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
                            onChange={(e) => setPiezaForm(prev => ({ ...prev, producto: e.target.value }))}
                          >
                            <MenuItem value="Ventana">Ventana</MenuItem>
                            <MenuItem value="Puerta">Puerta</MenuItem>
                            <MenuItem value="Ventanal">Ventanal</MenuItem>
                            <MenuItem value="Puerta Corrediza">Puerta Corrediza</MenuItem>
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
                    </Grid>
                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      <Button
                        variant="contained"
                        color="success"
                        onClick={handleAgregarPieza}
                      >
                        ✅ Agregar Pieza
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => setAgregandoPieza(false)}
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
                      <Card key={index} sx={{ mb: 1 }}>
                        <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <Chip label={`📍 ${pieza.ubicacion}`} />
                            <Typography variant="body2">{pieza.producto}</Typography>
                            <Typography variant="body2">{pieza.ancho} × {pieza.alto} {unidad}</Typography>
                            <Chip label={`📐 ${area.toFixed(2)} m²`} color="primary" />
                            <Chip label={`💰 $${(area * precio).toFixed(2)}`} color="success" />
                          </Box>
                          <IconButton
                            onClick={() => handleEliminarPieza(index)}
                            color="error"
                            size="small"
                          >
                            <Delete />
                          </IconButton>
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
        <Button onClick={cerrarModal} variant="outlined">
          Cancelar
        </Button>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {/* Botón Generar Cotización - Solo para Visita Inicial con piezas */}
          {nombreEtapa === 'Visita Inicial / Medición' && piezas.length > 0 && (
            <Button
              onClick={handleGenerarCotizacion}
              disabled={generandoCotizacion || guardando}
              variant="contained"
              color="success"
              startIcon={<span>💰</span>}
            >
              {generandoCotizacion ? 'Generando...' : 'Generar Cotización'}
            </Button>
          )}
          
          <Button
            onClick={handleGuardarEtapa}
            disabled={guardando || generandoCotizacion}
            variant="contained"
            sx={{ bgcolor: '#D4AF37', '&:hover': { bgcolor: '#b8962d' } }}
          >
            {guardando ? 'Guardando...' : 'Agregar Etapa'}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default AgregarEtapaModal;

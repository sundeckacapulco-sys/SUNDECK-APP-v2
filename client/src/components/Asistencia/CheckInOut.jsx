import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress
} from '@mui/material';
import {
  LocationOn,
  CheckCircle,
  Cancel,
  AccessTime,
  Speed,
  TrendingUp,
  Warning
} from '@mui/icons-material';
import axiosConfig from '../../config/axios';

const CheckInOut = ({ proyectoId }) => {
  const [estado, setEstado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [ubicacion, setUbicacion] = useState(null);
  const [error, setError] = useState(null);
  const [observaciones, setObservaciones] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tipoAccion, setTipoAccion] = useState(null); // 'checkin' o 'checkout'

  useEffect(() => {
    cargarEstado();
    const interval = setInterval(cargarEstado, 30000); // Actualizar cada 30s
    return () => clearInterval(interval);
  }, [proyectoId]);

  const cargarEstado = async () => {
    try {
      const response = await axiosConfig.get(`/asistencia/estado/${proyectoId}`);
      setEstado(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error cargando estado:', err);
      setError('Error al cargar estado de asistencia');
      setLoading(false);
    }
  };

  const obtenerUbicacion = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalización no soportada'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            precision: position.coords.accuracy
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  };

  const abrirDialog = (tipo) => {
    setTipoAccion(tipo);
    setDialogOpen(true);
    setObservaciones('');
  };

  const confirmarAccion = async () => {
    setProcesando(true);
    setError(null);

    try {
      // Obtener ubicación
      const ubicacionActual = await obtenerUbicacion();
      setUbicacion(ubicacionActual);

      const endpoint = tipoAccion === 'checkin' 
        ? `/asistencia/check-in/${proyectoId}`
        : `/asistencia/check-out/${proyectoId}`;

      const response = await axiosConfig.post(endpoint, {
        ubicacion: ubicacionActual,
        observaciones: observaciones || null,
        trabajoCompletado: tipoAccion === 'checkout' // true para checkout
      });

      // Recargar estado
      await cargarEstado();

      // Cerrar dialog
      setDialogOpen(false);

      // Mostrar mensaje de éxito
      alert(response.data.message);

    } catch (err) {
      console.error('Error en acción:', err);
      setError(err.response?.data?.message || 'Error al procesar la acción');
    } finally {
      setProcesando(false);
    }
  };

  const formatearTiempo = (minutos) => {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas}h ${mins}m`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationOn />
            Control de Asistencia
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Estado Actual */}
          <Box sx={{ mb: 3 }}>
            <Chip
              label={
                estado?.estado === 'sin_iniciar' ? 'Sin Iniciar' :
                estado?.estado === 'en_curso' ? 'En Curso' :
                'Completado'
              }
              color={
                estado?.estado === 'sin_iniciar' ? 'default' :
                estado?.estado === 'en_curso' ? 'primary' :
                'success'
              }
              icon={
                estado?.estado === 'sin_iniciar' ? <Cancel /> :
                estado?.estado === 'en_curso' ? <AccessTime /> :
                <CheckCircle />
              }
            />
          </Box>

          {/* Botones de Acción */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                startIcon={<LocationOn />}
                onClick={() => abrirDialog('checkin')}
                disabled={estado?.tieneCheckIn && !estado?.tieneCheckOut}
              >
                Confirmar Entrada
              </Button>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                variant="contained"
                color="success"
                size="large"
                startIcon={<CheckCircle />}
                onClick={() => abrirDialog('checkout')}
                disabled={!estado?.tieneCheckIn || estado?.tieneCheckOut}
              >
                Confirmar Salida
              </Button>
            </Grid>
          </Grid>

          {/* Información de Check-in */}
          {estado?.checkIn && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                <strong>Entrada Registrada:</strong>
              </Typography>
              <Typography variant="body2">
                📅 {new Date(estado.checkIn.fecha).toLocaleDateString('es-MX')}
              </Typography>
              <Typography variant="body2">
                🕐 {estado.checkIn.hora}
              </Typography>
              <Typography variant="body2">
                👤 {estado.checkIn.nombreUsuario}
              </Typography>
              {estado.checkIn.enSitio !== undefined && (
                <Chip
                  size="small"
                  label={estado.checkIn.enSitio ? '✓ En sitio' : `⚠️ ${Math.round(estado.checkIn.distanciaAlSitio)}m del sitio`}
                  color={estado.checkIn.enSitio ? 'success' : 'warning'}
                  sx={{ mt: 1 }}
                />
              )}
            </Box>
          )}

          {/* Información de Check-out */}
          {estado?.checkOut && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                <strong>Salida Registrada:</strong>
              </Typography>
              <Typography variant="body2">
                📅 {new Date(estado.checkOut.fecha).toLocaleDateString('es-MX')}
              </Typography>
              <Typography variant="body2">
                🕐 {estado.checkOut.hora}
              </Typography>
              <Typography variant="body2">
                ⏱️ Tiempo total: {formatearTiempo(estado.checkOut.tiempoTotal)}
              </Typography>
              <Typography variant="body2">
                {estado.checkOut.trabajoCompletado ? '✅ Trabajo completado' : '⚠️ Trabajo pendiente'}
              </Typography>
            </Box>
          )}

          {/* Métricas de Rendimiento */}
          {estado?.metricas && (
            <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid #e0e0e0' }}>
              <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp />
                <strong>Métricas de Rendimiento</strong>
              </Typography>

              <Grid container spacing={2} sx={{ mt: 1 }}>
                {estado.metricas.puntualidad !== undefined && (
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Puntualidad
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {estado.metricas.fueronPuntuales ? (
                          <CheckCircle color="success" fontSize="small" />
                        ) : (
                          <Warning color="warning" fontSize="small" />
                        )}
                        <Typography variant="body2">
                          {estado.metricas.puntualidad > 0 ? '+' : ''}{estado.metricas.puntualidad} min
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}

                {estado.metricas.eficiencia !== undefined && (
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Eficiencia
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Speed fontSize="small" color={estado.metricas.fueronEficientes ? 'success' : 'warning'} />
                        <Typography variant="body2">
                          {estado.metricas.eficiencia}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(estado.metricas.eficiencia, 100)}
                        color={estado.metricas.fueronEficientes ? 'success' : 'warning'}
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  </Grid>
                )}

                {estado.metricas.tiempoEnSitio && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">
                      Tiempo en sitio
                    </Typography>
                    <Typography variant="body2">
                      {formatearTiempo(estado.metricas.tiempoEnSitio)}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Confirmación */}
      <Dialog open={dialogOpen} onClose={() => !procesando && setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {tipoAccion === 'checkin' ? 'Confirmar Entrada' : 'Confirmar Salida'}
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Se capturará tu ubicación actual para registrar tu {tipoAccion === 'checkin' ? 'entrada' : 'salida'}.
          </Alert>

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Observaciones (opcional)"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Agrega cualquier nota relevante..."
            disabled={procesando}
          />

          {procesando && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress />
              <Typography variant="caption" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                Obteniendo ubicación...
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={procesando}>
            Cancelar
          </Button>
          <Button
            onClick={confirmarAccion}
            variant="contained"
            color={tipoAccion === 'checkin' ? 'primary' : 'success'}
            disabled={procesando}
          >
            {procesando ? 'Procesando...' : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CheckInOut;

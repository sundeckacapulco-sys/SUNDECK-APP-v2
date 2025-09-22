import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Grid,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import {
  Build,
  CheckCircle,
  Schedule,
  Warning,
  Home,
  PlayArrow,
  Stop,
  Done,
  Engineering,
  Handyman
} from '@mui/icons-material';
import axiosConfig from '../../config/axios';

const GestionFabricacion = ({ pedido, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const estadosFabricacion = [
    { 
      value: 'pendiente', 
      label: '⏳ Pendiente', 
      color: 'default',
      description: 'En espera de iniciar fabricación'
    },
    { 
      value: 'en_proceso', 
      label: '🔨 En Proceso', 
      color: 'primary',
      description: 'Fabricación en curso'
    },
    { 
      value: 'terminado', 
      label: '✅ Terminado', 
      color: 'success',
      description: 'Fabricación completada'
    },
    { 
      value: 'instalado', 
      label: '🏠 Instalado', 
      color: 'secondary',
      description: 'Instalación completada'
    }
  ];

  const getEstadoInfo = (estado) => {
    return estadosFabricacion.find(e => e.value === estado) || estadosFabricacion[0];
  };

  const calcularProgreso = () => {
    const productos = pedido?.productos || [];
    if (productos.length === 0) return 0;

    const puntajes = {
      'pendiente': 0,
      'en_proceso': 25,
      'terminado': 75,
      'instalado': 100
    };

    const totalPuntaje = productos.reduce((sum, producto) => {
      return sum + (puntajes[producto.estadoFabricacion] || 0);
    }, 0);

    return Math.round(totalPuntaje / productos.length);
  };

  const calcularTiemposEstimados = () => {
    const ahora = new Date();
    const fechaInicio = pedido?.fechaInicioFabricacion ? new Date(pedido.fechaInicioFabricacion) : ahora;
    const fechaFin = pedido?.fechaFinFabricacion ? new Date(pedido.fechaFinFabricacion) : new Date(ahora.getTime() + 15 * 24 * 60 * 60 * 1000);
    const fechaInstalacion = pedido?.fechaInstalacion ? new Date(pedido.fechaInstalacion) : new Date(fechaFin.getTime() + 1 * 24 * 60 * 60 * 1000);

    const diasTranscurridos = Math.max(0, Math.ceil((ahora - fechaInicio) / (1000 * 60 * 60 * 24)));
    const diasRestantes = Math.max(0, Math.ceil((fechaFin - ahora) / (1000 * 60 * 60 * 24)));
    const diasHastaInstalacion = Math.max(0, Math.ceil((fechaInstalacion - ahora) / (1000 * 60 * 60 * 24)));

    return {
      fechaInicio,
      fechaFin,
      fechaInstalacion,
      diasTranscurridos,
      diasRestantes,
      diasHastaInstalacion,
      enRetraso: ahora > fechaFin && pedido?.estado !== 'instalado'
    };
  };

  const handleActualizarEstado = async () => {
    if (!estadoSeleccionado) {
      setError('Selecciona un estado');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await axiosConfig.put(`/pedidos/${pedido._id}/fabricacion`, {
        estado: estadoSeleccionado,
        observaciones: observaciones
      });

      onUpdate(response.data.pedido);
      setModalOpen(false);
      setEstadoSeleccionado('');
      setObservaciones('');
    } catch (error) {
      console.error('Error actualizando estado:', error);
      setError(error.response?.data?.message || 'Error actualizando el estado');
    } finally {
      setLoading(false);
    }
  };

  const progreso = calcularProgreso();
  const tiempos = calcularTiemposEstimados();

  return (
    <Box>
      {/* Resumen del estado */}
      <Card sx={{ mb: 3, border: '2px solid #2563eb' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
              🔨 Estado de Fabricación
            </Typography>
            <Button
              variant="contained"
              startIcon={<Engineering />}
              onClick={() => setModalOpen(true)}
              sx={{ bgcolor: '#2563eb' }}
            >
              Actualizar Estado
            </Button>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Progreso General:
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={progreso} 
                  sx={{ 
                    height: 10, 
                    borderRadius: 5,
                    bgcolor: '#e0e0e0',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: progreso === 100 ? '#4caf50' : progreso >= 75 ? '#ff9800' : '#2196f3'
                    }
                  }} 
                />
                <Typography variant="body2" sx={{ mt: 1, textAlign: 'center', fontWeight: 'bold' }}>
                  {progreso}% Completado
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip 
                  icon={<Schedule />}
                  label={`${tiempos.diasRestantes} días restantes`}
                  color={tiempos.enRetraso ? 'error' : tiempos.diasRestantes <= 3 ? 'warning' : 'success'}
                  size="small"
                />
                <Chip 
                  icon={<Build />}
                  label={pedido?.estado || 'Confirmado'}
                  color="primary"
                  size="small"
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                📅 Cronograma:
              </Typography>
              <Box sx={{ fontSize: '0.875rem' }}>
                <Typography variant="body2">
                  <strong>Inicio:</strong> {tiempos.fechaInicio.toLocaleDateString('es-MX')}
                </Typography>
                <Typography variant="body2">
                  <strong>Fin Fabricación:</strong> {tiempos.fechaFin.toLocaleDateString('es-MX')}
                </Typography>
                <Typography variant="body2">
                  <strong>Instalación:</strong> {tiempos.fechaInstalacion.toLocaleDateString('es-MX')}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {tiempos.enRetraso && (
            <Alert severity="error" sx={{ mt: 2 }}>
              <Typography variant="body2">
                ⚠️ <strong>PEDIDO EN RETRASO:</strong> La fecha estimada de fabricación ya pasó. 
                Se requiere actualización urgente del estado.
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Lista de productos */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold' }}>
            📦 Productos en Fabricación
          </Typography>

          <Grid container spacing={2}>
            {pedido?.productos?.map((producto, index) => {
              const estadoInfo = getEstadoInfo(producto.estadoFabricacion);
              return (
                <Grid item xs={12} md={6} key={index}>
                  <Card sx={{ 
                    border: `2px solid ${estadoInfo.color === 'success' ? '#4caf50' : estadoInfo.color === 'primary' ? '#2196f3' : '#e0e0e0'}`,
                    bgcolor: estadoInfo.color === 'success' ? '#f1f8e9' : estadoInfo.color === 'primary' ? '#e3f2fd' : '#f8f9fa'
                  }}>
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', flex: 1 }}>
                          {producto.nombre}
                        </Typography>
                        <Chip 
                          label={estadoInfo.label}
                          color={estadoInfo.color}
                          size="small"
                        />
                      </Box>

                      <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                        {producto.descripcion}
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                        <Chip 
                          label={`${producto.medidas?.ancho}m × ${producto.medidas?.alto}m`}
                          size="small"
                          variant="outlined"
                        />
                        <Chip 
                          label={`Cant: ${producto.cantidad}`}
                          size="small"
                          variant="outlined"
                        />
                        {producto.requiereR24 && (
                          <Chip 
                            label="R24"
                            size="small"
                            color="warning"
                          />
                        )}
                      </Box>

                      <Typography variant="caption" sx={{ color: '#666' }}>
                        {estadoInfo.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </CardContent>
      </Card>

      {/* Modal para actualizar estado */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#2563eb', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Engineering />
            Actualizar Estado de Fabricación
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Nuevo Estado</InputLabel>
            <Select
              value={estadoSeleccionado}
              onChange={(e) => setEstadoSeleccionado(e.target.value)}
              label="Nuevo Estado"
            >
              {estadosFabricacion.map((estado) => (
                <MenuItem key={estado.value} value={estado.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {estado.label}
                    <Typography variant="caption" sx={{ color: '#666', ml: 1 }}>
                      - {estado.description}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Observaciones"
            multiline
            rows={4}
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Describe el progreso, problemas encontrados, o cualquier información relevante..."
            helperText="Información adicional sobre el cambio de estado"
          />

          {estadoSeleccionado && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Efecto del cambio:</strong><br/>
                {estadoSeleccionado === 'en_proceso' && '• Se marcará el inicio de fabricación\n• El pedido pasará a estado "En Fabricación"'}
                {estadoSeleccionado === 'terminado' && '• Se marcará la fabricación como completada\n• El pedido pasará a estado "Fabricado"'}
                {estadoSeleccionado === 'instalado' && '• Se marcará la instalación como completada\n• El pedido pasará a estado "Instalado"\n• Se actualizará la fecha de entrega'}
              </Typography>
            </Alert>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setModalOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleActualizarEstado}
            variant="contained"
            disabled={loading || !estadoSeleccionado}
            startIcon={loading ? <Schedule /> : <Done />}
            sx={{ bgcolor: '#4caf50' }}
          >
            {loading ? 'Actualizando...' : 'Actualizar Estado'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GestionFabricacion;

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Avatar,
  Divider
} from '@mui/material';
import {
  Factory as FactoryIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Build as BuildIcon,
  Visibility as ViewIcon,
  GetApp as DownloadIcon,
  Add as AddIcon,
  Warning as WarningIcon,
  Description as DescriptionIcon,
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Assignment as AssignmentIcon,
  PhotoCamera as PhotoIcon,
  AttachMoney as MoneyIcon,
  Person as PersonIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import axiosConfig from '../../../config/axios';

const ESTADOS_FABRICACION = {
  'pendiente': { color: 'default', label: 'Pendiente', icon: <PendingIcon /> },
  'materiales_pedidos': { color: 'info', label: 'Materiales Pedidos', icon: <ScheduleIcon /> },
  'en_proceso': { color: 'warning', label: 'En Proceso', icon: <BuildIcon /> },
  'control_calidad': { color: 'secondary', label: 'Control Calidad', icon: <AssignmentIcon /> },
  'terminado': { color: 'success', label: 'Terminado', icon: <CheckCircleIcon /> },
  'empacado': { color: 'primary', label: 'Empacado', icon: <FactoryIcon /> }
};

const ESTADOS_PROCESO = {
  'pendiente': { color: 'default', label: 'Pendiente' },
  'en_proceso': { color: 'warning', label: 'En Proceso' },
  'completado': { color: 'success', label: 'Completado' },
  'pausado': { color: 'error', label: 'Pausado' }
};

const FabricacionTab = ({ proyecto, estadisticas, onActualizar }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Estados para diálogos
  const [dialogoIniciar, setDialogoIniciar] = useState(false);
  const [dialogoProceso, setDialogoProceso] = useState(false);
  const [dialogoCalidad, setDialogoCalidad] = useState(false);
  const [dialogoEmpaque, setDialogoEmpaque] = useState(false);
  
  // Estados para formularios
  const [procesoSeleccionado, setProcesoSeleccionado] = useState(null);
  const [datosIniciales, setDatosIniciales] = useState({
    asignadoA: '',
    prioridad: 'media'
  });
  
  const formatearFecha = (fecha) => {
    if (!fecha) return 'No definida';
    return new Date(fecha).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatearDuracion = (horas) => {
    if (!horas) return '0h';
    if (horas < 24) return `${horas}h`;
    const dias = Math.floor(horas / 24);
    const horasRestantes = horas % 24;
    return `${dias}d ${horasRestantes}h`;
  };

  // Función para descargar Orden de Producción PDF
  const descargarOrdenProduccion = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axiosConfig.get(
        `/proyectos/${proyecto._id}/pdf?tipo=orden-produccion`,
        { responseType: 'blob' }
      );

      // Crear URL del blob y descargar
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `orden-produccion-${proyecto.numero}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSuccess('Orden de Producción descargada correctamente');
    } catch (error) {
      console.error('Error descargando orden:', error);
      setError(error.response?.data?.message || 'Error al descargar la Orden de Producción');
    } finally {
      setLoading(false);
    }
  };

  // Funciones para manejar fabricación
  const iniciarFabricacion = async () => {
    try {
      setLoading(true);
      const response = await axiosConfig.post(`/proyectos/${proyecto._id}/fabricacion/iniciar`, datosIniciales);
      setSuccess('Fabricación iniciada exitosamente');
      setDialogoIniciar(false);
      if (onActualizar) onActualizar();
    } catch (error) {
      setError(error.response?.data?.message || 'Error iniciando fabricación');
    } finally {
      setLoading(false);
    }
  };

  const actualizarProceso = async (procesoId, datosActualizacion) => {
    try {
      setLoading(true);
      await axiosConfig.put(`/proyectos/${proyecto._id}/fabricacion/proceso/${procesoId}`, datosActualizacion);
      setSuccess('Proceso actualizado exitosamente');
      if (onActualizar) onActualizar();
    } catch (error) {
      setError(error.response?.data?.message || 'Error actualizando proceso');
    } finally {
      setLoading(false);
    }
  };

  const realizarControlCalidad = async (datosCalidad) => {
    try {
      setLoading(true);
      await axiosConfig.post(`/proyectos/${proyecto._id}/fabricacion/control-calidad`, datosCalidad);
      setSuccess('Control de calidad registrado');
      setDialogoCalidad(false);
      if (onActualizar) onActualizar();
    } catch (error) {
      setError(error.response?.data?.message || 'Error en control de calidad');
    } finally {
      setLoading(false);
    }
  };

  // Verificar si puede iniciar fabricación
  const puedeIniciarFabricacion = () => {
    return proyecto.estado === 'confirmado' && !proyecto.fabricacion?.estado;
  };

  // Obtener progreso general
  const progresoGeneral = proyecto.fabricacion?.progreso || 0;
  const estadoFabricacion = proyecto.fabricacion?.estado || 'pendiente';

  return (
    <Box>
      {/* Alertas */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Header con estado y progreso */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FactoryIcon />
              Estado de Fabricación
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              {/* Botón Orden de Producción - Siempre visible */}
              <Button
                variant="contained"
                startIcon={<DescriptionIcon />}
                onClick={descargarOrdenProduccion}
                disabled={loading}
                sx={{
                  bgcolor: '#D4AF37',
                  '&:hover': {
                    bgcolor: '#B8941F'
                  }
                }}
              >
                🛠️ Orden de Producción
              </Button>

              {puedeIniciarFabricacion() && (
                <Button
                  variant="contained"
                  startIcon={<StartIcon />}
                  onClick={() => setDialogoIniciar(true)}
                  color="primary"
                >
                  Iniciar Fabricación
                </Button>
              )}
              
              {estadoFabricacion === 'en_proceso' && (
                <Button
                  variant="outlined"
                  startIcon={<AssignmentIcon />}
                  onClick={() => setDialogoCalidad(true)}
                >
                  Control Calidad
                </Button>
              )}
            </Box>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Chip
                  icon={ESTADOS_FABRICACION[estadoFabricacion]?.icon}
                  label={ESTADOS_FABRICACION[estadoFabricacion]?.label}
                  color={ESTADOS_FABRICACION[estadoFabricacion]?.color}
                  size="large"
                />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Progreso General
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={progresoGeneral} 
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {progresoGeneral}% completado
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Fecha Inicio
                  </Typography>
                  <Typography variant="body1">
                    {formatearFecha(proyecto.cronograma?.fechaInicioFabricacion)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Fecha Estimada
                  </Typography>
                  <Typography variant="body1">
                    {formatearFecha(proyecto.cronograma?.fechaFinFabricacionEstimada)}
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Materiales */}
      {proyecto.fabricacion?.materiales && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BuildIcon />
              Materiales
            </Typography>
            
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Material</TableCell>
                    <TableCell align="right">Cantidad</TableCell>
                    <TableCell align="center">Estado</TableCell>
                    <TableCell>Proveedor</TableCell>
                    <TableCell align="right">Costo</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {proyecto.fabricacion.materiales.map((material, index) => (
                    <TableRow key={index}>
                      <TableCell>{material.nombre}</TableCell>
                      <TableCell align="right">
                        {material.cantidad} {material.unidad}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={material.disponible ? 'Disponible' : 'Pendiente'}
                          color={material.disponible ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{material.proveedor || '-'}</TableCell>
                      <TableCell align="right">
                        ${material.costo?.toLocaleString() || '0'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Procesos de Fabricación */}
      {proyecto.fabricacion?.procesos && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TimelineIcon />
              Procesos de Fabricación
            </Typography>
            
            <Stepper orientation="vertical">
              {proyecto.fabricacion.procesos.map((proceso, index) => (
                <Step key={proceso._id || index} active={proceso.estado !== 'pendiente'} completed={proceso.estado === 'completado'}>
                  <StepLabel>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <Typography variant="subtitle1">
                        {proceso.nombre}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Chip
                          label={ESTADOS_PROCESO[proceso.estado]?.label}
                          color={ESTADOS_PROCESO[proceso.estado]?.color}
                          size="small"
                        />
                        {proceso.estado !== 'completado' && (
                          <IconButton
                            size="small"
                            onClick={() => {
                              setProcesoSeleccionado(proceso);
                              setDialogoProceso(true);
                            }}
                          >
                            <BuildIcon />
                          </IconButton>
                        )}
                      </Box>
                    </Box>
                  </StepLabel>
                  <StepContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {proceso.descripcion}
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Tiempo Estimado: {formatearDuracion(proceso.tiempoEstimado)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Tiempo Real: {formatearDuracion(proceso.tiempoReal)}
                        </Typography>
                      </Grid>
                    </Grid>

                    {proceso.observaciones && (
                      <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                        {proceso.observaciones}
                      </Typography>
                    )}

                    {proceso.fechaInicio && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                        Iniciado: {formatearFecha(proceso.fechaInicio)}
                        {proceso.fechaFin && ` • Terminado: ${formatearFecha(proceso.fechaFin)}`}
                      </Typography>
                    )}
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          </CardContent>
        </Card>
      )}

      {/* Control de Calidad */}
      {proyecto.fabricacion?.controlCalidad?.realizado && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AssignmentIcon />
              Control de Calidad
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  Resultado
                </Typography>
                <Chip
                  label={proyecto.fabricacion.controlCalidad.resultado}
                  color={
                    proyecto.fabricacion.controlCalidad.resultado === 'aprobado' ? 'success' :
                    proyecto.fabricacion.controlCalidad.resultado === 'rechazado' ? 'error' : 'warning'
                  }
                  sx={{ mt: 1 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  Fecha de Revisión
                </Typography>
                <Typography variant="body1">
                  {formatearFecha(proyecto.fabricacion.controlCalidad.fechaRevision)}
                </Typography>
              </Grid>
            </Grid>

            {proyecto.fabricacion.controlCalidad.observaciones && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Observaciones
                </Typography>
                <Typography variant="body1">
                  {proyecto.fabricacion.controlCalidad.observaciones}
                </Typography>
              </Box>
            )}

            {proyecto.fabricacion.controlCalidad.defectosEncontrados?.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Defectos Encontrados
                </Typography>
                <List dense>
                  {proyecto.fabricacion.controlCalidad.defectosEncontrados.map((defecto, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <WarningIcon color={
                          defecto.gravedad === 'critico' ? 'error' :
                          defecto.gravedad === 'mayor' ? 'warning' : 'info'
                        } />
                      </ListItemIcon>
                      <ListItemText
                        primary={defecto.descripcion}
                        secondary={`Gravedad: ${defecto.gravedad} • ${defecto.corregido ? 'Corregido' : 'Pendiente'}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Costos de Fabricación */}
      {proyecto.fabricacion?.costos && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MoneyIcon />
              Costos de Fabricación
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Materiales
                </Typography>
                <Typography variant="h6">
                  ${proyecto.fabricacion.costos.materiales?.toLocaleString() || '0'}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Mano de Obra
                </Typography>
                <Typography variant="h6">
                  ${proyecto.fabricacion.costos.manoObra?.toLocaleString() || '0'}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Overhead
                </Typography>
                <Typography variant="h6">
                  ${proyecto.fabricacion.costos.overhead?.toLocaleString() || '0'}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Total
                </Typography>
                <Typography variant="h6" color="primary">
                  ${proyecto.fabricacion.costos.total?.toLocaleString() || '0'}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Diálogo para iniciar fabricación */}
      <Dialog open={dialogoIniciar} onClose={() => setDialogoIniciar(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Iniciar Fabricación</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Asignado a</InputLabel>
                <Select
                  value={datosIniciales.asignadoA}
                  onChange={(e) => setDatosIniciales(prev => ({ ...prev, asignadoA: e.target.value }))}
                >
                  <MenuItem value="fabricante1">Juan Pérez - Fabricante</MenuItem>
                  <MenuItem value="fabricante2">María García - Fabricante</MenuItem>
                  <MenuItem value="fabricante3">Carlos López - Fabricante</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Prioridad</InputLabel>
                <Select
                  value={datosIniciales.prioridad}
                  onChange={(e) => setDatosIniciales(prev => ({ ...prev, prioridad: e.target.value }))}
                >
                  <MenuItem value="baja">Baja</MenuItem>
                  <MenuItem value="media">Media</MenuItem>
                  <MenuItem value="alta">Alta</MenuItem>
                  <MenuItem value="urgente">Urgente</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogoIniciar(false)}>Cancelar</Button>
          <Button onClick={iniciarFabricacion} variant="contained" disabled={loading}>
            {loading ? 'Iniciando...' : 'Iniciar Fabricación'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FabricacionTab;

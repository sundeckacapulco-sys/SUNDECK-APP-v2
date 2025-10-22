import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Avatar,
  Tooltip,
  Fab,
  Badge
} from '@mui/material';
import {
  Home as HomeIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  PhotoCamera as PhotoIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarIcon,
  Add as AddIcon,
  Navigation as NavigationIcon
} from '@mui/icons-material';
import axiosConfig from '../../config/axios';

const DashboardInstalaciones = () => {
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProyecto, setSelectedProyecto] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [evidencias, setEvidencias] = useState([]);
  const [notas, setNotas] = useState('');
  const [estadisticas, setEstadisticas] = useState({
    programadas: 0,
    enProceso: 0,
    completadas: 0,
    pendientes: 0
  });

  useEffect(() => {
    cargarProyectosInstalacion();
    cargarEstadisticas();
  }, []);

  const cargarProyectosInstalacion = async () => {
    try {
      setLoading(true);
      // Proyectos fabricados y en instalación asignados al usuario actual
      const response = await axiosConfig.get('/proyecto-pedido', {
        params: {
          estado: 'fabricado,en_instalacion',
          instalador: 'current_user',
          limit: 50
        }
      });

      if (response.data.success) {
        setProyectos(response.data.data.docs || []);
      }
    } catch (error) {
      console.error('Error cargando proyectos:', error);
      setError('Error cargando proyectos de instalación');
    } finally {
      setLoading(false);
    }
  };

  const cargarEstadisticas = async () => {
    try {
      const response = await axiosConfig.get('/proyecto-pedido/estadisticas');
      if (response.data.success) {
        // Calcular estadísticas específicas para instalación
        const stats = response.data.data.porEstado;
        setEstadisticas({
          programadas: stats.find(s => s._id === 'fabricado')?.count || 0,
          enProceso: stats.find(s => s._id === 'en_instalacion')?.count || 0,
          completadas: stats.find(s => s._id === 'completado')?.count || 0,
          pendientes: stats.find(s => s._id === 'fabricado')?.count || 0
        });
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const iniciarInstalacion = async (proyectoId) => {
    try {
      await axiosConfig.patch(`/proyecto-pedido/${proyectoId}/estado`, {
        nuevoEstado: 'en_instalacion',
        nota: 'Instalación iniciada'
      });

      cargarProyectosInstalacion();
    } catch (error) {
      console.error('Error iniciando instalación:', error);
      setError('Error iniciando instalación');
    }
  };

  const completarInstalacion = async (proyectoId) => {
    try {
      await axiosConfig.patch(`/proyecto-pedido/${proyectoId}/estado`, {
        nuevoEstado: 'completado',
        nota: notas || 'Instalación completada exitosamente'
      });

      // Subir evidencias si las hay
      if (evidencias.length > 0) {
        // Aquí iría la lógica para subir fotos
        console.log('Subiendo evidencias:', evidencias);
      }

      setDialogOpen(false);
      setNotas('');
      setEvidencias([]);
      cargarProyectosInstalacion();
    } catch (error) {
      console.error('Error completando instalación:', error);
      setError('Error completando instalación');
    }
  };

  const abrirMapa = (direccion) => {
    const query = encodeURIComponent(
      `${direccion.calle}, ${direccion.colonia}, ${direccion.ciudad}`
    );
    window.open(`https://maps.google.com/maps?q=${query}`, '_blank');
  };

  const llamarCliente = (telefono) => {
    window.open(`tel:${telefono}`);
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-MX', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getColorEstado = (estado) => {
    const colores = {
      'fabricado': '#f59e0b',
      'en_instalacion': '#3b82f6',
      'completado': '#10b981'
    };
    return colores[estado] || '#6b7280';
  };

  const getIconoEstado = (estado) => {
    switch (estado) {
      case 'fabricado':
        return <ScheduleIcon />;
      case 'en_instalacion':
        return <HomeIcon />;
      case 'completado':
        return <CheckIcon />;
      default:
        return <ScheduleIcon />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#10b981', mb: 1 }}>
          🏠 Panel de Instalaciones
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Programación, seguimiento y evidencias de instalación
        </Typography>
      </Box>

      {/* Estadísticas */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ScheduleIcon sx={{ color: '#f59e0b', mr: 1 }} />
                <Typography variant="h6" component="div">
                  {estadisticas.programadas}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Programadas
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <HomeIcon sx={{ color: '#3b82f6', mr: 1 }} />
                <Typography variant="h6" component="div">
                  {estadisticas.enProceso}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                En Proceso
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckIcon sx={{ color: '#10b981', mr: 1 }} />
                <Typography variant="h6" component="div">
                  {estadisticas.completadas}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Completadas Hoy
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <WarningIcon sx={{ color: '#ef4444', mr: 1 }} />
                <Typography variant="h6" component="div">
                  {estadisticas.pendientes}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Pendientes
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Tabla de Instalaciones */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            📅 Calendario de Instalaciones
          </Typography>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Proyecto</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Dirección</TableCell>
                  <TableCell>Fecha Programada</TableCell>
                  <TableCell>Productos</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      Cargando instalaciones...
                    </TableCell>
                  </TableRow>
                ) : proyectos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No hay instalaciones programadas
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  proyectos.map((proyecto) => (
                    <TableRow key={proyecto._id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {proyecto.numero}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Creado: {formatearFecha(proyecto.createdAt)}
                          </Typography>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ mr: 1, bgcolor: '#10b981' }}>
                            {proyecto.cliente.nombre.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {proyecto.cliente.nombre}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <PhoneIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {proyecto.cliente.telefono}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {proyecto.entrega?.direccion?.calle || 'Sin dirección'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {proyecto.entrega?.direccion?.colonia}, {proyecto.entrega?.direccion?.ciudad}
                          </Typography>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CalendarIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {proyecto.cronograma?.fechaInstalacionProgramada 
                              ? formatearFecha(proyecto.cronograma.fechaInstalacionProgramada)
                              : 'Por programar'
                            }
                          </Typography>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          {proyecto.productos.length} productos
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {proyecto.productos.reduce((sum, p) => sum + (p.medidas.area * p.cantidad), 0).toFixed(1)} m²
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Chip
                          icon={getIconoEstado(proyecto.estado)}
                          label={proyecto.estado === 'fabricado' ? 'Listo' : 
                                 proyecto.estado === 'en_instalacion' ? 'Instalando' : 'Completado'}
                          size="small"
                          sx={{
                            bgcolor: getColorEstado(proyecto.estado),
                            color: 'white'
                          }}
                        />
                      </TableCell>
                      
                      <TableCell align="center">
                        <Tooltip title="Ver en mapa">
                          <IconButton
                            onClick={() => abrirMapa(proyecto.entrega?.direccion || {})}
                            disabled={!proyecto.entrega?.direccion?.calle}
                          >
                            <NavigationIcon />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Llamar cliente">
                          <IconButton
                            onClick={() => llamarCliente(proyecto.cliente.telefono)}
                          >
                            <PhoneIcon />
                          </IconButton>
                        </Tooltip>
                        
                        {proyecto.estado === 'fabricado' && (
                          <Tooltip title="Iniciar instalación">
                            <IconButton
                              onClick={() => iniciarInstalacion(proyecto._id)}
                              sx={{ color: '#3b82f6' }}
                            >
                              <HomeIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {proyecto.estado === 'en_instalacion' && (
                          <Tooltip title="Completar instalación">
                            <IconButton
                              onClick={() => {
                                setSelectedProyecto(proyecto);
                                setDialogOpen(true);
                              }}
                              sx={{ color: '#10b981' }}
                            >
                              <CheckIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Dialog de Completar Instalación */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          ✅ Completar Instalación - {selectedProyecto?.numero}
        </DialogTitle>
        <DialogContent>
          {selectedProyecto && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Cliente: {selectedProyecto.cliente.nombre}
              </Typography>
              
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Productos Instalados:
              </Typography>
              
              {selectedProyecto.productos.map((producto, index) => (
                <Card key={index} sx={{ mb: 2, bgcolor: '#f8fafc' }}>
                  <CardContent>
                    <Typography variant="subtitle2">
                      ✅ {producto.nombre}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {producto.medidas.ancho}m × {producto.medidas.alto}m | {producto.color}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  📸 Evidencias de Instalación:
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<PhotoIcon />}
                  onClick={() => {
                    // Aquí iría la lógica para tomar/subir fotos
                    console.log('Abrir cámara o galería');
                  }}
                >
                  Agregar Fotos
                </Button>
                {evidencias.length > 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                    {evidencias.length} foto(s) agregada(s)
                  </Typography>
                )}
              </Box>
              
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notas de instalación"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Detalles de la instalación, observaciones del cliente, etc."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={() => completarInstalacion(selectedProyecto._id)}
            sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
          >
            Completar Instalación
          </Button>
        </DialogActions>
      </Dialog>

      {/* FAB para acciones rápidas */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          bgcolor: '#10b981',
          '&:hover': { bgcolor: '#059669' }
        }}
        onClick={() => {
          // Acción rápida - por ejemplo, programar nueva instalación
          console.log('Acción rápida');
        }}
      >
        <Badge badgeContent={estadisticas.pendientes} color="error">
          <AddIcon />
        </Badge>
      </Fab>
    </Box>
  );
};

export default DashboardInstalaciones;

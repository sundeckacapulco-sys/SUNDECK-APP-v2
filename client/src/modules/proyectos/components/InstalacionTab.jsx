import React, { useState } from 'react';
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
  Avatar,
  Divider
} from '@mui/material';
import {
  Build as BuildIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  Visibility as ViewIcon,
  GetApp as DownloadIcon,
  Add as AddIcon,
  Camera as CameraIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';

const InstalacionTab = ({ proyecto, estadisticas, onActualizar }) => {
  
  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const obtenerColorEstado = (estado) => {
    const colores = {
      'programada': '#17a2b8',
      'en_proceso': '#fd7e14',
      'completada': '#28a745',
      'cancelada': '#dc3545',
      'reprogramada': '#6f42c1'
    };
    return colores[estado] || '#6c757d';
  };

  const obtenerIconoEstado = (estado) => {
    switch (estado) {
      case 'completada':
        return <CheckCircleIcon />;
      case 'en_proceso':
        return <BuildIcon />;
      case 'programada':
        return <ScheduleIcon />;
      default:
        return <PendingIcon />;
    }
  };

  const instalaciones = proyecto.instalaciones || [];
  const estadisticasInstalacion = estadisticas?.flujo?.instalaciones || {};

  return (
    <Box>
      {/* Resumen de instalaciones */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <BuildIcon sx={{ fontSize: 40, color: '#6f42c1', mb: 1 }} />
              <Typography variant="h4" color="primary">
                {estadisticasInstalacion.total || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Instalaciones
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <ScheduleIcon sx={{ fontSize: 40, color: '#17a2b8', mb: 1 }} />
              <Typography variant="h4" color="primary">
                {estadisticasInstalacion.estados?.programada || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Programadas
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <BuildIcon sx={{ fontSize: 40, color: '#fd7e14', mb: 1 }} />
              <Typography variant="h4" color="primary">
                {estadisticasInstalacion.estados?.en_proceso || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                En Proceso
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckCircleIcon sx={{ fontSize: 40, color: '#28a745', mb: 1 }} />
              <Typography variant="h4" color="primary">
                {estadisticasInstalacion.estados?.completada || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completadas
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Información del cliente para instalación */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📍 Información de Instalación
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Datos del Cliente
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body2">
                    <PersonIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                    {proyecto.cliente.nombre}
                  </Typography>
                  <Typography variant="body2">
                    <PhoneIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                    {proyecto.cliente.telefono}
                  </Typography>
                  {proyecto.cliente.direccion && (
                    <Typography variant="body2">
                      <LocationIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                      {typeof proyecto.cliente.direccion === 'string' 
                        ? proyecto.cliente.direccion 
                        : `${proyecto.cliente.direccion.calle || ''} ${proyecto.cliente.direccion.colonia || ''}, ${proyecto.cliente.direccion.ciudad || ''}`.trim()
                      }
                    </Typography>
                  )}
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Resumen del Proyecto
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body2">
                    <strong>Total de piezas:</strong> {proyecto.medidas?.length || 0}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Área total:</strong> {
                      proyecto.medidas?.reduce((total, medida) => {
                        return total + ((medida.ancho || 0) * (medida.alto || 0) * (medida.cantidad || 1));
                      }, 0).toFixed(2) || 0
                    } m²
                  </Typography>
                  <Typography variant="body2">
                    <strong>Productos motorizados:</strong> {
                      proyecto.medidas?.filter(m => m.motorizado).length || 0
                    }
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Lista de instalaciones */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              🔧 Instalaciones Programadas
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={{ bgcolor: '#D4AF37', '&:hover': { bgcolor: '#B8941F' } }}
              onClick={() => {
                // Navegar a programar nueva instalación
                window.open(`/instalaciones/nueva?proyectoId=${proyecto._id}`, '_blank');
              }}
            >
              Programar Instalación
            </Button>
          </Box>

          {instalaciones.length === 0 ? (
            <Alert severity="info">
              No hay instalaciones programadas para este proyecto.
              <br />
              <Button 
                variant="text" 
                sx={{ mt: 1 }}
                onClick={() => {
                  // Programar instalación automática
                  console.log('Programar instalación automática');
                }}
              >
                Programar instalación automática desde fabricación completada
              </Button>
            </Alert>
          ) : (
            <List>
              {instalaciones.map((instalacion, index) => (
                <ListItem
                  key={instalacion._id || index}
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 2,
                    bgcolor: 'background.paper',
                    flexDirection: 'column',
                    alignItems: 'stretch'
                  }}
                >
                  {/* Header de la instalación */}
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 2 }}>
                    <Avatar sx={{ bgcolor: obtenerColorEstado(instalacion.estado), mr: 2 }}>
                      {obtenerIconoEstado(instalacion.estado)}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {instalacion.numero || `INS-${index + 1}`}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Programada: {formatearFecha(instalacion.fechaProgramada)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={instalacion.estado || 'programada'}
                        size="small"
                        sx={{
                          bgcolor: obtenerColorEstado(instalacion.estado),
                          color: 'white'
                        }}
                      />
                      <Tooltip title="Ver instalación">
                        <IconButton
                          size="small"
                          onClick={() => {
                            window.open(`/instalaciones/${instalacion._id}`, '_blank');
                          }}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  {/* Información detallada */}
                  <Grid container spacing={2}>
                    {instalacion.tecnicoAsignado && (
                      <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 1.5, bgcolor: 'primary.50' }}>
                          <Typography variant="caption" color="text.secondary">
                            Técnico Asignado
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            <PersonIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                            {instalacion.tecnicoAsignado.nombre || 'Por asignar'}
                          </Typography>
                        </Paper>
                      </Grid>
                    )}
                    
                    {instalacion.fechaCompletada && (
                      <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 1.5, bgcolor: 'success.50' }}>
                          <Typography variant="caption" color="text.secondary">
                            Completada
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            <CheckCircleIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                            {formatearFecha(instalacion.fechaCompletada)}
                          </Typography>
                        </Paper>
                      </Grid>
                    )}

                    {instalacion.duracionEstimada && (
                      <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 1.5, bgcolor: 'warning.50' }}>
                          <Typography variant="caption" color="text.secondary">
                            Duración Estimada
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            <ScheduleIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                            {instalacion.duracionEstimada} horas
                          </Typography>
                        </Paper>
                      </Grid>
                    )}
                  </Grid>

                  {/* Evidencias y checklist */}
                  {(instalacion.evidencias || instalacion.checklist) && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Grid container spacing={2}>
                        {instalacion.evidencias && instalacion.evidencias.length > 0 && (
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" gutterBottom>
                              📸 Evidencias
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              {instalacion.evidencias.slice(0, 3).map((evidencia, eIndex) => (
                                <Avatar
                                  key={eIndex}
                                  sx={{ width: 60, height: 60 }}
                                  src={evidencia.url}
                                  variant="rounded"
                                >
                                  <CameraIcon />
                                </Avatar>
                              ))}
                              {instalacion.evidencias.length > 3 && (
                                <Avatar sx={{ width: 60, height: 60 }} variant="rounded">
                                  +{instalacion.evidencias.length - 3}
                                </Avatar>
                              )}
                            </Box>
                          </Grid>
                        )}

                        {instalacion.checklist && (
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" gutterBottom>
                              ✅ Checklist
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              <AssignmentIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                              {instalacion.checklist.completados || 0} de {instalacion.checklist.total || 0} items completados
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                    </>
                  )}

                  {/* Observaciones */}
                  {instalacion.observaciones && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="body2" color="text.secondary">
                        💬 <strong>Observaciones:</strong> {instalacion.observaciones}
                      </Typography>
                    </>
                  )}
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Checklist de instalación */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📋 Checklist de Instalación
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell>Ubicación</TableCell>
                  <TableCell>Producto</TableCell>
                  <TableCell>Observaciones</TableCell>
                  <TableCell align="center">Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {proyecto.medidas && proyecto.medidas.length > 0 ? (
                  proyecto.medidas.map((medida, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {index + 1}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {medida.ubicacion || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {medida.producto || '-'}
                        </Typography>
                        {medida.color && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            {medida.color}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {medida.observaciones || 'Sin observaciones'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label="Pendiente"
                          size="small"
                          color="default"
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No hay items para instalar
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default InstalacionTab;

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  Build,
  AccessTime,
  CheckCircle,
  Warning,
  Inventory,
  People,
  BarChart,
  Refresh,
  Settings
} from '@mui/icons-material';

const DashboardFabricacionSimple = () => {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);

  useEffect(() => {
    cargarDashboard();
  }, []);

  const cargarDashboard = async () => {
    try {
      setLoading(true);
      
      // TODO: Implementar endpoint de fabricación
      const response = await fetch('/api/fabricacion');
      if (response.ok) {
        const data = await response.json();
        setOrdenes(data || []);
      }

      setUltimaActualizacion(new Date());
    } catch (error) {
      console.error('Error cargando dashboard fabricación:', error);
      // Datos de ejemplo mientras implementamos el backend completo
      setOrdenes([
        {
          numero: 'FAB-2025-0001',
          cliente: 'María González',
          productos: 3,
          estado: 'en_proceso',
          progreso: 65,
          fechaInicio: new Date(),
          fechaEstimada: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
        },
        {
          numero: 'FAB-2025-0002',
          cliente: 'Carlos Ruiz',
          productos: 2,
          estado: 'pendiente',
          progreso: 0,
          fechaInicio: new Date(),
          fechaEstimada: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'pendiente': return 'warning';
      case 'en_proceso': return 'info';
      case 'terminado': return 'success';
      case 'control_calidad': return 'secondary';
      default: return 'default';
    }
  };

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'pendiente': return '⏳';
      case 'en_proceso': return '🔧';
      case 'terminado': return '✅';
      case 'control_calidad': return '🔍';
      default: return '📦';
    }
  };

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '60vh',
          flexDirection: 'column',
          gap: 2
        }}
      >
        <CircularProgress size={60} sx={{ color: '#10B981' }} />
        <Typography variant="h6" color="text.secondary">
          Cargando Dashboard de Fabricación...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header del Dashboard Fabricación */}
      <Paper 
        sx={{ 
          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
          color: 'white',
          p: 3,
          mb: 3,
          borderRadius: 2
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
              🏭 Dashboard de Fabricación
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
              Control de producción y calidad
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="contained"
              onClick={cargarDashboard}
              startIcon={<Refresh />}
              sx={{ 
                backgroundColor: 'rgba(255,255,255,0.2)',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' }
              }}
            >
              Actualizar
            </Button>
            {ultimaActualizacion && (
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Actualizado: {ultimaActualizacion.toLocaleTimeString()}
              </Typography>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Métricas de Producción */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Órdenes Activas */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Órdenes Activas
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {ordenes.length}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Inventory sx={{ fontSize: 16, color: 'success.main' }} />
                    <Typography variant="body2" color="success.main">
                      En producción
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ 
                  backgroundColor: '#E8F5E8', 
                  p: 1.5, 
                  borderRadius: '50%',
                  ml: 2
                }}>
                  <Build sx={{ color: '#10B981', fontSize: 24 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Productos en Proceso */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Productos en Proceso
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {ordenes.reduce((sum, orden) => sum + orden.productos, 0)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Settings sx={{ fontSize: 16, color: 'info.main' }} />
                    <Typography variant="body2" color="info.main">
                      Unidades
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ 
                  backgroundColor: '#E3F2FD', 
                  p: 1.5, 
                  borderRadius: '50%',
                  ml: 2
                }}>
                  <Inventory sx={{ color: '#1976D2', fontSize: 24 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Tiempo Promedio */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Tiempo Promedio
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                    3.2 días
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <AccessTime sx={{ fontSize: 16, color: 'secondary.main' }} />
                    <Typography variant="body2" color="secondary.main">
                      Por producto
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ 
                  backgroundColor: '#F3E5F5', 
                  p: 1.5, 
                  borderRadius: '50%',
                  ml: 2
                }}>
                  <AccessTime sx={{ color: '#7B1FA2', fontSize: 24 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Eficiencia */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Eficiencia
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                    94%
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                    <Typography variant="body2" color="success.main">
                      Control de calidad
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ 
                  backgroundColor: '#FFF3E0', 
                  p: 1.5, 
                  borderRadius: '50%',
                  ml: 2
                }}>
                  <BarChart sx={{ color: '#F57C00', fontSize: 24 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Órdenes de Fabricación */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="h2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Build sx={{ color: '#10B981' }} />
                  Órdenes de Fabricación
                </Typography>
                <Chip 
                  label={`${ordenes.length} activas`}
                  color="success"
                  size="small"
                />
              </Box>
              
              {ordenes.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                  <Typography color="text.secondary">
                    No hay órdenes de fabricación pendientes.
                  </Typography>
                </Box>
              ) : (
                <List>
                  {ordenes.map((orden, index) => (
                    <React.Fragment key={orden.numero || index}>
                      <ListItem sx={{ flexDirection: 'column', alignItems: 'stretch', py: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="h6">{getEstadoIcon(orden.estado)}</Typography>
                            <Box>
                              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                {orden.numero}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Cliente: {orden.cliente}
                              </Typography>
                            </Box>
                          </Box>
                          <Chip 
                            label={orden.estado.replace('_', ' ').toUpperCase()}
                            color={getEstadoColor(orden.estado)}
                            size="small"
                          />
                        </Box>
                        
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                          <Grid item xs={4}>
                            <Typography variant="caption" color="text.secondary">
                              <strong>Productos:</strong> {orden.productos}
                            </Typography>
                          </Grid>
                          <Grid item xs={4}>
                            <Typography variant="caption" color="text.secondary">
                              <strong>Inicio:</strong> {orden.fechaInicio?.toLocaleDateString()}
                            </Typography>
                          </Grid>
                          <Grid item xs={4}>
                            <Typography variant="caption" color="text.secondary">
                              <strong>Estimado:</strong> {orden.fechaEstimada?.toLocaleDateString()}
                            </Typography>
                          </Grid>
                        </Grid>

                        {/* Barra de progreso */}
                        <Box sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              Progreso de fabricación
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {orden.progreso}%
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={orden.progreso}
                            sx={{ 
                              height: 6, 
                              borderRadius: 3,
                              backgroundColor: 'grey.200',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: '#10B981'
                              }
                            }}
                          />
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Button size="small" variant="outlined" color="success">
                            Ver Detalles
                          </Button>
                          <Button size="small" variant="outlined" color="info">
                            Actualizar Estado
                          </Button>
                          {orden.estado === 'terminado' && (
                            <Button size="small" variant="outlined" color="secondary">
                              Control Calidad
                            </Button>
                          )}
                        </Box>
                      </ListItem>
                      {index < ordenes.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Panel Lateral - Información Técnica */}
        <Grid item xs={12} lg={4}>
          {/* Alertas de Producción */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                ⚠️ Alertas de Producción
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <Warning color="warning" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Material Bajo Stock"
                    secondary="Tela Screen 3% - Quedan 15m"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <AccessTime color="info" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Mantenimiento Programado"
                    secondary="Máquina cortadora - Mañana 2:00 PM"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* Estadísticas Rápidas */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                📊 Estadísticas del Día
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Productos Terminados
                  </Typography>
                  <Typography variant="subtitle2" color="success.main">
                    8
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    En Control de Calidad
                  </Typography>
                  <Typography variant="subtitle2" color="secondary.main">
                    3
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Rechazos
                  </Typography>
                  <Typography variant="subtitle2" color="error.main">
                    0
                  </Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Eficiencia del Día
                  </Typography>
                  <Typography variant="subtitle2" color="success.main">
                    98%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Equipo de Trabajo */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                👥 Equipo Activo
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <Box sx={{ width: 8, height: 8, backgroundColor: 'success.main', borderRadius: '50%' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Juan Pérez"
                    secondary="Cortado"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Box sx={{ width: 8, height: 8, backgroundColor: 'success.main', borderRadius: '50%' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="María López"
                    secondary="Armado"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Box sx={{ width: 8, height: 8, backgroundColor: 'warning.main', borderRadius: '50%' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Carlos Ruiz"
                    secondary="Descanso"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardFabricacionSimple;

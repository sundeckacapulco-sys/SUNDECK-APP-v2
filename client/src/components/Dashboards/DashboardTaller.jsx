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
  LinearProgress,
  Avatar,
  Tooltip
} from '@mui/material';
import {
  Build as BuildIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  PhotoCamera as PhotoIcon,
  Assignment as AssignmentIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import axiosConfig from '../../config/axios';

const DashboardTaller = () => {
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProyecto, setSelectedProyecto] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notas, setNotas] = useState('');
  const [estadisticas, setEstadisticas] = useState({
    enProceso: 0,
    terminados: 0,
    retrasados: 0,
    totalArea: 0
  });

  useEffect(() => {
    cargarProyectosFabricacion();
    cargarEstadisticas();
  }, []);

  const cargarProyectosFabricacion = async () => {
    try {
      setLoading(true);
      // UNIFICADO: Usar modelo Proyecto con estadoComercial = 'en_fabricacion'
      const response = await axiosConfig.get('/proyectos', {
        params: {
          tipo: 'proyecto',
          estadoComercial: 'en_fabricacion',
          limit: 50
        }
      });

      if (response.data.success) {
        setProyectos(response.data.data?.docs || response.data.data || []);
      }
    } catch (error) {
      console.error('Error cargando proyectos:', error);
      setError('Error cargando proyectos de fabricación');
    } finally {
      setLoading(false);
    }
  };

  const cargarEstadisticas = async () => {
    try {
      // UNIFICADO: Usar endpoint de KPIs comerciales
      const response = await axiosConfig.get('/proyectos/kpis/comerciales');
      if (response.data) {
        // Buscar estadísticas de fabricación
        const porEstado = response.data.porEstado || [];
        const fabStats = porEstado.find(s => 
          s._id === 'en_fabricacion' || s._id === 'en fabricacion'
        ) || {};
        
        setEstadisticas({
          enProceso: fabStats.count || 0,
          terminados: 0,
          retrasados: 0,
          totalArea: fabStats.totalArea || 0
        });
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const marcarProductoTerminado = async (proyectoId, productoIndex) => {
    try {
      // UNIFICADO: Usar endpoint de proyectos
      await axiosConfig.patch(`/proyectos/${proyectoId}/fabricacion/producto/${productoIndex}`, {
        estadoFabricacion: 'terminado',
        fechaFinFabricacion: new Date()
      });

      // Agregar nota automática
      await axiosConfig.post(`/proyectos/${proyectoId}/notas`, {
        contenido: `Producto ${productoIndex + 1} marcado como terminado`,
        etapa: 'fabricacion',
        tipo: 'info'
      });

      cargarProyectosFabricacion();
    } catch (error) {
      console.error('Error marcando producto:', error);
      setError('Error actualizando estado del producto');
    }
  };

  const marcarProyectoFabricado = async (proyectoId) => {
    try {
      // UNIFICADO: Usar endpoint de proyectos para cambiar estado
      await axiosConfig.patch(`/proyectos/${proyectoId}/estado-comercial`, {
        estadoComercial: 'en_instalacion',
        nota: notas || 'Fabricación completada, listo para instalación'
      });

      setDialogOpen(false);
      setNotas('');
      cargarProyectosFabricacion();
    } catch (error) {
      console.error('Error marcando proyecto:', error);
      setError('Error completando fabricación');
    }
  };

  const calcularProgreso = (productos) => {
    if (!productos || productos.length === 0) return 0;
    const terminados = productos.filter(p => p.estadoFabricacion === 'terminado').length;
    return Math.round((terminados / productos.length) * 100);
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getColorEstado = (estado) => {
    const colores = {
      'pendiente': '#f59e0b',
      'en_proceso': '#3b82f6',
      'terminado': '#10b981'
    };
    return colores[estado] || '#6b7280';
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#1976D2', mb: 1 }}>
          🔨 Panel de Fabricación
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Gestión de producción y órdenes de trabajo
        </Typography>
      </Box>

      {/* Estadísticas */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <BuildIcon sx={{ color: '#3b82f6', mr: 1 }} />
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
                  {estadisticas.terminados}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Terminados Hoy
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <WarningIcon sx={{ color: '#f59e0b', mr: 1 }} />
                <Typography variant="h6" component="div">
                  {estadisticas.retrasados}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Retrasados
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TimelineIcon sx={{ color: '#8b5cf6', mr: 1 }} />
                <Typography variant="h6" component="div">
                  {estadisticas.totalArea} m²
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Área Total
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

      {/* Tabla de Proyectos */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            📋 Órdenes de Trabajo Asignadas
          </Typography>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Proyecto</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Productos</TableCell>
                  <TableCell>Progreso</TableCell>
                  <TableCell>Fecha Límite</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <LinearProgress />
                    </TableCell>
                  </TableRow>
                ) : proyectos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No hay proyectos asignados para fabricación
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
                            {formatearFecha(proyecto.cronograma?.fechaInicioFabricacion)}
                          </Typography>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {proyecto.cliente.nombre}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {proyecto.cliente.telefono}
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
                        <Box sx={{ width: '100%' }}>
                          <LinearProgress
                            variant="determinate"
                            value={calcularProgreso(proyecto.productos)}
                            sx={{ mb: 1 }}
                          />
                          <Typography variant="caption">
                            {calcularProgreso(proyecto.productos)}% completado
                          </Typography>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          {formatearFecha(proyecto.cronograma?.fechaFinFabricacionEstimada)}
                        </Typography>
                        {proyecto.estadisticas?.diasRetraso > 0 && (
                          <Chip
                            label={`${proyecto.estadisticas.diasRetraso} días`}
                            size="small"
                            color="error"
                          />
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <Chip
                          label="En Fabricación"
                          size="small"
                          sx={{
                            bgcolor: '#3b82f6',
                            color: 'white'
                          }}
                        />
                      </TableCell>
                      
                      <TableCell align="center">
                        <Tooltip title="Ver detalles">
                          <IconButton
                            onClick={() => {
                              setSelectedProyecto(proyecto);
                              setDialogOpen(true);
                            }}
                          >
                            <AssignmentIcon />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Subir fotos">
                          <IconButton>
                            <PhotoIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Dialog de Detalles */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          📋 Detalles de Fabricación - {selectedProyecto?.numero}
        </DialogTitle>
        <DialogContent>
          {selectedProyecto && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Cliente: {selectedProyecto.cliente.nombre}
              </Typography>
              
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Productos a Fabricar:
              </Typography>
              
              {selectedProyecto.productos.map((producto, index) => (
                <Card key={index} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="subtitle2">
                          {producto.nombre}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {producto.medidas.ancho}m × {producto.medidas.alto}m = {producto.medidas.area}m²
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Cantidad: {producto.cantidad} | Color: {producto.color}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ textAlign: 'center' }}>
                        <Chip
                          label={producto.estadoFabricacion}
                          size="small"
                          sx={{
                            bgcolor: getColorEstado(producto.estadoFabricacion),
                            color: 'white',
                            mb: 1
                          }}
                        />
                        {producto.estadoFabricacion !== 'terminado' && (
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => marcarProductoTerminado(selectedProyecto._id, index)}
                          >
                            Marcar Terminado
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
              
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notas de fabricación"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                sx={{ mt: 2 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Cancelar
          </Button>
          {selectedProyecto && calcularProgreso(selectedProyecto.productos) === 100 && (
            <Button
              variant="contained"
              onClick={() => marcarProyectoFabricado(selectedProyecto._id)}
            >
              Completar Fabricación
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DashboardTaller;

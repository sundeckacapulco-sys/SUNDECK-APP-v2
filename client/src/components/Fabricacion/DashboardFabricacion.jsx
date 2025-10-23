import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  LinearProgress,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab
} from '@mui/material';
import {
  Factory as FactoryIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Build as BuildIcon,
  Warning as WarningIcon,
  Assignment as AssignmentIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Person as PersonIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axiosConfig from '../../config/axios';

const ESTADOS_FABRICACION = {
  'pendiente': { color: 'default', label: 'Pendiente', icon: <PendingIcon /> },
  'materiales_pedidos': { color: 'info', label: 'Materiales Pedidos', icon: <ScheduleIcon /> },
  'en_proceso': { color: 'warning', label: 'En Proceso', icon: <BuildIcon /> },
  'control_calidad': { color: 'secondary', label: 'Control Calidad', icon: <AssignmentIcon /> },
  'terminado': { color: 'success', label: 'Terminado', icon: <CheckCircleIcon /> },
  'empacado': { color: 'primary', label: 'Empacado', icon: <FactoryIcon /> }
};

const PRIORIDADES = {
  'baja': { color: 'default', label: 'Baja' },
  'media': { color: 'info', label: 'Media' },
  'alta': { color: 'warning', label: 'Alta' },
  'urgente': { color: 'error', label: 'Urgente' }
};

const DashboardFabricacion = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabActual, setTabActual] = useState(0);
  
  // Estados de datos
  const [colaFabricacion, setColaFabricacion] = useState([]);
  const [metricas, setMetricas] = useState(null);
  const [filtros, setFiltros] = useState({
    estado: '',
    prioridad: '',
    asignadoA: ''
  });

  useEffect(() => {
    cargarDatos();
  }, [filtros]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [colaResponse, metricasResponse] = await Promise.all([
        axiosConfig.get('/fabricacion/cola', { params: filtros }),
        axiosConfig.get('/fabricacion/metricas')
      ]);

      setColaFabricacion(colaResponse.data);
      setMetricas(metricasResponse.data);
    } catch (error) {
      console.error('Error cargando datos de fabricación:', error);
      setError('Error cargando información de fabricación');
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'No definida';
    return new Date(fecha).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calcularDiasRetraso = (fechaEstimada) => {
    if (!fechaEstimada) return 0;
    const hoy = new Date();
    const estimada = new Date(fechaEstimada);
    const diferencia = Math.ceil((hoy - estimada) / (1000 * 60 * 60 * 24));
    return diferencia > 0 ? diferencia : 0;
  };

  const MetricCard = ({ title, value, subtitle, icon, color, trend }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div" color={color} sx={{ mb: 1 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
            {trend !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUpIcon 
                  color={trend >= 0 ? 'success' : 'error'} 
                  sx={{ mr: 1, fontSize: 16 }} 
                />
                <Typography 
                  variant="body2" 
                  color={trend >= 0 ? 'success.main' : 'error.main'}
                >
                  {Math.abs(trend)}% vs mes anterior
                </Typography>
              </Box>
            )}
          </Box>
          <Box sx={{ ml: 2 }}>
            {React.cloneElement(icon, { 
              sx: { fontSize: 48, color: `${color}.main`, opacity: 0.7 } 
            })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const ColaFabricacion = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ 
            p: 1.5, 
            borderRadius: 2, 
            bgcolor: '#D4AF37',
            color: 'white'
          }}>
            <FactoryIcon />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              Cola de Fabricación
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {colaFabricacion.length} proyectos en cola
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            size="small"
            sx={{ 
              borderColor: '#D4AF37',
              color: '#D4AF37',
              '&:hover': {
                borderColor: '#B8941F',
                bgcolor: 'rgba(212, 175, 55, 0.1)'
              }
            }}
          >
            Filtros
          </Button>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={cargarDatos}
            size="small"
            sx={{ 
              bgcolor: '#D4AF37',
              '&:hover': {
                bgcolor: '#B8941F'
              }
            }}
          >
            Actualizar
          </Button>
        </Box>
      </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Proyecto</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell align="center">Estado</TableCell>
                <TableCell align="center">Prioridad</TableCell>
                <TableCell align="center">Progreso</TableCell>
                <TableCell>Asignado a</TableCell>
                <TableCell>Fecha Estimada</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {colaFabricacion.map((proyecto) => {
                const diasRetraso = calcularDiasRetraso(proyecto.cronograma?.fechaFinFabricacionEstimada);
                
                return (
                  <TableRow key={proyecto._id}>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {proyecto.numero}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {proyecto.productos?.length || 0} productos
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {proyecto.cliente?.nombre}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {proyecto.cliente?.telefono}
                      </Typography>
                    </TableCell>
                    
                    <TableCell align="center">
                      <Chip
                        icon={ESTADOS_FABRICACION[proyecto.fabricacion?.estado]?.icon}
                        label={ESTADOS_FABRICACION[proyecto.fabricacion?.estado]?.label}
                        color={ESTADOS_FABRICACION[proyecto.fabricacion?.estado]?.color}
                        size="small"
                      />
                    </TableCell>
                    
                    <TableCell align="center">
                      <Chip
                        label={PRIORIDADES[proyecto.fabricacion?.prioridad]?.label}
                        color={PRIORIDADES[proyecto.fabricacion?.prioridad]?.color}
                        size="small"
                      />
                    </TableCell>
                    
                    <TableCell align="center">
                      <Box sx={{ width: 80 }}>
                        <LinearProgress
                          variant="determinate"
                          value={proyecto.fabricacion?.progreso || 0}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 0.5 }}>
                          {proyecto.fabricacion?.progreso || 0}%
                        </Typography>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      {proyecto.fabricacion?.asignadoA ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>
                            {proyecto.fabricacion.asignadoA.nombre?.charAt(0)}
                          </Avatar>
                          <Typography variant="body2">
                            {proyecto.fabricacion.asignadoA.nombre}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Sin asignar
                        </Typography>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {formatearFecha(proyecto.cronograma?.fechaFinFabricacionEstimada)}
                      </Typography>
                      {diasRetraso > 0 && (
                        <Chip
                          label={`${diasRetraso} días retraso`}
                          color="error"
                          size="small"
                          sx={{ mt: 0.5 }}
                        />
                      )}
                    </TableCell>
                    
                    <TableCell align="center">
                      <Tooltip title="Ver detalles">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/proyectos/${proyecto._id}`)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {colaFabricacion.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <FactoryIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No hay proyectos en fabricación
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Los proyectos confirmados aparecerán aquí cuando se inicie su fabricación
            </Typography>
          </Box>
        )}
    </Box>
  );

  const ProcesosPendientes = () => {
    const procesosPendientes = colaFabricacion.reduce((acc, proyecto) => {
      if (proyecto.fabricacion?.procesos) {
        const pendientes = proyecto.fabricacion.procesos.filter(p => p.estado === 'pendiente' || p.estado === 'en_proceso');
        pendientes.forEach(proceso => {
          acc.push({
            ...proceso,
            proyecto: proyecto.numero,
            cliente: proyecto.cliente?.nombre,
            proyectoId: proyecto._id
          });
        });
      }
      return acc;
    }, []);

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Procesos Pendientes ({procesosPendientes.length})
          </Typography>
          
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Proceso</TableCell>
                  <TableCell>Proyecto</TableCell>
                  <TableCell align="center">Estado</TableCell>
                  <TableCell>Tiempo Estimado</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {procesosPendientes.slice(0, 10).map((proceso, index) => (
                  <TableRow key={`${proceso.proyectoId}-${index}`}>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {proceso.nombre}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {proceso.descripcion}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {proceso.proyecto}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {proceso.cliente}
                      </Typography>
                    </TableCell>
                    
                    <TableCell align="center">
                      <Chip
                        label={proceso.estado === 'pendiente' ? 'Pendiente' : 'En Proceso'}
                        color={proceso.estado === 'pendiente' ? 'default' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    
                    <TableCell>
                      {proceso.tiempoEstimado}h
                    </TableCell>
                    
                    <TableCell align="center">
                      <Tooltip title="Ver proyecto">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/proyectos/${proceso.proyectoId}`)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      p: 3 
    }}>
      {/* Header con diseño Sundeck */}
      <Card sx={{ 
        mb: 4, 
        background: 'linear-gradient(135deg, #D4AF37 0%, #B8941F 100%)',
        color: 'white',
        borderRadius: 3,
        boxShadow: '0 8px 32px rgba(212, 175, 55, 0.3)'
      }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Box sx={{ 
                p: 2, 
                borderRadius: 2, 
                background: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)'
              }}>
                <FactoryIcon sx={{ fontSize: 48 }} />
              </Box>
              <Box>
                <Typography variant="h3" component="h1" sx={{ 
                  fontWeight: 'bold',
                  mb: 1,
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  Dashboard de Fabricación
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9 }}>
                  Control y seguimiento de la producción en tiempo real
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={cargarDatos}
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.3)',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.3)'
                }
              }}
            >
              Actualizar Datos
            </Button>
          </Box>
        </CardContent>
      </Card>

      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(211, 47, 47, 0.1)'
          }}
        >
          {error}
        </Alert>
      )}

      {/* Métricas principales con diseño mejorado */}
      {metricas && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              height: '100%',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.15)'
              }
            }}>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <Box sx={{ 
                  p: 2, 
                  borderRadius: '50%', 
                  bgcolor: '#fff3e0',
                  display: 'inline-flex',
                  mb: 2
                }}>
                  <BuildIcon sx={{ fontSize: 32, color: '#ff9800' }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#ff9800', mb: 1 }}>
                  {metricas.enProceso || 0}
                </Typography>
                <Typography variant="h6" color="text.primary" gutterBottom>
                  En Proceso
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Proyectos activos en fabricación
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              height: '100%',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.15)'
              }
            }}>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <Box sx={{ 
                  p: 2, 
                  borderRadius: '50%', 
                  bgcolor: '#e8f5e8',
                  display: 'inline-flex',
                  mb: 2
                }}>
                  <CheckCircleIcon sx={{ fontSize: 32, color: '#4caf50' }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4caf50', mb: 1 }}>
                  {metricas.terminados || 0}
                </Typography>
                <Typography variant="h6" color="text.primary" gutterBottom>
                  Terminados
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Completados este mes
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              height: '100%',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.15)'
              }
            }}>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <Box sx={{ 
                  p: 2, 
                  borderRadius: '50%', 
                  bgcolor: '#e3f2fd',
                  display: 'inline-flex',
                  mb: 2
                }}>
                  <TrendingUpIcon sx={{ fontSize: 32, color: '#2196f3' }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2196f3', mb: 1 }}>
                  {metricas.eficiencia?.toFixed(0) || 0}%
                </Typography>
                <Typography variant="h6" color="text.primary" gutterBottom>
                  Eficiencia
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Proyectos entregados a tiempo
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              height: '100%',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.15)'
              }
            }}>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <Box sx={{ 
                  p: 2, 
                  borderRadius: '50%', 
                  bgcolor: '#fce4ec',
                  display: 'inline-flex',
                  mb: 2
                }}>
                  <ScheduleIcon sx={{ fontSize: 32, color: '#e91e63' }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#e91e63', mb: 1 }}>
                  {metricas.tiempoPromedioFabricacion || 0}
                </Typography>
                <Typography variant="h6" color="text.primary" gutterBottom>
                  Días Promedio
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tiempo de fabricación
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs con diseño mejorado */}
      <Card sx={{ 
        borderRadius: 3,
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <Box sx={{ 
          borderBottom: 1, 
          borderColor: 'divider',
          background: 'linear-gradient(90deg, #f8f9fa 0%, #e9ecef 100%)'
        }}>
          <Tabs 
            value={tabActual} 
            onChange={(e, newValue) => setTabActual(newValue)}
            sx={{
              '& .MuiTab-root': {
                fontWeight: 'bold',
                fontSize: '1rem',
                textTransform: 'none',
                minHeight: 64,
                '&.Mui-selected': {
                  color: '#D4AF37'
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#D4AF37',
                height: 3
              }
            }}
          >
            <Tab 
              label="Cola de Fabricación" 
              icon={<FactoryIcon />}
              iconPosition="start"
            />
            <Tab 
              label="Procesos Pendientes" 
              icon={<TimelineIcon />}
              iconPosition="start"
            />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          {/* Contenido de tabs */}
          {tabActual === 0 && <ColaFabricacion />}
          {tabActual === 1 && <ProcesosPendientes />}
        </Box>
      </Card>
    </Box>
  );
};

export default DashboardFabricacion;

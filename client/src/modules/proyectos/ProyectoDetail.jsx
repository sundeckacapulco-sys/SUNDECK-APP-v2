import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  Grid,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Alert,
  CircularProgress,
  Divider,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Sync as SyncIcon,
  MoreVert as MoreVertIcon,
  TableChart as ExcelIcon,
  Timeline as TimelineIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import proyectosApi from './services/proyectosApi';
import axiosConfig from '../../config/axios';

// Importar componentes de pestañas
import LevantamientoTab from './components/LevantamientoTab';
import CotizacionTab from './components/CotizacionTab';
import FabricacionTab from './components/FabricacionTab';
import InstalacionTab from './components/InstalacionTab';
import CheckInOut from '../../components/Asistencia/CheckInOut';

const ESTADOS_CONFIG = {
  'nuevo': { color: '#6c757d', label: 'Nuevo', icon: '🆕' },
  'contactado': { color: '#ffc107', label: 'Contactado', icon: '📞' },
  'en_seguimiento': { color: '#ffc107', label: 'En Seguimiento', icon: '👁️' },
  'en seguimiento': { color: '#ffc107', label: 'En Seguimiento', icon: '👁️' },
  'cita_agendada': { color: '#ffc107', label: 'Cita Agendada', icon: '📅' },
  'cita agendada': { color: '#ffc107', label: 'Cita Agendada', icon: '📅' },
  'cotizado': { color: '#17a2b8', label: 'Cotizado', icon: '💰' },
  'sin_respuesta': { color: '#6c757d', label: 'Sin Respuesta', icon: '❓' },
  'sin respuesta': { color: '#6c757d', label: 'Sin Respuesta', icon: '❓' },
  'en_pausa': { color: '#ffc107', label: 'En Pausa', icon: '⏸️' },
  'en pausa': { color: '#ffc107', label: 'En Pausa', icon: '⏸️' },
  'perdido': { color: '#dc3545', label: 'Perdido', icon: '❌' },
  'convertido': { color: '#28a745', label: 'Convertido', icon: '✅' },
  'activo': { color: '#28a745', label: 'Activo', icon: '✅' },
  'en_fabricacion': { color: '#fd7e14', label: 'En Fabricación', icon: '🏭' },
  'en fabricacion': { color: '#fd7e14', label: 'En Fabricación', icon: '🏭' },
  'en_instalacion': { color: '#6f42c1', label: 'En Instalación', icon: '🔧' },
  'en instalacion': { color: '#6f42c1', label: 'En Instalación', icon: '🔧' },
  'completado': { color: '#20c997', label: 'Completado', icon: '🎉' },
  'pausado': { color: '#ffc107', label: 'Pausado', icon: '⏸️' },
  'critico': { color: '#dc3545', label: 'Crítico', icon: '⚠️' },
  'cancelado': { color: '#dc3545', label: 'Cancelado', icon: '❌' }
};

const PASOS_FLUJO = [
  { key: 'levantamiento', label: 'Levantamiento', icon: '📏', aliases: ['nuevo', 'contactado', 'en_seguimiento', 'en seguimiento', 'cita_agendada', 'cita agendada', 'sin_respuesta', 'sin respuesta', 'en_pausa', 'en pausa'] },
  { key: 'cotizacion', label: 'Cotización', icon: '💰', aliases: ['cotizado'] },
  { key: 'aprobado', label: 'Aprobado', icon: '✅', aliases: ['convertido', 'activo'] },
  { key: 'fabricacion', label: 'Fabricación', icon: '🏭', aliases: ['en_fabricacion', 'en fabricacion'] },
  { key: 'instalacion', label: 'Instalación', icon: '🔧', aliases: ['en_instalacion', 'en instalacion'] },
  { key: 'completado', label: 'Completado', icon: '🎉', aliases: [] }
];

const ProyectoDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Estados principales
  const [proyecto, setProyecto] = useState(null);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados de UI - leer tab de la URL si existe
  const tabFromUrl = parseInt(searchParams.get('tab')) || 0;
  const [tabActual, setTabActual] = useState(tabFromUrl);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [dialogoCambiarEstado, setDialogoCambiarEstado] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [observacionesEstado, setObservacionesEstado] = useState('');
  const [transicionesValidas, setTransicionesValidas] = useState([]);
  const [sincronizando, setSincronizando] = useState(false);

  // Cargar datos del proyecto
  useEffect(() => {
    if (id) {
      cargarProyecto();
      cargarEstadisticas();
    }
  }, [id]);

  const cargarProyecto = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await proyectosApi.obtenerProyectoPorId(id);
      
      if (response.success) {
        setProyecto(response.data);
        
        // Definir transiciones válidas según el estado actual
        const estadoActual = response.data.estado;
        const transiciones = obtenerTransicionesValidas(estadoActual);
        setTransicionesValidas(transiciones);
        
        // Recargar estadísticas después de actualizar el proyecto
        await cargarEstadisticas();
      } else {
        setError('Error cargando proyecto');
      }
    } catch (error) {
      console.error('Error cargando proyecto:', error);
      setError('Error de conexión al cargar proyecto');
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener transiciones válidas según el estado actual
  const obtenerTransicionesValidas = (estadoActual) => {
    const flujoNormal = {
      'levantamiento': ['cotizacion', 'cancelado'],
      'cotizacion': ['aprobado', 'levantamiento', 'cancelado'],
      'aprobado': ['fabricacion', 'cotizacion', 'cancelado'],
      'fabricacion': ['instalacion', 'aprobado', 'cancelado'],
      'instalacion': ['completado', 'fabricacion', 'cancelado'],
      'completado': [],
      'cancelado': ['levantamiento', 'cotizacion', 'aprobado']
    };
    
    return flujoNormal[estadoActual] || [];
  };

  const cargarEstadisticas = async () => {
    try {
      const response = await proyectosApi.obtenerEstadisticas(id);
      if (response.success) {
        setEstadisticas(response.data);
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  // Handlers de eventos
  const handleTabChange = (event, newValue) => {
    setTabActual(newValue);
  };

  const handleMenuClick = (event) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleCambiarEstado = async () => {
    try {
      setError(null);
      const response = await proyectosApi.cambiarEstado(id, {
        nuevo_estado: nuevoEstado,
        observaciones: observacionesEstado
      });
      
      if (response.success) {
        await cargarProyecto();
        await cargarEstadisticas();
        setDialogoCambiarEstado(false);
        setNuevoEstado('');
        setObservacionesEstado('');
        handleMenuClose();
      } else {
        setError(response.message || 'Error cambiando estado del proyecto');
      }
    } catch (error) {
      console.error('Error cambiando estado:', error);
      setError(error.response?.data?.message || 'Error cambiando estado del proyecto');
    }
  };

  const handleSincronizar = async () => {
    try {
      setSincronizando(true);
      
      // Sincronizar estado basado en progreso real (cotizaciones, pagos, etc.)
      const estadoResponse = await axiosConfig.post(`/proyectos/${id}/sincronizar-estado`);
      console.log('✅ Estado sincronizado:', estadoResponse.data);
      
      // Sincronizar proyecto con prospecto
      const response = await proyectosApi.sincronizarProyecto(id);
      
      if (response.success || estadoResponse.data.success) {
        await cargarProyecto();
        await cargarEstadisticas();
        
        const mensaje = estadoResponse.data.cambios && estadoResponse.data.cambios.length > 0
          ? `✅ Sincronizado: ${estadoResponse.data.cambios.join(', ')}`
          : '✅ Proyecto sincronizado exitosamente';
        
        alert(mensaje);
      }
    } catch (error) {
      console.error('Error sincronizando:', error);
      setError('Error sincronizando proyecto');
      alert('❌ Error al sincronizar proyecto');
    } finally {
      setSincronizando(false);
      handleMenuClose();
    }
  };

  const handleGenerarExcel = async () => {
    try {
      await proyectosApi.generarExcel(id);
    } catch (error) {
      console.error('Error generando Excel:', error);
      setError('Error generando Excel');
    }
    handleMenuClose();
  };

  // Funciones auxiliares
  const calcularProgreso = (estado) => {
    console.log('🔍 Calculando progreso para estado:', estado);
    const indice = PASOS_FLUJO.findIndex(paso => 
      paso.key === estado || (paso.aliases && paso.aliases.includes(estado))
    );
    console.log('📊 Índice encontrado:', indice, 'de', PASOS_FLUJO.length);
    const progreso = indice >= 0 ? Math.round((indice / (PASOS_FLUJO.length - 1)) * 100) : 0;
    console.log('✅ Progreso calculado:', progreso + '%');
    return progreso;
  };

  const obtenerPasoActual = (estado) => {
    const paso = PASOS_FLUJO.findIndex(paso => 
      paso.key === estado || (paso.aliases && paso.aliases.includes(estado))
    );
    console.log('🎯 Paso actual:', paso, 'para estado:', estado);
    return paso;
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatearMoneda = (cantidad) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(cantidad || 0);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!proyecto) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Proyecto no encontrado</Alert>
      </Box>
    );
  }

  const estadoProyecto = proyecto.estadoComercial || proyecto.estado || 'nuevo';
  
  console.log('📦 Proyecto cargado:', {
    estadoComercial: proyecto.estadoComercial,
    estado: proyecto.estado,
    estadoUsado: estadoProyecto,
    numero: proyecto.numero
  });

  const estadoConfig = ESTADOS_CONFIG[estadoProyecto] || ESTADOS_CONFIG['nuevo'];
  const pasoActual = obtenerPasoActual(estadoProyecto);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/proyectos')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#D4AF37' }}>
            {estadoConfig.icon} {proyecto.cliente.nombre}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 600 }}>
            Proyecto: {proyecto.numero || `#${proyecto._id.slice(-8).toUpperCase()}`}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip
            label={estadoConfig.label || proyecto.estado}
            sx={{
              bgcolor: estadoConfig.color,
              color: 'white',
              fontWeight: 'bold'
            }}
          />
          <IconButton onClick={handleMenuClick}>
            <MoreVertIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Información del cliente y progreso */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Información del cliente */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📋 Información del Cliente
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PhoneIcon color="primary" />
                  <Typography>{proyecto.cliente.telefono}</Typography>
                </Box>
                {proyecto.cliente.correo && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon color="primary" />
                    <Typography>{proyecto.cliente.correo}</Typography>
                  </Box>
                )}
                {proyecto.cliente.direccion && (
                  <Box sx={{ display: 'flex', alignItems: 'start', gap: 1 }}>
                    <LocationIcon color="primary" sx={{ mt: 0.5 }} />
                    <Box>
                      <Typography>
                        {typeof proyecto.cliente.direccion === 'string' 
                          ? proyecto.cliente.direccion 
                          : [
                              proyecto.cliente.direccion.calle,
                              proyecto.cliente.direccion.colonia,
                              proyecto.cliente.direccion.ciudad,
                              proyecto.cliente.direccion.codigoPostal
                            ].filter(Boolean).join(', ')
                        }
                      </Typography>
                      {proyecto.cliente.direccion.referencias && (
                        <Typography variant="caption" color="text.secondary">
                          Ref: {proyecto.cliente.direccion.referencias}
                        </Typography>
                      )}
                      {proyecto.cliente.direccion.linkUbicacion && (
                        <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                          <a 
                            href={proyecto.cliente.direccion.linkUbicacion} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ color: '#1976d2', textDecoration: 'none' }}
                          >
                            📍 Ver en Google Maps
                          </a>
                        </Typography>
                      )}
                    </Box>
                  </Box>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarIcon color="primary" />
                  <Typography>Creado: {formatearFecha(proyecto.fecha_creacion)}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Progreso del proyecto */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📈 Progreso del Proyecto
              </Typography>
              <Box sx={{ mb: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={calcularProgreso(estadoProyecto)}
                  sx={{
                    height: 12,
                    borderRadius: 6,
                    bgcolor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: estadoConfig.color
                    }
                  }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {calcularProgreso(estadoProyecto)}% completado
                </Typography>
              </Box>
              
              {/* Mini stepper */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                {PASOS_FLUJO.map((paso, index) => {
                  const isCompleted = index < pasoActual;
                  const isCurrent = index === pasoActual;
                  const isPending = index > pasoActual;
                  
                  return (
                    <Box key={paso.key} sx={{ textAlign: 'center' }}>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: isCompleted ? '#28a745' : (isCurrent ? estadoConfig.color : 'grey.300'),
                          fontSize: '14px',
                          mx: 'auto'
                        }}
                      >
                        {isCompleted ? '✓' : paso.icon}
                      </Avatar>
                      <Typography 
                        variant="caption" 
                        display="block"
                        sx={{ 
                          fontWeight: isCurrent ? 600 : 400,
                          color: isCompleted ? '#28a745' : (isCurrent ? estadoConfig.color : 'text.secondary')
                        }}
                      >
                        {paso.label}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Pestañas principales */}
      <Card>
        <Tabs
          value={tabActual}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              minWidth: 120,
              fontWeight: 'bold'
            }
          }}
        >
          <Tab label="📏 Levantamiento" />
          <Tab label="💰 Cotización" />
          <Tab label="🏭 Fabricación" />
          <Tab label="🔧 Instalación" />
          <Tab label="📍 Asistencia" />
          <Tab label="📊 Estadísticas" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* Contenido de pestañas */}
          {tabActual === 0 && (
            <LevantamientoTab 
              proyecto={proyecto} 
              onActualizar={cargarProyecto}
            />
          )}
          {tabActual === 1 && (
            <CotizacionTab 
              proyecto={proyecto} 
              estadisticas={estadisticas}
              onActualizar={cargarProyecto}
            />
          )}
          {tabActual === 2 && (
            <FabricacionTab 
              proyecto={proyecto} 
              estadisticas={estadisticas}
              onActualizar={cargarProyecto}
            />
          )}
          {tabActual === 3 && (
            <InstalacionTab 
              proyecto={proyecto} 
              estadisticas={estadisticas}
              onActualizar={cargarProyecto}
            />
          )}
          {tabActual === 4 && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                📍 Control de Asistencia
              </Typography>
              <CheckInOut proyectoId={id} />
            </Box>
          )}
          {tabActual === 5 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                📊 Estadísticas Detalladas
              </Typography>
              {estadisticas ? (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Flujo de Documentos
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography variant="body2">
                          Cotizaciones: {estadisticas.flujo.cotizaciones.total}
                        </Typography>
                        <Typography variant="body2">
                          Pedidos: {estadisticas.flujo.pedidos.total}
                        </Typography>
                        <Typography variant="body2">
                          Órdenes de Fabricación: {estadisticas.flujo.fabricacion.total}
                        </Typography>
                        <Typography variant="body2">
                          Instalaciones: {estadisticas.flujo.instalaciones.total}
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Información Financiera
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography variant="body2">
                          Subtotal: {formatearMoneda(estadisticas.financiero.subtotal)}
                        </Typography>
                        <Typography variant="body2">
                          IVA: {formatearMoneda(estadisticas.financiero.iva)}
                        </Typography>
                        <Typography variant="body2">
                          Total: {formatearMoneda(estadisticas.financiero.total)}
                        </Typography>
                        <Typography variant="body2">
                          Saldo Pendiente: {formatearMoneda(estadisticas.financiero.saldo_pendiente)}
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              ) : (
                <CircularProgress />
              )}
            </Box>
          )}
        </Box>
      </Card>

      {/* Menú contextual */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => setDialogoCambiarEstado(true)}>
          <EditIcon sx={{ mr: 1 }} />
          Cambiar Estado
        </MenuItem>
        <MenuItem onClick={handleSincronizar}>
          <SyncIcon sx={{ mr: 1 }} />
          Sincronizar
        </MenuItem>
        <MenuItem onClick={handleGenerarExcel}>
          <ExcelIcon sx={{ mr: 1 }} />
          Exportar a Excel
        </MenuItem>
      </Menu>

      {/* Diálogo cambiar estado */}
      <Dialog 
        open={dialogoCambiarEstado} 
        onClose={() => {
          setDialogoCambiarEstado(false);
          setNuevoEstado('');
          setObservacionesEstado('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Cambiar Estado del Proyecto</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Nuevo Estado</InputLabel>
            <Select
              value={nuevoEstado}
              onChange={(e) => setNuevoEstado(e.target.value)}
              label="Nuevo Estado"
            >
              {transicionesValidas.length > 0 ? (
                transicionesValidas.map((estado) => (
                  <MenuItem key={estado} value={estado}>
                    {ESTADOS_CONFIG[estado]?.icon} {ESTADOS_CONFIG[estado]?.label || estado}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>No hay transiciones disponibles</MenuItem>
              )}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Observaciones (opcional)"
            value={observacionesEstado}
            onChange={(e) => setObservacionesEstado(e.target.value)}
            sx={{ mt: 2 }}
          />
          {nuevoEstado === 'aprobado' && (
            <Alert severity="info" sx={{ mt: 2 }}>
              ℹ️ Al aprobar el pedido, se enviará una notificación automática al administrador.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setDialogoCambiarEstado(false);
            setNuevoEstado('');
            setObservacionesEstado('');
          }}>
            Cancelar
          </Button>
          <Button 
            onClick={handleCambiarEstado} 
            variant="contained"
            disabled={!nuevoEstado}
            sx={{
              bgcolor: nuevoEstado === 'aprobado' ? '#28a745' : 'primary.main',
              '&:hover': {
                bgcolor: nuevoEstado === 'aprobado' ? '#218838' : 'primary.dark'
              }
            }}
          >
            {nuevoEstado === 'aprobado' ? '✅ Aprobar Pedido' : 'Cambiar Estado'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Indicador de sincronización */}
      {sincronizando && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
        >
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography>Sincronizando proyecto...</Typography>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default ProyectoDetail;

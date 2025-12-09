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
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
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
  AttachMoney as MoneyIcon,
  ExpandMore as ExpandMoreIcon,
  Download as DownloadIcon,
  Home as HomeIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  Engineering as EngineeringIcon,
  Inventory as InventoryIcon,
  Description as DescriptionIcon,
  CameraAlt as CameraIcon,
  Print as PrintIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axiosConfig from '../../config/axios';
import VisorPDF from '../Common/VisorPDF';

// Estados de fabricación según flujo operativo
const ESTADOS_FABRICACION = {
  'recepcion_material': { color: 'info', label: 'Recepción Material', icon: <InventoryIcon />, orden: 1 },
  'pendiente': { color: 'default', label: 'Pendiente', icon: <PendingIcon />, orden: 2 },
  'en_proceso': { color: 'warning', label: 'En Proceso', icon: <BuildIcon />, orden: 3 },
  'situacion_critica': { color: 'error', label: 'Situación Crítica', icon: <WarningIcon />, orden: 4 },
  'terminado': { color: 'success', label: 'Terminado', icon: <CheckCircleIcon />, orden: 5 }
};

// Orden de estados para el flujo
const FLUJO_ESTADOS = ['recepcion_material', 'pendiente', 'en_proceso', 'terminado'];
const ESTADO_CRITICO = 'situacion_critica';

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

  // Función para abrir visor de Orden de Taller - Usando POST con base64 (evita IDM)
  const abrirVisorOrdenTaller = async (proyecto) => {
    try {
      setVisorPDF({ open: true, url: null, proyecto, loading: true });
      
      // Usar POST que devuelve JSON con base64 - IDM NO intercepta esto
      const response = await axiosConfig.post(
        `/fabricacion/orden-taller/${proyecto._id}/base64`
      );

      if (response.data.success && response.data.pdf) {
        // Convertir base64 a blob URL
        const byteCharacters = atob(response.data.pdf);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const pdfBlob = new Blob([byteArray], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(pdfBlob);
        
        console.log('PDF cargado:', { size: pdfBlob.size, type: pdfBlob.type, url });
        setVisorPDF({ open: true, url, proyecto, loading: false });
      } else {
        throw new Error(response.data.message || 'Error generando PDF');
      }
      
    } catch (error) {
      console.error('Error cargando orden:', error);
      
      // Mensaje amigable si no hay levantamiento
      const mensaje = error.response?.data?.message || error.message;
      if (mensaje.includes('piezas') || mensaje.includes('levantamiento')) {
        setError(`⚠️ Este proyecto no tiene levantamiento registrado. Primero debe completarse el levantamiento para generar la orden de taller.`);
      } else {
        setError(`Error al cargar la orden: ${mensaje}`);
      }
      setVisorPDF({ open: false, url: null, proyecto: null, loading: false });
    }
  };
  
  // Cerrar visor de PDF
  const cerrarVisorPDF = () => {
    if (visorPDF.url) {
      window.URL.revokeObjectURL(visorPDF.url);
    }
    setVisorPDF({ open: false, url: null, proyecto: null, loading: false });
  };
  
  // Imprimir PDF desde el visor
  const imprimirPDF = () => {
    if (visorPDF.url) {
      // Abrir en nueva ventana para imprimir
      const printWindow = window.open(visorPDF.url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    }
  };
  
  // Descargar PDF desde el visor
  const descargarPDFDesdeVisor = () => {
    if (visorPDF.url && visorPDF.proyecto) {
      const link = document.createElement('a');
      link.href = visorPDF.url;
      link.setAttribute('download', `Orden-Taller-${visorPDF.proyecto.numero}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  };

  // Estado para controlar acordeón expandido
  const [expandedProyecto, setExpandedProyecto] = useState(null);
  
  // Estado para modal de levantamiento
  const [modalLevantamiento, setModalLevantamiento] = useState({
    open: false,
    proyecto: null
  });

  const handleAccordionChange = (proyectoId) => (event, isExpanded) => {
    setExpandedProyecto(isExpanded ? proyectoId : null);
  };
  
  // Abrir modal de levantamiento
  const abrirModalLevantamiento = (proyecto) => {
    setModalLevantamiento({ open: true, proyecto });
  };
  
  const cerrarModalLevantamiento = () => {
    setModalLevantamiento({ open: false, proyecto: null });
  };
  
  // Estado para modal de materiales
  const [modalMateriales, setModalMateriales] = useState({
    open: false,
    proyecto: null,
    materiales: [],
    loading: false
  });
  
  // Estado para mensajes de éxito
  const [success, setSuccess] = useState(null);
  
  // Estado para visor de PDF
  const [visorPDF, setVisorPDF] = useState({
    open: false,
    url: null,
    proyecto: null,
    loading: false
  });
  
  // Estado para subir foto de empaque
  const [subiendoFoto, setSubiendoFoto] = useState(null); // ID del proyecto que está subiendo

  // Función para subir foto de empaque y marcar como terminado
  const subirFotoEmpaque = async (proyectoId, archivo) => {
    if (!archivo) return;
    
    try {
      setSubiendoFoto(proyectoId);
      
      // Crear FormData para subir la imagen
      const formData = new FormData();
      formData.append('foto', archivo);
      formData.append('etapa', 'empaque');
      formData.append('descripcion', 'Foto de empaque - Producto terminado');
      
      // Subir foto
      await axiosConfig.post(`/fabricacion/etapas/${proyectoId}/empaque/fotos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Cambiar estado a terminado automáticamente
      await cambiarEstadoFabricacion(proyectoId, 'terminado');
      
      setSuccess('📷 Foto de empaque subida. Proyecto marcado como TERMINADO ✅');
      cargarDatos();
      
    } catch (error) {
      console.error('Error subiendo foto de empaque:', error);
      setError('Error al subir la foto de empaque');
    } finally {
      setSubiendoFoto(null);
    }
  };

  // Función para cambiar estado de fabricación
  const cambiarEstadoFabricacion = async (proyectoId, nuevoEstado) => {
    try {
      const response = await axiosConfig.patch(`/proyectos/${proyectoId}/fabricacion/estado`, {
        estado: nuevoEstado
      });
      
      if (response.data.success) {
        setSuccess(`Estado actualizado a: ${ESTADOS_FABRICACION[nuevoEstado]?.label}`);
        cargarDatos(); // Recargar datos
        
        // Limpiar mensaje después de 3 segundos
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (error) {
      console.error('Error cambiando estado:', error);
      setError('Error al cambiar el estado de fabricación');
    }
  };
  
  // Función para abrir modal de materiales (Sacar del almacén)
  const abrirModalMateriales = async (proyecto) => {
    setModalMateriales({ open: true, proyecto, materiales: [], loading: true });
    
    try {
      // Obtener materiales calculados para el proyecto
      const response = await axiosConfig.get(`/proyectos/${proyecto._id}/materiales-calculados`);
      
      setModalMateriales(prev => ({
        ...prev,
        materiales: response.data.materiales || [],
        loading: false
      }));
    } catch (error) {
      console.error('Error obteniendo materiales:', error);
      // Si no hay endpoint, mostrar mensaje
      setModalMateriales(prev => ({
        ...prev,
        materiales: [],
        loading: false
      }));
    }
  };
  
  const cerrarModalMateriales = () => {
    setModalMateriales({ open: false, proyecto: null, materiales: [], loading: false });
  };
  
  // Función para confirmar salida de materiales del almacén
  const confirmarSalidaMateriales = async () => {
    if (!modalMateriales.proyecto) return;
    
    try {
      const response = await axiosConfig.post(`/proyectos/${modalMateriales.proyecto._id}/salida-materiales`, {
        materiales: modalMateriales.materiales,
        fecha: new Date(),
        tipo: 'salida_fabricacion'
      });
      
      if (response.data.success) {
        // Cambiar estado a "recepcion_material"
        await cambiarEstadoFabricacion(modalMateriales.proyecto._id, 'recepcion_material');
        
        setSuccess('✅ Materiales descontados del almacén. Vale de salida generado.');
        cerrarModalMateriales();
        cargarDatos();
      }
    } catch (error) {
      console.error('Error en salida de materiales:', error);
      setError('Error al procesar la salida de materiales');
    }
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

        {/* Lista de proyectos como acordeones */}
        <Box sx={{ mt: 2 }}>
          {colaFabricacion.map((proyecto) => {
            const diasRetraso = calcularDiasRetraso(proyecto.cronograma?.fechaFinFabricacionEstimada);
            const estadoFab = ESTADOS_FABRICACION[proyecto.fabricacion?.estado] || ESTADOS_FABRICACION['pendiente'];
            const prioridadFab = PRIORIDADES[proyecto.fabricacion?.prioridad] || PRIORIDADES['media'];
            
            return (
              <Accordion 
                key={proyecto._id}
                expanded={expandedProyecto === proyecto._id}
                onChange={handleAccordionChange(proyecto._id)}
                sx={{ 
                  mb: 1.5,
                  borderRadius: 2,
                  '&:before': { display: 'none' },
                  boxShadow: expandedProyecto === proyecto._id ? 3 : 1
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{ 
                    bgcolor: expandedProyecto === proyecto._id ? 'primary.50' : 'background.paper',
                    borderRadius: expandedProyecto === proyecto._id ? '8px 8px 0 0' : 2
                  }}
                >
                  <Grid container alignItems="center" spacing={2}>
                    {/* Proyecto */}
                    <Grid item xs={12} sm={2}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {proyecto.numero}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {proyecto.levantamiento?.partidas?.length || proyecto.productos?.length || 0} productos
                      </Typography>
                    </Grid>
                    
                    {/* Cliente */}
                    <Grid item xs={12} sm={2.5}>
                      <Typography variant="body2" fontWeight="medium">
                        {proyecto.cliente?.nombre}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {proyecto.cliente?.telefono}
                      </Typography>
                    </Grid>
                    
                    {/* Estado */}
                    <Grid item xs={6} sm={1.5}>
                      <Chip
                        icon={estadoFab.icon}
                        label={estadoFab.label}
                        color={estadoFab.color}
                        size="small"
                      />
                    </Grid>
                    
                    {/* Prioridad */}
                    <Grid item xs={6} sm={1}>
                      <Chip
                        label={prioridadFab.label}
                        color={prioridadFab.color}
                        size="small"
                      />
                    </Grid>
                    
                    {/* Progreso */}
                    <Grid item xs={6} sm={1.5}>
                      <Box sx={{ width: '100%' }}>
                        <LinearProgress
                          variant="determinate"
                          value={proyecto.fabricacion?.progreso || 0}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 0.5 }}>
                          {proyecto.fabricacion?.progreso || 0}%
                        </Typography>
                      </Box>
                    </Grid>
                    
                    {/* Fecha */}
                    <Grid item xs={6} sm={2}>
                      <Typography variant="body2">
                        {formatearFecha(proyecto.cronograma?.fechaFinFabricacionEstimada)}
                      </Typography>
                      {diasRetraso > 0 && (
                        <Chip
                          label={`${diasRetraso}d retraso`}
                          color="error"
                          size="small"
                        />
                      )}
                    </Grid>
                    
                  </Grid>
                </AccordionSummary>
                
                <AccordionDetails sx={{ bgcolor: 'grey.50', pt: 2 }}>
                  <Grid container spacing={3}>
                    {/* Columna 1: Acciones de Fabricación */}
                    <Grid item xs={12} md={4}>
                      <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <DescriptionIcon color="primary" />
                            Documentos y Acciones
                          </Typography>
                          <Divider sx={{ mb: 2 }} />
                          
                          {/* Botón principal: Descargar Orden */}
                          <Button
                            variant="contained"
                            fullWidth
                            startIcon={<DescriptionIcon />}
                            onClick={() => abrirVisorOrdenTaller(proyecto)}
                            sx={{ 
                              mb: 1.5,
                              bgcolor: '#D4AF37',
                              '&:hover': { bgcolor: '#B8941F' }
                            }}
                          >
                            🛠️ Ver Orden de Taller
                          </Button>
                          
                          {/* Botón: Ver Levantamiento (abre modal) */}
                          <Button
                            variant="outlined"
                            fullWidth
                            color="secondary"
                            startIcon={<InventoryIcon />}
                            onClick={() => abrirModalLevantamiento(proyecto)}
                            sx={{ mb: 1.5 }}
                          >
                            📷 Ver Levantamiento y Fotos
                          </Button>
                          
                          {/* Botón: Sacar Materiales del Almacén */}
                          <Button
                            variant="outlined"
                            fullWidth
                            color="warning"
                            startIcon={<InventoryIcon />}
                            onClick={() => abrirModalMateriales(proyecto)}
                            sx={{ mb: 1.5 }}
                          >
                            📦 Sacar Material de Almacén
                          </Button>
                          
                          {/* Info rápida de productos */}
                          <Box sx={{ p: 1.5, bgcolor: 'grey.100', borderRadius: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              Productos en este proyecto:
                            </Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {proyecto.levantamiento?.partidas?.length || 0} partidas
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    {/* Columna 2: Control de Estado */}
                    <Grid item xs={12} md={4}>
                      <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <BuildIcon color="warning" />
                            Estado de Fabricación
                          </Typography>
                          <Divider sx={{ mb: 2 }} />
                          
                          {/* Estado actual */}
                          <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2, textAlign: 'center' }}>
                            <Typography variant="caption" color="text.secondary">
                              Estado Actual
                            </Typography>
                            <Box sx={{ mt: 1 }}>
                              <Chip
                                icon={ESTADOS_FABRICACION[proyecto.fabricacion?.estado]?.icon || <PendingIcon />}
                                label={ESTADOS_FABRICACION[proyecto.fabricacion?.estado]?.label || 'Pendiente'}
                                color={ESTADOS_FABRICACION[proyecto.fabricacion?.estado]?.color || 'default'}
                                sx={{ fontSize: '1rem', py: 2.5, px: 1 }}
                              />
                            </Box>
                          </Box>
                          
                          {/* Botones de cambio de estado */}
                          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                            Cambiar Estado:
                          </Typography>
                          
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {/* Recepción Material */}
                            <Button
                              variant={proyecto.fabricacion?.estado === 'recepcion_material' ? 'contained' : 'outlined'}
                              size="small"
                              color="info"
                              onClick={() => cambiarEstadoFabricacion(proyecto._id, 'recepcion_material')}
                              startIcon={<InventoryIcon />}
                            >
                              Recepción Material
                            </Button>
                            
                            {/* Pendiente */}
                            <Button
                              variant={proyecto.fabricacion?.estado === 'pendiente' || !proyecto.fabricacion?.estado ? 'contained' : 'outlined'}
                              size="small"
                              onClick={() => cambiarEstadoFabricacion(proyecto._id, 'pendiente')}
                              startIcon={<PendingIcon />}
                              sx={{ 
                                bgcolor: proyecto.fabricacion?.estado === 'pendiente' || !proyecto.fabricacion?.estado ? 'grey.500' : 'transparent',
                                color: proyecto.fabricacion?.estado === 'pendiente' || !proyecto.fabricacion?.estado ? 'white' : 'grey.700',
                                borderColor: 'grey.400',
                                '&:hover': {
                                  bgcolor: proyecto.fabricacion?.estado === 'pendiente' || !proyecto.fabricacion?.estado ? 'grey.600' : 'grey.100'
                                }
                              }}
                            >
                              Pendiente
                            </Button>
                            
                            {/* En Proceso */}
                            <Button
                              variant={proyecto.fabricacion?.estado === 'en_proceso' ? 'contained' : 'outlined'}
                              size="small"
                              color="warning"
                              onClick={() => cambiarEstadoFabricacion(proyecto._id, 'en_proceso')}
                              startIcon={<BuildIcon />}
                            >
                              En Proceso
                            </Button>
                            
                            {/* Situación Crítica */}
                            <Button
                              variant={proyecto.fabricacion?.estado === 'situacion_critica' ? 'contained' : 'outlined'}
                              size="small"
                              color="error"
                              onClick={() => cambiarEstadoFabricacion(proyecto._id, 'situacion_critica')}
                              startIcon={<WarningIcon />}
                            >
                              ⚠️ Situación Crítica
                            </Button>
                            
                            {/* Foto de Empaque - Botón grande y visible */}
                            <Button
                              component="label"
                              variant="contained"
                              size="small"
                              disabled={subiendoFoto === proyecto._id}
                              startIcon={subiendoFoto === proyecto._id ? <CircularProgress size={16} /> : <CameraIcon />}
                              sx={{ 
                                bgcolor: '#8B5CF6', 
                                '&:hover': { bgcolor: '#7C3AED' },
                                fontWeight: 'bold'
                              }}
                            >
                              {subiendoFoto === proyecto._id ? 'Subiendo...' : '📷 Foto Empaque'}
                              <input
                                type="file"
                                hidden
                                accept="image/*"
                                capture="environment"
                                onChange={(e) => {
                                  if (e.target.files?.[0]) {
                                    subirFotoEmpaque(proyecto._id, e.target.files[0]);
                                  }
                                }}
                              />
                            </Button>
                            
                            {/* Terminado */}
                            <Button
                              variant={proyecto.fabricacion?.estado === 'terminado' ? 'contained' : 'outlined'}
                              size="small"
                              color="success"
                              onClick={() => cambiarEstadoFabricacion(proyecto._id, 'terminado')}
                              startIcon={<CheckCircleIcon />}
                            >
                              ✅ Terminado
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    {/* Columna 2: Información de Instalación */}
                    <Grid item xs={12} md={4}>
                      <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <EngineeringIcon color="success" />
                            Instalación
                          </Typography>
                          <Divider sx={{ mb: 2 }} />
                          
                          <List dense disablePadding>
                            <ListItem disableGutters>
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                <CalendarIcon fontSize="small" color="action" />
                              </ListItemIcon>
                              <ListItemText 
                                primary="Fecha Programada"
                                secondary={formatearFecha(proyecto.instalacion?.programacion?.fechaProgramada) || 'Por programar'}
                              />
                            </ListItem>
                            
                            <ListItem disableGutters>
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                <ScheduleIcon fontSize="small" color="action" />
                              </ListItemIcon>
                              <ListItemText 
                                primary="Horario"
                                secondary={proyecto.instalacion?.programacion?.horaInicio 
                                  ? `${proyecto.instalacion.programacion.horaInicio} - ${proyecto.instalacion.programacion.horaFinEstimada || 'N/A'}`
                                  : 'Por definir'
                                }
                              />
                            </ListItem>
                            
                            <ListItem disableGutters>
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                <PersonIcon fontSize="small" color="action" />
                              </ListItemIcon>
                              <ListItemText 
                                primary="Cuadrilla"
                                secondary={proyecto.instalacion?.programacion?.cuadrilla?.length > 0
                                  ? proyecto.instalacion.programacion.cuadrilla.map(t => t.nombre).join(', ')
                                  : 'Sin asignar'
                                }
                              />
                            </ListItem>
                            
                            <ListItem disableGutters>
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                <TimelineIcon fontSize="small" color="action" />
                              </ListItemIcon>
                              <ListItemText 
                                primary="Tiempo Estimado"
                                secondary={proyecto.instalacion?.programacion?.tiempoEstimado 
                                  ? `${Math.round(proyecto.instalacion.programacion.tiempoEstimado / 60)} horas`
                                  : 'Por calcular'
                                }
                              />
                            </ListItem>
                          </List>
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    {/* Columna 3: Dirección y Contacto */}
                    <Grid item xs={12} md={4}>
                      <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LocationIcon color="error" />
                            Ubicación
                          </Typography>
                          <Divider sx={{ mb: 2 }} />
                          
                          <List dense disablePadding>
                            <ListItem disableGutters>
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                <HomeIcon fontSize="small" color="action" />
                              </ListItemIcon>
                              <ListItemText 
                                primary="Dirección"
                                secondary={
                                  typeof proyecto.cliente?.direccion === 'object'
                                    ? [
                                        proyecto.cliente.direccion.calle,
                                        proyecto.cliente.direccion.colonia,
                                        proyecto.cliente.direccion.ciudad,
                                        proyecto.cliente.direccion.codigoPostal
                                      ].filter(Boolean).join(', ') || 'No especificada'
                                    : proyecto.cliente?.direccion || 'No especificada'
                                }
                                secondaryTypographyProps={{ 
                                  sx: { 
                                    whiteSpace: 'normal',
                                    wordBreak: 'break-word'
                                  }
                                }}
                              />
                            </ListItem>
                            
                            <ListItem disableGutters>
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                <PhoneIcon fontSize="small" color="action" />
                              </ListItemIcon>
                              <ListItemText 
                                primary="Teléfono"
                                secondary={proyecto.cliente?.telefono || 'No especificado'}
                              />
                            </ListItem>
                            
                            {proyecto.instalacion?.observaciones && (
                              <ListItem disableGutters>
                                <ListItemIcon sx={{ minWidth: 36 }}>
                                  <WarningIcon fontSize="small" color="warning" />
                                </ListItemIcon>
                                <ListItemText 
                                  primary="Observaciones"
                                  secondary={proyecto.instalacion.observaciones}
                                  secondaryTypographyProps={{ 
                                    sx: { 
                                      whiteSpace: 'normal',
                                      color: 'warning.main'
                                    }
                                  }}
                                />
                              </ListItem>
                            )}
                          </List>
                          
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Box>

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
      
      {/* Modal de Levantamiento - Vista Operativa */}
      <Dialog
        open={modalLevantamiento.open}
        onClose={cerrarModalLevantamiento}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, maxHeight: '90vh' }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: '#1E40AF', 
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <InventoryIcon />
            <Box>
              <Typography variant="h6">
                Levantamiento - {modalLevantamiento.proyecto?.numero}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {modalLevantamiento.proyecto?.cliente?.nombre}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={cerrarModalLevantamiento} sx={{ color: 'white' }}>
            <StopIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 0 }}>
          {modalLevantamiento.proyecto && (
            <Box>
              {/* Resumen del proyecto */}
              <Box sx={{ p: 3, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="caption" color="text.secondary">Cliente</Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {modalLevantamiento.proyecto.cliente?.nombre}
                    </Typography>
                    <Typography variant="body2">
                      {modalLevantamiento.proyecto.cliente?.telefono}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="caption" color="text.secondary">Dirección</Typography>
                    <Typography variant="body2">
                      {typeof modalLevantamiento.proyecto.cliente?.direccion === 'object'
                        ? [
                            modalLevantamiento.proyecto.cliente.direccion.calle,
                            modalLevantamiento.proyecto.cliente.direccion.colonia,
                            modalLevantamiento.proyecto.cliente.direccion.ciudad
                          ].filter(Boolean).join(', ')
                        : modalLevantamiento.proyecto.cliente?.direccion || 'No especificada'
                      }
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="caption" color="text.secondary">Total Partidas</Typography>
                    <Typography variant="h5" color="primary" fontWeight="bold">
                      {modalLevantamiento.proyecto.levantamiento?.partidas?.length || 0}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
              
              {/* Lista de partidas con especificaciones */}
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AssignmentIcon color="primary" />
                  Especificaciones por Partida
                </Typography>
                
                {modalLevantamiento.proyecto.levantamiento?.partidas?.length > 0 ? (
                  modalLevantamiento.proyecto.levantamiento.partidas.map((partida, index) => {
                    // Las medidas pueden estar en partida.piezas o partida.medidas
                    const piezas = partida.piezas || partida.medidas || [];
                    // Tomar especificaciones de la primera pieza si existen
                    const primeraPieza = piezas[0] || {};
                    
                    return (
                    <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <Grid container spacing={2}>
                          {/* Info principal */}
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle1" fontWeight="bold" color="primary">
                              #{index + 1} - {partida.ubicacion || 'Sin ubicación'}
                            </Typography>
                            <Chip 
                              label={partida.producto || 'Sin producto'} 
                              size="small" 
                              color="secondary"
                              sx={{ mt: 0.5 }}
                            />
                            
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                📏 Medidas ({piezas.length} {piezas.length === 1 ? 'pieza' : 'piezas'})
                              </Typography>
                              {piezas.map((pieza, mIdx) => (
                                <Typography key={mIdx} variant="body2" sx={{ ml: 1 }}>
                                  Pieza {mIdx + 1}: <strong>{pieza.ancho}m × {pieza.alto}m</strong>
                                  {(pieza.area || pieza.m2) && ` = ${(pieza.area || pieza.m2).toFixed(2)}m²`}
                                </Typography>
                              ))}
                              {piezas.length > 0 && (
                                <Typography variant="body2" sx={{ mt: 1, fontWeight: 600, color: 'primary.main' }}>
                                  Área Total: {piezas.reduce((sum, p) => sum + (p.area || p.m2 || 0), 0).toFixed(2)} m²
                                </Typography>
                              )}
                            </Box>
                          </Grid>
                          
                          {/* Especificaciones técnicas - de la partida o primera pieza */}
                          <Grid item xs={12} md={6}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                              🔧 Especificaciones Técnicas
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                              {(partida.color || primeraPieza.color) && (
                                <Chip label={`Color: ${partida.color || primeraPieza.color}`} size="small" variant="outlined" />
                              )}
                              {(primeraPieza.sistema || partida.sistema) && (
                                <Chip label={`Sistema: ${primeraPieza.sistema || partida.sistema}`} size="small" variant="outlined" />
                              )}
                              {(primeraPieza.tipoControl || primeraPieza.control || partida.tipoControl) && (
                                <Chip label={`Control: ${primeraPieza.tipoControl || primeraPieza.control || partida.tipoControl}`} size="small" variant="outlined" />
                              )}
                              {(primeraPieza.galeria || partida.galeria) && (
                                <Chip label={`Galería: ${primeraPieza.galeria || partida.galeria}`} size="small" variant="outlined" />
                              )}
                              {(primeraPieza.tipoInstalacion || primeraPieza.instalacion || partida.tipoInstalacion) && (
                                <Chip label={`Instalación: ${primeraPieza.tipoInstalacion || primeraPieza.instalacion || partida.tipoInstalacion}`} size="small" variant="outlined" />
                              )}
                              {(primeraPieza.tipoFijacion || primeraPieza.fijacion || partida.tipoFijacion) && (
                                <Chip label={`Fijación: ${primeraPieza.tipoFijacion || primeraPieza.fijacion || partida.tipoFijacion}`} size="small" variant="outlined" />
                              )}
                              {(primeraPieza.caida || partida.caida) && (
                                <Chip label={`Caída: ${primeraPieza.caida || partida.caida}`} size="small" variant="outlined" />
                              )}
                              {(primeraPieza.telaMarca || partida.telaMarca) && (
                                <Chip label={`Tela: ${primeraPieza.telaMarca || partida.telaMarca}`} size="small" variant="outlined" />
                              )}
                              {(primeraPieza.baseTabla || partida.baseTabla) && (
                                <Chip label={`Base: ${primeraPieza.baseTabla || partida.baseTabla}"`} size="small" variant="outlined" />
                              )}
                              {(primeraPieza.modoOperacion === 'motorizado' || primeraPieza.operacion === 'motorizado' || partida.motorizado) && (
                                <Chip label="⚡ Motorizado" size="small" color="warning" />
                              )}
                            </Box>
                            
                            {(partida.observaciones || primeraPieza.observacionesTecnicas) && (
                              <Alert severity="info" sx={{ mt: 1 }} icon={<WarningIcon />}>
                                <Typography variant="body2">{partida.observaciones || primeraPieza.observacionesTecnicas}</Typography>
                              </Alert>
                            )}
                          </Grid>
                          
                          {/* Fotos si existen */}
                          {partida.fotos && partida.fotos.length > 0 && (
                            <Grid item xs={12}>
                              <Divider sx={{ my: 1 }} />
                              <Typography variant="caption" color="text.secondary">
                                📷 Fotos ({partida.fotos.length})
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                                {partida.fotos.map((foto, fIdx) => (
                                  <Box
                                    key={fIdx}
                                    component="img"
                                    src={foto.url || foto}
                                    alt={`Foto ${fIdx + 1}`}
                                    sx={{
                                      width: 120,
                                      height: 90,
                                      objectFit: 'cover',
                                      borderRadius: 1,
                                      cursor: 'pointer',
                                      '&:hover': { opacity: 0.8 }
                                    }}
                                    onClick={() => window.open(foto.url || foto, '_blank')}
                                  />
                                ))}
                              </Box>
                            </Grid>
                          )}
                        </Grid>
                      </CardContent>
                    </Card>
                  )})
                ) : (
                  <Alert severity="info">
                    No hay partidas registradas en el levantamiento
                  </Alert>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 2, bgcolor: 'grey.50' }}>
          <Button 
            variant="contained"
            startIcon={<DescriptionIcon />}
            onClick={() => {
              if (modalLevantamiento.proyecto) {
                cerrarModalLevantamiento();
                abrirVisorOrdenTaller(modalLevantamiento.proyecto);
              }
            }}
            sx={{ bgcolor: '#D4AF37', '&:hover': { bgcolor: '#B8941F' } }}
          >
            🛠️ Ver Orden de Taller
          </Button>
          <Button onClick={cerrarModalLevantamiento} variant="outlined">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Modal de Salida de Materiales */}
      <Dialog
        open={modalMateriales.open}
        onClose={cerrarModalMateriales}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: '#F59E0B', 
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <InventoryIcon />
            <Box>
              <Typography variant="h6">
                📦 Salida de Material - {modalMateriales.proyecto?.numero}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Vale de Salida de Almacén
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={cerrarModalMateriales} sx={{ color: 'white' }}>
            <StopIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3 }}>
          {modalMateriales.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              {/* Info del proyecto */}
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Cliente:</strong> {modalMateriales.proyecto?.cliente?.nombre}<br />
                  <strong>Proyecto:</strong> {modalMateriales.proyecto?.numero}
                </Typography>
              </Alert>
              
              {/* Lista de materiales */}
              <Typography variant="h6" gutterBottom>
                Materiales a Descontar del Almacén
              </Typography>
              
              {modalMateriales.materiales.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.100' }}>
                        <TableCell><strong>Tipo</strong></TableCell>
                        <TableCell><strong>Descripción</strong></TableCell>
                        <TableCell><strong>Ubicación</strong></TableCell>
                        <TableCell align="right"><strong>Cantidad</strong></TableCell>
                        <TableCell><strong>Unidad</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {modalMateriales.materiales.map((material, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Chip 
                              label={material.tipo} 
                              size="small"
                              color={
                                material.tipo === 'tela' ? 'primary' :
                                material.tipo === 'motor' ? 'warning' : 'default'
                              }
                            />
                          </TableCell>
                          <TableCell>{material.descripcion}</TableCell>
                          <TableCell>{material.ubicacion}</TableCell>
                          <TableCell align="right">
                            <strong>{material.cantidad?.toFixed(2)}</strong>
                          </TableCell>
                          <TableCell>{material.unidad}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="warning">
                  No se encontraron materiales calculados para este proyecto.
                  Verifica que el levantamiento tenga partidas registradas.
                </Alert>
              )}
              
              {/* Resumen */}
              {modalMateriales.materiales.length > 0 && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Total de items:</strong> {modalMateriales.materiales.length}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 2, bgcolor: 'grey.50' }}>
          <Button onClick={cerrarModalMateriales} variant="outlined">
            Cancelar
          </Button>
          <Button 
            variant="contained"
            color="warning"
            startIcon={<CheckCircleIcon />}
            onClick={confirmarSalidaMateriales}
            disabled={modalMateriales.materiales.length === 0 || modalMateriales.loading}
          >
            ✅ Confirmar Salida de Material
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar de éxito */}
      {success && (
        <Alert 
          severity="success" 
          sx={{ 
            position: 'fixed', 
            bottom: 24, 
            right: 24, 
            zIndex: 9999,
            boxShadow: 3
          }}
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}
      
      {/* Modal Visor de PDF - Orden de Taller */}
      <Dialog
        open={visorPDF.open}
        onClose={cerrarVisorPDF}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { 
            height: '90vh',
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: '#D4AF37', 
          color: '#000',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          py: 1.5
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <DescriptionIcon />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                🛠️ Orden de Taller - {visorPDF.proyecto?.numero}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                {visorPDF.proyecto?.cliente?.nombre}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<PrintIcon />}
              onClick={imprimirPDF}
              disabled={visorPDF.loading || !visorPDF.url}
              sx={{ bgcolor: '#1E40AF', '&:hover': { bgcolor: '#1E3A8A' } }}
            >
              Imprimir
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={descargarPDFDesdeVisor}
              disabled={visorPDF.loading || !visorPDF.url}
              sx={{ borderColor: '#000', color: '#000', '&:hover': { bgcolor: 'rgba(0,0,0,0.1)' } }}
            >
              Descargar
            </Button>
            <IconButton onClick={cerrarVisorPDF} sx={{ color: '#000' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 0, bgcolor: '#525659', height: 'calc(90vh - 80px)' }}>
          {visorPDF.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress sx={{ color: '#D4AF37' }} />
              <Typography sx={{ ml: 2, color: '#fff' }}>Cargando orden de taller...</Typography>
            </Box>
          ) : visorPDF.url ? (
            <VisorPDF url={visorPDF.url} />
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Typography sx={{ color: '#fff' }}>No se pudo cargar el PDF</Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default DashboardFabricacion;

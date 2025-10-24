import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Alert, 
  Button,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Avatar,
  Badge,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  CheckCircle as CompleteIcon,
  Cancel as CancelIcon,
  Schedule as TimeIcon,
  People as PeopleIcon,
  Build as ToolsIcon,
  Camera as CameraIcon,
  Assignment as ChecklistIcon,
  Star as StarIcon,
  Warning as WarningIcon,
  Phone as PhoneIcon,
  WhatsApp as WhatsAppIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import instalacionesApi from './services/instalacionesApi';

const InstalacionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Estados principales
  const [instalacion, setInstalacion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabActual, setTabActual] = useState(0);
  
  // Estados de modales y acciones
  const [modalEstado, setModalEstado] = useState(false);
  const [modalChecklist, setModalChecklist] = useState(false);
  const [modalFotos, setModalFotos] = useState(false);
  const [modalIncidencia, setModalIncidencia] = useState(false);
  
  // Estados de formularios
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [nuevaIncidencia, setNuevaIncidencia] = useState({
    tipo: '',
    descripcion: '',
    solucion: ''
  });

  // Cargar datos de la instalación
  useEffect(() => {
    if (id) {
      cargarInstalacion();
    }
  }, [id]);

  const cargarInstalacion = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // const response = await instalacionesApi.obtenerInstalacionPorId(id);
      // setInstalacion(response.instalacion || response);
      
      // Mock data para desarrollo
      const instalacionMock = {
        _id: id,
        numero: 'INS-2024-10-0001',
        proyectoId: 'PROY-2024-001',
        cliente: {
          nombre: 'Juan Pérez',
          telefono: '+52 998 123 4567',
          direccion: 'Av. Principal 123, Cancún'
        },
        fechaProgramada: new Date('2024-10-25T09:00:00'),
        fechaRealizada: null,
        estado: 'en_proceso',
        tipoInstalacion: 'electrica',
        prioridad: 'alta',
        tiempoEstimado: 6,
        instaladores: [
          { 
            usuario: { _id: '1', nombre: 'Roberto Martínez', apellido: 'García' },
            rol: 'responsable',
            presente: true
          },
          { 
            usuario: { _id: '2', nombre: 'Miguel Sánchez', apellido: 'López' },
            rol: 'instalador',
            presente: true
          }
        ],
        productos: [
          {
            nombre: 'Persiana Motorizada Premium',
            ubicacion: 'Sala Principal',
            medidas: { ancho: 2.5, alto: 1.8 },
            estado: 'instalado'
          },
          {
            nombre: 'Toldo Retráctil',
            ubicacion: 'Terraza',
            medidas: { ancho: 4.0, alto: 3.0 },
            estado: 'en_proceso'
          }
        ],
        herramientasEspeciales: ['Kit de motorización', 'Taladro percutor', 'Nivel láser'],
        materialesAdicionales: 'Tornillos especiales para concreto',
        observaciones: 'Cliente solicita instalación temprana por evento familiar',
        checklist: [
          { id: 1, item: 'Verificar medidas en sitio', categoria: 'preparacion', completado: true, responsable: 'Roberto Martínez' },
          { id: 2, item: 'Revisar suministro eléctrico', categoria: 'preparacion', completado: true, responsable: 'Miguel Sánchez' },
          { id: 3, item: 'Instalar soportes principales', categoria: 'instalacion', completado: true, responsable: 'Roberto Martínez' },
          { id: 4, item: 'Conectar motorización', categoria: 'instalacion', completado: false, responsable: 'Miguel Sánchez' },
          { id: 5, item: 'Pruebas de funcionamiento', categoria: 'acabados', completado: false, responsable: 'Roberto Martínez' },
          { id: 6, item: 'Limpieza del área', categoria: 'limpieza', completado: false, responsable: 'Miguel Sánchez' }
        ],
        incidencias: [
          {
            fecha: new Date('2024-10-25T10:30:00'),
            tipo: 'problema_sitio',
            descripcion: 'Pared con tubería no detectada en planos',
            solucion: 'Reubicación de soporte 15cm a la derecha',
            responsable: 'Roberto Martínez'
          }
        ],
        tiempos: {
          inicioReal: new Date('2024-10-25T09:15:00'),
          finReal: null,
          tiempoReal: null,
          pausas: [
            {
              motivo: 'Espera de herramienta especializada',
              inicio: new Date('2024-10-25T11:00:00'),
              fin: new Date('2024-10-25T11:30:00'),
              duracion: 30
            }
          ]
        },
        progreso: 65,
        satisfaccionCliente: null,
        creadoPor: { nombre: 'Admin', apellido: 'Sistema' },
        fechaCreacion: new Date('2024-10-24T14:30:00')
      };
      
      setInstalacion(instalacionMock);
      
    } catch (error) {
      console.error('Error cargando instalación:', error);
      setError('Error al cargar los detalles de la instalación');
    } finally {
      setLoading(false);
    }
  };

  // Cambiar estado de la instalación
  const cambiarEstado = async (estado) => {
    try {
      // await instalacionesApi.actualizarEstado(id, estado, observaciones);
      
      setInstalacion(prev => ({
        ...prev,
        estado: estado,
        ...(estado === 'completada' && { fechaRealizada: new Date() })
      }));
      
      setModalEstado(false);
      setObservaciones('');
      
    } catch (error) {
      console.error('Error cambiando estado:', error);
    }
  };

  // Actualizar checklist
  const actualizarChecklist = async (itemId, completado) => {
    try {
      setInstalacion(prev => ({
        ...prev,
        checklist: prev.checklist.map(item =>
          item.id === itemId ? { ...item, completado } : item
        )
      }));
      
      // Recalcular progreso
      const totalItems = instalacion.checklist.length;
      const completados = instalacion.checklist.filter(item => 
        item.id === itemId ? completado : item.completado
      ).length;
      
      const nuevoProgreso = Math.round((completados / totalItems) * 100);
      
      setInstalacion(prev => ({
        ...prev,
        progreso: nuevoProgreso
      }));
      
    } catch (error) {
      console.error('Error actualizando checklist:', error);
    }
  };

  // Obtener color del estado
  const obtenerColorEstado = (estado) => {
    switch (estado) {
      case 'programada': return 'info';
      case 'en_proceso': return 'warning';
      case 'pausada': return 'secondary';
      case 'completada': return 'success';
      case 'cancelada': return 'error';
      default: return 'default';
    }
  };

  // Obtener color de prioridad
  const obtenerColorPrioridad = (prioridad) => {
    switch (prioridad) {
      case 'urgente': return 'error';
      case 'alta': return 'warning';
      case 'media': return 'info';
      case 'baja': return 'success';
      default: return 'default';
    }
  };

  // Formatear tiempo
  const formatearTiempo = (fecha) => {
    if (!fecha) return 'No definido';
    return new Date(fecha).toLocaleString('es-MX');
  };

  // Renderizar información general
  const renderInformacionGeneral = () => (
    <Grid container spacing={3}>
      {/* Información básica */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📋 Información General
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Número de Instalación
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {instalacion.numero}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Proyecto
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {instalacion.proyectoId}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Cliente
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {instalacion.cliente.nombre}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Teléfono
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body1">
                    {instalacion.cliente.telefono}
                  </Typography>
                  <IconButton size="small" color="success">
                    <WhatsAppIcon />
                  </IconButton>
                  <IconButton size="small" color="primary">
                    <PhoneIcon />
                  </IconButton>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Dirección
                </Typography>
                <Typography variant="body1">
                  {instalacion.cliente.direccion}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Estado y progreso */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📊 Estado y Progreso
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2">Estado:</Typography>
                <Chip 
                  label={instalacion.estado} 
                  color={obtenerColorEstado(instalacion.estado)}
                  size="small"
                />
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2">Prioridad:</Typography>
                <Chip 
                  label={instalacion.prioridad} 
                  color={obtenerColorPrioridad(instalacion.prioridad)}
                  size="small"
                />
              </Box>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                Progreso: {instalacion.progreso}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={instalacion.progreso} 
                color={instalacion.progreso >= 80 ? 'success' : instalacion.progreso >= 50 ? 'warning' : 'error'}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>

            <Button
              variant="contained"
              fullWidth
              startIcon={<EditIcon />}
              onClick={() => setModalEstado(true)}
              disabled={instalacion.estado === 'completada'}
            >
              Cambiar Estado
            </Button>
          </CardContent>
        </Card>
      </Grid>

      {/* Fechas y tiempos */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              ⏰ Programación y Tiempos
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Fecha Programada
                </Typography>
                <Typography variant="body1">
                  {formatearTiempo(instalacion.fechaProgramada)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Inicio Real
                </Typography>
                <Typography variant="body1">
                  {formatearTiempo(instalacion.tiempos.inicioReal)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Tiempo Estimado
                </Typography>
                <Typography variant="body1">
                  {instalacion.tiempoEstimado} horas
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Tipo de Instalación
                </Typography>
                <Typography variant="body1">
                  {instalacion.tipoInstalacion}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Renderizar cuadrilla
  const renderCuadrilla = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              👥 Cuadrilla de Instalación
            </Typography>
            <Grid container spacing={2}>
              {instalacion.instaladores.map((instalador, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Paper sx={{ p: 2, border: instalador.rol === 'responsable' ? '2px solid #2196F3' : '1px solid #e0e0e0' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Badge
                        badgeContent={instalador.presente ? '✓' : '✗'}
                        color={instalador.presente ? 'success' : 'error'}
                      >
                        <Avatar sx={{ bgcolor: instalador.rol === 'responsable' ? '#2196F3' : '#9E9E9E' }}>
                          {instalador.usuario.nombre.charAt(0)}
                        </Avatar>
                      </Badge>
                      <Box>
                        <Typography variant="body1" fontWeight="bold">
                          {instalador.usuario.nombre} {instalador.usuario.apellido}
                        </Typography>
                        <Chip 
                          label={instalador.rol} 
                          size="small" 
                          color={instalador.rol === 'responsable' ? 'primary' : 'default'}
                        />
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Herramientas y materiales */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              🛠️ Herramientas Especiales
            </Typography>
            <List dense>
              {instalacion.herramientasEspeciales.map((herramienta, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <ToolsIcon />
                  </ListItemIcon>
                  <ListItemText primary={herramienta} />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📦 Materiales Adicionales
            </Typography>
            <Typography variant="body1">
              {instalacion.materialesAdicionales || 'No se requieren materiales adicionales'}
            </Typography>
            
            {instalacion.observaciones && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  📝 Observaciones
                </Typography>
                <Typography variant="body1">
                  {instalacion.observaciones}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Renderizar checklist
  const renderChecklist = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            ✅ Checklist de Instalación
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {instalacion.checklist.filter(item => item.completado).length} / {instalacion.checklist.length} completados
          </Typography>
        </Box>

        <List>
          {instalacion.checklist.map((item, index) => (
            <ListItem key={item.id} divider>
              <ListItemIcon>
                <Checkbox
                  checked={item.completado}
                  onChange={(e) => actualizarChecklist(item.id, e.target.checked)}
                  color="primary"
                />
              </ListItemIcon>
              <ListItemText
                primary={item.item}
                secondary={`${item.categoria} • Responsable: ${item.responsable}`}
                sx={{ textDecoration: item.completado ? 'line-through' : 'none' }}
              />
              <ListItemSecondaryAction>
                <Chip 
                  label={item.categoria} 
                  size="small" 
                  variant="outlined"
                />
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );

  // Renderizar productos
  const renderProductos = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          📦 Productos a Instalar
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Producto</TableCell>
                <TableCell>Ubicación</TableCell>
                <TableCell>Medidas</TableCell>
                <TableCell>Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {instalacion.productos.map((producto, index) => (
                <TableRow key={index}>
                  <TableCell>{producto.nombre}</TableCell>
                  <TableCell>{producto.ubicacion}</TableCell>
                  <TableCell>
                    {producto.medidas.ancho}m × {producto.medidas.alto}m
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={producto.estado}
                      color={producto.estado === 'instalado' ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );

  // Renderizar incidencias
  const renderIncidencias = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            ⚠️ Incidencias y Problemas
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setModalIncidencia(true)}
            size="small"
          >
            Reportar Incidencia
          </Button>
        </Box>

        {instalacion.incidencias.length === 0 ? (
          <Alert severity="success">
            ✅ No se han reportado incidencias en esta instalación
          </Alert>
        ) : (
          <List>
            {instalacion.incidencias.map((incidencia, index) => (
              <ListItem key={index} divider>
                <ListItemIcon>
                  <WarningIcon color="warning" />
                </ListItemIcon>
                <ListItemText
                  primary={incidencia.descripcion}
                  secondary={
                    <Box>
                      <Typography variant="caption" display="block">
                        Tipo: {incidencia.tipo} • {formatearTiempo(incidencia.fecha)}
                      </Typography>
                      <Typography variant="caption" display="block">
                        Responsable: {incidencia.responsable}
                      </Typography>
                      {incidencia.solucion && (
                        <Typography variant="caption" display="block" color="success.main">
                          Solución: {incidencia.solucion}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Typography>Cargando detalles de instalación...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        {error}
        <Button onClick={cargarInstalacion} sx={{ ml: 2 }}>
          Reintentar
        </Button>
      </Alert>
    );
  }

  if (!instalacion) {
    return (
      <Alert severity="warning" sx={{ m: 3 }}>
        Instalación no encontrada
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/instalaciones')}>
            <BackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" component="h1">
              🔧 {instalacion.numero}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {instalacion.cliente.nombre} • {instalacion.estado}
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<PrintIcon />}>
            Imprimir
          </Button>
          <Button variant="outlined" startIcon={<ShareIcon />}>
            Compartir
          </Button>
          <Button 
            variant="contained" 
            startIcon={<EditIcon />}
            onClick={() => setModalEstado(true)}
            disabled={instalacion.estado === 'completada'}
          >
            Gestionar
          </Button>
        </Box>
      </Box>

      {/* Tabs de contenido */}
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={tabActual}
          onChange={(e, newValue) => setTabActual(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="📋 General" />
          <Tab label="👥 Cuadrilla" />
          <Tab label="✅ Checklist" />
          <Tab label="📦 Productos" />
          <Tab label="⚠️ Incidencias" />
        </Tabs>
      </Card>

      {/* Contenido de tabs */}
      <Box>
        {tabActual === 0 && renderInformacionGeneral()}
        {tabActual === 1 && renderCuadrilla()}
        {tabActual === 2 && renderChecklist()}
        {tabActual === 3 && renderProductos()}
        {tabActual === 4 && renderIncidencias()}
      </Box>

      {/* Modal cambiar estado */}
      <Dialog open={modalEstado} onClose={() => setModalEstado(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cambiar Estado de Instalación</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="body2" gutterBottom>
                Estado actual: <Chip label={instalacion.estado} size="small" />
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Nuevo Estado"
                value={nuevoEstado}
                onChange={(e) => setNuevoEstado(e.target.value)}
                SelectProps={{ native: true }}
              >
                <option value="">Seleccionar estado</option>
                <option value="programada">Programada</option>
                <option value="en_proceso">En Proceso</option>
                <option value="pausada">Pausada</option>
                <option value="completada">Completada</option>
                <option value="cancelada">Cancelada</option>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Observaciones"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Motivo del cambio de estado..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalEstado(false)}>Cancelar</Button>
          <Button 
            onClick={() => cambiarEstado(nuevoEstado)}
            variant="contained"
            disabled={!nuevoEstado}
          >
            Cambiar Estado
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InstalacionDetail;

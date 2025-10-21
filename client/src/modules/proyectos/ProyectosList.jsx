import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Alert,
  CircularProgress,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Sync as SyncIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import proyectosApi from './services/proyectosApi';

const ESTADOS_COLORES = {
  'levantamiento': { color: '#ffc107', label: 'Levantamiento' },
  'cotizacion': { color: '#17a2b8', label: 'Cotización' },
  'aprobado': { color: '#28a745', label: 'Aprobado' },
  'fabricacion': { color: '#fd7e14', label: 'Fabricación' },
  'instalacion': { color: '#6f42c1', label: 'Instalación' },
  'completado': { color: '#20c997', label: 'Completado' },
  'cancelado': { color: '#dc3545', label: 'Cancelado' }
};

const TIPOS_FUENTE = {
  'simple': 'Simple',
  'en_vivo': 'En Vivo',
  'formal': 'Formal',
  'directo': 'Directo'
};

const ProyectosList = () => {
  const navigate = useNavigate();
  
  // Estados principales
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalProyectos, setTotalProyectos] = useState(0);
  
  // Estados de paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Estados de filtros
  const [filtros, setFiltros] = useState({
    buscar: '',
    estado: '',
    tipo_fuente: '',
    fecha_desde: '',
    fecha_hasta: ''
  });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  
  // Estados de menú contextual
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState(null);
  
  // Estados de diálogos
  const [dialogoEliminar, setDialogoEliminar] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);

  // Cargar proyectos
  useEffect(() => {
    cargarProyectos();
  }, [page, rowsPerPage, filtros]);

  const cargarProyectos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const parametros = {
        page: page + 1,
        limit: rowsPerPage,
        ...filtros
      };
      
      const response = await proyectosApi.obtenerProyectos(parametros);
      
      if (response.success) {
        setProyectos(response.data);
        setTotalProyectos(response.pagination.total);
      } else {
        setError('Error cargando proyectos');
      }
    } catch (error) {
      console.error('Error cargando proyectos:', error);
      setError('Error de conexión al cargar proyectos');
    } finally {
      setLoading(false);
    }
  };

  // Handlers de eventos
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
    setPage(0);
  };

  const handleBuscar = () => {
    cargarProyectos();
  };

  const handleLimpiarFiltros = () => {
    setFiltros({
      buscar: '',
      estado: '',
      tipo_fuente: '',
      fecha_desde: '',
      fecha_hasta: ''
    });
    setPage(0);
  };

  // Handlers de menú contextual
  const handleMenuClick = (event, proyecto) => {
    setMenuAnchor(event.currentTarget);
    setProyectoSeleccionado(proyecto);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setProyectoSeleccionado(null);
  };

  // Acciones de proyecto
  const handleVerProyecto = (proyecto) => {
    navigate(`/proyectos/${proyecto._id}`);
    handleMenuClose();
  };

  const handleEditarProyecto = (proyecto) => {
    navigate(`/proyectos/${proyecto._id}/editar`);
    handleMenuClose();
  };

  const handleSincronizarProyecto = async (proyecto) => {
    try {
      setSincronizando(true);
      const response = await proyectosApi.sincronizarProyecto(proyecto._id);
      
      if (response.success) {
        await cargarProyectos();
        // Mostrar mensaje de éxito
      }
    } catch (error) {
      console.error('Error sincronizando proyecto:', error);
      setError('Error sincronizando proyecto');
    } finally {
      setSincronizando(false);
      handleMenuClose();
    }
  };

  const handleEliminarProyecto = async () => {
    try {
      const response = await proyectosApi.eliminarProyecto(proyectoSeleccionado._id);
      
      if (response.success) {
        await cargarProyectos();
        setDialogoEliminar(false);
        handleMenuClose();
      }
    } catch (error) {
      console.error('Error eliminando proyecto:', error);
      setError('Error eliminando proyecto');
    }
  };

  const handleGenerarPDF = async (proyecto) => {
    try {
      await proyectosApi.generarPDF(proyecto._id);
    } catch (error) {
      console.error('Error generando PDF:', error);
      setError('Error generando PDF');
    }
    handleMenuClose();
  };

  const handleGenerarExcel = async (proyecto) => {
    try {
      await proyectosApi.generarExcel(proyecto._id);
    } catch (error) {
      console.error('Error generando Excel:', error);
      setError('Error generando Excel');
    }
    handleMenuClose();
  };

  // Funciones auxiliares
  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calcularProgreso = (estado) => {
    const estados = ['levantamiento', 'cotizacion', 'aprobado', 'fabricacion', 'instalacion', 'completado'];
    const indice = estados.indexOf(estado);
    return indice >= 0 ? Math.round((indice / (estados.length - 1)) * 100) : 0;
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#D4AF37' }}>
          🏗️ Proyectos Unificados
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/proyectos/nuevo')}
          sx={{ 
            bgcolor: '#D4AF37',
            '&:hover': { bgcolor: '#B8941F' }
          }}
        >
          Nuevo Proyecto
        </Button>
      </Box>

      {/* Barra de búsqueda y filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Buscar proyectos..."
                value={filtros.buscar}
                onChange={(e) => handleFiltroChange('buscar', e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleBuscar()}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={filtros.estado}
                  onChange={(e) => handleFiltroChange('estado', e.target.value)}
                  label="Estado"
                >
                  <MenuItem value="">Todos</MenuItem>
                  {Object.entries(ESTADOS_COLORES).map(([key, value]) => (
                    <MenuItem key={key} value={key}>{value.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={filtros.tipo_fuente}
                  onChange={(e) => handleFiltroChange('tipo_fuente', e.target.value)}
                  label="Tipo"
                >
                  <MenuItem value="">Todos</MenuItem>
                  {Object.entries(TIPOS_FUENTE).map(([key, value]) => (
                    <MenuItem key={key} value={key}>{value}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
                fullWidth
              >
                Filtros
              </Button>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                variant="text"
                onClick={handleLimpiarFiltros}
                fullWidth
              >
                Limpiar
              </Button>
            </Grid>
          </Grid>

          {/* Filtros adicionales */}
          {mostrarFiltros && (
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Fecha desde"
                  value={filtros.fecha_desde}
                  onChange={(e) => handleFiltroChange('fecha_desde', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Fecha hasta"
                  value={filtros.fecha_hasta}
                  onChange={(e) => handleFiltroChange('fecha_hasta', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Mensaje de error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tabla de proyectos */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Cliente</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Progreso</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Área Total</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Fecha Creación</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : proyectos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No se encontraron proyectos
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                proyectos.map((proyecto) => (
                  <TableRow 
                    key={proyecto._id} 
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleVerProyecto(proyecto)}
                  >
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {proyecto.cliente.nombre}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {proyecto.cliente.telefono}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={ESTADOS_COLORES[proyecto.estado]?.label || proyecto.estado}
                        size="small"
                        sx={{
                          bgcolor: ESTADOS_COLORES[proyecto.estado]?.color || '#gray',
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ width: '100%' }}>
                        <LinearProgress
                          variant="determinate"
                          value={calcularProgreso(proyecto.estado)}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: 'grey.200',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: ESTADOS_COLORES[proyecto.estado]?.color || '#gray'
                            }
                          }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {calcularProgreso(proyecto.estado)}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={TIPOS_FUENTE[proyecto.tipo_fuente] || proyecto.tipo_fuente}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {proyecto.area_total ? `${proyecto.area_total} m²` : '-'}
                    </TableCell>
                    <TableCell>
                      {proyecto.total ? `$${proyecto.total.toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell>
                      {formatearFecha(proyecto.fecha_creacion)}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMenuClick(e, proyecto);
                        }}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Paginación */}
        <TablePagination
          component="div"
          count={totalProyectos}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
          }
        />
      </Card>

      {/* Menú contextual */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleVerProyecto(proyectoSeleccionado)}>
          <ViewIcon sx={{ mr: 1 }} />
          Ver Detalles
        </MenuItem>
        <MenuItem onClick={() => handleEditarProyecto(proyectoSeleccionado)}>
          <EditIcon sx={{ mr: 1 }} />
          Editar
        </MenuItem>
        <MenuItem onClick={() => handleSincronizarProyecto(proyectoSeleccionado)}>
          <SyncIcon sx={{ mr: 1 }} />
          Sincronizar
        </MenuItem>
        <MenuItem onClick={() => handleGenerarPDF(proyectoSeleccionado)}>
          <PdfIcon sx={{ mr: 1 }} />
          Generar PDF
        </MenuItem>
        <MenuItem onClick={() => handleGenerarExcel(proyectoSeleccionado)}>
          <ExcelIcon sx={{ mr: 1 }} />
          Generar Excel
        </MenuItem>
        <MenuItem 
          onClick={() => setDialogoEliminar(true)}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} />
          Eliminar
        </MenuItem>
      </Menu>

      {/* Diálogo de confirmación de eliminación */}
      <Dialog open={dialogoEliminar} onClose={() => setDialogoEliminar(false)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar el proyecto de {proyectoSeleccionado?.cliente.nombre}?
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogoEliminar(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleEliminarProyecto} 
            color="error" 
            variant="contained"
          >
            Eliminar
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

export default ProyectosList;

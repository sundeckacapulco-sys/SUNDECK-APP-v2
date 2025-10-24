import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Alert, 
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  MenuItem,
  Grid,
  CircularProgress
} from '@mui/material';
import { 
  Visibility as ViewIcon,
  Edit as EditIcon,
  CalendarToday as CalendarIcon,
  Add as AddIcon,
  Build as BuildIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import instalacionesApi from './services/instalacionesApi';

const InstalacionesList = () => {
  const navigate = useNavigate();
  const [instalaciones, setInstalaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtros, setFiltros] = useState({
    estado: '',
    buscar: ''
  });

  // Estados disponibles para instalaciones
  const estadosInstalacion = [
    { value: '', label: 'Todos los estados' },
    { value: 'programada', label: 'Programada' },
    { value: 'en_proceso', label: 'En Proceso' },
    { value: 'pausada', label: 'Pausada' },
    { value: 'completada', label: 'Completada' },
    { value: 'cancelada', label: 'Cancelada' }
  ];

  // Cargar instalaciones
  const cargarInstalaciones = async () => {
    try {
      setLoading(true);
      const response = await instalacionesApi.obtenerInstalaciones(filtros);
      setInstalaciones(response.instalaciones || response || []);
      setError(null);
    } catch (error) {
      console.error('Error cargando instalaciones:', error);
      setError('Error al cargar las instalaciones');
      setInstalaciones([]);
    } finally {
      setLoading(false);
    }
  };

  // Cargar instalaciones al montar el componente
  useEffect(() => {
    cargarInstalaciones();
  }, [filtros]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Formatear fecha
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

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Cargando instalaciones...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          🔧 Gestión de Instalaciones
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => navigate('/instalaciones/programar')}
            sx={{ bgcolor: '#1976d2' }}
          >
            Programar Instalación
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<CalendarIcon />}
            onClick={() => navigate('/instalaciones/calendario')}
          >
            Ver Calendario
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<BuildIcon />}
            onClick={() => navigate('/instalaciones/kpis')}
            sx={{ borderColor: '#FF9800', color: '#FF9800' }}
          >
            📊 KPIs
          </Button>
        </Box>
      </Box>
      
      <Alert severity="success" sx={{ mb: 3 }}>
        <strong>¡MÓDULO INDEPENDIENTE FUNCIONANDO!</strong><br />
        Este es el módulo específico de Instalaciones, separado de Proyectos.
        Gestión operativa especializada para cuadrillas técnicas.
        <br />
        <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button size="small" variant="outlined" onClick={() => navigate('/instalaciones/programar')}>
            📅 Programar
          </Button>
          <Button size="small" variant="outlined" onClick={() => navigate('/instalaciones/calendario')}>
            🗓️ Calendario
          </Button>
          <Button size="small" variant="outlined" onClick={() => navigate('/instalaciones/kpis')}>
            📊 KPIs y Métricas
          </Button>
        </Box>
      </Alert>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                label="Estado"
                value={filtros.estado}
                onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
                size="small"
              >
                {estadosInstalacion.map((estado) => (
                  <MenuItem key={estado.value} value={estado.value}>
                    {estado.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Buscar cliente o número"
                value={filtros.buscar}
                onChange={(e) => setFiltros({ ...filtros, buscar: e.target.value })}
                size="small"
                placeholder="Ej: Juan Pérez, INS-2024-0001"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button 
                variant="outlined" 
                onClick={cargarInstalaciones}
                startIcon={<BuildIcon />}
              >
                Actualizar Lista
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Resumen rápido de KPIs */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
                📊 Resumen de Rendimiento
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={3}>
                  <Typography variant="h4" fontWeight="bold">
                    {instalaciones.length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Instalaciones
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="h4" fontWeight="bold">
                    {instalaciones.filter(inst => inst.estado === 'completada').length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Completadas
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="h4" fontWeight="bold">
                    {instalaciones.length > 0 ? 
                      Math.round((instalaciones.filter(inst => inst.estado === 'completada').length / instalaciones.length) * 100) : 0}%
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Tasa Éxito
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="h4" fontWeight="bold">
                    {instalaciones.filter(inst => inst.estado === 'en_proceso').length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    En Proceso
                  </Typography>
                </Grid>
              </Grid>
            </Box>
            <Box>
              <Button 
                variant="contained" 
                onClick={() => navigate('/instalaciones/kpis')}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                }}
              >
                Ver KPIs Completos →
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Lista de instalaciones */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📋 Instalaciones Registradas ({instalaciones.length})
          </Typography>
          
          {instalaciones.length === 0 ? (
            <Alert severity="info">
              No hay instalaciones registradas.
              <br />
              <Button 
                variant="text" 
                sx={{ mt: 1 }}
                onClick={() => navigate('/instalaciones/programar')}
              >
                Programar primera instalación
              </Button>
            </Alert>
          ) : (
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Número</strong></TableCell>
                    <TableCell><strong>Cliente</strong></TableCell>
                    <TableCell><strong>Fecha Programada</strong></TableCell>
                    <TableCell><strong>Estado</strong></TableCell>
                    <TableCell><strong>Cuadrilla</strong></TableCell>
                    <TableCell><strong>Acciones</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {instalaciones.map((instalacion) => (
                    <TableRow key={instalacion._id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {instalacion.numero || 'Sin número'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {instalacion.cliente?.nombre || 'Cliente no definido'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {instalacion.cliente?.telefono || ''}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatearFecha(instalacion.fechaProgramada)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={instalacion.estado || 'programada'} 
                          color={obtenerColorEstado(instalacion.estado)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {instalacion.instaladores?.length || 0} instaladores
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Ver detalle">
                            <IconButton 
                              size="small"
                              onClick={() => navigate(`/instalaciones/${instalacion._id}`)}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Editar">
                            <IconButton 
                              size="small"
                              onClick={() => navigate(`/instalaciones/${instalacion._id}/editar`)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Información adicional */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🛠️ Funcionalidades Específicas de Instalaciones:
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <ul>
                <li>📅 Programación de cuadrillas técnicas</li>
                <li>📋 Checklist técnico especializado</li>
                <li>📸 Evidencias fotográficas</li>
                <li>✅ Control de calidad en sitio</li>
              </ul>
            </Grid>
            <Grid item xs={12} sm={6}>
              <ul>
                <li>📝 Conformidad del cliente</li>
                <li>📊 Reportes técnicos de instalación</li>
                <li>🗓️ Calendario de instalaciones</li>
                <li>⏱️ Seguimiento de tiempos</li>
              </ul>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default InstalacionesList;

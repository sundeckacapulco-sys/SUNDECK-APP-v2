import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
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
  Menu,
  MenuItem,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  Pagination,
  Link
} from '@mui/material';
import {
  Add,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  Search,
  FilterList,
  Phone,
  Email
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import axiosConfig from '../../config/axios';

const ProspectosList = () => {
  const [prospectos, setProspectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    busqueda: '',
    etapa: '',
    prioridad: '',
    fuente: ''
  });
  const [paginacion, setPaginacion] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedProspecto, setSelectedProspecto] = useState(null);

  const navigate = useNavigate();

  const etapas = [
    { value: 'nuevo', label: 'Nuevo', color: 'default' },
    { value: 'contactado', label: 'Contactado', color: 'primary' },
    { value: 'cita_agendada', label: 'Cita Agendada', color: 'secondary' },
    { value: 'cotizacion', label: 'Cotización', color: 'warning' },
    { value: 'pedido', label: 'Pedido', color: 'info' },
    { value: 'fabricacion', label: 'Fabricación', color: 'success' },
    { value: 'instalacion', label: 'Instalación', color: 'success' },
    { value: 'entregado', label: 'Entregado', color: 'success' },
    { value: 'postventa', label: 'Postventa', color: 'success' },
    { value: 'perdido', label: 'Perdido', color: 'error' }
  ];

  const prioridades = [
    { value: 'baja', label: 'Baja', color: 'default' },
    { value: 'media', label: 'Media', color: 'primary' },
    { value: 'alta', label: 'Alta', color: 'warning' },
    { value: 'urgente', label: 'Urgente', color: 'error' }
  ];

  const fuentes = [
    { value: 'web', label: 'Web' },
    { value: 'telefono', label: 'Teléfono' },
    { value: 'referido', label: 'Referido' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'google', label: 'Google' },
    { value: 'volante', label: 'Volante' },
    { value: 'otro', label: 'Otro' }
  ];

  const fetchProspectos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: paginacion.page,
        limit: paginacion.limit,
        ...filtros
      });

      const response = await axiosConfig.get(`/prospectos?${params}`);
      setProspectos(response.data.docs || []);
      setPaginacion(prev => ({
        ...prev,
        total: response.data.totalDocs || 0,
        totalPages: response.data.totalPages || 0
      }));
    } catch (error) {
      console.error('Error fetching prospectos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProspectos();
  }, [paginacion.page, filtros]);

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
    setPaginacion(prev => ({ ...prev, page: 1 }));
  };

  const handleMenuClick = (event, prospecto) => {
    setAnchorEl(event.currentTarget);
    setSelectedProspecto(prospecto);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProspecto(null);
  };

  const getEtapaInfo = (etapa) => {
    return etapas.find(e => e.value === etapa) || etapas[0];
  };

  const getPrioridadInfo = (prioridad) => {
    return prioridades.find(p => p.value === prioridad) || prioridades[0];
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Prospectos
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/prospectos/nuevo')}
        >
          Nuevo Prospecto
        </Button>
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Buscar"
                placeholder="Nombre, teléfono, email..."
                value={filtros.busqueda}
                onChange={(e) => handleFiltroChange('busqueda', e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Etapa</InputLabel>
                <Select
                  value={filtros.etapa}
                  label="Etapa"
                  onChange={(e) => handleFiltroChange('etapa', e.target.value)}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {etapas.map(etapa => (
                    <MenuItem key={etapa.value} value={etapa.value}>
                      {etapa.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Prioridad</InputLabel>
                <Select
                  value={filtros.prioridad}
                  label="Prioridad"
                  onChange={(e) => handleFiltroChange('prioridad', e.target.value)}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {prioridades.map(prioridad => (
                    <MenuItem key={prioridad.value} value={prioridad.value}>
                      {prioridad.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Fuente</InputLabel>
                <Select
                  value={filtros.fuente}
                  label="Fuente"
                  onChange={(e) => handleFiltroChange('fuente', e.target.value)}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {fuentes.map(fuente => (
                    <MenuItem key={fuente.value} value={fuente.value}>
                      {fuente.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => setFiltros({ busqueda: '', etapa: '', prioridad: '', fuente: '' })}
              >
                Limpiar Filtros
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabla de prospectos */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Cliente</TableCell>
              <TableCell>Contacto</TableCell>
              <TableCell>Producto</TableCell>
              <TableCell>Etapa</TableCell>
              <TableCell>Prioridad</TableCell>
              <TableCell>Fecha Creación</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : prospectos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No se encontraron prospectos
                </TableCell>
              </TableRow>
            ) : (
              prospectos.map((prospecto) => {
                const etapaInfo = getEtapaInfo(prospecto.etapa);
                const prioridadInfo = getPrioridadInfo(prospecto.prioridad);
                
                return (
                  <TableRow key={prospecto._id} hover>
                    <TableCell>
                      <Box>
                        <Link
                          component={RouterLink}
                          to={`/prospectos/${prospecto._id}`}
                          underline="hover"
                          sx={{ fontWeight: 600, display: 'inline-flex' }}
                        >
                          {prospecto.nombre}
                        </Link>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {prospecto.direccion?.ciudad}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Phone fontSize="small" />
                          <Typography variant="body2">
                            {prospecto.telefono}
                          </Typography>
                        </Box>
                        {prospecto.email && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Email fontSize="small" />
                            <Typography variant="body2">
                              {prospecto.email}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {prospecto.producto}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {prospecto.tipoProducto}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={etapaInfo.label}
                        color={etapaInfo.color}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={prioridadInfo.label}
                        color={prioridadInfo.color}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(prospecto.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={(e) => handleMenuClick(e, prospecto)}
                        size="small"
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Paginación */}
      {paginacion.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={paginacion.totalPages}
            page={paginacion.page}
            onChange={(e, page) => setPaginacion(prev => ({ ...prev, page }))}
            color="primary"
          />
        </Box>
      )}

      {/* Menú de acciones */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            navigate(`/prospectos/${selectedProspecto?._id}`);
            handleMenuClose();
          }}
        >
          <Visibility sx={{ mr: 1 }} />
          Ver Detalles
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate(`/prospectos/${selectedProspecto?._id}/editar`);
            handleMenuClose();
          }}
        >
          <Edit sx={{ mr: 1 }} />
          Editar
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ProspectosList;

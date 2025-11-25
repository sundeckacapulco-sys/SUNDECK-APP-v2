import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  ContentCut as CutIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import axiosConfig from '../../config/axios';

const PanelAlmacen = () => {
  const [loading, setLoading] = useState(false);
  const [inventario, setInventario] = useState([]);
  const [bajoStock, setBajoStock] = useState([]);
  const [sobrantes, setSobrantes] = useState([]);
  const [valorTotal, setValorTotal] = useState(0);
  const [filtros, setFiltros] = useState({
    tipo: '',
    busqueda: ''
  });
  const [tabActual, setTabActual] = useState(0);
  
  // Estado para CRUD
  const [dialogoMaterial, setDialogoMaterial] = useState(false);
  const [materialEditando, setMaterialEditando] = useState(null);
  const [formMaterial, setFormMaterial] = useState({
    codigo: '',
    descripcion: '',
    tipo: 'Tela',
    cantidad: 0,
    unidad: 'ml',
    stockMinimo: 5,
    puntoReorden: 10,
    ubicacion: { almacen: 'Almacén General', pasillo: '' },
    costos: { precioCompra: 0 },
    activo: true
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      // Cargar inventario
      const resInventario = await axiosConfig.get('/almacen/inventario', {
        params: filtros
      });
      setInventario(resInventario.data.data || []);

      // Cargar materiales bajo stock
      const resBajoStock = await axiosConfig.get('/almacen/bajo-stock');
      setBajoStock(resBajoStock.data.data || []);
      
      // Cargar sobrantes
      const resSobrantes = await axiosConfig.get('/almacen/sobrantes', {
         params: { tipo: filtros.tipo }
      });
      setSobrantes(resSobrantes.data.data || []);

      // Cargar valor total
      const resValor = await axiosConfig.get('/almacen/valor');
      setValorTotal(resValor.data.data?.valorTotal || 0);

    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  };

  const aplicarFiltros = () => {
    cargarDatos();
  };

  const getStockColor = (material) => {
    if (material.cantidad === 0) return 'error';
    if (material.cantidad <= material.stockMinimo) return 'error';
    if (material.cantidad <= material.puntoReorden) return 'warning';
    return 'success';
  };

  const getStockLabel = (material) => {
    if (material.cantidad === 0) return 'SIN STOCK';
    if (material.cantidad <= material.stockMinimo) return 'CRÍTICO';
    if (material.cantidad <= material.puntoReorden) return 'BAJO';
    return 'OK';
  };

  const handleAbrirDialogo = (material = null) => {
    if (material) {
      setMaterialEditando(material);
      setFormMaterial({
        ...material,
        ubicacion: material.ubicacion || { almacen: 'Almacén General', pasillo: '' },
        costos: material.costos || { precioCompra: 0 }
      });
    } else {
      setMaterialEditando(null);
      setFormMaterial({
        codigo: '',
        descripcion: '',
        tipo: filtros.tipo || 'Tela',
        cantidad: 0,
        unidad: 'ml',
        stockMinimo: 5,
        puntoReorden: 10,
        ubicacion: { almacen: 'Almacén General', pasillo: '' },
        costos: { precioCompra: 0 },
        activo: true
      });
    }
    setDialogoMaterial(true);
  };

  const handleGuardarMaterial = async () => {
    try {
      if (materialEditando) {
        await axiosConfig.put(`/almacen/material/${materialEditando._id}`, formMaterial);
        setSuccess('Material actualizado correctamente');
      } else {
        await axiosConfig.post('/almacen/material', formMaterial);
        setSuccess('Material creado correctamente');
      }
      setDialogoMaterial(false);
      cargarDatos();
    } catch (error) {
      console.error(error);
      setError(error.response?.data?.message || 'Error guardando material');
    }
  };

  const handleEliminarMaterial = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este material?')) return;
    try {
      await axiosConfig.delete(`/almacen/material/${id}`);
      setSuccess('Material eliminado');
      cargarDatos();
    } catch (error) {
      console.error(error);
      setError(error.response?.data?.message || 'Error eliminando material');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InventoryIcon fontSize="large" />
          Gestión de Almacén
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleAbrirDialogo()}
          >
            Nuevo Material
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={cargarDatos}
            disabled={loading}
          >
            Actualizar
          </Button>
        </Box>
      </Box>

      {/* Feedback */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* KPIs */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <InventoryIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{inventario.length}</Typography>
                  <Typography color="text.secondary">Items Inventario</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <WarningIcon color="warning" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{bajoStock.length}</Typography>
                  <Typography color="text.secondary">Bajo Stock</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CutIcon color="info" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{sobrantes.length}</Typography>
                  <Typography color="text.secondary">Sobrantes Útiles</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TrendingUpIcon color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">${valorTotal.toLocaleString()}</Typography>
                  <Typography color="text.secondary">Valor Total</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Alertas */}
      {bajoStock.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <strong>¡Atención!</strong> Hay {bajoStock.length} material(es) bajo punto de reorden que requieren compra.
        </Alert>
      )}

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Material</InputLabel>
                <Select
                  value={filtros.tipo}
                  onChange={(e) => handleFiltroChange('tipo', e.target.value)}
                  label="Tipo de Material"
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="Tubo">Tubos</MenuItem>
                  <MenuItem value="Tela">Telas</MenuItem>
                  <MenuItem value="Mecanismo">Mecanismos</MenuItem>
                  <MenuItem value="Motor">Motores</MenuItem>
                  <MenuItem value="Contrapeso">Contrapesos</MenuItem>
                  <MenuItem value="Accesorios">Accesorios</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Buscar por código o descripción"
                value={filtros.busqueda}
                onChange={(e) => handleFiltroChange('busqueda', e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="contained"
                onClick={aplicarFiltros}
                disabled={loading}
              >
                Buscar
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabActual} onChange={(e, v) => setTabActual(v)}>
          <Tab label="Inventario Completo" />
          <Tab label={`Bajo Stock (${bajoStock.length})`} />
          <Tab label={`Sobrantes (${sobrantes.length})`} icon={<CutIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* Tabla de Inventario */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : tabActual === 2 ? (
        // Tabla de Sobrantes
        <TableContainer component={Paper} elevation={2}>
          <Table>
            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
              <TableRow>
                <TableCell>Etiqueta</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell align="right">Longitud</TableCell>
                <TableCell>Ubicación</TableCell>
                <TableCell>Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sobrantes.map((item) => (
                <TableRow key={item._id} hover>
                  <TableCell>
                    <Chip 
                      label={item.etiqueta || item.codigo || 'S/E'} 
                      size="small" 
                      variant="outlined" 
                      color="primary"
                      icon={<CutIcon fontSize="small" />}
                    />
                  </TableCell>
                  <TableCell>{item.descripcion}</TableCell>
                  <TableCell>
                    <Chip label={item.tipo} size="small" sx={{ bgcolor: '#e3f2fd' }} />
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight="bold" color="primary.main">
                      {item.longitud} {item.unidad}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {item.ubicacionAlmacen}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={item.estado.toUpperCase()} 
                      color={item.estado === 'disponible' ? 'success' : 'default'}
                      size="small" 
                    />
                  </TableCell>
                </TableRow>
              ))}
              {sobrantes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography color="text.secondary">No hay sobrantes registrados</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        // Tabla de Inventario / Bajo Stock
        <TableContainer component={Paper} elevation={2}>
          <Table>
            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
              <TableRow>
                <TableCell>Código</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell align="right">Cantidad</TableCell>
                <TableCell align="right">Reservado</TableCell>
                <TableCell align="right">Disponible</TableCell>
                <TableCell>Unidad</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Ubicación</TableCell>
                <TableCell align="right">Valor</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(tabActual === 0 ? inventario : bajoStock).map((material) => (
                <TableRow key={material._id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold" color="primary">
                      {material.codigo}
                    </Typography>
                  </TableCell>
                  <TableCell>{material.descripcion}</TableCell>
                  <TableCell>
                    <Chip label={material.tipo} size="small" />
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight="bold">
                      {material.cantidad}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {material.reservado > 0 ? (
                      <Chip label={material.reservado} size="small" color="info" variant="outlined" />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight="bold" color={
                      material.cantidad - material.reservado <= 0 ? 'error.main' : 'success.main'
                    }>
                      {material.cantidad - material.reservado}
                    </Typography>
                  </TableCell>
                  <TableCell>{material.unidad}</TableCell>
                  <TableCell>
                    <Chip
                      label={getStockLabel(material)}
                      color={getStockColor(material)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {material.ubicacion?.almacen || 'N/A'}
                      {material.ubicacion?.pasillo && ` - ${material.ubicacion.pasillo}`}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    ${(material.cantidad * (material.costos?.precioCompra || 0)).toLocaleString()}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => handleAbrirDialogo(material)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton size="small" onClick={() => handleEliminarMaterial(material._id)} color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {inventario.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">
            No hay materiales en el inventario
          </Typography>
        </Box>
      )}

      {/* Diálogo Material */}
      <Dialog open={dialogoMaterial} onClose={() => setDialogoMaterial(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {materialEditando ? 'Editar Material' : 'Nuevo Material'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Código"
                value={formMaterial.codigo}
                onChange={(e) => setFormMaterial({ ...formMaterial, codigo: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={formMaterial.tipo}
                  onChange={(e) => setFormMaterial({ ...formMaterial, tipo: e.target.value })}
                  label="Tipo"
                >
                  {['Tubo', 'Cofre', 'Barra de Giro', 'Contrapeso', 'Tela', 'Cable', 'Mecanismo', 'Motor', 'Soportes', 'Herrajes', 'Accesorios', 'Kit'].map(t => (
                    <MenuItem key={t} value={t}>{t}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción"
                value={formMaterial.descripcion}
                onChange={(e) => setFormMaterial({ ...formMaterial, descripcion: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Cantidad"
                type="number"
                value={formMaterial.cantidad}
                onChange={(e) => setFormMaterial({ ...formMaterial, cantidad: Number(e.target.value) })}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Unidad</InputLabel>
                <Select
                  value={formMaterial.unidad}
                  onChange={(e) => setFormMaterial({ ...formMaterial, unidad: e.target.value })}
                  label="Unidad"
                >
                  {['pza', 'ml', 'm²', 'kit', 'juego', 'rollo', 'barra'].map(u => (
                    <MenuItem key={u} value={u}>{u}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Stock Mínimo"
                type="number"
                value={formMaterial.stockMinimo}
                onChange={(e) => setFormMaterial({ ...formMaterial, stockMinimo: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Punto Reorden"
                type="number"
                value={formMaterial.puntoReorden}
                onChange={(e) => setFormMaterial({ ...formMaterial, puntoReorden: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Costo (MXN)"
                type="number"
                value={formMaterial.costos?.precioCompra || 0}
                onChange={(e) => setFormMaterial({ 
                  ...formMaterial, 
                  costos: { ...formMaterial.costos, precioCompra: Number(e.target.value) } 
                })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Ubicación (Almacén)"
                value={formMaterial.ubicacion?.almacen || ''}
                onChange={(e) => setFormMaterial({ 
                  ...formMaterial, 
                  ubicacion: { ...formMaterial.ubicacion, almacen: e.target.value } 
                })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogoMaterial(false)}>Cancelar</Button>
          <Button onClick={handleGuardarMaterial} variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PanelAlmacen;

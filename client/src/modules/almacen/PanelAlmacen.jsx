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
  Tab
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import axiosConfig from '../../config/axios';

const PanelAlmacen = () => {
  const [loading, setLoading] = useState(false);
  const [inventario, setInventario] = useState([]);
  const [bajoStock, setBajoStock] = useState([]);
  const [valorTotal, setValorTotal] = useState(0);
  const [filtros, setFiltros] = useState({
    tipo: '',
    busqueda: ''
  });
  const [tabActual, setTabActual] = useState(0);

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

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InventoryIcon fontSize="large" />
          Gestión de Almacén
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={cargarDatos}
          disabled={loading}
        >
          Actualizar
        </Button>
      </Box>

      {/* KPIs */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <InventoryIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{inventario.length}</Typography>
                  <Typography color="text.secondary">Materiales en Inventario</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <WarningIcon color="warning" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{bajoStock.length}</Typography>
                  <Typography color="text.secondary">Materiales Bajo Stock</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TrendingUpIcon color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">${valorTotal.toLocaleString()}</Typography>
                  <Typography color="text.secondary">Valor Total Inventario</Typography>
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
        </Tabs>
      </Box>

      {/* Tabla de Inventario */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
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
              </TableRow>
            </TableHead>
            <TableBody>
              {(tabActual === 0 ? inventario : bajoStock).map((material) => (
                <TableRow key={material._id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
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
                      <Chip label={material.reservado} size="small" color="info" />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight="bold" color={
                      material.cantidad - material.reservado <= 0 ? 'error.main' : 'text.primary'
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
    </Box>
  );
};

export default PanelAlmacen;

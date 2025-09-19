import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  FilterList,
  Save,
  Cancel
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import axiosConfig from '../../config/axios';

const CatalogoProductos = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [filtros, setFiltros] = useState({
    categoria: '',
    unidadMedida: '',
    busqueda: ''
  });

  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      nombre: '',
      codigo: '',
      descripcion: '',
      categoria: 'accesorio',
      subcategoria: '',
      material: 'aluminio',
      unidadMedida: 'pieza',
      precioBase: 0,
      configuracionUnidad: {
        requiereMedidas: false,
        calculoPorArea: false,
        minimoVenta: 1,
        incremento: 1
      },
      coloresDisponibles: [],
      tiempoFabricacion: {
        base: 1,
        porM2Adicional: 0
      },
      activo: true,
      disponible: true
    }
  });

  const watchedUnidadMedida = watch('unidadMedida');

  const categorias = [
    { value: 'ventana', label: 'Ventana' },
    { value: 'puerta', label: 'Puerta' },
    { value: 'cancel', label: 'Cancel' },
    { value: 'domo', label: 'Domo' },
    { value: 'accesorio', label: 'Accesorio' },
    { value: 'motor', label: 'Motor' },
    { value: 'control', label: 'Control' },
    { value: 'kit', label: 'Kit' },
    { value: 'galeria', label: 'Galería' },
    { value: 'canaleta', label: 'Canaleta' },
    { value: 'herraje', label: 'Herraje' },
    { value: 'repuesto', label: 'Repuesto' }
  ];

  const unidadesMedida = [
    { value: 'm2', label: 'm² (Metro cuadrado)', requiereMedidas: true, calculoPorArea: true },
    { value: 'ml', label: 'm.l. (Metro lineal)', requiereMedidas: true, calculoPorArea: false },
    { value: 'metro', label: 'm (Metro)', requiereMedidas: true, calculoPorArea: false },
    { value: 'pieza', label: 'Pieza', requiereMedidas: false, calculoPorArea: false },
    { value: 'par', label: 'Par', requiereMedidas: false, calculoPorArea: false },
    { value: 'juego', label: 'Juego', requiereMedidas: false, calculoPorArea: false },
    { value: 'kit', label: 'Kit', requiereMedidas: false, calculoPorArea: false }
  ];

  const coloresComunes = [
    'Blanco', 'Negro', 'Gris', 'Café', 'Beige', 'Crema', 'Aluminio Natural',
    'Bronce', 'Dorado', 'Plateado', 'Madera', 'Nogal', 'Caoba'
  ];

  useEffect(() => {
    fetchProductos();
  }, []);

  useEffect(() => {
    // Actualizar configuración automáticamente según unidad de medida
    const unidadSeleccionada = unidadesMedida.find(u => u.value === watchedUnidadMedida);
    if (unidadSeleccionada) {
      setValue('configuracionUnidad.requiereMedidas', unidadSeleccionada.requiereMedidas);
      setValue('configuracionUnidad.calculoPorArea', unidadSeleccionada.calculoPorArea);
      setValue('configuracionUnidad.incremento', 
        unidadSeleccionada.value === 'pieza' ? 1 : 0.1
      );
    }
  }, [watchedUnidadMedida, setValue]);

  const fetchProductos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filtros.categoria) params.append('categoria', filtros.categoria);
      if (filtros.unidadMedida) params.append('unidadMedida', filtros.unidadMedida);
      if (filtros.busqueda) params.append('search', filtros.busqueda);

      const response = await axiosConfig.get(`/productos?${params.toString()}`);
      setProductos(response.data.docs || response.data || []);
    } catch (error) {
      setError('Error cargando productos');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (producto = null) => {
    if (producto) {
      setEditingProduct(producto);
      reset({
        ...producto,
        coloresDisponibles: producto.coloresDisponibles || []
      });
    } else {
      setEditingProduct(null);
      reset({
        nombre: '',
        codigo: `PROD-${Date.now()}`,
        descripcion: '',
        categoria: 'accesorio',
        subcategoria: '',
        material: 'aluminio',
        unidadMedida: 'pieza',
        precioBase: 0,
        configuracionUnidad: {
          requiereMedidas: false,
          calculoPorArea: false,
          minimoVenta: 1,
          incremento: 1
        },
        coloresDisponibles: [],
        tiempoFabricacion: {
          base: 1,
          porM2Adicional: 0
        },
        activo: true,
        disponible: true
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProduct(null);
    setError('');
    setSuccess('');
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError('');

      if (editingProduct) {
        await axiosConfig.put(`/productos/${editingProduct._id}`, data);
        setSuccess('Producto actualizado exitosamente');
      } else {
        await axiosConfig.post('/productos', data);
        setSuccess('Producto creado exitosamente');
      }

      await fetchProductos();
      handleCloseDialog();
    } catch (error) {
      setError(error.response?.data?.message || 'Error guardando producto');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este producto?')) {
      try {
        await axiosConfig.delete(`/productos/${id}`);
        setSuccess('Producto eliminado exitosamente');
        await fetchProductos();
      } catch (error) {
        setError('Error eliminando producto');
      }
    }
  };

  const getUnidadLabel = (unidad) => {
    const unidadObj = unidadesMedida.find(u => u.value === unidad);
    return unidadObj ? unidadObj.label : unidad;
  };

  const getCategoriaColor = (categoria) => {
    const colores = {
      motor: 'error',
      control: 'warning',
      kit: 'info',
      galeria: 'success',
      canaleta: 'secondary',
      herraje: 'default',
      accesorio: 'primary'
    };
    return colores[categoria] || 'default';
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          📦 Catálogo de Productos
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          sx={{ bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}
        >
          Nuevo Producto
        </Button>
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <FilterList sx={{ mr: 1 }} />
            Filtros
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Buscar producto"
                value={filtros.busqueda}
                onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Categoría</InputLabel>
                <Select
                  value={filtros.categoria}
                  label="Categoría"
                  onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value })}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {categorias.map(cat => (
                    <MenuItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Unidad de Medida</InputLabel>
                <Select
                  value={filtros.unidadMedida}
                  label="Unidad de Medida"
                  onChange={(e) => setFiltros({ ...filtros, unidadMedida: e.target.value })}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {unidadesMedida.map(unidad => (
                    <MenuItem key={unidad.value} value={unidad.value}>
                      {unidad.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="outlined"
                onClick={fetchProductos}
                sx={{ height: '56px' }}
              >
                Aplicar Filtros
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Alertas */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Tabla de productos */}
      <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>Código</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Producto</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Categoría</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Unidad</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Precio Base</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Cargando productos...
                </TableCell>
              </TableRow>
            ) : productos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No se encontraron productos
                </TableCell>
              </TableRow>
            ) : (
              productos.map((producto) => (
                <TableRow key={producto._id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {producto.codigo}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      {producto.nombre}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {producto.descripcion}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={producto.categoria}
                      color={getCategoriaColor(producto.categoria)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {getUnidadLabel(producto.unidadMedida)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      ${producto.precioBase?.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip
                        label={producto.activo ? 'Activo' : 'Inactivo'}
                        color={producto.activo ? 'success' : 'default'}
                        size="small"
                      />
                      <Chip
                        label={producto.disponible ? 'Disponible' : 'No disponible'}
                        color={producto.disponible ? 'info' : 'warning'}
                        size="small"
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(producto)}
                        color="primary"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(producto._id)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog para crear/editar producto */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              {/* Información básica */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Información Básica
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Controller
                  name="nombre"
                  control={control}
                  rules={{ required: 'El nombre es requerido' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Nombre del Producto *"
                      error={!!errors.nombre}
                      helperText={errors.nombre?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="codigo"
                  control={control}
                  rules={{ required: 'El código es requerido' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Código *"
                      error={!!errors.codigo}
                      helperText={errors.codigo?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="descripcion"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Descripción"
                      multiline
                      rows={2}
                    />
                  )}
                />
              </Grid>

              {/* Categorización */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Categorización
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="categoria"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Categoría *</InputLabel>
                      <Select {...field} label="Categoría *">
                        {categorias.map(cat => (
                          <MenuItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="material"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Material</InputLabel>
                      <Select {...field} label="Material">
                        <MenuItem value="aluminio">Aluminio</MenuItem>
                        <MenuItem value="pvc">PVC</MenuItem>
                        <MenuItem value="madera">Madera</MenuItem>
                        <MenuItem value="acero">Acero</MenuItem>
                        <MenuItem value="mixto">Mixto</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              {/* Unidad de medida y precio */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Precio y Medidas
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="unidadMedida"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Unidad de Medida *</InputLabel>
                      <Select {...field} label="Unidad de Medida *">
                        {unidadesMedida.map(unidad => (
                          <MenuItem key={unidad.value} value={unidad.value}>
                            {unidad.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="precioBase"
                  control={control}
                  rules={{ required: 'El precio es requerido', min: 0 }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Precio Base *"
                      type="number"
                      InputProps={{
                        startAdornment: '$'
                      }}
                      error={!!errors.precioBase}
                      helperText={errors.precioBase?.message}
                    />
                  )}
                />
              </Grid>

              {/* Colores disponibles */}
              <Grid item xs={12}>
                <Controller
                  name="coloresDisponibles"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      {...field}
                      multiple
                      options={coloresComunes}
                      freeSolo
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip
                            variant="outlined"
                            label={option}
                            {...getTagProps({ index })}
                            key={index}
                          />
                        ))
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Colores Disponibles"
                          placeholder="Agregar color"
                        />
                      )}
                      onChange={(_, value) => field.onChange(value)}
                    />
                  )}
                />
              </Grid>

              {/* Estado */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Estado
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="activo"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch {...field} checked={field.value} />}
                      label="Producto Activo"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="disponible"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch {...field} checked={field.value} />}
                      label="Disponible para Venta"
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} startIcon={<Cancel />}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            variant="contained"
            startIcon={<Save />}
            disabled={loading}
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CatalogoProductos;

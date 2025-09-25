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
  Tooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
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
  Warning,
  Save,
  Cancel
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import axiosConfig from '../../config/axios';

const CatalogoProductos = () => {
  const { user } = useAuth();
  const [productos, setProductos] = useState([]);
  
  // Debug temporal
  console.log('Usuario actual en catálogo:', user);
  console.log('Rol del usuario:', user?.rol);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, producto: null });
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
      disponible: true,
      imagenes: [],
      especificaciones: '',
      garantia: '',
      peso: '',
      dimensiones: ''
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
        disponible: true,
        imagenes: [],
        especificaciones: '',
        garantia: '',
        peso: '',
        dimensiones: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProduct(null);
    reset({
      nombre: '',
      codigo: '',
      descripcion: '',
      categoria: 'ventana',
      material: 'aluminio',
      unidadMedida: 'm2',
      precioBase: '',
      coloresDisponibles: ['Blanco'],
      tiempoFabricacion: 5,
      activo: true,
      disponible: true,
      imagenes: [],
      especificaciones: '',
      garantia: '',
      peso: '',
      dimensiones: ''
    });
    setError('');
    setSuccess('');
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const productData = {
        ...data,
        coloresDisponibles: data.coloresDisponibles || ['Blanco'],
        tiempoFabricacion: {
          base: parseInt(data.tiempoFabricacion) || 5,
          porM2Adicional: data.unidadMedida === 'm2' ? 0.5 : 0
        },
        imagenes: data.imagenes || [],
        especificaciones: data.especificaciones || '',
        garantia: data.garantia || '',
        peso: data.peso || '',
        dimensiones: data.dimensiones || ''
      };

      console.log('Enviando producto:', productData);
      
      if (editingProduct) {
        // Actualizar producto existente
        await axiosConfig.put(`/productos/${editingProduct._id}`, productData);
        setSuccess('Producto actualizado exitosamente');
      } else {
        // Crear nuevo producto
        await axiosConfig.post('/productos', productData);
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

  const handleEdit = (producto) => {
    setEditingProduct(producto);
    // Llenar el formulario con los datos del producto
    reset({
      nombre: producto.nombre,
      codigo: producto.codigo,
      descripcion: producto.descripcion,
      categoria: producto.categoria,
      material: producto.material,
      unidadMedida: producto.unidadMedida,
      precioBase: producto.precioBase,
      coloresDisponibles: producto.coloresDisponibles || [],
      tiempoFabricacion: producto.tiempoFabricacion?.base || 5,
      activo: producto.activo,
      disponible: producto.disponible,
      imagenes: producto.imagenes || []
    });
    setOpenDialog(true);
  };

  const handleDeleteClick = (producto) => {
    setDeleteDialog({ open: true, producto });
  };

  const handleDeleteConfirm = async () => {
    try {
      setLoading(true);
      await axiosConfig.delete(`/productos/${deleteDialog.producto._id}`);
      setSuccess(`Producto "${deleteDialog.producto.nombre}" eliminado exitosamente`);
      setDeleteDialog({ open: false, producto: null });
      fetchProductos(); // Recargar lista
    } catch (error) {
      console.error('Error eliminando producto:', error);
      setError(error.response?.data?.message || 'Error eliminando el producto');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, producto: null });
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
        <Typography variant="h4" component="h1">
          📎 Catálogo de Productos
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {/* Botón temporal para testing */}
          <Button
            variant="outlined"
            color="warning"
            onClick={() => console.log('Rol actual:', user?.rol)}
            size="small"
          >
            Debug Rol: {user?.rol || 'undefined'}
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpenDialog}
          >
            Nuevo Producto
          </Button>
        </Box>
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
                    <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'normal', overflowWrap: 'break-word' }}>
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
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(producto)}
                          sx={{ color: '#1976d2' }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {/* Debug: mostrar siempre el botón para testing */}
                      <Tooltip title={`Eliminar (Rol actual: ${user?.rol || 'no definido'})`}>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(producto)}
                          sx={{ 
                            color: '#d32f2f',
                            '&:hover': {
                              bgcolor: '#ffebee'
                            }
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
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

              {/* Información para Venta en Línea */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ color: '#9c27b0' }}>
                  🛒 Información para Venta en Línea
                </Typography>
              </Grid>

              {/* URLs de Imágenes */}
              <Grid item xs={12}>
                <Controller
                  name="imagenes"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      {...field}
                      multiple
                      freeSolo
                      options={[]}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip
                            variant="outlined"
                            label={`Imagen ${index + 1}`}
                            {...getTagProps({ index })}
                            key={index}
                            color="secondary"
                          />
                        ))
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="URLs de Imágenes"
                          placeholder="https://ejemplo.com/imagen.jpg"
                          helperText="Presiona Enter para agregar cada URL de imagen"
                        />
                      )}
                      onChange={(_, value) => field.onChange(value)}
                    />
                  )}
                />
              </Grid>

              {/* Especificaciones Técnicas */}
              <Grid item xs={12}>
                <Controller
                  name="especificaciones"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      multiline
                      rows={3}
                      label="Especificaciones Técnicas"
                      placeholder="Detalles técnicos, materiales, dimensiones estándar, etc."
                      helperText="Información detallada para mostrar a los clientes"
                    />
                  )}
                />
              </Grid>

              {/* Garantía y Detalles Adicionales */}
              <Grid item xs={12} md={4}>
                <Controller
                  name="garantia"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Garantía"
                      placeholder="Ej: 2 años"
                      helperText="Tiempo de garantía"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="peso"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Peso Aproximado"
                      placeholder="Ej: 2.5 kg/m²"
                      helperText="Para cálculos de envío"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="dimensiones"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Dimensiones Estándar"
                      placeholder="Ej: Max 3x2.5m"
                      helperText="Limitaciones de tamaño"
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

      {/* Dialog de confirmación para eliminar */}
      <Dialog
        open={deleteDialog.open}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="error" />
          Confirmar Eliminación
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas eliminar el producto{' '}
            <strong>"{deleteDialog.producto?.nombre}"</strong>?
          </DialogContentText>
          <DialogContentText sx={{ mt: 2, color: 'error.main' }}>
            ⚠️ Esta acción no se puede deshacer. El producto se eliminará permanentemente del catálogo.
          </DialogContentText>
          {deleteDialog.producto && (
            <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Información del producto:
              </Typography>
              <Typography variant="body2">
                <strong>Código:</strong> {deleteDialog.producto.codigo}
              </Typography>
              <Typography variant="body2">
                <strong>Categoría:</strong> {deleteDialog.producto.categoria}
              </Typography>
              <Typography variant="body2">
                <strong>Precio:</strong> ${deleteDialog.producto.precioBase?.toLocaleString()} / {deleteDialog.producto.unidadMedida}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={handleDeleteCancel}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            disabled={loading}
            startIcon={loading ? null : <Delete />}
          >
            {loading ? 'Eliminando...' : 'Eliminar Producto'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CatalogoProductos;

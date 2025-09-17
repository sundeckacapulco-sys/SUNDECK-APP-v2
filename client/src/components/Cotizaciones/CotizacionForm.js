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
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Add,
  Delete,
  Calculate
} from '@mui/icons-material';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import axiosConfig from '../../config/axios';

const CotizacionForm = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [productos, setProductos] = useState([]);
  const [prospectos, setProspectos] = useState([]);
  const [openCalculadora, setOpenCalculadora] = useState(false);
  const [productoCalcular, setProductoCalcular] = useState(null);

  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const prospectoId = searchParams.get('prospecto');
  const isEdit = Boolean(id);

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      prospecto: prospectoId || '',
      validoHasta: '',
      productos: [],
      descuento: {
        porcentaje: 0,
        motivo: ''
      },
      formaPago: {
        anticipo: {
          porcentaje: 50
        },
        saldo: {
          porcentaje: 50,
          condiciones: 'contra entrega'
        }
      },
      tiempoFabricacion: 15,
      tiempoInstalacion: 1,
      requiereInstalacion: true,
      costoInstalacion: 0,
      garantia: {
        fabricacion: 12,
        instalacion: 6,
        descripcion: 'Garantía completa contra defectos de fabricación e instalación'
      }
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'productos'
  });

  const watchedProductos = watch('productos');
  const watchedDescuento = watch('descuento');

  useEffect(() => {
    fetchProductos();
    fetchProspectos();
    if (isEdit) {
      fetchCotizacion();
    }
  }, [id]);

  const fetchProductos = async () => {
    try {
      const response = await axiosConfig.get('/productos');
      setProductos(response.data);
    } catch (error) {
      console.error('Error fetching productos:', error);
    }
  };

  const fetchProspectos = async () => {
    try {
      const response = await axiosConfig.get('/prospectos?limit=100');
      setProspectos(response.data.docs || []);
    } catch (error) {
      console.error('Error fetching prospectos:', error);
    }
  };

  const fetchCotizacion = async () => {
    try {
      const response = await axiosConfig.get(`/cotizaciones/${id}`);
      // Reset form with fetched data
      // Implementation would go here
    } catch (error) {
      setError('Error cargando la cotización');
    }
  };

  const calcularTotales = () => {
    const subtotal = watchedProductos.reduce((sum, producto) => {
      return sum + (producto.subtotal || 0);
    }, 0);

    const descuentoMonto = subtotal * (watchedDescuento.porcentaje / 100);
    const subtotalConDescuento = subtotal - descuentoMonto;
    const iva = subtotalConDescuento * 0.16;
    const total = subtotalConDescuento + iva;

    return {
      subtotal,
      descuentoMonto,
      subtotalConDescuento,
      iva,
      total
    };
  };

  const agregarProducto = () => {
    append({
      nombre: '',
      descripcion: '',
      categoria: 'ventana',
      material: '',
      color: '',
      cristal: '',
      medidas: {
        ancho: 0,
        alto: 0,
        area: 0
      },
      cantidad: 1,
      precioUnitario: 0,
      subtotal: 0
    });
  };

  const calcularPrecioProducto = async (index, producto) => {
    try {
      if (!producto.productoId || !producto.medidas.ancho || !producto.medidas.alto) {
        return;
      }

      const response = await axiosConfig.post(`/productos/${producto.productoId}/calcular-precio`, {
        medidas: producto.medidas,
        opciones: {
          colorEspecial: producto.color !== 'blanco',
          cristalEspecial: producto.cristal !== 'claro'
        }
      });

      const { precio, area, tiempoFabricacion } = response.data;
      
      setValue(`productos.${index}.medidas.area`, area);
      setValue(`productos.${index}.precioUnitario`, precio);
      setValue(`productos.${index}.subtotal`, precio * producto.cantidad);
      setValue(`productos.${index}.tiempoFabricacion`, tiempoFabricacion);
    } catch (error) {
      console.error('Error calculando precio:', error);
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const totales = calcularTotales();
      const cotizacionData = {
        ...data,
        prospectoId: data.prospecto, // Renombrar el campo para que coincida con la API
        ...totales,
        fechaEntregaEstimada: new Date(Date.now() + data.tiempoFabricacion * 24 * 60 * 60 * 1000)
      };
      
      // Eliminar el campo 'prospecto' ya que ahora usamos 'prospectoId'
      delete cotizacionData.prospecto;

      if (isEdit) {
        await axiosConfig.put(`/cotizaciones/${id}`, cotizacionData);
        setSuccess('Cotización actualizada exitosamente');
      } else {
        await axiosConfig.post('/cotizaciones', cotizacionData);
        setSuccess('Cotización creada exitosamente');
        setTimeout(() => navigate('/cotizaciones'), 2000);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Error guardando la cotización');
    } finally {
      setLoading(false);
    }
  };

  const totales = calcularTotales();

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/cotizaciones')}
          sx={{ mr: 2 }}
        >
          Volver
        </Button>
        <Typography variant="h4" component="h1">
          {isEdit ? 'Editar Cotización' : 'Nueva Cotización'}
        </Typography>
      </Box>

      <Card>
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            {/* Información básica */}
            <Typography variant="h6" gutterBottom>
              Información Básica
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="prospecto"
                  control={control}
                  rules={{ required: 'El prospecto es requerido' }}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Cliente *</InputLabel>
                      <Select {...field} label="Cliente *" error={!!errors.prospecto}>
                        {prospectos.map(prospecto => (
                          <MenuItem key={prospecto._id} value={prospecto._id}>
                            {prospecto.nombre} - {prospecto.telefono}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Controller
                  name="validoHasta"
                  control={control}
                  rules={{ required: 'La fecha de validez es requerida' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Válido Hasta *"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      error={!!errors.validoHasta}
                      helperText={errors.validoHasta?.message}
                    />
                  )}
                />
              </Grid>
            </Grid>

            {/* Productos */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Productos
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={agregarProducto}
              >
                Agregar Producto
              </Button>
            </Box>

            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Producto</TableCell>
                    <TableCell>Medidas</TableCell>
                    <TableCell>Cantidad</TableCell>
                    <TableCell>Precio Unit.</TableCell>
                    <TableCell>Subtotal</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell>
                        <Controller
                          name={`productos.${index}.nombre`}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              size="small"
                              label="Producto"
                              fullWidth
                            />
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Controller
                            name={`productos.${index}.medidas.ancho`}
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                size="small"
                                label="Ancho"
                                type="number"
                                sx={{ width: 80 }}
                              />
                            )}
                          />
                          <Controller
                            name={`productos.${index}.medidas.alto`}
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                size="small"
                                label="Alto"
                                type="number"
                                sx={{ width: 80 }}
                              />
                            )}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Controller
                          name={`productos.${index}.cantidad`}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              size="small"
                              type="number"
                              sx={{ width: 80 }}
                            />
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <Controller
                          name={`productos.${index}.precioUnitario`}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              size="small"
                              type="number"
                              sx={{ width: 100 }}
                            />
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        ${watchedProductos[index]?.subtotal?.toLocaleString() || 0}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() => remove(index)}
                          color="error"
                          size="small"
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Totales */}
            <Card sx={{ mb: 3, bgcolor: 'grey.50' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Resumen de Totales
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Controller
                      name="descuento.porcentaje"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Descuento (%)"
                          type="number"
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2">
                        Subtotal: ${totales.subtotal.toLocaleString()}
                      </Typography>
                      <Typography variant="body2">
                        Descuento: -${totales.descuentoMonto.toLocaleString()}
                      </Typography>
                      <Typography variant="body2">
                        IVA (16%): ${totales.iva.toLocaleString()}
                      </Typography>
                      <Typography variant="h6" color="primary">
                        Total: ${totales.total.toLocaleString()}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Condiciones de pago */}
            <Typography variant="h6" gutterBottom>
              Condiciones de Pago
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="formaPago.anticipo.porcentaje"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Anticipo (%)"
                      type="number"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="formaPago.saldo.condiciones"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Condiciones del saldo"
                    />
                  )}
                />
              </Grid>
            </Grid>

            {/* Botones */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/cotizaciones')}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<Save />}
                disabled={loading}
              >
                {loading ? 'Guardando...' : (isEdit ? 'Actualizar' : 'Crear Cotización')}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CotizacionForm;

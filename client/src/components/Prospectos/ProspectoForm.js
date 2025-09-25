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
  Divider
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import TextFieldConDictado from '../Common/TextFieldConDictado';
import axiosConfig from '../../config/axios';

const ProspectoForm = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [productos, setProductos] = useState([]);
  const [mostrarProductoPersonalizado, setMostrarProductoPersonalizado] = useState(false);
  const [productoPersonalizado, setProductoPersonalizado] = useState('');
  
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      nombre: '',
      telefono: '',
      email: '',
      direccion: {
        calle: '',
        colonia: '',
        ciudad: '',
        codigoPostal: '',
        referencias: '',
        linkMapa: ''
      },
      producto: '',
      tipoProducto: 'visita_servicio',
      descripcionNecesidad: '',
      presupuestoEstimado: '',
      fechaCita: '',
      horaCita: '',
      fuente: 'web',
      referidoPor: '',
      prioridad: 'media',
      comoSeEntero: '',
      motivoCompra: ''
    }
  });

  const tiposProducto = [
    { value: 'visita_servicio', label: 'Visita de Servicio' },
    { value: 'toma_medidas', label: 'Toma de Medidas' },
    { value: 'cotizacion', label: 'Cotización' },
    { value: 'instalacion', label: 'Instalación' },
    { value: 'mantenimiento', label: 'Mantenimiento' },
    { value: 'reparacion', label: 'Reparación' },
    { value: 'garantia', label: 'Garantía' },
    { value: 'asesoria', label: 'Asesoría' },
    { value: 'otro', label: 'Otro' }
  ];

  const productosDisponibles = [
    // Persianas Enrollables
    { value: 'screen_3', label: 'Persianas Screen 3%' },
    { value: 'screen_5', label: 'Persianas Screen 5%' },
    { value: 'screen_10', label: 'Persianas Screen 10%' },
    { value: 'blackout', label: 'Persianas Blackout' },
    { value: 'sunscreen', label: 'Persianas Sunscreen' },
    
    // Cortinas Tradicionales
    { value: 'cortina_tradicional', label: 'Cortinas Tradicionales' },
    { value: 'cortina_romana', label: 'Cortinas Romanas' },
    { value: 'cortina_panel', label: 'Cortinas Panel' },
    
    // Toldos
    { value: 'toldo_vertical', label: 'Toldo Vertical' },
    { value: 'toldo_proyeccion', label: 'Toldo de Proyección' },
    { value: 'toldo_brazo_invisible', label: 'Toldo Brazo Invisible' },
    
    // Productos Especiales
    { value: 'doble_cortina', label: 'Doble Cortina (2 en 1 ventana)' },
    { value: 'cortina_screen', label: 'Cortina + Screen (combinado)' },
    { value: 'sistema_dia_noche', label: 'Sistema Día/Noche' },
    { value: 'cortina_cenefa', label: 'Cortina con Cenefa' },
    
    // Otros
    { value: 'personalizado', label: 'Producto Personalizado' },
    { value: 'otro', label: 'Otro (especificar)' }
  ];

  const fuentes = [
    { value: 'web', label: 'Página Web' },
    { value: 'telefono', label: 'Teléfono' },
    { value: 'referido', label: 'Referido' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'google', label: 'Google' },
    { value: 'volante', label: 'Volante' },
    { value: 'otro', label: 'Otro' }
  ];

  const prioridades = [
    { value: 'baja', label: 'Baja' },
    { value: 'media', label: 'Media' },
    { value: 'alta', label: 'Alta' },
    { value: 'urgente', label: 'Urgente' }
  ];

  const motivosCompra = [
    { value: 'privacidad', label: 'Privacidad' },
    { value: 'control_luz', label: 'Control de Luz' },
    { value: 'decoracion', label: 'Decoración' },
    { value: 'ahorro_energia', label: 'Ahorro de Energía' },
    { value: 'proteccion_solar', label: 'Protección Solar' },
    { value: 'seguridad', label: 'Seguridad' },
    { value: 'reemplazo', label: 'Reemplazo/Renovación' },
    { value: 'casa_nueva', label: 'Casa Nueva' },
    { value: 'remodelacion', label: 'Remodelación' },
    { value: 'recomendacion', label: 'Recomendación' },
    { value: 'precio_oferta', label: 'Precio/Oferta' },
    { value: 'otro', label: 'Otro' }
  ];

  useEffect(() => {
    fetchProductos();
    if (isEdit) {
      fetchProspecto();
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

  const fetchProspecto = async () => {
    try {
      const response = await axiosConfig.get(`/prospectos/${id}`);
      reset(response.data);
    } catch (error) {
      setError('Error cargando el prospecto');
    }
  };

  const handleProductoChange = (value) => {
    if (value === 'personalizado') {
      setMostrarProductoPersonalizado(true);
    } else {
      setMostrarProductoPersonalizado(false);
      setProductoPersonalizado('');
    }
  };

  const handleAgregarProductoPersonalizado = () => {
    if (productoPersonalizado.trim().length >= 3) {
      // Agregar el producto personalizado a la lista temporal
      const nuevoProducto = {
        value: `personalizado_${Date.now()}`,
        label: productoPersonalizado.trim()
      };
      
      setMostrarProductoPersonalizado(false);
      setProductoPersonalizado('');
      setSuccess(`✨ Producto personalizado agregado: ${nuevoProducto.label}`);
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Si es un producto personalizado, usar el nombre personalizado
      if (data.producto && data.producto.startsWith('personalizado_')) {
        data.productoLabel = productoPersonalizado || data.producto;
      }

      if (isEdit) {
        await axiosConfig.put(`/prospectos/${id}`, data);
        setSuccess('Prospecto actualizado exitosamente');
      } else {
        await axiosConfig.post('/prospectos', data);
        setSuccess('Prospecto creado exitosamente');
        setTimeout(() => navigate('/prospectos'), 2000);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Error guardando el prospecto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/prospectos')}
          sx={{ mr: 2 }}
        >
          Volver
        </Button>
        <Typography variant="h4" component="h1">
          {isEdit ? 'Editar Prospecto' : 'Nuevo Prospecto'}
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
            {/* Información del Cliente */}
            <Typography variant="h6" gutterBottom>
              Información del Cliente
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="nombre"
                  control={control}
                  rules={{ required: 'El nombre es requerido' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Nombre Completo *"
                      error={!!errors.nombre}
                      helperText={errors.nombre?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Controller
                  name="telefono"
                  control={control}
                  rules={{ required: 'El teléfono es requerido' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Teléfono *"
                      error={!!errors.telefono}
                      helperText={errors.telefono?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Email"
                      type="email"
                    />
                  )}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Dirección */}
            <Typography variant="h6" gutterBottom>
              Dirección
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={8}>
                <Controller
                  name="direccion.calle"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Calle y Número"
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Controller
                  name="direccion.codigoPostal"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Código Postal"
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Controller
                  name="direccion.colonia"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Colonia"
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Controller
                  name="direccion.ciudad"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Ciudad"
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Controller
                  name="direccion.referencias"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Referencias"
                      multiline
                      rows={2}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Controller
                  name="direccion.linkMapa"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="🗺️ Link de Google Maps"
                      placeholder="https://maps.google.com/... o https://goo.gl/maps/..."
                      helperText="Pega aquí el enlace de Google Maps para llegar más rápido a la ubicación"
                      type="url"
                    />
                  )}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Información del Producto */}
            <Typography variant="h6" gutterBottom>
              Información del Producto/Servicio
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="tipoProducto"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Tipo de Producto</InputLabel>
                      <Select {...field} label="Tipo de Producto">
                        {tiposProducto.map(tipo => (
                          <MenuItem key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Controller
                  name="producto"
                  control={control}
                  rules={{ required: 'El producto es requerido' }}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.producto}>
                      <InputLabel>Producto Específico *</InputLabel>
                      <Select 
                        {...field} 
                        label="Producto Específico *"
                        onChange={(e) => {
                          field.onChange(e);
                          handleProductoChange(e.target.value);
                        }}
                      >
                        {productosDisponibles.map(producto => (
                          <MenuItem key={producto.value} value={producto.value}>
                            {producto.label}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.producto && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                          {errors.producto.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>

              {/* Formulario de Producto Personalizado */}
              {mostrarProductoPersonalizado && (
                <Grid item xs={12}>
                  <Card sx={{ p: 2, backgroundColor: '#f8f9fa', border: '1px solid #e9ecef' }}>
                    <Typography variant="h6" gutterBottom>
                      ✨ Agregar Producto Personalizado
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Útil para casos especiales como: dos cortinas en una ventana, combinaciones específicas, sistemas únicos, etc.
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
                      <TextField
                        fullWidth
                        label="Nombre del producto personalizado"
                        placeholder="Ej. Doble Screen 3% + Blackout, Sistema Triple, Cortina Especial..."
                        value={productoPersonalizado}
                        onChange={(e) => setProductoPersonalizado(e.target.value)}
                        helperText="Sé específico para identificar fácilmente el producto"
                        error={productoPersonalizado.length > 0 && productoPersonalizado.length < 3}
                      />
                      <Button
                        variant="contained"
                        onClick={handleAgregarProductoPersonalizado}
                        disabled={productoPersonalizado.trim().length < 3}
                        sx={{ minWidth: 120 }}
                      >
                        Agregar
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          setMostrarProductoPersonalizado(false);
                          setProductoPersonalizado('');
                        }}
                      >
                        Cancelar
                      </Button>
                    </Box>

                    {/* Sugerencias rápidas */}
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Sugerencias rápidas:
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                        {[
                          'Doble Screen + Blackout',
                          'Sistema Día/Noche Especial',
                          'Cortina Triple',
                          'Sistema con Cenefa Decorativa'
                        ].map((sugerencia) => (
                          <Button
                            key={sugerencia}
                            size="small"
                            variant="outlined"
                            onClick={() => setProductoPersonalizado(sugerencia)}
                            sx={{ fontSize: '0.75rem' }}
                          >
                            {sugerencia}
                          </Button>
                        ))}
                      </Box>
                    </Box>
                  </Card>
                </Grid>
              )}
              
              <Grid item xs={12}>
                <Controller
                  name="descripcionNecesidad"
                  control={control}
                  render={({ field }) => (
                    <TextFieldConDictado
                      {...field}
                      fullWidth
                      label="Descripción de la Necesidad"
                      rows={4}
                      placeholder="Describe las necesidades específicas del cliente..."
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Controller
                  name="presupuestoEstimado"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Presupuesto Estimado"
                      type="number"
                    />
                  )}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Información de Seguimiento */}
            <Typography variant="h6" gutterBottom>
              Información de Seguimiento
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={4}>
                <Controller
                  name="fechaCita"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Fecha de Cita"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Controller
                  name="horaCita"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Hora de Cita"
                      type="time"
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Controller
                  name="prioridad"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Prioridad</InputLabel>
                      <Select {...field} label="Prioridad">
                        {prioridades.map(prioridad => (
                          <MenuItem key={prioridad.value} value={prioridad.value}>
                            {prioridad.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Controller
                  name="fuente"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>¿Cómo se enteró?</InputLabel>
                      <Select {...field} label="¿Cómo se enteró?">
                        {fuentes.map(fuente => (
                          <MenuItem key={fuente.value} value={fuente.value}>
                            {fuente.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Controller
                  name="referidoPor"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Referido por (si aplica)"
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Controller
                  name="motivoCompra"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Motivo de Compra</InputLabel>
                      <Select {...field} label="Motivo de Compra">
                        {motivosCompra.map(motivo => (
                          <MenuItem key={motivo.value} value={motivo.value}>
                            {motivo.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
            </Grid>

            {/* Botones */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/prospectos')}
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
                {loading ? 'Guardando...' : (isEdit ? 'Actualizar' : 'Crear Prospecto')}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ProspectoForm;

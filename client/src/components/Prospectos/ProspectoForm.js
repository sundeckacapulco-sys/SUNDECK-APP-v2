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
import axiosConfig from '../../config/axios';

const ProspectoForm = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [productos, setProductos] = useState([]);
  
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
        referencias: ''
      },
      producto: '',
      tipoProducto: 'ventana',
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
    { value: 'ventana', label: 'Ventana' },
    { value: 'puerta', label: 'Puerta' },
    { value: 'cancel', label: 'Cancel' },
    { value: 'domo', label: 'Domo' },
    { value: 'otro', label: 'Otro' }
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

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

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
                    <TextField
                      {...field}
                      fullWidth
                      label="Producto Específico *"
                      error={!!errors.producto}
                      helperText={errors.producto?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Controller
                  name="descripcionNecesidad"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Descripción de la Necesidad"
                      multiline
                      rows={3}
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
                    <TextField
                      {...field}
                      fullWidth
                      label="Motivo de Compra"
                      multiline
                      rows={2}
                    />
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

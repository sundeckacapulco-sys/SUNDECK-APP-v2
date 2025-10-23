import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Divider
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import proyectosApi from './services/proyectosApi';

const PASOS_CREACION = [
  {
    label: 'Información del Cliente',
    description: 'Datos básicos del cliente'
  },
  {
    label: 'Detalles del Proyecto',
    description: 'Información específica del proyecto'
  },
  {
    label: 'Confirmación',
    description: 'Revisar y crear proyecto'
  }
];

const ProyectoForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const esEdicion = Boolean(id);

  // Estados principales
  const [proyecto, setProyecto] = useState({
    cliente: {
      nombre: '',
      telefono: '',
      email: '',
      direccion: {
        calle: '',
        colonia: '',
        ciudad: '',
        codigoPostal: '',
        referencias: ''
      }
    },
    descripcion: '',
    tipoProyecto: 'persianas',
    prioridad: 'media',
    observaciones: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pasoActual, setPasoActual] = useState(0);

  // Cargar proyecto si es edición
  useEffect(() => {
    if (esEdicion) {
      cargarProyecto();
    }
  }, [id, esEdicion]);

  const cargarProyecto = async () => {
    try {
      setLoading(true);
      const response = await proyectosApi.obtenerPorId(id);
      setProyecto(response.data);
    } catch (error) {
      console.error('Error cargando proyecto:', error);
      setError('Error cargando el proyecto');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (campo, valor) => {
    if (campo.includes('.')) {
      const [padre, hijo] = campo.split('.');
      setProyecto(prev => ({
        ...prev,
        [padre]: {
          ...prev[padre],
          [hijo]: valor
        }
      }));
    } else if (campo.includes('direccion.')) {
      const subcampo = campo.replace('direccion.', '');
      setProyecto(prev => ({
        ...prev,
        cliente: {
          ...prev.cliente,
          direccion: {
            ...prev.cliente.direccion,
            [subcampo]: valor
          }
        }
      }));
    } else {
      setProyecto(prev => ({
        ...prev,
        [campo]: valor
      }));
    }
  };

  const validarPaso = (paso) => {
    switch (paso) {
      case 0: // Información del cliente
        return proyecto.cliente.nombre.trim() && proyecto.cliente.telefono.trim();
      case 1: // Detalles del proyecto
        return proyecto.descripcion.trim();
      case 2: // Confirmación
        return true;
      default:
        return false;
    }
  };

  const handleSiguientePaso = () => {
    if (validarPaso(pasoActual)) {
      setPasoActual(prev => prev + 1);
    }
  };

  const handlePasoAnterior = () => {
    setPasoActual(prev => prev - 1);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      if (esEdicion) {
        await proyectosApi.actualizar(id, proyecto);
      } else {
        await proyectosApi.crear(proyecto);
      }

      navigate('/proyectos');
    } catch (error) {
      console.error('Error guardando proyecto:', error);
      setError(error.response?.data?.message || 'Error guardando el proyecto');
    } finally {
      setLoading(false);
    }
  };

  const renderPasoCliente = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <PersonIcon /> Información del Cliente
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Nombre completo"
            value={proyecto.cliente.nombre}
            onChange={(e) => handleInputChange('cliente.nombre', e.target.value)}
            required
            InputProps={{
              startAdornment: <PersonIcon sx={{ mr: 1, color: 'action.active' }} />
            }}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Teléfono"
            value={proyecto.cliente.telefono}
            onChange={(e) => handleInputChange('cliente.telefono', e.target.value)}
            required
            InputProps={{
              startAdornment: <PhoneIcon sx={{ mr: 1, color: 'action.active' }} />
            }}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={proyecto.cliente.email}
            onChange={(e) => handleInputChange('cliente.email', e.target.value)}
            InputProps={{
              startAdornment: <EmailIcon sx={{ mr: 1, color: 'action.active' }} />
            }}
          />
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationIcon /> Dirección
          </Typography>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <TextField
            fullWidth
            label="Calle y número"
            value={proyecto.cliente.direccion.calle}
            onChange={(e) => handleInputChange('direccion.calle', e.target.value)}
          />
        </Grid>
        
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Código postal"
            value={proyecto.cliente.direccion.codigoPostal}
            onChange={(e) => handleInputChange('direccion.codigoPostal', e.target.value)}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Colonia"
            value={proyecto.cliente.direccion.colonia}
            onChange={(e) => handleInputChange('direccion.colonia', e.target.value)}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Ciudad"
            value={proyecto.cliente.direccion.ciudad}
            onChange={(e) => handleInputChange('direccion.ciudad', e.target.value)}
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Referencias adicionales"
            multiline
            rows={2}
            value={proyecto.cliente.direccion.referencias}
            onChange={(e) => handleInputChange('direccion.referencias', e.target.value)}
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderPasoProyecto = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <BusinessIcon /> Detalles del Proyecto
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Descripción del proyecto"
            multiline
            rows={3}
            value={proyecto.descripcion}
            onChange={(e) => handleInputChange('descripcion', e.target.value)}
            required
            placeholder="Describe brevemente el proyecto (ej: Instalación de persianas en sala y recámaras)"
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            select
            label="Tipo de proyecto"
            value={proyecto.tipoProyecto}
            onChange={(e) => handleInputChange('tipoProyecto', e.target.value)}
            SelectProps={{ native: true }}
          >
            <option value="persianas">Persianas</option>
            <option value="cortinas">Cortinas</option>
            <option value="toldos">Toldos</option>
            <option value="proteccion_solar">Protección Solar</option>
            <option value="mixto">Mixto</option>
            <option value="otro">Otro</option>
          </TextField>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            select
            label="Prioridad"
            value={proyecto.prioridad}
            onChange={(e) => handleInputChange('prioridad', e.target.value)}
            SelectProps={{ native: true }}
          >
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
            <option value="urgente">Urgente</option>
          </TextField>
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Observaciones adicionales"
            multiline
            rows={3}
            value={proyecto.observaciones}
            onChange={(e) => handleInputChange('observaciones', e.target.value)}
            placeholder="Cualquier información adicional relevante para el proyecto"
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderPasoConfirmacion = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Confirmar Información del Proyecto
      </Typography>
      
      <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
        <Typography variant="subtitle1" gutterBottom>
          <strong>Cliente:</strong> {proyecto.cliente.nombre}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          📞 {proyecto.cliente.telefono}
          {proyecto.cliente.email && ` • ✉️ ${proyecto.cliente.email}`}
        </Typography>
        {proyecto.cliente.direccion.calle && (
          <Typography variant="body2" color="text.secondary">
            📍 {proyecto.cliente.direccion.calle}, {proyecto.cliente.direccion.colonia}, {proyecto.cliente.direccion.ciudad}
          </Typography>
        )}
      </Paper>
      
      <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
        <Typography variant="subtitle1" gutterBottom>
          <strong>Proyecto:</strong> {proyecto.descripcion}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          🏷️ Tipo: {proyecto.tipoProyecto} • ⚡ Prioridad: {proyecto.prioridad}
        </Typography>
        {proyecto.observaciones && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            📝 {proyecto.observaciones}
          </Typography>
        )}
      </Paper>
    </Box>
  );

  if (loading && esEdicion) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/proyectos')}
          sx={{ mr: 2 }}
        >
          Volver
        </Button>
        <Typography variant="h4" component="h1">
          {esEdicion ? 'Editar Proyecto' : 'Nuevo Proyecto'}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Stepper activeStep={pasoActual} orientation="vertical">
            {PASOS_CREACION.map((paso, index) => (
              <Step key={paso.label}>
                <StepLabel>
                  <Typography variant="h6">{paso.label}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {paso.description}
                  </Typography>
                </StepLabel>
                <StepContent>
                  <Box sx={{ mb: 2 }}>
                    {index === 0 && renderPasoCliente()}
                    {index === 1 && renderPasoProyecto()}
                    {index === 2 && renderPasoConfirmacion()}
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {index > 0 && (
                      <Button onClick={handlePasoAnterior}>
                        Anterior
                      </Button>
                    )}
                    
                    {index < PASOS_CREACION.length - 1 ? (
                      <Button
                        variant="contained"
                        onClick={handleSiguientePaso}
                        disabled={!validarPaso(index)}
                      >
                        Siguiente
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleSubmit}
                        disabled={loading}
                      >
                        {loading ? <CircularProgress size={20} /> : (esEdicion ? 'Actualizar' : 'Crear Proyecto')}
                      </Button>
                    )}
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ProyectoForm;

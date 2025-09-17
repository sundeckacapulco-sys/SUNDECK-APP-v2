import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Phone,
  Email,
  LocationOn,
  Assignment,
  Add,
  Note,
  Schedule,
  TrendingUp,
  WhatsApp,
  Message,
  SmartToy,
  Save
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import axiosConfig from '../../config/axios';

const ProspectoDetail = () => {
  const [prospecto, setProspecto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openNota, setOpenNota] = useState(false);
  const [openEtapa, setOpenEtapa] = useState(false);
  const [nuevaNota, setNuevaNota] = useState('');
  const [nuevaEtapa, setNuevaEtapa] = useState('');
  const [motivoCambio, setMotivoCambio] = useState('');
  const [error, setError] = useState('');
  const [openPlantillas, setOpenPlantillas] = useState(false);
  const [plantillas, setPlantillas] = useState([]);
  const [mensajePersonalizado, setMensajePersonalizado] = useState('');
  const [nombrePlantilla, setNombrePlantilla] = useState('');
  const [descripcionPlantilla, setDescripcionPlantilla] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);

  const navigate = useNavigate();
  const { id } = useParams();

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

  useEffect(() => {
    fetchProspecto();
    fetchPlantillas();
  }, [id]);

  const fetchProspecto = async () => {
    try {
      setLoading(true);
      const response = await axiosConfig.get(`/prospectos/${id}`);
      setProspecto(response.data);
    } catch (error) {
      setError('Error cargando el prospecto');
    } finally {
      setLoading(false);
    }
  };

  const handleAgregarNota = async () => {
    try {
      await axiosConfig.post(`/prospectos/${id}/notas`, {
        contenido: nuevaNota,
        tipo: 'nota'
      });
      setNuevaNota('');
      setOpenNota(false);
      fetchProspecto();
    } catch (error) {
      setError('Error agregando nota');
    }
  };

  const handleCambiarEtapa = async () => {
    try {
      await axiosConfig.put(`/prospectos/${id}/etapa`, {
        etapa: nuevaEtapa,
        motivo: motivoCambio
      });
      setNuevaEtapa('');
      setMotivoCambio('');
      setOpenEtapa(false);
      fetchProspecto();
    } catch (error) {
      setError('Error cambiando etapa');
    }
  };

  const getEtapaInfo = (etapa) => {
    return etapas.find(e => e.value === etapa) || etapas[0];
  };

  const fetchPlantillas = async () => {
    try {
      const response = await axiosConfig.get('/plantillas');
      setPlantillas(response.data);
    } catch (error) {
      console.error('Error fetching plantillas:', error);
    }
  };

  const reemplazarVariables = (texto) => {
    if (!prospecto) return texto;
    
    const variables = {
      '{nombre}': prospecto.nombre || '',
      '{telefono}': prospecto.telefono || '',
      '{producto}': prospecto.producto || '',
      '{fecha}': prospecto.fechaCita ? new Date(prospecto.fechaCita).toLocaleDateString() : new Date().toLocaleDateString(),
      '{hora}': prospecto.horaCita || ''
    };
    
    let textoReemplazado = texto;
    Object.entries(variables).forEach(([variable, valor]) => {
      textoReemplazado = textoReemplazado.replace(new RegExp(variable, 'g'), valor);
    });
    
    return textoReemplazado;
  };

  const abrirWhatsApp = (mensaje = '') => {
    const telefono = prospecto.telefono.replace(/[^0-9]/g, '');
    const mensajeDefault = `Hola ${prospecto.nombre}, gracias por tu interés en Sundeck.`;
    const mensajeFinal = mensaje || mensajeDefault;
    const url = `https://wa.me/52${telefono}?text=${encodeURIComponent(mensajeFinal)}`;
    window.open(url, '_blank');
  };

  const seleccionarPlantilla = (plantilla) => {
    const mensajeReemplazado = reemplazarVariables(plantilla.texto);
    abrirWhatsApp(mensajeReemplazado);
    setOpenPlantillas(false);
  };

  const sugerirMensajeAI = async () => {
    try {
      setLoadingAI(true);
      const response = await axiosConfig.post('/ai/message-suggestion', {
        nombre: prospecto.nombre,
        producto: prospecto.producto,
        etapa: prospecto.etapa,
        descripcionNecesidad: prospecto.descripcionNecesidad
      });
      setMensajePersonalizado(response.data.mensaje);
    } catch (error) {
      console.error('Error getting AI suggestion:', error);
      setError('Error obteniendo sugerencia de IA');
    } finally {
      setLoadingAI(false);
    }
  };

  const guardarPlantilla = async () => {
    try {
      await axiosConfig.post('/plantillas', {
        nombre: nombrePlantilla,
        descripcion: descripcionPlantilla,
        texto: mensajePersonalizado
      });
      setNombrePlantilla('');
      setDescripcionPlantilla('');
      setMensajePersonalizado('');
      fetchPlantillas();
      setError('');
    } catch (error) {
      setError('Error guardando plantilla');
    }
  };

  if (loading) {
    return <Typography>Cargando...</Typography>;
  }

  if (!prospecto) {
    return <Typography>Prospecto no encontrado</Typography>;
  }

  const etapaInfo = getEtapaInfo(prospecto.etapa);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/prospectos')}
            sx={{ mr: 2 }}
          >
            Volver
          </Button>
          <Typography variant="h4" component="h1">
            {prospecto.nombre}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Edit />}
          onClick={() => navigate(`/prospectos/${id}/editar`)}
        >
          Editar
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Información Principal */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Información del Cliente
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Phone sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography>{prospecto.telefono}</Typography>
                  </Box>
                  {prospecto.email && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Email sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography>{prospecto.email}</Typography>
                    </Box>
                  )}
                </Grid>
                
                <Grid item xs={12} md={6}>
                  {prospecto.direccion && (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                      <LocationOn sx={{ mr: 1, color: 'primary.main', mt: 0.5 }} />
                      <Box>
                        <Typography variant="body2">
                          {prospecto.direccion.calle}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {prospecto.direccion.colonia}, {prospecto.direccion.ciudad}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          CP: {prospecto.direccion.codigoPostal}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Información del Producto */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Información del Producto
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Tipo de Producto
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {prospecto.tipoProducto}
                  </Typography>
                  
                  <Typography variant="subtitle2" color="text.secondary">
                    Producto Específico
                  </Typography>
                  <Typography variant="body1">
                    {prospecto.producto}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  {prospecto.presupuestoEstimado && (
                    <>
                      <Typography variant="subtitle2" color="text.secondary">
                        Presupuesto Estimado
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        ${prospecto.presupuestoEstimado.toLocaleString()}
                      </Typography>
                    </>
                  )}
                </Grid>
                
                {prospecto.descripcionNecesidad && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Descripción de la Necesidad
                    </Typography>
                    <Typography variant="body1">
                      {prospecto.descripcionNecesidad}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* Notas y Seguimiento */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Notas y Seguimiento
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={() => setOpenNota(true)}
                >
                  Agregar Nota
                </Button>
              </Box>
              
              <List>
                {prospecto.notas && prospecto.notas.length > 0 ? (
                  prospecto.notas.map((nota, index) => (
                    <ListItem key={index} divider>
                      <ListItemIcon>
                        <Note />
                      </ListItemIcon>
                      <ListItemText
                        primary={nota.contenido}
                        secondary={
                          <Box>
                            <Typography variant="caption">
                              {nota.usuario?.nombre} - {new Date(nota.fecha).toLocaleString()}
                            </Typography>
                            <Chip
                              label={nota.tipo}
                              size="small"
                              sx={{ ml: 1 }}
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText primary="No hay notas registradas" />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Panel Lateral */}
        <Grid item xs={12} md={4}>
          {/* Estado y Etapa */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Estado del Prospecto
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Etapa Actual
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Chip
                    label={etapaInfo.label}
                    color={etapaInfo.color}
                  />
                  <Button
                    size="small"
                    startIcon={<TrendingUp />}
                    onClick={() => setOpenEtapa(true)}
                  >
                    Cambiar
                  </Button>
                </Box>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Prioridad
                </Typography>
                <Chip
                  label={prospecto.prioridad}
                  color={prospecto.prioridad === 'alta' ? 'warning' : 'default'}
                  variant="outlined"
                />
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Fuente
                </Typography>
                <Typography variant="body2">
                  {prospecto.fuente}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" color="text.secondary">
                Fechas Importantes
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Creado: {new Date(prospecto.createdAt).toLocaleDateString()}
              </Typography>
              {prospecto.fechaUltimoContacto && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Último contacto: {new Date(prospecto.fechaUltimoContacto).toLocaleDateString()}
                </Typography>
              )}
              {prospecto.fechaCita && (
                <Typography variant="body2">
                  Cita programada: {new Date(prospecto.fechaCita).toLocaleDateString()} {prospecto.horaCita}
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Acciones Rápidas */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Acciones Rápidas
              </Typography>
              
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Assignment />}
                sx={{ mb: 1 }}
                onClick={() => navigate(`/cotizaciones/nueva?prospecto=${id}`)}
              >
                Crear Cotización
              </Button>
              
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Schedule />}
                sx={{ mb: 1 }}
              >
                Agendar Cita
              </Button>
              
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Phone />}
                sx={{ mb: 1 }}
              >
                Registrar Llamada
              </Button>
              
              <Button
                fullWidth
                variant="contained"
                startIcon={<WhatsApp />}
                sx={{ mb: 1, bgcolor: '#25D366', '&:hover': { bgcolor: '#1da851' } }}
                onClick={() => abrirWhatsApp()}
              >
                Enviar WhatsApp
              </Button>
              
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Message />}
                onClick={() => setOpenPlantillas(true)}
              >
                Enviar con Plantilla
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dialog para agregar nota */}
      <Dialog open={openNota} onClose={() => setOpenNota(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Agregar Nota</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Contenido de la nota"
            value={nuevaNota}
            onChange={(e) => setNuevaNota(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNota(false)}>Cancelar</Button>
          <Button onClick={handleAgregarNota} variant="contained">
            Agregar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para cambiar etapa */}
      <Dialog open={openEtapa} onClose={() => setOpenEtapa(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cambiar Etapa</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1, mb: 2 }}>
            <InputLabel>Nueva Etapa</InputLabel>
            <Select
              value={nuevaEtapa}
              label="Nueva Etapa"
              onChange={(e) => setNuevaEtapa(e.target.value)}
            >
              {etapas.map(etapa => (
                <MenuItem key={etapa.value} value={etapa.value}>
                  {etapa.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            label="Motivo del cambio (opcional)"
            value={motivoCambio}
            onChange={(e) => setMotivoCambio(e.target.value)}
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEtapa(false)}>Cancelar</Button>
          <Button onClick={handleCambiarEtapa} variant="contained">
            Cambiar Etapa
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para plantillas de WhatsApp */}
      <Dialog open={openPlantillas} onClose={() => setOpenPlantillas(false)} maxWidth="md" fullWidth>
        <DialogTitle>Plantillas de WhatsApp</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            {/* Lista de plantillas */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Plantillas Guardadas
              </Typography>
              {plantillas.length > 0 ? (
                plantillas.map((plantilla) => (
                  <Card key={plantilla._id} sx={{ mb: 2, cursor: 'pointer' }} onClick={() => seleccionarPlantilla(plantilla)}>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        {plantilla.nombre}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {plantilla.descripcion}
                      </Typography>
                      <Typography variant="body2" sx={{ fontStyle: 'italic', mb: 2 }}>
                        {reemplazarVariables(plantilla.texto).substring(0, 100)}...
                      </Typography>
                      <Button size="small" variant="contained">
                        Seleccionar
                      </Button>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Typography color="text.secondary">
                  No hay plantillas guardadas
                </Typography>
              )}
            </Grid>
            
            {/* Mensaje personalizado */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Mensaje Personalizado
              </Typography>
              
              <Button
                variant="outlined"
                startIcon={<SmartToy />}
                onClick={sugerirMensajeAI}
                disabled={loadingAI}
                sx={{ mb: 2 }}
              >
                {loadingAI ? 'Generando...' : 'Sugerir Mensaje AI'}
              </Button>
              
              <TextField
                fullWidth
                multiline
                rows={6}
                label="Mensaje personalizado"
                value={mensajePersonalizado}
                onChange={(e) => setMensajePersonalizado(e.target.value)}
                sx={{ mb: 2 }}
                helperText="Variables disponibles: {nombre}, {telefono}, {producto}, {fecha}, {hora}"
              />
              
              {mensajePersonalizado && (
                <>
                  <Typography variant="subtitle2" gutterBottom>
                    Vista previa:
                  </Typography>
                  <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1, mb: 2 }}>
                    <Typography variant="body2">
                      {reemplazarVariables(mensajePersonalizado)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Button
                      variant="contained"
                      startIcon={<WhatsApp />}
                      onClick={() => {
                        abrirWhatsApp(reemplazarVariables(mensajePersonalizado));
                        setOpenPlantillas(false);
                      }}
                      sx={{ bgcolor: '#25D366', '&:hover': { bgcolor: '#1da851' } }}
                    >
                      Enviar por WhatsApp
                    </Button>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Guardar como Plantilla
                  </Typography>
                  <TextField
                    fullWidth
                    label="Nombre de la plantilla"
                    value={nombrePlantilla}
                    onChange={(e) => setNombrePlantilla(e.target.value)}
                    sx={{ mb: 1 }}
                  />
                  <TextField
                    fullWidth
                    label="Descripción"
                    value={descripcionPlantilla}
                    onChange={(e) => setDescripcionPlantilla(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  <Button
                    variant="outlined"
                    startIcon={<Save />}
                    onClick={guardarPlantilla}
                    disabled={!nombrePlantilla || !mensajePersonalizado}
                  >
                    Guardar Plantilla
                  </Button>
                </>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPlantillas(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProspectoDetail;

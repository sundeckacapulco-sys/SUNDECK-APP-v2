import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography
} from '@mui/material';
import {
  ArrowBack,
  Comment,
  Email,
  Event,
  LocationOn,
  Phone,
  WhatsApp
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import axiosConfig from '../../config/axios';
import AgregarEtapaModal from './AgregarEtapaModal';

const etapaLabels = {
  nuevo: 'Nuevo',
  contactado: 'Contactado',
  cita_agendada: 'Cita agendada',
  cotizacion: 'Cotización',
  pedido: 'Pedido',
  fabricacion: 'Fabricación',
  instalacion: 'Instalación',
  entregado: 'Entregado',
  postventa: 'Postventa',
  perdido: 'Perdido'
};

const etapaColors = {
  nuevo: 'default',
  contactado: 'info',
  cita_agendada: 'secondary',
  cotizacion: 'warning',
  pedido: 'primary',
  fabricacion: 'success',
  instalacion: 'success',
  entregado: 'success',
  postventa: 'success',
  perdido: 'error'
};

const prioridadLabels = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
  urgente: 'Urgente'
};

const prioridadColors = {
  baja: 'default',
  media: 'info',
  alta: 'warning',
  urgente: 'error'
};

const tipoProductoLabels = {
  ventana: 'Ventana',
  puerta: 'Puerta',
  cancel: 'Cancel',
  domo: 'Domo',
  otro: 'Otro'
};

const pipelineOrder = [
  'nuevo',
  'contactado',
  'cita_agendada',
  'cotizacion',
  'pedido',
  'fabricacion',
  'instalacion',
  'entregado',
  'postventa',
  'perdido'
];

const timelineSteps = [
  { id: 'visita', label: 'Visita', etapaClave: 'cita_agendada' },
  { id: 'cotizacion', label: 'Cotización', etapaClave: 'cotizacion' },
  { id: 'pedido', label: 'Pedido', etapaClave: 'pedido' },
  { id: 'fabricacion', label: 'Fabricación', etapaClave: 'fabricacion' },
  { id: 'instalacion', label: 'Instalación', etapaClave: 'instalacion' },
  { id: 'postventa', label: 'Postventa', etapaClave: 'postventa' }
];

const ProspectoDetalle = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [prospecto, setProspecto] = useState(null);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loadingProspecto, setLoadingProspecto] = useState(true);
  const [loadingCotizaciones, setLoadingCotizaciones] = useState(false);
  const [error, setError] = useState('');

  const [openComentario, setOpenComentario] = useState(false);
  const [openReagendar, setOpenReagendar] = useState(false);
  const [comentario, setComentario] = useState('');
  const [savingComentario, setSavingComentario] = useState(false);
  const [reagendarFecha, setReagendarFecha] = useState('');
  const [reagendarHora, setReagendarHora] = useState('');
  const [savingReagendar, setSavingReagendar] = useState(false);
  const [openAgregarEtapa, setOpenAgregarEtapa] = useState(false);
  const [mensajeEtapa, setMensajeEtapa] = useState('');
  const [errorEtapa, setErrorEtapa] = useState('');

  const fetchProspecto = async () => {
    try {
      setLoadingProspecto(true);
      setError('');
      const { data } = await axiosConfig.get(`/prospectos/${id}`);
      setProspecto(data);
      setReagendarFecha(data.fechaCita ? new Date(data.fechaCita).toISOString().slice(0, 10) : '');
      setReagendarHora(data.horaCita || '');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar el prospecto');
    } finally {
      setLoadingProspecto(false);
    }
  };

  const fetchCotizaciones = async () => {
    try {
      setLoadingCotizaciones(true);
      const { data } = await axiosConfig.get(`/cotizaciones?prospecto=${id}&page=1&limit=50`);
      setCotizaciones(data.docs || []);
    } catch (err) {
      console.error('Error cargando cotizaciones:', err);
    } finally {
      setLoadingCotizaciones(false);
    }
  };

  useEffect(() => {
    fetchProspecto();
    fetchCotizaciones();
  }, [id]);

  const direccionTexto = useMemo(() => {
    if (!prospecto?.direccion) return 'Sin dirección registrada';
    const partes = [
      prospecto.direccion.calle,
      prospecto.direccion.colonia,
      prospecto.direccion.ciudad,
      prospecto.direccion.codigoPostal ? `CP ${prospecto.direccion.codigoPostal}` : null
    ].filter(Boolean);

    return partes.length > 0 ? partes.join(', ') : 'Sin dirección registrada';
  }, [prospecto]);

  const contactoPrincipal = useMemo(() => {
    if (!prospecto) return 'Sin definir';
    if (prospecto.contacto) {
      if (typeof prospecto.contacto === 'string') {
        return prospecto.contacto;
      }
      return prospecto.contacto.nombre || prospecto.contacto.email || 'Sin definir';
    }
    return prospecto.nombre;
  }, [prospecto]);

  const comentariosSupervision = useMemo(() => {
    if (!prospecto?.notas) return [];
    return prospecto.notas.filter((nota) => nota.tipo === 'nota' || nota.tipo === 'comentario');
  }, [prospecto]);

  const medidasTexto = useMemo(() => {
    if (!prospecto) return 'Sin registrar';
    const medidasDirectas = prospecto.medidas || prospecto.detallesProducto?.medidas;

    if (medidasDirectas?.ancho || medidasDirectas?.alto) {
      const ancho = medidasDirectas.ancho ? `${medidasDirectas.ancho}m` : '-';
      const alto = medidasDirectas.alto ? `${medidasDirectas.alto}m` : '-';
      return `${ancho} x ${alto}`;
    }

    if (Array.isArray(prospecto.mediciones) && prospecto.mediciones.length > 0) {
      const medicion = prospecto.mediciones[0];
      const ancho = medicion.ancho || medicion.medidas?.ancho;
      const alto = medicion.alto || medicion.medidas?.alto;
      if (ancho || alto) {
        const anchoTexto = ancho ? `${ancho}m` : '-';
        const altoTexto = alto ? `${alto}m` : '-';
        return `${anchoTexto} x ${altoTexto}`;
      }
    }

    return 'Sin registrar';
  }, [prospecto]);

  const etapaActualIndex = useMemo(() => {
    if (!prospecto?.etapa) return -1;
    return pipelineOrder.indexOf(prospecto.etapa);
  }, [prospecto]);

  const activeTimelineStep = useMemo(() => {
    if (etapaActualIndex === -1) return 0;
    let lastCompleted = -1;
    timelineSteps.forEach((step, index) => {
      const stepIndex = pipelineOrder.indexOf(step.etapaClave);
      if (stepIndex !== -1 && etapaActualIndex >= stepIndex) {
        lastCompleted = index;
      }
    });
    return lastCompleted === -1 ? 0 : lastCompleted;
  }, [etapaActualIndex]);

  const abrirWhatsApp = () => {
    if (!prospecto?.telefono) {
      setError('El prospecto no tiene un teléfono registrado para WhatsApp');
      return;
    }

    const telefono = prospecto.telefono.replace(/[^0-9]/g, '');
    if (!telefono) {
      setError('El teléfono del prospecto no es válido para WhatsApp');
      return;
    }

    const mensaje = `Hola ${prospecto.nombre}, te saluda el equipo de Sundeck.`;
    const url = `https://wa.me/52${telefono}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleAgregarComentario = async () => {
    if (!comentario.trim()) return;

    try {
      setSavingComentario(true);
      setError('');
      await axiosConfig.post(`/prospectos/${id}/notas`, {
        contenido: comentario,
        tipo: 'nota'
      });
      setComentario('');
      setOpenComentario(false);
      fetchProspecto();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al agregar el comentario');
    } finally {
      setSavingComentario(false);
    }
  };

  const handleReagendarCita = async () => {
    try {
      setSavingReagendar(true);
      setError('');
      const fechaISO = reagendarFecha ? new Date(reagendarFecha).toISOString() : null;
      await axiosConfig.put(`/prospectos/${id}`, {
        fechaCita: fechaISO,
        horaCita: reagendarHora,
        estadoCita: reagendarFecha ? 'reagendada' : prospecto?.estadoCita
      });
      setOpenReagendar(false);
      fetchProspecto();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al reagendar la cita');
    } finally {
      setSavingReagendar(false);
    }
  };

  if (loadingProspecto) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!prospecto) {
    return (
      <Box>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Typography>Prospecto no encontrado</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/prospectos')} sx={{ mr: 2 }}>
            Volver
          </Button>
          <Typography variant="h4" component="h1">
            {prospecto.nombre}
          </Typography>
        </Box>
        <Button variant="contained" onClick={() => navigate(`/prospectos/${id}/editar`)}>
          Editar
        </Button>
      </Box>

      {(error || errorEtapa) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorEtapa || error}
        </Alert>
      )}
      {mensajeEtapa && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setMensajeEtapa('')}>
          {mensajeEtapa}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Información General
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Cliente
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {prospecto.nombre}
                  </Typography>

                  <Typography variant="subtitle2" color="text.secondary">
                    Contacto
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {contactoPrincipal}
                  </Typography>

                  <Typography variant="subtitle2" color="text.secondary">
                    Email
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Email fontSize="small" color="primary" />
                    <Typography variant="body1">
                      {prospecto.email || 'Sin correo registrado'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Teléfono
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Phone fontSize="small" color="primary" />
                    <Typography variant="body1">
                      {prospecto.telefono}
                    </Typography>
                  </Box>

                  <Typography variant="subtitle2" color="text.secondary">
                    Dirección
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <LocationOn fontSize="small" color="primary" sx={{ mt: 0.5 }} />
                    <Typography variant="body1">
                      {direccionTexto}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Producto / Servicio
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Tipo
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {prospecto.tipoProducto
                      ? tipoProductoLabels[prospecto.tipoProducto] || prospecto.tipoProducto
                      : 'No especificado'}
                  </Typography>

                  <Typography variant="subtitle2" color="text.secondary">
                    Producto
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {prospecto.producto || 'No especificado'}
                  </Typography>

                  <Typography variant="subtitle2" color="text.secondary">
                    Variante
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {prospecto.productoVariante || prospecto.detallesProducto?.variante || 'No especificado'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Medidas
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {medidasTexto}
                  </Typography>

                  <Typography variant="subtitle2" color="text.secondary">
                    Observaciones
                  </Typography>
                  <Typography variant="body1">
                    {prospecto.descripcionNecesidad || prospecto.observaciones || 'Sin observaciones'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Historial de cotizaciones
              </Typography>
              {loadingCotizaciones ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : cotizaciones.length > 0 ? (
                <List>
                  {cotizaciones.map((cotizacion) => (
                    <ListItem
                      key={cotizacion._id}
                      divider
                      secondaryAction={
                        <Button size="small" onClick={() => navigate(`/cotizaciones/${cotizacion._id}`)}>
                          Ver
                        </Button>
                      }
                    >
                      <ListItemText
                        primary={`Cotización ${cotizacion.numero}`}
                        secondary={
                          <>
                            <Typography variant="body2" color="text.secondary">
                              {cotizacion.fecha ? new Date(cotizacion.fecha).toLocaleDateString() : 'Sin fecha'}
                            </Typography>
                            <Typography variant="body2">
                              Estado: {cotizacion.estado}
                            </Typography>
                            {cotizacion.total != null && (
                              <Typography variant="body2">
                                Total: ${cotizacion.total.toLocaleString()}
                              </Typography>
                            )}
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No hay cotizaciones registradas para este prospecto.
                </Typography>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Comentarios de supervisión
              </Typography>
              {comentariosSupervision.length > 0 ? (
                <List>
                  {comentariosSupervision.map((nota, index) => (
                    <ListItem key={nota._id || index} divider>
                      <ListItemText
                        primary={nota.contenido}
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {nota.usuario?.nombre ? `${nota.usuario.nombre} ${nota.usuario.apellido || ''} - ` : ''}
                            {new Date(nota.fecha).toLocaleString()}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No hay comentarios registrados.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Etapa y prioridad
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Etapa actual
                  </Typography>
                  <Chip
                    label={etapaLabels[prospecto.etapa] || 'Sin etapa'}
                    color={etapaColors[prospecto.etapa] || 'default'}
                    sx={{ mt: 0.5 }}
                  />
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Prioridad
                  </Typography>
                  <Chip
                    label={prioridadLabels[prospecto.prioridad] || 'Sin definir'}
                    color={prioridadColors[prospecto.prioridad] || 'default'}
                    variant="outlined"
                    sx={{ mt: 0.5 }}
                  />
                </Box>

                <Divider sx={{ my: 1 }} />

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Próxima cita
                  </Typography>
                  <Typography variant="body2">
                    {prospecto.fechaCita
                      ? `${new Date(prospecto.fechaCita).toLocaleDateString()}${prospecto.horaCita ? ` · ${prospecto.horaCita}` : ''}`
                      : 'Sin cita programada'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Fuente
                  </Typography>
                  <Typography variant="body2">{prospecto.fuente || 'Sin especificar'}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Timeline de etapas
              </Typography>
              <Stepper activeStep={activeTimelineStep} alternativeLabel>
                {timelineSteps.map((step) => {
                  const stepIndex = pipelineOrder.indexOf(step.etapaClave);
                  const completed = etapaActualIndex !== -1 && stepIndex !== -1 && etapaActualIndex >= stepIndex;
                  return (
                    <Step key={step.id} completed={completed}>
                      <StepLabel>{step.label}</StepLabel>
                    </Step>
                  );
                })}
              </Stepper>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Acciones rápidas
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Button variant="outlined" startIcon={<Event />} onClick={() => setOpenReagendar(true)}>
                  Reagendar cita
                </Button>
                <Button
                  variant="contained"
                  onClick={() => {
                    setErrorEtapa('');
                    setOpenAgregarEtapa(true);
                  }}
                  sx={{
                    backgroundColor: '#D4AF37',
                    color: '#111827',
                    fontWeight: 600,
                    '&:hover': { backgroundColor: '#b8962d' }
                  }}
                  disabled={!prospecto}
                >
                  Agregar etapa
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<WhatsApp />}
                  onClick={abrirWhatsApp}
                >
                  Abrir en WhatsApp
                </Button>
                <Button variant="outlined" startIcon={<Comment />} onClick={() => setOpenComentario(true)}>
                  Agregar comentario
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={openComentario} onClose={() => setOpenComentario(false)} fullWidth maxWidth="sm">
        <DialogTitle>Agregar comentario</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Comentario"
            fullWidth
            multiline
            minRows={3}
            value={comentario}
            onChange={(event) => setComentario(event.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenComentario(false)}>Cancelar</Button>
          <Button onClick={handleAgregarComentario} disabled={savingComentario || !comentario.trim()}>
            {savingComentario ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openReagendar} onClose={() => setOpenReagendar(false)} fullWidth maxWidth="xs">
        <DialogTitle>Reagendar cita</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Fecha"
            type="date"
            fullWidth
            value={reagendarFecha}
            onChange={(event) => setReagendarFecha(event.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Hora"
            type="time"
            fullWidth
            value={reagendarHora}
            onChange={(event) => setReagendarHora(event.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReagendar(false)}>Cancelar</Button>
          <Button onClick={handleReagendarCita} disabled={savingReagendar}>
            {savingReagendar ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      <AgregarEtapaModal
        open={openAgregarEtapa}
        onClose={() => setOpenAgregarEtapa(false)}
        prospectoId={prospecto?._id}
        onSaved={(mensaje) => {
          setMensajeEtapa(mensaje);
          setErrorEtapa('');
        }}
        onError={(mensaje) => {
          setMensajeEtapa('');
          setErrorEtapa(mensaje);
        }}
      />
    </Box>
  );
};

export default ProspectoDetalle;

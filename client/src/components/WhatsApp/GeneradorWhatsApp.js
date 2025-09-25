import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Box,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  ButtonGroup,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  WhatsApp,
  ContentCopy,
  Refresh,
  Star,
  StarBorder,
  TrendingUp,
  Send,
  Close,
  History,
  ThumbUp,
  ThumbDown
} from '@mui/icons-material';
import axiosConfig from '../../config/axios';

const GeneradorWhatsApp = ({ open, onClose, contexto, datosCliente, onMensajeGenerado }) => {
  const [plantillas, setPlantillas] = useState([]);
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState(null);
  const [mensajeGenerado, setMensajeGenerado] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [estilo, setEstilo] = useState('formal_profesional');
  const [trackingId, setTrackingId] = useState(null);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);

  const estilos = [
    { value: 'formal_profesional', label: '🎩 Formal-Profesional', description: 'Para confirmaciones, cobros y documentación' },
    { value: 'breve_persuasivo', label: '⚡ Breve-Persuasivo', description: 'Para seguimiento y recordatorios' }
  ];

  const contextos = {
    cotizacion_enviada: { 
      nombre: 'Cotización Enviada', 
      icon: '📋',
      descripcion: 'Confirmación de cotización enviada al cliente'
    },
    seguimiento_cotizacion: { 
      nombre: 'Seguimiento Cotización', 
      icon: '📞',
      descripcion: 'Cliente no ha respondido a la cotización'
    },
    cotizacion_vencimiento: { 
      nombre: 'Cotización por Vencer', 
      icon: '⏰',
      descripcion: 'Recordatorio antes del vencimiento'
    },
    anticipo_confirmado: { 
      nombre: 'Anticipo Confirmado', 
      icon: '💰',
      descripcion: 'Confirmación de anticipo recibido'
    },
    fabricacion_iniciada: { 
      nombre: 'Fabricación Iniciada', 
      icon: '🔨',
      descripcion: 'Notificación de inicio de fabricación'
    },
    producto_terminado: { 
      nombre: 'Producto Terminado', 
      icon: '✅',
      descripcion: 'Producto listo para instalación'
    },
    instalacion_programada: { 
      nombre: 'Instalación Programada', 
      icon: '🏠',
      descripcion: 'Coordinar fecha de instalación'
    },
    cobranza_saldo: { 
      nombre: 'Cobranza Saldo', 
      icon: '💳',
      descripcion: 'Recordatorio de saldo pendiente'
    },
    post_instalacion: { 
      nombre: 'Post Instalación', 
      icon: '🎉',
      descripcion: 'Seguimiento después de instalación'
    },
    fidelizacion: { 
      nombre: 'Fidelización', 
      icon: '❤️',
      descripcion: 'Mensajes promocionales y de fidelización'
    }
  };

  useEffect(() => {
    if (open && contexto) {
      cargarPlantillas();
    }
  }, [open, contexto, estilo]);

  const cargarPlantillas = async () => {
    try {
      setLoading(true);
      const response = await axiosConfig.get(`/plantillas-whatsapp/categoria/${contexto}`, {
        params: { estilo }
      });
      setPlantillas(response.data);
      
      // Seleccionar la primera plantilla por defecto
      if (response.data.length > 0) {
        setPlantillaSeleccionada(response.data[0]);
      }
    } catch (error) {
      console.error('Error cargando plantillas:', error);
      setError('Error cargando plantillas disponibles');
    } finally {
      setLoading(false);
    }
  };

  const generarMensaje = async (plantilla = plantillaSeleccionada) => {
    if (!plantilla) {
      setError('Selecciona una plantilla');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const datos = {
        prospecto_id: datosCliente._id,
        etapa_prospecto: datosCliente.etapa,
        nombre: datosCliente.nombre,
        telefono: datosCliente.telefono,
        email: datosCliente.email,
        // Datos específicos según el contexto
        ...obtenerDatosContexto()
      };

      const response = await axiosConfig.post(`/plantillas-whatsapp/${plantilla._id}/generar`, {
        datos
      });

      setMensajeGenerado(response.data.mensaje);
      setTrackingId(response.data.tracking_id);
      setSuccess('Mensaje generado exitosamente');
    } catch (error) {
      console.error('Error generando mensaje:', error);
      setError(error.response?.data?.message || 'Error generando mensaje');
    } finally {
      setLoading(false);
    }
  };

  const obtenerDatosContexto = () => {
    const datos = {};
    
    // Agregar datos específicos según el contexto
    switch (contexto) {
      case 'cotizacion_enviada':
        datos.numero_cotizacion = datosCliente.cotizaciones?.[0]?.numero || 'COT-001';
        datos.total = datosCliente.cotizaciones?.[0]?.total || 0;
        datos.validez = datosCliente.cotizaciones?.[0]?.validoHasta || new Date();
        break;
      case 'anticipo_confirmado':
        datos.monto_anticipo = datosCliente.pedidos?.[0]?.anticipo?.monto || 0;
        datos.fecha_fabricacion = datosCliente.pedidos?.[0]?.fechaInicioFabricacion || new Date();
        break;
      case 'cobranza_saldo':
        datos.saldo_pendiente = datosCliente.pedidos?.[0]?.saldo?.monto || 0;
        datos.fecha_vencimiento = datosCliente.pedidos?.[0]?.saldo?.fechaVencimiento || new Date();
        break;
      default:
        break;
    }
    
    return datos;
  };

  const copiarMensaje = async () => {
    try {
      await navigator.clipboard.writeText(mensajeGenerado);
      setSuccess('Mensaje copiado al portapapeles');
      
      // Registrar que se envió el mensaje
      if (trackingId) {
        await axiosConfig.post('/plantillas-whatsapp/tracking', {
          plantilla_id: plantillaSeleccionada._id,
          prospecto_id: datosCliente._id,
          evento: 'mensaje_enviado'
        });
      }
      
      if (onMensajeGenerado) {
        onMensajeGenerado(mensajeGenerado, plantillaSeleccionada);
      }
    } catch (error) {
      setError('Error copiando mensaje');
    }
  };

  const marcarEfectividad = async (rating) => {
    if (!plantillaSeleccionada || !trackingId) return;

    try {
      const ratingNumerico = {
        'excelente': 5,
        'buena': 4,
        'regular': 3,
        'mala': 2,
        'muy_mala': 1
      }[rating];

      await axiosConfig.post('/plantillas-whatsapp/tracking', {
        plantilla_id: plantillaSeleccionada._id,
        prospecto_id: datosCliente._id,
        evento: 'rating_agregado',
        rating: ratingNumerico
      });

      setSuccess('¡Gracias por tu feedback!');
    } catch (error) {
      console.error('Error registrando rating:', error);
    }
  };

  const contextoInfo = contextos[contexto] || { nombre: contexto, icon: '📱', descripcion: '' };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, maxHeight: '90vh' }
      }}
    >
      <DialogTitle sx={{ 
        bgcolor: '#25D366', 
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <WhatsApp />
        {contextoInfo.icon} Generar WhatsApp - {contextoInfo.nombre}
        <IconButton
          onClick={onClose}
          sx={{ ml: 'auto', color: 'white' }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
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

        {/* Información del cliente */}
        <Card sx={{ mb: 3, bgcolor: '#f8f9fa', border: '2px solid #e3f2fd' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold' }}>
              👤 Cliente: {datosCliente.nombre}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2">
                  <strong>Teléfono:</strong> {datosCliente.telefono}
                </Typography>
                <Typography variant="body2">
                  <strong>Etapa:</strong> {datosCliente.etapa}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2">
                  <strong>Contexto:</strong> {contextoInfo.descripcion}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Grid container spacing={3}>
          {/* Panel de selección */}
          <Grid item xs={12} md={5}>
            <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold' }}>
              🎨 Configuración
            </Typography>

            {/* Selector de estilo */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Estilo del Mensaje</InputLabel>
              <Select
                value={estilo}
                onChange={(e) => setEstilo(e.target.value)}
                label="Estilo del Mensaje"
              >
                {estilos.map((est) => (
                  <MenuItem key={est.value} value={est.value}>
                    <Box>
                      <Typography variant="body1">{est.label}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {est.description}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Lista de plantillas */}
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              📋 Plantillas Disponibles ({plantillas.length})
            </Typography>

            {loading ? (
              <Typography>Cargando plantillas...</Typography>
            ) : plantillas.length === 0 ? (
              <Alert severity="info">
                No hay plantillas disponibles para este contexto y estilo.
              </Alert>
            ) : (
              <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                {plantillas.map((plantilla) => (
                  <ListItem
                    key={plantilla._id}
                    button
                    selected={plantillaSeleccionada?._id === plantilla._id}
                    onClick={() => setPlantillaSeleccionada(plantilla)}
                    sx={{
                      border: '1px solid #e0e0e0',
                      borderRadius: 2,
                      mb: 1,
                      bgcolor: plantillaSeleccionada?._id === plantilla._id ? '#e3f2fd' : 'white'
                    }}
                  >
                    <ListItemText
                      primary={plantilla.nombre}
                      secondary={
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                          <Chip 
                            label={`${plantilla.efectividad}% efectiva`}
                            color={plantilla.efectividad > 70 ? 'success' : plantilla.efectividad > 40 ? 'warning' : 'error'}
                            size="small"
                          />
                          <Chip 
                            label={`⭐ ${plantilla.rating_promedio}`}
                            size="small"
                            variant="outlined"
                          />
                          <Chip 
                            label={`${plantilla.metricas.veces_usada} usos`}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          generarMensaje(plantilla);
                        }}
                        disabled={loading}
                      >
                        <Refresh />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </Grid>

          {/* Panel de mensaje generado */}
          <Grid item xs={12} md={7}>
            <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold' }}>
              💬 Mensaje Generado
            </Typography>

            {plantillaSeleccionada && (
              <Card sx={{ mb: 2, bgcolor: '#fff3e0', border: '2px solid #ff9800' }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ color: '#f57c00', fontWeight: 'bold' }}>
                    📋 {plantillaSeleccionada.nombre}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Chip 
                      label={`${plantillaSeleccionada.efectividad}% efectiva`}
                      color={plantillaSeleccionada.efectividad > 70 ? 'success' : 'warning'}
                      size="small"
                    />
                    <Chip 
                      label={`⭐ ${plantillaSeleccionada.rating_promedio}`}
                      size="small"
                    />
                  </Box>
                </CardContent>
              </Card>
            )}

            <Paper sx={{ p: 2, mb: 2, bgcolor: '#f5f5f5', minHeight: 200 }}>
              {mensajeGenerado ? (
                <Typography 
                  variant="body1" 
                  sx={{ 
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'monospace',
                    lineHeight: 1.6
                  }}
                >
                  {mensajeGenerado}
                </Typography>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  {plantillaSeleccionada 
                    ? 'Haz clic en "Generar Mensaje" para crear el mensaje personalizado'
                    : 'Selecciona una plantilla para generar el mensaje'
                  }
                </Typography>
              )}
            </Paper>

            {/* Botones de acción */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={() => generarMensaje()}
                disabled={loading || !plantillaSeleccionada}
                sx={{ bgcolor: '#25D366' }}
              >
                Generar Mensaje
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<ContentCopy />}
                onClick={copiarMensaje}
                disabled={!mensajeGenerado}
                sx={{ borderColor: '#25D366', color: '#25D366' }}
              >
                Copiar Mensaje
              </Button>
            </Box>

            {/* Rating de efectividad */}
            {mensajeGenerado && trackingId && (
              <Box sx={{ mt: 2, p: 2, bgcolor: '#f0f7ff', borderRadius: 2 }}>
                <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold' }}>
                  📊 ¿Cómo funcionó esta plantilla?
                </Typography>
                <ButtonGroup size="small" sx={{ flexWrap: 'wrap' }}>
                  <Button onClick={() => marcarEfectividad('excelente')} startIcon="🔥">
                    Excelente
                  </Button>
                  <Button onClick={() => marcarEfectividad('buena')} startIcon="👍">
                    Buena
                  </Button>
                  <Button onClick={() => marcarEfectividad('regular')} startIcon="😐">
                    Regular
                  </Button>
                  <Button onClick={() => marcarEfectividad('mala')} startIcon="👎">
                    Mala
                  </Button>
                </ButtonGroup>
              </Box>
            )}
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, bgcolor: '#f8f9fa' }}>
        <Button onClick={onClose}>
          Cerrar
        </Button>
        <Button
          variant="contained"
          startIcon={<Send />}
          onClick={() => {
            // Abrir WhatsApp Web con el mensaje
            const numeroLimpio = datosCliente.telefono.replace(/\D/g, '');
            const mensajeCodificado = encodeURIComponent(mensajeGenerado);
            const urlWhatsApp = `https://wa.me/52${numeroLimpio}?text=${mensajeCodificado}`;
            window.open(urlWhatsApp, '_blank');
          }}
          disabled={!mensajeGenerado}
          sx={{ bgcolor: '#25D366' }}
        >
          Enviar por WhatsApp
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GeneradorWhatsApp;

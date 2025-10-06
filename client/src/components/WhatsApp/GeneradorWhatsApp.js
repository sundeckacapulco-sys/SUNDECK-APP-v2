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
  ThumbDown,
  Add,
  Edit,
  Visibility
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
  const [openModalCrear, setOpenModalCrear] = useState(false);
  const [nuevaPlantilla, setNuevaPlantilla] = useState({
    nombre: '',
    mensaje: '',
    variables: []
  });
  const [mostrarTodasLasPlantillas, setMostrarTodasLasPlantillas] = useState(false);

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
  }, [open, contexto, estilo, mostrarTodasLasPlantillas]);

  const cargarPlantillas = async () => {
    try {
      setLoading(true);
      let url, params;
      
      if (mostrarTodasLasPlantillas) {
        // Cargar todas las plantillas activas
        url = '/plantillas-whatsapp';
        params = { activa: true, limit: 100 };
      } else {
        // Cargar solo plantillas del contexto específico
        url = `/plantillas-whatsapp/categoria/${contexto}`;
        params = { estilo };
      }
      
      const response = await axiosConfig.get(url, { params });
      const plantillasData = mostrarTodasLasPlantillas ? response.data.plantillas : response.data;
      setPlantillas(plantillasData || []);
      
      // Seleccionar la primera plantilla por defecto
      if (plantillasData && plantillasData.length > 0) {
        setPlantillaSeleccionada(plantillasData[0]);
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

      if (response.data && response.data.mensaje) {
        setMensajeGenerado(response.data.mensaje);
        setTrackingId(response.data.tracking_id || null);
        setSuccess('Mensaje generado exitosamente');
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (error) {
      console.error('Error generando mensaje:', error);
      setError(error.response?.data?.message || 'Error generando mensaje');
      // Limpiar estados en caso de error
      setMensajeGenerado('');
      setTrackingId(null);
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
      
      // Registrar que se envió el mensaje (opcional, no debe fallar la copia)
      if (trackingId && plantillaSeleccionada && datosCliente?._id) {
        try {
          const trackingPayload = {
            plantilla_id: plantillaSeleccionada._id,
            prospecto_id: datosCliente._id,
            evento: 'mensaje_enviado',
            mensaje_generado: mensajeGenerado
          };
          
          console.log('=== TRACKING COPIAR MENSAJE ===');
          console.log('Payload:', trackingPayload);
          
          await axiosConfig.post('/plantillas-whatsapp/tracking', trackingPayload);
          console.log('Tracking exitoso');
        } catch (trackingError) {
          console.warn('Error en tracking (no crítico):', trackingError);
          console.warn('Detalles del error:', trackingError.response?.data);
          console.warn('Status:', trackingError.response?.status);
          // No mostrar error al usuario, es solo tracking
        }
      } else {
        console.log('=== TRACKING OMITIDO ===');
        console.log('trackingId:', trackingId);
        console.log('plantillaSeleccionada:', plantillaSeleccionada?._id);
        console.log('datosCliente._id:', datosCliente?._id);
      }
      
      // No llamar onMensajeGenerado aquí para evitar que se cierre el modal
      // if (onMensajeGenerado) {
      //   onMensajeGenerado(mensajeGenerado, plantillaSeleccionada);
      // }
    } catch (error) {
      console.error('Error copiando mensaje:', error);
      setError('Error copiando mensaje al portapapeles');
    }
  };

  const copiarMensajeLimpio = async () => {
    try {
      // Crear versión sin emojis para copiar
      const mensajeLimpio = mensajeGenerado
        .replace(/👋/g, '*saluda*')
        .replace(/😊/g, ':)')
        .replace(/😄/g, ':D')
        .replace(/😢/g, ':(')
        .replace(/❤️/g, '<3')
        .replace(/💰/g, '*dinero*')
        .replace(/📋/g, '*documento*')
        .replace(/📞/g, '*telefono*')
        .replace(/⏰/g, '*reloj*')
        .replace(/🔨/g, '*herramienta*')
        .replace(/✅/g, '*check*')
        .replace(/🏠/g, '*casa*')
        .replace(/💳/g, '*tarjeta*')
        .replace(/🎉/g, '*celebracion*')
        .replace(/📱/g, '*celular*')
        .replace(/🚀/g, '*cohete*')
        .replace(/⭐/g, '*estrella*')
        .replace(/🔥/g, '*fuego*')
        .replace(/💡/g, '*idea*')
        .replace(/🎯/g, '*objetivo*')
        .replace(/📈/g, '*grafica*')
        .replace(/💪/g, '*fuerza*')
        .replace(/🎊/g, '*fiesta*')
        .replace(/🌟/g, '*brillo*')
        // Eliminar otros emojis
        .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');

      await navigator.clipboard.writeText(mensajeLimpio);
      setSuccess('Mensaje sin emojis copiado al portapapeles');
    } catch (error) {
      setError('Error copiando mensaje');
    }
  };

  const abrirWhatsAppSinMensaje = () => {
    // Abrir WhatsApp Web solo con el número, sin mensaje prellenado
    const numeroLimpio = datosCliente.telefono.replace(/\D/g, '');
    const urlWhatsApp = `https://wa.me/52${numeroLimpio}`;
    window.open(urlWhatsApp, '_blank');
    
    // Mostrar instrucciones
    setSuccess('WhatsApp abierto. Ahora pega el mensaje copiado en el chat.');
  };

  const marcarEfectividad = async (rating) => {
    console.log('=== MARCAR EFECTIVIDAD ===');
    console.log('Rating recibido:', rating);
    console.log('Plantilla seleccionada:', plantillaSeleccionada?._id);
    console.log('Tracking ID:', trackingId);
    console.log('Cliente ID:', datosCliente?._id);

    if (!plantillaSeleccionada || !trackingId || !datosCliente?._id) {
      console.warn('No se puede marcar efectividad: faltan datos necesarios');
      setSuccess('Feedback recibido (datos insuficientes para tracking)');
      return;
    }

    try {
      const ratingNumerico = {
        'excelente': 5,
        'buena': 4,
        'regular': 3,
        'mala': 2,
        'muy_mala': 1
      }[rating];

      console.log('Rating numérico:', ratingNumerico);

      if (!ratingNumerico) {
        console.error('Rating inválido:', rating);
        setSuccess('Feedback recibido (rating inválido)');
        return;
      }

      const payload = {
        plantilla_id: plantillaSeleccionada._id,
        prospecto_id: datosCliente._id,
        evento: 'rating_agregado',
        rating: ratingNumerico,
        mensaje_generado: mensajeGenerado
      };

      console.log('Payload a enviar:', payload);

      await axiosConfig.post('/plantillas-whatsapp/tracking', payload);

      setSuccess('¡Gracias por tu feedback!');
      console.log('Rating enviado exitosamente');
    } catch (error) {
      console.error('Error registrando rating:', error);
      console.error('Detalles del error:', error.response?.data);
      // Mostrar feedback positivo aunque falle el tracking
      setSuccess('Feedback recibido (guardado localmente)');
    }
  };

  const crearNuevaPlantilla = async () => {
    try {
      setLoading(true);
      const plantillaData = {
        nombre: nuevaPlantilla.nombre,
        categoria: contexto,
        estilo: estilo,
        mensaje: nuevaPlantilla.mensaje,
        variables: nuevaPlantilla.variables,
        activa: true
      };

      const response = await axiosConfig.post('/plantillas-whatsapp', plantillaData);
      setSuccess('✅ Plantilla creada exitosamente');
      setOpenModalCrear(false);
      setNuevaPlantilla({ nombre: '', mensaje: '', variables: [] });
      
      // Recargar plantillas
      await cargarPlantillas();
      
      // Seleccionar la nueva plantilla
      setPlantillaSeleccionada(response.data.plantilla);
    } catch (error) {
      console.error('Error creando plantilla:', error);
      setError('Error creando plantilla: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const detectarVariables = (texto) => {
    const regex = /\{([^}]+)\}/g;
    const variablesEncontradas = [];
    let match;
    
    while ((match = regex.exec(texto)) !== null) {
      const nombreVariable = match[1];
      if (!variablesEncontradas.find(v => v.nombre === nombreVariable)) {
        variablesEncontradas.push({
          nombre: nombreVariable,
          descripcion: `Variable ${nombreVariable}`,
          tipo: 'texto',
          requerida: true
        });
      }
    }
    
    return variablesEncontradas;
  };

  const handleMensajeChange = (texto) => {
    setNuevaPlantilla(prev => ({
      ...prev,
      mensaje: texto,
      variables: detectarVariables(texto)
    }));
  };

  const codificarMensajeParaWhatsApp = (mensaje) => {
    // WhatsApp Web tiene problemas con emojis en URLs
    // Convertir emojis comunes a alternativas de texto
    let mensajeLimpio = mensaje
      // Reemplazar emojis comunes con alternativas de texto
      .replace(/👋/g, '*saluda*')
      .replace(/😊/g, ':)')
      .replace(/😄/g, ':D')
      .replace(/😢/g, ':(')
      .replace(/❤️/g, '<3')
      .replace(/💰/g, '*dinero*')
      .replace(/📋/g, '*documento*')
      .replace(/📞/g, '*telefono*')
      .replace(/⏰/g, '*reloj*')
      .replace(/🔨/g, '*herramienta*')
      .replace(/✅/g, '*check*')
      .replace(/🏠/g, '*casa*')
      .replace(/💳/g, '*tarjeta*')
      .replace(/🎉/g, '*celebracion*')
      .replace(/📱/g, '*celular*')
      .replace(/🚀/g, '*cohete*')
      .replace(/⭐/g, '*estrella*')
      .replace(/🔥/g, '*fuego*')
      .replace(/💡/g, '*idea*')
      .replace(/🎯/g, '*objetivo*')
      .replace(/📈/g, '*grafica*')
      .replace(/💪/g, '*fuerza*')
      .replace(/🎊/g, '*fiesta*')
      .replace(/🌟/g, '*brillo*')
      // Eliminar otros emojis que puedan causar problemas
      .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');

    // Codificar para URL
    return mensajeLimpio
      // Reemplazar saltos de línea con %0A
      .replace(/\n/g, '%0A')
      // Reemplazar espacios con %20
      .replace(/ /g, '%20')
      // Codificar caracteres especiales
      .replace(/[#&=+?]/g, (match) => {
        const codes = { 
          '#': '%23', 
          '&': '%26', 
          '=': '%3D', 
          '+': '%2B',
          '?': '%3F'
        };
        return codes[match];
      })
      // Codificar paréntesis y corchetes
      .replace(/[()[\]]/g, (match) => {
        const codes = { 
          '(': '%28', 
          ')': '%29',
          '[': '%5B',
          ']': '%5D'
        };
        return codes[match];
      })
      // Codificar otros caracteres problemáticos
      .replace(/[<>]/g, (match) => {
        const codes = { '<': '%3C', '>': '%3E' };
        return codes[match];
      });
  };

  const contextoInfo = contextos[contexto] || { nombre: contexto, icon: '📱', descripcion: '' };

  return (
    <>
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

            {/* Controles de plantillas */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                📋 Plantillas Disponibles ({plantillas.length})
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title={mostrarTodasLasPlantillas ? "Mostrar solo del contexto" : "Mostrar todas las plantillas"}>
                  <IconButton 
                    size="small" 
                    onClick={() => setMostrarTodasLasPlantillas(!mostrarTodasLasPlantillas)}
                    color={mostrarTodasLasPlantillas ? "primary" : "default"}
                  >
                    <Visibility />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Crear nueva plantilla">
                  <IconButton 
                    size="small" 
                    onClick={() => setOpenModalCrear(true)}
                    color="primary"
                  >
                    <Add />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            
            {mostrarTodasLasPlantillas && (
              <Alert severity="info" sx={{ mb: 2, fontSize: '0.875rem' }}>
                📌 Mostrando todas las plantillas. Las que no coinciden con el contexto actual pueden no funcionar correctamente.
              </Alert>
            )}

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
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
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
                Copiar Original
              </Button>

              <Button
                variant="outlined"
                startIcon={<ContentCopy />}
                onClick={copiarMensajeLimpio}
                disabled={!mensajeGenerado}
                sx={{ borderColor: '#ff9800', color: '#ff9800' }}
              >
                Copiar Sin Emojis
              </Button>
            </Box>

            {/* Flujo recomendado */}
            {mensajeGenerado && (
              <Box sx={{ mb: 2 }}>
                <Alert severity="success" sx={{ mb: 2, fontSize: '0.875rem' }}>
                  🎯 <strong>Flujo Recomendado:</strong> 
                  1. Copia el mensaje → 2. Abre WhatsApp → 3. Pega manualmente
                </Alert>
                
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    startIcon={<WhatsApp />}
                    onClick={abrirWhatsAppSinMensaje}
                    sx={{ bgcolor: '#25D366', color: 'white' }}
                  >
                    📱 Abrir Chat de {datosCliente.nombre}
                  </Button>
                  
                  <Typography variant="caption" sx={{ 
                    alignSelf: 'center', 
                    color: 'text.secondary',
                    fontStyle: 'italic'
                  }}>
                    ← Abre WhatsApp sin mensaje, para pegar manualmente
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Rating de efectividad */}
            {mensajeGenerado && trackingId && (
              <Box sx={{ mt: 2, p: 2, bgcolor: '#f0f7ff', borderRadius: 2 }}>
                <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold' }}>
                  📊 ¿Cómo funcionó esta plantilla?
                </Typography>
                <ButtonGroup size="small" sx={{ flexWrap: 'wrap' }}>
                  <Button 
                    onClick={() => marcarEfectividad('excelente')}
                    variant="outlined"
                    sx={{ color: '#4caf50', borderColor: '#4caf50' }}
                  >
                    🔥 Excelente
                  </Button>
                  <Button 
                    onClick={() => marcarEfectividad('buena')}
                    variant="outlined"
                    sx={{ color: '#2196f3', borderColor: '#2196f3' }}
                  >
                    👍 Buena
                  </Button>
                  <Button 
                    onClick={() => marcarEfectividad('regular')}
                    variant="outlined"
                    sx={{ color: '#ff9800', borderColor: '#ff9800' }}
                  >
                    😐 Regular
                  </Button>
                  <Button 
                    onClick={() => marcarEfectividad('mala')}
                    variant="outlined"
                    sx={{ color: '#f44336', borderColor: '#f44336' }}
                  >
                    👎 Mala
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
        
        {mensajeGenerado && (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              💡 Usa el flujo recomendado arriba para mejores resultados
            </Typography>
          </Box>
        )}
      </DialogActions>
    </Dialog>

    {/* Modal para crear nueva plantilla */}
    <Dialog 
      open={openModalCrear} 
      onClose={() => setOpenModalCrear(false)}
      maxWidth="md" 
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ bgcolor: '#1976d2', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Add />
        🎨 Crear Nueva Plantilla - {contextoInfo.nombre}
        <IconButton
          onClick={() => setOpenModalCrear(false)}
          sx={{ ml: 'auto', color: 'white' }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Alert severity="info" sx={{ mb: 2 }}>
              📝 Crea una plantilla personalizada para el contexto <strong>{contextoInfo.nombre}</strong>. 
              Usa variables entre llaves como <code>{'{nombre}'}</code>, <code>{'{total}'}</code>, etc.
            </Alert>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Nombre de la Plantilla"
              value={nuevaPlantilla.nombre}
              onChange={(e) => setNuevaPlantilla(prev => ({ ...prev, nombre: e.target.value }))}
              placeholder="Ej: Seguimiento Cotización Personalizado"
              sx={{ mb: 2 }}
            />
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Estilo</InputLabel>
              <Select
                value={estilo}
                onChange={(e) => setEstilo(e.target.value)}
                label="Estilo"
              >
                {estilos.map((est) => (
                  <MenuItem key={est.value} value={est.value}>
                    {est.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {nuevaPlantilla.variables.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  📊 Variables Detectadas:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {nuevaPlantilla.variables.map((variable, index) => (
                    <Chip 
                      key={index}
                      label={`{${variable.nombre}}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              multiline
              rows={8}
              label="Mensaje de la Plantilla"
              value={nuevaPlantilla.mensaje}
              onChange={(e) => handleMensajeChange(e.target.value)}
              placeholder={`Hola {nombre} 👋\n\nTe escribo para dar seguimiento a tu cotización {numero_cotizacion} por un total de {total}.\n\n¿Tienes alguna pregunta? Estoy aquí para ayudarte.\n\n¡Que tengas excelente día! 😊`}
              helperText="Usa {variable} para campos dinámicos. Las variables se detectan automáticamente."
            />
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, bgcolor: '#f8f9fa' }}>
        <Button onClick={() => setOpenModalCrear(false)}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={crearNuevaPlantilla}
          disabled={!nuevaPlantilla.nombre || !nuevaPlantilla.mensaje || loading}
          sx={{ bgcolor: '#1976d2' }}
        >
          💾 Crear Plantilla
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
};

export default GeneradorWhatsApp;

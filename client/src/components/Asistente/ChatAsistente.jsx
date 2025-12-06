import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Fab,
  Drawer,
  Typography,
  TextField,
  IconButton,
  Paper,
  Avatar,
  CircularProgress,
  Chip,
  Tooltip,
  Divider,
  Badge
} from '@mui/material';
import {
  SmartToy as BotIcon,
  Send as SendIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  ContentCopy as CopyIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  TipsAndUpdates as TipsIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../config/axios';

const SUGERENCIAS_RAPIDAS = [
  '¿Qué pendientes tengo hoy?',
  '¿Cuántos proyectos hay en producción?',
  '¿Cómo hago seguimiento a una cotización?',
  'Dame los KPIs del mes'
];

const ChatAsistente = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [copiado, setCopiado] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll al final
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [historial]);

  // Focus en input al abrir
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Enviar mensaje
  const enviarMensaje = async (textoMensaje = mensaje) => {
    if (!textoMensaje.trim() || cargando) return;

    const nuevoMensajeUsuario = {
      role: 'user',
      content: textoMensaje.trim(),
      timestamp: new Date()
    };

    setHistorial(prev => [...prev, nuevoMensajeUsuario]);
    setMensaje('');
    setCargando(true);
    setError(null);

    try {
      const response = await api.post('/asistente/chat', {
        mensaje: textoMensaje.trim(),
        historial: historial.map(m => ({ role: m.role, content: m.content }))
      });

      if (response.data.success) {
        setHistorial(prev => [...prev, {
          role: 'assistant',
          content: response.data.respuesta,
          timestamp: new Date(),
          tiempoMs: response.data.tiempoMs
        }]);
      } else {
        setError(response.data.error || 'Error desconocido');
        setHistorial(prev => [...prev, {
          role: 'assistant',
          content: response.data.respuesta || 'Hubo un error procesando tu mensaje.',
          timestamp: new Date(),
          isError: true
        }]);
      }
    } catch (err) {
      console.error('Error en chat:', err);
      setError('Error de conexión');
      setHistorial(prev => [...prev, {
        role: 'assistant',
        content: 'No pude conectarme al servidor. Verifica tu conexión.',
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setCargando(false);
    }
  };

  // Copiar mensaje
  const copiarMensaje = (texto, index) => {
    navigator.clipboard.writeText(texto);
    setCopiado(index);
    setTimeout(() => setCopiado(null), 2000);
  };

  // Limpiar historial
  const limpiarHistorial = () => {
    setHistorial([]);
    setError(null);
  };

  // Renderizar mensaje
  const renderMensaje = (msg, index) => {
    const esUsuario = msg.role === 'user';
    
    return (
      <Box
        key={index}
        sx={{
          display: 'flex',
          justifyContent: esUsuario ? 'flex-end' : 'flex-start',
          mb: 2
        }}
      >
        {!esUsuario && (
          <Avatar
            sx={{
              bgcolor: msg.isError ? 'error.main' : 'primary.main',
              width: 32,
              height: 32,
              mr: 1
            }}
          >
            {msg.isError ? <ErrorIcon fontSize="small" /> : <BotIcon fontSize="small" />}
          </Avatar>
        )}
        
        <Paper
          elevation={1}
          sx={{
            p: 1.5,
            maxWidth: '80%',
            bgcolor: esUsuario ? 'primary.main' : (msg.isError ? 'error.light' : 'grey.100'),
            color: esUsuario ? 'white' : 'text.primary',
            borderRadius: 2,
            position: 'relative'
          }}
        >
          <Typography
            variant="body2"
            sx={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              '& code': {
                bgcolor: 'rgba(0,0,0,0.1)',
                px: 0.5,
                borderRadius: 0.5,
                fontFamily: 'monospace'
              }
            }}
          >
            {msg.content}
          </Typography>
          
          {!esUsuario && !msg.isError && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
              <Tooltip title={copiado === index ? 'Copiado!' : 'Copiar'}>
                <IconButton
                  size="small"
                  onClick={() => copiarMensaje(msg.content, index)}
                  sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}
                >
                  {copiado === index ? (
                    <CheckIcon fontSize="small" color="success" />
                  ) : (
                    <CopyIcon fontSize="small" />
                  )}
                </IconButton>
              </Tooltip>
            </Box>
          )}
          
          {msg.tiempoMs && (
            <Typography variant="caption" sx={{ opacity: 0.5, display: 'block', mt: 0.5 }}>
              {(msg.tiempoMs / 1000).toFixed(1)}s
            </Typography>
          )}
        </Paper>
        
        {esUsuario && (
          <Avatar
            sx={{
              bgcolor: 'secondary.main',
              width: 32,
              height: 32,
              ml: 1
            }}
          >
            {user?.nombre?.charAt(0) || 'U'}
          </Avatar>
        )}
      </Box>
    );
  };

  return (
    <>
      {/* Botón flotante */}
      <Tooltip title="Asistente IA Sundeck" placement="left">
        <Fab
          color="primary"
          onClick={() => setOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000,
            boxShadow: 3
          }}
        >
          <Badge
            color="error"
            variant="dot"
            invisible={historial.length === 0}
          >
            <BotIcon />
          </Badge>
        </Fab>
      </Tooltip>

      {/* Drawer del chat */}
      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 400 },
            maxWidth: '100%'
          }
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            bgcolor: 'primary.main',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BotIcon />
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">
                Asistente Sundeck
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                IA para Ventas e Instalaciones
              </Typography>
            </Box>
          </Box>
          <Box>
            <Tooltip title="Limpiar chat">
              <IconButton color="inherit" onClick={limpiarHistorial} size="small">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <IconButton color="inherit" onClick={() => setOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Mensajes */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            p: 2,
            bgcolor: 'background.default',
            minHeight: 300
          }}
        >
          {historial.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <BotIcon sx={{ fontSize: 48, color: 'primary.light', mb: 2 }} />
              <Typography variant="body1" color="text.secondary" gutterBottom>
                ¡Hola {user?.nombre || 'Usuario'}!
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Soy tu asistente de Sundeck. Puedo ayudarte con:
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                <Chip icon={<TipsIcon />} label="Consultas del CRM" size="small" />
                <Chip icon={<TipsIcon />} label="Procesos de venta" size="small" />
                <Chip icon={<TipsIcon />} label="Instalaciones" size="small" />
                <Chip icon={<TipsIcon />} label="Mensajes para clientes" size="small" />
              </Box>
              
              <Divider sx={{ my: 3 }} />
              
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Sugerencias rápidas:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {SUGERENCIAS_RAPIDAS.map((sug, i) => (
                  <Chip
                    key={i}
                    label={sug}
                    variant="outlined"
                    size="small"
                    onClick={() => enviarMensaje(sug)}
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Box>
            </Box>
          ) : (
            <>
              {historial.map((msg, i) => renderMensaje(msg, i))}
              
              {cargando && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                    <BotIcon fontSize="small" />
                  </Avatar>
                  <Paper sx={{ p: 1.5, bgcolor: 'grey.100' }}>
                    <CircularProgress size={20} />
                  </Paper>
                </Box>
              )}
              
              <div ref={messagesEndRef} />
            </>
          )}
        </Box>

        {/* Input */}
        <Box
          sx={{
            p: 2,
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper'
          }}
        >
          {error && (
            <Typography variant="caption" color="error" sx={{ mb: 1, display: 'block' }}>
              {error}
            </Typography>
          )}
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              inputRef={inputRef}
              fullWidth
              size="small"
              placeholder="Escribe tu mensaje..."
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && enviarMensaje()}
              disabled={cargando}
              multiline
              maxRows={3}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3
                }
              }}
            />
            <IconButton
              color="primary"
              onClick={() => enviarMensaje()}
              disabled={!mensaje.trim() || cargando}
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': { bgcolor: 'primary.dark' },
                '&:disabled': { bgcolor: 'grey.300' }
              }}
            >
              <SendIcon />
            </IconButton>
          </Box>
          
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
            Powered by OpenAI GPT-4o-mini
          </Typography>
        </Box>
      </Drawer>
    </>
  );
};

export default ChatAsistente;

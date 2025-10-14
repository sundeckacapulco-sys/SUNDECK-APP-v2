import React, { useState, useEffect, createContext, useContext } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Alert,
  IconButton,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Close,
  Security,
  BugReport,
  Visibility,
  VisibilityOff,
  CheckCircle,
  Cancel,
  Settings,
  Screenshot,
  Search,
  TouchApp
} from '@mui/icons-material';

// Contexto para el estado del módulo de soporte
const SoporteContext = createContext();

// Proveedor del contexto
export const SoporteProvider = ({ children }) => {
  const [soporteActivo, setSoporteActivo] = useState(false);
  const [autenticado, setAutenticado] = useState(false);

  // Cargar estado al iniciar
  useEffect(() => {
    const estadoSoporte = localStorage.getItem('sundeck_soporte_activo');
    const sesionSoporte = sessionStorage.getItem('sundeck_soporte_autenticado');
    
    if (estadoSoporte === 'true') {
      setSoporteActivo(true);
    }
    
    if (sesionSoporte === 'true') {
      setAutenticado(true);
    }
  }, []);

  // Activar soporte
  const activarSoporte = (password) => {
    // Contraseña de soporte (puedes cambiarla)
    const passwordCorrecta = 'soporte2025';
    
    if (password === passwordCorrecta) {
      setSoporteActivo(true);
      setAutenticado(true);
      localStorage.setItem('sundeck_soporte_activo', 'true');
      sessionStorage.setItem('sundeck_soporte_autenticado', 'true');
      return true;
    }
    return false;
  };

  // Desactivar soporte
  const desactivarSoporte = () => {
    setSoporteActivo(false);
    setAutenticado(false);
    localStorage.setItem('sundeck_soporte_activo', 'false');
    sessionStorage.removeItem('sundeck_soporte_autenticado');
  };

  return (
    <SoporteContext.Provider value={{
      soporteActivo,
      autenticado,
      activarSoporte,
      desactivarSoporte
    }}>
      {children}
    </SoporteContext.Provider>
  );
};

// Hook para usar el contexto
export const useSoporte = () => {
  const context = useContext(SoporteContext);
  if (!context) {
    throw new Error('useSoporte debe usarse dentro de SoporteProvider');
  }
  return context;
};

// Componente principal del módulo de soporte
const ModuloSoporte = ({ open, onClose }) => {
  const { soporteActivo, autenticado, activarSoporte, desactivarSoporte } = useSoporte();
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  // Manejar autenticación
  const handleActivar = () => {
    if (activarSoporte(password)) {
      setMensaje('✅ Módulo de soporte activado correctamente');
      setError('');
      setPassword('');
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setError('❌ Contraseña incorrecta');
      setMensaje('');
    }
  };

  // Manejar desactivación
  const handleDesactivar = () => {
    desactivarSoporte();
    setMensaje('✅ Módulo de soporte desactivado');
    setError('');
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    setMensaje('');
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Security color="primary" />
        Módulo de Soporte Técnico
        <IconButton onClick={handleClose} sx={{ ml: 'auto' }}>
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        {/* Estado actual */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Estado del Módulo</Typography>
              <Chip 
                icon={soporteActivo ? <CheckCircle /> : <Cancel />}
                label={soporteActivo ? 'ACTIVO' : 'INACTIVO'}
                color={soporteActivo ? 'success' : 'error'}
                variant="filled"
              />
            </Box>
            
            <Typography variant="body2" color="text.secondary">
              {soporteActivo 
                ? '🟢 Las herramientas de soporte están disponibles y visibles'
                : '🔴 Las herramientas de soporte están ocultas y deshabilitadas'
              }
            </Typography>
          </CardContent>
        </Card>

        {/* Mensajes */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {mensaje && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {mensaje}
          </Alert>
        )}

        {/* Formulario de activación */}
        {!soporteActivo && (
          <Box>
            <Typography variant="h6" gutterBottom>
              🔐 Activar Módulo de Soporte
            </Typography>
            
            <TextField
              fullWidth
              type={mostrarPassword ? 'text' : 'password'}
              label="Contraseña de Soporte"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleActivar()}
              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: (
                  <IconButton onClick={() => setMostrarPassword(!mostrarPassword)}>
                    {mostrarPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                )
              }}
            />
            
            <Button
              variant="contained"
              color="primary"
              onClick={handleActivar}
              disabled={!password}
              startIcon={<Security />}
              fullWidth
              size="large"
            >
              Activar Módulo de Soporte
            </Button>
          </Box>
        )}

        {/* Panel de control cuando está activo */}
        {soporteActivo && (
          <Box>
            <Typography variant="h6" gutterBottom>
              🛠️ Panel de Control de Soporte
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Sesión autenticada: {autenticado ? '✅ Sí' : '❌ No'}
            </Typography>

            {/* Lista de herramientas disponibles */}
            <Typography variant="subtitle1" gutterBottom>
              📋 Herramientas Disponibles:
            </Typography>
            
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <BugReport color="secondary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Captura de Pantalla"
                  secondary="Botón morado - Capturar y descargar pantallas"
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <Search color="info" />
                </ListItemIcon>
                <ListItemText 
                  primary="Inspector Simple"
                  secondary="Botón azul - Inspector básico de elementos"
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <BugReport color="error" />
                </ListItemIcon>
                <ListItemText 
                  primary="DevTools Inspector"
                  secondary="Botón rojo - Inspector avanzado tipo Chrome"
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <TouchApp color="success" />
                </ListItemIcon>
                <ListItemText 
                  primary="Selector Directo"
                  secondary="Botón verde - Selección directa y automática"
                />
              </ListItem>
            </List>

            <Divider sx={{ my: 2 }} />

            <Button
              variant="outlined"
              color="error"
              onClick={handleDesactivar}
              startIcon={<Cancel />}
              fullWidth
              size="large"
            >
              Desactivar Módulo de Soporte
            </Button>
          </Box>
        )}

        {/* Información de seguridad */}
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <Security fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
            <strong>Seguridad:</strong> El módulo se desactiva automáticamente al cerrar el navegador. 
            Solo personal autorizado debe tener acceso a la contraseña.
          </Typography>
        </Alert>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

// Botón para acceder al módulo de soporte
export const BotonModuloSoporte = () => {
  const [modalAbierto, setModalAbierto] = useState(false);

  return (
    <>
      <Button
        variant="outlined"
        color="primary"
        onClick={() => setModalAbierto(true)}
        startIcon={<Security />}
        sx={{ mb: 2 }}
      >
        Módulo de Soporte
      </Button>

      <ModuloSoporte
        open={modalAbierto}
        onClose={() => setModalAbierto(false)}
      />
    </>
  );
};

export default ModuloSoporte;

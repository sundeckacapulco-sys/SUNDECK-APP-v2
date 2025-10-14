import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Box,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  BugReport,
  Screenshot,
  CheckCircle,
  Info,
  Search
} from '@mui/icons-material';

const ConfiguracionCaptura = () => {
  const [capturaHabilitada, setCapturaHabilitada] = useState(true);
  const [inspectorHabilitado, setInspectorHabilitado] = useState(true);

  // Cargar configuración desde localStorage
  useEffect(() => {
    const configuracionCaptura = localStorage.getItem('sundeck_captura_habilitada');
    if (configuracionCaptura !== null) {
      setCapturaHabilitada(JSON.parse(configuracionCaptura));
    }
    
    const configuracionInspector = localStorage.getItem('sundeck_inspector_habilitado');
    if (configuracionInspector !== null) {
      setInspectorHabilitado(JSON.parse(configuracionInspector));
    }
  }, []);

  // Guardar configuración en localStorage
  const handleToggleCaptura = (event) => {
    const nuevoEstado = event.target.checked;
    setCapturaHabilitada(nuevoEstado);
    localStorage.setItem('sundeck_captura_habilitada', JSON.stringify(nuevoEstado));
    
    // Mostrar/ocultar botón flotante
    const botonFlotante = document.querySelector('[data-testid="boton-captura-flotante"]');
    if (botonFlotante) {
      botonFlotante.style.display = nuevoEstado ? 'block' : 'none';
    }
  };
  
  const handleToggleInspector = (event) => {
    const nuevoEstado = event.target.checked;
    setInspectorHabilitado(nuevoEstado);
    localStorage.setItem('sundeck_inspector_habilitado', JSON.stringify(nuevoEstado));
    
    // Mostrar/ocultar botón flotante del inspector
    const botonInspector = document.querySelector('[data-testid="boton-inspector-flotante"]');
    if (botonInspector) {
      botonInspector.style.display = nuevoEstado ? 'block' : 'none';
    }
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <BugReport color="secondary" sx={{ mr: 1 }} />
          <Typography variant="h6">
            Herramientas de Soporte Técnico
          </Typography>
        </Box>

        {/* Capturas de Pantalla */}
        <FormControlLabel
          control={
            <Switch
              checked={capturaHabilitada}
              onChange={handleToggleCaptura}
              color="secondary"
            />
          }
          label={
            <Typography variant="body1">
              {capturaHabilitada ? '✅ Capturas habilitadas' : '❌ Capturas deshabilitadas'}
            </Typography>
          }
        />
        
        {/* Inspector de Elementos */}
        <FormControlLabel
          control={
            <Switch
              checked={inspectorHabilitado}
              onChange={handleToggleInspector}
              color="info"
            />
          }
          label={
            <Typography variant="body1">
              {inspectorHabilitado ? '✅ Inspector habilitado' : '❌ Inspector deshabilitado'}
            </Typography>
          }
        />

        {(capturaHabilitada || inspectorHabilitado) && (
          <Alert severity="success" sx={{ mt: 2, mb: 2 }}>
            <Typography variant="body2">
              <strong>Herramientas activas:</strong> 
              {capturaHabilitada && ' Capturas de pantalla'}
              {capturaHabilitada && inspectorHabilitado && ' • '}
              {inspectorHabilitado && ' Inspector de elementos'}
            </Typography>
          </Alert>
        )}

        {!capturaHabilitada && !inspectorHabilitado && (
          <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
            <Typography variant="body2">
              <strong>Herramientas desactivadas:</strong> Todas las herramientas de soporte están deshabilitadas.
            </Typography>
          </Alert>
        )}

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" gutterBottom>
          📍 Dónde encontrar las herramientas:
        </Typography>

        <List dense>
          {capturaHabilitada && (
            <>
              <ListItem>
                <ListItemIcon>
                  <Screenshot fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary="Botón flotante capturas (esquina inferior derecha)"
                  secondary="Capturar pantallas - Botón morado con 🐛"
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <BugReport fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary="Botón 🐛 en modales"
                  secondary="Agregar Etapa, Cotizaciones, etc."
                />
              </ListItem>
            </>
          )}
          
          {inspectorHabilitado && (
            <ListItem>
              <ListItemIcon>
                <Search fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Botón flotante inspector (arriba del de capturas)"
                secondary="Inspeccionar elementos - Botón azul con 🔍"
              />
            </ListItem>
          )}
          
          <ListItem>
            <ListItemIcon>
              <CheckCircle fontSize="small" />
            </ListItemIcon>
            <ListItemText 
              primary="Funciones disponibles"
              secondary="Capturar, inspeccionar, copiar HTML, obtener selectores CSS"
            />
          </ListItem>
        </List>

        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <Info fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
            <strong>Tips de uso:</strong>
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            • <strong>Capturas:</strong> Útiles para errores en cálculos o problemas visuales<br/>
            • <strong>Inspector:</strong> Haz clic en cualquier elemento para obtener su HTML y CSS<br/>
            • <strong>Soporte:</strong> Envía la información copiada por WhatsApp o email
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default ConfiguracionCaptura;

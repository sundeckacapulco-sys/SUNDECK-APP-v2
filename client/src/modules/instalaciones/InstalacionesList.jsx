import React from 'react';
import { Box, Typography, Card, CardContent, Alert, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const InstalacionesList = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        🔧 Gestión de Instalaciones
      </Typography>
      
      <Alert severity="success" sx={{ mb: 3 }}>
        <strong>¡MÓDULO SEPARADO FUNCIONANDO!</strong><br />
        Este es el módulo independiente de Instalaciones, separado de Proyectos.
      </Alert>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Funcionalidades Específicas de Instalaciones:
          </Typography>
          <ul>
            <li>📅 Programación de cuadrillas técnicas</li>
            <li>📋 Checklist técnico especializado</li>
            <li>📸 Evidencias fotográficas</li>
            <li>✅ Control de calidad en sitio</li>
            <li>📝 Conformidad del cliente</li>
            <li>📊 Reportes técnicos de instalación</li>
            <li>🗓️ Calendario de instalaciones</li>
          </ul>
          
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => navigate('/instalaciones/programar')}
            >
              📅 Programar Instalación
            </Button>
            <Button 
              variant="outlined" 
              color="secondary"
              onClick={() => navigate('/instalaciones/calendario')}
            >
              🗓️ Ver Calendario
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => navigate('/proyectos')}
            >
              📋 Ver Proyectos (Módulo Separado)
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default InstalacionesList;

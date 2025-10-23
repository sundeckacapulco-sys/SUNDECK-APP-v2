import React from 'react';
import { Box, Typography, Card, CardContent, Alert } from '@mui/material';

const CalendarioInstalaciones = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        📅 Calendario de Instalaciones
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <strong>Vista de Calendario Especializada</strong><br />
        Programación visual de instalaciones por cuadrillas y fechas.
      </Alert>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Funcionalidades del Calendario:
          </Typography>
          <ul>
            <li>📅 Vista mensual/semanal/diaria</li>
            <li>👥 Filtro por cuadrilla</li>
            <li>🎯 Estados de instalación</li>
            <li>📍 Ubicaciones en mapa</li>
            <li>⏰ Gestión de horarios</li>
            <li>🔄 Reprogramación drag & drop</li>
          </ul>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CalendarioInstalaciones;

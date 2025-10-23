import React from 'react';
import { Box, Typography, Card, CardContent, Alert } from '@mui/material';

const ProgramarInstalacion = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        📅 Programar Nueva Instalación
      </Typography>
      
      <Alert severity="success" sx={{ mb: 3 }}>
        <strong>Área Específica de Instalaciones</strong><br />
        Formulario para programar instalaciones con asignación de cuadrillas.
      </Alert>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Formulario de Programación (Por implementar):
          </Typography>
          <ul>
            <li>🏠 Selección de proyecto</li>
            <li>📅 Fecha y hora de instalación</li>
            <li>👥 Asignación de cuadrilla</li>
            <li>🛠️ Herramientas requeridas</li>
            <li>📝 Observaciones especiales</li>
          </ul>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ProgramarInstalacion;

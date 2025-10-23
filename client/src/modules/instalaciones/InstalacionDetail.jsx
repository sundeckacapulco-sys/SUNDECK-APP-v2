import React from 'react';
import { Box, Typography, Card, CardContent, Alert } from '@mui/material';
import { useParams } from 'react-router-dom';

const InstalacionDetail = () => {
  const { id } = useParams();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        🔧 Detalle de Instalación
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <strong>Módulo Independiente de Instalaciones</strong><br />
        Este es el área específica para gestión técnica de instalaciones.
        ID: {id}
      </Alert>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Funcionalidades Específicas de Instalaciones:
          </Typography>
          <ul>
            <li>📅 Programación de cuadrillas</li>
            <li>📋 Checklist técnico</li>
            <li>📸 Evidencias fotográficas</li>
            <li>✅ Control de calidad</li>
            <li>📝 Conformidad del cliente</li>
            <li>📊 Reportes de instalación</li>
          </ul>
        </CardContent>
      </Card>
    </Box>
  );
};

export default InstalacionDetail;

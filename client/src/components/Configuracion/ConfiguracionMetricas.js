import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper
} from '@mui/material';
import {
  Settings,
  Build,
  Factory
} from '@mui/icons-material';
import ConfiguracionInstalacion from './ConfiguracionInstalacion';
import ConfiguracionFabricacion from './ConfiguracionFabricacion';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`configuracion-tabpanel-${index}`}
      aria-labelledby={`configuracion-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box>
          {children}
        </Box>
      )}
    </div>
  );
}

const ConfiguracionMetricas = () => {
  const [tabActiva, setTabActiva] = useState(0);

  const handleCambioTab = (event, nuevaTab) => {
    setTabActiva(nuevaTab);
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header principal */}
      <Box sx={{ p: 3, pb: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Settings sx={{ mr: 2, color: 'primary.main', fontSize: 32 }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              Configuración de Métricas
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Gestiona los tiempos y parámetros de instalación y fabricación
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Tabs de navegación */}
      <Paper sx={{ mx: 3, mb: 0 }}>
        <Tabs
          value={tabActiva}
          onChange={handleCambioTab}
          aria-label="configuracion tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab
            icon={<Build />}
            label="Instalación"
            id="configuracion-tab-0"
            aria-controls="configuracion-tabpanel-0"
            sx={{
              minHeight: 72,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 500
            }}
          />
          <Tab
            icon={<Factory />}
            label="Fabricación"
            id="configuracion-tab-1"
            aria-controls="configuracion-tabpanel-1"
            sx={{
              minHeight: 72,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 500
            }}
          />
        </Tabs>
      </Paper>

      {/* Contenido de las tabs */}
      <TabPanel value={tabActiva} index={0}>
        <ConfiguracionInstalacion />
      </TabPanel>
      
      <TabPanel value={tabActiva} index={1}>
        <ConfiguracionFabricacion />
      </TabPanel>
    </Box>
  );
};

export default ConfiguracionMetricas;

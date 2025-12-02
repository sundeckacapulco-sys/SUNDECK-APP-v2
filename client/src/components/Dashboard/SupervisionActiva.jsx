import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { StatCard } from './StatCard'; // Reutilizamos el componente de tarjeta
import { Grid, Typography, Box, CircularProgress, Alert } from '@mui/material';

const SeccionKPI = ({ titulo, kpis, loading }) => (
  <Box mb={4}>
    <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
      {titulo}
    </Typography>
    <Grid container spacing={3}>
      {Object.values(kpis).map((kpi, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <StatCard
            title={kpi.etiqueta}
            value={loading ? <CircularProgress size={24} /> : kpi.valor}
            unit={kpi.unidad}
            loading={loading}
          />
        </Grid>
      ))}
    </Grid>
  </Box>
);

export const SupervisionActiva = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOperacionalesDiarios = async () => {
      try {
        setLoading(true);
        const response = await api.get('/kpis/operacionales-diarios');
        setData(response.data);
        setError(null);
      } catch (err) {
        setError('No se pudo cargar la supervisión activa. Verifique su conexión o permisos.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOperacionalesDiarios();

    // Actualizar cada 5 minutos
    const intervalId = setInterval(fetchOperacionalesDiarios, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  if (error) {
    return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
  }

  const kpisComercial = data?.comercial || {};
  const kpisFabricacion = data?.fabricacion || {};
  const kpisInstalaciones = data?.instalaciones || {};

  return (
    <Box mt={5}>
      <Typography variant="h4" gutterBottom component="div" sx={{ mb: 3 }}>
         िना Supervisión Activa (Hoy)
      </Typography>

      <SeccionKPI 
        titulo={kpisComercial.titulo || 'Actividad Comercial'} 
        kpis={kpisComercial} 
        loading={loading} 
      />
      
      <SeccionKPI 
        titulo={kpisFabricacion.titulo || 'Fabricación en Taller'} 
        kpis={kpisFabricacion} 
        loading={loading} 
      />

      <SeccionKPI 
        titulo={kpisInstalaciones.titulo || 'Instalaciones en Ruta'} 
        kpis={kpisInstalaciones} 
        loading={loading} 
      />
    </Box>
  );
};

import React, { useState, useEffect } from 'react';
import axiosConfig from '../../config/axios'; // <-- RUTA DE API CORREGIDA
import { KPICard } from './KPICard'; // <-- COMPONENTE DE TARJETA CORREGIDO
import { Grid, Typography, Box, CircularProgress, Alert } from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Storefront as StorefrontIcon,
  Construction as ConstructionIcon,
} from '@mui/icons-material';

const SeccionKPI = ({ titulo, kpis, loading, icon, color }) => (
  <Box mb={4}>
    <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600, color: '#0F172A', display: 'flex', alignItems: 'center' }}>
      {React.createElement(icon, { sx: { color, mr: 1 } })} {titulo}
    </Typography>
    <Grid container spacing={3}>
      {Object.keys(kpis)
        .filter(key => key !== 'titulo') // Excluimos el título de las tarjetas
        .map((key, index) => {
          const kpi = kpis[key];
          return (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <KPICard
                etiqueta={kpi.etiqueta}
                valor={kpi.valor}
                unidad={kpi.unidad}
                loading={loading}
                icon={ConstructionIcon} // Ícono genérico por ahora
                color={color}
              />
            </Grid>
          );
        })}
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
        const response = await axiosConfig.get('/kpis/operacionales-diarios');
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
    const intervalId = setInterval(fetchOperacionalesDiarios, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  if (error) {
    return <Alert severity="error" sx={{ mt: 3, mx: 2 }}>{error}</Alert>;
  }

  return (
    <Box mt={5}>
      <Typography variant="h4" gutterBottom component="div" sx={{ mb: 3, fontWeight: 'bold', color: '#0F172A' }}>
        Cabina de Supervisión Activa (Hoy)
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>
      ) : data ? (
        <>
          <SeccionKPI 
            titulo={data.comercial.titulo} 
            kpis={data.comercial} 
            loading={loading} 
            icon={VisibilityIcon}
            color="#2563eb"
          />
          
          <SeccionKPI 
            titulo={data.fabricacion.titulo}
            kpis={data.fabricacion}
            loading={loading}
            icon={StorefrontIcon}
            color="#7c3aed"
          />

          <SeccionKPI 
            titulo={data.instalaciones.titulo} 
            kpis={data.instalaciones} 
            loading={loading}
            icon={ConstructionIcon}
            color="#db2777"
          />
        </>
      ) : null}
    </Box>
  );
};

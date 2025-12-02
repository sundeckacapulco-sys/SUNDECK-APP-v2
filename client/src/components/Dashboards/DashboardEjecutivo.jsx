import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Icon
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Build as BuildIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import axiosConfig from '../../config/axios';

const KPI_CARD_STYLES = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center'
};

const KPICard = ({ titulo, valor, etiqueta, unidad, icon, color }) => (
  <Card sx={KPI_CARD_STYLES}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Icon component={icon} sx={{ fontSize: 32, color: color || 'primary.main', mr: 2 }} />
        <Typography variant="h5" component="div" fontWeight="bold">
          {unidad === 'currency' ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(valor) : valor}
          {unidad === '%' ? '%' : ''}
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ pl: 6 }}>
        {etiqueta}
      </Typography>
    </CardContent>
  </Card>
);

const DashboardEjecutivo = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const cargarDashboard = async () => {
      try {
        setLoading(true);
        setError('');
        // ÚNICA LLAMADA A LA NUEVA TORRE DE CONTROL
        const response = await axiosConfig.get('/kpis/dashboard');
        setDashboardData(response.data);
      } catch (err) {
        console.error('Error cargando el dashboard ejecutivo:', err);
        setError('No se pudieron cargar las métricas principales. Por favor, intente de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    cargarDashboard();
  }, []);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>;
  }

  if (!dashboardData) {
    return null; // O un estado vacío si no hay datos
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#D4AF37', mb: 3 }}>
        Torre de Control del Negocio
      </Typography>

      {/* ---- SECCIÓN COMERCIAL ---- */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Typography variant="h5" component="h2" gutterBottom>Pipeline Comercial</Typography>
        </Grid>
        {Object.values(dashboardData.comercial).filter(k => typeof k === 'object').map((kpi) => (
          <Grid item xs={12} sm={6} md={3} key={kpi.etiqueta}>
            <KPICard {...kpi} icon={TrendingUpIcon} color="#3b82f6" />
          </Grid>
        ))}
      </Grid>

      {/* ---- SECCIÓN OPERACIONES ---- */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Typography variant="h5" component="h2" gutterBottom>Taller e Instalaciones</Typography>
        </Grid>
        {Object.values(dashboardData.operaciones).filter(k => typeof k === 'object').map((kpi) => (
          <Grid item xs={12} sm={6} md={4} key={kpi.etiqueta}>
            <KPICard {...kpi} icon={BuildIcon} color="#8b5cf6" />
          </Grid>
        ))}
      </Grid>

      {/* ---- SECCIÓN FINANCIERO ---- */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h5" component="h2" gutterBottom>Salud Financiera</Typography>
        </Grid>
        {Object.values(dashboardData.financiero).filter(k => typeof k === 'object').map((kpi) => (
          <Grid item xs={12} sm={6} md={3} key={kpi.etiqueta}>
            <KPICard {...kpi} icon={MoneyIcon} color="#10b981" />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default DashboardEjecutivo;
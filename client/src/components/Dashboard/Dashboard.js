import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  Button
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Build as BuildIcon,
  AttachMoney as MoneyIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  DonutLarge as DonutLargeIcon,
  Paid as PaidIcon,
  RequestQuote as RequestQuoteIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axiosConfig from '../../config/axios';
import { SupervisionActiva } from './SupervisionActiva';
import { KPICard } from './KPICard'; // <-- IMPORTAMOS LA TARJETA CENTRALIZADA

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const iconMapping = {
    // Comercial
    "Nuevos Prospectos (Mes)": PeopleIcon,
    "Cotizaciones (Mes)": AssignmentIcon,
    "Ventas Cerradas (Mes)": CheckCircleIcon,
    "Proyectos en Riesgo": WarningIcon,
    // Operaciones
    "Proyectos en Taller": BuildIcon,
    "Proyectos para Instalar": DonutLargeIcon,
    // Financiero
    "Ingresos del Mes": PaidIcon,
    "Cuentas por Cobrar": RequestQuoteIcon
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await axiosConfig.get('/kpis/dashboard');
        setData(response.data);
      } catch (err) {
        console.error('Error cargando el dashboard:', err);
        setError('No se pudieron cargar las métricas principales.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>;
  }

  if (!data) {
    return null;
  }

  const fraseMotivacional = [
    "La constancia construye imperios 🏆",
    "El éxito es la suma de pequeños esfuerzos repetidos día tras día 💪",
    "Tu futuro se crea por lo que haces hoy, no mañana ⭐"
  ];
  const fraseDelDia = fraseMotivacional[new Date().getDay() % fraseMotivacional.length];

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: '#F8FAFC' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#0F172A' }}>
            Torre de Control del Negocio
          </Typography>
          <Typography variant="subtitle1" color="#64748B">
            {fraseDelDia}
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={() => navigate('/proyectos/nuevo')}
          sx={{ bgcolor: '#14B8A6', '&:hover': { bgcolor: '#0F9686' }, borderRadius: '8px', px: 3, py: 1 }}
        >
          Nuevo Proyecto
        </Button>
      </Box>

      {/* Secciones de la Torre de Control */}
      {renderSeccion(data.comercial, iconMapping, '#3b82f6', TrendingUpIcon)}
      {renderSeccion(data.operaciones, iconMapping, '#8b5cf6', BuildIcon)}
      {renderSeccion(data.financiero, iconMapping, '#10b981', MoneyIcon)}

      {/* ---- SECCIÓN DE SUPERVISIÓN ACTIVA (HOY) ---- */}
      <SupervisionActiva />

    </Box>
  );
};

const renderSeccion = (seccionData, iconMapping, color, defaultIcon) => (
  <Box sx={{ mb: 4 }}>
    <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600, color: '#0F172A', display: 'flex', alignItems: 'center' }}>
      {React.createElement(defaultIcon, { sx: { color, mr: 1 } })} {seccionData.titulo}
    </Typography>
    <Grid container spacing={3}>
      {Object.values(seccionData).filter(k => typeof k === 'object').map((kpi) => (
        <Grid item xs={12} sm={6} md={3} key={kpi.etiqueta}>
          <KPICard {...kpi} icon={iconMapping[kpi.etiqueta] || defaultIcon} color={color} />
        </Grid>
      ))}
    </Grid>
  </Box>
);

export default Dashboard;

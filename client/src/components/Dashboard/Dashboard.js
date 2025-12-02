import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Icon,
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
import { SupervisionActiva } from './SupervisionActiva'; // <-- IMPORTAMOS EL NUEVO COMPONENTE

const KPICard = ({ titulo, valor, etiqueta, unidad, icon, color = '#334155' }) => (
  <Card elevation={0} sx={{ height: '100%', border: '1px solid #E2E8F0', borderRadius: '12px' }}>
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Icon component={icon} sx={{ fontSize: 28, color, mr: 2 }} />
        <Typography variant="h4" component="div" fontWeight="600" color="#0F172A">
          {unidad === 'currency' ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(valor) : valor}
          {unidad === '%' ? '%' : ''}
        </Typography>
      </Box>
      <Typography variant="body2" color="#64748B" sx={{ pl: '44px' }}>
        {etiqueta}
      </Typography>
    </CardContent>
  </Card>
);

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
        // ÚNICA LLAMADA A LA TORRE DE CONTROL
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

      {/* ---- SECCIÓN COMERCIAL ---- */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600, color: '#0F172A', display: 'flex', alignItems: 'center' }}>
          <TrendingUpIcon sx={{ color: '#3b82f6', mr: 1 }}/> Pipeline Comercial
        </Typography>
        <Grid container spacing={2}>
          {Object.values(data.comercial).filter(k => typeof k === 'object').map((kpi) => (
            <Grid item xs={12} sm={6} md={3} key={kpi.etiqueta}>
              <KPICard {...kpi} icon={iconMapping[kpi.etiqueta] || TrendingUpIcon} color="#3b82f6" />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* ---- SECCIÓN OPERACIONES ---- */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600, color: '#0F172A', display: 'flex', alignItems: 'center' }}>
           <BuildIcon sx={{ color: '#8b5cf6', mr: 1 }}/> Taller e Instalaciones
        </Typography>
        <Grid container spacing={2}>
          {Object.values(data.operaciones).filter(k => typeof k === 'object').map((kpi) => (
            <Grid item xs={12} sm={6} md={3} key={kpi.etiqueta}>
              <KPICard {...kpi} icon={iconMapping[kpi.etiqueta] || BuildIcon} color="#8b5cf6" />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* ---- SECCIÓN FINANCIERO ---- */}
      <Box>
        <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600, color: '#0F172A', display: 'flex', alignItems: 'center' }}>
          <MoneyIcon sx={{ color: '#10b981', mr: 1 }}/> Salud Financiera
        </Typography>
        <Grid container spacing={2}>
          {Object.values(data.financiero).filter(k => typeof k === 'object').map((kpi) => (
            <Grid item xs={12} sm={6} md={3} key={kpi.etiqueta}>
              <KPICard {...kpi} icon={iconMapping[kpi.etiqueta] || MoneyIcon} color="#10b981" />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* ---- SECCIÓN DE SUPERVISIÓN ACTIVA (HOY) ---- */}
      <SupervisionActiva />

    </Box>
  );
};

export default Dashboard;

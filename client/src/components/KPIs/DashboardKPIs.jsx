import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Cancel,
  Phone,
  WhatsApp,
  Email,
  Refresh,
  Assessment,
  PersonOff,
  MonetizationOn,
  Schedule,
  CallMade,
  CallReceived
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import axiosConfig from '../../config/axios';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const RAZONES_PERDIDA = {
  'precio_alto': 'Precio Alto',
  'tiempo_entrega_largo': 'Tiempo de Entrega',
  'competencia_mejor_oferta': 'Competencia',
  'presupuesto_insuficiente': 'Sin Presupuesto',
  'cliente_no_responde': 'No Responde',
  'decidio_no_comprar': 'Decidió No Comprar',
  'otro': 'Otro'
};

const SafeMetricCard = ({ title, value, subtitle, icon, color, trend, alert }) => (
    <MetricCard 
        title={title}
        value={value || 'N/A'}
        subtitle={subtitle}
        icon={icon}
        color={color}
        trend={trend}
        alert={alert}
    />
);

const DashboardKPIs = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabActual, setTabActual] = useState(0);
  
  const [dashboardData, setDashboardData] = useState(null);
  const [conversionData, setConversionData] = useState(null);
  const [perdidasData, setPerdidasData] = useState(null);
  const [recuperablesData, setRecuperablesData] = useState(null);

  useEffect(() => {
    cargarDashboard();
  }, []);

  const cargarDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const [dashboard, conversion, perdidas, recuperables] = await Promise.all([
        axiosConfig.get('/kpis/dashboard'),
        axiosConfig.get('/kpis/conversion'),
        axiosConfig.get('/kpis/perdidas'),
        axiosConfig.get('/kpis/recuperables')
      ]);

      setDashboardData(dashboard.data);
      setConversionData(conversion.data);
      setPerdidasData(perdidas.data);
      setRecuperablesData(recuperables.data);
    } catch (error) {
      console.error('Error cargando dashboard KPIs:', error);
      setError('Error cargando métricas. Por favor, recarga la página.');
    } finally {
      setLoading(false);
    }
  };

  const MetricCard = ({ title, value, subtitle, icon, color, trend, alert }) => (
    <Card sx={{ height: '100%', position: 'relative' }}>
      {alert && (
        <Chip
          label="ALERTA"
          color="error"
          size="small"
          sx={{ position: 'absolute', top: 8, right: 8 }}
        />
      )}
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div" color={color} sx={{ mb: 1 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {trend > 0 ? (
                  <TrendingUp color="success" sx={{ mr: 1 }} />
                ) : (
                  <TrendingDown color="error" sx={{ mr: 1 }} />
                )}
                <Typography variant="body2" color={trend > 0 ? 'success.main' : 'error.main'}>
                  {Math.abs(trend)}% vs mes anterior
                </Typography>
              </Box>
            )}
          </Box>
          <Box sx={{ ml: 2 }}>
            {React.cloneElement(icon, { 
              sx: { fontSize: 48, color: `${color}.main`, opacity: 0.7 } 
            })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const EmbudoConversion = ({ data }) => {
    if (!data || !data.embudo) return <Alert severity="info">No hay datos de conversión disponibles.</Alert>;
    const embudoData = [
      { name: 'Prospectos', value: data.embudo.prospectos || 0, fill: '#8884d8' },
      { name: 'Levantamientos', value: data.embudo.levantamientos || 0, fill: '#82ca9d' },
      { name: 'Cotizaciones', value: data.embudo.cotizaciones || 0, fill: '#ffc658' },
      { name: 'Ventas', value: data.embudo.ventas || 0, fill: '#ff7300' },
      { name: 'Completados', value: data.embudo.completados || 0, fill: '#00C49F' }
    ];

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Embudo de Conversión
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={embudoData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <RechartsTooltip />
              <Bar dataKey="value" barSize={20} />
            </BarChart>
          </ResponsiveContainer>
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Tasas de Conversión:
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2">
                  Levantamiento → Cotización: <strong>{(data.tasasEmbudo?.levantamientoACotizacion || 0).toFixed(1)}%</strong>
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">
                  Cotización → Venta: <strong>{(data.tasasEmbudo?.cotizacionAVenta || 0).toFixed(1)}%</strong>
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const ProspectosRecuperables = ({ data }) => {
    if (!data || !data.prospectosRecuperables || data.prospectosRecuperables.length === 0) {
        return <Alert severity="info">No hay prospectos recuperables en este momento.</Alert>;
    }

    return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Prospectos Recuperables ({data.resumen?.totalRecuperables || 0})
          </Typography>
          <Typography variant="h6" color="primary">
            ${(data.resumen?.montoTotalRecuperable || 0).toLocaleString()}
          </Typography>
        </Box>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="error.main">
                {data.porPrioridad?.alta?.cantidad || 0}
              </Typography>
              <Typography variant="body2">Alta Prioridad</Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">
                {data.porPrioridad?.media?.cantidad || 0}
              </Typography>
              <Typography variant="body2">Media Prioridad</Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main">
                {data.porPrioridad?.baja?.cantidad || 0}
              </Typography>
              <Typography variant="body2">Baja Prioridad</Typography>
            </Box>
          </Grid>
        </Grid>

        <List dense>
          {data.prospectosRecuperables.filter(p => p.cliente).slice(0, 5).map((prospecto) => {
            const score = prospecto.scoreRecuperacion || 0;
            const color = score >= 70 ? 'error' : score >= 50 ? 'warning' : 'info';
            return (
            <ListItem key={prospecto._id}>
              <ListItemIcon>
                <PersonOff color={color} />
              </ListItemIcon>
              <ListItemText
                primary={prospecto.cliente.nombre}
                secondary={
                  <Box>
                    <Typography variant="body2">
                      Score: {score}/100 • 
                      ${(prospecto.montoEstimado || 0).toLocaleString()} • 
                      {RAZONES_PERDIDA[prospecto.razonPerdida?.tipo] || 'N/A'}
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={score} 
                      sx={{ mt: 1 }}
                      color={color}
                    />
                  </Box>
                }
              />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Llamar">
                  <IconButton size="small" href={`tel:${prospecto.cliente.telefono}`}>
                    <Phone />
                  </IconButton>
                </Tooltip>
                <Tooltip title="WhatsApp">
                  <IconButton 
                    size="small" 
                    href={`https://wa.me/52${(prospecto.cliente.telefono || '').replace(/\D/g, '')}`}
                    target="_blank"
                  >
                    <WhatsApp />
                  </IconButton>
                </Tooltip>
              </Box>
            </ListItem>
          )})}
        </List>
      </CardContent>
    </Card>
    )
  };

  const AnalisisPerdidas = ({ data }) => {
    if (!data || !data.razonesAnalisis || data.razonesAnalisis.length === 0) {
        return <Alert severity="info">No hay datos de pérdidas para analizar.</Alert>;
    }
    const razonesChart = data.razonesAnalisis.map(razon => ({
      name: RAZONES_PERDIDA[razon._id] || razon._id,
      value: razon.cantidad,
      monto: razon.montoTotal
    }));

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Análisis de Pérdidas
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Razones de Pérdida
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={razonesChart}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {razonesChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Pérdidas por Etapa
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.perdidasPorEtapa || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="cantidad" fill="#FF8042" />
                </BarChart>
              </ResponsiveContainer>
            </Grid>
          </Grid>

          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={3}>
                <Typography variant="body2" color="text.secondary">Total Perdidas</Typography>
                <Typography variant="h6">{data.resumen?.totalPerdidas || 0}</Typography>
              </Grid>
              <Grid item xs={3}>
                <Typography variant="body2" color="text.secondary">Monto Perdido</Typography>
                <Typography variant="h6">${(data.resumen?.montoTotalPerdido || 0).toLocaleString()}</Typography>
              </Grid>
              <Grid item xs={3}>
                <Typography variant="body2" color="text.secondary">Razón Principal</Typography>
                <Typography variant="h6">
                  {RAZONES_PERDIDA[data.resumen?.razonPrincipal?._id] || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={3}>
                <Typography variant="body2" color="text.secondary">Etapa Crítica</Typography>
                <Typography variant="h6">
                  {data.resumen?.etapaCritica?._id || 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            KPIs y Métricas de Ventas
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Análisis completo de conversión y seguimiento de prospectos
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={cargarDashboard}
        >
          Actualizar
        </Button>
      </Box>

      {dashboardData?.alertas && (
        <Box sx={{ mb: 3 }}>
          {dashboardData.alertas.conversionBaja && (
            <Alert severity="warning" sx={{ mb: 1 }}>
              ⚠️ Conversión general baja ({(dashboardData.kpiActual?.conversiones?.conversionGeneral || 0).toFixed(1)}%). 
              Revisar proceso de ventas.
            </Alert>
          )}
          {dashboardData.alertas.prospectosAbandonados > 0 && (
            <Alert severity="error" sx={{ mb: 1 }}>
              🚨 {dashboardData.alertas.prospectosAbandonados} prospectos sin contacto por más de 30 días.
            </Alert>
          )}
        </Box>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <SafeMetricCard
            title="Conversión General"
            value={`${(dashboardData?.kpiActual?.conversiones?.conversionGeneral || 0).toFixed(1)}%`}
            subtitle="Prospectos → Ventas cerradas"
            icon={<TrendingUp />}
            color="primary"
            alert={dashboardData?.alertas?.conversionBaja}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SafeMetricCard
            title="Ticket Promedio"
            value={`$${(dashboardData?.kpiActual?.metricas?.ticketPromedio || 0).toLocaleString()}`}
            subtitle="Valor promedio por venta"
            icon={<MonetizationOn />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SafeMetricCard
            title="Prospectos Perdidos"
            value={dashboardData?.kpiActual?.metricas?.prospectosPerdidos || 0}
            subtitle="Este período"
            icon={<Cancel />}
            color="error"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SafeMetricCard
            title="Recuperables"
            value={recuperablesData?.resumen?.totalRecuperables || 0}
            subtitle={`$${(recuperablesData?.resumen?.montoTotalRecuperable || 0).toLocaleString()}`}
            icon={<PersonOff />}
            color="warning"
          />
        </Grid>
      </Grid>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabActual} onChange={(e, newValue) => setTabActual(newValue)}>
          <Tab label="Embudo de Conversión" />
          <Tab label="Prospectos Recuperables" />
          <Tab label="Análisis de Pérdidas" />
        </Tabs>
      </Box>

      {tabActual === 0 && <EmbudoConversion data={conversionData} />}
      {tabActual === 1 && <ProspectosRecuperables data={recuperablesData} />}
      {tabActual === 2 && <AnalisisPerdidas data={perdidasData} />}
    </Box>
  );
};

export default DashboardKPIs;

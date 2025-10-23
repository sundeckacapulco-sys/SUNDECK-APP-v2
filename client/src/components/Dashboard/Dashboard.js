import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Button,
  Avatar
} from '@mui/material';
import {
  TrendingUp,
  People,
  Assignment,
  AttachMoney,
  Schedule,
  Phone,
  Today,
  Refresh,
  CheckCircle,
  Warning
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';
import axiosConfig from '../../config/axios';
import ConfiguracionCaptura from '../Common/ConfiguracionCaptura';
import { BotonModuloSoporte } from '../Common/ModuloSoporte';
import { useAuth } from '../../contexts/AuthContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];
const RADIAN = Math.PI / 180;

const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  outerRadius,
  percent,
  name
}) => {
  if (!percent) {
    return null;
  }

  const radius = outerRadius + 16;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#424242"
      textAnchor={x >= cx ? 'start' : 'end'}
      dominantBaseline="central"
      style={{ fontSize: 12 }}
    >
      {`${name} ${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axiosConfig.get('/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading || !dashboardData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography>Cargando dashboard...</Typography>
      </Box>
    );
  }

  const { pipeline, metricas, seguimientosPendientes, actividadReciente, citasHoy } = dashboardData;

  // Datos para el gráfico de embudo
  const embudoData = [
    { name: 'Nuevos', value: pipeline.nuevos, color: '#8884d8' },
    { name: 'Contactados', value: pipeline.contactados, color: '#82ca9d' },
    { name: 'Citas', value: pipeline.citasAgendadas, color: '#ffc658' },
    { name: 'Cotizaciones', value: pipeline.cotizaciones, color: '#ff7300' },
    { name: 'Ventas Cerradas', value: pipeline.ventasCerradas, color: '#2e7d32' },
    { name: 'Pedidos', value: pipeline.pedidos, color: '#00C49F' },
    { name: 'Fabricación', value: pipeline.fabricacion, color: '#0088FE' },
    { name: 'Instalación', value: pipeline.instalacion, color: '#FFBB28' },
    { name: 'Entregados', value: pipeline.entregados, color: '#FF8042' }
  ];

  const MetricCard = ({ title, value, icon, color = 'primary', subtitle }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="text.secondary" gutterBottom variant="h6">
              {title}
            </Typography>
            <Typography variant="h4" component="div" color={color}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar sx={{ bgcolor: `${color}.main`, width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Dashboard - Sistema Unificado
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Gestión completa de proyectos desde prospecto hasta entrega
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            onClick={() => navigate('/proyectos/nuevo')}
          >
            Nuevo Proyecto
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchDashboardData}
          >
            Actualizar
          </Button>
        </Box>
      </Box>

      {/* Métricas principales */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Prospectos Nuevos"
            value={metricas.prospectosNuevos}
            icon={<People />}
            color="primary"
            subtitle={`Últimos ${metricas.periodo} días`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Cotizaciones"
            value={metricas.cotizacionesEnviadas}
            icon={<Assignment />}
            color="secondary"
            subtitle={`Últimos ${metricas.periodo} días`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Ventas Cerradas"
            value={metricas.ventasCerradas}
            icon={<CheckCircle />}
            color="success"
            subtitle={`Incluye front + backstage • ${metricas.periodo} días`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Monto Ventas"
            value={`$${metricas.montoVentas.toLocaleString()}`}
            icon={<TrendingUp />}
            color="warning"
            subtitle={`Tasa conversión: ${metricas.tasaConversion}%`}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Pipeline Kanban */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Pipeline de Ventas
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={embudoData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Distribución por etapa */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Distribución Pipeline
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={embudoData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    paddingAngle={2}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {embudoData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend verticalAlign="bottom" height={36} />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Citas del día */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Citas de Hoy ({citasHoy.length})
              </Typography>
              <List dense>
                {citasHoy.length === 0 ? (
                  <ListItem>
                    <ListItemText primary="No hay citas programadas para hoy" />
                  </ListItem>
                ) : (
                  citasHoy.slice(0, 5).map((cita) => (
                    <ListItem key={cita._id}>
                      <ListItemIcon>
                        <Schedule />
                      </ListItemIcon>
                      <ListItemText
                        primary={cita.nombre}
                        secondary={`${cita.horaCita} - ${cita.telefono}`}
                      />
                    </ListItem>
                  ))
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Seguimientos pendientes */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Seguimientos Pendientes ({seguimientosPendientes.length})
              </Typography>
              <List dense>
                {seguimientosPendientes.length === 0 ? (
                  <ListItem>
                    <ListItemText primary="No hay seguimientos pendientes" />
                  </ListItem>
                ) : (
                  seguimientosPendientes.slice(0, 5).map((prospecto) => (
                    <ListItem key={prospecto._id}>
                      <ListItemIcon>
                        <Warning color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary={prospecto.nombre}
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={prospecto.etapa}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                            <Typography variant="caption">
                              {prospecto.telefono}
                            </Typography>
                          </Box>
                        }
                        secondaryTypographyProps={{ component: 'div' }}
                      />
                    </ListItem>
                  ))
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Actividad reciente */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Actividad Reciente
              </Typography>
              <List dense>
                {actividadReciente.length === 0 ? (
                  <ListItem>
                    <ListItemText primary="No hay actividad reciente" />
                  </ListItem>
                ) : (
                  actividadReciente.slice(0, 5).map((actividad) => (
                    <ListItem key={actividad._id}>
                      <ListItemIcon>
                        <Phone />
                      </ListItemIcon>
                      <ListItemText
                        primary={actividad.nombre}
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={actividad.etapa}
                              size="small"
                              color="secondary"
                              variant="outlined"
                            />
                            <Typography variant="caption">
                              {new Date(actividad.updatedAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                        }
                        secondaryTypographyProps={{ component: 'div' }}
                      />
                    </ListItem>
                  ))
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
        
        {/* El módulo de soporte ahora está en el menú del usuario */}
      </Grid>
    </Box>
  );
};

export default Dashboard;

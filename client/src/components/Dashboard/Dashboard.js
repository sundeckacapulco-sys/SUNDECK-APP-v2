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
import SupervisionEnVivo from './SupervisionEnVivo';
import ConfiguracionCaptura from '../Common/ConfiguracionCaptura';
import { BotonModuloSoporte } from '../Common/ModuloSoporte';
import { useAuth } from '../../contexts/AuthContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];
const RADIAN = Math.PI / 180;

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
  const radius = outerRadius + 30; // Mover etiquetas fuera del gráfico
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#0F172A"
      textAnchor={x >= cx ? 'start' : 'end'}
      dominantBaseline="central"
      style={{ 
        fontSize: 13,
        fontWeight: 600,
        fontFamily: '"Inter", sans-serif'
      }}
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
      const response = await axiosConfig.get('/dashboard/unificado');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh cada 30 segundos
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading || !dashboardData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography>Cargando dashboard...</Typography>
      </Box>
    );
  }

  // Valores por defecto para evitar errores cuando el backend devuelve datos vacíos
  const pipeline = dashboardData.pipeline || {
    nuevos: 0, contactados: 0, citasAgendadas: 0, cotizados: 0,
    ventasCerradas: 0, pedidos: 0, fabricacion: 0, instalacion: 0, entregados: 0
  };
  const metricas = dashboardData.metricas || {
    montoVentas: 0, tasaConversion: 0, prospectosTotales: 0,
    cotizacionesPendientes: 0, pedidosEnProceso: 0
  };
  const seguimientosPendientes = dashboardData.seguimientosPendientes || [];
  const actividadReciente = dashboardData.actividadReciente || [];
  const citasHoy = dashboardData.citasHoy || [];
  const supervisionEnVivo = dashboardData.supervisionEnVivo || [];
  const cierresMensuales = dashboardData.cierresMensuales || [];

  // 🎨 Paleta de colores SUNDECK - Profesional y armónica
  const COLORS_SUNDECK = {
    primary: '#0F172A',      // Azul carbón (títulos)
    secondary: '#D4AF37',    // Dorado (acentos)
    accent: '#14B8A6',       // Turquesa esperanza
    neutral: '#F8FAFC',      // Fondo general
    textSecondary: '#334155' // Texto secundario
  };

  const COLORS_PIPELINE = {
    nuevos: '#A8DADC',        // Azul pastel suave
    contactados: '#B8E0D2',   // Verde menta
    citas: '#F4D9C6',         // Durazno suave
    cotizaciones: '#D4A5A5',  // Rosa polvo
    ventasCerradas: '#95B8D1', // Azul grisáceo
    pedidos: '#B5C99A',       // Verde salvia
    fabricacion: '#C9ADA7',   // Taupe
    instalacion: '#E8C5B5',   // Terracota suave
    entregados: '#9DC08B'     // Verde oliva claro
  };

  // Datos para el gráfico de embudo - Solo etapas con valores
  const embudoData = [
    { name: 'Nuevos', value: pipeline.nuevos, fill: COLORS_PIPELINE.nuevos },
    { name: 'Contactados', value: pipeline.contactados, fill: COLORS_PIPELINE.contactados },
    { name: 'Citas', value: pipeline.citasAgendadas, fill: COLORS_PIPELINE.citas },
    { name: 'Cotizaciones', value: pipeline.cotizados, fill: COLORS_PIPELINE.cotizaciones },
    { name: 'Ventas Cerradas', value: pipeline.ventasCerradas, fill: COLORS_PIPELINE.ventasCerradas },
    { name: 'Pedidos', value: pipeline.pedidos, fill: COLORS_PIPELINE.pedidos },
    { name: 'Fabricación', value: pipeline.fabricacion, fill: COLORS_PIPELINE.fabricacion },
    { name: 'Instalación', value: pipeline.instalacion, fill: COLORS_PIPELINE.instalacion },
    { name: 'Entregados', value: pipeline.entregados, fill: COLORS_PIPELINE.entregados }
  ].filter(item => item.value > 0);

  // 🎨 Función para obtener color de ícono según tipo
  const getIconColor = (color) => {
    const colors = {
      primary: '#14B8A6',   // Turquesa
      secondary: '#D4AF37', // Dorado
      success: '#10B981',   // Verde
      error: '#F59E0B',     // Ámbar
      warning: '#14B8A6'    // Turquesa
    };
    return colors[color] || colors.primary;
  };

  // 💡 Frases motivacionales dinámicas
  const fraseMotivacional = [
    "El seguimiento hace la venta 💡",
    "Cada contacto es una oportunidad 🚀",
    "La constancia construye imperios 🏆",
    "Hoy es el día perfecto para cerrar 💪",
    "Tu actitud determina tu altitud ⭐"
  ];
  const fraseDelDia = fraseMotivacional[new Date().getDay() % fraseMotivacional.length];

  const MetricCard = ({ title, value, icon, color = 'primary', subtitle }) => (
    <Card 
      elevation={0}
      sx={{ 
        height: '100%',
        bgcolor: 'white',
        border: '1px solid #F1F5F9',
        borderRadius: '16px',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 24px rgba(15, 23, 42, 0.08)'
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#64748B',
              fontSize: '0.875rem',
              fontWeight: 500,
              letterSpacing: '0.3px'
            }}
          >
            {title}
          </Typography>
          {React.cloneElement(icon, { 
            sx: { 
              fontSize: 24, 
              color: getIconColor(color)
            } 
          })}
        </Box>
        <Typography 
          variant="h3" 
          component="div" 
          sx={{ 
            fontWeight: 600, 
            mb: 0.5,
            color: '#0F172A',
            fontSize: '2.25rem',
            lineHeight: 1.2
          }}
        >
          {value}
        </Typography>
        {subtitle && (
          <Typography 
            variant="caption" 
            sx={{ 
              color: '#94A3B8', 
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 400
            }}
          >
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ flexGrow: 1, bgcolor: '#F8FAFC', minHeight: '100vh', p: 3 }}>
      {/* 🎯 Header con frase motivacional */}
      <Box sx={{ maxWidth: '1280px', mx: 'auto' }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3,
          bgcolor: 'white',
          p: 3,
          borderRadius: '16px',
          border: '1px solid #F1F5F9',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
          transition: 'box-shadow 0.3s ease',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
          }
        }}>
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="h5" 
              component="h1" 
              sx={{ 
                fontFamily: '"Playfair Display", serif',
                fontWeight: 700,
                fontSize: '1.5rem',
                color: '#0F172A',
                letterSpacing: '-0.5px',
                mb: 0.5
              }}
            >
              Dashboard Principal
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                fontFamily: '"Inter", sans-serif',
                color: '#64748B',
                fontWeight: 400,
                fontSize: '0.875rem'
              }}
            >
              Visión completa de tu negocio en tiempo real
            </Typography>
          </Box>
          <Box 
            sx={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 2,
              animation: 'fadeInDown 0.6s ease-out',
              '@keyframes fadeInDown': {
                '0%': {
                  opacity: 0,
                  transform: 'translateY(-5px)'
                },
                '100%': {
                  opacity: 1,
                  transform: 'translateY(0)'
                }
              }
            }}
          >
            <Box sx={{ textAlign: 'right' }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#14B8A6',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  mb: 0.5
                }}
              >
                {fraseDelDia}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: '#94A3B8',
                  fontSize: '0.75rem',
                  textTransform: 'capitalize'
                }}
              >
                {new Date().toLocaleDateString('es-MX', { 
                  weekday: 'long', 
                  day: 'numeric',
                  month: 'long', 
                  year: 'numeric' 
                })}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button
                variant="contained"
                onClick={() => navigate('/proyectos/nuevo')}
                sx={{
                  bgcolor: '#14B8A6',
                  color: 'white',
                  fontFamily: '"Inter", sans-serif',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  borderRadius: '10px',
                  textTransform: 'none',
                  px: 3.5,
                  py: 1.25,
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s ease',
                  '&:hover': { 
                    bgcolor: '#0F172A',
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)'
                  }
                }}
              >
                Nuevo Proyecto
              </Button>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={fetchDashboardData}
                sx={{
                  borderColor: '#14B8A6',
                  color: '#0F172A',
                  fontFamily: '"Inter", sans-serif',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  borderRadius: '10px',
                  textTransform: 'none',
                  px: 3.5,
                  py: 1.25,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: '#14B8A6',
                    bgcolor: '#F1F5F9',
                    color: '#0F172A'
                  }
                }}
              >
                Actualizar
              </Button>
            </Box>
          </Box>
        </Box>

      {/* Métricas principales */}
      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <MetricCard
            title="Prospectos Nuevos"
            value={metricas.prospectosNuevos}
            icon={<People />}
            color="primary"
            subtitle={`Últimos ${metricas.periodo} días`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <MetricCard
            title="Cotizaciones"
            value={metricas.cotizacionesEnviadas}
            icon={<Assignment />}
            color="secondary"
            subtitle={`Últimos ${metricas.periodo} días`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <MetricCard
            title="Ventas Cerradas"
            value={metricas.ventasCerradas}
            icon={<CheckCircle />}
            color="success"
            subtitle={`${metricas.periodo} días`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <MetricCard
            title="En Riesgo"
            value={metricas.enRiesgo || 0}
            icon={<Warning />}
            color="error"
            subtitle="Proyectos críticos"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <MetricCard
            title="Monto Ventas"
            value={`$${metricas.montoVentas.toLocaleString()}`}
            icon={<TrendingUp />}
            color="warning"
            subtitle={`Conv: ${metricas.tasaConversion}%`}
          />
        </Grid>
      </Grid>

      <Grid container spacing={1.5}>
        {/* Distribución Pipeline - Más grande y a la izquierda */}
        <Grid item xs={12} md={5}>
          <Card 
            elevation={0}
            sx={{ 
              height: '420px',
              bgcolor: 'white',
              border: '1px solid #F1F5F9',
              borderRadius: '16px',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)'
              }
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography 
                variant="h6" 
                gutterBottom 
                sx={{ 
                  fontWeight: 600,
                  color: '#0F172A',
                  mb: 2,
                  fontSize: '1.125rem'
                }}
              >
                📊 Distribución Pipeline
              </Typography>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={embudoData}
                    cx="50%"
                    cy="45%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    paddingAngle={3}
                    outerRadius={100}
                    innerRadius={60}
                    dataKey="value"
                  >
                    {embudoData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Legend 
                    verticalAlign="bottom" 
                    height={60}
                    iconType="circle"
                    wrapperStyle={{ fontSize: '12px' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Pipeline de Ventas - Barras horizontales */}
        <Grid item xs={12} md={7}>
          <Card 
            elevation={0}
            sx={{ 
              height: '420px',
              bgcolor: 'white',
              border: '1px solid #F1F5F9',
              borderRadius: '16px',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)'
              }
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography 
                variant="h6" 
                gutterBottom 
                sx={{ 
                  fontWeight: 600,
                  color: '#0F172A',
                  mb: 2,
                  fontSize: '1.125rem'
                }}
              >
                📈 Pipeline de Ventas
              </Typography>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart 
                  data={embudoData} 
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" />
                  <YAxis 
                    dataKey="name" 
                    type="category"
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    radius={[0, 8, 8, 0]}
                    label={{ position: 'right', fontSize: 12, fontWeight: 'bold' }}
                  >
                    {embudoData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
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
                        primary={cita.cliente?.nombre || 'Sin nombre'}
                        secondary={`${cita.horaCita || 'Sin hora'} - ${cita.cliente?.telefono || 'Sin teléfono'}`}
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
                        primary={prospecto.cliente?.nombre || 'Sin nombre'}
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={prospecto.estadoComercial || 'Sin estado'}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                            <Typography variant="caption">
                              {prospecto.cliente?.telefono || 'Sin teléfono'}
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

        {/* Supervisión en Vivo */}
        {supervisionEnVivo && supervisionEnVivo.length > 0 && (
          <Grid item xs={12}>
            <SupervisionEnVivo tecnicos={supervisionEnVivo} />
          </Grid>
        )}

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
                        primary={actividad.cliente?.nombre || 'Sin nombre'}
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={actividad.estadoComercial || 'Sin estado'}
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

        {/* Cierres Mensuales */}
        {cierresMensuales && cierresMensuales.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Cierres Mensuales (Últimos 6 meses)
                </Typography>
                <Box sx={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Mes</th>
                        <th style={{ padding: '12px', textAlign: 'center' }}>Total Ventas</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>Monto Total</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>Ticket Promedio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cierresMensuales.map((cierre, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '12px' }}>
                            <Typography variant="body2" fontWeight="medium">
                              {cierre.mes}
                            </Typography>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <Chip 
                              label={cierre.totalVentas} 
                              color="primary" 
                              size="small" 
                            />
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <Typography variant="body2" fontWeight="medium" color="success.main">
                              ${cierre.montoTotal.toLocaleString()}
                            </Typography>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <Typography variant="body2" color="text.secondary">
                              ${cierre.promedioTicket.toLocaleString()}
                            </Typography>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
        
        {/* 🎯 Indicador de Meta Semanal */}
        <Grid item xs={12}>
          <Card 
            elevation={0}
            sx={{ 
              bgcolor: 'white',
              border: '1px solid #F1F5F9',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #F8FAFC 0%, #E0F2F1 100%)'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#0F172A', mb: 0.5 }}>
                    🎯 Meta Semanal
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748B' }}>
                    {Math.round((metricas.ventasCerradas / (metricas.ventasCerradas + 5)) * 100)}% completado
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#14B8A6' }}>
                  {metricas.ventasCerradas} / {metricas.ventasCerradas + 5}
                </Typography>
              </Box>
              <Box sx={{ 
                width: '100%', 
                height: 12, 
                bgcolor: '#E2E8F0', 
                borderRadius: '12px',
                overflow: 'hidden'
              }}>
                <Box sx={{ 
                  width: `${Math.min((metricas.ventasCerradas / (metricas.ventasCerradas + 5)) * 100, 100)}%`,
                  height: '100%',
                  bgcolor: '#D4AF37',
                  borderRadius: '12px',
                  transition: 'width 0.5s ease'
                }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      </Box>
    </Box>
  );
};

export default Dashboard;

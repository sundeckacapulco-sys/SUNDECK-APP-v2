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
  LinearProgress,
  Paper,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Schedule,
  CheckCircle,
  Warning,
  People,
  Assessment,
  Refresh,
  Build,
  Timer,
  Star,
  Assignment
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
  Legend
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import axiosConfig from '../../config/axios';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const KPIsInstalaciones = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabActual, setTabActual] = useState(0);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    cargarKPIs();
  }, []);

  const cargarKPIs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axiosConfig.get('/kpis-instalaciones/dashboard');
      setDashboardData(response.data);
      
    } catch (error) {
      console.error('Error cargando KPIs:', error);
      setError('Error al cargar los KPIs de instalaciones');
    } finally {
      setLoading(false);
    }
  };

  const formatearPorcentaje = (valor) => {
    return `${valor || 0}%`;
  };

  const formatearHoras = (valor) => {
    return `${valor || 0}h`;
  };

  const obtenerColorTendencia = (valor, umbralBueno = 80) => {
    if (valor >= umbralBueno) return 'success';
    if (valor >= 60) return 'warning';
    return 'error';
  };

  const renderMetricasGenerales = () => {
    if (!dashboardData?.generales) return null;

    const { generales } = dashboardData;

    const datosEstados = [
      { name: 'Completadas', value: generales.completadas, color: '#4CAF50' },
      { name: 'En Proceso', value: generales.enProceso, color: '#FF9800' },
      { name: 'Programadas', value: generales.programadas, color: '#2196F3' },
      { name: 'Pausadas', value: generales.pausadas, color: '#9E9E9E' },
      { name: 'Canceladas', value: generales.canceladas, color: '#F44336' }
    ].filter(item => item.value > 0);

    return (
      <Grid container spacing={3}>
        {/* Métricas principales */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Build sx={{ fontSize: 40, color: '#2196F3', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {generales.totalInstalaciones}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Instalaciones
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckCircle sx={{ fontSize: 40, color: '#4CAF50', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {formatearPorcentaje(generales.tasaCompletitud)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tasa de Completitud
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Warning sx={{ fontSize: 40, color: '#FF9800', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold" color="warning.main">
                {formatearPorcentaje(generales.tasaCancelacion)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tasa de Cancelación
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Assignment sx={{ fontSize: 40, color: '#9C27B0', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {generales.completadas}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completadas
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Gráfico de distribución de estados */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📊 Distribución por Estado
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={datosEstados}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {datosEstados.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Alertas operativas */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🚨 Alertas Operativas
              </Typography>
              {dashboardData.alertas?.length > 0 ? (
                <Box>
                  {dashboardData.alertas.map((alerta, index) => (
                    <Alert 
                      key={index} 
                      severity={alerta.tipo} 
                      sx={{ mb: 1 }}
                    >
                      <strong>{alerta.titulo}:</strong> {alerta.mensaje}
                    </Alert>
                  ))}
                </Box>
              ) : (
                <Alert severity="success">
                  ✅ No hay alertas operativas pendientes
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderMetricasTiempo = () => {
    if (!dashboardData?.tiempo) return null;

    const { tiempo } = dashboardData;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Timer sx={{ fontSize: 40, color: '#2196F3', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {formatearHoras(tiempo.tiempoEstimadoPromedio)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tiempo Estimado Promedio
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Schedule sx={{ fontSize: 40, color: '#4CAF50', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {formatearPorcentaje(tiempo.tasaPuntualidad)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Puntualidad
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUp sx={{ fontSize: 40, color: '#FF9800', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold" color="warning.main">
                {formatearPorcentaje(tiempo.eficienciaTemporal)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Eficiencia Temporal
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                ⏱️ Análisis de Tiempos
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      Tiempo Real Promedio: {formatearHoras(tiempo.tiempoRealPromedio)}
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min((tiempo.tiempoRealPromedio / 8) * 100, 100)} 
                      color="primary"
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      Variación de Tiempo: {tiempo.variacionTiempoPromedio > 0 ? '+' : ''}{tiempo.variacionTiempoPromedio}h
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.abs(tiempo.variacionTiempoPromedio) * 20} 
                      color={tiempo.variacionTiempoPromedio > 0 ? "warning" : "success"}
                    />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderMetricasCalidad = () => {
    if (!dashboardData?.calidad) return null;

    const { calidad } = dashboardData;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Star sx={{ fontSize: 40, color: '#FFD700', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {formatearPorcentaje(calidad.calidadPromedio)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Calidad Promedio
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckCircle sx={{ fontSize: 40, color: '#4CAF50', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {formatearPorcentaje(calidad.tasaSinProblemas)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sin Problemas
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Assessment sx={{ fontSize: 40, color: '#2196F3', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {calidad.satisfaccionCliente}/5
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Satisfacción Cliente
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Warning sx={{ fontSize: 40, color: '#F44336', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold" color="error.main">
                {calidad.instalacionesConIncidencias}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Con Incidencias
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📈 Índice de Calidad General
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ width: '100%', mr: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={calidad.indiceCalidadGeneral} 
                    color={obtenerColorTendencia(calidad.indiceCalidadGeneral)}
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                </Box>
                <Box sx={{ minWidth: 35 }}>
                  <Typography variant="body2" color="text.secondary">
                    {calidad.indiceCalidadGeneral}%
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Índice calculado basado en completitud de checklist, ausencia de problemas y satisfacción del cliente
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderMetricasCuadrillas = () => {
    if (!dashboardData?.cuadrillas?.topInstaladores) return null;

    const { cuadrillas } = dashboardData;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🏆 Top Instaladores del Período
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Instalador</TableCell>
                      <TableCell align="center">Instalaciones</TableCell>
                      <TableCell align="center">Completadas</TableCell>
                      <TableCell align="center">Tasa Completitud</TableCell>
                      <TableCell align="center">Horas Trabajadas</TableCell>
                      <TableCell align="center">Productividad</TableCell>
                      <TableCell align="center">Rol</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cuadrillas.topInstaladores.map((instalador, index) => (
                      <TableRow key={instalador._id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {index === 0 && <Star sx={{ color: '#FFD700', mr: 1 }} />}
                            {instalador.nombre}
                          </Box>
                        </TableCell>
                        <TableCell align="center">{instalador.totalInstalaciones}</TableCell>
                        <TableCell align="center">{instalador.instalacionesCompletadas}</TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={`${instalador.tasaCompletitud}%`}
                            color={obtenerColorTendencia(instalador.tasaCompletitud)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">{formatearHoras(instalador.horasTrabajadas)}</TableCell>
                        <TableCell align="center">{instalador.productividad}</TableCell>
                        <TableCell align="center">
                          {instalador.esLider ? (
                            <Chip label="Líder" color="primary" size="small" />
                          ) : (
                            <Chip label="Instalador" variant="outlined" size="small" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderTendencias = () => {
    if (!dashboardData?.tendencias) return null;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📈 Tendencias Semanales
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={dashboardData.tendencias}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="semana" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="instalaciones" 
                    stroke="#2196F3" 
                    strokeWidth={2}
                    name="Total Instalaciones"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="completadas" 
                    stroke="#4CAF50" 
                    strokeWidth={2}
                    name="Completadas"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="tasaCompletitud" 
                    stroke="#FF9800" 
                    strokeWidth={2}
                    name="Tasa Completitud (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Cargando KPIs de instalaciones...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        {error}
        <Button onClick={cargarKPIs} sx={{ ml: 2 }}>
          Reintentar
        </Button>
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          📊 KPIs de Instalaciones
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={cargarKPIs}
            disabled={loading}
          >
            Actualizar
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate('/instalaciones/programar')}
          >
            Nueva Instalación
          </Button>
        </Box>
      </Box>

      {/* Tabs de métricas */}
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={tabActual}
          onChange={(e, newValue) => setTabActual(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="📊 General" />
          <Tab label="⏱️ Tiempo" />
          <Tab label="⭐ Calidad" />
          <Tab label="👥 Cuadrillas" />
          <Tab label="📈 Tendencias" />
        </Tabs>
      </Card>

      {/* Contenido de tabs */}
      <Box>
        {tabActual === 0 && renderMetricasGenerales()}
        {tabActual === 1 && renderMetricasTiempo()}
        {tabActual === 2 && renderMetricasCalidad()}
        {tabActual === 3 && renderMetricasCuadrillas()}
        {tabActual === 4 && renderTendencias()}
      </Box>

      {/* Información adicional */}
      {dashboardData && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              📅 Última actualización: {new Date(dashboardData.fechaActualizacion).toLocaleString('es-MX')}
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default KPIsInstalaciones;

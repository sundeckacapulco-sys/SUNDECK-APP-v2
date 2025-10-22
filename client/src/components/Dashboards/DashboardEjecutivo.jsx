import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Alert,
  LinearProgress,
  Avatar,
  Tooltip,
  Tabs,
  Tab,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Build as BuildIcon,
  Home as HomeIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  Speed as SpeedIcon,
  AccountBalance as AccountBalanceIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import axiosConfig from '../../config/axios';

const DashboardEjecutivo = () => {
  const [tabValue, setTabValue] = useState(0);
  const [periodo, setPeriodo] = useState('mes');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [kpisGenerales, setKpisGenerales] = useState({
    ventasTotales: 0,
    metaMensual: 500000,
    proyectosActivos: 0,
    clientesActivos: 0,
    ticketPromedio: 0,
    conversionGeneral: 0,
    rentabilidadPromedio: 0,
    satisfaccionCliente: 0
  });

  const [estadisticasOperativas, setEstadisticasOperativas] = useState({
    enCotizacion: 0,
    confirmados: 0,
    enFabricacion: 0,
    fabricados: 0,
    enInstalacion: 0,
    completados: 0,
    retrasados: 0,
    sinPagar: 0
  });

  const [rendimientoVendedores, setRendimientoVendedores] = useState([]);
  const [tendenciasVentas, setTendenciasVentas] = useState([]);
  const [distribucionProductos, setDistribucionProductos] = useState([]);
  const [alertas, setAlertas] = useState([]);

  useEffect(() => {
    cargarDashboard();
  }, [periodo]);

  const cargarDashboard = async () => {
    try {
      setLoading(true);
      
      // Cargar KPIs generales
      const kpisResponse = await axiosConfig.get('/reportes/kpis-ejecutivos', {
        params: { periodo }
      });
      
      // Cargar estadísticas operativas
      const operativasResponse = await axiosConfig.get('/proyecto-pedido/estadisticas');
      
      // Cargar rendimiento de vendedores
      const vendedoresResponse = await axiosConfig.get('/reportes/rendimiento-vendedores', {
        params: { periodo }
      });
      
      // Cargar tendencias de ventas
      const tendenciasResponse = await axiosConfig.get('/reportes/tendencias-ventas', {
        params: { periodo }
      });
      
      // Cargar distribución de productos
      const productosResponse = await axiosConfig.get('/reportes/distribucion-productos', {
        params: { periodo }
      });
      
      // Cargar alertas
      const alertasResponse = await axiosConfig.get('/reportes/alertas-ejecutivas');

      // Procesar respuestas
      if (kpisResponse.data.success) {
        setKpisGenerales(kpisResponse.data.data);
      }
      
      if (operativasResponse.data.success) {
        const stats = operativasResponse.data.data.porEstado;
        setEstadisticasOperativas({
          enCotizacion: stats.find(s => s._id === 'cotizado')?.count || 0,
          confirmados: stats.find(s => s._id === 'confirmado')?.count || 0,
          enFabricacion: stats.find(s => s._id === 'en_fabricacion')?.count || 0,
          fabricados: stats.find(s => s._id === 'fabricado')?.count || 0,
          enInstalacion: stats.find(s => s._id === 'en_instalacion')?.count || 0,
          completados: stats.find(s => s._id === 'completado')?.count || 0,
          retrasados: operativasResponse.data.data.retrasados || 0,
          sinPagar: operativasResponse.data.data.sinPagar || 0
        });
      }
      
      if (vendedoresResponse.data.success) {
        setRendimientoVendedores(vendedoresResponse.data.data);
      }
      
      if (tendenciasResponse.data.success) {
        setTendenciasVentas(tendenciasResponse.data.data);
      }
      
      if (productosResponse.data.success) {
        setDistribucionProductos(productosResponse.data.data);
      }
      
      if (alertasResponse.data.success) {
        setAlertas(alertasResponse.data.data);
      }

    } catch (error) {
      console.error('Error cargando dashboard:', error);
      setError('Error cargando información ejecutiva');
    } finally {
      setLoading(false);
    }
  };

  const formatearMoneda = (monto) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(monto);
  };

  const calcularProgreso = (meta, actual) => {
    return Math.min((actual / meta) * 100, 100);
  };

  const getColorAlerta = (tipo) => {
    const colores = {
      'critica': '#ef4444',
      'advertencia': '#f59e0b',
      'info': '#3b82f6'
    };
    return colores[tipo] || '#6b7280';
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#D4AF37', mb: 1 }}>
            📊 Dashboard Ejecutivo
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Visión global del negocio y métricas clave
          </Typography>
        </Box>
        
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Período</InputLabel>
          <Select
            value={periodo}
            label="Período"
            onChange={(e) => setPeriodo(e.target.value)}
          >
            <MenuItem value="semana">Esta Semana</MenuItem>
            <MenuItem value="mes">Este Mes</MenuItem>
            <MenuItem value="trimestre">Trimestre</MenuItem>
            <MenuItem value="año">Este Año</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* KPIs Principales */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <MoneyIcon sx={{ color: '#10b981', mr: 1, fontSize: 32 }} />
                <Box>
                  <Typography variant="h5" component="div" fontWeight="bold">
                    {formatearMoneda(kpisGenerales.ventasTotales)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ventas Totales
                  </Typography>
                </Box>
              </Box>
              <LinearProgress
                variant="determinate"
                value={calcularProgreso(kpisGenerales.metaMensual, kpisGenerales.ventasTotales)}
                sx={{ mb: 1, height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption" color="text.secondary">
                Meta: {formatearMoneda(kpisGenerales.metaMensual)} ({Math.round(calcularProgreso(kpisGenerales.metaMensual, kpisGenerales.ventasTotales))}%)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AssignmentIcon sx={{ color: '#3b82f6', mr: 1, fontSize: 32 }} />
                <Box>
                  <Typography variant="h5" component="div" fontWeight="bold">
                    {kpisGenerales.proyectosActivos}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Proyectos Activos
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <SpeedIcon sx={{ color: '#8b5cf6', mr: 1, fontSize: 32 }} />
                <Box>
                  <Typography variant="h5" component="div" fontWeight="bold">
                    {kpisGenerales.conversionGeneral}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Conversión General
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AccountBalanceIcon sx={{ color: '#f59e0b', mr: 1, fontSize: 32 }} />
                <Box>
                  <Typography variant="h5" component="div" fontWeight="bold">
                    {formatearMoneda(kpisGenerales.ticketPromedio)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ticket Promedio
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Alertas Críticas */}
      {alertas.length > 0 && (
        <Card sx={{ mb: 3, bgcolor: '#fef2f2', borderLeft: '4px solid #ef4444' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, color: '#ef4444' }}>
              🚨 Alertas Críticas
            </Typography>
            {alertas.map((alerta, index) => (
              <Alert 
                key={index} 
                severity={alerta.tipo === 'critica' ? 'error' : alerta.tipo === 'advertencia' ? 'warning' : 'info'}
                sx={{ mb: 1 }}
              >
                {alerta.mensaje}
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Estados Operativos */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            🏭 Estado Operativo General
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={4} md={2}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="#f59e0b">
                  {estadisticasOperativas.enCotizacion}
                </Typography>
                <Typography variant="caption">En Cotización</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="#3b82f6">
                  {estadisticasOperativas.confirmados}
                </Typography>
                <Typography variant="caption">Confirmados</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="#8b5cf6">
                  {estadisticasOperativas.enFabricacion}
                </Typography>
                <Typography variant="caption">En Fabricación</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="#06b6d4">
                  {estadisticasOperativas.enInstalacion}
                </Typography>
                <Typography variant="caption">En Instalación</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="#10b981">
                  {estadisticasOperativas.completados}
                </Typography>
                <Typography variant="caption">Completados</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="#ef4444">
                  {estadisticasOperativas.retrasados}
                </Typography>
                <Typography variant="caption">Retrasados</Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs de Análisis */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="📈 Tendencias" />
            <Tab label="👥 Vendedores" />
            <Tab label="📊 Productos" />
            <Tab label="💰 Financiero" />
          </Tabs>
        </Box>

        {/* Tab Panel - Tendencias */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ height: 400 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Tendencia de Ventas
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tendenciasVentas}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="periodo" />
                <YAxis />
                <RechartsTooltip formatter={(value) => formatearMoneda(value)} />
                <Line 
                  type="monotone" 
                  dataKey="ventas" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="meta" 
                  stroke="#ef4444" 
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </TabPanel>

        {/* Tab Panel - Vendedores */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Rendimiento por Vendedor
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Vendedor</TableCell>
                  <TableCell>Ventas</TableCell>
                  <TableCell>Meta</TableCell>
                  <TableCell>Conversión</TableCell>
                  <TableCell>Proyectos</TableCell>
                  <TableCell>Rendimiento</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rendimientoVendedores.map((vendedor, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 1, bgcolor: '#1976D2' }}>
                          {vendedor.nombre.charAt(0)}
                        </Avatar>
                        <Typography variant="body2">
                          {vendedor.nombre}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {formatearMoneda(vendedor.ventas)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatearMoneda(vendedor.meta)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {vendedor.conversion}%
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {vendedor.proyectos}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <LinearProgress
                        variant="determinate"
                        value={calcularProgreso(vendedor.meta, vendedor.ventas)}
                        sx={{ width: 100 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Tab Panel - Productos */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Distribución por Producto
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={distribucionProductos}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {distribucionProductos.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Ventas por Producto
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={distribucionProductos}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip formatter={(value) => formatearMoneda(value)} />
                  <Bar dataKey="ventas" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab Panel - Financiero */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card sx={{ bgcolor: '#f0f9ff' }}>
                <CardContent>
                  <Typography variant="h6" color="#3b82f6">
                    Ingresos Totales
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {formatearMoneda(kpisGenerales.ventasTotales)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card sx={{ bgcolor: '#f0fdf4' }}>
                <CardContent>
                  <Typography variant="h6" color="#10b981">
                    Rentabilidad Promedio
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {kpisGenerales.rentabilidadPromedio}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card sx={{ bgcolor: '#fefce8' }}>
                <CardContent>
                  <Typography variant="h6" color="#f59e0b">
                    Cuentas por Cobrar
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {estadisticasOperativas.sinPagar}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>
    </Box>
  );
};

export default DashboardEjecutivo;

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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  LinearProgress,
  Avatar,
  Tooltip,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  WhatsApp as WhatsAppIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import axiosConfig from '../../config/axios';

const DashboardVentas = () => {
  const [tabValue, setTabValue] = useState(0);
  const [proyectos, setProyectos] = useState([]);
  const [prospectos, setProspectos] = useState([]);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [kpis, setKpis] = useState({
    ventasDelMes: 0,
    metaMensual: 100000,
    prospectosMes: 0,
    conversionRate: 0,
    ticketPromedio: 0,
    proyectosActivos: 0
  });

  useEffect(() => {
    cargarDatos();
    cargarKPIs();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Cargar proyectos del vendedor
      const proyectosResponse = await axiosConfig.get('/proyecto-pedido', {
        params: {
          vendedor: 'current_user',
          limit: 20
        }
      });

      // Cargar prospectos asignados
      const prospectosResponse = await axiosConfig.get('/prospectos', {
        params: {
          asignadoA: 'current_user',
          limit: 20
        }
      });

      // Cargar cotizaciones
      const cotizacionesResponse = await axiosConfig.get('/cotizaciones', {
        params: {
          vendedor: 'current_user',
          limit: 20
        }
      });

      if (proyectosResponse.data.success) {
        setProyectos(proyectosResponse.data.data.docs || []);
      }
      
      if (prospectosResponse.data.success) {
        setProspectos(prospectosResponse.data.data || []);
      }
      
      if (cotizacionesResponse.data.success) {
        setCotizaciones(cotizacionesResponse.data.data || []);
      }

    } catch (error) {
      console.error('Error cargando datos:', error);
      setError('Error cargando información comercial');
    } finally {
      setLoading(false);
    }
  };

  const cargarKPIs = async () => {
    try {
      const response = await axiosConfig.get('/reportes/kpis-vendedor');
      if (response.data.success) {
        setKpis(response.data.data);
      }
    } catch (error) {
      console.error('Error cargando KPIs:', error);
    }
  };

  const contactarCliente = (tipo, contacto) => {
    switch (tipo) {
      case 'whatsapp':
        window.open(`https://wa.me/52${contacto.replace(/\D/g, '')}`, '_blank');
        break;
      case 'telefono':
        window.open(`tel:${contacto}`);
        break;
      case 'email':
        window.open(`mailto:${contacto}`);
        break;
    }
  };

  const formatearMoneda = (monto) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(monto);
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getColorEstado = (estado) => {
    const colores = {
      'cotizado': '#f59e0b',
      'confirmado': '#3b82f6',
      'en_fabricacion': '#8b5cf6',
      'fabricado': '#10b981',
      'en_instalacion': '#06b6d4',
      'completado': '#059669',
      'cancelado': '#ef4444'
    };
    return colores[estado] || '#6b7280';
  };

  const calcularProgreso = (meta, actual) => {
    return Math.min((actual / meta) * 100, 100);
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#1976D2', mb: 1 }}>
          💼 Panel Comercial
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          KPIs, seguimiento de ventas y gestión de clientes
        </Typography>
      </Box>

      {/* KPIs */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <MoneyIcon sx={{ color: '#10b981', mr: 1 }} />
                <Typography variant="h6" component="div">
                  {formatearMoneda(kpis.ventasDelMes)}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Ventas del Mes
              </Typography>
              <LinearProgress
                variant="determinate"
                value={calcularProgreso(kpis.metaMensual, kpis.ventasDelMes)}
                sx={{ mb: 1 }}
              />
              <Typography variant="caption" color="text.secondary">
                Meta: {formatearMoneda(kpis.metaMensual)} ({Math.round(calcularProgreso(kpis.metaMensual, kpis.ventasDelMes))}%)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PeopleIcon sx={{ color: '#3b82f6', mr: 1 }} />
                <Typography variant="h6" component="div">
                  {kpis.prospectosMes}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Prospectos del Mes
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUpIcon sx={{ color: '#8b5cf6', mr: 1 }} />
                <Typography variant="h6" component="div">
                  {kpis.conversionRate}%
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Tasa de Conversión
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AssignmentIcon sx={{ color: '#f59e0b', mr: 1 }} />
                <Typography variant="h6" component="div">
                  {kpis.proyectosActivos}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Proyectos Activos
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="🏗️ Mis Proyectos" />
            <Tab label="👥 Mis Prospectos" />
            <Tab label="💰 Mis Cotizaciones" />
          </Tabs>
        </Box>

        {/* Tab Panel - Proyectos */}
        <TabPanel value={tabValue} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Proyecto</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Monto</TableCell>
                  <TableCell>Progreso</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <LinearProgress />
                    </TableCell>
                  </TableRow>
                ) : proyectos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No tienes proyectos asignados
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  proyectos.map((proyecto) => (
                    <TableRow key={proyecto._id} hover>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {proyecto.numero}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ mr: 1, bgcolor: '#1976D2' }}>
                            {proyecto.cliente.nombre.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2">
                              {proyecto.cliente.nombre}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {proyecto.cliente.telefono}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Chip
                          label={proyecto.estado}
                          size="small"
                          sx={{
                            bgcolor: getColorEstado(proyecto.estado),
                            color: 'white'
                          }}
                        />
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {formatearMoneda(proyecto.pagos.montoTotal)}
                        </Typography>
                        {!proyecto.pagos.anticipo.pagado && (
                          <Typography variant="caption" color="error">
                            Anticipo pendiente
                          </Typography>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <Box sx={{ width: '100%' }}>
                          <LinearProgress
                            variant="determinate"
                            value={proyecto.estadisticas?.progreso || 0}
                            sx={{ mb: 1 }}
                          />
                          <Typography variant="caption">
                            {proyecto.estadisticas?.progreso || 0}%
                          </Typography>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          {formatearFecha(proyecto.createdAt)}
                        </Typography>
                      </TableCell>
                      
                      <TableCell align="center">
                        <Tooltip title="Ver detalles">
                          <IconButton
                            onClick={() => {
                              setSelectedItem(proyecto);
                              setDialogOpen(true);
                            }}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="WhatsApp">
                          <IconButton
                            onClick={() => contactarCliente('whatsapp', proyecto.cliente.telefono)}
                            sx={{ color: '#25D366' }}
                          >
                            <WhatsAppIcon />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Llamar">
                          <IconButton
                            onClick={() => contactarCliente('telefono', proyecto.cliente.telefono)}
                          >
                            <PhoneIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Tab Panel - Prospectos */}
        <TabPanel value={tabValue} index={1}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Prospecto</TableCell>
                  <TableCell>Contacto</TableCell>
                  <TableCell>Producto</TableCell>
                  <TableCell>Etapa</TableCell>
                  <TableCell>Última Actividad</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {prospectos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No tienes prospectos asignados
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  prospectos.map((prospecto) => (
                    <TableRow key={prospecto._id} hover>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {prospecto.nombre}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          {prospecto.telefono}
                        </Typography>
                        {prospecto.email && (
                          <Typography variant="caption" color="text.secondary">
                            {prospecto.email}
                          </Typography>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          {prospecto.producto}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Chip
                          label={prospecto.etapa}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          {formatearFecha(prospecto.updatedAt)}
                        </Typography>
                      </TableCell>
                      
                      <TableCell align="center">
                        <Tooltip title="WhatsApp">
                          <IconButton
                            onClick={() => contactarCliente('whatsapp', prospecto.telefono)}
                            sx={{ color: '#25D366' }}
                          >
                            <WhatsAppIcon />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Llamar">
                          <IconButton
                            onClick={() => contactarCliente('telefono', prospecto.telefono)}
                          >
                            <PhoneIcon />
                          </IconButton>
                        </Tooltip>
                        
                        {prospecto.email && (
                          <Tooltip title="Email">
                            <IconButton
                              onClick={() => contactarCliente('email', prospecto.email)}
                            >
                              <EmailIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Tab Panel - Cotizaciones */}
        <TabPanel value={tabValue} index={2}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Número</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Monto</TableCell>
                  <TableCell>Válida Hasta</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cotizaciones.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No tienes cotizaciones
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  cotizaciones.map((cotizacion) => (
                    <TableRow key={cotizacion._id} hover>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {cotizacion.numero}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          {cotizacion.prospecto?.nombre || 'Cliente directo'}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Chip
                          label={cotizacion.estado}
                          size="small"
                          color={cotizacion.estado === 'aprobada' ? 'success' : 
                                 cotizacion.estado === 'rechazada' ? 'error' : 'default'}
                        />
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {formatearMoneda(cotizacion.total)}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          {formatearFecha(cotizacion.validoHasta)}
                        </Typography>
                      </TableCell>
                      
                      <TableCell align="center">
                        <Tooltip title="Ver cotización">
                          <IconButton>
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Editar">
                          <IconButton>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Card>

      {/* Dialog de Detalles */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          📋 Detalles del Proyecto - {selectedItem?.numero}
        </DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Cliente
                  </Typography>
                  <Typography variant="body1">
                    {selectedItem.cliente.nombre}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedItem.cliente.telefono}
                  </Typography>
                  {selectedItem.cliente.email && (
                    <Typography variant="body2" color="text.secondary">
                      {selectedItem.cliente.email}
                    </Typography>
                  )}
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Información Comercial
                  </Typography>
                  <Typography variant="body2">
                    <strong>Monto Total:</strong> {formatearMoneda(selectedItem.pagos?.montoTotal || 0)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Anticipo:</strong> {selectedItem.pagos?.anticipo?.pagado ? '✅ Pagado' : '❌ Pendiente'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Saldo:</strong> {selectedItem.pagos?.saldo?.pagado ? '✅ Pagado' : '❌ Pendiente'}
                  </Typography>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" sx={{ mb: 1 }}>
                Productos
              </Typography>
              {selectedItem.productos?.map((producto, index) => (
                <Card key={index} sx={{ mb: 1, bgcolor: '#f8fafc' }}>
                  <CardContent sx={{ py: 1 }}>
                    <Typography variant="body2">
                      {producto.nombre} - {producto.medidas?.ancho}m × {producto.medidas?.alto}m
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DashboardVentas;

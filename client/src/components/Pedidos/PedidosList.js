import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  LinearProgress,
  Grid,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  MoreVert,
  Visibility,
  Build,
  Payment,
  CheckCircle,
  Schedule,
  Warning,
  Home,
  Receipt,
  WhatsApp
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axiosConfig from '../../config/axios';
import GestionFabricacion from './GestionFabricacion';
import GeneradorWhatsApp from '../WhatsApp/GeneradorWhatsApp';

const PedidosList = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [fabricacionModalOpen, setFabricacionModalOpen] = useState(false);
  const [pagoSaldoModalOpen, setPagoSaldoModalOpen] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  
  // Estados para WhatsApp
  const [openWhatsApp, setOpenWhatsApp] = useState(false);
  const [contextoWhatsApp, setContextoWhatsApp] = useState('');

  // Estados para pago de saldo
  const [pagoSaldoData, setPagoSaldoData] = useState({
    metodoPago: 'efectivo',
    referencia: '',
    comprobante: '',
    fechaPago: new Date().toISOString().slice(0, 10)
  });

  const navigate = useNavigate();

  const estadoColors = {
    confirmado: 'primary',
    en_fabricacion: 'warning',
    fabricado: 'info',
    en_instalacion: 'secondary',
    instalado: 'success',
    entregado: 'success',
    cancelado: 'error'
  };

  const estadoLabels = {
    confirmado: '📋 Confirmado',
    en_fabricacion: '🔨 En Fabricación',
    fabricado: '✅ Fabricado',
    en_instalacion: '🚚 En Instalación',
    instalado: '🏠 Instalado',
    entregado: '✅ Entregado',
    cancelado: '❌ Cancelado'
  };

  useEffect(() => {
    fetchPedidos();
  }, [filtroEstado]);

  const fetchPedidos = async () => {
    try {
      setLoading(true);
      const params = filtroEstado && filtroEstado !== 'todos' ? { estado: filtroEstado } : {};
      const response = await axiosConfig.get('/pedidos', { params });
      setPedidos(response.data || []);
    } catch (error) {
      console.error('Error fetching pedidos:', error);
      setError('Error cargando pedidos');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = (event, pedido) => {
    setAnchorEl(event.currentTarget);
    setSelectedPedido(pedido);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPedido(null);
  };

  const handleGestionFabricacion = (pedido) => {
    setSelectedPedido(pedido);
    setFabricacionModalOpen(true);
    handleMenuClose();
  };

  const handlePagarSaldo = (pedido) => {
    setSelectedPedido(pedido);
    setPagoSaldoModalOpen(true);
    handleMenuClose();
  };

  const handlePagoSaldoSubmit = async () => {
    try {
      const response = await axiosConfig.put(`/pedidos/${selectedPedido._id}/pagar-saldo`, pagoSaldoData);
      setSuccess('Saldo pagado exitosamente');
      fetchPedidos();
      setPagoSaldoModalOpen(false);
      setPagoSaldoData({
        metodoPago: 'efectivo',
        referencia: '',
        comprobante: '',
        fechaPago: new Date().toISOString().slice(0, 10)
      });
    } catch (error) {
      setError(error.response?.data?.message || 'Error registrando pago');
    }
  };

  const calcularProgreso = (pedido) => {
    const estados = ['confirmado', 'en_fabricacion', 'fabricado', 'instalado'];
    const estadoActual = pedido.estado;
    const indiceActual = estados.indexOf(estadoActual);
    return indiceActual >= 0 ? ((indiceActual + 1) / estados.length) * 100 : 0;
  };

  const calcularDiasRetraso = (pedido) => {
    const hoy = new Date();
    let fechaLimite;
    
    switch(pedido.estado) {
      case 'confirmado':
        fechaLimite = pedido.fechaInicioFabricacion;
        break;
      case 'en_fabricacion':
        fechaLimite = pedido.fechaFinFabricacion;
        break;
      case 'fabricado':
        fechaLimite = pedido.fechaInstalacion;
        break;
      default:
        return 0;
    }
    
    if (!fechaLimite || hoy <= new Date(fechaLimite)) return 0;
    return Math.ceil((hoy - new Date(fechaLimite)) / (1000 * 60 * 60 * 24));
  };

  const metodosPago = [
    { value: 'efectivo', label: '💵 Efectivo' },
    { value: 'transferencia', label: '🏦 Transferencia' },
    { value: 'tarjeta', label: '💳 Tarjeta' },
    { value: 'cheque', label: '📄 Cheque' },
    { value: 'deposito', label: '🏧 Depósito' }
  ];

  // Funciones para WhatsApp
  const abrirGeneradorWhatsApp = (pedido, contexto) => {
    setSelectedPedido(pedido);
    setContextoWhatsApp(contexto);
    setOpenWhatsApp(true);
    handleMenuClose();
  };

  const obtenerContextoPorEstado = (estado) => {
    const contextos = {
      'confirmado': 'anticipo_confirmado',
      'en_fabricacion': 'fabricacion_iniciada',
      'fabricado': 'producto_terminado',
      'instalado': 'instalacion_completada',
      'entregado': 'post_instalacion'
    };
    return contextos[estado] || 'fabricacion_iniciada';
  };

  const handleMensajeWhatsAppGenerado = (mensaje, plantilla) => {
    console.log('Mensaje WhatsApp generado:', mensaje);
    console.log('Plantilla usada:', plantilla);
    setOpenWhatsApp(false);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          🔨 Gestión de Pedidos y Fabricación
        </Typography>
        
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filtrar por Estado</InputLabel>
          <Select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            label="Filtrar por Estado"
          >
            <MenuItem value="">Todos los estados</MenuItem>
            <MenuItem value="confirmado">📋 Confirmado</MenuItem>
            <MenuItem value="en_fabricacion">🔨 En Fabricación</MenuItem>
            <MenuItem value="fabricado">✅ Fabricado</MenuItem>
            <MenuItem value="en_instalacion">🚚 En Instalación</MenuItem>
            <MenuItem value="instalado">🏠 Instalado</MenuItem>
            <MenuItem value="entregado">✅ Entregado</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Estadísticas rápidas */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={2}>
          <Card sx={{ bgcolor: '#e3f2fd', border: '2px solid #2196f3' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                {pedidos.filter(p => p.estado === 'confirmado').length}
              </Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>
                📋 Confirmados
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2}>
          <Card sx={{ bgcolor: '#fff3e0', border: '2px solid #ff9800' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ color: '#f57c00', fontWeight: 'bold' }}>
                {pedidos.filter(p => p.estado === 'en_fabricacion').length}
              </Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>
                🔨 En Fabricación
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2}>
          <Card sx={{ bgcolor: '#e8f5e8', border: '2px solid #4caf50' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ color: '#388e3c', fontWeight: 'bold' }}>
                {pedidos.filter(p => p.estado === 'fabricado').length}
              </Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>
                ✅ Fabricados
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2}>
          <Card sx={{ bgcolor: '#e1f5fe', border: '2px solid #00bcd4' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ color: '#0097a7', fontWeight: 'bold' }}>
                {pedidos.filter(p => p.estado === 'en_instalacion').length}
              </Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>
                🚚 En Instalación
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2}>
          <Card sx={{ bgcolor: '#f3e5f5', border: '2px solid #9c27b0' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ color: '#7b1fa2', fontWeight: 'bold' }}>
                {pedidos.filter(p => p.estado === 'instalado').length}
              </Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>
                🏠 Instalados
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2}>
          <Card sx={{ bgcolor: '#e8f5e8', border: '2px solid #4caf50' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ color: '#2e7d32', fontWeight: 'bold' }}>
                {pedidos.filter(p => p.estado === 'entregado').length}
              </Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>
                ✅ Entregados
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#2563eb' }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Pedido</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Cliente</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Total</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Estado</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Progreso</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Pagos</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Fechas</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  Cargando pedidos...
                </TableCell>
              </TableRow>
            ) : pedidos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No se encontraron pedidos
                </TableCell>
              </TableRow>
            ) : (
              pedidos.map((pedido) => {
                const progreso = calcularProgreso(pedido);
                const diasRetraso = calcularDiasRetraso(pedido);
                
                return (
                  <TableRow key={pedido._id} hover>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        {pedido.numero}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {pedido.cotizacion?.numero}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {pedido.prospecto?.nombre}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {pedido.prospecto?.telefono}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        ${pedido.montoTotal?.toLocaleString()}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={estadoLabels[pedido.estado] || pedido.estado}
                          color={estadoColors[pedido.estado]}
                          size="small"
                        />
                        {diasRetraso > 0 && (
                          <Chip
                            label={`${diasRetraso}d retraso`}
                            color="error"
                            size="small"
                            icon={<Warning />}
                          />
                        )}
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Box sx={{ width: '100%', mr: 1 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={progreso} 
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            bgcolor: '#e0e0e0',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: progreso === 100 ? '#4caf50' : progreso >= 75 ? '#ff9800' : '#2196f3'
                            }
                          }} 
                        />
                        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 0.5 }}>
                          {Math.round(progreso)}%
                        </Typography>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Chip
                          label={`Anticipo: ${pedido.anticipo?.pagado ? '✅' : '❌'}`}
                          color={pedido.anticipo?.pagado ? 'success' : 'error'}
                          size="small"
                        />
                        <Chip
                          label={`Saldo: ${pedido.saldo?.pagado ? '✅' : '❌'}`}
                          color={pedido.saldo?.pagado ? 'success' : 'error'}
                          size="small"
                        />
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="caption" sx={{ display: 'block' }}>
                        <strong>Inicio:</strong> {pedido.fechaInicioFabricacion ? new Date(pedido.fechaInicioFabricacion).toLocaleDateString('es-MX') : 'Pendiente'}
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block' }}>
                        <strong>Entrega:</strong> {pedido.fechaEntrega ? new Date(pedido.fechaEntrega).toLocaleDateString('es-MX') : 'Por definir'}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <IconButton
                        onClick={(e) => handleMenuClick(e, pedido)}
                        size="small"
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Menú de acciones */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            navigate(`/prospectos/${selectedPedido?.prospecto._id || selectedPedido?.prospecto}`);
            handleMenuClose();
          }}
        >
          <Visibility sx={{ mr: 1 }} />
          Ver Prospecto
        </MenuItem>
        
        <MenuItem
          onClick={() => handleGestionFabricacion(selectedPedido)}
        >
          <Build sx={{ mr: 1 }} />
          Gestión Fabricación
        </MenuItem>
        
        <MenuItem
          onClick={() => abrirGeneradorWhatsApp(selectedPedido, obtenerContextoPorEstado(selectedPedido?.estado))}
          sx={{ color: '#25D366', fontWeight: 'bold' }}
        >
          <WhatsApp sx={{ mr: 1 }} />
          💬 Generar WhatsApp
        </MenuItem>
        
        {!selectedPedido?.saldo?.pagado && (
          <MenuItem
            onClick={() => handlePagarSaldo(selectedPedido)}
            sx={{ color: '#4caf50' }}
          >
            <Payment sx={{ mr: 1 }} />
            Registrar Pago Saldo
          </MenuItem>
        )}
      </Menu>

      {/* Modal de gestión de fabricación */}
      <Dialog 
        open={fabricacionModalOpen} 
        onClose={() => setFabricacionModalOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#2563eb', color: 'white' }}>
          🔨 Gestión de Fabricación - {selectedPedido?.numero}
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {selectedPedido && (
            <GestionFabricacion 
              pedido={selectedPedido}
              onUpdate={(pedidoActualizado) => {
                fetchPedidos();
                setSelectedPedido(pedidoActualizado);
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFabricacionModalOpen(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de pago de saldo */}
      <Dialog open={pagoSaldoModalOpen} onClose={() => setPagoSaldoModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#4caf50', color: 'white' }}>
          💰 Registrar Pago de Saldo
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#2e7d32', fontWeight: 'bold' }}>
            Saldo a pagar: ${selectedPedido?.saldo?.monto?.toLocaleString()}
          </Typography>
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Método de Pago</InputLabel>
                <Select
                  value={pagoSaldoData.metodoPago}
                  onChange={(e) => setPagoSaldoData(prev => ({ ...prev, metodoPago: e.target.value }))}
                  label="Método de Pago"
                >
                  {metodosPago.map((metodo) => (
                    <MenuItem key={metodo.value} value={metodo.value}>
                      {metodo.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Fecha de Pago"
                type="date"
                value={pagoSaldoData.fechaPago}
                onChange={(e) => setPagoSaldoData(prev => ({ ...prev, fechaPago: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Referencia/Folio"
                value={pagoSaldoData.referencia}
                onChange={(e) => setPagoSaldoData(prev => ({ ...prev, referencia: e.target.value }))}
                placeholder="Número de referencia del pago"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Comprobante (URL)"
                value={pagoSaldoData.comprobante}
                onChange={(e) => setPagoSaldoData(prev => ({ ...prev, comprobante: e.target.value }))}
                placeholder="URL del comprobante de pago"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setPagoSaldoModalOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handlePagoSaldoSubmit}
            variant="contained"
            startIcon={<Receipt />}
            sx={{ bgcolor: '#4caf50' }}
          >
            Registrar Pago
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notificaciones */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
      >
        <Alert onClose={() => setSuccess('')} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
      >
        <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      {/* Modal Generador WhatsApp */}
      {selectedPedido && (
        <GeneradorWhatsApp
          open={openWhatsApp}
          onClose={() => setOpenWhatsApp(false)}
          contexto={contextoWhatsApp}
          datosCliente={selectedPedido.prospecto}
          onMensajeGenerado={handleMensajeWhatsAppGenerado}
        />
      )}
    </Box>
  );
};

export default PedidosList;

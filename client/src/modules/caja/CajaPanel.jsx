/**
 * Panel de Caja
 * Gestión completa de caja: apertura, movimientos, cierre y reportes
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Divider,
  InputAdornment,
  Tabs,
  Tab
} from '@mui/material';

// Icons
import LockOpenIcon from '@mui/icons-material/LockOpen';
import LockIcon from '@mui/icons-material/Lock';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import RefreshIcon from '@mui/icons-material/Refresh';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import HistoryIcon from '@mui/icons-material/History';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DeleteIcon from '@mui/icons-material/Delete';

import axiosConfig from '../../config/axios';

// ===== COMPONENTE PRINCIPAL =====
const CajaPanel = () => {
  // Estados principales
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [tabActual, setTabActual] = useState(0);
  
  // Estado de la caja
  const [cajaAbierta, setCajaAbierta] = useState(false);
  const [cajaActual, setCajaActual] = useState(null);
  const [saldoActual, setSaldoActual] = useState(0);
  const [totales, setTotales] = useState({});
  
  // Modales
  const [modalApertura, setModalApertura] = useState(false);
  const [modalMovimiento, setModalMovimiento] = useState(false);
  const [modalCierre, setModalCierre] = useState(false);
  const [modalPagoSaldo, setModalPagoSaldo] = useState(false);
  
  // Pendiente seleccionado para pago
  const [pendienteSeleccionado, setPendienteSeleccionado] = useState(null);
  
  // Formularios
  const [formApertura, setFormApertura] = useState({ fondoInicial: '', observaciones: '' });
  const [formMovimiento, setFormMovimiento] = useState({
    tipo: 'ingreso',
    categoria: '',
    concepto: '',
    monto: '',
    metodoPago: 'efectivo',
    referencia: '',
    notas: '',
    comprobante: null,
    comprobanteNombre: ''
  });
  const [formCierre, setFormCierre] = useState({
    saldoReal: '',
    observaciones: '',
    fondoParaSiguiente: ''
  });

  // Historial
  const [historial, setHistorial] = useState([]);
  const [pendientes, setPendientes] = useState([]);

  // ===== FUNCIONES DE CARGA =====
  const cargarCajaActual = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosConfig.get('/caja/actual');
      
      if (response.data.success) {
        if (response.data.data.cajaAbierta) {
          setCajaAbierta(true);
          setCajaActual(response.data.data.caja);
          setSaldoActual(response.data.data.saldoActual);
          setTotales(response.data.data.totales);
        } else {
          setCajaAbierta(false);
          setCajaActual(null);
          // Sugerir fondo de última caja
          if (response.data.data.ultimaCaja) {
            setFormApertura(prev => ({
              ...prev,
              fondoInicial: response.data.data.ultimaCaja.fondoParaSiguiente || ''
            }));
          }
        }
      }
    } catch (err) {
      console.error('Error cargando caja:', err);
      setError('Error al cargar estado de caja');
    } finally {
      setLoading(false);
    }
  }, []);

  const cargarHistorial = useCallback(async () => {
    try {
      const response = await axiosConfig.get('/caja/historial?limit=10');
      if (response.data.success) {
        setHistorial(response.data.data.cajas);
      }
    } catch (err) {
      console.error('Error cargando historial:', err);
    }
  }, []);

  const cargarPendientes = useCallback(async () => {
    try {
      const response = await axiosConfig.get('/caja/pendientes');
      if (response.data.success) {
        setPendientes(response.data.data.pendientes);
      }
    } catch (err) {
      console.error('Error cargando pendientes:', err);
    }
  }, []);

  useEffect(() => {
    cargarCajaActual();
    cargarHistorial();
    cargarPendientes();
  }, [cargarCajaActual, cargarHistorial, cargarPendientes]);

  // ===== HANDLERS =====
  const handleAbrirCaja = async () => {
    try {
      setLoading(true);
      const response = await axiosConfig.post('/caja/abrir', {
        fondoInicial: parseFloat(formApertura.fondoInicial) || 0,
        observaciones: formApertura.observaciones
      });

      if (response.data.success) {
        setSuccess('Caja abierta exitosamente');
        setModalApertura(false);
        setFormApertura({ fondoInicial: '', observaciones: '' });
        cargarCajaActual();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al abrir caja');
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrarMovimiento = async () => {
    try {
      if (!formMovimiento.concepto || !formMovimiento.monto || !formMovimiento.categoria) {
        setError('Complete todos los campos requeridos');
        return;
      }

      setLoading(true);
      const response = await axiosConfig.post('/caja/movimiento', {
        ...formMovimiento,
        monto: parseFloat(formMovimiento.monto)
      });

      if (response.data.success) {
        setSuccess(`${formMovimiento.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'} registrado`);
        setModalMovimiento(false);
        setFormMovimiento({
          tipo: 'ingreso',
          categoria: '',
          concepto: '',
          monto: '',
          metodoPago: 'efectivo',
          referencia: '',
          notas: ''
        });
        cargarCajaActual();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrar movimiento');
    } finally {
      setLoading(false);
    }
  };

  const handleCerrarCaja = async () => {
    try {
      if (!formCierre.saldoReal) {
        setError('Ingrese el saldo real en caja');
        return;
      }

      setLoading(true);
      const response = await axiosConfig.post('/caja/cerrar', {
        saldoReal: parseFloat(formCierre.saldoReal),
        observaciones: formCierre.observaciones,
        fondoParaSiguiente: parseFloat(formCierre.fondoParaSiguiente) || 0
      });

      if (response.data.success) {
        setSuccess('Caja cerrada exitosamente');
        setModalCierre(false);
        setFormCierre({ saldoReal: '', observaciones: '', fondoParaSiguiente: '' });
        cargarCajaActual();
        cargarHistorial();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cerrar caja');
    } finally {
      setLoading(false);
    }
  };

  // Handler para abrir modal de pago de saldo
  const handleAbrirPagoSaldo = (pendiente) => {
    setPendienteSeleccionado(pendiente);
    setFormMovimiento({
      tipo: 'ingreso',
      categoria: 'saldo_proyecto',
      concepto: `Saldo - ${pendiente.numero} - ${pendiente.cliente}`,
      monto: pendiente.saldoPendiente.toString(),
      metodoPago: 'efectivo',
      referencia: '',
      notas: '',
      comprobante: null,
      comprobanteNombre: ''
    });
    setModalPagoSaldo(true);
  };

  // Handler para seleccionar archivo de comprobante
  const handleComprobanteChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validar tamaño (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('El archivo no debe superar 5MB');
        return;
      }
      
      // Convertir a base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormMovimiento(prev => ({
          ...prev,
          comprobante: reader.result,
          comprobanteNombre: file.name
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Handler para registrar pago de saldo
  const handleRegistrarPagoSaldo = async () => {
    try {
      if (!formMovimiento.monto || parseFloat(formMovimiento.monto) <= 0) {
        setError('Ingrese un monto válido');
        return;
      }

      setLoading(true);

      // Registrar el pago del saldo en el proyecto
      // El pagoController ya registra automáticamente en caja si está abierta
      await axiosConfig.post(`/proyectos/${pendienteSeleccionado.proyectoId}/pagos/saldo`, {
        monto: parseFloat(formMovimiento.monto),
        metodoPago: formMovimiento.metodoPago,
        referencia: formMovimiento.referencia,
        comprobante: formMovimiento.comprobante,
        fechaPago: new Date().toISOString()
      });

      setSuccess(`Saldo de ${pendienteSeleccionado.cliente} registrado exitosamente`);
      setModalPagoSaldo(false);
      setPendienteSeleccionado(null);
      setFormMovimiento({
        tipo: 'ingreso',
        categoria: '',
        concepto: '',
        monto: '',
        metodoPago: 'efectivo',
        referencia: '',
        notas: '',
        comprobante: null,
        comprobanteNombre: ''
      });
      
      // Recargar datos
      cargarCajaActual();
      cargarPendientes();

    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrar pago de saldo');
    } finally {
      setLoading(false);
    }
  };

  // ===== HELPERS =====
  const formatearMoneda = (cantidad) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(cantidad || 0);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const categoriasIngreso = [
    { value: 'anticipo_proyecto', label: 'Anticipo de Proyecto' },
    { value: 'saldo_proyecto', label: 'Saldo de Proyecto' },
    { value: 'pago_adicional', label: 'Pago Adicional' },
    { value: 'otro_ingreso', label: 'Otro Ingreso' }
  ];

  const categoriasEgreso = [
    { value: 'compra_materiales', label: 'Compra de Materiales' },
    { value: 'gasolina', label: 'Gasolina' },
    { value: 'viaticos', label: 'Viáticos' },
    { value: 'nomina', label: 'Nómina' },
    { value: 'servicios', label: 'Servicios' },
    { value: 'otro_egreso', label: 'Otro Egreso' }
  ];

  // ===== RENDER =====
  if (loading && !cajaActual) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Alertas */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AccountBalanceWalletIcon sx={{ fontSize: 48, color: 'white' }} />
            <Box>
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                💰 Caja
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                {cajaAbierta 
                  ? `Caja ${cajaActual?.numero} - Abierta` 
                  : 'Sin caja abierta'}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Tooltip title="Actualizar">
              <IconButton onClick={cargarCajaActual} sx={{ color: 'white' }}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            
            {!cajaAbierta ? (
              <Button
                variant="contained"
                startIcon={<LockOpenIcon />}
                onClick={() => setModalApertura(true)}
                sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#45a049' } }}
              >
                Abrir Caja
              </Button>
            ) : (
              <Button
                variant="contained"
                startIcon={<LockIcon />}
                onClick={() => {
                  setFormCierre(prev => ({
                    ...prev,
                    saldoReal: saldoActual.toString()
                  }));
                  setModalCierre(true);
                }}
                sx={{ bgcolor: '#f44336', '&:hover': { bgcolor: '#d32f2f' } }}
              >
                Cerrar Caja
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Contenido según estado de caja */}
      {cajaAbierta ? (
        <>
          {/* Cards de resumen */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <Card sx={{ bgcolor: '#e3f2fd', border: '2px solid #1976d2' }}>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">
                    Fondo Inicial
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                    {formatearMoneda(cajaActual?.apertura?.fondoInicial)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Card sx={{ bgcolor: '#e8f5e9', border: '2px solid #4caf50' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUpIcon sx={{ color: '#4caf50' }} />
                    <Typography variant="subtitle2" color="text.secondary">
                      Total Ingresos
                    </Typography>
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                    {formatearMoneda(totales?.totalIngresos)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {totales?.cantidadIngresos || 0} mov. (Efectivo: {formatearMoneda(totales?.ingresosEfectivo)})
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Card sx={{ bgcolor: '#ffebee', border: '2px solid #f44336' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingDownIcon sx={{ color: '#f44336' }} />
                    <Typography variant="subtitle2" color="text.secondary">
                      Total Egresos
                    </Typography>
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#f44336' }}>
                    {formatearMoneda(totales?.totalEgresos)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {totales?.cantidadEgresos || 0} mov. (Efectivo: {formatearMoneda(totales?.egresosEfectivo)})
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Card sx={{ 
                bgcolor: saldoActual >= 0 ? '#f3e5f5' : '#ffebee', 
                border: `2px solid ${saldoActual >= 0 ? '#9c27b0' : '#f44336'}` 
              }}>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">
                    Saldo Actual
                  </Typography>
                  <Typography 
                    variant="h4" 
                    sx={{ fontWeight: 'bold', color: saldoActual >= 0 ? '#9c27b0' : '#f44336' }}
                  >
                    {formatearMoneda(saldoActual)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Tabs */}
          <Paper sx={{ mb: 3 }}>
            <Tabs value={tabActual} onChange={(e, v) => setTabActual(v)}>
              <Tab label="Movimientos del Día" icon={<ReceiptIcon />} iconPosition="start" />
              <Tab label="Pendientes de Cobro" icon={<WarningIcon />} iconPosition="start" />
              <Tab label="Historial" icon={<HistoryIcon />} iconPosition="start" />
            </Tabs>
          </Paper>

          {/* Tab: Movimientos */}
          {tabActual === 0 && (
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Movimientos de Hoy</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    color="success"
                    onClick={() => {
                      setFormMovimiento(prev => ({ ...prev, tipo: 'ingreso', categoria: '' }));
                      setModalMovimiento(true);
                    }}
                  >
                    Ingreso
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<RemoveIcon />}
                    color="error"
                    onClick={() => {
                      setFormMovimiento(prev => ({ ...prev, tipo: 'egreso', categoria: '' }));
                      setModalMovimiento(true);
                    }}
                  >
                    Egreso
                  </Button>
                </Box>
              </Box>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                      <TableCell>Hora</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Concepto</TableCell>
                      <TableCell>Método</TableCell>
                      <TableCell align="right">Monto</TableCell>
                      <TableCell>Estado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cajaActual?.movimientos?.length > 0 ? (
                      [...cajaActual.movimientos].reverse().map((mov, idx) => (
                        <TableRow key={idx} sx={{ 
                          bgcolor: mov.estado === 'anulado' ? '#ffebee' : 'inherit',
                          opacity: mov.estado === 'anulado' ? 0.6 : 1
                        }}>
                          <TableCell>
                            {new Date(mov.hora).toLocaleTimeString('es-MX', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              size="small"
                              icon={mov.tipo === 'ingreso' ? <TrendingUpIcon /> : <TrendingDownIcon />}
                              label={mov.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
                              color={mov.tipo === 'ingreso' ? 'success' : 'error'}
                            />
                          </TableCell>
                          <TableCell>{mov.concepto}</TableCell>
                          <TableCell>
                            <Chip 
                              size="small" 
                              label={mov.metodoPago}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="right" sx={{ 
                            fontWeight: 'bold',
                            color: mov.tipo === 'ingreso' ? '#4caf50' : '#f44336'
                          }}>
                            {mov.tipo === 'ingreso' ? '+' : '-'}{formatearMoneda(mov.monto)}
                          </TableCell>
                          <TableCell>
                            {mov.estado === 'anulado' ? (
                              <Chip size="small" label="Anulado" color="error" />
                            ) : (
                              <Chip size="small" label="Activo" color="success" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">
                            No hay movimientos registrados hoy
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

          {/* Tab: Pendientes */}
          {tabActual === 1 && (
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Saldos Pendientes de Cobro
              </Typography>
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#fff3e0' }}>
                      <TableCell>Proyecto</TableCell>
                      <TableCell>Cliente</TableCell>
                      <TableCell>Teléfono</TableCell>
                      <TableCell align="right">Saldo</TableCell>
                      <TableCell>Días Vencido</TableCell>
                      <TableCell>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendientes.length > 0 ? (
                      pendientes.map((pend, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{pend.numero}</TableCell>
                          <TableCell>{pend.cliente}</TableCell>
                          <TableCell>{pend.telefono}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', color: '#f44336' }}>
                            {formatearMoneda(pend.saldoPendiente)}
                          </TableCell>
                          <TableCell>
                            {pend.diasVencido > 0 ? (
                              <Chip 
                                size="small" 
                                label={`${pend.diasVencido} días`} 
                                color="error"
                              />
                            ) : (
                              <Chip size="small" label="Vigente" color="success" />
                            )}
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="small" 
                              variant="outlined" 
                              color="primary"
                              onClick={() => handleAbrirPagoSaldo(pend)}
                            >
                              Registrar Pago
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                          <CheckCircleIcon sx={{ fontSize: 48, color: '#4caf50', mb: 1 }} />
                          <Typography color="text.secondary">
                            No hay saldos pendientes
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

          {/* Tab: Historial */}
          {tabActual === 2 && (
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Historial de Cajas
              </Typography>
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                      <TableCell>Número</TableCell>
                      <TableCell>Fecha</TableCell>
                      <TableCell align="right">Fondo Inicial</TableCell>
                      <TableCell align="right">Ingresos</TableCell>
                      <TableCell align="right">Egresos</TableCell>
                      <TableCell align="right">Diferencia</TableCell>
                      <TableCell>Estado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {historial.map((caja, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{caja.numero}</TableCell>
                        <TableCell>{formatearFecha(caja.fecha)}</TableCell>
                        <TableCell align="right">
                          {formatearMoneda(caja.apertura?.fondoInicial)}
                        </TableCell>
                        <TableCell align="right" sx={{ color: '#4caf50' }}>
                          {formatearMoneda(caja.totales?.ingresosEfectivo)}
                        </TableCell>
                        <TableCell align="right" sx={{ color: '#f44336' }}>
                          {formatearMoneda(caja.totales?.egresosEfectivo)}
                        </TableCell>
                        <TableCell align="right" sx={{ 
                          fontWeight: 'bold',
                          color: (caja.cierre?.diferencia || 0) === 0 ? '#4caf50' : '#f44336'
                        }}>
                          {formatearMoneda(caja.cierre?.diferencia || 0)}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            size="small"
                            label={caja.estado === 'cerrada' ? 'Cerrada' : 'Abierta'}
                            color={caja.estado === 'cerrada' ? 'default' : 'success'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </>
      ) : (
        /* Estado: Sin caja abierta */
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <LockIcon sx={{ fontSize: 80, color: '#9e9e9e', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            No hay caja abierta
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Abre la caja para comenzar a registrar movimientos del día
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<LockOpenIcon />}
            onClick={() => setModalApertura(true)}
            sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#45a049' } }}
          >
            Abrir Caja
          </Button>
        </Paper>
      )}

      {/* ===== MODALES ===== */}

      {/* Modal: Apertura de Caja */}
      <Dialog open={modalApertura} onClose={() => setModalApertura(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#4caf50', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LockOpenIcon />
            Abrir Caja del Día
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Fondo Inicial"
            type="number"
            value={formApertura.fondoInicial}
            onChange={(e) => setFormApertura({ ...formApertura, fondoInicial: e.target.value })}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>
            }}
            sx={{ mb: 2 }}
            helperText="Cantidad de efectivo con la que inicia la caja"
          />
          <TextField
            fullWidth
            label="Observaciones (opcional)"
            multiline
            rows={2}
            value={formApertura.observaciones}
            onChange={(e) => setFormApertura({ ...formApertura, observaciones: e.target.value })}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setModalApertura(false)}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={handleAbrirCaja}
            disabled={loading}
            sx={{ bgcolor: '#4caf50' }}
          >
            {loading ? <CircularProgress size={24} /> : 'Abrir Caja'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal: Registrar Movimiento */}
      <Dialog open={modalMovimiento} onClose={() => setModalMovimiento(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ 
          bgcolor: formMovimiento.tipo === 'ingreso' ? '#4caf50' : '#f44336', 
          color: 'white' 
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {formMovimiento.tipo === 'ingreso' ? <AddIcon /> : <RemoveIcon />}
            Registrar {formMovimiento.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Categoría *</InputLabel>
                <Select
                  value={formMovimiento.categoria}
                  onChange={(e) => setFormMovimiento({ ...formMovimiento, categoria: e.target.value })}
                  label="Categoría *"
                >
                  {(formMovimiento.tipo === 'ingreso' ? categoriasIngreso : categoriasEgreso).map(cat => (
                    <MenuItem key={cat.value} value={cat.value}>{cat.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Concepto *"
                value={formMovimiento.concepto}
                onChange={(e) => setFormMovimiento({ ...formMovimiento, concepto: e.target.value })}
                placeholder="Ej: Anticipo proyecto #123"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Monto *"
                type="number"
                value={formMovimiento.monto}
                onChange={(e) => setFormMovimiento({ ...formMovimiento, monto: e.target.value })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Método de Pago</InputLabel>
                <Select
                  value={formMovimiento.metodoPago}
                  onChange={(e) => setFormMovimiento({ ...formMovimiento, metodoPago: e.target.value })}
                  label="Método de Pago"
                >
                  <MenuItem value="efectivo">💵 Efectivo</MenuItem>
                  <MenuItem value="transferencia">🏦 Transferencia</MenuItem>
                  <MenuItem value="tarjeta">💳 Tarjeta</MenuItem>
                  <MenuItem value="cheque">📝 Cheque</MenuItem>
                  <MenuItem value="deposito">🏧 Depósito</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Referencia (opcional)"
                value={formMovimiento.referencia}
                onChange={(e) => setFormMovimiento({ ...formMovimiento, referencia: e.target.value })}
                placeholder="Número de transferencia, folio, etc."
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notas (opcional)"
                multiline
                rows={2}
                value={formMovimiento.notas}
                onChange={(e) => setFormMovimiento({ ...formMovimiento, notas: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setModalMovimiento(false)}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={handleRegistrarMovimiento}
            disabled={loading}
            color={formMovimiento.tipo === 'ingreso' ? 'success' : 'error'}
          >
            {loading ? <CircularProgress size={24} /> : 'Registrar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal: Cierre de Caja */}
      <Dialog open={modalCierre} onClose={() => setModalCierre(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#f44336', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LockIcon />
            Cerrar Caja
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {/* Resumen */}
          <Paper sx={{ p: 2, mb: 3, bgcolor: '#f5f5f5' }}>
            <Typography variant="subtitle2" gutterBottom>Resumen del Día</Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="body2">Fondo Inicial:</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" align="right">
                  {formatearMoneda(cajaActual?.apertura?.fondoInicial)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" sx={{ color: '#4caf50' }}>+ Ingresos:</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" align="right" sx={{ color: '#4caf50' }}>
                  {formatearMoneda(totales?.ingresosEfectivo)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" sx={{ color: '#f44336' }}>- Egresos:</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" align="right" sx={{ color: '#f44336' }}>
                  {formatearMoneda(totales?.egresosEfectivo)}
                </Typography>
              </Grid>
              <Divider sx={{ width: '100%', my: 1 }} />
              <Grid item xs={6}>
                <Typography variant="body1" fontWeight="bold">Saldo Esperado:</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1" align="right" fontWeight="bold" color="primary">
                  {formatearMoneda(saldoActual)}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          <TextField
            fullWidth
            label="Saldo Real en Caja *"
            type="number"
            value={formCierre.saldoReal}
            onChange={(e) => setFormCierre({ ...formCierre, saldoReal: e.target.value })}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>
            }}
            sx={{ mb: 2 }}
            helperText="Cuenta el efectivo físico en caja"
          />

          {formCierre.saldoReal && (
            <Alert 
              severity={parseFloat(formCierre.saldoReal) === saldoActual ? 'success' : 'warning'}
              sx={{ mb: 2 }}
            >
              Diferencia: {formatearMoneda(parseFloat(formCierre.saldoReal) - saldoActual)}
              {parseFloat(formCierre.saldoReal) === saldoActual 
                ? ' ✅ Cuadra perfectamente' 
                : ' ⚠️ Hay diferencia'}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Fondo para Siguiente Día"
            type="number"
            value={formCierre.fondoParaSiguiente}
            onChange={(e) => setFormCierre({ ...formCierre, fondoParaSiguiente: e.target.value })}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>
            }}
            sx={{ mb: 2 }}
            helperText="Efectivo que quedará para mañana"
          />

          <TextField
            fullWidth
            label="Observaciones (opcional)"
            multiline
            rows={2}
            value={formCierre.observaciones}
            onChange={(e) => setFormCierre({ ...formCierre, observaciones: e.target.value })}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setModalCierre(false)}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={handleCerrarCaja}
            disabled={loading}
            color="error"
          >
            {loading ? <CircularProgress size={24} /> : 'Cerrar Caja'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal: Pago de Saldo */}
      <Dialog open={modalPagoSaldo} onClose={() => setModalPagoSaldo(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#4caf50', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AttachMoneyIcon />
            Registrar Pago de Saldo
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {pendienteSeleccionado && (
            <>
              {/* Info del cliente */}
              <Paper sx={{ p: 2, mb: 3, bgcolor: '#e3f2fd' }}>
                <Typography variant="subtitle2" gutterBottom>Información del Proyecto</Typography>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="body2"><strong>Proyecto:</strong></Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">{pendienteSeleccionado.numero}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2"><strong>Cliente:</strong></Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">{pendienteSeleccionado.cliente}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2"><strong>Teléfono:</strong></Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">{pendienteSeleccionado.telefono}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2"><strong>Saldo Pendiente:</strong></Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" sx={{ color: '#f44336', fontWeight: 'bold' }}>
                      {formatearMoneda(pendienteSeleccionado.saldoPendiente)}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Monto a Pagar *"
                    type="number"
                    value={formMovimiento.monto}
                    onChange={(e) => setFormMovimiento({ ...formMovimiento, monto: e.target.value })}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Método de Pago</InputLabel>
                    <Select
                      value={formMovimiento.metodoPago}
                      onChange={(e) => setFormMovimiento({ ...formMovimiento, metodoPago: e.target.value })}
                      label="Método de Pago"
                    >
                      <MenuItem value="efectivo">💵 Efectivo</MenuItem>
                      <MenuItem value="transferencia">🏦 Transferencia</MenuItem>
                      <MenuItem value="tarjeta">💳 Tarjeta</MenuItem>
                      <MenuItem value="cheque">📝 Cheque</MenuItem>
                      <MenuItem value="deposito">🏧 Depósito</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Referencia (opcional)"
                    value={formMovimiento.referencia}
                    onChange={(e) => setFormMovimiento({ ...formMovimiento, referencia: e.target.value })}
                    placeholder="Número de transferencia, folio, etc."
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notas (opcional)"
                    multiline
                    rows={2}
                    value={formMovimiento.notas}
                    onChange={(e) => setFormMovimiento({ ...formMovimiento, notas: e.target.value })}
                  />
                </Grid>

                {/* Comprobante de pago */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
                    Comprobante de Pago
                  </Typography>
                  
                  {!formMovimiento.comprobante ? (
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<CloudUploadIcon />}
                      fullWidth
                      sx={{ py: 2, borderStyle: 'dashed' }}
                    >
                      Subir Comprobante (imagen o PDF)
                      <input
                        type="file"
                        hidden
                        accept="image/*,.pdf"
                        onChange={handleComprobanteChange}
                      />
                    </Button>
                  ) : (
                    <Paper sx={{ p: 2, bgcolor: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <InsertDriveFileIcon color="success" />
                        <Typography variant="body2">
                          {formMovimiento.comprobanteNombre}
                        </Typography>
                      </Box>
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => setFormMovimiento(prev => ({ ...prev, comprobante: null, comprobanteNombre: '' }))}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Paper>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    Formatos: JPG, PNG, PDF. Máximo 5MB
                  </Typography>
                </Grid>
              </Grid>

              {!cajaAbierta && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  No hay caja abierta. El pago se registrará en el proyecto pero no en la caja.
                </Alert>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setModalPagoSaldo(false)}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={handleRegistrarPagoSaldo}
            disabled={loading}
            color="success"
          >
            {loading ? <CircularProgress size={24} /> : 'Registrar Pago'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CajaPanel;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  Description as DescriptionIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  Visibility as ViewIcon,
  GetApp as DownloadIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import axiosConfig from '../../../config/axios';
import ModalRegistrarPago from './ModalRegistrarPago';

const CotizacionTab = ({ proyecto, estadisticas, onActualizar }) => {
  const navigate = useNavigate();
  const [eliminando, setEliminando] = useState(null);
  const [modalPagoOpen, setModalPagoOpen] = useState(false);
  const [tipoPagoModal, setTipoPagoModal] = useState('anticipo');
  
  const handleEliminarCotizacion = async (cotizacionId) => {
    if (!window.confirm('¿Estás seguro de eliminar esta cotización? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setEliminando(cotizacionId);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/cotizaciones/${cotizacionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al eliminar la cotización');
      }

      // Actualizar solo los datos del proyecto sin recargar toda la página
      await onActualizar();
      setEliminando(null);
      alert('✅ Cotización eliminada exitosamente');
    } catch (error) {
      console.error('Error eliminando cotización:', error);
      alert('❌ Error al eliminar la cotización: ' + error.message);
      setEliminando(null);
    }
  };
  
  const formatearMoneda = (cantidad) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(cantidad || 0);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'No definida';
    const date = new Date(fecha);
    if (isNaN(date.getTime())) return 'Fecha inválida';
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calcular días transcurridos desde el anticipo (solo días hábiles)
  const calcularDiasTranscurridos = (fechaInicio) => {
    if (!fechaInicio) return 0;
    
    const inicio = new Date(fechaInicio);
    const hoy = new Date();
    let diasHabiles = 0;
    
    const fechaActual = new Date(inicio);
    while (fechaActual < hoy) {
      fechaActual.setDate(fechaActual.getDate() + 1);
      const diaSemana = fechaActual.getDay();
      // Si no es sábado (6) ni domingo (0)
      if (diaSemana !== 0 && diaSemana !== 6) {
        diasHabiles++;
      }
    }
    
    return diasHabiles;
  };

  const obtenerColorEstado = (estado) => {
    const colores = {
      'borrador': '#6c757d',
      'enviada': '#17a2b8',
      'aprobada': '#28a745',
      'rechazada': '#dc3545',
      'vencida': '#fd7e14'
    };
    return colores[estado] || '#6c757d';
  };

  const obtenerIconoEstado = (estado) => {
    switch (estado) {
      case 'aprobada':
        return <CheckCircleIcon />;
      case 'rechazada':
        return <CancelIcon />;
      case 'enviada':
        return <PendingIcon />;
      default:
        return <DescriptionIcon />;
    }
  };

  // Datos financieros del proyecto
  const datosFinancieros = estadisticas?.financiero || {};
  const cotizaciones = proyecto.cotizaciones || [];

  const prospectoOriginal = proyecto?.prospecto_original;
  const prospectoId = typeof prospectoOriginal === 'string'
    ? prospectoOriginal
    : prospectoOriginal?._id;

  const nuevaCotizacionUrl = prospectoId
    ? `/cotizaciones/nueva?prospecto=${prospectoId}`
    : '/cotizaciones/nueva';

  return (
    <Box>
      {/* Indicadores Financieros */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            p: 2,
            bgcolor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 2,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            textAlign: 'center'
          }}>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 700, 
                color: '#0F172A',
                mb: 0.5
              }}
            >
              {formatearMoneda(datosFinancieros.total)}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#475569',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontSize: '0.85rem'
              }}
            >
              Total Cotización
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            p: 2,
            bgcolor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 2,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            textAlign: 'center'
          }}>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 700, 
                color: '#14B8A6',
                mb: 0.5
              }}
            >
              {formatearMoneda(datosFinancieros.anticipo || 0)}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#475569',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontSize: '0.85rem'
              }}
            >
              Anticipo Recibido
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            p: 2,
            bgcolor: proyecto.pagos?.saldo?.pagado ? '#E8F5E9' : '#FFFFFF',
            border: proyecto.pagos?.saldo?.pagado ? '2px solid #4CAF50' : '1px solid #E2E8F0',
            borderRadius: 2,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            textAlign: 'center'
          }}>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 700, 
                color: proyecto.pagos?.saldo?.pagado ? '#4CAF50' : '#F59E0B',
                mb: 0.5
              }}
            >
              {proyecto.pagos?.saldo?.pagado 
                ? '✅ PAGADO' 
                : formatearMoneda(datosFinancieros.saldo_pendiente)}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#475569',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontSize: '0.85rem'
              }}
            >
              {proyecto.pagos?.saldo?.pagado ? 'Saldo Liquidado' : 'Saldo Pendiente'}
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Lista de cotizaciones */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              💰 Cotizaciones del Proyecto
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={{ bgcolor: '#D4AF37', '&:hover': { bgcolor: '#B8941F' } }}
              onClick={() => {
                // Pasar el ID del proyecto para importar levantamiento y URL de retorno
                const returnUrl = `/proyectos/${proyecto._id}?tab=1`; // tab=1 es Cotización
                const separator = nuevaCotizacionUrl.includes('?') ? '&' : '?';
                const urlConProyecto = `${nuevaCotizacionUrl}${separator}proyecto=${proyecto._id}&returnTo=${encodeURIComponent(returnUrl)}`;
                console.log('🔗 Navegando a:', urlConProyecto);
                navigate(urlConProyecto);
              }}
            >
              Nueva Cotización
            </Button>
          </Box>

          {cotizaciones.length === 0 ? (
            <Alert severity="info">
              <strong>💰 No hay cotizaciones para este proyecto</strong>
              <br />
              Usa el botón "Nueva Cotización" para generar una cotización basada en los datos del cliente de este proyecto.
              <br />
              <Button 
                variant="text" 
                sx={{ mt: 1 }}
                onClick={() => {
                  // Pasar el ID del proyecto para importar levantamiento y URL de retorno
                  const returnUrl = `/proyectos/${proyecto._id}?tab=1`; // tab=1 es Cotización
                  const separator = nuevaCotizacionUrl.includes('?') ? '&' : '?';
                  const urlConProyecto = `${nuevaCotizacionUrl}${separator}proyecto=${proyecto._id}&returnTo=${encodeURIComponent(returnUrl)}`;
                  console.log('🔗 Navegando a:', urlConProyecto);
                  navigate(urlConProyecto);
                }}
              >
                🚀 Crear cotización ahora
              </Button>
            </Alert>
          ) : (
            <List>
              {cotizaciones.map((cotizacion, index) => (
                <React.Fragment key={cotizacion._id || index}>
                  <ListItem
                    sx={{
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                      bgcolor: 'background.paper'
                    }}
                  >
                    <ListItemIcon>
                      {obtenerIconoEstado(cotizacion.estado)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {cotizacion.numero || `COT-${index + 1}`}
                          </Typography>
                          <Chip
                            label={cotizacion.estado || 'borrador'}
                            size="small"
                            sx={{
                              bgcolor: obtenerColorEstado(cotizacion.estado),
                              color: 'white'
                            }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            <CalendarIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                            Creada: {formatearFecha(proyecto.createdAt || proyecto.fecha_creacion)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            <MoneyIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                            Total: {formatearMoneda(cotizacion.total)}
                          </Typography>
                          {cotizacion.validoHasta && (
                            <Typography variant="body2" color="text.secondary">
                              <CalendarIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                              Válida hasta: {formatearFecha(cotizacion.validoHasta)}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Tooltip title="Ver cotización (PDF)">
                        <IconButton
                          size="small"
                          onClick={() => {
                            navigate(`/cotizaciones/${cotizacion._id}`);
                          }}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Modificar cotización">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => {
                            navigate(`/cotizaciones/${cotizacion._id}/editar`);
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Descargar PDF">
                        <IconButton
                          size="small"
                          onClick={() => {
                            window.open(`${axiosConfig.defaults.baseURL}/cotizaciones/${cotizacion._id}/pdf`, '_blank');
                          }}
                        >
                          <DownloadIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar cotización">
                        <IconButton
                          size="small"
                          color="error"
                          disabled={eliminando === cotizacion._id}
                          onClick={() => handleEliminarCotizacion(cotizacion._id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Desglose de productos/servicios */}
      {proyecto.productos && proyecto.productos.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📦 Productos y Servicios
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Producto</TableCell>
                    <TableCell>Descripción</TableCell>
                    <TableCell align="right">Cantidad</TableCell>
                    <TableCell align="right">Precio Unit.</TableCell>
                    <TableCell align="right">Subtotal</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {proyecto.productos.map((producto, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {producto.nombre}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {producto.descripcion || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {producto.cantidad || 1}
                      </TableCell>
                      <TableCell align="right">
                        {formatearMoneda(producto.precioUnitario || producto.precio_unitario)}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold">
                          {formatearMoneda(producto.subtotal)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Información de facturación */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🧾 Información de Facturación
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Configuración de Factura
                </Typography>
                <Typography variant="body2">
                  <strong>Requiere Factura:</strong> {proyecto.requiere_factura ? 'Sí' : 'No'}
                </Typography>
                {proyecto.metodo_pago_anticipo && (
                  <Typography variant="body2">
                    <strong>Método de Pago:</strong> {proyecto.metodo_pago_anticipo}
                  </Typography>
                )}
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Términos de Pago
                </Typography>
                <Typography variant="body2">
                  <strong>Anticipo:</strong> {formatearMoneda(datosFinancieros.total * 0.6)} (60%)
                </Typography>
                <Typography variant="body2">
                  <strong>Saldo:</strong> {formatearMoneda(datosFinancieros.total * 0.4)} (40%)
                </Typography>
                {datosFinancieros.anticipo > 0 && (
                  <Box sx={{ mt: 1, p: 1, bgcolor: '#e8f5e9', borderRadius: 1 }}>
                    <Typography variant="body2" color="success.main">
                      ✅ <strong>Anticipo recibido:</strong> {formatearMoneda(datosFinancieros.anticipo)}
                    </Typography>
                  </Box>
                )}
                {proyecto.pagos?.saldo?.pagado && (
                  <Box sx={{ mt: 1, p: 1, bgcolor: '#e8f5e9', borderRadius: 1 }}>
                    <Typography variant="body2" color="success.main">
                      ✅ <strong>Saldo pagado:</strong> {formatearMoneda(proyecto.pagos?.saldo?.monto)}
                    </Typography>
                  </Box>
                )}
                {datosFinancieros.anticipo === 0 && proyecto.estado === 'aprobado' && (
                  <Button
                    variant="contained"
                    size="small"
                    sx={{ mt: 1, bgcolor: '#4caf50', '&:hover': { bgcolor: '#45a049' } }}
                    onClick={() => {
                      setTipoPagoModal('anticipo');
                      setModalPagoOpen(true);
                    }}
                  >
                    💰 Registrar Anticipo
                  </Button>
                )}
              </Paper>
            </Grid>
          </Grid>

          {/* Tiempo de entrega */}
          {proyecto.tiempo_entrega && (
            <Box sx={{ mt: 2 }}>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                🚚 Tiempo de Entrega
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2">
                    <strong>Tipo:</strong> {proyecto.tiempo_entrega.tipo === 'normal' ? 'Normal' : 'Exprés'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2">
                    <strong>Días estimados:</strong> {proyecto.tiempo_entrega.dias_estimados || 'Por definir'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2">
                    <strong>Días transcurridos:</strong>{' '}
                    <Box component="span" sx={{ 
                      color: '#1976d2', 
                      fontWeight: 'bold',
                      bgcolor: '#e3f2fd',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      display: 'inline-block'
                    }}>
                      {calcularDiasTranscurridos(proyecto.pagos?.anticipo?.fechaPago)} / {proyecto.tiempo_entrega.dias_estimados || 0}
                    </Box>
                  </Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2">
                    <strong>Fecha estimada:</strong> {
                      proyecto.tiempo_entrega.fecha_estimada 
                        ? formatearFecha(proyecto.tiempo_entrega.fecha_estimada)
                        : 'Por definir'
                    }
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Modal de Registro de Pago */}
      <ModalRegistrarPago
        open={modalPagoOpen}
        onClose={() => setModalPagoOpen(false)}
        proyectoId={proyecto._id}
        tipoPago={tipoPagoModal}
        montoSugerido={
          tipoPagoModal === 'anticipo' 
            ? datosFinancieros.total * 0.6 
            : datosFinancieros.total * 0.4
        }
        onSuccess={() => {
          // Recargar datos del proyecto
          onActualizar();
        }}
      />
    </Box>
  );
};

export default CotizacionTab;

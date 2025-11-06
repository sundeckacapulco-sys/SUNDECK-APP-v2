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
  Delete as DeleteIcon
} from '@mui/icons-material';

const CotizacionTab = ({ proyecto, estadisticas, onActualizar }) => {
  const navigate = useNavigate();
  const [eliminando, setEliminando] = useState(null);
  
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

      alert('✅ Cotización eliminada exitosamente. La página se recargará para mostrar los cambios.');
      
      // Recargar toda la página para asegurar que todos los datos se actualicen
      window.location.reload();
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
    return new Date(fecha).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
      {/* Resumen financiero */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <MoneyIcon sx={{ fontSize: 40, color: '#28a745', mb: 1 }} />
              <Typography variant="h5" color="primary">
                {formatearMoneda(datosFinancieros.subtotal)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Subtotal
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <MoneyIcon sx={{ fontSize: 40, color: '#17a2b8', mb: 1 }} />
              <Typography variant="h5" color="primary">
                {formatearMoneda(datosFinancieros.iva)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                IVA (16%)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <MoneyIcon sx={{ fontSize: 40, color: '#D4AF37', mb: 1 }} />
              <Typography variant="h5" color="primary">
                {formatearMoneda(datosFinancieros.total)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <MoneyIcon sx={{ fontSize: 40, color: '#fd7e14', mb: 1 }} />
              <Typography variant="h5" color="primary">
                {formatearMoneda(datosFinancieros.saldo_pendiente)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Saldo Pendiente
              </Typography>
            </CardContent>
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
                  navigate(nuevaCotizacionUrl);
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
                            Creada: {formatearFecha(cotizacion.fechaCreacion || cotizacion.fecha_creacion)}
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
                      <Tooltip title="Ver cotización">
                        <IconButton
                          size="small"
                          onClick={() => {
                            navigate(`/cotizaciones/${cotizacion._id}`);
                          }}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Descargar PDF">
                        <IconButton
                          size="small"
                          onClick={() => {
                            // Descargar PDF de la cotización
                            console.log('Descargar PDF cotización:', cotizacion._id);
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
                  <strong>Anticipo:</strong> {formatearMoneda(proyecto.anticipo)} (60%)
                </Typography>
                <Typography variant="body2">
                  <strong>Saldo:</strong> {formatearMoneda(datosFinancieros.saldo_pendiente)} (40%)
                </Typography>
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
                <Grid item xs={12} md={4}>
                  <Typography variant="body2">
                    <strong>Tipo:</strong> {proyecto.tiempo_entrega.tipo === 'normal' ? 'Normal' : 'Exprés'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2">
                    <strong>Días estimados:</strong> {proyecto.tiempo_entrega.dias_estimados || 'Por definir'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
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
    </Box>
  );
};

export default CotizacionTab;

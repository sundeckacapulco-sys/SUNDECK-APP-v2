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
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider
} from '@mui/material';
import {
  Add,
  MoreVert,
  Visibility,
  Edit,
  Send,
  GetApp,
  Delete,
  Payment,
  CheckCircle,
  WhatsApp,
  Archive,
  Unarchive,
  FilterList
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axiosConfig from '../../config/axios';
import AplicarAnticipoModal from '../Pedidos/AplicarAnticipoModal';
import GeneradorWhatsApp from '../WhatsApp/GeneradorWhatsApp';

const CotizacionesList = () => {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [cotizacionesArchivadas, setCotizacionesArchivadas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedCotizacion, setSelectedCotizacion] = useState(null);
  const [anticipoModalOpen, setAnticipoModalOpen] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  // Estados para WhatsApp
  const [openWhatsApp, setOpenWhatsApp] = useState(false);
  const [contextoWhatsApp, setContextoWhatsApp] = useState('');
  
  // Estado para filtro de origen
  const [filtroOrigen, setFiltroOrigen] = useState('');
  
  // Estados para modal de detalles
  const [detallesModalOpen, setDetallesModalOpen] = useState(false);
  const [cotizacionDetalle, setCotizacionDetalle] = useState(null);

  const navigate = useNavigate();

  const estadoColors = {
    borrador: 'default',
    enviada: 'primary',
    vista: 'info',
    aprobada: 'success',
    rechazada: 'error',
    vencida: 'warning',
    convertida: 'success'
  };

  const origenColors = {
    levantamiento: 'info',
    cotizacion_vivo: 'success', 
    directa: 'warning',
    normal: 'default'
  };

  const origenLabels = {
    levantamiento: '📋 Levantamiento',
    cotizacion_vivo: '💰 En Vivo',
    directa: '🎯 Directa',
    normal: '📝 Normal'
  };

  useEffect(() => {
    fetchCotizaciones();
  }, []);

  const fetchCotizaciones = async () => {
    try {
      setLoading(true);
      const paramsBase = { limit: 100 };
      const [activasResponse, archivadasResponse] = await Promise.all([
        axiosConfig.get('/cotizaciones', { params: { ...paramsBase, archivada: false } }),
        axiosConfig.get('/cotizaciones', { params: { ...paramsBase, archivada: true } })
      ]);

      const cotizacionesActivas = (activasResponse.data.docs || activasResponse.data || [])
        .filter(cot => cot && cot._id);
      const cotizacionesArchivadasData = (archivadasResponse.data.docs || archivadasResponse.data || [])
        .filter(cot => cot && cot._id);

      setCotizaciones(cotizacionesActivas);
      setCotizacionesArchivadas(cotizacionesArchivadasData);
    } catch (error) {
      console.error('Error fetching cotizaciones:', error);
      setError('Error cargando cotizaciones');
      setCotizaciones([]);
      setCotizacionesArchivadas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleArchivarCotizacion = async (cotizacion) => {
    if (!cotizacion) return;

    if (!window.confirm('¿Archivar esta cotización? Podrás consultarla después en el listado de archivadas.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await axiosConfig.put(`/cotizaciones/${cotizacion._id}/archivar`);
      setSuccess(response.data.message || 'Cotización archivada exitosamente');
      await fetchCotizaciones();
    } catch (error) {
      console.error('Error archivando cotización:', error);
      setError(error.response?.data?.message || 'Error archivando cotización');
    } finally {
      setLoading(false);
      handleMenuClose();
    }
  };

  const handleDesarchivarCotizacion = async (cotizacion) => {
    if (!cotizacion) return;

    try {
      setLoading(true);
      const response = await axiosConfig.put(`/cotizaciones/${cotizacion._id}/desarchivar`);
      setSuccess(response.data.message || 'Cotización desarchivada exitosamente');
      await fetchCotizaciones();
    } catch (error) {
      console.error('Error desarchivando cotización:', error);
      setError(error.response?.data?.message || 'Error desarchivando cotización');
    } finally {
      setLoading(false);
      handleMenuClose();
    }
  };

  const handleEliminarCotizacion = async (cotizacion) => {
    if (!cotizacion) return;

    if (!window.confirm('¿Eliminar esta cotización? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await axiosConfig.delete(`/cotizaciones/${cotizacion._id}`);
      setSuccess(response.data.message || 'Cotización eliminada exitosamente');
      await fetchCotizaciones();
    } catch (error) {
      console.error('Error eliminando cotización:', error);
      setError(error.response?.data?.message || 'Error eliminando cotización');
    } finally {
      setLoading(false);
      handleMenuClose();
    }
  };

  const handleMenuClick = (event, cotizacion) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget) {
      setAnchorEl(event.currentTarget);
      setSelectedCotizacion(cotizacion);
    }
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCotizacion(null);
  };

  const handleAplicarAnticipo = (cotizacion) => {
    setSelectedCotizacion(cotizacion);
    setAnticipoModalOpen(true);
    handleMenuClose();
  };

  const handleAnticipoSuccess = (data) => {
    setSuccess(`¡Anticipo aplicado exitosamente! Pedido ${data.pedido.numero} creado.`);
    fetchCotizaciones(); // Recargar lista
    // Redirigir al detalle del prospecto
    setTimeout(() => {
      navigate(`/prospectos/${data.pedido.prospecto}`);
    }, 2000);
  };

  const puedeAplicarAnticipo = (cotizacion) => {
    if (!cotizacion || !cotizacion.estado) return false;
    return cotizacion.estado === 'enviada' || cotizacion.estado === 'vista' || cotizacion.estado === 'aprobada';
  };

  // Funciones para WhatsApp
  const abrirGeneradorWhatsApp = (cotizacion, contexto) => {
    setSelectedCotizacion(cotizacion);
    setContextoWhatsApp(contexto);
    setOpenWhatsApp(true);
    handleMenuClose();
  };

  const obtenerContextoPorEstado = (estado) => {
    const contextos = {
      'borrador': 'cotizacion_enviada',
      'enviada': 'cotizacion_enviada', 
      'vista': 'seguimiento_cotizacion',
      'aprobada': 'anticipo_confirmado',
      'rechazada': 'seguimiento_cotizacion',
      'vencida': 'cotizacion_vencimiento'
    };
    return contextos[estado] || 'cotizacion_enviada';
  };

  const handleMensajeWhatsAppGenerado = (mensaje, plantilla) => {
    console.log('Mensaje WhatsApp generado:', mensaje);
    console.log('Plantilla usada:', plantilla);
    setOpenWhatsApp(false);
  };

  // Función para descargar PDF de cotización
  const obtenerPDFCotizacion = async (cotizacion) => {
    const response = await axiosConfig.get(`/cotizaciones/${cotizacion._id}/pdf`, {
      responseType: 'blob'
    });

    const nombreCliente = (cotizacion.prospecto?.nombre || 'Cliente')
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '-');
    const numeroCorto = cotizacion.numero || 'SIN-NUM';
    const fecha = new Date().toISOString().split('T')[0];
    const nombreArchivo = `Cotizacion-${numeroCorto}-${nombreCliente}-${fecha}.pdf`;

    const blob = new Blob([response.data], { type: 'application/pdf' });

    return { blob, nombreArchivo };
  };

  const handleDescargarPDF = async (cotizacion) => {
    try {
      setLoading(true);
      setError('');

      console.log('📄 Descargando PDF de cotización:', cotizacion.numero);

      const { blob, nombreArchivo } = await obtenerPDFCotizacion(cotizacion);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = nombreArchivo;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccess(`✅ PDF descargado: ${nombreArchivo}`);
      handleMenuClose();
    } catch (error) {
      console.error('Error descargando PDF:', error);
      setError('Error descargando PDF: ' + (error.response?.data?.message || error.message));
      handleMenuClose();
    } finally {
      setLoading(false);
    }
  };

  const handleVerDetalles = async (cotizacion) => {
    try {
      setLoading(true);
      console.log('🔍 Obteniendo detalles de cotización:', cotizacion._id);
      
      // Obtener detalles completos de la cotización
      const response = await axiosConfig.get(`/cotizaciones/${cotizacion._id}`);
      console.log('📊 Datos recibidos del backend:', response.data);
      console.log('📦 Productos en respuesta:', response.data.productos);
      console.log('💰 Totales en respuesta:', {
        subtotal: response.data.subtotal,
        iva: response.data.iva,
        total: response.data.total
      });
      setCotizacionDetalle(response.data);
      setDetallesModalOpen(true);
      handleMenuClose();
    } catch (error) {
      console.error('Error obteniendo detalles:', error);
      setError('Error obteniendo detalles: ' + (error.response?.data?.message || error.message));
      handleMenuClose();
    } finally {
      setLoading(false);
    }
  };

  const handleVerDetallesPDF = async (cotizacion) => {
    let url;
    try {
      setLoading(true);
      setError('');

      console.log('📄 Abriendo PDF de cotización en ventana emergente:', cotizacion.numero);

      const { blob, nombreArchivo } = await obtenerPDFCotizacion(cotizacion);

      url = window.URL.createObjectURL(blob);
      const nuevaVentana = window.open(url, '_blank', 'noopener,noreferrer');

      if (!nuevaVentana) {
        throw new Error('La ventana emergente fue bloqueada. Permite las ventanas emergentes para ver el PDF.');
      }

      try {
        nuevaVentana.document.title = nombreArchivo;
      } catch (e) {
        console.warn('No se pudo establecer el título de la ventana del PDF:', e);
      }

      setSuccess('📄 PDF abierto en una nueva pestaña');
      handleMenuClose();

      setTimeout(() => {
        if (url) {
          window.URL.revokeObjectURL(url);
        }
      }, 60 * 1000);
    } catch (error) {
      console.error('Error abriendo PDF:', error);
      setError('Error abriendo PDF: ' + (error.response?.data?.message || error.message));
      if (url) {
        window.URL.revokeObjectURL(url);
      }
      handleMenuClose();
    } finally {
      setLoading(false);
    }
  };

  // Filtrar cotizaciones por origen
  const cotizacionesFiltradas = filtroOrigen 
    ? cotizaciones.filter(cotizacion => cotizacion.origen === filtroOrigen)
    : cotizaciones;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Cotizaciones
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => navigate('/cotizacion-directa')}
            sx={{
              borderColor: '#28a745',
              color: '#28a745',
              '&:hover': {
                borderColor: '#218838',
                color: '#218838',
                bgcolor: '#f8f9fa'
              }
            }}
          >
            Cotización Directa
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/cotizaciones/nueva')}
          >
            Nueva Cotización
          </Button>
        </Box>
      </Box>

      {/* Filtros */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
        <FilterList sx={{ color: 'text.secondary' }} />
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Filtrar por Origen</InputLabel>
          <Select
            value={filtroOrigen}
            label="Filtrar por Origen"
            onChange={(e) => setFiltroOrigen(e.target.value)}
          >
            <MenuItem value="">
              <em>Todos los orígenes</em>
            </MenuItem>
            <MenuItem value="levantamiento">📋 Levantamiento</MenuItem>
            <MenuItem value="cotizacion_vivo">💰 En Vivo</MenuItem>
            <MenuItem value="directa">🎯 Directa</MenuItem>
            <MenuItem value="normal">📝 Normal</MenuItem>
          </Select>
        </FormControl>
        {filtroOrigen && (
          <Chip 
            label={`Filtrado: ${origenLabels[filtroOrigen]}`}
            onDelete={() => setFiltroOrigen('')}
            color={origenColors[filtroOrigen]}
            variant="outlined"
          />
        )}
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Número</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Productos</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Origen</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Válido Hasta</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : cotizacionesFiltradas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  No se encontraron cotizaciones
                </TableCell>
              </TableRow>
            ) : (
              cotizacionesFiltradas.filter(cotizacion => cotizacion && cotizacion._id).map((cotizacion) => (
                <TableRow key={cotizacion._id} hover>
                  <TableCell>
                    <Typography variant="subtitle2">
                      {cotizacion.numero || 'Sin número'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {cotizacion.prospecto?.nombre || 'Sin cliente'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {cotizacion.prospecto?.telefono || ''}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#2563eb' }}>
                      {cotizacion.productos?.length || 0} productos
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {(() => {
                        const totalCantidad = (cotizacion.productos || []).reduce((sum, prod) => sum + (prod.cantidad || 1), 0);
                        return `${totalCantidad} piezas total`;
                      })()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2">
                      ${(cotizacion.total || 0).toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={cotizacion.estado || 'Sin estado'}
                      color={estadoColors[cotizacion.estado] || 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={origenLabels[cotizacion.origen] || origenLabels.normal}
                      color={origenColors[cotizacion.origen] || 'default'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {cotizacion.fecha ? new Date(cotizacion.fecha).toLocaleDateString() : 'Sin fecha'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {cotizacion.validoHasta ? new Date(cotizacion.validoHasta).toLocaleDateString() : 'Sin fecha'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      onClick={(e) => handleMenuClick(e, cotizacion)}
                      size="small"
                    >
                      <MoreVert />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box mt={4}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Cotizaciones Archivadas
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Aquí encontrarás cotizaciones guardadas como referencia. Puedes desarchivarlas cuando las necesites nuevamente.
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Número</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Archivada</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        Cargando...
                      </TableCell>
                    </TableRow>
                  ) : cotizacionesArchivadas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No hay cotizaciones archivadas
                      </TableCell>
                    </TableRow>
                  ) : (
                    cotizacionesArchivadas.map((cotizacion) => (
                      <TableRow key={cotizacion._id} hover sx={{ backgroundColor: '#f9fafb' }}>
                        <TableCell>
                          <Typography variant="subtitle2">
                            {cotizacion.numero || 'Sin número'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {cotizacion.prospecto?.nombre || 'Sin cliente'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {cotizacion.prospecto?.telefono || ''}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2">
                            ${(cotizacion.total || 0).toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={cotizacion.estado || 'Sin estado'}
                            color={estadoColors[cotizacion.estado] || 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {cotizacion.fechaArchivado ? new Date(cotizacion.fechaArchivado).toLocaleDateString() : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton onClick={(e) => handleMenuClick(e, cotizacion)}>
                            <MoreVert />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>

      {/* Menú de acciones */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl && selectedCotizacion)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem
          onClick={() => {
            if (selectedCotizacion) {
              handleVerDetalles(selectedCotizacion);
            }
          }}
        >
          <Visibility sx={{ mr: 1 }} />
          Ver Detalles
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedCotizacion) {
              handleVerDetallesPDF(selectedCotizacion);
            }
          }}
        >
          <GetApp sx={{ mr: 1 }} />
          Ver PDF
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate(`/cotizaciones/${selectedCotizacion?._id}/editar`);
            handleMenuClose();
          }}
        >
          <Edit sx={{ mr: 1 }} />
          Editar
        </MenuItem>
        <MenuItem
          onClick={() => {
            // Enviar cotización
            handleMenuClose();
          }}
        >
          <Send sx={{ mr: 1 }} />
          Enviar
        </MenuItem>
        {selectedCotizacion?.archivada ? (
          <MenuItem
            onClick={() => handleDesarchivarCotizacion(selectedCotizacion)}
            sx={{ color: '#2e7d32' }}
          >
            <Unarchive sx={{ mr: 1 }} />
            Desarchivar
          </MenuItem>
        ) : (
          <MenuItem
            onClick={() => handleArchivarCotizacion(selectedCotizacion)}
            sx={{ color: '#fb8c00' }}
          >
            <Archive sx={{ mr: 1 }} />
            Archivar
          </MenuItem>
        )}
        <MenuItem
          onClick={() => handleDescargarPDF(selectedCotizacion)}
          sx={{ color: '#2196f3' }}
        >
          <GetApp sx={{ mr: 1 }} />
          Descargar PDF
        </MenuItem>
        <MenuItem
          onClick={() => abrirGeneradorWhatsApp(selectedCotizacion, obtenerContextoPorEstado(selectedCotizacion?.estado))}
          sx={{ color: '#25D366', fontWeight: 'bold' }}
        >
          <WhatsApp sx={{ mr: 1 }} />
          💬 Generar WhatsApp
        </MenuItem>
        {selectedCotizacion && puedeAplicarAnticipo(selectedCotizacion) && (
          <MenuItem
            onClick={() => handleAplicarAnticipo(selectedCotizacion)}
            sx={{ color: '#4caf50', fontWeight: 'bold' }}
          >
            <Payment sx={{ mr: 1 }} />
            Aplicar Anticipo
          </MenuItem>
        )}
        {selectedCotizacion?.estado === 'convertida' && (
          <MenuItem
            onClick={() => {
              navigate(`/prospectos/${selectedCotizacion.prospecto?._id || selectedCotizacion.prospecto}`);
              handleMenuClose();
            }}
            sx={{ color: '#2196f3' }}
          >
            <CheckCircle sx={{ mr: 1 }} />
            Ver Pedido
          </MenuItem>
        )}
        <MenuItem
          onClick={() => handleEliminarCotizacion(selectedCotizacion)}
          sx={{ color: '#d32f2f' }}
        >
          <Delete sx={{ mr: 1 }} />
          Eliminar
        </MenuItem>
      </Menu>

      {/* Modal para aplicar anticipo */}
      {selectedCotizacion && (
        <AplicarAnticipoModal
          open={anticipoModalOpen}
          onClose={() => {
            setAnticipoModalOpen(false);
            setSelectedCotizacion(null);
          }}
          cotizacion={selectedCotizacion}
          onSuccess={handleAnticipoSuccess}
        />
      )}

      {/* Modal de Detalles de Cotización */}
      <Dialog
        open={detallesModalOpen}
        onClose={() => setDetallesModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6">
              Detalles de Cotización {cotizacionDetalle?.numero}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              {cotizacionDetalle?.prospecto?.nombre}
            </Typography>
          </Box>
          <Chip
            label={origenLabels[cotizacionDetalle?.origen] || origenLabels.normal}
            color={origenColors[cotizacionDetalle?.origen] || 'default'}
            variant="outlined"
          />
        </DialogTitle>
        <DialogContent>
          {cotizacionDetalle && (
            <Grid container spacing={2}>
              {/* Información General */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  📋 Información General
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Estado</Typography>
                <Chip
                  label={cotizacionDetalle.estado || 'Sin estado'}
                  color={estadoColors[cotizacionDetalle.estado] || 'default'}
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Origen</Typography>
                <Chip
                  label={origenLabels[cotizacionDetalle.origen] || origenLabels.normal}
                  color={origenColors[cotizacionDetalle.origen] || 'default'}
                  size="small"
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Fecha de Creación</Typography>
                <Typography variant="body1">
                  {cotizacionDetalle.createdAt ? new Date(cotizacionDetalle.createdAt).toLocaleDateString() : 'Sin fecha'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Válido Hasta</Typography>
                <Typography variant="body1">
                  {cotizacionDetalle.validoHasta ? new Date(cotizacionDetalle.validoHasta).toLocaleDateString() : 'Sin fecha'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Elaborada Por</Typography>
                <Typography variant="body1">
                  {cotizacionDetalle.elaboradaPor?.nombre} {cotizacionDetalle.elaboradaPor?.apellido}
                </Typography>
              </Grid>

              {/* Productos */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  📦 Productos ({cotizacionDetalle.productos?.length || 0})
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid item xs={12}>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Producto</TableCell>
                        <TableCell>Medidas</TableCell>
                        <TableCell>Cantidad</TableCell>
                        <TableCell>Precio/m²</TableCell>
                        <TableCell>Subtotal</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {cotizacionDetalle.productos?.map((producto, index) => {
                        console.log(`🔍 Producto ${index}:`, producto);
                        return (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {producto.nombre || 'Sin nombre'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {producto.descripcion || 'Sin descripción'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {producto.medidas && (producto.medidas.ancho || producto.medidas.alto) ? (
                              <Typography variant="body2">
                                {producto.medidas.ancho}m × {producto.medidas.alto}m
                                <br />
                                <Typography variant="caption" color="text.secondary">
                                  Área: {producto.medidas.area || (producto.medidas.ancho * producto.medidas.alto).toFixed(2)}m²
                                </Typography>
                              </Typography>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                {producto.categoria === 'kit' || producto.categoria === 'motor' || producto.categoria === 'control' 
                                  ? 'Accesorio' 
                                  : 'Sin medidas'}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>{producto.cantidad || 1}</TableCell>
                          <TableCell>${(producto.precioUnitario || 0).toLocaleString()}</TableCell>
                          <TableCell>${(producto.subtotal || 0).toLocaleString()}</TableCell>
                        </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>

              {/* Totales */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  💰 Totales
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                <Typography variant="h6">
                  ${(cotizacionDetalle.subtotal || 0).toLocaleString()}
                </Typography>
              </Grid>
              
              {cotizacionDetalle.iva > 0 && (
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">IVA (16%)</Typography>
                  <Typography variant="h6">
                    ${(cotizacionDetalle.iva || 0).toLocaleString()}
                  </Typography>
                </Grid>
              )}
              
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">Total</Typography>
                <Typography variant="h6" color="primary">
                  ${(cotizacionDetalle.total || 0).toLocaleString()}
                </Typography>
              </Grid>

              {/* Información adicional según el origen */}
              {cotizacionDetalle.origen === 'levantamiento' && (
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Alert severity="info">
                    <Typography variant="body2">
                      <strong>📋 Cotización desde Levantamiento Técnico</strong><br />
                      Esta cotización fue generada a partir de un levantamiento técnico realizado en campo.
                      Los precios fueron aplicados posteriormente en oficina.
                    </Typography>
                  </Alert>
                </Grid>
              )}

              {cotizacionDetalle.origen === 'cotizacion_vivo' && (
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Alert severity="success">
                    <Typography variant="body2">
                      <strong>💰 Cotización en Vivo</strong><br />
                      Esta cotización fue generada en tiempo real durante la visita al cliente,
                      con precios y condiciones definidos en el momento.
                    </Typography>
                  </Alert>
                </Grid>
              )}

              {cotizacionDetalle.origen === 'directa' && (
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Alert severity="warning">
                    <Typography variant="body2">
                      <strong>🎯 Cotización Directa</strong><br />
                      Esta cotización fue creada directamente desde el sistema,
                      típicamente para clientes que proporcionaron medidas por teléfono.
                    </Typography>
                  </Alert>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetallesModalOpen(false)}>
            Cerrar
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              if (cotizacionDetalle) {
                handleVerDetallesPDF(cotizacionDetalle);
                setDetallesModalOpen(false);
              }
            }}
            startIcon={<GetApp />}
          >
            Descargar PDF
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
      {selectedCotizacion && (
        <GeneradorWhatsApp
          open={openWhatsApp}
          onClose={() => setOpenWhatsApp(false)}
          contexto={contextoWhatsApp}
          datosCliente={selectedCotizacion.prospecto}
          onMensajeGenerado={handleMensajeWhatsAppGenerado}
        />
      )}
    </Box>
  );
};

export default CotizacionesList;

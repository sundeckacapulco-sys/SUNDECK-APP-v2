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
  TextField,
  Grid,
  Alert,
  Snackbar
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
  WhatsApp
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axiosConfig from '../../config/axios';
import AplicarAnticipoModal from '../Pedidos/AplicarAnticipoModal';
import GeneradorWhatsApp from '../WhatsApp/GeneradorWhatsApp';

const CotizacionesList = () => {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedCotizacion, setSelectedCotizacion] = useState(null);
  const [anticipoModalOpen, setAnticipoModalOpen] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  // Estados para WhatsApp
  const [openWhatsApp, setOpenWhatsApp] = useState(false);
  const [contextoWhatsApp, setContextoWhatsApp] = useState('');

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

  useEffect(() => {
    fetchCotizaciones();
  }, []);

  const fetchCotizaciones = async () => {
    try {
      setLoading(true);
      const response = await axiosConfig.get('/cotizaciones');
      const cotizacionesData = response.data.docs || response.data || [];
      // Filtrar cotizaciones válidas
      const cotizacionesValidas = cotizacionesData.filter(cot => cot && cot._id);
      setCotizaciones(cotizacionesValidas);
    } catch (error) {
      console.error('Error fetching cotizaciones:', error);
      setError('Error cargando cotizaciones');
      setCotizaciones([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = (event, cotizacion) => {
    setAnchorEl(event.currentTarget);
    setSelectedCotizacion(cotizacion);
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

  // Función para corregir totales de cotizaciones
  const handleFixCotizaciones = async () => {
    if (!window.confirm('¿Estás seguro de que quieres corregir los totales de todas las cotizaciones? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      console.log('🔧 Iniciando corrección de totales...');
      
      const response = await axiosConfig.post('/fix/cotizaciones');
      
      if (response.data.success) {
        setSuccess('✅ Totales de cotizaciones corregidos exitosamente');
        // Recargar la lista para ver los cambios
        await fetchCotizaciones();
      } else {
        setError('Error corrigiendo totales: ' + response.data.message);
      }
      
    } catch (error) {
      console.error('Error corrigiendo totales:', error);
      setError('Error corrigiendo totales: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Función para descargar PDF de cotización
  const handleDescargarPDF = async (cotizacion) => {
    try {
      setLoading(true);
      setError('');
      
      console.log('📄 Descargando PDF de cotización:', cotizacion.numero);
      
      const response = await axiosConfig.get(`/cotizaciones/${cotizacion._id}/pdf`, {
        responseType: 'blob'
      });
      
      // Crear nombre de archivo
      const nombreCliente = (cotizacion.prospecto?.nombre || 'Cliente').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-');
      const numeroCorto = cotizacion.numero || 'SIN-NUM';
      const fecha = new Date().toISOString().split('T')[0];
      const nombreArchivo = `Cotizacion-${numeroCorto}-${nombreCliente}-${fecha}.pdf`;
      
      // Crear blob y descargar
      const blob = new Blob([response.data], { type: 'application/pdf' });
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
            onClick={() => navigate('/cotizaciones/directa')}
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
            variant="outlined"
            onClick={handleFixCotizaciones}
            disabled={loading}
            sx={{
              borderColor: '#dc3545',
              color: '#dc3545',
              '&:hover': {
                borderColor: '#c82333',
                color: '#c82333',
                bgcolor: '#f8f9fa'
              }
            }}
          >
            🔧 Corregir Totales
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

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Número</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Productos</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Válido Hasta</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : cotizaciones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No se encontraron cotizaciones
                </TableCell>
              </TableRow>
            ) : (
              cotizaciones.filter(cotizacion => cotizacion && cotizacion._id).map((cotizacion) => (
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

      {/* Menú de acciones */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            navigate(`/cotizaciones/${selectedCotizacion?._id}`);
            handleMenuClose();
          }}
        >
          <Visibility sx={{ mr: 1 }} />
          Ver Detalles
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

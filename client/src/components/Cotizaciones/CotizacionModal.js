import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Alert
} from '@mui/material';
import {
  Close,
  BugReport,
  PictureAsPdf,
  ShoppingCart,
  Search
} from '@mui/icons-material';
import CapturaModal from '../Common/CapturaModal';
import InspectorElementos from '../Common/InspectorElementos';
import axiosConfig from '../../config/axios';

const CotizacionModal = ({ open, onClose, cotizacion, onConvertirPedido }) => {
  const [convirtiendoPedido, setConvirtiendoPedido] = useState(false);
  const [errorLocal, setErrorLocal] = useState('');
  const [capturaModalOpen, setCapturaModalOpen] = useState(false);
  const [inspectorModalOpen, setInspectorModalOpen] = useState(false);

  const handleConvertirPedido = async () => {
    if (!cotizacion) return;

    setConvirtiendoPedido(true);
    setErrorLocal('');

    try {
      const payload = {
        direccionEntrega: {
          calle: cotizacion.prospecto?.direccion || '',
          ciudad: 'Acapulco, Guerrero'
        },
        contactoEntrega: {
          nombre: cotizacion.prospecto?.nombre || '',
          telefono: cotizacion.prospecto?.telefono || ''
        },
        anticipo: { porcentaje: 50 }
      };

      const { data } = await axiosConfig.post(`/pedidos/desde-cotizacion/${cotizacion._id}`, payload);
      
      onConvertirPedido?.(
        `¡Pedido ${data.pedido.numero} creado exitosamente! El prospecto se movió a "Pedidos".`,
        data.pedido
      );
      onClose();
    } catch (error) {
      console.error('Error convirtiendo cotización en pedido:', error);
      const mensaje = error.response?.data?.message || 'No se pudo convertir la cotización en pedido.';
      setErrorLocal(mensaje);
    } finally {
      setConvirtiendoPedido(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-MX');
  };

  if (!open || !cotizacion) return null;

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { maxHeight: '90vh' }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          bgcolor: 'primary.light',
          color: 'primary.contrastText'
        }}>
          <Box>
            <Typography variant="h6" component="div">
              📋 Cotización {cotizacion.numero}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
              Cliente: {cotizacion.prospecto?.nombre} • Estado: 
              <Chip 
                label={cotizacion.estado}
                size="small"
                color={
                  cotizacion.estado === 'aprobada' ? 'success' :
                  cotizacion.estado === 'enviada' ? 'info' : 'default'
                }
                sx={{ ml: 1 }}
              />
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton 
              onClick={() => setCapturaModalOpen(true)} 
              size="small"
              sx={{ color: 'primary.contrastText' }}
              title="Capturar pantalla para soporte"
            >
              <BugReport />
            </IconButton>
            <IconButton 
              onClick={() => setInspectorModalOpen(true)} 
              size="small"
              sx={{ color: 'primary.contrastText' }}
              title="Inspector de elementos"
            >
              <Search />
            </IconButton>
            <IconButton 
              onClick={onClose} 
              size="small"
              sx={{ color: 'primary.contrastText' }}
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {errorLocal && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorLocal}
            </Alert>
          )}
          
          {/* Información General */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>📅 Información General</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="body2">
                      <strong>Fecha:</strong> {formatDate(cotizacion.fecha)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Válido hasta:</strong> {formatDate(cotizacion.validoHasta)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Tiempo fabricación:</strong> {cotizacion.tiempoFabricacion} días
                    </Typography>
                    <Typography variant="body2">
                      <strong>Tiempo instalación:</strong> {cotizacion.tiempoInstalacion} días
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ bgcolor: 'success.light' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>💰 Totales</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="body2">
                      <strong>Subtotal:</strong> {formatCurrency(cotizacion.subtotal)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>IVA:</strong> {formatCurrency(cotizacion.iva)}
                    </Typography>
                    <Typography variant="h6" color="success.dark">
                      <strong>Total:</strong> {formatCurrency(cotizacion.total)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Productos */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>🛍️ Productos Cotizados</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {cotizacion.productos?.map((producto, index) => (
                <Card key={index} variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {producto.nombre}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {producto.descripcion}
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="caption" color="text.secondary">Medidas:</Typography>
                            <Typography variant="body2">
                              {producto.medidas?.ancho}m × {producto.medidas?.alto}m
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="caption" color="text.secondary">Área:</Typography>
                            <Typography variant="body2">
                              {producto.medidas?.area?.toFixed(2)} m²
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="caption" color="text.secondary">Material:</Typography>
                            <Typography variant="body2">{producto.material}</Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="caption" color="text.secondary">Color:</Typography>
                            <Typography variant="body2">{producto.color}</Typography>
                          </Grid>
                        </Grid>
                        {producto.requiereR24 && (
                          <Chip 
                            label="Requiere refuerzo R24" 
                            color="warning" 
                            size="small" 
                            sx={{ mt: 1 }}
                          />
                        )}
                      </Box>
                      <Box sx={{ textAlign: 'right', ml: 2 }}>
                        <Typography variant="h6" fontWeight="bold">
                          {formatCurrency(producto.subtotal)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {producto.cantidad} × {formatCurrency(producto.precioUnitario)}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>

          {/* Mediciones */}
          {cotizacion.mediciones?.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Mediciones Realizadas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cotizacion.mediciones.map((medicion, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-gray-900">{medicion.ambiente}</h4>
                    <p className="text-sm text-gray-600">
                      {medicion.ancho}m × {medicion.alto}m = {medicion.area?.toFixed(2)} m²
                    </p>
                    {medicion.notas && (
                      <p className="text-sm text-gray-500 mt-1">{medicion.notas}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Forma de Pago */}
          {cotizacion.formaPago && (
            <div className="mb-6 bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">Condiciones de Pago</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Anticipo:</span>
                  <p className="font-medium">
                    {cotizacion.formaPago.anticipo?.porcentaje}% - {formatCurrency(cotizacion.formaPago.anticipo?.monto)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Saldo:</span>
                  <p className="font-medium">
                    {cotizacion.formaPago.saldo?.porcentaje}% - {formatCurrency(cotizacion.formaPago.saldo?.monto)}
                    <br />
                    <span className="text-xs text-gray-500">{cotizacion.formaPago.saldo?.condiciones}</span>
                  </p>
                </div>
              </div>
            </div>
          )}

        </DialogContent>

        <DialogActions sx={{ p: 3, bgcolor: 'grey.50' }}>
          <Button onClick={onClose} variant="outlined">
            Cerrar
          </Button>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<PictureAsPdf />}
              onClick={() => window.open(`/api/cotizaciones/${cotizacion._id}/pdf`, '_blank')}
            >
              Descargar PDF
            </Button>
            
            {cotizacion.estado === 'aprobada' && (
              <Button
                variant="contained"
                color="success"
                startIcon={<ShoppingCart />}
                onClick={handleConvertirPedido}
                disabled={convirtiendoPedido}
              >
                {convirtiendoPedido ? 'Convirtiendo...' : 'Convertir en Pedido'}
              </Button>
            )}
          </Box>
        </DialogActions>
      </Dialog>

      {/* Modal de Captura de Pantalla */}
      <CapturaModal
        open={capturaModalOpen}
        onClose={() => setCapturaModalOpen(false)}
        titulo="Captura para Soporte - Cotización"
      />
      
      {/* Modal de Inspector de Elementos */}
      <InspectorElementos
        open={inspectorModalOpen}
        onClose={() => setInspectorModalOpen(false)}
      />
    </>
  );
};

export default CotizacionModal;

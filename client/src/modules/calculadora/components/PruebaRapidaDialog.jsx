import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Box,
  Divider,
  Alert,
  Chip,
  Card,
  CardContent
} from '@mui/material';
import {
  Speed as SpeedIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  LocalOffer as OfferIcon,
  Inventory as InventoryIcon
} from '@mui/icons-material';
import axiosConfig from '../../../config/axios';

const PruebaRapidaDialog = ({ open, onClose }) => {
  const [formData, setFormData] = useState({
    ancho: '',
    alto: '',
    producto: 'Enrollable', // Default
    sistema: 'Roller Shade',
    tela: 'Screen 5%', // Simulado por ahora, debería venir de un select
    color: 'White',
    motorizado: false
  });

  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSimular = async () => {
    if (!formData.ancho || !formData.alto) {
      setError('Ingrese ancho y alto');
      return;
    }

    setLoading(true);
    setError(null);
    setResultado(null);

    try {
      const response = await axiosConfig.post('/almacen/simular-consumo', {
        ...formData,
        ancho: Number(formData.ancho),
        alto: Number(formData.alto)
      });
      setResultado(response.data.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error al simular consumo');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
        ancho: '',
        alto: '',
        producto: 'Enrollable',
        sistema: 'Roller Shade',
        tela: 'Screen 5%',
        color: 'White',
        motorizado: false
    });
    setResultado(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#f5f5f5' }}>
        <SpeedIcon color="primary" />
        <Typography variant="h6">Prueba Rápida de Consumo</Typography>
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <Grid container spacing={3}>
          {/* Formulario */}
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" gutterBottom>Datos de la Pieza</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Ancho (m)"
                  name="ancho"
                  type="number"
                  value={formData.ancho}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  autoFocus
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Alto (m)"
                  name="alto"
                  type="number"
                  value={formData.alto}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Sistema"
                  name="sistema"
                  value={formData.sistema}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  select
                  SelectProps={{ native: true }}
                >
                  <option value="Roller Shade">Roller Shade</option>
                  <option value="Sheer Elegance">Sheer Elegance</option>
                  <option value="Toldos">Toldos</option>
                </TextField>
              </Grid>
              {/* Aquí se agregarían selects reales de Tela/Color cargados de BD */}
              <Grid item xs={12}>
                <Button 
                  variant="contained" 
                  fullWidth 
                  onClick={handleSimular}
                  disabled={loading}
                  startIcon={<SpeedIcon />}
                >
                  {loading ? 'Simulando...' : 'Simular'}
                </Button>
              </Grid>
            </Grid>
          </Grid>

          {/* Resultados */}
          <Grid item xs={12} md={8}>
            <Box sx={{ height: '100%', borderLeft: '1px solid #e0e0e0', pl: 2 }}>
              {error && <Alert severity="error">{error}</Alert>}
              
              {!resultado && !loading && !error && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'text.secondary' }}>
                  <SpeedIcon sx={{ fontSize: 60, mb: 2, opacity: 0.5 }} />
                  <Typography>Ingrese medidas para ver simulación</Typography>
                </Box>
              )}

              {resultado && (
                <Grid container spacing={2}>
                  {/* Resumen Stock */}
                  <Grid item xs={12}>
                    <Card variant="outlined" sx={{ bgcolor: resultado.stock.disponible ? '#e8f5e9' : '#ffebee' }}>
                      <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                        <Box display="flex" alignItems="center" gap={1}>
                          {resultado.stock.disponible ? <CheckIcon color="success" /> : <WarningIcon color="error" />}
                          <Typography variant="subtitle1" fontWeight="bold">
                            {resultado.stock.disponible ? 'Stock Disponible' : 'Sin Stock Suficiente'}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {resultado.stock.mensaje}
                        </Typography>
                        {resultado.stock.origen === 'Sobrante' && (
                          <Chip 
                            label="Usar Sobrante" 
                            color="success" 
                            size="small" 
                            icon={<InventoryIcon />} 
                            sx={{ mt: 1 }} 
                          />
                        )}
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Detalles Consumo */}
                  <Grid item xs={6}>
                    <Box p={2} bgcolor="#f5f5f5" borderRadius={1}>
                      <Typography variant="caption" color="text.secondary">Consumo Real</Typography>
                      <Typography variant="h6">{resultado.consumo.ml.toFixed(2)} ml</Typography>
                      <Typography variant="caption">Rollo base: {resultado.consumo.rolloBase}m</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box p={2} bgcolor="#f5f5f5" borderRadius={1}>
                      <Typography variant="caption" color="text.secondary">Desperdicio</Typography>
                      <Typography variant="h6" color={resultado.desperdicio.porcentaje > 15 ? 'error.main' : 'text.primary'}>
                        {resultado.desperdicio.porcentaje.toFixed(1)}%
                      </Typography>
                      <Typography variant="caption">{resultado.desperdicio.mensaje.split('.')[0]}</Typography>
                    </Box>
                  </Grid>

                  {/* Recomendación Comercial */}
                  {resultado.recomendacion.aplicarDescuento && (
                    <Grid item xs={12}>
                      <Alert 
                        severity="info" 
                        icon={<OfferIcon fontSize="inherit" />}
                        sx={{ border: '1px solid #29b6f6' }}
                      >
                        <Typography variant="subtitle2" sx={{ color: '#01579b' }}>
                          ¡Oportunidad Comercial!
                        </Typography>
                        {resultado.recomendacion.mensaje}
                        <Box mt={1}>
                          <Chip 
                            label={`Sugerido: -${resultado.recomendacion.porcentaje}%`} 
                            color="primary" 
                            size="small" 
                          />
                        </Box>
                      </Alert>
                    </Grid>
                  )}
                </Grid>
              )}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default PruebaRapidaDialog;

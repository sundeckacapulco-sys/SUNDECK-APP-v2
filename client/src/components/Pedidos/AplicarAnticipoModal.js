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
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Divider,
  Chip
} from '@mui/material';
import {
  Payment,
  Receipt,
  Schedule,
  CheckCircle,
  Cancel
} from '@mui/icons-material';
import TextFieldConDictado from '../Common/TextFieldConDictado';
import axiosConfig from '../../config/axios';

const AplicarAnticipoModal = ({ open, onClose, cotizacion, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    metodoPago: 'transferencia',
    referencia: '',
    comprobante: '',
    fechaPago: new Date().toISOString().slice(0, 10),
    observaciones: ''
  });

  const metodosPago = [
    { value: 'efectivo', label: '💵 Efectivo', icon: '💵' },
    { value: 'transferencia', label: '🏦 Transferencia Bancaria', icon: '🏦' },
    { value: 'tarjeta', label: '💳 Tarjeta de Crédito/Débito', icon: '💳' },
    { value: 'cheque', label: '📄 Cheque', icon: '📄' },
    { value: 'deposito', label: '🏧 Depósito Bancario', icon: '🏧' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.metodoPago) {
      setError('Selecciona un método de pago');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await axiosConfig.post(`/pedidos/aplicar-anticipo/${cotizacion._id}`, {
        metodoPago: formData.metodoPago,
        referencia: formData.referencia,
        comprobante: formData.comprobante,
        fechaPago: formData.fechaPago,
        observaciones: formData.observaciones
      });

      onSuccess(response.data);
      onClose();
    } catch (error) {
      console.error('Error aplicando anticipo:', error);
      setError(error.response?.data?.message || 'Error aplicando el anticipo');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const anticipo = cotizacion?.formaPago?.anticipo?.monto || (cotizacion?.total * 0.6);
  const saldo = cotizacion?.formaPago?.saldo?.monto || (cotizacion?.total * 0.4);

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle sx={{ 
        bgcolor: '#2563eb', 
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <Payment />
        💰 Aplicar Anticipo - Crear Pedido
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Información de la cotización */}
        <Card sx={{ mb: 3, bgcolor: '#f8f9fa', border: '2px solid #e3f2fd' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold' }}>
              📋 Información de la Cotización
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Cliente:</strong> {cotizacion?.prospecto?.nombre}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Cotización:</strong> {cotizacion?.numero}
                </Typography>
                <Typography variant="body2">
                  <strong>Fecha:</strong> {new Date(cotizacion?.fecha).toLocaleDateString('es-MX')}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="h5" sx={{ color: '#2563eb', fontWeight: 'bold', mb: 1 }}>
                    Total: ${cotizacion?.total?.toLocaleString()}
                  </Typography>
                  <Chip 
                    label={`Válida hasta: ${new Date(cotizacion?.validoHasta).toLocaleDateString('es-MX')}`}
                    color="warning"
                    size="small"
                  />
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Desglose de pagos */}
        <Card sx={{ mb: 3, bgcolor: '#fff3e0', border: '2px solid #ff9800' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: '#f57c00', fontWeight: 'bold' }}>
              💳 Desglose de Pagos (60% - 40%)
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box sx={{ 
                  bgcolor: '#e8f5e8', 
                  p: 2, 
                  borderRadius: 2,
                  border: '2px solid #4caf50'
                }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                    💰 Anticipo (60%)
                  </Typography>
                  <Typography variant="h4" sx={{ color: '#2e7d32', fontWeight: 'bold' }}>
                    ${anticipo?.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    Se aplicará ahora
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ 
                  bgcolor: '#fff3e0', 
                  p: 2, 
                  borderRadius: 2,
                  border: '2px solid #ff9800'
                }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#f57c00' }}>
                    💼 Saldo (40%)
                  </Typography>
                  <Typography variant="h4" sx={{ color: '#f57c00', fontWeight: 'bold' }}>
                    ${saldo?.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    Contra entrega
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Divider sx={{ my: 2 }} />

        {/* Formulario de pago */}
        <Box component="form" onSubmit={handleSubmit}>
          <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold', mb: 2 }}>
            💳 Información del Pago del Anticipo
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Método de Pago</InputLabel>
                <Select
                  value={formData.metodoPago}
                  onChange={handleChange('metodoPago')}
                  label="Método de Pago"
                >
                  {metodosPago.map((metodo) => (
                    <MenuItem key={metodo.value} value={metodo.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{metodo.icon}</span>
                        {metodo.label}
                      </Box>
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
                value={formData.fechaPago}
                onChange={handleChange('fechaPago')}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Referencia/Folio"
                value={formData.referencia}
                onChange={handleChange('referencia')}
                placeholder="Ej: 123456789, Folio del banco, etc."
                helperText="Número de referencia del pago"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Comprobante (URL)"
                value={formData.comprobante}
                onChange={handleChange('comprobante')}
                placeholder="https://..."
                helperText="URL del comprobante de pago (opcional)"
              />
            </Grid>

            <Grid item xs={12}>
              <TextFieldConDictado
                label="Observaciones del Pago"
                value={formData.observaciones}
                onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                rows={3}
                placeholder="Observaciones adicionales sobre el pago..."
              />
            </Grid>
          </Grid>

          {/* Información importante */}
          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
              ⚡ ¿Qué sucederá al aplicar el anticipo?
            </Typography>
            <Typography variant="body2" component="div">
              • Se creará automáticamente un <strong>PEDIDO</strong> confirmado<br/>
              • El prospecto pasará a etapa <strong>"PEDIDO"</strong><br/>
              • Se programará la fabricación automáticamente<br/>
              • Se calculará la fecha estimada de entrega<br/>
              • Se enviará notificación al equipo de producción
            </Typography>
          </Alert>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, bgcolor: '#f8f9fa' }}>
        <Button
          onClick={onClose}
          startIcon={<Cancel />}
          disabled={loading}
          sx={{ mr: 1 }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          startIcon={loading ? <Schedule /> : <CheckCircle />}
          disabled={loading}
          sx={{
            bgcolor: '#4caf50',
            '&:hover': { bgcolor: '#388e3c' },
            px: 4,
            py: 1.5,
            fontWeight: 'bold'
          }}
        >
          {loading ? 'Procesando...' : `Aplicar Anticipo $${anticipo?.toLocaleString()}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AplicarAnticipoModal;

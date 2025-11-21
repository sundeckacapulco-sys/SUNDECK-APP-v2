import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Grid,
  InputAdornment,
  Alert,
  CircularProgress,
  IconButton,
  Paper,
  Divider,
  Chip
} from '@mui/material';
import {
  Close as CloseIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  CloudUpload as UploadIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import axios from 'axios';

const ModalRegistrarPago = ({ 
  open, 
  onClose, 
  proyectoId, 
  tipoPago = 'anticipo', // 'anticipo' o 'saldo'
  montoSugerido = 0,
  onSuccess 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    monto: montoSugerido,
    porcentaje: tipoPago === 'anticipo' ? 60 : 40,
    fechaPago: new Date().toISOString().split('T')[0],
    metodoPago: 'transferencia',
    referencia: '',
    comprobante: null,
    correoCliente: '',
    constanciaFiscal: null,
    requiereFactura: false,
    tipoEntrega: 'normal', // normal, expres o personalizado
    tiempoEntregaCantidad: '',
    tiempoEntregaUnidad: 'dias' // dias u horas
  });

  const [archivoNombre, setArchivoNombre] = useState('');
  const [archivoPreview, setArchivoPreview] = useState(null);
  const [constanciaNombre, setConstanciaNombre] = useState('');
  const [constanciaPreview, setConstanciaPreview] = useState(null);

  const metodoPagoOpciones = [
    { value: 'efectivo', label: 'Efectivo', icon: '💵' },
    { value: 'transferencia', label: 'Transferencia', icon: '🏦' },
    { value: 'cheque', label: 'Cheque', icon: '📝' },
    { value: 'tarjeta', label: 'Tarjeta', icon: '💳' },
    { value: 'deposito', label: 'Depósito', icon: '🏧' }
  ];

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('El archivo no debe superar los 5MB');
        return;
      }

      // Validar tipo
      const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!tiposPermitidos.includes(file.type)) {
        setError('Solo se permiten archivos JPG, PNG o PDF');
        return;
      }

      setArchivoNombre(file.name);

      // Convertir a base64
      const reader = new FileReader();
      reader.onload = () => {
        setFormData(prev => ({
          ...prev,
          comprobante: reader.result
        }));
        setArchivoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConstanciaChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('El archivo no debe superar los 5MB');
        return;
      }

      // Validar tipo (solo PDF para constancia)
      if (file.type !== 'application/pdf') {
        setError('La constancia fiscal debe ser un archivo PDF');
        return;
      }

      setConstanciaNombre(file.name);

      // Convertir a base64
      const reader = new FileReader();
      reader.onload = () => {
        setFormData(prev => ({
          ...prev,
          constanciaFiscal: reader.result
        }));
        setConstanciaPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    // Validaciones
    if (!formData.monto || formData.monto <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }

    if (!formData.metodoPago) {
      setError('Selecciona un método de pago');
      return;
    }

    // Validar campos de entrega personalizada
    if (formData.tipoEntrega === 'personalizado') {
      if (!formData.tiempoEntregaCantidad || formData.tiempoEntregaCantidad <= 0) {
        setError('Ingresa la cantidad de tiempo para entrega personalizada');
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const endpoint = tipoPago === 'anticipo' 
        ? `/api/proyectos/${proyectoId}/pagos/anticipo`
        : `/api/proyectos/${proyectoId}/pagos/saldo`;

      const response = await axios.post(
        `http://localhost:5001${endpoint}`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess && onSuccess();
          onClose();
          // Recargar la página para reflejar cambios en el indicador de progreso
          window.location.reload();
        }, 1500);
      }
    } catch (err) {
      console.error('Error registrando pago:', err);
      setError(err.response?.data?.message || 'Error al registrar el pago');
    } finally {
      setLoading(false);
    }
  };

  const formatearMoneda = (cantidad) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(cantidad || 0);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
        }
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PaymentIcon sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h5" fontWeight="bold">
              {tipoPago === 'anticipo' ? '💰 Registrar Anticipo' : '💵 Registrar Saldo'}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
              {tipoPago === 'anticipo' 
                ? 'Registra el pago del anticipo (60% del total)'
                : 'Registra el pago del saldo final (40% del total)'}
            </Typography>
          </Box>
        </Box>
        <IconButton 
          onClick={onClose}
          sx={{ 
            color: 'white',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Content */}
      <DialogContent sx={{ mt: 3 }}>
        {success ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckIcon sx={{ fontSize: 80, color: '#4caf50', mb: 2 }} />
            <Typography variant="h5" gutterBottom color="success.main">
              ¡Pago Registrado Exitosamente!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              El {tipoPago} ha sido registrado correctamente
            </Typography>
          </Box>
        ) : (
          <Box>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {/* Monto Sugerido */}
            <Paper 
              elevation={0}
              sx={{ 
                p: 2, 
                mb: 3, 
                bgcolor: '#f8f9fa',
                border: '2px dashed #667eea',
                borderRadius: 2
              }}
            >
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Monto {tipoPago === 'anticipo' ? 'del Anticipo' : 'del Saldo'} ({formData.porcentaje}%)
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="primary">
                {formatearMoneda(montoSugerido)}
              </Typography>
              
              {/* Sugerencias de redondeo */}
              <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="caption" color="text.secondary" sx={{ width: '100%', mb: 0.5 }}>
                  💡 Sugerencias de redondeo:
                </Typography>
                {[
                  Math.floor(montoSugerido / 1000) * 1000, // Redondear a miles
                  Math.ceil(montoSugerido / 1000) * 1000,  // Redondear arriba a miles
                  Math.round(montoSugerido / 100) * 100,   // Redondear a centenas
                  montoSugerido                             // Monto exacto
                ].filter((value, index, self) => self.indexOf(value) === index) // Eliminar duplicados
                  .sort((a, b) => a - b)
                  .map((monto, index) => (
                    <Chip
                      key={index}
                      label={formatearMoneda(monto)}
                      size="small"
                      onClick={() => handleChange('monto', monto)}
                      sx={{
                        cursor: 'pointer',
                        bgcolor: formData.monto === monto ? '#667eea' : 'white',
                        color: formData.monto === monto ? 'white' : 'text.primary',
                        border: '1px solid #e0e0e0',
                        '&:hover': {
                          bgcolor: formData.monto === monto ? '#5568d3' : '#f5f5f5',
                        }
                      }}
                    />
                  ))}
              </Box>
            </Paper>

            <Grid container spacing={3}>
              {/* Monto */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Monto Recibido"
                  type="number"
                  value={formData.monto}
                  onChange={(e) => handleChange('monto', parseFloat(e.target.value))}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MoneyIcon color="primary" />
                      </InputAdornment>
                    ),
                  }}
                  helperText={
                    formData.monto !== montoSugerido && formData.monto > 0
                      ? `Diferencia: ${formatearMoneda(formData.monto - montoSugerido)} ${formData.monto > montoSugerido ? '(más)' : '(menos)'}`
                      : "Edita el monto o usa las sugerencias arriba"
                  }
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': {
                        borderColor: '#667eea',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#667eea',
                      },
                    },
                    '& .MuiFormHelperText-root': {
                      color: formData.monto !== montoSugerido && formData.monto > 0
                        ? (formData.monto > montoSugerido ? '#2e7d32' : '#ed6c02')
                        : 'text.secondary'
                    }
                  }}
                />
              </Grid>

              {/* Fecha de Pago */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Fecha de Pago"
                  type="date"
                  value={formData.fechaPago}
                  onChange={(e) => handleChange('fechaPago', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarIcon color="primary" />
                      </InputAdornment>
                    ),
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>

              {/* Método de Pago */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Método de Pago</InputLabel>
                  <Select
                    value={formData.metodoPago}
                    onChange={(e) => handleChange('metodoPago', e.target.value)}
                    label="Método de Pago"
                  >
                    {metodoPagoOpciones.map((opcion) => (
                      <MenuItem key={opcion.value} value={opcion.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span style={{ fontSize: '20px' }}>{opcion.icon}</span>
                          {opcion.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Tipo de Entrega */}
              <Grid item xs={12} md={formData.tipoEntrega === 'personalizado' ? 4 : 6}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Entrega</InputLabel>
                  <Select
                    value={formData.tipoEntrega}
                    onChange={(e) => handleChange('tipoEntrega', e.target.value)}
                    label="Tipo de Entrega"
                  >
                    <MenuItem value="normal">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span style={{ fontSize: '20px' }}>📦</span>
                        Normal (15 días hábiles)
                      </Box>
                    </MenuItem>
                    <MenuItem value="expres">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span style={{ fontSize: '20px' }}>⚡</span>
                        Exprés (7 días hábiles)
                      </Box>
                    </MenuItem>
                    <MenuItem value="personalizado">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span style={{ fontSize: '20px' }}>⏱️</span>
                        Personalizado
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Campos adicionales para entrega personalizada */}
              {formData.tipoEntrega === 'personalizado' && (
                <>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Cantidad"
                      value={formData.tiempoEntregaCantidad}
                      onChange={(e) => handleChange('tiempoEntregaCantidad', e.target.value)}
                      inputProps={{ min: 1 }}
                      placeholder="Ej: 24, 48, 72"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Unidad</InputLabel>
                      <Select
                        value={formData.tiempoEntregaUnidad}
                        onChange={(e) => handleChange('tiempoEntregaUnidad', e.target.value)}
                        label="Unidad"
                      >
                        <MenuItem value="horas">Horas</MenuItem>
                        <MenuItem value="dias">Días</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  {formData.tiempoEntregaCantidad && (
                    <Grid item xs={12}>
                      <Alert severity="info" icon="⏱️">
                        <strong>Tiempo de entrega:</strong> {formData.tiempoEntregaCantidad} {formData.tiempoEntregaUnidad}
                      </Alert>
                    </Grid>
                  )}
                </>
              )}

              {/* Referencia */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Referencia / No. de Operación"
                  value={formData.referencia}
                  onChange={(e) => handleChange('referencia', e.target.value)}
                  placeholder="Ej: SPEI-123456, Cheque #789, etc."
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <ReceiptIcon color="primary" />
                      </InputAdornment>
                    ),
                  }}
                  helperText="Número de referencia, folio o identificador del pago"
                />
              </Grid>

              {/* Comprobante */}
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }}>
                  <Chip label="Comprobante de Pago" />
                </Divider>
                
                <Box sx={{ mt: 2 }}>
                  <input
                    accept="image/*,application/pdf"
                    style={{ display: 'none' }}
                    id="comprobante-upload"
                    type="file"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="comprobante-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      fullWidth
                      startIcon={<UploadIcon />}
                      sx={{
                        py: 2,
                        borderStyle: 'dashed',
                        borderWidth: 2,
                        '&:hover': {
                          borderStyle: 'dashed',
                          borderWidth: 2,
                          bgcolor: 'rgba(102, 126, 234, 0.04)'
                        }
                      }}
                    >
                      {archivoNombre ? archivoNombre : 'Subir Comprobante (JPG, PNG o PDF)'}
                    </Button>
                  </label>

                  {archivoPreview && (
                    <Paper 
                      elevation={2} 
                      sx={{ 
                        mt: 2, 
                        p: 2, 
                        bgcolor: '#f8f9fa',
                        borderRadius: 2
                      }}
                    >
                      <Typography variant="body2" color="success.main" gutterBottom>
                        ✅ Archivo cargado: {archivoNombre}
                      </Typography>
                      {archivoPreview.includes('image') && (
                        <Box
                          component="img"
                          src={archivoPreview}
                          alt="Preview"
                          sx={{
                            width: '100%',
                            maxHeight: 200,
                            objectFit: 'contain',
                            borderRadius: 1,
                            mt: 1
                          }}
                        />
                      )}
                    </Paper>
                  )}

                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Tamaño máximo: 5MB. Formatos: JPG, PNG, PDF
                  </Typography>
                </Box>
              </Grid>

              {/* Sección de Facturación */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }}>
                  <Chip 
                    label="📄 Información de Facturación" 
                    sx={{ 
                      bgcolor: '#f0f4ff',
                      color: '#667eea',
                      fontWeight: 'bold'
                    }}
                  />
                </Divider>
              </Grid>

              {/* Checkbox Requiere Factura */}
              <Grid item xs={12}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    p: 2,
                    bgcolor: '#f8f9fa',
                    borderRadius: 2,
                    border: '1px solid #e0e0e0'
                  }}
                >
                  <input
                    type="checkbox"
                    id="requiere-factura"
                    checked={formData.requiereFactura}
                    onChange={(e) => handleChange('requiereFactura', e.target.checked)}
                    style={{ 
                      width: 20, 
                      height: 20, 
                      marginRight: 12,
                      cursor: 'pointer'
                    }}
                  />
                  <label 
                    htmlFor="requiere-factura" 
                    style={{ 
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: 500
                    }}
                  >
                    🧾 El cliente requiere factura
                  </label>
                </Box>
              </Grid>

              {/* Campos de facturación (solo si requiere factura) */}
              {formData.requiereFactura && (
                <>
                  {/* Correo del Cliente */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Correo Electrónico del Cliente"
                      type="email"
                      value={formData.correoCliente}
                      onChange={(e) => handleChange('correoCliente', e.target.value)}
                      placeholder="cliente@ejemplo.com"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Box sx={{ fontSize: 20 }}>📧</Box>
                          </InputAdornment>
                        ),
                      }}
                      helperText="Correo donde se enviará la factura"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': {
                            borderColor: '#667eea',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#667eea',
                          },
                        },
                      }}
                    />
                  </Grid>

                  {/* Constancia de Situación Fiscal */}
                  <Grid item xs={12}>
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        📋 Constancia de Situación Fiscal (CSF)
                      </Typography>
                      
                      <input
                        accept="application/pdf"
                        style={{ display: 'none' }}
                        id="constancia-upload"
                        type="file"
                        onChange={handleConstanciaChange}
                      />
                      <label htmlFor="constancia-upload">
                        <Button
                          variant="outlined"
                          component="span"
                          fullWidth
                          startIcon={<UploadIcon />}
                          sx={{
                            py: 2,
                            borderStyle: 'dashed',
                            borderWidth: 2,
                            borderColor: '#667eea',
                            color: '#667eea',
                            '&:hover': {
                              borderStyle: 'dashed',
                              borderWidth: 2,
                              bgcolor: 'rgba(102, 126, 234, 0.04)',
                              borderColor: '#667eea',
                            }
                          }}
                        >
                          {constanciaNombre ? constanciaNombre : 'Subir Constancia Fiscal (PDF)'}
                        </Button>
                      </label>

                      {constanciaPreview && (
                        <Paper 
                          elevation={2} 
                          sx={{ 
                            mt: 2, 
                            p: 2, 
                            bgcolor: '#f0f4ff',
                            borderRadius: 2,
                            border: '2px solid #667eea'
                          }}
                        >
                          <Typography variant="body2" color="primary" gutterBottom fontWeight="bold">
                            ✅ Constancia cargada: {constanciaNombre}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            La constancia se guardará junto con los datos de facturación
                          </Typography>
                        </Paper>
                      )}

                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Tamaño máximo: 5MB. Solo archivos PDF
                      </Typography>
                    </Box>
                  </Grid>

                  {/* Nota informativa */}
                  <Grid item xs={12}>
                    <Alert severity="info" sx={{ mt: 1 }}>
                      <Typography variant="body2">
                        <strong>💡 Importante:</strong> La constancia fiscal es necesaria para emitir la factura. 
                        Si no la tienes ahora, podrás subirla después desde el perfil del proyecto.
                      </Typography>
                    </Alert>
                  </Grid>
                </>
              )}
            </Grid>
          </Box>
        )}
      </DialogContent>

      {/* Actions */}
      {!success && (
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={onClose}
            variant="outlined"
            size="large"
            disabled={loading}
            sx={{ minWidth: 120 }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            size="large"
            disabled={loading}
            sx={{
              minWidth: 180,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
              }
            }}
          >
            {loading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                Registrando...
              </>
            ) : (
              <>
                <CheckIcon sx={{ mr: 1 }} />
                Registrar Pago
              </>
            )}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default ModalRegistrarPago;

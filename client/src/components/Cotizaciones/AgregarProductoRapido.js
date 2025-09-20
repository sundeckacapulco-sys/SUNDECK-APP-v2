import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Alert,
  Chip,
  Divider,
  IconButton
} from '@mui/material';
import {
  Add,
  Close,
  Save,
  Category,
  Build,
  AttachMoney,
  Straighten
} from '@mui/icons-material';
import axiosConfig from '../../config/axios';

const AgregarProductoRapido = ({ 
  open, 
  onClose, 
  onProductoCreado, 
  userRole = 'vendedor' 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    descripcion: '',
    categoria: 'ventana',
    material: 'aluminio',
    unidadMedida: 'm2',
    precioBase: '',
    coloresDisponibles: ['Blanco'],
    tiempoFabricacion: 5
  });

  const [coloresInput, setColoresInput] = useState('Blanco');

  // Verificar permisos
  const tienePermisos = ['admin', 'supervisor'].includes(userRole);

  const categorias = [
    { value: 'ventana', label: '🪟 Ventanas/Persianas', icon: '🪟' },
    { value: 'puerta', label: '🚪 Puertas', icon: '🚪' },
    { value: 'cancel', label: '🏢 Canceles', icon: '🏢' },
    { value: 'domo', label: '🔆 Domos', icon: '🔆' },
    { value: 'motor', label: '⚙️ Motores', icon: '⚙️' },
    { value: 'control', label: '🎮 Controles', icon: '🎮' },
    { value: 'kit', label: '📦 Kits Completos', icon: '📦' },
    { value: 'galeria', label: '📏 Galerías', icon: '📏' },
    { value: 'canaleta', label: '🔲 Canaletas', icon: '🔲' },
    { value: 'herraje', label: '🔧 Herrajes', icon: '🔧' },
    { value: 'accesorio', label: '🛠️ Accesorios', icon: '🛠️' },
    { value: 'repuesto', label: '🔄 Repuestos', icon: '🔄' }
  ];

  const unidades = [
    { 
      value: 'm2', 
      label: 'm² (Metro cuadrado)', 
      descripcion: 'Para persianas, cortinas, domos',
      requiereMedidas: true,
      icon: '📐'
    },
    { 
      value: 'ml', 
      label: 'm.l. (Metro lineal)', 
      descripcion: 'Para galerías, canaletas, perfiles',
      requiereMedidas: true,
      icon: '📏'
    },
    { 
      value: 'pieza', 
      label: 'Pieza', 
      descripcion: 'Para motores, controles, accesorios',
      requiereMedidas: false,
      icon: '🔧'
    },
    { 
      value: 'par', 
      label: 'Par', 
      descripcion: 'Para soportes, bisagras (2 piezas)',
      requiereMedidas: false,
      icon: '⚖️'
    },
    { 
      value: 'juego', 
      label: 'Juego', 
      descripcion: 'Para conjuntos de herrajes',
      requiereMedidas: false,
      icon: '🎯'
    },
    { 
      value: 'kit', 
      label: 'Kit', 
      descripcion: 'Para sistemas completos',
      requiereMedidas: false,
      icon: '📦'
    }
  ];

  const materiales = [
    { value: 'aluminio', label: 'Aluminio', icon: '🔘' },
    { value: 'pvc', label: 'PVC', icon: '⚪' },
    { value: 'madera', label: 'Madera', icon: '🟤' },
    { value: 'acero', label: 'Acero', icon: '⚫' },
    { value: 'plastico', label: 'Plástico', icon: '🔵' },
    { value: 'tela', label: 'Tela', icon: '🟨' },
    { value: 'mixto', label: 'Mixto', icon: '🌈' },
    { value: 'otro', label: 'Otro', icon: '❓' }
  ];

  useEffect(() => {
    if (open) {
      // Reset form cuando se abre
      setFormData({
        nombre: '',
        codigo: '',
        descripcion: '',
        categoria: 'ventana',
        material: 'aluminio',
        unidadMedida: 'm2',
        precioBase: '',
        coloresDisponibles: ['Blanco'],
        tiempoFabricacion: 5
      });
      setColoresInput('Blanco');
      setError('');
      setSuccess('');
    }
  }, [open]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-generar código si no existe
    if (field === 'nombre' && !formData.codigo) {
      const categoria = formData.categoria.toUpperCase().substring(0, 3);
      const nombre = value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 3);
      const numero = String(Math.floor(Math.random() * 100)).padStart(3, '0');
      setFormData(prev => ({
        ...prev,
        codigo: `${categoria}-${nombre}-${numero}`
      }));
    }
  };

  const handleColoresChange = () => {
    const coloresArray = coloresInput
      .split(',')
      .map(color => color.trim())
      .filter(color => color.length > 0);
    
    setFormData(prev => ({
      ...prev,
      coloresDisponibles: coloresArray
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      // Validaciones
      if (!formData.nombre.trim()) {
        setError('El nombre del producto es requerido');
        return;
      }
      if (!formData.codigo.trim()) {
        setError('El código del producto es requerido');
        return;
      }
      if (!formData.precioBase || formData.precioBase <= 0) {
        setError('El precio base debe ser mayor a 0');
        return;
      }

      // Preparar datos para enviar
      const productoData = {
        ...formData,
        precioBase: parseFloat(formData.precioBase),
        tiempoFabricacion: {
          base: parseInt(formData.tiempoFabricacion),
          porM2Adicional: formData.unidadMedida === 'm2' ? 0.5 : 0
        },
        configuracionUnidad: {
          requiereMedidas: ['m2', 'ml'].includes(formData.unidadMedida),
          calculoPorArea: formData.unidadMedida === 'm2',
          minimoVenta: formData.unidadMedida === 'pieza' ? 1 : 0.1,
          incremento: formData.unidadMedida === 'pieza' ? 1 : 0.1
        },
        activo: true,
        disponible: true,
        tags: [
          formData.categoria,
          formData.unidadMedida,
          formData.material,
          'rapido'
        ]
      };

      const response = await axiosConfig.post('/productos', productoData);
      
      setSuccess(`Producto "${formData.nombre}" creado exitosamente`);
      
      // Notificar al componente padre
      if (onProductoCreado) {
        onProductoCreado(response.data.producto);
      }

      // Cerrar modal después de 1.5 segundos
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (error) {
      console.error('Error creando producto:', error);
      setError(error.response?.data?.message || 'Error creando el producto');
    } finally {
      setLoading(false);
    }
  };

  if (!tienePermisos) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Close color="error" />
            Acceso Denegado
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning">
            Solo administradores y supervisores pueden agregar productos al catálogo.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    );
  }

  const unidadSeleccionada = unidades.find(u => u.value === formData.unidadMedida);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <Add color="primary" />
            <Typography variant="h6">
              Agregar Producto Rápido
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Información Básica */}
          <Grid item xs={12}>
            <Typography variant="h6" color="primary" gutterBottom>
              📝 Información Básica
            </Typography>
          </Grid>

          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="Nombre del Producto"
              value={formData.nombre}
              onChange={(e) => handleInputChange('nombre', e.target.value)}
              placeholder="Ej: Persiana Screen 3%, Motor Tubular 20Nm..."
              required
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Código"
              value={formData.codigo}
              onChange={(e) => handleInputChange('codigo', e.target.value)}
              placeholder="Ej: PER-SCR-001"
              required
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Descripción"
              value={formData.descripcion}
              onChange={(e) => handleInputChange('descripcion', e.target.value)}
              placeholder="Descripción detallada del producto..."
            />
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Clasificación */}
          <Grid item xs={12}>
            <Typography variant="h6" color="primary" gutterBottom>
              🏷️ Clasificación
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Categoría</InputLabel>
              <Select
                value={formData.categoria}
                onChange={(e) => handleInputChange('categoria', e.target.value)}
                label="Categoría"
              >
                {categorias.map(cat => (
                  <MenuItem key={cat.value} value={cat.value}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <span>{cat.icon}</span>
                      {cat.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Material</InputLabel>
              <Select
                value={formData.material}
                onChange={(e) => handleInputChange('material', e.target.value)}
                label="Material"
              >
                {materiales.map(mat => (
                  <MenuItem key={mat.value} value={mat.value}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <span>{mat.icon}</span>
                      {mat.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Unidad de Medida</InputLabel>
              <Select
                value={formData.unidadMedida}
                onChange={(e) => handleInputChange('unidadMedida', e.target.value)}
                label="Unidad de Medida"
              >
                {unidades.map(unidad => (
                  <MenuItem key={unidad.value} value={unidad.value}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <span>{unidad.icon}</span>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {unidad.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {unidad.descripcion}
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Información de la unidad seleccionada */}
          {unidadSeleccionada && (
            <Grid item xs={12}>
              <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  {unidadSeleccionada.icon} {unidadSeleccionada.label}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {unidadSeleccionada.descripcion}
                </Typography>
                <Chip 
                  label={unidadSeleccionada.requiereMedidas ? "Requiere medidas" : "No requiere medidas"}
                  color={unidadSeleccionada.requiereMedidas ? "warning" : "success"}
                  size="small"
                  sx={{ mt: 1 }}
                />
              </Box>
            </Grid>
          )}

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Precios y Tiempos */}
          <Grid item xs={12}>
            <Typography variant="h6" color="primary" gutterBottom>
              💰 Precios y Tiempos
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label={`Precio Base (${formData.unidadMedida})`}
              type="number"
              value={formData.precioBase}
              onChange={(e) => handleInputChange('precioBase', e.target.value)}
              InputProps={{
                startAdornment: '$'
              }}
              inputProps={{ step: 0.01, min: 0 }}
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Tiempo de Fabricación (días)"
              type="number"
              value={formData.tiempoFabricacion}
              onChange={(e) => handleInputChange('tiempoFabricacion', e.target.value)}
              inputProps={{ step: 1, min: 1 }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Colores Disponibles (separados por coma)"
              value={coloresInput}
              onChange={(e) => setColoresInput(e.target.value)}
              onBlur={handleColoresChange}
              placeholder="Blanco, Gris, Negro, Beige..."
            />
            <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {formData.coloresDisponibles.map((color, index) => (
                <Chip 
                  key={index} 
                  label={color} 
                  size="small" 
                  color="secondary"
                />
              ))}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading ? null : <Save />}
        >
          {loading ? 'Guardando...' : 'Crear Producto'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AgregarProductoRapido;

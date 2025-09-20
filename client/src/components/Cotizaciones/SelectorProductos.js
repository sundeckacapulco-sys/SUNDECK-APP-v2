import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Autocomplete,
  Typography,
  Chip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert
} from '@mui/material';
import { Add, Calculate } from '@mui/icons-material';
import axiosConfig from '../../config/axios';

const SelectorProductos = ({ onProductoSeleccionado, onCalcularPrecio }) => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [medidas, setMedidas] = useState({
    ancho: 0,
    alto: 0,
    cantidad: 1,
    metrosLineales: 0
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProductos();
  }, []);

  const fetchProductos = async (busqueda = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        activo: 'true',
        disponible: 'true',
        limit: '20'
      });
      
      if (busqueda) {
        params.append('search', busqueda);
      }

      const response = await axiosConfig.get(`/productos?${params.toString()}`);
      setProductos(response.data.docs || []);
    } catch (error) {
      console.error('Error cargando productos:', error);
      setError('Error cargando productos');
    } finally {
      setLoading(false);
    }
  };

  const handleProductoChange = (event, newValue) => {
    setProductoSeleccionado(newValue);
    setError('');
    
    // Resetear medidas según el tipo de producto
    if (newValue) {
      const nuevasMedidas = {
        ancho: 0,
        alto: 0,
        cantidad: 1,
        metrosLineales: 0
      };
      
      // Configurar valores por defecto según unidad de medida
      switch (newValue.unidadMedida) {
        case 'pieza':
        case 'par':
        case 'juego':
        case 'kit':
          nuevasMedidas.cantidad = 1;
          break;
        case 'ml':
        case 'metro':
          nuevasMedidas.metrosLineales = 1;
          break;
        default:
          nuevasMedidas.ancho = 1;
          nuevasMedidas.alto = 1;
      }
      
      setMedidas(nuevasMedidas);
    }
  };

  const handleMedidasChange = (campo, valor) => {
    const nuevasMedidas = {
      ...medidas,
      [campo]: parseFloat(valor) || 0
    };
    setMedidas(nuevasMedidas);
  };

  const calcularPrecio = async () => {
    if (!productoSeleccionado) {
      setError('Selecciona un producto primero');
      return;
    }

    // Validar medidas según el tipo de producto
    if (productoSeleccionado.configuracionUnidad?.requiereMedidas) {
      if (productoSeleccionado.unidadMedida === 'm2' && (!medidas.ancho || !medidas.alto)) {
        setError('Ingresa ancho y alto para productos por m²');
        return;
      }
      if (['ml', 'metro'].includes(productoSeleccionado.unidadMedida) && !medidas.metrosLineales && !medidas.ancho) {
        setError('Ingresa metros lineales para este producto');
        return;
      }
    }

    try {
      setLoading(true);
      setError('');

      const response = await axiosConfig.post(`/productos/${productoSeleccionado._id}/calcular-precio`, {
        medidas: medidas,
        opciones: {}
      });

      const resultado = response.data;
      
      // Crear objeto producto para agregar a la cotización
      const productoParaCotizacion = {
        nombre: productoSeleccionado.nombre,
        descripcion: '', // Se puede llenar después
        categoria: productoSeleccionado.categoria,
        material: productoSeleccionado.material,
        color: productoSeleccionado.coloresDisponibles?.[0] || '',
        medidas: {
          ancho: medidas.ancho,
          alto: medidas.alto,
          area: resultado.area || medidas.metrosLineales || medidas.cantidad
        },
        cantidad: medidas.cantidad,
        precioUnitario: resultado.precio / (resultado.area || resultado.metrosLineales || resultado.cantidad || 1),
        subtotal: resultado.precio,
        unidadMedida: productoSeleccionado.unidadMedida,
        tiempoFabricacion: resultado.tiempoFabricacion,
        productoId: productoSeleccionado._id
      };

      onProductoSeleccionado(productoParaCotizacion);
      
      // Resetear formulario
      setProductoSeleccionado(null);
      setMedidas({
        ancho: 0,
        alto: 0,
        cantidad: 1,
        metrosLineales: 0
      });

    } catch (error) {
      setError(error.response?.data?.message || 'Error calculando precio');
    } finally {
      setLoading(false);
    }
  };

  const renderCamposMedidas = () => {
    if (!productoSeleccionado) return null;

    const { unidadMedida, configuracionUnidad } = productoSeleccionado;

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Medidas para {productoSeleccionado.nombre}
        </Typography>
        
        <Grid container spacing={2}>
          {/* Campos según unidad de medida */}
          {unidadMedida === 'm2' && (
            <>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Ancho (m)"
                  type="number"
                  value={medidas.ancho}
                  onChange={(e) => handleMedidasChange('ancho', e.target.value)}
                  inputProps={{ step: 0.01, min: 0 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Alto (m)"
                  type="number"
                  value={medidas.alto}
                  onChange={(e) => handleMedidasChange('alto', e.target.value)}
                  inputProps={{ step: 0.01, min: 0 }}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  Área calculada: {(medidas.ancho * medidas.alto).toFixed(2)} m²
                </Typography>
              </Grid>
            </>
          )}

          {['ml', 'metro'].includes(unidadMedida) && (
            <>
              <Grid item xs={8}>
                <TextField
                  fullWidth
                  label="Metros Lineales"
                  type="number"
                  value={medidas.metrosLineales}
                  onChange={(e) => handleMedidasChange('metrosLineales', e.target.value)}
                  inputProps={{ step: 0.1, min: 0 }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Cantidad"
                  type="number"
                  value={medidas.cantidad}
                  onChange={(e) => handleMedidasChange('cantidad', e.target.value)}
                  inputProps={{ step: 1, min: 1 }}
                />
              </Grid>
            </>
          )}

          {['pieza', 'par', 'juego', 'kit'].includes(unidadMedida) && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Cantidad"
                type="number"
                value={medidas.cantidad}
                onChange={(e) => handleMedidasChange('cantidad', e.target.value)}
                inputProps={{ step: 1, min: 1 }}
              />
            </Grid>
          )}

          <Grid item xs={12}>
            <Button
              variant="contained"
              startIcon={<Calculate />}
              onClick={calcularPrecio}
              disabled={loading}
              sx={{ mt: 1 }}
            >
              {loading ? 'Calculando...' : 'Calcular y Agregar'}
            </Button>
          </Grid>
        </Grid>
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        🛍️ Agregar Producto del Catálogo
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Autocomplete
        options={productos}
        getOptionLabel={(option) => `${option.codigo} - ${option.nombre}`}
        value={productoSeleccionado}
        onChange={handleProductoChange}
        onInputChange={(event, newInputValue) => {
          if (newInputValue.length > 2) {
            fetchProductos(newInputValue);
          } else if (newInputValue.length === 0) {
            // Recargar todos los productos cuando se borra el texto
            fetchProductos('');
          }
        }}
        loading={loading}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Buscar producto por código o nombre"
            placeholder="Ej: MOTOR-001, Persiana Screen..."
          />
        )}
        renderOption={(props, option) => (
          <Box component="li" {...props}>
            <Box>
              <Typography variant="subtitle2">
                {option.codigo} - {option.nombre}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                <Chip 
                  label={option.categoria} 
                  size="small" 
                  color="primary"
                />
                <Chip 
                  label={`${option.precioBase?.toLocaleString()} / ${option.unidadMedida}`}
                  size="small" 
                  color="secondary"
                />
                {option.material && (
                  <Chip 
                    label={option.material} 
                    size="small" 
                    variant="outlined"
                  />
                )}
              </Box>
            </Box>
          </Box>
        )}
        sx={{ mb: 2 }}
      />

      {productoSeleccionado && (
        <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1, mb: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            {productoSeleccionado.nombre}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {productoSeleccionado.descripcion}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <Chip 
              label={`Precio base: $${productoSeleccionado.precioBase?.toLocaleString()}`}
              color="success"
              size="small"
            />
            <Chip 
              label={`Unidad: ${productoSeleccionado.unidadMedida}`}
              color="info"
              size="small"
            />
            {productoSeleccionado.coloresDisponibles?.length > 0 && (
              <Chip 
                label={`Colores: ${productoSeleccionado.coloresDisponibles.join(', ')}`}
                variant="outlined"
                size="small"
              />
            )}
          </Box>
        </Box>
      )}

      {renderCamposMedidas()}
    </Box>
  );
};

export default SelectorProductos;

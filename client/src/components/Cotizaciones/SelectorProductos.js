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

  const getCamposMedidas = () => {
    if (!productoSeleccionado) return null;

    const { unidadMedida } = productoSeleccionado;

    // Retornar campos según tipo de unidad
    if (unidadMedida === 'm2') {
      return (
        <>
          <TextField
            label="Ancho (m)"
            type="number"
            size="small"
            value={medidas.ancho}
            onChange={(e) => handleMedidasChange('ancho', e.target.value)}
            inputProps={{ step: 0.01, min: 0 }}
            sx={{ width: 100 }}
          />
          <TextField
            label="Alto (m)"
            type="number"
            size="small"
            value={medidas.alto}
            onChange={(e) => handleMedidasChange('alto', e.target.value)}
            inputProps={{ step: 0.01, min: 0 }}
            sx={{ width: 100 }}
          />
        </>
      );
    }

    if (['ml', 'metro'].includes(unidadMedida)) {
      return (
        <>
          <TextField
            label="Metros"
            type="number"
            size="small"
            value={medidas.metrosLineales}
            onChange={(e) => handleMedidasChange('metrosLineales', e.target.value)}
            inputProps={{ step: 0.1, min: 0 }}
            sx={{ width: 100 }}
          />
          <TextField
            label="Cantidad"
            type="number"
            size="small"
            value={medidas.cantidad}
            onChange={(e) => handleMedidasChange('cantidad', e.target.value)}
            inputProps={{ step: 1, min: 1 }}
            sx={{ width: 90 }}
          />
        </>
      );
    }

    // pieza, par, juego, kit
    return (
      <TextField
        label="Cantidad"
        type="number"
        size="small"
        value={medidas.cantidad}
        onChange={(e) => handleMedidasChange('cantidad', e.target.value)}
        inputProps={{ step: 1, min: 1 }}
        sx={{ width: 90 }}
      />
    );
  };

  return (
    <Box sx={{ mb: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 1, py: 0.5 }}>
          {error}
        </Alert>
      )}

      {/* LÍNEA SUPERIOR: Buscador + Medidas + Botón */}
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1, 
          mb: 0.75,
          flexWrap: 'wrap'
        }}
      >
        {/* Buscador de productos */}
        <Autocomplete
          options={productos}
          getOptionLabel={(option) => `${option.codigo} - ${option.nombre}`}
          value={productoSeleccionado}
          onChange={handleProductoChange}
          onInputChange={(event, newInputValue) => {
            if (newInputValue.length > 2) {
              fetchProductos(newInputValue);
            } else if (newInputValue.length === 0) {
              fetchProductos('');
            }
          }}
          loading={loading}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="🔍 Buscar producto..."
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#FFFFFF'
                }
              }}
            />
          )}
          renderOption={(props, option) => (
            <Box component="li" {...props}>
              <Box sx={{ width: '100%' }}>
                <Typography variant="body2" fontWeight={600}>
                  {option.codigo} - {option.nombre}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                  <Chip 
                    label={option.categoria} 
                    size="small" 
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                  <Chip 
                    label={`$${option.precioBase?.toLocaleString()} / ${option.unidadMedida}`}
                    size="small" 
                    sx={{ height: 20, fontSize: '0.7rem', bgcolor: '#D4AF37', color: '#FFF' }}
                  />
                </Box>
              </Box>
            </Box>
          )}
          sx={{ 
            flex: 1,
            minWidth: 250
          }}
        />

        {/* Campos de medidas (solo si hay producto seleccionado) */}
        {getCamposMedidas()}

        {/* Botón Agregar */}
        <Button
          variant="contained"
          onClick={calcularPrecio}
          disabled={loading || !productoSeleccionado}
          sx={{
            backgroundColor: "#0F172A",
            "&:hover": { backgroundColor: "#1E293B" },
            textTransform: "none",
            fontWeight: 600,
            px: 2,
            py: 1,
            fontSize: '0.875rem',
            minWidth: 150
          }}
        >
          {loading ? 'Agregando...' : 'Agregar Producto'}
        </Button>
      </Box>

      {/* TARJETA DESCRIPCIÓN (solo si hay producto seleccionado) */}
      {productoSeleccionado && (
        <Box 
          sx={{ 
            backgroundColor: '#F8FAFC',
            p: 1.5,
            borderRadius: 2,
            border: '1px solid #E2E8F0'
          }}
        >
          <Typography 
            sx={{ 
              fontWeight: 600, 
              color: '#0F172A',
              fontSize: '0.9rem',
              mb: 0.5
            }}
          >
            {productoSeleccionado.nombre}
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#475569',
              fontSize: '0.85rem',
              mb: 0.75
            }}
          >
            {productoSeleccionado.descripcion || 'Sin descripción disponible'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip 
              label={`💲 $${productoSeleccionado.precioBase?.toLocaleString()}`}
              size="small"
              sx={{ 
                height: 24,
                fontSize: '0.75rem',
                bgcolor: '#10B981',
                color: '#FFF',
                fontWeight: 600
              }}
            />
            <Chip 
              label={`Unidad: ${productoSeleccionado.unidadMedida}`}
              size="small"
              sx={{ height: 24, fontSize: '0.75rem' }}
            />
            {productoSeleccionado.coloresDisponibles?.length > 0 && (
              <Chip 
                label={`Colores: ${productoSeleccionado.coloresDisponibles.join(', ')}`}
                size="small"
                sx={{ height: 24, fontSize: '0.75rem' }}
              />
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default SelectorProductos;

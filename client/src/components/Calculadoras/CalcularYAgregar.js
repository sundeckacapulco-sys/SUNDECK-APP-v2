import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Paper,
  IconButton,
  Divider,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip
} from '@mui/material';
import {
  Close,
  Calculate,
  Add as AddIcon,
  Straighten,
  Height
} from '@mui/icons-material';

const CalcularYAgregar = ({ open, onClose, productos = [], onAgregarProducto }) => {
  const [tipoCalculo, setTipoCalculo] = useState('canaletas'); // 'canaletas' o 'galerias'
  const [productoSeleccionado, setProductoSeleccionado] = useState('');
  const [precioUnitario, setPrecioUnitario] = useState('');
  const [resultado, setResultado] = useState(null);

  // Productos típicos para canaletas y galerías
  const productosDisponibles = {
    canaletas: [
      { id: 'canaleta_aluminio', nombre: 'Canaleta de Aluminio', unidad: 'ml', precioBase: 180 },
      { id: 'canaleta_pvc', nombre: 'Canaleta de PVC', unidad: 'ml', precioBase: 120 },
      { id: 'canaleta_acero', nombre: 'Canaleta de Acero', unidad: 'ml', precioBase: 220 },
      { id: 'bajante_aluminio', nombre: 'Bajante de Aluminio', unidad: 'ml', precioBase: 150 },
      { id: 'bajante_pvc', nombre: 'Bajante de PVC', unidad: 'ml', precioBase: 95 }
    ],
    galerias: [
      { id: 'galeria_aluminio', nombre: 'Galería de Aluminio', unidad: 'ml', precioBase: 350 },
      { id: 'galeria_acero', nombre: 'Galería de Acero', unidad: 'ml', precioBase: 280 },
      { id: 'riel_cortina', nombre: 'Riel para Cortina', unidad: 'ml', precioBase: 180 },
      { id: 'soporte_galeria', nombre: 'Soporte para Galería', unidad: 'pieza', precioBase: 85 },
      { id: 'tope_galeria', nombre: 'Tope para Galería', unidad: 'par', precioBase: 45 }
    ]
  };

  const calcularMedidas = () => {
    if (!productos || productos.length === 0) {
      return null;
    }

    let totalCalculado = 0;
    let productosUsados = [];
    let productosExcluidos = [];
    let unidadMedida = '';

    if (tipoCalculo === 'canaletas') {
      // Para canaletas: sumar todos los ALTOS de las persianas y multiplicar por 2 (laterales)
      productos.forEach(producto => {
        // Excluir productos que ya sean canaletas, galerías o accesorios lineales
        const esProductoLineal = ['canaleta', 'galeria', 'bajante', 'riel'].some(tipo => 
          producto.nombre?.toLowerCase().includes(tipo) || 
          producto.categoria?.toLowerCase().includes(tipo)
        );
        
        if (!esProductoLineal) {
          const alto = producto.medidas?.alto || 0;
          const cantidad = producto.cantidad || 1;
          const altoTotal = alto * cantidad;
          
          if (alto > 0) {
            totalCalculado += altoTotal;
            productosUsados.push({
              nombre: producto.nombre,
              ubicacion: producto.descripcion,
              alto: alto,
              cantidad: cantidad,
              altoTotal: altoTotal
            });
          }
        } else {
          productosExcluidos.push({
            nombre: producto.nombre,
            razon: 'Ya es un producto lineal (canaleta/galería)'
          });
        }
      });
      
      // Multiplicar por 2 para canaletas (van en ambos laterales)
      totalCalculado = totalCalculado * 2;
      unidadMedida = 'metros lineales (altura × 2 laterales)';
    } else {
      // Para galerías: sumar todos los ANCHOS de las persianas (NO incluir productos que ya sean galerías)
      productos.forEach(producto => {
        // Excluir productos que ya sean canaletas, galerías o accesorios lineales
        const esProductoLineal = ['canaleta', 'galeria', 'bajante', 'riel'].some(tipo => 
          producto.nombre?.toLowerCase().includes(tipo) || 
          producto.categoria?.toLowerCase().includes(tipo)
        );
        
        if (!esProductoLineal) {
          const ancho = producto.medidas?.ancho || 0;
          const cantidad = producto.cantidad || 1;
          const anchoTotal = ancho * cantidad;
          
          if (ancho > 0) {
            totalCalculado += anchoTotal;
            productosUsados.push({
              nombre: producto.nombre,
              ubicacion: producto.descripcion,
              ancho: ancho,
              cantidad: cantidad,
              anchoTotal: anchoTotal
            });
          }
        } else {
          productosExcluidos.push({
            nombre: producto.nombre,
            razon: 'Ya es un producto lineal (canaleta/galería)'
          });
        }
      });
      unidadMedida = 'metros lineales (ancho)';
    }

    return {
      total: totalCalculado,
      unidad: unidadMedida,
      productos: productosUsados,
      productosExcluidos: productosExcluidos,
      tipo: tipoCalculo
    };
  };

  // Recalcular automáticamente cuando cambien los productos o el tipo de cálculo
  useEffect(() => {
    if (productos && productos.length > 0) {
      const calculo = calcularMedidas();
      if (calculo && calculo.total > 0) {
        setResultado(calculo);
        console.log('🔄 Recálculo automático:', calculo);
      } else {
        setResultado(null);
        console.log('🔄 Recálculo automático: sin resultados');
      }
    }
  }, [productos, tipoCalculo]);

  const handleCalcular = () => {
    const calculo = calcularMedidas();
    if (calculo && calculo.total > 0) {
      setResultado(calculo);
    } else {
      setResultado(null);
    }
  };

  const handleAgregar = () => {
    console.log('🔧 handleAgregar iniciado');
    console.log('📊 resultado:', resultado);
    console.log('🛍️ productoSeleccionado:', productoSeleccionado);
    console.log('💰 precioUnitario:', precioUnitario);
    
    if (!resultado || !productoSeleccionado || !precioUnitario) {
      console.log('❌ Faltan datos requeridos');
      return;
    }

    const producto = productosDisponibles[tipoCalculo].find(p => p.id === productoSeleccionado);
    console.log('🔍 producto encontrado:', producto);
    if (!producto) {
      console.log('❌ Producto no encontrado');
      return;
    }

    const precio = parseFloat(precioUnitario);
    const cantidad = resultado.total;
    const subtotal = cantidad * precio;

    const nuevoProducto = {
      nombre: producto.nombre,
      descripcion: `${tipoCalculo === 'canaletas' ? 'Canaletas (laterales × 2)' : 'Galerías'} calculadas automáticamente`,
      categoria: tipoCalculo === 'canaletas' ? 'canaleta' : 'galeria',
      material: producto.nombre.includes('Aluminio') ? 'aluminio' : 
                producto.nombre.includes('PVC') ? 'pvc' : 'acero',
      unidadMedida: 'ml', // Importante: definir la unidad de medida
      medidas: {
        ancho: tipoCalculo === 'galerias' ? resultado.total : 1,
        alto: tipoCalculo === 'canaletas' ? resultado.total : 1,
        area: resultado.total // Para productos lineales, el área es la longitud
      },
      cantidad: 1, // Ya está calculada la cantidad total en las medidas
      precioUnitario: precio,
      subtotal: subtotal,
      calculadoAutomaticamente: true,
      detalleCalculo: {
        tipo: tipoCalculo,
        productosBase: resultado.productos,
        totalCalculado: resultado.total,
        unidad: resultado.unidad
      }
    };

    console.log('🚀 Producto a agregar:', nuevoProducto);
    
    if (onAgregarProducto) {
      console.log('✅ Llamando onAgregarProducto');
      onAgregarProducto(nuevoProducto);
      console.log('✅ onAgregarProducto ejecutado');
    } else {
      console.log('❌ onAgregarProducto no está definido');
    }

    // Limpiar y cerrar
    setResultado(null);
    setProductoSeleccionado('');
    setPrecioUnitario('');
    onClose();
  };

  const productosActuales = productosDisponibles[tipoCalculo] || [];
  const calculo = calcularMedidas();
  
  // Debug: Solo mostrar cuando hay problemas
  if (open && (!resultado || !productoSeleccionado || !precioUnitario)) {
    console.log('🔍 Estado del botón:', {
      resultado: !!resultado,
      productoSeleccionado: !!productoSeleccionado,
      precioUnitario: !!precioUnitario,
      calculo: !!calculo,
      botonDeshabilitado: !resultado || !productoSeleccionado || !precioUnitario
    });
  }

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
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <Calculate color="primary" />
            <Typography variant="h6">Materiales Extras</Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Calcula automáticamente las medidas necesarias para materiales extras como canaletas o galerías basándose en las persianas agregadas.
          </Typography>
        </Box>

        {/* Selector de tipo de cálculo */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            📏 Tipo de Cálculo
          </Typography>
          
          <Box display="flex" gap={2}>
            <Button
              variant={tipoCalculo === 'canaletas' ? 'contained' : 'outlined'}
              onClick={() => setTipoCalculo('canaletas')}
              startIcon={<Height />}
              sx={{ flex: 1 }}
            >
              Canaletas (Suma Altos)
            </Button>
            <Button
              variant={tipoCalculo === 'galerias' ? 'contained' : 'outlined'}
              onClick={() => setTipoCalculo('galerias')}
              startIcon={<Straighten />}
              sx={{ flex: 1 }}
            >
              Galerías (Suma Anchos)
            </Button>
          </Box>
          
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            {tipoCalculo === 'canaletas' 
              ? '🔸 Canaletas: Suma la altura de todas las persianas × 2 (laterales) para calcular metros lineales de canaleta'
              : '🔸 Galerías: Suma el ancho de todas las persianas para calcular metros lineales de galería'
            }
          </Typography>
        </Box>

        {/* Análisis de productos actuales */}
        {productos && productos.length > 0 ? (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              📊 Análisis de Productos Actuales
            </Typography>
            
            <Button
              variant="contained"
              onClick={handleCalcular}
              startIcon={<Calculate />}
              sx={{ mb: 2 }}
            >
              Calcular {tipoCalculo === 'canaletas' ? 'Canaletas' : 'Galerías'}
            </Button>

            {calculo && calculo.total > 0 && (
              <Paper sx={{ p: 2, bgcolor: '#f8f9fa', border: '2px solid #2563eb' }}>
                <Typography variant="h6" sx={{ color: '#2563eb', mb: 2 }}>
                  🎯 Resultado del Cálculo
                </Typography>
                
                <Box display="flex" gap={4} flexWrap="wrap" sx={{ mb: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Total calculado:
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1a1a1a' }}>
                      {calculo.total.toFixed(2)} m.l.
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Productos analizados:
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#28a745' }}>
                      {calculo.productos.length}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Tipo de cálculo:
                    </Typography>
                    <Chip 
                      label={tipoCalculo === 'canaletas' ? 'Suma de Altos' : 'Suma de Anchos'}
                      color="primary"
                      size="small"
                    />
                  </Box>
                </Box>

                {/* Detalle por producto */}
                <TableContainer component={Paper} sx={{ mt: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#e3f2fd' }}>
                        <TableCell><strong>Producto</strong></TableCell>
                        <TableCell><strong>Ubicación</strong></TableCell>
                        <TableCell><strong>Medida</strong></TableCell>
                        <TableCell><strong>Cantidad</strong></TableCell>
                        <TableCell><strong>Total</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {calculo.productos.map((prod, index) => (
                        <TableRow key={index}>
                          <TableCell>{prod.nombre}</TableCell>
                          <TableCell>{prod.ubicacion}</TableCell>
                          <TableCell>
                            {tipoCalculo === 'canaletas' 
                              ? `${prod.alto}m (alto)`
                              : `${prod.ancho}m (ancho)`
                            }
                          </TableCell>
                          <TableCell>{prod.cantidad}</TableCell>
                          <TableCell>
                            <strong>
                              {tipoCalculo === 'canaletas' 
                                ? `${prod.altoTotal.toFixed(2)}m`
                                : `${prod.anchoTotal.toFixed(2)}m`
                              }
                            </strong>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Mostrar productos excluidos si los hay */}
                {calculo.productosExcluidos && calculo.productosExcluidos.length > 0 && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      📋 Productos Excluidos del Cálculo:
                    </Typography>
                    {calculo.productosExcluidos.map((prod, index) => (
                      <Typography key={index} variant="body2" sx={{ ml: 1 }}>
                        • <strong>{prod.nombre}</strong> - {prod.razon}
                      </Typography>
                    ))}
                    <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#6c757d' }}>
                      💡 Solo se incluyen persianas, cortinas y productos base para el cálculo de {tipoCalculo}.
                    </Typography>
                  </Alert>
                )}
              </Paper>
            )}
          </Box>
        ) : (
          <Alert severity="info" sx={{ mb: 3 }}>
            No hay productos en la cotización para calcular. Agrega primero las persianas o productos base.
          </Alert>
        )}

        {/* Selección de producto y precio */}
        {calculo && calculo.total > 0 && (
          <Box>
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="h6" gutterBottom>
              🛍️ Agregar Material Extra Calculado
            </Typography>

            <Box display="flex" gap={2} sx={{ mb: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Producto</InputLabel>
                <Select
                  value={productoSeleccionado}
                  onChange={(e) => {
                    setProductoSeleccionado(e.target.value);
                    const producto = productosActuales.find(p => p.id === e.target.value);
                    if (producto) {
                      setPrecioUnitario(producto.precioBase.toString());
                    }
                  }}
                  label="Producto"
                >
                  {productosActuales.map(producto => (
                    <MenuItem key={producto.id} value={producto.id}>
                      {producto.nombre} - {producto.unidad}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Precio por m.l."
                type="number"
                value={precioUnitario}
                onChange={(e) => setPrecioUnitario(e.target.value)}
                InputProps={{
                  startAdornment: '$'
                }}
                sx={{ minWidth: 150 }}
              />
            </Box>

            {productoSeleccionado && precioUnitario && (
              <Paper sx={{ p: 2, bgcolor: '#e8f5e8', border: '2px solid #4caf50' }}>
                <Typography variant="h6" sx={{ color: '#2e7d32', mb: 1 }}>
                  💰 Resumen del Producto
                </Typography>
                
                <Box>
                  <Typography variant="body2">
                    <strong>Producto:</strong> {productosActuales.find(p => p.id === productoSeleccionado)?.nombre}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Cantidad:</strong> {calculo.total.toFixed(2)} metros lineales
                  </Typography>
                  <Typography variant="body2">
                    <strong>Precio unitario:</strong> ${parseFloat(precioUnitario || 0).toLocaleString()}/m.l.
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#2e7d32', mt: 1 }}>
                    <strong>Total:</strong> ${(calculo.total * parseFloat(precioUnitario || 0)).toLocaleString()}
                  </Typography>
                </Box>
              </Paper>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Cancelar
        </Button>
        <Button 
          variant="contained" 
          onClick={handleAgregar}
          disabled={!resultado || !productoSeleccionado || !precioUnitario}
          startIcon={<AddIcon />}
          sx={{
            bgcolor: '#2563eb',
            '&:hover': { bgcolor: '#1d4ed8' }
          }}
        >
          Agregar Material
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CalcularYAgregar;

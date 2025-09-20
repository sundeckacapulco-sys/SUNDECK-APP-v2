import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Grid,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Search,
  FilterList,
  Close,
  CheckCircle,
  Info,
  Star,
  LocalShipping,
  Build,
  Security,
  WhatsApp,
  Email,
  Phone
} from '@mui/icons-material';
import axiosConfig from '../../config/axios';

const CatalogoPublico = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [filtros, setFiltros] = useState({
    categoria: '',
    busqueda: '',
    precioMin: '',
    precioMax: ''
  });

  useEffect(() => {
    fetchProductos();
  }, [filtros]);

  const fetchProductos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        activo: 'true',
        disponible: 'true',
        limit: '50'
      });
      
      if (filtros.categoria) params.append('categoria', filtros.categoria);
      if (filtros.busqueda) params.append('search', filtros.busqueda);

      const response = await axiosConfig.get(`/productos?${params.toString()}`);
      let productosData = response.data.docs || [];

      // Filtrar por precio si se especifica
      if (filtros.precioMin || filtros.precioMax) {
        productosData = productosData.filter(producto => {
          const precio = producto.precioBase;
          const min = parseFloat(filtros.precioMin) || 0;
          const max = parseFloat(filtros.precioMax) || Infinity;
          return precio >= min && precio <= max;
        });
      }

      setProductos(productosData);
    } catch (error) {
      console.error('Error cargando productos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (producto) => {
    setSelectedProduct(producto);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedProduct(null);
  };

  const handleContacto = (tipo, producto) => {
    const mensaje = `Hola, estoy interesado en el producto: ${producto.nombre} (${producto.codigo})`;
    
    switch (tipo) {
      case 'whatsapp':
        window.open(`https://wa.me/526621234567?text=${encodeURIComponent(mensaje)}`, '_blank');
        break;
      case 'email':
        window.open(`mailto:contacto@sundeck.com?subject=Consulta sobre ${producto.nombre}&body=${encodeURIComponent(mensaje)}`, '_blank');
        break;
      case 'phone':
        window.open('tel:+526621234567', '_blank');
        break;
    }
  };

  const getCategoriaColor = (categoria) => {
    const colores = {
      motor: 'error',
      control: 'warning',
      kit: 'info',
      galeria: 'success',
      canaleta: 'secondary',
      herraje: 'default',
      ventana: 'primary',
      puerta: 'primary',
      cancel: 'primary',
      domo: 'info',
      accesorio: 'secondary',
      repuesto: 'default'
    };
    return colores[categoria] || 'default';
  };

  const getUnidadLabel = (unidad) => {
    const unidades = {
      'm2': 'm²',
      'ml': 'm.l.',
      'pieza': 'pieza',
      'par': 'par',
      'juego': 'juego',
      'kit': 'kit'
    };
    return unidades[unidad] || unidad;
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ color: '#2563eb', fontWeight: 'bold' }}>
          🏠 SUNDECK - Catálogo de Productos
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Soluciones en Cortinas y Persianas
        </Typography>
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <FilterList sx={{ mr: 1 }} />
            Filtros de Búsqueda
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Buscar productos"
                value={filtros.busqueda}
                onChange={(e) => setFiltros({...filtros, busqueda: e.target.value})}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                placeholder="Persiana, motor, kit..."
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Categoría</InputLabel>
                <Select
                  value={filtros.categoria}
                  onChange={(e) => setFiltros({...filtros, categoria: e.target.value})}
                  label="Categoría"
                >
                  <MenuItem value="">Todas las categorías</MenuItem>
                  <MenuItem value="ventana">🪟 Ventanas/Persianas</MenuItem>
                  <MenuItem value="motor">⚙️ Motores</MenuItem>
                  <MenuItem value="control">🎮 Controles</MenuItem>
                  <MenuItem value="kit">📦 Kits Completos</MenuItem>
                  <MenuItem value="galeria">📏 Galerías</MenuItem>
                  <MenuItem value="canaleta">🔲 Canaletas</MenuItem>
                  <MenuItem value="herraje">🔧 Herrajes</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Precio mínimo"
                type="number"
                value={filtros.precioMin}
                onChange={(e) => setFiltros({...filtros, precioMin: e.target.value})}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Precio máximo"
                type="number"
                value={filtros.precioMax}
                onChange={(e) => setFiltros({...filtros, precioMax: e.target.value})}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Grid de Productos */}
      <Grid container spacing={3}>
        {productos.map((producto) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={producto._id}>
            <Card 
              sx={{ 
                height: '100%',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
              onClick={() => handleProductClick(producto)}
            >
              {/* Imagen del producto */}
              <CardMedia
                component="div"
                sx={{
                  height: 200,
                  bgcolor: '#f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundImage: producto.imagenes && producto.imagenes.length > 0 
                    ? `url(${producto.imagenes[0]})` 
                    : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {(!producto.imagenes || producto.imagenes.length === 0) && (
                  <Typography variant="h4" color="text.secondary">
                    📦
                  </Typography>
                )}
              </CardMedia>

              <CardContent>
                {/* Categoría y código */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Chip 
                    label={producto.categoria} 
                    color={getCategoriaColor(producto.categoria)}
                    size="small"
                  />
                  <Typography variant="caption" color="text.secondary">
                    {producto.codigo}
                  </Typography>
                </Box>

                {/* Nombre */}
                <Typography variant="h6" component="h3" gutterBottom sx={{ 
                  fontWeight: 'bold',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {producto.nombre}
                </Typography>

                {/* Descripción */}
                <Typography variant="body2" color="text.secondary" sx={{ 
                  mb: 2,
                  height: '40px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical'
                }}>
                  {producto.descripcion || 'Producto de alta calidad'}
                </Typography>

                {/* Precio */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h5" color="primary" fontWeight="bold">
                    ${producto.precioBase?.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    por {getUnidadLabel(producto.unidadMedida)}
                  </Typography>
                </Box>

                {/* Colores disponibles */}
                {producto.coloresDisponibles && producto.coloresDisponibles.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Colores: {producto.coloresDisponibles.slice(0, 3).join(', ')}
                      {producto.coloresDisponibles.length > 3 && '...'}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Mensaje si no hay productos */}
      {productos.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No se encontraron productos con los filtros seleccionados
          </Typography>
        </Box>
      )}

      {/* Modal de Detalle del Producto */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedProduct && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h5" component="h2">
                  {selectedProduct.nombre}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  Código: {selectedProduct.codigo}
                </Typography>
              </Box>
              <IconButton onClick={handleCloseDialog}>
                <Close />
              </IconButton>
            </DialogTitle>

            <DialogContent dividers>
              <Grid container spacing={3}>
                {/* Imagen principal */}
                <Grid item xs={12} md={6}>
                  <Box
                    sx={{
                      width: '100%',
                      height: 300,
                      bgcolor: '#f0f0f0',
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundImage: selectedProduct.imagenes && selectedProduct.imagenes.length > 0 
                        ? `url(${selectedProduct.imagenes[0]})` 
                        : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    {(!selectedProduct.imagenes || selectedProduct.imagenes.length === 0) && (
                      <Typography variant="h1" color="text.secondary">
                        📦
                      </Typography>
                    )}
                  </Box>
                </Grid>

                {/* Información del producto */}
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h4" color="primary" fontWeight="bold">
                      ${selectedProduct.precioBase?.toLocaleString()}
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                      por {getUnidadLabel(selectedProduct.unidadMedida)}
                    </Typography>
                  </Box>

                  <Chip 
                    label={selectedProduct.categoria} 
                    color={getCategoriaColor(selectedProduct.categoria)}
                    sx={{ mb: 2 }}
                  />

                  <Typography variant="body1" paragraph>
                    {selectedProduct.descripcion || 'Producto de alta calidad para sus proyectos.'}
                  </Typography>

                  {/* Especificaciones */}
                  {selectedProduct.especificaciones && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        📋 Especificaciones
                      </Typography>
                      <Typography variant="body2" paragraph>
                        {selectedProduct.especificaciones}
                      </Typography>
                    </Box>
                  )}

                  {/* Detalles técnicos */}
                  <List dense>
                    <ListItem>
                      <ListItemIcon><Build /></ListItemIcon>
                      <ListItemText 
                        primary="Material" 
                        secondary={selectedProduct.material || 'No especificado'} 
                      />
                    </ListItem>
                    
                    {selectedProduct.garantia && (
                      <ListItem>
                        <ListItemIcon><Security /></ListItemIcon>
                        <ListItemText 
                          primary="Garantía" 
                          secondary={selectedProduct.garantia} 
                        />
                      </ListItem>
                    )}
                    
                    {selectedProduct.peso && (
                      <ListItem>
                        <ListItemIcon><LocalShipping /></ListItemIcon>
                        <ListItemText 
                          primary="Peso" 
                          secondary={selectedProduct.peso} 
                        />
                      </ListItem>
                    )}
                    
                    {selectedProduct.dimensiones && (
                      <ListItem>
                        <ListItemIcon><Info /></ListItemIcon>
                        <ListItemText 
                          primary="Dimensiones" 
                          secondary={selectedProduct.dimensiones} 
                        />
                      </ListItem>
                    )}
                  </List>

                  {/* Colores disponibles */}
                  {selectedProduct.coloresDisponibles && selectedProduct.coloresDisponibles.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Colores disponibles:
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {selectedProduct.coloresDisponibles.map((color, index) => (
                          <Chip key={index} label={color} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </DialogContent>

            <DialogActions sx={{ p: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
                ¿Interesado en este producto? ¡Contáctanos!
              </Typography>
              <Button
                variant="contained"
                color="success"
                startIcon={<WhatsApp />}
                onClick={() => handleContacto('whatsapp', selectedProduct)}
                sx={{ mr: 1 }}
              >
                WhatsApp
              </Button>
              <Button
                variant="outlined"
                startIcon={<Email />}
                onClick={() => handleContacto('email', selectedProduct)}
                sx={{ mr: 1 }}
              >
                Email
              </Button>
              <Button
                variant="outlined"
                startIcon={<Phone />}
                onClick={() => handleContacto('phone', selectedProduct)}
              >
                Llamar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default CatalogoPublico;

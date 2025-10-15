/**
 * Componente de demostración de la arquitectura unificada de cotizaciones
 * 
 * Este componente muestra cómo usar el nuevo sistema unificado para
 * manejar los 4 flujos de cotización de manera consistente.
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Alert,
  Divider,
  TextField,
  MenuItem,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Engineering,
  RequestQuote,
  Description,
  Speed,
  CheckCircle,
  Error,
  Info,
  Add,
  Calculate,
  Save,
  Refresh
} from '@mui/icons-material';

import {
  useCotizacionUnificada,
  useLevantamientoTecnico,
  useCotizacionEnVivo,
  useCotizacionTradicional,
  useCotizacionDirecta
} from '../../hooks/useCotizacionUnificada';

const TIPOS_DEMO = {
  LEVANTAMIENTO: 'levantamiento',
  COTIZACION_VIVO: 'cotizacion_vivo',
  TRADICIONAL: 'tradicional',
  DIRECTA: 'directa'
};

const CONFIGURACIONES_DEMO = {
  [TIPOS_DEMO.LEVANTAMIENTO]: {
    titulo: 'Levantamiento Técnico',
    descripcion: 'Captura técnica detallada sin precios',
    icono: <Engineering />,
    color: 'primary',
    hook: useLevantamientoTecnico
  },
  [TIPOS_DEMO.COTIZACION_VIVO]: {
    titulo: 'Cotización en Vivo',
    descripcion: 'Cotización durante la visita con precios',
    icono: <Speed />,
    color: 'success',
    hook: useCotizacionEnVivo
  },
  [TIPOS_DEMO.TRADICIONAL]: {
    titulo: 'Cotización Tradicional',
    descripcion: 'Cotización formal para prospectos',
    icono: <Description />,
    color: 'info',
    hook: useCotizacionTradicional
  },
  [TIPOS_DEMO.DIRECTA]: {
    titulo: 'Cotización Directa',
    descripcion: 'Cotización express con wizard',
    icono: <RequestQuote />,
    color: 'warning',
    hook: useCotizacionDirecta
  }
};

const ProductoDemo = ({ producto, onUpdate, onRemove, puedeEditarPrecios }) => {
  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="Producto"
              value={producto.nombre}
              onChange={(e) => onUpdate({ nombre: e.target.value })}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField
              fullWidth
              label="Ubicación"
              value={producto.ubicacion}
              onChange={(e) => onUpdate({ ubicacion: e.target.value })}
              size="small"
            />
          </Grid>
          <Grid item xs={6} sm={1}>
            <TextField
              fullWidth
              label="Ancho (m)"
              type="number"
              value={producto.medidas?.ancho || ''}
              onChange={(e) => onUpdate({
                medidas: {
                  ...producto.medidas,
                  ancho: Number(e.target.value),
                  area: Number(e.target.value) * (producto.medidas?.alto || 0)
                }
              })}
              size="small"
            />
          </Grid>
          <Grid item xs={6} sm={1}>
            <TextField
              fullWidth
              label="Alto (m)"
              type="number"
              value={producto.medidas?.alto || ''}
              onChange={(e) => onUpdate({
                medidas: {
                  ...producto.medidas,
                  alto: Number(e.target.value),
                  area: (producto.medidas?.ancho || 0) * Number(e.target.value)
                }
              })}
              size="small"
            />
          </Grid>
          <Grid item xs={6} sm={1}>
            <TextField
              fullWidth
              label="Área (m²)"
              value={producto.medidas?.area?.toFixed(2) || '0.00'}
              disabled
              size="small"
            />
          </Grid>
          {puedeEditarPrecios && (
            <Grid item xs={6} sm={2}>
              <TextField
                fullWidth
                label="Precio/m²"
                type="number"
                value={producto.precios?.unitario || ''}
                onChange={(e) => onUpdate({
                  precios: {
                    ...producto.precios,
                    unitario: Number(e.target.value),
                    subtotal: (producto.medidas?.area || 0) * Number(e.target.value)
                  }
                })}
                size="small"
              />
            </Grid>
          )}
          <Grid item xs={12} sm={2}>
            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={onRemove}
              >
                Eliminar
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

const CotizacionUnificadaDemo = () => {
  const [tipoSeleccionado, setTipoSeleccionado] = useState(TIPOS_DEMO.LEVANTAMIENTO);
  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  
  // Hook dinámico según el tipo seleccionado
  const hookConfig = CONFIGURACIONES_DEMO[tipoSeleccionado];
  const cotizacion = hookConfig.hook();

  const handleAgregarProducto = () => {
    const nuevoProducto = {
      nombre: 'Persiana Screen 3%',
      ubicacion: 'Sala',
      medidas: {
        ancho: 2.5,
        alto: 3.0,
        area: 7.5,
        cantidad: 1
      },
      precios: {
        unitario: 750,
        subtotal: 5625
      },
      tecnico: {
        color: 'Blanco',
        observaciones: ''
      },
      extras: {
        motorizado: false,
        esToldo: false
      }
    };
    
    cotizacion.addProducto(nuevoProducto);
  };

  const handleUpdateProducto = (id, updates) => {
    cotizacion.updateProducto(id, updates);
  };

  const handleRemoveProducto = (id) => {
    cotizacion.removeProducto(id);
  };

  const handleGenerarPayload = () => {
    try {
      const payload = cotizacion.generarPayload();
      console.log('Payload generado:', payload);
      alert('Payload generado correctamente. Ver consola para detalles.');
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleImportarEjemplo = () => {
    const piezasEjemplo = [
      {
        ubicacion: 'Recámara Principal',
        producto: 'screen_3',
        productoLabel: 'Persianas Screen 3%',
        cantidad: 2,
        medidas: [
          { ancho: 2.5, alto: 3.0, area: 7.5, color: 'Blanco' },
          { ancho: 2.0, alto: 2.8, area: 5.6, color: 'Blanco' }
        ],
        precioM2: 750,
        color: 'Blanco',
        motorizado: true,
        motorModelo: 'somfy_35nm',
        motorPrecio: 4500,
        controlModelo: 'multicanal',
        controlPrecio: 1200
      },
      {
        ubicacion: 'Sala-Comedor',
        producto: 'toldo_vertical',
        productoLabel: 'Toldo Vertical',
        cantidad: 1,
        medidas: [
          { ancho: 4.0, alto: 3.5, area: 14.0, color: 'Beige' }
        ],
        precioM2: 850,
        color: 'Beige',
        esToldo: true,
        tipoToldo: 'caida_vertical',
        kitModelo: 'contempo',
        kitPrecio: 3500
      }
    ];

    cotizacion.importarDesdelevantamiento(piezasEjemplo, 'prospecto_demo_123');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Demo: Arquitectura Unificada de Cotizaciones
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Esta demostración muestra cómo la nueva arquitectura unificada maneja los 4 flujos 
        de cotización de manera consistente, eliminando las inconsistencias identificadas 
        en el análisis de flujos.
      </Typography>

      {/* Selector de Tipo de Flujo */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            1. Seleccionar Tipo de Flujo
          </Typography>
          
          <Grid container spacing={2}>
            {Object.entries(CONFIGURACIONES_DEMO).map(([tipo, config]) => (
              <Grid item xs={12} sm={6} md={3} key={tipo}>
                <Card
                  variant={tipoSeleccionado === tipo ? "elevation" : "outlined"}
                  sx={{
                    cursor: 'pointer',
                    border: tipoSeleccionado === tipo ? 2 : 1,
                    borderColor: tipoSeleccionado === tipo ? `${config.color}.main` : 'divider'
                  }}
                  onClick={() => setTipoSeleccionado(tipo)}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Box sx={{ color: `${config.color}.main`, mb: 1 }}>
                      {config.icono}
                    </Box>
                    <Typography variant="subtitle2" gutterBottom>
                      {config.titulo}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {config.descripcion}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Configuración del Flujo Actual */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            2. Configuración del Flujo: {hookConfig.titulo}
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    {cotizacion.puedeEditarPrecios ? <CheckCircle color="success" /> : <Error color="error" />}
                  </ListItemIcon>
                  <ListItemText primary="Mostrar Precios" secondary={cotizacion.puedeEditarPrecios ? 'Habilitado' : 'Deshabilitado'} />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    {cotizacion.puedeCapturarTecnico ? <CheckCircle color="success" /> : <Error color="error" />}
                  </ListItemIcon>
                  <ListItemText primary="Captura Técnica" secondary={cotizacion.puedeCapturarTecnico ? 'Habilitada' : 'Deshabilitada'} />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    {cotizacion.requiereProspecto ? <Info color="info" /> : <CheckCircle color="success" />}
                  </ListItemIcon>
                  <ListItemText primary="Requiere Prospecto" secondary={cotizacion.requiereProspecto ? 'Sí' : 'No'} />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    {cotizacion.puedeGenerarDocumentos ? <CheckCircle color="success" /> : <Error color="error" />}
                  </ListItemIcon>
                  <ListItemText primary="Generar Documentos" secondary={cotizacion.puedeGenerarDocumentos ? 'Disponible' : 'No disponible'} />
                </ListItem>
              </List>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Estado de Validación:
              </Typography>
              
              {cotizacion.validacion.valido ? (
                <Alert severity="success" sx={{ mb: 2 }}>
                  ✅ Cotización válida y lista para procesar
                </Alert>
              ) : (
                <Alert severity="error" sx={{ mb: 2 }}>
                  ❌ Errores de validación:
                  <ul>
                    {cotizacion.validacion.errores.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </Alert>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Cliente (solo para cotización directa) */}
      {tipoSeleccionado === TIPOS_DEMO.DIRECTA && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              3. Datos del Cliente
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nombre del Cliente"
                  value={cotizacion.cliente.nombre}
                  onChange={(e) => cotizacion.updateCliente({ nombre: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Teléfono"
                  value={cotizacion.cliente.telefono}
                  onChange={(e) => cotizacion.updateCliente({ telefono: e.target.value })}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Productos */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              4. Productos ({cotizacion.productos.length})
            </Typography>
            
            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={handleAgregarProducto}
                disabled={!cotizacion.puedeAgregarProductos}
              >
                Agregar Producto
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<Info />}
                onClick={handleImportarEjemplo}
              >
                Importar Ejemplo
              </Button>
            </Box>
          </Box>

          {cotizacion.productos.length === 0 ? (
            <Alert severity="info">
              No hay productos agregados. Haz clic en "Agregar Producto" o "Importar Ejemplo".
            </Alert>
          ) : (
            cotizacion.productos.map((producto) => (
              <ProductoDemo
                key={producto.id}
                producto={producto}
                onUpdate={(updates) => handleUpdateProducto(producto.id, updates)}
                onRemove={() => handleRemoveProducto(producto.id)}
                puedeEditarPrecios={cotizacion.puedeEditarPrecios}
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* Totales */}
      {cotizacion.productos.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              5. Totales Calculados
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {cotizacion.totales.totalPiezas}
                  </Typography>
                  <Typography variant="caption">
                    Piezas Totales
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {cotizacion.totales.totalArea.toFixed(2)}
                  </Typography>
                  <Typography variant="caption">
                    m² Totales
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">
                    ${cotizacion.totales.subtotalProductos.toLocaleString()}
                  </Typography>
                  <Typography variant="caption">
                    Subtotal Productos
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">
                    ${cotizacion.totales.total.toLocaleString()}
                  </Typography>
                  <Typography variant="caption">
                    Total Final
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Acciones */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            6. Acciones
          </Typography>
          
          <Box display="flex" gap={2} flexWrap="wrap">
            <Button
              variant="contained"
              startIcon={<Calculate />}
              onClick={handleGenerarPayload}
              disabled={!cotizacion.validacion.valido}
            >
              Generar Payload
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<Save />}
              disabled={!cotizacion.puedeGenerarDocumentos}
            >
              Guardar Cotización
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={cotizacion.reset}
            >
              Resetear Todo
            </Button>
            
            <FormControlLabel
              control={
                <Switch
                  checked={mostrarDetalles}
                  onChange={(e) => setMostrarDetalles(e.target.checked)}
                />
              }
              label="Mostrar Detalles Técnicos"
            />
          </Box>

          {mostrarDetalles && (
            <Box mt={3}>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                Estado Completo del Store:
              </Typography>
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                  {JSON.stringify(cotizacion.getSnapshot(), null, 2)}
                </pre>
              </Paper>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default CotizacionUnificadaDemo;

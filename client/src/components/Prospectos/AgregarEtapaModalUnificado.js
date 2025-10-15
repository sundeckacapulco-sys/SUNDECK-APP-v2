/**
 * AgregarEtapaModal - Versión Migrada a Arquitectura Unificada
 * 
 * Este componente ha sido migrado para usar la nueva arquitectura unificada
 * que elimina las inconsistencias identificadas en el análisis de flujos.
 * 
 * Cambios principales:
 * - Reemplaza useState fragmentado con hooks unificados
 * - Elimina cálculos duplicados usando servicios centralizados
 * - Simplifica validaciones con sistema automático
 * - Unifica payloads para backend
 */

import React, { useState, useEffect } from 'react';
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
  Card,
  CardContent,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Chip,
  Switch,
  FormControlLabel,
  Divider,
  Paper
} from '@mui/material';
import {
  Add,
  CloudUpload,
  Delete,
  Close,
  ContentCopy,
  CheckCircle,
  Warning,
  Info,
  Error,
  BugReport,
  Search,
  Calculate,
  Save,
  Refresh
} from '@mui/icons-material';

// Hooks unificados
import {
  useLevantamientoTecnico,
  useCotizacionEnVivo,
  TIPOS_FLUJO
} from '../../hooks/useCotizacionUnificada';

// Componentes auxiliares (mantener los existentes)
import TextFieldConDictado from '../Common/TextFieldConDictado';
import CapturaModal from '../Common/CapturaModal';
import InspectorElementos from '../Common/InspectorElementos';

// Configuraciones (mantener las existentes)
import {
  etapaOptions,
  productosOptions,
  modelosToldos,
  modelosMotores,
  modelosControles
} from './AgregarEtapaModal.constants';

// Utilidades
import axiosConfig from '../../config/axios';

const AgregarEtapaModalUnificado = ({ 
  open, 
  onClose, 
  prospectoId, 
  onSaved, 
  onError,
  tipoVisitaInicial = 'levantamiento' // 'levantamiento' o 'cotizacion'
}) => {
  
  // ============================================================================
  // HOOKS UNIFICADOS - Reemplaza todo el estado fragmentado anterior
  // ============================================================================
  
  // Hook dinámico según el tipo de visita
  const cotizacion = tipoVisitaInicial === 'levantamiento' 
    ? useLevantamientoTecnico(prospectoId)
    : useCotizacionEnVivo(prospectoId);

  // Destructuring del estado unificado
  const {
    productos,
    totales,
    validacion,
    configuracionFlujo,
    addProducto,
    updateProducto,
    removeProducto,
    updateInstalacionEspecial,
    updateDescuentos,
    updateFacturacion,
    updateTiempos,
    generarPayload,
    reset: resetCotizacion,
    puedeEditarPrecios,
    puedeCapturarTecnico,
    puedeGenerarDocumentos
  } = cotizacion;

  // ============================================================================
  // ESTADO LOCAL SIMPLIFICADO - Solo para UI, no para lógica de negocio
  // ============================================================================
  
  const [nombreEtapa, setNombreEtapa] = useState(etapaOptions[0]);
  const [comentarios, setComentarios] = useState('');
  const [fechaEtapa, setFechaEtapa] = useState('');
  const [horaEtapa, setHoraEtapa] = useState('');
  
  // Estados de carga
  const [guardando, setGuardando] = useState(false);
  const [generandoCotizacion, setGenerandoCotizacion] = useState(false);
  const [descargandoPDF, setDescargandoPDF] = useState(false);
  const [guardandoPedido, setGuardandoPedido] = useState(false);
  
  // Estados para UI
  const [errorLocal, setErrorLocal] = useState('');
  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  const [capturaModalOpen, setCapturaModalOpen] = useState(false);
  const [inspectorModalOpen, setInspectorModalOpen] = useState(false);
  
  // Estados para formulario de producto
  const [mostrandoFormulario, setMostrandoFormulario] = useState(false);
  const [productoForm, setProductoForm] = useState({
    nombre: '',
    ubicacion: '',
    medidas: { ancho: '', alto: '', cantidad: 1 },
    precios: { unitario: 750 },
    tecnico: {
      color: '',
      observaciones: '',
      // Campos técnicos del levantamiento
      tipoControl: '',
      orientacion: '',
      instalacion: '',
      eliminacion: '',
      risoAlto: '',
      risoBajo: '',
      sistema: '',
      telaMarca: '',
      baseTabla: ''
    },
    extras: {
      motorizado: false,
      esToldo: false,
      motorModelo: '',
      motorPrecio: '',
      controlModelo: '',
      controlPrecio: '',
      tipoToldo: '',
      kitModelo: '',
      kitPrecio: ''
    }
  });

  // ============================================================================
  // EFECTOS Y INICIALIZACIÓN
  // ============================================================================

  // Establecer fecha y hora actual
  const establecerFechaHoraActual = () => {
    const ahora = new Date();
    const fecha = ahora.toISOString().split('T')[0];
    const hora = ahora.toTimeString().slice(0, 5);
    setFechaEtapa(fecha);
    setHoraEtapa(hora);
  };

  // Inicialización cuando se abre el modal
  useEffect(() => {
    if (open) {
      establecerFechaHoraActual();
      setErrorLocal('');
    }
  }, [open]);

  // Reset completo cuando se cierra
  useEffect(() => {
    if (!open) {
      resetFormulario();
    }
  }, [open]);

  const resetFormulario = () => {
    setNombreEtapa(etapaOptions[0]);
    setComentarios('');
    setFechaEtapa('');
    setHoraEtapa('');
    setErrorLocal('');
    setMostrandoFormulario(false);
    resetProductoForm();
    resetCotizacion(); // Reset del store unificado
  };

  const resetProductoForm = () => {
    setProductoForm({
      nombre: '',
      ubicacion: '',
      medidas: { ancho: '', alto: '', cantidad: 1 },
      precios: { unitario: 750 },
      tecnico: {
        color: '',
        observaciones: '',
        tipoControl: '',
        orientacion: '',
        instalacion: '',
        eliminacion: '',
        risoAlto: '',
        risoBajo: '',
        sistema: '',
        telaMarca: '',
        baseTabla: ''
      },
      extras: {
        motorizado: false,
        esToldo: false,
        motorModelo: '',
        motorPrecio: '',
        controlModelo: '',
        controlPrecio: '',
        tipoToldo: '',
        kitModelo: '',
        kitPrecio: ''
      }
    });
  };

  // ============================================================================
  // MANEJADORES DE PRODUCTOS - Simplificados con la nueva arquitectura
  // ============================================================================

  const handleAgregarProducto = () => {
    try {
      // Validar formulario
      if (!productoForm.nombre || !productoForm.ubicacion) {
        setErrorLocal('Nombre y ubicación son requeridos');
        return;
      }

      if (!productoForm.medidas.ancho || !productoForm.medidas.alto) {
        setErrorLocal('Las medidas son requeridas');
        return;
      }

      // Calcular área
      const area = Number(productoForm.medidas.ancho) * Number(productoForm.medidas.alto);
      
      // Crear producto usando la estructura unificada
      const nuevoProducto = {
        nombre: productoForm.nombre,
        ubicacion: productoForm.ubicacion,
        medidas: {
          ancho: Number(productoForm.medidas.ancho),
          alto: Number(productoForm.medidas.alto),
          area: area,
          cantidad: Number(productoForm.medidas.cantidad) || 1
        },
        precios: puedeEditarPrecios ? {
          unitario: Number(productoForm.precios.unitario) || 0,
          subtotal: area * (Number(productoForm.precios.unitario) || 0)
        } : { unitario: 0, subtotal: 0 },
        tecnico: {
          ...productoForm.tecnico
        },
        extras: {
          ...productoForm.extras,
          motorizado: Boolean(productoForm.extras.motorizado),
          esToldo: Boolean(productoForm.extras.esToldo)
        }
      };

      // Agregar al store unificado
      addProducto(nuevoProducto);
      
      // Reset formulario
      resetProductoForm();
      setMostrandoFormulario(false);
      setErrorLocal('');
      
    } catch (error) {
      setErrorLocal(`Error al agregar producto: ${error.message}`);
    }
  };

  const handleEditarProducto = (id, updates) => {
    updateProducto(id, updates);
  };

  const handleEliminarProducto = (id) => {
    removeProducto(id);
  };

  // ============================================================================
  // MANEJADORES DE CONFIGURACIÓN COMERCIAL
  // ============================================================================

  const handleInstalacionChange = (campo, valor) => {
    updateInstalacionEspecial({ [campo]: valor });
  };

  const handleDescuentoChange = (campo, valor) => {
    updateDescuentos({ [campo]: valor });
  };

  const handleFacturacionChange = (campo, valor) => {
    updateFacturacion({ [campo]: valor });
  };

  // ============================================================================
  // MANEJADORES DE ACCIONES PRINCIPALES
  // ============================================================================

  const handleGuardarEtapa = async () => {
    if (!validacion.valido) {
      setErrorLocal(`Errores de validación: ${validacion.errores.join(', ')}`);
      return;
    }

    setGuardando(true);
    try {
      const payload = generarPayload({
        nombreEtapa,
        comentarios,
        fechaEtapa,
        horaEtapa
      });

      const response = await axiosConfig.post('/etapas', payload);
      
      if (onSaved) {
        onSaved(response.data);
      }
      
      onClose();
      
    } catch (error) {
      const mensaje = error.response?.data?.message || 'Error al guardar etapa';
      setErrorLocal(mensaje);
      if (onError) {
        onError(mensaje);
      }
    } finally {
      setGuardando(false);
    }
  };

  const handleGenerarCotizacion = async () => {
    if (!validacion.valido) {
      setErrorLocal(`Errores de validación: ${validacion.errores.join(', ')}`);
      return;
    }

    setGenerandoCotizacion(true);
    try {
      const payload = generarPayload({
        comentarios,
        fechaEtapa,
        horaEtapa
      });

      const response = await axiosConfig.post('/cotizaciones/desde-visita', payload);
      
      if (onSaved) {
        onSaved(response.data);
      }
      
      onClose();
      
    } catch (error) {
      const mensaje = error.response?.data?.message || 'Error al generar cotización';
      setErrorLocal(mensaje);
      if (onError) {
        onError(mensaje);
      }
    } finally {
      setGenerandoCotizacion(false);
    }
  };

  const handleGenerarPDF = async () => {
    if (!validacion.valido) {
      setErrorLocal(`Errores de validación: ${validacion.errores.join(', ')}`);
      return;
    }

    setDescargandoPDF(true);
    try {
      const payload = generarPayload({
        comentarios,
        fechaEtapa,
        horaEtapa
      });

      const response = await axiosConfig.post('/etapas/pdf', payload, {
        responseType: 'blob'
      });

      // Descargar archivo
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `levantamiento_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
    } catch (error) {
      const mensaje = 'Error al generar PDF';
      setErrorLocal(mensaje);
    } finally {
      setDescargandoPDF(false);
    }
  };

  // ============================================================================
  // RENDERIZADO DE COMPONENTES
  // ============================================================================

  const renderResumenTotales = () => (
    <Card sx={{ mb: 2, bgcolor: 'primary.50' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          📊 Resumen {configuracionFlujo?.titulo || 'Etapa'}
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: 1, textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {productos.length}
              </Typography>
              <Typography variant="caption">
                Productos
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: 1, textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {totales.totalPiezas}
              </Typography>
              <Typography variant="caption">
                Piezas
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: 1, textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {totales.totalArea.toFixed(2)}
              </Typography>
              <Typography variant="caption">
                m² Totales
              </Typography>
            </Paper>
          </Grid>
          
          {puedeEditarPrecios && (
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 1, textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  ${totales.total.toLocaleString()}
                </Typography>
                <Typography variant="caption">
                  Total
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );

  const renderValidacion = () => {
    if (validacion.valido) {
      return (
        <Alert severity="success" sx={{ mb: 2 }}>
          ✅ {configuracionFlujo?.titulo || 'Etapa'} válida y lista para procesar
        </Alert>
      );
    }

    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        ❌ Errores de validación:
        <ul>
          {validacion.errores.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
      </Alert>
    );
  };

  const renderFormularioProducto = () => {
    if (!mostrandoFormulario) {
      return (
        <Box display="flex" justifyContent="center" mb={2}>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => setMostrandoFormulario(true)}
          >
            Agregar Producto
          </Button>
        </Box>
      );
    }

    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Nuevo Producto
          </Typography>
          
          <Grid container spacing={2}>
            {/* Información básica */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nombre del Producto"
                value={productoForm.nombre}
                onChange={(e) => setProductoForm(prev => ({
                  ...prev,
                  nombre: e.target.value
                }))}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Ubicación"
                value={productoForm.ubicacion}
                onChange={(e) => setProductoForm(prev => ({
                  ...prev,
                  ubicacion: e.target.value
                }))}
              />
            </Grid>

            {/* Medidas */}
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Ancho (m)"
                type="number"
                value={productoForm.medidas.ancho}
                onChange={(e) => setProductoForm(prev => ({
                  ...prev,
                  medidas: { ...prev.medidas, ancho: e.target.value }
                }))}
              />
            </Grid>
            
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Alto (m)"
                type="number"
                value={productoForm.medidas.alto}
                onChange={(e) => setProductoForm(prev => ({
                  ...prev,
                  medidas: { ...prev.medidas, alto: e.target.value }
                }))}
              />
            </Grid>
            
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Área (m²)"
                value={productoForm.medidas.ancho && productoForm.medidas.alto 
                  ? (Number(productoForm.medidas.ancho) * Number(productoForm.medidas.alto)).toFixed(2)
                  : '0.00'
                }
                disabled
              />
            </Grid>

            {/* Precio (solo si puede editar precios) */}
            {puedeEditarPrecios && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Precio por m²"
                  type="number"
                  value={productoForm.precios.unitario}
                  onChange={(e) => setProductoForm(prev => ({
                    ...prev,
                    precios: { ...prev.precios, unitario: e.target.value }
                  }))}
                />
              </Grid>
            )}

            {/* Campos técnicos (solo si puede capturar técnico) */}
            {puedeCapturarTecnico && (
              <>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }}>
                    <Chip label="Información Técnica" />
                  </Divider>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Color"
                    value={productoForm.tecnico.color}
                    onChange={(e) => setProductoForm(prev => ({
                      ...prev,
                      tecnico: { ...prev.tecnico, color: e.target.value }
                    }))}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Tipo de Control</InputLabel>
                    <Select
                      value={productoForm.tecnico.tipoControl}
                      onChange={(e) => setProductoForm(prev => ({
                        ...prev,
                        tecnico: { ...prev.tecnico, tipoControl: e.target.value }
                      }))}
                    >
                      <MenuItem value="manual">Manual</MenuItem>
                      <MenuItem value="motorizado">Motorizado</MenuItem>
                      <MenuItem value="micro">Micro</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Observaciones"
                    multiline
                    rows={2}
                    value={productoForm.tecnico.observaciones}
                    onChange={(e) => setProductoForm(prev => ({
                      ...prev,
                      tecnico: { ...prev.tecnico, observaciones: e.target.value }
                    }))}
                  />
                </Grid>
              </>
            )}

            {/* Acciones */}
            <Grid item xs={12}>
              <Box display="flex" gap={2} justifyContent="flex-end">
                <Button
                  onClick={() => {
                    setMostrandoFormulario(false);
                    resetProductoForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="contained"
                  onClick={handleAgregarProducto}
                >
                  Agregar
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const renderListaProductos = () => {
    if (productos.length === 0) {
      return (
        <Alert severity="info" sx={{ mb: 2 }}>
          No hay productos agregados. Haz clic en "Agregar Producto" para comenzar.
        </Alert>
      );
    }

    return (
      <Box mb={2}>
        <Typography variant="h6" gutterBottom>
          Productos Agregados ({productos.length})
        </Typography>
        
        {productos.map((producto, index) => (
          <Card key={producto.id || index} variant="outlined" sx={{ mb: 1 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={3}>
                  <Typography variant="subtitle2">
                    {producto.nombre}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {producto.ubicacion}
                  </Typography>
                </Grid>
                
                <Grid item xs={6} sm={2}>
                  <Typography variant="body2">
                    {producto.medidas?.ancho}×{producto.medidas?.alto}m
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {producto.medidas?.area?.toFixed(2)} m²
                  </Typography>
                </Grid>
                
                {puedeEditarPrecios && (
                  <Grid item xs={6} sm={2}>
                    <Typography variant="body2">
                      ${producto.precios?.unitario}/m²
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ${producto.precios?.subtotal?.toLocaleString()}
                    </Typography>
                  </Grid>
                )}
                
                <Grid item xs={12} sm={puedeEditarPrecios ? 3 : 5}>
                  <Typography variant="caption" color="text.secondary">
                    {producto.tecnico?.color && `Color: ${producto.tecnico.color}`}
                    {producto.tecnico?.observaciones && ` • ${producto.tecnico.observaciones}`}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={2}>
                  <Box display="flex" gap={1}>
                    <IconButton
                      size="small"
                      onClick={() => handleEliminarProducto(producto.id)}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  };

  // ============================================================================
  // RENDERIZADO PRINCIPAL
  // ============================================================================

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="lg" 
        fullWidth
        disableEscapeKeyDown
        onBackdropClick={(e) => e.stopPropagation()}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {configuracionFlujo?.titulo || 'Agregar Etapa'}
            </Typography>
            
            <Box display="flex" gap={1}>
              <IconButton onClick={() => setCapturaModalOpen(true)}>
                <BugReport />
              </IconButton>
              <IconButton onClick={onClose}>
                <Close />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent>
          {/* Error local */}
          {errorLocal && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorLocal('')}>
              {errorLocal}
            </Alert>
          )}

          {/* Configuración básica */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Etapa</InputLabel>
                <Select
                  value={nombreEtapa}
                  onChange={(e) => setNombreEtapa(e.target.value)}
                >
                  {etapaOptions.map((etapa) => (
                    <MenuItem key={etapa} value={etapa}>
                      {etapa}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Comentarios"
                value={comentarios}
                onChange={(e) => setComentarios(e.target.value)}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>

          {/* Resumen de totales */}
          {renderResumenTotales()}

          {/* Validación */}
          {renderValidacion()}

          {/* Formulario de producto */}
          {renderFormularioProducto()}

          {/* Lista de productos */}
          {renderListaProductos()}

          {/* Detalles técnicos (opcional) */}
          <FormControlLabel
            control={
              <Switch
                checked={mostrarDetalles}
                onChange={(e) => setMostrarDetalles(e.target.checked)}
              />
            }
            label="Mostrar Detalles Técnicos"
          />

          {mostrarDetalles && (
            <Box mt={2}>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                Estado Completo del Store:
              </Typography>
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <pre style={{ fontSize: '12px', overflow: 'auto', maxHeight: '300px' }}>
                  {JSON.stringify({
                    productos,
                    totales,
                    validacion,
                    configuracionFlujo
                  }, null, 2)}
                </pre>
              </Paper>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={guardando || generandoCotizacion}>
            Cancelar
          </Button>
          
          {puedeGenerarDocumentos && (
            <Button
              onClick={handleGenerarPDF}
              disabled={!validacion.valido || descargandoPDF}
              startIcon={descargandoPDF ? <Info /> : <CloudUpload />}
            >
              {descargandoPDF ? 'Generando...' : 'PDF'}
            </Button>
          )}
          
          {tipoVisitaInicial === 'levantamiento' ? (
            <Button
              variant="contained"
              onClick={handleGuardarEtapa}
              disabled={!validacion.valido || guardando}
              startIcon={guardando ? <Info /> : <Save />}
            >
              {guardando ? 'Guardando...' : 'Guardar Levantamiento'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleGenerarCotizacion}
              disabled={!validacion.valido || generandoCotizacion}
              startIcon={generandoCotizacion ? <Info /> : <Calculate />}
            >
              {generandoCotizacion ? 'Generando...' : 'Generar Cotización'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Modales auxiliares */}
      <CapturaModal
        open={capturaModalOpen}
        onClose={() => setCapturaModalOpen(false)}
      />
      
      <InspectorElementos
        open={inspectorModalOpen}
        onClose={() => setInspectorModalOpen(false)}
      />
    </>
  );
};

export default AgregarEtapaModalUnificado;

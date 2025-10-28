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
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Add,
  Delete,
  Close,
  Edit,
  Save,
  ContentCopy,
  ExpandMore as ExpandMoreIcon,
  Straighten as StraightenIcon,
  Photo as PhotoIcon
} from '@mui/icons-material';
import usePiezasManager from '../../../components/Prospectos/hooks/usePiezasManager';
import { productosOptions, createEmptyPieza } from '../../../components/Prospectos/AgregarEtapaModal.constants';
import axiosConfig from '../../../config/axios';

const AgregarMedidaPartidasModal = ({ open, onClose, proyecto, onActualizar, medidaEditando }) => {
  const [personaVisita, setPersonaVisita] = useState('');
  const [fechaCotizacion, setFechaCotizacion] = useState('');
  const [quienRecibe, setQuienRecibe] = useState('');
  const [observacionesGenerales, setObservacionesGenerales] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [errorLocal, setErrorLocal] = useState('');

  // Usar el mismo manager de piezas que el AgregarEtapaModal
  const piezasManager = usePiezasManager({
    unidad: 'm',
    todosLosProductos: productosOptions,
    precioGeneral: 0, // No hay precios en levantamiento
    setErrorLocal
  });

  useEffect(() => {
    if (open) {
      // No establecer fecha por defecto, es opcional
      
      // Si estamos editando, cargar los datos
      if (medidaEditando) {
        // Cargar datos de la medida editando
        if (medidaEditando.personaVisita) setPersonaVisita(medidaEditando.personaVisita);
        if (medidaEditando.fechaCotizacion) setFechaCotizacion(medidaEditando.fechaCotizacion);
        if (medidaEditando.quienRecibe) setQuienRecibe(medidaEditando.quienRecibe);
        if (medidaEditando.observaciones) setObservacionesGenerales(medidaEditando.observaciones);
        
        // Cargar partidas si existen
        if (medidaEditando.piezas && medidaEditando.piezas.length > 0) {
          piezasManager.reemplazarPiezas(medidaEditando.piezas);
        }
      } else {
        // Limpiar formulario cuando se abre nuevo
        resetFormulario();
      }
    }
  }, [open, medidaEditando]); // Removido piezasManager de las dependencias

  const resetFormulario = () => {
    setPersonaVisita('');
    setFechaCotizacion('');
    setQuienRecibe('');
    setObservacionesGenerales('');
    piezasManager.resetPiezas();
    setErrorLocal('');
  };

  const calcularAreaPieza = (pieza) => {
    if (!pieza.medidas || pieza.medidas.length === 0) return 0;
    
    return pieza.medidas.reduce((total, medida) => {
      const ancho = parseFloat(medida.ancho) || 0;
      const alto = parseFloat(medida.alto) || 0;
      return total + (ancho * alto);
    }, 0);
  };

  const handleGuardar = async () => {
    try {
      setGuardando(true);
      setErrorLocal('');

      // Validaciones básicas
      if (piezasManager.piezas.length === 0) {
        setErrorLocal('Debes agregar al menos una partida');
        return;
      }

      // Validar que todas las piezas tengan datos completos
      for (let i = 0; i < piezasManager.piezas.length; i++) {
        const pieza = piezasManager.piezas[i];
        if (!pieza.ubicacion) {
          setErrorLocal(`La partida ${i + 1} no tiene ubicación`);
          return;
        }
        
        // Validar medidas individuales
        for (let j = 0; j < (pieza.medidas || []).length; j++) {
          const medida = pieza.medidas[j];
          if (!medida.ancho || !medida.alto) {
            setErrorLocal(`La partida ${i + 1}, pieza ${j + 1} no tiene medidas completas`);
            return;
          }
        }
      }

      // Preparar payload
      const payload = {
        proyectoId: proyecto._id,
        tipo: 'levantamiento',
        personaVisita,
        fechaCotizacion,
        quienRecibe,
        observacionesGenerales,
        piezas: piezasManager.piezas.map(pieza => ({
          ...pieza,
          // Calcular totales por partida
          areaTotal: calcularAreaPieza(pieza),
          totalPiezas: pieza.cantidad || 1
        })),
        // Calcular totales generales
        totales: {
          totalPartidas: piezasManager.piezas.length,
          totalPiezas: piezasManager.piezas.reduce((total, pieza) => total + (pieza.cantidad || 1), 0),
          areaTotal: piezasManager.piezas.reduce((total, pieza) => total + calcularAreaPieza(pieza), 0)
        },
        fechaHora: new Date().toISOString()
      };

      console.log('🔍 Guardando levantamiento con partidas:', payload);
      console.log('📦 Piezas del manager:', piezasManager.piezas);
      console.log('📊 Detalle de primera pieza:', piezasManager.piezas[0]);
      console.log('📏 Detalle de primera medida de primera pieza:', piezasManager.piezas[0]?.medidas?.[0]);

      // Obtener el proyecto actual
      const proyectoActual = await axiosConfig.get(`/proyectos/${proyecto._id}`);
      const medidasActuales = proyectoActual.data.medidas || [];
      console.log('📋 Medidas actuales del proyecto:', medidasActuales);

      let nuevasMedidas;
      if (medidaEditando && medidaEditando._id) {
        // Actualizar medida existente
        nuevasMedidas = medidasActuales.map(m => 
          m._id === medidaEditando._id ? { ...m, ...payload } : m
        );
      } else {
        // Agregar nueva medida
        nuevasMedidas = [...medidasActuales, payload];
      }

      // Actualizar el proyecto completo con las nuevas medidas
      console.log('💾 Enviando al servidor:', { medidas: nuevasMedidas });
      const respuesta = await axiosConfig.put(`/proyectos/${proyecto._id}`, {
        medidas: nuevasMedidas
      });
      console.log('✅ Respuesta del servidor:', respuesta.data);

      onActualizar();
      onClose();
      resetFormulario();

    } catch (error) {
      console.error('Error guardando medida:', error);
      setErrorLocal(error.response?.data?.message || 'Error al guardar la medida');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            📏 {medidaEditando ? 'Editar Levantamiento' : 'Agregar Levantamiento'} - Partidas
          </Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pb: 2 }}>
        {errorLocal && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorLocal('')}>
            {errorLocal}
          </Alert>
        )}

        {/* Información del proyecto */}
        <Card sx={{ mb: 3, bgcolor: '#f8f9fa' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1 }}>
              🏗️ Proyecto: {proyecto.numero}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Cliente: {proyecto.cliente?.nombre} | Estado: {proyecto.estado}
            </Typography>
          </CardContent>
        </Card>

        {/* Información técnica general */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              🔧 Información Técnica General
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Persona que realizó visita"
                  value={personaVisita}
                  onChange={(e) => {
                    console.log('🔍 DEBUG - Cambiando personaVisita:', e.target.value);
                    setPersonaVisita(e.target.value);
                  }}
                  placeholder="Nombre del asesor/técnico"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Fecha de cotización (opcional)"
                  value={fechaCotizacion}
                  onChange={(e) => setFechaCotizacion(e.target.value)}
                  helperText="Solo si el cliente solicita una cotización adicional"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Quien recibe"
                  value={quienRecibe}
                  onChange={(e) => setQuienRecibe(e.target.value)}
                  placeholder="Nombre de quien recibió la visita"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Partidas agregadas */}
        {piezasManager.piezas.length > 0 && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                📋 Partidas Agregadas ({piezasManager.piezas.length})
              </Typography>
              
              {piezasManager.piezas.map((pieza, index) => (
                <Accordion key={index} sx={{ mb: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mr: 2 }}>
                        📍 {pieza.ubicacion}
                      </Typography>
                      <Chip
                        label={pieza.productoLabel || 'Producto'}
                        size="small"
                        sx={{ mr: 2 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {pieza.cantidad || 1} piezas • {calcularAreaPieza(pieza).toFixed(2)} m²
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      {/* Información básica */}
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" gutterBottom>
                          📐 Especificaciones
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Typography variant="body2">
                            <strong>Cantidad:</strong> {pieza.cantidad || 1} piezas
                          </Typography>
                          <Typography variant="body2">
                            <strong>Área total:</strong> {calcularAreaPieza(pieza).toFixed(2)} m²
                          </Typography>
                          <Typography variant="body2">
                            <strong>Color:</strong> {pieza.color || 'No especificado'}
                          </Typography>
                        </Box>
                      </Grid>

                      {/* Medidas individuales */}
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" gutterBottom>
                          📏 Medidas Individuales
                        </Typography>
                        {(pieza.medidas || []).map((medida, idx) => (
                          <Box key={idx} sx={{ mb: 1, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                            <Typography variant="body2">
                              <strong>Pieza {idx + 1}:</strong> {medida.ancho} × {medida.alto} m
                            </Typography>
                            <Typography variant="body2">
                              <strong>Producto:</strong> {medida.productoLabel || medida.producto}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Color:</strong> {medida.color}
                            </Typography>
                          </Box>
                        ))}
                      </Grid>

                      {/* Especificaciones Técnicas Completas */}
                      {pieza.medidas && pieza.medidas[0] && (
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: '#2196f3' }}>
                            🔧 Especificaciones Técnicas
                          </Typography>
                          <Grid container spacing={2}>
                            {/* Modelo/Código */}
                            {pieza.modeloCodigo && (
                              <Grid item xs={6} md={4}>
                                <Typography variant="body2">
                                  <strong>Modelo/Código:</strong> {pieza.modeloCodigo}
                                </Typography>
                              </Grid>
                            )}
                            
                            {/* Galería/Cabezal */}
                            {pieza.medidas[0].galeria && (
                              <Grid item xs={6} md={4}>
                                <Typography variant="body2">
                                  <strong>Galería/Cabezal:</strong> {
                                    pieza.medidas[0].galeria === 'galeria' ? 'Galería' :
                                    pieza.medidas[0].galeria === 'cassette' ? 'Cassette' :
                                    pieza.medidas[0].galeria === 'cabezal' ? 'Cabezal' :
                                    pieza.medidas[0].galeria === 'sin_galeria' ? 'Sin Galería' :
                                    pieza.medidas[0].galeria
                                  }
                                </Typography>
                              </Grid>
                            )}
                            
                            {/* Tipo de Control */}
                            {pieza.medidas[0].tipoControl && (
                              <Grid item xs={6} md={4}>
                                <Typography variant="body2">
                                  <strong>Tipo de Control:</strong> {pieza.medidas[0].tipoControl}
                                </Typography>
                              </Grid>
                            )}
                            
                            {/* Caída */}
                            {pieza.medidas[0].caida && (
                              <Grid item xs={6} md={4}>
                                <Typography variant="body2">
                                  <strong>Caída:</strong> {
                                    pieza.medidas[0].caida === 'normal' ? 'Caída Normal' :
                                    pieza.medidas[0].caida === 'frente' ? 'Caída hacia el Frente' :
                                    pieza.medidas[0].caida
                                  }
                                </Typography>
                              </Grid>
                            )}
                            
                            {/* Tipo de Instalación */}
                            {pieza.medidas[0].tipoInstalacion && (
                              <Grid item xs={6} md={4}>
                                <Typography variant="body2">
                                  <strong>Tipo de Instalación:</strong> {pieza.medidas[0].tipoInstalacion}
                                </Typography>
                              </Grid>
                            )}
                            
                            {/* Tipo de Fijación */}
                            {pieza.medidas[0].tipoFijacion && (
                              <Grid item xs={6} md={4}>
                                <Typography variant="body2">
                                  <strong>Tipo de Fijación:</strong> {pieza.medidas[0].tipoFijacion}
                                </Typography>
                              </Grid>
                            )}
                            
                            {/* Modo de Operación */}
                            {pieza.medidas[0].modoOperacion && (
                              <Grid item xs={6} md={4}>
                                <Typography variant="body2">
                                  <strong>Modo de Operación:</strong> {
                                    pieza.medidas[0].modoOperacion === 'manual' ? 'Manual' :
                                    pieza.medidas[0].modoOperacion === 'motorizado' ? 'Motorizado' :
                                    pieza.medidas[0].modoOperacion
                                  }
                                </Typography>
                              </Grid>
                            )}
                            
                            {/* Detalle Técnico */}
                            {pieza.medidas[0].detalleTecnico && (
                              <Grid item xs={6} md={4}>
                                <Typography variant="body2">
                                  <strong>Detalle Técnico:</strong> {
                                    pieza.medidas[0].detalleTecnico === 'traslape' ? 'Traslape' :
                                    pieza.medidas[0].detalleTecnico === 'corte' ? 'Corte' :
                                    pieza.medidas[0].detalleTecnico === 'sin_traslape' ? 'Sin traslape' :
                                    pieza.medidas[0].detalleTecnico
                                  }
                                </Typography>
                              </Grid>
                            )}
                            
                            {/* Sistema */}
                            {pieza.medidas[0].sistema && (
                              <Grid item xs={6} md={4}>
                                <Typography variant="body2">
                                  <strong>Sistema:</strong> {pieza.medidas[0].sistema}
                                </Typography>
                              </Grid>
                            )}
                            
                            {/* Tela/Marca */}
                            {pieza.medidas[0].telaMarca && (
                              <Grid item xs={6} md={4}>
                                <Typography variant="body2">
                                  <strong>Tela/Marca:</strong> {pieza.medidas[0].telaMarca}
                                </Typography>
                              </Grid>
                            )}
                            
                            {/* Base Tabla */}
                            {pieza.medidas[0].baseTabla && (
                              <Grid item xs={6} md={4}>
                                <Typography variant="body2">
                                  <strong>Base Tabla:</strong> {pieza.medidas[0].baseTabla}
                                </Typography>
                              </Grid>
                            )}
                            
                            {/* Observaciones Técnicas */}
                            {pieza.medidas[0].observacionesTecnicas && (
                              <Grid item xs={12}>
                                <Typography variant="body2">
                                  <strong>Observaciones Técnicas:</strong> {pieza.medidas[0].observacionesTecnicas}
                                </Typography>
                              </Grid>
                            )}
                          </Grid>
                        </Grid>
                      )}

                      {/* Observaciones */}
                      {pieza.observaciones && (
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" gutterBottom>
                            💬 Observaciones
                          </Typography>
                          <Typography variant="body2">
                            {pieza.observaciones}
                          </Typography>
                        </Grid>
                      )}

                      {/* Botones de acción */}
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            variant="contained"
                            startIcon={piezasManager.editandoPieza ? <Save /> : <Add />}
                            onClick={() => {
                              console.log('🔍 DEBUG - Intentando agregar partida');
                              console.log('🔍 DEBUG - piezaForm completo:', piezasManager.piezaForm);
                              console.log('🔍 DEBUG - ubicacion:', piezasManager.piezaForm.ubicacion);
                              console.log('🔍 DEBUG - cantidad:', piezasManager.piezaForm.cantidad);
                              console.log('🔍 DEBUG - medidas:', piezasManager.piezaForm.medidas);
                              piezasManager.handleAgregarPieza();
                            }}
                            sx={{ bgcolor: '#16A34A', '&:hover': { bgcolor: '#15803D' } }}
                          >
                            {piezasManager.editandoPieza ? 'Actualizar' : 'Agregar'} Partida
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            startIcon={<Delete />}
                            onClick={() => piezasManager.handleEliminarPieza(index)}
                          >
                            Eliminar
                          </Button>
                        </Box>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Formulario para agregar partida */}
        {piezasManager.agregandoPieza && (
          <Card sx={{ mb: 3, border: '2px solid #2196f3' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: '#2196f3' }}>
                  {piezasManager.editandoPieza ? '✏️ Editando Partida' : '➕ Nueva Partida'}
                </Typography>
                {piezasManager.piezaForm.cantidad > 1 && (
                  <Chip 
                    label={`📦 ${piezasManager.piezaForm.cantidad} piezas en esta partida`}
                    color="success"
                    size="small"
                  />
                )}
              </Box>
              
              <Grid container spacing={2}>
                {/* Ubicación y Cantidad */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Ubicación *"
                    value={piezasManager.piezaForm.ubicacion}
                    onChange={(e) => piezasManager.setPiezaForm(prev => ({ ...prev, ubicacion: e.target.value }))}
                    placeholder="Ej: Sala-Comedor, Recámara Principal"
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Cantidad de piezas *"
                    value={piezasManager.piezaForm.cantidad}
                    onChange={(e) => piezasManager.actualizarMedidas(e.target.value)}
                    inputProps={{ min: 1, max: 20 }}
                    helperText="Número de piezas en esta partida"
                    required
                  />
                </Grid>

                {/* Producto */}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Producto *</InputLabel>
                    <Select
                      value={piezasManager.piezaForm.producto}
                      label="Producto *"
                      onChange={(e) => {
                        const selectedOption = productosOptions.find(opt => opt.value === e.target.value);
                        const nuevoProducto = e.target.value;
                        const nuevoProductoLabel = selectedOption?.label || e.target.value;
                        
                        piezasManager.setPiezaForm(prev => {
                          // Propagar el producto a TODAS las medidas individuales
                          const nuevasMedidas = (prev.medidas || []).map(medida => ({
                            ...medida,
                            producto: nuevoProducto,
                            productoLabel: nuevoProductoLabel
                          }));
                          
                          return { 
                            ...prev, 
                            producto: nuevoProducto,
                            productoLabel: nuevoProductoLabel,
                            medidas: nuevasMedidas
                          };
                        });
                      }}
                    >
                      {productosOptions.filter(p => p.value !== 'nuevo').map((producto) => (
                        <MenuItem key={producto.value} value={producto.value}>
                          {producto.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Modelo/Código del Producto */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Modelo / Código"
                    value={piezasManager.piezaForm.modeloCodigo || ''}
                    onChange={(e) => {
                      const nuevoModelo = e.target.value;
                      piezasManager.setPiezaForm(prev => {
                        const nuevasMedidas = (prev.medidas || []).map(medida => ({
                          ...medida,
                          modeloCodigo: nuevoModelo
                        }));
                        return { 
                          ...prev, 
                          modeloCodigo: nuevoModelo,
                          medidas: nuevasMedidas
                        };
                      });
                    }}
                    placeholder="Ej. SH-3000, BL-500"
                    helperText="Modelo o código específico del producto"
                  />
                </Grid>

                {/* Color */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Color / Acabado"
                    value={piezasManager.piezaForm.color}
                    onChange={(e) => {
                      const nuevoColor = e.target.value;
                      piezasManager.setPiezaForm(prev => {
                        const nuevasMedidas = (prev.medidas || []).map(medida => ({
                          ...medida,
                          color: nuevoColor
                        }));
                        return { 
                          ...prev, 
                          color: nuevoColor,
                          medidas: nuevasMedidas
                        };
                      });
                    }}
                    placeholder="Ej. Blanco, Negro, Gris"
                  />
                </Grid>

                {/* Medidas individuales */}
                {piezasManager.piezaForm.medidas && piezasManager.piezaForm.medidas.length > 0 && (
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }}>
                      <Chip label="📏 Medidas y Especificaciones Técnicas" />
                    </Divider>
                    {piezasManager.piezaForm.medidas.map((medida, index) => (
                      <Box key={index} sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1, border: '1px solid #ddd' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#2196f3' }}>
                            📐 Pieza {index + 1} de {piezasManager.piezaForm.cantidad}
                          </Typography>
                          {index > 0 && (
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<ContentCopy />}
                              onClick={() => {
                                const nuevasMedidas = [...(piezasManager.piezaForm.medidas || [])];
                                const medidaAnterior = nuevasMedidas[index - 1];
                                const medidaActual = nuevasMedidas[index];
                                
                                // IMPORTANTE: Preservar ancho y alto de la medida actual
                                const anchoActual = medidaActual.ancho;
                                const altoActual = medidaActual.alto;
                                
                                // Copiar todos los campos técnicos EXCEPTO ancho y alto
                                nuevasMedidas[index] = {
                                  ...nuevasMedidas[index],
                                  producto: medidaAnterior.producto,
                                  productoLabel: medidaAnterior.productoLabel,
                                  modeloCodigo: medidaAnterior.modeloCodigo,
                                  color: medidaAnterior.color,
                                  galeria: medidaAnterior.galeria,
                                  tipoControl: medidaAnterior.tipoControl,
                                  caida: medidaAnterior.caida,
                                  tipoInstalacion: medidaAnterior.tipoInstalacion,
                                  tipoFijacion: medidaAnterior.tipoFijacion,
                                  modoOperacion: medidaAnterior.modoOperacion,
                                  detalleTecnico: medidaAnterior.detalleTecnico,
                                  sistema: medidaAnterior.sistema,
                                  telaMarca: medidaAnterior.telaMarca,
                                  baseTabla: medidaAnterior.baseTabla,
                                  // Restaurar las medidas originales
                                  ancho: anchoActual,
                                  alto: altoActual
                                };
                                piezasManager.setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
                              }}
                              sx={{ fontSize: '0.75rem' }}
                            >
                              📋 Copiar de pieza {index}
                            </Button>
                          )}
                        </Box>
                        <Grid container spacing={2}>
                          {/* Medidas básicas */}
                          <Grid item xs={12} sm={6}>
                            <TextField
                              label={`Ancho pieza ${index + 1} (m) *`}
                              type="number"
                              fullWidth
                              value={medida.ancho}
                              onChange={(e) => {
                                const nuevasMedidas = [...(piezasManager.piezaForm.medidas || [])];
                                nuevasMedidas[index] = { ...nuevasMedidas[index], ancho: e.target.value };
                                piezasManager.setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
                              }}
                              inputProps={{ step: 0.01 }}
                              placeholder="Ej. 2.50"
                              required
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              label={`Alto pieza ${index + 1} (m) *`}
                              type="number"
                              fullWidth
                              value={medida.alto}
                              onChange={(e) => {
                                const nuevasMedidas = [...(piezasManager.piezaForm.medidas || [])];
                                nuevasMedidas[index] = { ...nuevasMedidas[index], alto: e.target.value };
                                piezasManager.setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
                              }}
                              inputProps={{ step: 0.01 }}
                              placeholder="Ej. 3.00"
                              required
                            />
                          </Grid>

                          {/* Galería/Cabezal */}
                          <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                              <InputLabel>Galería/Cabezal</InputLabel>
                              <Select
                                value={medida.galeria || ''}
                                label="Galería/Cabezal"
                                onChange={(e) => {
                                  const nuevasMedidas = [...(piezasManager.piezaForm.medidas || [])];
                                  nuevasMedidas[index] = { ...nuevasMedidas[index], galeria: e.target.value };
                                  piezasManager.setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
                                }}
                              >
                                <MenuItem value="">Seleccionar</MenuItem>
                                <MenuItem value="galeria">Galería</MenuItem>
                                <MenuItem value="cassette">Cassette</MenuItem>
                                <MenuItem value="cabezal">Cabezal</MenuItem>
                                <MenuItem value="sin_galeria">Sin Galería</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>

                          {/* Campos técnicos */}
                          <Grid item xs={12}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#666', display: 'block', mb: 1, mt: 1 }}>
                              🔧 Especificaciones Técnicas
                            </Typography>
                          </Grid>

                          {/* Tipo de Control */}
                          <Grid item xs={12} sm={6} md={4}>
                            <FormControl fullWidth>
                              <InputLabel>Tipo de Control</InputLabel>
                              <Select
                                value={medida.tipoControl || ''}
                                label="Tipo de Control"
                                onChange={(e) => {
                                  const nuevasMedidas = [...(piezasManager.piezaForm.medidas || [])];
                                  nuevasMedidas[index] = { ...nuevasMedidas[index], tipoControl: e.target.value };
                                  piezasManager.setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
                                }}
                              >
                                <MenuItem value="">Seleccionar</MenuItem>
                                <MenuItem value="izquierda">Izquierda</MenuItem>
                                <MenuItem value="derecha">Derecha</MenuItem>
                                <MenuItem value="centro">Centro</MenuItem>
                                <MenuItem value="motorizado">Motorizado</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>

                          {/* Caída */}
                          <Grid item xs={12} sm={6} md={4}>
                            <FormControl fullWidth>
                              <InputLabel>Caída</InputLabel>
                              <Select
                                value={medida.caida || ''}
                                label="Caída"
                                onChange={(e) => {
                                  const nuevasMedidas = [...(piezasManager.piezaForm.medidas || [])];
                                  nuevasMedidas[index] = { ...nuevasMedidas[index], caida: e.target.value };
                                  piezasManager.setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
                                }}
                              >
                                <MenuItem value="">Seleccionar</MenuItem>
                                <MenuItem value="normal">Caída Normal</MenuItem>
                                <MenuItem value="frente">Caída hacia el Frente</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>

                          {/* Tipo de Instalación */}
                          <Grid item xs={12} sm={6} md={4}>
                            <FormControl fullWidth>
                              <InputLabel>Tipo de Instalación</InputLabel>
                              <Select
                                value={medida.tipoInstalacion || ''}
                                label="Tipo de Instalación"
                                onChange={(e) => {
                                  const nuevasMedidas = [...(piezasManager.piezaForm.medidas || [])];
                                  nuevasMedidas[index] = { ...nuevasMedidas[index], tipoInstalacion: e.target.value };
                                  piezasManager.setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
                                }}
                              >
                                <MenuItem value="">Seleccionar</MenuItem>
                                <MenuItem value="techo">Techo</MenuItem>
                                <MenuItem value="muro">Muro</MenuItem>
                                <MenuItem value="piso_techo">Piso a Techo</MenuItem>
                                <MenuItem value="empotrado">Empotrado</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>

                          {/* Tipo de Fijación */}
                          <Grid item xs={12} sm={6} md={4}>
                            <FormControl fullWidth>
                              <InputLabel>Tipo de Fijación</InputLabel>
                              <Select
                                value={medida.tipoFijacion || ''}
                                label="Tipo de Fijación"
                                onChange={(e) => {
                                  const nuevasMedidas = [...(piezasManager.piezaForm.medidas || [])];
                                  nuevasMedidas[index] = { ...nuevasMedidas[index], tipoFijacion: e.target.value };
                                  piezasManager.setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
                                }}
                              >
                                <MenuItem value="">Seleccionar</MenuItem>
                                <MenuItem value="concreto">Concreto</MenuItem>
                                <MenuItem value="tablaroca">Tablaroca</MenuItem>
                                <MenuItem value="aluminio">Aluminio</MenuItem>
                                <MenuItem value="madera">Madera</MenuItem>
                                <MenuItem value="otro">Otro</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>

                          {/* Modo de operación */}
                          <Grid item xs={12} sm={6} md={4}>
                            <FormControl fullWidth>
                              <InputLabel>Modo de Operación</InputLabel>
                              <Select
                                value={medida.modoOperacion || ''}
                                label="Modo de Operación"
                                onChange={(e) => {
                                  const nuevasMedidas = [...(piezasManager.piezaForm.medidas || [])];
                                  nuevasMedidas[index] = { ...nuevasMedidas[index], modoOperacion: e.target.value };
                                  piezasManager.setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
                                }}
                              >
                                <MenuItem value="">Seleccionar</MenuItem>
                                <MenuItem value="manual">Manual</MenuItem>
                                <MenuItem value="motorizado">Motorizado</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>

                          {/* Detalle Técnico (Traslape) */}
                          <Grid item xs={12} sm={6} md={4}>
                            <FormControl fullWidth>
                              <InputLabel>Detalle Técnico</InputLabel>
                              <Select
                                value={medida.detalleTecnico || ''}
                                label="Detalle Técnico"
                                onChange={(e) => {
                                  const nuevasMedidas = [...(piezasManager.piezaForm.medidas || [])];
                                  nuevasMedidas[index] = { ...nuevasMedidas[index], detalleTecnico: e.target.value };
                                  piezasManager.setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
                                }}
                              >
                                <MenuItem value="">No aplica</MenuItem>
                                <MenuItem value="traslape">Traslape</MenuItem>
                                <MenuItem value="corte">Corte</MenuItem>
                                <MenuItem value="sin_traslape">Sin traslape</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>

                          {/* Sistema */}
                          <Grid item xs={12} sm={6} md={4}>
                            <TextField
                              fullWidth
                              label="Sistema"
                              value={medida.sistema || ''}
                              onChange={(e) => {
                                const nuevasMedidas = [...(piezasManager.piezaForm.medidas || [])];
                                nuevasMedidas[index] = { ...nuevasMedidas[index], sistema: e.target.value };
                                piezasManager.setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
                              }}
                              placeholder="Ej. Enrollable, Sheer Elegance"
                            />
                          </Grid>

                          {/* Tela/Marca */}
                          <Grid item xs={12} sm={6} md={3}>
                            <TextField
                              fullWidth
                              label="Tela/Marca"
                              value={medida.telaMarca || ''}
                              onChange={(e) => {
                                const nuevasMedidas = [...(piezasManager.piezaForm.medidas || [])];
                                nuevasMedidas[index] = { ...nuevasMedidas[index], telaMarca: e.target.value };
                                piezasManager.setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
                              }}
                              placeholder="Marca o tipo de tela"
                            />
                          </Grid>

                          {/* Base Tabla */}
                          <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth>
                              <InputLabel>Base Tabla</InputLabel>
                              <Select
                                value={medida.baseTabla || ''}
                                label="Base Tabla"
                                onChange={(e) => {
                                  const nuevasMedidas = [...(piezasManager.piezaForm.medidas || [])];
                                  nuevasMedidas[index] = { ...nuevasMedidas[index], baseTabla: e.target.value };
                                  piezasManager.setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
                                }}
                              >
                                <MenuItem value="">No aplica</MenuItem>
                                <MenuItem value="7">7</MenuItem>
                                <MenuItem value="15">15</MenuItem>
                                <MenuItem value="18">18</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>

                          {/* Sugerencias inteligentes */}
                          {(() => {
                            const sugerencias = [];
                            const ancho = parseFloat(medida.ancho) || 0;
                            const alto = parseFloat(medida.alto) || 0;
                            
                            // Sugerencia por medidas grandes
                            if (ancho > 3 || alto > 3) {
                              sugerencias.push({
                                tipo: 'warning',
                                mensaje: '⚠️ Medida grande detectada. Considera refuerzo estructural o sistema motorizado.'
                              });
                            }
                            
                            // Sugerencia por motorización
                            if (medida.modoOperacion === 'motorizado') {
                              sugerencias.push({
                                tipo: 'info',
                                mensaje: '💡 Sistema motorizado: Verifica disponibilidad de toma de corriente cercana.'
                              });
                            }
                            
                            // Sugerencia por instalación en techo
                            if (medida.tipoInstalacion === 'techo' && medida.tipoFijacion === 'tablaroca') {
                              sugerencias.push({
                                tipo: 'warning',
                                mensaje: '⚠️ Instalación en techo con tablaroca: Requiere refuerzo adicional.'
                              });
                            }
                            
                            // Sugerencia por caída hacia el frente
                            if (medida.caida === 'frente') {
                              sugerencias.push({
                                tipo: 'info',
                                mensaje: '⬇️ Caída hacia el frente: Verificar espacio libre y mecanismo de soporte.'
                              });
                            }
                            
                            // Sugerencia por traslape
                            if (medida.detalleTecnico === 'traslape' && piezasManager.piezaForm.cantidad > 1) {
                              sugerencias.push({
                                tipo: 'info',
                                mensaje: '📏 Traslape en múltiples piezas: Verificar alineación visual.'
                              });
                            }
                            
                            return sugerencias.length > 0 ? (
                              <Grid item xs={12}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                  {sugerencias.map((sug, idx) => (
                                    <Alert 
                                      key={idx} 
                                      severity={sug.tipo} 
                                      sx={{ py: 0.5 }}
                                    >
                                      {sug.mensaje}
                                    </Alert>
                                  ))}
                                </Box>
                              </Grid>
                            ) : null;
                          })()}

                          {/* Observaciones técnicas de la pieza */}
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              multiline
                              rows={2}
                              label={`Observaciones técnicas pieza ${index + 1}`}
                              value={medida.observacionesTecnicas || ''}
                              onChange={(e) => {
                                const nuevasMedidas = [...(piezasManager.piezaForm.medidas || [])];
                                nuevasMedidas[index] = { ...nuevasMedidas[index], observacionesTecnicas: e.target.value };
                                piezasManager.setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
                              }}
                              placeholder="Interferencias, obstáculos, pendiente eléctrica, etc."
                            />
                          </Grid>
                        </Grid>
                      </Box>
                    ))}
                  </Grid>
                )}

                {/* Observaciones */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Observaciones de la partida"
                    value={piezasManager.piezaForm.observaciones}
                    onChange={(e) => piezasManager.setPiezaForm(prev => ({ ...prev, observaciones: e.target.value }))}
                    placeholder="Notas específicas de esta partida"
                  />
                </Grid>

                {/* Botones de acción */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        if (piezasManager.editandoPieza) {
                          piezasManager.handleCancelarEdicion();
                        } else {
                          piezasManager.setAgregandoPieza(false);
                        }
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={piezasManager.editandoPieza ? <Save /> : <Add />}
                      onClick={() => {
                        console.log('🔍 DEBUG - Intentando agregar partida');
                        console.log('🔍 DEBUG - piezaForm completo:', piezasManager.piezaForm);
                        console.log('🔍 DEBUG - ubicacion:', piezasManager.piezaForm.ubicacion);
                        console.log('🔍 DEBUG - cantidad:', piezasManager.piezaForm.cantidad);
                        console.log('🔍 DEBUG - medidas:', piezasManager.piezaForm.medidas);
                        piezasManager.handleAgregarPieza();
                      }}
                      sx={{ bgcolor: '#16A34A', '&:hover': { bgcolor: '#15803D' } }}
                    >
                      {piezasManager.editandoPieza ? 'Actualizar' : 'Agregar'} Partida
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Botón para agregar partida */}
        {!piezasManager.agregandoPieza && (
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                console.log('🔍 DEBUG - Abriendo formulario de partida');
                console.log('🔍 DEBUG - piezaForm actual:', piezasManager.piezaForm);
                console.log('🔍 DEBUG - medidas actuales:', piezasManager.piezaForm.medidas);
                piezasManager.setAgregandoPieza(true);
              }}
              sx={{ bgcolor: '#D4AF37', '&:hover': { bgcolor: '#B8941F' } }}
            >
              Agregar Partida
            </Button>
          </Box>
        )}

        {/* Observaciones generales */}
        <Card>
          <CardContent>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Observaciones Generales del Levantamiento"
              value={observacionesGenerales}
              onChange={(e) => setObservacionesGenerales(e.target.value)}
              placeholder="Notas generales sobre el levantamiento técnico"
            />
          </CardContent>
        </Card>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button onClick={onClose} variant="outlined">
          Cancelar
        </Button>
        <Button
          onClick={handleGuardar}
          variant="contained"
          disabled={guardando || piezasManager.piezas.length === 0}
          startIcon={<Save />}
          sx={{ bgcolor: '#D4AF37', '&:hover': { bgcolor: '#B8941F' } }}
        >
          {guardando ? 'Guardando...' : (medidaEditando ? 'Actualizar' : 'Guardar')} Levantamiento
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AgregarMedidaPartidasModal;

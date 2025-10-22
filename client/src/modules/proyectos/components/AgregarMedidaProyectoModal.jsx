import React, { useState, useEffect, useMemo } from 'react';
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
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Fab,
  Tooltip,
  LinearProgress,
  Stepper,
  Step,
  StepLabel
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
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Straighten as RulerIcon,
  Build as BuildIcon,
  Palette as PaletteIcon,
  PhotoCamera,
  Edit,
  Visibility
} from '@mui/icons-material';
import TextFieldConDictado from '../../../components/Common/TextFieldConDictado';
import CapturaModal from '../../../components/Common/CapturaModal';
import InspectorElementos from '../../../components/Common/InspectorElementos';
import {
  productosOptions,
  modelosToldos,
  modelosMotores,
  modelosControles
} from '../../../components/Prospectos/AgregarEtapaModal.constants';
import { esProductoMotorizable, esProductoToldo } from '../../../components/Prospectos/utils/piezaUtils';
import { useModalEtapasSharedLogic } from '../../../hooks/useModalEtapasSharedLogic';
import axiosConfig from '../../../config/axios';

const AgregarMedidaProyectoModal = ({ open, onClose, proyecto, onActualizar, medidaEditando = null }) => {
  // Usar el hook compartido configurado para proyectos (sin cotización ni precios)
  const modalLogic = useModalEtapasSharedLogic({
    modo: 'proyecto',
    entidadId: proyecto?._id,
    incluirCotizacion: false,
    incluirPrecios: false,
    onSaved: (mensaje) => {
      console.log('✅ Medidas guardadas:', mensaje);
      if (onActualizar) {
        // Simular actualización del proyecto con las nuevas medidas
        const nuevasMedidas = medidaEditando 
          ? proyecto.medidas?.map(m => m === medidaEditando ? modalLogic.piezas[0] : m) || []
          : [...(proyecto.medidas || []), ...modalLogic.piezas];
        
        onActualizar({
          ...proyecto,
          medidas: nuevasMedidas,
          observaciones: modalLogic.comentarios || proyecto.observaciones
        });
      }
      cerrarModal();
    },
    onError: (error) => {
      console.error('❌ Error guardando medidas:', error);
      modalLogic.setErrorLocal(error);
    }
  });

  // Estados adicionales específicos del modal
  const [mostrarCaptura, setMostrarCaptura] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [pasoActual, setPasoActual] = useState(0);

  // Cargar datos iniciales
  useEffect(() => {
    if (open) {
      if (medidaEditando) {
        // Si estamos editando una medida específica
        modalLogic.setPiezas([medidaEditando]);
        modalLogic.setMostrarFormularioPieza(true);
        modalLogic.setPiezaEditandoIndex(0);
        modalLogic.setNuevaPieza(medidaEditando);
      } else {
        // Si estamos agregando nuevas medidas
        modalLogic.limpiarFormulario();
      }
      setPasoActual(0);
    }
  }, [open, medidaEditando]);

  // Funciones específicas del modal
  const pasos = [
    'Información del Proyecto',
    'Agregar Medidas',
    'Revisar y Guardar'
  ];

  const guardarMedidas = async () => {
    const errores = modalLogic.validarFormularioCompleto();
    if (errores.length > 0) {
      modalLogic.setErrorLocal(errores.join(', '));
      return;
    }

    modalLogic.setGuardando(true);
    try {
      // Preparar datos usando el hook
      const datos = modalLogic.prepararDatosParaEnvio();
      
      // Simular guardado (aquí iría la llamada a la API)
      console.log('Guardando medidas del proyecto:', datos);
      
      // Simular delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Llamar al callback de éxito del hook
      modalLogic.config.onSaved?.('Medidas guardadas exitosamente');
      
    } catch (error) {
      console.error('Error guardando medidas:', error);
      modalLogic.setErrorLocal('Error al guardar las medidas');
    } finally {
      modalLogic.setGuardando(false);
    }
  };

  const cerrarModal = () => {
    modalLogic.limpiarFormulario();
    setPasoActual(0);
    setMostrarCaptura(false);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={cerrarModal}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            📏 {medidaEditando ? 'Editar Medida' : 'Agregar Medidas al Proyecto'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip 
              label={`${modalLogic.piezas.length} medida${modalLogic.piezas.length !== 1 ? 's' : ''}`}
              color="primary"
              size="small"
            />
            <Chip 
              label={`${modalLogic.totales.totalM2} m² total`}
              color="secondary"
              size="small"
            />
            <IconButton onClick={cerrarModal}>
              <Close />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 1 }}>
          {/* Error */}
          {modalLogic.errorLocal && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => modalLogic.setErrorLocal('')}>
              {modalLogic.errorLocal}
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

          {/* Lista de medidas agregadas */}
          {modalLogic.piezas.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  📋 Medidas Agregadas ({modalLogic.piezas.length})
                </Typography>
                
                {modalLogic.piezas.map((pieza, index) => (
                  <Accordion key={index} sx={{ mb: 1 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mr: 2 }}>
                          📍 {pieza.ubicacion}
                        </Typography>
                        <Chip
                          label={pieza.producto}
                          size="small"
                          sx={{ mr: 2 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {pieza.ancho} × {pieza.alto} m • {pieza.cantidad} piezas • {modalLogic.calcularAreaPieza(pieza)} m²
                        </Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="body2">
                            <strong>Color:</strong> {pieza.color || 'No especificado'}
                          </Typography>
                          {pieza.observaciones && (
                            <Typography variant="body2">
                              <strong>Observaciones:</strong> {pieza.observaciones}
                            </Typography>
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            startIcon={<ContentCopy />}
                            onClick={() => modalLogic.copiarPieza(index)}
                          >
                            Copiar
                          </Button>
                          <Button
                            size="small"
                            startIcon={<Search />}
                            onClick={() => modalLogic.editarPieza(index)}
                          >
                            Editar
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            startIcon={<Delete />}
                            onClick={() => modalLogic.eliminarPieza(index)}
                          >
                            Eliminar
                          </Button>
                        </Box>
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Formulario para nueva pieza */}
          {modalLogic.mostrarFormularioPieza && (
            <Card sx={{ mb: 3, border: '2px solid #2196f3' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, color: '#2196f3' }}>
                  {modalLogic.piezaEditandoIndex !== null ? '✏️ Editando Medida' : '➕ Nueva Medida'}
                </Typography>
                
                <Grid container spacing={2}>
                  {/* Información básica */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Ubicación"
                      value={modalLogic.nuevaPieza.ubicacion}
                      onChange={(e) => modalLogic.setNuevaPieza({...modalLogic.nuevaPieza, ubicacion: e.target.value})}
                      placeholder="Ej: Terraza principal, Ventana sala, etc."
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Producto</InputLabel>
                      <Select
                        value={modalLogic.nuevaPieza.producto}
                        onChange={(e) => modalLogic.setNuevaPieza({...modalLogic.nuevaPieza, producto: e.target.value})}
                      >
                        {productosOptions.map((producto) => (
                          <MenuItem key={producto.value} value={producto.value}>
                            {producto.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Ancho (m)"
                      type="number"
                      value={modalLogic.nuevaPieza.ancho}
                      onChange={(e) => modalLogic.setNuevaPieza({...modalLogic.nuevaPieza, ancho: e.target.value})}
                      inputProps={{ step: 0.01, min: 0 }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Alto (m)"
                      type="number"
                      value={modalLogic.nuevaPieza.alto}
                      onChange={(e) => modalLogic.setNuevaPieza({...modalLogic.nuevaPieza, alto: e.target.value})}
                      inputProps={{ step: 0.01, min: 0 }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Cantidad"
                      type="number"
                      value={modalLogic.nuevaPieza.cantidad}
                      onChange={(e) => modalLogic.setNuevaPieza({...modalLogic.nuevaPieza, cantidad: e.target.value})}
                      inputProps={{ min: 1 }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Área"
                      value={`${modalLogic.calcularAreaPieza(modalLogic.nuevaPieza)} m²`}
                      InputProps={{ readOnly: true }}
                      sx={{ bgcolor: '#f5f5f5' }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Color"
                      value={modalLogic.nuevaPieza.color}
                      onChange={(e) => modalLogic.setNuevaPieza({...modalLogic.nuevaPieza, color: e.target.value})}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Tela/Marca"
                      value={modalLogic.nuevaPieza.telaMarca}
                      onChange={(e) => modalLogic.setNuevaPieza({...modalLogic.nuevaPieza, telaMarca: e.target.value})}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Observaciones específicas"
                      value={modalLogic.nuevaPieza.observaciones}
                      onChange={(e) => modalLogic.setNuevaPieza({...modalLogic.nuevaPieza, observaciones: e.target.value})}
                    />
                  </Grid>
                </Grid>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
                  <Button
                    onClick={() => {
                      modalLogic.setMostrarFormularioPieza(false);
                      modalLogic.setPiezaEditandoIndex(null);
                      modalLogic.resetNuevaPieza();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="contained"
                    onClick={modalLogic.agregarPieza}
                    startIcon={modalLogic.piezaEditandoIndex !== null ? <SaveIcon /> : <Add />}
                  >
                    {modalLogic.piezaEditandoIndex !== null ? 'Actualizar' : 'Agregar'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Botón para agregar nueva medida */}
          {!modalLogic.mostrarFormularioPieza && (
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<Add />}
                onClick={() => modalLogic.setMostrarFormularioPieza(true)}
                sx={{ bgcolor: '#D4AF37', '&:hover': { bgcolor: '#B8941F' } }}
              >
                Agregar Nueva Medida
              </Button>
            </Box>
          )}

          {/* Comentarios generales */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                💬 Observaciones Generales
              </Typography>
              <TextFieldConDictado
                fullWidth
                multiline
                rows={3}
                label="Comentarios adicionales"
                value={modalLogic.comentarios}
                onChange={(e) => modalLogic.setComentarios(e.target.value)}
                placeholder="Observaciones generales del levantamiento..."
              />
            </CardContent>
          </Card>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={cerrarModal} disabled={modalLogic.guardando}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={guardarMedidas}
          disabled={modalLogic.guardando || modalLogic.piezas.length === 0}
          startIcon={modalLogic.guardando ? null : <SaveIcon />}
          sx={{ bgcolor: '#D4AF37', '&:hover': { bgcolor: '#B8941F' } }}
        >
          {modalLogic.guardando ? 'Guardando...' : `Guardar ${modalLogic.piezas.length} Medida${modalLogic.piezas.length !== 1 ? 's' : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AgregarMedidaProyectoModal;

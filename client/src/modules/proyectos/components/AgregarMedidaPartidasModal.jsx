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
  ExpandMore as ExpandMoreIcon,
  Straighten as StraightenIcon,
  Photo as PhotoIcon
} from '@mui/icons-material';
import usePiezasManager from '../../../components/Prospectos/hooks/usePiezasManager';
import { productosOptions, createEmptyPieza } from '../../../components/Prospectos/AgregarEtapaModal.constants';
import axiosConfig from '../../../config/axios';

const AgregarMedidaPartidasModal = ({ open, onClose, proyecto, onActualizar, medidaEditando }) => {
  const [personaVisita, setPersonaVisita] = useState('');
  const [fechaCompromiso, setFechaCompromiso] = useState('');
  const [codigoReferencia, setCodigoReferencia] = useState('');
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
      // Establecer fecha actual por defecto
      const hoy = new Date().toISOString().split('T')[0];
      setFechaCompromiso(hoy);
      
      // Si estamos editando, cargar los datos
      if (medidaEditando) {
        // Cargar datos de la medida editando
        if (medidaEditando.personaVisita) setPersonaVisita(medidaEditando.personaVisita);
        if (medidaEditando.fechaCompromiso) setFechaCompromiso(medidaEditando.fechaCompromiso);
        if (medidaEditando.codigoReferencia) setCodigoReferencia(medidaEditando.codigoReferencia);
        if (medidaEditando.quienRecibe) setQuienRecibe(medidaEditando.quienRecibe);
        if (medidaEditando.observaciones) setObservacionesGenerales(medidaEditando.observaciones);
        
        // Cargar partidas si existen
        if (medidaEditando.piezas && medidaEditando.piezas.length > 0) {
          piezasManager.reemplazarPiezas(medidaEditando.piezas);
        }
      } else {
        // Limpiar formulario
        resetFormulario();
      }
    }
  }, [open, medidaEditando, piezasManager]);

  const resetFormulario = () => {
    setPersonaVisita('');
    setFechaCompromiso('');
    setCodigoReferencia('');
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
        fechaCompromiso,
        codigoReferencia,
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

      // Si estamos editando, actualizar
      if (medidaEditando && medidaEditando._id) {
        await axiosConfig.put(`/proyectos/${proyecto._id}/medidas/${medidaEditando._id}`, payload);
      } else {
        // Crear nueva medida
        await axiosConfig.post(`/proyectos/${proyecto._id}/medidas`, payload);
      }

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

  const calcularAreaPieza = (pieza) => {
    if (!pieza.medidas || pieza.medidas.length === 0) return 0;
    
    return pieza.medidas.reduce((total, medida) => {
      const ancho = parseFloat(medida.ancho) || 0;
      const alto = parseFloat(medida.alto) || 0;
      return total + (ancho * alto);
    }, 0);
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
                  onChange={(e) => setPersonaVisita(e.target.value)}
                  placeholder="Nombre del asesor/técnico"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Fecha compromiso"
                  value={fechaCompromiso}
                  onChange={(e) => setFechaCompromiso(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Código/Referencia"
                  value={codigoReferencia}
                  onChange={(e) => setCodigoReferencia(e.target.value)}
                  placeholder="Código interno"
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

                      {/* Campos técnicos */}
                      {(pieza.medidas && pieza.medidas[0] && (
                        pieza.medidas[0].tipoControl || 
                        pieza.medidas[0].orientacion || 
                        pieza.medidas[0].tipoInstalacion ||
                        pieza.medidas[0].eliminacion ||
                        pieza.medidas[0].risoAlto ||
                        pieza.medidas[0].risoBajo ||
                        pieza.medidas[0].sistema ||
                        pieza.medidas[0].telaMarca ||
                        pieza.medidas[0].baseTabla
                      )) && (
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" gutterBottom>
                            🔧 Campos Técnicos
                          </Typography>
                          <Grid container spacing={2}>
                            {pieza.medidas[0].tipoControl && (
                              <Grid item xs={6} md={3}>
                                <Typography variant="body2">
                                  <strong>Control:</strong> {pieza.medidas[0].tipoControl}
                                </Typography>
                              </Grid>
                            )}
                            {pieza.medidas[0].orientacion && (
                              <Grid item xs={6} md={3}>
                                <Typography variant="body2">
                                  <strong>Orientación:</strong> {pieza.medidas[0].orientacion}
                                </Typography>
                              </Grid>
                            )}
                            {pieza.medidas[0].tipoInstalacion && (
                              <Grid item xs={6} md={3}>
                                <Typography variant="body2">
                                  <strong>Instalación:</strong> {pieza.medidas[0].tipoInstalacion}
                                </Typography>
                              </Grid>
                            )}
                            {pieza.medidas[0].eliminacion && (
                              <Grid item xs={6} md={3}>
                                <Typography variant="body2">
                                  <strong>Eliminación:</strong> {pieza.medidas[0].eliminacion}
                                </Typography>
                              </Grid>
                            )}
                            {pieza.medidas[0].risoAlto && (
                              <Grid item xs={6} md={3}>
                                <Typography variant="body2">
                                  <strong>Riso Alto:</strong> {pieza.medidas[0].risoAlto}
                                </Typography>
                              </Grid>
                            )}
                            {pieza.medidas[0].risoBajo && (
                              <Grid item xs={6} md={3}>
                                <Typography variant="body2">
                                  <strong>Riso Bajo:</strong> {pieza.medidas[0].risoBajo}
                                </Typography>
                              </Grid>
                            )}
                            {pieza.medidas[0].sistema && (
                              <Grid item xs={6} md={3}>
                                <Typography variant="body2">
                                  <strong>Sistema:</strong> {pieza.medidas[0].sistema}
                                </Typography>
                              </Grid>
                            )}
                            {pieza.medidas[0].telaMarca && (
                              <Grid item xs={6} md={3}>
                                <Typography variant="body2">
                                  <strong>Tela/Marca:</strong> {pieza.medidas[0].telaMarca}
                                </Typography>
                              </Grid>
                            )}
                            {pieza.medidas[0].baseTabla && (
                              <Grid item xs={6} md={3}>
                                <Typography variant="body2">
                                  <strong>Base Tabla:</strong> {pieza.medidas[0].baseTabla}
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
                            size="small"
                            startIcon={<Edit />}
                            onClick={() => piezasManager.handleEditarPieza(index)}
                          >
                            Editar
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
              <Typography variant="h6" sx={{ mb: 2, color: '#2196f3' }}>
                {piezasManager.editandoPieza ? '✏️ Editando Partida' : '➕ Nueva Partida'}
              </Typography>
              
              {/* Aquí iría el formulario completo de partidas del AgregarEtapaModal */}
              {/* Por ahora, un formulario simplificado */}
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Ubicación"
                    value={piezasManager.piezaForm.ubicacion}
                    onChange={(e) => piezasManager.setPiezaForm(prev => ({ ...prev, ubicacion: e.target.value }))}
                    placeholder="Ej: Sala-Comedor, Recámara Principal"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Cantidad de piezas"
                    value={piezasManager.piezaForm.cantidad}
                    onChange={(e) => piezasManager.actualizarMedidas(e.target.value)}
                    inputProps={{ min: 1, max: 20 }}
                  />
                </Grid>
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
              onClick={() => piezasManager.setAgregandoPieza(true)}
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

import AgregarMedidaProyectoModal from './AgregarMedidaProyectoModal';

/**
 * Este modal es un alias del modal de proyecto para mantener compatibilidad con
 * rutas y componentes existentes que aún esperan la antigua versión enfocada en
 * partidas. Al reutilizar la misma implementación evitamos duplicar lógica y
 * garantizamos que las validaciones, cálculos y mejoras recientes aplican por
 * igual sin provocar conflictos de nombres como el de `calcularAreaPieza` que
 * surgía en la implementación previa.
 */
const AgregarMedidaPartidasModal = (props) => (
  <AgregarMedidaProyectoModal {...props} />
);

export default AgregarMedidaPartidasModal;

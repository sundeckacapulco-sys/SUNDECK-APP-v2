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
  Photo as PhotoIcon,
  CheckCircle
} from '@mui/icons-material';
import usePiezasManager from '../../../components/Prospectos/hooks/usePiezasManager';
import { productosOptions, createEmptyPieza } from '../../../components/Prospectos/AgregarEtapaModal.constants';
import axiosConfig from '../../../config/axios';
import PiezaCard from './PiezaCard';

const AgregarMedidaPartidasModal = ({ open, onClose, proyecto, onActualizar, medidaEditando }) => {
  const [nombreLevantamiento, setNombreLevantamiento] = useState('');
  const [personaVisita, setPersonaVisita] = useState('');
  const [fechaCotizacion, setFechaCotizacion] = useState('');
  const [quienRecibe, setQuienRecibe] = useState('');
  const [observacionesGenerales, setObservacionesGenerales] = useState('');
  const [linkVideo, setLinkVideo] = useState('');
  const [fotosGenerales, setFotosGenerales] = useState([]);
  const [subiendoFotos, setSubiendoFotos] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorLocal, setErrorLocal] = useState('');
  const [grabando, setGrabando] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [lastTranscript, setLastTranscript] = useState('');
  const [haciendoCheckIn, setHaciendoCheckIn] = useState(false);
  const [checkInRealizado, setCheckInRealizado] = useState(false);

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
        console.log('🔍 Cargando datos para editar:', medidaEditando);
        
        // Cargar datos de la medida editando
        if (medidaEditando.personaVisita) setPersonaVisita(medidaEditando.personaVisita);
        if (medidaEditando.fechaCotizacion) setFechaCotizacion(medidaEditando.fechaCotizacion);
        if (medidaEditando.quienRecibe) setQuienRecibe(medidaEditando.quienRecibe);
        if (medidaEditando.observaciones) setObservacionesGenerales(medidaEditando.observaciones);
        if (medidaEditando.linkVideo) setLinkVideo(medidaEditando.linkVideo);
        if (medidaEditando.fotosGenerales) setFotosGenerales(medidaEditando.fotosGenerales);
        
        // Cargar partidas si existen
        if (medidaEditando.piezas && medidaEditando.piezas.length > 0) {
          console.log('📦 Cargando piezas:', medidaEditando.piezas);
          piezasManager.reemplazarPiezas(medidaEditando.piezas);
        }
      } else {
        // Limpiar formulario cuando se abre nuevo
        resetFormulario();
      }
    }
  }, [open, medidaEditando]); // Removido piezasManager de las dependencias

  // Inicializar reconocimiento de voz
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true; // Activar para respuesta rápida
      recognitionInstance.lang = 'es-MX';
      
      recognitionInstance.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        // Procesar todos los resultados
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        // Si hay resultado final, agregarlo (evitando duplicados)
        if (finalTranscript && finalTranscript !== lastTranscript) {
          setLastTranscript(finalTranscript);
          setObservacionesGenerales(prev => {
            // Agregar espacio solo si ya hay contenido
            const newText = prev ? prev + ' ' + finalTranscript : finalTranscript;
            return newText;
          });
        }
      };
      
      recognitionInstance.onerror = (event) => {
        console.error('Error de reconocimiento de voz:', event.error);
        setGrabando(false);
      };
      
      recognitionInstance.onend = () => {
        setGrabando(false);
      };
      
      setRecognition(recognitionInstance);
    }
  }, [lastTranscript]);

  const toggleDictado = () => {
    if (!recognition) {
      setErrorLocal('Tu navegador no soporta reconocimiento de voz');
      return;
    }
    
    if (grabando) {
      recognition.stop();
      setGrabando(false);
      setLastTranscript(''); // Reset para próxima sesión
    } else {
      setLastTranscript(''); // Reset al iniciar
      recognition.start();
      setGrabando(true);
    }
  };

  const subirFotos = async (files) => {
    try {
      setSubiendoFotos(true);
      const formData = new FormData();
      
      files.forEach(file => {
        formData.append('fotos', file);
      });
      
      const response = await axiosConfig.post('/proyectos/levantamiento/fotos', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        return response.data.data; // Array de {url, descripcion, fechaSubida}
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error('Error subiendo fotos:', error);
      setErrorLocal('Error al subir las fotos: ' + (error.response?.data?.message || error.message));
      return [];
    } finally {
      setSubiendoFotos(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      setHaciendoCheckIn(true);
      setErrorLocal('');

      // Obtener geolocalización
      if (!navigator.geolocation) {
        setErrorLocal('Tu navegador no soporta geolocalización');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const checkInData = {
              proyectoId: proyecto._id,
              ubicacion: {
                type: 'Point',
                coordinates: [position.coords.longitude, position.coords.latitude]
              },
              direccion: proyecto.cliente?.direccion || 'Dirección del proyecto',
              notas: `Check-in desde levantamiento: ${nombreLevantamiento || 'Sin nombre'}`
            };

            console.log('📍 Haciendo check-in:', checkInData);
            
            const respuesta = await axiosConfig.post('/asistencia/check-in', checkInData);
            
            console.log('✅ Check-in exitoso:', respuesta.data);
            setCheckInRealizado(true);
            
            // Mostrar mensaje de éxito
            setTimeout(() => {
              setCheckInRealizado(false);
            }, 3000);

          } catch (error) {
            console.error('Error en check-in:', error);
            setErrorLocal(error.response?.data?.message || 'Error al hacer check-in');
          } finally {
            setHaciendoCheckIn(false);
          }
        },
        (error) => {
          console.error('Error obteniendo ubicación:', error);
          setErrorLocal('No se pudo obtener tu ubicación. Verifica los permisos.');
          setHaciendoCheckIn(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );

    } catch (error) {
      console.error('Error en check-in:', error);
      setErrorLocal('Error al hacer check-in');
      setHaciendoCheckIn(false);
    }
  };

  const resetFormulario = () => {
    setNombreLevantamiento('');
    setPersonaVisita('');
    setFechaCotizacion('');
    setQuienRecibe('');
    setObservacionesGenerales('');
    setLinkVideo('');
    setFotosGenerales([]);
    piezasManager.resetPiezas();
    setErrorLocal('');
    setCheckInRealizado(false);
    if (grabando && recognition) {
      recognition.stop();
      setGrabando(false);
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

      // Preparar partidas en el formato que espera el backend
      const partidas = piezasManager.piezas.map(pieza => {
        // Asegurar que cada medida tenga su área calculada
        const medidasConArea = (pieza.medidas || []).map(medida => ({
          ...medida,
          area: (parseFloat(medida.ancho) || 0) * (parseFloat(medida.alto) || 0)
        }));
        
        const areaTotal = calcularAreaPieza({ ...pieza, medidas: medidasConArea });
        
        console.log('📏 Calculando área para pieza:', {
          ubicacion: pieza.ubicacion,
          medidas: medidasConArea,
          areaTotal
        });
        
        return {
          ubicacion: pieza.ubicacion,
          producto: pieza.producto,
          productoLabel: pieza.productoLabel,
          color: pieza.color,
          modeloCodigo: pieza.modeloCodigo,
          cantidad: pieza.cantidad || 1,
          medidas: medidasConArea,
          observaciones: pieza.observaciones,
          areaTotal,
          // Incluir especificaciones técnicas si existen
          galeria: pieza.galeria,
          tipoControl: pieza.tipoControl,
          caida: pieza.caida,
          tipoInstalacion: pieza.tipoInstalacion,
          tipoFijacion: pieza.tipoFijacion,
          modoOperacion: pieza.modoOperacion,
          detalleTecnico: pieza.detalleTecnico,
          sistema: pieza.sistema,
          telaMarca: pieza.telaMarca,
          baseTabla: pieza.baseTabla
        };
      });

      // Calcular totales
      const totales = {
        totalPartidas: piezasManager.piezas.length,
        totalPiezas: piezasManager.piezas.reduce((total, pieza) => total + (pieza.cantidad || 1), 0),
        areaTotal: piezasManager.piezas.reduce((total, pieza) => total + calcularAreaPieza(pieza), 0)
      };

      // Preparar payload para el endpoint de levantamiento
      const payload = {
        nombreLevantamiento: nombreLevantamiento || `Levantamiento ${new Date().toLocaleDateString('es-MX')}`,
        partidas,
        totales,
        observaciones: observacionesGenerales,
        personaVisita,
        fechaCotizacion,
        quienRecibe,
        linkVideo,
        fotosGenerales
      };

      console.log('🔍 Guardando levantamiento con endpoint correcto:', payload);
      console.log('📦 Total de partidas:', partidas.length);
      console.log('📊 Totales calculados:', totales);

      // Usar el endpoint específico para levantamientos
      const respuesta = await axiosConfig.patch(`/proyectos/${proyecto._id}/levantamiento`, payload);
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
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 'bold', fontSize: '0.95rem' }}>
              🔧 Información Técnica General
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Nombre del Levantamiento"
                  value={nombreLevantamiento}
                  onChange={(e) => setNombreLevantamiento(e.target.value)}
                  placeholder="Ej: Depto 2000 Porto Bello"
                  helperText="Identificador único para este levantamiento"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Persona que realizó visita"
                  value={personaVisita}
                  onChange={(e) => {
                    console.log('🔍 DEBUG - Cambiando personaVisita:', e.target.value);
                    setPersonaVisita(e.target.value);
                  }}
                  placeholder="Asesor/técnico"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Quien recibe"
                  value={quienRecibe}
                  onChange={(e) => setQuienRecibe(e.target.value)}
                  placeholder="Nombre del cliente"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Fecha de Creación"
                  value={fechaCotizacion}
                  onChange={(e) => setFechaCotizacion(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              {/* Botón de Check-in */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                  <Button
                    variant="contained"
                    color={checkInRealizado ? "success" : "primary"}
                    onClick={handleCheckIn}
                    disabled={haciendoCheckIn || checkInRealizado}
                    startIcon={checkInRealizado ? <CheckCircle /> : <StraightenIcon />}
                    sx={{
                      bgcolor: checkInRealizado ? '#10B981' : '#14B8A6',
                      '&:hover': {
                        bgcolor: checkInRealizado ? '#059669' : '#0D9488'
                      }
                    }}
                  >
                    {haciendoCheckIn ? 'Obteniendo ubicación...' : checkInRealizado ? '✓ Check-in Realizado' : '📍 Hacer Check-in'}
                  </Button>
                  {checkInRealizado && (
                    <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
                      ¡Ubicación registrada correctamente!
                    </Typography>
                  )}
                  {!checkInRealizado && (
                    <Typography variant="caption" color="text.secondary">
                      Registra tu llegada al sitio con geolocalización
                    </Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Partidas agregadas */}
        {piezasManager.piezas.length > 0 && (
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                📋 Partidas Agregadas ({piezasManager.piezas.length})
              </Typography>
              
              {piezasManager.piezas.map((pieza, index) => (
                <Accordion key={index} sx={{ mb: 1.5, border: '1px solid rgba(226, 232, 240, 1)', borderRadius: '12px !important', '&:before': { display: 'none' } }}>
                  <AccordionSummary 
                    expandIcon={<ExpandMoreIcon />}
                    sx={{ 
                      borderRadius: '12px',
                      '&:hover': { bgcolor: 'rgba(241, 245, 249, 0.5)' }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'rgba(30, 41, 59, 1)' }}>
                          📍 {pieza.ubicacion}
                        </Typography>
                        <Chip
                          label={pieza.productoLabel || 'Producto'}
                          size="small"
                          sx={{ 
                            bgcolor: 'rgba(59, 130, 246, 0.1)', 
                            color: 'rgba(37, 99, 235, 1)',
                            fontWeight: 600,
                            fontSize: '0.75rem'
                          }}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ color: 'rgba(100, 116, 139, 1)', fontWeight: 600 }}>
                        {pieza.cantidad || 1} {(pieza.cantidad || 1) === 1 ? 'pieza' : 'piezas'} • {calcularAreaPieza(pieza).toFixed(2)} m²
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ pt: 2 }}>
                    <Grid container spacing={2}>
                      {/* Especificaciones Generales de la Partida */}
                      <Grid item xs={12}>
                        <Box sx={{ 
                          bgcolor: 'rgba(241, 245, 249, 1)', 
                          p: 2, 
                          borderRadius: '8px',
                          mb: 2
                        }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: 'rgba(100, 116, 139, 1)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', mb: 1 }}>
                            📐 Especificaciones Generales
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={6} md={3}>
                              <Typography variant="caption" sx={{ color: 'rgba(100, 116, 139, 1)', fontWeight: 600, display: 'block' }}>
                                Cantidad
                              </Typography>
                              <Typography variant="body2" sx={{ color: 'rgba(30, 41, 59, 1)', fontWeight: 600 }}>
                                {pieza.cantidad || 1} {(pieza.cantidad || 1) === 1 ? 'pieza' : 'piezas'}
                              </Typography>
                            </Grid>
                            <Grid item xs={6} md={3}>
                              <Typography variant="caption" sx={{ color: 'rgba(100, 116, 139, 1)', fontWeight: 600, display: 'block' }}>
                                Área Total
                              </Typography>
                              <Typography variant="body2" sx={{ color: 'rgba(30, 41, 59, 1)', fontWeight: 600 }}>
                                {calcularAreaPieza(pieza).toFixed(2)} m²
                              </Typography>
                            </Grid>
                            <Grid item xs={6} md={3}>
                              <Typography variant="caption" sx={{ color: 'rgba(100, 116, 139, 1)', fontWeight: 600, display: 'block' }}>
                                Color
                              </Typography>
                              <Typography variant="body2" sx={{ color: 'rgba(30, 41, 59, 1)', fontWeight: 600 }}>
                                {pieza.color || 'No especificado'}
                              </Typography>
                            </Grid>
                            {pieza.modeloCodigo && (
                              <Grid item xs={6} md={3}>
                                <Typography variant="caption" sx={{ color: 'rgba(100, 116, 139, 1)', fontWeight: 600, display: 'block' }}>
                                  Modelo/Código
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'rgba(30, 41, 59, 1)', fontWeight: 600 }}>
                                  {pieza.modeloCodigo}
                                </Typography>
                              </Grid>
                            )}
                          </Grid>
                        </Box>
                      </Grid>

                      {/* Medidas individuales con especificaciones técnicas por pieza */}
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                          <Typography variant="subtitle2">
                            📏 Medidas Individuales y Especificaciones Técnicas
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(100, 116, 139, 1)', fontWeight: 600 }}>
                            {pieza.cantidad || pieza.medidas?.length || 0} {(pieza.cantidad || pieza.medidas?.length || 0) === 1 ? 'pieza' : 'piezas'} • {calcularAreaPieza(pieza).toFixed(2)} m² totales
                          </Typography>
                        </Box>
                        {(pieza.medidas || []).map((medida, idx) => (
                          <PiezaCard
                            key={idx}
                            numero={idx + 1}
                            ancho={medida.ancho}
                            alto={medida.alto}
                            area={medida.area || 0}
                            producto={medida.productoLabel || medida.producto}
                            color={medida.color}
                            modeloCodigo={pieza.modeloCodigo}
                            galeria={medida.galeria}
                            tipoControl={medida.tipoControl}
                            caida={medida.caida}
                            tipoInstalacion={medida.tipoInstalacion}
                            tipoFijacion={medida.tipoFijacion}
                            modoOperacion={medida.modoOperacion}
                            detalleTecnico={medida.detalleTecnico}
                            sistema={medida.sistema}
                            telaMarca={medida.telaMarca}
                            baseTabla={medida.baseTabla}
                            observacionesTecnicas={medida.observacionesTecnicas}
                          />
                        ))}
                      </Grid>

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
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          <Button
                            variant="outlined"
                            color="primary"
                            startIcon={<Edit />}
                            onClick={() => {
                              console.log('🔍 DEBUG - Editando partida:', index);
                              piezasManager.handleEditarPieza(index);
                              piezasManager.setAgregandoPieza(true);
                            }}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            startIcon={<Delete />}
                            onClick={() => {
                              if (window.confirm('¿Estás seguro de eliminar esta partida?')) {
                                piezasManager.handleEliminarPieza(index);
                              }
                            }}
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
          <Card sx={{ mb: 2, border: '2px solid #2196f3' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography variant="subtitle1" sx={{ color: '#2196f3', fontWeight: 'bold', fontSize: '0.95rem' }}>
                  {piezasManager.editandoPieza ? '✏️ Editando Partida' : '➕ Nueva Partida'}
                </Typography>
                {piezasManager.piezaForm.cantidad > 1 && (
                  <Chip 
                    label={`${piezasManager.piezaForm.cantidad} piezas`}
                    color="success"
                    size="small"
                    sx={{ fontSize: '0.75rem', height: '24px' }}
                  />
                )}
              </Box>
              
              <Grid container spacing={1}>
                {/* Ubicación y Cantidad */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Ubicación *"
                    value={piezasManager.piezaForm.ubicacion}
                    onChange={(e) => piezasManager.setPiezaForm(prev => ({ ...prev, ubicacion: e.target.value }))}
                    placeholder="Sala, Recámara..."
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Cantidad *"
                    value={piezasManager.piezaForm.cantidad}
                    onChange={(e) => piezasManager.actualizarMedidas(e.target.value)}
                    inputProps={{ min: 1, max: 20 }}
                    required
                  />
                </Grid>

                {/* Producto */}
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth size="small">
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
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
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
                    placeholder="SH-3000, BL-500..."
                  />
                </Grid>

                {/* Color */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
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
                        {/* NIVEL 1: Medidas Críticas */}
                        <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600, color: 'text.secondary' }}>
                          📏 Medidas y Configuración Principal
                        </Typography>
                        <Grid container spacing={1} sx={{ mb: 1.5 }}>
                          {/* Ancho */}
                          <Grid item xs={6} sm={4}>
                            <TextField
                              label="Ancho (m)"
                              type="number"
                              fullWidth
                              size="small"
                              value={medida.ancho}
                              onChange={(e) => {
                                const nuevasMedidas = [...(piezasManager.piezaForm.medidas || [])];
                                nuevasMedidas[index] = { ...nuevasMedidas[index], ancho: e.target.value };
                                piezasManager.setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
                              }}
                              inputProps={{ step: 0.01 }}
                              placeholder="2.50"
                              required
                            />
                          </Grid>
                          
                          {/* Alto */}
                          <Grid item xs={6} sm={4}>
                            <TextField
                              label="Alto (m)"
                              type="number"
                              fullWidth
                              size="small"
                              value={medida.alto}
                              onChange={(e) => {
                                const nuevasMedidas = [...(piezasManager.piezaForm.medidas || [])];
                                nuevasMedidas[index] = { ...nuevasMedidas[index], alto: e.target.value };
                                piezasManager.setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
                              }}
                              inputProps={{ step: 0.01 }}
                              placeholder="3.00"
                              required
                            />
                          </Grid>

                          {/* Galería/Cabezal */}
                          <Grid item xs={12} sm={4}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Galería</InputLabel>
                              <Select
                                value={medida.galeria || ''}
                                label="Galería"
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

                          {/* Tipo de Control */}
                          <Grid item xs={6} sm={4}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Control</InputLabel>
                              <Select
                                value={medida.tipoControl || ''}
                                label="Control"
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
                          <Grid item xs={6} sm={4}>
                            <FormControl fullWidth size="small">
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
                          <Grid item xs={12} sm={4}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Tipo Instalación</InputLabel>
                              <Select
                                value={medida.tipoInstalacion || ''}
                                label="Tipo Instalación"
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
                          <Grid item xs={6} sm={4}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Tipo Fijación</InputLabel>
                              <Select
                                value={medida.tipoFijacion || ''}
                                label="Tipo Fijación"
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
                          <Grid item xs={6} sm={4}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Modo Operación</InputLabel>
                              <Select
                                value={medida.modoOperacion || ''}
                                label="Modo Operación"
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

                          {/* Detalle Técnico */}
                          <Grid item xs={6} sm={4}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Detalle Técnico</InputLabel>
                              <Select
                                value={medida.detalleTecnico || ''}
                                label="Detalle Técnico"
                                onChange={(e) => {
                                  const nuevasMedidas = [...(piezasManager.piezaForm.medidas || [])];
                                  nuevasMedidas[index] = { 
                                    ...nuevasMedidas[index], 
                                    detalleTecnico: e.target.value,
                                    detalleTecnicoManual: e.target.value === 'otro' ? nuevasMedidas[index]?.detalleTecnicoManual : ''
                                  };
                                  piezasManager.setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
                                }}
                              >
                                <MenuItem value="">No aplica</MenuItem>
                                <MenuItem value="traslape">Traslape</MenuItem>
                                <MenuItem value="corte">Corte</MenuItem>
                                <MenuItem value="sin_traslape">Sin traslape</MenuItem>
                                <MenuItem value="empalme">Empalme</MenuItem>
                                <MenuItem value="doble_sistema">Doble Sistema</MenuItem>
                                <MenuItem value="otro">Otro (especificar)</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>

                          {/* Campo manual para Detalle (cuando selecciona "Otro") */}
                          {medida.detalleTecnico === 'otro' && (
                            <Grid item xs={12} sm={8}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Especificar Detalle Técnico"
                                value={medida.detalleTecnicoManual || ''}
                                onChange={(e) => {
                                  const nuevasMedidas = [...(piezasManager.piezaForm.medidas || [])];
                                  nuevasMedidas[index] = { ...nuevasMedidas[index], detalleTecnicoManual: e.target.value };
                                  piezasManager.setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
                                }}
                                placeholder="Ej: Sistema triple con guías laterales"
                              />
                            </Grid>
                          )}

                          {/* Traslape */}
                          <Grid item xs={6} sm={4}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Traslape</InputLabel>
                              <Select
                                value={medida.traslape || ''}
                                label="Traslape"
                                onChange={(e) => {
                                  const nuevasMedidas = [...(piezasManager.piezaForm.medidas || [])];
                                  nuevasMedidas[index] = { 
                                    ...nuevasMedidas[index], 
                                    traslape: e.target.value,
                                    traslapeManual: e.target.value === 'otro' ? nuevasMedidas[index]?.traslapeManual : ''
                                  };
                                  piezasManager.setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
                                }}
                              >
                                <MenuItem value="">No aplica</MenuItem>
                                <MenuItem value="5cm">5 cm</MenuItem>
                                <MenuItem value="10cm">10 cm</MenuItem>
                                <MenuItem value="15cm">15 cm</MenuItem>
                                <MenuItem value="20cm">20 cm</MenuItem>
                                <MenuItem value="otro">Otro (especificar)</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>

                          {/* Campo manual para Traslape (cuando selecciona "Otro") */}
                          {medida.traslape === 'otro' && (
                            <Grid item xs={12} sm={8}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Especificar Traslape"
                                value={medida.traslapeManual || ''}
                                onChange={(e) => {
                                  const nuevasMedidas = [...(piezasManager.piezaForm.medidas || [])];
                                  nuevasMedidas[index] = { ...nuevasMedidas[index], traslapeManual: e.target.value };
                                  piezasManager.setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
                                }}
                                placeholder="Ej: 25 cm o traslape personalizado"
                              />
                            </Grid>
                          )}

                          {/* Sistema */}
                          <Grid item xs={12} sm={4}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Sistema"
                              value={medida.sistema || ''}
                              onChange={(e) => {
                                const nuevasMedidas = [...(piezasManager.piezaForm.medidas || [])];
                                nuevasMedidas[index] = { ...nuevasMedidas[index], sistema: e.target.value };
                                piezasManager.setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
                              }}
                              placeholder="Enrollable, Sheer..."
                            />
                          </Grid>

                          {/* Tela/Marca */}
                          <Grid item xs={6} sm={4}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Tela/Marca"
                              value={medida.telaMarca || ''}
                              onChange={(e) => {
                                const nuevasMedidas = [...(piezasManager.piezaForm.medidas || [])];
                                nuevasMedidas[index] = { ...nuevasMedidas[index], telaMarca: e.target.value };
                                piezasManager.setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
                              }}
                              placeholder="Marca o tela"
                            />
                          </Grid>

                          {/* Base Tabla */}
                          <Grid item xs={6} sm={4}>
                            <FormControl fullWidth size="small">
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
                                <MenuItem value="7">7 cm</MenuItem>
                                <MenuItem value="15">15 cm</MenuItem>
                                <MenuItem value="18">18 cm</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>

                          {/* Observaciones técnicas de la pieza */}
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              size="small"
                              multiline
                              rows={2}
                              label="Observaciones técnicas"
                              value={medida.observacionesTecnicas || ''}
                              onChange={(e) => {
                                const nuevasMedidas = [...(piezasManager.piezaForm.medidas || [])];
                                nuevasMedidas[index] = { ...nuevasMedidas[index], observacionesTecnicas: e.target.value };
                                piezasManager.setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
                              }}
                              placeholder="Obstáculos, accesos, cableado, nivel..."
                            />
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

        {/* Link de Video */}
        <Card>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              🎥 Video del Levantamiento
            </Typography>
            <TextField
              fullWidth
              label="Link de Video (YouTube, Google Drive, etc.)"
              value={linkVideo}
              onChange={(e) => setLinkVideo(e.target.value)}
              placeholder="https://youtube.com/watch?v=... o https://drive.google.com/..."
              helperText="Pega aquí el enlace del video del levantamiento para referencia futura"
            />
          </CardContent>
        </Card>

        {/* Fotos Generales */}
        <Card>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              📸 Fotos Generales del Levantamiento
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<PhotoIcon />}
                size="small"
                disabled={subiendoFotos}
              >
                {subiendoFotos ? 'Subiendo...' : 'Agregar Fotos'}
                <input
                  type="file"
                  hidden
                  multiple
                  accept="image/*"
                  onChange={async (e) => {
                    const files = Array.from(e.target.files);
                    if (files.length === 0) return;
                    
                    // Subir fotos al servidor
                    const fotosSubidas = await subirFotos(files);
                    console.log('📸 Fotos subidas:', fotosSubidas);
                    if (fotosSubidas.length > 0) {
                      setFotosGenerales([...fotosGenerales, ...fotosSubidas]);
                    }
                  }}
                />
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                Fotos del lugar, fachada, accesos, etc.
              </Typography>
            </Box>
            
            {fotosGenerales.length > 0 && (
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {fotosGenerales.map((foto, index) => (
                  <Box key={index} sx={{ width: 150 }}>
                    <Box sx={{ position: 'relative', width: 150, height: 150, mb: 1 }}>
                      <img
                        src={foto.url.startsWith('http') ? foto.url : `http://localhost:5001${foto.url}`}
                        alt={foto.descripcion || `Foto ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: 4,
                          border: '1px solid #ddd'
                        }}
                      />
                      <IconButton
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          bgcolor: 'error.main',
                          color: 'white',
                          '&:hover': { bgcolor: 'error.dark' }
                        }}
                        onClick={() => {
                          const newFotos = fotosGenerales.filter((_, i) => i !== index);
                          setFotosGenerales(newFotos);
                        }}
                      >
                        <Close fontSize="small" />
                      </IconButton>
                    </Box>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Título de la foto"
                      value={foto.descripcion || ''}
                      onChange={(e) => {
                        const newFotos = [...fotosGenerales];
                        newFotos[index] = { ...newFotos[index], descripcion: e.target.value };
                        setFotosGenerales(newFotos);
                      }}
                    />
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Observaciones generales */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Observaciones Generales del Levantamiento"
                value={observacionesGenerales}
                onChange={(e) => setObservacionesGenerales(e.target.value)}
                placeholder="Notas generales sobre el levantamiento técnico"
              />
              <IconButton
                color={grabando ? 'error' : 'primary'}
                onClick={toggleDictado}
                sx={{ 
                  mt: 1,
                  animation: grabando ? 'pulse 1.5s infinite' : 'none',
                  '@keyframes pulse': {
                    '0%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.1)' },
                    '100%': { transform: 'scale(1)' }
                  }
                }}
                title={grabando ? 'Detener dictado' : 'Iniciar dictado por voz'}
              >
                {grabando ? '🔴' : '🎤'}
              </IconButton>
            </Box>
            {grabando && (
              <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                🔴 Grabando... Habla ahora
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              💡 Click en el micrófono para dictar por voz
            </Typography>
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

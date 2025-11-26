import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Photo as PhotoIcon,
  Straighten as StraightenIcon,
  Build as BuildIcon,
  MonetizationOn as MonetizationOnIcon,
  Calculate as CalculateIcon
} from '@mui/icons-material';
import AgregarMedidaProyectoModal from './AgregarMedidaProyectoModal';
import AgregarMedidaPartidasModal from './AgregarMedidaPartidasModal';
import AgregarEtapaModal from '../../../components/Prospectos/AgregarEtapaModal';
import AgregarMedidasProyectoModal from './AgregarMedidasProyectoModal';
import axiosConfig from '../../../config/axios';
import PiezaCard from './PiezaCard';
import KpiCard from './KpiCard';

const LevantamientoTab = ({ proyecto, onActualizar }) => {
  const [dialogoMedida, setDialogoMedida] = useState(false);
  const [medidaEditando, setMedidaEditando] = useState(null);
  const [dialogoCotizacion, setDialogoCotizacion] = useState(false);
  const [dialogoPartidas, setDialogoPartidas] = useState(false);
  
  // Estado para el modal inteligente unificado
  const [modalSelectorAbierto, setModalSelectorAbierto] = useState(false);
  const [opcionSeleccionada, setOpcionSeleccionada] = useState(null);
  
  // Estados para el nuevo modal unificado de proyectos
  const [nuevoModalAbierto, setNuevoModalAbierto] = useState(false);
  const [nuevoModalConPrecios, setNuevoModalConPrecios] = useState(false);

  // Funciones para manejar el modal
  const abrirDialogoMedida = (medida = null) => {
    setMedidaEditando(medida);
    setDialogoMedida(true);
  };

  const cerrarDialogoMedida = () => {
    setDialogoMedida(false);
    setMedidaEditando(null);
  };

  // Función para abrir cotización en vivo
  const abrirCotizacionEnVivo = () => {
    setDialogoCotizacion(true);
  };

  const cerrarCotizacionEnVivo = () => {
    setDialogoCotizacion(false);
  };

  // Funciones para el modal de partidas
  const abrirDialogoPartidas = (medida = null) => {
    setMedidaEditando(medida);
    setDialogoPartidas(true);
  };

  const cerrarDialogoPartidas = () => {
    setDialogoPartidas(false);
    setMedidaEditando(null);
  };

  // Funciones para el modal selector inteligente
  const abrirModalSelector = () => {
    setModalSelectorAbierto(true);
    setOpcionSeleccionada(null);
  };

  const cerrarModalSelector = () => {
    setModalSelectorAbierto(false);
    setOpcionSeleccionada(null);
  };

  const seleccionarTipoMedida = (tipo) => {
    setOpcionSeleccionada(tipo);
    
    // Pequeño delay para mostrar el estado activo antes de cerrar
    setTimeout(() => {
      cerrarModalSelector();
      
      if (tipo === 'con_precios') {
        // Usar el nuevo modal unificado para cotización con precios
        setNuevoModalConPrecios(true);
        setNuevoModalAbierto(true);
      } else if (tipo === 'sin_precios') {
        // Usar el modal de partidas de ayer para levantamiento sin precios
        abrirDialogoPartidas();
      }
    }, 200);
  };

  // Función para eliminar levantamiento/medida
  const eliminarMedida = async (index) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este levantamiento? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      console.log('🗑️ Eliminando levantamiento en índice:', index);
      console.log('📋 Proyecto completo:', proyecto);
      console.log('📋 Medidas actuales:', proyecto.medidas);
      
      // Validar que exista el array de medidas
      if (!proyecto.medidas || !Array.isArray(proyecto.medidas)) {
        alert('No hay medidas para eliminar');
        return;
      }
      
      // Filtrar las medidas excluyendo la que queremos eliminar
      const nuevasMedidas = proyecto.medidas.filter((_, i) => i !== index);
      
      console.log('📋 Nuevas medidas después de filtrar:', nuevasMedidas);
      
      // Actualizar el proyecto con las medidas filtradas
      const respuesta = await axiosConfig.put(`/proyectos/${proyecto._id}`, {
        medidas: nuevasMedidas
      });

      console.log('✅ Levantamiento eliminado:', respuesta.data);
      
      // Mostrar mensaje de éxito
      alert('Levantamiento eliminado correctamente');
      
      // Actualizar la vista - forzar recarga
      if (onActualizar) {
        await onActualizar();
      }
      
      // Recargar la página si es necesario
      window.location.reload();
      
    } catch (error) {
      console.error('❌ Error eliminando medida:', error);
      console.error('Detalles del error:', error.response?.data);
      alert('Error al eliminar el levantamiento: ' + (error.response?.data?.message || error.message));
    }
  };

  // Calcular totales
  const calcularTotales = () => {
    if (!proyecto.medidas || proyecto.medidas.length === 0) {
      return { 
        totalMedidas: 0, 
        areaTotal: 0, 
        totalPiezas: 0,
        totalEstimado: 0,
        diasEnProceso: 0
      };
    }

    let totalPiezas = 0;
    let areaTotal = 0;
    let totalEstimado = 0;

    proyecto.medidas.forEach(medida => {
      // Para levantamientos con partidas
      if (medida.tipo === 'levantamiento' && medida.piezas && medida.piezas.length > 0) {
        medida.piezas.forEach(pieza => {
          const cantidadPieza = pieza.cantidad || 1;
          const areaPieza = pieza.areaTotal || 0;
          const precioPieza = pieza.precioTotal || 0;
          
          totalPiezas += cantidadPieza;
          areaTotal += areaPieza;
          totalEstimado += precioPieza;
        });
      } else {
        // Para medidas antiguas
        const cantidad = medida.cantidad || 1;
        const area = (medida.ancho || 0) * (medida.alto || 0) * cantidad;
        const precio = (medida.precioM2 || 0) * area;
        
        totalPiezas += cantidad;
        areaTotal += area;
        totalEstimado += precio;
      }
    });

    // Calcular días en proceso
    let diasEnProceso = 0;
    if (proyecto.createdAt) {
      const fechaCreacion = new Date(proyecto.createdAt);
      const fechaActual = new Date();
      const diferencia = fechaActual - fechaCreacion;
      diasEnProceso = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    }

    return {
      totalMedidas: proyecto.medidas.length,
      areaTotal: areaTotal.toFixed(2),
      totalPiezas,
      totalEstimado: totalEstimado,
      diasEnProceso
    };
  };

  const totales = calcularTotales();

  const formatearDimension = (ancho, alto) => {
    if (!ancho || !alto) return '-';
    return `${ancho} × ${alto} m`;
  };

  const formatearArea = (ancho, alto, cantidad = 1) => {
    if (!ancho || !alto) return '-';
    const area = ancho * alto * cantidad;
    return `${area.toFixed(2)} m²`;
  };

  const obtenerColorProducto = (producto) => {
    const colores = {
      'screen': '#17a2b8',
      'blackout': '#343a40',
      'toldo': '#fd7e14',
      'cortina': '#6f42c1'
    };

    const tipo = producto?.toLowerCase() || '';
    for (const [key, color] of Object.entries(colores)) {
      if (tipo.includes(key)) return color;
    }
    return '#6c757d';
  };

  return (
    <Box>
      {/* Dashboard de Indicadores */}
      <Box 
        sx={{ 
          bgcolor: 'rgba(248, 250, 252, 1)', // slate-50
          p: 2,
          borderRadius: '16px',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          mb: 3
        }}
      >
        <Grid container spacing={2}>
          <Grid item xs={6} md={3}>
            <KpiCard
              icon="Grid"
              label="Partidas"
              value={totales.totalMedidas}
              tooltip="Número total de partidas en el levantamiento"
              color="#2196f3"
              animate={true}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <KpiCard
              icon="Ruler"
              label="Área Total"
              value={`${totales.areaTotal} m²`}
              tooltip="Área total de todas las piezas"
              color="#4caf50"
              animate={false}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <KpiCard
              icon="Package"
              label="Total de Piezas"
              value={totales.totalPiezas || 0}
              tooltip="Cantidad total de piezas en el levantamiento"
              color="#ff9800"
              animate={false}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <KpiCard
              icon="Clock"
              label="Tiempo en Proceso"
              value={`${totales.diasEnProceso || 0} días`}
              tooltip="Días transcurridos desde la creación del proyecto"
              color="#9c27b0"
              animate={false}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Información general del levantamiento */}
      {proyecto.observaciones && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📝 Observaciones Generales
            </Typography>
            <Typography variant="body1">
              {proyecto.observaciones}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Medidas detalladas */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              📏 Medidas del Levantamiento
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<StraightenIcon />}
                onClick={abrirModalSelector}
                sx={{
                  bgcolor: '#2196f3',
                  '&:hover': { bgcolor: '#1976d2' },
                  fontWeight: 'bold',
                  fontSize: '1rem'
                }}
              >
                📏 Agregar Medidas
              </Button>
            </Box>
          </Box>

          {(() => {
            // Leer directamente de proyecto.medidas donde el backend guarda todo
            const medidas = proyecto.medidas || [];
            
            console.log('🔍 Levantamientos encontrados:', medidas.length);
            if (medidas.length > 0) {
              console.log('  Primera medida completa:', JSON.stringify(medidas[0], null, 2));
              console.log('  Piezas de la primera medida:', medidas[0].piezas);
              if (medidas[0].piezas && medidas[0].piezas.length > 0) {
                console.log('  Primera pieza:', medidas[0].piezas[0]);
                console.log('  areaTotal de primera pieza:', medidas[0].piezas[0].areaTotal);
                console.log('  medidas de primera pieza:', medidas[0].piezas[0].medidas);
              }
            }
            
            if (medidas.length === 0) {
              return (
                <Alert severity="info">
                  No hay levantamiento registrado en este proyecto.
                </Alert>
              );
            }
            
            return (
              <Box>
                {medidas.map((medida, index) => {
                // Detectar si es un levantamiento nuevo con partidas o medida antigua
                const esLevantamientoConPartidas = medida.tipo === 'levantamiento' && medida.piezas && medida.piezas.length > 0;
                
                if (esLevantamientoConPartidas) {
                  // RENDERIZAR LEVANTAMIENTO NUEVO CON PARTIDAS
                  return (
                    <Box key={index} sx={{ mb: 3 }}>
                      {/* Información general del levantamiento */}
                      <Paper sx={{ p: 2, mb: 2, bgcolor: '#f5f5f5' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="h6">
                            📋 {medida.nombreLevantamiento || `Levantamiento ${index + 1}`}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<EditIcon />}
                              onClick={() => {
                                console.log('✏️ Editando medida:', medida);
                                setMedidaEditando({
                                  personaVisita: medida.personaVisita || '',
                                  quienRecibe: medida.quienRecibe || '',
                                  observaciones: medida.observacionesGenerales || '',
                                  linkVideo: medida.linkVideo || '',
                                  fotosGenerales: medida.fotosGenerales || [],
                                  piezas: medida.piezas || []
                                });
                                setDialogoPartidas(true);
                              }}
                              sx={{
                                borderColor: '#D4AF37',
                                color: '#D4AF37',
                                '&:hover': { 
                                  borderColor: '#B8941F',
                                  bgcolor: 'rgba(212, 175, 55, 0.1)'
                                }
                              }}
                            >
                              Editar
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              startIcon={<DeleteIcon />}
                              onClick={() => eliminarMedida(index)}
                            >
                              Eliminar
                            </Button>
                          </Box>
                        </Box>
                        <Grid container spacing={2}>
                          {medida.personaVisita && (
                            <Grid item xs={12} sm={6} md={3}>
                              <Typography variant="body2">
                                <strong>Persona que visitó:</strong> {medida.personaVisita}
                              </Typography>
                            </Grid>
                          )}
                          {medida.quienRecibe && (
                            <Grid item xs={12} sm={6} md={3}>
                              <Typography variant="body2">
                                <strong>Quien recibe:</strong> {medida.quienRecibe}
                              </Typography>
                            </Grid>
                          )}
                          {medida.fechaCotizacion && (
                            <Grid item xs={12} sm={6} md={3}>
                              <Typography variant="body2">
                                <strong>Fecha cotización:</strong> {new Date(medida.fechaCotizacion).toLocaleDateString()}
                              </Typography>
                            </Grid>
                          )}
                        </Grid>
                        {medida.observacionesGenerales && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            <strong>Observaciones:</strong> {medida.observacionesGenerales}
                          </Typography>
                        )}
                        
                        {/* Link de Video */}
                        {medida.linkVideo && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <strong>🎥 Video del Levantamiento:</strong>
                            </Typography>
                            <a 
                              href={medida.linkVideo} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{ color: '#1976d2', textDecoration: 'none' }}
                            >
                              {medida.linkVideo}
                            </a>
                          </Box>
                        )}
                      </Paper>

                      {/* Fotos Generales - Acordeón Desplegable */}
                      {(() => {
                        console.log('📸 Verificando fotos en medida:', medida.fotosGenerales);
                        return medida.fotosGenerales && medida.fotosGenerales.length > 0;
                      })() && (
                        <Accordion sx={{ mb: 2, border: '1px solid #e0e0e0', borderRadius: '8px !important', '&:before': { display: 'none' } }}>
                          <AccordionSummary 
                            expandIcon={<ExpandMoreIcon />}
                            sx={{ 
                              borderRadius: '8px',
                              bgcolor: 'rgba(33, 150, 243, 0.05)',
                              '&:hover': { bgcolor: 'rgba(33, 150, 243, 0.1)' }
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <PhotoIcon sx={{ color: '#2196f3' }} />
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                📸 Fotos Generales ({medida.fotosGenerales.length})
                              </Typography>
                            </Box>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', p: 1 }}>
                              {medida.fotosGenerales.map((foto, fotoIndex) => (
                                <Box key={fotoIndex} sx={{ width: 180 }}>
                                  <img
                                    src={`http://localhost:5001${foto.url}`}
                                    alt={foto.descripcion || `Foto ${fotoIndex + 1}`}
                                    style={{
                                      width: '100%',
                                      height: 180,
                                      objectFit: 'cover',
                                      borderRadius: 8,
                                      border: '2px solid #ddd',
                                      cursor: 'pointer',
                                      transition: 'transform 0.2s'
                                    }}
                                    onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                                    onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                                    onClick={() => window.open(`http://localhost:5001${foto.url}`, '_blank')}
                                  />
                                  {foto.descripcion && (
                                    <Typography 
                                      variant="caption" 
                                      sx={{ 
                                        display: 'block', 
                                        mt: 1, 
                                        textAlign: 'center',
                                        fontWeight: 600,
                                        color: 'rgba(30, 41, 59, 1)'
                                      }}
                                    >
                                      {foto.descripcion}
                                    </Typography>
                                  )}
                                </Box>
                              ))}
                            </Box>
                          </AccordionDetails>
                        </Accordion>
                      )}

                      {/* Partidas */}
                      {medida.piezas.map((pieza, piezaIndex) => (
                        <Accordion key={piezaIndex} sx={{ mb: 1.5, border: '1px solid rgba(226, 232, 240, 1)', borderRadius: '12px !important', '&:before': { display: 'none' } }}>
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
                                  label={pieza.productoLabel || pieza.producto || 'Sin producto'}
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
                                {pieza.cantidad || 1} {(pieza.cantidad || 1) === 1 ? 'pieza' : 'piezas'} • {pieza.areaTotal?.toFixed(2) || 0} m²
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
                                        {pieza.areaTotal?.toFixed(2) || 0} m²
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
                                    {pieza.cantidad || pieza.medidas?.length || 0} {(pieza.cantidad || pieza.medidas?.length || 0) === 1 ? 'pieza' : 'piezas'} • {((pieza.medidas || []).reduce((sum, m) => sum + (m.area || 0), 0)).toFixed(2)} m² totales
                                  </Typography>
                                </Box>
                                {(pieza.medidas || []).map((medidaIndiv, idx) => (
                                  <PiezaCard
                                    key={idx}
                                    numero={idx + 1}
                                    ancho={medidaIndiv.ancho}
                                    alto={medidaIndiv.alto}
                                    area={medidaIndiv.area || 0}
                                    producto={medidaIndiv.productoLabel || medidaIndiv.producto}
                                    color={medidaIndiv.color}
                                    modeloCodigo={pieza.modeloCodigo}
                                    galeria={medidaIndiv.galeria}
                                    tipoControl={medidaIndiv.tipoControl}
                                    tipoMando={medidaIndiv.tipoMando} // Nuevo prop
                                    caida={medidaIndiv.caida}
                                    tipoInstalacion={medidaIndiv.tipoInstalacion}
                                    tipoFijacion={medidaIndiv.tipoFijacion}
                                    modoOperacion={medidaIndiv.modoOperacion}
                                    detalleTecnico={medidaIndiv.detalleTecnico}
                                    sistema={medidaIndiv.sistema}
                                    telaMarca={medidaIndiv.telaMarca}
                                    baseTabla={medidaIndiv.baseTabla}
                                    observacionesTecnicas={medidaIndiv.observacionesTecnicas}
                                    galeriaCompartida={medidaIndiv.galeriaCompartida}
                                    grupoGaleria={medidaIndiv.grupoGaleria}
                                    sistemaSkyline={medidaIndiv.sistemaSkyline}
                                    motorCompartido={medidaIndiv.motorCompartido}
                                    grupoMotor={medidaIndiv.grupoMotor}
                                    piezasPorMotor={medidaIndiv.piezasPorMotor}
                                  />
                                ))}
                              </Grid>

                              {/* Observaciones de la partida */}
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
                            </Grid>
                          </AccordionDetails>
                        </Accordion>
                      ))}
                    </Box>
                  );
                }
                
                // RENDERIZAR MEDIDA ANTIGUA (formato simple)
                return (
                <Accordion key={index} sx={{ mb: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mr: 2 }}>
                        📍 {medida.ubicacion || `Medida ${index + 1}`}
                      </Typography>
                      <Chip
                        label={medida.producto || 'Sin producto'}
                        size="small"
                        sx={{
                          bgcolor: obtenerColorProducto(medida.producto),
                          color: 'white',
                          mr: 2
                        }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {formatearDimension(medida.ancho, medida.alto)} • 
                        {medida.cantidad || 1} piezas • 
                        {formatearArea(medida.ancho, medida.alto, medida.cantidad)}
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      {/* Información básica */}
                      <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            📐 Dimensiones
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Typography variant="body2">
                              <strong>Ancho:</strong> {medida.ancho || '-'} m
                            </Typography>
                            <Typography variant="body2">
                              <strong>Alto:</strong> {medida.alto || '-'} m
                            </Typography>
                            <Typography variant="body2">
                              <strong>Cantidad:</strong> {medida.cantidad || 1} piezas
                            </Typography>
                            <Typography variant="body2">
                              <strong>Área:</strong> {formatearArea(medida.ancho, medida.alto, medida.cantidad)}
                            </Typography>
                          </Box>
                        </Paper>
                      </Grid>

                      {/* Información del producto */}
                      <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            🏷️ Producto
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Typography variant="body2">
                              <strong>Producto:</strong> {medida.producto || '-'}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Color:</strong> {medida.color || '-'}
                            </Typography>
                            {medida.telaMarca && (
                              <Typography variant="body2">
                                <strong>Tela/Marca:</strong> {medida.telaMarca}
                              </Typography>
                            )}
                          </Box>
                        </Paper>
                      </Grid>

                      {/* Información técnica */}
                      {(medida.tipoControl || medida.orientacion || medida.tipoInstalacion) && (
                        <Grid item xs={12}>
                          <Paper sx={{ p: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              🔧 Especificaciones Técnicas
                            </Typography>
                            <Grid container spacing={2}>
                              {medida.tipoControl && (
                                <Grid item xs={6} md={3}>
                                  <Typography variant="body2">
                                    <strong>Control:</strong> {medida.tipoControl}
                                  </Typography>
                                </Grid>
                              )}
                              {medida.orientacion && (
                                <Grid item xs={6} md={3}>
                                  <Typography variant="body2">
                                    <strong>Orientación:</strong> {medida.orientacion}
                                  </Typography>
                                </Grid>
                              )}
                              {medida.tipoInstalacion && (
                                <Grid item xs={6} md={3}>
                                  <Typography variant="body2">
                                    <strong>Instalación:</strong> {medida.tipoInstalacion}
                                  </Typography>
                                </Grid>
                              )}
                              {medida.sistema && (
                                <Grid item xs={6} md={3}>
                                  <Typography variant="body2">
                                    <strong>Sistema:</strong> {medida.sistema}
                                  </Typography>
                                </Grid>
                              )}
                            </Grid>
                          </Paper>
                        </Grid>
                      )}

                      {/* Información de toldos */}
                      {medida.esToldo && (
                        <Grid item xs={12} md={6}>
                          <Paper sx={{ p: 2, bgcolor: '#fff3cd' }}>
                            <Typography variant="subtitle2" gutterBottom>
                              ☂️ Información de Toldo
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              <Typography variant="body2">
                                <strong>Tipo:</strong> {medida.tipoToldo || '-'}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Kit:</strong> {medida.kitModelo || '-'}
                              </Typography>
                              {medida.kitPrecio && (
                                <Typography variant="body2">
                                  <strong>Precio Kit:</strong> ${medida.kitPrecio.toLocaleString()}
                                </Typography>
                              )}
                            </Box>
                          </Paper>
                        </Grid>
                      )}

                      {/* Información de motorización */}
                      {medida.motorizado && (
                        <Grid item xs={12} md={6}>
                          <Paper sx={{ p: 2, bgcolor: '#d1ecf1' }}>
                            <Typography variant="subtitle2" gutterBottom>
                              ⚡ Motorización
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              <Typography variant="body2">
                                <strong>Motor:</strong> {medida.motorModelo || '-'}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Control:</strong> {medida.controlModelo || '-'}
                              </Typography>
                              {medida.motorPrecio && (
                                <Typography variant="body2">
                                  <strong>Precio Motor:</strong> ${medida.motorPrecio.toLocaleString()}
                                </Typography>
                              )}
                              {medida.controlPrecio && (
                                <Typography variant="body2">
                                  <strong>Precio Control:</strong> ${medida.controlPrecio.toLocaleString()}
                                </Typography>
                              )}
                            </Box>
                          </Paper>
                        </Grid>
                      )}

                      {/* Observaciones específicas */}
                      {medida.observaciones && (
                        <Grid item xs={12}>
                          <Paper sx={{ p: 2, bgcolor: '#f8f9fa' }}>
                            <Typography variant="subtitle2" gutterBottom>
                              💬 Observaciones
                            </Typography>
                            <Typography variant="body2">
                              {medida.observaciones}
                            </Typography>
                          </Paper>
                        </Grid>
                      )}

                      {/* Fotos */}
                      {medida.fotoUrls && medida.fotoUrls.length > 0 && (
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" gutterBottom>
                            📸 Fotos
                          </Typography>
                          <ImageList sx={{ width: '100%', height: 200 }} cols={4} rowHeight={180}>
                            {medida.fotoUrls.map((foto, fotoIndex) => (
                              <ImageListItem key={fotoIndex}>
                                <img
                                  src={foto}
                                  alt={`Foto ${fotoIndex + 1}`}
                                  loading="lazy"
                                  style={{ objectFit: 'cover' }}
                                />
                                <ImageListItemBar
                                  title={`Foto ${fotoIndex + 1}`}
                                  subtitle={medida.ubicacion}
                                />
                              </ImageListItem>
                            ))}
                          </ImageList>
                        </Grid>
                      )}

                      {/* Botones de acción */}
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            variant="outlined"
                            startIcon={<EditIcon />}
                            onClick={() => abrirDialogoMedida({ ...medida, index })}
                            size="small"
                          >
                            Editar Medida
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => eliminarMedida(index)}
                            size="small"
                          >
                            Eliminar
                          </Button>
                        </Box>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
                );
              })}
            </Box>
            );
          })()}
        </CardContent>
      </Card>

      {/* Modal para agregar/editar medidas */}
      <AgregarMedidaProyectoModal
        open={dialogoMedida}
        onClose={cerrarDialogoMedida}
        proyecto={proyecto}
        onActualizar={onActualizar}
        medidaEditando={medidaEditando}
      />

      {/* Modal para agregar/editar partidas */}
      <AgregarMedidaPartidasModal
        open={dialogoPartidas}
        onClose={cerrarDialogoPartidas}
        proyecto={proyecto}
        onActualizar={onActualizar}
        medidaEditando={medidaEditando}
      />

      {/* Modal para Cotización en Vivo */}
      <AgregarEtapaModal
        open={dialogoCotizacion}
        onClose={cerrarCotizacionEnVivo}
        prospecto={{
          _id: proyecto._id,
          nombre: proyecto.cliente?.nombre || proyecto.nombre,
          telefono: proyecto.cliente?.telefono || '',
          email: proyecto.cliente?.email || '',
          direccion: proyecto.cliente?.direccion || '',
          etapa: 'cotizacion'
        }}
        onSaved={(mensaje) => {
          console.log('Cotización guardada:', mensaje);
          onActualizar();
        }}
        modoProyecto={true}
        datosProyecto={proyecto}
      />

      {/* Modal Selector Inteligente - Rediseñado */}
      <Dialog 
        open={modalSelectorAbierto} 
        onClose={cerrarModalSelector}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
          color: 'white',
          textAlign: 'center',
          py: 4,
          position: 'relative',
          overflow: 'hidden'
        }}>
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ fontSize: '2.5rem', mb: 1 }}>📏</Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, letterSpacing: '-0.5px' }}>
              Agregar Medidas
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.95, fontWeight: 400 }}>
              Selecciona el tipo de levantamiento según tu necesidad
            </Typography>
          </Box>
          {/* Decoración de fondo */}
          <Box sx={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.1)',
            zIndex: 0
          }} />
        </DialogTitle>
        
        <DialogContent sx={{ p: 4, bgcolor: '#f8fafc' }}>
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            {/* Opción: Sin Precios (Levantamiento Técnico) */}
            <Grid item xs={12} md={6}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  border: opcionSeleccionada === 'sin_precios' ? '3px solid #D4AF37' : '2px solid #e2e8f0',
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  height: '100%',
                  boxShadow: opcionSeleccionada === 'sin_precios' 
                    ? '0 8px 24px rgba(212, 175, 55, 0.3)' 
                    : '0 2px 8px rgba(0,0,0,0.08)',
                  transform: opcionSeleccionada === 'sin_precios' ? 'scale(1.02)' : 'scale(1)',
                  '&:hover': { 
                    transform: 'translateY(-6px) scale(1.02)',
                    boxShadow: '0 12px 32px rgba(59, 130, 246, 0.2)',
                    borderColor: '#3b82f6'
                  }
                }}
                onClick={() => seleccionarTipoMedida('sin_precios')}
              >
                <CardContent sx={{ p: 3.5 }}>
                  {/* Icono y Badge */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ 
                      bgcolor: '#eff6ff', 
                      p: 2, 
                      borderRadius: 2,
                      display: 'inline-flex'
                    }}>
                      <Box sx={{ fontSize: '2.5rem' }}>📋</Box>
                    </Box>
                    {opcionSeleccionada === 'sin_precios' && (
                      <Chip 
                        label="Seleccionado" 
                        size="small"
                        sx={{ 
                          bgcolor: '#D4AF37', 
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.7rem'
                        }} 
                      />
                    )}
                  </Box>
                  
                  {/* Título */}
                  <Typography variant="h5" sx={{ color: '#1e40af', mb: 1.5, fontWeight: 700 }}>
                    Sin Precios
                  </Typography>
                  
                  {/* Descripción */}
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, lineHeight: 1.6 }}>
                    Levantamiento técnico con medidas y especificaciones
                  </Typography>
                  
                  {/* Badge destacado */}
                  <Box sx={{ 
                    bgcolor: '#dbeafe', 
                    p: 1.5, 
                    borderRadius: 2,
                    border: '1px solid #93c5fd',
                    mb: 2.5
                  }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e40af', fontSize: '0.85rem' }}>
                      ✓ Solo medidas técnicas • Sin cotización
                    </Typography>
                  </Box>
                  
                  {/* Lista de características */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#3b82f6' }} />
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                        Partidas con medidas exactas
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#3b82f6' }} />
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                        Especificaciones técnicas detalladas
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#3b82f6' }} />
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                        Fotos y observaciones del sitio
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Opción: Con Precios (Cotización en Vivo) */}
            <Grid item xs={12} md={6}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  border: opcionSeleccionada === 'con_precios' ? '3px solid #D4AF37' : '2px solid #e2e8f0',
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  height: '100%',
                  boxShadow: opcionSeleccionada === 'con_precios' 
                    ? '0 8px 24px rgba(212, 175, 55, 0.3)' 
                    : '0 2px 8px rgba(0,0,0,0.08)',
                  transform: opcionSeleccionada === 'con_precios' ? 'scale(1.02)' : 'scale(1)',
                  '&:hover': { 
                    transform: 'translateY(-6px) scale(1.02)',
                    boxShadow: '0 12px 32px rgba(34, 197, 94, 0.2)',
                    borderColor: '#22c55e'
                  }
                }}
                onClick={() => seleccionarTipoMedida('con_precios')}
              >
                <CardContent sx={{ p: 3.5 }}>
                  {/* Icono y Badge */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ 
                      bgcolor: '#f0fdf4', 
                      p: 2, 
                      borderRadius: 2,
                      display: 'inline-flex'
                    }}>
                      <Box sx={{ fontSize: '2.5rem' }}>💰</Box>
                    </Box>
                    {opcionSeleccionada === 'con_precios' && (
                      <Chip 
                        label="Seleccionado" 
                        size="small"
                        sx={{ 
                          bgcolor: '#D4AF37', 
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.7rem'
                        }} 
                      />
                    )}
                  </Box>
                  
                  {/* Título */}
                  <Typography variant="h5" sx={{ color: '#15803d', mb: 1.5, fontWeight: 700 }}>
                    Con Precios
                  </Typography>
                  
                  {/* Descripción */}
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, lineHeight: 1.6 }}>
                    Levantamiento con cotización y precios incluidos
                  </Typography>
                  
                  {/* Badge destacado */}
                  <Box sx={{ 
                    bgcolor: '#dcfce7', 
                    p: 1.5, 
                    borderRadius: 2,
                    border: '1px solid #86efac',
                    mb: 2.5
                  }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#15803d', fontSize: '0.85rem' }}>
                      ✓ Cotización completa • Precios en tiempo real
                    </Typography>
                  </Box>
                  
                  {/* Lista de características */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#22c55e' }} />
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                        Medidas y especificaciones técnicas
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#22c55e' }} />
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                        Precios por m² y cálculos automáticos
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#22c55e' }} />
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                        Facturación, descuentos, IVA y totales
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, justifyContent: 'center', bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
          <Button 
            onClick={cerrarModalSelector}
            variant="outlined"
            sx={{ 
              minWidth: 140,
              borderRadius: 2,
              borderColor: '#cbd5e1',
              color: '#64748b',
              fontWeight: 600,
              py: 1,
              '&:hover': {
                borderColor: '#94a3b8',
                bgcolor: '#f1f5f9'
              }
            }}
          >
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Nuevo Modal Unificado de Proyectos - FASE 1 */}
      <AgregarMedidasProyectoModal
        open={nuevoModalAbierto}
        onClose={() => setNuevoModalAbierto(false)}
        proyecto={proyecto}
        onActualizar={onActualizar}
        conPrecios={nuevoModalConPrecios}
      />
    </Box>
  );
};

export default LevantamientoTab;

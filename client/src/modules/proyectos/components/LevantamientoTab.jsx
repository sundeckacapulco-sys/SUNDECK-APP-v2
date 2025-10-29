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
  ImageListItemBar
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
import axiosConfig from '../../../config/axios';
import PiezaCard from './PiezaCard';
import KpiCard from './KpiCard';

const LevantamientoTab = ({ proyecto, onActualizar }) => {
  const [dialogoMedida, setDialogoMedida] = useState(false);
  const [medidaEditando, setMedidaEditando] = useState(null);
  const [dialogoCotizacion, setDialogoCotizacion] = useState(false);
  const [dialogoPartidas, setDialogoPartidas] = useState(false);

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

  // Función para eliminar levantamiento/medida
  const eliminarMedida = async (index) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este levantamiento? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const nuevasMedidas = proyecto.medidas.filter((_, i) => i !== index);
      
      await axiosConfig.put(`/proyectos/${proyecto._id}`, {
        medidas: nuevasMedidas
      });

      onActualizar();
    } catch (error) {
      console.error('Error eliminando medida:', error);
      alert('Error al eliminar el levantamiento');
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
              icon="DollarSign"
              label="Total Estimado"
              value={`$${totales.totalEstimado?.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`}
              tooltip="Costo estimado total del proyecto"
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
              {/* Botón de Cotización en Vivo */}
              <Button
                variant="contained"
                startIcon={<MonetizationOnIcon />}
                onClick={abrirCotizacionEnVivo}
                sx={{
                  bgcolor: '#4caf50',
                  '&:hover': { bgcolor: '#45a049' },
                  fontWeight: 'bold'
                }}
                disabled={!proyecto.medidas || proyecto.medidas.length === 0}
              >
                Cotización en Vivo
              </Button>
              
              {/* Botón de Agregar Partidas */}
              <Button
                variant="contained"
                startIcon={<StraightenIcon />}
                onClick={() => abrirDialogoPartidas()}
                sx={{
                  bgcolor: '#2196f3',
                  '&:hover': { bgcolor: '#1976d2' },
                  fontWeight: 'bold'
                }}
              >
                Agregar Partidas
              </Button>
              
              {/* Botón de Agregar Medida (antiguo) */}
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => abrirDialogoMedida()}
                sx={{ borderColor: '#D4AF37', color: '#D4AF37' }}
              >
                Medida Simple
              </Button>
            </Box>
          </Box>

          {!proyecto.medidas || proyecto.medidas.length === 0 ? (
            <Alert severity="info">
              No hay medidas registradas en este proyecto.
            </Alert>
          ) : (
            <Box>
              {proyecto.medidas.map((medida, index) => {
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
                            📋 Levantamiento {index + 1}
                          </Typography>
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
                      </Paper>

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
                                    caida={medidaIndiv.caida}
                                    tipoInstalacion={medidaIndiv.tipoInstalacion}
                                    tipoFijacion={medidaIndiv.tipoFijacion}
                                    modoOperacion={medidaIndiv.modoOperacion}
                                    detalleTecnico={medidaIndiv.detalleTecnico}
                                    sistema={medidaIndiv.sistema}
                                    telaMarca={medidaIndiv.telaMarca}
                                    baseTabla={medidaIndiv.baseTabla}
                                    observacionesTecnicas={medidaIndiv.observacionesTecnicas}
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
          )}
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
    </Box>
  );
};

export default LevantamientoTab;

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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
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
  Photo as PhotoIcon,
  Straighten as StraightenIcon,
  Build as BuildIcon
} from '@mui/icons-material';

const LevantamientoTab = ({ proyecto, onActualizar }) => {
  const [dialogoMedida, setDialogoMedida] = useState(false);
  const [medidaEditando, setMedidaEditando] = useState(null);

  // Calcular totales
  const calcularTotales = () => {
    if (!proyecto.medidas || proyecto.medidas.length === 0) {
      return { totalMedidas: 0, areaTotal: 0, totalPiezas: 0 };
    }

    let totalPiezas = 0;
    let areaTotal = 0;

    proyecto.medidas.forEach(medida => {
      const cantidad = medida.cantidad || 1;
      const area = (medida.ancho || 0) * (medida.alto || 0) * cantidad;
      
      totalPiezas += cantidad;
      areaTotal += area;
    });

    return {
      totalMedidas: proyecto.medidas.length,
      areaTotal: areaTotal.toFixed(2),
      totalPiezas
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
      {/* Resumen del levantamiento */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <StraightenIcon sx={{ fontSize: 40, color: '#D4AF37', mb: 1 }} />
              <Typography variant="h4" color="primary">
                {totales.totalMedidas}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Partidas
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <BuildIcon sx={{ fontSize: 40, color: '#D4AF37', mb: 1 }} />
              <Typography variant="h4" color="primary">
                {totales.totalPiezas}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Piezas Total
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <PhotoIcon sx={{ fontSize: 40, color: '#D4AF37', mb: 1 }} />
              <Typography variant="h4" color="primary">
                {totales.areaTotal}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                m² Total
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setDialogoMedida(true)}
              sx={{ bgcolor: '#D4AF37', '&:hover': { bgcolor: '#B8941F' } }}
            >
              Agregar Medida
            </Button>
          </Box>

          {!proyecto.medidas || proyecto.medidas.length === 0 ? (
            <Alert severity="info">
              No hay medidas registradas en este proyecto.
            </Alert>
          ) : (
            <Box>
              {proyecto.medidas.map((medida, index) => (
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

                      {/* Botón de editar */}
                      <Grid item xs={12}>
                        <Button
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={() => {
                            setMedidaEditando({ ...medida, index });
                            setDialogoMedida(true);
                          }}
                          size="small"
                        >
                          Editar Medida
                        </Button>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Diálogo para agregar/editar medida */}
      <Dialog 
        open={dialogoMedida} 
        onClose={() => {
          setDialogoMedida(false);
          setMedidaEditando(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {medidaEditando ? 'Editar Medida' : 'Agregar Nueva Medida'}
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Esta funcionalidad estará disponible en la próxima actualización.
            Por ahora, las medidas se gestionan desde el módulo de prospectos.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setDialogoMedida(false);
            setMedidaEditando(null);
          }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LevantamientoTab;

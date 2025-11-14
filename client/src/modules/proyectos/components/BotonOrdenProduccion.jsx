import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Divider
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Inventory as InventoryIcon
} from '@mui/icons-material';
import axiosConfig from '../../../config/axios';

const BotonOrdenProduccion = ({ proyectoId, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);

  const generarOrden = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axiosConfig.post(`/fabricacion/orden-produccion/${proyectoId}`);
      
      setResultado(response.data);
      setDialogoAbierto(true);
      
      if (onSuccess) {
        onSuccess(response.data);
      }
      
    } catch (err) {
      const errorData = err.response?.data;
      setError(errorData);
      setDialogoAbierto(true);
    } finally {
      setLoading(false);
    }
  };

  const cerrarDialogo = () => {
    setDialogoAbierto(false);
    setResultado(null);
    setError(null);
  };

  const etapas = [
    'Verificación de Stock',
    'Reserva de Materiales',
    'Optimización de Cortes',
    'Registro de Salidas',
    'Guardado de Sobrantes'
  ];

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PlayIcon />}
        onClick={generarOrden}
        disabled={loading}
        size="large"
      >
        {loading ? 'Generando...' : 'Generar Orden de Producción'}
      </Button>

      <Dialog
        open={dialogoAbierto}
        onClose={cerrarDialogo}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {error ? (
              <>
                <ErrorIcon color="error" />
                <Typography variant="h6">Error en Orden de Producción</Typography>
              </>
            ) : (
              <>
                <CheckIcon color="success" />
                <Typography variant="h6">Orden de Producción Generada</Typography>
              </>
            )}
          </Box>
        </DialogTitle>

        <DialogContent>
          {/* Error: Stock Insuficiente */}
          {error && (
            <Box>
              <Alert severity="error" sx={{ mb: 2 }}>
                <strong>{error.message}</strong>
              </Alert>

              {error.faltantes && error.faltantes.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                    Materiales Faltantes:
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Código</TableCell>
                          <TableCell>Descripción</TableCell>
                          <TableCell align="right">Necesario</TableCell>
                          <TableCell align="right">Disponible</TableCell>
                          <TableCell align="right">Faltante</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {error.faltantes.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.codigo}</TableCell>
                            <TableCell>{item.descripcion || item.tipo}</TableCell>
                            <TableCell align="right">{item.necesario}</TableCell>
                            <TableCell align="right">{item.disponible}</TableCell>
                            <TableCell align="right">
                              <Chip label={item.faltante} color="error" size="small" />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Alert severity="info" sx={{ mt: 2 }}>
                    <strong>Acción requerida:</strong> Realiza una compra de los materiales faltantes antes de generar la orden.
                  </Alert>
                </Box>
              )}
            </Box>
          )}

          {/* Éxito: Orden Generada */}
          {resultado && resultado.success && (
            <Box>
              <Alert severity="success" sx={{ mb: 3 }}>
                {resultado.message}
              </Alert>

              {/* Resumen */}
              <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="h6" gutterBottom>
                  📊 Resumen de la Orden
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Materiales Usados:
                    </Typography>
                    <Typography variant="h6">
                      {resultado.data?.resumen?.materialesUsados || 0}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Sobrantes Generados:
                    </Typography>
                    <Typography variant="h6">
                      {resultado.data?.resumen?.sobrantesGenerados || 0}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Barras Nuevas:
                    </Typography>
                    <Typography variant="h6">
                      {resultado.data?.resumen?.barrasNuevas || 0}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Sobrantes Reutilizados:
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      {resultado.data?.resumen?.sobrantesReutilizados || 0}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Eficiencia Global:
                    </Typography>
                    <Typography variant="h5" color="primary">
                      {resultado.data?.resumen?.eficienciaGlobal || 0}%
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* Progreso de Etapas */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Etapas Completadas:
                </Typography>
                <Stepper activeStep={5} alternativeLabel>
                  {etapas.map((label) => (
                    <Step key={label} completed>
                      <StepLabel>{label}</StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </Box>

              {/* Materiales Utilizados */}
              {resultado.data?.materiales && resultado.data.materiales.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                    Materiales Utilizados:
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Código</TableCell>
                          <TableCell>Descripción</TableCell>
                          <TableCell>Tipo</TableCell>
                          <TableCell align="right">Cantidad</TableCell>
                          <TableCell>Unidad</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {resultado.data.materiales.map((material, index) => (
                          <TableRow key={index}>
                            <TableCell>{material.codigo}</TableCell>
                            <TableCell>{material.descripcion}</TableCell>
                            <TableCell>
                              <Chip label={material.tipo} size="small" />
                            </TableCell>
                            <TableCell align="right">{material.cantidad}</TableCell>
                            <TableCell>{material.unidad}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* Sobrantes Generados */}
              {resultado.data?.sobrantes && resultado.data.sobrantes.length > 0 && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                    ♻️ Sobrantes Guardados en Almacén:
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Etiqueta</TableCell>
                          <TableCell>Tipo</TableCell>
                          <TableCell align="right">Longitud</TableCell>
                          <TableCell>Estado</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {resultado.data.sobrantes.map((sobrante, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Typography variant="body2" fontFamily="monospace">
                                {sobrante.etiqueta}
                              </Typography>
                            </TableCell>
                            <TableCell>{sobrante.tipo}</TableCell>
                            <TableCell align="right">{sobrante.longitud}m</TableCell>
                            <TableCell>
                              <Chip label="Disponible" color="success" size="small" />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={cerrarDialogo} variant="contained">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// Falta importar Grid
import { Grid } from '@mui/material';

export default BotonOrdenProduccion;

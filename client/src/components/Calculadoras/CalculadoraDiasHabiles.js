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
  Paper,
  IconButton,
  Divider,
  Chip,
  Alert,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Close,
  CalendarToday,
  BusinessCenter,
  Weekend,
  Event,
  Add as AddIcon
} from '@mui/icons-material';

const CalculadoraDiasHabiles = ({ open, onClose }) => {
  const [fechaInicio, setFechaInicio] = useState('');
  const [diasHabiles, setDiasHabiles] = useState(15);
  const [fechaFinal, setFechaFinal] = useState('');
  const [incluirSabados, setIncluirSabados] = useState(false);
  const [diasFeriados, setDiasFeriados] = useState([]);
  const [nuevoFeriado, setNuevoFeriado] = useState('');
  const [resultados, setResultados] = useState(null);

  // Días feriados comunes en México (2024-2025)
  const feriadosComunes = [
    '2024-01-01', // Año Nuevo
    '2024-02-05', // Día de la Constitución
    '2024-03-18', // Natalicio de Benito Juárez
    '2024-05-01', // Día del Trabajo
    '2024-09-16', // Día de la Independencia
    '2024-11-18', // Revolución Mexicana
    '2024-12-25', // Navidad
    '2025-01-01', // Año Nuevo
    '2025-02-03', // Día de la Constitución
    '2025-03-17', // Natalicio de Benito Juárez
    '2025-05-01', // Día del Trabajo
    '2025-09-16', // Día de la Independencia
    '2025-11-17', // Revolución Mexicana
    '2025-12-25', // Navidad
  ];

  useEffect(() => {
    // Establecer fecha de inicio como hoy
    const hoy = new Date().toISOString().slice(0, 10);
    setFechaInicio(hoy);
    setDiasFeriados(feriadosComunes);
  }, []);

  useEffect(() => {
    if (fechaInicio && diasHabiles > 0) {
      calcularFechaEntrega();
    }
  }, [fechaInicio, diasHabiles, incluirSabados, diasFeriados]);

  const esDiaHabil = (fecha) => {
    const dia = fecha.getDay();
    const fechaStr = fecha.toISOString().slice(0, 10);
    
    // Domingo siempre es no hábil
    if (dia === 0) return false;
    
    // Sábado depende de la configuración
    if (dia === 6 && !incluirSabados) return false;
    
    // Verificar si es feriado
    if (diasFeriados.includes(fechaStr)) return false;
    
    return true;
  };

  const calcularFechaEntrega = () => {
    if (!fechaInicio || diasHabiles <= 0) return;

    const inicio = new Date(fechaInicio);
    let fechaActual = new Date(inicio);
    let diasContados = 0;
    let diasTotales = 0;
    let sabadosIncluidos = 0;
    let feriadosEncontrados = [];

    while (diasContados < diasHabiles) {
      fechaActual.setDate(fechaActual.getDate() + 1);
      diasTotales++;

      const fechaStr = fechaActual.toISOString().slice(0, 10);
      const dia = fechaActual.getDay();

      if (esDiaHabil(fechaActual)) {
        diasContados++;
        if (dia === 6) sabadosIncluidos++;
      } else {
        // Registrar por qué no es hábil
        if (dia === 0) {
          // Domingo
        } else if (dia === 6 && !incluirSabados) {
          // Sábado no incluido
        } else if (diasFeriados.includes(fechaStr)) {
          feriadosEncontrados.push(fechaStr);
        }
      }

      // Protección contra bucle infinito
      if (diasTotales > 365) break;
    }

    const fechaFinalCalculada = fechaActual.toISOString().slice(0, 10);
    setFechaFinal(fechaFinalCalculada);

    setResultados({
      fechaInicio: inicio.toISOString().slice(0, 10),
      fechaFinal: fechaFinalCalculada,
      diasHabiles: diasHabiles,
      diasTotales: diasTotales,
      sabadosIncluidos: sabadosIncluidos,
      feriadosEncontrados: feriadosEncontrados,
      incluirSabados: incluirSabados
    });
  };

  const agregarFeriado = () => {
    if (nuevoFeriado && !diasFeriados.includes(nuevoFeriado)) {
      setDiasFeriados([...diasFeriados, nuevoFeriado].sort());
      setNuevoFeriado('');
    }
  };

  const eliminarFeriado = (fecha) => {
    setDiasFeriados(diasFeriados.filter(f => f !== fecha));
  };

  const calcularRapido = (dias) => {
    setDiasHabiles(dias);
  };

  const formatearFecha = (fechaStr) => {
    const fecha = new Date(fechaStr + 'T00:00:00');
    return fecha.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const copiarResultado = () => {
    if (resultados) {
      const texto = `Fecha de entrega: ${formatearFecha(resultados.fechaFinal)} (${resultados.diasHabiles} días hábiles)`;
      navigator.clipboard.writeText(texto);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <CalendarToday color="primary" />
            <Typography variant="h6">Calculadora de Días Hábiles</Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          {/* Configuración básica */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              📅 Configuración
            </Typography>
            
            <TextField
              fullWidth
              label="Fecha de inicio"
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Días hábiles necesarios"
              type="number"
              value={diasHabiles}
              onChange={(e) => setDiasHabiles(parseInt(e.target.value) || 0)}
              inputProps={{ min: 1, max: 365 }}
              sx={{ mb: 2 }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={incluirSabados}
                  onChange={(e) => setIncluirSabados(e.target.checked)}
                />
              }
              label="Incluir sábados como días hábiles"
              sx={{ mb: 2 }}
            />

            {/* Botones de cálculo rápido */}
            <Typography variant="subtitle2" gutterBottom>
              🚀 Cálculo Rápido
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap" sx={{ mb: 2 }}>
              {[5, 10, 15, 20, 30].map((dias) => (
                <Button
                  key={dias}
                  variant={diasHabiles === dias ? "contained" : "outlined"}
                  size="small"
                  onClick={() => calcularRapido(dias)}
                >
                  {dias} días
                </Button>
              ))}
            </Box>
          </Grid>

          {/* Resultado */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              📋 Resultado
            </Typography>

            {resultados && (
              <Paper sx={{ p: 2, bgcolor: '#f8f9fa', border: '2px solid #2563eb' }}>
                <Typography variant="h6" sx={{ color: '#2563eb', mb: 2 }}>
                  🎯 Fecha de Entrega
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1a1a1a' }}>
                    {formatearFecha(resultados.fechaFinal)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {resultados.fechaFinal}
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Días hábiles:
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#28a745' }}>
                      {resultados.diasHabiles}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Días totales:
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#6c757d' }}>
                      {resultados.diasTotales}
                    </Typography>
                  </Grid>
                  
                  {resultados.sabadosIncluidos > 0 && (
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Sábados incluidos:
                      </Typography>
                      <Typography variant="h6" sx={{ color: '#ffc107' }}>
                        {resultados.sabadosIncluidos}
                      </Typography>
                    </Grid>
                  )}
                  
                  {resultados.feriadosEncontrados.length > 0 && (
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Feriados omitidos:
                      </Typography>
                      <Typography variant="h6" sx={{ color: '#dc3545' }}>
                        {resultados.feriadosEncontrados.length}
                      </Typography>
                    </Grid>
                  )}
                </Grid>

                {resultados.feriadosEncontrados.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Feriados en el período:
                    </Typography>
                    <Box display="flex" gap={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
                      {resultados.feriadosEncontrados.map((fecha) => (
                        <Chip
                          key={fecha}
                          label={fecha}
                          size="small"
                          color="error"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Paper>
            )}
          </Grid>

          {/* Gestión de feriados */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              🏖️ Días Feriados
            </Typography>

            <Box display="flex" gap={2} alignItems="center" sx={{ mb: 2 }}>
              <TextField
                label="Agregar feriado"
                type="date"
                value={nuevoFeriado}
                onChange={(e) => setNuevoFeriado(e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
              <Button
                variant="contained"
                onClick={agregarFeriado}
                startIcon={<AddIcon />}
                disabled={!nuevoFeriado}
              >
                Agregar
              </Button>
            </Box>

            <Box display="flex" gap={0.5} flexWrap="wrap" sx={{ maxHeight: 200, overflowY: 'auto' }}>
              {diasFeriados.map((fecha) => (
                <Chip
                  key={fecha}
                  label={fecha}
                  onDelete={() => eliminarFeriado(fecha)}
                  color="secondary"
                  size="small"
                  sx={{ mb: 0.5 }}
                />
              ))}
            </Box>
          </Grid>

          {/* Información útil */}
          <Grid item xs={12}>
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>💡 Consejos:</strong><br/>
                • Los domingos nunca se cuentan como días hábiles<br/>
                • Los sábados se pueden incluir opcionalmente<br/>
                • Los feriados nacionales están preconfigurados<br/>
                • Puedes agregar feriados específicos de tu empresa
              </Typography>
            </Alert>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Cerrar
        </Button>
        <Button 
          variant="contained" 
          onClick={copiarResultado}
          disabled={!resultados}
          startIcon={<Event />}
        >
          Copiar Fecha
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CalculadoraDiasHabiles;

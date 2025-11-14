import React from 'react';
import {
  Box,
  Card,
  Typography,
  TextField,
  Button,
  IconButton,
  Grid,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ContentCut as CutIcon
} from '@mui/icons-material';

const OptimizacionForm = ({ optimizacion, onChange }) => {
  const handleChangeHabilitada = (value) => {
    onChange({
      ...optimizacion,
      habilitada: value
    });
  };

  const handleChangeLongitudEstandar = (value) => {
    onChange({
      ...optimizacion,
      longitudEstandar: parseFloat(value) || 5.80
    });
  };

  const handleAddMaterial = () => {
    const nuevosMateriales = [
      ...(optimizacion?.materialesOptimizables || []),
      { tipo: '', longitudEstandar: 5.80, margenCorte: 0.005 }
    ];
    onChange({
      ...optimizacion,
      materialesOptimizables: nuevosMateriales
    });
  };

  const handleDeleteMaterial = (index) => {
    const nuevosMateriales = optimizacion.materialesOptimizables.filter((_, i) => i !== index);
    onChange({
      ...optimizacion,
      materialesOptimizables: nuevosMateriales
    });
  };

  const handleChangeMaterial = (index, field, value) => {
    const nuevosMateriales = [...optimizacion.materialesOptimizables];
    nuevosMateriales[index][field] = field === 'tipo' ? value : parseFloat(value) || 0;
    onChange({
      ...optimizacion,
      materialesOptimizables: nuevosMateriales
    });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CutIcon /> Optimización de Cortes
      </Typography>

      <Card sx={{ mb: 2, p: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={optimizacion?.habilitada || false}
                  onChange={(e) => handleChangeHabilitada(e.target.checked)}
                />
              }
              label="Habilitar optimización de cortes"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Longitud Estándar (metros)"
              type="number"
              value={optimizacion?.longitudEstandar || 5.80}
              onChange={(e) => handleChangeLongitudEstandar(e.target.value)}
              helperText="Longitud estándar de barras/tubos"
              inputProps={{ step: 0.1, min: 0 }}
            />
          </Grid>
        </Grid>
      </Card>

      <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
        Materiales Optimizables
      </Typography>

      {(optimizacion?.materialesOptimizables || []).map((material, index) => (
        <Card key={index} sx={{ mb: 2, p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Tipo de Material"
                placeholder="tubo, contrapeso, cofre..."
                value={material.tipo || ''}
                onChange={(e) => handleChangeMaterial(index, 'tipo', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Longitud Estándar (m)"
                type="number"
                value={material.longitudEstandar || 5.80}
                onChange={(e) => handleChangeMaterial(index, 'longitudEstandar', e.target.value)}
                inputProps={{ step: 0.1, min: 0 }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Margen de Corte (m)"
                type="number"
                value={material.margenCorte || 0.005}
                onChange={(e) => handleChangeMaterial(index, 'margenCorte', e.target.value)}
                inputProps={{ step: 0.001, min: 0 }}
                helperText="Ej: 0.005 = 5mm"
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <IconButton color="error" onClick={() => handleDeleteMaterial(index)}>
                <DeleteIcon />
              </IconButton>
            </Grid>
          </Grid>
        </Card>
      ))}

      <Button
        startIcon={<AddIcon />}
        variant="outlined"
        onClick={handleAddMaterial}
        disabled={!optimizacion?.habilitada}
      >
        Agregar Material Optimizable
      </Button>
    </Box>
  );
};

export default OptimizacionForm;

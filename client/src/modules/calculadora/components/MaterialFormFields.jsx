import React from 'react';
import {
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Switch,
  Chip,
  Box,
  Typography,
  Divider
} from '@mui/material';

const TIPOS_MATERIAL = [
  'Tela', 'Tubo', 'Cofre', 'Barra de Giro', 'Contrapeso', 
  'Soportes', 'Mecanismo', 'Motor', 'Cadena', 'Cable',
  'Tapas', 'Insertos', 'Cinta', 'Galería', 'Herrajes', 'Accesorios', 'Kit'
];

const UNIDADES = ['ml', 'm²', 'pza', 'kit', 'juego'];

const MaterialFormFields = ({ formMaterial, setFormMaterial }) => {
  const esTela = formMaterial.tipo === 'Tela';

  const handleChangeAnchosRollo = (value) => {
    const anchos = value.split(',').map(a => parseFloat(a.trim())).filter(a => !isNaN(a));
    setFormMaterial({ ...formMaterial, anchosRollo: anchos });
  };

  return (
    <Grid container spacing={2}>
      {/* Campos básicos */}
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Tipo de Material</InputLabel>
          <Select
            value={formMaterial.tipo}
            onChange={(e) => setFormMaterial({ ...formMaterial, tipo: e.target.value })}
            label="Tipo de Material"
          >
            {TIPOS_MATERIAL.map(tipo => (
              <MenuItem key={tipo} value={tipo}>{tipo}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Unidad</InputLabel>
          <Select
            value={formMaterial.unidad}
            onChange={(e) => setFormMaterial({ ...formMaterial, unidad: e.target.value })}
            label="Unidad"
          >
            {UNIDADES.map(unidad => (
              <MenuItem key={unidad} value={unidad}>{unidad}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Descripción"
          value={formMaterial.descripcion}
          onChange={(e) => setFormMaterial({ ...formMaterial, descripcion: e.target.value })}
          required
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Fórmula de Cálculo"
          value={formMaterial.formula}
          onChange={(e) => setFormMaterial({ ...formMaterial, formula: e.target.value })}
          required
          multiline
          rows={2}
          helperText="Ej: ancho + 0.10, alto * 2 + 0.25, Math.ceil(ancho / 0.60)"
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Condición (opcional)"
          value={formMaterial.condicion}
          onChange={(e) => setFormMaterial({ ...formMaterial, condicion: e.target.value })}
          multiline
          rows={2}
          helperText="Ej: motorizado === true, ancho > 2.5, galeria !== 'sin_galeria'"
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Precio Unitario"
          type="number"
          value={formMaterial.precioUnitario}
          onChange={(e) => setFormMaterial({ ...formMaterial, precioUnitario: parseFloat(e.target.value) || 0 })}
          inputProps={{ step: 0.01, min: 0 }}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControlLabel
          control={
            <Switch
              checked={formMaterial.activo}
              onChange={(e) => setFormMaterial({ ...formMaterial, activo: e.target.checked })}
            />
          }
          label="Activo"
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Observaciones"
          value={formMaterial.observaciones}
          onChange={(e) => setFormMaterial({ ...formMaterial, observaciones: e.target.value })}
          multiline
          rows={2}
        />
      </Grid>

      {/* Campos específicos para telas */}
      {esTela && (
        <>
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }}>
              <Chip label="Configuración de Tela" />
            </Divider>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={formMaterial.puedeRotar || false}
                  onChange={(e) => setFormMaterial({ ...formMaterial, puedeRotar: e.target.checked })}
                />
              }
              label="Permite Rotación"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Altura Máxima para Rotación (m)"
              type="number"
              value={formMaterial.alturaMaxRotacion || 2.80}
              onChange={(e) => setFormMaterial({ ...formMaterial, alturaMaxRotacion: parseFloat(e.target.value) || 2.80 })}
              inputProps={{ step: 0.1, min: 0 }}
              disabled={!formMaterial.puedeRotar}
              helperText="Altura máxima: 2.80m (SIEMPRE)"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={formMaterial.permiteTermosello || false}
                  onChange={(e) => setFormMaterial({ ...formMaterial, permiteTermosello: e.target.checked })}
                />
              }
              label="Permite Termosello"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Anchos de Rollo (separados por comas)"
              value={(formMaterial.anchosRollo || []).join(', ')}
              onChange={(e) => handleChangeAnchosRollo(e.target.value)}
              helperText="Ej: 2.50, 2.80, 3.00"
            />
          </Grid>

          {formMaterial.anchosRollo && formMaterial.anchosRollo.length > 0 && (
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="caption" sx={{ mr: 1 }}>Anchos disponibles:</Typography>
                {formMaterial.anchosRollo.map((ancho, i) => (
                  <Chip key={i} label={`${ancho}m`} size="small" color="primary" variant="outlined" />
                ))}
              </Box>
            </Grid>
          )}
        </>
      )}
    </Grid>
  );
};

export default MaterialFormFields;

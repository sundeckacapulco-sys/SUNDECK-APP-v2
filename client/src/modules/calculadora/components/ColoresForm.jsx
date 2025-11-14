import React from 'react';
import {
  Box,
  Card,
  Typography,
  TextField,
  Button,
  IconButton,
  Grid,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Palette as PaletteIcon
} from '@mui/icons-material';

const ColoresForm = ({ colores, onChange }) => {
  const handleAddColor = () => {
    const nuevosColores = [
      ...(colores || []),
      { nombre: '', codigo: '', hexColor: '#000000' }
    ];
    onChange(nuevosColores);
  };

  const handleDeleteColor = (index) => {
    const nuevosColores = colores.filter((_, i) => i !== index);
    onChange(nuevosColores);
  };

  const handleChangeColor = (index, field, value) => {
    const nuevosColores = [...colores];
    nuevosColores[index][field] = value;
    onChange(nuevosColores);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <PaletteIcon /> Colores Disponibles
      </Typography>

      {(colores || []).map((color, index) => (
        <Card key={index} sx={{ mb: 2, p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Nombre"
                placeholder="Ivory, Chocolate, Gris..."
                value={color.nombre || ''}
                onChange={(e) => handleChangeColor(index, 'nombre', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Código"
                placeholder="IVY-01"
                value={color.codigo || ''}
                onChange={(e) => handleChangeColor(index, 'codigo', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <input
                  type="color"
                  value={color.hexColor || '#000000'}
                  onChange={(e) => handleChangeColor(index, 'hexColor', e.target.value)}
                  style={{ width: 50, height: 40, border: 'none', cursor: 'pointer' }}
                />
                <TextField
                  label="Hex"
                  value={color.hexColor || '#000000'}
                  onChange={(e) => handleChangeColor(index, 'hexColor', e.target.value)}
                  size="small"
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={1}>
              <Chip
                label={color.nombre || 'Color'}
                sx={{ bgcolor: color.hexColor, color: '#fff' }}
              />
            </Grid>
            <Grid item xs={12} sm={1}>
              <IconButton color="error" onClick={() => handleDeleteColor(index)}>
                <DeleteIcon />
              </IconButton>
            </Grid>
          </Grid>
        </Card>
      ))}

      <Button
        startIcon={<AddIcon />}
        variant="outlined"
        onClick={handleAddColor}
      >
        Agregar Color
      </Button>
    </Box>
  );
};

export default ColoresForm;

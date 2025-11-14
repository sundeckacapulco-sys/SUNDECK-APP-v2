import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  IconButton,
  Grid,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';

const ReglasSeleccionForm = ({ reglasSeleccion, onChange }) => {
  const handleAddRegla = (tipo) => {
    const nuevasReglas = { ...reglasSeleccion };
    const nuevaRegla = {
      condicion: '',
      codigo: '',
      descripcion: ''
    };

    if (tipo === 'tubos') {
      nuevaRegla.diametro = '';
    } else if (tipo === 'mecanismos') {
      nuevaRegla.tipo = '';
      nuevaRegla.incluye = [];
    } else if (tipo === 'kits') {
      nuevaRegla.tamano = '';
    }

    nuevasReglas[tipo] = [...(nuevasReglas[tipo] || []), nuevaRegla];
    onChange(nuevasReglas);
  };

  const handleDeleteRegla = (tipo, index) => {
    const nuevasReglas = { ...reglasSeleccion };
    nuevasReglas[tipo] = nuevasReglas[tipo].filter((_, i) => i !== index);
    onChange(nuevasReglas);
  };

  const handleChangeRegla = (tipo, index, field, value) => {
    const nuevasReglas = { ...reglasSeleccion };
    nuevasReglas[tipo][index][field] = value;
    onChange(nuevasReglas);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Reglas de Selección
      </Typography>

      {/* Reglas de Tubos */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Reglas de Tubos ({(reglasSeleccion?.tubos || []).length})</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ width: '100%' }}>
            {(reglasSeleccion?.tubos || []).map((regla, index) => (
              <Card key={index} sx={{ mb: 2, p: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Condición"
                      placeholder="ancho <= 2.50 && esManual"
                      value={regla.condicion || ''}
                      onChange={(e) => handleChangeRegla('tubos', index, 'condicion', e.target.value)}
                      helperText="Ej: ancho <= 2.50 && esManual"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Diámetro"
                      placeholder="38mm"
                      value={regla.diametro || ''}
                      onChange={(e) => handleChangeRegla('tubos', index, 'diametro', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Código"
                      value={regla.codigo || ''}
                      onChange={(e) => handleChangeRegla('tubos', index, 'codigo', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={7}>
                    <TextField
                      fullWidth
                      label="Descripción"
                      value={regla.descripcion || ''}
                      onChange={(e) => handleChangeRegla('tubos', index, 'descripcion', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={1}>
                    <IconButton color="error" onClick={() => handleDeleteRegla('tubos', index)}>
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </Card>
            ))}
            <Button
              startIcon={<AddIcon />}
              variant="outlined"
              onClick={() => handleAddRegla('tubos')}
            >
              Agregar Regla de Tubo
            </Button>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Reglas de Mecanismos */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Reglas de Mecanismos ({(reglasSeleccion?.mecanismos || []).length})</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ width: '100%' }}>
            {(reglasSeleccion?.mecanismos || []).map((regla, index) => (
              <Card key={index} sx={{ mb: 2, p: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Condición"
                      placeholder="ancho <= 2.50"
                      value={regla.condicion || ''}
                      onChange={(e) => handleChangeRegla('mecanismos', index, 'condicion', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Tipo"
                      placeholder="SL-16, R-24, Motor"
                      value={regla.tipo || ''}
                      onChange={(e) => handleChangeRegla('mecanismos', index, 'tipo', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Código"
                      value={regla.codigo || ''}
                      onChange={(e) => handleChangeRegla('mecanismos', index, 'codigo', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={7}>
                    <TextField
                      fullWidth
                      label="Descripción"
                      value={regla.descripcion || ''}
                      onChange={(e) => handleChangeRegla('mecanismos', index, 'descripcion', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={1}>
                    <IconButton color="error" onClick={() => handleDeleteRegla('mecanismos', index)}>
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Incluye (separado por comas)"
                      placeholder="Clutch, Soportes"
                      value={(regla.incluye || []).join(', ')}
                      onChange={(e) => handleChangeRegla('mecanismos', index, 'incluye', e.target.value.split(',').map(s => s.trim()))}
                      helperText="Componentes que incluye el kit"
                    />
                  </Grid>
                </Grid>
              </Card>
            ))}
            <Button
              startIcon={<AddIcon />}
              variant="outlined"
              onClick={() => handleAddRegla('mecanismos')}
            >
              Agregar Regla de Mecanismo
            </Button>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Reglas de Kits (para Toldos) */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Reglas de Kits ({(reglasSeleccion?.kits || []).length})</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ width: '100%' }}>
            {(reglasSeleccion?.kits || []).map((regla, index) => (
              <Card key={index} sx={{ mb: 2, p: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Condición"
                      placeholder="ancho <= 4.00"
                      value={regla.condicion || ''}
                      onChange={(e) => handleChangeRegla('kits', index, 'condicion', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Tamaño"
                      placeholder="4.00m, 5.80m"
                      value={regla.tamano || ''}
                      onChange={(e) => handleChangeRegla('kits', index, 'tamano', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Código"
                      value={regla.codigo || ''}
                      onChange={(e) => handleChangeRegla('kits', index, 'codigo', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={7}>
                    <TextField
                      fullWidth
                      label="Descripción"
                      value={regla.descripcion || ''}
                      onChange={(e) => handleChangeRegla('kits', index, 'descripcion', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={1}>
                    <IconButton color="error" onClick={() => handleDeleteRegla('kits', index)}>
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </Card>
            ))}
            <Button
              startIcon={<AddIcon />}
              variant="outlined"
              onClick={() => handleAddRegla('kits')}
            >
              Agregar Regla de Kit
            </Button>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default ReglasSeleccionForm;

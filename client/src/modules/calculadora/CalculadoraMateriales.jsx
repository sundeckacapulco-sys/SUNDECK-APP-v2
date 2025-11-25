import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Autocomplete,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel,
  Chip,
  Alert,
  Grid,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as TestIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Calculate as CalculateIcon,
  Speed as SpeedIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import axiosConfig from '../../config/axios';
import ReglasSeleccionForm from './components/ReglasSeleccionForm';
import ColoresForm from './components/ColoresForm';
import OptimizacionForm from './components/OptimizacionForm';
import MaterialFormFields from './components/MaterialFormFields';
import PruebaRapidaDialog from './components/PruebaRapidaDialog';

const TIPOS_MATERIAL = [
  'Tela', 'Tubo', 'Cofre', 'Barra de Giro', 'Contrapeso', 
  'Soportes', 'Mecanismo', 'Motor', 'Cadena', 'Cable',
  'Tapas', 'Insertos', 'Cinta', 'Galería', 'Herrajes', 'Accesorios', 'Kit'
];
const UNIDADES = ['ml', 'm²', 'pza', 'kit', 'juego'];

const CalculadoraMateriales = () => {
  const [configuraciones, setConfiguraciones] = useState([]);
  const [configSeleccionada, setConfigSeleccionada] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Diálogos
  const [dialogoConfig, setDialogoConfig] = useState(false);
  const [dialogoMaterial, setDialogoMaterial] = useState(false);
  const [dialogoPrueba, setDialogoPrueba] = useState(false);
  const [dialogoPruebaRapida, setDialogoPruebaRapida] = useState(false);
  
  // Formularios
  const [formConfig, setFormConfig] = useState({
    nombre: '',
    producto: '',
    sistema: 'Roller Shade',
    activo: true,
    reglasSeleccion: {
      tubos: [],
      mecanismos: [],
      kits: []
    },
    optimizacion: {
      habilitada: true,
      longitudEstandar: 5.80,
      materialesOptimizables: []
    },
    reglasEspeciales: [],
    coloresDisponibles: []
  });

  // Agrupar configuraciones por sistema
  const sistemasAgrupados = configuraciones.reduce((acc, config) => {
    const sistema = config.sistema || 'Sin Sistema';
    if (!acc[sistema]) acc[sistema] = [];
    acc[sistema].push(config);
    return acc;
  }, {});

  const sistemasDisponibles = Object.keys(sistemasAgrupados).sort();
  
  const [formMaterial, setFormMaterial] = useState({
    tipo: 'Tela',
    descripcion: '',
    unidad: 'm²',
    formula: '',
    condicion: '',
    precioUnitario: 0,
    observaciones: '',
    activo: true,
    // Campos específicos para telas
    puedeRotar: false,
    alturaMaxRotacion: 2.80,
    permiteTermosello: false,
    anchosRollo: []
  });
  
  const [materialEditando, setMaterialEditando] = useState(null);
  
  // Prueba de fórmula
  const [piezaPrueba, setPiezaPrueba] = useState({
    ancho: 3.0,
    alto: 2.5,
    area: 7.5,
    motorizado: false,
    galeria: 'sin_galeria',
    sistema: 'Roller Shade',
    color: 'Ivory'
  });
  const [resultadoPrueba, setResultadoPrueba] = useState(null);

  useEffect(() => {
    cargarConfiguraciones();
  }, []);

  const cargarConfiguraciones = async () => {
    try {
      setLoading(true);
      const response = await axiosConfig.get('/calculadora/configuraciones');
      setConfiguraciones(response.data.data || []);
    } catch (error) {
      setError('Error cargando configuraciones');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarConfig = async () => {
    try {
      if (configSeleccionada) {
        // Actualizar
        await axiosConfig.put(`/calculadora/configuraciones/${configSeleccionada._id}`, formConfig);
        setSuccess('Configuración actualizada');
      } else {
        // Crear
        await axiosConfig.post('/calculadora/configuraciones', {
          ...formConfig,
          materiales: []
        });
        setSuccess('Configuración creada');
      }
      
      setDialogoConfig(false);
      cargarConfiguraciones();
    } catch (error) {
      setError('Error guardando configuración');
      console.error(error);
    }
  };

  const handleEliminarConfig = async (id) => {
    if (!window.confirm('¿Eliminar esta configuración?')) return;
    
    try {
      await axiosConfig.delete(`/calculadora/configuraciones/${id}`);
      setSuccess('Configuración eliminada');
      cargarConfiguraciones();
    } catch (error) {
      setError('Error eliminando configuración');
      console.error(error);
    }
  };

  const handleAbrirDialogoMaterial = (config, material = null) => {
    setConfigSeleccionada(config);
    if (material) {
      setFormMaterial(material);
      setMaterialEditando(material);
    } else {
      setFormMaterial({
        tipo: 'Tela',
        descripcion: '',
        unidad: 'm²',
        formula: '',
        condicion: '',
        precioUnitario: 0,
        observaciones: '',
        activo: true,
        puedeRotar: false,
        alturaMaxRotacion: 2.80,
        permiteTermosello: false,
        anchosRollo: []
      });
      setMaterialEditando(null);
    }
    setDialogoPrueba(false);
    setDialogoMaterial(true);
  };

  const handleGuardarMaterial = async () => {
    try {
      const materiales = [...(configSeleccionada.materiales || [])];
      
      if (materialEditando) {
        // Actualizar material existente
        const index = materiales.findIndex(m => m._id === materialEditando._id);
        materiales[index] = formMaterial;
      } else {
        // Agregar nuevo material
        materiales.push(formMaterial);
      }
      
      await axiosConfig.put(`/calculadora/configuraciones/${configSeleccionada._id}`, {
        ...configSeleccionada,
        materiales
      });
      
      setSuccess('Material guardado');
      setDialogoMaterial(false);
      cargarConfiguraciones();
    } catch (error) {
      setError('Error guardando material');
      console.error(error);
    }
  };

  const handleEliminarMaterial = async (config, materialId) => {
    if (!window.confirm('¿Eliminar este material?')) return;
    
    try {
      const materiales = config.materiales.filter(m => m._id !== materialId);
      
      await axiosConfig.put(`/calculadora/configuraciones/${config._id}`, {
        ...config,
        materiales
      });
      
      setSuccess('Material eliminado');
      cargarConfiguraciones();
    } catch (error) {
      setError('Error eliminando material');
      console.error(error);
    }
  };

  const handleProbarFormula = async () => {
    try {
      const response = await axiosConfig.post('/calculadora/probar', {
        formula: formMaterial.formula,
        condicion: formMaterial.condicion,
        pieza: piezaPrueba
      });
      
      setResultadoPrueba(response.data);
    } catch (error) {
      setError('Error probando fórmula');
      console.error(error);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#D4AF37', display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalculateIcon fontSize="large" />
            Calculadora de Materiales
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configura fórmulas dinámicas para calcular materiales automáticamente
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<SpeedIcon />}
            onClick={() => setDialogoPruebaRapida(true)}
            color="primary"
          >
            Prueba Rápida
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setConfigSeleccionada(null);
              setFormConfig({ nombre: '', producto: '', sistema: 'Enrollable', activo: true });
              setDialogoConfig(true);
            }}
            sx={{ bgcolor: '#D4AF37', '&:hover': { bgcolor: '#B8941F' } }}
          >
            Nueva Configuración
          </Button>
        </Box>
      </Box>

      {/* Alertas */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2}} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Lista de Configuraciones por Sistema */}
      {sistemasDisponibles.map(sistema => (
        <Accordion key={sistema} defaultExpanded={true} sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{sistema}</Typography>
            <Chip label={sistemasAgrupados[sistema].length} size="small" sx={{ ml: 2 }} />
          </AccordionSummary>
          <AccordionDetails>
            {sistemasAgrupados[sistema].map(config => (
              <Card key={config._id} sx={{ mb: 2, bgcolor: '#fafafa' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>
                        {config.nombre}
                        {!config.activo && <Chip label="Inactivo" size="small" sx={{ ml: 1 }} />}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Producto: {config.producto || 'Genérico'}
                      </Typography>
                    </Box>
                    <Box>
                      <IconButton onClick={() => {
                        setConfigSeleccionada(config);
                        setFormConfig(config);
                        setDialogoConfig(true);
                      }}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleEliminarConfig(config._id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Materiales */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2">
                      Materiales ({config.materiales?.length || 0})
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => handleAbrirDialogoMaterial(config)}
                    >
                      Agregar Material
                    </Button>
                  </Box>

                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Tipo</TableCell>
                          <TableCell>Descripción</TableCell>
                          <TableCell>Fórmula</TableCell>
                          <TableCell>Unidad</TableCell>
                          <TableCell>Condición</TableCell>
                          <TableCell>Estado</TableCell>
                          <TableCell align="right">Acciones</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {config.materiales?.map((material, index) => (
                          <TableRow key={index}>
                            <TableCell>{material.tipo}</TableCell>
                            <TableCell>{material.descripcion}</TableCell>
                            <TableCell>
                              <code style={{ fontSize: '0.85em', bgcolor: '#f5f5f5', padding: '2px 4px' }}>
                                {material.formula}
                              </code>
                            </TableCell>
                            <TableCell>{material.unidad}</TableCell>
                            <TableCell>
                              {material.condicion ? (
                                <code style={{ fontSize: '0.75em' }}>{material.condicion}</code>
                              ) : '-'}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={material.activo ? 'Activo' : 'Inactivo'}
                                size="small"
                                color={material.activo ? 'success' : 'default'}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <IconButton size="small" onClick={() => handleAbrirDialogoMaterial(config, material)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton size="small" onClick={() => handleEliminarMaterial(config, material._id)} color="error">
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            ))}
          </AccordionDetails>
        </Accordion>
      ))}

      {/* Diálogo Configuración */}
      <Dialog open={dialogoConfig} onClose={() => setDialogoConfig(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {configSeleccionada ? 'Editar Configuración' : 'Nueva Configuración'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nombre"
            value={formConfig.nombre}
            onChange={(e) => setFormConfig({ ...formConfig, nombre: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Producto (opcional)"
            value={formConfig.producto}
            onChange={(e) => setFormConfig({ ...formConfig, producto: e.target.value })}
            margin="normal"
            helperText="Ej: screen_5, blackout, sunscreen"
          />
          <Autocomplete
            freeSolo
            options={sistemasDisponibles}
            value={formConfig.sistema}
            onChange={(event, newValue) => {
              setFormConfig({ ...formConfig, sistema: newValue });
            }}
            onInputChange={(event, newInputValue) => {
              setFormConfig({ ...formConfig, sistema: newInputValue });
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Sistema"
                margin="normal"
                required
                helperText="Selecciona un sistema existente o escribe uno nuevo para crear un grupo"
              />
            )}
          />
          <FormControlLabel
            control={
              <Switch
                checked={formConfig.activo}
                onChange={(e) => setFormConfig({ ...formConfig, activo: e.target.checked })}
              />
            }
            label="Activo"
          />
          
          <Divider sx={{ my: 2 }} />
          
          <ReglasSeleccionForm
            reglasSeleccion={formConfig.reglasSeleccion}
            onChange={(nuevasReglas) => setFormConfig({ ...formConfig, reglasSeleccion: nuevasReglas })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogoConfig(false)}>Cancelar</Button>
          <Button onClick={handleGuardarConfig} variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo Material */}
      <Dialog open={dialogoMaterial} onClose={() => setDialogoMaterial(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {materialEditando ? 'Editar Material' : 'Nuevo Material'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={formMaterial.tipo}
                  onChange={(e) => setFormMaterial({ ...formMaterial, tipo: e.target.value })}
                  label="Tipo"
                >
                  {TIPOS_MATERIAL.map(tipo => (
                    <MenuItem key={tipo} value={tipo}>{tipo}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
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
                label="Fórmula"
                value={formMaterial.formula}
                onChange={(e) => setFormMaterial({ ...formMaterial, formula: e.target.value })}
                required
                helperText="Ej: area * 1.1, ancho + 0.10, Math.ceil(ancho / 1.5)"
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Condición (opcional)"
                value={formMaterial.condicion}
                onChange={(e) => setFormMaterial({ ...formMaterial, condicion: e.target.value })}
                helperText="Ej: motorizado === true, ancho > 2.5"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Precio Unitario"
                type="number"
                value={formMaterial.precioUnitario}
                onChange={(e) => setFormMaterial({ ...formMaterial, precioUnitario: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={6}>
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
          </Grid>

          {/* Probador de fórmula */}
          <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Probar Fórmula
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Ancho (m)"
                  type="number"
                  value={piezaPrueba.ancho}
                  onChange={(e) => setPiezaPrueba({ ...piezaPrueba, ancho: Number(e.target.value), area: Number(e.target.value) * piezaPrueba.alto })}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Alto (m)"
                  type="number"
                  value={piezaPrueba.alto}
                  onChange={(e) => setPiezaPrueba({ ...piezaPrueba, alto: Number(e.target.value), area: piezaPrueba.ancho * Number(e.target.value) })}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Área (m²)"
                  type="number"
                  value={piezaPrueba.area}
                  disabled
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<TestIcon />}
                  onClick={handleProbarFormula}
                >
                  Probar
                </Button>
              </Grid>
              {resultadoPrueba && (
                <Grid item xs={12}>
                  <Alert severity={resultadoPrueba.success ? 'success' : 'error'}>
                    {resultadoPrueba.success ? (
                      <>
                        <strong>Resultado:</strong> {resultadoPrueba.resultado} {formMaterial.unidad}
                        {formMaterial.condicion && (
                          <><br /><strong>Cumple condición:</strong> {resultadoPrueba.cumpleCondicion ? 'Sí' : 'No'}</>
                        )}
                      </>
                    ) : (
                      <><strong>Error:</strong> {resultadoPrueba.error}</>
                    )}
                  </Alert>
                </Grid>
              )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogoMaterial(false)}>Cancelar</Button>
          <Button onClick={handleGuardarMaterial} variant="contained" startIcon={<SaveIcon />}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo Prueba Rápida */}
      <PruebaRapidaDialog 
        open={dialogoPruebaRapida} 
        onClose={() => setDialogoPruebaRapida(false)} 
      />
    </Box>
  );
};

export default CalculadoraMateriales;

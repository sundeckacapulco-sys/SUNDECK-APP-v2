import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  Factory,
  Save,
  RestoreFromTrash,
  Add,
  Edit,
  Delete,
  Schedule,
  Inventory,
  Speed
} from '@mui/icons-material';

const ConfiguracionFabricacion = () => {
  // Estados para métricas de fabricación
  const [metricas, setMetricas] = useState({
    // Tiempos de fabricación por tipo de producto (en horas)
    tiemposFabricacion: {
      persianaManual: { 
        simple: 2, 
        mediana: 4, 
        compleja: 6,
        descripcion: "Persiana manual estándar"
      },
      cortinaMotoriz ada: { 
        simple: 3, 
        mediana: 5, 
        compleja: 8,
        descripcion: "Cortina con motor integrado"
      },
      toldo: { 
        simple: 4, 
        mediana: 8, 
        compleja: 12,
        descripcion: "Toldo con estructura"
      }
    },
    // Factores de complejidad
    factoresComplejidad: {
      dimensiones: {
        pequeno: { limite: 5, factor: 1.0, descripcion: "Hasta 5m²" },
        mediano: { limite: 15, factor: 1.3, descripcion: "5-15m²" },
        grande: { limite: 999, factor: 1.6, descripcion: "Más de 15m²" }
      },
      motorizado: { factor: 1.4, descripcion: "Productos motorizados" },
      personalizado: { factor: 1.8, descripcion: "Diseños personalizados" },
      urgente: { factor: 0.7, descripcion: "Producción urgente (menos tiempo)" }
    },
    // Capacidad de producción
    capacidadProduccion: {
      equiposPorDia: 8,
      horasLaboralesDia: 8,
      diasLaboralesSemana: 6,
      eficienciaPromedio: 0.85 // 85% de eficiencia
    }
  });

  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: '',
    simple: '',
    mediana: '',
    compleja: '',
    descripcion: ''
  });

  // Cargar configuración desde el backend
  useEffect(() => {
    cargarConfiguracion();
  }, []);

  const cargarConfiguracion = async () => {
    try {
      // TODO: Implementar llamada al backend
      console.log('Cargando configuración de fabricación...');
    } catch (error) {
      console.error('Error cargando configuración:', error);
      setMensaje('Error al cargar la configuración');
    }
  };

  const guardarConfiguracion = async () => {
    setGuardando(true);
    try {
      // TODO: Implementar llamada al backend
      console.log('Guardando configuración de fabricación:', metricas);
      setMensaje('Configuración de fabricación guardada exitosamente');
      setEditando(false);
    } catch (error) {
      console.error('Error guardando configuración:', error);
      setMensaje('Error al guardar la configuración');
    } finally {
      setGuardando(false);
    }
  };

  const restaurarDefecto = () => {
    setMetricas({
      tiemposFabricacion: {
        persianaManual: { 
          simple: 2, 
          mediana: 4, 
          compleja: 6,
          descripcion: "Persiana manual estándar"
        },
        cortinaMotoriz ada: { 
          simple: 3, 
          mediana: 5, 
          compleja: 8,
          descripcion: "Cortina con motor integrado"
        },
        toldo: { 
          simple: 4, 
          mediana: 8, 
          compleja: 12,
          descripcion: "Toldo con estructura"
        }
      },
      factoresComplejidad: {
        dimensiones: {
          pequeno: { limite: 5, factor: 1.0, descripcion: "Hasta 5m²" },
          mediano: { limite: 15, factor: 1.3, descripcion: "5-15m²" },
          grande: { limite: 999, factor: 1.6, descripcion: "Más de 15m²" }
        },
        motorizado: { factor: 1.4, descripcion: "Productos motorizados" },
        personalizado: { factor: 1.8, descripcion: "Diseños personalizados" },
        urgente: { factor: 0.7, descripcion: "Producción urgente (menos tiempo)" }
      },
      capacidadProduccion: {
        equiposPorDia: 8,
        horasLaboralesDia: 8,
        diasLaboralesSemana: 6,
        eficienciaPromedio: 0.85
      }
    });
    setMensaje('Configuración de fabricación restaurada a valores por defecto');
  };

  const agregarNuevoProducto = () => {
    if (nuevoProducto.nombre && nuevoProducto.simple && nuevoProducto.mediana && nuevoProducto.compleja) {
      const clave = nuevoProducto.nombre.toLowerCase().replace(/\s+/g, '');
      setMetricas(prev => ({
        ...prev,
        tiemposFabricacion: {
          ...prev.tiemposFabricacion,
          [clave]: {
            simple: parseFloat(nuevoProducto.simple),
            mediana: parseFloat(nuevoProducto.mediana),
            compleja: parseFloat(nuevoProducto.compleja),
            descripcion: nuevoProducto.descripcion || nuevoProducto.nombre
          }
        }
      }));
      setNuevoProducto({ nombre: '', simple: '', mediana: '', compleja: '', descripcion: '' });
      setDialogoAbierto(false);
      setMensaje(`Producto "${nuevoProducto.nombre}" agregado exitosamente`);
    }
  };

  const eliminarProducto = (producto) => {
    setMetricas(prev => {
      const nuevosTiempos = { ...prev.tiemposFabricacion };
      delete nuevosTiempos[producto];
      return {
        ...prev,
        tiemposFabricacion: nuevosTiempos
      };
    });
    setMensaje(`Producto "${producto}" eliminado`);
  };

  // Calcular capacidad diaria
  const capacidadDiaria = metricas.capacidadProduccion.equiposPorDia * 
                         metricas.capacidadProduccion.horasLaboralesDia * 
                         metricas.capacidadProduccion.eficienciaPromedio;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Factory sx={{ mr: 2, color: 'primary.main' }} />
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Configuración de Fabricación
        </Typography>
      </Box>

      {mensaje && (
        <Alert 
          severity={mensaje.includes('Error') ? 'error' : 'success'} 
          sx={{ mb: 3 }}
          onClose={() => setMensaje('')}
        >
          {mensaje}
        </Alert>
      )}

      {/* Controles principales */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <Button
          variant={editando ? 'outlined' : 'contained'}
          startIcon={<Edit />}
          onClick={() => setEditando(!editando)}
        >
          {editando ? 'Cancelar Edición' : 'Editar Configuración'}
        </Button>
        
        {editando && (
          <>
            <Button
              variant="contained"
              color="success"
              startIcon={<Save />}
              onClick={guardarConfiguracion}
              disabled={guardando}
            >
              {guardando ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
            
            <Button
              variant="outlined"
              color="warning"
              startIcon={<RestoreFromTrash />}
              onClick={restaurarDefecto}
            >
              Restaurar Defecto
            </Button>
          </>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Tiempos de fabricación por producto */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Schedule sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Tiempos de Fabricación por Producto
                </Typography>
                {editando && (
                  <IconButton 
                    color="primary" 
                    sx={{ ml: 'auto' }}
                    onClick={() => setDialogoAbierto(true)}
                  >
                    <Add />
                  </IconButton>
                )}
              </Box>
              
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Producto</strong></TableCell>
                      <TableCell align="center"><strong>Simple (hrs)</strong></TableCell>
                      <TableCell align="center"><strong>Mediana (hrs)</strong></TableCell>
                      <TableCell align="center"><strong>Compleja (hrs)</strong></TableCell>
                      <TableCell><strong>Descripción</strong></TableCell>
                      {editando && <TableCell align="center"><strong>Acciones</strong></TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(metricas.tiemposFabricacion).map(([producto, tiempos]) => (
                      <TableRow key={producto}>
                        <TableCell>
                          <Chip 
                            label={producto.charAt(0).toUpperCase() + producto.slice(1)} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <TextField
                            type="number"
                            value={tiempos.simple}
                            onChange={(e) => setMetricas(prev => ({
                              ...prev,
                              tiemposFabricacion: {
                                ...prev.tiemposFabricacion,
                                [producto]: {
                                  ...prev.tiemposFabricacion[producto],
                                  simple: parseFloat(e.target.value) || 0
                                }
                              }
                            }))}
                            disabled={!editando}
                            size="small"
                            sx={{ width: 80 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <TextField
                            type="number"
                            value={tiempos.mediana}
                            onChange={(e) => setMetricas(prev => ({
                              ...prev,
                              tiemposFabricacion: {
                                ...prev.tiemposFabricacion,
                                [producto]: {
                                  ...prev.tiemposFabricacion[producto],
                                  mediana: parseFloat(e.target.value) || 0
                                }
                              }
                            }))}
                            disabled={!editando}
                            size="small"
                            sx={{ width: 80 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <TextField
                            type="number"
                            value={tiempos.compleja}
                            onChange={(e) => setMetricas(prev => ({
                              ...prev,
                              tiemposFabricacion: {
                                ...prev.tiemposFabricacion,
                                [producto]: {
                                  ...prev.tiemposFabricacion[producto],
                                  compleja: parseFloat(e.target.value) || 0
                                }
                              }
                            }))}
                            disabled={!editando}
                            size="small"
                            sx={{ width: 80 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {tiempos.descripcion}
                          </Typography>
                        </TableCell>
                        {editando && (
                          <TableCell align="center">
                            <IconButton 
                              color="error" 
                              size="small"
                              onClick={() => eliminarProducto(producto)}
                            >
                              <Delete />
                            </IconButton>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Factores de complejidad */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Speed sx={{ mr: 1, color: 'secondary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Factores de Complejidad
                </Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Por Dimensiones
                  </Typography>
                  {Object.entries(metricas.factoresComplejidad.dimensiones).map(([tamaño, config]) => (
                    <Box key={tamaño} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ minWidth: 80 }}>
                        {tamaño.charAt(0).toUpperCase() + tamaño.slice(1)}:
                      </Typography>
                      <TextField
                        type="number"
                        value={config.factor}
                        onChange={(e) => setMetricas(prev => ({
                          ...prev,
                          factoresComplejidad: {
                            ...prev.factoresComplejidad,
                            dimensiones: {
                              ...prev.factoresComplejidad.dimensiones,
                              [tamaño]: {
                                ...prev.factoresComplejidad.dimensiones[tamaño],
                                factor: parseFloat(e.target.value) || 0
                              }
                            }
                          }
                        }))}
                        disabled={!editando}
                        size="small"
                        sx={{ width: 80 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {config.descripcion}
                      </Typography>
                    </Box>
                  ))}
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Otros Factores
                  </Typography>
                  {['motorizado', 'personalizado', 'urgente'].map(factor => (
                    <Box key={factor} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ minWidth: 100 }}>
                        {factor.charAt(0).toUpperCase() + factor.slice(1)}:
                      </Typography>
                      <TextField
                        type="number"
                        value={metricas.factoresComplejidad[factor].factor}
                        onChange={(e) => setMetricas(prev => ({
                          ...prev,
                          factoresComplejidad: {
                            ...prev.factoresComplejidad,
                            [factor]: {
                              ...prev.factoresComplejidad[factor],
                              factor: parseFloat(e.target.value) || 0
                            }
                          }
                        }))}
                        disabled={!editando}
                        size="small"
                        sx={{ width: 80 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {metricas.factoresComplejidad[factor].descripcion}
                      </Typography>
                    </Box>
                  ))}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Capacidad de producción */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Inventory sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Capacidad de Producción
                </Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="Equipos por día"
                    type="number"
                    value={metricas.capacidadProduccion.equiposPorDia}
                    onChange={(e) => setMetricas(prev => ({
                      ...prev,
                      capacidadProduccion: {
                        ...prev.capacidadProduccion,
                        equiposPorDia: parseInt(e.target.value) || 0
                      }
                    }))}
                    disabled={!editando}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Horas laborales/día"
                    type="number"
                    value={metricas.capacidadProduccion.horasLaboralesDia}
                    onChange={(e) => setMetricas(prev => ({
                      ...prev,
                      capacidadProduccion: {
                        ...prev.capacidadProduccion,
                        horasLaboralesDia: parseInt(e.target.value) || 0
                      }
                    }))}
                    disabled={!editando}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Días laborales/semana"
                    type="number"
                    value={metricas.capacidadProduccion.diasLaboralesSemana}
                    onChange={(e) => setMetricas(prev => ({
                      ...prev,
                      capacidadProduccion: {
                        ...prev.capacidadProduccion,
                        diasLaboralesSemana: parseInt(e.target.value) || 0
                      }
                    }))}
                    disabled={!editando}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Eficiencia promedio"
                    type="number"
                    value={metricas.capacidadProduccion.eficienciaPromedio}
                    onChange={(e) => setMetricas(prev => ({
                      ...prev,
                      capacidadProduccion: {
                        ...prev.capacidadProduccion,
                        eficienciaPromedio: parseFloat(e.target.value) || 0
                      }
                    }))}
                    disabled={!editando}
                    fullWidth
                    size="small"
                    inputProps={{ step: 0.01, min: 0, max: 1 }}
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 2, p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" color="info.dark" sx={{ fontWeight: 'bold' }}>
                  📊 Capacidad Diaria Calculada:
                </Typography>
                <Typography variant="h6" color="info.dark">
                  {capacidadDiaria.toFixed(1)} horas/día
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Basado en {metricas.capacidadProduccion.equiposPorDia} equipos × {metricas.capacidadProduccion.horasLaboralesDia}h × {(metricas.capacidadProduccion.eficienciaPromedio * 100).toFixed(0)}% eficiencia
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Diálogo para agregar nuevo producto */}
      <Dialog open={dialogoAbierto} onClose={() => setDialogoAbierto(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Agregar Nuevo Producto de Fabricación</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Nombre del producto"
                  fullWidth
                  value={nuevoProducto.nombre}
                  onChange={(e) => setNuevoProducto(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ej. Cortina Roller, Persiana Vertical"
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  label="Tiempo simple (hrs)"
                  type="number"
                  fullWidth
                  value={nuevoProducto.simple}
                  onChange={(e) => setNuevoProducto(prev => ({ ...prev, simple: e.target.value }))}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  label="Tiempo mediana (hrs)"
                  type="number"
                  fullWidth
                  value={nuevoProducto.mediana}
                  onChange={(e) => setNuevoProducto(prev => ({ ...prev, mediana: e.target.value }))}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  label="Tiempo compleja (hrs)"
                  type="number"
                  fullWidth
                  value={nuevoProducto.compleja}
                  onChange={(e) => setNuevoProducto(prev => ({ ...prev, compleja: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Descripción"
                  fullWidth
                  value={nuevoProducto.descripcion}
                  onChange={(e) => setNuevoProducto(prev => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Descripción del producto"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogoAbierto(false)}>Cancelar</Button>
          <Button onClick={agregarNuevoProducto} variant="contained">Agregar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ConfiguracionFabricacion;

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
  Divider,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Settings,
  Save,
  RestoreFromTrash,
  Add,
  Edit,
  Delete,
  AccessTime,
  Build,
  Height
} from '@mui/icons-material';

const ConfiguracionInstalacion = () => {
  // Estados para métricas de instalación
  const [metricas, setMetricas] = useState({
    // Tiempos base por tipo de producto (en minutos)
    tiemposBase: {
      persianaManual: 17.5,
      cortinaMotoriz ada: 30,
      toldo: 90
    },
    // Ajustes por dimensiones
    ajustesDimensiones: {
      anchoExtra: { umbral: 3, tiempoAdicional: 10 }, // +10min si ancho > 3m
      alturaExtra: { umbral: 2.5, tiempoAdicional: 5 }, // +5min si altura > 2.5m
      alturaAndamios: { umbral: 4, tiempoAdicional: 50 } // +50min si altura > 4m
    },
    // Precios base de instalación
    preciosBase: {
      instalacionEstandar: 1500,
      instalacionConAndamios: 2500,
      instalacionNocturna: 2000
    }
  });

  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [nuevoTipo, setNuevoTipo] = useState({ nombre: '', tiempo: '' });

  // Cargar configuración desde el backend
  useEffect(() => {
    cargarConfiguracion();
  }, []);

  const cargarConfiguracion = async () => {
    try {
      // TODO: Implementar llamada al backend
      // const response = await axiosConfig.get('/api/configuracion/instalacion');
      // setMetricas(response.data);
      console.log('Cargando configuración de instalación...');
    } catch (error) {
      console.error('Error cargando configuración:', error);
      setMensaje('Error al cargar la configuración');
    }
  };

  const guardarConfiguracion = async () => {
    setGuardando(true);
    try {
      // TODO: Implementar llamada al backend
      // await axiosConfig.put('/api/configuracion/instalacion', metricas);
      console.log('Guardando configuración:', metricas);
      setMensaje('Configuración guardada exitosamente');
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
      tiemposBase: {
        persianaManual: 17.5,
        cortinaMotoriz ada: 30,
        toldo: 90
      },
      ajustesDimensiones: {
        anchoExtra: { umbral: 3, tiempoAdicional: 10 },
        alturaExtra: { umbral: 2.5, tiempoAdicional: 5 },
        alturaAndamios: { umbral: 4, tiempoAdicional: 50 }
      },
      preciosBase: {
        instalacionEstandar: 1500,
        instalacionConAndamios: 2500,
        instalacionNocturna: 2000
      }
    });
    setMensaje('Configuración restaurada a valores por defecto');
  };

  const agregarNuevoTipo = () => {
    if (nuevoTipo.nombre && nuevoTipo.tiempo) {
      setMetricas(prev => ({
        ...prev,
        tiemposBase: {
          ...prev.tiemposBase,
          [nuevoTipo.nombre.toLowerCase().replace(/\s+/g, '')]: parseFloat(nuevoTipo.tiempo)
        }
      }));
      setNuevoTipo({ nombre: '', tiempo: '' });
      setDialogoAbierto(false);
      setMensaje(`Tipo "${nuevoTipo.nombre}" agregado exitosamente`);
    }
  };

  const eliminarTipo = (tipo) => {
    setMetricas(prev => {
      const nuevosTimpos = { ...prev.tiemposBase };
      delete nuevosTimpos[tipo];
      return {
        ...prev,
        tiemposBase: nuevosTimpos
      };
    });
    setMensaje(`Tipo "${tipo}" eliminado`);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Settings sx={{ mr: 2, color: 'primary.main' }} />
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Configuración de Instalaciones
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
        {/* Tiempos base por tipo de producto */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AccessTime sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Tiempos Base por Producto
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
              
              <Grid container spacing={2}>
                {Object.entries(metricas.tiemposBase).map(([tipo, tiempo]) => (
                  <Grid item xs={12} key={tipo}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <TextField
                        label={tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                        type="number"
                        value={tiempo}
                        onChange={(e) => setMetricas(prev => ({
                          ...prev,
                          tiemposBase: {
                            ...prev.tiemposBase,
                            [tipo]: parseFloat(e.target.value) || 0
                          }
                        }))}
                        disabled={!editando}
                        fullWidth
                        InputProps={{
                          endAdornment: <Typography variant="caption">min</Typography>
                        }}
                      />
                      {editando && (
                        <IconButton 
                          color="error" 
                          onClick={() => eliminarTipo(tipo)}
                        >
                          <Delete />
                        </IconButton>
                      )}
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Ajustes por dimensiones */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Height sx={{ mr: 1, color: 'secondary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Ajustes por Dimensiones
                </Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Ancho Extra
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                      label="Umbral (m)"
                      type="number"
                      value={metricas.ajustesDimensiones.anchoExtra.umbral}
                      onChange={(e) => setMetricas(prev => ({
                        ...prev,
                        ajustesDimensiones: {
                          ...prev.ajustesDimensiones,
                          anchoExtra: {
                            ...prev.ajustesDimensiones.anchoExtra,
                            umbral: parseFloat(e.target.value) || 0
                          }
                        }
                      }))}
                      disabled={!editando}
                      size="small"
                    />
                    <TextField
                      label="Tiempo adicional (min)"
                      type="number"
                      value={metricas.ajustesDimensiones.anchoExtra.tiempoAdicional}
                      onChange={(e) => setMetricas(prev => ({
                        ...prev,
                        ajustesDimensiones: {
                          ...prev.ajustesDimensiones,
                          anchoExtra: {
                            ...prev.ajustesDimensiones.anchoExtra,
                            tiempoAdicional: parseFloat(e.target.value) || 0
                          }
                        }
                      }))}
                      disabled={!editando}
                      size="small"
                    />
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Altura Extra
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                      label="Umbral (m)"
                      type="number"
                      value={metricas.ajustesDimensiones.alturaExtra.umbral}
                      onChange={(e) => setMetricas(prev => ({
                        ...prev,
                        ajustesDimensiones: {
                          ...prev.ajustesDimensiones,
                          alturaExtra: {
                            ...prev.ajustesDimensiones.alturaExtra,
                            umbral: parseFloat(e.target.value) || 0
                          }
                        }
                      }))}
                      disabled={!editando}
                      size="small"
                    />
                    <TextField
                      label="Tiempo adicional (min)"
                      type="number"
                      value={metricas.ajustesDimensiones.alturaExtra.tiempoAdicional}
                      onChange={(e) => setMetricas(prev => ({
                        ...prev,
                        ajustesDimensiones: {
                          ...prev.ajustesDimensiones,
                          alturaExtra: {
                            ...prev.ajustesDimensiones.alturaExtra,
                            tiempoAdicional: parseFloat(e.target.value) || 0
                          }
                        }
                      }))}
                      disabled={!editando}
                      size="small"
                    />
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Andamios (Altura Crítica)
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                      label="Umbral (m)"
                      type="number"
                      value={metricas.ajustesDimensiones.alturaAndamios.umbral}
                      onChange={(e) => setMetricas(prev => ({
                        ...prev,
                        ajustesDimensiones: {
                          ...prev.ajustesDimensiones,
                          alturaAndamios: {
                            ...prev.ajustesDimensiones.alturaAndamios,
                            umbral: parseFloat(e.target.value) || 0
                          }
                        }
                      }))}
                      disabled={!editando}
                      size="small"
                    />
                    <TextField
                      label="Tiempo adicional (min)"
                      type="number"
                      value={metricas.ajustesDimensiones.alturaAndamios.tiempoAdicional}
                      onChange={(e) => setMetricas(prev => ({
                        ...prev,
                        ajustesDimensiones: {
                          ...prev.ajustesDimensiones,
                          alturaAndamios: {
                            ...prev.ajustesDimensiones.alturaAndamios,
                            tiempoAdicional: parseFloat(e.target.value) || 0
                          }
                        }
                      }))}
                      disabled={!editando}
                      size="small"
                    />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Precios base */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Build sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Precios Base de Instalación
                </Typography>
              </Box>
              
              <Grid container spacing={2}>
                {Object.entries(metricas.preciosBase).map(([tipo, precio]) => (
                  <Grid item xs={12} sm={4} key={tipo}>
                    <TextField
                      label={tipo.charAt(0).toUpperCase() + tipo.slice(1).replace(/([A-Z])/g, ' $1')}
                      type="number"
                      value={precio}
                      onChange={(e) => setMetricas(prev => ({
                        ...prev,
                        preciosBase: {
                          ...prev.preciosBase,
                          [tipo]: parseFloat(e.target.value) || 0
                        }
                      }))}
                      disabled={!editando}
                      fullWidth
                      InputProps={{
                        startAdornment: <Typography variant="body2">$</Typography>
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Diálogo para agregar nuevo tipo */}
      <Dialog open={dialogoAbierto} onClose={() => setDialogoAbierto(false)}>
        <DialogTitle>Agregar Nuevo Tipo de Producto</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              label="Nombre del producto"
              fullWidth
              value={nuevoTipo.nombre}
              onChange={(e) => setNuevoTipo(prev => ({ ...prev, nombre: e.target.value }))}
              sx={{ mb: 2 }}
              placeholder="Ej. Cortina Roller, Persiana Vertical"
            />
            <TextField
              label="Tiempo base (minutos)"
              type="number"
              fullWidth
              value={nuevoTipo.tiempo}
              onChange={(e) => setNuevoTipo(prev => ({ ...prev, tiempo: e.target.value }))}
              placeholder="Ej. 25, 45, 60"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogoAbierto(false)}>Cancelar</Button>
          <Button onClick={agregarNuevoTipo} variant="contained">Agregar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ConfiguracionInstalacion;

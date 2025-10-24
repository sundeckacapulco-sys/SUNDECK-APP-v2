import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Alert, 
  Button,
  Grid,
  TextField,
  MenuItem,
  Chip,
  Autocomplete,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Checkbox,
  FormControlLabel,
  Paper,
  CircularProgress
} from '@mui/material';
import { 
  Save as SaveIcon,
  Cancel as CancelIcon,
  Build as BuildIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import instalacionesApi from './services/instalacionesApi';

const ProgramarInstalacion = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const proyectoIdParam = searchParams.get('proyectoId');

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Estados del formulario
  const [formData, setFormData] = useState({
    // Paso 1: Selección de proyecto
    proyectoId: proyectoIdParam || '',
    proyecto: null,
    
    // Paso 2: Programación
    fechaProgramada: new Date(),
    tipoInstalacion: 'estandar',
    prioridad: 'media',
    tiempoEstimado: 4,
    
    // Paso 3: Cuadrilla
    instaladores: [],
    responsable: '',
    
    // Paso 4: Herramientas y preparación
    herramientasEspeciales: [],
    materialesAdicionales: [],
    observaciones: '',
    
    // Paso 5: Confirmación
    notificarCliente: true,
    confirmarFecha: true
  });

  // Estados para sugerencias inteligentes
  const [sugerenciasIA, setSugerenciasIA] = useState(null);
  const [cargandoSugerencias, setCargandoSugerencias] = useState(false);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(true);

  // Datos de catálogo
  const [proyectosDisponibles, setProyectosDisponibles] = useState([]);
  const [instaladoresDisponibles, setInstalaadoresDisponibles] = useState([]);

  const tiposInstalacion = [
    { value: 'estandar', label: 'Estándar', tiempo: 4 },
    { value: 'electrica', label: 'Eléctrica (Motorizada)', tiempo: 6 },
    { value: 'estructural', label: 'Estructural (Refuerzos)', tiempo: 8 },
    { value: 'altura_especial', label: 'Altura Especial', tiempo: 6 },
    { value: 'acceso_dificil', label: 'Acceso Difícil', tiempo: 5 },
    { value: 'personalizada', label: 'Personalizada', tiempo: 4 }
  ];

  const prioridades = [
    { value: 'baja', label: 'Baja', color: '#4CAF50' },
    { value: 'media', label: 'Media', color: '#FF9800' },
    { value: 'alta', label: 'Alta', color: '#F44336' },
    { value: 'urgente', label: 'Urgente', color: '#9C27B0' }
  ];

  const herramientasComunes = [
    'Taladro percutor',
    'Nivel láser',
    'Escalera extensible',
    'Andamio móvil',
    'Herramientas eléctricas',
    'Kit de motorización',
    'Medidor de tensión',
    'Equipo de soldadura'
  ];

  const steps = [
    'Seleccionar Proyecto',
    'Programar Fecha',
    'Asignar Cuadrilla',
    'Herramientas y Preparación',
    'Confirmar Instalación'
  ];

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  const cargarDatosIniciales = async () => {
    try {
      // Cargar proyectos listos para instalación
      // const proyectos = await instalacionesApi.obtenerProyectosListos();
      // setProyectosDisponibles(proyectos);

      // Cargar cuadrillas disponibles
      // const cuadrillas = await instalacionesApi.obtenerCuadrillasDisponibles();
      // setCuadrillasDisponibles(cuadrillas);

      // Mock data para desarrollo
      setProyectosDisponibles([
        { id: '671234567890abcdef123456', numero: 'PROY-2024-001', cliente: 'Juan Pérez', direccion: 'Av. Principal 123', productos: 3 },
        { id: '671234567890abcdef123457', numero: 'PROY-2024-002', cliente: 'María García', direccion: 'Calle Secundaria 456', productos: 2 },
        { id: '671234567890abcdef123458', numero: 'PROY-2024-003', cliente: 'Carlos López', direccion: 'Boulevard Norte 789', productos: 5 }
      ]);

      setInstalaadoresDisponibles([
        { id: '671234567890abcdef123460', nombre: 'Roberto Martínez', especialidad: 'Persianas', experiencia: '5 años' },
        { id: '671234567890abcdef123461', nombre: 'Luis Hernández', especialidad: 'Toldos', experiencia: '3 años' },
        { id: '671234567890abcdef123462', nombre: 'Miguel Sánchez', especialidad: 'Motorización', experiencia: '7 años' },
        { id: '671234567890abcdef123463', nombre: 'José Ramírez', especialidad: 'General', experiencia: '4 años' }
      ]);

    } catch (error) {
      console.error('Error cargando datos:', error);
      setError('Error cargando datos iniciales');
    }
  };

  // Generar sugerencias inteligentes cuando se selecciona un proyecto
  const generarSugerenciasInteligentes = async (proyectoId) => {
    if (!proyectoId) return;
    
    try {
      setCargandoSugerencias(true);
      
      // En producción llamaría al backend
      // const sugerencias = await instalacionesApi.generarSugerenciasIA(proyectoId);
      
      // Mock data con sugerencias inteligentes
      const sugerenciasMock = {
        proyecto: { id: proyectoId, numero: 'PROY-2024-001' },
        tiempo: {
          tiempoEstimado: 6,
          tiempoMinimo: 5,
          tiempoMaximo: 8,
          recomendacion: 'Instalación de complejidad media - incluye productos motorizados',
          confianza: 85
        },
        cuadrilla: {
          cuadrillaRecomendada: [
            { id: '671234567890abcdef123460', nombre: 'Roberto Martínez', especialidad: 'Persianas' },
            { id: '671234567890abcdef123462', nombre: 'Miguel Sánchez', especialidad: 'Motorización' }
          ],
          responsableSugerido: { id: '671234567890abcdef123460', nombre: 'Roberto Martínez' },
          razonamiento: ['Roberto incluido por experiencia en persianas', 'Miguel incluido por motorización'],
          confianza: 90
        },
        herramientas: {
          herramientasRequeridas: ['Taladro percutor', 'Kit de motorización', 'Medidor de tensión'],
          herramientasOpcionales: ['Escalera extensible'],
          razonamiento: ['Motorización requiere herramientas eléctricas'],
          confianza: 85
        },
        programacion: {
          fechaRecomendada: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 días
          horaRecomendada: '09:00',
          razonamiento: ['Tiempo adecuado para preparación', 'Día óptimo de la semana'],
          confianza: 75
        },
        complejidad: {
          nivel: 'Media',
          puntuacion: 45,
          descripcion: 'Instalación con productos motorizados que requiere atención especial',
          factores: ['Productos motorizados', 'Varios productos (3)'],
          recomendaciones: ['Cuadrilla de 2-3 personas', 'Incluir especialista en motorización'],
          confianza: 90
        },
        confianza: 85
      };
      
      setSugerenciasIA(sugerenciasMock);
      
      // Aplicar sugerencias automáticamente
      aplicarSugerenciasAutomaticas(sugerenciasMock);
      
    } catch (error) {
      console.error('Error generando sugerencias:', error);
      setError('Error generando sugerencias inteligentes');
    } finally {
      setCargandoSugerencias(false);
    }
  };

  // Aplicar sugerencias automáticamente al formulario
  const aplicarSugerenciasAutomaticas = (sugerencias) => {
    setFormData(prev => ({
      ...prev,
      // Aplicar tiempo estimado
      tiempoEstimado: sugerencias.tiempo.tiempoEstimado,
      
      // Aplicar fecha recomendada
      fechaProgramada: sugerencias.programacion.fechaRecomendada,
      
      // Aplicar cuadrilla recomendada
      instaladores: sugerencias.cuadrilla.cuadrillaRecomendada.map(inst => inst.id),
      responsable: sugerencias.cuadrilla.responsableSugerido.id,
      
      // Aplicar herramientas recomendadas
      herramientasEspeciales: sugerencias.herramientas.herramientasRequeridas,
      
      // Ajustar tipo de instalación según complejidad
      tipoInstalacion: sugerencias.complejidad.nivel === 'Alta' ? 'personalizada' : 
                      sugerencias.herramientas.herramientasRequeridas.includes('Kit de motorización') ? 'electrica' : 'estandar'
    }));
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      const payload = {
        proyectoId: formData.proyectoId,
        fechaProgramada: formData.fechaProgramada,
        tipoInstalacion: formData.tipoInstalacion,
        prioridad: formData.prioridad,
        tiempoEstimado: formData.tiempoEstimado,
        instaladores: formData.instaladores,
        responsable: formData.responsable,
        herramientasEspeciales: formData.herramientasEspeciales,
        materialesAdicionales: formData.materialesAdicionales,
        observaciones: formData.observaciones,
        configuracion: {
          notificarCliente: formData.notificarCliente,
          confirmarFecha: formData.confirmarFecha
        }
      };

      console.log('Enviando payload:', payload);
      
      // Llamada real al backend
      const resultado = await instalacionesApi.programarInstalacion(payload);
      
      setSuccess(`¡Instalación ${resultado.instalacion.numero} programada exitosamente!`);
      
      setTimeout(() => {
        navigate('/instalaciones');
      }, 2000);

    } catch (error) {
      console.error('Error programando instalación:', error);
      
      // Mostrar error más específico
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Error desconocido al programar la instalación';
      
      setError(`Error: ${errorMessage}`);
      
      // Log adicional para debugging
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Autocomplete
                options={proyectosDisponibles}
                getOptionLabel={(option) => `${option.numero} - ${option.cliente}`}
                value={proyectosDisponibles.find(p => p.id === formData.proyectoId) || null}
                onChange={(event, newValue) => {
                  setFormData({ 
                    ...formData, 
                    proyectoId: newValue?.id || '',
                    proyecto: newValue 
                  });
                  
                  // Generar sugerencias inteligentes cuando se selecciona un proyecto
                  if (newValue?.id) {
                    generarSugerenciasInteligentes(newValue.id);
                  } else {
                    setSugerenciasIA(null);
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Seleccionar Proyecto"
                    placeholder="Buscar por número o cliente..."
                    required
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Box>
                      <Typography variant="body1" fontWeight="bold">
                        {option.numero}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {option.cliente} • {option.direccion}
                      </Typography>
                      <Typography variant="caption" color="primary">
                        {option.productos} productos
                      </Typography>
                    </Box>
                  </Box>
                )}
              />
            </Grid>
            {formData.proyecto && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Typography variant="h6" gutterBottom>
                    📋 Resumen del Proyecto
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        <strong>Cliente:</strong> {formData.proyecto.cliente}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        <strong>Productos:</strong> {formData.proyecto.productos}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2">
                        <strong>Dirección:</strong> {formData.proyecto.direccion}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            )}

            {/* Panel de Sugerencias Inteligentes */}
            {(cargandoSugerencias || sugerenciasIA) && mostrarSugerencias && (
              <Grid item xs={12}>
                <Card sx={{ 
                  border: '2px solid #2196F3', 
                  bgcolor: '#E3F2FD',
                  position: 'relative'
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        🧠 Sugerencias Inteligentes
                        {cargandoSugerencias && <CircularProgress size={20} />}
                      </Typography>
                      <Button 
                        size="small" 
                        onClick={() => setMostrarSugerencias(false)}
                        sx={{ minWidth: 'auto' }}
                      >
                        ✕
                      </Button>
                    </Box>

                    {cargandoSugerencias && (
                      <Typography variant="body2" color="text.secondary">
                        Analizando proyecto y generando recomendaciones...
                      </Typography>
                    )}

                    {sugerenciasIA && (
                      <Grid container spacing={2}>
                        {/* Análisis de Complejidad */}
                        <Grid item xs={12} md={6}>
                          <Paper sx={{ p: 2, bgcolor: 'white' }}>
                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                              📊 Análisis de Complejidad
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Chip 
                                label={sugerenciasIA.complejidad.nivel}
                                color={sugerenciasIA.complejidad.nivel === 'Alta' ? 'error' : 
                                       sugerenciasIA.complejidad.nivel === 'Media' ? 'warning' : 'success'}
                                size="small"
                              />
                              <Typography variant="caption">
                                {sugerenciasIA.complejidad.confianza}% confianza
                              </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              {sugerenciasIA.complejidad.descripcion}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Factores: {sugerenciasIA.complejidad.factores.join(', ')}
                            </Typography>
                          </Paper>
                        </Grid>

                        {/* Tiempo Estimado */}
                        <Grid item xs={12} md={6}>
                          <Paper sx={{ p: 2, bgcolor: 'white' }}>
                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                              ⏱️ Tiempo Recomendado
                            </Typography>
                            <Typography variant="h6" color="primary" sx={{ mb: 1 }}>
                              {sugerenciasIA.tiempo.tiempoEstimado} horas
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              Rango: {sugerenciasIA.tiempo.tiempoMinimo}h - {sugerenciasIA.tiempo.tiempoMaximo}h
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {sugerenciasIA.tiempo.recomendacion}
                            </Typography>
                          </Paper>
                        </Grid>

                        {/* Cuadrilla Recomendada */}
                        <Grid item xs={12} md={6}>
                          <Paper sx={{ p: 2, bgcolor: 'white' }}>
                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                              👥 Cuadrilla Sugerida
                            </Typography>
                            {sugerenciasIA.cuadrilla.cuadrillaRecomendada.map((instalador, index) => (
                              <Chip
                                key={index}
                                label={`${instalador.nombre} (${instalador.especialidad})`}
                                variant="outlined"
                                size="small"
                                sx={{ mr: 1, mb: 1 }}
                              />
                            ))}
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              <strong>Responsable:</strong> {sugerenciasIA.cuadrilla.responsableSugerido.nombre}
                            </Typography>
                          </Paper>
                        </Grid>

                        {/* Herramientas */}
                        <Grid item xs={12} md={6}>
                          <Paper sx={{ p: 2, bgcolor: 'white' }}>
                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                              🛠️ Herramientas Requeridas
                            </Typography>
                            <Box sx={{ mb: 1 }}>
                              {sugerenciasIA.herramientas.herramientasRequeridas.map((herramienta, index) => (
                                <Chip
                                  key={index}
                                  label={herramienta}
                                  color="primary"
                                  variant="outlined"
                                  size="small"
                                  sx={{ mr: 0.5, mb: 0.5 }}
                                />
                              ))}
                            </Box>
                            {sugerenciasIA.herramientas.herramientasOpcionales.length > 0 && (
                              <Box>
                                <Typography variant="caption" color="text.secondary">
                                  Opcionales:
                                </Typography>
                                {sugerenciasIA.herramientas.herramientasOpcionales.map((herramienta, index) => (
                                  <Chip
                                    key={index}
                                    label={herramienta}
                                    variant="outlined"
                                    size="small"
                                    sx={{ mr: 0.5, mb: 0.5, ml: 0.5 }}
                                  />
                                ))}
                              </Box>
                            )}
                          </Paper>
                        </Grid>

                        {/* Confianza General */}
                        <Grid item xs={12}>
                          <Alert 
                            severity={sugerenciasIA.confianza >= 80 ? 'success' : 
                                     sugerenciasIA.confianza >= 60 ? 'info' : 'warning'}
                            sx={{ bgcolor: 'white' }}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box>
                                <strong>Confianza del análisis: {sugerenciasIA.confianza}%</strong>
                                <br />
                                Las sugerencias se han aplicado automáticamente al formulario. 
                                Puedes modificarlas según tu criterio.
                              </Box>
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => generarSugerenciasInteligentes(formData.proyectoId)}
                                disabled={cargandoSugerencias}
                                startIcon={<BuildIcon />}
                              >
                                Regenerar
                              </Button>
                            </Box>
                          </Alert>
                        </Grid>
                      </Grid>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                <DateTimePicker
                  label="Fecha y Hora de Instalación"
                  value={formData.fechaProgramada}
                  onChange={(newValue) => {
                    setFormData({ ...formData, fechaProgramada: newValue });
                  }}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                  minDateTime={new Date()}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Tipo de Instalación"
                value={formData.tipoInstalacion}
                onChange={(e) => {
                  const tipo = tiposInstalacion.find(t => t.value === e.target.value);
                  setFormData({ 
                    ...formData, 
                    tipoInstalacion: e.target.value,
                    tiempoEstimado: tipo?.tiempo || 4
                  });
                }}
              >
                {tiposInstalacion.map((tipo) => (
                  <MenuItem key={tipo.value} value={tipo.value}>
                    {tipo.label} ({tipo.tiempo}h estimadas)
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Prioridad"
                value={formData.prioridad}
                onChange={(e) => setFormData({ ...formData, prioridad: e.target.value })}
              >
                {prioridades.map((prioridad) => (
                  <MenuItem key={prioridad.value} value={prioridad.value}>
                    <Chip 
                      label={prioridad.label} 
                      size="small" 
                      sx={{ bgcolor: prioridad.color, color: 'white' }}
                    />
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                type="number"
                fullWidth
                label="Tiempo Estimado (horas)"
                value={formData.tiempoEstimado}
                onChange={(e) => setFormData({ ...formData, tiempoEstimado: parseInt(e.target.value) })}
                inputProps={{ min: 1, max: 12 }}
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                👥 Seleccionar Instaladores
              </Typography>
              <Autocomplete
                multiple
                options={instaladoresDisponibles}
                getOptionLabel={(option) => `${option.nombre} (${option.especialidad})`}
                value={instaladoresDisponibles.filter(inst => 
                  formData.instaladores.includes(inst.id)
                )}
                onChange={(event, newValue) => {
                  setFormData({ 
                    ...formData, 
                    instaladores: newValue.map(inst => inst.id)
                  });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Instaladores Asignados"
                    placeholder="Seleccionar instaladores..."
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      variant="outlined"
                      label={option.nombre}
                      {...getTagProps({ index })}
                    />
                  ))
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Responsable de Cuadrilla"
                value={formData.responsable}
                onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
              >
                {instaladoresDisponibles
                  .filter(inst => formData.instaladores.includes(inst.id))
                  .map((instalador) => (
                    <MenuItem key={instalador.id} value={instalador.id}>
                      {instalador.nombre} - {instalador.especialidad}
                    </MenuItem>
                  ))}
              </TextField>
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                🛠️ Herramientas Especiales
              </Typography>
              <Autocomplete
                multiple
                freeSolo
                options={herramientasComunes}
                value={formData.herramientasEspeciales}
                onChange={(event, newValue) => {
                  setFormData({ ...formData, herramientasEspeciales: newValue });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Herramientas Requeridas"
                    placeholder="Agregar herramientas..."
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      variant="outlined"
                      label={option}
                      {...getTagProps({ index })}
                    />
                  ))
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Materiales Adicionales"
                value={formData.materialesAdicionales}
                onChange={(e) => setFormData({ ...formData, materialesAdicionales: e.target.value })}
                placeholder="Materiales adicionales requeridos..."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Observaciones Especiales"
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                placeholder="Instrucciones especiales, acceso, contacto del cliente, etc..."
              />
            </Grid>
          </Grid>
        );

      case 4:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                ✅ Confirmación de Instalación
              </Typography>
              <Paper sx={{ p: 3, bgcolor: 'background.default' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2">
                      <strong>Proyecto:</strong> {formData.proyecto?.numero}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2">
                      <strong>Cliente:</strong> {formData.proyecto?.cliente}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2">
                      <strong>Fecha:</strong> {formData.fechaProgramada?.toLocaleString('es-MX')}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2">
                      <strong>Tipo:</strong> {tiposInstalacion.find(t => t.value === formData.tipoInstalacion)?.label}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2">
                      <strong>Instaladores:</strong> {formData.instaladores.length}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2">
                      <strong>Tiempo estimado:</strong> {formData.tiempoEstimado}h
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.notificarCliente}
                    onChange={(e) => setFormData({ ...formData, notificarCliente: e.target.checked })}
                  />
                }
                label="Notificar al cliente por WhatsApp/SMS"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.confirmarFecha}
                    onChange={(e) => setFormData({ ...formData, confirmarFecha: e.target.checked })}
                  />
                }
                label="Confirmar fecha con el cliente antes de la instalación"
              />
            </Grid>
          </Grid>
        );

      default:
        return 'Paso desconocido';
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            📅 Programar Nueva Instalación
          </Typography>
          <Button
            variant="outlined"
            startIcon={<CancelIcon />}
            onClick={() => navigate('/instalaciones')}
          >
            Cancelar
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        <Card>
          <CardContent>
            <Stepper activeStep={activeStep} orientation="vertical">
              {steps.map((label, index) => (
                <Step key={label}>
                  <StepLabel>
                    <Typography variant="h6">{label}</Typography>
                  </StepLabel>
                  <StepContent>
                    <Box sx={{ mt: 2, mb: 2 }}>
                      {renderStepContent(index)}
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Button
                        variant="contained"
                        onClick={index === steps.length - 1 ? handleSubmit : handleNext}
                        disabled={loading || (index === 0 && !formData.proyectoId)}
                        startIcon={index === steps.length - 1 ? <SaveIcon /> : <CheckIcon />}
                        sx={{ mt: 1, mr: 1 }}
                      >
                        {loading ? 'Guardando...' : 
                         index === steps.length - 1 ? 'Programar Instalación' : 'Continuar'}
                      </Button>
                      <Button
                        disabled={index === 0 || loading}
                        onClick={handleBack}
                        sx={{ mt: 1, mr: 1 }}
                      >
                        Atrás
                      </Button>
                    </Box>
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          </CardContent>
        </Card>
      </Box>
    </LocalizationProvider>
  );
};

export default ProgramarInstalacion;

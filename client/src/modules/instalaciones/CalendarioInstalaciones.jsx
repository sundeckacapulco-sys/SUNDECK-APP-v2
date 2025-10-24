import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Alert, 
  Button,
  Grid,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Avatar,
  Badge,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  MenuItem,
  Fab
} from '@mui/material';
import {
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  Today as TodayIcon,
  CalendarViewMonth as MonthIcon,
  CalendarViewWeek as WeekIcon,
  CalendarToday as DayIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import instalacionesApi from './services/instalacionesApi';

const CalendarioInstalaciones = () => {
  const navigate = useNavigate();
  
  // Estados del calendario
  const [fechaActual, setFechaActual] = useState(new Date());
  const [vistaCalendario, setVistaCalendario] = useState('month'); // month, week, day
  const [instalaciones, setInstalaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({
    cuadrilla: '',
    estado: '',
    prioridad: ''
  });

  // Datos para filtros
  const cuadrillasDisponibles = [
    { value: '', label: 'Todas las cuadrillas' },
    { value: 'cuadrilla_1', label: 'Cuadrilla A' },
    { value: 'cuadrilla_2', label: 'Cuadrilla B' },
    { value: 'cuadrilla_3', label: 'Cuadrilla C' }
  ];

  const estadosDisponibles = [
    { value: '', label: 'Todos los estados' },
    { value: 'programada', label: 'Programada' },
    { value: 'en_proceso', label: 'En Proceso' },
    { value: 'completada', label: 'Completada' }
  ];

  // Cargar instalaciones del mes/semana actual
  const cargarInstalaciones = async () => {
    try {
      setLoading(true);
      
      // Calcular rango de fechas según la vista
      const { fechaInicio, fechaFin } = calcularRangoFechas();
      
      const filtrosCalendario = {
        ...filtros,
        fecha_desde: fechaInicio.toISOString(),
        fecha_hasta: fechaFin.toISOString()
      };

      const response = await instalacionesApi.obtenerInstalaciones(filtrosCalendario);
      setInstalaciones(response.instalaciones || response || []);
      
    } catch (error) {
      console.error('Error cargando instalaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calcular rango de fechas según la vista
  const calcularRangoFechas = () => {
    const fecha = new Date(fechaActual);
    let fechaInicio, fechaFin;

    switch (vistaCalendario) {
      case 'month':
        fechaInicio = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
        fechaFin = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);
        break;
      case 'week':
        const diaActual = fecha.getDay();
        fechaInicio = new Date(fecha);
        fechaInicio.setDate(fecha.getDate() - diaActual);
        fechaFin = new Date(fechaInicio);
        fechaFin.setDate(fechaInicio.getDate() + 6);
        break;
      case 'day':
        fechaInicio = new Date(fecha);
        fechaFin = new Date(fecha);
        break;
      default:
        fechaInicio = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
        fechaFin = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);
    }

    return { fechaInicio, fechaFin };
  };

  // Cargar instalaciones cuando cambia la fecha o filtros
  useEffect(() => {
    cargarInstalaciones();
  }, [fechaActual, vistaCalendario, filtros]); // eslint-disable-line react-hooks/exhaustive-deps

  // Navegación del calendario
  const navegarCalendario = (direccion) => {
    const nuevaFecha = new Date(fechaActual);
    
    switch (vistaCalendario) {
      case 'month':
        nuevaFecha.setMonth(nuevaFecha.getMonth() + direccion);
        break;
      case 'week':
        nuevaFecha.setDate(nuevaFecha.getDate() + (direccion * 7));
        break;
      case 'day':
        nuevaFecha.setDate(nuevaFecha.getDate() + direccion);
        break;
    }
    
    setFechaActual(nuevaFecha);
  };

  // Obtener instalaciones para una fecha específica
  const obtenerInstalacionesFecha = (fecha) => {
    return instalaciones.filter(instalacion => {
      const fechaInstalacion = new Date(instalacion.fechaProgramada);
      return fechaInstalacion.toDateString() === fecha.toDateString();
    });
  };

  // Generar días del mes para vista mensual
  const generarDiasMes = () => {
    const fecha = new Date(fechaActual);
    const primerDia = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
    const ultimoDia = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);
    const diasMes = [];

    // Días del mes anterior para completar la primera semana
    const primerDiaSemana = primerDia.getDay();
    for (let i = primerDiaSemana - 1; i >= 0; i--) {
      const dia = new Date(primerDia);
      dia.setDate(dia.getDate() - (i + 1));
      diasMes.push({ fecha: dia, esDelMes: false });
    }

    // Días del mes actual
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      const fecha = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), dia);
      diasMes.push({ fecha, esDelMes: true });
    }

    // Días del siguiente mes para completar la última semana
    const diasRestantes = 42 - diasMes.length; // 6 semanas * 7 días
    for (let i = 1; i <= diasRestantes; i++) {
      const dia = new Date(ultimoDia);
      dia.setDate(dia.getDate() + i);
      diasMes.push({ fecha: dia, esDelMes: false });
    }

    return diasMes;
  };

  // Generar días de la semana para vista semanal
  const generarDiasSemana = () => {
    const fecha = new Date(fechaActual);
    const diaActual = fecha.getDay();
    const inicioSemana = new Date(fecha);
    inicioSemana.setDate(fecha.getDate() - diaActual);

    const diasSemana = [];
    for (let i = 0; i < 7; i++) {
      const dia = new Date(inicioSemana);
      dia.setDate(inicioSemana.getDate() + i);
      diasSemana.push(dia);
    }

    return diasSemana;
  };

  // Obtener color según estado
  const obtenerColorEstado = (estado) => {
    switch (estado) {
      case 'programada': return '#2196F3';
      case 'en_proceso': return '#FF9800';
      case 'completada': return '#4CAF50';
      case 'cancelada': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  // Obtener color según prioridad
  const obtenerColorPrioridad = (prioridad) => {
    switch (prioridad) {
      case 'urgente': return '#F44336';
      case 'alta': return '#FF9800';
      case 'media': return '#2196F3';
      case 'baja': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  // Formatear título del calendario
  const formatearTitulo = () => {
    const opciones = { 
      year: 'numeric', 
      month: 'long',
      ...(vistaCalendario === 'day' && { day: 'numeric' })
    };
    return fechaActual.toLocaleDateString('es-MX', opciones);
  };

  // Renderizar vista mensual
  const renderVistasMensual = () => {
    const diasMes = generarDiasMes();
    const nombresDias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    return (
      <Paper sx={{ p: 2 }}>
        {/* Encabezados de días */}
        <Grid container spacing={1} sx={{ mb: 1 }}>
          {nombresDias.map((dia, index) => (
            <Grid item xs key={index}>
              <Typography 
                variant="subtitle2" 
                align="center" 
                sx={{ fontWeight: 'bold', color: 'text.secondary' }}
              >
                {dia}
              </Typography>
            </Grid>
          ))}
        </Grid>

        {/* Días del mes */}
        <Grid container spacing={1}>
          {diasMes.map((diaInfo, index) => {
            const instalacionesDia = obtenerInstalacionesFecha(diaInfo.fecha);
            const esHoy = diaInfo.fecha.toDateString() === new Date().toDateString();

            return (
              <Grid item xs key={index}>
                <Paper 
                  sx={{ 
                    minHeight: 120,
                    p: 1,
                    bgcolor: diaInfo.esDelMes ? 'background.paper' : 'background.default',
                    border: esHoy ? '2px solid #2196F3' : '1px solid #e0e0e0',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                  onClick={() => {
                    setFechaActual(diaInfo.fecha);
                    setVistaCalendario('day');
                  }}
                >
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: esHoy ? 'bold' : 'normal',
                      color: diaInfo.esDelMes ? 'text.primary' : 'text.disabled'
                    }}
                  >
                    {diaInfo.fecha.getDate()}
                  </Typography>
                  
                  {/* Instalaciones del día */}
                  <Box sx={{ mt: 1 }}>
                    {instalacionesDia.slice(0, 3).map((instalacion, idx) => (
                      <Chip
                        key={idx}
                        label={`${instalacion.numero || 'INS'} - ${instalacion.cliente?.nombre || 'Cliente'}`}
                        size="small"
                        sx={{
                          fontSize: '0.6rem',
                          height: 18,
                          mb: 0.5,
                          width: '100%',
                          bgcolor: obtenerColorEstado(instalacion.estado),
                          color: 'white',
                          '& .MuiChip-label': { px: 1 }
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/instalaciones/${instalacion._id}`);
                        }}
                      />
                    ))}
                    {instalacionesDia.length > 3 && (
                      <Typography variant="caption" color="text.secondary">
                        +{instalacionesDia.length - 3} más
                      </Typography>
                    )}
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Paper>
    );
  };

  // Renderizar vista semanal
  const renderVistaSemanal = () => {
    const diasSemana = generarDiasSemana();
    const nombresDias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    return (
      <Paper sx={{ p: 2 }}>
        <Grid container spacing={2}>
          {diasSemana.map((dia, index) => {
            const instalacionesDia = obtenerInstalacionesFecha(dia);
            const esHoy = dia.toDateString() === new Date().toDateString();

            return (
              <Grid item xs key={index}>
                <Paper 
                  sx={{ 
                    minHeight: 300,
                    p: 2,
                    border: esHoy ? '2px solid #2196F3' : '1px solid #e0e0e0'
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    {nombresDias[index]}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {dia.getDate()} de {dia.toLocaleDateString('es-MX', { month: 'long' })}
                  </Typography>
                  
                  {/* Instalaciones del día */}
                  <Box sx={{ mt: 2 }}>
                    {instalacionesDia.map((instalacion, idx) => (
                      <Card 
                        key={idx} 
                        sx={{ 
                          mb: 1, 
                          cursor: 'pointer',
                          borderLeft: `4px solid ${obtenerColorEstado(instalacion.estado)}`
                        }}
                        onClick={() => navigate(`/instalaciones/${instalacion._id}`)}
                      >
                        <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                          <Typography variant="body2" fontWeight="bold">
                            {instalacion.numero || 'Sin número'}
                          </Typography>
                          <Typography variant="caption" display="block">
                            {instalacion.cliente?.nombre || 'Cliente no definido'}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                            <Chip 
                              label={instalacion.estado} 
                              size="small"
                              sx={{ 
                                bgcolor: obtenerColorEstado(instalacion.estado),
                                color: 'white',
                                fontSize: '0.6rem',
                                height: 16
                              }}
                            />
                            {instalacion.prioridad && (
                              <Chip 
                                label={instalacion.prioridad} 
                                size="small"
                                variant="outlined"
                                sx={{ 
                                  borderColor: obtenerColorPrioridad(instalacion.prioridad),
                                  color: obtenerColorPrioridad(instalacion.prioridad),
                                  fontSize: '0.6rem',
                                  height: 16
                                }}
                              />
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                    
                    {instalacionesDia.length === 0 && (
                      <Typography variant="body2" color="text.disabled" align="center">
                        Sin instalaciones
                      </Typography>
                    )}
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Paper>
    );
  };

  // Renderizar vista diaria
  const renderVistaDiaria = () => {
    const instalacionesDia = obtenerInstalacionesFecha(fechaActual);

    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          {fechaActual.toLocaleDateString('es-MX', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Typography>

        {instalacionesDia.length === 0 ? (
          <Alert severity="info">
            No hay instalaciones programadas para este día.
          </Alert>
        ) : (
          <Grid container spacing={2}>
            {instalacionesDia.map((instalacion, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    borderLeft: `6px solid ${obtenerColorEstado(instalacion.estado)}`,
                    '&:hover': { boxShadow: 3 }
                  }}
                  onClick={() => navigate(`/instalaciones/${instalacion._id}`)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6">
                        {instalacion.numero || 'Sin número'}
                      </Typography>
                      <Chip 
                        label={instalacion.estado} 
                        color={instalacion.estado === 'completada' ? 'success' : 
                               instalacion.estado === 'en_proceso' ? 'warning' : 'info'}
                        size="small"
                      />
                    </Box>
                    
                    <Typography variant="body1" gutterBottom>
                      <strong>Cliente:</strong> {instalacion.cliente?.nombre || 'No definido'}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Hora:</strong> {new Date(instalacion.fechaProgramada).toLocaleTimeString('es-MX', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Tiempo estimado:</strong> {instalacion.tiempoEstimado || 4} horas
                    </Typography>
                    
                    {instalacion.instaladores && instalacion.instaladores.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Cuadrilla: {instalacion.instaladores.length} instaladores
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header del calendario */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          📅 Calendario de Instalaciones
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={cargarInstalaciones}
            disabled={loading}
          >
            Actualizar
          </Button>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => navigate('/instalaciones/kpis')}
            sx={{ borderColor: '#FF9800', color: '#FF9800' }}
          >
            📊 KPIs
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/instalaciones/programar')}
          >
            Nueva Instalación
          </Button>
        </Box>
      </Box>

      {/* Controles del calendario */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            {/* Navegación de fechas */}
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton onClick={() => navegarCalendario(-1)}>
                  <PrevIcon />
                </IconButton>
                <Typography variant="h6" sx={{ minWidth: 200, textAlign: 'center' }}>
                  {formatearTitulo()}
                </Typography>
                <IconButton onClick={() => navegarCalendario(1)}>
                  <NextIcon />
                </IconButton>
                <IconButton onClick={() => setFechaActual(new Date())}>
                  <TodayIcon />
                </IconButton>
              </Box>
            </Grid>

            {/* Selector de vista */}
            <Grid item xs={12} md={4}>
              <ToggleButtonGroup
                value={vistaCalendario}
                exclusive
                onChange={(e, newView) => newView && setVistaCalendario(newView)}
                size="small"
              >
                <ToggleButton value="month">
                  <MonthIcon sx={{ mr: 1 }} />
                  Mes
                </ToggleButton>
                <ToggleButton value="week">
                  <WeekIcon sx={{ mr: 1 }} />
                  Semana
                </ToggleButton>
                <ToggleButton value="day">
                  <DayIcon sx={{ mr: 1 }} />
                  Día
                </ToggleButton>
              </ToggleButtonGroup>
            </Grid>

            {/* Filtros */}
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  select
                  size="small"
                  label="Estado"
                  value={filtros.estado}
                  onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
                  sx={{ minWidth: 120 }}
                >
                  {estadosDisponibles.map((estado) => (
                    <MenuItem key={estado.value} value={estado.value}>
                      {estado.label}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  size="small"
                  label="Cuadrilla"
                  value={filtros.cuadrilla}
                  onChange={(e) => setFiltros({ ...filtros, cuadrilla: e.target.value })}
                  sx={{ minWidth: 120 }}
                >
                  {cuadrillasDisponibles.map((cuadrilla) => (
                    <MenuItem key={cuadrilla.value} value={cuadrilla.value}>
                      {cuadrilla.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Vista del calendario */}
      <Box sx={{ mb: 3 }}>
        {loading ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography>Cargando instalaciones...</Typography>
          </Paper>
        ) : (
          <>
            {vistaCalendario === 'month' && renderVistasMensual()}
            {vistaCalendario === 'week' && renderVistaSemanal()}
            {vistaCalendario === 'day' && renderVistaDiaria()}
          </>
        )}
      </Box>

      {/* Leyenda */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🎨 Leyenda de Estados
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip label="Programada" sx={{ bgcolor: '#2196F3', color: 'white' }} size="small" />
            <Chip label="En Proceso" sx={{ bgcolor: '#FF9800', color: 'white' }} size="small" />
            <Chip label="Completada" sx={{ bgcolor: '#4CAF50', color: 'white' }} size="small" />
            <Chip label="Cancelada" sx={{ bgcolor: '#F44336', color: 'white' }} size="small" />
          </Box>
        </CardContent>
      </Card>

      {/* FAB para nueva instalación */}
      <Fab
        color="primary"
        aria-label="nueva instalación"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => navigate('/instalaciones/programar')}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};

export default CalendarioInstalaciones;

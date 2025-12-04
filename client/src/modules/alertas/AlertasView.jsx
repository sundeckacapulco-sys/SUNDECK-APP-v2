import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Link,
  Stack,
  Tabs,
  Tab,
  Typography
} from '@mui/material';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import RefreshIcon from '@mui/icons-material/Refresh';
import PhoneIcon from '@mui/icons-material/Phone';
import EventIcon from '@mui/icons-material/Event';
import BuildIcon from '@mui/icons-material/Build';
import ScheduleIcon from '@mui/icons-material/Schedule';
import useAlertasInteligentes from './hooks/useAlertasInteligentes';
import axiosConfig from '../../config/axios';

const TabsPanel = ({ value, onChange, totalComercial, totalFabricacion, totalPendientes }) => (
  <Tabs
    value={value}
    onChange={onChange}
    variant="scrollable"
    scrollButtons="auto"
    sx={{ borderBottom: '1px solid #E2E8F0' }}
  >
    <Tab label={`📅 Pendientes Hoy (${totalPendientes})`} value="pendientes" />
    <Tab label={`Comercial (${totalComercial})`} value="comercial" />
    <Tab label={`Fabricación (${totalFabricacion})`} value="fabricacion" />
    <Tab label={`Todas (${totalComercial + totalFabricacion})`} value="todas" />
  </Tabs>
);

// Componente para mostrar pendientes del día
const PendientesHoy = ({ pendientes, onVerProyecto }) => {
  const { llamadas = [], citas = [], instalaciones = [], seguimientos = [] } = pendientes;
  const total = llamadas.length + citas.length + instalaciones.length + seguimientos.length;

  if (total === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Typography variant="h6" sx={{ color: '#22C55E', mb: 1 }}>✅ Sin pendientes para hoy</Typography>
        <Typography variant="body2" sx={{ color: '#64748B' }}>
          No hay llamadas, citas, instalaciones o seguimientos programados para hoy.
        </Typography>
      </Box>
    );
  }

  const PendienteCard = ({ item, tipo, icon, color, bgColor }) => (
    <Card 
      variant="outlined" 
      sx={{ 
        borderRadius: 2, 
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': { borderColor: color, bgcolor: bgColor }
      }}
      onClick={() => onVerProyecto(item)}
    >
      <CardContent sx={{ p: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ 
            width: 40, 
            height: 40, 
            borderRadius: '50%', 
            bgcolor: color, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            {icon}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#0F172A' }}>
              {item.cliente}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B' }}>
              {item.numero} • {item.hora}
              {item.telefono && ` • 📞 ${item.telefono}`}
              {item.direccion && ` • 📍 ${item.direccion}`}
              {item.accion && ` • → ${item.accion}`}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            {item.prioridad && (
              <Chip 
                label={item.prioridad} 
                size="small"
                sx={{ 
                  bgcolor: item.prioridad === 'urgente' ? '#FEE2E2' : 
                           item.prioridad === 'alta' ? '#FEF3C7' : '#F1F5F9',
                  color: item.prioridad === 'urgente' ? '#991B1B' : 
                         item.prioridad === 'alta' ? '#92400E' : '#475569'
                }}
              />
            )}
            <Chip label={tipo} size="small" sx={{ bgcolor: bgColor, color }} />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <Stack spacing={3}>
      {/* Llamadas */}
      {llamadas.length > 0 && (
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <PhoneIcon sx={{ color: '#3B82F6' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Llamadas Programadas ({llamadas.length})
            </Typography>
          </Stack>
          <Stack spacing={1.5}>
            {llamadas.map((item, idx) => (
              <PendienteCard 
                key={idx} 
                item={item} 
                tipo="Llamada"
                icon={<PhoneIcon sx={{ color: 'white', fontSize: 20 }} />}
                color="#3B82F6"
                bgColor="#EFF6FF"
              />
            ))}
          </Stack>
        </Box>
      )}

      {/* Instalaciones */}
      {instalaciones.length > 0 && (
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <BuildIcon sx={{ color: '#F97316' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Instalaciones del Día ({instalaciones.length})
            </Typography>
          </Stack>
          <Stack spacing={1.5}>
            {instalaciones.map((item, idx) => (
              <PendienteCard 
                key={idx} 
                item={item} 
                tipo="Instalación"
                icon={<BuildIcon sx={{ color: 'white', fontSize: 20 }} />}
                color="#F97316"
                bgColor="#FFF7ED"
              />
            ))}
          </Stack>
        </Box>
      )}

      {/* Citas */}
      {citas.length > 0 && (
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <EventIcon sx={{ color: '#8B5CF6' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Citas Programadas ({citas.length})
            </Typography>
          </Stack>
          <Stack spacing={1.5}>
            {citas.map((item, idx) => (
              <PendienteCard 
                key={idx} 
                item={item} 
                tipo="Cita"
                icon={<EventIcon sx={{ color: 'white', fontSize: 20 }} />}
                color="#8B5CF6"
                bgColor="#F5F3FF"
              />
            ))}
          </Stack>
        </Box>
      )}

      {/* Seguimientos */}
      {seguimientos.length > 0 && (
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <ScheduleIcon sx={{ color: '#6366F1' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Seguimientos Pendientes ({seguimientos.length})
            </Typography>
          </Stack>
          <Stack spacing={1.5}>
            {seguimientos.map((item, idx) => (
              <PendienteCard 
                key={idx} 
                item={item} 
                tipo="Seguimiento"
                icon={<ScheduleIcon sx={{ color: 'white', fontSize: 20 }} />}
                color="#6366F1"
                bgColor="#EEF2FF"
              />
            ))}
          </Stack>
        </Box>
      )}
    </Stack>
  );
};

const ListaAlertas = ({ categoria, onVerProyecto }) => {
  const items = categoria.items || [];

  if (items.length === 0) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography variant="body2" sx={{ color: '#64748B' }}>
          No hay registros para esta categoría.
        </Typography>
      </Box>
    );
  }

  const renderDetalleCategoria = (categoriaTipo, item) => {
    if (categoriaTipo === 'materiales_faltantes') {
      return (
        <Stack spacing={0.5} sx={{ mt: 1 }}>
          {item.materialesPendientes?.slice(0, 3).map((material, idx) => (
            <Typography key={`${item.id}-material-${idx}`} variant="caption" sx={{ color: '#475569' }}>
              • {material.nombre || 'Material sin nombre'}
              {material.cantidad
                ? ` (${material.cantidad}${material.unidad ? ` ${material.unidad}` : ''})`
                : ''}
            </Typography>
          ))}
          {(item.materialesPendientes?.length || 0) > 3 && (
            <Typography variant="caption" sx={{ color: '#94A3B8' }}>
              +{item.materialesPendientes.length - 3} material(es) adicionales pendientes
            </Typography>
          )}
        </Stack>
      );
    }

    if (categoriaTipo === 'fabricacion_retrasada') {
      return (
        <Typography variant="caption" sx={{ color: '#DC2626', fontWeight: 600 }}>
          {item.diasRetraso} día(s) de retraso frente a la fecha estimada
        </Typography>
      );
    }

    if (categoriaTipo === 'calidad_pendiente') {
      return (
        <Typography variant="caption" sx={{ color: '#EA580C', fontWeight: 600 }}>
          {item.diasPendientes} día(s) sin control de calidad
        </Typography>
      );
    }

    if (typeof item.diasInactividad === 'number') {
      return (
        <Typography variant="caption" sx={{ color: '#64748B' }}>
          {item.diasInactividad} día(s) de inactividad
        </Typography>
      );
    }

    return null;
  };

  const construirChips = (categoriaTipo, item) => {
    const chips = [];

    chips.push({
      key: 'prioridad',
      label: `Prioridad: ${item.prioridad || 'normal'}`,
      sx: { backgroundColor: '#EEF2FF', color: '#312E81' }
    });

    if (typeof item.diasRetraso === 'number' && categoriaTipo === 'fabricacion_retrasada') {
      chips.push({
        key: 'diasRetraso',
        label: `${item.diasRetraso} días de retraso`,
        sx: { backgroundColor: '#FEE2E2', color: '#991B1B' }
      });
    }

    if (typeof item.diasPendientes === 'number' && categoriaTipo === 'calidad_pendiente') {
      chips.push({
        key: 'diasPendientes',
        label: `${item.diasPendientes} días pendientes`,
        sx: { backgroundColor: '#FFEDD5', color: '#C2410C' }
      });
    }

    if (categoriaTipo === 'materiales_faltantes') {
      chips.push({
        key: 'materiales',
        label: `${item.materialesPendientes?.length ?? 0} materiales`,
        sx: { backgroundColor: '#FEF9C3', color: '#92400E' }
      });
    }

    if (typeof item.diasInactividad === 'number' && categoriaTipo !== 'fabricacion_retrasada') {
      chips.push({ key: 'diasInactividad', label: `${item.diasInactividad} días`, sx: {} });
    }

    if (item.responsable?.nombre) {
      chips.push({ key: 'responsable', label: `Responsable: ${item.responsable.nombre}`, sx: {} });
    }

    if (item.cliente?.telefono) {
      chips.push({ key: 'telefono', label: item.cliente.telefono, sx: {} });
    }

    return chips;
  };

  return (
    <Stack spacing={2} sx={{ mt: 2 }}>
      {items.map((item) => {
        const chips = construirChips(categoria.tipo, item);

        return (
          <Card key={item.id} variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between">
                <Box>
                  <Typography variant="subtitle1" sx={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
                    {item.cliente?.nombre || item.numero || 'Registro sin nombre'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#475569', mb: 1 }}>
                    {item.resumen}
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {chips.map((chip) => (
                      <Chip key={chip.key} label={chip.label} size="small" sx={chip.sx} />
                    ))}
                  </Stack>
                  {renderDetalleCategoria(categoria.tipo, item)}
                </Box>
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
                  {onVerProyecto && (
                    <Button variant="outlined" onClick={() => onVerProyecto(item)} sx={{ textTransform: 'none' }}>
                      Abrir detalle
                    </Button>
                  )}
                </Stack>
              </Stack>
              {item.acciones?.length > 0 && (
                <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap">
                  {item.acciones.map((accion) => (
                    <Chip
                      key={`${item.id}-${accion.tipo}`}
                      label={accion.etiqueta}
                      size="small"
                      sx={{ backgroundColor: '#F1F5F9', textTransform: 'none' }}
                    />
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        );
      })}
    </Stack>
  );
};

const AlertasView = () => {
  const navigate = useNavigate();
  const {
    data: dataComercial,
    loading: loadingComercial,
    error: errorComercial,
    cargarAlertas: cargarAlertasComercial
  } = useAlertasInteligentes({ limite: 50 });
  const {
    data: dataFabricacion,
    loading: loadingFabricacion,
    error: errorFabricacion,
    cargarAlertas: cargarAlertasFabricacion
  } = useAlertasInteligentes({ endpoint: '/alertas/inteligentes/fabricacion', limite: 50 });
  const [tab, setTab] = useState('pendientes');
  
  // Estado para pendientes del día
  const [pendientes, setPendientes] = useState({
    llamadas: [],
    citas: [],
    instalaciones: [],
    seguimientos: [],
    loading: true
  });

  const categoriasComercial = useMemo(() => dataComercial?.categorias || [], [dataComercial]);
  const categoriasFabricacion = useMemo(() => dataFabricacion?.categorias || [], [dataFabricacion]);

  const categoriasVisibles = useMemo(() => {
    if (tab === 'comercial') {
      return categoriasComercial;
    }
    if (tab === 'fabricacion') {
      return categoriasFabricacion;
    }
    if (tab === 'pendientes') {
      return [];
    }
    return [...categoriasComercial, ...categoriasFabricacion];
  }, [tab, categoriasComercial, categoriasFabricacion]);

  // Cargar pendientes del día
  const cargarPendientes = useCallback(async () => {
    try {
      setPendientes(prev => ({ ...prev, loading: true }));
      const response = await axiosConfig.get('/pendientes/hoy');
      
      if (response.data?.success) {
        const data = response.data.data;
        setPendientes({
          llamadas: data.llamadas || [],
          citas: data.citas || [],
          instalaciones: data.instalaciones || [],
          seguimientos: data.seguimientos || [],
          loading: false
        });
      } else {
        setPendientes(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Error cargando pendientes:', error);
      setPendientes(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    cargarAlertasComercial().catch(() => {});
    cargarAlertasFabricacion().catch(() => {});
    cargarPendientes();
  }, [cargarAlertasComercial, cargarAlertasFabricacion, cargarPendientes]);

  const handleVolver = () => navigate(-1);
  const handleTabChange = (_, value) => setTab(value);

  const refrescarActual = () => {
    if (tab === 'pendientes') {
      return cargarPendientes();
    }
    if (tab === 'comercial') {
      return cargarAlertasComercial();
    }
    if (tab === 'fabricacion') {
      return cargarAlertasFabricacion();
    }
    return Promise.all([cargarAlertasComercial(), cargarAlertasFabricacion(), cargarPendientes()]);
  };

  const resumenComercial = dataComercial?.resumen || {
    total: 0,
    prospectosInactivos: 0,
    proyectosSinMovimiento: 0
  };
  const resumenFabricacion = dataFabricacion?.resumen || {
    total: 0,
    ordenesRetrasadas: 0,
    materialesFaltantes: 0,
    controlCalidadPendiente: 0
  };
  
  const totalPendientes = pendientes.llamadas.length + pendientes.citas.length + 
                          pendientes.instalaciones.length + pendientes.seguimientos.length;

  const loadingActual =
    tab === 'pendientes'
      ? pendientes.loading
      : tab === 'todas'
        ? loadingComercial || loadingFabricacion
        : tab === 'comercial'
          ? loadingComercial
          : loadingFabricacion;

  const errorActual =
    tab === 'todas'
      ? errorComercial || errorFabricacion
      : tab === 'comercial'
        ? errorComercial
        : errorFabricacion;

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link underline="hover" color="inherit" onClick={() => navigate('/proyectos')} sx={{ cursor: 'pointer' }}>
          Proyectos
        </Link>
        <Typography color="text.primary">Alertas inteligentes</Typography>
      </Breadcrumbs>

      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
        <Button startIcon={<NavigateBeforeIcon />} onClick={handleVolver} sx={{ textTransform: 'none' }}>
          Regresar
        </Button>
        <Button
          startIcon={<RefreshIcon />}
          onClick={() => refrescarActual().catch(() => {})}
          disabled={loadingActual}
          sx={{ textTransform: 'none' }}
        >
          Actualizar
        </Button>
      </Stack>

      <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #E2E8F0' }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between">
            <Box>
              <Typography variant="h4" sx={{ fontFamily: 'Playfair Display, serif', color: '#0F172A' }}>
                Panel de alertas
              </Typography>
              <Typography variant="body2" sx={{ color: '#475569' }}>
                Visualiza prospectos y proyectos que requieren atención inmediata.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Chip label={`Total Comercial: ${resumenComercial.total}`} color="primary" variant="outlined" />
              <Chip
                label={`Prospectos: ${resumenComercial.prospectosInactivos}`}
                variant="outlined"
              />
              <Chip
                label={`Proyectos: ${resumenComercial.proyectosSinMovimiento}`}
                variant="outlined"
              />
              <Chip label={`Total Fabricación: ${resumenFabricacion.total}`} color="warning" variant="outlined" />
              <Chip
                label={`Retrasadas: ${resumenFabricacion.ordenesRetrasadas}`}
                variant="outlined"
              />
              <Chip
                label={`Materiales: ${resumenFabricacion.materialesFaltantes}`}
                variant="outlined"
              />
              <Chip
                label={`Calidad: ${resumenFabricacion.controlCalidadPendiente}`}
                variant="outlined"
              />
            </Stack>
          </Stack>

          <Box sx={{ mt: 3 }}>
            <TabsPanel
              value={tab}
              onChange={handleTabChange}
              totalComercial={resumenComercial.total}
              totalFabricacion={resumenFabricacion.total}
              totalPendientes={totalPendientes}
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          {loadingActual && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {errorActual && !loadingActual && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {errorActual}
            </Alert>
          )}

          {/* Tab de Pendientes del Día */}
          {tab === 'pendientes' && !loadingActual && (
            <PendientesHoy 
              pendientes={pendientes} 
              onVerProyecto={(item) => {
                if (item?.id) {
                  navigate(`/proyectos/${item.id}`);
                }
              }} 
            />
          )}

          {/* Tabs de Alertas */}
          {tab !== 'pendientes' && !loadingActual && !errorActual && categoriasVisibles.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="h6" sx={{ fontFamily: 'Playfair Display, serif', color: '#0F172A' }}>
                No hay alertas activas
              </Typography>
              <Typography variant="body2" sx={{ color: '#475569' }}>
                El sistema no detectó registros inactivos con los criterios actuales.
              </Typography>
            </Box>
          )}

          {tab !== 'pendientes' && !loadingActual && !errorActual && categoriasVisibles.length > 0 && (
            <Stack spacing={4}>
              {categoriasVisibles.map((categoria) => (
                <Box key={categoria.tipo}>
                  <Typography variant="h6" sx={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, mb: 1 }}>
                    {categoria.titulo}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748B', mb: 1 }}>
                    {categoria.descripcion}
                  </Typography>
                  <ListaAlertas categoria={categoria} onVerProyecto={(item) => {
                    if (item?.id) {
                      navigate(`/proyectos/${item.id}`);
                    }
                  }} />
                </Box>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default AlertasView;

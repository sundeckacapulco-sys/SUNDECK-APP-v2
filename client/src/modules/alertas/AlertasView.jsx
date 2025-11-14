import { useEffect, useMemo, useState } from 'react';
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
  Link,
  Stack,
  Tabs,
  Tab,
  Typography
} from '@mui/material';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import RefreshIcon from '@mui/icons-material/Refresh';
import useAlertasInteligentes from './hooks/useAlertasInteligentes';

const TabsPanel = ({ value, onChange, totalComercial, totalFabricacion }) => (
  <Tabs
    value={value}
    onChange={onChange}
    variant="scrollable"
    scrollButtons="auto"
    sx={{ borderBottom: '1px solid #E2E8F0' }}
  >
    <Tab label={`Comercial (${totalComercial})`} value="comercial" />
    <Tab label={`Fabricación (${totalFabricacion})`} value="fabricacion" />
    <Tab label={`Todas (${totalComercial + totalFabricacion})`} value="todas" />
  </Tabs>
);

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
  const [tab, setTab] = useState('todas');

  const categoriasComercial = useMemo(() => dataComercial?.categorias || [], [dataComercial]);
  const categoriasFabricacion = useMemo(() => dataFabricacion?.categorias || [], [dataFabricacion]);

  const categoriasVisibles = useMemo(() => {
    if (tab === 'comercial') {
      return categoriasComercial;
    }
    if (tab === 'fabricacion') {
      return categoriasFabricacion;
    }
    return [...categoriasComercial, ...categoriasFabricacion];
  }, [tab, categoriasComercial, categoriasFabricacion]);

  useEffect(() => {
    cargarAlertasComercial().catch(() => {});
    cargarAlertasFabricacion().catch(() => {});
  }, [cargarAlertasComercial, cargarAlertasFabricacion]);

  const handleVolver = () => navigate(-1);
  const handleTabChange = (_, value) => setTab(value);

  const refrescarActual = () => {
    if (tab === 'comercial') {
      return cargarAlertasComercial();
    }
    if (tab === 'fabricacion') {
      return cargarAlertasFabricacion();
    }
    return Promise.all([cargarAlertasComercial(), cargarAlertasFabricacion()]);
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

  const loadingActual =
    tab === 'todas'
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

          {!loadingActual && !errorActual && categoriasVisibles.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="h6" sx={{ fontFamily: 'Playfair Display, serif', color: '#0F172A' }}>
                No hay alertas activas
              </Typography>
              <Typography variant="body2" sx={{ color: '#475569' }}>
                El sistema no detectó registros inactivos con los criterios actuales.
              </Typography>
            </Box>
          )}

          {!loadingActual && !errorActual && categoriasVisibles.length > 0 && (
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

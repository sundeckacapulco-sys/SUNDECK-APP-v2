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

const TabsPanel = ({ value, onChange, categorias }) => (
  <Tabs
    value={value}
    onChange={onChange}
    variant="scrollable"
    scrollButtons="auto"
    sx={{ borderBottom: '1px solid #E2E8F0' }}
  >
    <Tab label={`Todas (${categorias.reduce((acc, cat) => acc + cat.total, 0)})`} value="todas" />
    {categorias.map((categoria) => (
      <Tab key={categoria.tipo} label={`${categoria.titulo} (${categoria.total})`} value={categoria.tipo} />
    ))}
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

  return (
    <Stack spacing={2} sx={{ mt: 2 }}>
      {items.map((item) => (
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
                <Chip
                  label={`Prioridad: ${item.prioridad || 'normal'}`}
                  size="small"
                  sx={{ backgroundColor: '#EEF2FF', color: '#312E81' }}
                />
                <Chip label={`${item.diasInactividad ?? 0} días`} size="small" />
                {item.responsable?.nombre && (
                  <Chip label={`Responsable: ${item.responsable.nombre}`} size="small" />
                )}
                {item.cliente?.telefono && (
                  <Chip label={item.cliente.telefono} size="small" />
                )}
              </Stack>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
              {onVerProyecto && (
                <Button variant="outlined" onClick={() => onVerProyecto(item)} sx={{ textTransform: 'none' }}>
                  Abrir detalle
                </Button>
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>
      ))}
    </Stack>
  );
};

const AlertasView = () => {
  const navigate = useNavigate();
  const { data, loading, error, cargarAlertas } = useAlertasInteligentes({ limite: 50 });
  const [tab, setTab] = useState('todas');

  const categorias = useMemo(() => data?.categorias || [], [data]);
  const categoriasVisibles = useMemo(() => {
    if (tab === 'todas') {
      return categorias;
    }
    return categorias.filter((categoria) => categoria.tipo === tab);
  }, [categorias, tab]);

  useEffect(() => {
    cargarAlertas().catch(() => {});
  }, [cargarAlertas]);

  const handleVolver = () => navigate(-1);
  const handleTabChange = (_, value) => setTab(value);

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
          onClick={() => cargarAlertas().catch(() => {})}
          disabled={loading}
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
            {data?.resumen && (
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Chip label={`Total: ${data.resumen.total}`} color="primary" variant="outlined" />
                <Chip label={`Prospectos: ${data.resumen.prospectosInactivos}`} variant="outlined" />
                <Chip label={`Proyectos: ${data.resumen.proyectosSinMovimiento}`} variant="outlined" />
              </Stack>
            )}
          </Stack>

          <Box sx={{ mt: 3 }}>
            <TabsPanel value={tab} onChange={handleTabChange} categorias={categorias} />
          </Box>

          <Divider sx={{ my: 2 }} />

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {error && !loading && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {!loading && !error && categoriasVisibles.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="h6" sx={{ fontFamily: 'Playfair Display, serif', color: '#0F172A' }}>
                No hay alertas activas
              </Typography>
              <Typography variant="body2" sx={{ color: '#475569' }}>
                El sistema no detectó registros inactivos con los criterios actuales.
              </Typography>
            </Box>
          )}

          {!loading && !error && categoriasVisibles.length > 0 && (
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
                    if (item.tipo === 'prospecto_inactivo') {
                      navigate(`/proyectos/${item.id}`);
                    } else if (item.tipo === 'proyecto_sin_movimiento') {
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

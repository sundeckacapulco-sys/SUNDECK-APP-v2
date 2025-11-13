import { useEffect, useMemo } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Tooltip,
  Typography
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import AssignmentLateIcon from '@mui/icons-material/AssignmentLate';
import RefreshIcon from '@mui/icons-material/Refresh';
import useAlertasInteligentes from '../../alertas/hooks/useAlertasInteligentes';

const iconosPorCategoria = {
  prospectos_inactivos: <PersonSearchIcon sx={{ color: '#F97316' }} />,
  proyectos_sin_movimiento: <AssignmentLateIcon sx={{ color: '#DC2626' }} />
};

const prioridadAColor = {
  critica: '#DC2626',
  importante: '#F97316',
  normal: '#2563EB'
};

const PanelAlertas = ({ onVerAlertas, refreshToken }) => {
  const { data, loading, error, cargarAlertas } = useAlertasInteligentes({ limite: 4 });

  useEffect(() => {
    cargarAlertas().catch(() => {});
  }, [cargarAlertas, refreshToken]);

  const resumen = data?.resumen || { total: 0, prospectosInactivos: 0, proyectosSinMovimiento: 0 };
  const categorias = useMemo(() => data?.categorias || [], [data]);

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid #E2E8F0',
        background: 'linear-gradient(135deg, #F8FAFC 0%, #FFFFFF 100%)'
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                backgroundColor: '#0EA5E9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF'
              }}
            >
              <NotificationsActiveIcon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontFamily: 'Playfair Display, serif', mb: 0.25 }}>
                Alertas Inteligentes
              </Typography>
              <Typography variant="body2" sx={{ color: '#475569' }}>
                Seguimiento automático de prospectos y proyectos sin movimiento.
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              icon={<WarningAmberIcon sx={{ color: '#B91C1C !important' }} />}
              label={`${resumen.total} alertas activas`}
              sx={{
                backgroundColor: '#FEE2E2',
                color: '#B91C1C',
                fontWeight: 600
              }}
            />
            <Button
              size="small"
              variant="outlined"
              startIcon={<RefreshIcon sx={{ fontSize: 18 }} />}
              onClick={() => cargarAlertas().catch(() => {})}
              disabled={loading}
              sx={{ textTransform: 'none', borderColor: '#CBD5E1', color: '#0F172A' }}
            >
              Actualizar
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={onVerAlertas}
              sx={{ textTransform: 'none', backgroundColor: '#0F172A', '&:hover': { backgroundColor: '#1E293B' } }}
            >
              Ver todo
            </Button>
          </Stack>
        </Stack>

        <Divider sx={{ my: 2 }} />

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        )}

        {error && !loading && (
          <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && resumen.total === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="subtitle1" sx={{ fontFamily: 'Playfair Display, serif', color: '#0F172A' }}>
              ¡Todo en orden!
            </Typography>
            <Typography variant="body2" sx={{ color: '#475569' }}>
              No se detectaron alertas pendientes en las últimas 24 horas.
            </Typography>
          </Box>
        )}

        {!loading && !error && resumen.total > 0 && (
          <Stack spacing={2}>
            {categorias.map((categoria) => (
              <Box
                key={categoria.tipo}
                sx={{
                  border: '1px solid #E2E8F0',
                  borderRadius: 2,
                  p: 1.5,
                  backgroundColor: '#FFFFFF'
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    {iconosPorCategoria[categoria.tipo] || <WarningAmberIcon color="warning" />}
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
                        {categoria.titulo}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        {categoria.descripcion}
                      </Typography>
                    </Box>
                  </Stack>
                  <Chip
                    label={`${categoria.total} registro${categoria.total === 1 ? '' : 's'}`}
                    size="small"
                    sx={{ backgroundColor: '#EEF2FF', color: '#312E81', fontWeight: 600 }}
                  />
                </Stack>

                <Stack spacing={1.25}>
                  {categoria.items?.map((item) => (
                    <Box
                      key={item.id}
                      sx={{
                        border: '1px solid #E2E8F0',
                        borderRadius: 1.5,
                        p: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
                          {item.cliente?.nombre || item.numero || 'Registro sin nombre'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#475569' }}>
                          {item.resumen}
                        </Typography>
                        {item.responsable?.nombre && (
                          <Typography variant="caption" sx={{ color: '#64748B' }}>
                            Responsable: {item.responsable.nombre}
                          </Typography>
                        )}
                      </Box>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Tooltip title={`Prioridad ${item.prioridad || 'normal'}`}>
                          <Box
                            sx={{
                              width: 10,
                              height: 36,
                              borderRadius: 1,
                              backgroundColor: prioridadAColor[item.prioridad] || '#2563EB'
                            }}
                          />
                        </Tooltip>
                        <Chip
                          label={`${item.diasInactividad ?? 0} días`}
                          size="small"
                          sx={{ backgroundColor: '#F8FAFC', fontWeight: 500 }}
                        />
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </Box>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};

export default PanelAlertas;

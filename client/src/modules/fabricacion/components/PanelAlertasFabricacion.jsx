import { useEffect, useMemo, useCallback } from 'react';
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
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import useAlertasInteligentes from '../../alertas/hooks/useAlertasInteligentes';

const iconosPorCategoria = {
  fabricacion_retrasada: <AccessTimeIcon sx={{ color: '#DC2626' }} />, // 🔴
  materiales_faltantes: <Inventory2Icon sx={{ color: '#CA8A04' }} />, // 🟡
  calidad_pendiente: <FactCheckIcon sx={{ color: '#EA580C' }} /> // 🟠
};

const prioridadAColor = {
  critica: '#DC2626',
  alta: '#FACC15',
  importante: '#F97316',
  normal: '#2563EB'
};

const defaultResumen = {
  total: 0,
  ordenesRetrasadas: 0,
  materialesFaltantes: 0,
  controlCalidadPendiente: 0
};

const PanelAlertasFabricacion = ({ onVerFabricacion, refreshToken }) => {
  const { data, loading, error, cargarAlertas } = useAlertasInteligentes({
    endpoint: '/alertas/inteligentes/fabricacion',
    limite: 5
  });

  useEffect(() => {
    cargarAlertas().catch(() => {});
  }, [cargarAlertas, refreshToken]);

  const resumen = data?.resumen || defaultResumen;
  const categorias = useMemo(() => data?.categorias || [], [data]);

  const manejarAccionRapida = useCallback((accion, alerta) => {
    if (!accion) return;

    const evento = new CustomEvent('alerta-fabricacion-accion', {
      detail: {
        tipo: accion.tipo,
        alerta
      }
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(evento);
    }
  }, []);

  const renderAcciones = (alerta) => {
    if (!alerta?.acciones?.length) {
      return null;
    }

    return (
      <Stack direction="row" spacing={1} flexWrap="wrap">
        {alerta.acciones.map((accion) => (
          <Button
            key={accion.tipo}
            size="small"
            variant="outlined"
            onClick={() => manejarAccionRapida(accion, alerta)}
            sx={{
              textTransform: 'none',
              borderColor: '#E2E8F0',
              color: '#1E293B',
              fontSize: '0.7rem'
            }}
          >
            {accion.etiqueta}
          </Button>
        ))}
      </Stack>
    );
  };

  const renderDetallesCategoria = (categoria, item) => {
    if (categoria.tipo === 'materiales_faltantes') {
      return (
        <Stack spacing={0.5} sx={{ mt: 1 }}>
          {item.materialesPendientes?.slice(0, 3).map((material, idx) => (
            <Typography key={`${item.id}-material-${idx}`} variant="caption" sx={{ color: '#475569' }}>
              • {material.nombre || 'Material sin nombre'}
              {material.cantidad ? ` (${material.cantidad}${material.unidad ? ` ${material.unidad}` : ''})` : ''}
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

    if (categoria.tipo === 'fabricacion_retrasada') {
      return (
        <Typography variant="caption" sx={{ color: '#DC2626', fontWeight: 600 }}>
          {item.diasRetraso} día(s) de retraso
        </Typography>
      );
    }

    if (categoria.tipo === 'calidad_pendiente') {
      return (
        <Typography variant="caption" sx={{ color: '#EA580C', fontWeight: 600 }}>
          {item.diasPendientes} día(s) sin control de calidad
        </Typography>
      );
    }

    return null;
  };

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid #E2E8F0',
        background: 'linear-gradient(135deg, #FFF7ED 0%, #FFFFFF 100%)'
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                backgroundColor: '#F97316',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF'
              }}
            >
              <PrecisionManufacturingIcon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontFamily: 'Playfair Display, serif', mb: 0.25 }}>
                Alertas de Fabricación
              </Typography>
              <Typography variant="body2" sx={{ color: '#475569' }}>
                Monitoreo inteligente de órdenes retrasadas, materiales y control de calidad.
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
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
            {typeof onVerFabricacion === 'function' && (
              <Button
                size="small"
                variant="contained"
                onClick={onVerFabricacion}
                sx={{
                  textTransform: 'none',
                  backgroundColor: '#0F172A',
                  '&:hover': { backgroundColor: '#1E293B' }
                }}
              >
                Ver módulo
              </Button>
            )}
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
              Producción en orden
            </Typography>
            <Typography variant="body2" sx={{ color: '#475569' }}>
              No se detectaron retrasos ni pendientes críticos en la última revisión.
            </Typography>
          </Box>
        )}

        {!loading && !error && resumen.total > 0 && (
          <Stack spacing={2.25}>
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
                    sx={{
                      backgroundColor: '#FEF3C7',
                      color: '#92400E',
                      fontWeight: 600
                    }}
                  />
                </Stack>

                <Stack spacing={1.5}>
                  {categoria.items?.map((item) => (
                    <Box
                      key={item.id}
                      sx={{
                        border: '1px solid #E2E8F0',
                        borderRadius: 1.5,
                        p: 1.25,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1
                      }}
                    >
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between">
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
                            {item.cliente?.nombre || item.numero || 'Orden sin identificación'}
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
                                height: 42,
                                borderRadius: 1,
                                backgroundColor: prioridadAColor[item.prioridad] || '#2563EB'
                              }}
                            />
                          </Tooltip>
                          {categoria.tipo === 'fabricacion_retrasada' && (
                            <Chip
                              label={`${item.diasRetraso ?? 0} días`}
                              size="small"
                              sx={{ backgroundColor: '#FEE2E2', color: '#991B1B', fontWeight: 500 }}
                            />
                          )}
                          {categoria.tipo === 'calidad_pendiente' && (
                            <Chip
                              label={`${item.diasPendientes ?? 0} días`}
                              size="small"
                              sx={{ backgroundColor: '#FFEDD5', color: '#C2410C', fontWeight: 500 }}
                            />
                          )}
                          {categoria.tipo === 'materiales_faltantes' && (
                            <Chip
                              label={`${item.materialesPendientes?.length ?? 0} materiales`}
                              size="small"
                              sx={{ backgroundColor: '#FEF9C3', color: '#92400E', fontWeight: 500 }}
                            />
                          )}
                        </Stack>
                      </Stack>

                      {renderDetallesCategoria(categoria, item)}

                      {renderAcciones(item)}
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

export default PanelAlertasFabricacion;

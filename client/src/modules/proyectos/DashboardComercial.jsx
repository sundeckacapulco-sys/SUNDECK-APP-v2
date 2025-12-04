import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Stack
} from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axiosConfig from '../../config/axios';
import FiltrosComerciales from './components/FiltrosComerciales';
import KPIsComerciales from './components/KPIsComerciales';
import TablaComercial from './components/TablaComercial';
import PanelAlertasUnificado from './components/PanelAlertasUnificado';

const createDefaultKpiState = () => ({
  resumen: {
    total: 0,
    prospectos: 0,
    proyectos: 0,
    tasaConversion: 0,
    valorTotal: 0,
    promedioTicket: 0
  },
  humanos: {
    tiempoPromedioCierre: 0,
    tasaRespuesta: 0,
    referidosActivos: 0
  },
  porAsesor: [],
  porEstado: {},
  porMes: {}
});

const DashboardComercial = () => {
  const navigate = useNavigate();
  const [registros, setRegistros] = useState([]);
  const [filtros, setFiltros] = useState({
    tipo: 'todos',
    asesorComercial: '',
    estadoComercial: '',
    fechaDesde: null,
    fechaHasta: null,
    busqueda: ''
  });
  const [kpis, setKpis] = useState(() => createDefaultKpiState());
  const [loading, setLoading] = useState(false);
  const [kpiLoading, setKpiLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [alertasRefreshToken, setAlertasRefreshToken] = useState(0);
  const limit = 20;

  const cargarRegistros = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page,
        limit,
        ...(filtros.tipo !== 'todos' && { tipo: filtros.tipo }),
        ...(filtros.asesorComercial && { asesorComercial: filtros.asesorComercial }),
        ...(filtros.estadoComercial && { estadoComercial: filtros.estadoComercial }),
        ...(filtros.fechaDesde && { fechaDesde: filtros.fechaDesde }),
        ...(filtros.fechaHasta && { fechaHasta: filtros.fechaHasta }),
        ...(filtros.busqueda && { busqueda: filtros.busqueda })
      };

      const response = await axiosConfig.get('/proyectos', { params });
      const data = response.data.data || response.data;

      if (Array.isArray(data)) {
        setRegistros(data);
        setTotalRegistros(data.length);
        setTotalPages(1);
      } else {
        setRegistros(data.proyectos || data.registros || []);
        setTotalRegistros(data.total || 0);
        setTotalPages(data.pages || 1);
      }
    } catch (err) {
      console.error('❌ Error cargando registros:', err);
      setError(err.response?.data?.message || 'Error al cargar registros');
      setRegistros([]);
    } finally {
      setLoading(false);
    }
  }, [page, filtros, limit]);

  const cargarKPIs = useCallback(async () => {
    setKpiLoading(true);

    try {
      const params = {
        ...(filtros.tipo !== 'todos' && { tipo: filtros.tipo }),
        ...(filtros.asesorComercial && { asesorComercial: filtros.asesorComercial }),
        ...(filtros.estadoComercial && { estadoComercial: filtros.estadoComercial }),
        ...(filtros.fechaDesde && { fechaDesde: filtros.fechaDesde }),
        ...(filtros.fechaHasta && { fechaHasta: filtros.fechaHasta })
      };

      const response = await axiosConfig.get('/proyectos/kpis/comerciales', { params });
      const data = response.data?.data || {};

      const resumen = {
        total: data.resumen?.total ?? 0,
        prospectos: data.resumen?.prospectos ?? 0,
        proyectos: data.resumen?.proyectos ?? 0,
        tasaConversion: data.resumen?.tasaConversion ?? 0,
        valorTotal: data.resumen?.valorTotal ?? 0,
        promedioTicket: data.resumen?.promedioTicket ?? 0
      };

      const humanos = {
        tiempoPromedioCierre: data.humanos?.tiempoPromedioCierre ?? 0,
        tasaRespuesta: data.humanos?.tasaRespuesta ?? 0,
        referidosActivos: data.humanos?.referidosActivos ?? 0
      };

      setKpis({
        resumen,
        humanos,
        porAsesor: Array.isArray(data.porAsesor) ? data.porAsesor : [],
        porEstado: data.porEstado || {},
        porMes: data.porMes || {}
      });
    } catch (err) {
      console.error('❌ Error obteniendo KPIs comerciales:', err);
      setError(prev => prev || err.response?.data?.message || 'Error al obtener KPIs comerciales');
      setKpis(createDefaultKpiState());
    } finally {
      setKpiLoading(false);
    }
  }, [filtros]);

  const handleFiltrosChange = useCallback((nuevosFiltros) => {
    setFiltros(nuevosFiltros);
    setPage(1);
  }, []);

  const handlePageChange = useCallback((nuevaPagina) => {
    setPage(nuevaPagina);
  }, []);

  const handleRecargar = useCallback(() => {
    cargarRegistros();
    cargarKPIs();
    setAlertasRefreshToken(prev => prev + 1);
  }, [cargarRegistros, cargarKPIs]);

  const handleNuevo = useCallback(() => {
    navigate('/proyectos/nuevo');
  }, [navigate]);

  const handleVerFabricacion = useCallback(() => {
    navigate('/fabricacion');
  }, [navigate]);

  useEffect(() => {
    cargarRegistros();
  }, [cargarRegistros]);

  useEffect(() => {
    cargarKPIs();
  }, [cargarKPIs]);

  const sinResultados = !loading && registros.length === 0 && !error;
  const mostrandoTabla = !loading || registros.length > 0;

  return (
    <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh', py: 2 }}>
      <Container
        maxWidth="xl"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'flex-start', md: 'center' },
            justifyContent: 'space-between',
            gap: 1.5,
            p: { xs: 1, md: 1.5 },
            borderRadius: 2,
            bgcolor: '#FFFFFF',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
          }}
        >
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontFamily: 'Playfair Display, serif',
                fontWeight: 600,
                color: '#0F172A',
                fontSize: { xs: '1.25rem', md: '1.5rem' },
                mb: 0.25
              }}
            >
              📊 Dashboard Comercial
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: '#64748B',
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.75rem'
              }}
            >
              Rendimiento comercial, evolución de prospectos y seguimiento humano en un solo lugar.
            </Typography>
          </Box>

          <Stack direction="row" spacing={0.75} sx={{ width: { xs: '100%', md: 'auto' } }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<RefreshIcon sx={{ fontSize: 16 }} />}
              onClick={handleRecargar}
              disabled={loading || kpiLoading}
              sx={{
                borderColor: '#CBD5E1',
                color: '#475569',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 400,
                fontSize: '0.75rem',
                py: 0.5,
                px: 1.25,
                textTransform: 'none',
                minWidth: 'auto',
                '&:hover': {
                  borderColor: '#94A3B8',
                  backgroundColor: '#F8FAFC'
                }
              }}
            >
              Recargar
            </Button>
            <Button
              size="small"
              variant="contained"
              startIcon={<AddIcon sx={{ fontSize: 16 }} />}
              onClick={handleNuevo}
              sx={{
                bgcolor: '#0F172A',
                color: '#FFFFFF',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 400,
                fontSize: '0.75rem',
                py: 0.5,
                px: 1.25,
                textTransform: 'none',
                minWidth: 'auto',
                boxShadow: 'none',
                '&:hover': {
                  bgcolor: '#1E293B',
                  boxShadow: 'none'
                }
              }}
            >
              Nuevo Prospecto
            </Button>
          </Stack>
        </Box>

        {/* Panel de Alertas Unificado con Acordeones */}
        <Box sx={{ position: 'relative', mt: 3, mb: 2 }}>
          <PanelAlertasUnificado
            refreshToken={alertasRefreshToken}
            onVerAlertas={() => navigate('/alertas')}
            onVerFabricacion={handleVerFabricacion}
          />
        </Box>

        <KPIsComerciales kpis={kpis} loading={kpiLoading} />

        <Box
          sx={{
            bgcolor: '#FFFFFF',
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
            p: { xs: 1.5, md: 2 }
          }}
        >
          <FiltrosComerciales
            filtros={filtros}
            onFiltrosChange={handleFiltrosChange}
            loading={loading}
          />
        </Box>

        {error && (
          <Alert
            severity="error"
            sx={{ borderRadius: 2, fontFamily: 'Inter, sans-serif' }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {loading && registros.length === 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress color="primary" />
          </Box>
        )}

        {mostrandoTabla && (
          <Box
            sx={{
              bgcolor: '#FFFFFF',
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
              p: { xs: 0.5, md: 1.5 }
            }}
          >
            <TablaComercial
              registros={registros}
              loading={loading}
              page={page}
              totalPages={totalPages}
              totalRegistros={totalRegistros}
              onPageChange={handlePageChange}
              onRecargar={handleRecargar}
            />
          </Box>
        )}

        {sinResultados && (
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              bgcolor: '#FFFFFF',
              borderRadius: 3,
              boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)'
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontFamily: 'Playfair Display, serif',
                color: '#0F172A',
                mb: 1
              }}
            >
              No hay registros para mostrar
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#475569',
                fontFamily: 'Inter, sans-serif',
                mb: 3
              }}
            >
              Ajusta los filtros o crea un nuevo prospecto para iniciar el seguimiento.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleNuevo}
              sx={{
                bgcolor: '#14B8A6',
                color: '#0F172A',
                fontWeight: 600,
                fontFamily: 'Inter, sans-serif',
                '&:hover': {
                  bgcolor: '#0F9E8F'
                }
              }}
            >
              Crear Primer Prospecto
            </Button>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default DashboardComercial;

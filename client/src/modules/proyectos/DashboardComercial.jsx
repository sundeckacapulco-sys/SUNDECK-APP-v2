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
  }, [cargarRegistros, cargarKPIs]);

  const handleNuevo = useCallback(() => {
    navigate('/proyectos/nuevo');
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
    <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh', py: 4 }}>
      <Container
        maxWidth="xl"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'flex-start', md: 'center' },
            justifyContent: 'space-between',
            gap: 3,
            p: { xs: 2.5, md: 3 },
            borderRadius: 3,
            bgcolor: '#FFFFFF',
            boxShadow: '0 12px 32px rgba(15, 23, 42, 0.08)'
          }}
        >
          <Box>
            <Typography
              variant="h3"
              sx={{
                fontFamily: 'Playfair Display, serif',
                fontWeight: 600,
                color: '#0F172A',
                mb: 1
              }}
            >
              📊 Dashboard Comercial
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: '#334155',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              Rendimiento comercial, evolución de prospectos y seguimiento humano en un solo lugar.
            </Typography>
          </Box>

          <Stack direction="row" spacing={2} sx={{ width: { xs: '100%', md: 'auto' } }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRecargar}
              disabled={loading || kpiLoading}
              sx={{
                borderColor: '#0F172A',
                color: '#0F172A',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                '&:hover': {
                  borderColor: '#0F172A',
                  backgroundColor: '#E2E8F0'
                }
              }}
            >
              Recargar
            </Button>
            <Button
              fullWidth
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleNuevo}
              sx={{
                bgcolor: '#0F172A',
                color: '#FFFFFF',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                boxShadow: '0 12px 24px rgba(15, 23, 42, 0.25)',
                '&:hover': {
                  bgcolor: '#0B1221',
                  boxShadow: '0 16px 30px rgba(15, 23, 42, 0.3)'
                }
              }}
            >
              Nuevo Prospecto
            </Button>
          </Stack>
        </Box>

        <KPIsComerciales kpis={kpis} loading={kpiLoading} />

        <Box
          sx={{
            bgcolor: '#FFFFFF',
            borderRadius: 3,
            boxShadow: '0 10px 28px rgba(15, 23, 42, 0.06)',
            p: { xs: 2, md: 3 }
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
              borderRadius: 3,
              boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)',
              p: { xs: 1, md: 2 }
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

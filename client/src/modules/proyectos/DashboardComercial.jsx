import { useState, useEffect } from 'react';
import { Box, Container, Typography, Button, CircularProgress, Alert } from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axiosConfig from '../../config/axios';
import FiltrosComerciales from './components/FiltrosComerciales';
import KPIsComerciales from './components/KPIsComerciales';
import TablaComercial from './components/TablaComercial';

const DashboardComercial = () => {
  const navigate = useNavigate();
  
  // Estados
  const [registros, setRegistros] = useState([]);
  const [filtros, setFiltros] = useState({
    tipo: 'todos',
    asesorComercial: '',
    estadoComercial: '',
    fechaDesde: null,
    fechaHasta: null,
    busqueda: ''
  });
  const [kpis, setKpis] = useState({
    total: 0,
    prospectos: 0,
    proyectos: 0,
    tasaConversion: 0,
    valorTotal: 0,
    promedioTicket: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const limit = 20;

  // Cargar registros
  const cargarRegistros = async () => {
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
      
      // Manejar estructura de respuesta del backend
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

      // Calcular KPIs localmente
      calcularKPIs(data.proyectos || data.registros || data);

      console.log('✅ Registros cargados:', {
        total: totalRegistros,
        pagina: page,
        filtros
      });
    } catch (err) {
      console.error('❌ Error cargando registros:', err);
      setError(err.response?.data?.message || 'Error al cargar registros');
      setRegistros([]);
    } finally {
      setLoading(false);
    }
  };

  // Calcular KPIs
  const calcularKPIs = (datos) => {
    const registrosArray = Array.isArray(datos) ? datos : [];
    
    const prospectos = registrosArray.filter(r => r.tipo === 'prospecto').length;
    const proyectos = registrosArray.filter(r => r.tipo === 'proyecto').length;
    const total = registrosArray.length;
    
    const tasaConversion = prospectos > 0 
      ? Math.round((proyectos / (prospectos + proyectos)) * 100) 
      : 0;

    const valorTotal = registrosArray.reduce((sum, r) => {
      return sum + (r.monto_estimado || r.total || 0);
    }, 0);

    const promedioTicket = total > 0 ? Math.round(valorTotal / total) : 0;

    setKpis({
      total,
      prospectos,
      proyectos,
      tasaConversion,
      valorTotal,
      promedioTicket
    });
  };

  // Manejar cambio de filtros
  const handleFiltrosChange = (nuevosFiltros) => {
    setFiltros(nuevosFiltros);
    setPage(1); // Resetear a página 1 al cambiar filtros
  };

  // Manejar cambio de página
  const handlePageChange = (nuevaPagina) => {
    setPage(nuevaPagina);
  };

  // Manejar recarga
  const handleRecargar = () => {
    cargarRegistros();
  };

  // Manejar creación de nuevo registro
  const handleNuevo = () => {
    navigate('/proyectos/nuevo');
  };

  // Cargar al montar y cuando cambien filtros o página
  useEffect(() => {
    cargarRegistros();
  }, [page, filtros]);

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            📊 Dashboard Comercial
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Vista unificada de prospectos y proyectos
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRecargar}
            disabled={loading}
          >
            Recargar
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNuevo}
            sx={{ bgcolor: '#1976d2' }}
          >
            Nuevo Prospecto
          </Button>
        </Box>
      </Box>

      {/* KPIs */}
      <KPIsComerciales kpis={kpis} loading={loading} />

      {/* Filtros */}
      <FiltrosComerciales 
        filtros={filtros}
        onFiltrosChange={handleFiltrosChange}
        loading={loading}
      />

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Loading */}
      {loading && registros.length === 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Tabla */}
      {!loading || registros.length > 0 ? (
        <TablaComercial
          registros={registros}
          loading={loading}
          page={page}
          totalPages={totalPages}
          totalRegistros={totalRegistros}
          onPageChange={handlePageChange}
          onRecargar={handleRecargar}
        />
      ) : null}

      {/* Sin resultados */}
      {!loading && registros.length === 0 && !error && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No hay registros para mostrar
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Ajusta los filtros o crea un nuevo prospecto
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNuevo}
          >
            Crear Primer Prospecto
          </Button>
        </Box>
      )}
    </Container>
  );
};

export default DashboardComercial;

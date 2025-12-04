import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Fab,
  Grid,
  Paper,
  Stack,
  Tooltip,
  Typography,
  Zoom
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import AssignmentLateIcon from '@mui/icons-material/AssignmentLate';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import RefreshIcon from '@mui/icons-material/Refresh';
import PhoneIcon from '@mui/icons-material/Phone';
import EventIcon from '@mui/icons-material/Event';
import BuildIcon from '@mui/icons-material/Build';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TodayIcon from '@mui/icons-material/Today';
import ScheduleIcon from '@mui/icons-material/Schedule';
import useAlertasInteligentes from '../../alertas/hooks/useAlertasInteligentes';
import axiosConfig from '../../../config/axios';

const iconosPorCategoria = {
  prospectos_inactivos: <PersonSearchIcon sx={{ color: '#F97316' }} />,
  proyectos_sin_movimiento: <AssignmentLateIcon sx={{ color: '#DC2626' }} />,
  fabricacion_retrasada: <AccessTimeIcon sx={{ color: '#DC2626' }} />,
  materiales_faltantes: <Inventory2Icon sx={{ color: '#CA8A04' }} />,
  calidad_pendiente: <FactCheckIcon sx={{ color: '#EA580C' }} />
};

const prioridadAColor = {
  critica: '#DC2626',
  alta: '#FACC15',
  importante: '#F97316',
  normal: '#2563EB'
};

const PanelAlertasUnificado = ({ onVerAlertas, onVerFabricacion, refreshToken }) => {
  const [expanded, setExpanded] = useState(false);
  const [pendientesHoy, setPendientesHoy] = useState({
    llamadas: [],
    citas: [],
    instalaciones: [],
    seguimientos: [],
    loading: true
  });
  
  // Alertas inteligentes (prospectos/proyectos)
  const { 
    data: dataAlertas, 
    loading: loadingAlertas, 
    error: errorAlertas, 
    cargarAlertas 
  } = useAlertasInteligentes({ limite: 4 });

  // Alertas de fabricación
  const { 
    data: dataFabricacion, 
    loading: loadingFabricacion, 
    error: errorFabricacion, 
    cargarAlertas: cargarAlertasFabricacion 
  } = useAlertasInteligentes({
    endpoint: '/alertas/inteligentes/fabricacion',
    limite: 5
  });

  // Cargar pendientes del día desde el servicio
  const cargarPendientesHoy = useCallback(async () => {
    try {
      setPendientesHoy(prev => ({ ...prev, loading: true }));
      
      // Usar el nuevo endpoint de pendientes
      const response = await axiosConfig.get('/pendientes/hoy');
      
      if (response.data?.success) {
        const data = response.data.data;
        setPendientesHoy({
          llamadas: data.llamadas || [],
          citas: data.citas || [],
          instalaciones: data.instalaciones || [],
          seguimientos: data.seguimientos || [],
          fabricacion: data.fabricacion || [],
          loading: false
        });
      } else {
        setPendientesHoy(prev => ({ ...prev, loading: false }));
      }
      
    } catch (error) {
      console.error('Error cargando pendientes:', error);
      // Fallback: cargar desde proyectos directamente
      try {
        const response = await axiosConfig.get('/proyectos', { params: { limit: 100 } });
        const proyectos = response.data?.data?.proyectos || response.data?.data || response.data || [];
        
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const manana = new Date(hoy);
        manana.setDate(manana.getDate() + 1);
        
        const llamadas = [];
        const citas = [];
        const instalaciones = [];
        const seguimientos = [];
        
        proyectos.forEach(proyecto => {
          if (proyecto.proximaLlamada) {
            const fechaLlamada = new Date(proyecto.proximaLlamada);
            if (fechaLlamada >= hoy && fechaLlamada < manana) {
              llamadas.push({
                id: proyecto._id,
                cliente: proyecto.cliente?.nombre || 'Sin nombre',
                telefono: proyecto.cliente?.telefono,
                hora: fechaLlamada.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
                numero: proyecto.numero
              });
            }
          }
          
          if (proyecto.instalacion?.programacion?.fechaProgramada) {
            const fechaInstalacion = new Date(proyecto.instalacion.programacion.fechaProgramada);
            if (fechaInstalacion >= hoy && fechaInstalacion < manana) {
              instalaciones.push({
                id: proyecto._id,
                cliente: proyecto.cliente?.nombre || 'Sin nombre',
                hora: proyecto.instalacion.programacion.horaInicio || '09:00',
                numero: proyecto.numero
              });
            }
          }
        });
        
        setPendientesHoy({ llamadas, citas, instalaciones, seguimientos, loading: false });
      } catch (fallbackError) {
        setPendientesHoy(prev => ({ ...prev, loading: false }));
      }
    }
  }, []);
  
  // Navegar al proyecto/prospecto al hacer clic
  const handleClickPendiente = useCallback((item) => {
    if (item.id) {
      // Navegar al proyecto
      window.location.href = `/proyectos/${item.id}`;
    }
  }, []);

  useEffect(() => {
    cargarAlertas().catch(() => {});
    cargarAlertasFabricacion().catch(() => {});
    cargarPendientesHoy();
  }, [cargarAlertas, cargarAlertasFabricacion, cargarPendientesHoy, refreshToken]);

  const resumenAlertas = dataAlertas?.resumen || { total: 0 };
  const resumenFabricacion = dataFabricacion?.resumen || { total: 0 };
  const categoriasAlertas = useMemo(() => dataAlertas?.categorias || [], [dataAlertas]);
  const categoriasFabricacion = useMemo(() => dataFabricacion?.categorias || [], [dataFabricacion]);

  const totalAlertas = resumenAlertas.total + resumenFabricacion.total;
  const totalPendientes = pendientesHoy.llamadas.length + pendientesHoy.citas.length + 
                          pendientesHoy.instalaciones.length + pendientesHoy.seguimientos.length;
  const loading = loadingAlertas || loadingFabricacion || pendientesHoy.loading;

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const handleRefresh = () => {
    cargarAlertas().catch(() => {});
    cargarAlertasFabricacion().catch(() => {});
    cargarPendientesHoy();
  };

  const renderItems = (categorias) => {
    if (!categorias || categorias.length === 0) return null;
    
    return categorias.map((categoria) => (
      <Box
        key={categoria.tipo}
        sx={{
          border: '1px solid #E2E8F0',
          borderRadius: 2,
          p: 1.5,
          mb: 1.5,
          backgroundColor: '#FFFFFF'
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            {iconosPorCategoria[categoria.tipo] || <WarningAmberIcon color="warning" />}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {categoria.titulo}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                {categoria.descripcion}
              </Typography>
            </Box>
          </Stack>
          <Chip
            label={`${categoria.total}`}
            size="small"
            sx={{ backgroundColor: '#FEE2E2', color: '#991B1B', fontWeight: 600 }}
          />
        </Stack>

        <Stack spacing={1}>
          {categoria.items?.slice(0, 3).map((item) => (
            <Box
              key={item.id}
              sx={{
                border: '1px solid #F1F5F9',
                borderRadius: 1,
                p: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                bgcolor: '#FAFAFA'
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                  {item.cliente?.nombre || item.numero || 'Sin identificar'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B' }}>
                  {item.resumen}
                </Typography>
              </Box>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Tooltip title={`Prioridad ${item.prioridad || 'normal'}`}>
                  <Box
                    sx={{
                      width: 6,
                      height: 24,
                      borderRadius: 0.5,
                      backgroundColor: prioridadAColor[item.prioridad] || '#2563EB'
                    }}
                  />
                </Tooltip>
                <Chip
                  label={`${item.diasInactividad ?? item.diasRetraso ?? item.diasPendientes ?? 0}d`}
                  size="small"
                  sx={{ 
                    backgroundColor: '#F8FAFC', 
                    fontWeight: 500,
                    fontSize: '0.7rem',
                    height: 20
                  }}
                />
              </Stack>
            </Box>
          ))}
          {(categoria.items?.length || 0) > 3 && (
            <Typography variant="caption" sx={{ color: '#94A3B8', textAlign: 'center' }}>
              +{categoria.items.length - 3} más...
            </Typography>
          )}
        </Stack>
      </Box>
    ));
  };

  // Componente para tarjeta de pendiente
  const PendienteCard = ({ icon, color, items, titulo, emptyText }) => (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        border: '1px solid #E2E8F0',
        borderRadius: 2,
        bgcolor: items.length > 0 ? `${color}08` : '#FAFAFA',
        height: '100%'
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <Box sx={{ 
          width: 28, 
          height: 28, 
          borderRadius: '50%', 
          bgcolor: items.length > 0 ? color : '#94A3B8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {icon}
        </Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
          {titulo}
        </Typography>
        <Chip 
          label={items.length} 
          size="small" 
          sx={{ 
            height: 20, 
            fontSize: '0.7rem',
            bgcolor: items.length > 0 ? color : '#E2E8F0',
            color: items.length > 0 ? 'white' : '#64748B'
          }} 
        />
      </Stack>
      
      {items.length === 0 ? (
        <Typography variant="caption" sx={{ color: '#94A3B8' }}>
          {emptyText}
        </Typography>
      ) : (
        <Stack spacing={0.5}>
          {items.slice(0, 3).map((item, idx) => (
            <Box 
              key={idx}
              sx={{ 
                p: 0.75, 
                bgcolor: 'white', 
                borderRadius: 1,
                border: '1px solid #F1F5F9'
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
                {item.cliente}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.7rem' }}>
                {item.hora && `⏰ ${item.hora}`}
                {item.telefono && ` 📞 ${item.telefono}`}
                {item.direccion && ` 📍 ${item.direccion}`}
                {item.accion && ` → ${item.accion}`}
              </Typography>
            </Box>
          ))}
          {items.length > 3 && (
            <Typography variant="caption" sx={{ color: '#94A3B8', textAlign: 'center' }}>
              +{items.length - 3} más
            </Typography>
          )}
        </Stack>
      )}
    </Paper>
  );

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Grid de 4 bloques */}
      <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
        {/* Bloque 1: Alertas Inteligentes */}
        <Grid item xs={12} sm={6} md={3}>
          <Accordion 
            expanded={expanded === 'alertas'} 
            onChange={handleChange('alertas')}
            sx={{ 
              borderRadius: '12px !important',
              border: '1px solid #E2E8F0',
              boxShadow: 'none',
              '&:before': { display: 'none' },
              overflow: 'hidden',
              height: expanded === 'alertas' ? 'auto' : '100%'
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />}
              sx={{ 
                background: 'linear-gradient(135deg, #F8FAFC 0%, #FFFFFF 100%)',
                minHeight: '48px !important',
                '& .MuiAccordionSummary-content': { my: 0.5 }
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
                <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: '#0EA5E9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <NotificationsActiveIcon sx={{ fontSize: 16, color: 'white' }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.8rem', lineHeight: 1.2 }}>
                    Alertas Inteligentes
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.65rem' }}>
                    Prospectos y proyectos
                  </Typography>
                </Box>
                <Chip
                  label={resumenAlertas.total}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.7rem',
                    bgcolor: resumenAlertas.total > 0 ? '#FEE2E2' : '#F1F5F9',
                    color: resumenAlertas.total > 0 ? '#B91C1C' : '#64748B'
                  }}
                />
              </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 1.5, bgcolor: '#FAFAFA' }}>
              {loadingAlertas ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                  <CircularProgress size={20} />
                </Box>
              ) : resumenAlertas.total === 0 ? (
                <Typography variant="caption" sx={{ color: '#64748B' }}>✅ Sin alertas</Typography>
              ) : (
                <>
                  {renderItems(categoriasAlertas)}
                  <Button size="small" variant="text" onClick={onVerAlertas} sx={{ mt: 0.5, textTransform: 'none', color: '#0EA5E9', fontSize: '0.75rem' }}>
                    Ver todo →
                  </Button>
                </>
              )}
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Bloque 2: Alertas de Fabricación */}
        <Grid item xs={12} sm={6} md={3}>
          <Accordion 
            expanded={expanded === 'fabricacion'} 
            onChange={handleChange('fabricacion')}
            sx={{ 
              borderRadius: '12px !important',
              border: '1px solid #E2E8F0',
              boxShadow: 'none',
              '&:before': { display: 'none' },
              overflow: 'hidden',
              height: expanded === 'fabricacion' ? 'auto' : '100%'
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />}
              sx={{ 
                background: 'linear-gradient(135deg, #FFF7ED 0%, #FFFFFF 100%)',
                minHeight: '48px !important',
                '& .MuiAccordionSummary-content': { my: 0.5 }
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
                <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: '#F97316', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PrecisionManufacturingIcon sx={{ fontSize: 16, color: 'white' }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.8rem', lineHeight: 1.2 }}>
                    Fabricación
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.65rem' }}>
                    Órdenes y materiales
                  </Typography>
                </Box>
                <Chip
                  label={resumenFabricacion.total}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.7rem',
                    bgcolor: resumenFabricacion.total > 0 ? '#FEE2E2' : '#F1F5F9',
                    color: resumenFabricacion.total > 0 ? '#B91C1C' : '#64748B'
                  }}
                />
              </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 1.5, bgcolor: '#FFFBF5' }}>
              {loadingFabricacion ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                  <CircularProgress size={20} />
                </Box>
              ) : resumenFabricacion.total === 0 ? (
                <Typography variant="caption" sx={{ color: '#64748B' }}>✅ Producción OK</Typography>
              ) : (
                <>
                  {renderItems(categoriasFabricacion)}
                  <Button size="small" variant="text" onClick={onVerFabricacion} sx={{ mt: 0.5, textTransform: 'none', color: '#F97316', fontSize: '0.75rem' }}>
                    Ver módulo →
                  </Button>
                </>
              )}
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Bloque 3: Pendientes del Día */}
        <Grid item xs={12} sm={6} md={3}>
          <Accordion 
            expanded={expanded === 'pendientes'} 
            onChange={handleChange('pendientes')}
            sx={{ 
              borderRadius: '12px !important',
              border: '1px solid #E2E8F0',
              boxShadow: 'none',
              '&:before': { display: 'none' },
              overflow: 'hidden',
              height: expanded === 'pendientes' ? 'auto' : '100%'
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />}
              sx={{ 
                background: 'linear-gradient(135deg, #F0FDF4 0%, #FFFFFF 100%)',
                minHeight: '48px !important',
                '& .MuiAccordionSummary-content': { my: 0.5 }
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
                <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: '#22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TodayIcon sx={{ fontSize: 16, color: 'white' }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.8rem', lineHeight: 1.2 }}>
                    Pendientes Hoy
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.65rem' }}>
                    Llamadas, citas, instalaciones
                  </Typography>
                </Box>
                <Chip
                  label={totalPendientes}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.7rem',
                    bgcolor: totalPendientes > 0 ? '#DCFCE7' : '#F1F5F9',
                    color: totalPendientes > 0 ? '#166534' : '#64748B'
                  }}
                />
              </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 1.5, bgcolor: '#F0FDF4' }}>
              {pendientesHoy.loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                  <CircularProgress size={20} />
                </Box>
              ) : totalPendientes === 0 ? (
                <Typography variant="caption" sx={{ color: '#64748B' }}>✅ Sin pendientes para hoy</Typography>
              ) : (
                <Grid container spacing={1}>
                  {pendientesHoy.llamadas.length > 0 && (
                    <Grid item xs={12}>
                      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.5 }}>
                        <PhoneIcon sx={{ fontSize: 14, color: '#3B82F6' }} />
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>Llamadas ({pendientesHoy.llamadas.length})</Typography>
                      </Stack>
                      {pendientesHoy.llamadas.slice(0, 2).map((item, idx) => (
                        <Box 
                          key={idx} 
                          onClick={() => handleClickPendiente(item)}
                          sx={{ 
                            p: 0.5, 
                            bgcolor: 'white', 
                            borderRadius: 1, 
                            mb: 0.5, 
                            border: '1px solid #E2E8F0',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': { bgcolor: '#EFF6FF', borderColor: '#3B82F6' }
                          }}
                        >
                          <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem', color: '#1E40AF' }}>{item.cliente}</Typography>
                          <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.65rem', display: 'block' }}>
                            {item.hora} • {item.telefono} • {item.numero}
                          </Typography>
                        </Box>
                      ))}
                    </Grid>
                  )}
                  {pendientesHoy.instalaciones.length > 0 && (
                    <Grid item xs={12}>
                      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.5 }}>
                        <BuildIcon sx={{ fontSize: 14, color: '#F97316' }} />
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>Instalaciones ({pendientesHoy.instalaciones.length})</Typography>
                      </Stack>
                      {pendientesHoy.instalaciones.slice(0, 2).map((item, idx) => (
                        <Box 
                          key={idx} 
                          onClick={() => handleClickPendiente(item)}
                          sx={{ 
                            p: 0.5, 
                            bgcolor: 'white', 
                            borderRadius: 1, 
                            mb: 0.5, 
                            border: '1px solid #E2E8F0',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': { bgcolor: '#FFF7ED', borderColor: '#F97316' }
                          }}
                        >
                          <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem', color: '#C2410C' }}>{item.cliente}</Typography>
                          <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.65rem', display: 'block' }}>
                            {item.hora} • {item.direccion || item.numero}
                          </Typography>
                        </Box>
                      ))}
                    </Grid>
                  )}
                  {pendientesHoy.citas.length > 0 && (
                    <Grid item xs={12}>
                      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.5 }}>
                        <EventIcon sx={{ fontSize: 14, color: '#8B5CF6' }} />
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>Citas ({pendientesHoy.citas.length})</Typography>
                      </Stack>
                      {pendientesHoy.citas.slice(0, 2).map((item, idx) => (
                        <Box 
                          key={idx} 
                          onClick={() => handleClickPendiente(item)}
                          sx={{ 
                            p: 0.5, 
                            bgcolor: 'white', 
                            borderRadius: 1, 
                            mb: 0.5, 
                            border: '1px solid #E2E8F0',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': { bgcolor: '#F5F3FF', borderColor: '#8B5CF6' }
                          }}
                        >
                          <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem', color: '#6D28D9' }}>{item.cliente}</Typography>
                          <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.65rem', display: 'block' }}>
                            {item.hora} • {item.tipo} • {item.numero}
                          </Typography>
                        </Box>
                      ))}
                    </Grid>
                  )}
                </Grid>
              )}
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Bloque 4: Seguimientos */}
        <Grid item xs={12} sm={6} md={3}>
          <Accordion 
            expanded={expanded === 'seguimientos'} 
            onChange={handleChange('seguimientos')}
            sx={{ 
              borderRadius: '12px !important',
              border: '1px solid #E2E8F0',
              boxShadow: 'none',
              '&:before': { display: 'none' },
              overflow: 'hidden',
              height: expanded === 'seguimientos' ? 'auto' : '100%'
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />}
              sx={{ 
                background: 'linear-gradient(135deg, #EEF2FF 0%, #FFFFFF 100%)',
                minHeight: '48px !important',
                '& .MuiAccordionSummary-content': { my: 0.5 }
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
                <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ScheduleIcon sx={{ fontSize: 16, color: 'white' }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.8rem', lineHeight: 1.2 }}>
                    Seguimientos
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.65rem' }}>
                    Recordatorios programados
                  </Typography>
                </Box>
                <Chip
                  label={pendientesHoy.seguimientos.length}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.7rem',
                    bgcolor: pendientesHoy.seguimientos.length > 0 ? '#E0E7FF' : '#F1F5F9',
                    color: pendientesHoy.seguimientos.length > 0 ? '#4338CA' : '#64748B'
                  }}
                />
              </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 1.5, bgcolor: '#EEF2FF' }}>
              {pendientesHoy.loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                  <CircularProgress size={20} />
                </Box>
              ) : pendientesHoy.seguimientos.length === 0 ? (
                <Typography variant="caption" sx={{ color: '#64748B' }}>✅ Sin seguimientos pendientes</Typography>
              ) : (
                <Stack spacing={0.5}>
                  {pendientesHoy.seguimientos.slice(0, 4).map((item, idx) => (
                    <Box 
                      key={idx} 
                      onClick={() => handleClickPendiente(item)}
                      sx={{ 
                        p: 0.5, 
                        bgcolor: 'white', 
                        borderRadius: 1, 
                        border: '1px solid #E2E8F0',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': { bgcolor: '#EEF2FF', borderColor: '#6366F1' }
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem', color: '#4338CA' }}>{item.cliente}</Typography>
                      <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.65rem', display: 'block' }}>
                        → {item.accion} • {item.numero}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>

      {/* Botón Flotante de Actualizar */}
      <Zoom in={!loading}>
        <Fab
          size="small"
          color="primary"
          onClick={handleRefresh}
          disabled={loading}
          sx={{
            position: 'absolute',
            top: -16,
            right: 8,
            width: 36,
            height: 36,
            bgcolor: (totalAlertas + totalPendientes) > 0 ? '#DC2626' : '#0EA5E9',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            '&:hover': {
              bgcolor: (totalAlertas + totalPendientes) > 0 ? '#B91C1C' : '#0284C7'
            }
          }}
        >
          {loading ? (
            <CircularProgress size={18} sx={{ color: 'white' }} />
          ) : (
            <Box sx={{ position: 'relative' }}>
              <RefreshIcon sx={{ fontSize: 18 }} />
              {(totalAlertas + totalPendientes) > 0 && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    bgcolor: '#FBBF24',
                    color: '#000',
                    fontSize: '0.55rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {(totalAlertas + totalPendientes) > 9 ? '9+' : (totalAlertas + totalPendientes)}
                </Box>
              )}
            </Box>
          )}
        </Fab>
      </Zoom>
    </Box>
  );
};

export default PanelAlertasUnificado;

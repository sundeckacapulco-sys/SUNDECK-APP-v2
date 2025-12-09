/**
 * 🏭 TALLER KANBAN - Vista Ultra Simple para Fabricación
 * 
 * Diseñado para el personal de taller:
 * - Mínimo texto, máximo visual
 * - Tarjetas grandes con colores claros
 * - Drag & Drop entre columnas
 * - Un clic para cambiar estado
 * - Iconos grandes y reconocibles
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogContent,
  Tooltip,
  Badge,
  Fab
} from '@mui/material';
import {
  Inventory as MaterialIcon,
  HourglassEmpty as PendienteIcon,
  Build as ProcesoIcon,
  Warning as CriticoIcon,
  CheckCircle as TerminadoIcon,
  ArrowForward as AvanzarIcon,
  ArrowBack as RetrocederIcon,
  CameraAlt as FotoIcon,
  Description as OrdenIcon,
  Phone as TelefonoIcon,
  Refresh as RefreshIcon,
  Person as ClienteIcon,
  Schedule as FechaIcon,
  Print as PrintIcon,
  Close as CloseIcon,
  LocalShipping as InstalacionIcon
} from '@mui/icons-material';
import axiosConfig from '../../config/axios';
import VisorPDF from '../../components/Common/VisorPDF';

// 🎨 COLORES VIBRANTES PARA CADA ESTADO
const ESTADOS = {
  recepcion_material: {
    color: '#3B82F6', // Azul
    bgColor: '#DBEAFE',
    icon: MaterialIcon,
    label: '📦 MATERIAL',
    orden: 0
  },
  pendiente: {
    color: '#6B7280', // Gris
    bgColor: '#F3F4F6',
    icon: PendienteIcon,
    label: '⏳ PENDIENTE',
    orden: 1
  },
  en_proceso: {
    color: '#F59E0B', // Naranja
    bgColor: '#FEF3C7',
    icon: ProcesoIcon,
    label: '🔧 EN PROCESO',
    orden: 2
  },
  situacion_critica: {
    color: '#EF4444', // Rojo
    bgColor: '#FEE2E2',
    icon: CriticoIcon,
    label: '🚨 CRÍTICO',
    orden: 3
  },
  terminado: {
    color: '#10B981', // Verde
    bgColor: '#D1FAE5',
    icon: TerminadoIcon,
    label: '✅ TERMINADO',
    orden: 4
  }
};

// Orden del flujo normal (sin crítico)
const FLUJO_NORMAL = ['recepcion_material', 'pendiente', 'en_proceso', 'terminado'];

const TallerKanban = () => {
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [ordenAbierta, setOrdenAbierta] = useState(null);
  const [subiendoFoto, setSubiendoFoto] = useState(null);

  // Cargar proyectos
  const cargarProyectos = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosConfig.get('/fabricacion/cola');
      setProyectos(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error cargando proyectos:', err);
      setError('Error al cargar proyectos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarProyectos();
    // Auto-refresh cada 30 segundos
    const interval = setInterval(cargarProyectos, 30000);
    return () => clearInterval(interval);
  }, [cargarProyectos]);

  // Cambiar estado de un proyecto
  const cambiarEstado = async (proyectoId, nuevoEstado) => {
    try {
      await axiosConfig.patch(`/proyectos/${proyectoId}/fabricacion/estado`, {
        estado: nuevoEstado
      });
      
      // Actualizar localmente para respuesta inmediata
      setProyectos(prev => prev.map(p => 
        p._id === proyectoId 
          ? { ...p, fabricacion: { ...p.fabricacion, estado: nuevoEstado } }
          : p
      ));
      
      setSuccess(`✅ Movido a ${ESTADOS[nuevoEstado].label}`);
    } catch (err) {
      console.error('Error cambiando estado:', err);
      setError('Error al cambiar estado');
    }
  };

  // Avanzar al siguiente estado
  const avanzarEstado = (proyecto) => {
    const estadoActual = proyecto.fabricacion?.estado || 'pendiente';
    const indexActual = FLUJO_NORMAL.indexOf(estadoActual);
    if (indexActual < FLUJO_NORMAL.length - 1) {
      cambiarEstado(proyecto._id, FLUJO_NORMAL[indexActual + 1]);
    }
  };

  // Retroceder al estado anterior
  const retrocederEstado = (proyecto) => {
    const estadoActual = proyecto.fabricacion?.estado || 'pendiente';
    const indexActual = FLUJO_NORMAL.indexOf(estadoActual);
    if (indexActual > 0) {
      cambiarEstado(proyecto._id, FLUJO_NORMAL[indexActual - 1]);
    }
  };

  // Marcar como crítico
  const marcarCritico = (proyecto) => {
    cambiarEstado(proyecto._id, 'situacion_critica');
  };

  // Abrir orden de taller - Usando POST con base64 (evita que IDM intercepte)
  const abrirOrden = async (proyecto) => {
    try {
      setOrdenAbierta({ proyecto, loading: true, url: null });
      
      // Usar POST que devuelve JSON con base64 - IDM NO intercepta esto
      const response = await axiosConfig.post(
        `/fabricacion/orden-taller/${proyecto._id}/base64`
      );
      
      if (response.data.success && response.data.pdf) {
        // Convertir base64 a blob URL
        const byteCharacters = atob(response.data.pdf);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const pdfBlob = new Blob([byteArray], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(pdfBlob);
        
        setOrdenAbierta({ proyecto, loading: false, url });
      } else {
        throw new Error(response.data.message || 'Error generando PDF');
      }
      
    } catch (err) {
      console.error('Error cargando orden:', err);
      const mensaje = err.response?.data?.message || err.message;
      if (mensaje.includes('piezas') || mensaje.includes('levantamiento')) {
        setError('⚠️ Este proyecto no tiene levantamiento registrado');
      } else {
        setError('Error al cargar la orden');
      }
      setOrdenAbierta(null);
    }
  };
  
  // Cerrar visor de PDF
  const cerrarOrden = () => {
    if (ordenAbierta?.url) {
      window.URL.revokeObjectURL(ordenAbierta.url);
    }
    setOrdenAbierta(null);
  };

  // Subir foto de empaque
  const subirFotoEmpaque = async (proyectoId, archivo) => {
    if (!archivo) return;
    
    try {
      setSubiendoFoto(proyectoId);
      
      const formData = new FormData();
      formData.append('foto', archivo);
      formData.append('etapa', 'empaque');
      
      await axiosConfig.post(`/fabricacion/etapas/${proyectoId}/empaque/fotos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Marcar como terminado automáticamente
      await cambiarEstado(proyectoId, 'terminado');
      setSuccess('📷 ¡Foto subida! Proyecto TERMINADO');
      
    } catch (err) {
      console.error('Error subiendo foto:', err);
      setError('Error al subir foto');
    } finally {
      setSubiendoFoto(null);
    }
  };

  // Agrupar proyectos por estado
  const proyectosPorEstado = {
    recepcion_material: proyectos.filter(p => p.fabricacion?.estado === 'recepcion_material'),
    pendiente: proyectos.filter(p => !p.fabricacion?.estado || p.fabricacion?.estado === 'pendiente'),
    en_proceso: proyectos.filter(p => p.fabricacion?.estado === 'en_proceso'),
    situacion_critica: proyectos.filter(p => p.fabricacion?.estado === 'situacion_critica'),
    terminado: proyectos.filter(p => p.fabricacion?.estado === 'terminado')
  };

  // Componente de Tarjeta de Proyecto (Ultra Simple)
  const TarjetaProyecto = ({ proyecto }) => {
    const estado = proyecto.fabricacion?.estado || 'pendiente';
    const config = ESTADOS[estado];
    const IconoEstado = config.icon;
    const esCritico = estado === 'situacion_critica';
    const esTerminado = estado === 'terminado';
    const cantidadPiezas = proyecto.levantamiento?.partidas?.length || proyecto.productos?.length || 0;
    
    return (
      <Card 
        sx={{ 
          mb: 2,
          borderLeft: `6px solid ${config.color}`,
          bgcolor: esCritico ? config.bgColor : 'white',
          boxShadow: esCritico ? 4 : 2,
          transition: 'all 0.2s',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: 4
          }
        }}
      >
        <CardContent sx={{ pb: 1 }}>
          {/* Número de proyecto - GRANDE */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 'bold',
                color: config.color
              }}
            >
              {proyecto.numero}
            </Typography>
            <Badge badgeContent={cantidadPiezas} color="primary">
              <Chip 
                label={`${cantidadPiezas} pzas`}
                size="small"
                sx={{ fontWeight: 'bold' }}
              />
            </Badge>
          </Box>
          
          {/* Cliente - Simple */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <ClienteIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {proyecto.cliente?.nombre?.split(' ')[0] || 'Cliente'}
            </Typography>
          </Box>
          
          {/* Teléfono - Click para llamar */}
          {proyecto.cliente?.telefono && (
            <Box 
              component="a"
              href={`tel:${proyecto.cliente.telefono}`}
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                textDecoration: 'none',
                color: 'primary.main',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              <TelefonoIcon sx={{ fontSize: 18 }} />
              <Typography variant="body2">
                {proyecto.cliente.telefono}
              </Typography>
            </Box>
          )}
        </CardContent>
        
        {/* Acciones - Botones GRANDES */}
        <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
          {/* Botón Retroceder */}
          {!esTerminado && estado !== 'recepcion_material' && (
            <Tooltip title="← Regresar">
              <IconButton 
                onClick={() => retrocederEstado(proyecto)}
                sx={{ 
                  bgcolor: 'grey.200',
                  '&:hover': { bgcolor: 'grey.300' }
                }}
              >
                <RetrocederIcon />
              </IconButton>
            </Tooltip>
          )}
          
          {/* Botón Ver Orden */}
          <Tooltip title="Ver Orden">
            <IconButton 
              onClick={() => abrirOrden(proyecto)}
              sx={{ 
                bgcolor: '#D4AF37',
                color: 'white',
                '&:hover': { bgcolor: '#B8941F' }
              }}
            >
              <OrdenIcon />
            </IconButton>
          </Tooltip>
          
          {/* Botón Crítico (solo si no está terminado) */}
          {!esTerminado && !esCritico && (
            <Tooltip title="⚠️ Marcar Crítico">
              <IconButton 
                onClick={() => marcarCritico(proyecto)}
                sx={{ 
                  bgcolor: '#FEE2E2',
                  color: '#EF4444',
                  '&:hover': { bgcolor: '#FECACA' }
                }}
              >
                <CriticoIcon />
              </IconButton>
            </Tooltip>
          )}
          
          {/* Botón Foto Empaque (solo en proceso) */}
          {estado === 'en_proceso' && (
            <Tooltip title="📷 Foto Empaque = TERMINADO">
              <IconButton 
                component="label"
                disabled={subiendoFoto === proyecto._id}
                sx={{ 
                  bgcolor: '#8B5CF6',
                  color: 'white',
                  '&:hover': { bgcolor: '#7C3AED' }
                }}
              >
                {subiendoFoto === proyecto._id ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  <FotoIcon />
                )}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      subirFotoEmpaque(proyecto._id, e.target.files[0]);
                    }
                  }}
                />
              </IconButton>
            </Tooltip>
          )}
          
          {/* Botón Avanzar */}
          {!esTerminado && (
            <Tooltip title="Avanzar →">
              <IconButton 
                onClick={() => avanzarEstado(proyecto)}
                sx={{ 
                  bgcolor: ESTADOS[FLUJO_NORMAL[FLUJO_NORMAL.indexOf(estado) + 1] || 'terminado'].color,
                  color: 'white',
                  '&:hover': { 
                    bgcolor: ESTADOS[FLUJO_NORMAL[FLUJO_NORMAL.indexOf(estado) + 1] || 'terminado'].color,
                    filter: 'brightness(0.9)'
                  }
                }}
              >
                <AvanzarIcon />
              </IconButton>
            </Tooltip>
          )}
          
          {/* Botón Programar Instalación (solo terminados) */}
          {esTerminado && (
            <Tooltip title="Programar Instalación">
              <IconButton 
                onClick={() => window.location.href = `/instalaciones/programar?proyecto=${proyecto._id}`}
                sx={{ 
                  bgcolor: '#06B6D4',
                  color: 'white',
                  '&:hover': { bgcolor: '#0891B2' }
                }}
              >
                <InstalacionIcon />
              </IconButton>
            </Tooltip>
          )}
        </CardActions>
      </Card>
    );
  };

  // Componente de Columna
  const Columna = ({ estadoKey, titulo }) => {
    const config = ESTADOS[estadoKey];
    const IconoColumna = config.icon;
    const proyectosColumna = proyectosPorEstado[estadoKey];
    
    return (
      <Box 
        sx={{ 
          flex: 1,
          minWidth: 280,
          maxWidth: 350,
          bgcolor: config.bgColor,
          borderRadius: 3,
          p: 2,
          height: 'calc(100vh - 180px)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header de Columna */}
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1.5,
            mb: 2,
            pb: 2,
            borderBottom: `3px solid ${config.color}`
          }}
        >
          <Avatar sx={{ bgcolor: config.color, width: 48, height: 48 }}>
            <IconoColumna sx={{ fontSize: 28 }} />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
              {titulo}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {proyectosColumna.length} proyecto{proyectosColumna.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
        </Box>
        
        {/* Lista de Proyectos */}
        <Box sx={{ flex: 1, overflowY: 'auto', pr: 1 }}>
          {proyectosColumna.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4, opacity: 0.5 }}>
              <IconoColumna sx={{ fontSize: 48, mb: 1 }} />
              <Typography>Sin proyectos</Typography>
            </Box>
          ) : (
            proyectosColumna.map(proyecto => (
              <TarjetaProyecto key={proyecto._id} proyecto={proyecto} />
            ))
          )}
        </Box>
      </Box>
    );
  };

  if (loading && proyectos.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress size={60} sx={{ color: '#D4AF37' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, bgcolor: '#F8FAFC', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: '#D4AF37', width: 56, height: 56 }}>
            <ProcesoIcon sx={{ fontSize: 32 }} />
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              🏭 TALLER
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {proyectos.length} proyectos en total
            </Typography>
          </Box>
        </Box>
        
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={cargarProyectos}
          disabled={loading}
          sx={{ 
            bgcolor: '#D4AF37',
            '&:hover': { bgcolor: '#B8941F' },
            px: 3,
            py: 1.5
          }}
        >
          {loading ? 'Cargando...' : 'ACTUALIZAR'}
        </Button>
      </Box>
      
      {/* Tablero Kanban */}
      <Box 
        sx={{ 
          display: 'flex', 
          gap: 2, 
          overflowX: 'auto',
          pb: 2
        }}
      >
        <Columna estadoKey="recepcion_material" titulo="📦 MATERIAL" />
        <Columna estadoKey="pendiente" titulo="⏳ PENDIENTE" />
        <Columna estadoKey="en_proceso" titulo="🔧 EN PROCESO" />
        <Columna estadoKey="situacion_critica" titulo="🚨 CRÍTICO" />
        <Columna estadoKey="terminado" titulo="✅ TERMINADO" />
      </Box>
      
      {/* Modal de Orden de Taller - Usando VisorPDF (react-pdf) */}
      <Dialog 
        open={!!ordenAbierta} 
        onClose={cerrarOrden}
        maxWidth="lg"
        fullWidth
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: '#D4AF37' }}>
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
            🛠️ ORDEN DE TALLER - {ordenAbierta?.proyecto?.numero}
          </Typography>
          <Box>
            {ordenAbierta?.url && (
              <Tooltip title="Imprimir">
                <IconButton 
                  onClick={() => {
                    const printWindow = window.open(ordenAbierta.url, '_blank');
                    if (printWindow) {
                      printWindow.onload = () => printWindow.print();
                    }
                  }}
                  sx={{ color: 'white' }}
                >
                  <PrintIcon />
                </IconButton>
              </Tooltip>
            )}
            <IconButton 
              onClick={cerrarOrden}
              sx={{ color: 'white' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
        <DialogContent sx={{ p: 0, height: '80vh', bgcolor: '#525659' }}>
          {ordenAbierta?.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress size={60} sx={{ color: '#D4AF37' }} />
            </Box>
          ) : ordenAbierta?.url ? (
            <VisorPDF url={ordenAbierta.url} />
          ) : null}
        </DialogContent>
      </Dialog>
      
      {/* Snackbar de Éxito */}
      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" sx={{ fontSize: '1.1rem' }}>
          {success}
        </Alert>
      </Snackbar>
      
      {/* Snackbar de Error */}
      <Snackbar
        open={!!error}
        autoHideDuration={5000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" variant="filled">
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TallerKanban;

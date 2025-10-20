import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  TrendingUp,
  ShoppingCart,
  AccessTime,
  AttachMoney,
  Notifications,
  CheckCircle,
  Refresh,
  Warning,
  People
} from '@mui/icons-material';

const DashboardComercialSimple = () => {
  const [metricas, setMetricas] = useState(null);
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);
  const [actualizando, setActualizando] = useState(false);

  useEffect(() => {
    cargarDashboard();
    
    // Actualizar cada 30 segundos para captar cambios (sin loading)
    const interval = setInterval(() => {
      cargarDashboard(false);
    }, 30000);

    // Escuchar cambios en el localStorage (cuando se actualiza desde Kanban)
    const handleStorageChange = (e) => {
      if (e.key === 'pedidos_updated' || e.key === 'dashboard_refresh') {
        console.log('🔄 Detectado cambio, actualizando dashboard...');
        cargarDashboard();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Cleanup
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const cargarDashboard = async (mostrarLoading = true) => {
    try {
      if (mostrarLoading) {
        setLoading(true);
      } else {
        setActualizando(true);
      }
      
      // Cargar datos completos del flujo comercial
      const [pedidosRes, prospectosRes, cotizacionesRes] = await Promise.all([
        fetch('/api/pedidos'),
        fetch('/api/prospectos'),
        fetch('/api/cotizaciones')
      ]);
      
      if (pedidosRes.ok && prospectosRes.ok && cotizacionesRes.ok) {
        const [pedidosData, prospectosData, cotizacionesData] = await Promise.all([
          pedidosRes.json(),
          prospectosRes.json(),
          cotizacionesRes.json()
        ]);
        
        console.log('📊 Datos cargados:', {
          pedidos: pedidosData.length,
          prospectos: prospectosData.length,
          cotizaciones: cotizacionesData.length
        });
        
        // Calcular métricas desde el flujo completo
        const metricasCalculadas = calcularMetricasCompletas({
          pedidos: pedidosData,
          prospectos: prospectosData,
          cotizaciones: cotizacionesData
        });
        setMetricas(metricasCalculadas);
        
        // Generar notificaciones desde los datos reales
        const notificacionesGeneradas = generarNotificacionesDesdeData(pedidosData);
        setNotificaciones(notificacionesGeneradas);
      } else if (pedidosRes.ok) {
        // Fallback: solo pedidos
        const pedidosData = await pedidosRes.json();
        console.log('📊 Solo pedidos cargados:', pedidosData.length);
        
        const metricasCalculadas = calcularMetricasDesdeData(pedidosData);
        setMetricas(metricasCalculadas);
        
        const notificacionesGeneradas = generarNotificacionesDesdeData(pedidosData);
        setNotificaciones(notificacionesGeneradas);
      } else {
        console.error('Error cargando pedidos:', pedidosRes.status);
        // Fallback: intentar cargar desde el nuevo endpoint si existe
        try {
          const [metricasRes, notificacionesRes] = await Promise.all([
            fetch('/api/pedidos/dashboard/metricas'),
            fetch('/api/pedidos/dashboard/notificaciones?limite=10')
          ]);

          if (metricasRes.ok) {
            const metricasData = await metricasRes.json();
            setMetricas(metricasData.data);
          }

          if (notificacionesRes.ok) {
            const notifData = await notificacionesRes.json();
            setNotificaciones(notifData.data.notificaciones || []);
          }
        } catch (fallbackError) {
          console.log('Endpoints de dashboard no disponibles, usando datos simulados');
          setMetricas(getDatosPrueba());
          setNotificaciones([]);
        }
      }

      setUltimaActualizacion(new Date());
    } catch (error) {
      console.error('Error cargando dashboard:', error);
      // Datos de prueba como último recurso
      setMetricas(getDatosPrueba());
      setNotificaciones([]);
    } finally {
      setLoading(false);
      setActualizando(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${value > 0 ? '+' : ''}${value}%`;
  };

  const getPrioridadColor = (prioridad) => {
    switch (prioridad) {
      case 'critica': return 'error';
      case 'importante': return 'warning';
      case 'normal': return 'info';
      default: return 'success';
    }
  };

  // Calcular métricas completas del flujo comercial
  const calcularMetricasCompletas = (datos) => {
    const { pedidos, prospectos, cotizaciones } = datos;
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const inicioMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    const finMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0);

    // === ANÁLISIS DE PROSPECTOS (VISITAS) ===
    const prospectosDelMes = prospectos.filter(p => {
      const fechaCreacion = new Date(p.createdAt);
      return fechaCreacion >= inicioMes;
    });

    const prospectosMesAnterior = prospectos.filter(p => {
      const fechaCreacion = new Date(p.createdAt);
      return fechaCreacion >= inicioMesAnterior && fechaCreacion <= finMesAnterior;
    });

    // Análisis por etapas del pipeline
    const prospectosNuevos = prospectosDelMes.filter(p => p.etapa === 'nuevo').length;
    const prospectosContactados = prospectosDelMes.filter(p => p.etapa === 'contactado').length;
    const prospectosConCita = prospectosDelMes.filter(p => p.etapa === 'cita_agendada').length;
    const prospectosConCotizacion = prospectosDelMes.filter(p => p.etapa === 'cotizacion').length;
    const prospectosVentaCerrada = prospectosDelMes.filter(p => p.etapa === 'venta_cerrada').length;

    // === ANÁLISIS DE COTIZACIONES ===
    const cotizacionesDelMes = cotizaciones.filter(c => {
      const fechaCreacion = new Date(c.createdAt);
      return fechaCreacion >= inicioMes;
    });

    const cotizacionesMesAnterior = cotizaciones.filter(c => {
      const fechaCreacion = new Date(c.createdAt);
      return fechaCreacion >= inicioMesAnterior && fechaCreacion <= finMesAnterior;
    });

    const cotizacionesAprobadas = cotizacionesDelMes.filter(c => c.estado === 'aprobada').length;
    const cotizacionesConvertidasCount = cotizacionesDelMes.filter(c => c.estado === 'convertida').length;

    // === ANÁLISIS DE PEDIDOS ===
    const pedidosDelMes = pedidos.filter(p => {
      const fechaPedido = new Date(p.fechaPedido || p.createdAt);
      return fechaPedido >= inicioMes;
    });

    const pedidosMesAnterior = pedidos.filter(p => {
      const fechaPedido = new Date(p.fechaPedido || p.createdAt);
      return fechaPedido >= inicioMesAnterior && fechaPedido <= finMesAnterior;
    });

    // Calcular ventas
    const ventasActual = pedidosDelMes.reduce((sum, p) => sum + (p.montoTotal || 0), 0);
    const ventasAnterior = pedidosMesAnterior.reduce((sum, p) => sum + (p.montoTotal || 0), 0);
    const crecimientoVentas = ventasAnterior > 0 ? ((ventasActual - ventasAnterior) / ventasAnterior) * 100 : 0;

    // Estados de pedidos
    const pedidosCompletados = pedidosDelMes.filter(p => 
      ['entregado', 'completado'].includes(p.estado)
    ).length;
    
    const pedidosEnProceso = pedidosDelMes.filter(p => 
      ['en_fabricacion', 'fabricado', 'en_instalacion'].includes(p.estado)
    ).length;

    // === CÁLCULO DE CONVERSIONES ===
    const tasaProspectoACotizacion = prospectosDelMes.length > 0 ? 
      (cotizacionesDelMes.length / prospectosDelMes.length) * 100 : 0;

    const tasaCotizacionAPedido = cotizacionesDelMes.length > 0 ? 
      (pedidosDelMes.length / cotizacionesDelMes.length) * 100 : 0;

    const tasaProspectoAPedido = prospectosDelMes.length > 0 ? 
      (pedidosDelMes.length / prospectosDelMes.length) * 100 : 0;

    // === TIEMPOS PROMEDIO ===
    let tiempoPromedioProspectoACotizacion = 0;
    let tiempoPromedioCotizacionAPedido = 0;

    // Calcular tiempo promedio prospecto → cotización
    const prospectosConTiempo = prospectos.filter(p => p.etapa === 'cotizacion' || p.etapa === 'venta_cerrada');
    if (prospectosConTiempo.length > 0) {
      const tiempos = prospectosConTiempo.map(p => {
        const cotizacionRelacionada = cotizaciones.find(c => c.prospecto.toString() === p._id.toString());
        if (cotizacionRelacionada) {
          const tiempoDias = (new Date(cotizacionRelacionada.createdAt) - new Date(p.createdAt)) / (1000 * 60 * 60 * 24);
          return tiempoDias;
        }
        return 0;
      }).filter(t => t > 0);
      
      if (tiempos.length > 0) {
        tiempoPromedioProspectoACotizacion = tiempos.reduce((sum, t) => sum + t, 0) / tiempos.length;
      }
    }

    // Calcular tiempo promedio cotización → pedido
    const cotizacionesConvertidas = cotizaciones.filter(c => c.estado === 'convertida');
    if (cotizacionesConvertidas.length > 0) {
      const tiempos = cotizacionesConvertidas.map(c => {
        const pedidoRelacionado = pedidos.find(p => p.cotizacion && p.cotizacion.toString() === c._id.toString());
        if (pedidoRelacionado) {
          const tiempoDias = (new Date(pedidoRelacionado.createdAt) - new Date(c.createdAt)) / (1000 * 60 * 60 * 24);
          return tiempoDias;
        }
        return 0;
      }).filter(t => t > 0);
      
      if (tiempos.length > 0) {
        tiempoPromedioCotizacionAPedido = tiempos.reduce((sum, t) => sum + t, 0) / tiempos.length;
      }
    }

    // === MÉTRICAS DE COBRANZA ===
    const anticiposPendientes = pedidos
      .filter(p => !p.anticipo?.pagado)
      .reduce((sum, p) => sum + (p.anticipo?.monto || 0), 0);

    const saldosPendientes = pedidos
      .filter(p => !p.saldo?.pagado)
      .reduce((sum, p) => sum + (p.saldo?.monto || 0), 0);

    const pedidosPagados = pedidos.filter(p => 
      p.anticipo?.pagado && p.saldo?.pagado
    ).length;
    
    const pagosPuntuales = pedidos.length > 0 ? (pedidosPagados / pedidos.length) * 100 : 0;

    // Pedidos recientes
    const pedidosRecientes = [...pedidos]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    return {
      // Métricas de ventas
      ventas: {
        actual: ventasActual,
        anterior: ventasAnterior,
        crecimiento: Math.round(crecimientoVentas * 10) / 10,
        meta: 140000,
        progreso: (ventasActual / 140000) * 100
      },
      
      // Métricas de pedidos
      pedidos: {
        total: pedidosDelMes.length,
        nuevos: pedidosDelMes.filter(p => 
          ['confirmado', 'pendiente_anticipo'].includes(p.estado)
        ).length,
        enProceso: pedidosEnProceso,
        completados: pedidosCompletados,
        crecimiento: pedidosMesAnterior.length > 0 ? 
          ((pedidosDelMes.length - pedidosMesAnterior.length) / pedidosMesAnterior.length) * 100 : 0
      },

      // Métricas del pipeline completo
      pipeline: {
        prospectos: prospectosDelMes.length,
        cotizaciones: cotizacionesDelMes.length,
        pedidos: pedidosDelMes.length,
        // Desglose por etapas
        etapas: {
          nuevos: prospectosNuevos,
          contactados: prospectosContactados,
          conCita: prospectosConCita,
          conCotizacion: prospectosConCotizacion,
          ventaCerrada: prospectosVentaCerrada
        }
      },

      // Tiempos del flujo completo
      tiempos: {
        prospectoACotizacion: Math.round(tiempoPromedioProspectoACotizacion * 10) / 10,
        cotizacionAPedido: Math.round(tiempoPromedioCotizacionAPedido * 10) / 10,
        cicloCompleto: Math.round((tiempoPromedioProspectoACotizacion + tiempoPromedioCotizacionAPedido) * 10) / 10
      },

      // Conversiones del flujo completo
      conversion: {
        prospectoACotizacion: Math.round(tasaProspectoACotizacion * 10) / 10,
        cotizacionAPedido: Math.round(tasaCotizacionAPedido * 10) / 10,
        prospectoAPedido: Math.round(tasaProspectoAPedido * 10) / 10
      },

      // Métricas de cobranza
      cobranza: {
        anticiposPendientes,
        saldosPendientes,
        pagosPuntuales: Math.round(pagosPuntuales * 10) / 10
      },

      pedidosRecientes
    };
  };

  // Calcular métricas desde los datos reales de pedidos (fallback)
  const calcularMetricasDesdeData = (pedidos) => {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const inicioMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    const finMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0);

    // Filtrar pedidos del mes actual
    const pedidosMesActual = pedidos.filter(p => {
      const fechaPedido = new Date(p.fechaPedido || p.createdAt);
      return fechaPedido >= inicioMes;
    });

    // Filtrar pedidos del mes anterior
    const pedidosMesAnterior = pedidos.filter(p => {
      const fechaPedido = new Date(p.fechaPedido || p.createdAt);
      return fechaPedido >= inicioMesAnterior && fechaPedido <= finMesAnterior;
    });

    // Calcular ventas
    const ventasActual = pedidosMesActual.reduce((sum, p) => sum + (p.montoTotal || 0), 0);
    const ventasAnterior = pedidosMesAnterior.reduce((sum, p) => sum + (p.montoTotal || 0), 0);
    const crecimientoVentas = ventasAnterior > 0 ? ((ventasActual - ventasAnterior) / ventasAnterior) * 100 : 0;

    // Contar pedidos por estado
    const pedidosCompletados = pedidosMesActual.filter(p => 
      ['entregado', 'completado'].includes(p.estado)
    ).length;
    
    const pedidosEnProceso = pedidosMesActual.filter(p => 
      ['en_fabricacion', 'fabricado', 'en_instalacion'].includes(p.estado)
    ).length;

    // Calcular métricas de cobranza
    const anticiposPendientes = pedidos
      .filter(p => !p.anticipo?.pagado)
      .reduce((sum, p) => sum + (p.anticipo?.monto || 0), 0);

    const saldosPendientes = pedidos
      .filter(p => !p.saldo?.pagado)
      .reduce((sum, p) => sum + (p.saldo?.monto || 0), 0);

    const pedidosPagados = pedidos.filter(p => 
      p.anticipo?.pagado && p.saldo?.pagado
    ).length;
    
    const pagosPuntuales = pedidos.length > 0 ? (pedidosPagados / pedidos.length) * 100 : 0;

    // Pedidos recientes (últimos 5)
    const pedidosRecientes = [...pedidos]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    return {
      ventas: {
        actual: ventasActual,
        anterior: ventasAnterior,
        crecimiento: Math.round(crecimientoVentas * 10) / 10,
        meta: 140000, // Meta fija por ahora
        progreso: (ventasActual / 140000) * 100
      },
      pedidos: {
        total: pedidosMesActual.length,
        nuevos: pedidosMesActual.filter(p => 
          ['confirmado', 'pendiente_anticipo'].includes(p.estado)
        ).length,
        enProceso: pedidosEnProceso,
        completados: pedidosCompletados,
        crecimiento: pedidosMesAnterior.length > 0 ? 
          ((pedidosMesActual.length - pedidosMesAnterior.length) / pedidosMesAnterior.length) * 100 : 0
      },
      tiempos: {
        cotizacionAPedido: 5.2, // Calculado posteriormente
        pedidoAEntrega: 12.8,
        cicloCompleto: 18.0
      },
      conversion: {
        cotizacionAPedido: 68.5, // Calculado posteriormente
        pedidoAVenta: pedidos.length > 0 ? (pedidosCompletados / pedidos.length) * 100 : 0
      },
      cobranza: {
        anticiposPendientes,
        saldosPendientes,
        pagosPuntuales: Math.round(pagosPuntuales * 10) / 10
      },
      pedidosRecientes
    };
  };

  // Generar notificaciones desde los datos reales
  const generarNotificacionesDesdeData = (pedidos) => {
    const notificaciones = [];
    const hoy = new Date();

    pedidos.forEach(pedido => {
      // Verificar anticipos pendientes
      if (!pedido.anticipo?.pagado) {
        const diasPendiente = pedido.fechaPedido ? 
          Math.ceil((hoy - new Date(pedido.fechaPedido)) / (1000 * 60 * 60 * 24)) : 0;
        
        if (diasPendiente > 3) {
          notificaciones.push({
            id: `anticipo_${pedido._id}`,
            tipo: 'ANTICIPO_PENDIENTE',
            prioridad: diasPendiente > 7 ? 'critica' : 'importante',
            titulo: 'Anticipo pendiente',
            mensaje: `Anticipo pendiente hace ${diasPendiente} días - Pedido ${pedido.numero}`,
            pedidoId: pedido._id,
            pedidoNumero: pedido.numero,
            cliente: pedido.prospecto?.nombre || 'Cliente',
            vendedor: pedido.vendedor
          });
        }
      }

      // Verificar saldos pendientes
      if (!pedido.saldo?.pagado && pedido.saldo?.fechaVencimiento) {
        const fechaVencimiento = new Date(pedido.saldo.fechaVencimiento);
        if (hoy > fechaVencimiento) {
          const diasVencido = Math.ceil((hoy - fechaVencimiento) / (1000 * 60 * 60 * 24));
          notificaciones.push({
            id: `saldo_${pedido._id}`,
            tipo: 'PAGO_VENCIDO',
            prioridad: 'critica',
            titulo: 'Saldo vencido',
            mensaje: `Saldo vencido hace ${diasVencido} días - Pedido ${pedido.numero}`,
            pedidoId: pedido._id,
            pedidoNumero: pedido.numero,
            cliente: pedido.prospecto?.nombre || 'Cliente',
            vendedor: pedido.vendedor
          });
        }
      }

      // Verificar pedidos listos para fabricación
      if (pedido.estado === 'confirmado' && pedido.anticipo?.pagado) {
        notificaciones.push({
          id: `fabricacion_${pedido._id}`,
          tipo: 'LISTO_FABRICACION',
          prioridad: 'importante',
          titulo: 'Listo para fabricación',
          mensaje: `Pedido ${pedido.numero} listo para enviar a fabricación`,
          pedidoId: pedido._id,
          pedidoNumero: pedido.numero,
          cliente: pedido.prospecto?.nombre || 'Cliente',
          vendedor: pedido.vendedor
        });
      }

      // Verificar entregas atrasadas
      if (pedido.fechaEntrega && hoy > new Date(pedido.fechaEntrega) && 
          ['fabricado', 'en_instalacion'].includes(pedido.estado)) {
        const diasAtraso = Math.ceil((hoy - new Date(pedido.fechaEntrega)) / (1000 * 60 * 60 * 24));
        notificaciones.push({
          id: `entrega_${pedido._id}`,
          tipo: 'ENTREGA_ATRASADA',
          prioridad: 'critica',
          titulo: 'Entrega atrasada',
          mensaje: `Entrega atrasada ${diasAtraso} días - Pedido ${pedido.numero}`,
          pedidoId: pedido._id,
          pedidoNumero: pedido.numero,
          cliente: pedido.prospecto?.nombre || 'Cliente',
          vendedor: pedido.vendedor
        });
      }
    });

    // Ordenar por prioridad
    return notificaciones.sort((a, b) => {
      const prioridades = { 'critica': 0, 'importante': 1, 'normal': 2, 'informativa': 3 };
      return prioridades[a.prioridad] - prioridades[b.prioridad];
    });
  };

  // Datos de prueba como fallback
  const getDatosPrueba = () => ({
    ventas: {
      actual: 125450,
      anterior: 109200,
      crecimiento: 14.9,
      meta: 140000,
      progreso: 89.6
    },
    pedidos: {
      total: 23,
      nuevos: 8,
      enProceso: 12,
      completados: 3,
      crecimiento: 15.2
    },
    tiempos: {
      cotizacionAPedido: 5.2,
      pedidoAEntrega: 12.8,
      cicloCompleto: 18.0
    },
    conversion: {
      cotizacionAPedido: 68.5,
      pedidoAVenta: 94.2
    },
    cobranza: {
      anticiposPendientes: 45200,
      saldosPendientes: 78900,
      pagosPuntuales: 87.3
    },
    pedidosRecientes: []
  });

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '60vh',
          flexDirection: 'column',
          gap: 2
        }}
      >
        <CircularProgress size={60} sx={{ color: '#1E40AF' }} />
        <Typography variant="h6" color="text.secondary">
          Cargando Dashboard Comercial...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      flexGrow: 1, 
      p: 3, 
      backgroundColor: '#f5f5f5', 
      minHeight: '100vh',
      '& @keyframes spin': {
        '0%': { transform: 'rotate(0deg)' },
        '100%': { transform: 'rotate(360deg)' }
      }
    }}>
      {/* Header del Dashboard Comercial */}
      <Paper 
        sx={{ 
          background: 'linear-gradient(135deg, #1E40AF 0%, #1E3A8A 100%)',
          color: 'white',
          p: 3,
          mb: 3,
          borderRadius: 2
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
              🛒 Dashboard Comercial
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
              Gestión de ventas y seguimiento comercial
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="contained"
              onClick={() => cargarDashboard(true)}
              startIcon={<Refresh sx={{ animation: actualizando ? 'spin 1s linear infinite' : 'none' }} />}
              disabled={actualizando}
              sx={{ 
                backgroundColor: 'rgba(255,255,255,0.2)',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' },
                '&:disabled': { backgroundColor: 'rgba(255,255,255,0.1)' }
              }}
            >
              {actualizando ? 'Actualizando...' : 'Actualizar'}
            </Button>
            {ultimaActualizacion && (
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="caption" sx={{ opacity: 0.8, display: 'block' }}>
                  Actualizado: {ultimaActualizacion.toLocaleTimeString()}
                </Typography>
                {actualizando && (
                  <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.7rem' }}>
                    🔄 Sincronizando datos...
                  </Typography>
                )}
                <Typography variant="caption" sx={{ opacity: 0.6, fontSize: '0.7rem', display: 'block' }}>
                  ⚡ Auto-actualización cada 30s
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Métricas Principales */}
      {metricas && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* Ventas del Mes */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography color="text.secondary" gutterBottom variant="body2">
                      Ventas del Mes
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {formatCurrency(metricas.ventas.actual)}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <TrendingUp 
                        sx={{ 
                          fontSize: 16, 
                          color: metricas.ventas.crecimiento >= 0 ? 'success.main' : 'error.main' 
                        }} 
                      />
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: metricas.ventas.crecimiento >= 0 ? 'success.main' : 'error.main' 
                        }}
                      >
                        {formatPercentage(metricas.ventas.crecimiento)} vs mes anterior
                      </Typography>
                    </Box>
                    
                    {/* Barra de progreso hacia la meta */}
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          Meta mensual
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {metricas.ventas.progreso.toFixed(1)}%
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={Math.min(metricas.ventas.progreso, 100)}
                        sx={{ 
                          height: 6, 
                          borderRadius: 3,
                          backgroundColor: 'grey.200',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: '#1E40AF'
                          }
                        }}
                      />
                    </Box>
                  </Box>
                  <Box sx={{ 
                    backgroundColor: '#E3F2FD', 
                    p: 1.5, 
                    borderRadius: '50%',
                    ml: 2
                  }}>
                    <AttachMoney sx={{ color: '#1E40AF', fontSize: 24 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Pedidos Activos */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography color="text.secondary" gutterBottom variant="body2">
                      Pedidos del Mes
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {metricas.pedidos.total}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip 
                        label={`${metricas.pedidos.completados} completados`}
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                      <Chip 
                        label={`${metricas.pedidos.enProceso} en proceso`}
                        size="small"
                        color="info"
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                  <Box sx={{ 
                    backgroundColor: '#E8F5E8', 
                    p: 1.5, 
                    borderRadius: '50%',
                    ml: 2
                  }}>
                    <ShoppingCart sx={{ color: '#2E7D32', fontSize: 24 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Pipeline Completo */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography color="text.secondary" gutterBottom variant="body2">
                      Pipeline del Mes
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {metricas.pipeline ? metricas.pipeline.prospectos : 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Prospectos → {metricas.pipeline ? metricas.pipeline.cotizaciones : 0} Cotizaciones
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Cotizaciones → {metricas.pipeline ? metricas.pipeline.pedidos : 0} Pedidos
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    backgroundColor: '#F3E5F5', 
                    p: 1.5, 
                    borderRadius: '50%',
                    ml: 2
                  }}>
                    <TrendingUp sx={{ color: '#7B1FA2', fontSize: 24 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Conversión Completa */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography color="text.secondary" gutterBottom variant="body2">
                      Conversión Total
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {metricas.conversion ? metricas.conversion.prospectoAPedido || 0 : 0}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Prospecto → Cotización: {metricas.conversion ? metricas.conversion.prospectoACotizacion || 0 : 0}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Cotización → Pedido: {metricas.conversion ? metricas.conversion.cotizacionAPedido || 0 : 0}%
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    backgroundColor: '#FFF3E0', 
                    p: 1.5, 
                    borderRadius: '50%',
                    ml: 2
                  }}>
                    <AccessTime sx={{ color: '#F57C00', fontSize: 24 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Pipeline por Etapas */}
      {metricas && metricas.pipeline && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              🔄 Pipeline Comercial - Flujo Completo
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={2}>
                <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#E3F2FD', borderRadius: 2 }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1976D2' }}>
                    {metricas.pipeline.etapas.nuevos}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Nuevos Prospectos
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#F3E5F5', borderRadius: 2 }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#7B1FA2' }}>
                    {metricas.pipeline.etapas.contactados}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Contactados
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#FFF3E0', borderRadius: 2 }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#F57C00' }}>
                    {metricas.pipeline.etapas.conCita}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Citas Agendadas
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#E8F5E8', borderRadius: 2 }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#2E7D32' }}>
                    {metricas.pipeline.cotizaciones}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Cotizaciones
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#E1F5FE', borderRadius: 2 }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#0277BD' }}>
                    {metricas.pipeline.etapas.ventaCerrada}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Ventas Cerradas
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#E8F5E8', borderRadius: 2 }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#388E3C' }}>
                    {metricas.pipeline.pedidos}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Pedidos Confirmados
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            
            {/* Tiempos del Flujo */}
            {metricas.tiempos && (
              <Box sx={{ mt: 3, p: 2, backgroundColor: '#F5F5F5', borderRadius: 2 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                  ⏱️ Tiempos Promedio del Flujo:
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2">
                      <strong>Prospecto → Cotización:</strong> {metricas.tiempos.prospectoACotizacion || 'N/A'} días
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2">
                      <strong>Cotización → Pedido:</strong> {metricas.tiempos.cotizacionAPedido || 'N/A'} días
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2">
                      <strong>Ciclo Completo:</strong> {metricas.tiempos.cicloCompleto || 'N/A'} días
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      <Grid container spacing={3}>
        {/* Notificaciones Comerciales */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="h2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Notifications sx={{ color: '#1E40AF' }} />
                  Notificaciones Comerciales
                </Typography>
                <Chip 
                  label={notificaciones.length}
                  color="primary"
                  size="small"
                />
              </Box>
              
              {notificaciones.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                  <Typography color="text.secondary">
                    ¡Todo al día! No hay notificaciones pendientes.
                  </Typography>
                </Box>
              ) : (
                <List>
                  {notificaciones.map((notif, index) => (
                    <React.Fragment key={notif.id || index}>
                      <ListItem>
                        <ListItemIcon>
                          {notif.prioridad === 'critica' && <Warning color="error" />}
                          {notif.prioridad === 'importante' && <Warning color="warning" />}
                          {notif.prioridad === 'normal' && <Notifications color="info" />}
                          {notif.prioridad === 'informativa' && <CheckCircle color="success" />}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Typography variant="subtitle2">{notif.titulo}</Typography>
                              <Chip 
                                label={notif.prioridad.toUpperCase()}
                                size="small"
                                color={getPrioridadColor(notif.prioridad)}
                                variant="outlined"
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {notif.mensaje}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                <Typography variant="caption" color="text.secondary">
                                  📋 {notif.pedidoNumero}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  👤 {notif.cliente}
                                </Typography>
                                {notif.vendedor && (
                                  <Typography variant="caption" color="text.secondary">
                                    🏷️ {notif.vendedor.nombre} {notif.vendedor.apellido}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < notificaciones.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Panel Lateral - Resumen Financiero */}
        <Grid item xs={12} lg={4}>
          {/* Estado de Cobranza */}
          {metricas && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  💰 Estado de Cobranza
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Anticipos Pendientes
                    </Typography>
                    <Typography variant="subtitle2" color="error.main">
                      {formatCurrency(metricas.cobranza.anticiposPendientes)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Saldos Pendientes
                    </Typography>
                    <Typography variant="subtitle2" color="warning.main">
                      {formatCurrency(metricas.cobranza.saldosPendientes)}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Pagos Puntuales
                    </Typography>
                    <Typography variant="subtitle2" color="success.main">
                      {metricas.cobranza.pagosPuntuales}%
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Pedidos Recientes */}
          {metricas && metricas.pedidosRecientes && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  📋 Pedidos Recientes
                </Typography>
                <List dense>
                  {metricas.pedidosRecientes.map((pedido, index) => (
                    <ListItem key={pedido._id || index} sx={{ px: 0 }}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                              <Typography variant="subtitle2">{pedido.numero}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {pedido.prospecto?.nombre}
                              </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography variant="subtitle2">
                                {formatCurrency(pedido.montoTotal)}
                              </Typography>
                              <Chip 
                                label={pedido.estado}
                                size="small"
                                color={
                                  pedido.estado === 'completado' ? 'success' :
                                  pedido.estado === 'en_proceso' ? 'info' : 'warning'
                                }
                                variant="outlined"
                              />
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardComercialSimple;

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  ShoppingCart, 
  AccessTime as Clock, 
  GpsFixed as Target, 
  Notifications as Bell, 
  AttachMoney as DollarSign,
  People as Users,
  Warning as AlertTriangle,
  CheckCircle,
  Refresh as RefreshCw
} from '@mui/icons-material';

const DashboardComercial = () => {
  const [metricas, setMetricas] = useState(null);
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);

  useEffect(() => {
    cargarDashboard();
  }, []);

  const cargarDashboard = async () => {
    try {
      setLoading(true);
      
      // Cargar métricas y notificaciones en paralelo
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

      setUltimaActualizacion(new Date());
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setLoading(false);
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
      case 'critica': return 'text-red-600 bg-red-50 border-red-200';
      case 'importante': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'normal': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getPrioridadIcon = (prioridad) => {
    switch (prioridad) {
      case 'critica': return '🔴';
      case 'importante': return '🟡';
      case 'normal': return '🔵';
      default: return '🟢';
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw style={{ width: '32px', height: '32px', color: '#1E40AF', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: '#6b7280' }}>Cargando dashboard comercial...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header del Dashboard Comercial */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                🛒 Dashboard Comercial
              </h1>
              <p className="text-blue-100 mt-1">
                Gestión de ventas y seguimiento comercial
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={cargarDashboard}
                className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Actualizar
              </button>
              {ultimaActualizacion && (
                <div className="text-sm text-blue-100">
                  Actualizado: {ultimaActualizacion.toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Métricas Principales */}
        {metricas && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Ventas del Mes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ventas del Mes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(metricas.ventas.actual)}
                  </p>
                  <p className={`text-sm flex items-center gap-1 ${
                    metricas.ventas.crecimiento >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <TrendingUp className="w-4 h-4" />
                    {formatPercentage(metricas.ventas.crecimiento)} vs mes anterior
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              
              {/* Barra de progreso hacia la meta */}
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Meta mensual</span>
                  <span>{metricas.ventas.progreso.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(metricas.ventas.progreso, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Pedidos Activos */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pedidos del Mes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metricas.pedidos.total}
                  </p>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span className="text-green-600">
                      ✅ {metricas.pedidos.completados} completados
                    </span>
                    <span className="text-blue-600">
                      🔄 {metricas.pedidos.enProceso} en proceso
                    </span>
                  </div>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <ShoppingCart className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            {/* Tiempo Promedio */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ciclo Promedio</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metricas.tiempos.cicloCompleto} días
                  </p>
                  <div className="text-sm text-gray-600 mt-2">
                    <div>Cotización → Pedido: {metricas.tiempos.cotizacionAPedido}d</div>
                    <div>Pedido → Entrega: {metricas.tiempos.pedidoAEntrega}d</div>
                  </div>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            {/* Conversión */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tasa de Conversión</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metricas.conversion.cotizacionAPedido}%
                  </p>
                  <div className="text-sm text-gray-600 mt-2">
                    <div>Cotización → Pedido: {metricas.conversion.cotizacionAPedido}%</div>
                    <div>Pedido → Venta: {metricas.conversion.pedidoAVenta}%</div>
                  </div>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <Target className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Notificaciones Comerciales */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-blue-600" />
                    Notificaciones Comerciales
                  </h2>
                  <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                    {notificaciones.length}
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                {notificaciones.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <p className="text-gray-500">¡Todo al día! No hay notificaciones pendientes.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notificaciones.map((notif, index) => (
                      <div 
                        key={notif.id || index}
                        className={`p-4 rounded-lg border-l-4 ${getPrioridadColor(notif.prioridad)}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">{getPrioridadIcon(notif.prioridad)}</span>
                              <h3 className="font-medium text-gray-900">{notif.titulo}</h3>
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                {notif.prioridad.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{notif.mensaje}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>📋 {notif.pedidoNumero}</span>
                              <span>👤 {notif.cliente}</span>
                              {notif.vendedor && (
                                <span>🏷️ {notif.vendedor.nombre} {notif.vendedor.apellido}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            {notif.acciones?.slice(0, 2).map((accion, idx) => (
                              <button
                                key={idx}
                                className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded transition-colors"
                              >
                                {accion.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Panel Lateral - Resumen Financiero */}
          <div className="space-y-6">
            {/* Estado de Cobranza */}
            {metricas && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  💰 Estado de Cobranza
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Anticipos Pendientes</span>
                    <span className="font-medium text-red-600">
                      {formatCurrency(metricas.cobranza.anticiposPendientes)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Saldos Pendientes</span>
                    <span className="font-medium text-orange-600">
                      {formatCurrency(metricas.cobranza.saldosPendientes)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm text-gray-600">Pagos Puntuales</span>
                    <span className="font-medium text-green-600">
                      {metricas.cobranza.pagosPuntuales}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Pedidos Recientes */}
            {metricas && metricas.pedidosRecientes && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  📋 Pedidos Recientes
                </h3>
                <div className="space-y-3">
                  {metricas.pedidosRecientes.map((pedido, index) => (
                    <div key={pedido._id || index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-sm">{pedido.numero}</div>
                        <div className="text-xs text-gray-600">{pedido.prospecto?.nombre}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-sm">{formatCurrency(pedido.montoTotal)}</div>
                        <div className={`text-xs px-2 py-1 rounded ${
                          pedido.estado === 'completado' ? 'bg-green-100 text-green-700' :
                          pedido.estado === 'en_proceso' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {pedido.estado}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardComercial;

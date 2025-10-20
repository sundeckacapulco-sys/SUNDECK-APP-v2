import React, { useState, useEffect } from 'react';
import { 
  Build as Wrench, 
  AccessTime as Clock, 
  CheckCircle, 
  Warning as AlertTriangle, 
  Inventory as Package, 
  People as Users,
  BarChart,
  Refresh as RefreshCw,
  Settings
} from '@mui/icons-material';

const DashboardFabricacion = () => {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);

  useEffect(() => {
    cargarDashboard();
  }, []);

  const cargarDashboard = async () => {
    try {
      setLoading(true);
      
      // TODO: Implementar endpoint de fabricación
      const response = await fetch('/api/fabricacion');
      if (response.ok) {
        const data = await response.json();
        setOrdenes(data || []);
      }

      setUltimaActualizacion(new Date());
    } catch (error) {
      console.error('Error cargando dashboard fabricación:', error);
      // Datos de ejemplo mientras implementamos el backend completo
      setOrdenes([
        {
          numero: 'FAB-2025-0001',
          cliente: 'María González',
          productos: 3,
          estado: 'en_proceso',
          progreso: 65,
          fechaInicio: new Date(),
          fechaEstimada: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
        },
        {
          numero: 'FAB-2025-0002',
          cliente: 'Carlos Ruiz',
          productos: 2,
          estado: 'pendiente',
          progreso: 0,
          fechaInicio: new Date(),
          fechaEstimada: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'en_proceso': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'terminado': return 'bg-green-100 text-green-800 border-green-200';
      case 'control_calidad': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'pendiente': return '⏳';
      case 'en_proceso': return '🔧';
      case 'terminado': return '✅';
      case 'control_calidad': return '🔍';
      default: return '📦';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando dashboard de fabricación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header del Dashboard Fabricación */}
      <div className="bg-gradient-to-r from-green-700 to-green-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                🏭 Dashboard de Fabricación
              </h1>
              <p className="text-green-100 mt-1">
                Control de producción y calidad
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={cargarDashboard}
                className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Actualizar
              </button>
              {ultimaActualizacion && (
                <div className="text-sm text-green-100">
                  Actualizado: {ultimaActualizacion.toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Métricas de Producción */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Órdenes Activas */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Órdenes Activas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {ordenes.length}
                </p>
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <Package className="w-4 h-4" />
                  En producción
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Wrench className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Productos en Proceso */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Productos en Proceso</p>
                <p className="text-2xl font-bold text-gray-900">
                  {ordenes.reduce((sum, orden) => sum + orden.productos, 0)}
                </p>
                <p className="text-sm text-blue-600 flex items-center gap-1">
                  <Settings className="w-4 h-4" />
                  Unidades
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Tiempo Promedio */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tiempo Promedio</p>
                <p className="text-2xl font-bold text-gray-900">3.2 días</p>
                <p className="text-sm text-purple-600 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Por producto
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Eficiencia */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Eficiencia</p>
                <p className="text-2xl font-bold text-gray-900">94%</p>
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Control de calidad
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <BarChart className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Órdenes de Fabricación */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-green-600" />
                    Órdenes de Fabricación
                  </h2>
                  <span className="bg-green-100 text-green-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                    {ordenes.length} activas
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                {ordenes.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <p className="text-gray-500">No hay órdenes de fabricación pendientes.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {ordenes.map((orden, index) => (
                      <div 
                        key={orden.numero || index}
                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{getEstadoIcon(orden.estado)}</span>
                            <div>
                              <h3 className="font-medium text-gray-900">{orden.numero}</h3>
                              <p className="text-sm text-gray-600">Cliente: {orden.cliente}</p>
                            </div>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getEstadoColor(orden.estado)}`}>
                            {orden.estado.replace('_', ' ').toUpperCase()}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                          <div>
                            <span className="font-medium">Productos:</span> {orden.productos}
                          </div>
                          <div>
                            <span className="font-medium">Inicio:</span> {orden.fechaInicio?.toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">Estimado:</span> {orden.fechaEstimada?.toLocaleDateString()}
                          </div>
                        </div>

                        {/* Barra de progreso */}
                        <div className="mb-3">
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Progreso de fabricación</span>
                            <span>{orden.progreso}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${orden.progreso}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded transition-colors">
                            Ver Detalles
                          </button>
                          <button className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded transition-colors">
                            Actualizar Estado
                          </button>
                          {orden.estado === 'terminado' && (
                            <button className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-1 rounded transition-colors">
                              Control Calidad
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Panel Lateral - Información Técnica */}
          <div className="space-y-6">
            {/* Alertas de Producción */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                ⚠️ Alertas de Producción
              </h3>
              <div className="space-y-3">
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">Material Bajo Stock</span>
                  </div>
                  <p className="text-xs text-yellow-700 mt-1">Tela Screen 3% - Quedan 15m</p>
                </div>
                
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Mantenimiento Programado</span>
                  </div>
                  <p className="text-xs text-blue-700 mt-1">Máquina cortadora - Mañana 2:00 PM</p>
                </div>
              </div>
            </div>

            {/* Estadísticas Rápidas */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                📊 Estadísticas del Día
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Productos Terminados</span>
                  <span className="font-medium text-green-600">8</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">En Control de Calidad</span>
                  <span className="font-medium text-purple-600">3</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Rechazos</span>
                  <span className="font-medium text-red-600">0</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm text-gray-600">Eficiencia del Día</span>
                  <span className="font-medium text-green-600">98%</span>
                </div>
              </div>
            </div>

            {/* Equipo de Trabajo */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                👥 Equipo Activo
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Juan Pérez</span>
                  </div>
                  <span className="text-xs text-gray-500">Cortado</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">María López</span>
                  </div>
                  <span className="text-xs text-gray-500">Armado</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm">Carlos Ruiz</span>
                  </div>
                  <span className="text-xs text-gray-500">Descanso</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardFabricacion;

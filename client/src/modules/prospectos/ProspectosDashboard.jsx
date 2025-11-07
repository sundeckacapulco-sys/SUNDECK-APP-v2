import React, { useState, useEffect } from 'react';
import axios from '../../config/axios';
import moment from 'moment';
import 'moment/locale/es';

moment.locale('es');

const ProspectosDashboard = () => {
  const [prospectos, setProspectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [modalNota, setModalNota] = useState({ visible: false, prospectoId: null });
  const [nuevaNota, setNuevaNota] = useState({ mensaje: '', tipo: 'nota' });

  useEffect(() => {
    cargarProspectos();
  }, [filtroEstado]);

  const cargarProspectos = async () => {
    try {
      setLoading(true);
      const params = filtroEstado ? { estadoComercial: filtroEstado } : {};
      const response = await axios.get('/prospectos', { params });
      setProspectos(response.data);
    } catch (error) {
      console.error('Error cargando prospectos:', error);
      alert('Error al cargar prospectos');
    } finally {
      setLoading(false);
    }
  };

  const abrirModalNota = (prospectoId) => {
    setModalNota({ visible: true, prospectoId });
    setNuevaNota({ mensaje: '', tipo: 'nota' });
  };

  const cerrarModalNota = () => {
    setModalNota({ visible: false, prospectoId: null });
    setNuevaNota({ mensaje: '', tipo: 'nota' });
  };

  const agregarNota = async () => {
    if (!nuevaNota.mensaje.trim()) {
      alert('El mensaje es requerido');
      return;
    }

    try {
      await axios.post(`/prospectos/${modalNota.prospectoId}/agregar-nota`, nuevaNota);
      alert('Nota agregada exitosamente');
      cerrarModalNota();
      cargarProspectos();
    } catch (error) {
      console.error('Error agregando nota:', error);
      alert('Error al agregar nota');
    }
  };

  const convertirAProyecto = async (prospectoId, clienteNombre) => {
    if (!window.confirm(`¿Convertir "${clienteNombre}" a proyecto formal?`)) {
      return;
    }

    try {
      await axios.post(`/prospectos/${prospectoId}/convertir`);
      alert('Prospecto convertido exitosamente');
      cargarProspectos();
    } catch (error) {
      console.error('Error convirtiendo prospecto:', error);
      alert('Error al convertir prospecto');
    }
  };

  const getEstadoColor = (estado) => {
    const colores = {
      'en seguimiento': 'bg-blue-100 text-blue-800',
      'cotizado': 'bg-yellow-100 text-yellow-800',
      'sin respuesta': 'bg-gray-100 text-gray-800',
      'convertido': 'bg-green-100 text-green-800',
      'perdido': 'bg-red-100 text-red-800'
    };
    return colores[estado] || 'bg-gray-100 text-gray-800';
  };

  const getAlertaInactividad = (ultimaNota) => {
    if (!ultimaNota) return '🔴 Sin seguimiento';
    
    const dias = moment().diff(moment(ultimaNota), 'days');
    if (dias > 5) return `🔴 ${dias} días sin contacto`;
    if (dias > 3) return `🟡 ${dias} días`;
    return `🟢 ${moment(ultimaNota).fromNow()}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          📋 Prospectos en Seguimiento
        </h1>
        <p className="text-gray-600">
          Gestiona la etapa comercial antes de convertir a proyecto
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white shadow-md rounded-lg p-4 mb-6">
        <div className="flex items-center gap-4">
          <label className="font-semibold text-gray-700">Filtrar por estado:</label>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos</option>
            <option value="en seguimiento">En seguimiento</option>
            <option value="cotizado">Cotizado</option>
            <option value="sin respuesta">Sin respuesta</option>
            <option value="convertido">Convertido</option>
            <option value="perdido">Perdido</option>
          </select>
          <span className="text-gray-600">
            Total: <strong>{prospectos.length}</strong> prospectos
          </span>
        </div>
      </div>

      {/* Tabla de Prospectos */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Asesor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Última Actividad
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Probabilidad
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {prospectos.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  No hay prospectos para mostrar
                </td>
              </tr>
            ) : (
              prospectos.map((prospecto) => (
                <tr key={prospecto._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {prospecto.cliente?.nombre || 'Sin nombre'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {prospecto.cliente?.telefono || 'Sin teléfono'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {prospecto.asesorComercial?.nombre || 'Sin asignar'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getEstadoColor(prospecto.estadoComercial)}`}>
                      {prospecto.estadoComercial}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getAlertaInactividad(prospecto.ultimaNota)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${prospecto.probabilidadCierre || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">
                        {prospecto.probabilidadCierre || 0}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => abrirModalNota(prospecto._id)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      title="Agregar nota"
                    >
                      🗒️ Nota
                    </button>
                    <button
                      onClick={() => convertirAProyecto(prospecto._id, prospecto.cliente?.nombre)}
                      className="text-green-600 hover:text-green-900"
                      title="Convertir a proyecto"
                    >
                      🔁 Convertir
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal para Agregar Nota */}
      {modalNota.visible && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Agregar Nota de Seguimiento
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de seguimiento
                </label>
                <select
                  value={nuevaNota.tipo}
                  onChange={(e) => setNuevaNota({ ...nuevaNota, tipo: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="nota">Nota</option>
                  <option value="llamada">Llamada</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">Email</option>
                  <option value="visita">Visita</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensaje
                </label>
                <textarea
                  value={nuevaNota.mensaje}
                  onChange={(e) => setNuevaNota({ ...nuevaNota, mensaje: e.target.value })}
                  rows="4"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Escribe el seguimiento realizado..."
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={cerrarModalNota}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  onClick={agregarNota}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Guardar Nota
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProspectosDashboard;

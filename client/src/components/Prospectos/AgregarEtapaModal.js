import React, { useState, useEffect, useMemo } from 'react';
import axiosConfig from '../../config/axios';

const etapaOptions = [
  'Visita Inicial / Medición',
  'Seguimiento',
  'Presentación de Propuesta',
  'Negociación',
  'Cierre',
  'Entrega',
  'Postventa'
];

const emptyPieza = {
  ubicacion: '',
  ancho: '',
  alto: '',
  producto: 'Ventana',
  color: 'Natural',
  precioM2: '',
  observaciones: '',
  fotoUrl: ''
};

const AgregarEtapaModal = ({ open, onClose, prospectoId, onSaved, onError }) => {
  const [nombreEtapa, setNombreEtapa] = useState(etapaOptions[0]);
  const [unidad, setUnidad] = useState('m');
  const [piezas, setPiezas] = useState([]);
  const [agregandoPieza, setAgregandoPieza] = useState(false);
  const [piezaForm, setPiezaForm] = useState(emptyPieza);
  const [comentarios, setComentarios] = useState('');
  const [precioGeneral, setPrecioGeneral] = useState(750);
  const [guardando, setGuardando] = useState(false);
  const [generandoCotizacion, setGenerandoCotizacion] = useState(false);
  const [descargandoLevantamiento, setDescargandoLevantamiento] = useState(false);
  const [errorLocal, setErrorLocal] = useState('');

  const resetFormulario = () => {
    setNombreEtapa(etapaOptions[0]);
    setUnidad('m');
    setPiezas([]);
    setComentarios('');
    setPrecioGeneral(750);
    setErrorLocal('');
    setGuardando(false);
    setGenerandoCotizacion(false);
    setDescargandoLevantamiento(false);
    setAgregandoPieza(false);
    setPiezaForm(emptyPieza);
  };

  useEffect(() => {
    if (!open) {
      resetFormulario();
    }
  }, [open]);

  const calcularTotalM2 = useMemo(() => {
    return piezas.reduce((total, pieza) => {
      const ancho = parseFloat(pieza.ancho) || 0;
      const alto = parseFloat(pieza.alto) || 0;
      const area = unidad === 'cm' ? (ancho * alto) / 10000 : ancho * alto;
      return total + area;
    }, 0);
  }, [piezas, unidad]);

  const cerrarModal = () => {
    resetFormulario();
    onClose();
  };

  const handleAgregarPieza = () => {
    if (!piezaForm.ubicacion || !piezaForm.ancho || !piezaForm.alto) {
      setErrorLocal('Completa ubicación, ancho y alto para agregar la pieza.');
      return;
    }

    setPiezas((prev) => [
      ...prev,
      {
        ...piezaForm,
        ancho: parseFloat(piezaForm.ancho) || 0,
        alto: parseFloat(piezaForm.alto) || 0,
        precioM2: parseFloat(piezaForm.precioM2) || precioGeneral
      }
    ]);
    setPiezaForm(emptyPieza);
    setAgregandoPieza(false);
    setErrorLocal('');
  };

  const handleEliminarPieza = (index) => {
    setPiezas((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDescargarLevantamiento = async () => {
    if (!prospectoId) {
      setErrorLocal('No se encontró el identificador del prospecto.');
      return;
    }

    if (piezas.length === 0) {
      setErrorLocal('Debes agregar al menos una pieza para descargar el levantamiento.');
      return;
    }

    setDescargandoLevantamiento(true);
    setErrorLocal('');

    try {
      const payload = {
        prospectoId,
        piezas: piezas.map((pieza) => ({
          ubicacion: pieza.ubicacion,
          ancho: pieza.ancho !== '' ? Number(pieza.ancho) : 0,
          alto: pieza.alto !== '' ? Number(pieza.alto) : 0,
          producto: pieza.producto,
          color: pieza.color,
          observaciones: pieza.observaciones
        })),
        precioGeneral: Number(precioGeneral),
        totalM2: calcularTotalM2,
        unidadMedida: unidad
      };

      const response = await axiosConfig.post('/etapas/levantamiento-pdf', payload, {
        responseType: 'blob'
      });

      // Crear enlace de descarga
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Levantamiento-Medidas-${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      console.log('✅ Levantamiento descargado exitosamente');
    } catch (error) {
      console.error('Error descargando levantamiento:', error);
      const mensaje = error.response?.data?.message || 'No se pudo descargar el levantamiento.';
      setErrorLocal(mensaje);
    } finally {
      setDescargandoLevantamiento(false);
    }
  };

  const handleGenerarCotizacion = async () => {
    if (!prospectoId) {
      setErrorLocal('No se encontró el identificador del prospecto.');
      return;
    }

    if (piezas.length === 0) {
      setErrorLocal('Debes agregar al menos una pieza para generar la cotización.');
      return;
    }

    setGenerandoCotizacion(true);
    setErrorLocal('');

    try {
      const payload = {
        prospectoId,
        piezas: piezas.map((pieza) => ({
          ubicacion: pieza.ubicacion,
          ancho: pieza.ancho !== '' ? Number(pieza.ancho) : 0,
          alto: pieza.alto !== '' ? Number(pieza.alto) : 0,
          producto: pieza.producto,
          color: pieza.color,
          precioM2: pieza.precioM2 !== '' ? Number(pieza.precioM2) : precioGeneral,
          observaciones: pieza.observaciones,
          fotoUrl: pieza.fotoUrl
        })),
        precioGeneral: Number(precioGeneral),
        totalM2: calcularTotalM2,
        unidadMedida: unidad,
        comentarios
      };

      const { data } = await axiosConfig.post('/cotizaciones/desde-visita', payload);
      
      onSaved?.(
        `¡Cotización ${data.cotizacion.numero} generada exitosamente! El prospecto se movió a "Cotizaciones Activas".`,
        data.cotizacion
      );
      cerrarModal();
    } catch (error) {
      console.error('Error generando cotización:', error);
      const mensaje = error.response?.data?.message || 'No se pudo generar la cotización.';
      setErrorLocal(mensaje);
      onError?.(mensaje);
    } finally {
      setGenerandoCotizacion(false);
    }
  };

  const handleGuardarEtapa = async () => {
    if (!prospectoId) {
      setErrorLocal('No se encontró el identificador del prospecto.');
      return;
    }

    if (!nombreEtapa) {
      setErrorLocal('Selecciona el nombre de la etapa.');
      return;
    }

    setGuardando(true);
    setErrorLocal('');

    try {
      const payload = {
        prospectoId,
        nombreEtapa,
        comentarios,
        unidadMedida: unidad,
        precioGeneral: Number(precioGeneral),
        totalM2: calcularTotalM2,
        piezas: piezas.map((pieza) => ({
          ubicacion: pieza.ubicacion,
          ancho: pieza.ancho !== '' ? Number(pieza.ancho) : 0,
          alto: pieza.alto !== '' ? Number(pieza.alto) : 0,
          producto: pieza.producto,
          color: pieza.color,
          precioM2: pieza.precioM2 !== '' ? Number(pieza.precioM2) : undefined,
          observaciones: pieza.observaciones,
          fotoUrl: pieza.fotoUrl
        }))
      };

      const { data } = await axiosConfig.post('/etapas', payload);
      onSaved?.(data.message || 'Etapa agregada exitosamente', data.etapa);
      cerrarModal();
    } catch (error) {
      console.error('Error guardando etapa:', error);
      const mensaje = error.response?.data?.message || 'No se pudo guardar la etapa.';
      setErrorLocal(mensaje);
      onError?.(mensaje);
    } finally {
      setGuardando(false);
    }
  };

  if (!open) return null;

  // Debug
  console.log('🔍 MODAL ACTIVO - Etapa:', nombreEtapa);
  console.log('🔍 Es Visita Inicial?', nombreEtapa === 'Visita Inicial / Medición');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Agregar Nueva Etapa</h2>
          <button
            onClick={cerrarModal}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Selector de Etapa */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Etapa
            </label>
            <select
              value={nombreEtapa}
              onChange={(e) => {
                console.log('🔄 Cambiando etapa a:', e.target.value);
                setNombreEtapa(e.target.value);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              {etapaOptions.map((etapa) => (
                <option key={etapa} value={etapa}>
                  {etapa}
                </option>
              ))}
            </select>
          </div>

          {/* MENSAJE DE DEBUG VISIBLE */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-700">
              🔍 DEBUG: Etapa actual = "{nombreEtapa}" | Es Visita Inicial = {nombreEtapa === 'Visita Inicial / Medición' ? 'SÍ' : 'NO'}
            </p>
          </div>

          {/* Fecha y Hora - Solo para etapas que NO sean Visita Inicial */}
          {nombreEtapa !== 'Visita Inicial / Medición' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hora
                </label>
                <input
                  type="time"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
            </div>
          )}

          {/* ===== LEVANTAMIENTO DE MEDIDAS - SOLO PARA VISITA INICIAL ===== */}
          {nombreEtapa === 'Visita Inicial / Medición' && (
            <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  📏 Levantamiento de Medidas
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAgregandoPieza(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                  >
                    + Agregar Pieza
                  </button>
                  <button 
                    onClick={handleDescargarLevantamiento}
                    disabled={descargandoLevantamiento || piezas.length === 0}
                    className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 text-sm disabled:opacity-50"
                  >
                    {descargandoLevantamiento ? '⏳ Generando...' : '📄 Descargar Levantamiento'}
                  </button>
                </div>
              </div>

              {/* Precio General */}
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  💰 Precio General por m² (MXN)
                </label>
                <input
                  type="number"
                  value={precioGeneral}
                  onChange={(e) => setPrecioGeneral(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="750"
                />
              </div>

              {/* Unidad */}
              <div className="flex gap-2 mb-4">
                <span className="text-sm text-gray-600">Unidad:</span>
                <button
                  onClick={() => setUnidad('m')}
                  className={`px-3 py-1 text-sm rounded ${unidad === 'm' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  m
                </button>
                <button
                  onClick={() => setUnidad('cm')}
                  className={`px-3 py-1 text-sm rounded ${unidad === 'cm' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  cm
                </button>
              </div>

              {/* Formulario Agregar Pieza */}
              {agregandoPieza && (
                <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-white">
                  <h4 className="font-medium text-gray-900 mb-3">🔧 Agregar Pieza #{piezas.length + 1}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                      <input
                        type="text"
                        value={piezaForm.ubicacion}
                        onChange={(e) => setPiezaForm(prev => ({ ...prev, ubicacion: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ej. Sala, Recámara, Terraza"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
                      <select
                        value={piezaForm.producto}
                        onChange={(e) => setPiezaForm(prev => ({ ...prev, producto: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Ventana">Ventana</option>
                        <option value="Puerta">Puerta</option>
                        <option value="Ventanal">Ventanal</option>
                        <option value="Puerta Corrediza">Puerta Corrediza</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ancho ({unidad})</label>
                      <input
                        type="number"
                        step="0.01"
                        value={piezaForm.ancho}
                        onChange={(e) => setPiezaForm(prev => ({ ...prev, ancho: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Alto ({unidad})</label>
                      <input
                        type="number"
                        step="0.01"
                        value={piezaForm.alto}
                        onChange={(e) => setPiezaForm(prev => ({ ...prev, alto: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={handleAgregarPieza}
                      className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                    >
                      ✅ Agregar Pieza
                    </button>
                    <button
                      onClick={() => setAgregandoPieza(false)}
                      className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                    >
                      ❌ Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Lista de Piezas */}
              {piezas.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-3">📋 Piezas Agregadas ({piezas.length})</h4>
                  <div className="space-y-2">
                    {piezas.map((pieza, index) => {
                      const area = unidad === 'cm' ? (pieza.ancho * pieza.alto) / 10000 : pieza.ancho * pieza.alto;
                      const precio = pieza.precioM2 || precioGeneral;
                      return (
                        <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-4">
                              <span className="font-medium text-gray-900">📍 {pieza.ubicacion}</span>
                              <span className="text-sm text-gray-600">{pieza.producto}</span>
                              <span className="text-sm text-gray-600">{pieza.ancho} × {pieza.alto} {unidad}</span>
                              <span className="text-sm font-medium text-blue-600">📐 {area.toFixed(2)} m²</span>
                              <span className="text-sm text-green-600">💰 ${(area * precio).toFixed(2)}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleEliminarPieza(index)}
                            className="text-red-500 hover:text-red-700 ml-2"
                          >
                            🗑️
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Resumen */}
              {piezas.length > 0 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">📊 Resumen de Medición</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Total piezas:</span>
                      <p className="font-medium">🔢 {piezas.length}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Área total:</span>
                      <p className="font-medium text-blue-600">📐 {calcularTotalM2.toFixed(2)} m²</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Precio promedio:</span>
                      <p className="font-medium">💰 ${precioGeneral}/m²</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Estimado:</span>
                      <p className="font-medium text-green-600">💵 ${(calcularTotalM2 * precioGeneral).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Comentarios */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones
            </label>
            <textarea
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              rows="3"
              placeholder="Comentarios adicionales sobre esta etapa..."
            />
          </div>

          {errorLocal && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">❌ {errorLocal}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={cerrarModal}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancelar
          </button>
          
          <div className="flex gap-3">
            {/* Botón Generar Cotización - Solo para Visita Inicial con piezas */}
            {nombreEtapa === 'Visita Inicial / Medición' && piezas.length > 0 && (
              <button
                onClick={handleGenerarCotizacion}
                disabled={generandoCotizacion || guardando}
                className="inline-flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                <span>💰</span>
                {generandoCotizacion ? 'Generando...' : 'Generar Cotización'}
              </button>
            )}
            
            <button
              onClick={handleGuardarEtapa}
              disabled={guardando || generandoCotizacion}
              className="px-6 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : 'Agregar Etapa'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgregarEtapaModal;

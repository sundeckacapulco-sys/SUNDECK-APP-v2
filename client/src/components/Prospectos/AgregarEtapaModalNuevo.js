import React, { useState, useEffect, useMemo } from 'react';
import axiosConfig from '../../config/axios';

const etapaOptions = [
  'Visita Inicial / Medición',
  'Diseño y Cotización',
  'Presentación de Propuesta',
  'Negociación',
  'Instalación',
  'Postventa'
];

const ayudaEtapa = {
  'Visita Inicial / Medición': 'Captación del prospecto y levantamiento de medidas. Documentar medidas, necesidades y especificaciones.',
  'Diseño y Cotización': 'Registrar los detalles técnicos necesarios para preparar la cotización y planos.',
  'Presentación de Propuesta': 'Adjunta las piezas o elementos clave que se mostraron al cliente.',
  'Negociación': 'Documenta ajustes solicitados y comentarios relevantes del cliente.',
  'Instalación': 'Detalla piezas y observaciones para el equipo de instalación.',
  'Postventa': 'Anota ajustes finales, garantías o soporte posterior a la instalación.'
};

const emptyPieza = {
  ubicacion: '',
  ancho: '',
  alto: '',
  producto: '',
  color: '',
  precioM2: '',
  observaciones: '',
  fotoBase64: '',
  fotoNombre: ''
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
  const [errorLocal, setErrorLocal] = useState('');

  const resetFormulario = () => {
    setNombreEtapa(etapaOptions[0]);
    setUnidad('m');
    setPiezas([]);
    setComentarios('');
    setPrecioGeneral(750);
    setErrorLocal('');
    setGuardando(false);
    setAgregandoPieza(false);
    setPiezaForm(emptyPieza);
  };

  useEffect(() => {
    if (!open) {
      resetFormulario();
    }
  }, [open]);

  const ayudaSeleccionada = useMemo(
    () => ayudaEtapa[nombreEtapa] || 'Agrega la información relevante para esta etapa del prospecto.',
    [nombreEtapa]
  );

  const calcularTotalM2 = useMemo(() => {
    return piezas.reduce((total, pieza) => {
      const ancho = parseFloat(pieza.ancho) || 0;
      const alto = parseFloat(pieza.alto) || 0;
      let area = ancho * alto;
      if (unidad === 'cm') {
        area = area / 10000; // convertir cm² a m²
      }
      return total + area;
    }, 0);
  }, [piezas, unidad]);

  const cerrarModal = () => {
    resetFormulario();
    onClose?.();
  };

  const handleArchivoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setPiezaForm((prev) => ({ ...prev, fotoBase64: '', fotoNombre: '' }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setPiezaForm((prev) => ({ ...prev, fotoBase64: e.target?.result || '', fotoNombre: file.name }));
    };
    reader.readAsDataURL(file);
  };

  const handleAgregarPieza = (event) => {
    event.preventDefault();

    if (!piezaForm.ubicacion.trim()) {
      setErrorLocal('La ubicación es requerida.');
      return;
    }

    setPiezas((prev) => [
      ...prev,
      {
        ubicacion: piezaForm.ubicacion.trim(),
        ancho: piezaForm.ancho,
        alto: piezaForm.alto,
        producto: piezaForm.producto.trim(),
        color: piezaForm.color.trim(),
        precioM2: piezaForm.precioM2,
        observaciones: piezaForm.observaciones.trim(),
        fotoUrl: piezaForm.fotoBase64,
        fotoNombre: piezaForm.fotoNombre
      }
    ]);
    setPiezaForm(emptyPieza);
    setAgregandoPieza(false);
    setErrorLocal('');
  };

  const handleEliminarPieza = (index) => {
    setPiezas((prev) => prev.filter((_, i) => i !== index));
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
        precioGeneral,
        totalM2: calcularTotalM2,
        piezas: piezas.map((pieza) => ({
          ubicacion: pieza.ubicacion,
          ancho: pieza.ancho !== '' ? Number(pieza.ancho) : undefined,
          alto: pieza.alto !== '' ? Number(pieza.alto) : undefined,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl max-h-[90vh] overflow-hidden">
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

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Nombre de la Etapa */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la Etapa
            </label>
            <select
              value={nombreEtapa}
              onChange={(e) => setNombreEtapa(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {etapaOptions.map((opcion) => (
                <option key={opcion} value={opcion}>
                  {opcion}
                </option>
              ))}
            </select>
            
            {/* Ayuda contextual */}
            <div className="mt-2 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
              <p className="text-sm text-blue-700">{ayudaSeleccionada}</p>
            </div>
          </div>

          {/* Levantamiento de Medidas */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Levantamiento de Medidas
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setAgregandoPieza(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                >
                  + Agregar Pieza
                </button>
                <button className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 text-sm">
                  Descargar Levantamiento
                </button>
              </div>
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

            {/* Precio General */}
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio General por m² (MXN)
              </label>
              <input
                type="number"
                value={precioGeneral}
                onChange={(e) => setPrecioGeneral(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="Precio base aproximado o mínimo (opcional)"
              />
            </div>

            {/* Formulario Agregar Pieza */}
            {agregandoPieza && (
              <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <h4 className="font-medium text-gray-900 mb-3">Pieza #{piezas.length + 1}</h4>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ancho ({unidad})</label>
                    <input
                      type="number"
                      step="0.01"
                      value={piezaForm.ancho}
                      onChange={(e) => setPiezaForm(prev => ({ ...prev, ancho: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="2.50"
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
                      placeholder="1.80"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Producto / Tela</label>
                    <input
                      type="text"
                      value={piezaForm.producto}
                      onChange={(e) => setPiezaForm(prev => ({ ...prev, producto: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Tipo de producto o tela"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Color / Acabado</label>
                    <input
                      type="text"
                      value={piezaForm.color}
                      onChange={(e) => setPiezaForm(prev => ({ ...prev, color: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Color o acabado"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio por m² (Opcional)</label>
                    <input
                      type="number"
                      value={piezaForm.precioM2}
                      onChange={(e) => setPiezaForm(prev => ({ ...prev, precioM2: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Precio específico"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                    <textarea
                      value={piezaForm.observaciones}
                      onChange={(e) => setPiezaForm(prev => ({ ...prev, observaciones: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Observaciones adicionales..."
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fotos</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 text-sm"
                      >
                        📷 Subir Foto (s)
                      </button>
                      <span className="text-sm text-gray-500">Notas / Video URL</span>
                      <input
                        type="text"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Link de Drive, Dropbox, videos, etc."
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => {
                      setAgregandoPieza(false);
                      setPiezaForm(emptyPieza);
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAgregarPieza}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            )}

            {/* Lista de Piezas */}
            {piezas.map((pieza, index) => (
              <div key={index} className="mb-3 p-3 border border-gray-200 rounded-lg bg-white">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Guardado</span>
                      <span className="text-sm text-gray-600">Faltó precio</span>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Ubicación</span>
                        <p className="font-medium">{pieza.ubicacion}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Ancho ({unidad})</span>
                        <p className="font-medium">{pieza.ancho}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Alto ({unidad})</span>
                        <p className="font-medium">{pieza.alto}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Producto / Tela</span>
                        <p className="font-medium">{pieza.producto}</p>
                      </div>
                    </div>
                    {pieza.observaciones && (
                      <p className="text-sm text-gray-600 mt-2">{pieza.observaciones}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleEliminarPieza(index)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}

            {/* Resumen de Medición */}
            <div className="mt-4 p-4 bg-gray-800 text-white rounded-lg">
              <h4 className="text-lg font-medium text-yellow-400 mb-2">Resumen de Medición</h4>
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-gray-300">Total m²:</span>
                  <span className="text-xl font-bold ml-2">{calcularTotalM2.toFixed(2)} m²</span>
                </div>
                <div className="text-right">
                  <div className="text-yellow-400">Sin precio</div>
                  <div className="text-lg font-bold">{piezas.length} pieza(s)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Comentarios */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comentarios
            </label>
            <textarea
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe los detalles de esta etapa..."
            />
          </div>

          {errorLocal && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{errorLocal}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={cerrarModal}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardarEtapa}
            disabled={guardando}
            className="px-6 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : 'Agregar Etapa'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgregarEtapaModal;

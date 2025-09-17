import React, { useEffect, useMemo, useState } from 'react';
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

const unidadOptions = [
  { value: 'm', label: 'Metros (m)' },
  { value: 'cm', label: 'Centímetros (cm)' }
];

const controlOptions = [
  { value: 'manual', label: 'Manual' },
  { value: 'motorizado', label: 'Motorizado' }
];

const emptyPieza = {
  ubicacion: '',
  ancho: '',
  alto: '',
  producto: '',
  color: '',
  control: 'manual',
  observaciones: '',
  fotoBase64: '',
  fotoNombre: ''
};

const AgregarEtapaModal = ({ open, onClose, prospectoId, onSaved, onError }) => {
  const [nombreEtapa, setNombreEtapa] = useState(etapaOptions[0]);
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [hora, setHora] = useState('');
  const [unidad, setUnidad] = useState('m');
  const [piezas, setPiezas] = useState([]);
  const [agregandoPieza, setAgregandoPieza] = useState(false);
  const [piezaForm, setPiezaForm] = useState(emptyPieza);
  const [comentarios, setComentarios] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [errorLocal, setErrorLocal] = useState('');

  const resetFormulario = () => {
    setNombreEtapa(etapaOptions[0]);
    setFecha(new Date().toISOString().slice(0, 10));
    setHora('');
    setUnidad('m');
    setPiezas([]);
    setComentarios('');
    setErrorLocal('');
    setGuardando(false);
    setAgregandoPieza(false);
    setPiezaForm(emptyPieza);
  };

  useEffect(() => {
    if (!open) return undefined;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      resetFormulario();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const ayudaSeleccionada = useMemo(
    () => ayudaEtapa[nombreEtapa] || 'Agrega la información relevante para esta etapa del prospecto.',
    [nombreEtapa]
  );

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

    if (!piezaForm.ubicacion.trim() || !piezaForm.producto.trim()) {
      setErrorLocal('La pieza debe incluir al menos ubicación y producto.');
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
        control: piezaForm.control,
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
        fecha,
        hora,
        comentarios,
        unidadMedida: unidad,
        piezas: piezas.map((pieza) => ({
          ubicacion: pieza.ubicacion,
          ancho: pieza.ancho !== '' ? Number(pieza.ancho) : undefined,
          alto: pieza.alto !== '' ? Number(pieza.alto) : undefined,
          producto: pieza.producto,
          color: pieza.color,
          control: pieza.control,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="relative w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="font-inter text-xl font-semibold text-slate-900">Agregar etapa</h2>
            <p className="mt-1 text-sm text-slate-500">Registra la información clave de esta fase del proceso comercial.</p>
          </div>
          <button
            type="button"
            onClick={cerrarModal}
            className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
            aria-label="Cerrar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path
                fillRule="evenodd"
                d="M10 8.586 4.293 2.879A1 1 0 0 0 2.879 4.293L8.586 10l-5.707 5.707a1 1 0 0 0 1.414 1.414L10 11.414l5.707 5.707a1 1 0 0 0 1.414-1.414L11.414 10l5.707-5.707A1 1 0 0 0 15.707 2.88L10 8.586Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <div className="grid max-h-[70vh] grid-cols-1 gap-6 overflow-y-auto px-6 py-6 lg:grid-cols-5">
          <div className="space-y-5 lg:col-span-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Nombre de la etapa</label>
              <select
                value={nombreEtapa}
                onChange={(event) => setNombreEtapa(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40"
              >
                {etapaOptions.map((opcion) => (
                  <option key={opcion} value={opcion}>
                    {opcion}
                  </option>
                ))}
              </select>
              <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600">{ayudaSeleccionada}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Fecha</label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(event) => setFecha(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Hora</label>
                <input
                  type="time"
                  value={hora}
                  onChange={(event) => setHora(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Unidad para las medidas</label>
              <div className="mt-2 flex gap-3">
                {unidadOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setUnidad(option.value)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                      unidad === option.value
                        ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Comentarios</label>
              <textarea
                value={comentarios}
                onChange={(event) => setComentarios(event.target.value)}
                rows={5}
                placeholder="Notas generales sobre la etapa, acuerdos o pendientes."
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40"
              />
            </div>
          </div>

          <div className="space-y-5 lg:col-span-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-inter text-lg font-semibold text-slate-900">Levantamiento de medidas</h3>
                <p className="text-sm text-slate-500">Registra cada pieza y sus especificaciones técnicas.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAgregandoPieza(true);
                  setErrorLocal('');
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-[#D4AF37] px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#b8962d]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path d="M10.75 4.75a.75.75 0 0 0-1.5 0V9.25H4.75a.75.75 0 0 0 0 1.5H9.25V15.25a.75.75 0 0 0 1.5 0V10.75H15.25a.75.75 0 0 0 0-1.5H10.75V4.75Z" />
                </svg>
                Agregar pieza
              </button>
            </div>

            {agregandoPieza && (
              <form onSubmit={handleAgregarPieza} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700">Ubicación</label>
                    <input
                      value={piezaForm.ubicacion}
                      onChange={(event) => setPiezaForm((prev) => ({ ...prev, ubicacion: event.target.value }))}
                      placeholder="Ej. Sala principal"
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Ancho ({unidad})</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={piezaForm.ancho}
                      onChange={(event) => setPiezaForm((prev) => ({ ...prev, ancho: event.target.value }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Alto ({unidad})</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={piezaForm.alto}
                      onChange={(event) => setPiezaForm((prev) => ({ ...prev, alto: event.target.value }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Producto / Tela</label>
                    <input
                      value={piezaForm.producto}
                      onChange={(event) => setPiezaForm((prev) => ({ ...prev, producto: event.target.value }))}
                      placeholder="Enrollable Screen, Panel Japonés, etc."
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Color / Acabado</label>
                    <input
                      value={piezaForm.color}
                      onChange={(event) => setPiezaForm((prev) => ({ ...prev, color: event.target.value }))}
                      placeholder="Blanco, Nogal, etc."
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Tipo de control</label>
                    <select
                      value={piezaForm.control}
                      onChange={(event) => setPiezaForm((prev) => ({ ...prev, control: event.target.value }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40"
                    >
                      {controlOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700">Observaciones</label>
                    <textarea
                      rows={3}
                      value={piezaForm.observaciones}
                      onChange={(event) => setPiezaForm((prev) => ({ ...prev, observaciones: event.target.value }))}
                      placeholder="Notas específicas de esta pieza"
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700">Fotografía de referencia</label>
                    <label className="mt-1 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500 transition hover:border-[#D4AF37] hover:bg-[#D4AF37]/10">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 h-8 w-8 text-slate-400">
                        <path d="M4.75 7.75a2 2 0 0 1 2-2h2.086a2 2 0 0 0 1.414-.586l.914-.914a2 2 0 0 1 1.414-.586h2.086a2 2 0 0 1 2 2v.672" />
                        <path d="M19.25 9.75v6.5a2 2 0 0 1-2 2h-10.5a2 2 0 0 1-2-2v-6.5a2 2 0 0 1 2-2h10.5a2 2 0 0 1 2 2Z" />
                        <path d="M9.75 12.75a2.25 2.25 0 1 0 4.5 0 2.25 2.25 0 0 0-4.5 0Z" />
                      </svg>
                      {piezaForm.fotoNombre ? (
                        <>
                          <span className="font-medium text-slate-700">{piezaForm.fotoNombre}</span>
                          <span className="mt-1 text-xs text-slate-500">Haz clic para reemplazarla</span>
                        </>
                      ) : (
                        <>
                          <span className="font-medium text-slate-700">Subir fotografía</span>
                          <span className="mt-1 text-xs">JPG o PNG máximo 5 MB</span>
                        </>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={handleArchivoChange} />
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setAgregandoPieza(false);
                      setPiezaForm(emptyPieza);
                    }}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#b8962d]"
                  >
                    Guardar pieza
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {piezas.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                  Aún no has agregado piezas. Utiliza el botón "Agregar pieza" para registrar una nueva medición.
                </div>
              ) : (
                piezas.map((pieza, index) => (
                  <div
                    key={`${pieza.ubicacion}-${index}`}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-inter text-base font-semibold text-slate-900">{pieza.ubicacion}</p>
                      <p className="text-sm text-slate-500">
                        {pieza.ancho ? `${pieza.ancho}${unidad}` : '—'} × {pieza.alto ? `${pieza.alto}${unidad}` : '—'} · {pieza.producto || 'Sin producto'}
                      </p>
                      {pieza.observaciones && <p className="mt-1 text-sm text-slate-500">{pieza.observaciones}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleEliminarPieza(index)}
                      className="self-end rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 md:self-auto"
                    >
                      Eliminar
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {errorLocal && (
          <div className="px-6">
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorLocal}</div>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={cerrarModal}
            className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleGuardarEtapa}
            disabled={guardando}
            className="inline-flex items-center justify-center rounded-lg bg-[#D4AF37] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#b8962d] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {guardando ? 'Guardando...' : 'Agregar etapa'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgregarEtapaModal;

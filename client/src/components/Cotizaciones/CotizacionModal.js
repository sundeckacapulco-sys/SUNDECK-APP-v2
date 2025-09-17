import React, { useState } from 'react';
import axiosConfig from '../../config/axios';

const CotizacionModal = ({ open, onClose, cotizacion, onConvertirPedido }) => {
  const [convirtiendoPedido, setConvirtiendoPedido] = useState(false);
  const [errorLocal, setErrorLocal] = useState('');

  const handleConvertirPedido = async () => {
    if (!cotizacion) return;

    setConvirtiendoPedido(true);
    setErrorLocal('');

    try {
      const payload = {
        direccionEntrega: {
          calle: cotizacion.prospecto?.direccion || '',
          ciudad: 'Acapulco, Guerrero'
        },
        contactoEntrega: {
          nombre: cotizacion.prospecto?.nombre || '',
          telefono: cotizacion.prospecto?.telefono || ''
        },
        anticipo: { porcentaje: 50 }
      };

      const { data } = await axiosConfig.post(`/pedidos/desde-cotizacion/${cotizacion._id}`, payload);
      
      onConvertirPedido?.(
        `¡Pedido ${data.pedido.numero} creado exitosamente! El prospecto se movió a "Pedidos".`,
        data.pedido
      );
      onClose();
    } catch (error) {
      console.error('Error convirtiendo cotización en pedido:', error);
      const mensaje = error.response?.data?.message || 'No se pudo convertir la cotización en pedido.';
      setErrorLocal(mensaje);
    } finally {
      setConvirtiendoPedido(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-MX');
  };

  if (!open || !cotizacion) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-blue-50">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Cotización {cotizacion.numero}
            </h2>
            <p className="text-sm text-gray-600">
              Cliente: {cotizacion.prospecto?.nombre} | 
              Estado: <span className={`px-2 py-1 rounded text-xs ${
                cotizacion.estado === 'aprobada' ? 'bg-green-100 text-green-800' :
                cotizacion.estado === 'enviada' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {cotizacion.estado}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Información General */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">Información General</h3>
              <div className="space-y-2 text-sm">
                <div><span className="text-gray-600">Fecha:</span> {formatDate(cotizacion.fecha)}</div>
                <div><span className="text-gray-600">Válido hasta:</span> {formatDate(cotizacion.validoHasta)}</div>
                <div><span className="text-gray-600">Tiempo fabricación:</span> {cotizacion.tiempoFabricacion} días</div>
                <div><span className="text-gray-600">Tiempo instalación:</span> {cotizacion.tiempoInstalacion} días</div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">Totales</h3>
              <div className="space-y-2 text-sm">
                <div><span className="text-gray-600">Subtotal:</span> {formatCurrency(cotizacion.subtotal)}</div>
                <div><span className="text-gray-600">IVA:</span> {formatCurrency(cotizacion.iva)}</div>
                <div className="text-lg font-semibold text-green-700">
                  <span className="text-gray-600">Total:</span> {formatCurrency(cotizacion.total)}
                </div>
              </div>
            </div>
          </div>

          {/* Productos */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Productos Cotizados</h3>
            <div className="space-y-3">
              {cotizacion.productos?.map((producto, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{producto.nombre}</h4>
                      <p className="text-sm text-gray-600">{producto.descripcion}</p>
                      <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Medidas:</span>
                          <p>{producto.medidas?.ancho}m × {producto.medidas?.alto}m</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Área:</span>
                          <p>{producto.medidas?.area?.toFixed(2)} m²</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Material:</span>
                          <p>{producto.material}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Color:</span>
                          <p>{producto.color}</p>
                        </div>
                      </div>
                      {producto.requiereR24 && (
                        <div className="mt-2">
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                            Requiere refuerzo R24
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">
                        {formatCurrency(producto.subtotal)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {producto.cantidad} × {formatCurrency(producto.precioUnitario)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mediciones */}
          {cotizacion.mediciones?.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Mediciones Realizadas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cotizacion.mediciones.map((medicion, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-gray-900">{medicion.ambiente}</h4>
                    <p className="text-sm text-gray-600">
                      {medicion.ancho}m × {medicion.alto}m = {medicion.area?.toFixed(2)} m²
                    </p>
                    {medicion.notas && (
                      <p className="text-sm text-gray-500 mt-1">{medicion.notas}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Forma de Pago */}
          {cotizacion.formaPago && (
            <div className="mb-6 bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">Condiciones de Pago</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Anticipo:</span>
                  <p className="font-medium">
                    {cotizacion.formaPago.anticipo?.porcentaje}% - {formatCurrency(cotizacion.formaPago.anticipo?.monto)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Saldo:</span>
                  <p className="font-medium">
                    {cotizacion.formaPago.saldo?.porcentaje}% - {formatCurrency(cotizacion.formaPago.saldo?.monto)}
                    <br />
                    <span className="text-xs text-gray-500">{cotizacion.formaPago.saldo?.condiciones}</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {errorLocal && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{errorLocal}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cerrar
          </button>
          
          <div className="flex gap-3">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              onClick={() => window.open(`/api/cotizaciones/${cotizacion._id}/pdf`, '_blank')}
            >
              📄 Descargar PDF
            </button>
            
            {cotizacion.estado === 'aprobada' && (
              <button
                onClick={handleConvertirPedido}
                disabled={convirtiendoPedido}
                className="inline-flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                <span>📦</span>
                {convirtiendoPedido ? 'Convirtiendo...' : 'Convertir en Pedido'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CotizacionModal;

import { useState, useCallback, useRef } from 'react';
import axiosConfig from '../../../config/axios';

const DEFAULT_ENDPOINT = '/alertas/inteligentes';
const parseResponse = (response) => response?.data?.data || response?.data || response;

export const useAlertasInteligentes = (initialParams = {}) => {
  const { endpoint = DEFAULT_ENDPOINT, ...restParams } = initialParams;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Mantener los parámetros iniciales estables entre renders para evitar
  // que cambiar la identidad del objeto dispare efectos en cascada.
  const initialParamsRef = useRef(restParams);
  const endpointRef = useRef(endpoint);

  const cargarAlertas = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const { endpoint: endpointOverride, ...rest } = params || {};
      const endpointActual = endpointOverride || endpointRef.current;

      const response = await axiosConfig.get(endpointActual, {
        params: { ...initialParamsRef.current, ...rest }
      });

      const parsed = parseResponse(response);
      setData(parsed);
      return parsed;
    } catch (err) {
      const mensaje = err.response?.data?.message || 'Error al obtener alertas inteligentes';
      setError(mensaje);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    data,
    loading,
    error,
    cargarAlertas
  };
};

export default useAlertasInteligentes;

import { useState, useCallback } from 'react';
import axiosConfig from '../../../config/axios';

const parseResponse = (response) => response?.data?.data || response?.data || response;

export const useAlertasInteligentes = (initialParams = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cargarAlertas = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axiosConfig.get('/alertas/inteligentes', {
        params: { ...initialParams, ...params }
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
  }, [initialParams]);

  return {
    data,
    loading,
    error,
    cargarAlertas
  };
};

export default useAlertasInteligentes;

import { useState, useCallback, useRef } from 'react';
import axiosConfig from '../../../config/axios';

const parseResponse = (response) => response?.data?.data || response?.data || response;

export const useAlertasInteligentes = (initialParams = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Mantener los parámetros iniciales estables entre renders para evitar
  // que cambiar la identidad del objeto dispare efectos en cascada.
  const initialParamsRef = useRef(initialParams);

  const cargarAlertas = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axiosConfig.get('/alertas/inteligentes', {
        params: { ...initialParamsRef.current, ...params }
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

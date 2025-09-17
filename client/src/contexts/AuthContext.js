import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosConfig from '../config/axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Configurar token inicial
  useEffect(() => {
    const token = localStorage.getItem('token');
    setToken(token);
  }, []);

  // Verificar token al cargar la aplicación
  useEffect(() => {
    const verificarToken = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Configurar el token en axios antes de hacer la petición
          axiosConfig.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          const response = await axiosConfig.get('/auth/verificar');
          setUser(response.data.usuario);
          setToken(token);
        } catch (error) {
          localStorage.removeItem('token');
          delete axiosConfig.defaults.headers.common['Authorization'];
          // Token inválido, se eliminó del localStorage
        }
      }
      setLoading(false);
    };

    verificarToken();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axiosConfig.post('/auth/login', {
        email,
        password,
      });

      const { token, usuario } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(usuario));
      
      setUser(usuario);
      setToken(token);
      
      // Configurar el token en axios para futuras peticiones
      axiosConfig.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      return { success: true };
    } catch (error) {
      console.error('Error en login:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error al iniciar sesión' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    
    // Limpiar el token de axios
    delete axiosConfig.defaults.headers.common['Authorization'];
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await axiosConfig.put('/auth/perfil', profileData);
      setUser(response.data.usuario);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error actualizando perfil'
      };
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

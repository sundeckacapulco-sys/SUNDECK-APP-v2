import React, { useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import DashboardEjecutivo from './DashboardEjecutivo';
import DashboardVentas from './DashboardVentas';
import DashboardTaller from './DashboardTaller';
import DashboardInstalaciones from './DashboardInstalaciones';
import { Box, Alert, CircularProgress } from '@mui/material';

const DashboardRouter = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Alert severity="error">
        No se pudo cargar la información del usuario
      </Alert>
    );
  }

  // Enrutamiento por rol
  switch (user.rol) {
    case 'admin':
    case 'gerente':
      return <DashboardEjecutivo />;
    
    case 'vendedor':
      return <DashboardVentas />;
    
    case 'fabricante':
      return <DashboardTaller />;
    
    case 'instalador':
      return <DashboardInstalaciones />;
    
    case 'coordinador':
      // Los coordinadores pueden ver una vista combinada o ejecutiva simplificada
      return <DashboardEjecutivo />;
    
    default:
      return (
        <Alert severity="warning">
          Rol no reconocido: {user.rol}. Contacta al administrador.
        </Alert>
      );
  }
};

export default DashboardRouter;

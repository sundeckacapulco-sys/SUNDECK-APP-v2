import React, { useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
// El DashboardEjecutivo se ha unificado en Dashboard.js
import Dashboard from '../Dashboard/Dashboard';
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

  // Enrutamiento por rol. Todos los roles de gestión ahora apuntan al dashboard unificado.
  switch (user.rol) {
    case 'admin':
    case 'gerente':
    case 'coordinador':
      return <Dashboard />;
    
    case 'vendedor':
      return <DashboardVentas />;
    
    case 'fabricante':
      return <DashboardTaller />;
    
    case 'instalador':
      return <DashboardInstalaciones />;
    
    default:
      // Como fallback seguro, cualquier otro rol ve el dashboard principal
      return <Dashboard />;
  }
};

export default DashboardRouter;
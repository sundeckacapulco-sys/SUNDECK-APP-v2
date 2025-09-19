import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './components/Auth/Login';
import Dashboard from './components/Dashboard/Dashboard';
import ProspectosList from './components/Prospectos/ProspectosList';
import ProspectoForm from './components/Prospectos/ProspectoForm';
import ProspectoDetalle from './components/Prospectos/ProspectoDetalle';
import KanbanBoard from './components/Kanban/KanbanBoard';
import CotizacionesList from './components/Cotizaciones/CotizacionesList';
import CotizacionForm from './components/Cotizaciones/CotizacionForm';
import CotizacionDirecta from './components/Cotizaciones/CotizacionDirecta';
import CatalogoProductos from './components/Productos/CatalogoProductos';
import LoadingSpinner from './components/Common/LoadingSpinner';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Layout>
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Prospectos */}
          <Route path="/prospectos" element={<ProspectosList />} />
          <Route path="/prospectos/nuevo" element={<ProspectoForm />} />
          <Route path="/prospectos/:id" element={<ProspectoDetalle />} />
          <Route path="/prospectos/:id/editar" element={<ProspectoForm />} />
          
          {/* Kanban */}
          <Route path="/kanban" element={<KanbanBoard />} />
          
          {/* Cotizaciones */}
          <Route path="/cotizaciones" element={<CotizacionesList />} />
          <Route path="/cotizaciones/nueva" element={<CotizacionForm />} />
          <Route path="/cotizaciones/directa" element={<CotizacionDirecta />} />
          <Route path="/cotizaciones/:id" element={<CotizacionForm />} />
          
          {/* Productos */}
          <Route path="/productos" element={<CatalogoProductos />} />
          
          {/* Rutas futuras */}
          <Route path="/pedidos" element={<div>Módulo de Pedidos (En desarrollo)</div>} />
          <Route path="/fabricacion" element={<div>Módulo de Fabricación (En desarrollo)</div>} />
          <Route path="/instalaciones" element={<div>Módulo de Instalaciones (En desarrollo)</div>} />
          <Route path="/postventa" element={<div>Módulo de Postventa (En desarrollo)</div>} />
          <Route path="/reportes" element={<div>Módulo de Reportes (En desarrollo)</div>} />
          
          {/* 404 */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Box>
    </Layout>
  );
}

export default App;

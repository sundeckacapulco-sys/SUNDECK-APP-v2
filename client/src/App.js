import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './components/Auth/Login';
import Dashboard from './components/Dashboard/Dashboard';
import CatalogoProductos from './components/Productos/CatalogoProductos';
import PlantillasWhatsAppAdmin from './components/Admin/PlantillasWhatsAppAdmin';
import DashboardKPIs from './components/KPIs/DashboardKPIs';
import DashboardFabricacion from './components/Fabricacion/DashboardFabricacion.jsx';
import DashboardInstalaciones from './components/Dashboards/DashboardInstalaciones';
import LoadingSpinner from './components/Common/LoadingSpinner';
// Sistema Unificado - Único flujo de trabajo
import ProyectosList from './modules/proyectos/ProyectosList';
import ProyectoDetail from './modules/proyectos/ProyectoDetail';
import ProyectoForm from './modules/proyectos/ProyectoForm';
// Módulo de Instalaciones - Área específica
import InstalacionesList from './modules/instalaciones/InstalacionesList';
import InstalacionDetail from './modules/instalaciones/InstalacionDetail';
import ProgramarInstalacion from './modules/instalaciones/ProgramarInstalacion';
import CalendarioInstalaciones from './modules/instalaciones/CalendarioInstalaciones';

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
          <Route path="/" element={<Navigate to="/proyectos" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* SISTEMA UNIFICADO - Flujo único de proyectos */}
          <Route path="/proyectos" element={<ProyectosList />} />
          <Route path="/proyectos/nuevo" element={<ProyectoForm />} />
          <Route path="/proyectos/:id" element={<ProyectoDetail />} />
          <Route path="/proyectos/:id/editar" element={<ProyectoForm />} />
          
          {/* MÓDULO INSTALACIONES - Área específica */}
          <Route path="/instalaciones" element={<InstalacionesList />} />
          <Route path="/instalaciones/:id" element={<InstalacionDetail />} />
          <Route path="/instalaciones/programar" element={<ProgramarInstalacion />} />
          <Route path="/instalaciones/calendario" element={<CalendarioInstalaciones />} />
          
          {/* Módulos auxiliares */}
          <Route path="/productos" element={<CatalogoProductos />} />
          <Route path="/kpis" element={<DashboardKPIs />} />
          <Route path="/fabricacion" element={<DashboardFabricacion />} />
          <Route path="/admin/plantillas-whatsapp" element={<PlantillasWhatsAppAdmin />} />
          
          {/* Redirecciones del sistema anterior */}
          <Route path="/prospectos" element={<Navigate to="/proyectos" replace />} />
          <Route path="/prospectos/*" element={<Navigate to="/proyectos" replace />} />
          <Route path="/cotizaciones" element={<Navigate to="/proyectos" replace />} />
          <Route path="/cotizaciones/*" element={<Navigate to="/proyectos" replace />} />
          <Route path="/pedidos" element={<Navigate to="/proyectos" replace />} />
          <Route path="/pedidos/*" element={<Navigate to="/proyectos" replace />} />
          <Route path="/kanban" element={<Navigate to="/proyectos" replace />} />
          
          {/* 404 */}
          <Route path="*" element={<Navigate to="/proyectos" replace />} />
        </Routes>
      </Box>
    </Layout>
  );
}

export default App;

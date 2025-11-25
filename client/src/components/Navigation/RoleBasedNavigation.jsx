import React, { useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Box
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Build as BuildIcon,
  Home as HomeIcon,
  AttachMoney as MoneyIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  WhatsApp as WhatsAppIcon,
  Inventory as InventoryIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const RoleBasedNavigation = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const getMenuItems = () => {
    const commonItems = [
      {
        text: 'Dashboard',
        icon: <DashboardIcon />,
        path: '/dashboard',
        roles: ['admin', 'gerente', 'vendedor', 'fabricante', 'instalador', 'coordinador']
      }
    ];

    const roleSpecificItems = {
      admin: [
        { text: 'Prospectos', icon: <PeopleIcon />, path: '/prospectos' },
        { text: 'Cotizaciones', icon: <AssignmentIcon />, path: '/cotizaciones' },
        { text: 'Proyectos Unificados', icon: <AssignmentIcon />, path: '/proyectos-unificados' },
        { text: 'Fabricación', icon: <BuildIcon />, path: '/fabricacion' },
        { text: 'Instalaciones', icon: <HomeIcon />, path: '/instalaciones' },
        { text: 'Reportes', icon: <AssessmentIcon />, path: '/reportes' },
        { text: 'Usuarios', icon: <SettingsIcon />, path: '/usuarios' },
        { text: 'WhatsApp', icon: <WhatsAppIcon />, path: '/whatsapp' }
      ],
      gerente: [
        { text: 'Prospectos', icon: <PeopleIcon />, path: '/prospectos' },
        { text: 'Cotizaciones', icon: <AssignmentIcon />, path: '/cotizaciones' },
        { text: 'Proyectos Unificados', icon: <AssignmentIcon />, path: '/proyectos-unificados' },
        { text: 'Fabricación', icon: <BuildIcon />, path: '/fabricacion' },
        { text: 'Instalaciones', icon: <HomeIcon />, path: '/instalaciones' },
        { text: 'Reportes', icon: <AssessmentIcon />, path: '/reportes' },
        { text: 'WhatsApp', icon: <WhatsAppIcon />, path: '/whatsapp' }
      ],
      vendedor: [
        { text: 'Mis Prospectos', icon: <PeopleIcon />, path: '/prospectos' },
        { text: 'Mis Cotizaciones', icon: <AssignmentIcon />, path: '/cotizaciones' },
        { text: 'Mis Proyectos', icon: <AssignmentIcon />, path: '/proyectos-unificados' },
        { text: 'WhatsApp', icon: <WhatsAppIcon />, path: '/whatsapp' }
      ],
      fabricante: [
        { text: 'Órdenes de Trabajo', icon: <BuildIcon />, path: '/fabricacion' },
        { text: 'Mis Proyectos', icon: <AssignmentIcon />, path: '/proyectos-unificados' }
      ],
      instalador: [
        { text: 'Instalaciones', icon: <HomeIcon />, path: '/instalaciones' },
        { text: 'Mis Proyectos', icon: <AssignmentIcon />, path: '/proyectos-unificados' }
      ],
      coordinador: [
        { text: 'Prospectos', icon: <PeopleIcon />, path: '/prospectos' },
        { text: 'Proyectos Activos', icon: <AssignmentIcon />, path: '/proyectos-unificados' },
        { text: 'Fabricación', icon: <BuildIcon />, path: '/fabricacion' },
        { text: 'Instalaciones', icon: <HomeIcon />, path: '/instalaciones' },
        { text: 'Reportes', icon: <AssessmentIcon />, path: '/reportes' }
      ]
    };

    return [
      ...commonItems,
      ...roleSpecificItems[user.rol] || []
    ];
  };

  const menuItems = getMenuItems();

  const handleNavigation = (path) => {
    navigate(path);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const getRoleDisplayName = (rol) => {
    const roles = {
      admin: 'Administrador',
      gerente: 'Gerente',
      vendedor: 'Vendedor',
      fabricante: 'Taller',
      instalador: 'Instalaciones',
      coordinador: 'Coordinador'
    };
    return roles[rol] || rol;
  };

  return (
    <Box>
      {/* Header del usuario */}
      <Box sx={{ p: 2, bgcolor: '#f5f5f5' }}>
        <Typography variant="subtitle2" fontWeight="bold">
          {user.nombre} {user.apellido}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {getRoleDisplayName(user.rol)}
        </Typography>
      </Box>
      
      <Divider />
      
      {/* Menú de navegación */}
      <List>
        {menuItems.map((item, index) => (
          <ListItem
            key={index}
            button
            onClick={() => handleNavigation(item.path)}
            selected={isActive(item.path)}
            sx={{
              '&.Mui-selected': {
                bgcolor: '#e3f2fd',
                borderRight: '3px solid #1976d2'
              },
              '&:hover': {
                bgcolor: '#f5f5f5'
              }
            }}
          >
            <ListItemIcon sx={{ color: isActive(item.path) ? '#1976d2' : 'inherit' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text}
              sx={{ 
                '& .MuiListItemText-primary': {
                  fontWeight: isActive(item.path) ? 'bold' : 'normal',
                  color: isActive(item.path) ? '#1976d2' : 'inherit'
                }
              }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default RoleBasedNavigation;
